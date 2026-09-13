# Paired t-test calculator recovery and row matching

Implemented September 12, 2026, following the [site audit](SITE_AUDIT_2026-09-11.md).

## Pairing and recovery

The paired calculator now has a dedicated input/results component. Raw input takes one matched pair per line, with two finite numbers separated by a comma, tab, semicolon, or whitespace. Missing, invalid, or extra values exclude the entire row. Columns are never filtered independently or shifted to fill gaps. Blank lines are ignored, while exclusion details retain original line numbers. The first 100 exclusion details are shown; counts include every excluded row.

The browser-local, versioned draft stores exact raw text and a separate summary profile, each with its own condition labels, source, and comparison order. It also stores input mode, saved dataset reference and per-dataset paired variable choices, alpha, alternative, and confidence interval type/direction. Results are recalculated after recovery. Raw and summary profiles remain separate through mode, section, and source changes.

Saved data follows current library edits even when the row count is unchanged. Only complete pairs are shown, read-only, with saved-row exclusions above. **Edit a copy** creates a manual raw profile with the current usable pairs and labels, leaving saved data and the summary profile intact. **Swap conditions** reverses the active comparison and its labels in one update; the directional alternative stays unchanged. Raw swaps retain malformed/incomplete rows in place. Saved swaps persist the two variable IDs in their new order for that dataset.

Edits save immediately, while mounting and calculations do not write storage. Fresh Data Manager launches override older drafts with default settings and requested variable order; the next edit replaces the previous draft. Missing datasets and cleared, unavailable, duplicate, or changed-type variables block results. Removal requires confirmation, restores focus, leaves current input open, and affects only this calculator. Failed writes/deletion preserve the previous draft and display a status message. Incompatible drafts fall back without overwriting storage. Drafts over 250,000 serialized characters are not saved automatically.

## Inference and reports

Raw inference uses the full-precision within-row differences. Summary input requires both condition means and positive sample SDs, the number of complete pairs, and the within-pair correlation. A blank correlation is not converted to zero, and out-of-range correlations are not clamped. For two nonconstant pairs, the correlation must be -1 or 1. A constant condition is supported through raw input when differences vary; constant differences block inference.

The paired calculator reuses the validated one-sample t calculation on differences, with n - 1 degrees of freedom and Student t confidence bounds at the selected alpha. It no longer uses a fixed normal multiplier or labels every interval 95%. Cohen's dz is signed and standardized by the sample SD of differences. The null mean difference is zero, and comparison order is explicit in inputs and reports.

Results have a compact phone metric layout, an accessible null-distribution plot, a focus shortcut, and a copyable report containing source, condition order, complete-pair count, summaries, hypothesis/settings, exclusions, and analyzed pairs. Clipboard failure offers selectable report text. One-sided infinite endpoints are labeled explicitly.

## Validation

- All 710 tests across 57 files passed. The 57 new cases cover independent R references, missing/invalid/extra values, original line numbers, finite-number parsing, precision, raw/summary equivalence, swaps, incomplete/constant/overflowing differences, undefined correlation for a constant condition, detail limits, Strict Mode recovery, profile isolation, stale roles/missing datasets, current saved edits and copies, fresh launches, directional bounds, removal/focus, storage failures, incompatible drafts, size limits, and reports.
- Eight independent base R 4.5.0 `stats::t.test(paired = TRUE)` cases cover small samples, positive/negative differences, perfect and near-perfect correlations, small-scale inputs, all supported alpha values, directional tests, and interval choices. P-values agree within absolute tolerance 1e-7 and finite interval endpoints within 1e-6 for these cases. See [reference values](audits/2026-09-12/paired-reference.json) and the [R generator](../scripts/validation/paired-calculator-reference.R), which writes `.vite/paired-reference.csv` when run from the repository root.
- Lint, production build, documentation checks, all 30 independent power fixtures, and bundle checks passed. Initial JavaScript is 449,981 bytes / 132,329 bytes gzip, below the 140,000-byte gzip budget.

- Twenty production-build Edge accessibility/overflow checks passed without application errors: recovered raw analyses at 1440px, 768px, and 375px in both themes; recovered summaries at phone width in both themes; saved analyses at desktop and phone widths in both themes; and phone states for exclusion details, copy fallback, blank correlation, constant differences, removal confirmation, failed saving, edited copies, and cleared paired variables. Workflows verified coherent reloads, row matching, separate profile order, Data Manager priority, saved-data copies, results focus, and removal. See [browser evidence](audits/2026-09-12/paired-drafts.json).

## Remaining scope

The legacy paired lesson visualizer still has a simplified interval calculation and hardcoded confidence labels; migrate its inference/reporting to the shared calculation in a follow-up. This release replaces the calculator path only. Lesson, power, and effect-size settings are not saved. ANOVA draft recovery, broader report/export consistency, and manual-input exclusion review remain open. Descriptive drafts still save input/source information only.

Drafts stay in the current browser/device, disappear when site data is cleared, and do not synchronize across tabs. This increment does not independently validate every statistical engine or establish complete screen-reader conformance.
