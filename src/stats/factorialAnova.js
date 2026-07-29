import { centralFCDF } from '../power/fMath.js';

const NUMERIC_TOLERANCE = 1e-10;
const INTERCEPT_TERM = 'intercept';
const FACTOR_A_TERM = 'A';
const FACTOR_B_TERM = 'B';
const INTERACTION_TERM = 'AxB';
const FULL_MODEL_TERMS = [INTERCEPT_TERM, FACTOR_A_TERM, FACTOR_B_TERM, INTERACTION_TERM];

const parseFiniteNumber = (value) => {
    if (typeof value === 'number') {
        return Number.isFinite(value) ? value : null;
    }

    if (typeof value !== 'string' || !value.trim()) {
        return null;
    }

    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : null;
};

const median = (values) => {
    const sorted = [...values].sort((left, right) => left - right);
    const midpoint = Math.floor(sorted.length / 2);

    return sorted.length % 2 === 0
        ? (sorted[midpoint - 1] + sorted[midpoint]) / 2
        : sorted[midpoint];
};

const upperTailFProbability = (statistic, numeratorDf, denominatorDf) => {
    if (!(numeratorDf > 0) || !(denominatorDf > 0)) {
        return NaN;
    }

    if (statistic === Number.POSITIVE_INFINITY) {
        return 0;
    }

    if (!(statistic > 0)) {
        return 1;
    }

    const probability = 1 - centralFCDF(statistic, numeratorDf, denominatorDf);
    return Math.max(0, Math.min(1, probability));
};

export const calculateBrownForsythe = (groups = []) => {
    const samples = groups
        .map((group) => group.map(parseFiniteNumber).filter((value) => value !== null))
        .filter((group) => group.length > 0);
    const groupCount = samples.length;
    const totalN = samples.reduce((sum, group) => sum + group.length, 0);
    const df1 = groupCount - 1;
    const df2 = totalN - groupCount;

    if (groupCount < 2 || df2 <= 0) {
        return {
            available: false,
            reason: 'insufficient_raw_data',
            message: 'Brown–Forsythe requires at least two groups and residual degrees of freedom.',
        };
    }

    const deviations = samples.map((group) => {
        const center = median(group);
        return group.map((value) => Math.abs(value - center));
    });
    const groupMeans = deviations.map(
        (group) => group.reduce((sum, value) => sum + value, 0) / group.length
    );
    const grandMean = deviations.reduce(
        (sum, group) => sum + group.reduce((groupSum, value) => groupSum + value, 0),
        0
    ) / totalN;
    const ssBetween = deviations.reduce(
        (sum, group, index) => sum + (group.length * ((groupMeans[index] - grandMean) ** 2)),
        0
    );
    const ssWithin = deviations.reduce(
        (sum, group, index) => sum + group.reduce(
            (groupSum, value) => groupSum + ((value - groupMeans[index]) ** 2),
            0
        ),
        0
    );
    const msBetween = ssBetween / df1;
    const msWithin = ssWithin / df2;
    const statistic = msWithin > NUMERIC_TOLERANCE
        ? msBetween / msWithin
        : (msBetween > NUMERIC_TOLERANCE ? Number.POSITIVE_INFINITY : 0);

    return {
        available: true,
        method: 'Brown–Forsythe',
        center: 'median',
        f: statistic,
        p: upperTailFProbability(statistic, df1, df2),
        df1,
        df2,
        ssBetween,
        ssWithin,
    };
};

const effectCode = (levelIndex, levelCount) => {
    if (levelIndex === levelCount - 1) {
        return Array(levelCount - 1).fill(-1);
    }

    return Array.from({ length: levelCount - 1 }, (_, index) => (
        index === levelIndex ? 1 : 0
    ));
};

const buildDesignRow = (cell, terms, factorACount, factorBCount) => {
    const aCode = effectCode(cell.aIndex, factorACount);
    const bCode = effectCode(cell.bIndex, factorBCount);
    const row = [];

    if (terms.includes(INTERCEPT_TERM)) {
        row.push(1);
    }

    if (terms.includes(FACTOR_A_TERM)) {
        row.push(...aCode);
    }

    if (terms.includes(FACTOR_B_TERM)) {
        row.push(...bCode);
    }

    if (terms.includes(INTERACTION_TERM)) {
        aCode.forEach((aValue) => {
            bCode.forEach((bValue) => row.push(aValue * bValue));
        });
    }

    return row;
};

