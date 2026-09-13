import { useEffect, useMemo, useState } from 'react';
import { calculatePairedCalculator, swapPairedInput } from '../../stats/pairedCalculator.js';
import { createPairedDraft } from '../../utils/pairedDraft.js';
import { buildPairedReport, formatPairedInterval } from '../../stats/pairedReport.js';
import { formatStatistic, formatPValue } from '../../utils/statFormatters.js';
import useTutor from '../../hooks/useTutor.js';
import PairedLessonInputs from './PairedLessonInputs.jsx';
import PairedLessonPlot from './PairedLessonPlot.jsx';
import Card from '../analysis/AnalysisCard.jsx';
import MetricTile from '../analysis/AnalysisMetricTile.jsx';
import CopyResultsButton from '../common/CopyResultsButton.jsx';

const initialLesson = () => ({ ...createPairedDraft(), inputMode: 'summary' });
export default function PairedTTestVisual({ darkMode, onTutorUpdate, onStatsUpdate }) {
    const [value, setValue] = useState(initialLesson);
    const [plotKey, setPlotKey] = useState(0);
    const patch = change => setValue(previous => ({ ...previous, ...change }));
    const stats = useMemo(() => calculatePairedCalculator(value), [value]);
    const tutor = useTutor(stats.ok ? 't_test_paired' : '', stats);
    useEffect(() => { onStatsUpdate?.(stats.ok ? stats : null); }, [stats, onStatsUpdate]);
    useEffect(() => { onTutorUpdate?.(stats.ok ? tutor.activeScript : null); }, [stats.ok, tutor.activeScript, onTutorUpdate]);
    const profile = value[value.inputMode];
    const report = buildPairedReport({ result: stats, source: `Lesson: ${profile.source}`, labels: profile.labels, inputMode: value.inputMode });
    const swap = () => setValue(current => current.inputMode === 'raw'
        ? { ...current, raw: { ...current.raw, text: swapPairedInput(current.raw.text), labels: [...current.raw.labels].reverse() } }
        : { ...current, summary: { ...current.summary, mean1: current.summary.mean2, mean2: current.summary.mean1, sd1: current.summary.sd2, sd2: current.summary.sd1, labels: [...current.summary.labels].reverse() } });
    return <div className="space-y-5 min-w-0 [overflow-wrap:anywhere]">
        <Card darkMode={darkMode}>
            <div className="flex flex-wrap items-center justify-between gap-3"><h3 className="text-xl font-bold">Explore paired inference</h3><button className="rounded-lg border px-3 py-2 text-sm font-semibold" onClick={() => { setValue(initialLesson()); setPlotKey(key => key + 1); }}>Reset lesson</button></div>
            <p className="my-3 text-sm">Change the example to see how correlation, mean differences, and sample size affect inference. Lesson inputs remain separate from your saved calculator draft.</p>
            <p className="mb-3 text-sm font-semibold">Current order: {profile.labels[0]} minus {profile.labels[1]}.</p>
            <PairedLessonInputs value={value} patch={patch} swap={swap} darkMode={darkMode} />
        </Card>
        {!stats.ok ? <div role="status" className={`rounded-xl border p-4 text-sm ${darkMode ? 'bg-amber-950 border-amber-700 text-amber-100' : 'bg-amber-50 border-amber-300 text-amber-900'}`}><p className="font-semibold">Complete the lesson inputs</p><ul className="mt-2 list-disc pl-5">{stats.errors.map(error => <li key={error}>{error}</li>)}</ul></div> : <>
            <PairedLessonPlot key={plotKey} stats={stats} labels={profile.labels} darkMode={darkMode} />
            <section aria-label="Paired lesson results" className="space-y-4">
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{[['Complete pairs',stats.n],['Mean difference',stats.dBar],['SD of differences',stats.sd],['t statistic',stats.t],['Degrees of freedom',stats.df],['Standard error',stats.se],["Cohen's dz",stats.dz]].map(([label,number]) => <MetricTile key={label} darkMode={darkMode} label={label} value={formatStatistic(number,4)} />)}<MetricTile darkMode={darkMode} label="p-value" value={formatPValue(stats.p)} /></div>
                <Card darkMode={darkMode}>
                    <h3 className="text-lg font-bold">Lesson inference</h3>
                    <p className="mt-2">{stats.isSignificant ? 'Reject the null hypothesis' : 'Do not reject the null hypothesis'} at alpha = {stats.alpha}.</p>
                    <p className="mt-2">{formatPairedInterval(stats)}</p>
                    <p className="mt-2 text-sm">The interval uses Student t with {stats.df} degrees of freedom. It describes the population mean paired difference. Cohen's dz uses the sample SD of differences. Failing to reject does not establish equality.</p>
                    <details className="my-3"><summary className="cursor-pointer text-sm font-semibold">Report text</summary><p className="mt-3 whitespace-pre-wrap text-sm">{report}</p></details>
                    <CopyResultsButton text={report} label="Copy lesson report" darkMode={darkMode} />
                </Card>
            </section>
        </>}
    </div>;
}
