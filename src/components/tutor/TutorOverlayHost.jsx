import { useState } from 'react';
import { BookOpen, History, X } from 'lucide-react';
import AncovaTutorPanel from './AncovaTutorPanel';
import AnovaTutorPanel from './AnovaTutorPanel';
import FactorialAnovaTutorPanel from './FactorialAnovaTutorPanel';
import { ANOVA_EXPLANATIONS, FACTORIAL_ANOVA_EXPLANATIONS } from './tutorExplanations';

function ExplanationModal({ darkMode, explanation, onClose }) {
    if (!explanation) return null;

    return (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[11000] flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className={`rounded-2xl shadow-2xl max-w-lg w-full p-6 border animate-in zoom-in-95 duration-300 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <div className="flex justify-between items-center mb-4">
                    <h3 className={`font-bold text-lg ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
                        {explanation.title}
                    </h3>
                    <button type="button" onClick={onClose} className={`p-1 rounded-full hover:bg-slate-800 transition-colors ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                        <X size={18} />
                    </button>
                </div>
                <div className={`text-sm leading-relaxed max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                    <p className="mb-4">{explanation.body}</p>
                    {explanation.content && (
                        <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-950/50 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                            {explanation.content}
                        </div>
                    )}
                </div>
                <button type="button" onClick={onClose} className={`mt-6 w-full py-3 rounded-xl font-bold transition-all ${darkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}`}>
                    Close
                </button>
            </div>
        </div>
    );
}

function TutorHistoryModal({ darkMode, history, onClose }) {
    return (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[11000] flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className={`rounded-2xl shadow-2xl max-w-lg w-full p-6 border animate-in zoom-in-95 duration-300 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500">
                            <History size={20} />
                        </div>
                        <h3 className={`font-black text-xl tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>Tutor Library</h3>
                    </div>
                    <button type="button" onClick={onClose} className={`p-2 rounded-full hover:bg-slate-800 transition-colors ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                        <X size={20} />
                    </button>
                </div>

                <div className="max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar space-y-4">
                    {history.length === 0 ? (
                        <div className="text-center py-12 opacity-40">
                            <BookOpen size={40} className="mx-auto mb-4" />
                            <p className="text-sm">No tips collected yet. Play with the data to trigger tutor insights!</p>
                        </div>
                    ) : history.map((tip, index) => (
                        <div key={`${tip.id || tip.title}-${index}`} className={`p-4 rounded-xl border-2 transition-all ${darkMode ? 'bg-slate-950/50 border-slate-800 hover:border-indigo-500/50' : 'bg-slate-50 border-slate-100 hover:border-indigo-500/30'}`}>
                            <div className="flex items-center gap-2 mb-2">
                                <div className={`w-1.5 h-1.5 rounded-full ${tip.type === 'error' ? 'bg-rose-500' : tip.type === 'misconception' ? 'bg-amber-500' : 'bg-indigo-500'}`} />
                                <h4 className={`text-[10px] font-black uppercase tracking-[0.2em] ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>{tip.type}</h4>
                            </div>
                            <h5 className={`font-bold text-sm mb-1 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>{tip.title}</h5>
                            <p className={`text-xs leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>{tip.body}</p>
                        </div>
                    ))}
                </div>

                <button type="button" onClick={onClose} className={`mt-8 w-full py-4 rounded-xl font-black uppercase tracking-widest text-xs transition-all ${darkMode ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg' : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl'}`}>
                    Back to Analysis
                </button>
            </div>
        </div>
    );
}

const buildAnovaReport = (currentStats, darkMode) => ({
    title: 'ANOVA Report Builder',
    body: 'Based on your current data, here is an APA-formatted sentence for your results section:',
    content: (
        <div className="space-y-3">
            <p className={`font-mono text-[13px] leading-relaxed p-4 rounded-lg italic ${darkMode ? 'bg-slate-900 border-slate-800 text-indigo-300' : 'bg-white border-slate-200 text-indigo-700 shadow-sm'}`}>
                {!currentStats ? 'Add more data to generate a report.' : (() => {
                    const { F, dfB, dfW, p, eta2 } = currentStats;
                    const significance = p < 0.05 ? 'was statistically significant' : 'was not statistically significant';
                    const pText = p < 0.001 ? '< .001' : `= ${p.toFixed(3)}`;
                    return `A one-way ANOVA revealed that the effect of group membership ${significance}, F(${dfB}, ${dfW}) = ${F.toFixed(2)}, p ${pText}, η² = ${eta2.toFixed(2)}.`;
                })()}
            </p>
            <p className="text-[10px] opacity-60">Tip: Report F with both degrees of freedom in parentheses.</p>
        </div>
    ),
});

export default function TutorOverlayHost({
    ancovaTutor,
    anovaTutor,
    currentStats,
    currentStepId,
    darkMode,
    factorialAnovaTutor,
    isAnovaActive,
    onToggleValues,
}) {
    const [activeExplanation, setActiveExplanation] = useState(null);
    const [showHistory, setShowHistory] = useState(false);

    const handleAnovaAction = (action) => {
        if (action === 'toggle_show_values') onToggleValues();
        if (action === 'dismiss_permanent') anovaTutor.dismissTip(anovaTutor.activeTip.id, true);
        if (action === 'dismiss_session') anovaTutor.dismissTip(anovaTutor.activeTip.id, false);

        const explanation = action === 'generate_apa_report'
            ? buildAnovaReport(currentStats, darkMode)
            : ANOVA_EXPLANATIONS[action];
        if (explanation) setActiveExplanation(explanation);

        if (anovaTutor.activeTip) anovaTutor.dismissTip(anovaTutor.activeTip.id, false);
        window.dispatchEvent(new CustomEvent('anovaTutorAction', { detail: action }));
    };

    const handleFactorialAction = (action) => {
        if (action === 'dismiss_permanent') factorialAnovaTutor.dismissTip(factorialAnovaTutor.activeTip.id, true);
        if (action === 'dismiss_session') factorialAnovaTutor.dismissTip(factorialAnovaTutor.activeTip.id, false);

        if (FACTORIAL_ANOVA_EXPLANATIONS[action]) {
            setActiveExplanation(FACTORIAL_ANOVA_EXPLANATIONS[action]);
        }

        window.dispatchEvent(new CustomEvent('factorialAnovaTutorAction', { detail: action }));
        if (factorialAnovaTutor.activeTip) {
            factorialAnovaTutor.dismissTip(factorialAnovaTutor.activeTip.id, false);
        }
    };

    return (
        <>
            <ExplanationModal
                darkMode={darkMode}
                explanation={activeExplanation}
                onClose={() => setActiveExplanation(null)}
            />

            {showHistory && (
                <TutorHistoryModal
                    darkMode={darkMode}
                    history={anovaTutor.history}
                    onClose={() => setShowHistory(false)}
                />
            )}

            {isAnovaActive && anovaTutor.activeTip && (
                <AnovaTutorPanel
                    tip={anovaTutor.activeTip}
                    onDismiss={anovaTutor.dismissTip}
                    onShowHistory={() => setShowHistory(true)}
                    onAction={handleAnovaAction}
                    darkMode={darkMode}
                />
            )}

            {currentStepId === 'res_factorial_anova' && factorialAnovaTutor.activeTip && (
                <FactorialAnovaTutorPanel
                    tip={factorialAnovaTutor.activeTip}
                    onDismiss={factorialAnovaTutor.dismissTip}
                    onShowHistory={() => setShowHistory(true)}
                    onAction={handleFactorialAction}
                    darkMode={darkMode}
                />
            )}

            {currentStepId === 'res_ancova' && ancovaTutor.activeTip && (
                <AncovaTutorPanel
                    tip={ancovaTutor.activeTip}
                    onDismiss={ancovaTutor.dismissTip}
                    onShowHistory={() => setShowHistory(true)}
                    onAction={(action) => {
                        if (action === 'dismiss_permanent') ancovaTutor.dismissTip(ancovaTutor.activeTip.id, true);
                        if (action === 'dismiss_session') ancovaTutor.dismissTip(ancovaTutor.activeTip.id, false);
                        window.dispatchEvent(new CustomEvent('ancovaTutorAction', { detail: action }));
                    }}
                    darkMode={darkMode}
                />
            )}

            {isAnovaActive && !anovaTutor.activeTip && (
                <div className="fixed top-24 right-10 z-[5000] animate-in slide-in-from-right-10 fade-in duration-700">
                    <button
                        type="button"
                        onClick={() => setShowHistory(true)}
                        className={`group flex items-center gap-3 px-5 py-3 rounded-2xl border-2 shadow-xl backdrop-blur-xl transition-all hover:scale-105 active:scale-95 ${darkMode ? 'bg-slate-900/90 border-slate-800 text-indigo-400 hover:border-indigo-500/50' : 'bg-white/90 border-slate-100 text-indigo-600 hover:border-indigo-200'}`}
                    >
                        <History size={18} className="group-hover:rotate-[-20deg] transition-transform" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Tutor Library</span>
                        {anovaTutor.history.length > 0 && (
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-500 text-[10px] font-bold text-white">
                                {anovaTutor.history.length}
                            </span>
                        )}
                    </button>
                </div>
            )}
        </>
    );
}
