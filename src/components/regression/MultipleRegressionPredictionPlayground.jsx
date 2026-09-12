import { Target } from 'lucide-react';
import Card from '../analysis/AnalysisCard.jsx';
import { formatStatistic as formatStat } from '../../utils/statFormatters.js';
import TooltipLabel from './MultipleRegressionTooltipLabel.jsx';

export default function MultipleRegressionPredictionPlayground({
    darkMode, lessonStats, lessonPredictorLabels, lessonPredictionInputs,
    setLessonPredictionInputs, lessonSubstitutedEquation, lessonContext, lessonPrediction,
    lessonSelectedIsInfluential, lessonSelectedPair,
}) {
    return (
        <Card darkMode={darkMode}>
            <div className="flex items-center gap-3 mb-4">
                <Target size={18} className={darkMode ? 'text-amber-300' : 'text-amber-700'} />
                <h3 className={`text-lg font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                    Prediction playground
                </h3>
            </div>
            <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                The custom predictor profile is a hypothetical combination of predictor values. The selected sample case is one actual observed row from the sample. They are not meant to match unless you happen to choose the same values.
            </p>
            <p className={`mt-2 text-sm ${darkMode ? 'text-slate-500' : 'text-slate-600'}`}>
                The same prediction sliders are mirrored in the tutor controls panel so you can keep the graph in view while you adjust them.
            </p>

            <div className="mt-6 grid xl:grid-cols-2 gap-6 items-start">
                <div className={`rounded-2xl border p-5 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                    <div className={`text-[10px] font-black uppercase tracking-widest mb-2 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
                        Custom predictor profile
                    </div>
                    <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                        Hypothetical combination of predictor values. Use this to see what the equation predicts for a profile you choose.
                    </p>

                    <div className="mt-5 space-y-4">
                        {lessonStats?.predictorSummaries?.map((summary) => (
                            <label key={summary.label} className="block">
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
                                    className="mt-3 w-full"
                                />
                                <div className={`mt-2 flex items-center justify-between gap-3 text-sm ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                                    <span className="font-black">{formatStat(lessonPredictionInputs?.[summary.label] ?? summary.mean, 2)}</span>
                                    <span className={darkMode ? 'text-slate-500' : 'text-slate-500'}>
                                        Observed range {formatStat(summary.min, 2)} to {formatStat(summary.max, 2)}
                                    </span>
                                </div>
                            </label>
                        ))}
                    </div>

                    <div className={`mt-5 rounded-xl border p-4 ${darkMode ? 'bg-indigo-500/10 border-indigo-500/20' : 'bg-indigo-50 border-indigo-200'}`}>
                        <div className={`text-[10px] font-black uppercase tracking-widest mb-2 ${darkMode ? 'text-indigo-300' : 'text-indigo-700'}`}>
                            Substitute into the equation
                        </div>
                        <p className={`text-sm font-black leading-relaxed ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                            {lessonSubstitutedEquation}
                        </p>
                    </div>

                    <div className="mt-5 grid md:grid-cols-3 gap-4">
                        <div className={`rounded-xl border p-4 ${darkMode ? 'bg-indigo-500/10 border-indigo-500/20' : 'bg-indigo-50 border-indigo-200'}`}>
                            <div className={`text-[10px] font-black uppercase tracking-widest mb-2 ${darkMode ? 'text-indigo-300' : 'text-indigo-700'}`}>
                                Predicted {lessonContext.outcomeLabel}
                            </div>
                            <p className={`text-2xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>{formatStat(lessonPrediction?.fitted, 3)}</p>
                        </div>
                        <div className={`rounded-xl border p-4 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                            <div className={`text-[10px] font-black uppercase tracking-widest mb-2 ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                                <TooltipLabel darkMode={darkMode} label="95% CI for mean response" tooltipKey="meanInterval" />
                            </div>
                            <p className={`text-sm ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                                [{formatStat(lessonPrediction?.meanInterval?.lower, 3)}, {formatStat(lessonPrediction?.meanInterval?.upper, 3)}]
                            </p>
                        </div>
                        <div className={`rounded-xl border p-4 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                            <div className={`text-[10px] font-black uppercase tracking-widest mb-2 ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                                <TooltipLabel darkMode={darkMode} label="95% PI for single new case" tooltipKey="predictionInterval" />
                            </div>
                            <p className={`text-sm ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                                [{formatStat(lessonPrediction?.predictionInterval?.lower, 3)}, {formatStat(lessonPrediction?.predictionInterval?.upper, 3)}]
                            </p>
                        </div>
                    </div>

                    <p className={`mt-4 text-sm leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                        The fitted mean is about the model&apos;s average prediction for this profile. The prediction interval is wider because one new case can still land above or below that mean.
                    </p>

                    {lessonPrediction?.isExtrapolation && (
                        <div className={`mt-4 rounded-xl border p-4 ${darkMode ? 'bg-amber-500/10 border-amber-500/20 text-amber-200' : 'bg-amber-50 border-amber-200 text-amber-700'}`}>
                            At least one predictor value is outside the observed sample range, so this is an extrapolation rather than an interpolation.
                        </div>
                    )}
                </div>

                <div className={`rounded-2xl border p-5 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <div className={`text-[10px] font-black uppercase tracking-widest mb-2 ${darkMode ? 'text-amber-300' : 'text-amber-700'}`}>
                                Selected sample case
                            </div>
                            <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                Actual observed row from the sample. Click a point in the main visual to inspect one case under the fitted model.
                            </p>
                        </div>
                        {lessonSelectedIsInfluential && (
                            <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${darkMode ? 'bg-amber-500/10 text-amber-200 border border-amber-500/20' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                                Influential case
                            </div>
                        )}
                    </div>

                    <div className="mt-5 grid md:grid-cols-2 gap-4">
                        {lessonStats?.predictorSummaries?.map((summary) => (
                            <div key={summary.label} className={`rounded-xl border p-4 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                                <div className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                                    {lessonPredictorLabels[summary.label]}
                                </div>
                                <p className={`mt-2 text-lg font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                    {formatStat(lessonSelectedPair?.predictors?.[summary.label], 3)}
                                </p>
                            </div>
                        ))}
                        <div className={`rounded-xl border p-4 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                            <div className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                                Observed {lessonContext.outcomeLabel}
                            </div>
                            <p className={`mt-2 text-lg font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                {formatStat(lessonSelectedPair?.y, 3)}
                            </p>
                        </div>
                        <div className={`rounded-xl border p-4 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                            <div className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                                Fitted {lessonContext.outcomeLabel}
                            </div>
                            <p className={`mt-2 text-lg font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                {formatStat(lessonSelectedPair?.fitted, 3)}
                            </p>
                        </div>
                        <div className={`rounded-xl border p-4 ${darkMode ? 'bg-amber-500/10 border-amber-500/20' : 'bg-amber-50 border-amber-200'}`}>
                            <div className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-amber-300' : 'text-amber-700'}`}>
                                <TooltipLabel darkMode={darkMode} label="Residual" tooltipKey="residual" />
                            </div>
                            <p className={`mt-2 text-lg font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                {formatStat(lessonSelectedPair?.residual, 3)}
                            </p>
                        </div>
                        <div className={`rounded-xl border p-4 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                            <div className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                                <TooltipLabel darkMode={darkMode} label="Leverage" tooltipKey="leverage" />
                            </div>
                            <p className={`mt-2 text-lg font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                {formatStat(lessonSelectedPair?.leverage, 3)}
                            </p>
                        </div>
                        <div className={`rounded-xl border p-4 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                            <div className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                                <TooltipLabel darkMode={darkMode} label="Cook's D" tooltipKey="cooksDistance" />
                            </div>
                            <p className={`mt-2 text-lg font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                {formatStat(lessonSelectedPair?.cooksDistance, 3)}
                            </p>
                        </div>
                    </div>

                    <p className={`mt-4 text-sm leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                        Residual = observed {lessonContext.outcomeLabel} - fitted {lessonContext.outcomeLabel}. This case does not need to match the custom predictor profile unless you happened to choose the same predictor values yourself.
                    </p>
                </div>
            </div>
        </Card>
    );
}
