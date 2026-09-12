import { useRef } from 'react';

export default function TableDataSourceFields({
    darkMode, calculatorInputMode = 'paste', setCalculatorInputMode,
    tableText, setTableText, tableSource, loadExample, onUpload, uploadError, uploadPending,
    datasets = [], selectedDatasetId = '', setSelectedDatasetId, savedDataset,
    onOpenDataManager, onGoResults, hasResults, sampleLabel = 'Load example data',
}) {
    const upload = useRef(null);
    const button = `rounded-xl border px-3 py-2 text-sm font-bold ${darkMode ? 'border-slate-700 text-slate-200' : 'border-slate-300 text-slate-800'}`;
    const field = `mt-2 w-full min-w-0 rounded-xl border p-3 text-sm ${darkMode ? 'bg-slate-950 border-slate-700 text-slate-200' : 'bg-white border-slate-300 text-slate-900'}`;
    return <section aria-label="Calculator data source" className="space-y-4">
        <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>Choose your data source</h3>
        {setCalculatorInputMode && <div className="flex flex-wrap gap-2">
            {[['paste', 'Paste / Upload'], ['saved', 'Saved Dataset']].map(([id, label]) => <button type="button" key={id} aria-pressed={calculatorInputMode === id} onClick={() => setCalculatorInputMode(id)} className={`${button} ${calculatorInputMode === id ? (darkMode ? 'bg-indigo-950 border-indigo-400' : 'bg-indigo-50 border-indigo-600') : ''}`}>{label}</button>)}
        </div>}
        {onOpenDataManager && <button type="button" onClick={onOpenDataManager} className={button}>Import / manage data</button>}
        {calculatorInputMode === 'paste' ? <>
            <p className={`break-words text-sm ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}><strong>Active source: {tableSource}.</strong> {tableSource === 'Example data' ? 'Replace the example to analyze your own data.' : 'Results use the current table below.'}</p>
            <div className="flex flex-wrap gap-2">
                <button type="button" className={button} onClick={() => upload.current?.click()}>Upload CSV</button>
                <input ref={upload} type="file" accept=".csv,.tsv,.txt" className="hidden" aria-label="Upload data table" onChange={onUpload} />
                <button type="button" className={button} onClick={loadExample}>{sampleLabel}</button>
            </div>
            <label className="block text-sm font-bold">Paste CSV / Table Data
                <textarea value={tableText} onChange={event => setTableText(event.target.value)} rows={7} className={`${field} font-mono resize-y`} />
            </label>
            <p className={`text-sm ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>Use one observation per row and one variable per column. A header row can name the variables. Results update as you edit.</p>
            {uploadPending && <p role="status" className="text-sm">Reading {uploadPending}. Current results still use {tableSource.toLowerCase()}.</p>}
            {uploadError && <p role="alert" className={`rounded-xl p-3 text-sm ${darkMode ? 'bg-rose-950 text-rose-200' : 'bg-rose-50 text-rose-800'}`}>{uploadError}</p>}
        </> : <>
            <label className="block text-sm font-bold">Saved Dataset
                <select value={selectedDatasetId} disabled={!datasets.length} onChange={event => setSelectedDatasetId(event.target.value)} className={field}>
                    {!savedDataset && <option value={selectedDatasetId}>{datasets.length ? 'Choose a saved dataset' : 'No saved datasets yet'}</option>}
                    {datasets.map(dataset => <option key={dataset.id} value={dataset.id}>{dataset.name}</option>)}
                </select>
            </label>
            <p className={`break-words text-sm ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>{savedDataset ? `Active source: ${savedDataset.name}. ${savedDataset.rowCount} rows, ${savedDataset.columnCount} variables. Confirm the variable roles below.` : 'Save a dataset in Data Manager first, or select an available dataset.'}</p>
            <p className={`text-sm ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>Saved datasets stay in this browser on this device. Switching back to Paste / Upload restores your current table.</p>
        </>}
        {hasResults && <button type="button" onClick={onGoResults} className={button}>Go to results</button>}
    </section>;
}
