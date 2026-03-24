import React from 'react';
import { Maximize2, Minimize2, Trash2 } from 'lucide-react';

const AncovaDatasetEditor = ({
    covariateName,
    setCovariateName,
    covariateNameLocked = false,
    groups,
    updateGroup,
    parseRaw,
    removeGroup,
    darkMode
}) => {
    return (
        <div className="flex flex-col gap-6 w-full">
            <div className={`p-4 rounded-xl border-2 transition-colors ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <h3 className={`text-sm font-bold uppercase tracking-wider mb-2 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>Covariate Setup</h3>
                <p className={`text-xs mb-3 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>A covariate is a continuous variable used to adjust group means. Enter X (Covariate) and Y (Outcome) for each participant.</p>
                <div className="flex items-center gap-3">
                    <label className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Covariate Name</label>
                    {covariateNameLocked ? (
                        <div className={`px-3 py-1.5 rounded-lg text-sm font-bold border ${darkMode ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-800'}`}>
                            {covariateName}
                        </div>
                    ) : (
                        <input
                            value={covariateName}
                            onChange={(e) => setCovariateName(e.target.value)}
                            placeholder="e.g. Baseline Stress"
                            className={`px-3 py-1.5 rounded-lg text-sm font-bold border outline-none transition-colors ${darkMode ? 'bg-slate-950 border-slate-700 text-white focus:border-indigo-500' : 'bg-slate-50 border-slate-300 text-slate-800 focus:border-indigo-500'}`}
                        />
                    )}
                    {covariateNameLocked && (
                        <span className={`text-[9px] font-black uppercase tracking-widest ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
                            Mapped From Dataset
                        </span>
                    )}
                </div>
            </div>

            <div className="flex flex-wrap gap-4 justify-center lg:justify-start transition-opacity">
                {groups.map(g => {
                    const nX = g.xValues?.length || 0;
                    const nY = g.yValues?.length || 0;
                    const isValid = nX >= 2 && nY >= 2 && nX === nY;

                    const mX = nX > 0 ? g.xValues.reduce((a, b) => a + b, 0) / nX : 0;
                    const sdX = nX > 1 ? Math.sqrt(g.xValues.reduce((a, b) => a + Math.pow(b - mX, 2), 0) / (nX - 1)) : 0;

                    const mY = nY > 0 ? g.yValues.reduce((a, b) => a + b, 0) / nY : 0;
                    const sdY = nY > 1 ? Math.sqrt(g.yValues.reduce((a, b) => a + Math.pow(b - mY, 2), 0) / (nY - 1)) : 0;

                    // Calculate correlation if valid
                    let r = 0;
                    if (isValid && sdX > 0 && sdY > 0) {
                        let cross = 0;
                        for (let i = 0; i < nX; i++) {
                            cross += (g.xValues[i] - mX) * (g.yValues[i] - mY);
                        }
                        r = cross / ((nX - 1) * sdX * sdY);
                    }

                    return (
                        <div key={g.id} className={`min-w-[320px] flex-1 max-w-[400px] p-3 rounded-[1.2rem] border-2 transition-all relative group ${darkMode ? 'bg-slate-900 border-slate-800 shadow-xl' : 'bg-white border-slate-100 shadow-lg'}`}>
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex flex-col gap-1 w-full">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full shadow-[0_0_10px_rgba(0,0,0,0.5)] flex-shrink-0" style={{ backgroundColor: g.color }} />
                                        <input
                                            value={g.label}
                                            onChange={e => updateGroup(g.id, 'label', e.target.value)}
                                            className={`text-[12px] font-black uppercase tracking-widest bg-transparent border-none focus:outline-none w-32 ${darkMode ? 'text-white' : 'text-slate-800'}`}
                                        />
                                    </div>
                                    <div className={`text-[9px] font-bold uppercase tabular-nums tracking-tight px-2 py-1 rounded-md mt-1 flex flex-col gap-0.5 ${isValid ? (darkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-50 text-slate-600') : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'}`}>
                                        {isValid ? (
                                            <>
                                                <div className="flex justify-between border-b pb-0.5 border-slate-700/30">
                                                    <span>N = {nX}</span>
                                                    <span>r = {r.toFixed(2)}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-indigo-400">Y: M={mY.toFixed(2)} (SD={sdY.toFixed(2)})</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-emerald-400">X: M={mX.toFixed(2)} (SD={sdX.toFixed(2)})</span>
                                                </div>
                                            </>
                                        ) : (
                                            <span>Mismatch: X({nX}) vs Y({nY})</span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 ml-2">
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
                                <div className="animate-in fade-in slide-in-from-top-2 duration-300 mt-3 border-t pt-3 border-slate-800/50">
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="flex flex-col gap-1">
                                            <label className={`text-[9px] font-extrabold uppercase text-emerald-400 pl-1`}>X ({covariateName})</label>
                                            <textarea
                                                placeholder="10\n12\n14..."
                                                value={g.xRaw}
                                                onChange={e => parseRaw(g.id, 'x', e.target.value)}
                                                className={`w-full h-32 p-2 rounded-lg text-[10px] font-mono border-2 transition-all outline-none resize-none ${darkMode ? 'bg-slate-950 border-slate-800 text-emerald-300 focus:border-emerald-500 custom-scrollbar' : 'bg-slate-50 border-slate-200 text-emerald-700 focus:border-emerald-500'}`}
                                            />
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <label className={`text-[9px] font-extrabold uppercase text-indigo-400 pl-1`}>Y (Outcome)</label>
                                            <textarea
                                                placeholder="100\n110\n95..."
                                                value={g.yRaw}
                                                onChange={e => parseRaw(g.id, 'y', e.target.value)}
                                                className={`w-full h-32 p-2 rounded-lg text-[10px] font-mono border-2 transition-all outline-none resize-none ${darkMode ? 'bg-slate-950 border-slate-800 text-indigo-300 focus:border-indigo-500 custom-scrollbar' : 'bg-slate-50 border-slate-200 text-indigo-700 focus:border-indigo-500'}`}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default AncovaDatasetEditor;
