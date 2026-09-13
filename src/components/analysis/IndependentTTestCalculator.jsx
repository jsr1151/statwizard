import { useEffect, useMemo, useRef } from 'react';
import { calculateIndependentCalculator } from '../../stats/independentCalculator.js';
import { formatStatistic, formatPValue } from '../../utils/statFormatters.js';
import Card from './AnalysisCard.jsx';
import MetricTile from './AnalysisMetricTile.jsx';
import TTestNullPlot from '../common/TTestNullPlot.jsx';
import DescriptiveDataSummary from '../descriptive/DescriptiveDataSummary.jsx';
import CopyResultsButton from '../common/CopyResultsButton.jsx';

const bound = value => value === Infinity ? 'Infinity' : value === -Infinity ? '-Infinity' : formatStatistic(value, 6);
export default function IndependentTTestCalculator({ input, datasetSeed, datasetName, rowReview, darkMode, onStatsUpdate }) {
    const { value, patch } = input;
    const saved = !!datasetSeed;
    const inputMode = saved ? 'raw' : value.inputMode;
    const groups = useMemo(() => saved ? (input.roleSelection.reverse ? [datasetSeed.group2, datasetSeed.group1] : [datasetSeed.group1, datasetSeed.group2]) : value.groups, [saved, datasetSeed, input.roleSelection.reverse, value.groups]);
    const source = saved ? datasetName : value.source;
    const labels = groups.map((group, i) => group.label.trim() || `Group ${i + 1}`);
    const result = useMemo(() => calculateIndependentCalculator({ ...value, inputMode, groups }), [value, inputMode, groups]);
    useEffect(() => { onStatsUpdate?.(result.ok ? result : null); }, [result, onStatsUpdate]);
    const results = useRef(null);
    const field = `mt-2 w-full min-w-0 rounded-xl border p-3 ${darkMode ? 'bg-slate-950 border-slate-700 text-slate-200' : 'bg-white border-slate-300 text-slate-900'}`;
    const button = `rounded-xl border px-3 py-2 text-sm font-semibold ${darkMode ? 'border-slate-700 text-slate-200' : 'border-slate-300 text-slate-800'}`;
    const method = value.testType === 'welch' ? "Welch's t-test" : 'Pooled-variance t-test';
    const report = result.ok ? [
        `Independent-samples t-test. Method: ${method}. Source: ${source}.`,
        ...result.samples.map((sample, i) => `Group ${i + 1} (${labels[i]}): n = ${sample.n}; mean = ${formatStatistic(sample.xBar, 6)}; sample SD = ${formatStatistic(sample.s, 6)}.`),
        `Difference: Group 1 minus Group 2 (${labels[0]} minus ${labels[1]}) = ${formatStatistic(result.delta, 6)}. Null difference = 0.`,
        `Alternative: difference ${value.tails === 2 ? 'differs from' : value.direction === 'greater' ? 'is greater than' : 'is less than'} 0; alpha = ${value.alpha}.`,
        `t(${formatStatistic(result.df, 6)}) = ${formatStatistic(result.t, 6)}, p ${formatPValue(result.p)}; absolute Cohen's d = ${formatStatistic(result.d, 6)}; absolute Hedges' g = ${formatStatistic(result.g, 6)} (pooled SD standardization).`,
        `${Math.round((1 - value.alpha) * 100)}% ${value.ciType} confidence interval for the population mean difference: [${bound(result.ciLower)}, ${bound(result.ciUpper)}].`,
        saved ? `${rowReview?.dropped || 0} saved rows excluded.` : inputMode === 'raw' ? result.parsed.map((parsed, i) => `Group ${i + 1}: ${parsed.invalid.length} entries excluded.`).join(' ') : 'Input: summary statistics.',
        inputMode === 'raw' ? result.parsed.map((parsed, i) => `Group ${i + 1} analyzed values: ${parsed.values.join(', ')}.`).join('\n') : '',
    ].filter(Boolean).join('\n') : '';
    return <div className="space-y-5 min-w-0 [overflow-wrap:anywhere]">
        <Card darkMode={darkMode}>
            <h3 className="text-xl font-bold">Independent-samples t-test inputs</h3>
            <p className="mt-2 text-sm"><strong>Active source: {source}</strong></p>
            <p className="mt-2 text-sm">The difference is Group 1 minus Group 2: {labels[0]} minus {labels[1]}. The null hypothesis is a population mean difference of zero.</p>
            <div className="mt-3 flex flex-wrap gap-2">
                {saved ? <button type="button" className={button} onClick={() => input.editCopy(groups, datasetName)}>Edit a copy</button> : <>
                    {[['summary', 'Summary statistics'], ['raw', 'Raw data']].map(([id, label]) => <button key={id} type="button" aria-pressed={inputMode === id} className={`${button} ${inputMode === id ? 'bg-indigo-600 text-white' : ''}`} onClick={() => patch({ inputMode: id })}>{label}</button>)}
                    <button type="button" className={button} onClick={input.loadExample}>Load example data</button>
                </>}
                <button type="button" className={button} onClick={input.swap}>Swap groups</button>
            </div>
            <p className="mt-2 text-sm">Swapping groups reverses the difference; the selected alternative stays the same. {saved && 'Values follow the current saved dataset. Edit a copy to make manual changes; review excluded rows above.'}</p>
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
                {groups.map((group, i) => <fieldset key={i} className={`min-w-0 rounded-xl border p-3 ${darkMode ? 'border-slate-700' : 'border-slate-300'}`}>
                    <legend className="px-1 font-bold">Group {i + 1}: {labels[i]}</legend>
                    {!saved && <label className="block text-sm font-semibold">Group label<input aria-label={`Group ${i + 1} label`} value={group.label} onChange={event => input.setGroup(i, 'label', event.target.value)} className={field} /></label>}
                    {inputMode === 'raw' ? <div className="mt-3 space-y-3">
                        <label className="block text-sm font-semibold">Sample values<textarea aria-label={`Group ${i + 1} raw values`} readOnly={saved} value={group.raw} onChange={event => input.setGroup(i, 'raw', event.target.value)} rows={4} className={`${field} font-mono`} /></label>
                        {!saved && <DescriptiveDataSummary source={`Group ${i + 1}: ${labels[i]}`} count={result.parsed[i].values.length} invalid={result.parsed[i].invalid} darkMode={darkMode} />}
                    </div> : <div className="mt-3 grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
                        {[['mean', 'Mean'], ['sd', 'Sample SD'], ['n', 'Sample size']].map(([key, label]) => <label key={key} className="block text-sm font-semibold">{label}<input aria-label={`Group ${i + 1} ${key}`} type="number" step={key === 'n' ? '1' : 'any'} value={group[key]} onChange={event => input.setGroup(i, key, event.target.value)} className={field} /></label>)}
                    </div>}
                </fieldset>)}
            </div>
            {inputMode === 'raw' && !saved && <p className="mt-3 text-sm">Enter each group's observations separately, using commas, spaces, semicolons, or newlines. Empty separators are ignored; non-numeric entries are excluded and listed above. These are independent groups, not paired rows.</p>}
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-semibold">Test method<select aria-label="Test method" value={value.testType} onChange={event => patch({ testType: event.target.value })} className={field}><option value="student">Pooled (equal variances)</option><option value="welch">Welch (unequal variances)</option></select></label>
                <label className="block text-sm font-semibold">Significance level<select aria-label="Significance level" value={value.alpha} onChange={event => patch({ alpha: Number(event.target.value) })} className={field}>{[0.1, 0.05, 0.01].map(alpha => <option key={alpha} value={alpha}>{alpha}</option>)}</select></label>
                <label className="block text-sm font-semibold">Alternative hypothesis<select aria-label="Alternative hypothesis" value={value.tails === 2 ? 'two-sided' : value.direction} onChange={event => patch(event.target.value === 'two-sided' ? { tails: 2 } : { tails: 1, direction: event.target.value })} className={field}><option value="two-sided">Group 1 mean differs from Group 2</option><option value="greater">Group 1 mean is greater than Group 2</option><option value="less">Group 1 mean is less than Group 2</option></select></label>
                <label className="block text-sm font-semibold">Confidence interval type<select aria-label="Confidence interval type" value={value.ciType} onChange={event => patch({ ciType: event.target.value })} className={field}><option value="two-sided">Two-sided interval</option><option value="one-sided">One-sided bound</option></select></label>
            </div>
            <p className="mt-3 text-sm">The pooled test assumes equal population variances. Welch allows unequal variances and retains fractional degrees of freedom. Both require independent observations.</p>
            {value.ciType === 'one-sided' && value.tails === 2 && <label className="mt-4 block text-sm font-semibold">One-sided bound<select aria-label="One-sided bound" value={value.direction} onChange={event => patch({ direction: event.target.value })} className={field}><option value="greater">Lower confidence bound</option><option value="less">Upper confidence bound</option></select></label>}
            {value.ciType === 'one-sided' && value.tails === 1 && <p className="mt-3 text-sm">The interval gives a {value.direction === 'greater' ? 'lower' : 'upper'} bound, matching the directional alternative.</p>}
            {result.ok && <button type="button" className={`${button} mt-4`} onClick={() => { results.current?.focus(); results.current?.scrollIntoView?.({ block: 'start' }); }}>Go to results</button>}
        </Card>
        <section ref={results} tabIndex={-1} aria-label="Independent-samples t-test results" className="space-y-4 scroll-mt-24">
            {!result.ok ? <div role="status" className={`rounded-xl border p-4 text-sm ${darkMode ? 'border-amber-700 bg-amber-950 text-amber-100' : 'border-amber-300 bg-amber-50 text-amber-900'}`}><p className="font-semibold">Complete the test inputs</p><ul className="mt-2 list-disc pl-5">{result.errors.map(error => <li key={error}>{error}</li>)}</ul></div> : <>
                <Card darkMode={darkMode}><h3 className="text-lg font-bold">Analyzed groups</h3>{result.samples.map((sample, i) => <p key={i} className="mt-2">Group {i + 1} ({labels[i]}): n = {sample.n}, mean = {formatStatistic(sample.xBar, 4)}, sample SD = {formatStatistic(sample.s, 4)}.</p>)}</Card>
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{[['Mean difference', result.delta], ['t statistic', result.t], ['Degrees of freedom', result.df], ['Standard error', result.se], ["Absolute Cohen's d", result.d], ["Absolute Hedges' g", result.g]].map(([label, number]) => <MetricTile key={label} darkMode={darkMode} label={label} value={formatStatistic(number, 4)} />)}<MetricTile darkMode={darkMode} label="p-value" value={formatPValue(result.p)} /></div>
                <Card darkMode={darkMode}>
                    <h3 className="text-lg font-bold">Test result: {method}</h3>
                    <p className="mt-2">{result.isSignificant ? 'Reject the null hypothesis' : 'Do not reject the null hypothesis'} at alpha = {value.alpha}.</p>
                    <p className="mt-2">{Math.round((1 - value.alpha) * 100)}% {value.ciType} confidence interval for the population mean difference (Group 1 minus Group 2): [{bound(result.ciLower)}, {bound(result.ciUpper)}].</p>
                    <p className="mt-2 text-sm">Effect sizes use the pooled sample SD and are reported as magnitudes; the mean difference shows the direction. Review independence, sampling, and the distributions before reporting. Failing to reject does not establish equality.</p>
                    <TTestNullPlot title="Independent-samples t-test null distribution" result={result} darkMode={darkMode} />
                    <CopyResultsButton text={report} label="Copy test report" darkMode={darkMode} />
                </Card>
            </>}
        </section>
    </div>;
}
