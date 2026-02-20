import React, { useState } from 'react';
import { ChevronRight, ArrowRight, Calculator, Info, GitCompare } from 'lucide-react';
import { calculate95CI, fCDF } from '../../utils/mathHelpers';

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

        // Calculate p-value
        const p = 1 - fCDF(f, dfBetween, dfError);

        // Calculate Mean Difference and CI (using pooled error)
        const cellInfo = [];
        levels.forEach(l => {
            const key = sliceFactor === 'A' ? `${levelId}_${l.id}` : `${l.id}_${levelId}`;
            const stats = cellStats[key];
            if (stats) {
                cellInfo.push({ label: l.label, mean: stats.mean, n: stats.n, sd: Math.sqrt(stats.ss / (stats.n - 1 || 1)) });
            }
        });

        // For simplicity, we show the range/diff of the first two levels or max/min if more than 2
        const meanDiff = Math.abs(cellInfo[0].mean - cellInfo[1].mean);
        const se = Math.sqrt(msError * (1 / cellInfo[0].n + 1 / cellInfo[1].n));
        const margin = 1.96 * se; // Approx 95% CI

        return {
            ss: ssBetween,
            df: dfBetween,
            ms: msBetween,
            f: f,
            p: p,
            meanDiff,
            margin,
            cellInfo,
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
                                    <div className="flex flex-col gap-4">
                                        <p className={`text-[14px] font-bold leading-relaxed ${darkMode ? 'text-indigo-200' : 'text-indigo-900'}`}>
                                            When <span className="text-emerald-400">{constantFactor.label}</span> is <span className="text-emerald-400">{currentEffect.label}</span>,
                                            the effect of <span className="text-indigo-400">{targetFactor.label}</span> is <span className={currentEffect.p < 0.05 ? 'text-emerald-500' : 'text-slate-500'}>
                                                {currentEffect.p < 0.05 ? 'significant' : 'not significant'}
                                            </span>.
                                        </p>

                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Focus:</span>
                                            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-500/10 border border-slate-500/20 text-[9px] font-bold text-slate-400">
                                                Comparing <span className="text-indigo-400">{currentEffect.cellInfo[0].label}</span> vs <span className="text-indigo-400">{currentEffect.cellInfo[1].label}</span>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            {currentEffect.cellInfo.map((cell, idx) => (
                                                <div key={idx} className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                                                    <span className="text-[8px] font-black uppercase text-slate-500 block mb-1">{cell.label} Mean</span>
                                                    <span className="text-[16px] font-black text-white">{cell.mean.toFixed(2)}</span>
                                                    <span className="text-[8px] font-bold text-slate-600 block mt-1">n={cell.n}</span>
                                                </div>
                                            ))}
                                        </div>

                                        <div className={`p-4 rounded-2xl border-2 border-dashed ${darkMode ? 'bg-indigo-500/5 border-indigo-500/20' : 'bg-indigo-50 border-indigo-100'} flex items-center justify-between`}>
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400">
                                                    <GitCompare size={14} />
                                                </div>
                                                <div>
                                                    <span className="text-[8px] font-black uppercase text-slate-500 block">Mean Difference</span>
                                                    <span className="text-[13px] font-black text-indigo-400">{currentEffect.meanDiff.toFixed(2)}</span>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-[8px] font-black uppercase text-slate-500 block">95% CI of Diff</span>
                                                <span className="text-[11px] font-bold text-slate-400">
                                                    ±{currentEffect.margin.toFixed(2)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <p className="text-[10px] text-slate-500 mt-6 italic flex items-center gap-2">
                                        <Info size={10} />
                                        <span>Analysis uses pooled Error Variance ({results.effects.Error.ms.toFixed(2)}) for higher sensitivity.</span>
                                    </p>
                                </div>
                                <div className={`p-6 rounded-[2.5rem] border-2 flex flex-col items-center justify-center ${darkMode ? 'bg-slate-950 border-slate-800 shadow-2xl' : 'bg-white border-slate-100 shadow-xl'}`}>
                                    <span className="text-[9px] font-black uppercase text-slate-500 mb-2 tracking-[0.2em]">F-Ratio</span>
                                    <span className={`text-[36px] font-black leading-none ${currentEffect.p < 0.05 ? 'text-emerald-500' : 'text-indigo-500'}`}>
                                        {currentEffect.f.toFixed(2)}
                                    </span>
                                    <div className="mt-3 text-center">
                                        <span className={`text-[12px] font-black uppercase block ${currentEffect.p < 0.05 ? 'text-emerald-500' : 'text-slate-500'}`}>
                                            p {currentEffect.p < 0.001 ? '< .001' : `= ${currentEffect.p.toFixed(3)}`}
                                        </span>
                                        <span className="text-[9px] font-bold text-slate-600 uppercase mt-1 block">df({currentEffect.df}, {results.effects.Error.df})</span>
                                    </div>
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
