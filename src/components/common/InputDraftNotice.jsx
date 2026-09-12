import { useRef, useState } from 'react';

const MESSAGES = {
    new: 'Input recovery: edits will be saved in this browser when storage is available.',
    restored: 'Recovered your saved input draft. Check the values before interpreting the results.',
    saved: 'Input draft saved in this browser.',
    unsaved: 'Input draft could not be saved. The last saved draft is unchanged; copy your current values before leaving.',
    'too-large': 'This input exceeds the 250,000-character draft limit. The last saved draft is unchanged; copy your current values before leaving.',
    cleared: 'Saved input draft removed. Current values remain open; future edits will save a new draft.',
    'remove-failed': 'The saved input draft could not be removed. Browser storage is unavailable. Try again when storage is available.',
};

export default function InputDraftNotice({ draft, darkMode }) {
    const [confirm, setConfirm] = useState(false);
    const button = useRef(null);
    if (!draft) return null;
    const cancel = () => { setConfirm(false); button.current?.focus(); };
    return <div className={`rounded-xl border p-3 space-y-2 text-sm ${darkMode ? 'bg-slate-950 border-slate-700 text-slate-300' : 'bg-slate-50 border-slate-300 text-slate-700'}`}>
        <p role="status">{MESSAGES[draft.status]}</p>
        <p>Recovery saves this calculator’s input and source label, including invalid entries. Display settings are not saved. Drafts stay on this device and are removed when site data is cleared.</p>
        <button ref={button} aria-expanded={confirm} className="underline font-semibold" onClick={() => setConfirm(!confirm)}>Remove saved input draft</button>
        {confirm && <div className="space-y-2">
            <p>Remove the saved input draft for this calculator? Current values will remain open.</p>
            <div className="flex flex-wrap gap-3">
                <button className="rounded-lg px-3 py-2 bg-indigo-600 text-white font-semibold" onClick={() => { if (draft.clear()) cancel(); }}>Remove draft</button>
                <button className="rounded-lg border px-3 py-2 font-semibold" onClick={cancel}>Keep draft</button>
            </div>
        </div>}
    </div>;
}
