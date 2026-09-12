import { useRef, useState } from 'react';

const MESSAGES = {
    new: 'Draft recovery: edits will be saved in this browser when storage is available.',
    launched: 'Opened your Data Manager selection with default settings. Your next edit will replace the previous calculator draft.',
    restored: 'Recovered your calculator draft. Review the data and settings before interpreting results.',
    saved: 'Calculator draft saved in this browser.',
    unsaved: 'Could not save this draft. The last saved draft is unchanged; copy your current data and settings before leaving.',
    'too-large': 'This draft exceeds the 250,000-character limit. The last saved draft is unchanged; copy your current data and settings before leaving.',
    cleared: 'Saved draft removed. Your current analysis remains open; future edits will save a new draft.',
    'remove-failed': 'Could not remove this draft. Try again when browser storage is available.',
};

export default function CalculatorDraftNotice({ draft, darkMode }) {
    const [confirm, setConfirm] = useState(false);
    const button = useRef(null);
    const cancel = () => { setConfirm(false); button.current?.focus(); };
    return <div className={`rounded-xl border p-3 space-y-2 text-sm ${darkMode ? 'bg-slate-950 border-slate-700 text-slate-300' : 'bg-slate-50 border-slate-300 text-slate-700'}`}>
        <p role="status">{MESSAGES[draft.status]}</p>
        <details className="space-y-2">
            <summary className="cursor-pointer font-semibold">What is saved?</summary>
            <p>Recovery includes the entered or uploaded table, data source, variable choices, confidence level, prediction input, and line and interval display settings. Saved datasets use the current version in your library. Lesson, power, effect-size, and highlighted-point choices are not saved.</p>
            <p>Drafts stay in this browser and are removed when site data is cleared.</p>
        </details>
        <button ref={button} aria-expanded={confirm} className="underline font-semibold" onClick={() => setConfirm(!confirm)}>Remove saved calculator draft</button>
        {confirm && <div className="space-y-2">
            <p>Remove this calculator's saved draft? Your current analysis will remain open.</p>
            <div className="flex flex-wrap gap-3">
                <button className="rounded-lg px-3 py-2 bg-indigo-600 text-white font-semibold" onClick={() => { if (draft.clear()) cancel(); }}>Remove draft</button>
                <button className="rounded-lg border px-3 py-2 font-semibold" onClick={cancel}>Keep draft</button>
            </div>
        </div>}
    </div>;
}
