import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Calculator, CheckCircle, Database, FileUp, SlidersHorizontal, Sparkles } from 'lucide-react';
import { buildCorrelationGuidance, calculatePearsonCorrelationStats } from '../../stats/correlation';
import { parseDelimitedTable } from '../../utils/delimitedTable';
import { formatPValue, formatStatistic } from '../../utils/statFormatters';
import { PEARSON_SAMPLE_DATASET } from '../../data/pearsonCorrelationPresets';
import AnalysisCard from '../analysis/AnalysisCard';
import AnalysisMetricTile from '../analysis/AnalysisMetricTile';
import AssumptionItem from '../formula/AssumptionItem';
import PearsonScatterplot from './PearsonScatterplot';

const PearsonCalculatorSection = ({ assumptions, darkMode, onStatsChange }) => {
    const [tableText, setTableText] = useState(PEARSON_SAMPLE_DATASET);
    const [selectedX, setSelectedX] = useState('');
    const [selectedY, setSelectedY] = useState('');
    const [tails, setTails] = useState(2);
    const [direction, setDirection] = useState('greater');
    const [confidenceLevel, setConfidenceLevel] = useState(0.95);
    const [rho0, setRho0] = useState(0);
    const [showLine, setShowLine] = useState(true);
    const [showBand, setShowBand] = useState(false);
    const parsedTable = useMemo(() => parseDelimitedTable(tableText), [tableText]);
    const numericColumns = useMemo(() => parsedTable.numericColumns || [], [parsedTable.numericColumns]);

    useEffect(() => {
        if (!numericColumns.length) {
            setSelectedX('');
            setSelectedY('');
            return;
        }
        if (!numericColumns.some(({ name }) => name === selectedX)) setSelectedX(numericColumns[0]?.name || '');
        if (!numericColumns.some(({ name }) => name === selectedY)) setSelectedY(numericColumns[1]?.name || numericColumns[0]?.name || '');
    }, [numericColumns, selectedX, selectedY]);

    const xColumn = numericColumns.find(({ name }) => name === selectedX);
    const yColumn = numericColumns.find(({ name }) => name === selectedY);
    const stats = useMemo(() => {
        if (!xColumn || !yColumn || xColumn.name === yColumn.name) return null;
        return calculatePearsonCorrelationStats({
            xValues: xColumn.numericValues,
            yValues: yColumn.numericValues,
            alpha: 1 - confidenceLevel,
            tails,
            direction,
            confidenceLevel,
            rho0,
        });
    }, [confidenceLevel, direction, rho0, tails, xColumn, yColumn]);
    const guidance = useMemo(() => buildCorrelationGuidance(stats), [stats]);
    const influentialIndex = stats?.influence?.maxDeltaR >= 0.15 ? stats.influence.influentialPoint?.index : null;
    const setupState = tails === 2 ? 'two_tailed' : direction === 'less' ? 'negative' : 'positive';

    useEffect(() => {
        if (typeof onStatsChange === 'function') onStatsChange(stats?.ok ? stats : null);
    }, [onStatsChange, stats]);

    const upload = async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;
        setTableText(await file.text());
        event.target.value = '';
    };

    return (
        <div className="space-y-8">
            <AnalysisCard darkMode={darkMode}><div className="flex items-start gap-4"><div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400"><Calculator size={20} /></div><div><h3 className={`text-xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>Pearson correlation calculator</h3><p className="mt-2 text-sm max-w-3xl text-slate-500">Upload or paste a table, choose X and Y, then inspect r, r², inference, and scatterplot warnings.</p></div></div></AnalysisCard>

            <div className="grid lg:grid-cols-12 gap-8 items-start">
                <div className="lg:col-span-4 space-y-6">
                    <AnalysisCard darkMode={darkMode}>
                        <div className="flex items-center gap-3 mb-4"><Database size={18} className="text-indigo-500" /><div><div className="text-[10px] font-black uppercase tracking-widest text-indigo-500">Data Source</div><h3 className={`text-xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>Paste or upload</h3></div></div>
                        <div className="flex flex-wrap gap-3 mb-4"><label className={`inline-flex items-center gap-2 px-4 py-3 rounded-xl border cursor-pointer text-sm font-black uppercase tracking-widest ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-900'}`}><FileUp size={16} />Upload CSV<input type="file" accept=".csv,.txt,.tsv" className="hidden" onChange={upload} /></label><button type="button" onClick={() => setTableText(PEARSON_SAMPLE_DATASET)} className="inline-flex items-center gap-2 px-4 py-3 rounded-xl border border-slate-800 text-sm font-black uppercase tracking-widest text-slate-500"><Sparkles size={16} />Sample Data</button></div>
                        <label><span className="sr-only">Delimited correlation data</span><textarea value={tableText} onChange={(event) => setTableText(event.target.value)} className={`w-full h-64 rounded-2xl border p-4 text-sm font-mono outline-none ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-900'}`} /></label>
                    </AnalysisCard>

                    <AnalysisCard darkMode={darkMode}>
                        <div className="flex items-center gap-3 mb-4"><SlidersHorizontal size={18} className="text-indigo-500" /><div><div className="text-[10px] font-black uppercase tracking-widest text-indigo-500">Setup</div><h3 className={`text-xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>Variables and options</h3></div></div>
                        {!parsedTable.ok ? <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-rose-500">{parsedTable.errors.join(' ')}</div> : numericColumns.length < 2 ? <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-rose-500">At least two numeric columns are required.</div> : (
                            <div className="space-y-4">
                                {[['X Variable', selectedX, setSelectedX], ['Y Variable', selectedY, setSelectedY]].map(([label, value, setter]) => <label key={label} className="block"><span className="text-[11px] font-black uppercase tracking-widest text-slate-500">{label}</span><select value={value} onChange={(event) => setter(event.target.value)} className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm font-bold ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-900'}`}>{numericColumns.map((column) => <option key={column.name} value={column.name}>{column.name}</option>)}</select></label>)}
                                <div><span className="text-[11px] font-black uppercase tracking-widest text-slate-500">Hypothesis Direction</span><div className="mt-2 rounded-xl border border-slate-800 p-1 flex gap-1">{[['two_tailed', 'Two-tailed'], ['positive', 'Positive'], ['negative', 'Negative']].map(([id, label]) => <button key={id} type="button" onClick={() => { if (id === 'two_tailed') setTails(2); else { setTails(1); setDirection(id === 'negative' ? 'less' : 'greater'); } }} className={`flex-1 px-3 py-2 rounded-lg text-[10px] font-black uppercase ${setupState === id ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}>{label}</button>)}</div></div>
                                <label className="block"><span className="text-[11px] font-black uppercase tracking-widest text-slate-500">Confidence Level</span><select value={confidenceLevel} onChange={(event) => setConfidenceLevel(Number(event.target.value))} className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm font-bold ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-900'}`}><option value={0.9}>90%</option><option value={0.95}>95%</option><option value={0.99}>99%</option></select></label>
                                <label className="block"><span className="text-[11px] font-black uppercase tracking-widest text-slate-500">Null Correlation (ρ₀)</span><input type="number" min={-0.95} max={0.95} step={0.01} value={rho0} onChange={(event) => { const value = Number(event.target.value); if (Number.isFinite(value)) setRho0(Math.max(-0.95, Math.min(0.95, value))); }} className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm font-bold ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-900'}`} /></label>
                                <div className="grid grid-cols-2 gap-3"><button type="button" onClick={() => setShowLine((value) => !value)} className={`rounded-xl border px-4 py-3 text-xs font-black uppercase ${showLine ? 'bg-indigo-600 text-white border-indigo-500' : 'border-slate-800 text-slate-500'}`}>{showLine ? 'Hide Line' : 'Show Line'}</button><button type="button" onClick={() => setShowBand((value) => !value)} className={`rounded-xl border px-4 py-3 text-xs font-black uppercase ${showBand ? 'bg-indigo-600 text-white border-indigo-500' : 'border-slate-800 text-slate-500'}`}>{showBand ? 'Hide Band' : 'Show Band'}</button></div>
                            </div>
                        )}
                    </AnalysisCard>

                    <AnalysisCard darkMode={darkMode}><div className="flex items-center gap-3 mb-4"><AlertTriangle size={18} className="text-amber-500" /><h3 className={`text-xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>Plot before inference</h3></div><div className="space-y-3">{guidance.length ? guidance.map((item) => <div key={item.title} className={`rounded-xl border p-4 ${item.tone === 'warning' ? 'bg-amber-500/10 border-amber-500/20' : 'border-slate-800'}`}><div className="text-[10px] font-black uppercase tracking-widest text-slate-500">{item.title}</div><p className="mt-2 text-sm text-slate-500">{item.body}</p></div>) : <p className="text-sm text-slate-500">Load two usable variables to see Pearson-specific guidance.</p>}</div></AnalysisCard>
                </div>

                <div className="lg:col-span-8 space-y-6">
                    <AnalysisCard darkMode={darkMode}><PearsonScatterplot pairs={stats?.pairs || []} stats={stats} darkMode={darkMode} xLabel={selectedX || 'X'} yLabel={selectedY || 'Y'} showLine={showLine} showConfidenceBand={showBand} confidenceLevel={confidenceLevel} highlightPointIndex={influentialIndex} title="Scatterplot" subtitle="Pearson correlation is a straight-line summary, so the plot comes first." /></AnalysisCard>
                    {!stats?.ok ? <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-5 text-rose-500">{stats?.errors?.join(' ') || 'Choose two different numeric columns.'}</div> : <><div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4"><AnalysisMetricTile darkMode={darkMode} label="r" value={formatStatistic(stats.r)} tone="primary" /><AnalysisMetricTile darkMode={darkMode} label="r²" value={formatStatistic(stats.rSquared)} /><AnalysisMetricTile darkMode={darkMode} label="n" value={`${stats.n}`} /><AnalysisMetricTile darkMode={darkMode} label="Interpretation" value={stats.interpretation} /></div><div className="grid md:grid-cols-3 gap-4"><AnalysisMetricTile darkMode={darkMode} label={`${stats.hypothesisTest?.statisticLabel || 't'} Statistic`} value={formatStatistic(stats.hypothesisTest?.testStatistic)} /><AnalysisMetricTile darkMode={darkMode} label="Degrees of Freedom" value={stats.hypothesisTest?.df == null ? 'Fisher z' : `${stats.hypothesisTest.df}`} /><AnalysisMetricTile darkMode={darkMode} label="p-value" value={formatPValue(stats.hypothesisTest?.pValue)} detail={`Tested against ρ₀ = ${formatStatistic(rho0, 2)}.`} /></div><AnalysisCard darkMode={darkMode}><div className="flex justify-between gap-4"><div><div className="text-[10px] font-black uppercase tracking-widest text-indigo-500">Confidence Interval</div><h3 className={`mt-2 text-xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>{Math.round(confidenceLevel * 100)}% CI for r</h3><p className="mt-2 text-sm text-slate-500">{stats.confidenceInterval ? `[${formatStatistic(stats.confidenceInterval.lower)}, ${formatStatistic(stats.confidenceInterval.upper)}]` : 'Not enough data.'}</p></div><span className="text-[10px] font-black uppercase text-slate-500">{selectedX} vs {selectedY}</span></div></AnalysisCard></>}
                </div>
            </div>

            {assumptions.length > 0 && <AnalysisCard darkMode={darkMode}><div className="flex items-start gap-4"><CheckCircle size={20} className="text-indigo-500" /><div><h3 className={`text-xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>What to check before trusting r</h3><p className="mt-2 text-sm text-slate-500">Use these as practical checks rather than a rigid pass/fail gate.</p></div></div><div className="mt-6 space-y-3">{assumptions.map((assumption, index) => <AssumptionItem key={`${assumption.label}-${index}`} assumption={assumption} darkMode={darkMode} />)}</div></AnalysisCard>}
        </div>
    );
};

export default PearsonCalculatorSection;
