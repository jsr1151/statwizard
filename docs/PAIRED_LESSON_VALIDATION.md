# Paired lesson inference and report parity

Implemented September 12, 2026, following the [paired calculator recovery](PAIRED_DRAFT_VALIDATION.md) and [site audit](SITE_AUDIT_2026-09-11.md).

## Shared inference and reporting

The paired lesson now uses the same validated calculation as the calculator. It no longer computes intervals with a fixed 1.96 multiplier or labels every report 95%. Confidence levels, Student t degrees of freedom, directional alternatives, one-sided bounds, effect-size standardization, and comparison order come from the current result. Both surfaces use a shared report builder and interval formatter. Reports for identical inputs differ only in source attribution.

Blank means/correlation, negative SDs, fractional or insufficient pair counts, out-of-range correlations, and constant differences remain editable and block inference, plots, reports, and tutor output. Correcting the inputs resumes calculation. One-sided bound direction is explicit for two-sided tests. The lesson's copy action uses the common clipboard fallback and clears stale feedback after input changes.

## Coherent teaching inputs and plots

The lesson offers editable summary inputs and an explicit set of read-only example pairs. Each source keeps its own comparison order, and swaps retain the selected alternative. Summary-based means, sample sizes, and correlations determine the statistical result; unrelated example rows are never substituted into their plots. Individual paired/difference views explain that observations cannot be reconstructed from summaries and direct learners to Example pairs. The Calculator tab remains the entry point for their own data.

Sampling, difference, paired, and plot-maker views remain available. Mean bars and mean-trend lines follow the current summaries; paired lines and difference dots use the same complete example pairs as inference. Mean-line differences consistently use Condition 1 minus Condition 2. Error-bar descriptions distinguish each condition's SD/SE from a confidence interval for the paired difference. Plot types, colors, grid visibility, axis labels, and limits have labeled controls. Custom ranges validate before rendering and clip marks without changing the analysis; custom labels survive plot-type changes. Reset plot and Reset lesson have separate scopes.

Plots have accessible titles/descriptions and controls expose selected states. Tutor responses still follow swaps and correlation changes. Instructions now reference supported mean controls and explicit example-pair views. Lesson edits and reset never write or remove the calculator draft. The previous 528-line lesson component is replaced by a small orchestration component, separate input/plot controls, shared inference/reporting, and the existing plot renderer.

## Validation

- All 733 tests across 58 files passed. Twenty-three new lesson cases cover eight independent R reference cases through the actual lesson controls, shared report parity, selected confidence/bounds, invalid inputs, constant differences, swaps, tutor responses, coherent example-pair/summary views, error-bar descriptions, plot range/label/reset behavior, clipboard failure/stale feedback, and calculator-draft isolation. Existing paired calculation and recovery tests also pass.
- The R comparisons use [the existing independent paired references](audits/2026-09-12/paired-reference.json): p-values agree within absolute tolerance 1e-7 and finite interval endpoints within 1e-6 for these cases.
- Lint, production build, documentation checks, all 30 independent power fixtures, and bundle checks passed. Initial JavaScript is 450,072 bytes / 132,369 bytes gzip, below the 140,000-byte gzip budget.
- Twenty production-build Edge accessibility/overflow checks passed without application errors: summary inference at 1440px, 768px, and 375px in both themes; actual paired observations at desktop and phone widths in both themes; phone summary bars in both themes; and phone states for copying, blank correlation, constant differences, unavailable individual observations, invalid/cropped axes, example differences, and recovered calculator-report parity. Workflows also verified condition swaps, plot controls, source consistency, and unchanged calculator storage. See [browser evidence](audits/2026-09-12/paired-lesson.json).

## Remaining scope

ANOVA draft recovery, report/export consistency elsewhere, and broader manual-input exclusion review remain open. Lesson, power, and effect-size settings remain outside calculator draft recovery. This work does not independently validate every statistical engine, every tutor explanation, or complete screen-reader conformance.
