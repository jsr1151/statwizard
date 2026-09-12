import Card from '../analysis/AnalysisCard.jsx';
import { formatStatistic as formatStat } from '../../utils/statFormatters.js';
import { INTERNAL_PREDICTOR_IDS } from '../../data/multipleRegressionLesson.js';
import MultipleRegressionLessonVisual from './MultipleRegressionLessonVisual.jsx';

export default function MultipleRegressionTeachingView({
    darkMode, lessonMainViews, lessonMainView, setLessonMainView,
    lessonEquationText, lessonSymbolicEquation, lessonContext, lessonPredictorLabels,
    lessonStats, lessonPredictionInputs, setLessonPredictionInputs, lessonPrediction,
    lessonSelectedPointId, setLessonSelectedPointId,
}) {
    return (
        <Card darkMode={darkMode} className="lg:sticky lg:top-24 xl:top-28 z-10 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
                <div className={`text-[10px] font-black uppercase tracking-widest mb-2 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
                    Main teaching view
                </div>
                <h3 className={`text-lg font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                    {lessonMainViews.find((view) => view.id === lessonMainView)?.label || 'Observed vs Fitted'}
                </h3>
            </div>
            <div className="flex flex-wrap gap-2">
                {lessonMainViews.map((view) => (
                    <button
                        key={view.id}
                        onClick={() => setLessonMainView(view.id)}
                        className={`rounded-full border px-3 py-2 text-[11px] font-black uppercase tracking-widest transition-colors ${lessonMainView === view.id ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300' : (darkMode ? 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700 hover:text-slate-200' : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:text-slate-900')}`}
                    >
                        {view.label}
                    </button>
                ))}
            </div>
        </div>

        <div className={`rounded-2xl border p-4 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <div className={`text-[10px] font-black uppercase tracking-widest mb-2 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
                        Live regression equation
                    </div>
                    <p className={`text-xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                        {lessonEquationText}
                    </p>
                    <p className={`mt-2 text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                        {lessonSymbolicEquation}
                    </p>
                </div>
                <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${darkMode ? 'bg-amber-500/10 text-amber-200 border border-amber-500/20' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                    Additive model only
                </div>
            </div>
            <p className={`mt-3 text-sm leading-relaxed ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                Each slope is conditional: it tells the change in predicted {lessonContext.outcomeLabel} for a 1-unit increase in one predictor while the other predictor is held constant.
            </p>
            <p className={`mt-2 text-xs leading-relaxed ${darkMode ? 'text-slate-500' : 'text-slate-600'}`}>
                This model assumes the effect of {lessonPredictorLabels[INTERNAL_PREDICTOR_IDS[0]]} does not depend on {lessonPredictorLabels[INTERNAL_PREDICTOR_IDS[1]]}, and vice versa. That would require an interaction term.
            </p>
        </div>

        <div className={`lg:hidden rounded-2xl border p-4 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
            <div className="flex items-center justify-between gap-3">
                <div>
                    <div className={`text-[10px] font-black uppercase tracking-widest mb-2 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
                        Prediction controls
                    </div>
                    <p className={`text-xs ${darkMode ? 'text-slate-500' : 'text-slate-600'}`}>
                        Mirrors the custom predictor profile so you can adjust prediction inputs while the graph stays in view.
                    </p>
                </div>
                <div className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-widest ${darkMode ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-600'}`}>
                    Graph-side helper
                </div>
            </div>

            <div className="mt-4 grid gap-3">
                {lessonStats?.predictorSummaries?.map((summary) => (
                    <label key={`quick-${summary.label}`} className="block">
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
                                {formatStat(summary.min, 1)} to {formatStat(summary.max, 1)}
                            </span>
                        </div>
                    </label>
                ))}
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
                <div className={`rounded-xl border p-4 ${darkMode ? 'bg-indigo-500/10 border-indigo-500/20' : 'bg-indigo-50 border-indigo-200'}`}>
                    <div className={`text-[10px] font-black uppercase tracking-widest mb-2 ${darkMode ? 'text-indigo-300' : 'text-indigo-700'}`}>
                        Predicted {lessonContext.outcomeLabel}
                    </div>
                    <p className={`text-2xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>{formatStat(lessonPrediction?.fitted, 3)}</p>
                </div>
                <div className={`rounded-xl border px-4 py-3 text-sm ${darkMode ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-white border-slate-200 text-slate-700'}`}>
                    <div className={`text-[10px] font-black uppercase tracking-widest mb-1 ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                        Current view
                    </div>
                    <p className="font-bold">
                        {lessonMainViews.find((view) => view.id === lessonMainView)?.label || 'Observed vs Fitted'}
                    </p>
                </div>
            </div>
        </div>

        <MultipleRegressionLessonVisual {...{
            lessonContext, lessonPredictorLabels, lessonPredictionInputs, lessonMainView,
            lessonStats, darkMode, lessonSelectedPointId, setLessonSelectedPointId,
            lessonPrediction,
        }} />
        </Card>
    );
}
