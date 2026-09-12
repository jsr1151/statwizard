

const DatasetInfoRow = ({ darkMode, label, value }) => (
    <div className={`rounded-xl border px-4 py-3 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
        <div className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
            {label}
        </div>
        <div className={`mt-2 text-sm font-bold ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
            {value}
        </div>
    </div>
);

export default DatasetInfoRow;
