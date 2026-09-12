import { Database, FileUp } from 'lucide-react';
import VariableRolePicker from '../data/VariableRolePicker.jsx';
import Card from '../analysis/AnalysisCard.jsx';
import { SAMPLE_DATASET } from '../../data/multipleRegressionLesson.js';

export default function MultipleRegressionDataSourceCard({
    darkMode, setCalculatorInputMode, calculatorInputMode, onUpload,
    setTableText, tableText, selectedOutcome, setSelectedOutcome,
    numericColumns, selectedPredictors, togglePredictor, selectedDatasetId,
    setSelectedDatasetId, datasets, savedDataset, onOpenDataManager,
    savedRoleSelection, setSavedRoleSelection, confidenceLevel, setConfidenceLevel,
}) {
    return (
        <Card darkMode={darkMode}>
            <div className="flex items-center gap-3 mb-4">
                <Database size={18} className={darkMode ? 'text-sky-300' : 'text-sky-700'} />
                <h3 className={`text-lg font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                    Data workspace
                </h3>
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
                    <div className="flex flex-wrap gap-3">
                        <label className={`inline-flex items-center gap-2 px-4 py-3 rounded-xl cursor-pointer font-bold text-sm border ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200 hover:border-slate-700' : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'}`}>
                            <FileUp size={16} />
                            Upload CSV
                            <input type="file" accept=".csv,.tsv,.txt" className="hidden" onChange={onUpload} />
                        </label>
                        <button
                            onClick={() => setTableText(SAMPLE_DATASET)}
                            className={`px-4 py-3 rounded-xl font-bold text-sm border ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200 hover:border-slate-700' : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'}`}
                        >
                            Load Sample Dataset
                        </button>
                    </div>

                    <label className="block mt-5">
                        <span className={`text-[11px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                            Paste CSV / Table Data
                        </span>
                        <textarea
                            value={tableText}
                            onChange={(event) => setTableText(event.target.value)}
                            rows={12}
                            className={`mt-2 w-full rounded-2xl border px-4 py-3 text-sm font-medium outline-none resize-y transition-colors ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200 focus:border-indigo-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500'}`}
                        />
                    </label>

                    <label className="block">
                        <span className={`text-[11px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                            Outcome Variable (Y)
                        </span>
                        <select value={selectedOutcome} onChange={(event) => setSelectedOutcome(event.target.value)} className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm font-bold outline-none transition-colors ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200 focus:border-indigo-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500'}`}>
                            {numericColumns.map((column) => (
                                <option key={column.name} value={column.name}>{column.name}</option>
                            ))}
                        </select>
                    </label>

                    <div>
                        <div className={`text-[11px] font-black uppercase tracking-widest mb-3 ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                            Predictor Variables (Select 2+)
                        </div>
                        <div className="space-y-2">
                            {numericColumns.filter((column) => column.name !== selectedOutcome).map((column) => (
                                <label key={column.name} className={`flex items-center gap-3 rounded-xl border px-4 py-3 cursor-pointer ${selectedPredictors.includes(column.name) ? (darkMode ? 'bg-indigo-500/10 border-indigo-500/30 text-white' : 'bg-indigo-50 border-indigo-200 text-slate-900') : (darkMode ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700')}`}>
                                    <input
                                        type="checkbox"
                                        checked={selectedPredictors.includes(column.name)}
                                        onChange={() => togglePredictor(column.name)}
                                        className="rounded border-slate-400"
                                    />
                                    <span className="font-bold text-sm">{column.name}</span>
                                </label>
                            ))}
                        </div>
                        <p className={`mt-3 text-sm ${darkMode ? 'text-slate-500' : 'text-slate-600'}`}>
                            This fast lane keeps the existing quick-entry workflow intact for sample data and pasted tables.
                        </p>
                    </div>
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
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <div className={`text-[10px] font-black uppercase tracking-widest mb-1 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
                                        Dataset snapshot
                                    </div>
                                    <p className={`text-sm font-bold ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                                        {savedDataset.rowCount} rows • {savedDataset.columnCount} variables
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => onOpenDataManager?.()}
                                    className={`rounded-lg border px-3 py-2 text-[11px] font-black uppercase tracking-widest ${darkMode ? 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white' : 'bg-white border-slate-200 text-slate-700 hover:text-slate-900'}`}
                                >
                                    Open Data Manager
                                </button>
                            </div>
                        </div>
                    )}

                    <VariableRolePicker
                        darkMode={darkMode}
                        dataset={savedDataset}
                        selection={savedRoleSelection}
                        onChange={setSavedRoleSelection}
                        emptyMessage="Save a dataset in Data Manager first, then come back here to map the outcome and predictors."
                        roles={[
                            {
                                id: 'outcome',
                                label: 'Outcome Variable (Y)',
                                selection: 'single',
                                allowedTypes: ['numeric'],
                                placeholder: 'Select numeric outcome',
                                emptyOptionsText: 'This dataset does not currently have any numeric variables for the outcome role.',
                            },
                            {
                                id: 'predictors',
                                label: 'Predictor Variables (Select 2+)',
                                selection: 'multiple',
                                allowedTypes: ['numeric'],
                                excludeRoleIds: ['outcome'],
                                helperText: 'Only numeric variables are shown for the current multiple-regression workflow.',
                                emptyOptionsText: 'This dataset needs more numeric variables before it can drive the current multiple-regression calculator.',
                            },
                        ]}
                    />

                    {savedDataset && (
                        <p className={`text-sm ${darkMode ? 'text-slate-500' : 'text-slate-600'}`}>
                            Data preparation lives in the Data Manager. This calculator only maps variables and runs the existing regression engine.
                        </p>
                    )}
                </div>
            )}

            <label className="block">
                <span className={`text-[11px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                    Confidence Level
                </span>
                <input
                    type="number"
                    min={0.8}
                    max={0.99}
                    step={0.01}
                    value={confidenceLevel}
                    onChange={(event) => {
                        const numeric = Number(event.target.value);
                        if (numeric >= 0.8 && numeric < 1) {
                            setConfidenceLevel(numeric);
                        }
                    }}
                    className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm font-bold outline-none transition-colors ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200 focus:border-indigo-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500'}`}
                />
            </label>
        </Card>
    );
}
