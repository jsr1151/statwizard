import { lazy, Suspense, useEffect } from "react";
const TutorExplanationModal = lazy(() => import('../tutor/TutorExplanationModal.jsx'));
const AnovaReportContent = lazy(() => import('../tutor/AnovaReportContent.jsx'));
import { X, History, BookOpen } from "lucide-react";
const AnovaTutorPanel = lazy(() => import('../../components/tutor/AnovaTutorPanel'));
const FactorialAnovaTutorPanel = lazy(() => import('../../components/tutor/FactorialAnovaTutorPanel'));
const AncovaTutorPanel = lazy(() => import('../../components/tutor/AncovaTutorPanel'));

export default function AppOverlays({
        showTutorHints,
        aiModalOpen, darkMode, setAiModalOpen, aiLoading, aiExplanation,
        activeExplanation, setActiveExplanation, showHistory, setShowHistory, anovaTutor,
        isAnovaActive, setShowEquationValues, showEquationValues, currentStats, currentStepId,
        factorialAnovaTutor, ancovaTutor,
}) {
    useEffect(() => {
        const openReport = event => {
            if (event.detail === 'generate_apa_report' && ['res_one_way_anova', 'res_anova'].includes(currentStepId)) setActiveExplanation({ id: 'anova-report' });
        };
        window.addEventListener('anovaTutorAction', openReport);
        return () => window.removeEventListener('anovaTutorAction', openReport);
    }, [currentStepId, setActiveExplanation]);
    const explanation = activeExplanation?.id === 'anova-report' ? {
        title: 'ANOVA Report Builder', body: 'This report follows the current lesson inputs and significance level.',
        content: <AnovaReportContent result={currentStats} darkMode={darkMode} />,
    } : activeExplanation;
    return (<>
    {aiModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className={`rounded-2xl shadow-2xl max-w-lg w-full p-6 border animate-in zoom-in-95 duration-300 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <div className="flex justify-between items-center mb-4">
                    <h3 className={`font-bold ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>Consultant AI</h3>
                    <button onClick={() => setAiModalOpen(false)} className={`p-1 rounded-full hover:bg-slate-800 transition-colors ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}><X size={18} /></button>
                </div>
                {aiLoading ? (
                    <div className="py-12 flex flex-col items-center gap-4">
                        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                        <p className={`text-sm font-bold animate-pulse ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Generating Analysis...</p>
                    </div>
                ) : (
                    <div className={`text-sm leading-relaxed max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                        {aiExplanation}
                    </div>
                )}
                <button onClick={() => setAiModalOpen(false)} className={`mt-6 w-full py-3 rounded-xl font-bold transition-all ${darkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}`}>Dismiss</button>
            </div>
        </div>
    )}

    <Suspense fallback={null}>
        {explanation && <TutorExplanationModal explanation={explanation} darkMode={darkMode} onClose={() => setActiveExplanation(null)} />}
    </Suspense>

    {showHistory && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[11000] flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className={`rounded-2xl shadow-2xl max-w-lg w-full p-6 border animate-in zoom-in-95 duration-300 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500">
                            <History size={20} />
                        </div>
                        <h3 className={`font-black text-xl tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>Tutor Library</h3>
                    </div>
                    <button onClick={() => setShowHistory(false)} className={`p-2 rounded-full hover:bg-slate-800 transition-colors ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}><X size={20} /></button>
                </div>

                <div className="max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar space-y-4">
                    {anovaTutor.history.length === 0 ? (
                        <div className="text-center py-12 opacity-40">
                            <BookOpen size={40} className="mx-auto mb-4" />
                            <p className="text-sm">No tips collected yet. Play with the data to trigger tutor insights!</p>
                        </div>
                    ) : (
                        anovaTutor.history.map((tip, idx) => (
                            <div key={idx} className={`p-4 rounded-xl border-2 transition-all ${darkMode ? 'bg-slate-950/50 border-slate-800 hover:border-indigo-500/50' : 'bg-slate-50 border-slate-100 hover:border-indigo-500/30'}`}>
                                <div className="flex items-center gap-2 mb-2">
                                    <div className={`w-1.5 h-1.5 rounded-full ${tip.type === 'error' ? 'bg-rose-500' : tip.type === 'misconception' ? 'bg-amber-500' : 'bg-indigo-500'}`} />
                                    <h4 className={`text-[10px] font-black uppercase tracking-[0.2em] ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>{tip.type}</h4>
                                </div>
                                <h5 className={`font-bold text-sm mb-1 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>{tip.title}</h5>
                                <p className={`text-xs leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>{tip.body}</p>
                            </div>
                        ))
                    )}
                </div>

                <button onClick={() => setShowHistory(false)} className={`mt-8 w-full py-4 rounded-xl font-black uppercase tracking-widest text-xs transition-all ${darkMode ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg' : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl'}`}>Back to Analysis</button>
            </div>
        </div>
    )}

    {isAnovaActive && anovaTutor.activeTip && (
        <AnovaTutorPanel
            tip={anovaTutor.activeTip}
            onDismiss={anovaTutor.dismissTip}
            onShowHistory={() => setShowHistory(true)}
            onAction={(action) => {
                if (action === 'toggle_show_values') setShowEquationValues(!showEquationValues);
                if (action === 'dismiss_permanent') anovaTutor.dismissTip(anovaTutor.activeTip.id, true);
                if (action === 'dismiss_session') anovaTutor.dismissTip(anovaTutor.activeTip.id, false);

                // Educational/Explanation actions
                const explanations = {
                    'show_f_starts_0': {
                        title: "Why does F start at 0?",
                        body: "F is a ratio of two variances (MS_between / MS_within). Since variances are sums of squares (always positive), the ratio can never be negative. F starts at 0 and goes to positive infinity.",
                    },
                    'show_welch_info': {
                        title: "Welch’s ANOVA",
                        body: "Standard ANOVA assumes equal variances (homogeneity). If your group variances differ significantly, Welch’s ANOVA is a robust alternative that doesn't require this assumption.",
                    },
                    'show_power_tip': {
                        title: "Low Statistical Power",
                        body: "A non-significant result doesn't mean there's no effect—it might just mean the study was too 'small' to find it. Power increases with larger sample sizes and less within-group noise.",
                    },
                    'show_nonsig_explanation': {
                        title: "What is 'Non-Significant'?",
                        body: "It means the observed differences are small enough that they could easily happen by random chance. We 'fail to reject' the null hypothesis because the evidence isn't strong enough.",
                    },
                    'show_assumptions_checklist': {
                        title: "ANOVA Assumptions Checklist",
                        body: "For your results to be valid, check these: 1. Independent observations, 2. Normality (scores are bell-curved in each group), 3. Homogeneity (variances are similar).",
                    },
                    'show_effect_size_info': {
                        title: "Strength of Effect (η²)",
                        body: "While p-values tell you if an effect is likely 'real,' η² tells you how 'big' it is. It's the percentage of total variance explained by your groups.",
                    },
                    'show_index_example': {
                        title: "Example: indices i and j",
                        body: "If Group 1 has scores [5, 6, 7], then j=1 for all of them. The first score (5) is x₁,₁. The second (6) is x₂,₁. And the third (7) is x₃,₁.",
                    },
                    'show_nj_example': {
                        title: "Numeric Example: Scaling",
                        body: "If group size nⱼ = 10 and the mean difference (x̄ⱼ - x̄_grand)² = 4, that group contributes 10 * 4 = 40 to the SS_between.",
                    },
                    'generate_apa_report': { id: 'anova-report' },
                    'show_f1_example': {
                        title: "F ≈ 1 Example",
                        body: "If between-group variance is 20 and within-group variance is 20, F = 20/20 = 1.0. This happens when the treatment has no more effect than random chance.",
                    },
                    'show_fcrit_explanation': {
                        title: "Understanding F critical",
                        body: "F critical is the cutoff set by alpha and the numerator and denominator degrees of freedom. An observed F beyond this cutoff falls in the rejection region; changing alpha or either degree of freedom changes the cutoff.",
                    },
                    'show_f_factors': {
                        title: "What raises F?",
                        body: "Increasing group separation (bigger numerator) or decreasing individual spread (smaller denominator) both raise the F-ratio.",
                    },
                    'highlight_f_drivers': {
                        title: "What is driving your F-ratio?",
                        body: "Is it a large difference between groups, or very small differences within them? I'll highlight the components in the table for you.",
                    },
                    'show_eta_apa': {
                        title: "Reporting η² in APA Style",
                        body: "Include η² after the F-test results. Example: F(2, 27) = 4.54, p = .020, η² = .25.",
                    },
                    'show_unbalanced_info': {
                        title: "Unequal Group Sizes",
                        body: "When n₁ ≠ n₂ ≠ n₃, the F-test is slightly less 'robust' if variances also differ. Use Levene's test to ensure homogeneity.",
                    },
                    'show_square_demo': {
                        title: "Why we square",
                        body: "If we just added differences (x - x̄), they would sum to zero because positives and negatives cancel out. Squaring ensures every distance counts toward total variability.",
                    }
                };

                if (explanations[action]) {
                    setActiveExplanation(explanations[action]);
                }

                // Dismiss for any action by default to prevent stuck tips
                if (anovaTutor.activeTip) {
                    anovaTutor.dismissTip(anovaTutor.activeTip.id, false);
                }

                window.dispatchEvent(new CustomEvent('anovaTutorAction', { detail: action }));
            }}
            darkMode={darkMode}
        />
    )}

    {showTutorHints && currentStepId === 'res_factorial_anova' && factorialAnovaTutor.activeTip && (
        <FactorialAnovaTutorPanel
            tip={factorialAnovaTutor.activeTip}
            onDismiss={factorialAnovaTutor.dismissTip}
            onShowHistory={() => setShowHistory(true)}
            onAction={(action) => {
                if (action === 'dismiss_permanent') factorialAnovaTutor.dismissTip(factorialAnovaTutor.activeTip.id, true);
                if (action === 'dismiss_session') factorialAnovaTutor.dismissTip(factorialAnovaTutor.activeTip.id, false);

                const factorialExplanations = {
                    'explain_balanced': {
                        title: "Why Balance Matters",
                        body: "When every cell has the same number of people, the factors are perfectly independent (orthogonal). If Ns are unequal, the factors 'overlap' and sums of squares are harder to calculate and interpret.",
                    },
                    'explain_simple_effects': {
                        title: "What are Simple Effects?",
                        body: "Simple effects are one-way ANOVAs conducted within a single level of the other factor. For example, 'Does Factor A matter *only* when Factor B is at Level 1?'",
                    },
                    'explain_interaction': {
                        title: "Visualizing Interaction",
                        body: "If lines are parallel, the effect of Factor A is the same regardless of Factor B. If they cross or diverge, the effect changes—which we call an interaction.",
                    }
                };

                if (factorialExplanations[action]) {
                    setActiveExplanation(factorialExplanations[action]);
                }

                // Signal down to the visualizer for UI-specific actions
                window.dispatchEvent(new CustomEvent('factorialAnovaTutorAction', { detail: action }));

                // Auto-dismiss after action if needed (helps keep UI clean)
                if (factorialAnovaTutor.activeTip) {
                    factorialAnovaTutor.dismissTip(factorialAnovaTutor.activeTip.id, false);
                }
            }}
            darkMode={darkMode}
        />
    )}

    {showTutorHints && currentStepId === 'res_ancova' && ancovaTutor.activeTip && (
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

    </>);
}
