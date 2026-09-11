import { lazy } from "react";
import { ChevronLeft, XCircle } from "lucide-react";
import { MATH_TERMS } from "../../data/mathTerms";
import ErrorBoundary from "../../components/common/ErrorBoundary";
import CalculationText from "../../components/common/CalculationText";
const FormulaDisplay = lazy(() => import('../../components/formula/FormulaDisplay'));

export default function EquationWorkspace({
        mathHistory, darkMode, popMathTerm, closeMathFromIndex, pushMathTerm,
        setHoveredTerm, showEquationValues, currentStats, displayFormulaId,
}) {
    const formatMathTermHtml = (value = '') => value.replace(/\$(.*?)\$/g, "<sub>$1</sub>").replace(/\{(.*?)\}/g, "<sub>$1</sub>");

    const renderMathInspectorCard = (termKey, index) => {
        const term = MATH_TERMS[termKey];

        if (!term) {
            return null;
        }

        const isLastCard = index === mathHistory.length - 1;

        return (
            <div
                key={`${termKey}-${index}`}
                className={`min-w-[280px] max-w-[340px] rounded-2xl border shadow-sm p-4 flex flex-col gap-4 animate-in fade-in slide-in-from-right-4 duration-300 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'}`}
            >
                <div className={`flex items-start justify-between gap-3 border-b pb-3 ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                    <div className="min-w-0">
                        <div className={`text-[10px] font-black uppercase tracking-[0.24em] mb-2 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                            Term Detail {index + 1}
                        </div>
                        <h4
                            className={`font-bold text-lg leading-tight ${darkMode ? 'text-indigo-400' : 'text-indigo-700'}`}
                            dangerouslySetInnerHTML={{ __html: formatMathTermHtml(term.title) }}
                        />
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                        {isLastCard && mathHistory.length > 1 && (
                            <button
                                onClick={(event) => {
                                    event.stopPropagation();
                                    popMathTerm();
                                }}
                                className={`text-[10px] font-bold flex items-center gap-1 px-2 py-1 rounded transition-colors ${darkMode ? 'text-indigo-300 hover:bg-indigo-500/10' : 'text-indigo-600 hover:bg-indigo-50'}`}
                            >
                                <ChevronLeft className="w-3 h-3" /> Back
                            </button>
                        )}
                        <button
                            onClick={(event) => {
                                event.stopPropagation();
                                closeMathFromIndex(index);
                            }}
                            className={`text-[10px] font-bold flex items-center gap-1 px-2 py-1 rounded transition-colors ${darkMode ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}
                        >
                            Close <XCircle className="w-3 h-3" />
                        </button>
                    </div>
                </div>

                <p
                    className={`text-[11px] font-bold uppercase tracking-[0.18em] ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}
                    dangerouslySetInnerHTML={{ __html: formatMathTermHtml(term.desc) }}
                />

                <div className={`p-4 rounded-xl text-sm border break-words shadow-sm ${darkMode ? 'bg-indigo-950/20 text-slate-300 border-indigo-500/20' : 'bg-white text-slate-800 border-indigo-100'}`}>
                    <CalculationText
                        text={term.calc}
                        onInfo={pushMathTerm}
                        onHover={setHoveredTerm}
                        darkMode={darkMode}
                        showValues={showEquationValues}
                        stats={currentStats}
                    />
                </div>
            </div>
        );
    };

    const renderInteractiveEquationWorkspace = () => (
        <ErrorBoundary>
            <div className={`w-full ${mathHistory.length > 0 ? 'grid gap-6 items-start lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.95fr)]' : ''}`}>
                <div className="min-w-0 animate-in fade-in zoom-in-95 duration-200">
                    <FormulaDisplay
                        type={displayFormulaId}
                        onInfo={pushMathTerm}
                        onHover={setHoveredTerm}
                        darkMode={darkMode}
                        showValues={showEquationValues}
                        stats={currentStats}
                    />
                </div>

                {mathHistory.length > 0 && (
                    <div className="w-full overflow-x-auto">
                        <div className="flex gap-4 pb-2 min-w-full">
                            {mathHistory.map((termKey, index) => renderMathInspectorCard(termKey, index))}
                        </div>
                    </div>
                )}
            </div>
        </ErrorBoundary>
    );


    return renderInteractiveEquationWorkspace();
}
