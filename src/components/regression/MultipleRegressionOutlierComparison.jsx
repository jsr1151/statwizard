import { AlertTriangle } from 'lucide-react';
import Card from '../analysis/AnalysisCard.jsx';
import { formatStatistic as formatStat } from '../../utils/statFormatters.js';
import { formatSignedDifference } from '../../utils/multipleRegressionLesson.js';
import TooltipLabel from './MultipleRegressionTooltipLabel.jsx';

export default function MultipleRegressionOutlierComparison({
    darkMode, lessonOutlierComparison, lessonStats,
}) {
    return (
        <Card darkMode={darkMode}>
            <div className="flex items-center gap-3 mb-4">
                <AlertTriangle size={18} className={darkMode ? 'text-amber-300' : 'text-amber-700'} />
                <h3 className={`text-lg font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                    What changed when the influential case was added
                </h3>
            </div>
            <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                This comparison uses the same underlying sample before and after adding one influential case. Notice that the fitted model can move even though most rows stay the same.
            </p>

            <div className="mt-5 grid md:grid-cols-2 gap-4">
                {lessonOutlierComparison.metrics.map((metric) => (
                    <div key={metric.id} className={`rounded-xl border p-4 ${darkMode ? 'bg-amber-500/10 border-amber-500/20' : 'bg-amber-50 border-amber-200'}`}>
                        <div className={`text-[10px] font-black uppercase tracking-widest mb-2 ${darkMode ? 'text-amber-200' : 'text-amber-700'}`}>
                            <TooltipLabel darkMode={darkMode} label={metric.label} tooltipKey={metric.tooltipKey} />
                        </div>
                        <p className={`text-sm font-bold ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                            {formatStat(metric.before, 3)} to {formatStat(metric.after, 3)}
                        </p>
                        <p className={`mt-2 text-sm ${darkMode ? 'text-amber-100' : 'text-amber-700'}`}>
                            Delta {formatSignedDifference(metric.after - metric.before, 3)}
                        </p>
                    </div>
                ))}
            </div>

            <div className="mt-5 grid md:grid-cols-2 gap-4">
                {lessonOutlierComparison.coefficients.map((coefficient) => (
                    <div key={coefficient.id} className={`rounded-xl border p-4 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                        <h4 className={`font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                            {coefficient.label}
                        </h4>
                        <p className={`mt-2 text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                            Estimate: {formatStat(coefficient.estimateBefore, 3)} to {formatStat(coefficient.estimateAfter, 3)} ({formatSignedDifference((coefficient.estimateAfter || 0) - (coefficient.estimateBefore || 0), 3)})
                        </p>
                        <p className={`mt-1 text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                            SE: {formatStat(coefficient.seBefore, 3)} to {formatStat(coefficient.seAfter, 3)} ({formatSignedDifference((coefficient.seAfter || 0) - (coefficient.seBefore || 0), 3)})
                        </p>
                    </div>
                ))}
            </div>

            <div className={`mt-5 rounded-xl border p-4 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <p className={`text-sm ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                    The most influential case in this version has leverage {formatStat(lessonStats.influence?.influentialPoint?.leverage, 3)} and Cook&apos;s D {formatStat(lessonStats.influence?.influentialPoint?.cooksDistance, 3)}.
                </p>
            </div>
        </Card>
    );
}
