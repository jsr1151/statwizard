import React, { useEffect, useMemo, useState } from 'react';
import { POWER_MODE_META } from '../../power/constants';
import { runPowerAnalysis } from '../../power/engine';

const getImpliedAllocationSplit = (sampleSize, allocationRatio) => {
    const totalN = Math.round(Number(sampleSize));
    const ratio = Number(allocationRatio);

    if (!(totalN >= 4) || !(ratio > 0)) {
        return null;
    }

    const idealGroup1 = totalN / (1 + ratio);
    const group1SampleSize = Math.max(2, Math.min(totalN - 2, Math.round(idealGroup1)));
    const group2SampleSize = totalN - group1SampleSize;

    if (group2SampleSize < 2) {
        return null;
    }

    return { group1SampleSize, group2SampleSize };
};

const getDerivedGroupSummary = (group1SampleSize, group2SampleSize) => {
    const group1 = Math.round(Number(group1SampleSize));
    const group2 = Math.round(Number(group2SampleSize));

    if (!(group1 >= 2) || !(group2 >= 2)) {
        return null;
    }

    return {
        sampleSize: group1 + group2,
        allocationRatio: group2 / group1,
    };
};

const getBalancedGroupPreview = (sampleSize, groupCount) => {
    const totalN = Math.round(Number(sampleSize));
    const groups = Math.round(Number(groupCount));

    if (!(totalN >= 4) || !(groups >= 2)) {
        return null;
    }

    const perGroupSampleSize = totalN / groups;
    return {
        groupCount: groups,
        perGroupSampleSize,
        isExact: Math.abs(perGroupSampleSize - Math.round(perGroupSampleSize)) < 1e-9,
    };
};

