

const TransformModeButton = ({ darkMode, active, label, onClick }) => (
    <button
        type="button"
        onClick={onClick}
        className={`rounded-xl border px-4 py-3 text-sm font-black transition-colors ${active
            ? (darkMode ? 'bg-indigo-500/10 border-indigo-500/30 text-white' : 'bg-indigo-50 border-indigo-200 text-slate-900')
            : (darkMode ? 'bg-slate-950 border-slate-800 text-slate-300 hover:text-white' : 'bg-white border-slate-200 text-slate-700 hover:text-slate-900')
        }`}
    >
        {label}
    </button>
);

export default TransformModeButton;
