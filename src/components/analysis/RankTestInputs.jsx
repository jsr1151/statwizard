export default function RankTestInputs({ paired, darkMode, source, setSource, first, setFirst, second, setSecond, datasets, datasetId, setDatasetId, selection, setSelection, onExample, onOpenDataManager }) {
    const dataset = datasets.find(item => item.id === datasetId);
    const inputClass = `mt-2 w-full min-w-0 rounded-xl border p-3 ${darkMode ? 'bg-slate-950 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'}`;
    const roles = paired ? [['first', 'Sample A variable'], ['second', 'Sample B variable']] : [['outcome', 'Numeric or ordered-score outcome'], ['grouping', 'Grouping variable (two levels)']];
    return <div className="space-y-5">
        <div className="flex flex-wrap gap-3">
            <button type="button" aria-pressed={source !== 'saved'} onClick={() => setSource('paste')} className={`rounded-xl border px-4 py-3 font-bold ${source !== 'saved' ? 'bg-indigo-600 text-white' : ''}`}>Enter values</button>
            <button type="button" aria-pressed={source === 'saved'} onClick={() => setSource('saved')} className={`rounded-xl border px-4 py-3 font-bold ${source === 'saved' ? 'bg-indigo-600 text-white' : ''}`}>Saved dataset</button>
            <button type="button" onClick={onExample} className="rounded-xl border px-4 py-3 font-bold">Load worked example</button>
        </div>
        {source === 'saved' ? <>
            <label className="block">Saved dataset
                <select className={inputClass} value={datasetId} onChange={event => setDatasetId(event.target.value)}>
                    <option value="">Select a dataset</option>
                    {datasets.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
            </label>
            <div className="grid gap-4 md:grid-cols-2">{roles.map(([id, label]) => <label key={id} className="block min-w-0">{label}
                <select className={inputClass} value={selection[id] || ''} onChange={event => setSelection({ ...selection, [id]: event.target.value })}>
                    <option value="">Select a variable</option>
                    {(dataset?.columns || []).map(column => <option key={column.id} value={column.id}>{column.label || column.name}</option>)}
                </select>
            </label>)}</div>
            <button type="button" onClick={onOpenDataManager} className="rounded-xl border px-4 py-3 font-bold">Open Data Manager</button>
        </> : <>
            <p>{source === 'example' ? 'Worked example loaded. These are sample data; edit a value to start your own analysis.' : 'Enter your own data. No sample results are calculated automatically.'}</p>
            <p id="rank-input-help">Use one value per line, or separate entries with commas or tabs. Use a decimal point. No headers. Blank cells, NA, N/A, null, and . mean missing. {paired ? 'Entry 1 in A pairs with entry 1 in B, and so on. Preserve every missing position; do not sort samples separately.' : 'The samples may have different lengths. Missing entries are excluded within each group.'}</p>
            <div className="grid gap-4 md:grid-cols-2">
                <label className="block min-w-0">Sample A<textarea aria-describedby="rank-input-help" className={`${inputClass} font-mono`} rows={7} spellCheck={false} value={first} onChange={event => setFirst(event.target.value)} /></label>
                <label className="block min-w-0">Sample B<textarea aria-describedby="rank-input-help" className={`${inputClass} font-mono`} rows={7} spellCheck={false} value={second} onChange={event => setSecond(event.target.value)} /></label>
            </div>
        </>}
        {paired && <p>Use one row per participant in wide format. The calculator assumes A and B are already matched; it cannot infer participant identity from two independent lists.</p>}
    </div>;
}
