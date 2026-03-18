import React, { useEffect, useMemo, useState } from 'react';
import { POWER_MODE_META } from '../../power/constants';
import { runPowerAnalysis } from '../../power/engine';

const PowerAnalysisPanel = ({ testConfig, currentStats, darkMode, initialMode, onResultChange }) => {
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

    const schema = powerConfig?.inputSchema?.[mode] || [];
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
                <div className="grid gap-4 mb-6">
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
                            </label>
                        ))}
                </div>
            )}

            {!result?.ok ? (
                <div className={`rounded-xl border p-4 ${result?.planned ? (darkMode ? 'bg-amber-500/10 border-amber-500/20 text-amber-200' : 'bg-amber-50 border-amber-200 text-amber-700') : (darkMode ? 'bg-rose-500/10 border-rose-500/20 text-rose-200' : 'bg-rose-50 border-rose-200 text-rose-700')}`}>
                    {(result?.errors || ['Power analysis is not available yet.']).join(' ')}
                </div>
            ) : (
                <div className="space-y-6">
                    <div className={`rounded-xl border p-5 ${darkMode ? 'bg-indigo-500/10 border-indigo-500/20' : 'bg-indigo-50 border-indigo-100'}`}>
                        <div className={`text-[10px] font-black uppercase tracking-widest mb-2 ${darkMode ? 'text-indigo-300' : 'text-indigo-700'}`}>
                            Summary
                        </div>
                        <p className={`${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>{result.summary}</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                        {result.metrics?.map((metric) => (
                            <div key={metric.id} className={`rounded-xl border p-4 ${metric.tone === 'primary' ? (darkMode ? 'bg-slate-950 border-indigo-500/30' : 'bg-white border-indigo-200') : (darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200')}`}>
                                <div className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                                    {metric.label}
                                </div>
                                <div className={`mt-2 text-2xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                    {metric.value}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default PowerAnalysisPanel;
