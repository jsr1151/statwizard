import React, { useEffect, useMemo, useState } from 'react';
import NormalDistributionVisual from '../visuals/NormalDistributionVisual';
import PowerCurveChart from './PowerCurveChart';
import FPowerDistributionVisual from './FPowerDistributionVisual';
import { buildPowerCurveModel } from '../../power/curves';

const PowerVisualizerFrame = ({ result, testConfig, darkMode }) => {
    const metrics = result?.ok ? result.metrics || [] : [];
    const [activeView, setActiveView] = useState('distribution');
    const [curveType, setCurveType] = useState('sample_size');
    const visualizerKey = result?.ok
        ? [
            testConfig?.id,
            result.visualizer?.kind,
            result.mode,
            result.alpha,
            result.tails,
            result.direction,
            result.sampleSize,
            result.group1SampleSize,
            result.group2SampleSize,
            result.groupCount,
            result.covariateCount,
            result.perGroupSampleSize,
            result.effectSize,
            result.criticalValue,
            result.df,
            result.numeratorDf,
            result.denominatorDf,
            result.noncentrality,
            result.actualPower,
        ].join(':')
        : `power-visualizer-${testConfig?.id || 'unknown'}`;
    const defaultCurveType = result?.mode === 'sensitivity' ? 'effect_size' : 'sample_size';
    const curveModel = useMemo(
        () => buildPowerCurveModel({ testConfig, result, curveType }),
        [testConfig, result, curveType]
    );

    useEffect(() => {
        setActiveView('distribution');
    }, [testConfig?.id]);

    useEffect(() => {
        setCurveType(defaultCurveType);
    }, [testConfig?.id, result?.mode]);

    const viewDescription = activeView === 'distribution'
        ? 'Planning view only: null vs alternative distributions, critical cutoff, and the alpha, beta, and power regions.'
        : 'Power curve view: how power changes as sample size or effect size moves while the rest of the current design stays fixed.';

    const readingCards = activeView === 'distribution'
        ? [
            {
                title: 'H0 vs H1',
                body: 'The solid curve is the null distribution. The dashed curve is the alternative distribution implied by your effect size and sample size.',
            },
            {
                title: 'Error Regions',
                body: 'Red marks alpha under H0. Orange marks beta under H1. Green marks the power region where the design correctly detects the effect.',
            },
            {
                title: 'Planning Lens',
                body: 'This tab is for design planning, so it emphasizes alpha, power, effect size, sample size, and noncentrality rather than observed p-values or report text.',
            },
        ]
        : [
            {
                title: 'Curve Meaning',
                body: 'The line shows achieved power for a series of nearby designs generated from the current solver state.',
            },
            {
                title: 'Current Marker',
                body: 'The highlighted point is the active design on this page, so you can see how it sits on the broader planning curve.',
            },
            {
                title: 'Curve Shape',
                body: curveModel?.curveNature === 'continuous'
                    ? 'Effect-size sweeps are continuous, so this curve is sampled more densely and should stay smooth even as power saturates toward 1.'
                    : 'Sample-size sweeps are discrete, so small steps or plateaus can be real when total N or balanced group counts move in whole-number chunks.',
            },
        ];

    return (
        <div className="space-y-6">
            <div className={`rounded-2xl border p-6 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                    <div>
                        <h3 className={`text-sm font-black uppercase tracking-widest mb-2 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
                            Power Visuals
                        </h3>
                        <h4 className={`text-2xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                            {testConfig?.label}
                        </h4>
                        <p className={`mt-2 text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                            {viewDescription}
                        </p>
                    </div>
                    {result?.ok && (
                        <div className="space-y-3">
                            <div className={`rounded-xl border p-1 flex gap-1 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                                <button
                                    onClick={() => setActiveView('distribution')}
                                    className={`px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeView === 'distribution' ? 'bg-indigo-600 text-white shadow-lg' : (darkMode ? 'text-slate-500 hover:text-slate-200 hover:bg-slate-900' : 'text-slate-500 hover:text-slate-900 hover:bg-white')}`}
                                >
                                    Distribution Plot
                                </button>
                                <button
                                    onClick={() => setActiveView('curve')}
                                    className={`px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeView === 'curve' ? 'bg-indigo-600 text-white shadow-lg' : (darkMode ? 'text-slate-500 hover:text-slate-200 hover:bg-slate-900' : 'text-slate-500 hover:text-slate-900 hover:bg-white')}`}
                                >
                                    Power Curve
                                </button>
                            </div>

                            {activeView === 'curve' && (
                                <div className={`rounded-xl border p-1 flex gap-1 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                                    <button
                                        onClick={() => setCurveType('sample_size')}
                                        className={`px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${curveType === 'sample_size' ? 'bg-amber-500 text-slate-950 shadow-lg' : (darkMode ? 'text-slate-500 hover:text-slate-200 hover:bg-slate-900' : 'text-slate-500 hover:text-slate-900 hover:bg-white')}`}
                                    >
                                        Vs Sample Size
                                    </button>
                                    <button
                                        onClick={() => setCurveType('effect_size')}
                                        className={`px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${curveType === 'effect_size' ? 'bg-amber-500 text-slate-950 shadow-lg' : (darkMode ? 'text-slate-500 hover:text-slate-200 hover:bg-slate-900' : 'text-slate-500 hover:text-slate-900 hover:bg-white')}`}
                                    >
                                        Vs Effect Size
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {!result?.ok ? (
                    <div className={`rounded-xl border p-5 ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                        The shared visualizer frame is ready. As each solver lands, it can hand the page a standardized visualizer model instead of building a second visualization stack.
                    </div>
                ) : activeView === 'curve' ? (
                    <PowerCurveChart
                        curveModel={curveModel}
                        darkMode={darkMode}
                    />
                ) : result?.visualizer?.kind === 'normal_distribution' ? (
                    <NormalDistributionVisual
                        key={visualizerKey}
                        darkMode={darkMode}
                        type={result.visualizer.type}
                        showTutor={false}
                        powerViewConfig={result.visualizer.config}
                    />
                ) : result?.visualizer?.kind === 'f_distribution' ? (
                    <FPowerDistributionVisual
                        key={visualizerKey}
                        darkMode={darkMode}
                        config={result.visualizer.config}
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
                    How To Read This View
                </h3>
                <div className="grid md:grid-cols-3 gap-4">
                    {readingCards.map((card) => (
                        <div key={card.title} className={`rounded-xl border p-4 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                            <div className={`text-[10px] font-black uppercase tracking-widest mb-2 ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                                {card.title}
                            </div>
                            <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                {card.body}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default PowerVisualizerFrame;
