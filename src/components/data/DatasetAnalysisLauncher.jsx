import { ArrowRight } from 'lucide-react';
import TonePill from './DatasetTonePill.jsx';

export default function DatasetAnalysisLauncher({
    setAnalysisMenuDatasetId, darkMode, analysisMenuDataset, analysisCompatibility,
    handleLaunchAnalysis,
}) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
                onClick={() => setAnalysisMenuDatasetId('')}
                role="presentation"
            />
            <div className={`relative z-10 w-full max-w-3xl rounded-3xl border p-6 shadow-2xl ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <div className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
                            Analysis launcher
                        </div>
                        <h3 className={`mt-1 text-2xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                            Choose analysis for {analysisMenuDataset.name}
                        </h3>
                        <p className={`mt-2 text-sm max-w-2xl ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                            Supported analysis pages open directly on their calculator tab with this dataset already active.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setAnalysisMenuDatasetId('')}
                        className={`rounded-xl border px-4 py-3 text-sm font-black uppercase tracking-widest ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-300 hover:text-white' : 'bg-slate-50 border-slate-200 text-slate-700 hover:text-slate-900'}`}
                    >
                        Close
                    </button>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                    {analysisCompatibility.map((analysis) => (
                        <div
                            key={analysis.id}
                            className={`rounded-2xl border p-5 ${analysis.compatible
                                ? (darkMode ? 'bg-indigo-500/10 border-indigo-500/30' : 'bg-indigo-50 border-indigo-200')
                                : (darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200')
                            }`}
                        >
                            <div className="flex items-start justify-between gap-3">
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
            </div>
        </div>
    );
}
