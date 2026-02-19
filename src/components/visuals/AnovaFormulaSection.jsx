import React, { useState } from 'react';
import { Sigma, Calculator, Info, InfoIcon, InfoIcon as MathIcon, ToggleLeft, ToggleRight, ArrowRight, Table, Binary } from 'lucide-react';
import ProgressiveTooltip from '../common/ProgressiveTooltip';
import { MATH_TERMS } from '../../data/mathTerms';

const AnovaFormulaSection = ({
    stats,
    groupExample,
    grandMean,
    hoveredTerm,
    setHoveredTerm,
    darkMode
}) => {
    const [notationMode, setNotationMode] = useState('words'); // 'words' | 'advanced'
    const [showPills, setShowPills] = useState(true);
    const [sswMode, setSswMode] = useState('raw'); // 'raw' | 'summary'
    const [showExample, setShowExample] = useState(false);

    const getT = (key) => {
        const term = MATH_TERMS[key];
        if (!term) return { title: key, desc: '', pedagogy: '' };
        return term;
    };

    const Term = ({ id, label, colorClass, children }) => {
        const info = getT(id);
        return (
            <div className="flex flex-col items-center">
                <ProgressiveTooltip
                    term={id}
                    title={info.title}
                    desc={info.desc}
                    pedagogy={info.pedagogy}
                    example={info.example}
                    darkMode={darkMode}
                >
                    <span
                        className={`font-serif cursor-help transition-all duration-300 ${colorClass} ${hoveredTerm === id ? 'scale-110 font-black underline decoration-2' : ''}`}
                        onMouseEnter={() => setHoveredTerm(id)}
                        onMouseLeave={() => setHoveredTerm(null)}
                    >
                        {children}
                    </span>
                </ProgressiveTooltip>
                {showPills && label && (
                    <span className={`pill-label ${colorClass} bg-opacity-10 border ${darkMode ? 'border-white/5 bg-white/5' : 'border-black/5 bg-black/5'}`}>
                        {label}
                    </span>
                )}
            </div>
        );
    };

    return (
        <div className="flex flex-col gap-8 w-full">
            {/* Toggles */}
            <div className="flex flex-wrap items-center gap-4 px-2">
                <div className={`flex p-1 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-200'}`}>
                    <button
                        onClick={() => setNotationMode('words')}
                        className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${notationMode === 'words' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Words
                    </button>
                    <button
                        onClick={() => setNotationMode('advanced')}
                        className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${notationMode === 'advanced' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Advanced
                    </button>
                </div>

                <button
                    onClick={() => setShowPills(!showPills)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${showPills ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-500'}`}
                >
                    <Info size={12} /> {showPills ? 'Labels ON' : 'Show Labels'}
                </button>

                <button
                    onClick={() => setShowExample(!showExample)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${showExample ? 'bg-indigo-600 text-white shadow-lg' : (darkMode ? 'bg-slate-900 text-slate-500 hover:text-slate-300' : 'bg-slate-100 text-slate-400')}`}
                >
                    <Calculator size={12} /> {showExample ? 'Hide Examples' : 'Show Examples'}
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* SS BETWEEN (SIGNAL) */}
                <div className={`p-6 rounded-3xl border-2 transition-all ${darkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-100 shadow-xl'}`}>
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h4 className="text-[12px] font-black uppercase tracking-[0.2em] color-group mb-1">Between (Signal)</h4>
                            <p className="text-[10px] text-slate-500 font-medium leading-relaxed italic">
                                "How much does each category group's average deviate from the overall average? We multiply by group size to see their total impact."
                            </p>
                        </div>
                        <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                            <Table size={20} />
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-2 py-4 mb-4 text-xl">
                        <span className="font-serif">SS<sub>B</sub> =</span>
                        {notationMode === 'words' && <span className="text-slate-500 text-xs font-bold uppercase tracking-tighter">Sum of all [</span>}
                        <Term id="nj" label="group size" colorClass="color-group">
                            {notationMode === 'words' ? 'Group Size' : 'nⱼ'}
                        </Term>
                        <span className="text-slate-400">×</span>
                        <div className="flex items-center group/parentheses">
                            <span className="text-3xl text-slate-300">(</span>
                            <Term id="x̄j" label="group mean" colorClass="color-group">
                                {notationMode === 'words' ? 'Group Average' : 'x̄ⱼ'}
                            </Term>
                            <span className="text-slate-400 mx-1">−</span>
                            <Term id="x̄_grand" label="grand mean" colorClass="color-grand">
                                {notationMode === 'words' ? 'Total Average' : 'x̄_grand'}
                            </Term>
                            <span className="text-3xl text-slate-300">)</span>
                            <Term id="squared" label="penalize gap" colorClass="text-slate-400">
                                <sup>2</sup>
                            </Term>
                        </div>
                        {notationMode === 'words' && <span className="text-slate-500 text-xs font-bold uppercase tracking-tighter">] across levels</span>}
                        {notationMode === 'advanced' && (
                            <div className="ml-4 flex items-center opacity-40 hover:opacity-100 transition-opacity">
                                <ProgressiveTooltip term="Σ" title="Summation" desc="Loop over groups (j = 1 to k) and add them up.">
                                    <span className="text-2xl cursor-help">∑</span>
                                </ProgressiveTooltip>
                            </div>
                        )}
                    </div>

                    {showExample && stats && groupExample && (
                        <div className="mt-4 p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 animate-in slide-in-from-top-2">
                            <p className="text-[10px] font-black text-indigo-400/60 uppercase tracking-widest mb-1 italic">The Concept:</p>
                            <p className="text-[11px] text-slate-400 mb-4 leading-relaxed">
                                "We take the gap between this group's mean and the overall average, square it to keep it positive, and multiply by the group size to see how many data points are represented by that gap."
                            </p>
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3">Plug-in Example: {groupExample.label}</p>
                            <div className="flex flex-wrap items-center gap-1.5 font-mono text-[11px] text-indigo-400">
                                <span>{groupExample.summary.n}</span>
                                <span className="text-slate-600">×</span>
                                <span>(</span>
                                <span>{parseFloat(groupExample.summary.mean).toFixed(1)}</span>
                                <span className="text-slate-600">−</span>
                                <span className="color-grand">{grandMean.toFixed(1)}</span>
                                <span>)<sup>2</sup></span>
                                <span className="mx-2 text-slate-600">=</span>
                                <span className="text-white bg-indigo-600 px-2 rounded-md">
                                    {(groupExample.summary.n * Math.pow(parseFloat(groupExample.summary.mean) - grandMean, 2)).toFixed(2)}
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                {/* SS WITHIN (NOISE) */}
                <div className={`p-6 rounded-3xl border-2 transition-all ${darkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-100 shadow-xl'}`}>
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h4 className="text-[12px] font-black uppercase tracking-[0.2em] color-individual mb-1">Within (Noise)</h4>
                            <p className="text-[10px] text-slate-500 font-medium leading-relaxed italic">
                                "How much does each individual vary from their own group's logic? This is the random 'noise' that groups don't explain."
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setSswMode(sswMode === 'raw' ? 'summary' : 'raw')}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all ${sswMode === 'summary' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-500'}`}
                            >
                                {sswMode === 'raw' ? 'USE SUMMARY STATS' : 'USE RAW DATA'}
                            </button>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-2 py-4 mb-4 text-xl">
                        <span className="font-serif">SS<sub>W</sub> =</span>

                        {sswMode === 'raw' ? (
                            <>
                                {notationMode === 'words' && <span className="text-slate-500 text-xs font-bold uppercase tracking-tighter">Sum of every [</span>}
                                <div className="flex items-center group/parentheses">
                                    <span className="text-3xl text-slate-300">(</span>
                                    <Term id="xij" label="person score" colorClass="color-individual">
                                        {notationMode === 'words' ? 'Actual Score' : 'xᵢⱼ'}
                                    </Term>
                                    <span className="text-slate-400 mx-1">−</span>
                                    <Term id="x̄j" label="group mean" colorClass="color-group">
                                        {notationMode === 'words' ? 'Group Average' : 'x̄ⱼ'}
                                    </Term>
                                    <span className="text-3xl text-slate-300">)</span>
                                    <Term id="squared" label="penalize gap" colorClass="text-slate-400">
                                        <sup>2</sup>
                                    </Term>
                                </div>
                                {notationMode === 'words' && <span className="text-slate-500 text-xs font-bold uppercase tracking-tighter">] across people</span>}
                            </>
                        ) : (
                            <>
                                <Term id="nj" label="group size" colorClass="color-group">
                                    ( {notationMode === 'words' ? 'size' : 'nⱼ'} − 1 )
                                </Term>
                                <span className="text-slate-400">×</span>
                                <Term id="sj" label="variance" colorClass="color-individual">
                                    {notationMode === 'words' ? 'varianceⱼ' : 'sⱼ²'}
                                </Term>
                            </>
                        )}

                        {notationMode === 'advanced' && (
                            <div className="ml-4 flex items-center opacity-40 hover:opacity-100 transition-opacity">
                                <ProgressiveTooltip term="ΣΣ" title="Double Summation" desc="Loop over groups (j) and then people (i) within those groups.">
                                    <span className="text-2xl cursor-help">∑∑</span>
                                </ProgressiveTooltip>
                            </div>
                        )}
                    </div>

                    {showExample && stats && groupExample && (
                        <div className="mt-4 p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 animate-in slide-in-from-top-2">
                            <p className="text-[10px] font-black text-emerald-400/60 uppercase tracking-widest mb-1 italic">The Concept:</p>
                            <p className="text-[11px] text-slate-400 mb-4 leading-relaxed">
                                {sswMode === 'raw'
                                    ? "We look at every person individually and see how much they 'disobey' their own group's mean. This is the pure individual variation."
                                    : "We use the group's variance (spread) and multiply by n-1. This is mathematically identical to adding up all the individual squared deviations."}
                            </p>
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3">Plug-in Example: {groupExample.label}</p>
                            {sswMode === 'raw' ? (
                                <div className="flex flex-wrap items-center gap-1.5 font-mono text-[11px] text-emerald-400">
                                    <span className="text-[8px] color-group">Person 1:</span>
                                    <span>(</span>
                                    <span>{groupExample.values[0] || 0}</span>
                                    <span className="text-slate-600">−</span>
                                    <span className="color-group">{parseFloat(groupExample.summary.mean).toFixed(1)}</span>
                                    <span>)<sup>2</sup></span>
                                    <span className="mx-2 text-slate-600">=</span>
                                    <span className="text-white bg-emerald-600 px-2 rounded-md">
                                        {Math.pow((groupExample.values[0] || 0) - parseFloat(groupExample.summary.mean), 2).toFixed(2)}
                                    </span>
                                </div>
                            ) : (
                                <div className="flex flex-wrap items-center gap-1.5 font-mono text-[11px] text-emerald-400">
                                    <span>(</span>
                                    <span>{groupExample.summary.n}</span>
                                    <span className="text-slate-600">−</span>
                                    <span>1)</span>
                                    <span className="text-slate-600">×</span>
                                    <span>{Math.pow(parseFloat(groupExample.summary.sd), 2).toFixed(2)}</span>
                                    <span className="mx-2 text-slate-600">=</span>
                                    <span className="text-white bg-emerald-600 px-2 rounded-md">
                                        {((parseInt(groupExample.summary.n) - 1) * Math.pow(parseFloat(groupExample.summary.sd), 2)).toFixed(2)}
                                    </span>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AnovaFormulaSection;
