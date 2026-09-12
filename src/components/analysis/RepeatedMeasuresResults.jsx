import { formatPValue, formatStatistic as fmt } from '../../utils/statFormatters.js';
import { buildRepeatedMeasuresReport } from '../../utils/repeatedMeasuresReport.js';

export default function RepeatedMeasuresResults({ result, correction, alpha, source, darkMode }) {
    const selected = result.corrections.find(row => row.id === correction);
    const mauchly = result.sphericity.mauchly;
    return <section className="space-y-5" aria-labelledby="rm-results-title">
        <h3 id="rm-results-title" className="text-2xl font-bold">Repeated-measures results</h3>
        <p className="break-words">{source}</p>
        <p><strong>{result.n} complete participants</strong> across {result.k} conditions. {result.excluded.length} of {result.inputParticipants} participants excluded for incomplete measurements.</p>
        <p className="text-xl font-bold">{selected.label}: F({fmt(selected.numeratorDf)}, {fmt(selected.denominatorDf)}) = {fmt(result.f)}, p {formatPValue(selected.p)}</p>
        <p>{selected.p < alpha ? `Reject equal condition means at α = ${alpha}.` : `Do not reject equal condition means at α = ${alpha}. This does not establish equivalence.`} The omnibus test does not identify which conditions differ.</p>
        <div role="region" aria-label="Repeated-measures ANOVA table" tabIndex={0} className="overflow-x-auto rounded-xl border">
            <table className="w-full text-left text-sm"><caption className="p-3 text-left font-bold">Uncorrected sums-of-squares decomposition</caption>
                <thead><tr>{['Source', 'SS', 'df', 'MS', 'F'].map(label => <th key={label} scope="col" className="whitespace-nowrap p-3">{label}</th>)}</tr></thead>
                <tbody>{[
                    ['Condition', result.ssCondition, result.df1, result.msCondition, result.f],
                    ['Participant', result.ssSubject, result.n-1, result.ssSubject/(result.n-1), null],
                    ['Within-participant error', result.ssError, result.df2, result.msError, null],
                    ['Total', result.ssTotal, result.n*result.k-1, null, null],
                ].map(row => <tr key={row[0]} className="border-t">{row.map((value,i) => <td key={i} className="whitespace-nowrap p-3">{i===0 ? value : value === null ? '—' : fmt(value)}</td>)}</tr>)}</tbody>
            </table>
        </div>
        <div role="region" aria-label="Sphericity corrections" tabIndex={0} className="overflow-x-auto rounded-xl border">
            <table className="w-full text-left text-sm"><caption className="p-3 text-left font-bold">Corrections change degrees of freedom and p; F stays the same</caption>
                <thead><tr>{['Correction', 'Epsilon', 'Numerator df', 'Denominator df', 'p'].map(label => <th key={label} scope="col" className="whitespace-nowrap p-3">{label}</th>)}</tr></thead>
                <tbody>{result.corrections.map(row => <tr key={row.id} className="border-t"><th scope="row" className="whitespace-nowrap p-3">{row.label}{row.id===correction ? ' (selected)' : ''}</th><td className="p-3">{fmt(row.epsilon,4)}</td><td className="p-3">{fmt(row.numeratorDf)}</td><td className="p-3">{fmt(row.denominatorDf)}</td><td className="whitespace-nowrap p-3">{formatPValue(row.p)}</td></tr>)}</tbody>
            </table>
        </div>
        <p>{mauchly.available ? `Mauchly’s test: W = ${fmt(mauchly.w,4)}, approximate p ${formatPValue(mauchly.p)}. A nonsignificant test does not prove sphericity. The selected correction is not automatically changed by this diagnostic.` : mauchly.reason}</p>
        <p>Partial eta squared = <strong>{fmt(result.partialEtaSquared,4)}</strong>; generalized eta squared = <strong>{fmt(result.generalizedEtaSquared,4)}</strong>. Partial eta squared excludes participant variation from its denominator; generalized eta squared includes it for this one-factor design. Neither is a probability that the null hypothesis is true.</p>
        <div role="region" aria-label="Condition summaries" tabIndex={0} className="overflow-x-auto rounded-xl border"><table className="w-full text-left text-sm"><caption className="p-3 text-left">Condition summaries use the same complete participants</caption><thead><tr><th scope="col" className="p-3">Condition</th><th scope="col" className="p-3">Mean</th><th scope="col" className="p-3">SD</th></tr></thead><tbody>{result.summaries.map(row => <tr key={row.label} className="border-t"><th scope="row" className="p-3">{row.label}</th><td className="p-3">{fmt(row.mean)}</td><td className="p-3">{fmt(row.sd)}</td></tr>)}</tbody></table></div>
        {result.excluded.length > 0 && <details><summary className="cursor-pointer py-3 font-bold">Review excluded participants ({result.excluded.length})</summary><ul className="list-disc space-y-2 pl-6">{result.excluded.slice(0,100).map(row => <li key={row.id}>{row.id}: missing {row.conditions.join(', ')}</li>)}</ul>{result.excluded.length>100 && <p>Showing the first 100 excluded IDs; the total above includes all exclusions.</p>}<p className="mt-3">Complete-participant exclusion can bias estimates when missingness is informative. Consider an appropriate mixed model when this analysis is not suitable.</p></details>}
        <details><summary className="cursor-pointer py-3 font-bold">Inspect participant matching</summary><p className="my-3">Showing the first {Math.min(50,result.n)} of {result.n} retained participants. All retained participants enter the analysis.</p><div role="region" aria-label="Matched participant measurements" tabIndex={0} className="overflow-x-auto rounded-xl border"><table className="w-full text-left text-sm"><thead><tr>{['Participant',...result.conditions].map((label,index) => <th key={index} scope="col" className="whitespace-nowrap p-3">{label}</th>)}</tr></thead><tbody>{result.retained.slice(0,50).map(row => <tr key={row.id} className="border-t"><th scope="row" className="p-3">{row.id}</th>{row.values.map((value,i) => <td key={i} className="whitespace-nowrap p-3">{value}</td>)}</tr>)}</tbody></table></div></details>
        <label className="block font-bold">Report text<textarea readOnly rows={9} value={buildRepeatedMeasuresReport(result,correction,alpha,source)} className={`mt-2 w-full rounded-xl border p-4 text-sm font-normal ${darkMode ? 'bg-slate-950 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'}`} /></label>
        <p>Select and copy the report, then add study context and assumption checks. Pairwise comparisons, confidence intervals, and power calculations are not supplied here.</p>
    </section>;
}
