export default function DescriptiveDataSummary({ source, count, invalid = [], darkMode }) {
    return <div aria-label="Descriptive data summary" className={`rounded-xl border p-4 space-y-2 text-sm break-words ${darkMode ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-300 text-slate-800'}`}>
        <p><strong>Results source: {source}.</strong> {count} of {count + invalid.length} nonempty entries included; {invalid.length} excluded.</p>
        {invalid.length > 0 && <details>
            <summary className="cursor-pointer font-semibold">Review excluded entries ({invalid.length})</summary>
            <p className="mt-2">These entries are not finite numbers. Correct them above to include them.</p>
            <ul className="mt-2 list-disc pl-5">{invalid.slice(0, 100).map((value, index) => <li key={index}>{value}</li>)}</ul>
            {invalid.length > 100 && <p className="mt-2">Showing the first 100 excluded entries.</p>}
        </details>}
    </div>;
}
