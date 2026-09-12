import { useEffect, useId, useRef, useState } from 'react';

export default function UnsavedWorkspaceDialog({ action, darkMode, onSave, onResolve }) {
    const dialog = useRef(null);
    const title = useId();
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    useEffect(() => {
        const previouslyFocused = document.activeElement;
        const element = dialog.current;
        element.showModal();
        return () => { element.close(); previouslyFocused?.isConnected && previouslyFocused.focus(); };
    }, []);
    const save = async () => {
        setSaving(true);
        try {
            const saved = await onSave();
            if (saved) onResolve(true);
            else setError('Saving failed. Your workspace is still open. Try saving again or cancel.');
        } catch {
            setError('Saving failed. Your workspace is still open. Try saving again or cancel.');
        } finally { setSaving(false); }
    };
    return (
        <dialog ref={dialog} aria-labelledby={title} onCancel={event => { event.preventDefault(); if (!saving) onResolve(false); }} className={`m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-lg overflow-auto rounded-2xl border p-6 shadow-xl backdrop:bg-slate-950/70 ${darkMode ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-white border-slate-200 text-slate-800'}`}>
            <h2 id={title} className="text-xl font-bold">Save your workspace first?</h2>
            <p className="my-4">{action} will replace your unsaved workspace. Save your changes, discard them, or cancel to keep editing.</p>
            {error && <p role="alert" className="mb-4">{error}</p>}
            <div className="flex flex-wrap gap-3">
                <button type="button" disabled={saving} onClick={save} className="rounded-xl bg-indigo-600 px-4 py-3 font-bold text-white disabled:opacity-60">{saving ? 'Saving…' : 'Save and continue'}</button>
                <button type="button" disabled={saving} onClick={() => onResolve(true)} className="rounded-xl border px-4 py-3 font-bold">Discard changes</button>
                <button type="button" autoFocus disabled={saving} onClick={() => onResolve(false)} className="rounded-xl border px-4 py-3 font-bold">Cancel</button>
            </div>
        </dialog>
    );
}
