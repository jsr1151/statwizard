import { Info } from 'lucide-react';
import Card from '../analysis/AnalysisCard.jsx';
import { formatStatistic as formatStat } from '../../utils/statFormatters.js';

export default function MultipleRegressionTeachingNotes({
    darkMode, lessonContext, lessonOverlapCorrelation,
}) {
    return (
        <Card darkMode={darkMode}>
            <div className="flex items-center gap-3 mb-4">
                <Info size={18} className={darkMode ? 'text-sky-300' : 'text-sky-700'} />
                <h3 className={`text-lg font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                    What this tutor is teaching
                </h3>
            </div>

            <div className="space-y-3">
                <div className={`rounded-xl border p-4 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                    <div className={`text-[10px] font-black uppercase tracking-widest mb-2 ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>Coefficients are conditional</div>
                    <p className={`text-sm ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                        Each slope shows the change in predicted {lessonContext.outcomeLabel} for one predictor while the other predictor stays fixed.
                    </p>
                </div>
                <div className={`rounded-xl border p-4 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                    <div className={`text-[10px] font-black uppercase tracking-widest mb-2 ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>Predictors can overlap</div>
                    <p className={`text-sm ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                        The current predictor overlap is |r| = {formatStat(lessonOverlapCorrelation, 2)}. Predictors can share variance and still both matter, but heavy overlap makes the individual slopes less stable.
                    </p>
                </div>
                <div className={`rounded-xl border p-4 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                    <div className={`text-[10px] font-black uppercase tracking-widest mb-2 ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>Fit, prediction, and interpretation differ</div>
                    <p className={`text-sm ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                        High R^2 means the whole model predicts well overall. It does not guarantee that each coefficient is stable, precise, or easy to explain.
                    </p>
                </div>
                <div className={`rounded-xl border p-4 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                    <div className={`text-[10px] font-black uppercase tracking-widest mb-2 ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>Additive effects only</div>
                    <p className={`text-sm ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                        This page models additive effects only. If the effect of one predictor depends on the level of the other predictor, the model needs an interaction term.
                    </p>
                </div>
            </div>
        </Card>
    );
}
