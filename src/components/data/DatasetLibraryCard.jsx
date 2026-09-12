import { ArrowRight, Copy, Database, Trash2 } from 'lucide-react';
import { formatTimestamp } from '../../utils/dataManagerHelpers.js';
import TonePill from './DatasetTonePill.jsx';
import Card from '../analysis/AnalysisCard.jsx';

export default function DatasetLibraryCard({
    darkMode, isLoading, datasets, editorDataset,
    handleOpenSavedDataset, handleDuplicateDataset, setAnalysisMenuDatasetId, handleDeleteDataset,
    error,
}) {
    return (
        <Card darkMode={darkMode}>
            <div className="flex items-center gap-3 mb-4">
                <Database size={18} className={darkMode ? 'text-sky-300' : 'text-sky-700'} />
                <h3 className={`text-lg font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                    Dataset library
                </h3>
            </div>

            <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                Saved datasets persist between sessions. Open one to refine variables, export a cleaned copy, or send it straight into a supported analysis page.
            </p>

            <div className="mt-5 space-y-3">
                {isLoading && (
                    <div className={`rounded-xl border px-4 py-5 text-sm ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                        Loading saved datasets...
                    </div>
                )}

                {!isLoading && !datasets.length && (
                    <div className={`rounded-xl border px-4 py-5 text-sm ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                        No saved datasets yet. Import a CSV, Excel, or SPSS file to start your local library.
                    </div>
                )}

                {!isLoading && datasets.map((dataset) => (
                    <div
                        key={dataset.id}
                        className={`rounded-2xl border p-4 transition-colors ${editorDataset?.id === dataset.id
                            ? (darkMode ? 'bg-indigo-500/10 border-indigo-500/30' : 'bg-indigo-50 border-indigo-200')
                            : (darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200')
                        }`}
                    >
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <h4 className={`font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>{dataset.name}</h4>
                                <p className={`mt-1 text-xs ${darkMode ? 'text-slate-500' : 'text-slate-600'}`}>
                                    {dataset.originalFileName || 'Local dataset'} / {dataset.fileType}
                                    {dataset.sheetName ? ` / ${dataset.sheetName}` : ''}
                                </p>
                            </div>
                            <TonePill darkMode={darkMode}>{dataset.rowCount} rows</TonePill>
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2">
                            {dataset.statusSummary.map((status) => (
                                <TonePill
                                    key={`${dataset.id}-${status}`}
                                    darkMode={darkMode}
                                    tone={status === 'Missing data' || status === 'Type warnings' ? 'warning' : 'default'}
                                >
                                    {status}
                                </TonePill>
                            ))}
                        </div>

                        <div className={`mt-3 text-xs ${darkMode ? 'text-slate-500' : 'text-slate-600'}`}>
                            {dataset.columnCount} variables / Updated {formatTimestamp(dataset.updatedAt)}
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={() => handleOpenSavedDataset(dataset)}
                                className={`rounded-lg px-3 py-2 text-[11px] font-black uppercase tracking-widest ${darkMode ? 'bg-slate-900 text-slate-200 hover:text-white' : 'bg-white text-slate-700 hover:text-slate-900 border border-slate-200'}`}
                            >
                                Open
                            </button>
                            <button
                                type="button"
                                onClick={() => handleDuplicateDataset(dataset)}
                                className={`inline-flex items-center gap-1 rounded-lg px-3 py-2 text-[11px] font-black uppercase tracking-widest ${darkMode ? 'bg-slate-900 text-slate-200 hover:text-white' : 'bg-white text-slate-700 hover:text-slate-900 border border-slate-200'}`}
                            >
                                <Copy size={12} />
                                Duplicate
                            </button>
                            <button
                                type="button"
                                onClick={() => setAnalysisMenuDatasetId(dataset.id)}
                                className={`inline-flex items-center gap-1 rounded-lg px-3 py-2 text-[11px] font-black uppercase tracking-widest ${darkMode ? 'bg-indigo-600 text-white hover:bg-indigo-500' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
                            >
                                <ArrowRight size={12} />
                                Analyze Dataset
                            </button>
                            <button
                                type="button"
                                onClick={() => handleDeleteDataset(dataset)}
                                className={`inline-flex items-center gap-1 rounded-lg px-3 py-2 text-[11px] font-black uppercase tracking-widest ${darkMode ? 'bg-slate-900 text-rose-300 hover:text-rose-200' : 'bg-white text-rose-600 hover:text-rose-700 border border-slate-200'}`}
                            >
                                <Trash2 size={12} />
                                Delete
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {error && (
                <div className={`mt-4 rounded-xl border px-4 py-3 text-sm ${darkMode ? 'bg-amber-500/10 border-amber-500/20 text-amber-200' : 'bg-amber-50 border-amber-200 text-amber-700'}`}>
                    {error}
                </div>
            )}
        </Card>
    );
}
