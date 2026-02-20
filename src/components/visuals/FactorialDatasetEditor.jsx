import React from 'react';
import { Maximize2, Minimize2, Trash2, Plus, Info } from 'lucide-react';
import ProgressiveTooltip from '../common/ProgressiveTooltip';

const FactorialDatasetEditor = ({
    factorA,
    factorB,
    cellData,
    updateCell,
    updateCellStats,
    parseCellRaw,
    addLevel,
    removeLevel,
    updateLevelLabel,
    darkMode
}) => {
    return (
        <div className="flex flex-col gap-8 transition-opacity">
            {/* Factor Controls */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Factor A Levels */}
                <div className={`p-6 rounded-[2rem] border-2 ${darkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-100'}`}>
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex flex-col">
                            <ProgressiveTooltip term="Factor A" title="Independent Variable 1" desc="The first independent factor in your design." darkMode={darkMode}>
                                <h4 className="text-[12px] font-black uppercase tracking-widest text-indigo-500 cursor-help">Factor A: {factorA.label}</h4>
                            </ProgressiveTooltip>
                            <span className="text-[9px] font-bold text-slate-500 italic">Independent Levels</span>
                        </div>
                        <button onClick={() => addLevel('A')} className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600/10 text-indigo-400 rounded-lg border border-indigo-500/20 text-[9px] font-black hover:bg-indigo-600/20 transition-all">
                            <Plus size={12} /> ADD LEVEL
                        </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {factorA.levels.map(level => (
                            <div key={level.id} className="flex items-center gap-2 bg-slate-800/20 p-2 rounded-xl border border-slate-700/50">
                                <input
                                    value={level.label}
                                    onChange={(e) => updateLevelLabel('A', level.id, e.target.value)}
                                    className="bg-transparent border-none outline-none text-[11px] font-bold w-20 text-slate-300"
                                />
                                {factorA.levels.length > 2 && (
                                    <button onClick={() => removeLevel('A', level.id)} className="text-slate-500 hover:text-rose-500">
                                        <Trash2 size={12} />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Factor B Levels */}
                <div className={`p-6 rounded-[2rem] border-2 ${darkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-100'}`}>
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex flex-col">
                            <ProgressiveTooltip term="Factor B" title="Independent Variable 2" desc="The second independent factor in your design." darkMode={darkMode}>
                                <h4 className="text-[12px] font-black uppercase tracking-widest text-emerald-500 cursor-help">Factor B: {factorB.label}</h4>
                            </ProgressiveTooltip>
                            <span className="text-[9px] font-bold text-slate-500 italic">Independent Levels</span>
                        </div>
                        <ProgressiveTooltip term="+ Level" title="Add Level" desc="Add a new category or condition to this factor." darkMode={darkMode}>
                            <button onClick={() => addLevel('B')} className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600/10 text-emerald-400 rounded-lg border border-emerald-500/20 text-[9px] font-black hover:bg-emerald-600/20 transition-all">
                                <Plus size={12} /> ADD LEVEL
                            </button>
                        </ProgressiveTooltip>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {factorB.levels.map(level => (
                            <div key={level.id} className="flex items-center gap-2 bg-slate-800/20 p-2 rounded-xl border border-slate-700/50">
                                <input
                                    value={level.label}
                                    onChange={(e) => updateLevelLabel('B', level.id, e.target.value)}
                                    className="bg-transparent border-none outline-none text-[11px] font-bold w-20 text-slate-300"
                                />
                                {factorB.levels.length > 2 && (
                                    <button onClick={() => removeLevel('B', level.id)} className="text-slate-500 hover:text-rose-500">
                                        <Trash2 size={12} />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Utility Row */}
            <div className={`flex flex-wrap items-center gap-4 p-4 rounded-2xl border-2 ${darkMode ? 'bg-slate-900/30 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex items-center gap-3">
                    <button onClick={() => addLevel('A')} className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600/10 text-indigo-400 rounded-xl text-[10px] font-black uppercase hover:bg-indigo-600/20 transition-all border border-indigo-500/20">
                        <Plus size={12} /> Add Factor A
                    </button>
                    <button onClick={() => addLevel('B')} className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600/10 text-emerald-400 rounded-xl text-[10px] font-black uppercase hover:bg-emerald-600/20 transition-all border border-emerald-500/20">
                        <Plus size={12} /> Add Factor B
                    </button>
                </div>

                <div className="flex-1 px-4">
                    {(() => {
                        const ns = Object.values(cellData).map(c => c.inputMode === 'summary' ? (parseInt(c.summary?.n) || 0) : (c.values?.length || 0));
                        const uniqueNs = [...new Set(ns)];
                        const hasEmptyCell = ns.some(n => n === 0);
                        const isUnbalanced = uniqueNs.length > 1 && ns.some(n => n > 0);

                        if (hasEmptyCell) {
                            return (
                                <div className="flex items-center gap-2 text-[10px] font-bold text-rose-500 animate-pulse">
                                    <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-lg shadow-rose-500/50" />
                                    <span>Critical: One or more cells are empty (Incomplete Factorial)</span>
                                </div>
                            );
                        }

                        if (isUnbalanced) {
                            return (
                                <div className="flex items-center gap-2 text-[10px] font-bold text-amber-500">
                                    <div className="w-2 h-2 rounded-full bg-amber-500" />
                                    <span>Note: Unequal n across cells (Unbalanced Design)</span>
                                </div>
                            );
                        }
                        return null;
                    })()}
                </div>

                <button onClick={() => { if (confirm("Clear all data?")) Object.keys(cellData).forEach(k => parseCellRaw(k, "")); }} className="text-[10px] font-black uppercase text-slate-500 hover:text-rose-500 transition-colors">
                    <Trash2 size={12} className="inline mr-1" /> Clear All
                </button>
            </div>

            {/* Cell Grid */}
            <div className="overflow-x-auto pb-4 max-h-[500px] custom-scrollbar rounded-2xl border-2 border-slate-800/50">
                <table className="w-full border-separate border-spacing-4 min-w-[600px]">
                    <thead className="sticky top-0 z-50">
                        <tr className={darkMode ? 'bg-slate-900' : 'bg-white'}>
                            <th className="p-2 w-20"></th>
                            {factorB.levels.map(b => (
                                <th key={b.id} className="text-[10px] font-black uppercase tracking-widest text-slate-500 text-center py-4 border-b-2 border-slate-800/50">
                                    {b.label}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {factorA.levels.map(a => (
                            <tr key={a.id}>
                                <td className={`sticky left-0 z-40 text-[10px] font-black uppercase tracking-widest text-slate-500 pr-4 align-middle border-r-2 border-slate-800/20 ${darkMode ? 'bg-slate-900/90 backdrop-blur-sm' : 'bg-white/90 backdrop-blur-sm'}`}>
                                    {a.label}
                                </td>
                                {factorB.levels.map(b => {
                                    const key = `${a.id}_${b.id}`;
                                    const cell = cellData[key] || { values: [], summary: { n: 0, mean: 0, sd: 0 }, inputMode: 'raw' };
                                    const n = cell.inputMode === 'summary' ? (parseInt(cell.summary?.n || 0)) : (cell.values?.length || 0);

                                    return (
                                        <td key={b.id} className="min-w-[200px]">
                                            <div className={`p-4 rounded-[1.5rem] border-2 transition-all relative ${darkMode ? 'bg-slate-950 border-slate-800 shadow-xl' : 'bg-white border-slate-100 shadow-lg'}`}>
                                                <div className="flex justify-between items-center mb-3">
                                                    <ProgressiveTooltip term="Cell Stats" title="Descriptive Statistics" desc={`N=${n} observations. Mean=${parseFloat(cell.summary?.mean || 0).toFixed(1)}. SD=${parseFloat(cell.summary?.sd || 0).toFixed(1)}.`} darkMode={darkMode}>
                                                        <div className="flex flex-col cursor-help">
                                                            <span className="text-[9px] font-black text-slate-500 uppercase">n={n}</span>
                                                            {cell.summary && (
                                                                <span className="text-[8px] font-black text-indigo-400 flex gap-2">
                                                                    <span>M={parseFloat(cell.summary?.mean || 0).toFixed(1)}</span>
                                                                    <span>SD={parseFloat(cell.summary?.sd || 0).toFixed(1)}</span>
                                                                </span>
                                                            )}
                                                        </div>
                                                    </ProgressiveTooltip>
                                                    <ProgressiveTooltip term="Toggle" title="Input Mode" desc="Switch between entering individual scores (RAW) or aggregate group stats (STATS)." darkMode={darkMode}>
                                                        <div className="flex gap-1 p-1 bg-slate-900 rounded-lg cursor-pointer">
                                                            <button
                                                                onClick={() => updateCell(key, 'inputMode', 'raw')}
                                                                className={`text-[8px] px-2 py-1 rounded-md font-black uppercase transition-all ${cell.inputMode === 'raw' ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}
                                                            >Raw</button>
                                                            <button
                                                                onClick={() => updateCell(key, 'inputMode', 'summary')}
                                                                className={`text-[8px] px-2 py-1 rounded-md font-black uppercase transition-all ${cell.inputMode === 'summary' ? 'bg-emerald-600 text-white' : 'text-slate-500'}`}
                                                            >Stats</button>
                                                        </div>
                                                    </ProgressiveTooltip>
                                                </div>

                                                {cell.inputMode === 'summary' ? (
                                                    <div className="grid grid-cols-3 gap-2">
                                                        {['mean', 'sd', 'n'].map(field => (
                                                            <div key={field} className="flex flex-col gap-1">
                                                                <label className="text-[7px] font-black uppercase text-slate-500">{field}</label>
                                                                <input
                                                                    type="text"
                                                                    value={cell.summary?.[field] || ""}
                                                                    onChange={e => updateCellStats(key, field, e.target.value)}
                                                                    className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-lg p-1.5 text-[12px] font-black text-indigo-400 outline-none"
                                                                />
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <textarea
                                                        placeholder="Scores..."
                                                        value={cell.values?.join(', ')}
                                                        onChange={e => parseCellRaw(key, e.target.value)}
                                                        className={`w-full h-20 p-2 rounded-xl text-[10px] font-mono border border-slate-800 transition-all outline-none resize-none bg-slate-950 text-indigo-400 focus:border-indigo-500 custom-scrollbar`}
                                                    />
                                                )}
                                            </div>
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default FactorialDatasetEditor;
