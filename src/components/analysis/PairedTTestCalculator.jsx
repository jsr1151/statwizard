import { useEffect, useMemo, useRef } from 'react';
import { calculatePairedCalculator, pairedSeedInput } from '../../stats/pairedCalculator.js';
import { formatStatistic, formatPValue } from '../../utils/statFormatters.js';
import Card from './AnalysisCard.jsx';
import MetricTile from './AnalysisMetricTile.jsx';
import TTestNullPlot from '../common/TTestNullPlot.jsx';
import PairedInputReview from './PairedInputReview.jsx';
import CopyResultsButton from '../common/CopyResultsButton.jsx';
import { buildPairedReport, formatPairedInterval } from '../../stats/pairedReport.js';
export default function PairedTTestCalculator({ input, datasetSeed, datasetName, rowReview, darkMode, onStatsUpdate }) {
    const { value, patch } = input;
    const saved = !!datasetSeed;
    const inputMode = saved ? 'raw' : value.inputMode;
    const raw = useMemo(() => saved ? pairedSeedInput(datasetSeed) : value.raw, [saved, datasetSeed, value.raw]);
    const profile = inputMode === 'raw' ? raw : value.summary;
    const source = saved ? datasetName : profile.source;
    const labels = profile.labels.map((label, i) => label.trim() || `Condition ${i + 1}`);
    const result = useMemo(() => calculatePairedCalculator({ ...value, inputMode, raw }), [value, inputMode, raw]);
    useEffect(() => { onStatsUpdate?.(result.ok ? result : null); }, [result, onStatsUpdate]);
    const results = useRef(null);
    const field = `mt-2 w-full min-w-0 rounded-xl border p-3 ${darkMode ? 'bg-slate-950 border-slate-700 text-slate-200' : 'bg-white border-slate-300 text-slate-900'}`;
    const button = `rounded-xl border px-3 py-2 text-sm font-semibold ${darkMode ? 'border-slate-700 text-slate-200' : 'border-slate-300 text-slate-800'}`;
    const report = buildPairedReport({ result, source, labels, inputMode, savedExcluded: saved ? rowReview?.dropped || 0 : undefined });
    return <div className="space-y-5 min-w-0 [overflow-wrap:anywhere]">
        <Card darkMode={darkMode}>
            <h3 className="text-xl font-bold">Paired-samples t-test inputs</h3>
            <p className="mt-2 text-sm"><strong>Active source: {source}</strong></p>
            <p className="mt-2 text-sm">The difference is Condition 1 minus Condition 2: {labels[0]} minus {labels[1]}. The null hypothesis is a population mean difference of zero.</p>
            <div className="mt-3 flex flex-wrap gap-2">
                {saved ? <button type="button" className={button} onClick={() => input.editCopy(raw, datasetName)}>Edit a copy</button> : <>
                    {[['raw','Raw pairs'],['summary','Summary statistics']].map(([id,label]) => <button key={id} type="button" aria-pressed={inputMode === id} className={`${button} ${inputMode === id ? 'bg-indigo-600 text-white' : ''}`} onClick={() => patch({ inputMode: id })}>{label}</button>)}
                    <button type="button" className={button} onClick={input.loadExample}>Load example data</button>
                </>}
                <button type="button" className={button} onClick={input.swap}>Swap conditions</button>
            </div>
            <p className="mt-2 text-sm">Swapping conditions reverses the difference; the alternative stays the same. Raw and summary inputs have separate labels and comparison orders.</p>
            {!saved && <div className="mt-4 grid gap-3 sm:grid-cols-2">{labels.map((label,i) => <label key={i} className="block text-sm font-semibold">Condition {i+1} label<input aria-label={`Condition ${i+1} label`} value={profile.labels[i]} onChange={event => input.editProfile({ labels: profile.labels.map((value,j) => j === i ? event.target.value : value) })} className={field} /></label>)}</div>}
            {inputMode === 'raw' ? <div className="mt-4 space-y-3">
                <label className="block text-sm font-semibold">Paired observations<textarea aria-label="Paired observations" readOnly={saved} value={raw.text} onChange={event => input.editProfile({ text: event.target.value })} rows={7} className={`${field} font-mono`} /></label>
                <p className="text-sm">One matched pair per line, with Condition 1 first and Condition 2 second. Separate the two numbers with a comma, tab, semicolon, or spaces; omit headers. Blank lines are ignored. A missing, invalid, or extra value excludes the entire row.</p>
                {saved ? <p className="text-sm">These are complete pairs from the current saved dataset. Review excluded rows above. Use Edit a copy for manual changes.</p> : <PairedInputReview review={result.review} darkMode={darkMode} />}
            </div> : <div className="mt-4 space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">{[['mean1','Condition 1 mean'],['sd1','Condition 1 sample SD'],['mean2','Condition 2 mean'],['sd2','Condition 2 sample SD'],['n','Pair count'],['r','Within-pair correlation']].map(([key,label]) => <label key={key} className="block text-sm font-semibold">{label}<input aria-label={label} type="number" step={key === 'n' ? '1' : 'any'} value={value.summary[key]} onChange={event => input.editProfile({ [key]: event.target.value })} className={field} /></label>)}</div>
                <p className="text-sm">Use summaries calculated from the same complete pairs. The within-pair correlation is required to obtain the SD of differences; it cannot be inferred from the two means and SDs. Use raw pairs if that correlation is unknown.</p>
            </div>}
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-semibold">Significance level<select aria-label="Significance level" value={value.alpha} onChange={event => patch({ alpha: Number(event.target.value) })} className={field}>{[.1,.05,.01].map(alpha => <option key={alpha} value={alpha}>{alpha}</option>)}</select></label>
                <label className="block text-sm font-semibold">Alternative hypothesis<select aria-label="Alternative hypothesis" value={value.tails === 2 ? 'two-sided' : value.direction} onChange={event => patch(event.target.value === 'two-sided' ? { tails: 2 } : { tails: 1, direction: event.target.value })} className={field}><option value="two-sided">Condition means differ</option><option value="greater">Condition 1 mean is greater</option><option value="less">Condition 1 mean is less</option></select></label>
                <label className="block text-sm font-semibold">Confidence interval type<select aria-label="Confidence interval type" value={value.ciType} onChange={event => patch({ ciType: event.target.value })} className={field}><option value="two-sided">Two-sided interval</option><option value="one-sided">One-sided bound</option></select></label>
                {value.ciType === 'one-sided' && value.tails === 2 && <label className="block text-sm font-semibold">One-sided bound<select aria-label="One-sided bound" value={value.direction} onChange={event => patch({ direction: event.target.value })} className={field}><option value="greater">Lower confidence bound</option><option value="less">Upper confidence bound</option></select></label>}
            </div>
            {value.ciType === 'one-sided' && value.tails === 1 && <p className="mt-3 text-sm">The interval gives a {value.direction === 'greater' ? 'lower' : 'upper'} bound, matching the directional alternative.</p>}
            {result.ok && <button type="button" className={`${button} mt-4`} onClick={() => { results.current?.focus(); results.current?.scrollIntoView?.({ block: 'start' }); }}>Go to results</button>}
        </Card>
        <section ref={results} tabIndex={-1} aria-label="Paired-samples t-test results" className="space-y-4 scroll-mt-24">
            {!result.ok ? <div role="status" className={`rounded-xl border p-4 text-sm ${darkMode ? 'border-amber-700 bg-amber-950 text-amber-100' : 'border-amber-300 bg-amber-50 text-amber-900'}`}><p className="font-semibold">Complete the test inputs</p><ul className="mt-2 list-disc pl-5">{result.errors.map(error => <li key={error}>{error}</li>)}</ul></div> : <>
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{[['Complete pairs',result.n],['Mean difference',result.dBar],['SD of differences',result.sd],['t statistic',result.t],['Degrees of freedom',result.df],['Standard error',result.se],["Cohen's dz",result.dz]].map(([label,number]) => <MetricTile key={label} darkMode={darkMode} label={label} value={formatStatistic(number,4)} />)}<MetricTile darkMode={darkMode} label="p-value" value={formatPValue(result.p)} /></div>
                <Card darkMode={darkMode}>
                    <h3 className="text-lg font-bold">Paired test result</h3>
                    <p className="mt-2">{result.isSignificant ? 'Reject the null hypothesis' : 'Do not reject the null hypothesis'} at alpha = {value.alpha}.</p>
                    <p className="mt-2">{formatPairedInterval(result)}</p>
                    <p className="mt-2 text-sm">Cohen's dz uses the sample SD of paired differences. Check that observations are correctly matched, pairs are independent, and the differences have an appropriate distribution. Failing to reject does not establish equality.</p>
                    <TTestNullPlot title="Paired-samples t-test null distribution" result={result} darkMode={darkMode} />
                    <CopyResultsButton text={report} label="Copy test report" darkMode={darkMode} />
                </Card>
            </>}
        </section>
    </div>;
}