const solveLinearSystem = (matrix, vector) => {
    const size = matrix.length;
    const augmented = matrix.map((row, index) => [...row, vector[index]]);
    const scale = Math.max(1, ...matrix.flat().map(Math.abs));
    const tolerance = NUMERIC_TOLERANCE * scale;

    for (let column = 0; column < size; column += 1) {
        let pivotRow = column;

        for (let row = column + 1; row < size; row += 1) {
            if (Math.abs(augmented[row][column]) > Math.abs(augmented[pivotRow][column])) {
                pivotRow = row;
            }
        }

        if (Math.abs(augmented[pivotRow][column]) <= tolerance) {
            return null;
        }

        [augmented[column], augmented[pivotRow]] = [augmented[pivotRow], augmented[column]];
        const pivot = augmented[column][column];

        for (let index = column; index <= size; index += 1) {
            augmented[column][index] /= pivot;
        }

        for (let row = 0; row < size; row += 1) {
            if (row === column) {
                continue;
            }

            const multiplier = augmented[row][column];

            for (let index = column; index <= size; index += 1) {
                augmented[row][index] -= multiplier * augmented[column][index];
            }
        }
    }

    return augmented.map((row) => row[size]);
};

const fitCellMeanModel = ({ cells, terms, factorACount, factorBCount, withinSS }) => {
    const designRows = cells.map((cell) => buildDesignRow(cell, terms, factorACount, factorBCount));
    const parameterCount = designRows[0].length;
    const crossProduct = Array.from(
        { length: parameterCount },
        () => Array(parameterCount).fill(0)
    );
    const responseProduct = Array(parameterCount).fill(0);

    cells.forEach((cell, rowIndex) => {
        const row = designRows[rowIndex];

        for (let left = 0; left < parameterCount; left += 1) {
            responseProduct[left] += cell.n * row[left] * cell.mean;

            for (let right = 0; right < parameterCount; right += 1) {
                crossProduct[left][right] += cell.n * row[left] * row[right];
            }
        }
    });

    const coefficients = solveLinearSystem(crossProduct, responseProduct);

    if (!coefficients) {
        return null;
    }

    const lackOfFitSS = cells.reduce((sum, cell, rowIndex) => {
        const fittedMean = designRows[rowIndex].reduce(
            (fitted, value, index) => fitted + (value * coefficients[index]),
            0
        );
        return sum + (cell.n * ((cell.mean - fittedMean) ** 2));
    }, 0);

    return {
        coefficients,
        rank: parameterCount,
        sse: withinSS + lackOfFitSS,
    };
};

const createEffectResult = ({ ss, df, msError, dfError, label }) => {
    const safeSS = Math.max(0, Math.abs(ss) < NUMERIC_TOLERANCE ? 0 : ss);
    const ms = df > 0 ? safeSS / df : NaN;
    const f = msError > NUMERIC_TOLERANCE
        ? ms / msError
        : (ms > NUMERIC_TOLERANCE ? Number.POSITIVE_INFINITY : 0);
    const denominator = safeSS + msError * dfError;

    return {
        ss: safeSS,
        df,
        ms,
        f,
        p: upperTailFProbability(f, df, dfError),
        pes: denominator > 0 ? safeSS / denominator : 0,
        label,
    };
};

const parseCells = (factorA, factorB, cellData) => {
    const cells = [];
    const cellStats = {};
    const residuals = [];
    const rawGroups = [];
    let allCellsUseRawData = true;

    for (let aIndex = 0; aIndex < factorA.levels.length; aIndex += 1) {
        const aLevel = factorA.levels[aIndex];

        for (let bIndex = 0; bIndex < factorB.levels.length; bIndex += 1) {
            const bLevel = factorB.levels[bIndex];
            const key = `${aLevel.id}_${bLevel.id}`;
            const input = cellData[key];
            const inputMode = input?.inputMode === 'summary' ? 'summary' : 'raw';
            let n;
            let mean;
            let ss;

            if (inputMode === 'summary') {
                allCellsUseRawData = false;
                n = parseFiniteNumber(input?.summary?.n);
                mean = parseFiniteNumber(input?.summary?.mean);
                const sd = parseFiniteNumber(input?.summary?.sd);

                if (!Number.isInteger(n) || n < 1 || mean === null || sd === null || sd < 0) {
                    return null;
                }

                ss = n > 1 ? (n - 1) * (sd ** 2) : 0;
            } else {
                const values = (input?.values || [])
                    .map(parseFiniteNumber)
                    .filter((value) => value !== null);
                n = values.length;

                if (n < 1) {
                    return null;
                }

                mean = values.reduce((sum, value) => sum + value, 0) / n;
                ss = values.reduce((sum, value) => sum + ((value - mean) ** 2), 0);
                values.forEach((value) => residuals.push(value - mean));
                rawGroups.push(values);
            }

            const stats = { n, mean, ss };
            cellStats[key] = stats;
            cells.push({ key, aIndex, bIndex, n, mean, ss });
        }
    }

    return {
        cells,
        cellStats,
        residuals,
        rawGroups,
        allCellsUseRawData,
    };
};

