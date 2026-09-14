import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

export default function TutorExplanationModal({ darkMode, explanation, onClose }) {
    const dialog = useRef(null), title = useId();
    useEffect(() => {
        const node = dialog.current, previous = document.activeElement;
        const roots = [document.documentElement, document.body];
        const overflow = roots.map(root => root.style.overflow);
        roots.forEach(root => { root.style.overflow = 'hidden'; });
        if (node.showModal) node.showModal(); else node.setAttribute('open', '');
        return () => { node.close?.(); roots.forEach((root, index) => { root.style.overflow = overflow[index]; }); previous?.focus?.(); };
    }, []);
    return createPortal(<dialog ref={dialog} aria-labelledby={title} onCancel={event => { event.preventDefault(); onClose(); }} className={`m-auto w-[calc(100%_-_2rem)] max-w-lg max-h-[90vh] rounded-2xl border p-5 shadow-2xl backdrop:bg-slate-950/80 ${darkMode ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-white border-slate-300 text-slate-800'}`}>
        <div className="mb-4 flex items-center justify-between gap-3"><h3 id={title} className="text-lg font-bold">{explanation.title}</h3><button type="button" aria-label="Close explanation" onClick={onClose} className="rounded-lg border p-2"><X size={18} /></button></div>
        <div className="max-h-[60vh] overflow-y-auto space-y-4 text-sm [overflow-wrap:anywhere]"><p>{explanation.body}</p>{explanation.content}</div>
        <button type="button" onClick={onClose} className="mt-5 w-full rounded-lg border p-3 text-sm font-semibold">Close</button>
    </dialog>, document.body);
}
