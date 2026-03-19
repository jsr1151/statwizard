import { centralFCDF } from '../power/fMath.js';
import { studentTCDF, studentTCriticalValue } from '../power/tMath.js';

const EPSILON = 1e-12;
const DEFAULT_CONFIDENCE_LEVEL = 0.95;

const roundTo = (value, decimals = 4) => {
    const factor = 10 ** decimals;
    return Math.round(Number(value) * factor) / factor;
};

const clampToRange = (value, min, max) => Math.max(min, Math.min(max, value));

const hashSeedParts = (...parts) => {
    const text = parts.map((part) => `${part}`).join('|');
    let hash = 2166136261;

    for (let index = 0; index < text.length; index += 1) {
        hash ^= text.charCodeAt(index);
        hash = Math.imul(hash, 16777619);
    }

    return hash >>> 0;
};

const createSeededRandom = (seed) => {
    let state = seed >>> 0;

    return () => {
        state = (state + 0x6D2B79F5) | 0;
        let value = Math.imul(state ^ (state >>> 15), 1 | state);
        value ^= value + Math.imul(value ^ (value >>> 7), 61 | value);
        return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
    };
};

const sampleStandardNormal = (random) => {
    const u1 = Math.max(random(), 1e-12);
    const u2 = random();
    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
};

const summarizeSeries = (values) => {
    const count = values.length;

    if (!count) {
        return null;
    }

    const mean = values.reduce((sum, value) => sum + value, 0) / count;
    const deviations = values.map((value) => value - mean);
    const sumSquares = deviations.reduce((sum, value) => sum + (value ** 2), 0);
    const sampleVariance = count > 1 ? sumSquares / (count - 1) : 0;

    return {
        count,
        mean,
        sampleVariance,
        sampleSD: Math.sqrt(Math.max(0, sampleVariance)),
        min: Math.min(...values),
        max: Math.max(...values),
        range: Math.max(...values) - Math.min(...values),
        uniqueCount: new Set(values.map((value) => roundTo(value, 8))).size,
    };
};

const pearsonCorrelation = (xValues = [], yValues = []) => {
    if (xValues.length !== yValues.length || xValues.length < 2) {
        return 0;
    }

    const xSummary = summarizeSeries(xValues);
    const ySummary = summarizeSeries(yValues);

    if (!(xSummary?.sampleSD > EPSILON) || !(ySummary?.sampleSD > EPSILON)) {
        return 0;
    }

    let covariance = 0;

    for (let index = 0; index < xValues.length; index += 1) {
        covariance += (xValues[index] - xSummary.mean) * (yValues[index] - ySummary.mean);
    }

    return covariance / Math.max(EPSILON, Math.sqrt(
        xValues.reduce((sum, value) => sum + ((value - xSummary.mean) ** 2), 0) *
        yValues.reduce((sum, value) => sum + ((value - ySummary.mean) ** 2), 0)
    ));
};

const transpose = (matrix = []) => {
    if (!matrix.length) {
        return [];
    }

    return matrix[0].map((_, columnIndex) => matrix.map((row) => row[columnIndex]));
};

const multiplyMatrices = (left = [], right = []) => {
    if (!left.length || !right.length) {
        return [];
    }

    const rightTransposed = transpose(right);
    return left.map((row) => rightTransposed.map((column) => row.reduce(
        (sum, value, index) => sum + (value * column[index]),
        0
    )));
};

const multiplyMatrixVector = (matrix = [], vector = []) =>
    matrix.map((row) => row.reduce((sum, value, index) => sum + (value * vector[index]), 0));

const dotProduct = (left = [], right = []) =>
    left.reduce((sum, value, index) => sum + (value * right[index]), 0);

