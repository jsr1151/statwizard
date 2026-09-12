

const TransformActionButton = ({ darkMode, children, onClick, primary = false, className = '', disabled = false }) => (
    <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={`rounded-xl px-4 py-3 text-sm font-black uppercase tracking-widest transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${primary
            ? (darkMode ? 'bg-indigo-600 text-white hover:bg-indigo-500' : 'bg-indigo-600 text-white hover:bg-indigo-700')
            : (darkMode ? 'border border-slate-800 bg-slate-900 text-slate-300 hover:text-white' : 'border border-slate-200 bg-white text-slate-700 hover:text-slate-900')
        } ${className}`}
    >
        {children}
    </button>
);

export default TransformActionButton;
