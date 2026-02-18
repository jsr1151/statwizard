import React from 'react';
import { Maximize2, Minimize2, Trash2 } from 'lucide-react';

const AnovaDatasetEditor = ({
    groups,
    updateGroup,
    updateGroupStats,
    parseRaw,
    removeGroup,
    darkMode
}) => {
    return (
        <div className="flex flex-wrap gap-4 justify-center lg:justify-start transition-opacity">
            {groups.map(g => {
                const n = g.inputMode === 'summary' ? (parseInt(g.summary?.n) || 0) : (g.values?.length || 0);
                const isValid = n >= 2;

                return (
                    <div key={g.id} className={`min-w-[280px] flex-1 max-w-[360px] p-3 rounded-[1.2rem] border-2 transition-all relative group ${darkMode ? 'bg-slate-900 border-slate-800 shadow-xl' : 'bg-white border-slate-100 shadow-lg'}`}>
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="w-3 h-3 rounded-full shadow-[0_0_10px_rgba(0,0,0,0.5)]" style={{ backgroundColor: g.color }} />
                                <input
                                    value={g.label}
                                    onChange={e => updateGroup(g.id, 'label', e.target.value)}
                                    className={`text-[12px] font-black uppercase tracking-widest bg-transparent border-none focus:outline-none w-32 ${darkMode ? 'text-white' : 'text-slate-800'}`}
                                />
                                <div className="flex items-center gap-2">
                                    <span className={`text-[9px] font-bold uppercase tabular-nums tracking-tight px-2 py-0.5 rounded-md ${isValid ? (darkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500') : 'bg-rose-500/10 text-rose-500'}`}>
                                        {isValid ? (
                                            <span className="flex items-center gap-2">
                                                <span>N={n}</span>
                                                <span className="opacity-30">|</span>
                                                <span>M={parseFloat(g.summary.mean).toFixed(2)}</span>
                                                <span className="opacity-30">|</span>
                                                <span>SD={parseFloat(g.summary.sd).toFixed(2)}</span>
                                            </span>
                                        ) : (
                                            <span>{n} Obs (Needs ≥2)</span>
                                        )}
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => updateGroup(g.id, 'collapsed', !g.collapsed)}
                                    className="text-slate-500 hover:text-indigo-500 transition-colors bg-slate-800/10 p-1.5 rounded-lg"
                                >
                                    {g.collapsed ? <Maximize2 size={12} /> : <Minimize2 size={12} />}
                                </button>
                                {groups.length > 2 && (
                                    <button onClick={() => removeGroup(g.id)} className="text-slate-500 hover:text-rose-500 transition-colors bg-slate-800/10 p-1.5 rounded-lg">
                                        <Trash2 size={12} />
                                    </button>
                                )}
                            </div>
                        </div>

                        {!g.collapsed && (
                            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                <div className="flex gap-2 my-4 p-1 bg-slate-800/20 rounded-xl w-fit">
                                    <button
                                        onClick={() => updateGroup(g.id, 'inputMode', 'raw')}
                                        className={`text-[9px] font-black uppercase tracking-widest px-4 py-2 rounded-lg transition-all ${g.inputMode === 'raw' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        Raw Data
                                    </button>
                                    <button
                                        onClick={() => updateGroup(g.id, 'inputMode', 'summary')}
                                        className={`text-[9px] font-black uppercase tracking-widest px-4 py-2 rounded-lg transition-all ${g.inputMode === 'summary' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        Summary Stats
                                    </button>
                                </div>

                                {g.inputMode === 'summary' ? (
                                    <div className="flex flex-col gap-2 px-1">
                                        {['mean', 'sd', 'n'].map(field => (
                                            <div key={field} className={`group flex flex-col gap-0.5 p-2 rounded-xl border-2 transition-all ${darkMode ? 'bg-slate-900 border-slate-800 focus-within:border-indigo-500' : 'bg-white border-slate-100 focus-within:border-indigo-600'}`}>
                                                <label className={`text-[7px] font-black uppercase tracking-[0.2em] ml-1 ${darkMode ? 'text-slate-500 group-focus-within:text-indigo-400' : 'text-slate-400 group-focus-within:text-indigo-600'}`}>{field}</label>
                                                <input
                                                    type="text"
                                                    value={g.summary[field]}
                                                    onFocus={(e) => e.target.select()}
                                                    onChange={e => updateGroupStats(g.id, field, e.target.value)}
                                                    className={`w-full bg-transparent text-[16px] font-black outline-none px-1 ${darkMode ? 'text-indigo-300' : 'text-indigo-600'}`}
                                                    placeholder="0.00"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="relative mt-4">
                                        <textarea
                                            placeholder="Enter numbers (5, 8, 12...)"
                                            value={g.values?.join(', ')}
                                            onChange={e => parseRaw(g.id, e.target.value)}
                                            className={`w-full h-24 p-3 rounded-xl text-[11px] font-mono border-2 transition-all outline-none resize-none ${darkMode ? 'bg-slate-950 border-slate-800 text-indigo-400 focus:border-indigo-500 custom-scrollbar' : 'bg-slate-50 border-slate-200 text-indigo-700 focus:border-indigo-600'}`}
                                        />
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default AnovaDatasetEditor;