const invertMatrix = (matrix = []) => {
    const size = matrix.length;

    if (!size || matrix.some((row) => row.length !== size)) {
        return null;
    }

    const augmented = matrix.map((row, rowIndex) => [
        ...row.map((value) => Number(value)),
        ...Array.from({ length: size }, (_, columnIndex) => (rowIndex === columnIndex ? 1 : 0)),
    ]);

    for (let pivotIndex = 0; pivotIndex < size; pivotIndex += 1) {
        let pivotRow = pivotIndex;
        let pivotMagnitude = Math.abs(augmented[pivotIndex][pivotIndex]);

        for (let rowIndex = pivotIndex + 1; rowIndex < size; rowIndex += 1) {
            const candidateMagnitude = Math.abs(augmented[rowIndex][pivotIndex]);

            if (candidateMagnitude > pivotMagnitude) {
                pivotMagnitude = candidateMagnitude;
                pivotRow = rowIndex;
            }
        }

        if (!(pivotMagnitude > EPSILON)) {
            return null;
        }

        if (pivotRow !== pivotIndex) {
            const temporary = augmented[pivotIndex];
            augmented[pivotIndex] = augmented[pivotRow];
            augmented[pivotRow] = temporary;
        }

        const pivotValue = augmented[pivotIndex][pivotIndex];

        for (let columnIndex = 0; columnIndex < size * 2; columnIndex += 1) {
            augmented[pivotIndex][columnIndex] /= pivotValue;
        }

        for (let rowIndex = 0; rowIndex < size; rowIndex += 1) {
            if (rowIndex === pivotIndex) {
                continue;
            }

            const factor = augmented[rowIndex][pivotIndex];

            for (let columnIndex = 0; columnIndex < size * 2; columnIndex += 1) {
                augmented[rowIndex][columnIndex] -= factor * augmented[pivotIndex][columnIndex];
            }
        }
    }

    return augmented.map((row) => row.slice(size));
};

const normalizePredictorColumns = (predictorColumns = []) =>
    predictorColumns
        .map((column, index) => {
            if (Array.isArray(column)) {
                return {
                    name: `X${index + 1}`,
                    numericValues: column,
                };
            }

            return {
                name: String(column?.name ?? `X${index + 1}`),
                numericValues: Array.isArray(column?.numericValues) ? column.numericValues : [],
            };
        })
        .filter((column) => column.numericValues.length > 0);

const buildCompleteCases = ({ outcomeValues = [], predictorColumns = [] }) => {
    const normalizedPredictors = normalizePredictorColumns(predictorColumns);
    const rowCount = Math.max(
        outcomeValues.length,
        ...normalizedPredictors.map((column) => column.numericValues.length),
        0
    );

    return Array.from({ length: rowCount }, (_, index) => {
        const y = Number(outcomeValues[index]);
        const predictorValues = normalizedPredictors.map((column) => Number(column.numericValues[index]));

        if (!Number.isFinite(y) || predictorValues.some((value) => !Number.isFinite(value))) {
            return null;
        }

        return {
            id: index,
            index,
            y,
            predictorValues,
            predictors: Object.fromEntries(normalizedPredictors.map((column, predictorIndex) => [
                column.name,
                predictorValues[predictorIndex],
            ])),
        };
    }).filter(Boolean);
};

const calculateRSquaredFromModel = (outcomeValues = [], predictorMatrix = []) => {
    if (outcomeValues.length < 3) {
        return 0;
    }

    const designMatrix = outcomeValues.map((_, rowIndex) => [1, ...predictorMatrix[rowIndex]]);
    const xtx = multiplyMatrices(transpose(designMatrix), designMatrix);
    const xtxInverse = invertMatrix(xtx);

    if (!xtxInverse) {
        return 1;
    }

    const xty = multiplyMatrixVector(transpose(designMatrix), outcomeValues);
    const coefficients = multiplyMatrixVector(xtxInverse, xty);
    const fitted = designMatrix.map((row) => dotProduct(row, coefficients));
    const residualSS = outcomeValues.reduce((sum, value, rowIndex) => sum + ((value - fitted[rowIndex]) ** 2), 0);
    const meanY = outcomeValues.reduce((sum, value) => sum + value, 0) / outcomeValues.length;
    const totalSS = outcomeValues.reduce((sum, value) => sum + ((value - meanY) ** 2), 0);

    if (!(totalSS > EPSILON)) {
        return 0;
    }

    return clampToRange(1 - (residualSS / totalSS), 0, 0.999999);
};

