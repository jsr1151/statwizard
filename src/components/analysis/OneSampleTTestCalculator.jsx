import { useEffect, useMemo, useRef } from 'react';
import { calculateOneSampleCalculator } from '../../stats/oneSampleCalculator.js';
import { formatStatistic, formatPValue } from '../../utils/statFormatters.js';
import Card from './AnalysisCard.jsx';
import MetricTile from './AnalysisMetricTile.jsx';
import TTestNullPlot from '../common/TTestNullPlot.jsx';
import DescriptiveDataSummary from '../descriptive/DescriptiveDataSummary.jsx';
import CopyResultsButton from '../common/CopyResultsButton.jsx';

const formatBound = (value, digits) => value === Infinity ? 'Infinity' : value === -Infinity ? '-Infinity' : formatStatistic(value, digits);

export default function OneSampleTTestCalculator({ input, datasetSeed, datasetName, rowReview, darkMode, onStatsUpdate }) {
    const { value, patch } = input;
    const saved = !!datasetSeed;
    const inputMode = saved ? 'raw' : value.inputMode;
    const raw = saved ? datasetSeed.raw : value.raw;
    const source = saved ? `${datasetName}: ${datasetSeed.label}` : value.source;
    const result = useMemo(() => calculateOneSampleCalculator({ ...value, inputMode, raw }), [value, inputMode, raw]);
    useEffect(() => { onStatsUpdate?.(result.ok ? result : null); }, [result, onStatsUpdate]);
    const results = useRef(null);
    const field = `mt-2 w-full min-w-0 rounded-xl border p-3 ${darkMode ? 'bg-slate-950 border-slate-700 text-slate-200' : 'bg-white border-slate-300 text-slate-900'}`;
    const button = `rounded-xl border px-3 py-2 text-sm font-semibold ${darkMode ? 'border-slate-700 text-slate-200' : 'border-slate-300 text-slate-800'}`;
    const hypothesis = value.tails === 2 ? 'two-sided' : value.direction;
    const report = result.ok ? [
        `One-sample t-test. Source: ${source}.`,
        `n = ${result.n}; mean = ${formatStatistic(result.mean, 6)}; sample SD = ${formatStatistic(result.sd, 6)}; null mean = ${result.mu}.`,
        `Alternative: mean ${value.tails === 2 ? 'differs from' : value.direction === 'greater' ? 'is greater than' : 'is less than'} ${result.mu}; alpha = ${value.alpha}.`,
        `t(${result.df}) = ${formatStatistic(result.t, 6)}, p ${formatPValue(result.p)}; Cohen's d = ${formatStatistic(result.effectSize, 6)}.`,
        `${Math.round((1 - value.alpha) * 100)}% ${value.ciType} confidence interval for the population mean: [${formatBound(result.confidenceInterval.lower, 6)}, ${formatBound(result.confidenceInterval.upper, 6)}].`,
        `${saved ? rowReview?.dropped || 0 : inputMode === 'raw' ? result.parsed.invalid.length : 0} entries excluded.`,
        inputMode === 'raw' ? `Analyzed values: ${result.parsed.values.join(', ')}.` : 'Input: summary statistics.',
    ].join('\n') : '';

    return <div className="space-y-5 min-w-0 [overflow-wrap:anywhere]">
        <Card darkMode={darkMode}>
            <h3 className="text-xl font-bold">One-sample t-test inputs</h3>
            <p className="mt-2 text-sm"><strong>Active source: {source}</strong></p>
            {saved ? <div className="mt-3 space-y-3">
                <p className="text-sm">Usable numeric values from the current saved dataset are shown below. Review excluded rows above. Editing a copy switches to manual input and leaves the saved dataset unchanged.</p>
                <button type="button" className={button} onClick={() => input.editCopy(raw, datasetName)}>Edit a copy</button>
            </div> : <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Sample input format">
                {[['summary', 'Summary statistics'], ['raw', 'Raw data']].map(([id, label]) => <button key={id} type="button" aria-pressed={inputMode === id} className={`${button} ${inputMode === id ? 'bg-indigo-600 text-white' : ''}`} onClick={() => patch({ inputMode: id, source: id === 'raw' ? 'Manual sample values' : 'Manual summary statistics' })}>{label}</button>)}
                <button type="button" className={button} onClick={input.loadExample}>Load example data</button>
            </div>}
            {inputMode === 'raw' ? <div className="mt-4 space-y-3">
                <label className="block text-sm font-semibold">Sample values
                    <textarea aria-label="Sample raw values" readOnly={saved} value={raw} onChange={event => input.setRaw(event.target.value)} rows={5} className={`${field} font-mono`} />
                </label>
                <p className="text-sm">Separate observations with commas, spaces, semicolons, or new lines. Empty separators are ignored. Non-numeric entries are excluded and listed below.</p>
                {!saved && <DescriptiveDataSummary source={source} count={result.parsed.values.length} invalid={result.parsed.invalid} darkMode={darkMode} />}
            </div> : <div className="mt-4 grid gap-4 sm:grid-cols-3">
                {[['mean', 'Sample mean'], ['sd', 'Sample standard deviation'], ['n', 'Sample size']].map(([key, label]) => <label key={key} className="block text-sm font-semibold">{label}
                    <input aria-label={label} type="number" step={key === 'n' ? '1' : 'any'} value={value.summary[key]} onChange={event => input.setSummary(key, event.target.value)} className={field} />
                </label>)}
            </div>}
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-semibold">Null population mean
                    <input aria-label="Null population mean" type="number" step="any" value={value.nullMean} onChange={event => patch({ nullMean: event.target.value })} className={field} />
                </label>
                <label className="block text-sm font-semibold">Significance level
                    <select aria-label="Significance level" value={value.alpha} onChange={event => patch({ alpha: Number(event.target.value) })} className={field}>{[0.1, 0.05, 0.01].map(alpha => <option key={alpha} value={alpha}>{alpha}</option>)}</select>
                </label>
                <label className="block text-sm font-semibold">Alternative hypothesis
                    <select aria-label="Alternative hypothesis" value={hypothesis} onChange={event => patch(event.target.value === 'two-sided' ? { tails: 2 } : { tails: 1, direction: event.target.value })} className={field}>
                        <option value="two-sided">Mean differs from the null</option><option value="greater">Mean is greater than the null</option><option value="less">Mean is less than the null</option>
                    </select>
                </label>
                <label className="block text-sm font-semibold">Confidence interval type
                    <select aria-label="Confidence interval type" value={value.ciType} onChange={event => patch({ ciType: event.target.value })} className={field}><option value="two-sided">Two-sided interval</option><option value="one-sided">One-sided bound</option></select>
                </label>
            </div>
            {value.ciType === 'one-sided' && value.tails === 2 && <label className="mt-4 block text-sm font-semibold">One-sided bound
                <select aria-label="One-sided bound" value={value.direction} onChange={event => patch({ direction: event.target.value })} className={field}><option value="greater">Lower confidence bound</option><option value="less">Upper confidence bound</option></select>
            </label>}
            {value.ciType === 'one-sided' && value.tails === 1 && <p className="mt-3 text-sm">The interval gives a {value.direction === 'greater' ? 'lower' : 'upper'} bound, matching the directional alternative.</p>}
            {result.ok && <button type="button" className={`${button} mt-4`} onClick={() => { results.current?.focus(); results.current?.scrollIntoView?.({ block: 'start' }); }}>Go to results</button>}
        </Card>
        <section ref={results} tabIndex={-1} aria-label="One-sample t-test results" className="space-y-4 scroll-mt-24">
            {!result.ok ? <div role="status" className={`rounded-xl border p-4 text-sm ${darkMode ? 'border-amber-700 bg-amber-950 text-amber-100' : 'border-amber-300 bg-amber-50 text-amber-900'}`}><p className="font-semibold">Complete the test inputs</p><ul className="mt-2 list-disc pl-5">{result.errors.map(error => <li key={error}>{error}</li>)}</ul></div> : <>
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                    {[['Sample size', result.n], ['Sample mean', result.mean], ['Sample SD', result.sd], ['t statistic', result.t], ['Degrees of freedom', result.df], ['Standard error', result.se], ["Cohen's d", result.effectSize]].map(([label, number]) => <MetricTile key={label} darkMode={darkMode} label={label} value={formatStatistic(number, 4)} />)}
                    <MetricTile darkMode={darkMode} label="p-value" value={formatPValue(result.p)} />
                </div>
                <Card darkMode={darkMode}>
                    <h3 className="text-lg font-bold">Test result</h3>
                    <p className="mt-2">{result.isSignificant ? 'Reject the null hypothesis' : 'Do not reject the null hypothesis'} at alpha = {value.alpha}.</p>
                    <p className="mt-2">{Math.round((1 - value.alpha) * 100)}% {value.ciType} confidence interval for the population mean: [{formatBound(result.confidenceInterval.lower, 4)}, {formatBound(result.confidenceInterval.upper, 4)}].</p>
                    <p className="mt-2 text-sm">Check independence, the sampling process, and the distribution of the observations before reporting this result. Failing to reject does not establish equality.</p>
                    <TTestNullPlot result={result} darkMode={darkMode} />
                    <CopyResultsButton text={report} label="Copy test report" darkMode={darkMode} />
                </Card>
            </>}
        </section>
    </div>;
}
