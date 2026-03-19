import { centralFCDF } from '../power/fMath.js';
import { studentTCDF, studentTCriticalValue } from '../power/tMath.js';
import { pairNumericColumns } from './correlation.js';

const EPSILON = 1e-12;
const DEFAULT_CONFIDENCE_LEVEL = 0.95;
const DEFAULT_TUTOR_REFERENCE_SAMPLE_SIZE = 36;
const DEFAULT_TUTOR_REFERENCE_NOISE = 0.28;
const DEFAULT_TUTOR_POOL_SIZE = 180;
const TUTOR_ACCEPTANCE_ATTEMPTS = 72;

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

const solveLinearSystem3 = (matrix, vector) => {
    const augmented = matrix.map((row, index) => [...row, vector[index]]);

    for (let pivotIndex = 0; pivotIndex < 3; pivotIndex += 1) {
        let pivotRow = pivotIndex;
        let pivotMagnitude = Math.abs(augmented[pivotIndex][pivotIndex]);

        for (let rowIndex = pivotIndex + 1; rowIndex < 3; rowIndex += 1) {
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

        for (let columnIndex = pivotIndex; columnIndex < 4; columnIndex += 1) {
            augmented[pivotIndex][columnIndex] /= pivotValue;
        }

        for (let rowIndex = 0; rowIndex < 3; rowIndex += 1) {
            if (rowIndex === pivotIndex) {
                continue;
            }

            const factor = augmented[rowIndex][pivotIndex];

            for (let columnIndex = pivotIndex; columnIndex < 4; columnIndex += 1) {
                augmented[rowIndex][columnIndex] -= factor * augmented[pivotIndex][columnIndex];
            }
        }
    }

    return augmented.map((row) => row[3]);
};

const fitQuadraticModel = (pairs = []) => {
    if (pairs.length < 5) {
        return null;
    }

    const xs = pairs.map((pair) => Number(pair.x));
    const ys = pairs.map((pair) => Number(pair.y));
    const meanY = ys.reduce((sum, value) => sum + value, 0) / ys.length;
    const totalSS = ys.reduce((sum, value) => sum + ((value - meanY) ** 2), 0);

    if (!(totalSS > EPSILON)) {
        return null;
    }

    let sumX = 0;
    let sumX2 = 0;
    let sumX3 = 0;
    let sumX4 = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumX2Y = 0;

    for (let index = 0; index < pairs.length; index += 1) {
        const x = xs[index];
        const y = ys[index];
        const x2 = x ** 2;
        sumX += x;
        sumX2 += x2;
        sumX3 += x2 * x;
        sumX4 += x2 ** 2;
        sumY += y;
        sumXY += x * y;
        sumX2Y += x2 * y;
    }

    const coefficients = solveLinearSystem3(
        [
            [pairs.length, sumX, sumX2],
            [sumX, sumX2, sumX3],
            [sumX2, sumX3, sumX4],
        ],
        [sumY, sumXY, sumX2Y]
    );

    if (!coefficients) {
        return null;
    }

    const [intercept, linearSlope, quadraticSlope] = coefficients;
    const residualSS = pairs.reduce((sum, pair) => {
        const fitted = intercept + (linearSlope * pair.x) + (quadraticSlope * (pair.x ** 2));
        return sum + ((pair.y - fitted) ** 2);
    }, 0);

    return {
        intercept,
        linearSlope,
        quadraticSlope,
        residualSS,
        rSquared: clampToRange(1 - (residualSS / Math.max(EPSILON, totalSS)), 0, 1),
    };
};

const calculateCoreRegressionStats = (pairs = []) => {
    const n = pairs.length;

    if (n < 3) {
        return {
            ok: false,
            errors: ['Simple linear regression needs at least 3 complete X/Y pairs.'],
            pairs,
            n,
        };
    }

    const xs = pairs.map((pair) => pair.x);
    const ys = pairs.map((pair) => pair.y);
    const xSummary = summarizeSeries(xs);
    const ySummary = summarizeSeries(ys);

    if (!(xSummary?.sampleSD > EPSILON)) {
        return {
            ok: false,
            errors: ['The predictor X has almost no variance, so the slope cannot be estimated.'],
            pairs,
            n,
        };
    }

    if (!(ySummary?.sampleSD > EPSILON)) {
        return {
            ok: false,
            errors: ['The outcome Y has almost no variance, so the regression line is not informative.'],
            pairs,
            n,
        };
    }

    let sumXX = 0;
    let sumXY = 0;
    let sumYY = 0;

    pairs.forEach((pair) => {
        const dx = pair.x - xSummary.mean;
        const dy = pair.y - ySummary.mean;
        sumXX += dx ** 2;
        sumXY += dx * dy;
        sumYY += dy ** 2;
    });

    if (!(sumXX > EPSILON)) {
        return {
            ok: false,
            errors: ['The predictor X has almost no spread, so the slope cannot be estimated.'],
            pairs,
            n,
        };
    }

    const slope = sumXY / sumXX;
    const intercept = ySummary.mean - (slope * xSummary.mean);
    const fittedPairs = pairs.map((pair) => {
        const fitted = intercept + (slope * pair.x);
        return {
            ...pair,
            fitted,
            residual: pair.y - fitted,
        };
    });
    const residualSS = fittedPairs.reduce((sum, pair) => sum + (pair.residual ** 2), 0);
    const totalSS = sumYY;
    const modelSS = Math.max(0, totalSS - residualSS);
    const rSquared = clampToRange(1 - (residualSS / Math.max(EPSILON, totalSS)), 0, 1);
    const r = clampToRange(
        slope >= 0 ? Math.sqrt(rSquared) : -Math.sqrt(rSquared),
        -0.999999,
        0.999999
    );
    const dfModel = 1;
    const dfError = Math.max(1, n - 2);
    const dfTotal = Math.max(1, n - 1);
    const rmse = Math.sqrt(Math.max(0, residualSS / dfError));
    const adjustedRSquared = n > 2
        ? 1 - (((1 - rSquared) * (n - 1)) / Math.max(1, n - 2))
        : rSquared;
    const slopeSE = Math.sqrt(Math.max(EPSILON, (rmse ** 2) / sumXX));
    const interceptSE = Math.sqrt(
        Math.max(EPSILON, (rmse ** 2) * ((1 / n) + ((xSummary.mean ** 2) / sumXX)))
    );
    const slopeT = slope / Math.max(EPSILON, slopeSE);
    const interceptT = intercept / Math.max(EPSILON, interceptSE);
    const modelF = modelSS / Math.max(EPSILON, rmse ** 2);
    const leverage = fittedPairs.map((pair) => 1 / n + (((pair.x - xSummary.mean) ** 2) / sumXX));
    const standardizedResiduals = fittedPairs.map((pair, index) => (
        pair.residual / Math.max(EPSILON, rmse * Math.sqrt(Math.max(EPSILON, 1 - leverage[index])))
    ));
    const cooksDistances = fittedPairs.map((pair, index) => {
        const leverageValue = leverage[index];
        return (
            ((pair.residual ** 2) / Math.max(EPSILON, 2 * (rmse ** 2))) *
            (leverageValue / Math.max(EPSILON, (1 - leverageValue) ** 2))
        );
    });
    const residualSpreadRatio = (() => {
        const sortedPairs = [...fittedPairs].sort((left, right) => left.x - right.x);
        const groupCount = 3;
        const groupSDs = Array.from({ length: groupCount }, (_, index) => {
            const start = Math.floor((index * sortedPairs.length) / groupCount);
            const end = index === groupCount - 1
                ? sortedPairs.length
                : Math.floor(((index + 1) * sortedPairs.length) / groupCount);
            const slice = sortedPairs.slice(start, Math.max(start + 1, end));
            const residuals = slice.map((pair) => pair.residual);
            const summary = summarizeSeries(residuals);
            return summary?.sampleSD || 0;
        }).filter((value) => value > EPSILON);

        if (groupSDs.length < 2) {
            return 1;
        }

        return Math.max(...groupSDs) / Math.max(EPSILON, Math.min(...groupSDs));
    })();
    const quadraticModel = fitQuadraticModel(fittedPairs);
    const quadraticGain = quadraticModel
        ? Math.max(0, quadraticModel.rSquared - rSquared)
        : 0;

    return {
        ok: true,
        pairs: fittedPairs,
        n,
        xValues: xs,
        yValues: ys,
        xSummary,
        ySummary,
        meanX: xSummary.mean,
        meanY: ySummary.mean,
        slope,
        intercept,
        r,
        rSquared,
        adjustedRSquared,
        sumXX,
        sumXY,
        sumYY,
        totalSS,
        modelSS,
        residualSS,
        dfModel,
        dfError,
        dfTotal,
        rmse,
        residualSE: rmse,
        slopeSE,
        interceptSE,
        slopeT,
        interceptT,
        modelF,
        leverage,
        standardizedResiduals,
        cooksDistances,
        residualSpreadRatio,
        quadraticModel,
        quadraticGain,
    };
};

const calculateRegressionInfluence = (pairs = [], baselineStats = null) => {
    if (!baselineStats?.ok || pairs.length < 4) {
        return {
            influentialIndex: null,
            influentialPoint: null,
            maxDeltaSlope: 0,
            maxDeltaRSquared: 0,
            maxCooksDistance: Math.max(0, ...(baselineStats?.cooksDistances || [0])),
        };
    }

    const leaveOneOut = pairs.map((pair, index) => {
        const reducedPairs = pairs.filter((_, pairIndex) => pairIndex !== index);
        const reducedStats = calculateCoreRegressionStats(reducedPairs);

        if (!reducedStats.ok) {
            return null;
        }

        return {
            index,
            deltaSlope: Math.abs(reducedStats.slope - baselineStats.slope),
            deltaRSquared: Math.abs(reducedStats.rSquared - baselineStats.rSquared),
        };
    }).filter(Boolean);

    const mostInfluential = leaveOneOut.reduce((best, item) => {
        const score = item.deltaSlope + item.deltaRSquared;

        if (!best || score > best.score) {
            return {
                ...item,
                score,
            };
        }

        return best;
    }, null);

    return {
        influentialIndex: mostInfluential?.index ?? null,
        influentialPoint: mostInfluential ? pairs[mostInfluential.index] : null,
        maxDeltaSlope: mostInfluential?.deltaSlope ?? 0,
        maxDeltaRSquared: mostInfluential?.deltaRSquared ?? 0,
        maxCooksDistance: Math.max(0, ...(baselineStats.cooksDistances || [0])),
    };
};

export const buildSlopeInterpretation = ({
    slope,
    predictorLabel = 'X',
    outcomeLabel = 'Y',
    units = 1,
}) => {
    const numericSlope = Number(slope);
    const numericUnits = Number(units);

    if (!Number.isFinite(numericSlope) || !Number.isFinite(numericUnits)) {
        return 'Slope interpretation is not available yet.';
    }

    const predictedChange = numericSlope * numericUnits;
    const direction = predictedChange >= 0 ? 'increases' : 'decreases';

    return `For every ${roundTo(numericUnits, 3)}-unit increase in ${predictorLabel}, predicted ${outcomeLabel} ${direction} by about ${roundTo(Math.abs(predictedChange), 3)} units on average.`;
};

const describeRegressionFit = (rSquared) => {
    const numeric = Number(rSquared);

    if (!(numeric >= 0)) {
        return 'an unknown share';
    }

    if (numeric < 0.1) {
        return 'very little';
    }

    if (numeric < 0.3) {
        return 'a modest share';
    }

    if (numeric < 0.6) {
        return 'a meaningful share';
    }

    return 'a large share';
};

export const buildRegressionInterpretation = (stats) => {
    if (!stats?.ok) {
        return 'Regression output is not available yet.';
    }

    const slopeMagnitude = Math.abs(stats.slope);
    const direction = stats.slope >= 0 ? 'upward' : 'downward';
    const fitStrength = describeRegressionFit(stats.rSquared);

    return `The fitted line predicts an average ${direction} change of about ${roundTo(slopeMagnitude, 3)} outcome units for each 1-unit increase in the predictor and explains ${fitStrength} of the outcome variance around that line.`;
};

export const rSquaredToFSquared = (rSquared) => {
    const value = Number(rSquared);

    if (!(value >= 0) || !(value < 1)) {
        return null;
    }

    return value / Math.max(EPSILON, 1 - value);
};

export const fSquaredToRSquared = (fSquared) => {
    const value = Math.max(0, Number(fSquared));
    return value / (1 + value);
};

export const calculateSimpleLinearRegressionStats = ({
    xValues = [],
    yValues = [],
    alpha = 0.05,
    confidenceLevel = DEFAULT_CONFIDENCE_LEVEL,
    skipInfluence = false,
}) => {
    const pairedValues = pairNumericColumns(xValues, yValues);
    const coreStats = calculateCoreRegressionStats(pairedValues);

    if (!coreStats.ok) {
        return coreStats;
    }

    const resolvedAlpha = Number.isFinite(Number(alpha))
        ? Number(alpha)
        : (1 - Number(confidenceLevel || DEFAULT_CONFIDENCE_LEVEL));
    const tCritical = studentTCriticalValue({
        alpha: resolvedAlpha,
        tails: 2,
        df: coreStats.dfError,
    });
    const slopePValue = (1 - studentTCDF(Math.abs(coreStats.slopeT), coreStats.dfError)) * 2;
    const interceptPValue = (1 - studentTCDF(Math.abs(coreStats.interceptT), coreStats.dfError)) * 2;
    const modelPValue = 1 - centralFCDF(coreStats.modelF, coreStats.dfModel, coreStats.dfError);
    const influence = skipInfluence
        ? {
            influentialIndex: null,
            influentialPoint: null,
            maxDeltaSlope: 0,
            maxDeltaRSquared: 0,
            maxCooksDistance: Math.max(0, ...(coreStats.cooksDistances || [0])),
        }
        : calculateRegressionInfluence(coreStats.pairs, coreStats);

    return {
        ...coreStats,
        alpha: resolvedAlpha,
        confidenceLevel,
        coefficients: [
            {
                id: 'intercept',
                label: 'Intercept',
                estimate: coreStats.intercept,
                standardError: coreStats.interceptSE,
                tStatistic: coreStats.interceptT,
                pValue: interceptPValue,
                confidenceInterval: {
                    lower: coreStats.intercept - (tCritical * coreStats.interceptSE),
                    upper: coreStats.intercept + (tCritical * coreStats.interceptSE),
                },
            },
            {
                id: 'slope',
                label: 'Slope',
                estimate: coreStats.slope,
                standardError: coreStats.slopeSE,
                tStatistic: coreStats.slopeT,
                pValue: slopePValue,
                confidenceInterval: {
                    lower: coreStats.slope - (tCritical * coreStats.slopeSE),
                    upper: coreStats.slope + (tCritical * coreStats.slopeSE),
                },
            },
        ],
        hypothesisTests: {
            slope: {
                statisticLabel: 't',
                statistic: coreStats.slopeT,
                df: coreStats.dfError,
                pValue: slopePValue,
            },
            intercept: {
                statisticLabel: 't',
                statistic: coreStats.interceptT,
                df: coreStats.dfError,
                pValue: interceptPValue,
            },
            model: {
                statisticLabel: 'F',
                statistic: coreStats.modelF,
                dfModel: coreStats.dfModel,
                dfError: coreStats.dfError,
                pValue: modelPValue,
            },
        },
        confidenceIntervals: {
            slope: {
                lower: coreStats.slope - (tCritical * coreStats.slopeSE),
                upper: coreStats.slope + (tCritical * coreStats.slopeSE),
            },
            intercept: {
                lower: coreStats.intercept - (tCritical * coreStats.interceptSE),
                upper: coreStats.intercept + (tCritical * coreStats.interceptSE),
            },
        },
        tCritical,
        influence,
        interpretation: buildRegressionInterpretation(coreStats),
        slopeInterpretation: buildSlopeInterpretation({
            slope: coreStats.slope,
        }),
    };
};

export const calculateRegressionPrediction = ({
    stats,
    xValue,
    confidenceLevel = DEFAULT_CONFIDENCE_LEVEL,
}) => {
    if (!stats?.ok) {
        return null;
    }

    if (xValue === '' || xValue == null) {
        return null;
    }

    const numericX = Number(xValue);

    if (!Number.isFinite(numericX)) {
        return null;
    }

    const alpha = 1 - confidenceLevel;
    const tCritical = studentTCriticalValue({
        alpha,
        tails: 2,
        df: stats.dfError,
    });
    const fitted = stats.intercept + (stats.slope * numericX);
    const meanStandardError = stats.rmse * Math.sqrt(
        Math.max(EPSILON, (1 / stats.n) + (((numericX - stats.meanX) ** 2) / stats.sumXX))
    );
    const predictionStandardError = stats.rmse * Math.sqrt(
        Math.max(EPSILON, 1 + (1 / stats.n) + (((numericX - stats.meanX) ** 2) / stats.sumXX))
    );

    return {
        x: numericX,
        fitted,
        meanStandardError,
        predictionStandardError,
        meanInterval: {
            lower: fitted - (tCritical * meanStandardError),
            upper: fitted + (tCritical * meanStandardError),
        },
        predictionInterval: {
            lower: fitted - (tCritical * predictionStandardError),
            upper: fitted + (tCritical * predictionStandardError),
        },
        isExtrapolation: numericX < stats.xSummary.min || numericX > stats.xSummary.max,
    };
};

const buildBandGrid = ({
    stats,
    confidenceLevel = DEFAULT_CONFIDENCE_LEVEL,
    includePrediction = false,
    pointCount = 60,
}) => {
    if (!stats?.ok || stats.n < 3) {
        return [];
    }

    const alpha = 1 - confidenceLevel;
    const tCritical = studentTCriticalValue({
        alpha,
        tails: 2,
        df: stats.dfError,
    });
    const xMin = stats.xSummary.min;
    const xMax = stats.xSummary.max;
    const xRange = Math.max(EPSILON, xMax - xMin);
    const points = Array.from({ length: pointCount }, (_, index) => {
        const ratio = pointCount <= 1 ? 0 : index / (pointCount - 1);
        const x = xMin + (xRange * ratio);
        const fitted = stats.intercept + (stats.slope * x);
        const meanStandardError = stats.rmse * Math.sqrt(
            Math.max(EPSILON, (1 / stats.n) + (((x - stats.meanX) ** 2) / stats.sumXX))
        );
        const predictionStandardError = stats.rmse * Math.sqrt(
            Math.max(EPSILON, 1 + (1 / stats.n) + (((x - stats.meanX) ** 2) / stats.sumXX))
        );

        return {
            x,
            fitted,
            meanLower: fitted - (tCritical * meanStandardError),
            meanUpper: fitted + (tCritical * meanStandardError),
            predictionLower: fitted - (tCritical * predictionStandardError),
            predictionUpper: fitted + (tCritical * predictionStandardError),
        };
    });

    return includePrediction
        ? points
        : points.map((point) => ({
            x: point.x,
            fitted: point.fitted,
            lower: point.meanLower,
            upper: point.meanUpper,
        }));
};

export const buildRegressionBand = ({
    stats,
    confidenceLevel = DEFAULT_CONFIDENCE_LEVEL,
}) => buildBandGrid({
    stats,
    confidenceLevel,
    includePrediction: false,
});

export const buildPredictionBand = ({
    stats,
    confidenceLevel = DEFAULT_CONFIDENCE_LEVEL,
}) => buildBandGrid({
    stats,
    confidenceLevel,
    includePrediction: true,
});

const buildTutorXValues = ({
    pointCount,
    random,
    min = 0,
    max = 10,
    jitterScale = 0.18,
}) => {
    const span = max - min;
    return Array.from({ length: pointCount }, (_, index) => {
        const base = min + ((span * index) / Math.max(1, pointCount - 1));
        const jitter = sampleStandardNormal(random) * jitterScale;
        return clampToRange(base + jitter, min - 0.25, max + 0.25);
    }).sort((left, right) => left - right);
};

const takeNestedTutorPairs = (pairs = [], targetCount = pairs.length) => {
    if (pairs.length <= targetCount) {
        return pairs.map((pair, index) => ({
            ...pair,
            id: index,
        }));
    }

    const selected = new Set([0, pairs.length - 1]);

    while (selected.size < targetCount) {
        const ordered = Array.from(selected).sort((left, right) => left - right);
        let bestGap = -1;
        let bestIndex = null;

        for (let index = 0; index < ordered.length - 1; index += 1) {
            const left = ordered[index];
            const right = ordered[index + 1];

            if (right - left <= 1) {
                continue;
            }

            const candidate = Math.floor((left + right) / 2);
            const gap = right - left;

            if (!selected.has(candidate) && gap > bestGap) {
                bestGap = gap;
                bestIndex = candidate;
            }
        }

        if (bestIndex == null) {
            for (let index = 0; index < pairs.length; index += 1) {
                if (!selected.has(index)) {
                    bestIndex = index;
                    break;
                }
            }
        }

        if (bestIndex == null) {
            break;
        }

        selected.add(bestIndex);
    }

    return pairs
        .filter((_, index) => selected.has(index))
        .map((pair, index) => ({
            ...pair,
            id: index,
        }));
};

const buildLinearTutorSource = ({
    pointCount,
    slope,
    intercept,
    seed,
}) => {
    const random = createSeededRandom(seed);
    const xs = buildTutorXValues({
        pointCount,
        random,
    });

    return xs.map((x, index) => ({
        id: index,
        x,
        signalY: intercept + (slope * x),
        residualUnit: sampleStandardNormal(random),
    }));
};

const buildNonlinearTutorSource = ({
    pointCount,
    intercept,
    curveScale,
    seed,
}) => {
    const random = createSeededRandom(seed);
    const xs = buildTutorXValues({
        pointCount,
        random,
    });

    return xs.map((x, index) => ({
        id: index,
        x,
        signalY: intercept + (curveScale * ((x - 5) ** 2)),
        residualUnit: sampleStandardNormal(random),
    }));
};

const buildTutorDiagnostics = (pairs = []) => {
    const stats = calculateCoreRegressionStats(pairs);

    if (!stats.ok) {
        return {
            slope: 0,
            rSquared: 0,
            riseSteps: 0,
            fallSteps: 0,
            quartileDelta: 0,
            edgeVsMiddle: 0,
            quadraticGain: 0,
        };
    }

    const sortedPairs = [...pairs].sort((left, right) => left.x - right.x);
    const quartileMeans = Array.from({ length: 4 }, (_, index) => {
        const start = Math.floor((index * sortedPairs.length) / 4);
        const end = index === 3
            ? sortedPairs.length
            : Math.floor(((index + 1) * sortedPairs.length) / 4);
        const slice = sortedPairs.slice(start, Math.max(start + 1, end));
        return slice.reduce((sum, pair) => sum + pair.y, 0) / Math.max(1, slice.length);
    });
    const quartileDiffs = quartileMeans.slice(1).map((mean, index) => mean - quartileMeans[index]);

    return {
        slope: stats.slope,
        rSquared: stats.rSquared,
        riseSteps: quartileDiffs.filter((value) => value > 0.45).length,
        fallSteps: quartileDiffs.filter((value) => value < -0.45).length,
        quartileDelta: quartileMeans[quartileMeans.length - 1] - quartileMeans[0],
        edgeVsMiddle: ((quartileMeans[0] + quartileMeans[3]) / 2) - ((quartileMeans[1] + quartileMeans[2]) / 2),
        quadraticGain: stats.quadraticGain,
    };
};

const rangePenalty = (value, min, max, weight = 1) => {
    if (value < min) {
        return (min - value) * weight;
    }

    if (value > max) {
        return (value - max) * weight;
    }

    return 0;
};

const minimumPenalty = (value, min, weight = 1) => (value < min ? (min - value) * weight : 0);
const maximumPenalty = (value, max, weight = 1) => (value > max ? (value - max) * weight : 0);

const evaluateTutorCandidate = ({
    preset,
    pairs = [],
}) => {
    const diagnostics = buildTutorDiagnostics(pairs);
    let penalty = 0;

    if (preset === 'positive_low_noise') {
        penalty += rangePenalty(diagnostics.slope, 0.75, 1.2, 4);
        penalty += rangePenalty(diagnostics.rSquared, 0.74, 0.98, 4.2);
        penalty += minimumPenalty(diagnostics.riseSteps, 3, 1.1);
        penalty += maximumPenalty(diagnostics.quadraticGain, 0.08, 3.8);
    } else if (preset === 'positive_high_noise') {
        penalty += rangePenalty(diagnostics.slope, 0.45, 1.35, 3.8);
        penalty += rangePenalty(diagnostics.rSquared, 0.16, 0.62, 4.2);
        penalty += minimumPenalty(diagnostics.riseSteps, 2, 0.9);
        penalty += maximumPenalty(diagnostics.quadraticGain, 0.1, 3.4);
    } else if (preset === 'negative_low_noise') {
        penalty += rangePenalty(diagnostics.slope, -1.2, -0.75, 4);
        penalty += rangePenalty(diagnostics.rSquared, 0.74, 0.98, 4.2);
        penalty += minimumPenalty(diagnostics.fallSteps, 3, 1.1);
        penalty += maximumPenalty(diagnostics.quadraticGain, 0.08, 3.8);
    } else if (preset === 'negative_high_noise') {
        penalty += rangePenalty(diagnostics.slope, -1.35, -0.45, 3.8);
        penalty += rangePenalty(diagnostics.rSquared, 0.16, 0.62, 4.2);
        penalty += minimumPenalty(diagnostics.fallSteps, 2, 0.9);
        penalty += maximumPenalty(diagnostics.quadraticGain, 0.1, 3.4);
    } else if (preset === 'near_flat') {
        penalty += rangePenalty(diagnostics.slope, 0.08, 0.26, 6);
        penalty += rangePenalty(diagnostics.rSquared, 0.48, 0.92, 5.2);
        penalty += minimumPenalty(diagnostics.riseSteps, 2, 0.9);
        penalty += maximumPenalty(Math.abs(diagnostics.quartileDelta), 2.2, 2.4);
        penalty += maximumPenalty(diagnostics.quadraticGain, 0.08, 3.2);
    } else if (preset === 'nonlinear') {
        penalty += maximumPenalty(diagnostics.rSquared, 0.25, 4.5);
        penalty += minimumPenalty(diagnostics.quadraticGain, 0.26, 7);
        penalty += minimumPenalty(diagnostics.edgeVsMiddle, 1.8, 2.8);
    }

    return {
        ok: penalty <= 1e-9,
        penalty,
    };
};

const injectTutorOutlier = ({
    pairs,
    orientation = 'high_x_low_y',
}) => {
    if (!pairs.length) {
        return pairs;
    }

    const xValues = pairs.map((pair) => pair.x);
    const yValues = pairs.map((pair) => pair.y);
    const minX = Math.min(...xValues);
    const maxX = Math.max(...xValues);
    const minY = Math.min(...yValues);
    const maxY = Math.max(...yValues);
    const xSpan = Math.max(1, maxX - minX);
    const ySpan = Math.max(1, maxY - minY);
    const x = maxX + (xSpan * 0.18);
    const y = orientation === 'high_x_high_y'
        ? maxY + (ySpan * 0.34)
        : minY - (ySpan * 0.34);
    const nextId = pairs.reduce((maxId, pair) => Math.max(maxId, Number(pair.id) || 0), -1) + 1;

    return [
        ...pairs,
        {
            id: nextId,
            x,
            y,
            isSyntheticOutlier: true,
        },
    ];
};

const REGRESSION_TUTOR_PRESET_CONFIG = {
    positive_low_noise: {
        kind: 'linear',
        slope: 1,
        intercept: 8,
        poolSize: DEFAULT_TUTOR_POOL_SIZE,
        baseResidual: 0.35,
        noiseMultiplier: 1.15,
        outlierOrientation: 'high_x_low_y',
    },
    positive_high_noise: {
        kind: 'linear',
        slope: 1,
        intercept: 8,
        poolSize: DEFAULT_TUTOR_POOL_SIZE,
        baseResidual: 1.4,
        noiseMultiplier: 2.1,
        outlierOrientation: 'high_x_low_y',
    },
    negative_low_noise: {
        kind: 'linear',
        slope: -1,
        intercept: 18,
        poolSize: DEFAULT_TUTOR_POOL_SIZE,
        baseResidual: 0.35,
        noiseMultiplier: 1.15,
        outlierOrientation: 'high_x_high_y',
    },
    negative_high_noise: {
        kind: 'linear',
        slope: -1,
        intercept: 18,
        poolSize: DEFAULT_TUTOR_POOL_SIZE,
        baseResidual: 1.4,
        noiseMultiplier: 2.1,
        outlierOrientation: 'high_x_high_y',
    },
    near_flat: {
        kind: 'linear',
        slope: 0.16,
        intercept: 10.2,
        poolSize: DEFAULT_TUTOR_POOL_SIZE,
        baseResidual: 0.14,
        noiseMultiplier: 0.55,
        outlierOrientation: 'high_x_low_y',
    },
    nonlinear: {
        kind: 'nonlinear',
        intercept: 8,
        curveScale: 0.42,
        poolSize: DEFAULT_TUTOR_POOL_SIZE,
        baseResidual: 0.55,
        noiseMultiplier: 0.95,
        outlierOrientation: 'high_x_low_y',
    },
};

const resolveTutorPresetConfig = (preset = 'positive_low_noise') => (
    REGRESSION_TUTOR_PRESET_CONFIG[preset] || REGRESSION_TUTOR_PRESET_CONFIG.positive_low_noise
);

const buildRegressionTutorBaseCandidate = ({
    preset = 'positive_low_noise',
    generationKey = 0,
    attempt = 0,
}) => {
    const config = resolveTutorPresetConfig(preset);
    const seed = hashSeedParts('simple_regression_tutor', preset, generationKey, attempt);

    if (config.kind === 'nonlinear') {
        return {
            preset,
            config,
            sourcePairs: buildNonlinearTutorSource({
                pointCount: config.poolSize,
                intercept: config.intercept,
                curveScale: config.curveScale,
                seed,
            }),
        };
    }

    return {
        preset,
        config,
        sourcePairs: buildLinearTutorSource({
            pointCount: config.poolSize,
            slope: config.slope,
            intercept: config.intercept,
            seed,
        }),
    };
};

export const deriveRegressionTutorDataset = ({
    baseDataset = null,
    sampleSize = DEFAULT_TUTOR_REFERENCE_SAMPLE_SIZE,
    noise = DEFAULT_TUTOR_REFERENCE_NOISE,
    includeOutlier = false,
}) => {
    if (!baseDataset?.sourcePairs?.length) {
        return {
            preset: baseDataset?.preset || 'positive_low_noise',
            pairs: [],
        };
    }

    const config = baseDataset.config || resolveTutorPresetConfig(baseDataset.preset);
    const resolvedSampleSize = Math.max(8, Math.round(sampleSize));
    const resolvedNoise = Math.max(0, Math.min(1, Number(noise)));
    const residualScale = config.baseResidual + (resolvedNoise * config.noiseMultiplier);
    const transformedPairs = baseDataset.sourcePairs.map((pair, index) => ({
        id: index,
        x: pair.x,
        y: pair.signalY + (pair.residualUnit * residualScale),
    }));
    const visiblePairs = takeNestedTutorPairs(transformedPairs, resolvedSampleSize);

    return {
        preset: baseDataset.preset,
        pairs: includeOutlier
            ? injectTutorOutlier({
                pairs: visiblePairs,
                orientation: config.outlierOrientation,
            })
            : visiblePairs,
    };
};

export const buildRegressionTutorBaseDataset = ({
    preset = 'positive_low_noise',
    targetSampleSize = DEFAULT_TUTOR_REFERENCE_SAMPLE_SIZE,
    targetNoise = DEFAULT_TUTOR_REFERENCE_NOISE,
    generationKey = 0,
}) => {
    let bestCandidate = null;
    let bestPenalty = Number.POSITIVE_INFINITY;

    for (let attempt = 0; attempt < TUTOR_ACCEPTANCE_ATTEMPTS; attempt += 1) {
        const candidate = buildRegressionTutorBaseCandidate({
            preset,
            generationKey,
            attempt,
        });
        const renderedCandidate = deriveRegressionTutorDataset({
            baseDataset: candidate,
            sampleSize: targetSampleSize,
            noise: targetNoise,
            includeOutlier: false,
        });
        const evaluation = evaluateTutorCandidate({
            preset,
            pairs: renderedCandidate.pairs,
        });

        if (evaluation.penalty < bestPenalty) {
            bestPenalty = evaluation.penalty;
            bestCandidate = candidate;
        }

        if (evaluation.ok) {
            return candidate;
        }
    }

    return bestCandidate || buildRegressionTutorBaseCandidate({
        preset,
        generationKey,
        attempt: 0,
    });
};

export const buildRegressionGuidance = (stats) => {
    if (!stats?.ok) {
        return [];
    }

    const guidance = [
        {
            title: 'Plot before inference',
            body: 'Simple linear regression assumes the mean of Y changes in a straight-line way as X changes. Start with the scatterplot and residual plot before trusting the line.',
        },
    ];

    if (stats.quadraticGain > 0.14) {
        guidance.push({
            title: 'Possible curvature',
            body: `A curved pattern may be hiding behind the line here. A quadratic fit would raise R² by about ${roundTo(stats.quadraticGain, 3)}, so one straight-line summary may be incomplete.`,
            tone: 'warning',
        });
    }

    if (stats.influence?.maxCooksDistance > 0.5 || stats.influence?.maxDeltaSlope > 0.35) {
        guidance.push({
            title: 'Potentially influential point',
            body: 'One case appears to be pulling the fitted line noticeably. Check unusual points before treating the slope as stable.',
            tone: 'warning',
        });
    }

    if (stats.residualSpreadRatio > 2.25) {
        guidance.push({
            title: 'Uneven residual spread',
            body: 'Residual spread changes quite a bit across the predictor range, so one simple linear summary may be missing part of the story.',
            tone: 'warning',
        });
    }

    if (stats.n < 15) {
        guidance.push({
            title: 'Small-sample caution',
            body: 'The line can still be estimated, but slope p-values and confidence intervals are more sensitive to outliers and non-normal residuals in smaller samples.',
        });
    }

    if (stats.xSummary.uniqueCount < 5) {
        guidance.push({
            title: 'Limited X variation',
            body: 'The predictor has only a few distinct values. The line may still be useful, but inspect whether the model is being driven by only a handful of X levels.',
        });
    }

    return guidance.slice(0, 4);
};