const buildCoefficientInterpretation = ({
    coefficient,
    outcomeLabel = 'Y',
    predictorLabel = 'Predictor',
}) => {
    const estimate = Number(coefficient);

    if (!Number.isFinite(estimate)) {
        return 'Conditional slope interpretation is not available yet.';
    }

    const direction = estimate >= 0 ? 'increases' : 'decreases';
    return `Holding the other predictors constant, predicted ${outcomeLabel} ${direction} by about ${roundTo(Math.abs(estimate), 3)} units for each 1-unit increase in ${predictorLabel}.`;
};

export const buildMultipleRegressionInterpretation = (stats, outcomeLabel = 'Y') => {
    if (!stats?.ok) {
        return 'Multiple-regression interpretation is not available yet.';
    }

    const strongestPredictor = (stats.coefficients || [])
        .filter((coefficient) => coefficient.id !== 'intercept')
        .sort((left, right) => Math.abs(right.standardizedBeta || 0) - Math.abs(left.standardizedBeta || 0))[0];

    const fitShare = Math.round((stats.rSquared || 0) * 100);

    if (!strongestPredictor) {
        return `The model explains about ${fitShare}% of the variance in ${outcomeLabel}.`;
    }

    return `The model explains about ${fitShare}% of the variance in ${outcomeLabel}. Holding the other predictors constant, ${strongestPredictor.label} has the strongest partial slope in this fit.`;
};

const buildInfluenceSummary = ({
    pairs,
    cooksDistances,
    standardizedResiduals,
}) => {
    if (!pairs.length) {
        return {
            influentialIndex: null,
            maxCooksDistance: 0,
            maxAbsoluteStandardizedResidual: 0,
        };
    }

    const maxCook = Math.max(0, ...cooksDistances);
    const influentialIndex = cooksDistances.findIndex((value) => value === maxCook);
    const maxStdResidual = Math.max(0, ...standardizedResiduals.map((value) => Math.abs(value)));

    return {
        influentialIndex: influentialIndex >= 0 ? influentialIndex : null,
        maxCooksDistance: maxCook,
        maxAbsoluteStandardizedResidual: maxStdResidual,
        influentialPoint: influentialIndex >= 0 ? pairs[influentialIndex] : null,
    };
};

