# Repeated-measures ANOVA validation

Implemented September 12, 2026 at `#/wizard/res_rm_anova/calculator`.

## Supported model

One within-subject factor, 2–12 conditions, at least three complete participants, and at most 10,000 participants. The model partitions condition, participant, and within-participant error sums of squares. Its F denominator has `(n − 1)(k − 1)` degrees of freedom, not an independent-groups error term. Partial and generalized eta squared are reported with their denominators explained.

Wide data require unique participant IDs. Long data are matched by participant ID and condition label, regardless of row order. Duplicate participant–condition cells are rejected, including duplicates with missing measurements. Neither replicate averaging nor imputation is automatic. Missing IDs/condition labels and malformed numeric values are errors.

The UI initially requires complete measurements. If any participants are incomplete, their IDs and missing conditions are shown before the user can choose complete-participant exclusion. All condition summaries and tests then use the same retained participant set. Data Manager launches require explicit repeated-column selection; numeric metadata are not automatically treated as conditions.

## Corrections and diagnostic

Greenhouse–Geisser is the default reporting correction. Huynh–Feldt, uncorrected, and lower-bound rows remain visible. Epsilon scales both degrees of freedom while F remains fixed. GG is calculated from an orthonormal contrast covariance; HF is capped at one. For two conditions epsilon is one and sphericity is automatic. See [epsilon definitions](https://pingouin-stats.org/generated/pingouin.epsilon.html).

Mauchly W and its second-order approximate p-value are checked against R. A singular/nearly singular contrast covariance or insufficient participants produces an unavailable diagnostic, not a claim that sphericity holds. This does not automatically suppress an otherwise estimable GG-corrected F test. See the [R Mauchly reference](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/mauchly.test.html) and [R repeated-measures model comparison](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/anova.mlm.html).

## Independent references and regression checks

The [committed R fixtures](../src/stats/fixtures/repeated-measures-r.json) were generated with R 4.5.0 using `aov` with participant/condition error strata, `sphericity`, `mauchly.test`, and `pf`. Seven datasets cover 2, 3, 4, 6, and 12 conditions, heterogeneous variation, a worked example, and identical condition means. Regenerate from the repository root:

```text
Rscript scripts/generate-repeated-measures-fixtures.R
```

[Model tests](../src/stats/__tests__/repeatedMeasures.test.js) compare F, SS, both epsilon estimates, corrected p-values, Mauchly W/p, and effect sizes. They also check row/column permutations, translation/scaling, participant-offset invariance, the two-condition `F = paired t²` identity, singular covariance, missingness, duplicate IDs, malformed values, and degenerate measurements. [Data mapping tests](../src/utils/__tests__/repeatedMeasuresData.test.js) independently check long-format alignment and saved-column roles; [workflow tests](../src/components/analysis/__tests__/RepeatedMeasuresPage.test.jsx) cover reporting changes, explicit exclusions, stale-output clearing, and Strict Mode saved launches.

The F tail is evaluated directly through the complementary beta expression to avoid subtracting a CDF near one. The existing beta helper gained an optional precision argument; prior callers retain their defaults. This engine requests a tighter convergence tolerance and matches fixture p-values to nine decimal places.

## Boundaries

This is not a mixed model, factorial repeated-measures model, or covariate-adjusted model. Power planning remains explicitly unavailable. No pairwise tests, confidence intervals, or multiplicity correction are calculated. The matched-data table displays at most 50 retained participants; exclusion lists display at most 100 IDs, with full counts disclosed. Inference includes every retained participant within the stated limits. Small-sample diagnostic power and missing-data assumptions still require judgment.
