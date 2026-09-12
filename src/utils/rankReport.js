import { formatPValue, formatStatistic } from './statFormatters.js';

export function buildRankReport(result, alpha, sourceLabel) {
    const statistic = result.paired ? `W+ = ${formatStatistic(result.wPlus)}, W− = ${formatStatistic(result.wMinus)}` : `U_A = ${formatStatistic(result.uA)}, U_B = ${formatStatistic(result.uB)}`;
    const counts = result.paired ? `${result.completePairs} complete pairs; ${result.n} nonzero pairs; ${result.excludedPairs} missing pairs excluded; ${result.zeroPairs} zero differences omitted before ranking`
        : `n_A = ${result.nA}, n_B = ${result.nB}; missing entries excluded: A = ${result.excludedA}, B = ${result.excludedB}`;
    return `${result.paired ? 'Wilcoxon signed-rank' : 'Mann–Whitney U'} test. ${sourceLabel}. ${counts}. ${statistic}; ${result.alternative} p ${formatPValue(result.p)}; alpha = ${alpha}. ${result.method === 'exact' ? 'Exact conditional inference' : `Tie-adjusted normal approximation; continuity correction ${result.continuity ? 'on' : 'off'}`}. ${result.tieGroups} tied rank groups. Rank-biserial correlation (positive favors A) = ${formatStatistic(result.effect)}.${result.paired ? ` Differences = A − B; rounding = ${result.differenceDecimals === null ? 'none' : result.differenceDecimals + ' decimal places'}.` : ''} ${result.p < alpha ? 'Reject the null hypothesis at the selected alpha.' : 'Do not reject the null hypothesis at the selected alpha; this does not establish equivalence.'} Assumptions require a separate review. No confidence interval is calculated.`;
}
