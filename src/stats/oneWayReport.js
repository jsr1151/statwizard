import { formatStatistic as number, formatPValue } from '../utils/statFormatters.js';
export function buildOneWayReport({ result, source, excluded = 0 }) {
    if (!result.ok) return '';
    return [
        `${result.inputMode === 'f' ? 'F test from supplied statistic' : 'One-way ANOVA (equal variances)'}. Source: ${source}.`,
        `F(${number(result.df1, 6)}, ${number(result.df2, 6)}) = ${number(result.F, 6)}, p ${formatPValue(result.p)}; alpha = ${result.alpha}.`,
        `${result.isSignificant ? 'Reject' : 'Do not reject'} the null hypothesis. Upper-tail rejection boundary = ${number(result.Fcrit, 6)}.`,
        ...(result.samples || []).map((sample, i) => `Group ${i + 1} (${sample.label}): n = ${sample.n}; mean = ${number(sample.mean, 6)}; sample SD = ${sample.n === 1 ? 'undefined (one observation)' : number(sample.sd, 6)}.`),
        result.samples ? `N = ${result.N}; between-group SS = ${number(result.ssB, 6)}; within-group SS = ${number(result.ssW, 6)}; total SS = ${number(result.ssT, 6)}; between-group MS = ${number(result.msB, 6)}; within-group MS = ${number(result.msW, 6)}; eta squared = ${number(result.eta2, 6)}.` : 'Group means, effect sizes, and pairwise comparisons cannot be recovered from F and degrees of freedom alone.',
        result.samples ? 'Null hypothesis: all population group means are equal. Alternative: at least one differs. Assumes independent observations and equal population variances.' : '',
        result.inputMode === 'raw' ? `${excluded} saved rows excluded. ${result.parsed.map((parsed, i) => `Group ${i + 1}: ${parsed.invalid.length} manual entries excluded; analyzed values: ${parsed.values.join(', ')}.`).join('\n')}` : result.inputMode === 'summary' ? 'Input: summary statistics.' : '',
        result.comparisons.length ? `Bonferroni pairwise comparisons: ${result.comparisons.length} comparisons; pooled ANOVA error variance and residual df = ${result.df2}. ${Math.round((1 - result.alpha) * 100)}% familywise confidence intervals. Differences are first group minus second group.` : '',
        ...result.comparisons.map(pair => `${result.samples[pair.first].label} minus ${result.samples[pair.second].label}: difference = ${number(pair.difference, 6)}; adjusted p ${formatPValue(pair.pAdjusted)}; interval [${number(pair.lower, 6)}, ${number(pair.upper, 6)}].`),
    ].filter(Boolean).join('\n');
}
