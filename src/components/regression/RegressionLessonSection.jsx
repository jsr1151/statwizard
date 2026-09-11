import { Info, RefreshCw, SlidersHorizontal, Sparkles, Target, TrendingUp } from "lucide-react";
import RegressionResidualPlot from "./RegressionResidualPlot";
import RegressionScatterplot from "./RegressionScatterplot";
import { buildRegressionInterpretation, buildSlopeInterpretation } from "../../stats/regression.js";
import Card from '../analysis/AnalysisCard.jsx';
import MetricTile from '../analysis/AnalysisMetricTile.jsx';
import { formatStatistic as formatStat } from '../../utils/statFormatters.js';
import { REGRESSION_TUTOR_PRESETS as TUTOR_PRESETS } from '../../data/regressionPresets.js';

export default function RegressionLessonSection({
    darkMode, lessonStats, lessonShowLine, lessonShowBand,
    lessonShowPredictionBand, lessonShowResiduals, lessonSelectedPointId, setLessonSelectedPointId,
    lessonPrediction, lessonSubtitle, lessonSelectedPair, lessonPreset,
    lessonOutlierOn, selectLessonPreset, lessonSampleSize, setLessonSampleSize,
    lessonNoise, setLessonNoise, lessonPredictionX, lessonPredictionStep,
    setLessonPredictionX, setLessonShowResiduals, setLessonShowLine, setLessonShowBand,
    setLessonShowPredictionBand, setLessonOutlierOn, regenerateLessonSample,
}) {
    return (
        <div className="space-y-8">
            <Card darkMode={darkMode}>
                <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-xl ${darkMode ? 'bg-indigo-500/10 text-indigo-300' : 'bg-indigo-50 text-indigo-700'}`}>
                        <Sparkles size={20} />
                    </div>
                    <div>
                        <h3 className={`text-xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>Simple linear regression tutor / lessons</h3>
                        <p className={`mt-2 text-sm max-w-3xl ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                            This first slice is an interactive concept page rather than a formal lesson engine. Use the presets and controls to see how slopes, residuals, prediction intervals, and nonlinear patterns change what the fitted line can honestly say.
                        </p>
                    </div>
                </div>
            </Card>

            <div className="grid lg:grid-cols-12 gap-8 items-start">
                <div className="lg:col-span-8 space-y-6">
                    <Card darkMode={darkMode}>
                        <RegressionScatterplot
                            pairs={lessonStats?.pairs || []}
                            stats={lessonStats}
                            darkMode={darkMode}
                            xLabel="Predictor X"
                            yLabel="Outcome Y"
                            showLine={lessonShowLine}
                            showConfidenceBand={lessonShowBand}
                            showPredictionBand={lessonShowPredictionBand}
                            showResiduals={lessonShowResiduals}
                            confidenceLevel={0.95}
                            highlightPointIndex={lessonStats?.influence?.influentialIndex}
                            selectedPointId={lessonSelectedPointId}
                            onPointSelect={setLessonSelectedPointId}
                            predictionTarget={lessonPrediction}
                            title="Interactive fitted-model plot"
                            subtitle={`${lessonSubtitle} Click a point to inspect its residual, or move the prediction target to see what the model says at a chosen X value.`}
                        />
                    </Card>

                    {lessonShowResiduals && lessonStats?.ok && (
                        <Card darkMode={darkMode}>
                            <RegressionResidualPlot
                                stats={lessonStats}
                                darkMode={darkMode}
                                highlightPointIndex={lessonSelectedPointId}
                                subtitle="Residuals are observed Y minus predicted Y. The selected case is highlighted so you can connect the scatterplot to the error pattern."
                            />
                        </Card>
                    )}

                    <div className="grid xl:grid-cols-2 gap-6">
                        <Card darkMode={darkMode}>
                            <div className="flex items-center gap-3 mb-3">
                                <TrendingUp size={18} className={darkMode ? 'text-sky-300' : 'text-sky-700'} />
                                <h3 className={`text-lg font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                    Prediction spotlight
                                </h3>
                            </div>
                            <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                At <span className="font-black">X = {formatStat(lessonPrediction?.x, 2)}</span>, the fitted line predicts <span className="font-black">Y = {formatStat(lessonPrediction?.fitted, 3)}</span>.
                            </p>
                            <div className="mt-4 grid sm:grid-cols-2 gap-3">
                                <div className={`rounded-xl border p-4 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                                    <div className={`text-[10px] font-black uppercase tracking-widest mb-2 ${darkMode ? 'text-sky-300' : 'text-sky-700'}`}>Mean CI</div>
                                    <p className={`text-sm ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                                        [{formatStat(lessonPrediction?.meanInterval?.lower, 3)}, {formatStat(lessonPrediction?.meanInterval?.upper, 3)}]
                                    </p>
                                </div>
                                <div className={`rounded-xl border p-4 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                                    <div className={`text-[10px] font-black uppercase tracking-widest mb-2 ${darkMode ? 'text-sky-300' : 'text-sky-700'}`}>Prediction Interval</div>
                                    <p className={`text-sm ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                                        [{formatStat(lessonPrediction?.predictionInterval?.lower, 3)}, {formatStat(lessonPrediction?.predictionInterval?.upper, 3)}]
                                    </p>
                                </div>
                            </div>
                            <p className={`mt-4 text-sm leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                Regression is using the fitted line to estimate the mean outcome at a chosen predictor value, not just describing how two variables move together.
                            </p>
                        </Card>

                        <Card darkMode={darkMode}>
                            <div className="flex items-center gap-3 mb-3">
                                <Target size={18} className={darkMode ? 'text-amber-300' : 'text-amber-700'} />
                                <h3 className={`text-lg font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                    Residual spotlight
                                </h3>
                            </div>
                            <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                Click any point to compare its observed outcome with what the fitted line predicted.
                            </p>
                            <div className="mt-4 grid sm:grid-cols-3 gap-3">
                                <div className={`rounded-xl border p-4 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                                    <div className={`text-[10px] font-black uppercase tracking-widest mb-2 ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>Observed Y</div>
                                    <p className={`text-lg font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>{formatStat(lessonSelectedPair?.y, 3)}</p>
                                </div>
                                <div className={`rounded-xl border p-4 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                                    <div className={`text-[10px] font-black uppercase tracking-widest mb-2 ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>Predicted Y</div>
                                    <p className={`text-lg font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>{formatStat(lessonSelectedPair?.fitted, 3)}</p>
                                </div>
                                <div className={`rounded-xl border p-4 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                                    <div className={`text-[10px] font-black uppercase tracking-widest mb-2 ${darkMode ? 'text-amber-300' : 'text-amber-700'}`}>Residual</div>
                                    <p className={`text-lg font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>{formatStat(lessonSelectedPair?.residual, 3)}</p>
                                </div>
                            </div>
                            <p className={`mt-4 text-sm leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                Residual = observed Y - predicted Y. Small residuals mean the line predicted that case well; large residuals mean the model missed by more.
                            </p>
                        </Card>
                    </div>

                    <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
                        <MetricTile darkMode={darkMode} label="Slope (b)" value={formatStat(lessonStats?.slope, 3)} tone="primary" detail={buildSlopeInterpretation({ slope: lessonStats?.slope, predictorLabel: 'X', outcomeLabel: 'Y' })} />
                        <MetricTile darkMode={darkMode} label="Intercept" value={formatStat(lessonStats?.intercept, 3)} detail="Predicted Y when X = 0." />
                        <MetricTile darkMode={darkMode} label="R²" value={formatStat(lessonStats?.rSquared, 3)} />
                        <MetricTile darkMode={darkMode} label="n" value={`${lessonStats?.n || 0}`} detail={lessonStats?.interpretation || 'Waiting for data'} />
                    </div>

                    <Card darkMode={darkMode}>
                        <div className="flex items-center gap-3 mb-3">
                            <Target size={18} className={darkMode ? 'text-amber-300' : 'text-amber-700'} />
                            <h3 className={`text-lg font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                What this view is teaching
                            </h3>
                        </div>
                        <p className={`text-sm leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                            {lessonPreset === 'nonlinear'
                                ? 'The line is still fitted, but the curved pattern shows why one straight regression model can be misleading even when it returns a slope and an R².'
                                : lessonOutlierOn
                                    ? 'Because the outlier is being added to the same underlying sample, you can see exactly how one influential case changes the slope, the selected residual, and the predictions coming off the fitted line.'
                                    : `${buildRegressionInterpretation(lessonStats)} Slope answers rate of change; R² answers how tightly the points follow that model.`}
                        </p>
                    </Card>
                </div>

                <div className="lg:col-span-4 space-y-6">
                    <Card darkMode={darkMode}>
                        <div className="flex items-center gap-3 mb-4">
                            <SlidersHorizontal size={18} className={darkMode ? 'text-indigo-300' : 'text-indigo-700'} />
                            <div>
                                <div className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>Presets</div>
                                <h3 className={`text-xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>Explore fitted models</h3>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            {TUTOR_PRESETS.map(([id, label]) => (
                                <button key={id} onClick={() => selectLessonPreset(id)} className={`rounded-xl border px-3 py-3 text-left text-xs font-black uppercase tracking-widest transition-all ${lessonPreset === id ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg' : (darkMode ? 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-indigo-500' : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900 hover:border-indigo-500')}`}>
                                    {label}
                                </button>
                            ))}
                        </div>

                        <div className="mt-6 space-y-4">
                            <div>
                                <div className="flex justify-between items-center">
                                    <span className={`text-[11px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>Sample Size</span>
                                    <span className={`text-sm font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>{lessonSampleSize}</span>
                                </div>
                                <input type="range" min="12" max="90" step="1" value={lessonSampleSize} onChange={(event) => setLessonSampleSize(Number(event.target.value))} className="mt-2 w-full accent-indigo-500" />
                            </div>

                            <div>
                                <div className="flex justify-between items-center">
                                    <span className={`text-[11px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>Noise</span>
                                    <span className={`text-sm font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>{Math.round(lessonNoise * 100)}%</span>
                                </div>
                                <input type="range" min="0" max="1" step="0.01" value={lessonNoise} onChange={(event) => setLessonNoise(Number(event.target.value))} className="mt-2 w-full accent-indigo-500" />
                            </div>

                            <div>
                                <div className="flex justify-between items-center">
                                    <span className={`text-[11px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>Predict Y at X</span>
                                    <span className={`text-sm font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>{formatStat(lessonPredictionX, 2)}</span>
                                </div>
                                <input
                                    type="range"
                                    min={lessonStats?.xSummary?.min ?? 0}
                                    max={lessonStats?.xSummary?.max ?? 10}
                                    step={lessonPredictionStep}
                                    value={lessonPredictionX}
                                    onChange={(event) => setLessonPredictionX(Number(event.target.value))}
                                    className="mt-2 w-full accent-indigo-500"
                                />
                            </div>
                        </div>

                        <div className="mt-6 grid grid-cols-2 gap-3">
                            <button onClick={() => setLessonShowResiduals((value) => !value)} className={`rounded-xl border px-4 py-3 text-xs font-black uppercase tracking-widest transition-all ${lessonShowResiduals ? 'bg-indigo-600 text-white border-indigo-500' : (darkMode ? 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900')}`}>{lessonShowResiduals ? 'Hide Residual Overlay' : 'Show Residual Overlay'}</button>
                            <button onClick={() => setLessonShowLine((value) => !value)} className={`rounded-xl border px-4 py-3 text-xs font-black uppercase tracking-widest transition-all ${lessonShowLine ? 'bg-indigo-600 text-white border-indigo-500' : (darkMode ? 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900')}`}>{lessonShowLine ? 'Hide Line' : 'Show Line'}</button>
                            <button onClick={() => setLessonShowBand((value) => !value)} className={`rounded-xl border px-4 py-3 text-xs font-black uppercase tracking-widest transition-all ${lessonShowBand ? 'bg-indigo-600 text-white border-indigo-500' : (darkMode ? 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900')}`}>{lessonShowBand ? 'Hide Mean Band' : 'Show Mean Band'}</button>
                            <button onClick={() => setLessonShowPredictionBand((value) => !value)} className={`rounded-xl border px-4 py-3 text-xs font-black uppercase tracking-widest transition-all ${lessonShowPredictionBand ? 'bg-indigo-600 text-white border-indigo-500' : (darkMode ? 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900')}`}>{lessonShowPredictionBand ? 'Hide Prediction Interval' : 'Show Prediction Interval'}</button>
                            <button onClick={() => setLessonOutlierOn((value) => !value)} className={`col-span-2 rounded-xl border px-4 py-3 text-xs font-black uppercase tracking-widest transition-all ${lessonOutlierOn ? 'bg-indigo-600 text-white border-indigo-500' : (darkMode ? 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900')}`}>{lessonOutlierOn ? 'Remove Outlier' : 'Add Outlier'}</button>
                            <button onClick={regenerateLessonSample} className={`col-span-2 inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-xs font-black uppercase tracking-widest transition-all ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-300 hover:text-white hover:border-indigo-500' : 'bg-slate-50 border-slate-200 text-slate-700 hover:text-slate-900 hover:border-indigo-500'}`}>
                                <RefreshCw size={14} />
                                Regenerate Sample
                            </button>
                        </div>
                    </Card>

                    <Card darkMode={darkMode}>
                        <div className="flex items-center gap-3 mb-4">
                            <Info size={18} className={darkMode ? 'text-amber-300' : 'text-amber-700'} />
                            <div>
                                <div className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>Core Ideas</div>
                                <h3 className={`text-xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>What this page teaches</h3>
                            </div>
                        </div>

                        <div className="space-y-3">
                            {[
                                'The fitted line models the mean of Y as the predictor changes.',
                                'Slope tells you the rate of change in predicted Y per 1-unit increase in X.',
                                'Intercept tells you the model prediction when X = 0.',
                                'Residuals are observed Y minus predicted Y.',
                                'R² summarizes fit, not causation.',
                                'A steep slope is not the same thing as a strong fit.',
                                'A shallow slope can still fit tightly if the points stay close to the line.',
                                'Outliers and nonlinear patterns can make a straight-line model predict poorly.',
                            ].map((idea) => (
                                <div key={idea} className={`rounded-xl border p-4 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                                    <p className={`text-sm leading-relaxed ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>{idea}</p>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
