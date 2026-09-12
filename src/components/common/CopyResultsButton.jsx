import { useEffect, useRef, useState } from 'react';

export default function CopyResultsButton({ text, label = 'Copy summary', darkMode }) {
    const [status, setStatus] = useState('');
    const request = useRef(0);
    useEffect(() => { request.current += 1; setStatus(''); return () => { request.current += 1; }; }, [text]);
    const copy = async () => {
        const token = ++request.current;
        setStatus('Copying…');
        try {
            if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
            await navigator.clipboard.writeText(text);
            if (request.current === token) setStatus('Copied.');
        } catch {
            if (request.current === token) setStatus('Copy unavailable. Select and copy the text below.');
        }
    };
    return <div className="space-y-2 min-w-0">
        <button onClick={copy} className="px-3 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold">{label}</button>
        <p role="status" className={`text-sm ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>{status}</p>
        {status.startsWith('Copy unavailable') && <label className="block text-sm font-semibold">Summary text
            <textarea readOnly value={text} onFocus={event => event.target.select()} rows={5} className={`mt-2 w-full rounded-lg border p-3 text-sm ${darkMode ? 'bg-slate-950 border-slate-700 text-slate-200' : 'bg-white border-slate-300 text-slate-900'}`} />
        </label>}
    </div>;
}
