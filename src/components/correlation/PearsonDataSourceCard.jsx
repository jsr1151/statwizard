import { Database, FileUp, Sparkles } from "lucide-react";
import Card from '../analysis/AnalysisCard.jsx';
import { PEARSON_SAMPLE_DATASET as SAMPLE_DATASET } from '../../data/pearsonCorrelationPresets.js';

export default function PearsonDataSourceCard({
    darkMode, setCalculatorInputMode, calculatorInputMode, onUpload,
    setTableText, tableText, selectedDatasetId, setSelectedDatasetId,
    datasets, savedDataset, savedNumericColumns,
}) {
    return (
        <Card darkMode={darkMode}>
            <div className="flex items-center gap-3 mb-4">
                <Database size={18} className={darkMode ? 'text-indigo-300' : 'text-indigo-700'} />
                <div>
                    <div className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
                        Data Source
                    </div>
                    <h3 className={`text-xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                        Choose the input mode
                    </h3>
                </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-5">
                {[
                    { id: 'paste', label: 'Paste / Upload' },
                    { id: 'saved', label: 'Saved Dataset' },
                ].map((mode) => (
                    <button
                        key={mode.id}
                        type="button"
                        onClick={() => setCalculatorInputMode(mode.id)}
                        className={`rounded-full border px-3 py-2 text-[11px] font-black uppercase tracking-widest transition-colors ${calculatorInputMode === mode.id
                            ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300'
                            : (darkMode ? 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700 hover:text-slate-200' : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:text-slate-900')
                        }`}
                    >
                        {mode.label}
                    </button>
                ))}
            </div>

            {calculatorInputMode === 'paste' ? (
                <>
                    <div className="flex flex-wrap gap-3 mb-4">
                        <label className={`inline-flex items-center gap-2 px-4 py-3 rounded-xl border cursor-pointer text-sm font-black uppercase tracking-widest transition-all ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200 hover:border-indigo-500' : 'bg-slate-50 border-slate-200 text-slate-900 hover:border-indigo-500'}`}>
                            <FileUp size={16} />
                            Upload CSV
                            <input type="file" accept=".csv,.txt,.tsv" className="sr-only" onChange={onUpload} />
                        </label>
                        <button
                            onClick={() => setTableText(SAMPLE_DATASET)}
                            className={`inline-flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-black uppercase tracking-widest transition-all ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200 hover:border-indigo-500' : 'bg-slate-50 border-slate-200 text-slate-900 hover:border-indigo-500'}`}
                        >
                            <Sparkles size={16} />
                            Sample Data
                        </button>
                    </div>

                    <textarea
                        aria-label="Paste correlation data as CSV or a table"
                        value={tableText}
                        onChange={(event) => setTableText(event.target.value)}
                        className={`w-full h-64 rounded-2xl border p-4 text-sm font-mono outline-none transition-colors ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200 focus:border-indigo-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500'}`}
                    />
                </>
            ) : (
                <div className="space-y-5">
                    <label className="block">
                        <span className={`text-[11px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                            Saved Dataset
                        </span>
                        <select
                            value={selectedDatasetId}
                            onChange={(event) => setSelectedDatasetId(event.target.value)}
                            className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm font-bold outline-none transition-colors ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200 focus:border-indigo-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500'}`}
                        >
                            {!datasets.length && <option value="">No saved datasets yet</option>}
                            {datasets.map((dataset) => (
                                <option key={dataset.id} value={dataset.id}>{dataset.name}</option>
                            ))}
                        </select>
                    </label>

                    {savedDataset && (
                        <div className={`rounded-2xl border p-4 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                            <div className={`text-[10px] font-black uppercase tracking-widest mb-2 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
                                Dataset snapshot
                            </div>
                            <p className={`text-sm font-bold ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                                {savedDataset.rowCount} rows / {savedDataset.columnCount} variables
                            </p>
                            <p className={`mt-2 text-xs ${darkMode ? 'text-slate-500' : 'text-slate-600'}`}>
                                {savedNumericColumns.length} numeric variable{savedNumericColumns.length === 1 ? '' : 's'} available for Pearson correlation.
                            </p>
                        </div>
                    )}
                </div>
            )}
        </Card>
    );
}