export const calculateMultipleRegressionStats = ({
    outcomeValues = [],
    predictorColumns = [],
    confidenceLevel = DEFAULT_CONFIDENCE_LEVEL,
    alpha,
}) => {
    const normalizedPredictors = normalizePredictorColumns(predictorColumns);

    if (normalizedPredictors.length < 2) {
        return {
            ok: false,
            errors: ['Select at least two quantitative predictors for the multiple-regression model.'],
            predictorCount: normalizedPredictors.length,
        };
    }

    const completeCases = buildCompleteCases({
        outcomeValues,
        predictorColumns: normalizedPredictors,
    });
    const predictorCount = normalizedPredictors.length;
    const n = completeCases.length;

    if (n < predictorCount + 2) {
        return {
            ok: false,
            errors: [`Multiple regression with ${predictorCount} predictors needs at least ${predictorCount + 2} complete cases.`],
            predictorCount,
            n,
        };
    }

    const yValues = completeCases.map((row) => row.y);
    const predictorMatrix = completeCases.map((row) => row.predictorValues);
    const ySummary = summarizeSeries(yValues);
    const predictorSummaries = normalizedPredictors.map((column, predictorIndex) => ({
        id: column.name,
        label: column.name,
        ...summarizeSeries(completeCases.map((row) => row.predictorValues[predictorIndex])),
    }));

    if (!(ySummary?.sampleSD > EPSILON)) {
        return {
            ok: false,
            errors: ['The outcome variable has almost no variance, so the regression model is not informative.'],
            predictorCount,
            n,
        };
    }

    if (predictorSummaries.some((summary) => !(summary?.sampleSD > EPSILON))) {
        return {
            ok: false,
            errors: ['At least one predictor has almost no variance, so the multiple-regression coefficients are not stable.'],
            predictorCount,
            n,
        };
    }

    const designMatrix = completeCases.map((row) => [1, ...row.predictorValues]);
    const xtx = multiplyMatrices(transpose(designMatrix), designMatrix);
    const xtxInverse = invertMatrix(xtx);

    if (!xtxInverse) {
        return {
            ok: false,
            errors: ['The predictor set is too collinear to estimate a stable model. Remove redundant predictors or choose variables with more independent information.'],
            predictorCount,
            n,
        };
    }

    const xty = multiplyMatrixVector(transpose(designMatrix), yValues);
    const betaVector = multiplyMatrixVector(xtxInverse, xty);
    const fittedValues = designMatrix.map((row) => dotProduct(row, betaVector));
    const residuals = yValues.map((value, index) => value - fittedValues[index]);
    const totalSS = yValues.reduce((sum, value) => sum + ((value - ySummary.mean) ** 2), 0);
    const residualSS = residuals.reduce((sum, value) => sum + (value ** 2), 0);
    const modelSS = Math.max(0, totalSS - residualSS);
    const rSquared = clampToRange(1 - (residualSS / Math.max(EPSILON, totalSS)), 0, 0.999999);
    const adjustedRSquared = 1 - (((1 - rSquared) * (n - 1)) / Math.max(1, n - predictorCount - 1));
    const dfModel = predictorCount;
    const dfError = Math.max(1, n - predictorCount - 1);
    const dfTotal = Math.max(1, n - 1);
    const mse = residualSS / Math.max(1, dfError);
    const rmse = Math.sqrt(Math.max(0, mse));
    const modelMS = modelSS / Math.max(1, dfModel);
    const modelF = modelMS / Math.max(EPSILON, mse);
    const resolvedAlpha = Number.isFinite(Number(alpha))
        ? Number(alpha)
        : (1 - Number(confidenceLevel || DEFAULT_CONFIDENCE_LEVEL));
    const tCritical = studentTCriticalValue({
        alpha: resolvedAlpha,
        tails: 2,
        df: dfError,
    });
    const modelPValue = 1 - centralFCDF(modelF, dfModel, dfError);

    const leverage = designMatrix.map((row) => dotProduct(row, multiplyMatrixVector(xtxInverse, row)));
    const standardizedResiduals = residuals.map((residual, index) => (
        residual / Math.max(EPSILON, rmse * Math.sqrt(Math.max(EPSILON, 1 - leverage[index])))
    ));
    const cooksDistances = residuals.map((residual, index) => {
        const leverageValue = leverage[index];
        const parameterCount = predictorCount + 1;
        return (
            ((residual ** 2) / Math.max(EPSILON, parameterCount * mse)) *
            (leverageValue / Math.max(EPSILON, (1 - leverageValue) ** 2))
        );
    });
    const influence = buildInfluenceSummary({
        pairs: completeCases,
        cooksDistances,
        standardizedResiduals,
    });

    const residualSpreadRatio = (() => {
        const sortedPairs = fittedValues
            .map((fitted, index) => ({ fitted, residual: residuals[index] }))
            .sort((left, right) => left.fitted - right.fitted);
        const groupCount = Math.min(4, Math.max(2, Math.floor(sortedPairs.length / 8)));
        const residualSDs = Array.from({ length: groupCount }, (_, groupIndex) => {
            const start = Math.floor((groupIndex * sortedPairs.length) / groupCount);
            const end = groupIndex === groupCount - 1
                ? sortedPairs.length
                : Math.floor(((groupIndex + 1) * sortedPairs.length) / groupCount);
            const slice = sortedPairs.slice(start, Math.max(start + 1, end));
            const summary = summarizeSeries(slice.map((pair) => pair.residual));
            return summary?.sampleSD || 0;
        }).filter((value) => value > EPSILON);

        if (residualSDs.length < 2) {
            return 1;
        }

        return Math.max(...residualSDs) / Math.max(EPSILON, Math.min(...residualSDs));
    })();

    const vifByPredictor = normalizedPredictors.map((column, predictorIndex) => {
        const targetValues = predictorMatrix.map((row) => row[predictorIndex]);
        const otherPredictors = predictorMatrix.map((row) => row.filter((_, index) => index !== predictorIndex));
        const auxiliaryRSquared = otherPredictors[0]?.length
            ? calculateRSquaredFromModel(targetValues, otherPredictors)
            : 0;
        const tolerance = Math.max(0.000001, 1 - auxiliaryRSquared);
        const vif = 1 / tolerance;

        return {
            id: column.name,
            label: column.name,
            auxiliaryRSquared,
            tolerance,
            vif,
        };
    });

    const maxVIF = Math.max(1, ...vifByPredictor.map((item) => item.vif));
    const predictorCorrelationMatrix = normalizedPredictors.map((column, rowIndex) => ({
        label: column.name,
        values: normalizedPredictors.map((otherColumn, columnIndex) => {
            if (rowIndex === columnIndex) {
                return 1;
            }

            return pearsonCorrelation(
                completeCases.map((row) => row.predictorValues[rowIndex]),
                completeCases.map((row) => row.predictorValues[columnIndex])
            );
        }),
    }));

    const coefficientStandardErrors = betaVector.map((_, coefficientIndex) =>
        Math.sqrt(Math.max(EPSILON, mse * xtxInverse[coefficientIndex][coefficientIndex]))
    );

    const coefficients = betaVector.map((estimate, coefficientIndex) => {
        const isIntercept = coefficientIndex === 0;
        const standardError = coefficientStandardErrors[coefficientIndex];
        const tStatistic = estimate / Math.max(EPSILON, standardError);
        const pValue = (1 - studentTCDF(Math.abs(tStatistic), dfError)) * 2;
        const confidenceInterval = {
            lower: estimate - (tCritical * standardError),
            upper: estimate + (tCritical * standardError),
        };

        if (isIntercept) {
            return {
                id: 'intercept',
                label: 'Intercept',
                estimate,
                standardError,
                tStatistic,
                pValue,
                confidenceInterval,
                standardizedBeta: null,
                zeroOrderCorrelation: null,
                partialRSquared: null,
                vif: null,
                interpretation: `When all predictors equal 0, the model predicts ${roundTo(estimate, 3)} units on the outcome scale.`,
            };
        }

        const predictorSummary = predictorSummaries[coefficientIndex - 1];
        const zeroOrderCorrelation = pearsonCorrelation(
            completeCases.map((row) => row.predictorValues[coefficientIndex - 1]),
            yValues
        );
        const standardizedBeta = estimate * (
            predictorSummary.sampleSD / Math.max(EPSILON, ySummary.sampleSD)
        );
        const partialRSquared = (tStatistic ** 2) / ((tStatistic ** 2) + dfError);
        const vifInfo = vifByPredictor[coefficientIndex - 1];

        return {
            id: normalizedPredictors[coefficientIndex - 1].name,
            label: normalizedPredictors[coefficientIndex - 1].name,
            estimate,
            standardError,
            tStatistic,
            pValue,
            confidenceInterval,
            standardizedBeta,
            zeroOrderCorrelation,
            partialRSquared,
            vif: vifInfo.vif,
            tolerance: vifInfo.tolerance,
            interpretation: buildCoefficientInterpretation({
                coefficient: estimate,
                outcomeLabel: 'Y',
                predictorLabel: normalizedPredictors[coefficientIndex - 1].name,
            }),
        };
    });

    const pairs = completeCases.map((row, index) => ({
        ...row,
        fitted: fittedValues[index],
        residual: residuals[index],
        leverage: leverage[index],
        standardizedResidual: standardizedResiduals[index],
        cooksDistance: cooksDistances[index],
    }));

    return {
        ok: true,
        n,
        predictorCount,
        alpha: resolvedAlpha,
        confidenceLevel,
        outcomeLabel: 'Y',
        predictorLabels: normalizedPredictors.map((column) => column.name),
        yValues,
        predictorMatrix,
        ySummary,
        predictorSummaries,
        predictorCorrelationMatrix,
        betaVector,
        intercept: betaVector[0],
        coefficients,
        fittedValues,
        residuals,
        pairs,
        totalSS,
        modelSS,
        residualSS,
        dfModel,
        dfError,
        dfTotal,
        mse,
        rmse,
        residualSE: rmse,
        rSquared,
        adjustedRSquared,
        modelF,
        modelPValue,
        leverage,
        standardizedResiduals,
        cooksDistances,
        influence,
        residualSpreadRatio,
        xtxInverse,
        vifByPredictor,
        maxVIF,
        interpretation: buildMultipleRegressionInterpretation({
            ok: true,
            coefficients,
            rSquared,
        }),
        collinearityLabel: maxVIF >= 10
            ? 'Severe'
            : maxVIF >= 5
                ? 'High'
                : maxVIF >= 2.5
                    ? 'Moderate'
                    : 'Low',
    };
};

