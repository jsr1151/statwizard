export default function AnalysisExclusionReview({ review, ready, darkMode }) {
    if (!review) return null;
    return <section aria-label="Saved data row review" className={`rounded-xl border p-4 space-y-3 text-sm ${darkMode ? 'border-slate-700 bg-slate-900 text-slate-200' : 'border-slate-300 bg-white text-slate-800'}`}>
        <p><strong>{review.usable} of {review.total} rows have all required values; {review.dropped} excluded.</strong></p>
        {!ready && <p>Complete rows are counted here, but the calculator is unavailable until the setup issues above are resolved.</p>}
        {review.dropped > 0 && <details>
            <summary className="font-semibold cursor-pointer">Review excluded rows ({review.dropped})</summary>
            <p className="mt-3">Row numbers refer to the current saved dataset, starting at 1 without a header. Correct these values in Data Manager or choose different variables.</p>
            <ul className="mt-3 space-y-2 list-disc pl-5 break-words">
                {review.excluded.map(item => <li key={item.row}>Data row {item.row}: {item.reasons.map(({ variable, reason }) => `${variable} — ${reason}`).join('; ')}</li>)}
            </ul>
            {review.dropped > review.excluded.length && <p className="mt-3">Showing the first {review.excluded.length} of {review.dropped} excluded rows.</p>}
        </details>}
        <p>These counts describe the saved data used to initialize the calculator. Manual calculator edits do not change this dataset review.</p>
    </section>;
}
