import { Info, RefreshCw, SlidersHorizontal, Sparkles, Target } from "lucide-react";
import PearsonScatterplot from "./PearsonScatterplot";
import Card from '../analysis/AnalysisCard.jsx';
import MetricTile from '../analysis/AnalysisMetricTile.jsx';
import { formatStatistic as formatStat } from '../../utils/statFormatters.js';
import { PEARSON_TUTOR_PRESETS as TUTOR_PRESETS } from '../../data/pearsonCorrelationPresets.js';

export default function PearsonLessonSection({
    darkMode, lessonPairs, lessonDataset, lessonStats,
    lessonShowLine, lessonShowBand, lessonSubtitle, lessonPreset,
    lessonContextStats, selectLessonPreset, lessonSampleSize, setLessonSampleSize,
    lessonNoise, setLessonNoise, setLessonShowLine, setLessonShowBand,
    setLessonOutlierOn, lessonOutlierOn, regenerateLessonSample,
}) {
    return (
        <div className="space-y-8">
            <Card darkMode={darkMode}>
                <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-xl ${darkMode ? 'bg-indigo-500/10 text-indigo-300' : 'bg-indigo-50 text-indigo-700'}`}>
                        <Sparkles size={20} />
                    </div>
                    <div>
                        <h3 className={`text-xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>Pearson correlation tutor / lessons</h3>
                        <p className={`mt-2 text-sm max-w-3xl ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                            This first slice is an interactive concept page rather than a formal lesson engine. Use the presets and controls to see what r responds to and what it misses.
                        </p>
                    </div>
                </div>
            </Card>

            <div className="grid lg:grid-cols-12 gap-8 items-start">
                <div className="lg:col-span-8 space-y-6">
                    <Card darkMode={darkMode}>
                        <PearsonScatterplot
                            pairs={lessonPairs}
                            backgroundPairs={lessonDataset.contextPairs}
                            stats={lessonStats}
                            darkMode={darkMode}
                            xLabel="X Variable"
                            yLabel="Y Variable"
                            showLine={lessonShowLine}
                            showConfidenceBand={lessonShowBand}
                            highlightPointIndex={lessonStats?.influence?.influentialPoint?.index}
                            highlightXRange={lessonDataset.highlightXRange}
                            title="Interactive Scatterplot"
                            subtitle={lessonSubtitle}
                        />
                    </Card>

                    <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
                        <MetricTile darkMode={darkMode} label="r" value={formatStat(lessonStats?.r, 3)} tone="primary" />
                        <MetricTile darkMode={darkMode} label="r²" value={formatStat(lessonStats?.rSquared, 3)} />
                        <MetricTile darkMode={darkMode} label="n" value={`${lessonStats?.n || 0}`} />
                        <MetricTile darkMode={darkMode} label="Live Read" value={lessonStats?.interpretation || 'Waiting for data'} />
                    </div>

                    {lessonPreset === 'restricted_range' && lessonContextStats?.ok && lessonStats?.ok && (
                        <Card darkMode={darkMode}>
                            <div className="flex items-center gap-3 mb-3">
                                <Target size={18} className={darkMode ? 'text-amber-300' : 'text-amber-700'} />
                                <h3 className={`text-lg font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                    Why the restricted-range preset looks weaker
                                </h3>
                            </div>
                            <p className={`text-sm leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                The faded points show the broader linear relationship with r = {formatStat(lessonContextStats.r, 3)}. The highlighted slice only observes part of the X range, so the visible spread gets compressed and the observed r drops to {formatStat(lessonStats.r, 3)}.
                            </p>
                        </Card>
                    )}
                </div>

                <div className="lg:col-span-4 space-y-6">
                    <Card darkMode={darkMode}>
                        <div className="flex items-center gap-3 mb-4">
                            <SlidersHorizontal size={18} className={darkMode ? 'text-indigo-300' : 'text-indigo-700'} />
                            <div>
                                <div className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>Presets</div>
                                <h3 className={`text-xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>Explore the pattern</h3>
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
                        </div>

                        <div className="mt-6 grid grid-cols-2 gap-3">
                            <button onClick={() => setLessonShowLine((value) => !value)} className={`rounded-xl border px-4 py-3 text-xs font-black uppercase tracking-widest transition-all ${lessonShowLine ? 'bg-indigo-600 text-white border-indigo-500' : (darkMode ? 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900')}`}>{lessonShowLine ? 'Hide Line' : 'Show Line'}</button>
                            <button onClick={() => setLessonShowBand((value) => !value)} className={`rounded-xl border px-4 py-3 text-xs font-black uppercase tracking-widest transition-all ${lessonShowBand ? 'bg-indigo-600 text-white border-indigo-500' : (darkMode ? 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900')}`}>{lessonShowBand ? 'Hide Band' : 'Show Band'}</button>
                            <button
                                onClick={() => setLessonOutlierOn((value) => !value)}
                                className={`col-span-2 rounded-xl border px-4 py-3 text-xs font-black uppercase tracking-widest transition-all ${lessonOutlierOn ? 'bg-indigo-600 text-white border-indigo-500' : (darkMode ? 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900')}`}
                            >
                                {lessonOutlierOn ? 'Remove Outlier' : 'Add Outlier'}
                            </button>
                            <button
                                onClick={regenerateLessonSample}
                                className={`col-span-2 inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-xs font-black uppercase tracking-widest transition-all ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-300 hover:text-white hover:border-indigo-500' : 'bg-slate-50 border-slate-200 text-slate-700 hover:text-slate-900 hover:border-indigo-500'}`}
                            >
                                <RefreshCw size={14} />
                                Regenerate Sample
                            </button>
                        </div>

                        <div className={`mt-4 rounded-xl border p-4 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                            <div className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-indigo-300' : 'text-indigo-700'}`}>
                                Outlier Toggle
                            </div>
                            <p className={`mt-2 text-sm leading-relaxed ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                                Apply one influential point to the current base pattern so you can compare the same relationship before and after the outlier appears.
                            </p>
                        </div>

                        <div className={`mt-4 rounded-xl border p-4 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                            <div className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-indigo-300' : 'text-indigo-700'}`}>
                                Stable Sample
                            </div>
                            <p className={`mt-2 text-sm leading-relaxed ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                                Noise, sample size, and the outlier toggle now modify the same active sample. Use regenerate only when you want a fresh example.
                            </p>
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
                                'r measures direction and strength of a straight-line association.',
                                'r = 0 does not prove there is no relationship of any kind.',
                                'A curved relationship can look strong in the plot while r stays small.',
                                'Outliers can strongly change both the fitted line and r.',
                                'Restriction of range usually shrinks r.',
                                'Correlation does not tell you what causes what.',
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
