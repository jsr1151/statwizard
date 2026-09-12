export default function AnalysisRowSummary({ darkMode, sourceLabel, summary }) {
    return <section aria-label="Analysis data summary" className={`rounded-xl border p-4 text-sm ${darkMode ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-white border-slate-300 text-slate-800'}`}>
        <p className="break-words"><strong>Analysis source:</strong> {sourceLabel}</p>
        {summary && <>
            <p className="mt-2">{summary.usable} of {summary.total} rows are usable; {summary.dropped} excluded because a selected value is missing or nonnumeric.</p>
            {summary.dropped > 0 && <details className="mt-2">
                <summary className="cursor-pointer font-bold">Review excluded rows</summary>
                <p className="mt-2">Data row numbers start at 1, excluding the header and blank lines in entered tables. A row is excluded if any selected variable is unusable; values stay matched within their original rows.</p>
                <ul className="mt-2 space-y-1">{summary.excluded.map(item => <li key={item.row}>Data row {item.row}: {item.variables.join(', ')}</li>)}</ul>
                {summary.dropped > summary.excluded.length && <p className="mt-2">Showing the first {summary.excluded.length} of {summary.dropped} excluded rows.</p>}
            </details>}
        </>}
    </section>;
}
