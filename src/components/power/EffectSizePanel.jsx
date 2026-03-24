import React, { useEffect, useMemo, useState } from 'react';

const EffectSizePanel = ({ testConfig, currentStats, darkMode }) => {
    const transform = testConfig?.power?.effectSizeTransforms;
    const canCompute = typeof transform?.compute === 'function';
    const [inputs, setInputs] = useState(() => transform?.fromStats?.(currentStats) || {});

    useEffect(() => {
        setInputs(transform?.fromStats?.(currentStats) || {});
    }, [transform, currentStats, testConfig?.id]);

    const result = useMemo(() => {
        if (!canCompute) {
            return null;
        }

        return transform.compute(inputs);
    }, [canCompute, inputs, transform]);

    return (
        <div className="grid lg:grid-cols-12 gap-8">
            <div className="lg:col-span-5">
                <div className={`rounded-2xl border p-6 h-full ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                    <h3 className={`text-sm font-black uppercase tracking-widest mb-3 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
                        Effect Size
                    </h3>
                    <h4 className={`text-2xl font-black mb-3 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                        {transform?.primaryMetricLabel || 'Shared Effect Size'}
                    </h4>
                    <p className={`${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                        {transform?.description || 'This effect-size helper will be added as the next slice for this test.'}
                    </p>

                    {canCompute && (
                        <div className="mt-6 grid gap-4">
                            {transform.fields.map((field) => (
                                <label key={field.id} className="block">
                                    <span className={`text-[11px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                                        {field.label}
                                    </span>
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
                                </label>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="lg:col-span-7">
                <div className={`rounded-2xl border p-6 h-full ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                    {!canCompute ? (
                        <div className="h-full flex flex-col justify-center">
                            <div className={`inline-flex w-fit px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 ${darkMode ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                                Planned
                            </div>
                            <h4 className={`text-2xl font-black mb-3 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                Shared Effect-Size Slot Reserved
                            </h4>
                            <p className={`${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                This page now has a first-class Effect Size section, and the shared registry already knows this test belongs here. The dedicated transform helper is the next implementation step.
                            </p>
                        </div>
                    ) : result?.ok ? (
                        <div className="space-y-6">
                            <div>
                                <div className={`text-[11px] font-black uppercase tracking-widest mb-2 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
                                    Standardized Result
                                </div>
                                <div className={`text-4xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                    {result.metricLabel} = {result.effectSize.toFixed(4)}
                                </div>
                                <p className={`mt-3 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>{result.summary}</p>
                            </div>

                            {result.formulaDisplay && (
                                <div className={`rounded-xl border p-5 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                                    <div className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                                        Conversion Formula
                                    </div>
                                    <div className={`mt-3 text-2xl font-serif ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                        {result.formulaDisplay}
                                    </div>
                                    {result.formulaNote && (
                                        <p className={`mt-3 text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                            {result.formulaNote}
                                        </p>
                                    )}
                                </div>
                            )}

                            <div className="grid md:grid-cols-2 gap-4">
                                {result.support?.map((item) => (
                                    <div key={item.label} className={`rounded-xl border p-4 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                                        <div className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                                            {item.label}
                                        </div>
                                        <div className={`mt-2 text-xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                            {item.value}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className={`rounded-xl border p-4 ${darkMode ? 'bg-rose-500/10 border-rose-500/20 text-rose-200' : 'bg-rose-50 border-rose-200 text-rose-700'}`}>
                            {result?.error || 'Enter valid inputs to compute the effect size.'}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EffectSizePanel;
