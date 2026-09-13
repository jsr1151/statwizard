import { calculateIndependentTTest } from './independentTTest.js';
import { parseNumericInput } from './centralTendency.js';

const numericEntry = value => String(value).trim() === '' ? NaN : Number(value);
export const calculateIndependentCalculator = ({ groups, inputMode, testType, alpha, tails, direction, ciType }) => {
    const parsed = groups.map(group => parseNumericInput(group.raw));
    const samples = groups.map((group, index) => {
        if (inputMode !== 'raw') return { xBar: numericEntry(group.mean), s: numericEntry(group.sd), n: numericEntry(group.n) };
        const values = parsed[index].values, n = values.length;
        const xBar = values.reduce((sum, value) => sum + value, 0) / n;
        const s = Math.sqrt(values.reduce((sum, value) => sum + (value - xBar) ** 2, 0) / (n - 1));
        return { xBar, s, n };
    });
    const errors = samples.flatMap((sample, i) => [
        ...(!Number.isSafeInteger(sample.n) || sample.n < 2 ? [`Group ${i + 1} needs a whole-number sample size of at least 2.`] : []),
        ...(!Number.isFinite(sample.xBar) ? [`Group ${i + 1} needs a finite sample mean.`] : []),
        ...(!Number.isFinite(sample.s) || sample.s < 0 ? [`Group ${i + 1} needs a finite, nonnegative sample standard deviation.`] : []),
    ]);
    if (!['student', 'welch'].includes(testType) || ![0.1, 0.05, 0.01].includes(alpha) || ![1, 2].includes(tails) || !['greater', 'less'].includes(direction) || !['two-sided', 'one-sided'].includes(ciType)) errors.push('Choose valid test settings.');
    if (errors.length) return { ok: false, errors, parsed };
    if (samples.every(sample => sample.s === 0)) return { ok: false, errors: ['Both groups have zero variability. A t-test requires a positive standard error.'], parsed };
    const [group1, group2] = samples;
    const model = calculateIndependentTTest({ group1, group2, testType, alpha, tails, direction, ciType });
    const bounds = ciType === 'two-sided' ? [model.ciLower, model.ciUpper] : [direction === 'greater' ? model.ciLower : model.ciUpper];
    if (![model.t, model.df, model.se, model.p, model.cohenD, model.criticalValue, ...bounds].every(Number.isFinite) || model.se <= 0 || model.df <= 0) return { ok: false, errors: ['These values exceed the supported numeric range. Rescale the data.'], parsed };
    return { ...model, parsed, samples, isSignificant: model.p < alpha, confidenceInterval: { lower: model.ciLower, upper: model.ciUpper },
        crit: model.criticalValue, d: model.cohenD, g: model.hedgesG, pooledVar: model.pooledVariance,
        n1: group1.n, n2: group2.n, x1: group1.xBar, x2: group2.xBar, s1: group1.s, s2: group2.s };
};
