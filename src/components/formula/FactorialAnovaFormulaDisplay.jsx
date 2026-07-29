import React from "react";
import MathTerm from "../common/MathTerm";

const EFFECT_TERMS = {
  A: { ms: "MS_A", df: "df_A", ss: "SS_A", dfFormula: "a - 1" },
  B: { ms: "MS_B", df: "df_B", ss: "SS_B", dfFormula: "b - 1" },
  AxB: {
    ms: "MS_AxB",
    df: "df_AxB",
    ss: "SS_AxB",
    dfFormula: "(a - 1)(b - 1)",
  },
};

const FactorialAnovaFormulaDisplay = ({
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
  const effectKey = stats?.expandedEffect || "AxB";
  const effects = stats?.effects || {};
  const effect = effects[effectKey] || {};
  const error = effects.Error || {};
  const total = effects.Total || {};
  const names = EFFECT_TERMS[effectKey] || EFFECT_TERMS.AxB;
  const partitionsTotal = stats?.ssType === "I" || Boolean(stats?.isBalanced);
  const hoverProps = (name) => ({
    onMouseEnter: () => onHover?.(name),
    onMouseLeave: () => onHover?.(null),
  });

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-full overflow-visible px-2 pb-4">
      <div
        className="flex flex-col items-center w-full cursor-help"
        {...hoverProps("f_ratio")}
      >
        <div
          className={`text-[10px] font-black uppercase tracking-widest ${labelColor} mb-1 flex items-center justify-between w-full max-w-sm`}
        >
          <span>The F-Ratio</span>
          <span className="text-indigo-500 bg-indigo-500/10 px-2 rounded-full py-0.5">
            Showing: {effect.label || "Interaction"}
          </span>
        </div>
        <div
          className={`flex items-center text-2xl md:text-3xl font-serif ${textColor} whitespace-nowrap bg-slate-500/5 p-4 rounded-2xl border ${borderColor} w-full max-w-sm justify-center`}
        >
          <span className="font-bold mr-3 italic">F</span>
          <span className="mr-3">=</span>
          <div className="flex flex-col items-center">
            <div
              className={`border-b-2 px-4 pb-1 w-full text-center ${borderColor}`}
            >
              {term(names.ms, effect.ms)}
            </div>
            <div className="pt-1 px-4">{term("MS_error", error.ms)}</div>
          </div>
        </div>
      </div>

      <div
        className={`w-full flex flex-col gap-6 border-t border-dashed ${darkMode ? "border-slate-800" : "border-slate-200"} pt-6`}
      >
        <div className="grid md:grid-cols-2 gap-4">
          <div
            className={`p-5 rounded-2xl border flex flex-col items-center gap-2 ${darkMode ? "bg-indigo-900/10 border-indigo-500/20" : "bg-indigo-50/50 border-indigo-200"}`}
          >
            <div className="text-[9px] font-black uppercase tracking-widest text-indigo-500">
              Mean Square ({effect.label || "Effect"})
            </div>
            <p className={`text-[10px] ${labelColor} text-center`}>
              Estimates variation due to{" "}
              <span className="font-bold text-indigo-400">
                {effect.label || "the selected effect"}
              </span>
              .
            </p>
            <div
              className={`flex flex-col items-center font-serif ${textColor} whitespace-nowrap`}
            >
              <div className="flex items-center gap-2">
                <span>{term(names.ms, effect.ms)}</span>
                <span className="opacity-50">=</span>
                <div className="flex flex-col items-center">
                  <span className={`border-b ${borderColor} px-3`}>
                    {term(names.ss, effect.ss)}
                  </span>
                  <span>{term(names.df, effect.df)}</span>
                </div>
              </div>
              <div className={`mt-2 text-[0.6em] ${labelColor} italic`}>
                {term(names.df, effect.df)} = {names.dfFormula}
              </div>
            </div>
          </div>
          <div
            className={`p-5 rounded-2xl border ${darkMode ? "bg-slate-900/40 border-slate-800" : "bg-slate-50 border-slate-100"} flex flex-col items-center gap-2`}
          >
            <div
              className={`text-[9px] font-black uppercase tracking-widest ${labelColor}`}
            >
              Mean Square Error (Residual)
            </div>
            <p className={`text-[10px] ${labelColor} text-center`}>
              Estimates typical unexplained variability.
            </p>
            <div
              className={`flex flex-col items-center font-serif ${textColor} whitespace-nowrap`}
            >
              <div className="flex items-center gap-2">
                <span>{term("MS_error", error.ms)}</span>
                <span className="opacity-50">=</span>
                <div className="flex flex-col items-center">
                  <span className={`border-b ${borderColor} px-3`}>
                    {term("SS_error", error.ss)}
                  </span>
                  <span>{term("df_error", error.df)}</span>
                </div>
              </div>
              <div
                className={`mt-2 text-[0.6em] ${labelColor} italic text-center`}
              >
                {term("df_error", error.df)} = N - (a × b)
                <br />
                (requires all cells populated)
              </div>
            </div>
          </div>
        </div>

        <div
          className={`p-5 rounded-2xl border ${darkMode ? "bg-slate-950/50 border-slate-800" : "bg-zinc-50 border-slate-100"} flex flex-col items-center gap-2`}
        >
          <div
            className={`text-[9px] font-black uppercase tracking-widest ${labelColor} text-center`}
          >
            {partitionsTotal
              ? "The SS Total identity for Factorial ANOVA"
              : "Type III sums of squares"}
          </div>
          <p className={`text-[11px] ${labelColor} text-center leading-tight`}>
            {partitionsTotal
              ? "Total variability is partitioned into main effects, interaction, and error."
              : "In an unbalanced Type III model, each effect is tested in the full model; effect sums of squares are not additive parts of SS total."}
          </p>
          <div
            className={`font-serif ${textColor} flex items-center justify-center min-w-max whitespace-nowrap px-6`}
          >
            {partitionsTotal ? (
              <>
                <span>{term("SS_total", total.ss)}</span>
                <span className="mx-2 opacity-50">=</span>
                <span>{term("SS_A", effects.A?.ss)}</span>
                <span className="mx-2 opacity-30">+</span>
                <span>{term("SS_B", effects.B?.ss)}</span>
                <span className="mx-2 opacity-30">+</span>
                <span>{term("SS_AxB", effects.AxB?.ss)}</span>
                <span className="mx-2 opacity-30">+</span>
                <span>{term("SS_error", error.ss)}</span>
              </>
            ) : (
              <>
                <span>{term("SS_A", effects.A?.ss)}</span>
                <span className="mx-2 opacity-30">;</span>
                <span>{term("SS_B", effects.B?.ss)}</span>
                <span className="mx-2 opacity-30">;</span>
                <span>{term("SS_AxB", effects.AxB?.ss)}</span>
              </>
            )}
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
            Partial Effect Size (Partial eta squared)
          </div>
          <p className={`text-[11px] ${labelColor} text-center`}>
            Proportion of variance associated with{" "}
            {effect.label || "the selected effect"}, after excluding other
            effects.
          </p>
          <div
            className={`font-serif ${textColor} flex items-center whitespace-nowrap`}
          >
            {term("eta2_partial", effect.pes)}
            <span className="mx-4 opacity-50">=</span>
            <div className="flex flex-col items-center">
              <span className={`border-b-2 ${borderColor} px-4`}>
                {term(names.ss, effect.ss)}
              </span>
              <span>
                {term(names.ss, effect.ss)} + {term("SS_error", error.ss)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FactorialAnovaFormulaDisplay;
