import React, { useState } from 'react';
import { ChevronRight, ArrowRight, Calculator, Info } from 'lucide-react';

const SimpleEffectsExplorer = ({ factorA, factorB, cellStats, results, darkMode }) => {
    const [sliceFactor, setSliceFactor] = useState('A'); // Factor to "hold constant"
    const [selectedLevel, setSelectedLevel] = useState(null);

    const targetFactor = sliceFactor === 'A' ? factorB : factorA;
    const constantFactor = sliceFactor === 'A' ? factorA : factorB;

    // Perform a quick simple effects calculation for the selected slice
    const calculateSimpleEffect = (levelId) => {
        if (!levelId) return null;

        // Get all cells where constant factor = levelId
        const levels = targetFactor.levels;
        const means = [];
        const ns = [];
        const sss = [];

        levels.forEach(l => {
            const key = sliceFactor === 'A' ? `${levelId}_${l.id}` : `${l.id}_${levelId}`;
            const stats = cellStats[key];
            if (stats && stats.n > 0) {
                means.push(stats.mean);
                ns.push(stats.n);
                sss.push(stats.ss);
            }
        });

        if (means.length < 2) return null;

        // Simple 1-way ANOVA logic for these cells
        const totalN = ns.reduce((a, b) => a + b, 0);
        const weightedSum = means.reduce((sum, m, i) => sum + m * ns[i], 0);
        const grandMean = weightedSum / totalN;

        const ssBetween = means.reduce((sum, m, i) => sum + ns[i] * Math.pow(m - grandMean, 2), 0);
        const dfBetween = means.length - 1;
        const msBetween = ssBetween / dfBetween;

        // Pooled error from original ANOVA is usually better for simple effects
        const msError = results.effects.Error.ms;
        const dfError = results.effects.Error.df;

        const f = msBetween / msError;

        return {
            ss: ssBetween,
            df: dfBetween,
            ms: msBetween,
            f: f,
            label: constantFactor.levels.find(l => l.id === levelId)?.label
        };
    };

    const currentEffect = calculateSimpleEffect(selectedLevel);

    return (
        <div className="w-full flex flex-col gap-6 animate-in slide-in-from-bottom duration-500">
            <div className="flex items-start gap-4 p-6 rounded-[2rem] bg-indigo-500/5 border-2 border-indigo-500/10">
                <div className="p-3 bg-indigo-500 rounded-2xl text-white">
                    <Info size={20} />
                </div>
                <div>
                    <h4 className="text-[14px] font-black uppercase text-indigo-400 mb-1">Guided Explorer</h4>
                    <p className={`text-[12px] leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                        Since the interaction is significant, we should examine the effect of one factor **separately** at each level of the other.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-8">
                {/* Step 1: Choose Slice */}
                <div className={`p-6 rounded-[2.5rem] border-2 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-lg'}`}>
                    <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest block mb-4">Step 1: Choose Perspective</span>
                    <h3 className="text-[16px] font-black text-white mb-6 uppercase italic">I want to see the effect of...</h3>

                    <div className="flex flex-col gap-3">
                        <button
                            onClick={() => { setSliceFactor('B'); setSelectedLevel(null); }}
                            className={`p-4 rounded-2xl border-2 text-left transition-all ${sliceFactor === 'B' ? 'border-indigo-500 bg-indigo-500/10' : 'border-slate-800 hover:border-slate-700'}`}
                        >
                            <div className="flex justify-between items-center">
                                <span className="text-[12px] font-black text-white uppercase">{factorA.label}</span>
                                <ChevronRight size={14} className="text-slate-600" />
                            </div>
                            <span className="text-[10px] text-slate-500">at each level of {factorB.label}</span>
                        </button>

                        <button
                            onClick={() => { setSliceFactor('A'); setSelectedLevel(null); }}
                            className={`p-4 rounded-2xl border-2 text-left transition-all ${sliceFactor === 'A' ? 'border-indigo-500 bg-indigo-500/10' : 'border-slate-800 hover:border-slate-700'}`}
                        >
                            <div className="flex justify-between items-center">
                                <span className="text-[12px] font-black text-white uppercase">{factorB.label}</span>
                                <ChevronRight size={14} className="text-slate-600" />
                            </div>
                            <span className="text-[10px] text-slate-500">at each level of {factorA.label}</span>
                        </button>
                    </div>
                </div>

                {/* Step 2: Choose Level */}
                <div className={`p-6 rounded-[2.5rem] border-2 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-lg'}`}>
                    <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest block mb-4">Step 2: Pick a level</span>
                    <h3 className="text-[16px] font-black text-white mb-6 uppercase italic">...Specfically when {constantFactor.label} is:</h3>

                    <div className="grid grid-cols-1 gap-2">
                        {constantFactor.levels.map(l => (
                            <button
                                key={l.id}
                                onClick={() => setSelectedLevel(l.id)}
                                className={`p-3 rounded-xl border-2 text-[11px] font-black uppercase transition-all ${selectedLevel === l.id ? 'bg-emerald-600 border-emerald-500 text-white' : 'border-slate-800 text-slate-500 hover:text-slate-300'}`}
                            >
                                {l.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Step 3: Result */}
            {selectedLevel && (
                <div className="animate-in zoom-in duration-500">
                    <div className={`p-8 rounded-[3rem] border-2 bg-gradient-to-br ${darkMode ? 'from-indigo-950/20 to-slate-900 border-indigo-500/30' : 'from-indigo-50 to-white border-indigo-200'}`}>
                        <div className="flex items-center gap-3 mb-6">
                            <Calculator size={20} className="text-indigo-400" />
                            <h3 className="text-[18px] font-black uppercase tracking-tighter text-white">Simple Effect Analysis</h3>
                        </div>

                        {currentEffect ? (
                            <div className="grid grid-cols-3 gap-8">
                                <div className="col-span-2">
                                    <p className={`text-[14px] font-bold leading-relaxed ${darkMode ? 'text-indigo-200' : 'text-indigo-900'}`}>
                                        When <span className="text-emerald-400">{constantFactor.label}</span> is <span className="text-emerald-400">{currentEffect.label}</span>,
                                        the effect of <span className="text-indigo-400">{targetFactor.label}</span> results in an F-ratio of <span className="text-indigo-400">{currentEffect.f.toFixed(2)}</span>.
                                    </p>
                                    <p className="text-[11px] text-slate-500 mt-4 italic">
                                        *Analysis uses pooled MSError from the primary ANOVA for increased power.
                                    </p>
                                </div>
                                <div className={`p-6 rounded-[2rem] border-2 flex flex-col items-center justify-center ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-100'}`}>
                                    <span className="text-[10px] font-black uppercase text-slate-500 mb-2">Simple F-Ratio</span>
                                    <span className="text-[32px] font-black text-indigo-500">{currentEffect.f.toFixed(2)}</span>
                                    <span className="text-[10px] font-bold text-slate-600 mt-1">df({currentEffect.df}, {results.effects.Error.df})</span>
                                </div>
                            </div>
                        ) : (
                            <div className="p-4 text-center text-slate-500 italic text-[12px]">
                                Insufficient data to calculate simple effect for this level.
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SimpleEffectsExplorer;
