import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { fPPF } from '../../utils/mathHelpers';
import { calculateFactorialAnova } from '../../stats/factorialAnova';
import {
    createFactorialTutorContext,
    isFactorialDatasetEmpty,
    summarizeFactorialCellRaw,
} from '../../stats/factorialAnovaViewModel';
import { FACTORIAL_PRESETS } from '../../data/factorialPresets';
import FactorialDatasetEditor from './FactorialDatasetEditor';
import FSamplingDist from './FSamplingDist';
import SimpleEffectsExplorer from './SimpleEffectsExplorer';
import FactorialAnovaHeader from './FactorialAnovaHeader';
import FactorialPlotPanel from './FactorialPlotPanel';
import FactorialAnovaTable from './FactorialAnovaTable';
import FactorialPostHocPanel from './FactorialPostHocPanel';
import FactorialDiagnosticsPanel from './FactorialDiagnosticsPanel';
import FactorialReportPanel from './FactorialReportPanel';
import FactorialInterpretation from './FactorialInterpretation';

const INITIAL_FACTOR_A = {
    label: 'Factor A',
    levels: [{ id: 'a1', label: 'A1' }, { id: 'a2', label: 'A2' }],
};
const INITIAL_FACTOR_B = {
    label: 'Factor B',
    levels: [{ id: 'b1', label: 'B1' }, { id: 'b2', label: 'B2' }],
};
const INITIAL_CELL_DATA = {
    a1_b1: { values: [8, 9, 7], summary: { mean: '8.0', sd: '1.0', n: '3' }, inputMode: 'raw' },
    a1_b2: { values: [12, 11, 13], summary: { mean: '12.0', sd: '1.0', n: '3' }, inputMode: 'raw' },
    a2_b1: { values: [10, 11, 9], summary: { mean: '10.0', sd: '1.0', n: '3' }, inputMode: 'raw' },
    a2_b2: { values: [6, 7, 5], summary: { mean: '6.0', sd: '1.0', n: '3' }, inputMode: 'raw' },
};

