import React, { useState, useEffect, useMemo } from 'react';
import { Activity, LayoutGrid, PieChart, Plus, Sigma, X, GitCommit, Layers, Percent } from 'lucide-react';
import { fCDF, fPPF, calculateFactorialAnova, calculatePostHocFactorial } from '../../utils/mathHelpers';
import FactorialDatasetEditor from './FactorialDatasetEditor';
import InteractionPlot from './InteractionPlot';
import FSamplingDist from './FSamplingDist';
import AnovaResults from './AnovaResults'; // We can reuse or extend this

const FactorialAnovaVisual = ({ darkMode, showValues: propShowValues, onTutorUpdate, onStatsUpdate, tutor }) => {
    const [localShowValues, setLocalShowValues] = useState(propShowValues);
    useEffect(() => { setLocalShowValues(propShowValues); }, [propShowValues]);

    const [factorA, setFactorA] = useState({ label: 'Factor A', levels: [{ id: 'a1', label: 'A1' }, { id: 'a2', label: 'A2' }] });
    const [factorB, setFactorB] = useState({ label: 'Factor B', levels: [{ id: 'b1', label: 'B1' }, { id: 'b2', label: 'B2' }] });
    const [cellData, setCellData] = useState({
        'a1_b1': { values: [10, 12, 11], summary: { mean: '11.0', sd: '1.0', n: '3' }, inputMode: 'raw' },
        'a1_b2': { values: [15, 14, 16], summary: { mean: '15.0', sd: '1.0', n: '3' }, inputMode: 'raw' },
        'a2_b1': { values: [20, 19, 21], summary: { mean: '20.0', sd: '1.0', n: '3' }, inputMode: 'raw' },
        'a2_b2': { values: [12, 11, 13], summary: { mean: '12.0', sd: '1.0', n: '3' }, inputMode: 'raw' }
    });

    const [activeTab, setActiveTab] = useState('table'); // 'data', 'plot', 'table', 'fdist', 'posthoc'
    const [selectedEffect, setSelectedEffect] = useState('AxB'); // 'A', 'B', 'AxB'
    const [swapAxes, setSwapAxes] = useState(false);
    const [alpha, setAlpha] = useState(0.05);

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
            <div className={`w-full h-[600px] overflow-hidden border-2 rounded-[3rem] relative transition-all ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'}`}>
                {/* Tab Navigation */}
                <div className="absolute top-6 left-6 flex gap-3 z-40">
                    {[
                        { id: 'data', label: 'Data Input', icon: <Sigma size={12} /> },
                        { id: 'plot', label: 'Interaction', icon: <Activity size={12} /> },
                        { id: 'table', label: 'ANOVA Table', icon: <Layers size={12} /> },
                        { id: 'fdist', label: 'F-Dist', icon: <Percent size={12} /> }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-xl' : 'bg-slate-900/90 text-slate-500 hover:text-slate-300'}`}
                        >
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </div>

                <div className="w-full h-full pt-16">
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
                        <div className="w-full h-full flex flex-col items-center justify-center">
                            <InteractionPlot
                                factorA={factorA}
                                factorB={factorB}
                                cellStats={results.cellStats}
                                swapAxes={swapAxes}
                                darkMode={darkMode}
                            />
                            <button
                                onClick={() => setSwapAxes(!swapAxes)}
                                className="mb-8 px-6 py-2 bg-slate-900 border border-slate-700 rounded-full text-[10px] font-black text-indigo-400 hover:bg-slate-800 transition-all uppercase tracking-widest"
                            >
                                Swap Axes
                            </button>
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
                            setFVal={() => { }} // Disabled in data mode
                        />
                    )}
                    {activeTab === 'table' && results && (
                        <div className="w-full h-full p-8 overflow-y-auto custom-scrollbar">
                            <h2 className="text-[20px] font-black italic uppercase tracking-tighter mb-6 text-indigo-500">ANOVA Summary</h2>
                            <div className="grid grid-cols-1 gap-4">
                                {['A', 'B', 'AxB'].map(key => {
                                    const effect = results.effects[key];
                                    const isSig = effect.p < alpha;
                                    return (
                                        <div
                                            key={key}
                                            onClick={() => setSelectedEffect(key)}
                                            className={`p-6 rounded-[2rem] border-2 cursor-pointer transition-all ${selectedEffect === key ? 'border-indigo-500 bg-indigo-500/10' : 'border-slate-800 bg-slate-900/30'}`}
                                        >
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest block mb-1">Source</span>
                                                    <span className="text-[14px] font-black uppercase text-white">{effect.label}</span>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest block mb-1">P-Value</span>
                                                    <span className={`text-[14px] font-black ${isSig ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                        {effect.p < 0.001 ? '< .001' : effect.p.toFixed(3)}
                                                    </span>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest block mb-1">F-Ratio</span>
                                                    <span className="text-[14px] font-black text-indigo-400">{effect.f.toFixed(2)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
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
                        <p className="text-[14px] font-bold text-amber-200">
                            Warning: Significant Interaction Found! Main effects should be interpreted with caution.
                            Consider simple effects analysis.
                        </p>
                    </div>
                ) : (
                    <div className="p-6 bg-indigo-500/10 border-2 border-indigo-500/20 rounded-[2rem]">
                        <p className="text-[14px] font-bold text-indigo-200">
                            No significant interaction. Main effects can be interpreted naively.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FactorialAnovaVisual;
