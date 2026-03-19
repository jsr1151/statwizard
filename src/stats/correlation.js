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

const sequenceValue = (index, sampleSize, frequency, phase = 0) => {
    const ratio = sampleSize <= 1 ? 0 : index / (sampleSize - 1);
    return (
        Math.sin((ratio * Math.PI * frequency) + phase) +
        0.45 * Math.cos((ratio * Math.PI * (frequency + 1.3)) + (phase * 1.7))
    );
};

const normalizedAxisPosition = (index, sampleSize) => {
    if (sampleSize <= 1) {
        return 0;
    }

    return ((index / (sampleSize - 1)) * 2) - 1;
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
        return 'Pearson r is not available yet.';
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
            body: 'Look for a roughly straight-line pattern before leaning on Pearson r as your main summary.',
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
            body: 'Restricted or nearly constant X values can make Pearson r unstable or misleadingly small.',
        });
    }

    if (stats.ySummary.range <= Math.max(1e-6, stats.ySummary.sampleSD * 0.25) || stats.ySummary.uniqueCount <= 3) {
        guidance.unshift({
            tone: 'warning',
            title: 'Y has very limited spread',
            body: 'Restricted or nearly constant Y values can make Pearson r unstable or misleadingly small.',
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
    includeOutlier = true,
}) => {
    const resolvedSampleSize = Math.max(8, Math.round(sampleSize));
    const resolvedNoise = Math.max(0, Math.min(1, Number(noise)));
    const pairs = [];

    for (let index = 0; index < resolvedSampleSize; index += 1) {
        const baseX = normalizedAxisPosition(index, resolvedSampleSize);
        const xJitter = resolvedNoise * 0.12 * sequenceValue(index, resolvedSampleSize, 4.2, 0.35);
        let x = baseX + xJitter;
        let y = 0;

        if (preset === 'strong_positive') {
            y = (0.96 * baseX) + (resolvedNoise * 0.28 * sequenceValue(index, resolvedSampleSize, 3.4, 0.6));
        } else if (preset === 'weak_positive') {
            y = (0.34 * baseX) + (resolvedNoise * 0.72 * sequenceValue(index, resolvedSampleSize, 4.6, 1.1));
        } else if (preset === 'near_zero') {
            y = (
                0.58 * sequenceValue(index, resolvedSampleSize, 5.8, 0.9) +
                resolvedNoise * 0.45 * sequenceValue(index, resolvedSampleSize, 8.1, 1.8)
            );
        } else if (preset === 'strong_negative') {
            y = (-0.95 * baseX) + (resolvedNoise * 0.3 * sequenceValue(index, resolvedSampleSize, 3.1, 0.45));
        } else if (preset === 'nonlinear') {
            y = (1.7 * (baseX ** 2)) - 0.65 + (resolvedNoise * 0.22 * sequenceValue(index, resolvedSampleSize, 6.2, 0.8));
        } else if (preset === 'outlier') {
            y = (0.88 * baseX) + (resolvedNoise * 0.24 * sequenceValue(index, resolvedSampleSize, 3.7, 0.2));
        } else if (preset === 'restricted_range') {
            x = (baseX * 0.32) + (resolvedNoise * 0.04 * sequenceValue(index, resolvedSampleSize, 5.2, 0.4));
            y = (0.92 * baseX) + (resolvedNoise * 0.44 * sequenceValue(index, resolvedSampleSize, 3.9, 1.25));
        }

        pairs.push({
            id: index,
            x,
            y,
        });
    }

    if (preset === 'outlier' && includeOutlier) {
        pairs.push({
            id: resolvedSampleSize,
            x: 1.55,
            y: -1.25,
            isSyntheticOutlier: true,
        });
    }

    return pairs;
};
