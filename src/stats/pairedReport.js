import { formatStatistic, formatPValue } from '../utils/statFormatters.js';
export const formatPairedBound = value => value === Infinity ? 'Infinity' : value === -Infinity ? '-Infinity' : formatStatistic(value, 6);
export const formatPairedInterval = result => `${Math.round((1-result.alpha)*100)}% ${result.ciType} confidence interval for the population mean difference (Condition 1 minus Condition 2): [${formatPairedBound(result.ciLower)}, ${formatPairedBound(result.ciUpper)}].`;
const bound = formatPairedBound;
export const buildPairedReport = ({ result, source, labels, inputMode, savedExcluded }) => {
    return result.ok ? [
        `Paired-samples t-test. Source: ${source}.`,
        `Comparison: Condition 1 minus Condition 2 (${labels[0]} minus ${labels[1]}). Null mean difference = 0.`,
        `Complete pairs = ${result.n}; mean difference = ${formatStatistic(result.dBar, 6)}; sample SD of differences = ${formatStatistic(result.sd, 6)}.`,
        `Condition 1: mean = ${formatStatistic(result.mean1, 6)}, sample SD = ${formatStatistic(result.sd1, 6)}. Condition 2: mean = ${formatStatistic(result.mean2, 6)}, sample SD = ${formatStatistic(result.sd2, 6)}.`,
        `Within-pair correlation = ${result.r === null ? 'undefined (constant condition)' : formatStatistic(result.r, 6)}.`,
        `Alternative: mean difference ${result.tails === 2 ? 'differs from' : result.direction === 'greater' ? 'is greater than' : 'is less than'} 0; alpha = ${result.alpha}.`,
        `t(${result.df}) = ${formatStatistic(result.t, 6)}, p ${formatPValue(result.p)}; Cohen's dz = ${formatStatistic(result.dz, 6)} (sample SD of differences).`,
        `${Math.round((1-result.alpha)*100)}% ${result.ciType} confidence interval for the population mean difference: [${bound(result.ciLower)}, ${bound(result.ciUpper)}].`,
        savedExcluded !== undefined ? `${savedExcluded} saved rows excluded.` : inputMode === 'raw' ? `${result.review.dropped} input rows excluded.` : 'Input: paired summary statistics.',
        inputMode === 'raw' ? `Analyzed pairs (Condition 1, Condition 2):\n${result.review.pairs.map(pair => `${pair.first},${pair.second}`).join('\n')}` : '',
    ].filter(Boolean).join('\n') : '';
};
