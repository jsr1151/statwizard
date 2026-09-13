import { fCDF, fPPF, tCDF, getTCrit } from '../utils/mathHelpers.js';
import { parseNumericInput } from './centralTendency.js';
import { MAX_ANOVA_GROUPS } from '../utils/oneWayDraft.js';

const numeric = value => String(value).trim() === '' ? NaN : Number(value);
export const oneWaySeedGroups = seed => seed.groups.map(group => ({ label: group.label, raw: group.values.join(', ') }));
export function calculateOneWayCalculator({ groups = [], inputMode, f, alpha, showComparisons }) {
    const errors = [];
    const parsed = groups.map(group => parseNumericInput(group.raw || ''));
    const invalid = message => ({ ok: false, errors: message ? [message] : errors, parsed });
    if (!['raw', 'summary', 'f'].includes(inputMode) || ![.1, .05, .01].includes(alpha)) return invalid('Choose valid ANOVA settings.');
    let model;
    if (inputMode === 'f') {
        const F = numeric(f.F), df1 = numeric(f.df1), df2 = numeric(f.df2);
        if (!Number.isFinite(F) || F < 0) errors.push('Enter a finite, nonnegative F statistic.');
        if (![df1, df2].every(value => Number.isFinite(value) && value > 0)) errors.push('Both degrees of freedom must be finite and greater than zero.');
        if (errors.length) return invalid();
        model = { F, df1, df2 };
    } else {
        if (groups.length < 2 || groups.length > MAX_ANOVA_GROUPS) return invalid(`Enter between 2 and ${MAX_ANOVA_GROUPS} groups.`);
        const samples = groups.map((group, index) => {
            if (inputMode === 'summary') return { label: group.label.trim() || `Group ${index + 1}`, mean: numeric(group.mean), sd: numeric(group.sd), n: numeric(group.n) };
            const values = parsed[index].values, n = values.length;
            const mean = values.reduce((sum, value) => sum + value, 0) / n;
            const sd = n === 1 ? 0 : Math.sqrt(values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / (n - 1));
            return { label: group.label.trim() || `Group ${index + 1}`, mean, sd, n };
        });
        samples.forEach((sample, index) => {
            if (!Number.isSafeInteger(sample.n) || sample.n < (inputMode === 'raw' ? 1 : 2)) errors.push(`Group ${index + 1} needs ${inputMode === 'raw' ? 'at least one usable observation' : 'a whole-number sample size of at least 2'}.`);
            if (!Number.isFinite(sample.mean) || !Number.isFinite(sample.sd) || sample.sd < 0) errors.push(`Group ${index + 1} needs a finite mean and nonnegative sample standard deviation.`);
        });
        if (errors.length) return invalid();
        const N = samples.reduce((sum, sample) => sum + sample.n, 0), k = samples.length;
        const grandMean = samples.reduce((sum, sample) => sum + sample.n * sample.mean, 0) / N;
        const ssB = samples.reduce((sum, sample) => sum + sample.n * (sample.mean - grandMean) ** 2, 0);
        const ssW = samples.reduce((sum, sample) => sum + (sample.n - 1) * sample.sd ** 2, 0);
        const df1 = k - 1, df2 = N - k, msB = ssB / df1, msW = ssW / df2;
        if (df2 <= 0 || msW <= 0) return invalid('ANOVA requires positive residual degrees of freedom and within-group variability. Add observations or check constant groups.');
        model = { samples, N, k, grandMean, ssB, ssW, ssT: ssB + ssW, msB, msW, df1, df2, F: msB / msW, eta2: ssB / (ssB + ssW) };
        if (![N, grandMean, ssB, ssW, msB, msW, model.eta2].every(Number.isFinite) || !Number.isSafeInteger(N)) return invalid('These values exceed the supported numeric range. Rescale the data.');
    }
    // The reciprocal F identity evaluates the upper tail without subtracting a nearly-one CDF.
    const p = model.F === 0 ? 1 : fCDF(1 / model.F, model.df2, model.df1), Fcrit = fPPF(1 - alpha, model.df1, model.df2);
    if (![model.F, p, Fcrit].every(Number.isFinite) || p < 0 || p > 1 || Fcrit <= 0 || Math.abs(fCDF(Fcrit, model.df1, model.df2) - (1 - alpha)) > 1e-7) return invalid('These values exceed the supported numeric range. Rescale the inputs.');
    const comparisons = [];
    if (showComparisons && inputMode !== 'f') {
        const count = model.k * (model.k - 1) / 2, critical = getTCrit(alpha / count, model.df2);
        for (let i = 0; i < model.k; i++) for (let j = i + 1; j < model.k; j++) {
            const first = model.samples[i], second = model.samples[j];
            const difference = first.mean - second.mean, se = Math.sqrt(model.msW * (1 / first.n + 1 / second.n));
            const t = difference / se, pAdjusted = Math.min(1, 2 * tCDF(-Math.abs(t), model.df2) * count);
            const lower = difference - critical * se, upper = difference + critical * se;
            if (![difference, se, t, pAdjusted, lower, upper].every(Number.isFinite)) return invalid('Pairwise comparisons exceed the supported numeric range. Rescale the data.');
            comparisons.push({ first: i, second: j, difference, t, pAdjusted, lower, upper, significant: pAdjusted < alpha });
        }
    }
    return { ...model, ok: true, valid: true, alpha, inputMode, parsed, p, Fcrit, comparisons, isSignificant: p < alpha, mode: inputMode === 'f' ? 'calc' : 'data', fVal: model.F, dfB: model.df1, dfW: model.df2 };
}
