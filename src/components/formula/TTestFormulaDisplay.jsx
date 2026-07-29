import React from "react";
import MathTerm from "../common/MathTerm";

const TTestFormulaDisplay = ({
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

  if (type === "t_indep") {
    const isWelch = stats?.testType === "welch";
    return (
      <div className="flex flex-col items-center">
        <div
          className={`flex items-center text-xl md:text-2xl font-serif ${textColor}`}
        >
          <span className="font-bold mr-3 italic">t</span>
          <span className="mr-3">=</span>
          <div className="flex flex-col items-center">
            <div
              className={`border-b-2 px-2 pb-1 mb-1 w-full text-center ${borderColor}`}
            >
              ({term("x̄1", value("x1"))} - {term("x̄2", value("x2"))})
            </div>
            <div className="pt-1 flex items-center">
              <span>
                SE<sub>Δ</sub>
              </span>
              {showValues && Number.isFinite(value("se")) && (
                <span className="text-xs font-bold text-indigo-500 ml-1">
                  ({value("se").toFixed(3)})
                </span>
              )}
            </div>
          </div>
        </div>
        <div
          className={`mt-3 pt-3 border-t border-dashed ${darkMode ? "border-slate-700" : "border-slate-200"} w-full flex flex-col items-center gap-2`}
        >
          <div
            className={`text-[9px] font-black uppercase tracking-widest ${labelColor}`}
          >
            Standard Error ({isWelch ? "Unpooled" : "Pooled"})
          </div>
          <div
            className={`flex items-center text-sm md:text-base font-serif ${textColor}`}
          >
            <span>{term("SE_delta", value("se"))}</span>
            <span className="mx-2">=</span>
            {isWelch ? (
              <div className="flex items-start">
                <span className="text-2xl -mr-0.5 leading-none">√</span>
                <div
                  className={`border-t-2 pt-1.5 ${borderColor} flex items-center gap-3 px-1`}
                >
                  <div className="flex flex-col items-center">
                    <span className={`border-b ${borderColor} px-1`}>
                      {term("s1_2", value("s1") ** 2)}
                    </span>
                    <span>{term("n1", value("n1"))}</span>
                  </div>
                  <span className="font-bold">+</span>
                  <div className="flex flex-col items-center">
                    <span className={`border-b ${borderColor} px-1`}>
                      {term("s2_2", value("s2") ** 2)}
                    </span>
                    <span>{term("n2", value("n2"))}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center">
                <span className="mr-1">
                  {term("sp", Math.sqrt(value("pooledVar")))}
                </span>
                <div className="flex items-start">
                  <span className="text-2xl -mr-0.5 leading-none">√</span>
                  <div
                    className={`border-t-2 pt-1.5 ${borderColor} flex items-center gap-2 px-1`}
                  >
                    <div className="flex flex-col items-center">
                      <span className={`border-b ${borderColor} px-1`}>1</span>
                      <span>{term("n1", value("n1"))}</span>
                    </div>
                    <span className="font-bold">+</span>
                    <div className="flex flex-col items-center">
                      <span className={`border-b ${borderColor} px-1`}>1</span>
                      <span>{term("n2", value("n2"))}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          {!isWelch && (
            <div
              className={`text-[9px] font-serif ${labelColor} mt-2 flex items-center gap-2`}
            >
              {term("sp2", value("pooledVar"))}
              <span>=</span>
              <div className="flex flex-col items-center">
                <span className={`border-b ${borderColor} px-2`}>
                  ({term("n1", value("n1"))}-1){term("s1_2", value("s1") ** 2)}{" "}
                  + ({term("n2", value("n2"))}-1)
                  {term("s2_2", value("s2") ** 2)}
                </span>
                <span>
                  {term("n1", value("n1"))} + {term("n2", value("n2"))} - 2
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
  if (type === "t_paired")
    return (
      <div className="flex flex-col items-center">
        <div
          className={`flex items-center text-xl md:text-2xl font-serif ${textColor}`}
        >
          <span className="font-bold mr-3 italic">t</span>
          <span className="mr-3">=</span>
          <div className="flex flex-col items-center">
            <div
              className={`border-b-2 px-2 pb-1 mb-1 w-full text-center ${borderColor}`}
            >
              {term("dBar", value("dBar"))}
            </div>
            <div className="pt-1">{term("SE_paired", value("se"))}</div>
          </div>
        </div>
        <div
          className={`mt-3 pt-3 border-t border-dashed ${darkMode ? "border-slate-700" : "border-slate-200"} w-full flex flex-col items-center gap-2`}
        >
          <div
            className={`text-[9px] font-black uppercase tracking-widest ${labelColor}`}
          >
            Standard Error of Differences
          </div>
          <div
            className={`flex items-center text-sm md:text-base font-serif ${textColor}`}
          >
            <span>{term("SE_paired", value("se"))}</span>
            <span className="mx-2">=</span>
            <div className="flex flex-col items-center">
              <span className={`border-b ${borderColor} px-1`}>
                {term("sd_diff", value("sd"))}
              </span>
              <div className="flex items-center">
                <span className="text-xs mr-1">√</span>
                <span>{term("n_pairs", value("n"))}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  return (
    <div className="flex flex-col items-center">
      <div
        className={`flex items-center text-xl md:text-2xl font-serif ${textColor}`}
      >
        <span className="font-bold mr-3 italic">t</span>
        <span className="mr-3">=</span>
        <div className="flex flex-col items-center">
          <div
            className={`border-b-2 px-2 pb-1 mb-1 w-full text-center ${borderColor}`}
          >
            ({term("x̄", value("xBar"))} - {term("mu", value("mu"))})
          </div>
          <div className="pt-1">{term("SEt", value("se"))}</div>
        </div>
      </div>
      <div
        className={`mt-2 text-[10px] uppercase tracking-widest font-bold ${labelColor}`}
      >
        with {term("df", value("df"))} degrees of freedom
      </div>
    </div>
  );
};

export default TTestFormulaDisplay;
