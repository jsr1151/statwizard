import React, { useEffect, useState } from 'react';
import { AlertTriangle, Info, Sigma, TrendingUp } from 'lucide-react';
import { buildCorrelationInterpretation, getCorrelationConventionLabel } from '../../stats/correlation';
import { formatStatistic } from '../../utils/statFormatters';
import AnalysisCard from '../analysis/AnalysisCard';
import AnalysisMetricTile from '../analysis/AnalysisMetricTile';

const PearsonEffectSizeSection = ({ currentStats, darkMode }) => {
    const [correlation, setCorrelation] = useState(0.35);

    useEffect(() => {
        if (Number.isFinite(currentStats?.r)) setCorrelation(currentStats.r);
    }, [currentStats?.r]);

    const rSquared = Math.max(0, Math.min(1, correlation ** 2));
    const updateRSquared = (value) => {
        const numeric = Number(value);
        if (!Number.isFinite(numeric)) return;
        const sign = correlation < 0 ? -1 : 1;
        setCorrelation(sign * Math.sqrt(Math.max(0, Math.min(1, numeric))));
    };

    return (
        <div className="space-y-8">
            {currentStats?.ok && <AnalysisCard darkMode={darkMode}><div className="flex items-start justify-between gap-4"><div><div className="text-[10px] font-black uppercase tracking-widest mb-2 text-indigo-500">Current Calculator Snapshot</div><h3 className={`text-2xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>r = {formatStatistic(currentStats.r)}</h3><p className="mt-2 text-sm text-slate-500">Pulled from the active calculator data.</p></div><span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">r² = {formatStatistic(currentStats.rSquared)}</span></div></AnalysisCard>}

            <div className="grid lg:grid-cols-12 gap-8">
                <div className="lg:col-span-5">
                    <AnalysisCard darkMode={darkMode} className="h-full">
                        <div className="flex items-center gap-3 mb-4"><div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400"><Sigma size={18} /></div><div><div className="text-[10px] font-black uppercase tracking-widest text-indigo-500">Effect Size</div><h3 className={`text-2xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>r is already the effect size</h3></div></div>
                        <p className="text-sm text-slate-500">Translate between observed r and r² while keeping the study context visible.</p>
                        <div className="mt-6 grid gap-4">
                            <label><span className="text-[11px] font-black uppercase tracking-widest text-slate-500">Sample Correlation (r)</span><input type="number" min={-0.999} max={0.999} step={0.01} value={correlation} onChange={(event) => { const value = Number(event.target.value); if (Number.isFinite(value)) setCorrelation(Math.max(-0.999, Math.min(0.999, value))); }} className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm font-bold outline-none ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-900'}`} /></label>
                            <label><span className="text-[11px] font-black uppercase tracking-widest text-slate-500">Variance Explained (r²)</span><input type="number" min={0} max={1} step={0.01} value={rSquared.toFixed(3)} onChange={(event) => updateRSquared(event.target.value)} className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm font-bold outline-none ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-900'}`} /></label>
                        </div>
                    </AnalysisCard>
                </div>

                <div className="lg:col-span-7 space-y-6">
                    <div className="grid md:grid-cols-2 gap-4"><AnalysisMetricTile darkMode={darkMode} label="r" value={formatStatistic(correlation)} tone="primary" detail={buildCorrelationInterpretation(correlation)} /><AnalysisMetricTile darkMode={darkMode} label="r²" value={formatStatistic(rSquared)} detail={`${formatStatistic(rSquared * 100, 1)}% shared linear variance.`} /></div>
                    <AnalysisCard darkMode={darkMode}><div className="flex items-center gap-3 mb-3"><TrendingUp size={18} className="text-emerald-500" /><h3 className={`text-lg font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>What r² means</h3></div><p className="text-sm leading-relaxed text-slate-500">r² reframes the correlation as shared linear variance, which can be easier to interpret than r alone.</p></AnalysisCard>
                    <AnalysisCard darkMode={darkMode}><div className="flex items-center gap-3 mb-3"><Info size={18} className="text-amber-500" /><h3 className={`text-lg font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>Use conventions carefully</h3></div><p className="text-sm leading-relaxed text-slate-500">Rough textbook convention: {getCorrelationConventionLabel(correlation)}. This is context-dependent, not a universal rule.</p></AnalysisCard>
                    <AnalysisCard darkMode={darkMode}><div className="flex items-center gap-3 mb-3"><AlertTriangle size={18} className="text-amber-500" /><h3 className={`text-lg font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>Significance is not size</h3></div><p className="text-sm leading-relaxed text-slate-500">A tiny r can be significant in a large sample, while a meaningful r can miss significance in a small sample.</p></AnalysisCard>
                </div>
            </div>
        </div>
    );
};

export default PearsonEffectSizeSection;
