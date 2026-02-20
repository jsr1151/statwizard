import React, { useState, useEffect, useMemo } from 'react';
import { Activity, LayoutGrid, PieChart, Plus, Sigma, X, GitCommit, Layers, Percent, Calculator } from 'lucide-react';
import { fCDF, fPPF } from '../../utils/mathHelpers';
import FactorialAnovaTutorPanel from '../tutor/FactorialAnovaTutorPanel';
import ProgressiveTooltip from '../common/ProgressiveTooltip';
import useFactorialAnovaTutor from '../../hooks/useFactorialAnovaTutor';
import FactorialDatasetEditor from './FactorialDatasetEditor';
import { calculateFactorialAnova, calculateSimpleEffect } from '../../utils/factorialAnovaMath';
import InteractionPlot from './InteractionPlot';
import FSamplingDist from './FSamplingDist';
import SimpleEffectsExplorer from './SimpleEffectsExplorer';
import { FACTORIAL_PRESETS } from '../../data/factorialPresets';

import { ChevronRight, Info, AlertTriangle, HelpCircle } from 'lucide-react';

const FactorialAnovaVisual = ({ darkMode, showValues: propShowValues }) => {
    const [localShowValues, setLocalShowValues] = useState(propShowValues);
    useEffect(() => { setLocalShowValues(propShowValues); }, [propShowValues]);

    const [activeTab, setActiveTab] = useState('data');
    const [factorA, setFactorA] = useState({ label: "Factor A", levels: [{ id: 'a1', label: "A1" }, { id: 'a2', label: "A2" }] });
    const [factorB, setFactorB] = useState({ label: "Factor B", levels: [{ id: 'b1', label: "B1" }, { id: 'b2', label: "B2" }] });
    const [outcomeLabel, setOutcomeLabel] = useState("Outcome Variable");
    const [cellData, setCellData] = useState({
        'a1_b1': { values: [8, 9, 7], summary: { mean: '8.0', sd: '1.0', n: '3' }, inputMode: 'raw' },
        'a1_b2': { values: [12, 11, 13], summary: { mean: '12.0', sd: '1.0', n: '3' }, inputMode: 'raw' },
        'a2_b1': { values: [10, 11, 9], summary: { mean: '10.0', sd: '1.0', n: '3' }, inputMode: 'raw' },
        'a2_b2': { values: [6, 7, 5], summary: { mean: '6.0', sd: '1.0', n: '3' }, inputMode: 'raw' }
    });

    const [selectedEffect, setSelectedEffect] = useState('AxB');
    const [swapAxes, setSwapAxes] = useState(false);
    const [alpha, setAlpha] = useState(0.05);

    // UI Toggles
    const [showRawPoints, setShowRawPoints] = useState(false);
    const [showMarginalMeans, setShowMarginalMeans] = useState(false);
    const [showErrorBars, setShowErrorBars] = useState(true);
    const [plotFocus, setPlotFocus] = useState('interaction'); // 'interaction', 'A', 'B'
    const [expandedEffect, setExpandedEffect] = useState(null);

    const factors = useMemo(() => [factorA, factorB], [factorA, factorB]);

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

    const clearAll = () => {
        setCellData(prev => {
            const newCellData = {};
            for (const key in prev) {
                newCellData[key] = {
                    ...prev[key],
                    values: [],
                    summary: { mean: '0.0', sd: '0.0', n: '0' }
                };
            }
            return newCellData;
        });
    };

    // --- Tutor Logic ---
    const allCellsEmpty = useMemo(() => {
        return Object.values(cellData).every(c => (c.inputMode === 'raw' && c.values.length === 0) || (c.inputMode === 'summary' && !c.summary.n));
    }, [cellData]);

    const tutorContext = useMemo(() => ({
        activeTab,
        alpha,
        factorCount: factors.length,
        factorALabel: factors[0]?.label,
        factorBLabel: factors[1]?.label,
        totalCells: factors.reduce((acc, f) => acc * f.levels.length, 1),
        allCellsEmpty,
        hasEmptyCells: factors[0]?.levels.some(a => factors[1]?.levels.some(b => {
            const cell = cellData[`${a.id}_${b.id}`];
            return cell?.inputMode === 'raw' ? cell.values.length === 0 : !cell?.summary?.n;
        })),
        pInteraction: results?.effects?.AxB?.p || 1,
        themeSelected: factors[0]?.label !== 'Factor A' || factors[1]?.label !== 'Factor B', // Simple proxy
    }), [activeTab, alpha, factors, allCellsEmpty, cellData, results]);

    const tutor = useFactorialAnovaTutor(results, tutorContext);

    // Tab Change Signal
    useEffect(() => {
        tutor.triggerEvent({ signal: `change_tab_${activeTab}` });
    }, [activeTab]);

    // Alpha Change Signal
    useEffect(() => {
        tutor.triggerEvent({ signal: 'change_alpha' });
    }, [alpha]);

    const handleTutorAction = (action) => {
        switch (action) {
            case 'open_themes':
                // Could open a dropdown or prompt
                break;
            case 'focus_grid':
                setActiveTab('data');
                break;
            case 'go_to_explorer':
                setActiveTab('explorer');
                break;
            default: console.log("Tutor Action:", action);
        }
    };

    const handleLevelAdd = (factorId) => {
        addLevel(factorId);
        tutor.triggerEvent({ signal: 'add_level' });
    };

    const handleClearAll = () => {
        if (!allCellsEmpty) {
            tutor.triggerEvent({ signal: 'clear_all_attempt' });
        }
        clearAll();
    };

    return (
        <div
            className="w-full flex flex-col gap-8 animate-in fade-in duration-700 relative"
            onMouseMove={() => tutor.resetIdle()}
        >
            <FactorialAnovaTutorPanel
                tip={tutor.activeTip}
                onDismiss={tutor.dismissTip}
                onAction={handleTutorAction}
                darkMode={darkMode}
            />

            {/* Visualizer Frame - Increased height for more breathing room */}
            <div className={`w-full h-[800px] overflow-hidden border-2 rounded-[3rem] relative transition-all ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'}`}>
                {/* Tab Navigation */}
                <div className="absolute top-6 left-6 flex gap-3 z-40">
                    <div className="flex gap-2">
                        {[
                            { id: 'data', label: 'Data', tt: 'Enter your factorial data groups.' },
                            { id: 'plot', label: 'Plot', tt: 'Visualize main effects and interactions.' },
                            { id: 'table', label: 'Table', tt: 'View the ANOVA summary results.' },
                            { id: 'explorer', label: 'Explorer', tt: 'Drill down into simple effects.' },
                            { id: 'fdist', label: 'F-Dist', tt: 'See the probability distribution.' }
                        ].map(tab => (
                            <ProgressiveTooltip
                                key={tab.id}
                                term={tab.label}
                                title={`${tab.label} View`}
                                desc={tab.tt}
                                darkMode={darkMode}
                            >
                                <button
                                    onClick={() => {
                                        if (tab.id !== 'data' && !results) {
                                            tutor.triggerEvent({ signal: 'try_unlock_results' });
                                            return;
                                        }
                                        setActiveTab(tab.id);
                                    }}
                                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-900/90 text-slate-500 hover:text-slate-300'}`}
                                >
                                    {tab.label}
                                </button>
                            </ProgressiveTooltip>
                        ))}
                    </div>
                </div>

                {/* Header Labels - Integrated into Themes area to avoid tab collision */}
                <div className="absolute top-[85px] right-8 text-right z-40 pointer-events-none">
                    <ProgressiveTooltip
                        term="Design Model"
                        title="Between-Subjects"
                        desc="Between-subjects means each person contributes data to only one cell."
                        pedagogy="This design assumes that scores in different cells are independent because they come from different people."
                        darkMode={darkMode}
                    >
                        <div className="flex flex-col gap-0.5 pointer-events-auto cursor-help">
                            <span className="text-[10px] font-black uppercase text-indigo-500/60 tracking-widest px-1">Design Model</span>
                            <span className={`text-[9px] font-bold ${darkMode ? 'text-slate-600' : 'text-slate-400'} italic`}>Between-subjects (Independent Groups)</span>
                        </div>
                    </ProgressiveTooltip>
                </div>

                {/* Study Themes (Positioned below tabs, above content) */}
                <div className="absolute top-[85px] left-6 z-40">
                    <div className="flex flex-col gap-1.5">
                        <ProgressiveTooltip
                            term="Themes"
                            title="Study Themes"
                            desc="Study Themes pre-fill common factorial designs and example datasets."
                            pedagogy="Themes help you see how typical research questions map to factors and levels."
                            darkMode={darkMode}
                        >
                            <span className="text-[10px] font-black uppercase text-indigo-500/50 tracking-[0.2em] px-1 cursor-help">Study Themes</span>
                        </ProgressiveTooltip>
                        <select
                            onChange={(e) => {
                                loadPreset(e.target.value);
                                tutor.triggerEvent({ signal: 'theme_selected' });
                            }}
                            className={`bg-slate-900/40 backdrop-blur-2xl text-slate-300 text-[10px] font-black uppercase tracking-widest px-5 py-3 rounded-2xl border border-white/5 outline-none hover:border-indigo-500/30 hover:text-white transition-all cursor-pointer shadow-2xl min-w-[220px]`}
                        >
                            <option value="">Select a Theme...</option>
                            {FACTORIAL_PRESETS.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Main Content Area with increased padding to avoid overlap */}
                <div className="w-full h-full pt-44">
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
                        <div className="w-full h-full flex flex-col items-center justify-start p-8">
                            {results ? (
                                <InteractionPlot
                                    factorA={factorA}
                                    factorB={factorB}
                                    cellStats={results.cellStats}
                                    cellData={cellData}
                                    swapAxes={swapAxes}
                                    outcomeLabel={outcomeLabel}
                                    showRawPoints={showRawPoints}
                                    showMarginalMeans={showMarginalMeans || plotFocus === 'A' || plotFocus === 'B'}
                                    showErrorBars={showErrorBars}
                                    focusMode={plotFocus}
                                    darkMode={darkMode}
                                />
                            ) : (
                                <div className="text-slate-500 italic text-[14px]">Loading interaction plot...</div>
                            )}
                            <div className="flex gap-4 mt-12 pb-12">
                                <ProgressiveTooltip term="Axes" title="Swap Axes" desc="Switch which factor is on the x-axis." pedagogy="The interaction is the same, but one view may be easier to interpret than the other." darkMode={darkMode}>
                                    <button
                                        onClick={() => setSwapAxes(!swapAxes)}
                                        className={`px-4 py-2 rounded-full text-[9px] font-black transition-all border-2 ${swapAxes ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'}`}
                                    >
                                        Swap Axes
                                    </button>
                                </ProgressiveTooltip>
                                <ProgressiveTooltip term="Points" title="Show Points" desc="Show cell means as points on the interaction plot." darkMode={darkMode}>
                                    <button
                                        onClick={() => setShowRawPoints(!showRawPoints)}
                                        className={`px-4 py-2 rounded-full text-[9px] font-black transition-all border-2 ${showRawPoints ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'}`}
                                    >
                                        {showRawPoints ? 'Hide Points' : 'Show Points'}
                                    </button>
                                </ProgressiveTooltip>
                                <ProgressiveTooltip term="Marginal" title="Marginal Means" desc="Collapse across the other factor to show main effect means." pedagogy="Caution: Main effects can be misleading if the interaction is significant." darkMode={darkMode}>
                                    <button
                                        onClick={() => setShowMarginalMeans(!showMarginalMeans)}
                                        className={`px-4 py-2 rounded-full text-[9px] font-black transition-all border-2 ${showMarginalMeans ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'}`}
                                    >
                                        Marginal Means
                                    </button>
                                </ProgressiveTooltip>
                                <ProgressiveTooltip term="Error" title="Error Bars" desc="Show uncertainty (95% CI) around the cell means." pedagogy="Error bars help you visualize if differences are statistically robust." darkMode={darkMode}>
                                    <button
                                        onClick={() => setShowErrorBars(!showErrorBars)}
                                        className={`px-4 py-2 rounded-full text-[9px] font-black transition-all border-2 ${showErrorBars ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg' : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'}`}
                                    >
                                        {showErrorBars ? 'Hide 95% CI Bars' : 'Show 95% CI Bars'}
                                    </button>
                                </ProgressiveTooltip>
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
                                <div className="flex flex-col gap-1">
                                    <h3 className="text-[14px] font-black uppercase text-indigo-500">ANOVA Summary Table</h3>
                                    <p className={`text-[10px] font-bold ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                                        Teaching Tip: Check interaction first. If p {'<'} .05, interpret simple effects.
                                    </p>
                                </div>
                                <div className="text-[11px] font-black text-slate-500 tracking-widest flex items-baseline gap-1">
                                    <span className="uppercase text-[10px]">Partial</span> <span className="text-indigo-400" style={{ textTransform: 'none', fontStyle: 'italic', fontFamily: 'Times New Roman, serif', fontSize: '12px' }}>&eta;</span><sub className="lowercase text-[8px] translate-y-[-1px]">p</sub>²
                                </div>
                            </div>

                            <div className="flex flex-col gap-4">
                                {(() => {
                                    const effects = Object.entries(results.effects).filter(([k]) => k !== 'Error' && k !== 'Total');
                                    const interactionSig = results.effects.AxB.p < alpha;

                                    // Sort interactions to the top if significant
                                    const sortedEffects = [...effects].sort((a, b) => {
                                        if (interactionSig) {
                                            if (a[0] === 'AxB') return -1;
                                            if (b[0] === 'AxB') return 1;
                                        }
                                        return 0; // Keep original (A, B, AxB) if not sig
                                    });

                                    return sortedEffects.map(([key, effect]) => {
                                        const isExpanded = expandedEffect === key;
                                        const isInteraction = key === 'AxB';
                                        const isSig = effect.p < alpha;

                                        return (
                                            <div
                                                key={key}
                                                onClick={() => {
                                                    setExpandedEffect(isExpanded ? null : key);
                                                    if (key === 'A') setPlotFocus('A');
                                                    else if (key === 'B') setPlotFocus('B');
                                                    else {
                                                        setPlotFocus('interaction');
                                                        if (interactionSig) setActiveTab('explorer');
                                                    }
                                                }}
                                                className={`p-6 rounded-[2rem] border-2 transition-all cursor-pointer group hover:scale-[1.01] ${isExpanded ? 'bg-indigo-600/10 border-indigo-500/50 shadow-2xl scale-[1.01]' : (darkMode ? 'bg-slate-900/40 border-slate-800 shadow-xl' : 'bg-white border-slate-100 shadow-lg')} ${isInteraction && interactionSig ? 'ring-2 ring-indigo-500/30' : ''} ${!isInteraction && interactionSig ? 'opacity-50 grayscale-[0.3] scale-[0.98] hover:opacity-100 hover:grayscale-0 hover:scale-[1.01]' : ''}`}
                                            >
                                                <div className="flex justify-between items-center">
                                                    <div className="flex items-center gap-4">
                                                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${isInteraction ? 'bg-rose-500/10 text-rose-500' : 'bg-indigo-500/10 text-indigo-500'}`}>
                                                            {isInteraction ? <Layers size={20} /> : <GitCommit size={20} />}
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <h4 className={`text-[12px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                                                                    {effect.label}
                                                                </h4>
                                                                {isInteraction && interactionSig && (
                                                                    <span className="bg-rose-500 text-white text-[7px] font-bold px-1.5 py-0.5 rounded-full animate-pulse">SIGNIFICANT</span>
                                                                )}
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="text-[11px] font-mono font-bold text-indigo-400">
                                                                    F({effect.df}, {results.effects.Error.df}) = {effect.f.toFixed(2)}, p {effect.p < .001 ? '< .001' : `= ${effect.p.toFixed(3)}`}
                                                                </span>
                                                                {!isInteraction && interactionSig && (
                                                                    <div className="flex items-center gap-1 mt-1 text-amber-500">
                                                                        <AlertTriangle size={8} />
                                                                        <span className="text-[8px] font-bold uppercase">Interpret cautiously (Interaction is sig)</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-12">
                                                        <div className="text-center">
                                                            <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest block mb-1">Effect Size</span>
                                                            <div className="flex items-baseline justify-center gap-1">
                                                                <span className="text-[16px] font-black text-indigo-400">
                                                                    {effect.pes.toFixed(2)}
                                                                </span>
                                                                <span className="text-[10px] font-black text-indigo-300">
                                                                    <span style={{ textTransform: 'none', fontStyle: 'italic', fontFamily: 'Times New Roman, serif', fontSize: '11px' }}>&eta;</span><sub className="lowercase text-[8px] translate-y-[-1px]">p</sub>²
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <ChevronRight size={16} className={`text-slate-600 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                                                    </div>
                                                </div>

                                                {isExpanded && (
                                                    <div className="mt-6 pt-6 border-t border-slate-700/30 grid grid-cols-4 gap-4 animate-in slide-in-from-top-2">
                                                        <div>
                                                            <label className="text-[8px] font-black uppercase text-slate-500">Sum of Squares</label>
                                                            <div className="text-[12px] font-bold text-slate-300">{effect.ss.toFixed(2)}</div>
                                                        </div>
                                                        <div>
                                                            <label className="text-[8px] font-black uppercase text-slate-500">Mean Square</label>
                                                            <div className="text-[12px] font-bold text-slate-300">{effect.ms.toFixed(2)}</div>
                                                        </div>
                                                        <div className="col-span-2 bg-indigo-500/5 p-3 rounded-xl border border-indigo-500/10">
                                                            <div className="flex items-center gap-1.5 mb-1 text-indigo-400">
                                                                <span className="text-[8px] font-black uppercase">Educational Insight</span>
                                                                {isInteraction && interactionSig && (
                                                                    <span className="text-[8px] font-bold text-rose-400 italic">Click card to open Explorer</span>
                                                                )}
                                                            </div>
                                                            <div className="text-[10px] text-slate-400 leading-tight">
                                                                {key === 'A' || key === 'B' ?
                                                                    `Factor ${key} looks at differences across all levels of the other factor combined.` :
                                                                    "A significant interaction means 'it depends'—the effect of one factor changes based on the other factor."
                                                                }
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    });
                                })()}

                                <div className={`mt-4 p-4 rounded-2xl border-2 border-dashed ${darkMode ? 'bg-slate-900/20 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                                    <div className="flex justify-between items-center opacity-60">
                                        <span className="text-[10px] font-black uppercase text-slate-500">Residual (Error)</span>
                                        <span className="text-[10px] font-bold text-slate-500">SS={results.effects.Error.ss.toFixed(2)} | df={results.effects.Error.df} | MS={results.effects.Error.ms.toFixed(2)}</span>
                                    </div>
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
