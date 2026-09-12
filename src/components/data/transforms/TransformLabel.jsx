

const TransformLabel = ({ darkMode, children }) => (
    <span className={`text-[11px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
        {children}
    </span>
);

export default TransformLabel;