export const calculateMultipleRegressionPrediction = ({
    stats,
    predictorValues = {},
    confidenceLevel = null,
}) => {
    if (!stats?.ok) {
        return null;
    }

    const resolvedConfidenceLevel = Number.isFinite(Number(confidenceLevel))
        ? Number(confidenceLevel)
        : Number(stats.confidenceLevel || DEFAULT_CONFIDENCE_LEVEL);
    const resolvedAlpha = 1 - resolvedConfidenceLevel;
    const tCritical = studentTCriticalValue({
        alpha: resolvedAlpha,
        tails: 2,
        df: stats.dfError,
    });
    const resolvedPredictorValues = stats.predictorSummaries.map((summary) => {
        const raw = predictorValues?.[summary.label];
        const numeric = Number(raw);
        return Number.isFinite(numeric) ? numeric : summary.mean;
    });
    const designRow = [1, ...resolvedPredictorValues];
    const fitted = dotProduct(designRow, stats.betaVector);
    const varianceMultiplier = dotProduct(
        designRow,
        multiplyMatrixVector(stats.xtxInverse, designRow)
    );
    const meanSE = Math.sqrt(Math.max(EPSILON, stats.mse * varianceMultiplier));
    const predictionSE = Math.sqrt(Math.max(EPSILON, stats.mse * (1 + varianceMultiplier)));

    return {
        fitted,
        meanInterval: {
            lower: fitted - (tCritical * meanSE),
            upper: fitted + (tCritical * meanSE),
        },
        predictionInterval: {
            lower: fitted - (tCritical * predictionSE),
            upper: fitted + (tCritical * predictionSE),
        },
        predictorValues: Object.fromEntries(
            stats.predictorSummaries.map((summary, index) => [summary.label, resolvedPredictorValues[index]])
        ),
        isExtrapolation: stats.predictorSummaries.some((summary, index) => (
            resolvedPredictorValues[index] < summary.min || resolvedPredictorValues[index] > summary.max
        )),
    };
};

