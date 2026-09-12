export default function DescriptiveInputNotice({ source, darkMode, categorical = false, hasResults, onGoResults }) {
    return <div className={`mt-5 space-y-2 text-sm ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
        <p><strong>Active source: {source}.</strong> {source.startsWith('Example:') ? 'Replace the example with your own observations.' : 'Results use the current values below.'}</p>
        <p>Enter a single variable without a header. Blank separators are ignored and do not count as observations.
            {categorical ? ' Labels such as NA count as categories. Use commas, semicolons, or new lines to keep spaces inside labels; a space-only list is split into separate words.' : ' Non-numeric entries are excluded and listed with the results. Use a period for decimals; commas separate observations.'}</p>
        {hasResults && <button onClick={onGoResults} className={`rounded-lg border px-3 py-2 font-semibold ${darkMode ? 'border-slate-600' : 'border-slate-300'}`}>Go to results</button>}
    </div>;
}
