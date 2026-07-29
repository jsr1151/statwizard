import React, { useState } from "react";
import { MATH_TERMS } from "../../data/mathTerms";
import MathTerm from "../common/MathTerm";
import FormulaSigma from "./FormulaSigma";

const AnovaFormulaDisplay = ({
  onInfo,
  onHover,
  darkMode,
  showValues,
  stats,
}) => {
  const [withinFormula, setWithinFormula] = useState("raw");
  const borderColor = darkMode ? "border-slate-700" : "border-slate-800";
  const labelColor = darkMode ? "text-slate-500" : "text-slate-400";
  const textColor = darkMode ? "text-slate-200" : "text-slate-800";
  const panelColor = darkMode
    ? "bg-slate-900/40 border-slate-800"
    : "bg-slate-50 border-slate-100";
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
  const sigma = (top, bottom, tooltipTerm, className = "") => (
    <FormulaSigma
      top={top}
      bottom={bottom}
      tooltipTerm={tooltipTerm}
      className={className}
      renderTerm={term}
    />
  );
  const hoverProps = (name) => ({
    onMouseEnter: () => onHover?.(name),
    onMouseLeave: () => onHover?.(null),
  });
  const groupStats = value("groupStats") || [];
  const grandMean = value("grandMean") || 0;

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-full overflow-hidden px-1">
      <div
        className="flex flex-col items-center w-full group cursor-help"
        {...hoverProps("f_ratio")}
      >
        <div
          className={`text-[10px] font-black uppercase tracking-widest ${labelColor} mb-1`}
        >
          The F-Ratio
        </div>
        <div
          className={`flex items-center text-2xl md:text-4xl font-serif ${textColor} whitespace-nowrap`}
        >
          <span className="font-bold mr-3 italic">F</span>
          <span className="mr-3">=</span>
          <div className="flex flex-col items-center">
            <div
              className={`border-b-2 px-4 pb-1 mb-1 w-full text-center ${borderColor}`}
            >
              {term("MS_between", value("msB"))}
            </div>
            <div className="pt-1 px-4">{term("MS_error", value("msW"))}</div>
          </div>
        </div>
      </div>

      <div
        className={`w-full flex flex-col gap-6 border-t border-dashed ${darkMode ? "border-slate-800" : "border-slate-200"} pt-6 overflow-visible`}
      >
        <div className="ms-grid">
          <div
            className={`p-5 rounded-2xl border ${panelColor} flex flex-col items-center gap-2 min-w-0 cursor-link`}
            {...hoverProps("ms_between")}
          >
            <div
              className={`text-[9px] font-black uppercase tracking-widest ${labelColor}`}
            >
              Mean Square Between
            </div>
            <p
              className={`text-[10px] ${labelColor} text-center leading-tight mb-2 max-w-[220px]`}
            >
              Turns SS between into an average by dividing by its degrees of
              freedom. MS between estimates variation due to group differences.
            </p>
            <div
              className={`flex flex-col items-center font-serif ${textColor} whitespace-nowrap`}
            >
              <div className="flex items-center gap-2">
                <span>{term("MS_between", value("msB"))}</span>
                <span className="opacity-50">=</span>
                <div className="flex flex-col items-center">
                  <span className={`border-b ${borderColor} px-3`}>
                    {term("SS_between", value("ssB"))}
                  </span>
                  <span>{term("df_between", value("dfB"))}</span>
                </div>
              </div>
              <div className={`mt-2 text-[0.6em] ${labelColor} italic`}>
                {term("df_between", value("dfB"))} = {term("k")} - 1
              </div>
            </div>
          </div>
          <div
            className={`p-5 rounded-2xl border ${panelColor} flex flex-col items-center gap-2 min-w-0 cursor-link`}
            {...hoverProps("ms_within")}
          >
            <div
              className={`text-[9px] font-black uppercase tracking-widest ${labelColor}`}
            >
              Mean Square Error (Residual)
            </div>
            <p
              className={`text-[10px] ${labelColor} text-center leading-tight mb-2 max-w-[220px]`}
            >
              Turns SS error into an average by dividing by its degrees of
              freedom. MS error estimates the typical unexplained variability.
            </p>
            <div
              className={`flex flex-col items-center font-serif ${textColor} whitespace-nowrap`}
            >
              <div className="flex items-center gap-2">
                <span>{term("MS_error", value("msW"))}</span>
                <span className="opacity-50">=</span>
                <div className="flex flex-col items-center">
                  <span className={`border-b ${borderColor} px-3`}>
                    {term("SS_error", value("ssW"))}
                  </span>
                  <span>{term("df_error", value("dfW"))}</span>
                </div>
              </div>
              <div
                className={`mt-2 text-[0.6em] ${labelColor} italic flex flex-col items-center`}
              >
                <span>
                  {term("df_error", value("dfW"))} = {term("N")} - {term("k")}
                </span>
                <span>
                  {term("N")} = {sigma("k", "j=1", "Sigma_k", "scale-75")}{" "}
                  {term("nj")} = total sample size
                </span>
              </div>
            </div>
          </div>
        </div>

        <div
          className={`p-5 rounded-2xl border ${darkMode ? "bg-slate-900/20 border-slate-800" : "bg-white border-slate-100"} flex flex-col gap-4`}
        >
          <div
            className="flex flex-col items-center gap-2 p-2 cursor-link"
            {...hoverProps("ss_between")}
          >
            <div
              className={`text-[9px] font-black uppercase tracking-widest ${labelColor}`}
            >
              SS Between (Signal)
            </div>
            <p
              className={`text-[11px] ${labelColor} text-center leading-tight max-w-lg`}
            >
              Adds how far each group mean is from the grand mean, weighted by
              the group&apos;s size. Larger gaps between group means create
              larger SS between.
              <span className="italic mt-1 block">
                Think: &quot;How separated are the group averages?&quot;
              </span>
            </p>
            <div
              className={`font-serif ${textColor} flex items-center whitespace-nowrap`}
            >
              {term("SS_between", value("ssB"))}
              <span className="mx-2 opacity-50">=</span>
              {sigma("k", "j=1", "Sigma_k")}
              <span>
                {term("nj")}
                <span title={MATH_TERMS.Square?.desc}>
                  ({term("x̄j")} - {term("x̄_grand")})²
                </span>
              </span>
            </div>
            <div
              className={`text-[10px] font-bold ${darkMode ? "text-emerald-500/80" : "text-emerald-600/80"} uppercase`}
            >
              Increases when group means separate.
            </div>
          </div>
          <div className="border-t border-slate-800/10 dark:border-slate-100/10" />
          <div
            className="flex flex-col items-center gap-2 p-2 cursor-link"
            {...hoverProps("ss_within")}
          >
            <div
              className={`text-[9px] font-black uppercase tracking-widest ${labelColor}`}
            >
              SS Within (Noise)
            </div>
            <p
              className={`text-[11px] ${labelColor} text-center leading-tight max-w-lg`}
            >
              Adds how far each score is from its own group mean. More spread
              inside groups creates larger SS within.
            </p>
            <div className="flex p-1 bg-slate-500/10 rounded-lg">
              <button
                type="button"
                onClick={() => setWithinFormula("raw")}
                className={`px-3 py-1 text-[10px] font-bold rounded-md ${withinFormula === "raw" ? "bg-indigo-600 text-white" : labelColor}`}
              >
                Raw data
              </button>
              <button
                type="button"
                onClick={() => setWithinFormula("stats")}
                className={`px-3 py-1 text-[10px] font-bold rounded-md ${withinFormula === "stats" ? "bg-indigo-600 text-white" : labelColor}`}
              >
                Summary stats
              </button>
            </div>
            {withinFormula === "raw" ? (
              <div
                className={`font-serif ${textColor} flex items-center whitespace-nowrap`}
              >
                {term("SS_within", value("ssW"))}
                <span className="mx-2 opacity-50">=</span>
                {sigma("k", "j=1", "Sigma_k")}
                {sigma("nⱼ", "i=1", "Sigma_nj")}
                <span title={MATH_TERMS.Square?.desc}>
                  ({term("xij")} - {term("x̄j")})²
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <div className={`text-[9px] italic ${labelColor}`}>
                  Computed from each group&apos;s variance:
                </div>
                <div
                  className={`font-serif ${textColor} flex items-center whitespace-nowrap`}
                >
                  {term("SS_within", value("ssW"))}
                  <span className="mx-2 opacity-50">=</span>
                  {sigma("k", "j=1", "Sigma_k")}
                  <span>
                    ({term("nj")} - 1){term("sj2")}
                  </span>
                </div>
              </div>
            )}
            <div
              className={`text-[10px] font-bold ${darkMode ? "text-amber-500/80" : "text-amber-600/80"} uppercase`}
            >
              Increases when points spread within groups.
            </div>
          </div>
        </div>

        {showValues && groupStats.length > 0 && (
          <div
            className={`p-4 rounded-2xl border-2 border-dashed ${darkMode ? "bg-indigo-500/5 border-indigo-500/20" : "bg-indigo-50 border-indigo-100"}`}
          >
            <div className="text-[8px] font-black uppercase tracking-widest text-indigo-500 mb-2 text-center">
              Worked Calculation: SS Between
            </div>
            <div
              className={`text-[11px] font-serif ${textColor} text-center leading-relaxed italic`}
            >
              SS<sub>between</sub> ={" "}
              {groupStats.map((group, index) => (
                <span key={group.id || index}>
                  {index > 0 && " + "}
                  <span className="font-bold">{group.n}</span>(
                  <span className="text-indigo-400">
                    {group.mean.toFixed(2)}
                  </span>{" "}
                  -{" "}
                  <span className="text-amber-500">{grandMean.toFixed(2)}</span>
                  )²
                </span>
              ))}
              <span className="ml-2 font-bold text-indigo-500">
                = {value("ssB")?.toFixed(2)}
              </span>
            </div>
          </div>
        )}

        <div
          className={`p-5 rounded-2xl border ${darkMode ? "bg-slate-950/50 border-slate-800" : "bg-zinc-50 border-slate-100"} flex flex-col items-center gap-2 cursor-link`}
          {...hoverProps("ss_total")}
        >
          <div
            className={`text-[9px] font-black uppercase tracking-widest ${labelColor}`}
          >
            The SS Total identity
          </div>
          <p
            className={`text-[11px] ${labelColor} text-center leading-tight max-w-lg`}
          >
            Total variability equals variation explained by group differences
            plus variation inside groups.
            <span className="italic mt-1 block">
              This identity is what makes ANOVA a variance-partitioning method.
            </span>
          </p>
          <div
            className={`font-serif ${textColor} flex items-center whitespace-nowrap`}
          >
            <span>{term("SS_total", value("ssT"))}</span>
            <span className="mx-3 opacity-50">=</span>
            <span>{term("SS_between", value("ssB"))}</span>
            <span className="mx-2 opacity-30">+</span>
            <span>{term("SS_within", value("ssW"))}</span>
          </div>
          <div className="text-[10px] font-bold text-indigo-500/80 uppercase">
            Total = explained (between) + unexplained (within)
          </div>
          <div
            className={`text-[10px] flex items-center font-serif ${labelColor} whitespace-nowrap`}
          >
            Formula: {term("SS_total", value("ssT"))} =
            {sigma("k", "j=1", "Sigma_k", "scale-75")}
            {sigma("nⱼ", "i=1", "Sigma_nj", "scale-75")}({term("xij")} -{" "}
            {term("x̄_grand")})²
          </div>
        </div>
        <div
          role="button"
          tabIndex={0}
          className={`p-5 rounded-2xl border flex flex-col items-center gap-2 ${darkMode ? "bg-indigo-500/5 border-indigo-500/20" : "bg-indigo-50 border-indigo-100"} cursor-link`}
          onClick={() => onInfo?.("eta2")}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") onInfo?.("eta2");
          }}
          {...hoverProps("eta_squared")}
        >
          <div className="text-[9px] font-black uppercase tracking-widest text-indigo-500">
            Effect Size (Eta Squared)
          </div>
          <p
            className={`text-[11px] ${labelColor} text-center leading-tight max-w-lg`}
          >
            Proportion of total variability accounted for by group differences.
            For example, eta squared = .30 means about 30% of the variance is
            associated with group membership.
          </p>
          <div
            className={`font-serif ${textColor} flex items-center whitespace-nowrap`}
          >
            {term("eta2", value("eta2"))}
            <span className="mx-4 opacity-50">=</span>
            <div className="flex flex-col items-center">
              <span className={`border-b-2 ${borderColor} px-4`}>
                {term("SS_between", value("ssB"))}
              </span>
              <span>{term("SS_total", value("ssT"))}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnovaFormulaDisplay;
