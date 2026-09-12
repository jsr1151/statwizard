import { Target } from 'lucide-react';
import Card from '../analysis/AnalysisCard.jsx';
import { formatStatistic as formatStat } from '../../utils/statFormatters.js';

export default function MultipleRegressionPredictionCard({
    darkMode, calculatorStats, calculatorPredictionInputs, setCalculatorPredictionInputs,
    activeOutcomeLabel, calculatorPrediction, confidenceLevel, calculatorSelectedPair,
}) {
    return (
        <Card darkMode={darkMode}>
            <div className="grid lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-5">
                    <div className="flex items-center gap-3 mb-4">
                        <Target size={18} className={darkMode ? 'text-amber-300' : 'text-amber-700'} />
                        <h3 className={`text-lg font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                            Predict from the fitted model
                        </h3>
                    </div>

                    <div className="space-y-4">
                        {calculatorStats.predictorSummaries.map((summary) => (
                            <label key={summary.label} className="block">
                                <span className={`text-[11px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                                    {summary.label}
                                </span>
                                <input
                                    type="number"
                                    step={0.1}
                                    value={calculatorPredictionInputs?.[summary.label] ?? ''}
                                    onChange={(event) => setCalculatorPredictionInputs((previous) => ({
                                        ...previous,
                                        [summary.label]: event.target.value,
                                    }))}
                                    className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm font-bold outline-none transition-colors ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200 focus:border-indigo-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500'}`}
                                />
                                <div className={`mt-2 text-xs ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                                    Observed range {formatStat(summary.min, 2)} to {formatStat(summary.max, 2)}
                                </div>
                            </label>
                        ))}
                    </div>
                </div>

                <div className="lg:col-span-7">
                    <div className="grid md:grid-cols-3 gap-4">
                        <div className={`rounded-xl border p-4 ${darkMode ? 'bg-indigo-500/10 border-indigo-500/20' : 'bg-indigo-50 border-indigo-200'}`}>
                            <div className={`text-[10px] font-black uppercase tracking-widest mb-2 ${darkMode ? 'text-indigo-300' : 'text-indigo-700'}`}>Predicted Mean {activeOutcomeLabel}</div>
                            <p className={`text-2xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>{formatStat(calculatorPrediction?.fitted, 3)}</p>
                        </div>
                        <div className={`rounded-xl border p-4 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                            <div className={`text-[10px] font-black uppercase tracking-widest mb-2 ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>{Math.round(confidenceLevel * 100)}% Mean CI</div>
                            <p className={`text-sm ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                                [{formatStat(calculatorPrediction?.meanInterval?.lower, 3)}, {formatStat(calculatorPrediction?.meanInterval?.upper, 3)}]
                            </p>
                        </div>
                        <div className={`rounded-xl border p-4 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                            <div className={`text-[10px] font-black uppercase tracking-widest mb-2 ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>{Math.round(confidenceLevel * 100)}% Prediction Interval</div>
                            <p className={`text-sm ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                                [{formatStat(calculatorPrediction?.predictionInterval?.lower, 3)}, {formatStat(calculatorPrediction?.predictionInterval?.upper, 3)}]
                            </p>
                        </div>
                    </div>

                    <p className={`mt-4 text-sm leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                        Multiple regression predicts the mean outcome from the whole predictor profile at once. The prediction interval is wider because individual cases still vary around that mean prediction.
                    </p>

                    {calculatorPrediction?.isExtrapolation && (
                        <div className={`mt-4 rounded-xl border p-4 ${darkMode ? 'bg-amber-500/10 border-amber-500/20 text-amber-200' : 'bg-amber-50 border-amber-200 text-amber-700'}`}>
                            At least one predictor value is outside the observed range, so this is an extrapolation rather than a within-sample interpolation.
                        </div>
                    )}

                    <div className={`mt-6 rounded-xl border p-4 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                        <div className={`text-[10px] font-black uppercase tracking-widest mb-2 ${darkMode ? 'text-amber-300' : 'text-amber-700'}`}>Selected Case</div>
                        <p className={`text-sm ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                            Click a point in the observed-vs-fitted plot to inspect how one case sits around the model.
                        </p>
                        <div className="mt-4 grid md:grid-cols-3 gap-3">
                            <div className={`rounded-xl border p-3 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                                <div className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>Observed {activeOutcomeLabel}</div>
                                <p className={`mt-1 text-lg font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>{formatStat(calculatorSelectedPair?.y, 3)}</p>
                            </div>
                            <div className={`rounded-xl border p-3 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                                <div className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>Fitted {activeOutcomeLabel}</div>
                                <p className={`mt-1 text-lg font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>{formatStat(calculatorSelectedPair?.fitted, 3)}</p>
                            </div>
                            <div className={`rounded-xl border p-3 ${darkMode ? 'bg-amber-500/10 border-amber-500/20' : 'bg-amber-50 border-amber-200'}`}>
                                <div className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-amber-300' : 'text-amber-700'}`}>Residual</div>
                                <p className={`mt-1 text-lg font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>{formatStat(calculatorSelectedPair?.residual, 3)}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Card>
    );
}