export const buildMultipleRegressionGuidance = (stats) => {
    if (!stats?.ok) {
        return [];
    }

    const guidance = [
        {
            title: 'Plot before trusting the model',
            body: 'Start with observed-vs-fitted and residual views. Multiple regression assumes the conditional mean of Y is linear in the predictors, not just that the coefficients can be estimated.',
        },
        {
            title: 'Coefficients are conditional',
            body: 'Each slope describes how predicted Y changes as that predictor changes while the other predictors in the model are held constant.',
        },
    ];

    if (stats.maxVIF >= 5) {
        guidance.push({
            title: 'Collinearity warning',
            body: `The predictor set shows elevated overlap (max VIF = ${roundTo(stats.maxVIF, 2)}). Coefficients can become unstable even when overall R² looks strong.`,
            tone: 'warning',
        });
    }

    if (stats.influence?.maxCooksDistance > 0.5 || stats.influence?.maxAbsoluteStandardizedResidual > 3) {
        guidance.push({
            title: 'Influential case detected',
            body: 'At least one case appears to be pulling the model noticeably. Inspect unusual combinations of predictor values and large residuals before over-trusting the slopes.',
            tone: 'warning',
        });
    }

    if (stats.residualSpreadRatio > 2.25) {
        guidance.push({
            title: 'Uneven residual spread',
            body: 'Residual variation changes a lot across the fitted range, so the linear mean structure may be incomplete or the standard errors may be less stable.',
            tone: 'warning',
        });
    }

    if (stats.n < Math.max(20, stats.predictorCount * 8)) {
        guidance.push({
            title: 'Small-sample caution',
            body: 'With multiple predictors and a modest sample, p-values and confidence intervals become more sensitive to outliers, non-normal residuals, and collinearity.',
        });
    }

    return guidance.slice(0, 5);
};

