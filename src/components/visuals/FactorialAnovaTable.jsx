import React from 'react';
import { AlertTriangle, ChevronRight, GitCommit, Layers } from 'lucide-react';
import ProgressiveTooltip from '../common/ProgressiveTooltip';

const FactorialAnovaTable = ({
    alpha,
    darkMode,
    expandedEffect,
    factorA,
    factorB,
    results,
    ssType,
    onEffectSelect,
    onSsTypeChange,
}) => {
    const interactionIsSignificant = results.effects.AxB.p < alpha;
    const effects = Object.entries(results.effects)
        .filter(([key]) => key !== 'Error' && key !== 'Total')
        .sort(([leftKey], [rightKey]) => {
            if (!interactionIsSignificant) return 0;
            if (leftKey === 'AxB') return -1;
            if (rightKey === 'AxB') return 1;
            return 0;
        });

    return (
        <div className="w-full h-full p-8 overflow-y-auto custom-scrollbar">
            <div className="flex justify-between items-end mb-6">
                <div className="flex flex-col gap-1">
                    <h3 className="text-[14px] font-black uppercase text-indigo-500">ANOVA Summary Table (α = {alpha})</h3>
                    <div className="flex gap-4 items-center">
                        <p className={`text-[10px] font-bold ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Teaching Tip: Check interaction first.</p>
                        <div className="flex bg-slate-800 rounded-lg p-0.5 border border-slate-700">
                            <button type="button" onClick={() => onSsTypeChange('III')} className={`px-2 py-1 rounded text-[8px] font-black uppercase tracking-wider transition-all ${ssType === 'III' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}>Type III (Default)</button>
                            <button type="button" onClick={() => onSsTypeChange('I')} className={`px-2 py-1 rounded text-[8px] font-black uppercase tracking-wider transition-all ${ssType === 'I' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}>Type I (A → B)</button>
                        </div>
                    </div>
                    <p className={`text-[9px] font-medium ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                        {results.isBalanced
                            ? 'Balanced cells: Type I and Type III produce the same effect tests.'
                            : ssType === 'I'
                                ? `Sequential model order: ${factorA.label}, then ${factorB.label}, then interaction.`
                                : 'Type III tests each effect in the full model using sum-to-zero contrasts.'}
                    </p>
                </div>
                <ProgressiveTooltip term="Effect Size" title="Partial Eta Squared" desc="Proportion of variance explained by the effect." darkMode={darkMode}>
                    <div className="text-[11px] font-black text-slate-500 tracking-widest cursor-help">PARTIAL <span className="text-indigo-400 normal-case">η<sub>p</sub>²</span></div>
                </ProgressiveTooltip>
            </div>

            <div className="flex flex-col gap-4">
                {effects.map(([key, effect]) => {
                    const isExpanded = expandedEffect === key;
                    const isInteraction = key === 'AxB';

                    return (
                        <button
                            key={key}
                            type="button"
                            onClick={() => onEffectSelect(key, isExpanded)}
                            aria-expanded={isExpanded}
                            className={`w-full text-left p-6 rounded-[2rem] border-2 transition-all cursor-pointer group hover:scale-[1.01] ${isExpanded ? 'bg-indigo-600/10 border-indigo-500/50 shadow-2xl scale-[1.01]' : darkMode ? 'bg-slate-900/40 border-slate-800 shadow-xl' : 'bg-white border-slate-100 shadow-lg'} ${isInteraction && interactionIsSignificant ? 'ring-2 ring-indigo-500/30' : ''} ${!isInteraction && interactionIsSignificant ? 'opacity-50 grayscale-[0.3] scale-[0.98] hover:opacity-100 hover:grayscale-0' : ''}`}
                        >
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-4">
                                    <span className={`w-10 h-10 rounded-2xl flex items-center justify-center ${isInteraction ? 'bg-rose-500/10 text-rose-500' : 'bg-indigo-500/10 text-indigo-500'}`}>
                                        {isInteraction ? <Layers size={20} /> : <GitCommit size={20} />}
                                    </span>
                                    <span>
                                        <span className="flex items-center gap-2">
                                            <span className={`text-[12px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>{effect.label}</span>
                                            {isInteraction && interactionIsSignificant && <span className="bg-rose-500 text-white text-[7px] font-bold px-1.5 py-0.5 rounded-full">SIGNIFICANT</span>}
                                        </span>
                                        <ProgressiveTooltip term="F-ratio" title="Variance Ratio" desc="Effect variability divided by unexplained variability." darkMode={darkMode}>
                                            <span className="block text-[11px] font-mono font-bold text-indigo-400 cursor-help">
                                                F({effect.df}, {results.effects.Error.df}) = {effect.f.toFixed(2)}, p {effect.p < 0.001 ? '< .001' : `= ${effect.p.toFixed(3)}`}
                                            </span>
                                        </ProgressiveTooltip>
                                        {!isInteraction && interactionIsSignificant && (
                                            <span className="flex items-center gap-1 mt-1 text-amber-500 text-[8px] font-bold uppercase"><AlertTriangle size={8} />Interpret cautiously (interaction is significant)</span>
                                        )}
                                    </span>
                                </div>
                                <span className="flex items-center gap-12">
                                    <span className="text-center">
                                        <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest block mb-1">Effect Size</span>
                                        <span className="text-[16px] font-black text-indigo-400">{effect.pes.toFixed(2)} <span className="text-[10px] text-indigo-300 normal-case">η<sub>p</sub>²</span></span>
                                    </span>
                                    <ChevronRight size={16} className={`text-slate-600 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                                </span>
                            </div>

                            {isExpanded && (
                                <span className="mt-6 pt-6 border-t border-slate-700/30 grid grid-cols-4 gap-4 animate-in slide-in-from-top-2">
                                    <span><span className="text-[8px] font-black uppercase text-slate-500 block">Sum of Squares</span><span className="text-[12px] font-bold text-slate-300">{effect.ss.toFixed(2)}</span></span>
                                    <span><span className="text-[8px] font-black uppercase text-slate-500 block">Mean Square</span><span className="text-[12px] font-bold text-slate-300">{effect.ms.toFixed(2)}</span></span>
                                    <span className="col-span-2 bg-indigo-500/5 p-3 rounded-xl border border-indigo-500/10 text-[10px] text-slate-400">
                                        <span className="text-[8px] font-black uppercase text-indigo-400 block mb-1">Educational Insight</span>
                                        {key === 'A' || key === 'B'
                                            ? `Factor ${key} compares its levels after accounting for the other factor.`
                                            : "A significant interaction means the effect of one factor changes across levels of the other factor."}
                                    </span>
                                </span>
                            )}
                        </button>
                    );
                })}

                <div className={`mt-4 p-4 rounded-2xl border-2 border-dashed ${darkMode ? 'bg-slate-900/20 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="flex justify-between items-center opacity-60">
                        <ProgressiveTooltip term="Residual" title="Error Variance" desc="Unexplained variability used as the denominator of every F-test." darkMode={darkMode}>
                            <span className="text-[10px] font-black uppercase text-slate-500 cursor-help">Error (Residual)</span>
                        </ProgressiveTooltip>
                        <span className="text-[10px] font-bold text-slate-500">SS={results.effects.Error.ss.toFixed(2)} | df={results.effects.Error.df} | MS={results.effects.Error.ms.toFixed(2)}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FactorialAnovaTable;
