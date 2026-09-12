

const TransformPanel = ({ darkMode, children, className = '' }) => (
    <div className={`rounded-2xl border p-4 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'} ${className}`}>
        {children}
    </div>
);

export default TransformPanel;
