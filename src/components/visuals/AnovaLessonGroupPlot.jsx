import { useId, useState } from 'react';
import { anovaPlotDefaults, buildAnovaLessonPlot } from '../../stats/anovaLessonPlot.js';
import { formatStatistic as number } from '../../utils/statFormatters.js';

export default function AnovaLessonGroupPlot({ result, darkMode, editable }) {
    const [settings, setSettings] = useState(anovaPlotDefaults);
    const id = useId();
    const patch = change => setSettings(current => ({ ...current, ...change }));
    const active = editable ? settings : anovaPlotDefaults();
    const model = buildAnovaLessonPlot(result, active);
    const field = `mt-1 w-full min-w-0 rounded-lg border p-2 ${darkMode ? 'bg-slate-950 border-slate-700 text-slate-200' : 'bg-white border-slate-300 text-slate-900'}`;
    const button = `rounded-lg border px-3 py-2 text-sm font-semibold ${darkMode ? 'border-slate-700' : 'border-slate-300'}`;
    const color = index => active.colors[index] || (darkMode ? ['#a5b4fc', '#f9a8d4', '#6ee7b7', '#fcd34d'] : ['#4338ca', '#9d174d', '#047857', '#92400e'])[index % 4];
    const x = index => active.positions[index] === undefined ? 70 + 440 * (index + 1) / (result.k + 1) : 70 + Number(active.positions[index]) / 100 * 440;
    const y = value => 245 - (value - model.min) / (model.max - model.min) * 215;
    const baseline = model.ok ? y(Math.max(model.min, Math.min(model.max, 0))) : 245;
    return <div className="space-y-4">
        <h4 className="text-lg font-bold">{editable ? 'ANOVA plot maker' : 'Group means and observations'}</h4>
        {editable && <>
            <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-sm font-semibold">Plot type<select aria-label="ANOVA plot type" className={field} value={settings.type} onChange={event => patch({ type: event.target.value })}><option value="dot">Dots</option><option value="bar">Bars</option><option value="line">Line of group means</option></select></label>
                <label className="text-sm font-semibold">Error bars<select aria-label="ANOVA error bars" className={field} value={settings.error} onChange={event => patch({ error: event.target.value })}><option value="none">None</option><option value="se">Standard error</option><option value="sd">Standard deviation</option></select></label>
                <label className="text-sm font-semibold">Y-axis label<input aria-label="ANOVA Y-axis label" className={field} value={settings.yLabel} onChange={event => patch({ yLabel: event.target.value })} /></label>
                <div className="grid grid-cols-2 gap-2">{[['yMin', 'Y minimum'], ['yMax', 'Y maximum']].map(([key, label]) => <label key={key} className="text-sm font-semibold">{label}<input type="number" step="any" aria-label={`ANOVA ${label}`} className={field} value={settings[key]} onChange={event => patch({ [key]: event.target.value })} /></label>)}</div>
            </div>
            <div className="flex flex-wrap gap-2">{[['grid', 'Grid'], ['raw', 'Observed values'], ['grand', 'Grand mean']].map(([key, label]) => <button key={key} type="button" aria-pressed={settings[key]} className={`${button} ${settings[key] ? 'bg-indigo-600 text-white' : ''}`} onClick={() => patch({ [key]: !settings[key] })}>{label}</button>)}<button type="button" className={button} onClick={() => setSettings(anovaPlotDefaults())}>Reset plot</button></div>
            <details><summary className="cursor-pointer text-sm font-semibold">Group colors and horizontal positions</summary><p className="mt-2 text-sm">Horizontal positions change the display only. Group membership, values, and comparisons stay the same.</p><div className="mt-3 grid gap-3 sm:grid-cols-2">{result.samples.map((sample, index) => <fieldset key={index} className="min-w-0"><legend className="text-sm font-semibold">G{index + 1}: {sample.label}</legend><label className="block text-sm">Color<input type="color" aria-label={`Group ${index + 1} plot color`} value={color(index)} onChange={event => patch({ colors: { ...settings.colors, [index]: event.target.value } })} className="ml-2 h-8 w-12" /></label><label className="block text-sm">Horizontal position<input type="range" min="5" max="95" step="1" aria-label={`Group ${index + 1} horizontal position`} value={settings.positions[index] ?? 100 * (index + 1) / (result.k + 1)} onChange={event => patch({ positions: { ...settings.positions, [index]: Number(event.target.value) } })} className="block w-full" /></label></fieldset>)}</div></details>
        </>}
        {!model.ok ? <p role="status" className="text-sm font-semibold">{model.error} The numerical ANOVA result is unchanged.</p> : <figure className="space-y-3">
            <svg viewBox="0 0 560 300" role="img" aria-labelledby={`${id}-title ${id}-desc`} className="w-full overflow-hidden">
                <title id={`${id}-title`}>ANOVA group comparison plot</title><desc id={`${id}-desc`}>{result.k} group means. {result.inputMode === 'raw' ? 'Small dots represent observed values when enabled.' : 'Summary input: individual observations cannot be reconstructed.'} Error bars: {active.error === 'se' ? 'one standard error above and below each mean' : active.error === 'sd' ? 'one sample standard deviation above and below each mean' : 'none'}. Axis range: {model.min} to {model.max}.</desc>
                <defs><clipPath id={`${id}-clip`}><rect x="70" y="30" width="440" height="215" /></clipPath></defs>
                {[0, .25, .5, .75, 1].map(ratio => { const value = model.min + ratio * (model.max - model.min); return <g key={ratio}>{active.grid && <line x1="70" x2="510" y1={y(value)} y2={y(value)} stroke={darkMode ? '#475569' : '#cbd5e1'} />}<text x="62" y={y(value) + 4} textAnchor="end" fontSize="11" fill={darkMode ? '#cbd5e1' : '#334155'}>{Math.abs(value) > 1e5 || (value !== 0 && Math.abs(value) < .001) ? value.toExponential(1) : number(value, 2)}</text></g>; })}
                <line x1="70" x2="70" y1="30" y2="245" stroke={darkMode ? '#cbd5e1' : '#334155'} /><line x1="70" x2="510" y1="245" y2="245" stroke={darkMode ? '#cbd5e1' : '#334155'} />
                <text x="15" y="140" transform="rotate(-90,15,140)" textAnchor="middle" fontSize="12" fill={darkMode ? '#cbd5e1' : '#334155'}>{active.yLabel.slice(0, 30)}</text>
                <g clipPath={`url(#${id}-clip)`}>
                    {active.grand && <line data-testid="grand-mean" x1="70" x2="510" y1={y(result.grandMean)} y2={y(result.grandMean)} stroke={darkMode ? '#fcd34d' : '#92400e'} strokeDasharray="6 4" strokeWidth="2" />}
                    {active.type === 'line' && <polyline points={model.groups.map((group, i) => `${x(i)},${y(group.mean)}`).join(' ')} fill="none" stroke={darkMode ? '#cbd5e1' : '#334155'} strokeWidth="2" />}
                    {model.groups.map((group, i) => <g key={i}>
                        {active.type === 'bar' && <rect x={x(i) - 90 / result.k} y={Math.min(y(group.mean), baseline)} width={180 / result.k} height={Math.abs(y(group.mean) - baseline)} fill={color(i)} opacity=".5" />}
                        {active.raw && group.values.slice(0, 100).map((value, j) => <circle data-observation="true" key={j} cx={x(i) + Math.sin((j + 1) * 7.19 + i * 4.07) * Math.min(12, 100 / result.k)} cy={y(value)} r="3" fill={color(i)} opacity=".55" />)}
                        {group.error > 0 && <g data-error-bar={active.error}><line x1={x(i)} x2={x(i)} y1={y(group.mean - group.error)} y2={y(group.mean + group.error)} stroke={color(i)} strokeWidth="2" />{[-1, 1].map(sign => <line key={sign} x1={x(i) - 6} x2={x(i) + 6} y1={y(group.mean + sign * group.error)} y2={y(group.mean + sign * group.error)} stroke={color(i)} strokeWidth="2" />)}</g>}
                        <circle data-group-mean={i} cx={x(i)} cy={y(group.mean)} r="5" fill={color(i)} stroke={darkMode ? '#0f172a' : '#ffffff'} strokeWidth="1.5" />
                    </g>)}
                </g>
                {model.groups.map((_, i) => <text key={i} x={x(i)} y="265" textAnchor="middle" fontSize="11" fill={darkMode ? '#cbd5e1' : '#334155'}>G{i + 1}</text>)}
                <text x="280" y="290" textAnchor="middle" fontSize="12" fill={darkMode ? '#cbd5e1' : '#334155'}>Independent groups</text>
            </svg>
            <figcaption className="space-y-2 text-sm"><p>Y-axis: {active.yLabel || 'unlabeled'}. {result.inputMode === 'summary' ? 'Summary statistics show group means only; individual observations cannot be reconstructed.' : active.raw ? 'Small dots are observed values; large dots are group means.' : 'Observed values are hidden; large dots are group means.'} {active.error === 'none' ? 'Error bars are hidden.' : `Bars show one ${active.error === 'se' ? 'standard error' : 'sample standard deviation'} above and below the mean, not confidence intervals.`} {result.samples.some(sample => sample.n === 1) && 'A singleton group has no sample SD or error bar.'}</p>{active.grand && <p>Dashed line: weighted grand mean = {number(result.grandMean, 6)}.</p>}{active.type === 'line' && <p>The line connects independent group means; it does not show individual change or a time trend.</p>}{model.clipped && <p>Custom axis limits clip observations or summary marks outside the displayed range.</p>}{model.groups.some(group => group.values.length > 100) && <p>Showing the first 100 observations per group. Calculations and automatic axis limits use all analyzed values.</p>}<ul className="space-y-1">{result.samples.map((sample, i) => <li key={i}>G{i + 1}: {sample.label}; mean = {number(sample.mean, 6)}, n = {sample.n}.</li>)}</ul></figcaption>
        </figure>}
    </div>;
}
