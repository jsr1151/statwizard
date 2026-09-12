# Rank-test calculator validation

Implemented September 12, 2026. Entry points: `#/wizard/res_mann_whitney/calculator` and `#/wizard/res_wilcoxon/calculator`.

## Model contract

- Mann–Whitney reports U for both samples. U_A counts A greater than B, adding half for ties. Its rank-biserial effect is `2 U_A / (n_A n_B) − 1`.
- Signed-rank reports W+ and W− for `A − B`, omits zero differences before ranking (Wilcox convention), and reports `(W+ − W−)/(W+ + W−)`. Missing pairs are removed together; unequal input lengths are rejected.
- Auto selects exact conditional inference at no more than 40 pooled observations or 50 nonzero pairs. Above these limits it uses a tie-adjusted normal approximation. Users can explicitly choose either method; oversized exact requests are rejected.
- Exact inference counts label assignments or sign assignments using doubled average ranks. Ties remain in the conditional distribution. Two-sided p-values double the smaller inclusive tail, capped at one. No simulation, random seed, or mid-p adjustment is involved.
- The normal approximation uses an optional 0.5 continuity correction, enabled by default. P-value accuracy uses the existing shared normal CDF; tests allow absolute error below `2e-7` relative to R.
- Decimal rounding of paired differences is optional and recorded. No rounding happens silently. All-zero differences produce an explanatory error instead of a fabricated result; all-tied independent samples return p = 1 with an explicit warning.

These choices align with the distinction between exact, asymptotic, and permutation inference described by [SciPy's Mann–Whitney reference](https://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.mannwhitneyu.html) and its [signed-rank reference](https://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.wilcoxon.html). Our Auto size thresholds and the handling of tied exact distributions are explicit application choices; do not assume they match another package's defaults.

## Independent evidence

[45 committed reference cases](../src/stats/fixtures/nonparametric-r.json) were generated with R 4.5.0 `stats::wilcox.test`. They cover all alternatives, exact inference without ties, unequal sample sizes, normal inference with and without continuity correction, tied ranks, and paired zero differences. Regenerate them from the repository root with:

```text
Rscript scripts/generate-rank-fixtures.R
```

The [generator](../scripts/generate-rank-fixtures.R) uses base R only. R is a validation tool, not a browser/runtime dependency. The [R reference](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/wilcox.test.html) explains the reported statistics and inference options. R-version differences in tied exact inference are documented in the app's Software section.

[Engine tests](../src/stats/__tests__/nonparametric.test.js) independently enumerate every group assignment or sign pattern for small tied cases, using pairwise comparisons to check the dynamic-programming result. Additional tests cover missing positions, invalid/nonfinite values, precision, exact limits, reversed groups, and degenerate data. [Workflow tests](../src/components/analysis/__tests__/RankTestPage.test.jsx) cover explicit sample selection, clearing stale output, exclusions, settings, result focus, and saved launches under React Strict Mode.

## Current boundaries

Maximum input is 10,000 entries per sample. The rank table displays the first 100 retained rows while inference includes all retained observations. Ordered scores must have meaningful order; paired differences also need meaningful magnitudes. Pair matching is by input position or saved row, not participant-ID matching across separate tables. No location-shift confidence intervals, power calculation, multiplicity correction, clustered models, or repeated-measures ANOVA are supplied by these calculators.
