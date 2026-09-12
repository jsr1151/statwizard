import TableDataSourceFields from '../analysis/TableDataSourceFields.jsx';
import VariableRolePicker from '../data/VariableRolePicker.jsx';
import Card from '../analysis/AnalysisCard.jsx';


export default function MultipleRegressionDataSourceCard({
    tableSource, loadExample, uploadError, uploadPending, onGoResults, hasResults,
    darkMode, setCalculatorInputMode, calculatorInputMode, onUpload,
    setTableText, tableText, selectedOutcome, setSelectedOutcome,
    numericColumns, selectedPredictors, togglePredictor, selectedDatasetId,
    setSelectedDatasetId, datasets, savedDataset, onOpenDataManager,
    savedRoleSelection, setSavedRoleSelection, confidenceLevel, setConfidenceLevel, resetVariableChoices,
}) {
    return (
        <Card darkMode={darkMode}>
            <TableDataSourceFields {...{darkMode, calculatorInputMode, setCalculatorInputMode, tableText, setTableText, tableSource, loadExample, onUpload, uploadError, uploadPending, datasets, selectedDatasetId, setSelectedDatasetId, savedDataset, onOpenDataManager, onGoResults, hasResults}} sampleLabel="Load example data" />
            {calculatorInputMode === 'paste' ? (
                <>
                    <label className="block">
                        <span className={`text-[11px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                            Outcome Variable (Y)
                        </span>
                        <select value={selectedOutcome} onChange={(event) => setSelectedOutcome(event.target.value)} className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm font-bold outline-none transition-colors ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200 focus:border-indigo-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500'}`}>
                            <option value="">Choose numeric outcome</option>
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
                            Select the predictors you want to include alongside the outcome.
                        </p>
                    </div>
                </>
            ) : (
                <div className="space-y-5">
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
                            Prepare or export a backup of this dataset in Data Manager.
                        </p>
                    )}
                </div>
            )}

            <button type="button" onClick={resetVariableChoices} className={`my-4 rounded-xl border px-3 py-2 text-sm font-bold ${darkMode ? 'border-slate-700 text-slate-200' : 'border-slate-300 text-slate-800'}`}>Reset variable choices</button>
            <p className={`mb-4 text-sm ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>Reset selects the last numeric variable as the outcome and up to three preceding numeric variables as predictors.</p>
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