const FactorialAnovaVisual = ({ darkMode, onStatsUpdate, tutor }) => {
    const triggerTutorEvent = tutor?.triggerEvent;
    const resetTutorIdle = tutor?.resetIdle;
    const [activeTab, setActiveTab] = useState('data');
    const [factorA, setFactorA] = useState(INITIAL_FACTOR_A);
    const [factorB, setFactorB] = useState(INITIAL_FACTOR_B);
    const [outcomeLabel, setOutcomeLabel] = useState('Outcome Variable');
    const [cellData, setCellData] = useState(INITIAL_CELL_DATA);
    const [selectedEffect, setSelectedEffect] = useState('AxB');
    const [expandedEffect, setExpandedEffect] = useState(null);
    const [alpha, setAlpha] = useState(0.05);
    const [ssType, setSsType] = useState('III');
    const [swapAxes, setSwapAxes] = useState(false);
    const [showRawPoints, setShowRawPoints] = useState(false);
    const [showMarginalMeans, setShowMarginalMeans] = useState(false);
    const [showErrorBars, setShowErrorBars] = useState(true);
    const [errorBarType, setErrorBarType] = useState('95CI');
    const [showSimpleEffects, setShowSimpleEffects] = useState(false);
    const [plotFocus, setPlotFocus] = useState('interaction');

    const factors = useMemo(() => [factorA, factorB], [factorA, factorB]);
    const results = useMemo(
        () => calculateFactorialAnova(factorA, factorB, cellData, ssType),
        [factorA, factorB, cellData, ssType]
    );
    const allCellsEmpty = useMemo(() => isFactorialDatasetEmpty(cellData), [cellData]);
    const tutorContext = useMemo(() => createFactorialTutorContext({
        activeTab,
        alpha,
        factors,
        cellData,
        results,
    }), [activeTab, alpha, factors, cellData, results]);
    const currentModel = useMemo(() => {
        const effect = results?.effects[selectedEffect];
        const error = results?.effects.Error;
        if (!effect || !error) return null;

        return {
            F: effect.f,
            Fcrit: fPPF(1 - alpha, effect.df, error.df),
            df1: effect.df,
            df2: error.df,
        };
    }, [alpha, results, selectedEffect]);

    useEffect(() => {
        if (!onStatsUpdate) return;
        if (!results) {
            onStatsUpdate(null);
            return;
        }
        onStatsUpdate({
            ...results,
            factors,
            expandedEffect: expandedEffect || selectedEffect,
            tutorContext,
        });
    }, [expandedEffect, factors, onStatsUpdate, results, selectedEffect, tutorContext]);

    useEffect(() => {
        if (!results && activeTab !== 'data') setActiveTab('data');
    }, [activeTab, results]);

    useEffect(() => {
        triggerTutorEvent?.({ signal: `change_tab_${activeTab}` });
    }, [activeTab, triggerTutorEvent]);

    useEffect(() => {
        triggerTutorEvent?.({ signal: 'change_alpha' });
    }, [alpha, triggerTutorEvent]);

    const loadPreset = (presetId) => {
        const preset = FACTORIAL_PRESETS.find(({ id }) => id === presetId);
        if (!preset) return;
        setFactorA(preset.factorA);
        setFactorB(preset.factorB);
        setOutcomeLabel(preset.outcome);
        setCellData(preset.data);
        triggerTutorEvent?.({ signal: 'theme_selected' });
    };

    const addLevel = (factorId) => {
        const target = factorId === 'A' ? factorA : factorB;
        const setter = factorId === 'A' ? setFactorA : setFactorB;
        if (target.levels.length >= 5) return;
        const id = `${factorId.toLowerCase()}${target.levels.length + 1}`;
        setter({ ...target, levels: [...target.levels, { id, label: `${factorId}${target.levels.length + 1}` }] });
        triggerTutorEvent?.({ signal: 'add_level' });
    };

    const removeLevel = (factorId, id) => {
        const target = factorId === 'A' ? factorA : factorB;
        const setter = factorId === 'A' ? setFactorA : setFactorB;
        if (target.levels.length <= 2) return;
        setter({ ...target, levels: target.levels.filter((level) => level.id !== id) });
    };

    const updateLevelLabel = (factorId, id, label) => {
        const target = factorId === 'A' ? factorA : factorB;
        const setter = factorId === 'A' ? setFactorA : setFactorB;
        setter({ ...target, levels: target.levels.map((level) => (
            level.id === id ? { ...level, label } : level
        )) });
    };

    const updateCell = (key, field, value) => {
        setCellData((previous) => ({
            ...previous,
            [key]: { ...previous[key], [field]: value },
        }));
    };

    const updateCellStats = (key, field, value) => {
        setCellData((previous) => ({
            ...previous,
            [key]: {
                ...previous[key],
                summary: { ...(previous[key]?.summary || {}), [field]: value },
            },
        }));
    };

    const parseCellRaw = (key, raw) => {
        const parsed = summarizeFactorialCellRaw(raw);
        setCellData((previous) => ({
            ...previous,
            [key]: { ...previous[key], ...parsed, rawText: raw },
        }));
    };

    const clearAll = () => {
        if (!allCellsEmpty) triggerTutorEvent?.({ signal: 'clear_all_attempt' });
        setCellData((previous) => Object.fromEntries(Object.entries(previous).map(([key, cell]) => [
            key,
            { ...cell, values: [], rawText: '', summary: { mean: '0.0', sd: '0.0', n: '0' } },
        ])));
    };

    const handleEffectSelect = (key, isExpanded) => {
        setSelectedEffect(key);
        setExpandedEffect(isExpanded ? null : key);
        if (key === 'A' || key === 'B') {
            setPlotFocus(key);
        } else {
            setPlotFocus('interaction');
        }
        triggerTutorEvent?.({ signal: `expand_card_${key}` });
    };

    const handleTutorAction = useCallback((action) => {
        if (action === 'focus_grid') setActiveTab('data');
        if (action === 'go_to_explorer') setActiveTab('explorer');
    }, []);

    useEffect(() => {
        const handleAction = (event) => {
            if (event.detail) handleTutorAction(event.detail);
        };
        const handleSignal = (event) => {
            if (event.detail) triggerTutorEvent?.({ signal: event.detail });
        };
        window.addEventListener('factorialAnovaTutorAction', handleAction);
        window.addEventListener('factorialAnovaTutorSignal', handleSignal);
        return () => {
            window.removeEventListener('factorialAnovaTutorAction', handleAction);
            window.removeEventListener('factorialAnovaTutorSignal', handleSignal);
        };
    }, [handleTutorAction, triggerTutorEvent]);

    return (
        <div className="w-full flex flex-col gap-8 animate-in fade-in duration-700 relative" onMouseMove={resetTutorIdle}>
            <div className={`w-full h-[800px] overflow-hidden border-2 rounded-[3rem] relative transition-all ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'}`}>
                <FactorialAnovaHeader
                    activeTab={activeTab}
                    darkMode={darkMode}
                    hasResults={Boolean(results)}
                    onPresetChange={loadPreset}
                    onTabChange={setActiveTab}
                    onLockedTab={() => triggerTutorEvent?.({ signal: 'try_unlock_results' })}
                />

                <main className="w-full h-full pt-44">
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
                                onClearAll={clearAll}
                                darkMode={darkMode}
                            />
                        </div>
                    )}
                    {activeTab === 'plot' && results && (
                        <FactorialPlotPanel
                            alpha={alpha}
                            cellData={cellData}
                            darkMode={darkMode}
                            errorBarType={errorBarType}
                            factorA={factorA}
                            factorB={factorB}
                            outcomeLabel={outcomeLabel}
                            plotFocus={plotFocus}
                            results={results}
                            showErrorBars={showErrorBars}
                            showMarginalMeans={showMarginalMeans}
                            showRawPoints={showRawPoints}
                            showSimpleEffects={showSimpleEffects}
                            swapAxes={swapAxes}
                            onErrorBarTypeChange={setErrorBarType}
                            onShowErrorBarsChange={() => {
                                setShowErrorBars((value) => !value);
                                triggerTutorEvent?.({ signal: 'toggle_error_bars' });
                            }}
                            onShowMarginalMeansChange={() => {
                                setShowMarginalMeans((value) => !value);
                                triggerTutorEvent?.({ signal: 'toggle_marginal_means' });
                            }}
                            onShowRawPointsChange={() => {
                                setShowRawPoints((value) => !value);
                                triggerTutorEvent?.({ signal: 'toggle_show_points' });
                            }}
                            onShowSimpleEffectsChange={() => setShowSimpleEffects((value) => !value)}
                            onSwapAxesChange={() => {
                                setSwapAxes((value) => !value);
                                triggerTutorEvent?.({ signal: 'swap_axes' });
                            }}
                        />
                    )}
                    {activeTab === 'table' && results && (
                        <FactorialAnovaTable
                            alpha={alpha}
                            darkMode={darkMode}
                            expandedEffect={expandedEffect}
                            factorA={factorA}
                            factorB={factorB}
                            results={results}
                            ssType={ssType}
                            onEffectSelect={handleEffectSelect}
                            onSsTypeChange={setSsType}
                        />
                    )}
                    {activeTab === 'fdist' && currentModel && (
                        <FSamplingDist mode="data" fCrit={currentModel.Fcrit} fVal={currentModel.F} df1={currentModel.df1} df2={currentModel.df2} darkMode={darkMode} setFVal={() => {}} />
                    )}
                    {activeTab === 'explorer' && results && (
                        <div className="w-full h-full p-8 overflow-y-auto custom-scrollbar">
                            <SimpleEffectsExplorer factorA={factorA} factorB={factorB} cellStats={results.cellStats} results={results} darkMode={darkMode} />
                        </div>
                    )}
                    {activeTab === 'posthoc' && results && <FactorialPostHocPanel alpha={alpha} darkMode={darkMode} factorA={factorA} factorB={factorB} results={results} />}
                    {activeTab === 'diagnostics' && results && <FactorialDiagnosticsPanel alpha={alpha} darkMode={darkMode} results={results} />}
                    {activeTab === 'report' && results && (
                        <FactorialReportPanel alpha={alpha} darkMode={darkMode} factorA={factorA} factorB={factorB} outcomeLabel={outcomeLabel} results={results} onCopy={() => triggerTutorEvent?.({ signal: 'report_copied' })} />
                    )}
                </main>
            </div>

            <FactorialInterpretation
                alpha={alpha}
                darkMode={darkMode}
                factorA={factorA}
                factorB={factorB}
                results={results}
                onAlphaChange={setAlpha}
                onExplore={() => setActiveTab('explorer')}
            />
        </div>
    );
};

export default FactorialAnovaVisual;
