import { getTCrit, normalCDF, tCDF } from '../utils/mathHelpers';

const Z_CRITICAL_VALUES = {
    twoSided: { 0.01: 2.576, 0.05: 1.96, 0.1: 1.645 },
    oneSided: { 0.01: 2.326, 0.05: 1.645, 0.1: 1.282 },
};

export const getOneSampleCriticalValue = ({
    alpha,
    df,
    direction = 'greater',
    tails = 2,
    type = 'z',
}) => {
    const magnitude = type === 't'
        ? Math.abs(getTCrit(alpha, df, tails))
        : (tails === 2
            ? Z_CRITICAL_VALUES.twoSided[alpha]
            : Z_CRITICAL_VALUES.oneSided[alpha]);
    const resolvedMagnitude = magnitude ?? (tails === 2 ? 1.96 : 1.645);

    return tails === 1 && direction === 'less'
        ? -resolvedMagnitude
        : resolvedMagnitude;
};

export const getOneSamplePValue = ({
    df,
    direction = 'greater',
    statistic,
    tails = 2,
    type = 'z',
}) => {
    const cdf = type === 't'
        ? (value) => tCDF(value, df)
        : normalCDF;

    if (tails === 2) {
        return Math.abs(statistic) > 0
            ? Math.min(1, 2 * (1 - cdf(Math.abs(statistic))))
            : 1;
    }

    return direction === 'greater'
        ? 1 - cdf(statistic)
        : cdf(statistic);
};

export const calculateOneSampleTest = ({
    alpha,
    ciType = 'two-sided',
    df,
    direction = 'greater',
    mean,
    n,
    nullMean,
    spread,
    statistic,
    tails = 2,
    type = 'z',
}) => {
    const criticalValue = getOneSampleCriticalValue({ alpha, df, direction, tails, type });
    const pValue = getOneSamplePValue({ df, direction, statistic, tails, type });
    const standardError = spread / Math.sqrt(n);
    const delta = mean - nullMean;
    const effectSize = delta / spread;
    const isSignificant = tails === 2
        ? Math.abs(statistic) >= Math.abs(criticalValue) - 0.001
        : (direction === 'greater'
            ? statistic >= criticalValue - 0.001
            : statistic <= criticalValue + 0.001);
    const ciTails = ciType === 'two-sided' ? 2 : 1;
    const ciCriticalValue = getOneSampleCriticalValue({
        alpha,
        df,
        direction,
        tails: ciTails,
        type,
    });
    const ciBound = Math.abs(ciCriticalValue) * standardError;

    return {
        criticalValue,
        pValue,
        standardError,
        delta,
        effectSize,
        isSignificant,
        confidenceInterval: {
            lower: ciType === 'two-sided'
                ? mean - ciBound
                : (direction === 'greater' ? mean - ciBound : -Infinity),
            upper: ciType === 'two-sided'
                ? mean + ciBound
                : (direction === 'greater' ? Infinity : mean + ciBound),
        },
    };
};

export const summarizeRawSample = (text, precision = 2) => {
    const values = String(text)
        .replace(/,/g, ' ')
        .split(/\s+/)
        .map(Number)
        .filter(Number.isFinite);

    if (values.length < 2) return null;

    const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
    const variance = values.reduce((sum, value) => sum + (value - mean) ** 2, 0)
        / (values.length - 1);

    return {
        n: values.length,
        mean: Number(mean.toFixed(precision)),
        standardDeviation: Number(Math.sqrt(variance).toFixed(3)),
        values,
    };
};
