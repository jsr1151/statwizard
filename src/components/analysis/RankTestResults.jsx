import { formatPValue, formatStatistic } from '../../utils/statFormatters.js';

import { buildRankReport } from '../../utils/rankReport.js';

export default function RankTestResults({ result, alpha, sourceLabel, darkMode }) {
    const report = buildRankReport(result, alpha, sourceLabel);
    const shownRows = result.rows.slice(0, 100);
    return <section aria-labelledby="rank-results-title" className="space-y-5">
        <h3 id="rank-results-title" className="text-2xl font-bold">Analysis results</h3>
        <p className="break-words">{sourceLabel}</p>
        <div className="grid gap-4 sm:grid-cols-2">
            <div><p className="font-bold">{result.paired ? 'Positive / negative rank sums' : 'Mann–Whitney statistics'}</p><p className="mt-2 text-xl">{result.paired ? `W+ = ${formatStatistic(result.wPlus)}; W− = ${formatStatistic(result.wMinus)}` : `U_A = ${formatStatistic(result.uA)}; U_B = ${formatStatistic(result.uB)}`}</p></div>
            <div><p className="font-bold">{result.alternative} p-value</p><p className="mt-2 text-xl">p {formatPValue(result.p)}</p></div>
        </div>
        <p>{result.method === 'exact' ? 'Exact conditional inference, including observed ties.' : `Normal approximation with tie adjustment; continuity correction ${result.continuity ? 'on' : 'off'}.`}</p>
        <p>{result.paired ? `${result.completePairs} complete pairs; ${result.n} nonzero pairs ranked. Excluded: ${result.excludedPairs} incomplete pairs and ${result.zeroPairs} zero differences.` : `Observed sample sizes: A = ${result.nA}; B = ${result.nB}. Missing entries excluded: A = ${result.excludedA}; B = ${result.excludedB}.`} Tied rank groups: {result.tieGroups}.</p>
        {result.warnings.map(warning => <p key={warning} role="note" className="rounded-xl border p-4">{warning}</p>)}
        <p className="font-bold">{result.p < alpha ? `Reject the null hypothesis at α = ${alpha}.` : `Do not reject the null hypothesis at α = ${alpha}. This does not prove the samples are equivalent.`}</p>
        <p>Rank-biserial correlation = <strong>{formatStatistic(result.effect)}</strong>. Positive values favor larger A values{result.paired ? ' within pairs' : ' over B'}; negative values favor B. {result.paired ? 'This describes the balance of positive versus negative ranks among nonzero differences.' : `The observed proportion of A–B comparisons favoring A, counting ties as one half, is ${formatStatistic(result.superiority)}.`} This is an effect estimate, not a probability that the null hypothesis is true.</p>
        <details>
            <summary className="cursor-pointer py-3 font-bold">Inspect the ranks</summary>
            <p className="my-3">Showing {shownRows.length} of {result.rows.length} rows. Inference uses every retained observation. Entries keep their original order within each input sample.</p>
            <div role="region" aria-label="Rank calculation table" tabIndex={0} className="overflow-x-auto rounded-xl border">
                <table className="w-full text-left text-sm">
                    <caption className="p-3 text-left">{result.paired ? 'Zero differences have no rank; incomplete pairs are excluded.' : 'Average pooled ranks are assigned to ties.'}</caption>
                    <thead><tr>{(result.paired ? ['Pair', 'A', 'B', 'A − B', 'Absolute rank'] : ['Sample', 'Entry', 'Value', 'Rank']).map(label => <th scope="col" key={label} className="whitespace-nowrap p-3">{label}</th>)}</tr></thead>
                    <tbody>{shownRows.map((row, index) => <tr key={index} className="border-t">{(result.paired ? [row.row, row.a, row.b, row.difference, row.rank ?? 'Zero: omitted'] : [row.sample, row.row, row.value, row.rank]).map((value, cell) => <td key={cell} className="whitespace-nowrap p-3">{value}</td>)}</tr>)}</tbody>
                </table>
            </div>
        </details>
        <label className="block font-bold">Report text
            <textarea readOnly rows={8} value={report} className={`mt-2 w-full rounded-xl border p-4 text-sm font-normal ${darkMode ? 'bg-slate-950 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'}`} />
        </label>
        <p>Select and copy the report, then add study context and your assumption checks. A location/median interpretation needs additional distributional assumptions.</p>
    </section>;
}