export const calculateFactorialAnova = (factorA, factorB, cellData, ssType = 'III') => {
    const aLevels = factorA?.levels || [];
    const bLevels = factorB?.levels || [];

    if (aLevels.length < 2 || bLevels.length < 2 || !cellData) {
        return null;
    }

    const parsed = parseCells(factorA, factorB, cellData);

    if (!parsed) {
        return null;
    }

    const { cells, cellStats, residuals, rawGroups, allCellsUseRawData } = parsed;
    const totalN = cells.reduce((sum, cell) => sum + cell.n, 0);
    const withinSS = cells.reduce((sum, cell) => sum + cell.ss, 0);
    const fullModel = fitCellMeanModel({
        cells,
        terms: FULL_MODEL_TERMS,
        factorACount: aLevels.length,
        factorBCount: bLevels.length,
        withinSS,
    });

    if (!fullModel || totalN <= fullModel.rank) {
        return null;
    }

    const resolvedSSType = ssType === 'I' ? 'I' : 'III';
    const effectModels = {};

    if (resolvedSSType === 'I') {
        const interceptModel = fitCellMeanModel({
            cells,
            terms: [INTERCEPT_TERM],
            factorACount: aLevels.length,
            factorBCount: bLevels.length,
            withinSS,
        });
        const factorAModel = fitCellMeanModel({
            cells,
            terms: [INTERCEPT_TERM, FACTOR_A_TERM],
            factorACount: aLevels.length,
            factorBCount: bLevels.length,
            withinSS,
        });
        const additiveModel = fitCellMeanModel({
            cells,
            terms: [INTERCEPT_TERM, FACTOR_A_TERM, FACTOR_B_TERM],
            factorACount: aLevels.length,
            factorBCount: bLevels.length,
            withinSS,
        });

        if (!interceptModel || !factorAModel || !additiveModel) {
            return null;
        }

        effectModels.A = { reduced: interceptModel, full: factorAModel };
        effectModels.B = { reduced: factorAModel, full: additiveModel };
        effectModels.AxB = { reduced: additiveModel, full: fullModel };
    } else {
        const reducedTerms = {
            A: [INTERCEPT_TERM, FACTOR_B_TERM, INTERACTION_TERM],
            B: [INTERCEPT_TERM, FACTOR_A_TERM, INTERACTION_TERM],
            AxB: [INTERCEPT_TERM, FACTOR_A_TERM, FACTOR_B_TERM],
        };

        for (const [effect, terms] of Object.entries(reducedTerms)) {
            const reducedModel = fitCellMeanModel({
                cells,
                terms,
                factorACount: aLevels.length,
                factorBCount: bLevels.length,
                withinSS,
            });

            if (!reducedModel) {
                return null;
            }

            effectModels[effect] = { reduced: reducedModel, full: fullModel };
        }
    }

    const dfError = totalN - fullModel.rank;
    const msError = withinSS / dfError;
    const grandMean = cells.reduce((sum, cell) => sum + (cell.n * cell.mean), 0) / totalN;
    const ssTotal = cells.reduce(
        (sum, cell) => sum + cell.ss + (cell.n * ((cell.mean - grandMean) ** 2)),
        0
    );
    const createModelEffect = (effect, label) => {
        const models = effectModels[effect];
        return createEffectResult({
            ss: models.reduced.sse - models.full.sse,
            df: models.full.rank - models.reduced.rank,
            msError,
            dfError,
            label,
        });
    };
    const cellSizes = cells.map((cell) => cell.n);
    const isBalanced = cellSizes.every((size) => size === cellSizes[0]);

    return {
        totalN,
        GM: grandMean,
        ssType: resolvedSSType,
        isBalanced,
        model: {
            kind: 'two_way_between_subjects',
            contrasts: 'sum_to_zero',
            termOrder: resolvedSSType === 'I' ? ['A', 'B', 'AxB'] : null,
        },
        residuals,
        levene: allCellsUseRawData
            ? calculateBrownForsythe(rawGroups)
            : {
                available: false,
                reason: 'raw_data_required',
                message: 'Brown–Forsythe requires raw observations in every cell; summary statistics cannot produce this diagnostic.',
            },
        effects: {
            A: createModelEffect('A', factorA.label),
            B: createModelEffect('B', factorB.label),
            AxB: createModelEffect('AxB', `${factorA.label} × ${factorB.label}`),
            Error: { ss: withinSS, df: dfError, ms: msError },
            Total: { ss: ssTotal, df: totalN - 1 },
        },
        cellStats,
        aLevels,
        bLevels,
        marginalA: aLevels.map((level, aIndex) => ({
            label: level.label,
            mean: cells
                .filter((cell) => cell.aIndex === aIndex)
                .reduce((sum, cell) => sum + cell.mean, 0) / bLevels.length,
        })),
        marginalB: bLevels.map((level, bIndex) => ({
            label: level.label,
            mean: cells
                .filter((cell) => cell.bIndex === bIndex)
                .reduce((sum, cell) => sum + cell.mean, 0) / aLevels.length,
        })),
    };
};
