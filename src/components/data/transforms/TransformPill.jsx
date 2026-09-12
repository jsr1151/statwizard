

const TransformPill = ({ darkMode, active = false, children, onClick, className = '' }) => (
    <button
        type="button"
        onClick={onClick}
        className={`rounded-full border px-3 py-2 text-[11px] font-black uppercase tracking-widest transition-colors ${active
            ? (darkMode ? 'bg-indigo-500/10 border-indigo-500/30 text-white' : 'bg-indigo-50 border-indigo-200 text-slate-900')
            : (darkMode ? 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900')
        } ${className}`}
    >
        {children}
    </button>
);

export default TransformPill;
