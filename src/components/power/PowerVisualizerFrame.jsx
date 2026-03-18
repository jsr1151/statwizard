import React from 'react';
import NormalDistributionVisual from '../visuals/NormalDistributionVisual';

const PowerVisualizerFrame = ({ result, testConfig, darkMode }) => {
    const metrics = result?.ok ? result.metrics || [] : [];
    const visualizerKey = result?.ok
        ? [
            testConfig?.id,
            result.mode,
            result.alpha,
            result.tails,
            result.direction,
            result.sampleSize,
            result.group1SampleSize,
            result.group2SampleSize,
            result.effectSize,
            result.criticalValue,
            result.df,
            result.noncentrality,
            result.actualPower,
        ].join(':')
        : `power-visualizer-${testConfig?.id || 'unknown'}`;

    return (
        <div className="space-y-6">
            <div className={`rounded-2xl border p-6 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                    <div>
                        <h3 className={`text-sm font-black uppercase tracking-widest mb-2 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
                            Power Plot
                        </h3>
                        <h4 className={`text-2xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                            {testConfig?.label}
                        </h4>
                        <p className={`mt-2 text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                            Planning view only: null vs alternative distributions, critical cutoff, and the alpha, beta, and power regions.
                        </p>
                    </div>
                </div>

                {!result?.ok || !result?.visualizer ? (
                    <div className={`rounded-xl border p-5 ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                        The shared visualizer frame is ready. As each solver lands, it can hand the page a standardized visualizer model instead of building a second visualization stack.
                    </div>
                ) : result.visualizer.kind === 'normal_distribution' ? (
                    <NormalDistributionVisual
                        key={visualizerKey}
                        darkMode={darkMode}
                        type={result.visualizer.type}
                        showTutor={false}
                        powerViewConfig={result.visualizer.config}
                    />
                ) : (
                    <div className={`rounded-xl border p-5 ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                        This test has a solver result, but its visualizer adapter has not been registered yet.
                    </div>
                )}
            </div>

            {result?.ok && metrics.length > 0 && (
                <div className={`rounded-2xl border p-6 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                    <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
                        <div>
                            <h3 className={`text-sm font-black uppercase tracking-widest mb-2 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
                                Key Results
                            </h3>
                            <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                These are the planning outputs from the shared power solver, not observed-data NHST results.
                            </p>
                        </div>
                    </div>

                    <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                        {metrics.map((metric) => (
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

            <div className={`rounded-2xl border p-6 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <h3 className={`text-sm font-black uppercase tracking-widest mb-4 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
                    How To Read The Plot
                </h3>
                <div className="grid md:grid-cols-3 gap-4">
                    <div className={`rounded-xl border p-4 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                        <div className={`text-[10px] font-black uppercase tracking-widest mb-2 ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                            H0 vs H1
                        </div>
                        <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                            The solid curve is the null distribution. The dashed curve is the alternative distribution implied by your effect size and sample size.
                        </p>
                    </div>
                    <div className={`rounded-xl border p-4 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                        <div className={`text-[10px] font-black uppercase tracking-widest mb-2 ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                            Error Regions
                        </div>
                        <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                            Red marks alpha under H0. Orange marks beta under H1. Green marks the power region where the design correctly detects the effect.
                        </p>
                    </div>
                    <div className={`rounded-xl border p-4 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                        <div className={`text-[10px] font-black uppercase tracking-widest mb-2 ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                            Planning Lens
                        </div>
                        <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                            This tab is for design planning, so it emphasizes alpha, power, effect size, sample size, and noncentrality rather than observed p-values or report text.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PowerVisualizerFrame;
