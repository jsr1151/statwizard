import { getTCrit, normalCDF, tCDF } from '../utils/mathHelpers.js';

const clampProbability = (value) => Math.max(0, Math.min(1, value));

export const summarizeIndependentSample = (raw = '') => {
    const values = String(raw)
        .split(/[,\s]+/)
        .filter(Boolean)
        .map(Number)
        .filter(Number.isFinite);

    if (values.length < 2) return { ok: false, raw: String(raw), values };
    const n = values.length;
    const mean = values.reduce((sum, value) => sum + value, 0) / n;
    const variance = values.reduce((sum, value) => sum + ((value - mean) ** 2), 0) / (n - 1);

    return {
        ok: true,
        raw: String(raw),
        values,
        xBar: mean,
        s: Math.sqrt(variance),
        n,
    };
};

export const calculateIndependentTTest = ({
    group1,
    group2,
    testType = 'student',
    alpha = 0.05,
    tails = 2,
    direction = 'greater',
    ciType = 'two-sided',
}) => {
    const groupsAreValid = [group1, group2].every((group) => (
        Number.isFinite(group?.xBar)
        && Number.isFinite(group?.s)
        && group.s >= 0
        && Number.isFinite(group?.n)
        && group.n >= 2
    ));
    if (!groupsAreValid) return { ok: false, errors: ['Each group needs a finite mean, nonnegative SD, and n ≥ 2.'] };

    const delta = group1.xBar - group2.xBar;
    const pooledDf = group1.n + group2.n - 2;
    const pooledVariance = (
        ((group1.n - 1) * (group1.s ** 2))
        + ((group2.n - 1) * (group2.s ** 2))
    ) / pooledDf;
    const pooledSe = Math.sqrt(pooledVariance * ((1 / group1.n) + (1 / group2.n)));
    const group1VarianceTerm = (group1.s ** 2) / group1.n;
    const group2VarianceTerm = (group2.s ** 2) / group2.n;
    const welchSe = Math.sqrt(group1VarianceTerm + group2VarianceTerm);
    const welchDenominator = ((group1VarianceTerm ** 2) / (group1.n - 1))
        + ((group2VarianceTerm ** 2) / (group2.n - 1));
    const welchDf = welchDenominator > 0
        ? ((group1VarianceTerm + group2VarianceTerm) ** 2) / welchDenominator
        : pooledDf;
    const usesWelch = testType === 'welch';
    const se = usesWelch ? welchSe : pooledSe;
    const df = usesWelch ? welchDf : pooledDf;
    const t = se > 0 ? delta / se : delta === 0 ? 0 : Math.sign(delta) * Number.POSITIVE_INFINITY;
    const criticalMagnitude = Math.abs(getTCrit(alpha, df, tails));
    const criticalValue = direction === 'greater' ? criticalMagnitude : -criticalMagnitude;
    const p = clampProbability(tails === 2
        ? 2 * (1 - tCDF(Math.abs(t), df))
        : direction === 'greater' ? 1 - tCDF(t, df) : tCDF(t, df));
    const isSignificant = tails === 2
        ? Math.abs(t) >= criticalMagnitude
        : direction === 'greater' ? t >= criticalValue : t <= criticalValue;
    const ciTails = ciType === 'two-sided' ? 2 : 1;
    const ciCritical = Math.abs(getTCrit(alpha, df, ciTails));
    const ciBound = ciCritical * se;
    const ciLower = ciType === 'two-sided' || direction === 'greater'
        ? delta - ciBound
        : Number.NEGATIVE_INFINITY;
    const ciUpper = ciType === 'two-sided' || direction === 'less'
        ? delta + ciBound
        : Number.POSITIVE_INFINITY;
    const pooledSd = Math.sqrt(pooledVariance);
    const cohenD = pooledSd > 0 ? Math.abs(delta) / pooledSd : delta === 0 ? 0 : Number.POSITIVE_INFINITY;
    const hedgesCorrection = 1 - (3 / ((4 * (group1.n + group2.n)) - 9));
    const hedgesG = cohenD * hedgesCorrection;

    return {
        ok: true,
        testType: usesWelch ? 'welch' : 'student',
        alpha,
        tails,
        direction,
        delta,
        pooledVariance,
        pooledSe,
        welchSe,
        se,
        t,
        df,
        p,
        criticalValue,
        criticalMagnitude,
        isSignificant,
        ciType,
        ciLower,
        ciUpper,
        cohenD,
        hedgesG,
        sem1: group1.s / Math.sqrt(group1.n),
        sem2: group2.s / Math.sqrt(group2.n),
        deltaCritical: criticalMagnitude * se,
        overlapPercent: 2 * normalCDF(-cohenD / 2) * 100,
        varianceRatio: Math.min(group1.s, group2.s) > 0
            ? Math.max(group1.s ** 2, group2.s ** 2) / Math.min(group1.s ** 2, group2.s ** 2)
            : Number.POSITIVE_INFINITY,
    };
};

export const buildIndependentTTestReport = ({ result, showCI = false }) => {
    if (!result?.ok) return 'Independent-samples t-test unavailable.';
    const confidencePercent = Math.round((1 - result.alpha) * 100);
    let confidenceText = '';
    if (showCI && result.ciType === 'two-sided') {
        confidenceText = `, ${confidencePercent}% CI [${result.ciLower.toFixed(2)}, ${result.ciUpper.toFixed(2)}]`;
    } else if (showCI && result.direction === 'greater') {
        confidenceText = `, ${confidencePercent}% lower confidence bound > ${result.ciLower.toFixed(2)}`;
    } else if (showCI) {
        confidenceText = `, ${confidencePercent}% upper confidence bound < ${result.ciUpper.toFixed(2)}`;
    }
    const df = Number.isInteger(result.df) ? result.df.toFixed(0) : result.df.toFixed(2);
    const p = result.p < 0.001 ? '< .001' : `= ${result.p.toFixed(3).replace(/^0/, '')}`;
    const prefix = result.testType === 'welch' ? "Welch's independent-samples" : 'Independent-samples';
    return `${prefix} t-test, t(${df}) = ${result.t.toFixed(2)}, p ${p}, d = ${result.cohenD.toFixed(2)}${confidenceText}.`;
};
