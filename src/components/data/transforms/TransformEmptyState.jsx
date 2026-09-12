

const TransformEmptyState = ({ darkMode, children }) => (
    <div className={`rounded-xl border px-4 py-5 text-sm ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
        {children}
    </div>
);

export default TransformEmptyState;
