import React, { useState } from 'react';
import { Info, ChevronRight, ChevronDown } from 'lucide-react';

const ProgressiveTooltip = ({ term, title, desc, pedagogy, example, children, darkMode }) => {
    const [expanded, setExpanded] = useState(false);

    return (
        <div className="relative inline-block group/tt tooltip-trigger">
            {children}
            <div className={`tooltip-content absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-64 p-4 rounded-3xl shadow-2xl border transition-all duration-300 z-[9999] opacity-0 scale-95 invisible group-hover/tt:opacity-100 group-hover/tt:scale-100 group-hover/tt:visible pointer-events-none group-hover/tt:pointer-events-auto ${darkMode ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-white border-slate-200 text-slate-800'
                }`}>
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-indigo-500/10 flex items-center justify-center">
                            <Info size={12} className="text-indigo-400" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">{term}</span>
                    </div>
                    <p className="text-[11px] font-bold leading-tight">{title}</p>
                    <p className="text-[10px] opacity-70 leading-relaxed">{desc}</p>

                    {(pedagogy || example) && (
                        <div className="mt-2 pt-2 border-t border-slate-800/50">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setExpanded(!expanded);
                                }}
                                className="flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-indigo-400 hover:text-indigo-300 transition-colors pointer-events-auto"
                            >
                                {expanded ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
                                {expanded ? 'Less' : 'More...'}
                            </button>

                            {expanded && (
                                <div className="mt-2 space-y-2 animate-in slide-in-from-top-1 duration-200">
                                    {pedagogy && (
                                        <div className={`p-2 rounded-lg text-[9px] italic border-l-2 border-indigo-500 ${darkMode ? 'bg-indigo-500/5' : 'bg-indigo-50'
                                            }`}>
                                            {pedagogy}
                                        </div>
                                    )}
                                    {example && (
                                        <div className={`p-2 rounded-lg text-[9px] font-mono ${darkMode ? 'bg-black/30 text-emerald-400' : 'bg-slate-50 text-emerald-600'
                                            }`}>
                                            <span className="opacity-50 uppercase text-[7px] block mb-1">Example:</span>
                                            {example}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Triangle arrow */}
                <div className={`absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-8 border-transparent ${darkMode ? 'border-t-slate-900' : 'border-t-white'
                    }`} />
            </div>
        </div>
    );
};

export default ProgressiveTooltip;
