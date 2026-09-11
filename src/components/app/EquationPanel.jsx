import { ChevronUp, ChevronDown, Calculator, Info } from "lucide-react";
import { MATH_TERMS } from "../../data/mathTerms";
import EquationWorkspace from "./EquationWorkspace.jsx";

export default function EquationPanel({
        darkMode, displayFormulaId, showEquationPanel, setShowEquationValues, showEquationValues,
        setSymbolKeyOpen, symbolKeyOpen, setShowEquationPanel, safeRelevantSymbols, hoveredTerm,
        pushMathTerm, equationWorkspaceProps,
}) {
    const useSafeGenericEquationCard = false;
    const renderSafeGenericEquationBody = () => {
        const labelClass = darkMode ? 'text-slate-500' : 'text-slate-500';
        const textClass = darkMode ? 'text-slate-100' : 'text-slate-900';
        const cardClass = darkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-slate-50 border-slate-100';

        if (displayFormulaId === 'mean') {
            return (
                <div className="flex flex-col items-center gap-6 w-full">
                    <div className={`text-xs font-black uppercase tracking-widest ${labelClass}`}>Central Tendency Reference</div>
                    <div className={`text-xl md:text-2xl font-serif text-center ${textClass}`}>
                        x̄ = Σx / n
                    </div>
                    <div className="grid gap-3 w-full md:grid-cols-2">
                        <div className={`rounded-xl border p-4 text-center ${cardClass}`}>
                            <div className={`text-[10px] font-black uppercase tracking-widest ${labelClass}`}>Median</div>
                            <div className={`mt-2 text-lg font-serif ${textClass}`}>Middle ordered value</div>
                        </div>
                        <div className={`rounded-xl border p-4 text-center ${cardClass}`}>
                            <div className={`text-[10px] font-black uppercase tracking-widest ${labelClass}`}>Mode</div>
                            <div className={`mt-2 text-lg font-serif ${textClass}`}>Most frequent value</div>
                        </div>
                    </div>
                </div>
            );
        }

        if (displayFormulaId === 'sd') {
            return (
                <div className="flex flex-col items-center gap-6 w-full">
                    <div className={`text-xs font-black uppercase tracking-widest ${labelClass}`}>Sample Standard Deviation</div>
                    <div className={`text-xl md:text-2xl font-serif text-center ${textClass}`}>
                        s = √(Σ(x - x̄)² / (n - 1))
                    </div>
                    <div className={`rounded-xl border p-4 text-center w-full ${cardClass}`}>
                        <div className={`text-[10px] font-black uppercase tracking-widest ${labelClass}`}>Spread Summary</div>
                        <div className={`mt-2 text-sm ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                            Larger values of s mean scores sit farther from the mean on average.
                        </div>
                    </div>
                </div>
            );
        }

        if (displayFormulaId === 'percentage') {
            return (
                <div className="flex flex-col items-center gap-6 w-full">
                    <div className={`text-xs font-black uppercase tracking-widest ${labelClass}`}>Relative Frequency</div>
                    <div className={`text-xl md:text-2xl font-serif text-center ${textClass}`}>
                        rf = f / N
                    </div>
                    <div className={`rounded-xl border p-4 text-center w-full ${cardClass}`}>
                        <div className={`text-[10px] font-black uppercase tracking-widest ${labelClass}`}>Quick Read</div>
                        <div className={`mt-2 text-sm ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                            Use absolute frequency for counts, relative frequency for proportions, and cumulative frequency for running totals.
                        </div>
                    </div>
                </div>
            );
        }

        if (displayFormulaId === 'z_test') {
            return (
                <div className="flex flex-col items-center gap-4 w-full">
                    <div className={`text-xs font-black uppercase tracking-widest ${labelClass}`}>One-Sample Z Test</div>
                    <div className={`text-xl md:text-2xl font-serif text-center ${textClass}`}>
                        z = (x̄ - μ) / SE
                    </div>
                    <div className={`text-lg font-serif text-center ${textClass}`}>
                        SE = σ / √n
                    </div>
                </div>
            );
        }

        if (displayFormulaId === 't_onesample') {
            return (
                <div className="flex flex-col items-center gap-4 w-full">
                    <div className={`text-xs font-black uppercase tracking-widest ${labelClass}`}>One-Sample T Test</div>
                    <div className={`text-xl md:text-2xl font-serif text-center ${textClass}`}>
                        t = (x̄ - μ) / SE
                    </div>
                    <div className={`text-lg font-serif text-center ${textClass}`}>
                        SE = s / √n
                    </div>
                    <div className={`text-sm font-bold uppercase tracking-widest ${labelClass}`}>
                        df = n - 1
                    </div>
                </div>
            );
        }

        if (displayFormulaId === 'anova') {
            return (
                <div className="flex flex-col items-center gap-4 w-full">
                    <div className={`text-xs font-black uppercase tracking-widest ${labelClass}`}>ANOVA Core Equations</div>
                    <div className="grid gap-3 w-full">
                        <div className={`rounded-xl border p-4 text-center ${cardClass}`}>
                            <div className={`text-[10px] font-black uppercase tracking-widest ${labelClass}`}>F Ratio</div>
                            <div className={`mt-2 text-xl font-serif ${textClass}`}>F = MS_between / MS_error</div>
                        </div>
                        <div className={`rounded-xl border p-4 text-center ${cardClass}`}>
                            <div className={`text-[10px] font-black uppercase tracking-widest ${labelClass}`}>Mean Squares</div>
                            <div className={`mt-2 text-base font-serif ${textClass}`}>MS_between = SS_between / df_between</div>
                            <div className={`mt-1 text-base font-serif ${textClass}`}>MS_error = SS_error / df_error</div>
                        </div>
                        <div className={`rounded-xl border p-4 text-center ${cardClass}`}>
                            <div className={`text-[10px] font-black uppercase tracking-widest ${labelClass}`}>Effect Size</div>
                            <div className={`mt-2 text-base font-serif ${textClass}`}>η² = SS_between / SS_total</div>
                        </div>
                    </div>
                </div>
            );
        }

        return (
            <div className={`text-sm ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                Equation reference unavailable for this page.
            </div>
        );
    };

    const renderEquationPanel = () => {
        if (!displayFormulaId || displayFormulaId === 'none') {
            return null;
        }

        return (
            <div className={`border-2 rounded-xl shadow-sm overflow-visible flex flex-col relative z-0 min-h-[180px] transition-colors ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'}`}>
                <div className={`px-4 py-2 border-b flex justify-between items-center ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                    <h3 className={`text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}><Calculator className="w-4 h-4" /> The Equation</h3>
                    <div className="flex gap-2">
                        {showEquationPanel && (
                            <>
                                {!useSafeGenericEquationCard && (
                                    <button
                                        onClick={() => setShowEquationValues(!showEquationValues)}
                                        className={`text-[10px] flex items-center gap-1 px-2 py-1 rounded transition-all font-bold ${showEquationValues ? 'bg-indigo-600 text-white' : (darkMode ? 'text-slate-400 hover:text-indigo-400 bg-slate-800' : 'text-slate-500 hover:text-indigo-600 bg-slate-100')}`}
                                    >
                                        {showEquationValues ? 'HIDE VALUES' : 'SHOW VALUES'}
                                    </button>
                                )}
                                <button onClick={() => setSymbolKeyOpen(!symbolKeyOpen)} className={`text-[10px] flex items-center gap-1 px-2 py-1 rounded transition-colors ${darkMode ? 'text-slate-400 hover:text-indigo-400 bg-slate-800' : 'text-slate-500 hover:text-indigo-600 bg-slate-100'}`}><Info className="w-3 h-3" /> Symbol Key</button>
                            </>
                        )}
                        <button
                            onClick={() => setShowEquationPanel((previous) => !previous)}
                            className={`text-[10px] flex items-center gap-1 px-2 py-1 rounded transition-colors ${darkMode ? 'text-slate-400 hover:text-indigo-400 bg-slate-800' : 'text-slate-500 hover:text-indigo-600 bg-slate-100'}`}
                        >
                            {showEquationPanel ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            {showEquationPanel ? 'Hide Equation' : 'Show Equation'}
                        </button>
                    </div>
                </div>

                {showEquationPanel && symbolKeyOpen && (
                    <div className="bg-slate-800 text-slate-200 text-xs p-3 grid grid-cols-2 gap-2 animate-in fade-in slide-in-from-top-2">
                        {safeRelevantSymbols.map((s, i) => {
                            const isHovered = hoveredTerm && (
                                hoveredTerm === s.key ||
                                hoveredTerm.startsWith(s.key + '_') ||
                                s.sym.includes(hoveredTerm)
                            );
                            return (
                                <div key={i} className={`transition-all duration-200 rounded px-1 flex items-center gap-1 ${isHovered ? 'bg-indigo-500/30 text-white font-bold ring-1 ring-indigo-400' : ''}`}>
                                    <span className="text-indigo-300 font-bold" dangerouslySetInnerHTML={{ __html: s.sym }} />
                                    <span>=</span>
                                    <span>{s.desc}</span>
                                </div>
                            );
                        })}
                    </div>
                )}

                {showEquationPanel ? (
                    <div className={`p-8 flex flex-col items-center justify-center flex-1 transition-colors ${darkMode ? 'bg-slate-950' : 'bg-white'}`}>
                        {useSafeGenericEquationCard ? (
                            <div className="w-full animate-in fade-in zoom-in-95 duration-200">
                                {renderSafeGenericEquationBody()}
                                {safeRelevantSymbols.length > 0 && (
                                    <div className={`mt-6 border-t pt-5 ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                                        <div className={`mb-3 text-center text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                                            Select a variable for its explanation
                                        </div>
                                        <div className="flex flex-wrap justify-center gap-2">
                                            {safeRelevantSymbols.map((symbol) => (
                                                <button
                                                    key={symbol.key}
                                                    type="button"
                                                    onClick={() => pushMathTerm(symbol.key)}
                                                    disabled={!MATH_TERMS[symbol.key]}
                                                    className={`rounded-lg border px-3 py-2 text-sm transition-colors ${MATH_TERMS[symbol.key]
                                                        ? (darkMode ? 'border-slate-700 bg-slate-900 text-indigo-300 hover:border-indigo-500' : 'border-slate-200 bg-white text-indigo-700 hover:border-indigo-500')
                                                        : (darkMode ? 'border-slate-800 text-slate-500' : 'border-slate-200 text-slate-400')}`}
                                                    title={symbol.desc}
                                                >
                                                    <span dangerouslySetInnerHTML={{ __html: symbol.sym }} />
                                                    <span className="ml-2 text-xs opacity-70">{symbol.desc}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <EquationWorkspace {...equationWorkspaceProps} />
                        )}
                    </div>
                ) : (
                    <div className={`px-6 py-5 flex-1 flex items-center justify-center text-center ${darkMode ? 'bg-slate-950 text-slate-400' : 'bg-white text-slate-600'}`}>
                        Expand the equation box when you want the notation, symbol key, or worked formula details in view.
                    </div>
                )}
            </div>
        );
    };


    return renderEquationPanel();
}
