export default function PairedLessonInputs({ value, patch, swap, darkMode }) {
    const field = `mt-2 w-full min-w-0 rounded-xl border p-3 ${darkMode ? 'bg-slate-950 border-slate-700 text-slate-200' : 'bg-white border-slate-300 text-slate-900'}`;
    const button = 'rounded-lg border px-3 py-2 text-sm font-semibold';
    const summary = value.inputMode === 'summary';
    return <section aria-label="Paired lesson inputs" className="space-y-4">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Lesson data source">
            {[['summary','Summary example'],['raw','Example pairs']].map(([id,label]) => <button key={id} aria-pressed={value.inputMode === id} className={`${button} ${value.inputMode === id ? 'bg-indigo-600 text-white' : ''}`} onClick={() => patch({ inputMode: id })}>{label}</button>)}
            <button className={button} onClick={swap}>Swap conditions</button>
        </div>
        <p className="text-sm">The comparison is Condition 1 minus Condition 2. Swapping changes the comparison order; the selected alternative stays the same.</p>
        {summary ? <div className="space-y-3">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{[['mean1','Condition 1 mean'],['sd1','Condition 1 standard deviation'],['mean2','Condition 2 mean'],['sd2','Condition 2 standard deviation'],['n','Number of pairs'],['r','Correlation between paired measurements']].map(([key,label]) => <label key={key} className="text-sm font-semibold">{label}<input aria-label={label} type="number" step={key === 'n' ? 1 : 'any'} value={value.summary[key]} onChange={event => patch({ summary: { ...value.summary, [key]: event.target.value, source: 'Lesson summary inputs' } })} className={field} /></label>)}</div>
            <p className="text-sm">Use the same complete pairs for both means and SDs. Their correlation determines the SD of differences. Individual observations cannot be reconstructed from summaries.</p>
        </div> : <label className="block text-sm font-semibold">Example paired observations<textarea aria-label="Lesson example pairs" readOnly value={value.raw.text} rows={5} className={`${field} font-mono`} /><span className="mt-2 block font-normal">Each row is one complete pair in comparison order. Use the Calculator tab to enter your own paired observations.</span></label>}
        <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-semibold">Significance level<select aria-label="Significance level" value={value.alpha} onChange={event => patch({ alpha: Number(event.target.value) })} className={field}>{[.1,.05,.01].map(alpha => <option key={alpha} value={alpha}>{alpha}</option>)}</select></label>
            <label className="text-sm font-semibold">Alternative hypothesis<select aria-label="Alternative hypothesis" value={value.tails === 2 ? 'two-sided' : value.direction} onChange={event => patch(event.target.value === 'two-sided' ? { tails: 2 } : { tails: 1, direction: event.target.value })} className={field}><option value="two-sided">Condition means differ</option><option value="less">Condition 1 mean is less</option><option value="greater">Condition 1 mean is greater</option></select></label>
            <label className="text-sm font-semibold">Confidence interval type<select aria-label="Confidence interval type" value={value.ciType} onChange={event => patch({ ciType: event.target.value })} className={field}><option value="two-sided">Two-sided interval</option><option value="one-sided">One-sided bound</option></select></label>
            {value.ciType === 'one-sided' && value.tails === 2 && <label className="text-sm font-semibold">One-sided bound<select aria-label="One-sided bound" value={value.direction} onChange={event => patch({ direction: event.target.value })} className={field}><option value="greater">Lower confidence bound</option><option value="less">Upper confidence bound</option></select></label>}
        </div>
        {value.ciType === 'one-sided' && value.tails === 1 && <p className="text-sm">The interval gives a {value.direction === 'greater' ? 'lower' : 'upper'} bound, matching the directional alternative.</p>}
    </section>;
}
