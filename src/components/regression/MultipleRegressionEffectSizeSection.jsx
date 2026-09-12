import { Calculator, Sigma, TrendingUp } from 'lucide-react';
import { rSquaredToFSquared } from '../../stats/regression.js';
import Card from '../analysis/AnalysisCard.jsx';
import MetricTile from '../analysis/AnalysisMetricTile.jsx';
import { formatStatistic as formatStat } from '../../utils/statFormatters.js';

export default function MultipleRegressionEffectSizeSection({
    effectSourceStats, darkMode, effectRSquared, setEffectRSquared,
    effectSampleSize, setEffectSampleSize, effectPredictorCount, setEffectPredictorCount,
    effectAdjustedRSquared, effectFSquared,
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
                                R^2 = {formatStat(effectSourceStats.rSquared, 3)}
                            </h3>
                            <p className={`mt-2 text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                The active model uses {effectSourceStats.predictorCount} predictors, adjusted R^2 = {formatStat(effectSourceStats.adjustedRSquared, 3)}, and RMSE = {formatStat(effectSourceStats.rmse, 3)}.
                            </p>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${darkMode ? 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20' : 'bg-indigo-50 text-indigo-700 border border-indigo-200'}`}>
                            f^2 = {formatStat(rSquaredToFSquared(effectSourceStats.rSquared), 3)}
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
                                    Fit, complexity, and slope are different ideas
                                </h3>
                            </div>
                        </div>

                        <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                            In multiple regression, R^2 is the main overall fit summary. Adjusted R^2 discounts some of that fit for model complexity. The coefficients still matter, but they are not the same thing as overall effect size.
                        </p>

                        <div className="mt-6 grid gap-4">
                            <label className="block">
                                <span className={`text-[11px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                                    Model Fit (R^2)
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
                                    Sample Size (N)
                                </span>
                                <input type="number" min={4} step={1} value={Number.isFinite(effectSampleSize) ? effectSampleSize : ''} onChange={(event) => {
                                    const numeric = Number(event.target.value);
                                    if (Number.isFinite(numeric)) {
                                        setEffectSampleSize(Math.max(4, Math.round(numeric)));
                                    }
                                }} className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm font-bold outline-none transition-colors ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200 focus:border-indigo-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500'}`} />
                            </label>

                            <label className="block">
                                <span className={`text-[11px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                                    Predictor Count
                                </span>
                                <input type="number" min={2} step={1} value={Number.isFinite(effectPredictorCount) ? effectPredictorCount : ''} onChange={(event) => {
                                    const numeric = Number(event.target.value);
                                    if (Number.isFinite(numeric)) {
                                        setEffectPredictorCount(Math.max(2, Math.round(numeric)));
                                    }
                                }} className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm font-bold outline-none transition-colors ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200 focus:border-indigo-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500'}`} />
                            </label>
                        </div>
                    </Card>
                </div>

                <div className="lg:col-span-7 space-y-6">
                    <div className="grid md:grid-cols-3 gap-4">
                        <MetricTile
                            darkMode={darkMode}
                            label="R^2"
                            value={formatStat(effectRSquared, 3)}
                            detail={`${formatStat(effectRSquared * 100, 1)}% of the outcome variance is explained by the full model.`}
                            tone="primary"
                        />
                        <MetricTile
                            darkMode={darkMode}
                            label="Adjusted R^2"
                            value={formatStat(effectAdjustedRSquared, 3)}
                            detail="Adjusted R^2 pulls the fit estimate back a bit when the model uses more predictors."
                        />
                        <MetricTile
                            darkMode={darkMode}
                            label="Cohen's f^2"
                            value={formatStat(effectFSquared, 3)}
                            detail="The shared power-analysis architecture uses f^2 = R^2 / (1 - R^2) for this omnibus regression slice."
                        />
                    </div>

                    <Card darkMode={darkMode}>
                        <div className="flex items-center gap-3 mb-4">
                            <TrendingUp size={18} className={darkMode ? 'text-emerald-300' : 'text-emerald-700'} />
                            <h3 className={`text-lg font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                What the effect-size numbers are telling you
                            </h3>
                        </div>
                        <div className="space-y-4">
                            <div className={`rounded-xl border p-4 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                                <div className={`text-[10px] font-black uppercase tracking-widest mb-2 ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>Overall fit</div>
                                <p className={`text-sm ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                                    R^2 is the share of outcome variance explained by the whole predictor set together. It is an overall model-fit story, not a statement that every coefficient is equally important.
                                </p>
                            </div>
                            <div className={`rounded-xl border p-4 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                                <div className={`text-[10px] font-black uppercase tracking-widest mb-2 ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>Conditional slopes</div>
                                <p className={`text-sm ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                                    Each coefficient is a conditional rate of change: how predicted Y changes for one predictor after the others in the model are held constant. That means slope size depends on units and overlap among predictors.
                                </p>
                            </div>
                            <div className={`rounded-xl border p-4 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                                <div className={`text-[10px] font-black uppercase tracking-widest mb-2 ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>Shared variance</div>
                                <p className={`text-sm ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                                    When predictors overlap, a model can still have a strong R^2 while individual coefficients become unstable. That is why adjusted R^2 and collinearity checks belong in the same conversation.
                                </p>
                            </div>
                        </div>
                    </Card>

                    {effectSourceStats?.ok && (
                        <Card darkMode={darkMode}>
                            <div className="flex items-center gap-3 mb-4">
                                <Calculator size={18} className={darkMode ? 'text-sky-300' : 'text-sky-700'} />
                                <h3 className={`text-lg font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                    Current conditional slopes
                                </h3>
                            </div>

                            <div className="grid md:grid-cols-2 gap-4">
                                {effectSourceStats.coefficients.filter((coefficient) => coefficient.id !== 'intercept').map((coefficient) => (
                                    <div key={coefficient.id} className={`rounded-xl border p-4 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                                        <div className={`text-[10px] font-black uppercase tracking-widest mb-2 ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>{coefficient.label}</div>
                                        <p className={`text-xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                            b = {formatStat(coefficient.estimate, 3)}
                                        </p>
                                        <p className={`mt-2 text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                            {coefficient.interpretation}
                                        </p>
                                        <p className={`mt-3 text-xs font-bold uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                                            Standardized beta {formatStat(coefficient.standardizedBeta, 3)} | VIF {formatStat(coefficient.vif, 2)}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
