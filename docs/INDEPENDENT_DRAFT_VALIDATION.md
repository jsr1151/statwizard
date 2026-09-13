# Independent-samples t-test calculator recovery

Implemented September 12, 2026, following the [site audit](SITE_AUDIT_2026-09-11.md).

## Recovery and source behavior

The independent-samples calculator now has a dedicated input/results component. A versioned browser-local draft saves both groups' raw and summary inputs, labels, input mode, active source, saved dataset reference, per-dataset outcome/grouping choices and group order, pooled/Welch method, alpha, alternative, and confidence interval type/direction. Results are recalculated from recovered inputs. Raw and summary values remain separate across input modes and section/source changes.

Saved values follow the current dataset library, including edits that leave the row count unchanged. They are read-only in the calculator. **Edit a copy** opens the currently ordered usable values and labels as a manual raw draft; returning to saved data retains its current values and group order. **Swap groups** reverses both groups together. The alternative remains unchanged, with visible explanation of the resulting Group 1 minus Group 2 comparison. Saved order is remembered separately for each dataset.

Edits save immediately. Mounting and calculations do not write storage. Fresh Data Manager launches take priority over old drafts and open with default inference settings and group order; the next edit replaces the previous draft. Missing datasets and cleared, missing, or changed-type variables block results. Removing the draft requires confirmation, restores focus, leaves current input open, and affects only this calculator. Failed writes/deletion preserve the previous draft and display a status message. Incompatible drafts fall back without overwriting storage. Drafts over 250,000 serialized characters are not saved automatically.

## Inference and reporting

Each raw group uses strict finite-number parsing and reports its own usable/excluded entries. Empty separators are ignored; partial numbers are excluded. Group sizes may differ because these are independent samples. Means and sample SDs retain full precision. Blank, negative SD, fractional/insufficient sample size, and unsupported numeric ranges block calculation. A constant group is supported when the other provides a positive standard error; two constant groups block inference.

The calculator uses the existing pooled and Welch inference functions, with fractional Welch degrees of freedom and p-value-based significance decisions. The null difference is zero. Directional confidence bounds have explicit direction when the alternative is two-sided. Cohen's d and Hedges' g are labeled as absolute magnitudes using pooled SD standardization; the signed mean difference communicates direction.

Results include group summaries, a compact phone metric layout, an accessible null-distribution plot, a focus shortcut, and a copyable report. The report names the method, source, group order, hypothesis, settings, exclusions, and analyzed raw values. Clipboard failure offers selectable report text. The null plot is shared with the one-sample calculator; lesson, power, and effect-size workflows remain separate.

## Validation

- Eight independent base R 4.5.0 `stats::t.test` cases cover pooled and Welch tests, fractional degrees of freedom, unequal sample sizes/variances, negative and small-scale differences, small samples, one constant group, all supported alpha values, directional alternatives, and confidence interval choices. P-values agree within absolute tolerance 1e-7 and finite interval endpoints within 1e-6 for these cases. See [reference values](audits/2026-09-12/independent-reference.json) and the [R generator](../scripts/validation/independent-calculator-reference.R), which writes `.vite/independent-reference.csv` when run from the repository root.
- All 653 tests across 55 files passed. The 43 new tests cover those references, precision/exclusions, invalid and degenerate inputs, directional swapping, coherent Strict Mode recovery, independent raw/summary inputs, source/section changes, saved edits/order/copies, stale roles and missing datasets, per-dataset choices, fresh launches, bounds, removal/focus, storage failures, incompatible drafts, the size limit, and report-copy fallback.
- Lint, production build, documentation checks, all 30 independent power fixtures, and bundle checks passed. Initial JavaScript is 449,857 bytes / 132,285 bytes gzip, below the 140,000-byte gzip budget.

- Nineteen production-build Edge accessibility/overflow checks passed without application errors: recovered summary analyses at 1440px, 768px, and 375px in both themes; saved analyses at desktop and phone widths in both themes; and phone views for raw exclusions, swapped groups, copy fallback, empty groups, fractional sample size, removal confirmation, failed saving, edited copies, and cleared saved outcome. Browser workflows verified coherent reloads, group order, source switching, Data Manager priority, read-only saved values, independent copies, results focus, and removal. See [browser evidence](audits/2026-09-12/independent-drafts.json).

## Remaining scope

Paired t-test and ANOVA draft recovery remain open, along with report/export consistency and manual-input exclusion review elsewhere. Descriptive drafts still save input/source information only. Drafts stay in the current browser/device; clearing site data removes them, and multiple tabs are not synchronized. This increment does not independently validate every statistical engine or the legacy lesson visualizer, and automated accessibility checks do not establish full screen-reader conformance.
