import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Calculator, CheckCircle, Database, FileUp, TrendingUp } from 'lucide-react';
import {
    buildRegressionGuidance,
    buildSlopeInterpretation,
    calculateSimpleLinearRegressionStats,
} from '../../stats/regression';
import { parseDelimitedTable } from '../../utils/delimitedTable';
import { formatPValue, formatStatistic } from '../../utils/statFormatters';
import { REGRESSION_SAMPLE_DATASET } from '../../data/regressionPresets';
import AnalysisCard from '../analysis/AnalysisCard';
import AnalysisMetricTile from '../analysis/AnalysisMetricTile';
import AssumptionItem from '../formula/AssumptionItem';
import RegressionResidualPlot from './RegressionResidualPlot';
import RegressionScatterplot from './RegressionScatterplot';

const buildEquation = (stats, xLabel, yLabel) => {
    if (!stats?.ok) return 'Regression equation unavailable';
    const sign = stats.slope >= 0 ? '+' : '-';
    return `${yLabel} = ${formatStatistic(stats.intercept)} ${sign} ${formatStatistic(Math.abs(stats.slope))} × ${xLabel}`;
};

const RegressionCalculatorSection = ({ assumptions, darkMode, onStatsChange }) => {
    const [tableText, setTableText] = useState(REGRESSION_SAMPLE_DATASET);
    const [selectedX, setSelectedX] = useState('');
    const [selectedY, setSelectedY] = useState('');
    const [confidenceLevel, setConfidenceLevel] = useState(0.95);
    const [showLine, setShowLine] = useState(true);
    const [showBand, setShowBand] = useState(false);
    const [showPredictionBand, setShowPredictionBand] = useState(false);
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
        return calculateSimpleLinearRegressionStats({ xValues: xColumn.numericValues, yValues: yColumn.numericValues, confidenceLevel, alpha: 1 - confidenceLevel });
    }, [confidenceLevel, xColumn, yColumn]);
    const guidance = useMemo(() => buildRegressionGuidance(stats), [stats]);
    const influentialIndex = stats?.influence?.maxCooksDistance > 0.5 || stats?.influence?.maxDeltaSlope > 0.35 ? stats.influence.influentialIndex : null;

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
            <AnalysisCard darkMode={darkMode}><div className="flex items-start gap-4"><div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400"><Calculator size={20} /></div><div><h3 className={`text-xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>Simple linear regression calculator</h3><p className="mt-2 text-sm max-w-3xl text-slate-500">Fit one predictor X to one outcome Y, inspect the line, and check residuals before interpreting the slope test.</p></div></div></AnalysisCard>
            <div className="grid lg:grid-cols-12 gap-8 items-start">
                <div className="lg:col-span-4 space-y-6">
                    <AnalysisCard darkMode={darkMode}>
                        <div className="flex items-center gap-3 mb-4"><Database size={18} className="text-indigo-500" /><div><div className="text-[10px] font-black uppercase tracking-widest text-indigo-500">Data Workspace</div><h3 className={`text-xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>Load a predictor and outcome</h3></div></div>
                        <div className="flex flex-wrap gap-3 mb-4"><label className="inline-flex items-center gap-2 rounded-xl border border-slate-800 px-4 py-3 text-xs font-black uppercase tracking-widest cursor-pointer text-slate-500"><FileUp size={14} />Upload CSV<input type="file" accept=".csv,.txt,.tsv" onChange={upload} className="hidden" /></label><button type="button" onClick={() => setTableText(REGRESSION_SAMPLE_DATASET)} className="rounded-xl border border-slate-800 px-4 py-3 text-xs font-black uppercase tracking-widest text-slate-500">Load Sample Data</button></div>
                        <label><span className="sr-only">Delimited regression data</span><textarea value={tableText} onChange={(event) => setTableText(event.target.value)} rows={12} spellCheck={false} className={`w-full rounded-2xl border px-4 py-4 text-sm font-medium outline-none ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-900'}`} /></label>
                        {parsedTable.errors?.length > 0 && <div className="mt-4 rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-rose-500">{parsedTable.errors.join(' ')}</div>}
                        <div className="mt-6 grid gap-4">{[['Predictor X', selectedX, setSelectedX], ['Outcome Y', selectedY, setSelectedY]].map(([label, value, setter]) => <label key={label}><span className="text-[11px] font-black uppercase tracking-widest text-slate-500">{label}</span><select value={value} onChange={(event) => setter(event.target.value)} className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm font-bold ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-900'}`}>{numericColumns.map((column) => <option key={column.name} value={column.name}>{column.name}</option>)}</select></label>)}<label><span className="text-[11px] font-black uppercase tracking-widest text-slate-500">Confidence Level</span><select value={confidenceLevel} onChange={(event) => setConfidenceLevel(Number(event.target.value))} className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm font-bold ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-900'}`}><option value={0.9}>90%</option><option value={0.95}>95%</option><option value={0.99}>99%</option></select></label></div>
                        <div className="mt-6 grid gap-3">{[[showLine, setShowLine, 'Line'], [showBand, setShowBand, 'Confidence Band'], [showPredictionBand, setShowPredictionBand, 'Prediction Interval']].map(([active, setter, label]) => <button key={label} type="button" onClick={() => setter((value) => !value)} className={`rounded-xl border px-4 py-3 text-xs font-black uppercase ${active ? 'bg-indigo-600 text-white border-indigo-500' : 'border-slate-800 text-slate-500'}`}>{active ? `Hide ${label}` : `Show ${label}`}</button>)}</div>
                    </AnalysisCard>
                    <AnalysisCard darkMode={darkMode}><div className="flex items-center gap-3 mb-4"><AlertTriangle size={18} className="text-amber-500" /><h3 className={`text-xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>What to check</h3></div><div className="space-y-3">{guidance.length ? guidance.map((item) => <div key={item.title} className={`rounded-xl border p-4 ${item.tone === 'warning' ? 'bg-amber-500/10 border-amber-500/20' : 'border-slate-800'}`}><div className="text-[10px] font-black uppercase tracking-widest text-slate-500">{item.title}</div><p className="mt-2 text-sm text-slate-500">{item.body}</p></div>) : <p className="text-sm text-slate-500">Load two different numeric variables for guidance.</p>}</div></AnalysisCard>
                </div>

                <div className="lg:col-span-8 space-y-6">
                    <AnalysisCard darkMode={darkMode}><RegressionScatterplot pairs={stats?.pairs || []} stats={stats} darkMode={darkMode} xLabel={selectedX || 'Predictor X'} yLabel={selectedY || 'Outcome Y'} showLine={showLine} showConfidenceBand={showBand} showPredictionBand={showPredictionBand} confidenceLevel={confidenceLevel} highlightPointIndex={influentialIndex} title="Scatterplot with fitted regression line" subtitle="Regression models mean Y as a straight-line function of X, so the plot comes first." /></AnalysisCard>
                    {!stats?.ok ? <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-5 text-rose-500">{stats?.errors?.join(' ') || 'Choose two different numeric columns.'}</div> : <>
                        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4"><AnalysisMetricTile darkMode={darkMode} label="Slope" value={formatStatistic(stats.slope)} tone="primary" detail={buildSlopeInterpretation({ slope: stats.slope, predictorLabel: selectedX || 'X', outcomeLabel: selectedY || 'Y' })} /><AnalysisMetricTile darkMode={darkMode} label="Intercept" value={formatStatistic(stats.intercept)} /><AnalysisMetricTile darkMode={darkMode} label="R²" value={formatStatistic(stats.rSquared)} detail={`${formatStatistic(stats.rSquared * 100, 1)}% variance explained`} /><AnalysisMetricTile darkMode={darkMode} label="Adjusted R²" value={formatStatistic(stats.adjustedRSquared)} /><AnalysisMetricTile darkMode={darkMode} label="RMSE" value={formatStatistic(stats.rmse)} /><AnalysisMetricTile darkMode={darkMode} label="n" value={`${stats.n}`} /></div>
                        <AnalysisCard darkMode={darkMode}><div className="flex items-start justify-between gap-4"><div><div className="text-[10px] font-black uppercase tracking-widest text-indigo-500">Fitted Equation</div><h3 className={`mt-2 text-xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>{buildEquation(stats, selectedX || 'X', selectedY || 'Y')}</h3><p className="mt-2 text-sm text-slate-500">{stats.interpretation}</p></div><span className="text-[10px] font-black uppercase text-slate-500">F(1, {stats.dfError}) = {formatStatistic(stats.hypothesisTests.model.statistic)}, p {formatPValue(stats.hypothesisTests.model.pValue)}</span></div></AnalysisCard>
                        <AnalysisCard darkMode={darkMode}><div className="flex items-center gap-3 mb-4"><TrendingUp size={18} className="text-emerald-500" /><h3 className={`text-lg font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>Coefficient summary</h3></div><div className="overflow-x-auto"><table className="w-full min-w-[560px] text-sm"><thead><tr className="text-slate-500">{['Term', 'Estimate', 'SE', 't', 'p', `${Math.round(confidenceLevel * 100)}% CI`].map((heading) => <th key={heading} className="text-left pb-3 font-black uppercase tracking-widest text-[10px]">{heading}</th>)}</tr></thead><tbody>{stats.coefficients.map((coefficient) => <tr key={coefficient.id} className="border-t border-slate-800 text-slate-500"><td className="py-3 font-bold">{coefficient.label}</td><td>{formatStatistic(coefficient.estimate)}</td><td>{formatStatistic(coefficient.standardError)}</td><td>{formatStatistic(coefficient.tStatistic)}</td><td>p {formatPValue(coefficient.pValue)}</td><td>[{formatStatistic(coefficient.confidenceInterval.lower)}, {formatStatistic(coefficient.confidenceInterval.upper)}]</td></tr>)}</tbody></table></div></AnalysisCard>
                        <AnalysisCard darkMode={darkMode}><RegressionResidualPlot stats={stats} darkMode={darkMode} /></AnalysisCard>
                    </>}
                </div>
            </div>
            {assumptions.length > 0 && <AnalysisCard darkMode={darkMode}><div className="flex items-start gap-4"><CheckCircle size={20} className="text-indigo-500" /><div><h3 className={`text-xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>What to check before trusting the line</h3><p className="mt-2 text-sm text-slate-500">Use these as practical checks rather than a rigid pass/fail gate.</p></div></div><div className="mt-6 space-y-3">{assumptions.map((assumption, index) => <AssumptionItem key={`${assumption.label}-${index}`} assumption={assumption} darkMode={darkMode} />)}</div></AnalysisCard>}
        </div>
    );
};

export default RegressionCalculatorSection;
