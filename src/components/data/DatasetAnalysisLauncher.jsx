import { ArrowRight } from 'lucide-react';
import { useEffect, useId, useRef } from 'react';
import TonePill from './DatasetTonePill.jsx';

export default function DatasetAnalysisLauncher({
    setAnalysisMenuDatasetId, darkMode, analysisMenuDataset, analysisCompatibility,
    handleLaunchAnalysis,
}) {
    const dialogRef = useRef(null);
    const titleId = useId();

    useEffect(() => {
        const dialog = dialogRef.current;
        const previouslyFocused = document.activeElement;
        dialog.showModal();
        return () => {
            dialog.close();
            if (previouslyFocused?.isConnected) previouslyFocused.focus();
        };
    }, []);

    return (
        <dialog
            ref={dialogRef}
            aria-labelledby={titleId}
            onCancel={() => setAnalysisMenuDatasetId('')}
            onClick={(event) => {
                if (event.target !== event.currentTarget) return;
                const bounds = event.currentTarget.getBoundingClientRect();
                if (event.clientX < bounds.left || event.clientX > bounds.right
                    || event.clientY < bounds.top || event.clientY > bounds.bottom) {
                    setAnalysisMenuDatasetId('');
                }
            }}
            className={`fixed inset-0 m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-3xl overflow-y-auto overscroll-contain rounded-3xl border p-4 shadow-2xl [overflow-wrap:anywhere] backdrop:bg-slate-950/70 backdrop:backdrop-blur-sm sm:p-6 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}
        >
            <div className="flex flex-col-reverse items-start gap-4 sm:flex-row sm:justify-between">
                <div className="min-w-0">
                    <div className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
                        Analysis launcher
                    </div>
                    <h3 id={titleId} className={`mt-1 text-2xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                        Choose analysis for {analysisMenuDataset.name}
                    </h3>
                    <p className={`mt-2 text-sm max-w-2xl ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                        Supported analysis pages open directly on their calculator tab with this dataset already active.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => setAnalysisMenuDatasetId('')}
                    className={`shrink-0 self-end rounded-xl border px-4 py-3 text-sm font-black uppercase tracking-widest focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 sm:self-start ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-300 hover:text-white' : 'bg-slate-50 border-slate-200 text-slate-700 hover:text-slate-900'}`}
                >
                    Close
                </button>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                {analysisCompatibility.map((analysis) => (
                    <div
                        key={analysis.id}
                        className={`rounded-2xl border p-5 ${analysis.compatible
                            ? (darkMode ? 'bg-indigo-500/10 border-indigo-500/30' : 'bg-indigo-50 border-indigo-200')
                            : (darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200')
                        }`}
                    >
                        <div className="flex flex-col items-start gap-3">
                            <div>
                                <h4 className={`text-lg font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                    {analysis.label}
                                </h4>
                                <p className={`mt-2 text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                    {analysis.summary}
                                </p>
                            </div>
                            <TonePill darkMode={darkMode} tone={analysis.compatible ? 'primary' : 'warning'}>
                                {analysis.compatible ? 'Ready' : 'Needs more variables'}
                            </TonePill>
                        </div>

                        <p className={`mt-4 text-xs ${darkMode ? 'text-slate-500' : 'text-slate-600'}`}>
                            {analysis.detail}
                        </p>

                        <button
                            type="button"
                            onClick={() => handleLaunchAnalysis(analysis.id)}
                            disabled={!analysis.compatible}
                            className={`mt-4 inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-black uppercase tracking-widest disabled:cursor-not-allowed disabled:opacity-50 ${analysis.compatible
                                ? (darkMode ? 'bg-indigo-600 text-white hover:bg-indigo-500' : 'bg-indigo-600 text-white hover:bg-indigo-700')
                                : (darkMode ? 'bg-slate-900 text-slate-500' : 'bg-slate-100 text-slate-400')
                            }`}
                        >
                            <ArrowRight size={16} />
                            Open Calculator
                        </button>
                    </div>
                ))}
            </div>
        </dialog>
    );
}
