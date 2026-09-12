import VariableRolePicker from '../data/VariableRolePicker.jsx';

export default function AnalysisDatasetWorkspace({
    darkMode, description, datasets = [], selectedDatasetId = '', onSelectDatasetId,
    dataset, roles = [], roleSelection = {}, onRoleSelectionChange,
    emptyMessage = 'Import or save a dataset in Data Manager to use it here.',
    validationMessages = [], warningMessages = [], summaryItems = [],
}) {
    const muted = darkMode ? 'text-slate-300' : 'text-slate-600';
    return (
        <section aria-label="Saved dataset setup" className={`rounded-2xl border p-4 sm:p-5 space-y-4 ${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
            <label className="block text-sm font-bold">
                Saved dataset
                <select value={selectedDatasetId} disabled={!datasets.length} onChange={event => onSelectDatasetId?.(event.target.value)} className={`mt-2 w-full min-w-0 rounded-xl border p-3 ${darkMode ? 'bg-slate-950 border-slate-700 text-slate-200' : 'bg-white border-slate-300 text-slate-900'}`}>
                    {!dataset && <option value={selectedDatasetId}>{datasets.length ? 'Choose a saved dataset' : 'No saved datasets yet'}</option>}
                    {datasets.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
            </label>
            {dataset ? <>
                <p className={`text-sm ${muted}`}>{description}</p>
                <VariableRolePicker darkMode={darkMode} dataset={dataset} roles={roles} selection={roleSelection} onChange={onRoleSelectionChange} />
                {!!summaryItems.length && <dl className="grid gap-3 sm:grid-cols-3">
                    {summaryItems.map(item => <div key={item.label} className={`min-w-0 rounded-xl p-3 ${darkMode ? 'bg-slate-950' : 'bg-slate-50'}`}>
                        <dt className={`text-sm ${muted}`}>{item.label === 'Dropped rows' ? 'Excluded rows' : item.label}</dt>
                        <dd className="mt-1 break-words text-lg font-bold">{item.value}</dd>
                        {item.detail && <dd className={`mt-1 text-sm ${muted}`}>{item.detail}</dd>}
                    </div>)}
                </dl>}
                {!!validationMessages.length && <div role="status" className={`rounded-xl border p-3 text-sm ${darkMode ? 'bg-rose-950 border-rose-800 text-rose-200' : 'bg-rose-50 border-rose-200 text-rose-800'}`}>
                    {validationMessages.map((message,index) => <p key={index}>{message}</p>)}
                </div>}
                {!!warningMessages.length && <div className={`rounded-xl border p-3 text-sm ${darkMode ? 'bg-amber-950 border-amber-800 text-amber-200' : 'bg-amber-50 border-amber-200 text-amber-900'}`}>
                    {warningMessages.map((message,index) => <p key={index}>{message}</p>)}
                </div>}
                <details className={`text-sm ${muted}`}>
                    <summary className="cursor-pointer font-bold">Dataset details and storage</summary>
                    <p className="mt-2 break-words">{dataset.rowCount} rows, {dataset.columnCount} variables. Source: {dataset.originalFileName || dataset.name}.</p>
                    <p className="mt-1">Saved datasets stay in this browser on this device. Use Data Manager to prepare data or export a backup.</p>
                </details>
            </> : <p className={`text-sm ${muted}`}>{emptyMessage}</p>}
        </section>
    );
}
