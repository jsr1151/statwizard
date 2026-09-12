import { ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import RegressionResidualPlot from './RegressionResidualPlot';
import Card from '../analysis/AnalysisCard.jsx';
import MetricTile from '../analysis/AnalysisMetricTile.jsx';
import { formatStatistic as formatStat, formatPValue } from '../../utils/statFormatters.js';
import { formatSignedDifference } from '../../utils/multipleRegressionLesson.js';
import TooltipLabel from './MultipleRegressionTooltipLabel.jsx';
import MultipleRegressionLessonVisual from './MultipleRegressionLessonVisual.jsx';
import MultipleRegressionTeachingView from './MultipleRegressionTeachingView.jsx';
import MultipleRegressionPredictionPlayground from './MultipleRegressionPredictionPlayground.jsx';
import MultipleRegressionOutlierComparison from './MultipleRegressionOutlierComparison.jsx';
import MultipleRegressionSlopeInterpretation from './MultipleRegressionSlopeInterpretation.jsx';
import MultipleRegressionLessonCoefficients from './MultipleRegressionLessonCoefficients.jsx';
import MultipleRegressionTutorControls from './MultipleRegressionTutorControls.jsx';
import MultipleRegressionTeachingNotes from './MultipleRegressionTeachingNotes.jsx';
import MultipleRegressionDiagnostics from './MultipleRegressionDiagnostics.jsx';

export default function MultipleRegressionLessonSection({
    darkMode, lessonContext, lessonMainVisualRef, lessonMainViews,
    lessonMainView, setLessonMainView, lessonEquationText, lessonSymbolicEquation,
    lessonPredictorLabels, lessonStats, lessonPredictionInputs, setLessonPredictionInputs,
    lessonPrediction, lessonSelectedPointId, setLessonSelectedPointId, lessonShowResiduals,
    lessonOverlapCorrelation, lessonOutlierComparison, lessonBaselineStats, lessonPredictionPlaygroundRef,
    lessonSubstitutedEquation, lessonSelectedIsInfluential, lessonSelectedPair, lessonShowPartialEffects,
    lessonShowCoefficientTable, lessonOutlierOn, setLessonContextId, lessonContextId,
    applyScenario, lessonScenario, lessonBeta1, setLessonBeta1,
    lessonBeta2, setLessonBeta2, lessonPredictorCorrelation, setLessonPredictorCorrelation,
    lessonNoise, setLessonNoise, lessonSampleSize, setLessonSampleSize,
    lessonPredictionPlaygroundVisible, setLessonOutlierOn, setLessonShowCoefficientTable, setLessonShowPartialEffects,
    setLessonShowResiduals, setLessonGenerationKey, lessonDiagnostics, lessonShouldFloatVisual,
    setLessonFloatVisualMinimized, lessonFloatVisualMinimized,
}) {
    return (
        <div className="space-y-8">
            <Card darkMode={darkMode}>
                <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-xl ${darkMode ? 'bg-indigo-500/10 text-indigo-300' : 'bg-indigo-50 text-indigo-700'}`}>
                        <Sparkles size={20} />
                    </div>
                    <div>
                        <h3 className={`text-xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>Multiple regression tutor / lessons</h3>
                        <p className={`mt-2 text-sm max-w-3xl ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                            This lesson page is about the logic of multiple regression: what the equation does, what “holding the other predictor constant” means, why predictor overlap matters, and how fit, prediction, and interpretation answer different questions.
                        </p>
                        <p className={`mt-3 text-sm max-w-3xl ${darkMode ? 'text-slate-500' : 'text-slate-600'}`}>
                            Active example preset: <span className={`font-black ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>{lessonContext.headline}</span>. {lessonContext.supportingText}
                        </p>
                    </div>
                </div>
            </Card>

            <div className="grid lg:grid-cols-12 gap-8 items-start">
                <div className="lg:col-span-8 space-y-6">
                    <div ref={lessonMainVisualRef}>
                        <MultipleRegressionTeachingView {...{
                            darkMode, lessonMainViews, lessonMainView, setLessonMainView,
                            lessonEquationText, lessonSymbolicEquation, lessonContext, lessonPredictorLabels,
                            lessonStats, lessonPredictionInputs, setLessonPredictionInputs, lessonPrediction,
                            lessonSelectedPointId, setLessonSelectedPointId,
                        }} />
                    </div>

                    {lessonShowResiduals && lessonStats?.ok && (
                        <Card darkMode={darkMode}>
                            <RegressionResidualPlot
                                stats={lessonStats}
                                darkMode={darkMode}
                                highlightPointIndex={lessonSelectedPointId}
                                title="Pinned Residual Plot"
                                subtitle="This extra residual panel stays visible while you look at the other main views."
                            />
                        </Card>
                    )}

                    {lessonStats?.ok && (
                        <Card darkMode={darkMode}>
                            <div className="flex items-start justify-between gap-4 mb-5">
                                <div>
                                    <div className={`text-[10px] font-black uppercase tracking-widest mb-2 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
                                        Model summary
                                    </div>
                                    <h3 className={`text-lg font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                        Fit, prediction, and interpretation are different questions
                                    </h3>
                                    <p className={`mt-2 text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                        R^2 and the F statistic summarize the whole model. The slopes explain conditional relationships. Predictions use the whole equation for a specific predictor profile.
                                    </p>
                                </div>
                                <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${lessonStats.maxVIF >= 5 ? (darkMode ? 'bg-amber-500/10 text-amber-200 border border-amber-500/20' : 'bg-amber-50 text-amber-700 border border-amber-200') : (darkMode ? 'bg-slate-950 text-slate-400 border border-slate-800' : 'bg-slate-50 text-slate-600 border border-slate-200')}`}>
                                    Predictor overlap |r| = {formatStat(lessonOverlapCorrelation, 2)}
                                </div>
                            </div>

                            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
                                <MetricTile
                                    darkMode={darkMode}
                                    label={<TooltipLabel darkMode={darkMode} label="Intercept" tooltipKey="intercept" />}
                                    value={formatStat(lessonStats.intercept, 3)}
                                    detail={`Predicted ${lessonContext.outcomeLabel} when both predictors are 0. Most meaningful when 0 is realistic or the predictors are centered.`}
                                />
                                <MetricTile
                                    darkMode={darkMode}
                                    label={<TooltipLabel darkMode={darkMode} label="R^2" tooltipKey="rSquared" />}
                                    value={formatStat(lessonStats.rSquared, 3)}
                                    detail={lessonOutlierComparison ? `Δ ${formatSignedDifference(lessonStats.rSquared - lessonBaselineStats.rSquared, 3)} after adding the influential case.` : 'Overall model fit.'}
                                    tone={lessonOutlierComparison ? 'warning' : 'primary'}
                                />
                                <MetricTile
                                    darkMode={darkMode}
                                    label={<TooltipLabel darkMode={darkMode} label="Adjusted R^2" tooltipKey="adjustedRSquared" />}
                                    value={formatStat(lessonStats.adjustedRSquared, 3)}
                                    detail={lessonOutlierComparison ? `Δ ${formatSignedDifference(lessonStats.adjustedRSquared - lessonBaselineStats.adjustedRSquared, 3)} after adding the influential case.` : 'Fit after a small complexity penalty.'}
                                    tone={lessonOutlierComparison ? 'warning' : 'default'}
                                />
                                <MetricTile
                                    darkMode={darkMode}
                                    label={<TooltipLabel darkMode={darkMode} label="F statistic" tooltipKey="fStatistic" />}
                                    value={formatStat(lessonStats.modelF, 3)}
                                    detail={`Model p ${formatPValue(lessonStats.modelPValue)}`}
                                />
                                <MetricTile
                                    darkMode={darkMode}
                                    label={<TooltipLabel darkMode={darkMode} label="Model p-value" tooltipKey="pValue" />}
                                    value={formatPValue(lessonStats.modelPValue)}
                                    detail="Omnibus evidence that the full model explains more than a flat mean-only model."
                                />
                                <MetricTile
                                    darkMode={darkMode}
                                    label="Sample size (n)"
                                    value={`${lessonStats.n}`}
                                    detail={`Max VIF ${formatStat(lessonStats.maxVIF, 2)} | RMSE ${formatStat(lessonStats.rmse, 2)}`}
                                    tone={lessonStats.maxVIF >= 5 ? 'warning' : 'default'}
                                />
                            </div>
                        </Card>
                    )}

                    <div ref={lessonPredictionPlaygroundRef}>
                    <MultipleRegressionPredictionPlayground {...{
                        darkMode, lessonStats, lessonPredictorLabels, lessonPredictionInputs,
                        setLessonPredictionInputs, lessonSubstitutedEquation, lessonContext, lessonPrediction,
                        lessonSelectedIsInfluential, lessonSelectedPair,
                    }} />
                    </div>

                    {lessonOutlierComparison && (
                        <MultipleRegressionOutlierComparison {...{
                            darkMode, lessonOutlierComparison, lessonStats,
                        }} />
                    )}

                    {lessonShowPartialEffects && lessonStats?.ok && (
                        <MultipleRegressionSlopeInterpretation {...{
                            darkMode, lessonStats, lessonPredictorLabels, lessonContext,
                        }} />
                    )}

                    {lessonShowCoefficientTable && lessonStats?.ok && (
                        <MultipleRegressionLessonCoefficients {...{
                            darkMode, lessonStats, lessonBaselineStats, lessonOutlierOn,
                            lessonPredictorLabels,
                        }} />
                    )}
                </div>

                <div className="lg:col-span-4 space-y-6">
                    <MultipleRegressionTutorControls {...{
                        darkMode, setLessonContextId, lessonContextId, applyScenario,
                        lessonScenario, lessonBeta1, setLessonBeta1, lessonBeta2,
                        setLessonBeta2, lessonPredictorCorrelation, setLessonPredictorCorrelation, lessonNoise,
                        setLessonNoise, lessonSampleSize, setLessonSampleSize, lessonPredictionPlaygroundVisible,
                        lessonStats, lessonPredictorLabels, lessonPredictionInputs, setLessonPredictionInputs,
                        lessonContext, lessonPrediction, lessonMainViews, lessonMainView,
                        lessonOutlierOn, setLessonOutlierOn, lessonShowCoefficientTable, setLessonShowCoefficientTable,
                        lessonShowPartialEffects, setLessonShowPartialEffects, lessonShowResiduals, setLessonShowResiduals,
                        setLessonMainView, setLessonGenerationKey,
                    }} />

                    <MultipleRegressionTeachingNotes {...{
                        darkMode, lessonContext, lessonOverlapCorrelation,
                    }} />

                    <MultipleRegressionDiagnostics {...{
                        darkMode, lessonDiagnostics,
                    }} />
                </div>
            </div>

            {lessonShouldFloatVisual && (
                <div className="fixed z-40 bottom-4 left-4 right-4 sm:left-4 sm:right-auto sm:w-[26rem] xl:w-[30rem] pointer-events-none">
                    <div className={`pointer-events-auto rounded-3xl border shadow-2xl ${darkMode ? 'bg-slate-950/95 border-slate-800 backdrop-blur-xl' : 'bg-white/95 border-slate-200 backdrop-blur-xl'}`}>
                        <div className={`flex items-center justify-between gap-3 px-4 py-3 border-b ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                            <div>
                                <div className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
                                    Live graph dock
                                </div>
                                <p className={`text-sm font-bold ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                                    {lessonMainViews.find((view) => view.id === lessonMainView)?.label || 'Observed vs Fitted'}
                                </p>
                            </div>
                            <button
                                onClick={() => setLessonFloatVisualMinimized((previous) => !previous)}
                                className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-[11px] font-black uppercase tracking-widest ${darkMode ? 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white' : 'bg-slate-50 border-slate-200 text-slate-700 hover:text-slate-900'}`}
                            >
                                {lessonFloatVisualMinimized ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                {lessonFloatVisualMinimized ? 'Show' : 'Minimize'}
                            </button>
                        </div>

                        {!lessonFloatVisualMinimized && (
                            <div className="p-3 max-h-[70vh] overflow-auto">
                                <div className={`mb-3 rounded-2xl border px-4 py-3 text-sm ${darkMode ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                                    This dock follows your scroll so lower sliders can still update the graph in view.
                                </div>
                                <MultipleRegressionLessonVisual compact {...{
                                    lessonContext, lessonPredictorLabels, lessonPredictionInputs, lessonMainView,
                                    lessonStats, darkMode, lessonSelectedPointId, setLessonSelectedPointId,
                                    lessonPrediction,
                                }} />
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
