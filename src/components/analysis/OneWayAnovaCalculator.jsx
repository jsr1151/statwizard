import { useEffect, useMemo, useRef } from 'react';
import { calculateOneWayCalculator, oneWaySeedGroups } from '../../stats/oneWayCalculator.js';
import { buildOneWayReport } from '../../stats/oneWayReport.js';
import { MAX_ANOVA_GROUPS } from '../../utils/oneWayDraft.js';
import { formatStatistic as number, formatPValue } from '../../utils/statFormatters.js';
import Card from './AnalysisCard.jsx';
import MetricTile from './AnalysisMetricTile.jsx';
import FTestNullPlot from '../common/FTestNullPlot.jsx';
import DescriptiveDataSummary from '../descriptive/DescriptiveDataSummary.jsx';
import CopyResultsButton from '../common/CopyResultsButton.jsx';

export default function OneWayAnovaCalculator({ input, datasetSeed, datasetName, rowReview, darkMode, onStatsUpdate, lesson = false, renderPlot }) {
    const { value, patch } = input;
    const saved = !!datasetSeed, inputMode = saved ? 'raw' : value.inputMode;
    const groups = useMemo(() => saved ? oneWaySeedGroups(datasetSeed) : value[inputMode]?.groups || [], [saved, datasetSeed, value, inputMode]);
    const source = `${lesson ? 'Lesson: ' : ''}${saved ? datasetName : inputMode === 'f' ? 'Supplied F statistic and degrees of freedom' : value[inputMode].source}`;
    const result = useMemo(() => ({ ...calculateOneWayCalculator({ ...value, inputMode, groups }), source }), [value, inputMode, groups, source]);
    useEffect(() => { onStatsUpdate?.(result.ok ? result : null); }, [result, onStatsUpdate]);
    const results = useRef(null);
    const field = `mt-2 w-full min-w-0 rounded-xl border p-3 ${darkMode ? 'bg-slate-950 border-slate-700 text-slate-200' : 'bg-white border-slate-300 text-slate-900'}`;
    const button = `rounded-xl border px-3 py-2 text-sm font-semibold disabled:opacity-50 ${darkMode ? 'border-slate-700 text-slate-200' : 'border-slate-300 text-slate-800'}`;
    const report = buildOneWayReport({ result, source, excluded: saved ? rowReview?.dropped || 0 : 0 });
    return <div className="space-y-5 min-w-0 [overflow-wrap:anywhere]">
        <Card darkMode={darkMode}>
            <h3 className="text-xl font-bold">{lesson ? 'One-way ANOVA lesson inputs' : 'One-way ANOVA inputs'}</h3>
            <p className="mt-2 text-sm"><strong>Active source: {source}</strong></p>
            <div className="mt-3 flex flex-wrap gap-2">
                {saved ? <button type="button" disabled={groups.length > MAX_ANOVA_GROUPS} className={button} onClick={() => input.editCopy(groups, datasetName)}>Edit a copy</button> : <>
                    {[['raw', 'Raw data'], ['summary', 'Summary statistics'], ['f', 'F statistic']].map(([mode, label]) => <button type="button" key={mode} aria-pressed={inputMode === mode} className={`${button} ${inputMode === mode ? 'bg-indigo-600 text-white' : ''}`} onClick={() => patch({ inputMode: mode })}>{label}</button>)}
                    <button type="button" className={button} onClick={input.loadExample}>Load example data</button>
                </>}
            </div>
            <p className="mt-3 text-sm">{saved ? 'Values follow the current saved dataset. Edit a copy to make manual changes; review excluded rows above.' : 'Raw data, summary groups, and supplied F inputs are kept separately when switching modes.'}</p>
            {inputMode === 'f' ? <>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">{[['F', 'F statistic'], ['df1', 'Numerator degrees of freedom'], ['df2', 'Denominator degrees of freedom']].map(([key, label]) => <label key={key} className="block text-sm font-semibold">{label}<input aria-label={label} type="number" step="any" value={value.f[key]} onChange={event => patch({ f: { ...value.f, [key]: event.target.value } })} className={field} /></label>)}</div>
                <p className="mt-3 text-sm">Use degrees of freedom from your reported F test; fractional values are allowed. Group means, effect sizes, and pairwise comparisons cannot be recovered from these inputs alone.</p>
            </> : <>
                <div className="mt-4 grid gap-4 lg:grid-cols-2">{groups.map((group, i) => <fieldset key={i} className={`min-w-0 rounded-xl border p-3 ${darkMode ? 'border-slate-700' : 'border-slate-300'}`}>
                    <legend className="px-1 font-bold">Group {i + 1}: {group.label.trim() || `Group ${i + 1}`}</legend>
                    {!saved && <label className="block text-sm font-semibold">Group label<input aria-label={`Group ${i + 1} label`} value={group.label} onChange={event => input.setGroup(i, 'label', event.target.value)} className={field} /></label>}
                    {inputMode === 'raw' ? <div className="mt-3 space-y-3">
                        <label className="block text-sm font-semibold">Sample values<textarea aria-label={`Group ${i + 1} raw values`} readOnly={saved} value={group.raw} onChange={event => input.setGroup(i, 'raw', event.target.value)} rows={4} className={`${field} font-mono`} /></label>
                        {!saved && <DescriptiveDataSummary source={`Group ${i + 1}`} count={result.parsed[i].values.length} invalid={result.parsed[i].invalid} darkMode={darkMode} />}
                    </div> : <div className="mt-3 grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">{[['mean', 'Mean'], ['sd', 'Sample SD'], ['n', 'Sample size']].map(([key, label]) => <label key={key} className="block text-sm font-semibold">{label}<input aria-label={`Group ${i + 1} ${key}`} type="number" step={key === 'n' ? '1' : 'any'} value={group[key]} onChange={event => input.setGroup(i, key, event.target.value)} className={field} /></label>)}</div>}
                    {!saved && <button type="button" className={`${button} mt-3`} aria-label={`Remove group ${i + 1}`} disabled={groups.length <= 2} onClick={() => input.removeGroup(i)}>Remove group</button>}
                </fieldset>)}</div>
                {!saved && <button type="button" className={`${button} mt-3`} disabled={groups.length >= MAX_ANOVA_GROUPS} onClick={input.addGroup}>Add group</button>}
                <p className="mt-3 text-sm">Supports 2 to {MAX_ANOVA_GROUPS} independent groups. {inputMode === 'raw' ? 'Separate observations with commas, spaces, semicolons, or newlines. Empty separators are ignored; non-numeric entries are excluded and listed. Empty groups block the analysis.' : 'Enter the sample mean, sample standard deviation, and whole-number sample size of at least 2 for every group.'}</p>
            </>}
            <label className="mt-5 block text-sm font-semibold">Significance level<select aria-label="Significance level" value={value.alpha} onChange={event => patch({ alpha: Number(event.target.value) })} className={field}>{[.1, .05, .01].map(alpha => <option key={alpha} value={alpha}>{alpha}</option>)}</select></label>
            {inputMode !== 'f' && <label className="mt-4 flex items-start gap-2 text-sm font-semibold"><input className="mt-1" type="checkbox" checked={value.showComparisons} onChange={event => patch({ showComparisons: event.target.checked })} />Show Bonferroni pairwise comparisons</label>}
            <p className="mt-3 text-sm">This ANOVA assumes independent observations, approximately normal errors, and equal population variances. The omnibus test asks whether at least one population mean differs; it does not identify which groups differ.</p>
            {result.ok && <button type="button" className={`${button} mt-4`} onClick={() => { results.current?.focus(); results.current?.scrollIntoView?.({ block: 'start' }); }}>Go to results</button>}
        </Card>
        <section ref={results} tabIndex={-1} aria-label={lesson ? 'One-way ANOVA lesson results' : 'One-way ANOVA results'} className="space-y-4 scroll-mt-24">
            {!result.ok ? <div role="status" className={`rounded-xl border p-4 text-sm ${darkMode ? 'border-amber-700 bg-amber-950 text-amber-100' : 'border-amber-300 bg-amber-50 text-amber-900'}`}><p className="font-semibold">Complete the ANOVA inputs</p><ul className="mt-2 list-disc pl-5">{result.errors.map(error => <li key={error}>{error}</li>)}</ul></div> : <>
                {result.samples && <Card darkMode={darkMode}><h3 className="text-lg font-bold">Analyzed groups</h3>{result.samples.map((sample, i) => <p key={i} className="mt-2">Group {i + 1} ({sample.label}): n = {sample.n}, mean = {number(sample.mean, 4)}, sample SD = {sample.n === 1 ? 'undefined (one observation)' : number(sample.sd, 4)}.</p>)}</Card>}
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{[['F statistic', result.F], ['df1', result.df1], ['df2', result.df2], ...(result.samples ? [['Eta squared', result.eta2]] : [])].map(([label, val]) => <MetricTile key={label} darkMode={darkMode} label={label} value={number(val, 4)} />)}<MetricTile darkMode={darkMode} label="p-value" value={formatPValue(result.p)} /></div>
                <p className="text-sm">Degrees of freedom: df1 is the numerator (between groups in ANOVA); df2 is the denominator (within groups).</p>
                {result.samples && <Card darkMode={darkMode}><p className="mb-3 text-sm">SS = sum of squares; df = degrees of freedom; MS = mean square.</p><div className="overflow-x-auto"><table className="w-full text-sm"><caption className="pb-3 text-left text-lg font-bold">ANOVA table</caption><thead><tr>{['Source', 'SS', 'df', 'MS'].map(label => <th key={label} scope="col" className="p-2 text-left">{label}</th>)}</tr></thead><tbody>{[['Between groups', result.ssB, result.df1, result.msB], ['Within groups', result.ssW, result.df2, result.msW], ['Total', result.ssT, result.N - 1, null]].map(([label, ...values]) => <tr key={label}><th scope="row" className="p-2 text-left">{label}</th>{values.map((val, i) => <td key={i} className="p-2">{val === null ? '--' : number(val, 4)}</td>)}</tr>)}</tbody></table></div></Card>}
                {result.comparisons.length > 0 && <Card darkMode={darkMode}>
                    <h3 className="text-lg font-bold">Bonferroni pairwise comparisons</h3><p className="mt-2 text-sm">All {result.comparisons.length} pairwise differences use the pooled ANOVA error variance and {result.df2} residual degrees of freedom. Adjusted p-values and {Math.round((1 - value.alpha) * 100)}% familywise confidence intervals account for this entire family of comparisons. Differences are first group minus second group.</p>
                    <div className="mt-3 grid gap-3 lg:grid-cols-2">{result.comparisons.map(pair => <div key={`${pair.first}-${pair.second}`} className={`rounded-xl border p-3 text-sm ${darkMode ? 'border-slate-700' : 'border-slate-300'}`}><h4 className="font-bold">{result.samples[pair.first].label} minus {result.samples[pair.second].label}</h4><p className="mt-2">Difference: {number(pair.difference, 4)}; adjusted p {formatPValue(pair.pAdjusted)}.</p><p className="mt-2">Interval: [{number(pair.lower, 4)}, {number(pair.upper, 4)}]. {pair.significant ? 'Significant' : 'Not significant'} at alpha = {value.alpha}.</p></div>)}</div>
                </Card>}
                <Card darkMode={darkMode}><h3 className="text-lg font-bold">{inputMode === 'f' ? 'F test result' : 'One-way ANOVA test result'}</h3><p className="mt-2">{result.isSignificant ? 'Reject the null hypothesis' : 'Do not reject the null hypothesis'} at alpha = {value.alpha}.</p><p className="mt-2 text-sm">Failing to reject does not establish equality. Review the assumptions before reporting.</p>{renderPlot ? renderPlot(result) : <FTestNullPlot result={result} darkMode={darkMode} />}<CopyResultsButton text={report} label={lesson ? 'Copy lesson report' : 'Copy ANOVA report'} darkMode={darkMode} /></Card>
            </>}
        </section>
    </div>;
}
