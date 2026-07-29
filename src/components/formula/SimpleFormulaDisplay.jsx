import React from "react";
import MathTerm from "../common/MathTerm";

const SimpleFormulaDisplay = ({
  type,
  onInfo,
  onHover,
  darkMode,
  showValues,
  stats,
}) => {
  const borderColor = darkMode ? "border-slate-700" : "border-slate-800";
  const labelColor = darkMode ? "text-slate-500" : "text-slate-400";
  const textColor = darkMode ? "text-slate-200" : "text-slate-800";
  const value = (key) => stats?.[key];
  const term = (name, termValue) => (
    <MathTerm
      term={name}
      value={termValue}
      showValue={showValues}
      onInfo={onInfo}
      onHover={onHover}
      darkMode={darkMode}
    />
  );

  if (type === "mean")
    return (
      <div className="flex flex-col items-center gap-8 w-full">
        <div className="flex flex-col items-center">
          <div
            className={`text-xs font-bold mb-3 uppercase tracking-wider ${labelColor}`}
          >
            Arithmetic Mean
          </div>
          <div
            className={`flex items-center text-xl md:text-2xl font-serif ${textColor}`}
          >
            <span>{term("x̄", value("xBar"))}</span>
            <span className="mx-3">=</span>
            <div className="flex flex-col items-center">
              <span className={`border-b-2 px-2 pb-1 mb-1 ${borderColor}`}>
                Σx
              </span>
              <span>{term("n", value("n"))}</span>
            </div>
          </div>
        </div>
        <div
          className={`grid md:grid-cols-2 gap-4 w-full border-t border-dashed ${darkMode ? "border-slate-800" : "border-slate-200"} pt-6`}
        >
          <div
            className={`p-4 rounded-xl border ${darkMode ? "bg-slate-900/40 border-slate-800" : "bg-slate-50 border-slate-100"} flex flex-col items-center`}
          >
            <div
              className={`text-[10px] font-black uppercase tracking-widest ${labelColor} mb-2`}
            >
              Median
            </div>
            <div className={`text-lg font-serif ${textColor} text-center`}>
              {term("Median")}
            </div>
            <div className={`text-[10px] ${labelColor} mt-1 text-center`}>
              The middle value when data is ordered. Better for skewed data.
            </div>
          </div>
          <div
            className={`p-4 rounded-xl border ${darkMode ? "bg-slate-900/40 border-slate-800" : "bg-slate-50 border-slate-100"} flex flex-col items-center`}
          >
            <div
              className={`text-[10px] font-black uppercase tracking-widest ${labelColor} mb-2`}
            >
              Mode
            </div>
            <div className={`text-lg font-serif ${textColor} text-center`}>
              {term("Mode")}
            </div>
            <div className={`text-[10px] ${labelColor} mt-1 text-center`}>
              The most frequent value. Best for categorical data.
            </div>
          </div>
        </div>
      </div>
    );
  if (type === "sd")
    return (
      <div className="flex flex-col items-center">
        <div
          className={`text-xs font-bold mb-3 uppercase tracking-wider ${labelColor}`}
        >
          Sample Standard Deviation
        </div>
        <div
          className={`flex items-center text-xl md:text-2xl font-serif ${textColor}`}
        >
          <span className="font-bold mr-3 italic">s</span>
          <span className="mr-3">=</span>
          <div className="flex items-center">
            <span className="text-4xl mr-1 font-light">√</span>
            <div
              className={`flex flex-col items-center border-t pt-1 ${borderColor}`}
            >
              <div
                className={`flex flex-col items-center border-b pb-1 mb-1 px-2 ${borderColor}`}
              >
                <span>
                  Σ({term("x")} - {term("x̄", value("xBar"))})²
                </span>
              </div>
              <span>{term("n", value("n"))} - 1</span>
            </div>
          </div>
        </div>
      </div>
    );
  if (type === "range")
    return (
      <div className="flex flex-col items-center">
        <div
          className={`text-xs font-bold mb-3 uppercase tracking-wider ${labelColor}`}
        >
          Range &amp; IQR Equations
        </div>
        <div
          className={`flex flex-col gap-4 text-xl md:text-2xl font-serif ${textColor}`}
        >
          <div>{term("Range")} = Max - Min</div>
          <div>
            {term("IQR")} = {term("Q3")} - {term("Q1")}
          </div>
        </div>
      </div>
    );
  if (type === "percentage")
    return (
      <div className="flex flex-col items-center">
        <div
          className={`text-xs font-bold mb-3 uppercase tracking-wider ${labelColor}`}
        >
          Relative Frequency Equation
        </div>
        <div
          className={`flex items-center text-xl md:text-2xl font-serif ${textColor}`}
        >
          <span className="mr-2 italic">rf</span>
          <span>=</span>
          <div className="flex flex-col items-center mx-1">
            <span className={`border-b-2 px-1 ${borderColor}`}>
              {term("f")}
            </span>
            <span>{term("N", value("n"))}</span>
          </div>
        </div>
      </div>
    );
  if (type === "z_test")
    return (
      <div
        className={`flex items-center text-xl md:text-2xl font-serif ${textColor}`}
      >
        <span className="font-bold mr-3 italic">z</span>
        <span className="mr-3">=</span>
        <div className="flex flex-col items-center">
          <div
            className={`border-b-2 px-2 pb-1 mb-1 w-full text-center ${borderColor}`}
          >
            ({term("x̄", value("xBar"))} - {term("mu", value("mu"))})
          </div>
          <div className="pt-1">{term("SEz", value("se"))}</div>
        </div>
      </div>
    );
  if (type === "correlation")
    return (
      <div
        className={`flex items-center text-xl md:text-2xl font-serif ${textColor}`}
      >
        <span className="font-bold mr-3 italic">r</span>
        <span className="mr-3">=</span>
        <div className="flex flex-col items-center">
          <div
            className={`border-b-2 px-2 pb-1 mb-1 w-full text-center ${borderColor}`}
          >
            {term("Covariance")}
          </div>
          <div className="pt-1">
            ({term("s")}x × {term("s")}y)
          </div>
        </div>
      </div>
    );
  return (
    <div
      className={`flex items-center text-xl md:text-2xl font-serif ${textColor}`}
    >
      <span className="font-bold italic mr-2">Y</span>
      <span>=</span>
      <span className="mx-2">Intercept</span>
      <span>+</span>
      <span className="mx-2">{term("Beta")}(X)</span>
      <span>+</span>
      <span className="mx-2">Error</span>
    </div>
  );
};

export default SimpleFormulaDisplay;
