import React, { useState } from 'react';
import { X, Sparkles, AlertCircle, HelpCircle, Info, ChevronRight, History } from 'lucide-react';

const AnovaTutorPanel = ({ tip, onDismiss, onAction, onShowHistory, darkMode }) => {
    const [isExiting, setIsExiting] = useState(false);

    if (!tip) return null;

    const handleDismiss = (permanent) => {
        setIsExiting(true);
        setTimeout(() => {
            onDismiss(tip.id, permanent);
            setIsExiting(false);
        }, 300);
    };

    const getIcon = () => {
        switch (tip.type) {
            case 'error': return <AlertCircle className="text-rose-500" size={20} />;
            case 'misconception': return <HelpCircle className="text-amber-500" size={20} />;
            case 'onboarding': return <Sparkles className="text-indigo-500" size={20} />;
            default: return <Info className="text-emerald-500" size={20} />;
        }
    };

    return (
        <div
            className={`fixed right-6 top-[20%] w-80 transition-all duration-300 ${isExiting ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100 animate-in slide-in-from-right-4'}`}
            style={{ zIndex: 10000 }}
        >
            <div className={`relative overflow-hidden rounded-2xl border-2 shadow-2xl backdrop-blur-xl ${darkMode ? 'bg-slate-900/90 border-slate-800 shadow-black/50' : 'bg-white/90 border-slate-100 shadow-slate-200'}`}>
                {/* Header/Type Line */}
                <div className={`h-1.5 w-full ${tip.type === 'error' ? 'bg-rose-500' : tip.type === 'misconception' ? 'bg-amber-500' : 'bg-indigo-500'}`} />

                <div className="p-5 space-y-4">
                    <div className="flex justify-between items-start gap-3">
                        <div className="flex gap-3">
                            <div className={`p-2 rounded-xl h-fit ${darkMode ? 'bg-slate-800' : 'bg-slate-50'}`}>
                                {getIcon()}
                            </div>
                            <div className="space-y-1">
                                <span className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                                    {tip.type}
                                </span>
                                <h3 className={`text-sm font-bold leading-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                    {tip.title}
                                </h3>
                            </div>
                        </div>
                        <div className="flex gap-1 -mt-1">
                            {onShowHistory && (
                                <button
                                    onClick={onShowHistory}
                                    className={`p-1.5 rounded-lg transition-all ${darkMode ? 'hover:bg-slate-800 text-slate-500 hover:text-indigo-400' : 'hover:bg-slate-100 text-slate-400 hover:text-indigo-600'}`}
                                    title="View Tutor Library"
                                >
                                    <History size={15} />
                                </button>
                            )}
                            <button
                                onClick={() => handleDismiss(false)}
                                className={`p-1.5 rounded-lg transition-all ${darkMode ? 'hover:bg-slate-800 text-slate-500 hover:text-white' : 'hover:bg-slate-100 text-slate-400 hover:text-slate-900'}`}
                            >
                                <X size={15} />
                            </button>
                        </div>
                    </div>

                    <div className={`text-xs leading-relaxed font-medium ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                        {tip.body}
                    </div>

                    <div className="flex flex-col gap-2 pt-2">
                        {tip.buttons?.map((btn, idx) => (
                            <button
                                key={idx}
                                onClick={() => {
                                    if (btn.action === 'dismiss_permanent') {
                                        handleDismiss(true);
                                    } else if (btn.action === 'dismiss_session') {
                                        handleDismiss(false);
                                    } else {
                                        onAction(btn.action);
                                    }
                                }}
                                className={`group flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${idx === 0
                                    ? (darkMode ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-900/20' : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-100')
                                    : (darkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-600')
                                    }`}
                            >
                                <span>{btn.label}</span>
                                <ChevronRight size={14} className="opacity-0 -translate-x-2 transition-all group-hover:opacity-100 group-hover:translate-x-0" />
                            </button>
                        ))}
                    </div>
                </div>

                {/* Subtle Bottom Accent */}
                <div className={`p-3 text-[8px] font-black uppercase tracking-widest text-center border-t ${darkMode ? 'bg-slate-950/50 border-slate-800 text-slate-600' : 'bg-slate-50/50 border-slate-100 text-slate-400'}`}>
                    ANOVA TUTOR AI • VERSION 1.0
                </div>
            </div>
        </div>
    );
};

export default AnovaTutorPanel;
