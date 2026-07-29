import React from 'react';
import { ArrowDown, Sparkles, TrendingUp } from 'lucide-react';
import { calculateAncovaPairwiseComparisons } from '../../stats/ancova';

const formatP = (value) => (value < 0.001 ? '< .001' : value.toFixed(3).replace(/^0/, ''));

const AncovaExplorerPanel = ({ alpha, darkMode, stats }) => {
    const comparisons = calculateAncovaPairwiseComparisons(stats);
    const rSquared = stats.ssT_y > 0 ? 1 - (stats.SSE_common / stats.ssT_y) : 0;

    return (
        <div className="max-w-4xl mx-auto p-4 sm:p-8 space-y-8">
            <div className="flex justify-between items-center">
                <h3 className={`text-2xl font-black uppercase tracking-widest ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Adjusted Effects & Slopes</h3>
                <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${stats.pInt < alpha ? 'border-rose-500/50 bg-rose-500/10 text-rose-500' : 'border-emerald-500/50 bg-emerald-500/10 text-emerald-500'}`}>{stats.pInt < alpha ? 'Interaction Significant' : 'Parallel Slopes'}</div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                <section className={`p-6 rounded-2xl border-2 shadow-sm ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                    <h4 className="text-[10px] font-black uppercase tracking-widest mb-4 flex gap-2 items-center text-indigo-500"><Sparkles size={14} />Adjusted Means at X = {stats.adjustX.toFixed(2)}</h4>
                    <div className="space-y-3">{stats.adjustedMeans.map((mean) => <div key={mean.id} className="flex items-center justify-between"><span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full" style={{ backgroundColor: mean.color }} /><span className="text-[11px] font-black uppercase text-slate-500">{mean.label}</span></span><span className="flex flex-col items-end"><span className="text-sm font-black font-mono" style={{ color: mean.color }}>{mean.adjM.toFixed(2)}</span><span className="text-[9px] text-slate-500 font-mono">SE = {mean.se.toFixed(2)}</span></span></div>)}</div>
                </section>
                <section className={`p-6 rounded-2xl border-2 shadow-sm ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                    <h4 className="text-[10px] font-black uppercase tracking-widest mb-4 flex gap-2 items-center text-emerald-500"><TrendingUp size={14} />Individual Regression Slopes</h4>
                    <div className="space-y-3">{stats.adjustedMeans.map((mean) => <div key={mean.id} className="flex items-center justify-between"><span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full" style={{ backgroundColor: mean.color }} /><span className="text-[11px] font-black uppercase text-slate-500">{mean.label}</span></span><span className="text-sm font-black font-mono" style={{ color: mean.color }}>b = {mean.b_j.toFixed(2)}</span></div>)}</div>
                </section>
            </div>

            <section className={`p-6 rounded-2xl border-2 shadow-sm ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <h4 className="text-[10px] font-black uppercase tracking-widest mb-4 text-indigo-500">Pairwise Comparisons at X = {stats.adjustX.toFixed(2)}</h4>
                <div className="space-y-2">
                    {comparisons.map((comparison) => (
                        <div key={comparison.id} className={`p-4 rounded-xl border flex flex-col sm:flex-row justify-between gap-4 ${darkMode ? 'bg-slate-800/40 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                            <span className="flex flex-col"><span className="text-[9px] font-black uppercase text-slate-500">{comparison.firstLabel} vs {comparison.secondLabel}</span><span className={`text-lg font-black font-mono ${comparison.difference > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>{comparison.difference > 0 ? '+' : ''}{comparison.difference.toFixed(2)}</span></span>
                            <span className="flex flex-col sm:items-end justify-center"><span className="flex gap-4 text-xs font-mono"><span>t = {comparison.t.toFixed(2)}</span><span className={`font-bold ${comparison.p < alpha ? 'text-rose-500' : 'text-slate-500'}`}>p {formatP(comparison.p)}</span></span><span className={`text-[9px] font-black uppercase tracking-widest mt-1 ${comparison.p < alpha ? 'text-rose-500' : 'text-slate-400'}`}>{comparison.p < alpha ? 'Significant Difference' : 'Not Significant'}</span></span>
                        </div>
                    ))}
                </div>
            </section>

            <details className="group border-t border-slate-700/30 pt-4">
                <summary className="flex items-center gap-2 cursor-pointer list-none text-[10px] font-black uppercase tracking-widest text-slate-500"><span className="w-5 h-5 rounded-full border border-current flex items-center justify-center transition-transform group-open:rotate-180"><ArrowDown size={12} /></span>Assumption Diagnostics</summary>
                <div className="mt-8 grid md:grid-cols-2 gap-8">
                    <section><h5 className="text-[10px] font-black uppercase text-indigo-500 mb-3">Residual Variance</h5>{stats.adjustedMeans.map((mean) => <div key={mean.id} className="flex justify-between text-xs"><span className="text-slate-500 uppercase text-[9px] font-bold">{mean.label}</span><span className="font-mono font-bold text-slate-400">{mean.residualVariance.toFixed(3)}</span></div>)}</section>
                    <section><h5 className="text-[10px] font-black uppercase text-indigo-500 mb-3">Model Fit</h5><div className="p-4 rounded-xl bg-slate-950/20 border border-slate-800"><div className="flex justify-between text-xs"><span className="text-slate-500">Overall R²</span><span className="font-mono font-bold text-emerald-500">{rSquared.toFixed(3)}</span></div><div className="flex justify-between text-xs"><span className="text-slate-500">Mean Square Error</span><span className="font-mono font-bold text-slate-400">{stats.MSE_common.toFixed(3)}</span></div></div></section>
                </div>
            </details>
        </div>
    );
};

export default AncovaExplorerPanel;
