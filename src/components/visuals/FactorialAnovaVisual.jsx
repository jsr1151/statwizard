import React, { useState, useEffect, useMemo } from 'react';
import { Activity, LayoutGrid, PieChart, Plus, Sigma, X, GitCommit, Layers, Percent, Calculator } from 'lucide-react';
import { fCDF, fPPF, calculateFactorialAnova, calculatePostHocFactorial } from '../../utils/mathHelpers';
import FactorialDatasetEditor from './FactorialDatasetEditor';
import InteractionPlot from './InteractionPlot';
import FSamplingDist from './FSamplingDist';
import SimpleEffectsExplorer from './SimpleEffectsExplorer';
import { FACTORIAL_PRESETS } from '../../data/factorialPresets';

const FactorialAnovaVisual = ({ darkMode, showValues: propShowValues, onTutorUpdate, onStatsUpdate, tutor }) => {
    const [localShowValues, setLocalShowValues] = useState(propShowValues);
    useEffect(() => { setLocalShowValues(propShowValues); }, [propShowValues]);

    const [factorA, setFactorA] = useState({ label: 'Factor A', levels: [{ id: 'a1', label: 'A1' }, { id: 'a2', label: 'A2' }] });
    const [factorB, setFactorB] = useState({ label: 'Factor B', levels: [{ id: 'b1', label: 'B1' }, { id: 'b2', label: 'B2' }] });
    const [outcomeLabel, setOutcomeLabel] = useState('Outcome');
    const [cellData, setCellData] = useState({
        'a1_b1': { values: [8, 9, 7], summary: { mean: '8.0', sd: '1.0', n: '3' }, inputMode: 'raw' },
        'a1_b2': { values: [12, 11, 13], summary: { mean: '12.0', sd: '1.0', n: '3' }, inputMode: 'raw' },
        'a2_b1': { values: [10, 11, 9], summary: { mean: '10.0', sd: '1.0', n: '3' }, inputMode: 'raw' },
        'a2_b2': { values: [6, 7, 5], summary: { mean: '6.0', sd: '1.0', n: '3' }, inputMode: 'raw' }
    });

    const [activeTab, setActiveTab] = useState('table');
    const [selectedEffect, setSelectedEffect] = useState('AxB');
    const [swapAxes, setSwapAxes] = useState(false);
    const [alpha, setAlpha] = useState(0.05);

    // UI Toggles
    const [showRawPoints, setShowRawPoints] = useState(false);
    const [showMarginalMeans, setShowMarginalMeans] = useState(false);

    // --- CALCULATIONS ---
    const results = useMemo(() => calculateFactorialAnova(factorA, factorB, cellData), [factorA, factorB, cellData]);

    const currentModel = useMemo(() => {
        if (!results) return null;
        const effect = results.effects[selectedEffect];
        return {
            ...effect,
            df1: effect.df,
            df2: results.effects.Error.df,
            F: effect.f,
            Fcrit: fPPF(1 - alpha, effect.df, results.effects.Error.df),
            alpha
        };
    }, [results, selectedEffect, alpha]);

    // --- HANDLERS ---
    const loadPreset = (presetId) => {
        const preset = FACTORIAL_PRESETS.find(p => p.id === presetId);
        if (!preset) return;

        setFactorA(preset.factorA);
        setFactorB(preset.factorB);
        setOutcomeLabel(preset.outcome);
        setCellData(preset.data);
    };

    const addLevel = (factor) => {
        const target = factor === 'A' ? factorA : factorB;
        const setter = factor === 'A' ? setFactorA : setFactorB;
        if (target.levels.length >= 5) return;

        const newId = `${factor.toLowerCase()}${target.levels.length + 1}`;
        const newLevel = { id: newId, label: `${factor}${target.levels.length + 1}` };

        setter({ ...target, levels: [...target.levels, newLevel] });
    };

    const removeLevel = (factor, id) => {
        const target = factor === 'A' ? factorA : factorB;
        const setter = factor === 'A' ? setFactorA : setFactorB;
        if (target.levels.length <= 2) return;
        setter({ ...target, levels: target.levels.filter(l => l.id !== id) });
    };

    const updateLevelLabel = (factor, id, label) => {
        const setter = factor === 'A' ? setFactorA : setFactorB;
        const target = factor === 'A' ? factorA : factorB;
        setter({ ...target, levels: target.levels.map(l => l.id === id ? { ...l, label } : l) });
    };

    const updateCell = (key, field, val) => {
        setCellData(prev => ({ ...prev, [key]: { ...prev[key], [field]: val } }));
    };

    const updateCellStats = (key, field, val) => {
        setCellData(prev => ({
            ...prev,
            [key]: {
                ...prev[key],
                summary: { ...(prev[key]?.summary || {}), [field]: val }
            }
        }));
    };

    const parseCellRaw = (key, rawStr) => {
        const vals = rawStr.split(/[,\s\t\n]+/).map(v => parseFloat(v)).filter(v => !isNaN(v));
        const n = vals.length;
        const mean = n > 0 ? vals.reduce((a, b) => a + b, 0) / n : 0;
        const ss = vals.reduce((a, b) => a + Math.pow(b - mean, 2), 0);
        const sd = n > 1 ? Math.sqrt(ss / (n - 1)) : 0;

        setCellData(prev => ({
            ...prev,
            [key]: {
                ...prev[key],
                values: vals,
                summary: { n: n.toString(), mean: mean.toFixed(2), sd: sd.toFixed(2) }
            }
        }));
    };

    return (
        <div className="w-full flex flex-col gap-8 animate-in fade-in duration-700 relative">
            {/* Visualizer Frame */}
            <div className={`w-full h-[650px] overflow-hidden border-2 rounded-[3rem] relative transition-all ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'}`}>
                {/* Tab Navigation */}
                <div className="absolute top-6 left-6 flex gap-3 z-40">
                    {[
                        { id: 'data', label: 'Data', icon: <Sigma size={12} /> },
                        { id: 'plot', label: 'Plot', icon: <Activity size={12} /> },
                        { id: 'table', label: 'Table', icon: <Layers size={12} /> },
                        { id: 'explorer', label: 'Explorer', icon: <Calculator size={12} />, hidden: results?.effects?.AxB?.p >= alpha },
                        { id: 'fdist', label: 'F-Dist', icon: <Percent size={12} /> }
                    ].filter(t => !t.hidden).map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-xl' : 'bg-slate-900/90 text-slate-500 hover:text-slate-300'}`}
                        >
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </div>

                {/* Study Themes (Relocated and Relabeled) */}
                <div className="absolute top-[80px] left-6 z-40">
                    <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-black uppercase text-indigo-500/60 tracking-widest px-1">Study Themes</span>
                        <select
                            onChange={(e) => loadPreset(e.target.value)}
                            className={`bg-slate-900/60 backdrop-blur-xl text-slate-300 text-[10px] font-black uppercase tracking-widest px-4 py-2.5 rounded-2xl border border-slate-700/50 outline-none hover:border-indigo-500/50 hover:text-white transition-all cursor-pointer shadow-lg`}
                        >
                            <option value="">Select a Theme...</option>
                            {FACTORIAL_PRESETS.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="w-full h-full pt-20">
                    {activeTab === 'data' && (
                        <div className="w-full h-full overflow-y-auto p-8 custom-scrollbar">
                            <FactorialDatasetEditor
                                factorA={factorA}
                                factorB={factorB}
                                cellData={cellData}
                                updateCell={updateCell}
                                updateCellStats={updateCellStats}
                                parseCellRaw={parseCellRaw}
                                addLevel={addLevel}
                                removeLevel={removeLevel}
                                updateLevelLabel={updateLevelLabel}
                                darkMode={darkMode}
                            />
                        </div>
                    )}
                    {activeTab === 'plot' && (
                        <div className="w-full h-full flex flex-col items-center justify-center p-8">
                            {results ? (
                                <InteractionPlot
                                    factorA={factorA}
                                    factorB={factorB}
                                    cellStats={results.cellStats}
                                    cellData={cellData}
                                    swapAxes={swapAxes}
                                    outcomeLabel={outcomeLabel}
                                    showRawPoints={showRawPoints}
                                    showMarginalMeans={showMarginalMeans}
                                    darkMode={darkMode}
                                />
                            ) : (
                                <div className="text-slate-500 italic text-[14px]">Loading interaction plot...</div>
                            )}
                            <div className="flex gap-4 mt-4">
                                <button
                                    onClick={() => setSwapAxes(!swapAxes)}
                                    className={`px-4 py-2 rounded-full text-[9px] font-black transition-all border-2 ${swapAxes ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'}`}
                                >
                                    Swap Axes
                                </button>
                                <button
                                    onClick={() => setShowRawPoints(!showRawPoints)}
                                    className={`px-4 py-2 rounded-full text-[9px] font-black transition-all border-2 ${showRawPoints ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'}`}
                                >
                                    {showRawPoints ? 'Hide Points' : 'Show Points'}
                                </button>
                                <button
                                    onClick={() => setShowMarginalMeans(!showMarginalMeans)}
                                    className={`px-4 py-2 rounded-full text-[9px] font-black transition-all border-2 ${showMarginalMeans ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'}`}
                                >
                                    Marginal Means
                                </button>
                            </div>
                        </div>
                    )}
                    {activeTab === 'fdist' && currentModel && (
                        <FSamplingDist
                            mode="data"
                            fCrit={currentModel.Fcrit}
                            fVal={currentModel.F}
                            df1={currentModel.df1}
                            df2={currentModel.df2}
                            darkMode={darkMode}
                            setFVal={() => { }}
                        />
                    )}
                    {activeTab === 'fdist' && !currentModel && (
                        <div className="w-full h-full flex items-center justify-center p-8 text-slate-500 italic">
                            Fill in all cells to view distribution.
                        </div>
                    )}
                    {activeTab === 'table' && results && (
                        <div className="w-full h-full p-8 overflow-y-auto custom-scrollbar">
                            <div className="flex justify-between items-end mb-6">
                                <h2 className="text-[20px] font-black italic uppercase tracking-tighter text-indigo-500">ANOVA Summary</h2>
                                <span className="text-[10px] font-black text-slate-600 uppercase">df_Total = {results.effects.Total.df}</span>
                            </div>
                            <div className="grid grid-cols-1 gap-4">
                                {['A', 'B', 'AxB'].map(key => {
                                    const effect = results.effects[key];
                                    const isSig = effect.p < alpha;
                                    const isSelected = selectedEffect === key;
                                    return (
                                        <div
                                            key={key}
                                            onClick={() => { setSelectedEffect(key); setActiveTab('fdist'); }}
                                            className={`p-6 rounded-[2rem] border-2 cursor-pointer transition-all hover:scale-[1.01] active:scale-95 ${isSelected ? 'border-indigo-500 bg-indigo-500/10' : 'border-slate-800 bg-slate-900/30'}`}
                                        >
                                            <div className="grid grid-cols-5 items-center">
                                                <div className="col-span-2">
                                                    <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest block mb-1">Effect</span>
                                                    <span className="text-[14px] font-black uppercase text-white">{effect.label}</span>
                                                    <span className="text-[10px] font-bold text-slate-600 block mt-1">F({effect.df}, {results.effects.Error.df})</span>
                                                </div>
                                                <div className="text-center">
                                                    <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest block mb-1">P-Value</span>
                                                    <span className={`text-[14px] font-black ${isSig ? 'text-emerald-400' : 'text-slate-400'}`}>
                                                        {effect.p < 0.001 ? '< .001' : effect.p.toFixed(3)}
                                                    </span>
                                                </div>
                                                <div className="text-center">
                                                    <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest block mb-1">F-Ratio</span>
                                                    <span className="text-[14px] font-black text-indigo-400">{effect.f.toFixed(2)}</span>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest block mb-1">Partial η²</span>
                                                    <span className="text-[14px] font-black text-amber-500">{effect.pes.toFixed(3)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                                {/* Error Row */}
                                <div className="p-4 px-6 rounded-[1.5rem] border-2 border-dashed border-slate-800 opacity-50 flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-500">
                                    <span>Error (Residual)</span>
                                    <span>SS={results.effects.Error.ss.toFixed(2)}  |  df={results.effects.Error.df}  |  MS={results.effects.Error.ms.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    )}
                    {activeTab === 'explorer' && results && (
                        <div className="w-full h-full p-8 overflow-y-auto custom-scrollbar">
                            <SimpleEffectsExplorer
                                factorA={factorA}
                                factorB={factorB}
                                cellStats={results.cellStats}
                                results={results}
                                darkMode={darkMode}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom Controls / Interpetation */}
            <div className={`p-8 rounded-[3rem] border-2 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-xl'}`}>
                <div className="flex justify-between items-center mb-6">
                    <h5 className="text-[12px] font-black uppercase tracking-[0.3em] text-slate-500">Interpretation</h5>
                    <div className="flex gap-2">
                        {[0.1, 0.05, 0.01].map(a => (
                            <button key={a} onClick={() => setAlpha(a)} className={`px-4 py-1.5 rounded-xl text-[10px] font-black transition-all ${alpha === a ? 'bg-indigo-600 text-white' : 'text-slate-600'}`}>α={a}</button>
                        ))}
                    </div>
                </div>

                {results && results.effects.AxB.p < alpha ? (
                    <div className="p-6 bg-amber-500/10 border-2 border-amber-500/20 rounded-[2rem]">
                        <p className="text-[14px] font-bold text-amber-200 mb-2">
                            Significant Interaction Found!
                        </p>
                        <p className="text-[12px] text-amber-200/70 mb-4">
                            The lines in your interaction plot are likely non-parallel or crossing. This means the effect of {factorA.label} depends on the level of {factorB.label}. Main effects alone are not the full story!
                        </p>
                        <button
                            onClick={() => { setActiveTab('explorer'); }}
                            className="bg-amber-600 text-amber-950 px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-amber-500 transition-all font-black"
                        >
                            Explore Simple Effects
                        </button>
                    </div>
                ) : (
                    <div className="p-6 bg-emerald-500/10 border-2 border-emerald-500/20 rounded-[2rem]">
                        <p className="text-[14px] font-bold text-emerald-200 mb-2">
                            No Significant Interaction.
                        </p>
                        <p className="text-[12px] text-emerald-200/70">
                            The lines in your interaction plot are mostly parallel. You can confidently interpret the main effects of {factorA.label} and {factorB.label} individually.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FactorialAnovaVisual;
