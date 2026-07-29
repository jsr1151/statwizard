import React from 'react';

const AnalysisMetricTile = ({ darkMode, label, value, detail = null, tone = 'default' }) => {
    const toneClass = tone === 'primary'
        ? darkMode ? 'bg-indigo-500/10 border-indigo-500/30' : 'bg-indigo-50 border-indigo-200'
        : tone === 'warning'
            ? darkMode ? 'bg-amber-500/10 border-amber-500/20' : 'bg-amber-50 border-amber-200'
            : darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200';

    return (
        <div className={`rounded-xl border p-4 ${toneClass}`}>
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">{label}</div>
            <div className={`mt-2 text-2xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>{value}</div>
            {detail && <p className={`mt-2 text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>{detail}</p>}
        </div>
    );
};

export default AnalysisMetricTile;
