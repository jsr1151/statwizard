import { useCallback, useEffect, useState } from 'react';
import useOneWayLesson from '../../hooks/useOneWayLesson.js';
import OneWayAnovaCalculator from '../analysis/OneWayAnovaCalculator.jsx';
import AnovaLessonViews from './AnovaLessonViews.jsx';
import Card from '../analysis/AnalysisCard.jsx';

export default function AnovaVisual({ darkMode, onStatsUpdate, onTutorUpdate, tutor }) {
    const input = useOneWayLesson();
    const [result, setResult] = useState(null);
    const [view, setView] = useState('fDist');
    const [plotKey, setPlotKey] = useState(0);
    const { activeTip, dismissTip } = tutor || {};
    const receiveStats = useCallback(stats => { setResult(stats); onStatsUpdate?.(stats); }, [onStatsUpdate]);
    useEffect(() => {
        if (!result) { onTutorUpdate?.(null); if (activeTip) dismissTip?.(activeTip.id); }
    }, [result, onTutorUpdate, activeTip, dismissTip]);
    useEffect(() => {
        const action = event => {
            if (typeof event.detail !== 'string') return;
            if (event.detail === 'highlight_ssb' || event.detail === 'highlight_f_drivers') setView('decomp');
            if (event.detail === 'run_post_hoc' && input.value.inputMode !== 'f') input.patch({ showComparisons: true });
            if (event.detail === 'add_group' && input.value.inputMode !== 'f') input.addGroup();
        };
        window.addEventListener('anovaTutorAction', action);
        return () => window.removeEventListener('anovaTutorAction', action);
    }, [input]);
    const selectView = next => { setView(next); window.dispatchEvent(new CustomEvent('anovaTutorAction', { detail: { signal: `change_tab_${next.toLowerCase()}` } })); };
    return <div className="space-y-5 min-w-0" onPointerDown={() => tutor?.resetIdle?.()} onKeyDown={() => tutor?.resetIdle?.()}>
        <Card darkMode={darkMode}>
            <div className="flex flex-wrap items-center justify-between gap-3"><h3 className="text-xl font-bold">Explore one-way ANOVA</h3><button type="button" className="rounded-lg border px-3 py-2 text-sm font-semibold" onClick={() => { input.reset(); setView('fDist'); setPlotKey(key => key + 1); }}>Reset lesson</button></div>
            <p className="mt-3 text-sm">Explore F and its degrees of freedom, or edit raw and summary groups to see how between-group and within-group variation affect inference. Lesson inputs remain separate from your saved calculator draft.</p>
            {result && <button type="button" className="mt-3 rounded-lg border px-3 py-2 text-sm font-semibold" onClick={() => window.dispatchEvent(new CustomEvent('anovaTutorAction', { detail: 'generate_apa_report' }))}>Open report builder</button>}
        </Card>
        <OneWayAnovaCalculator lesson input={input} darkMode={darkMode} onStatsUpdate={receiveStats}
            renderPlot={stats => <AnovaLessonViews key={plotKey} result={stats} view={view} setView={selectView} darkMode={darkMode} onExploreF={input.value.inputMode === 'f' ? F => input.patch({ f: { ...input.value.f, F } }) : undefined} />} />
    </div>;
}
