import { RefreshCw, SlidersHorizontal } from 'lucide-react';
import Card from '../analysis/AnalysisCard.jsx';
import { formatStatistic as formatStat } from '../../utils/statFormatters.js';
import { TUTOR_SCENARIOS, INTERNAL_PREDICTOR_IDS, LESSON_CONTEXTS } from '../../data/multipleRegressionLesson.js';
import { getPredictorSymbol } from '../../utils/multipleRegressionLesson.js';

export default function MultipleRegressionTutorControls({
    darkMode, setLessonContextId, lessonContextId, applyScenario,
    lessonScenario, lessonBeta1, setLessonBeta1, lessonBeta2,
    setLessonBeta2, lessonPredictorCorrelation, setLessonPredictorCorrelation, lessonNoise,
    setLessonNoise, lessonSampleSize, setLessonSampleSize, lessonPredictionPlaygroundVisible,
    lessonStats, lessonPredictorLabels, lessonPredictionInputs, setLessonPredictionInputs,
    lessonContext, lessonPrediction, lessonMainViews, lessonMainView,
    lessonOutlierOn, setLessonOutlierOn, lessonShowCoefficientTable, setLessonShowCoefficientTable,
    lessonShowPartialEffects, setLessonShowPartialEffects, lessonShowResiduals, setLessonShowResiduals,
    setLessonMainView, setLessonGenerationKey,
}) {
    return (
        <Card darkMode={darkMode} className="lg:sticky lg:top-24 xl:top-28 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto lg:overscroll-contain">
            <div className="flex items-center gap-3 mb-4">
                <SlidersHorizontal size={18} className={darkMode ? 'text-indigo-300' : 'text-indigo-700'} />
                <h3 className={`text-lg font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                    Tutor controls
                </h3>
            </div>

            <div>
                <div className={`text-[11px] font-black uppercase tracking-widest mb-3 ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                    Example presets
                </div>
                <div className="grid gap-2">
                    {LESSON_CONTEXTS.map((context) => (
                        <button
                            key={context.id}
                            onClick={() => setLessonContextId(context.id)}
                            className={`rounded-xl border px-4 py-3 text-left transition-colors ${lessonContextId === context.id ? 'border-indigo-500 bg-indigo-500/10' : (darkMode ? 'bg-slate-950 border-slate-800 hover:border-slate-700' : 'bg-slate-50 border-slate-200 hover:border-slate-300')}`}
                        >
                            <div className={`font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>{context.buttonLabel}</div>
                            <div className={`text-sm mt-1 ${darkMode ? 'text-slate-500' : 'text-slate-600'}`}>{context.description}</div>
                        </button>
                    ))}
                </div>
            </div>

            <div className="mt-6">
                <div className={`text-[11px] font-black uppercase tracking-widest mb-3 ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                    Quick scenarios
                </div>
                <div className="grid gap-2">
                    {TUTOR_SCENARIOS.map((scenario) => (
                        <button
                            key={scenario.id}
                            onClick={() => applyScenario(scenario.id)}
                            className={`rounded-xl border px-4 py-3 text-left transition-colors ${lessonScenario === scenario.id ? 'border-indigo-500 bg-indigo-500/10' : (darkMode ? 'bg-slate-950 border-slate-800 hover:border-slate-700' : 'bg-slate-50 border-slate-200 hover:border-slate-300')}`}
                        >
                            <div className={`font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>{scenario.label}</div>
                            <div className={`text-sm mt-1 ${darkMode ? 'text-slate-500' : 'text-slate-600'}`}>{scenario.description}</div>
                        </button>
                    ))}
                </div>
            </div>

            <div className="mt-6 space-y-5">
                <label className="block">
                    <span className={`text-[11px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                        Strength of {getPredictorSymbol(INTERNAL_PREDICTOR_IDS[0])}
                    </span>
                    <input type="range" min={-1.5} max={1.5} step={0.05} value={lessonBeta1} onChange={(event) => setLessonBeta1(Number(event.target.value))} className="mt-3 w-full" />
                    <div className={`mt-2 text-sm font-bold ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>{formatStat(lessonBeta1, 2)}</div>
                </label>

                <label className="block">
                    <span className={`text-[11px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                        Strength of {getPredictorSymbol(INTERNAL_PREDICTOR_IDS[1])}
                    </span>
                    <input type="range" min={-1.5} max={1.5} step={0.05} value={lessonBeta2} onChange={(event) => setLessonBeta2(Number(event.target.value))} className="mt-3 w-full" />
                    <div className={`mt-2 text-sm font-bold ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>{formatStat(lessonBeta2, 2)}</div>
                </label>

                <label className="block">
                    <span className={`text-[11px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                        Correlation Between Predictors
                    </span>
                    <input type="range" min={-0.9} max={0.9} step={0.01} value={lessonPredictorCorrelation} onChange={(event) => setLessonPredictorCorrelation(Number(event.target.value))} className="mt-3 w-full" />
                    <div className={`mt-2 text-sm font-bold ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>{formatStat(lessonPredictorCorrelation, 2)}</div>
                </label>

                <label className="block">
                    <span className={`text-[11px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                        Noise Level
                    </span>
                    <input type="range" min={0.4} max={2.3} step={0.05} value={lessonNoise} onChange={(event) => setLessonNoise(Number(event.target.value))} className="mt-3 w-full" />
                    <div className={`mt-2 text-sm font-bold ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>{formatStat(lessonNoise, 2)}</div>
                </label>

                <label className="block">
                    <span className={`text-[11px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                        Sample Size
                    </span>
                    <input type="range" min={30} max={180} step={1} value={lessonSampleSize} onChange={(event) => setLessonSampleSize(Number(event.target.value))} className="mt-3 w-full" />
                    <div className={`mt-2 text-sm font-bold ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>{lessonSampleSize}</div>
                </label>
            </div>

            {!lessonPredictionPlaygroundVisible && (
                <div className={`mt-6 rounded-2xl border p-3.5 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <div className={`text-[11px] font-black uppercase tracking-widest mb-1.5 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
                                Graph-side prediction controls
                            </div>
                            <p className={`text-xs ${darkMode ? 'text-slate-500' : 'text-slate-600'}`}>
                                Mirrors the custom predictor profile.
                            </p>
                        </div>
                        <div className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-widest ${darkMode ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-600'}`}>
                            Live
                        </div>
                    </div>

                    <div className="mt-3 space-y-3">
                        {lessonStats?.predictorSummaries?.map((summary) => (
                            <label key={`sidebar-${summary.label}`} className="block">
                                <span className={`text-[11px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                                    {lessonPredictorLabels[summary.label]}
                                </span>
                                <input
                                    type="range"
                                    min={summary.min}
                                    max={summary.max}
                                    step={0.05}
                                    value={lessonPredictionInputs?.[summary.label] ?? summary.mean}
                                    onChange={(event) => setLessonPredictionInputs((previous) => ({
                                        ...previous,
                                        [summary.label]: Number(event.target.value),
                                    }))}
                                    className="mt-2.5 w-full"
                                />
                                <div className={`mt-1.5 flex items-center justify-between gap-3 text-xs ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                                    <span className="font-black">{formatStat(lessonPredictionInputs?.[summary.label] ?? summary.mean, 2)}</span>
                                    <span className={darkMode ? 'text-slate-500' : 'text-slate-500'}>
                                        {formatStat(summary.min, 1)} to {formatStat(summary.max, 1)}
                                    </span>
                                </div>
                            </label>
                        ))}
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-3">
                        <div className={`rounded-xl border px-4 py-3 ${darkMode ? 'bg-indigo-500/10 border-indigo-500/20' : 'bg-indigo-50 border-indigo-200'}`}>
                            <div className={`text-[10px] font-black uppercase tracking-widest mb-1.5 ${darkMode ? 'text-indigo-300' : 'text-indigo-700'}`}>
                                Predicted {lessonContext.outcomeLabel}
                            </div>
                            <p className={`text-xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>{formatStat(lessonPrediction?.fitted, 3)}</p>
                        </div>
                        <div className={`text-right text-xs ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                            <div className={`text-[10px] font-black uppercase tracking-widest mb-1 ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                                Current view
                            </div>
                            <p className="font-bold">
                                {lessonMainViews.find((view) => view.id === lessonMainView)?.label || 'Observed vs Fitted'}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            <div className="mt-6 space-y-3">
                <label className={`flex items-center justify-between rounded-xl border px-4 py-3 ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                    <span className="font-bold text-sm">Add influential outlier</span>
                    <input type="checkbox" checked={lessonOutlierOn} onChange={(event) => setLessonOutlierOn(event.target.checked)} />
                </label>
                <label className={`flex items-center justify-between rounded-xl border px-4 py-3 ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                    <span className="font-bold text-sm">Show coefficient table</span>
                    <input type="checkbox" checked={lessonShowCoefficientTable} onChange={(event) => setLessonShowCoefficientTable(event.target.checked)} />
                </label>
                <label className={`flex items-center justify-between rounded-xl border px-4 py-3 ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                    <span className="font-bold text-sm">Show partial summaries</span>
                    <input type="checkbox" checked={lessonShowPartialEffects} onChange={(event) => setLessonShowPartialEffects(event.target.checked)} />
                </label>
                <label className={`flex items-center justify-between rounded-xl border px-4 py-3 ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                    <span className="font-bold text-sm">Show residual plot</span>
                    <input
                        type="checkbox"
                        checked={lessonShowResiduals}
                        onChange={(event) => {
                            setLessonShowResiduals(event.target.checked);
                            if (event.target.checked) {
                                setLessonMainView('residual');
                            } else {
                                setLessonMainView('observed');
                            }
                        }}
                    />
                </label>
            </div>

            <button
                onClick={() => setLessonGenerationKey((previous) => previous + 1)}
                className={`mt-6 w-full inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-black uppercase tracking-widest ${darkMode ? 'bg-indigo-600 hover:bg-indigo-500 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}
            >
                <RefreshCw size={16} />
                Regenerate Sample
            </button>

            <p className={`mt-4 text-xs font-bold uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                Strength, overlap, noise, sample size, and the outlier toggle now modify the same active sample. Use regenerate when you want a fresh draw.
            </p>
        </Card>
    );
}
