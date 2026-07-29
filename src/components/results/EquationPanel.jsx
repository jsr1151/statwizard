import { lazy } from "react";
import { Calculator, ChevronLeft, Info, XCircle } from "lucide-react";
import CalculationText from "../common/CalculationText";

const FormulaDisplay = lazy(() => import("../formula/FormulaDisplay"));

const renderMathLabel = (value) => ({
  __html: value
    .replace(/\$(.*?)\$/g, "<sub>$1</sub>")
    .replace(/\{(.*?)\}/g, "<sub>$1</sub>"),
});

export default function EquationPanel({
  activeMathTerm,
  canGoBack,
  currentStats,
  darkMode,
  formulaId,
  hoveredTerm,
  onCloseMath,
  onHoverTerm,
  onPopMathTerm,
  onPushMathTerm,
  onToggleSymbolKey,
  onToggleValues,
  relevantSymbols,
  showEquationValues,
  symbolKeyOpen,
}) {
  if (formulaId === "none") {
    return (
      <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 text-center">
        <h3 className="font-bold text-slate-700 mb-2">Describing Shape</h3>
        <p className="text-sm text-slate-600 mb-4">
          Instead of a formula, we look at symmetry (Skewness) and peak height
          (Kurtosis).
        </p>
      </div>
    );
  }

  if (!formulaId) return null;

  return (
    <div
      className={`border-2 rounded-xl shadow-sm overflow-visible flex flex-col relative z-0 min-h-[250px] transition-colors ${darkMode ? "bg-slate-950 border-slate-800" : "bg-white border-slate-200"}`}
    >
      <div
        className={`px-4 py-2 border-b flex justify-between items-center ${darkMode ? "bg-slate-900 border-slate-800" : "bg-slate-50 border-slate-200"}`}
      >
        <h3
          className={`text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${darkMode ? "text-slate-400" : "text-slate-500"}`}
        >
          <Calculator aria-hidden="true" className="w-4 h-4" /> The Equation
        </h3>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onToggleValues}
            aria-pressed={showEquationValues}
            className={`text-[10px] flex items-center gap-1 px-2 py-1 rounded transition-all font-bold ${showEquationValues ? "bg-indigo-600 text-white" : darkMode ? "text-slate-400 hover:text-indigo-400 bg-slate-800" : "text-slate-500 hover:text-indigo-600 bg-slate-100"}`}
          >
            {showEquationValues ? "HIDE VALUES" : "SHOW VALUES"}
          </button>
          <button
            type="button"
            onClick={onToggleSymbolKey}
            aria-expanded={symbolKeyOpen}
            className={`text-[10px] flex items-center gap-1 px-2 py-1 rounded transition-colors ${darkMode ? "text-slate-400 hover:text-indigo-400 bg-slate-800" : "text-slate-500 hover:text-indigo-600 bg-slate-100"}`}
          >
            <Info aria-hidden="true" className="w-3 h-3" /> Symbol Key
          </button>
        </div>
      </div>

      {symbolKeyOpen && (
        <div className="bg-slate-800 text-slate-200 text-xs p-3 grid grid-cols-2 gap-2 animate-in fade-in slide-in-from-top-2">
          {relevantSymbols.map((symbol) => {
            const isHovered =
              hoveredTerm &&
              (hoveredTerm === symbol.key ||
                hoveredTerm.startsWith(`${symbol.key}_`) ||
                symbol.sym.includes(hoveredTerm));

            return (
              <div
                key={`${symbol.key}-${symbol.sym}`}
                className={`transition-all duration-200 rounded px-1 flex items-center gap-1 ${isHovered ? "bg-indigo-500/30 text-white font-bold ring-1 ring-indigo-400" : ""}`}
              >
                <span
                  className="text-indigo-300 font-bold"
                  dangerouslySetInnerHTML={{ __html: symbol.sym }}
                />
                <span>=</span>
                <span>{symbol.desc}</span>
              </div>
            );
          })}
        </div>
      )}

      <div
        className={`p-8 flex flex-col items-center justify-center flex-1 transition-colors ${darkMode ? "bg-slate-950" : "bg-white"}`}
      >
        {!activeMathTerm ? (
          <div className="animate-in fade-in zoom-in-95 duration-200">
            <FormulaDisplay
              type={formulaId}
              onInfo={onPushMathTerm}
              onHover={onHoverTerm}
              darkMode={darkMode}
              showValues={showEquationValues}
              stats={currentStats}
            />
          </div>
        ) : (
          <div className="w-full animate-in fade-in slide-in-from-right-4 duration-300 flex flex-col items-center text-center">
            <div
              className={`w-full flex justify-between items-center mb-6 border-b pb-2 ${darkMode ? "border-slate-800" : "border-slate-100"}`}
            >
              {canGoBack ? (
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onPopMathTerm();
                  }}
                  className="text-xs font-bold text-indigo-400 flex items-center gap-1 hover:bg-indigo-500/10 px-2 py-1 rounded"
                >
                  <ChevronLeft aria-hidden="true" className="w-3 h-3" /> Back
                </button>
              ) : (
                <div />
              )}
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onCloseMath();
                }}
                className={`text-xs font-bold flex items-center gap-1 transition-colors ${darkMode ? "text-slate-500 hover:text-slate-300" : "text-slate-400 hover:text-slate-600"}`}
              >
                Close <XCircle aria-hidden="true" className="w-3 h-3" />
              </button>
            </div>
            <h4
              className={`font-bold text-xl leading-tight mb-2 ${darkMode ? "text-indigo-400" : "text-indigo-700"}`}
              dangerouslySetInnerHTML={renderMathLabel(activeMathTerm.title)}
            />
            <p
              className={`text-xs font-bold uppercase tracking-wider mb-4 ${darkMode ? "text-slate-600" : "text-slate-500"}`}
              dangerouslySetInnerHTML={renderMathLabel(activeMathTerm.desc)}
            />
            <div
              className={`p-4 rounded-lg text-sm border inline-block mb-3 max-w-full break-words shadow-sm ${darkMode ? "bg-indigo-950/20 text-slate-300 border-indigo-500/20" : "bg-indigo-50/50 text-slate-800 border-indigo-100"}`}
            >
              <CalculationText
                text={activeMathTerm.calc}
                onInfo={onPushMathTerm}
                darkMode={darkMode}
                showValues={showEquationValues}
                stats={currentStats}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