export const buildMultipleRegressionTutorDataset = ({
    sampleSize = 80,
    beta1 = 1.1,
    beta2 = 0.8,
    predictorCorrelation = 0.35,
    noise = 1.1,
    includeOutlier = false,
    generationKey = 0,
}) => {
    const resolvedSampleSize = Math.max(24, Math.round(Number(sampleSize) || 80));
    const rho = clampToRange(Number(predictorCorrelation) || 0, -0.92, 0.92);
    const random = createSeededRandom(hashSeedParts(
        'multiple-regression-tutor',
        resolvedSampleSize,
        beta1,
        beta2,
        rho,
        noise,
        includeOutlier,
        generationKey
    ));
    const scale = Math.sqrt(Math.max(EPSILON, 1 - (rho ** 2)));
    const rows = Array.from({ length: resolvedSampleSize }, (_, index) => {
        const x1 = sampleStandardNormal(random) * 1.5;
        const x2 = ((rho * x1) / 1.5) + (scale * sampleStandardNormal(random) * 1.2);
        const residual = sampleStandardNormal(random) * (Number(noise) || 1.1) * 5;
        const y = 55 + (x1 * Number(beta1) * 5.5) + (x2 * Number(beta2) * 5.5) + residual;

        return {
            id: index,
            x1,
            x2,
            y,
            isSyntheticOutlier: false,
        };
    });

    if (includeOutlier) {
        const outlierX1 = 3.4;
        const outlierX2 = (rho * outlierX1) + (scale * -1.9);
        const outlierExpected = 55 + (outlierX1 * Number(beta1) * 5.5) + (outlierX2 * Number(beta2) * 5.5);
        rows.push({
            id: resolvedSampleSize,
            x1: outlierX1,
            x2: outlierX2,
            y: outlierExpected - 18,
            isSyntheticOutlier: true,
        });
    }

    return {
        predictorColumns: [
            { name: 'Predictor X1', numericValues: rows.map((row) => row.x1) },
            { name: 'Predictor X2', numericValues: rows.map((row) => row.x2) },
        ],
        outcomeValues: rows.map((row) => row.y),
        rows,
    };
};

