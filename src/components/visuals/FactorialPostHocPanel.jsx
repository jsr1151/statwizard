import React from 'react';
import { calculatePostHocFactorial } from '../../utils/mathHelpers';

const FactorialPostHocPanel = ({ alpha, darkMode, factorA, factorB, results }) => (
    <div className="w-full h-full p-8 overflow-y-auto custom-scrollbar">
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="space-y-4">
                <h3 className={`text-lg font-black uppercase tracking-widest ${darkMode ? 'text-white' : 'text-slate-900'}`}>Pairwise Comparisons</h3>
                <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Differences between levels of each factor, collapsed across the other factor.</p>
            </div>

            {['A', 'B'].map((mode) => {
                const factor = mode === 'A' ? factorA : factorB;
                const effect = results.effects[mode];
                const comparisons = calculatePostHocFactorial(results, mode);

                return (
                    <section key={mode} className={`p-6 rounded-[2rem] border-2 ${darkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-slate-100 shadow-xl'}`}>
                        <div className="flex justify-between items-center mb-6">
                            <h4 className="text-sm font-black uppercase tracking-widest text-indigo-400">Factor {mode}: {factor.label}</h4>
                            <span className={`${effect.p < alpha ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-500/20 text-slate-500'} text-[9px] font-black px-3 py-1 rounded-full uppercase`}>
                                {effect.p < alpha ? 'Significant Main Effect' : 'Not Significant'}
                            </span>
                        </div>
                        <div className="space-y-3">
                            {comparisons.map((comparison) => (
                                <div key={comparison.pair.join('-')} className={`p-4 rounded-xl flex justify-between items-center border ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                                    <div className="flex items-center gap-4">
                                        <span className="text-xs font-bold text-slate-400">{comparison.pair[0]} vs {comparison.pair[1]}</span>
                                        <span className={`text-xs font-mono ${comparison.sig ? 'text-emerald-400' : 'text-slate-500'}`}>diff = {comparison.diff.toFixed(2)}</span>
                                    </div>
                                    <div className="text-right">
                                        <div className={`text-[10px] font-black uppercase tracking-tighter ${comparison.sig ? 'text-emerald-500' : 'text-slate-500'}`}>p = {comparison.pAdj < 0.001 ? '< .001' : comparison.pAdj.toFixed(3)} {comparison.sig ? '***' : ''}</div>
                                        <div className="text-[8px] text-slate-600 uppercase font-bold tracking-tight">Bonferroni Adj.</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                );
            })}
        </div>
    </div>
);

export default FactorialPostHocPanel;
