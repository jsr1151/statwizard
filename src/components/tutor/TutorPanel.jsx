import React, { useState } from 'react';
import { X, ChevronUp, ChevronDown, Sparkles } from 'lucide-react';
import CalculationText from '../common/CalculationText';

const TutorPanel = ({ script, level, onClose, darkMode, inline = false }) => {
    const [showDetail, setShowDetail] = useState(false);
    if (!script || level === 'off') return null;

    const containerClasses = inline
        ? `transition-all duration-300 border-2 rounded-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 shadow-lg ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`
        : `transition-all duration-300 border-l backdrop-blur-md animate-in slide-in-from-right-4 w-72 flex flex-col h-full ${darkMode ? 'bg-slate-900/95 border-slate-700' : 'bg-white/95 border-slate-200 shadow-xl'}`;

    return (
        <div className={containerClasses}>
            <div className={`p-4 border-b flex justify-between items-center ${darkMode ? 'border-slate-800' : 'border-slate-100'}`}>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                    <span className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Tutor Feed</span>
                </div>
                {onClose && <button onClick={onClose} className={`transition-colors ${darkMode ? 'text-slate-500 hover:text-white' : 'text-slate-400 hover:text-slate-800'}`}><X size={14} /></button>}
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <div className="space-y-1">
                    <div className="text-[8px] font-bold text-indigo-400 uppercase">Now</div>
                    <div className={`text-xs font-medium leading-relaxed ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                        <CalculationText text={script.content.now} darkMode={darkMode} onInfo={() => { }} />
                    </div>
                </div>

                <div className="space-y-1 animate-in fade-in slide-in-from-top-1 duration-500 delay-150">
                    <div className={`text-[8px] font-bold uppercase ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>What Changed</div>
                    <div className={`text-[11px] leading-relaxed font-medium ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                        <CalculationText text={script.content.whatChanged} darkMode={darkMode} onInfo={() => { }} />
                    </div>
                </div>

                {level === 'tutor' && (
                    <div className={`pt-4 mt-4 border-t space-y-4 animate-in fade-in duration-700 delay-300 ${darkMode ? 'border-slate-800' : 'border-slate-100'}`}>
                        <button
                            onClick={() => setShowDetail(!showDetail)}
                            className={`w-full flex justify-between items-center text-[8px] font-black uppercase transition-colors ${darkMode ? 'text-indigo-300 hover:text-indigo-200' : 'text-indigo-500 hover:text-indigo-700'}`}
                        >
                            <span>{showDetail ? 'Hide' : 'Show'} Deep Dive</span>
                            {showDetail ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                        </button>

                        {showDetail && (
                            <div className="space-y-3 animate-in zoom-in-95 duration-200">
                                <div className={`p-2 rounded-lg border ${darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                                    <div className={`text-[7px] font-bold uppercase mb-1 italic ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Why?</div>
                                    <div className={`text-[10px] leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                        <CalculationText text={script.content.why} darkMode={darkMode} onInfo={() => { }} />
                                    </div>
                                </div>
                                <div className={`p-2 rounded-lg border ${darkMode ? 'bg-indigo-900/20 border-indigo-500/20' : 'bg-indigo-50 border-indigo-100'}`}>
                                    <div className="text-[7px] font-bold text-indigo-400 uppercase mb-1">The Math</div>
                                    <div className={`text-[10px] font-mono text-center py-1 ${darkMode ? 'text-indigo-300' : 'text-indigo-600'}`}>
                                        <CalculationText text={script.content.math} darkMode={darkMode} onInfo={() => { }} />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <div className={`p-3 rounded-xl border mt-4 space-y-1 animate-in fade-in slide-in-from-bottom-1 duration-500 delay-500 ${darkMode ? 'bg-indigo-600/10 border-indigo-500/20' : 'bg-indigo-50 border-indigo-200'}`}>
                    <div className="text-[8px] font-bold text-indigo-400 uppercase">Try This Next</div>
                    <p className={`text-[10px] font-medium leading-relaxed flex items-center gap-2 ${darkMode ? 'text-indigo-200' : 'text-indigo-700'}`}>
                        <Sparkles size={10} /> {script.content.tryNext}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default TutorPanel;
