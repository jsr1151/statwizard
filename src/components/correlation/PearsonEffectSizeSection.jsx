import { AlertTriangle, Calculator, Info, Sigma, TrendingUp } from "lucide-react";
import { buildCorrelationInterpretation, getCorrelationConventionLabel } from "../../stats/correlation.js";
import Card from '../analysis/AnalysisCard.jsx';
import MetricTile from '../analysis/AnalysisMetricTile.jsx';
import { formatStatistic as formatStat } from '../../utils/statFormatters.js';

export default function PearsonEffectSizeSection({
    effectSourceStats, darkMode, effectRValue, setEffectRValue,
    effectRSquared,
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
                                r = {formatStat(effectSourceStats.r, 3)}
                            </h3>
                            <p className={`mt-2 text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                Pulled from the active calculator data so the effect-size section stays connected to the page workflow.
                            </p>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${darkMode ? 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20' : 'bg-indigo-50 text-indigo-700 border border-indigo-200'}`}>
                            r² = {formatStat(effectSourceStats.rSquared, 3)}
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
                                    r is already the effect size
                                </h3>
                            </div>
                        </div>

                        <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                            This section stays simple on purpose: translate between observed r and r², keep context visible, and avoid pretending that one set of conventions fits every study. In the Power Analysis tab, the same idea is written with population notation ρ and ρ₀.
                        </p>

                        <div className="mt-6 grid gap-4">
                            <label className="block">
                                <span className={`text-[11px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                                    Sample Correlation (r)
                                </span>
                                <input
                                    type="number"
                                    min={-0.999}
                                    max={0.999}
                                    step={0.01}
                                    value={Number.isFinite(effectRValue) ? effectRValue : ''}
                                    onChange={(event) => {
                                        const numeric = Number(event.target.value);
                                        if (Number.isFinite(numeric)) {
                                            setEffectRValue(Math.max(-0.999, Math.min(0.999, numeric)));
                                        }
                                    }}
                                    className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm font-bold outline-none transition-colors ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200 focus:border-indigo-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500'}`}
                                />
                            </label>

                            <label className="block">
                                <span className={`text-[11px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                                    Variance Explained (r²)
                                </span>
                                <input
                                    type="number"
                                    min={0}
                                    max={1}
                                    step={0.01}
                                    value={Number.isFinite(effectRSquared) ? effectRSquared.toFixed(3) : ''}
                                    onChange={(event) => {
                                        const numeric = Number(event.target.value);
                                        if (Number.isFinite(numeric)) {
                                            const bounded = Math.max(0, Math.min(1, numeric));
                                            const sign = effectRValue < 0 ? -1 : 1;
                                            setEffectRValue(sign * Math.sqrt(bounded));
                                        }
                                    }}
                                    className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm font-bold outline-none transition-colors ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200 focus:border-indigo-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500'}`}
                                />
                            </label>
                        </div>
                    </Card>
                </div>

                <div className="lg:col-span-7 space-y-6">
                    <div className="grid md:grid-cols-2 gap-4">
                        <MetricTile
                            darkMode={darkMode}
                            label="r"
                            value={formatStat(effectRValue, 3)}
                            tone="primary"
                            detail={buildCorrelationInterpretation(effectRValue)}
                        />
                        <MetricTile
                            darkMode={darkMode}
                            label="r²"
                            value={formatStat(effectRSquared, 3)}
                            detail={`${formatStat(effectRSquared * 100, 1)}% of the variance is shared in the linear model.`}
                        />
                    </div>

                    <Card darkMode={darkMode}>
                        <div className="flex items-center gap-3 mb-3">
                            <TrendingUp size={18} className={darkMode ? 'text-emerald-300' : 'text-emerald-700'} />
                            <h3 className={`text-lg font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                What r² means
                            </h3>
                        </div>
                        <p className={`text-sm leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                            r² reframes the correlation as shared linear variance. Many users find it easier to read &quot;about 25% of the variance is shared&quot; than to interpret r = .50 directly.
                        </p>
                    </Card>

                    <Card darkMode={darkMode}>
                        <div className="flex items-center gap-3 mb-3">
                            <Info size={18} className={darkMode ? 'text-amber-300' : 'text-amber-700'} />
                            <h3 className={`text-lg font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                Use conventions carefully
                            </h3>
                        </div>
                        <p className={`text-sm leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                            Rough textbook convention: {getCorrelationConventionLabel(effectRValue)}. That is a convention, not a rule. The same r can matter very differently across measures and fields.
                        </p>
                    </Card>

                    <Card darkMode={darkMode}>
                        <div className="flex items-center gap-3 mb-3">
                            <AlertTriangle size={18} className={darkMode ? 'text-amber-300' : 'text-amber-700'} />
                            <h3 className={`text-lg font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                Significance is not size
                            </h3>
                        </div>
                        <p className={`text-sm leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                            A tiny r can be significant in a large sample, and a meaningful r can miss significance in a small sample. Keep the effect-size question separate from the hypothesis-test question.
                        </p>
                    </Card>
                </div>
            </div>
        </div>
    );
}
