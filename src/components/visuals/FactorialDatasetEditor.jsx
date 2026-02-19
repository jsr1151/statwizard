import React from 'react';
import { Maximize2, Minimize2, Trash2, Plus } from 'lucide-react';

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
                        <h4 className="text-[12px] font-black uppercase tracking-widest text-indigo-500">Factor A: {factorA.label}</h4>
                        <button onClick={() => addLevel('A')} className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                            <Plus size={14} />
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
                        <h4 className="text-[12px] font-black uppercase tracking-widest text-emerald-500">Factor B: {factorB.label}</h4>
                        <button onClick={() => addLevel('B')} className="p-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">
                            <Plus size={14} />
                        </button>
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

            {/* Cell Grid */}
            <div className="overflow-x-auto pb-4">
                <table className="w-full border-separate border-spacing-4">
                    <thead>
                        <tr>
                            <th className="p-2"></th>
                            {factorB.levels.map(b => (
                                <th key={b.id} className="text-[10px] font-black uppercase tracking-widest text-slate-500 text-center pb-2">
                                    {b.label}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {factorA.levels.map(a => (
                            <tr key={a.id}>
                                <td className="text-[10px] font-black uppercase tracking-widest text-slate-500 pr-4 align-middle">
                                    {a.label}
                                </td>
                                {factorB.levels.map(b => {
                                    const key = `${a.id}_${b.id}`;
                                    const cell = cellData[key] || { values: [], summary: { n: 0, mean: 0 }, inputMode: 'raw' };
                                    const n = cell.inputMode === 'summary' ? (parseInt(cell.summary?.n) || 0) : (cell.values?.length || 0);

                                    return (
                                        <td key={b.id} className="min-w-[200px]">
                                            <div className={`p-4 rounded-[1.5rem] border-2 transition-all relative ${darkMode ? 'bg-slate-950 border-slate-800 shadow-xl' : 'bg-white border-slate-100 shadow-lg'}`}>
                                                <div className="flex justify-between items-center mb-3">
                                                    <span className="text-[9px] font-black text-slate-500 uppercase">N={n}</span>
                                                    <div className="flex gap-1 p-1 bg-slate-900 rounded-lg">
                                                        <button
                                                            onClick={() => updateCell(key, 'inputMode', 'raw')}
                                                            className={`text-[8px] px-2 py-1 rounded-md font-black uppercase transition-all ${cell.inputMode === 'raw' ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}
                                                        >Raw</button>
                                                        <button
                                                            onClick={() => updateCell(key, 'inputMode', 'summary')}
                                                            className={`text-[8px] px-2 py-1 rounded-md font-black uppercase transition-all ${cell.inputMode === 'summary' ? 'bg-emerald-600 text-white' : 'text-slate-500'}`}
                                                        >Stats</button>
                                                    </div>
                                                </div>

                                                {cell.inputMode === 'summary' ? (
                                                    <div className="grid grid-cols-3 gap-2">
                                                        {['mean', 'sd', 'n'].map(field => (
                                                            <div key={field} className="flex flex-col gap-1">
                                                                <label className="text-[7px] font-black uppercase text-slate-500">{field}</label>
                                                                <input
                                                                    type="text"
                                                                    value={cell.summary[field]}
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
