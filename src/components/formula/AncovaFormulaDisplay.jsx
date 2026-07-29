import React from "react";
import MathTerm from "../common/MathTerm";

const AncovaFormulaDisplay = ({
  onInfo,
  onHover,
  darkMode,
  showValues,
  stats,
}) => {
  const borderColor = darkMode ? "border-slate-700" : "border-slate-800";
  const labelColor = darkMode ? "text-slate-500" : "text-slate-400";
  const textColor = darkMode ? "text-slate-200" : "text-slate-800";
  const term = (name, value) => (
    <MathTerm
      term={name}
      value={value}
      showValue={showValues}
      onInfo={onInfo}
      onHover={onHover}
      darkMode={darkMode}
    />
  );
  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-full overflow-hidden px-1">
      <div className="flex flex-col items-center w-full">
        <div
          className={`text-[10px] font-black uppercase tracking-widest ${labelColor} mb-1`}
        >
          F for Group (controlling for X)
        </div>
        <div
          className={`flex items-center text-2xl md:text-3xl font-serif ${textColor} whitespace-nowrap`}
        >
          <span className="font-bold mr-3 italic text-indigo-500">
            F<sub>adj</sub>
          </span>
          <span className="mr-3">=</span>
          <div className="flex flex-col items-center">
            <div
              className={`border-b-2 px-4 pb-1 mb-1 w-full text-center ${borderColor}`}
            >
              {term("MS_Group", stats?.msB)}
            </div>
            <div className="pt-1 px-4">{term("MS_error", stats?.msW)}</div>
          </div>
        </div>
        <div
          className={`mt-2 text-[10px] uppercase tracking-widest font-bold ${labelColor}`}
        >
          Model: Y ~ Group + X
        </div>
      </div>
      <div
        className={`w-full border-t border-dashed ${darkMode ? "border-slate-800" : "border-slate-200"} pt-4`}
      >
        <div
          className={`p-4 rounded-xl border ${darkMode ? "bg-slate-900/40 border-slate-800" : "bg-slate-50 border-slate-100"} flex flex-col items-center gap-2`}
        >
          <div
            className={`text-[9px] font-black uppercase tracking-widest ${labelColor}`}
          >
            Mean Adjustment
          </div>
          <div
            className={`text-center font-serif ${textColor} whitespace-nowrap`}
          >
            <span>{term("Ȳ_adj")}</span>
            <span className="mx-2">=</span>
            <span>
              {term("Ȳ")} - {term("b_w", stats?.b_w)}({term("X̄")} -{" "}
              {term("X̄_grand")})
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AncovaFormulaDisplay;
