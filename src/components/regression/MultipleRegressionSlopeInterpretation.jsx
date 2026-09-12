import { TrendingUp } from 'lucide-react';
import Card from '../analysis/AnalysisCard.jsx';
import { formatStatistic as formatStat } from '../../utils/statFormatters.js';
import { INTERNAL_PREDICTOR_IDS } from '../../data/multipleRegressionLesson.js';
import { getSlopeSymbol } from '../../utils/multipleRegressionLesson.js';
import TooltipLabel from './MultipleRegressionTooltipLabel.jsx';

export default function MultipleRegressionSlopeInterpretation({
    darkMode, lessonStats, lessonPredictorLabels, lessonContext,
}) {
    return (
        <Card darkMode={darkMode}>
            <div className="flex items-center gap-3 mb-4">
                <TrendingUp size={18} className={darkMode ? 'text-emerald-300' : 'text-emerald-700'} />
                <h3 className={`text-lg font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                    How to interpret the slopes
                </h3>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
                {lessonStats.coefficients.filter((coefficient) => coefficient.id !== 'intercept').map((coefficient) => {
                    const otherPredictorId = coefficient.id === INTERNAL_PREDICTOR_IDS[0] ? INTERNAL_PREDICTOR_IDS[1] : INTERNAL_PREDICTOR_IDS[0];
                    const signFlip = Math.sign(coefficient.zeroOrderCorrelation || 0) !== Math.sign(coefficient.estimate || 0);

                    return (
                        <div key={coefficient.id} className={`rounded-xl border p-4 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <div className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                                        <TooltipLabel darkMode={darkMode} label={`Slope for ${lessonPredictorLabels[coefficient.id]} (${getSlopeSymbol(coefficient.id)})`} tooltipKey="slope" />
                                    </div>
                                    <p className={`mt-2 text-2xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                        {formatStat(coefficient.estimate, 3)}
                                    </p>
                                </div>
                                <div className={`px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${coefficient.vif >= 5 ? (darkMode ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20' : 'bg-amber-50 text-amber-700 border border-amber-200') : (darkMode ? 'bg-slate-900 border border-slate-800 text-slate-400' : 'bg-white border border-slate-200 text-slate-600')}`}>
                                    VIF {formatStat(coefficient.vif, 2)}
                                </div>
                            </div>
                            <p className={`mt-3 text-sm leading-relaxed ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                                Change in predicted {lessonContext.outcomeLabel} for a 1-unit increase in {lessonPredictorLabels[coefficient.id]}, holding {lessonPredictorLabels[otherPredictorId]} constant.
                            </p>
                            {signFlip && (
                                <div className={`mt-4 rounded-xl border p-3 ${darkMode ? 'bg-amber-500/10 border-amber-500/20 text-amber-100' : 'bg-amber-50 border-amber-200 text-amber-700'}`}>
                                    The simple X-Y correlation and the conditional slope point in different directions here. That can happen when the predictors overlap strongly.
                                </div>
                            )}
                            <details className={`mt-4 rounded-xl border px-4 py-3 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                                <summary className={`cursor-pointer text-sm font-black ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                                    More detail
                                </summary>
                                <div className={`mt-4 space-y-2 text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                    <p><TooltipLabel darkMode={darkMode} label="Zero-order correlation" tooltipKey="zeroOrderCorrelation" />: {formatStat(coefficient.zeroOrderCorrelation, 3)}</p>
                                    <p><TooltipLabel darkMode={darkMode} label="Standardized beta" tooltipKey="standardizedBeta" />: {formatStat(coefficient.standardizedBeta, 3)}</p>
                                    <p><TooltipLabel darkMode={darkMode} label="Partial R^2" tooltipKey="partialRSquared" />: {formatStat(coefficient.partialRSquared, 3)}</p>
                                    <p><TooltipLabel darkMode={darkMode} label="Standard error" tooltipKey="standardError" />: {formatStat(coefficient.standardError, 3)}</p>
                                </div>
                            </details>
                        </div>
                    );
                })}
            </div>
        </Card>
    );
}
