export default function RepeatedMeasuresInputs({ darkMode, source, setSource, format, setFormat, text, setText, datasets, datasetId, setDatasetId, selection, setSelection, onExample, onOpenDataManager }) {
    const columns = datasets.find(dataset => dataset.id === datasetId)?.columns || [];
    const field = `mt-2 w-full min-w-0 rounded-xl border p-3 ${darkMode ? 'bg-slate-950 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'}`;
    const roles = format === 'long' ? [['subject', 'Participant ID variable'], ['condition', 'Condition variable'], ['outcome', 'Measurement variable']] : [['subject', 'Participant ID variable']];
    return <div className="space-y-5">
        <div className="flex flex-wrap gap-3">
            <button type="button" aria-pressed={source !== 'saved'} onClick={() => setSource('paste')} className={`rounded-xl border px-4 py-3 font-bold ${source !== 'saved' ? 'bg-indigo-600 text-white' : ''}`}>Enter table</button>
            <button type="button" aria-pressed={source === 'saved'} onClick={() => setSource('saved')} className={`rounded-xl border px-4 py-3 font-bold ${source === 'saved' ? 'bg-indigo-600 text-white' : ''}`}>Saved dataset</button>
            <button type="button" onClick={onExample} className="rounded-xl border px-4 py-3 font-bold">Load worked example</button>
        </div>
        <label className="block">Data layout<select className={field} value={format} onChange={event => setFormat(event.target.value)}><option value="wide">Wide: one row per participant</option><option value="long">Long: one row per participant and condition</option></select></label>
        {source === 'saved' ? <>
            <label className="block">Saved dataset<select className={field} value={datasetId} onChange={event => setDatasetId(event.target.value)}><option value="">Select a dataset</option>{datasets.map(dataset => <option key={dataset.id} value={dataset.id}>{dataset.name}</option>)}</select></label>
            <div className="grid gap-4 md:grid-cols-3">{roles.map(([role, label]) => <label key={role} className="block min-w-0">{label}<select className={field} value={selection[role] || ''} onChange={event => setSelection({ ...selection, [role]: event.target.value, ...(role === 'subject' ? { conditions: (selection.conditions || []).filter(id => id !== event.target.value) } : {}) })}><option value="">Select a variable</option>{columns.map(column => <option key={column.id} value={column.id}>{column.label || column.name}</option>)}</select></label>)}</div>
            {format === 'wide' && <fieldset className="rounded-xl border p-4"><legend className="px-2 font-bold">Condition variables (choose 2–12)</legend>
                <p className="mb-3 text-sm">Choose repeated measurements of the same outcome. Selection order controls the displayed condition order. Do not include participant IDs or between-subject factors.</p>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{columns.filter(column => column.id !== selection.subject).map(column => <label key={column.id} className="flex items-center gap-3"><input type="checkbox" checked={(selection.conditions || []).includes(column.id)} disabled={(selection.conditions || []).length >= 12 && !(selection.conditions || []).includes(column.id)} onChange={event => setSelection({ ...selection, conditions: event.target.checked ? [...(selection.conditions || []), column.id] : selection.conditions.filter(id => id !== column.id) })} />{column.label || column.name}</label>)}</div>
            </fieldset>}
            <button type="button" onClick={onOpenDataManager} className="rounded-xl border px-4 py-3 font-bold">Open Data Manager</button>
        </> : <>
            <p>{source === 'example' ? 'Worked example loaded (sample data).' : 'Enter your own table. No example results are calculated automatically.'}</p>
            <p id="rm-table-help">Include a header row. Separate columns with commas, tabs, or semicolons. {format === 'wide' ? 'The first column is participant ID; every remaining column is a condition.' : 'Use exactly three columns in this order: participant ID, condition, measurement.'} Use NA, N/A, null, . or an empty cell for a missing measurement. IDs and condition labels must be present.</p>
            <label className="block">Repeated-measures table<textarea rows={9} className={`${field} font-mono text-sm`} aria-describedby="rm-table-help" spellCheck={false} value={text} onChange={event => setText(event.target.value)} /></label>
        </>}
        <p className="text-sm">Participant IDs are required. Duplicate {format === 'wide' ? 'participant rows' : 'participant–condition cells'} are rejected; replicate trials are not averaged automatically. Only one within-subject factor is modeled.</p>
    </div>;
}