const PowerAnalysisPanel = ({
    testConfig,
    currentStats,
    darkMode,
    initialMode,
    onResultChange,
    onModeChange,
}) => {
    const powerConfig = testConfig?.power;
    const availableModes = useMemo(() => {
        if (!powerConfig) {
            return [];
        }

        return (powerConfig.implementedPowerModes?.length
            ? powerConfig.implementedPowerModes
            : powerConfig.supportedPowerModes) || [];
    }, [powerConfig]);

    const resolvedInitialMode = initialMode || powerConfig?.defaultPowerMode || availableModes[0] || 'a_priori';
    const [mode, setMode] = useState(resolvedInitialMode);
    const [inputs, setInputs] = useState(() => powerConfig?.buildInitialInputs?.(currentStats, resolvedInitialMode) || {});

    useEffect(() => {
        const nextMode = initialMode || powerConfig?.defaultPowerMode || availableModes[0] || 'a_priori';
        setMode(nextMode);
        setInputs(powerConfig?.buildInitialInputs?.(currentStats, nextMode) || {});
    }, [testConfig?.id, powerConfig, currentStats, initialMode, availableModes]);

    const schema = useMemo(
        () => powerConfig?.inputSchema?.[mode] || [],
        [powerConfig, mode]
    );
    const visibleFieldIds = useMemo(
        () => new Set(
            schema
                .filter((field) => !(typeof field.hidden === 'function' && field.hidden(inputs)))
                .map((field) => field.id)
        ),
        [schema, inputs]
    );
    const result = useMemo(() => runPowerAnalysis(testConfig, { ...inputs, mode }), [testConfig, inputs, mode]);

    useEffect(() => {
        if (typeof onResultChange === 'function') {
            onResultChange(result);
        }
    }, [result, onResultChange]);

    return (
        <div className={`rounded-2xl border p-6 h-full ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
            <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
                <div>
                    <h3 className={`text-sm font-black uppercase tracking-widest mb-2 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
                        Power Analysis
                    </h3>
                    <h4 className={`text-2xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>{testConfig?.label}</h4>
                    <p className={`mt-2 text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                        {powerConfig?.gpowerFamily} -&gt; {powerConfig?.gpowerTest}
                    </p>
                    {powerConfig?.assumptionNote && (
                        <div className={`mt-4 max-w-3xl rounded-xl border px-4 py-3 ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                            <div className={`text-[10px] font-black uppercase tracking-widest mb-1 ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                                Current Scope
                            </div>
                            <p className="text-sm leading-relaxed">
                                {powerConfig.assumptionNote}
                            </p>
                        </div>
                    )}
                </div>
                <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${powerConfig?.status === 'available' ? (darkMode ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20' : 'bg-emerald-50 text-emerald-700 border border-emerald-200') : (darkMode ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20' : 'bg-amber-50 text-amber-700 border border-amber-200')}`}>
                    {powerConfig?.status === 'available' ? 'Live Solver' : 'Architecture Reserved'}
                </div>
            </div>

            <div className={`rounded-xl border p-1 flex flex-wrap gap-1 mb-6 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                {availableModes.map((modeId) => (
                    <button
                        key={modeId}
                        onClick={() => {
                            setMode(modeId);
                            setInputs(powerConfig?.buildInitialInputs?.(currentStats, modeId) || {});
                            onModeChange?.(modeId);
                        }}
                        className={`px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${mode === modeId ? 'bg-indigo-600 text-white shadow-lg' : (darkMode ? 'text-slate-500 hover:text-slate-200 hover:bg-slate-900' : 'text-slate-500 hover:text-slate-900 hover:bg-white')}`}
                    >
                        {POWER_MODE_META[modeId]?.shortLabel || modeId}
                    </button>
                ))}
            </div>

            <p className={`text-sm mb-6 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                {POWER_MODE_META[mode]?.description || 'Shared power mode'}
            </p>

            {schema.length > 0 && (
                <div className="mb-6">
                    <div className={`text-[10px] font-black uppercase tracking-widest mb-4 ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                        Planning Inputs
                    </div>
                    <div className="grid gap-4">
                        {schema
                            .filter((field) => !(typeof field.hidden === 'function' && field.hidden(inputs)))
                            .map((field) => (
                                <label key={field.id} className="block">
                                    <span className={`text-[11px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                                        {field.label}
                                    </span>

                                    {field.type === 'select' ? (
                                        <select
                                            value={inputs[field.id] ?? ''}
                                            onChange={(event) => {
                                                const nextValue = event.target.value;
                                                setInputs((prev) => ({
                                                    ...prev,
                                                    [field.id]: Number.isNaN(Number(nextValue)) || nextValue === '' ? nextValue : Number(nextValue),
                                                }));
                                            }}
                                            className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm font-bold outline-none transition-colors ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200 focus:border-indigo-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500'}`}
                                        >
                                            {field.options?.map((option) => (
                                                <option key={option.value} value={option.value}>
                                                    {option.label}
                                                </option>
                                            ))}
                                        </select>
                                    ) : (
                                        <input
                                            type="number"
                                            min={field.min}
                                            max={field.max}
                                            step={field.step || 'any'}
                                            value={inputs[field.id] ?? ''}
                                            onChange={(event) => {
                                                const nextValue = event.target.value;
                                                setInputs((prev) => ({
                                                    ...prev,
                                                    [field.id]: nextValue === '' ? '' : Number(nextValue),
                                                }));
                                            }}
                                            className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm font-bold outline-none transition-colors ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200 focus:border-indigo-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500'}`}
                                        />
                                    )}

                                    {field.helperText && (
                                        <p className={`mt-2 text-xs leading-relaxed ${darkMode ? 'text-slate-500' : 'text-slate-600'}`}>
                                            {field.helperText}
                                        </p>
                                    )}

                                    {field.id === 'allocationRatio' && (() => {
                                        if (!visibleFieldIds.has('sampleSize')) {
                                            return null;
                                        }

                                        const split = getImpliedAllocationSplit(inputs.sampleSize, inputs.allocationRatio);

                                        if (!split) {
                                            return null;
                                        }

                                        return (
                                            <p className={`mt-2 text-[11px] font-medium ${darkMode ? 'text-indigo-300/80' : 'text-indigo-700'}`}>
                                                At the current total N, this implies about n1 = {split.group1SampleSize} and n2 = {split.group2SampleSize}.
                                            </p>
                                        );
                                    })()}

                                    {field.id === 'group2SampleSize' && (() => {
                                        const groupSummary = getDerivedGroupSummary(inputs.group1SampleSize, inputs.group2SampleSize);

                                        if (!groupSummary) {
                                            return null;
                                        }

                                        return (
                                            <p className={`mt-2 text-[11px] font-medium ${darkMode ? 'text-indigo-300/80' : 'text-indigo-700'}`}>
                                                Total N = {groupSummary.sampleSize}; allocation ratio ~ {groupSummary.allocationRatio.toFixed(2)}.
                                            </p>
                                        );
                                    })()}

                                    {field.id === 'sampleSize' && (() => {
                                        if (
                                            !visibleFieldIds.has('groupCount') ||
                                            visibleFieldIds.has('group1SampleSize') ||
                                            visibleFieldIds.has('group2SampleSize')
                                        ) {
                                            return null;
                                        }

                                        const preview = getBalancedGroupPreview(inputs.sampleSize, inputs.groupCount);

                                        if (!preview) {
                                            return null;
                                        }

                                        return (
                                            <p className={`mt-2 text-[11px] font-medium ${darkMode ? 'text-indigo-300/80' : 'text-indigo-700'}`}>
                                                At the current total N, a balanced split is {preview.isExact ? `${Math.round(preview.perGroupSampleSize)}` : `about ${preview.perGroupSampleSize.toFixed(2)}`} per group across {preview.groupCount} groups.
                                            </p>
                                        );
                                    })()}
                                </label>
                            ))}
                    </div>
                </div>
            )}

            {!result?.ok ? (
                <div className={`rounded-xl border p-4 ${result?.planned ? (darkMode ? 'bg-amber-500/10 border-amber-500/20 text-amber-200' : 'bg-amber-50 border-amber-200 text-amber-700') : (darkMode ? 'bg-rose-500/10 border-rose-500/20 text-rose-200' : 'bg-rose-50 border-rose-200 text-rose-700')}`}>
                    {(result?.errors || ['Power analysis is not available yet.']).join(' ')}
                </div>
            ) : (
                <div className="space-y-4">
                    <div className={`rounded-xl border p-5 ${darkMode ? 'bg-indigo-500/10 border-indigo-500/20' : 'bg-indigo-50 border-indigo-100'}`}>
                        <div className={`text-[10px] font-black uppercase tracking-widest mb-2 ${darkMode ? 'text-indigo-300' : 'text-indigo-700'}`}>
                            Planning Summary
                        </div>
                        <p className={`${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>{result.summary}</p>
                    </div>
                    <p className={`text-sm ${darkMode ? 'text-slate-500' : 'text-slate-600'}`}>
                        The plot and result cards on the right summarize the planning output. This panel is only for selecting the power-analysis mode and entering the inputs that drive the shared solver.
                    </p>
                </div>
            )}
        </div>
    );
};

export default PowerAnalysisPanel;
