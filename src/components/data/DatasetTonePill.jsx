

const DatasetTonePill = ({ darkMode, children, tone = 'default' }) => {
    const toneClass = tone === 'warning'
        ? (darkMode ? 'bg-amber-500/10 text-amber-200 border-amber-500/20' : 'bg-amber-50 text-amber-700 border-amber-200')
        : tone === 'primary'
            ? (darkMode ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20' : 'bg-indigo-50 text-indigo-700 border-indigo-200')
            : (darkMode ? 'bg-slate-950 text-slate-400 border-slate-800' : 'bg-slate-50 text-slate-600 border-slate-200');

    return (
        <span className={`inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-widest ${toneClass}`}>
            {children}
        </span>
    );
};

export default DatasetTonePill;
