import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import FormulaDisplay from "../FormulaDisplay";

const baseStats = {
  xBar: 10,
  mu: 8,
  n: 20,
  se: 0.5,
  df: 19,
  x1: 12,
  x2: 10,
  s1: 2,
  s2: 3,
  n1: 20,
  n2: 18,
  pooledVar: 6,
  dBar: 2,
  sd: 1.5,
  msB: 8,
  msW: 2,
  ssB: 16,
  ssW: 36,
  ssT: 52,
  dfB: 2,
  dfW: 18,
  eta2: 0.31,
  b_w: 0.6,
};

const factorialEffects = {
  A: { label: "Factor A", ss: 10, df: 1, ms: 10, pes: 0.25 },
  B: { label: "Factor B", ss: 6, df: 1, ms: 6, pes: 0.17 },
  AxB: { label: "Interaction", ss: 4, df: 1, ms: 4, pes: 0.12 },
  Error: { ss: 30, df: 20, ms: 1.5 },
  Total: { ss: 50, df: 23 },
};

const renderFormula = (type, stats = baseStats) =>
  renderToStaticMarkup(
    <FormulaDisplay
      type={type}
      darkMode={false}
      showValues
      stats={stats}
      onInfo={() => {}}
      onHover={() => {}}
    />,
  );

describe("FormulaDisplay", () => {
  it("renders every supported formula family", () => {
    const types = [
      "mean",
      "sd",
      "range",
      "variability",
      "frequency",
      "probability_rules",
      "percentage",
      "z_test",
      "correlation",
      "regression",
      "t_indep",
      "t_paired",
      "t_onesample",
      "anova",
      "factorial_anova",
      "ancova",
    ];

    types.forEach((type) => {
      const stats =
        type === "factorial_anova"
          ? {
              ...baseStats,
              expandedEffect: "AxB",
              effects: factorialEffects,
              ssType: "I",
              isBalanced: true,
            }
          : baseStats;
      expect(renderFormula(type, stats)).not.toContain("Formula not rendered");
    });
  });

  it("renders variability notation without encoding artifacts", () => {
    const markup = renderFormula("variability", {
      ...baseStats,
      mean: 10,
      sampleVariance: 4,
      sampleSd: 2,
      range: 8,
      min: 6,
      max: 14,
      q1: 8,
      q3: 12,
      iqr: 4,
      median: 10,
      mad: 2,
      coefficientOfVariation: 20,
    });

    expect(markup).toContain("Σ");
    expect(markup).toContain("√");
    expect(markup).toContain("−");
    expect(markup).not.toMatch(/â|Ã|Î/);
  });

  it("labels pooled and Welch independent-test standard errors", () => {
    expect(
      renderFormula("t_indep", { ...baseStats, testType: "student" }),
    ).toContain("Pooled");
    expect(
      renderFormula("t_indep", { ...baseStats, testType: "welch" }),
    ).toContain("Unpooled");
  });

  it("does not present unbalanced Type III sums of squares as an additive partition", () => {
    const typeThree = renderFormula("factorial_anova", {
      ...baseStats,
      expandedEffect: "A",
      effects: factorialEffects,
      ssType: "III",
      isBalanced: false,
    });
    const balanced = renderFormula("factorial_anova", {
      ...baseStats,
      expandedEffect: "A",
      effects: factorialEffects,
      ssType: "III",
      isBalanced: true,
    });

    expect(typeThree).toContain("not additive parts of SS total");
    expect(balanced).toContain("partitioned into main effects");
  });

  it("shows a clear fallback for unsupported formula identifiers", () => {
    expect(renderFormula("unknown")).toContain("Formula not rendered");
  });
});
