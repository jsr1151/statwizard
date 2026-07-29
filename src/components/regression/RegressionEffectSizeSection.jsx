import React, { useEffect, useState } from 'react';
import { Info, Sigma, TrendingUp } from 'lucide-react';
import { buildSlopeInterpretation, rSquaredToFSquared } from '../../stats/regression';
import { formatStatistic } from '../../utils/statFormatters';
import AnalysisCard from '../analysis/AnalysisCard';
import AnalysisMetricTile from '../analysis/AnalysisMetricTile';

const RegressionEffectSizeSection = ({ currentStats, darkMode }) => {
    const [rSquared, setRSquared] = useState(0.25);
    const [slope, setSlope] = useState(0.8);
    const [unitChange, setUnitChange] = useState(1);

    useEffect(() => {
        if (Number.isFinite(currentStats?.rSquared)) setRSquared(currentStats.rSquared);
        if (Number.isFinite(currentStats?.slope)) setSlope(currentStats.slope);
    }, [currentStats?.rSquared, currentStats?.slope]);

    const fSquared = rSquaredToFSquared(rSquared);
    const signedR = (slope >= 0 ? 1 : -1) * Math.sqrt(Math.max(0, rSquared));
    const predictedChange = slope * unitChange;

    return (
        <div className="space-y-8">
            {currentStats?.ok && <AnalysisCard darkMode={darkMode}><div className="flex items-start justify-between gap-4"><div><div className="text-[10px] font-black uppercase tracking-widest mb-2 text-indigo-500">Current Calculator Snapshot</div><h3 className={`text-2xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>R² = {formatStatistic(currentStats.rSquared)}</h3><p className="mt-2 text-sm text-slate-500">Slope {formatStatistic(currentStats.slope)}; adjusted R² {formatStatistic(currentStats.adjustedRSquared)}.</p></div><span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">f² = {formatStatistic(rSquaredToFSquared(currentStats.rSquared))}</span></div></AnalysisCard>}
            <div className="grid lg:grid-cols-12 gap-8">
                <div className="lg:col-span-5">
                    <AnalysisCard darkMode={darkMode} className="h-full">
                        <div className="flex items-center gap-3 mb-4"><div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400"><Sigma size={18} /></div><div><div className="text-[10px] font-black uppercase tracking-widest text-indigo-500">Effect Size</div><h3 className={`text-2xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>Fit and slope are different ideas</h3></div></div>
                        <p className="text-sm text-slate-500">R² summarizes fit, while the slope describes the predicted change in Y per unit of X. Power translates R² into Cohen’s f².</p>
                        <div className="mt-6 grid gap-4">
                            <label><span className="text-[11px] font-black uppercase tracking-widest text-slate-500">Variance Explained (R²)</span><input type="number" min={0} max={0.999} step={0.01} value={rSquared} onChange={(event) => { const value = Number(event.target.value); if (Number.isFinite(value)) setRSquared(Math.max(0, Math.min(0.999, value))); }} className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm font-bold ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-900'}`} /></label>
                            <label><span className="text-[11px] font-black uppercase tracking-widest text-slate-500">Slope (b)</span><input type="number" step={0.01} value={slope} onChange={(event) => { const value = Number(event.target.value); if (Number.isFinite(value)) setSlope(value); }} className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm font-bold ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-900'}`} /></label>
                            <label><span className="text-[11px] font-black uppercase tracking-widest text-slate-500">Change in X</span><input type="number" step={0.1} value={unitChange} onChange={(event) => { const value = Number(event.target.value); if (Number.isFinite(value)) setUnitChange(value); }} className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm font-bold ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-900'}`} /></label>
                        </div>
                    </AnalysisCard>
                </div>
                <div className="lg:col-span-7 space-y-6">
                    <div className="grid md:grid-cols-3 gap-4"><AnalysisMetricTile darkMode={darkMode} label="R²" value={formatStatistic(rSquared)} tone="primary" detail={`${formatStatistic(rSquared * 100, 1)}% variance explained.`} /><AnalysisMetricTile darkMode={darkMode} label="Equivalent r" value={formatStatistic(signedR)} detail="In simple regression, r follows the slope’s sign." /><AnalysisMetricTile darkMode={darkMode} label="Predicted Change" value={formatStatistic(predictedChange)} detail={buildSlopeInterpretation({ slope, units: unitChange })} /></div>
                    <AnalysisCard darkMode={darkMode}><div className="flex items-center gap-3 mb-3"><TrendingUp size={18} className="text-emerald-500" /><h3 className={`text-lg font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>What R² means</h3></div><p className="text-sm text-slate-500">R² is the proportion of variability in Y accounted for by the fitted line; it does not describe slope size by itself.</p></AnalysisCard>
                    <AnalysisCard darkMode={darkMode}><div className="flex items-center gap-3 mb-3"><Info size={18} className="text-amber-500" /><h3 className={`text-lg font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>Why slope and fit can disagree</h3></div><p className="text-sm text-slate-500">Measurement scale and residual noise can produce a noticeable slope with weak fit, or a small slope with tight fit.</p></AnalysisCard>
                    <AnalysisCard darkMode={darkMode}><div className="text-[10px] font-black uppercase tracking-widest mb-2 text-indigo-500">Power Connection</div><p className="text-sm text-slate-500">At the current R², Cohen’s f² = {formatStatistic(fSquared)}.</p></AnalysisCard>
                </div>
            </div>
        </div>
    );
};

export default RegressionEffectSizeSection;
