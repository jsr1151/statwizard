export default function PairedInputReview({ review, darkMode }) {
    return <section aria-label="Paired row review" className={`rounded-xl border p-3 space-y-2 text-sm ${darkMode ? 'border-slate-700 text-slate-200' : 'border-slate-300 text-slate-800'}`}>
        <p><strong>{review.usable} of {review.total} nonblank rows included; {review.dropped} excluded.</strong> Each included row contributes exactly one matched pair.</p>
        {review.dropped > 0 && <details>
            <summary className="cursor-pointer font-semibold">Review excluded pairs ({review.dropped})</summary>
            <p className="mt-2">Line numbers refer to the original input, including blank lines. Correct both observations on the same line; values are never shifted to fill a gap.</p>
            <ul className="mt-2 list-disc pl-5 space-y-1">{review.excluded.map(item => <li key={item.row}>Line {item.row}: {item.reason}</li>)}</ul>
            {review.dropped > review.excluded.length && <p className="mt-2">Showing the first {review.excluded.length} of {review.dropped} excluded rows.</p>}
        </details>}
    </section>;
}
