import React from "react";
import AncovaFormulaDisplay from "./AncovaFormulaDisplay";
import AnovaFormulaDisplay from "./AnovaFormulaDisplay";
import FactorialAnovaFormulaDisplay from "./FactorialAnovaFormulaDisplay";
import SimpleFormulaDisplay from "./SimpleFormulaDisplay";
import TTestFormulaDisplay from "./TTestFormulaDisplay";

const SIMPLE_FORMULAS = new Set([
  "mean",
  "sd",
  "range",
  "percentage",
  "z_test",
  "correlation",
  "regression",
]);
const T_TEST_FORMULAS = new Set(["t_indep", "t_paired", "t_onesample"]);

const FormulaDisplay = (props) => {
  if (SIMPLE_FORMULAS.has(props.type))
    return <SimpleFormulaDisplay {...props} />;
  if (T_TEST_FORMULAS.has(props.type))
    return <TTestFormulaDisplay {...props} />;
  if (props.type === "anova") return <AnovaFormulaDisplay {...props} />;
  if (props.type === "factorial_anova")
    return <FactorialAnovaFormulaDisplay {...props} />;
  if (props.type === "ancova") return <AncovaFormulaDisplay {...props} />;
  return <div className="text-slate-500">Formula not rendered</div>;
};

export default FormulaDisplay;
