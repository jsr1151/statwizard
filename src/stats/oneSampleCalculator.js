import { calculateOneSampleTest } from './oneSampleTest.js';
import { parseNumericInput } from './centralTendency.js';

const numericEntry = value => String(value).trim() === '' ? NaN : Number(value);
export const calculateOneSampleCalculator = ({ inputMode, raw, summary, nullMean, alpha, tails, direction, ciType }) => {
    const parsed = parseNumericInput(raw);
    let mean = numericEntry(summary.mean), sd = numericEntry(summary.sd), n = numericEntry(summary.n);
    if (inputMode === 'raw') {
        n = parsed.values.length;
        mean = parsed.values.reduce((sum, value) => sum + value, 0) / n;
        sd = Math.sqrt(parsed.values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / (n - 1));
    }
    const mu = numericEntry(nullMean);
    const errors = [];
    if (!Number.isSafeInteger(n) || n < 2) errors.push('Enter at least two observations, or a whole-number sample size of 2 or more.');
    if (!Number.isFinite(mean)) errors.push('Enter a finite sample mean.');
    if (!Number.isFinite(sd) || sd <= 0) errors.push('The sample standard deviation must be greater than zero.');
    if (!Number.isFinite(mu)) errors.push('Enter a finite null population mean.');
    if (![0.1, 0.05, 0.01].includes(alpha) || ![1, 2].includes(tails) || !['greater', 'less'].includes(direction) || !['two-sided', 'one-sided'].includes(ciType)) errors.push('Choose valid test settings.');
    if (errors.length) return { ok: false, errors, parsed };
    const se = sd / Math.sqrt(n), t = (mean - mu) / se, df = n - 1;
    if (![se, t].every(Number.isFinite) || se <= 0) return { ok: false, errors: ['These values exceed the supported numeric range. Rescale the data and null mean.'], parsed };
    const model = calculateOneSampleTest({ type: 't', mean, spread: sd, n, nullMean: mu, statistic: t, df, alpha, tails, direction, ciType });
    const finiteBounds = ciType === 'two-sided' ? Object.values(model.confidenceInterval)
        : [direction === 'greater' ? model.confidenceInterval.lower : model.confidenceInterval.upper];
    if (![model.pValue, model.criticalValue, ...finiteBounds].every(Number.isFinite)) return { ok: false, errors: ['These values exceed the supported numeric range. Rescale the data and null mean.'], parsed };
    return {
        ...model, ok: true, parsed, mean, sd, n, mu, t, df, se, p: model.pValue,
        xBar: mean, sigma: sd, s: sd, crit: model.criticalValue,
        alpha, tails, direction, ciType, isSignificant: model.pValue < alpha,
    };
};
