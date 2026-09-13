import { useState } from 'react';
import Card from '../analysis/AnalysisCard.jsx';
import TTestNullPlot from '../common/TTestNullPlot.jsx';
import PairedTTestPlots from './PairedTTestPlots.jsx';
const axisLabels = { paired: 'Score', bar: 'Mean score', line: 'Mean score', change: 'Difference score' };
const initialSettings = { type: 'bar', errorType: 'se', showGrid: true, condition1Color: '#6366f1', condition2Color: '#10b981', differenceColor: '#f59e0b', yMin: '', yMax: '', yLabel: 'Mean score' };
export default function PairedLessonPlot({ stats, labels, darkMode }) {
    const [view, setView] = useState('sampling');
    const [settings, setSettings] = useState(initialSettings);
    const [customLabel, setCustomLabel] = useState(false);
    const patch = change => setSettings(previous => ({ ...previous, ...change }));
    const type = view === 'difference' ? 'change' : view === 'paired' ? 'paired' : settings.type;
    const yMin = settings.yMin === '' ? null : Number(settings.yMin), yMax = settings.yMax === '' ? null : Number(settings.yMax);
    const invalidRange = (yMin !== null && !Number.isFinite(yMin)) || (yMax !== null && !Number.isFinite(yMax)) || (yMin !== null && yMax !== null && yMin >= yMax);
    const needsPairs = ['paired','change'].includes(type) && !stats.raw1.length;
    const button = 'rounded-lg border px-3 py-2 text-sm font-semibold';
    const field = `mt-2 w-full min-w-0 rounded-lg border p-2 ${darkMode ? 'bg-slate-950 border-slate-700 text-slate-200' : 'bg-white border-slate-300 text-slate-900'}`;
    return <Card darkMode={darkMode}>
        <div role="group" aria-label="Paired lesson views" className="flex flex-wrap gap-2">{[['sampling','Sampling'],['difference','Differences'],['paired','Paired'],['plots','Plot maker']].map(([id,label]) => <button key={id} aria-pressed={view === id} className={`${button} ${view === id ? 'bg-indigo-600 text-white' : ''}`} onClick={() => setView(id)}>{label}</button>)}</div>
        <div className="mt-4">
            {view === 'sampling' ? <TTestNullPlot title="Paired lesson null distribution" result={stats} darkMode={darkMode} /> : needsPairs ? <p role="status" className="rounded-xl border p-4 text-sm">Individual paired observations and their differences cannot be reconstructed from summary statistics. Select Example pairs to explore these views, or use Bars and Line in the plot maker to compare the current means.</p> : invalidRange && view === 'plots' ? <p role="status" className="rounded-xl border p-4 text-sm">Enter finite axis limits with Y minimum less than Y maximum. The inference below still uses all observations.</p> : <>
                <PairedTTestPlots stats={stats} group1={{ name: labels[0] }} group2={{ name: labels[1] }} settings={view === 'plots' ? { ...settings, type, yMin, yMax } : { ...initialSettings, type, yMin: null, yMax: null, yLabel: axisLabels[type] }} darkMode={darkMode} />
                <p className="mt-2 text-sm">{type === 'bar' ? `Bars show condition means. ${settings.errorType === 'se' ? 'Error bars show one standard error of each condition mean, not a confidence interval for the paired difference.' : settings.errorType === 'sd' ? 'Error bars show one sample standard deviation for each condition.' : 'Error bars are hidden.'}` : type === 'line' ? 'The line connects condition means; it does not represent individual participants.' : `Showing all ${stats.n} complete example pairs. Differences are Condition 1 minus Condition 2.`} {view === 'plots' && (yMin !== null || yMax !== null) && 'Custom axis limits may crop marks; inference still uses all observations.'}</p>
            </>}
        </div>
        {view === 'plots' && <div className="mt-4 space-y-4">
            <div className="flex flex-wrap gap-2" role="group" aria-label="Paired plot type">{[['paired','Paired lines'],['bar','Bars'],['line','Line'],['change','Change']].map(([id,label]) => <button key={id} aria-pressed={settings.type === id} className={`${button} ${settings.type === id ? 'bg-indigo-600 text-white' : ''}`} onClick={() => patch({ type: id, yMin: '', yMax: '', yLabel: customLabel ? settings.yLabel : axisLabels[id] })}>{label}</button>)}</div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {settings.type === 'bar' && <label className="text-sm font-semibold">Error bars<select aria-label="Error bars" value={settings.errorType} onChange={event => patch({ errorType: event.target.value })} className={field}><option value="none">None</option><option value="se">Standard error</option><option value="sd">Sample SD</option></select></label>}
                {(settings.type === 'change' ? [['differenceColor','Difference color']] : [['condition1Color','Condition 1 color'],['condition2Color','Condition 2 color']]).map(([key,label]) => <label key={key} className="text-sm font-semibold">{label}<input aria-label={label} type="color" value={settings[key]} onChange={event => patch({ [key]: event.target.value })} className={`${field} h-11`} /></label>)}
                <label className="text-sm font-semibold">Y-axis label<input aria-label="Y-axis label" value={settings.yLabel} onChange={event => { setCustomLabel(true); patch({ yLabel: event.target.value }); }} className={field} /></label>
                <label className="text-sm font-semibold">Y minimum<input aria-label="Y minimum" type="number" value={settings.yMin} onChange={event => patch({ yMin: event.target.value })} className={field} /></label>
                <label className="text-sm font-semibold">Y maximum<input aria-label="Y maximum" type="number" value={settings.yMax} onChange={event => patch({ yMax: event.target.value })} className={field} /></label>
            </div>
            <div className="flex flex-wrap gap-2"><button className={button} aria-pressed={settings.showGrid} onClick={() => patch({ showGrid: !settings.showGrid })}>Grid</button><button className={button} onClick={() => { setSettings(initialSettings); setCustomLabel(false); }}>Reset plot</button></div>
        </div>}
    </Card>;
}
