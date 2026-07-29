import React from 'react';

const IndependentTTestGroupInput = ({
    color,
    darkMode,
    group,
    groupNumber,
    inputMode,
    onChange,
    onRawChange,
    onSecondaryAction,
    secondaryActionLabel,
}) => {
    const inputClass = `p-2 rounded text-sm font-bold border ${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`;

    return (
        <section className={`p-4 rounded-xl border-2 ${darkMode ? 'bg-slate-950/50 border-slate-800' : 'bg-white border-slate-200'}`}>
            <div className="flex justify-between items-center mb-4">
                <h5 className={`text-[10px] font-black uppercase flex items-center gap-2 ${color}`}>
                    <span className={`w-2 h-2 rounded-full ${groupNumber === 1 ? 'bg-indigo-500' : 'bg-emerald-500'}`} />
                    Group {groupNumber}
                </h5>
                <button type="button" onClick={onSecondaryAction} className="text-[8px] font-black text-slate-500 hover:text-indigo-400 uppercase tracking-widest">
                    {secondaryActionLabel}
                </button>
            </div>

            {inputMode === 'summary' ? (
                <div className="grid grid-cols-3 gap-2">
                    <label className="flex flex-col gap-1 text-[8px] font-bold text-slate-500 uppercase">
                        Mean (x-bar {groupNumber})
                        <input type="number" step="0.1" value={group.xBar} onChange={(event) => onChange('xBar', event.target.value)} className={inputClass} />
                    </label>
                    <label className="flex flex-col gap-1 text-[8px] font-bold text-slate-500 uppercase">
                        SD (s{groupNumber})
                        <input type="number" step="0.1" min="0" value={group.s} onChange={(event) => onChange('s', event.target.value)} className={inputClass} />
                    </label>
                    <label className="flex flex-col gap-1 text-[8px] font-bold text-slate-500 uppercase">
                        Size (n{groupNumber})
                        <input type="number" step="1" min="2" value={group.n} onChange={(event) => onChange('n', event.target.value)} className={inputClass} />
                    </label>
                </div>
            ) : (
                <label className="block text-[8px] font-bold text-slate-500 uppercase">
                    Raw observations
                    <textarea
                        aria-label={`Group ${groupNumber} raw observations`}
                        placeholder="Paste values separated by commas or spaces..."
                        value={group.raw}
                        onChange={(event) => onRawChange(event.target.value)}
                        className={`mt-1 w-full h-16 p-2 rounded text-[10px] font-mono border ${darkMode ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'}`}
                    />
                </label>
            )}
        </section>
    );
};

export default IndependentTTestGroupInput;
