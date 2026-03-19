import { normalCDF } from '../utils/mathHelpers.js';
import { studentTCDF, studentTCriticalValue } from '../power/tMath.js';

const EPSILON = 1e-12;
const CORRELATION_LIMIT = 0.999999;

const clampCorrelation = (value, limit = CORRELATION_LIMIT) => {
    const numeric = Number(value);

    if (!Number.isFinite(numeric)) {
        return 0;
    }

    return Math.max(-limit, Math.min(limit, numeric));
};

const inverseNormalCDF = (p) => {
    if (!(p > 0) || !(p < 1)) {
        throw new Error('Probability must be between 0 and 1.');
    }

    const a = [
        -3.969683028665376e+01,
        2.209460984245205e+02,
        -2.759285104469687e+02,
        1.38357751867269e+02,
        -3.066479806614716e+01,
        2.506628277459239e+00,
    ];
    const b = [
        -5.447609879822406e+01,
        1.615858368580409e+02,
        -1.556989798598866e+02,
        6.680131188771972e+01,
        -1.328068155288572e+01,
    ];
    const c = [
        -7.784894002430293e-03,
        -3.223964580411365e-01,
        -2.400758277161838e+00,
        -2.549732539343734e+00,
        4.374664141464968e+00,
        2.938163982698783e+00,
    ];
    const d = [
        7.784695709041462e-03,
        3.224671290700398e-01,
        2.445134137142996e+00,
        3.754408661907416e+00,
    ];

    const low = 0.02425;
    const high = 1 - low;

    if (p < low) {
        const q = Math.sqrt(-2 * Math.log(p));
        return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
            ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
    }

    if (p > high) {
        const q = Math.sqrt(-2 * Math.log(1 - p));
        return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
            ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
    }

    const q = p - 0.5;
    const r = q * q;
    return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q /
        (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
};

const roundTo = (value, decimals = 4) => {
    const factor = 10 ** decimals;
    return Math.round(Number(value) * factor) / factor;
};

const normalizedAxisPosition = (index, sampleSize) => {
    if (sampleSize <= 1) {
        return 0;
    }

    return ((index / (sampleSize - 1)) * 2) - 1;
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

const calculateSimpleCorrelationFromPairs = (pairs = []) => {
    if (pairs.length < 3) {
        return null;
    }

    const xs = pairs.map((pair) => Number(pair.x));
    const ys = pairs.map((pair) => Number(pair.y));
    const meanX = xs.reduce((sum, value) => sum + value, 0) / xs.length;
    const meanY = ys.reduce((sum, value) => sum + value, 0) / ys.length;
    let sumXX = 0;
    let sumYY = 0;
    let sumXY = 0;

    for (let index = 0; index < pairs.length; index += 1) {
        const dx = xs[index] - meanX;
        const dy = ys[index] - meanY;
        sumXX += dx ** 2;
        sumYY += dy ** 2;
        sumXY += dx * dy;
    }

    if (!(sumXX > EPSILON) || !(sumYY > EPSILON)) {
        return null;
    }

    return clampCorrelation(sumXY / Math.sqrt(sumXX * sumYY));
};

const buildTutorAxisValues = ({
    sampleSize,
    random,
    span = 1.35,
    jitterScale = 0.065,
}) => (
    Array.from({ length: sampleSize }, (_, index) => {
        const base = normalizedAxisPosition(index, sampleSize) * span;
        const jitter = sampleStandardNormal(random) * jitterScale * span;
        return clampToRange(base + jitter, -span * 1.08, span * 1.08);
    }).sort((left, right) => left - right)
);

const buildLinearTutorPairs = ({
    sampleSize,
    noise,
    slope,
    seedKey,
    residualBase,
    residualNoise,
    span = 1.35,
}) => {
    const random = createSeededRandom(hashSeedParts(seedKey, sampleSize, roundTo(noise, 3)));
    const residualScale = residualBase + (noise * residualNoise);
    const xs = buildTutorAxisValues({
        sampleSize,
        random,
        span,
    });

    return xs.map((x, index) => ({
        id: index,
        x,
        y: clampToRange(
            (slope * x) + (sampleStandardNormal(random) * residualScale),
            -2.2,
            2.2
        ),
    }));
};

const buildNearZeroTutorPairs = ({
    sampleSize,
    noise,
    seedKey,
}) => {
    const threshold = Math.min(0.12, 0.06 + (0.18 / Math.sqrt(sampleSize)));
    let bestPairs = [];
    let bestMagnitude = Number.POSITIVE_INFINITY;

    for (let attempt = 0; attempt < 48; attempt += 1) {
        const random = createSeededRandom(hashSeedParts(seedKey, sampleSize, roundTo(noise, 3), attempt));
        const spreadX = 0.82 + (noise * 0.18);
        const spreadY = 0.82 + (noise * 0.22);
        const candidatePairs = Array.from({ length: sampleSize }, (_, index) => ({
            id: index,
            x: clampToRange(sampleStandardNormal(random) * spreadX, -1.55, 1.55),
            y: clampToRange(sampleStandardNormal(random) * spreadY, -1.55, 1.55),
        }));
        const candidateR = Math.abs(calculateSimpleCorrelationFromPairs(candidatePairs) ?? 1);

        if (candidateR < bestMagnitude) {
            bestPairs = candidatePairs;
            bestMagnitude = candidateR;
        }

        if (candidateR <= threshold) {
            return candidatePairs;
        }
    }

    return bestPairs;
};

const buildNonlinearTutorPairs = ({
    sampleSize,
    noise,
    seedKey,
}) => {
    const random = createSeededRandom(hashSeedParts(seedKey, sampleSize, roundTo(noise, 3)));
    const xs = buildTutorAxisValues({
        sampleSize,
        random,
        span: 1.4,
        jitterScale: 0.045,
    });
    const residualScale = 0.08 + (noise * 0.16);

    return xs.map((x, index) => {
        const scaledX = x / 1.4;
        return {
            id: index,
            x,
            y: clampToRange(
                (1.28 * ((scaledX ** 2) - 0.42)) + (sampleStandardNormal(random) * residualScale),
                -2.2,
                2.2
            ),
        };
    });
};

const takeEvenlySpacedPairs = (pairs = [], targetCount = pairs.length) => {
    if (pairs.length <= targetCount) {
        return pairs.map((pair, index) => ({
            ...pair,
            id: index,
        }));
    }

    return Array.from({ length: targetCount }, (_, index) => {
        const ratio = targetCount <= 1 ? 0 : index / (targetCount - 1);
        const sourceIndex = Math.round(ratio * (pairs.length - 1));
        return {
            ...pairs[sourceIndex],
            id: index,
        };
    });
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
    const xSpan = Math.max(0.75, maxX - minX);
    const ySpan = Math.max(0.75, maxY - minY);
    let x = maxX + (xSpan * 0.28);
    let y = minY - (ySpan * 0.34);

    if (orientation === 'high_x_high_y') {
        y = maxY + (ySpan * 0.34);
    }

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

const buildRestrictedRangeTutorDataset = ({
    sampleSize,
    noise,
}) => {
    const fullPairs = buildLinearTutorPairs({
        sampleSize: Math.max(sampleSize * 8, 220),
        noise: Math.max(0.18, noise),
        slope: 0.95,
        seedKey: 'restricted_range_full',
        residualBase: 0.16,
        residualNoise: 0.36,
        span: 1.42,
    });
    const windowHalfWidth = 0.18;
    const restrictedPairs = fullPairs.filter((pair) => Math.abs(pair.x) <= windowHalfWidth);

    return {
        pairs: takeEvenlySpacedPairs(restrictedPairs, sampleSize),
        contextPairs: fullPairs.map((pair) => ({ ...pair })),
        highlightXRange: {
            min: -windowHalfWidth,
            max: windowHalfWidth,
        },
        outlierOrientation: 'high_x_low_y',
    };
};

export const fisherZTransform = (correlation) => {
    const r = clampCorrelation(correlation);
    return 0.5 * Math.log((1 + r) / (1 - r));
};

export const inverseFisherZ = (zValue) => {
    const expTerm = Math.exp(2 * Number(zValue));
    return clampCorrelation((expTerm - 1) / (expTerm + 1));
};

export const getCorrelationConventionLabel = (correlation) => {
    const magnitude = Math.abs(Number(correlation));

    if (magnitude < 0.1) {
        return 'Very small';
    }

    if (magnitude < 0.3) {
        return 'Small';
    }

    if (magnitude < 0.5) {
        return 'Medium';
    }

    return 'Large';
};

export const buildCorrelationInterpretation = (correlation) => {
    const r = Number(correlation);

    if (!Number.isFinite(r)) {
        return 'Sample correlation r is not available yet.';
    }

    const magnitude = Math.abs(r);

    if (magnitude < 0.05) {
        return 'Near-zero linear association. A curved relationship could still exist.';
    }

    const strength = magnitude < 0.2
        ? 'very weak'
        : magnitude < 0.4
            ? 'weak'
            : magnitude < 0.6
                ? 'moderate'
                : magnitude < 0.8
                    ? 'strong'
                    : 'very strong';
    const direction = r > 0 ? 'positive' : 'negative';

    return `${strength[0].toUpperCase()}${strength.slice(1)} ${direction} linear association.`;
};

export const pairNumericColumns = (xValues = [], yValues = []) => {
    const pairCount = Math.min(xValues.length, yValues.length);
    const pairs = [];

    for (let index = 0; index < pairCount; index += 1) {
        const x = Number(xValues[index]);
        const y = Number(yValues[index]);

        if (Number.isFinite(x) && Number.isFinite(y)) {
            pairs.push({
                id: index,
                index,
                x,
                y,
            });
        }
    }

    return pairs;
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

export const calculatePearsonCorrelationStats = ({
    xValues = [],
    yValues = [],
    alpha = 0.05,
    tails = 2,
    direction = 'greater',
    confidenceLevel = 0.95,
    rho0 = 0,
    skipInfluence = false,
}) => {
    const pairedValues = pairNumericColumns(xValues, yValues);
    const n = pairedValues.length;

    if (n < 3) {
        return {
            ok: false,
            errors: ['Pearson correlation needs at least 3 complete X/Y pairs.'],
            pairs: pairedValues,
            n,
        };
    }

    const xs = pairedValues.map((pair) => pair.x);
    const ys = pairedValues.map((pair) => pair.y);
    const xSummary = summarizeSeries(xs);
    const ySummary = summarizeSeries(ys);

    if (!(xSummary?.sampleSD > EPSILON)) {
        return {
            ok: false,
            errors: ['The X variable has almost no variance, so Pearson r cannot be computed.'],
            pairs: pairedValues,
            n,
        };
    }

    if (!(ySummary?.sampleSD > EPSILON)) {
        return {
            ok: false,
            errors: ['The Y variable has almost no variance, so Pearson r cannot be computed.'],
            pairs: pairedValues,
            n,
        };
    }

    let sumXX = 0;
    let sumYY = 0;
    let sumXY = 0;

    pairedValues.forEach((pair) => {
        const dx = pair.x - xSummary.mean;
        const dy = pair.y - ySummary.mean;
        sumXX += dx ** 2;
        sumYY += dy ** 2;
        sumXY += dx * dy;
    });

    if (!(sumXX > EPSILON) || !(sumYY > EPSILON)) {
        return {
            ok: false,
            errors: ['Pearson r could not be computed because one variable has nearly zero spread.'],
            pairs: pairedValues,
            n,
        };
    }

    const r = clampCorrelation(sumXY / Math.sqrt(sumXX * sumYY));
    const rSquared = Math.max(0, Math.min(1, r ** 2));
    const covariance = sumXY / Math.max(1, n - 1);
    const slope = sumXY / sumXX;
    const intercept = ySummary.mean - (slope * xSummary.mean);
    const residualSS = Math.max(0, sumYY - (slope * sumXY));
    const df = Math.max(1, n - 2);
    const residualMSE = df > 0 ? residualSS / df : 0;
    const residualSE = Math.sqrt(Math.max(0, residualMSE));

    const fittedPairs = pairedValues.map((pair) => {
        const fitted = intercept + (slope * pair.x);
        return {
            ...pair,
            fitted,
            residual: pair.y - fitted,
        };
    });

    const confidenceInterval = calculateCorrelationConfidenceInterval({
        r,
        n,
        confidenceLevel,
    });

    const hypothesisTest = calculateCorrelationHypothesisTest({
        r,
        n,
        alpha,
        tails,
        direction,
        rho0,
    });

    const influence = skipInfluence
        ? {
            influentialIndex: null,
            influentialPoint: null,
            maxDeltaR: 0,
            leaveOneOutR: [],
        }
        : calculateCorrelationInfluence({
            xValues: xs,
            yValues: ys,
            baselineR: r,
        });

    return {
        ok: true,
        alpha,
        tails,
        direction,
        confidenceLevel,
        rho0,
        n,
        pairs: fittedPairs,
        xValues: xs,
        yValues: ys,
        xSummary,
        ySummary,
        meanX: xSummary.mean,
        meanY: ySummary.mean,
        sdX: xSummary.sampleSD,
        sdY: ySummary.sampleSD,
        covariance,
        r,
        rSquared,
        slope,
        intercept,
        df,
        sumXX,
        sumYY,
        sumXY,
        residualSS,
        residualMSE,
        residualSE,
        confidenceInterval,
        hypothesisTest,
        influence,
        interpretation: buildCorrelationInterpretation(r),
        conventionLabel: getCorrelationConventionLabel(r),
    };
};

export const calculateCorrelationConfidenceInterval = ({
    r,
    n,
    confidenceLevel = 0.95,
}) => {
    const resolvedCorrelation = clampCorrelation(r);
    const resolvedConfidence = Number(confidenceLevel);

    if (!(n > 3) || !(resolvedConfidence > 0) || !(resolvedConfidence < 1)) {
        return null;
    }

    const alpha = 1 - resolvedConfidence;
    const zCritical = inverseNormalCDF(1 - (alpha / 2));
    const fisherZ = fisherZTransform(resolvedCorrelation);
    const standardError = 1 / Math.sqrt(n - 3);

    return {
        confidenceLevel: resolvedConfidence,
        lower: inverseFisherZ(fisherZ - (zCritical * standardError)),
        upper: inverseFisherZ(fisherZ + (zCritical * standardError)),
        standardError,
        zCritical,
    };
};

export const calculateCorrelationHypothesisTest = ({
    r,
    n,
    alpha = 0.05,
    tails = 2,
    direction = 'greater',
    rho0 = 0,
}) => {
    const resolvedR = clampCorrelation(r);
    const resolvedNull = clampCorrelation(rho0);

    if (!(n >= 3)) {
        return null;
    }

    if (Math.abs(resolvedNull) < 1e-10) {
        const df = Math.max(1, n - 2);
        const tStatistic = resolvedR * Math.sqrt(df / Math.max(EPSILON, 1 - (resolvedR ** 2)));
        const criticalMagnitude = studentTCriticalValue({ alpha, tails, df });
        const criticalValue = tails === 2
            ? Math.abs(criticalMagnitude)
            : (direction === 'less' ? -Math.abs(criticalMagnitude) : Math.abs(criticalMagnitude));
        const pValue = tails === 2
            ? (1 - studentTCDF(Math.abs(tStatistic), df)) * 2
            : (direction === 'greater' ? (1 - studentTCDF(tStatistic, df)) : studentTCDF(tStatistic, df));

        return {
            method: 'exact_t',
            statisticLabel: 't',
            testStatistic: tStatistic,
            criticalValue,
            pValue,
            df,
        };
    }

    const zStatistic = (fisherZTransform(resolvedR) - fisherZTransform(resolvedNull)) * Math.sqrt(Math.max(1, n - 3));
    const criticalMagnitude = inverseNormalCDF(1 - (tails === 2 ? alpha / 2 : alpha));
    const criticalValue = tails === 2
        ? Math.abs(criticalMagnitude)
        : (direction === 'less' ? -Math.abs(criticalMagnitude) : Math.abs(criticalMagnitude));
    const pValue = tails === 2
        ? (1 - normalCDF(Math.abs(zStatistic))) * 2
        : (direction === 'greater' ? (1 - normalCDF(zStatistic)) : normalCDF(zStatistic));

    return {
        method: 'fisher_z',
        statisticLabel: 'z',
        testStatistic: zStatistic,
        criticalValue,
        pValue,
        df: null,
        referenceLabel: 'Fisher z approximation',
    };
};

export const calculateRegressionBandAtX = ({
    stats,
    x,
    confidenceLevel = 0.95,
}) => {
    if (!stats?.ok || !(stats.n > 2) || !(stats.sumXX > EPSILON)) {
        return null;
    }

    const alpha = 1 - Number(confidenceLevel);

    if (!(alpha > 0) || !(alpha < 1)) {
        return null;
    }

    const criticalValue = studentTCriticalValue({ alpha, tails: 2, df: stats.df });
    const fitted = stats.intercept + (stats.slope * x);
    const leverage = (1 / stats.n) + (((x - stats.meanX) ** 2) / stats.sumXX);
    const margin = criticalValue * Math.sqrt(Math.max(0, stats.residualMSE) * leverage);

    return {
        x,
        fitted,
        lower: fitted - margin,
        upper: fitted + margin,
    };
};

export const buildRegressionBand = ({
    stats,
    confidenceLevel = 0.95,
    pointCount = 36,
}) => {
    if (!stats?.ok) {
        return [];
    }

    const span = Math.max(EPSILON, stats.xSummary.max - stats.xSummary.min);
    const minX = stats.xSummary.min - (span * 0.05);
    const maxX = stats.xSummary.max + (span * 0.05);

    return Array.from({ length: pointCount }, (_, index) => {
        const ratio = pointCount <= 1 ? 0 : index / (pointCount - 1);
        const x = minX + ((maxX - minX) * ratio);
        return calculateRegressionBandAtX({
            stats,
            x,
            confidenceLevel,
        });
    }).filter(Boolean);
};

export const calculateCorrelationInfluence = ({
    xValues = [],
    yValues = [],
    baselineR = null,
}) => {
    const pairedValues = pairNumericColumns(xValues, yValues);

    if (pairedValues.length < 4) {
        return {
            influentialIndex: null,
            influentialPoint: null,
            maxDeltaR: 0,
            leaveOneOutR: [],
        };
    }

    const referenceR = baselineR == null
        ? calculatePearsonCorrelationStats({ xValues, yValues }).r
        : baselineR;
    const leaveOneOutR = pairedValues.map((_, index) => {
        const filteredPairs = pairedValues.filter((pair) => pair.index !== index);
        const reducedStats = calculatePearsonCorrelationStats({
            xValues: filteredPairs.map((pair) => pair.x),
            yValues: filteredPairs.map((pair) => pair.y),
            skipInfluence: true,
        });

        return reducedStats?.ok ? reducedStats.r : null;
    });

    let maxDeltaR = 0;
    let influentialIndex = null;

    leaveOneOutR.forEach((leaveOneOutValue, index) => {
        if (!Number.isFinite(leaveOneOutValue)) {
            return;
        }

        const delta = Math.abs(referenceR - leaveOneOutValue);

        if (delta > maxDeltaR) {
            maxDeltaR = delta;
            influentialIndex = index;
        }
    });

    return {
        influentialIndex,
        influentialPoint: influentialIndex == null ? null : pairedValues[influentialIndex],
        maxDeltaR,
        leaveOneOutR,
    };
};

export const buildCorrelationGuidance = (stats) => {
    if (!stats?.ok) {
        return [];
    }

    const guidance = [
        {
            tone: 'note',
            title: 'Pearson targets linear association',
            body: 'A low r can still happen when the relationship is curved, segmented, or otherwise non-linear.',
        },
        {
            tone: 'note',
            title: 'Inspect the scatterplot',
            body: 'Look for a roughly straight-line pattern before leaning on r as your main summary.',
        },
        {
            tone: 'note',
            title: 'Correlation is not causation',
            body: 'Even a strong correlation does not tell you whether X causes Y or whether a third variable is driving both.',
        },
    ];

    if (stats.xSummary.range <= Math.max(1e-6, stats.xSummary.sampleSD * 0.25) || stats.xSummary.uniqueCount <= 3) {
        guidance.unshift({
            tone: 'warning',
            title: 'X has very limited spread',
            body: 'Restricted or nearly constant X values can make r unstable or misleadingly small.',
        });
    }

    if (stats.ySummary.range <= Math.max(1e-6, stats.ySummary.sampleSD * 0.25) || stats.ySummary.uniqueCount <= 3) {
        guidance.unshift({
            tone: 'warning',
            title: 'Y has very limited spread',
            body: 'Restricted or nearly constant Y values can make r unstable or misleadingly small.',
        });
    }

    if (stats.influence?.maxDeltaR >= 0.15) {
        guidance.unshift({
            tone: 'warning',
            title: 'One point may be highly influential',
            body: `Leaving out the most influential point changes r by about ${roundTo(stats.influence.maxDeltaR, 3)}.`,
        });
    }

    return guidance;
};

export const generatePearsonTutorDataset = ({
    preset = 'strong_positive',
    sampleSize = 36,
    noise = 0.3,
    includeOutlier = false,
}) => {
    const resolvedSampleSize = Math.max(8, Math.round(sampleSize));
    const resolvedNoise = Math.max(0, Math.min(1, Number(noise)));
    let dataset;

    if (preset === 'weak_positive') {
        dataset = {
            pairs: buildLinearTutorPairs({
                sampleSize: resolvedSampleSize,
                noise: resolvedNoise,
                slope: 0.24,
                seedKey: 'weak_positive',
                residualBase: 0.26,
                residualNoise: 0.8,
            }),
            outlierOrientation: 'high_x_low_y',
        };
    } else if (preset === 'near_zero') {
        dataset = {
            pairs: buildNearZeroTutorPairs({
                sampleSize: resolvedSampleSize,
                noise: resolvedNoise,
                seedKey: 'near_zero',
            }),
            outlierOrientation: 'high_x_high_y',
        };
    } else if (preset === 'strong_negative') {
        dataset = {
            pairs: buildLinearTutorPairs({
                sampleSize: resolvedSampleSize,
                noise: resolvedNoise,
                slope: -0.94,
                seedKey: 'strong_negative',
                residualBase: 0.08,
                residualNoise: 0.32,
            }),
            outlierOrientation: 'high_x_high_y',
        };
    } else if (preset === 'nonlinear') {
        dataset = {
            pairs: buildNonlinearTutorPairs({
                sampleSize: resolvedSampleSize,
                noise: resolvedNoise,
                seedKey: 'nonlinear',
            }),
            outlierOrientation: 'high_x_low_y',
        };
    } else if (preset === 'restricted_range') {
        dataset = buildRestrictedRangeTutorDataset({
            sampleSize: resolvedSampleSize,
            noise: resolvedNoise,
        });
    } else {
        dataset = {
            pairs: buildLinearTutorPairs({
                sampleSize: resolvedSampleSize,
                noise: resolvedNoise,
                slope: 0.94,
                seedKey: 'strong_positive',
                residualBase: 0.08,
                residualNoise: 0.32,
            }),
            outlierOrientation: 'high_x_low_y',
        };
    }

    return {
        preset,
        pairs: includeOutlier
            ? injectTutorOutlier({
                pairs: dataset.pairs,
                orientation: dataset.outlierOrientation,
            })
            : dataset.pairs,
        contextPairs: dataset.contextPairs || [],
        highlightXRange: dataset.highlightXRange || null,
    };
};
