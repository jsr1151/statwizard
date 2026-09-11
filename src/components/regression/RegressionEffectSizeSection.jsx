import { Calculator, Info, Sigma, Target, TrendingUp } from "lucide-react";
import { buildSlopeInterpretation, rSquaredToFSquared } from "../../stats/regression.js";
import Card from '../analysis/AnalysisCard.jsx';
import MetricTile from '../analysis/AnalysisMetricTile.jsx';
import { formatStatistic as formatStat } from '../../utils/statFormatters.js';

export default function RegressionEffectSizeSection({
    effectSourceStats, darkMode, effectRSquared, setEffectRSquared,
    effectSlope, setEffectSlope, effectUnitChange, setEffectUnitChange,
    effectPredictedChange, effectFSquared,
}) {
    return (
        <div className="space-y-8">
            {effectSourceStats?.ok && (
                <Card darkMode={darkMode}>
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <div className={`text-[10px] font-black uppercase tracking-widest mb-2 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
                                Current Calculator Snapshot
                            </div>
                            <h3 className={`text-2xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                R² = {formatStat(effectSourceStats.rSquared, 3)}
                            </h3>
                            <p className={`mt-2 text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                The active calculator line has slope {formatStat(effectSourceStats.slope, 3)} and adjusted R² = {formatStat(effectSourceStats.adjustedRSquared, 3)}.
                            </p>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${darkMode ? 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20' : 'bg-indigo-50 text-indigo-700 border border-indigo-200'}`}>
                            f² = {formatStat(rSquaredToFSquared(effectSourceStats.rSquared), 3)}
                        </div>
                    </div>
                </Card>
            )}

            <div className="grid lg:grid-cols-12 gap-8">
                <div className="lg:col-span-5">
                    <Card darkMode={darkMode} className="h-full">
                        <div className="flex items-center gap-3 mb-4">
                            <div className={`p-3 rounded-xl ${darkMode ? 'bg-indigo-500/10 text-indigo-300' : 'bg-indigo-50 text-indigo-700'}`}>
                                <Sigma size={18} />
                            </div>
                            <div>
                                <div className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
                                    Effect Size
                                </div>
                                <h3 className={`text-2xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                    Fit and slope are different ideas
                                </h3>
                            </div>
                        </div>

                        <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                            In simple regression, R² is the clearest fit summary for many users. The slope tells you how predicted Y changes with X. The Power Analysis tab translates that fit into Cohen's f² = R² / (1 - R²).
                        </p>

                        <div className="mt-6 grid gap-4">
                            <label className="block">
                                <span className={`text-[11px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                                    Variance Explained (R²)
                                </span>
                                <input type="number" min={0} max={0.999} step={0.01} value={Number.isFinite(effectRSquared) ? effectRSquared : ''} onChange={(event) => {
                                    const numeric = Number(event.target.value);
                                    if (Number.isFinite(numeric)) {
                                        setEffectRSquared(Math.max(0, Math.min(0.999, numeric)));
                                    }
                                }} className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm font-bold outline-none transition-colors ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200 focus:border-indigo-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500'}`} />
                            </label>

                            <label className="block">
                                <span className={`text-[11px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                                    Slope (b)
                                </span>
                                <input type="number" step={0.01} value={Number.isFinite(effectSlope) ? effectSlope : ''} onChange={(event) => {
                                    const numeric = Number(event.target.value);
                                    if (Number.isFinite(numeric)) {
                                        setEffectSlope(numeric);
                                    }
                                }} className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm font-bold outline-none transition-colors ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200 focus:border-indigo-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500'}`} />
                            </label>

                            <label className="block">
                                <span className={`text-[11px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                                    Change in X
                                </span>
                                <input type="number" step={0.1} value={Number.isFinite(effectUnitChange) ? effectUnitChange : ''} onChange={(event) => {
                                    const numeric = Number(event.target.value);
                                    if (Number.isFinite(numeric)) {
                                        setEffectUnitChange(numeric);
                                    }
                                }} className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm font-bold outline-none transition-colors ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200 focus:border-indigo-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500'}`} />
                            </label>
                        </div>
                    </Card>
                </div>

                <div className="lg:col-span-7 space-y-6">
                    <div className="grid md:grid-cols-3 gap-4">
                        <MetricTile darkMode={darkMode} label="R²" value={formatStat(effectRSquared, 3)} tone="primary" detail={`${formatStat(effectRSquared * 100, 1)}% of the outcome variance is explained by the line.`} />
                        <MetricTile darkMode={darkMode} label="Slope (b)" value={formatStat(effectSlope, 3)} detail={buildSlopeInterpretation({ slope: effectSlope, units: 1 })} />
                        <MetricTile darkMode={darkMode} label="Predicted Change" value={formatStat(effectPredictedChange, 3)} detail={buildSlopeInterpretation({ slope: effectSlope, units: effectUnitChange })} />
                    </div>

                    <Card darkMode={darkMode}>
                        <div className="flex items-center gap-3 mb-3">
                            <TrendingUp size={18} className={darkMode ? 'text-emerald-300' : 'text-emerald-700'} />
                            <h3 className={`text-lg font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                What R² means
                            </h3>
                        </div>
                        <p className={`text-sm leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                            R² tells you how much of the variability in Y is accounted for by the fitted straight line. It describes fit, not the size of the slope by itself.
                        </p>
                    </Card>

                    <Card darkMode={darkMode}>
                        <div className="flex items-center gap-3 mb-3">
                            <Info size={18} className={darkMode ? 'text-amber-300' : 'text-amber-700'} />
                            <h3 className={`text-lg font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                Why slope and fit can disagree
                            </h3>
                        </div>
                        <p className={`text-sm leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                            You can have a noticeable slope with a noisy cloud and a modest R², or a tight line with a small slope if the X scale is small. Significance, slope size, and fit are related but not interchangeable.
                        </p>
                    </Card>

                    <Card darkMode={darkMode}>
                        <div className="flex items-center gap-3 mb-3">
                            <Target size={18} className={darkMode ? 'text-sky-300' : 'text-sky-700'} />
                            <h3 className={`text-lg font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                Slopes depend on units
                            </h3>
                        </div>
                        <p className={`text-sm leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                            The slope is a rate of change, so rescaling X changes the slope value and its interpretation. The overall fit stays the same because the line still explains the same share of outcome variance.
                        </p>
                    </Card>

                    <Card darkMode={darkMode}>
                        <div className={`text-[10px] font-black uppercase tracking-widest mb-2 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
                            Power Connection
                        </div>
                        <p className={`text-sm leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                            The power tab uses Cohen's f² for this first regression slice. At the current R², f² = {formatStat(effectFSquared, 3)}.
                        </p>
                    </Card>
                </div>
            </div>
        </div>
    );
}
