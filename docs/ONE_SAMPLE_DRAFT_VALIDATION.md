# One-sample t-test calculator and draft recovery

Implemented September 12, 2026, following the [site audit](SITE_AUDIT_2026-09-11.md).

## Recovery contract

The one-sample calculator now uses a dedicated input and results component. Its browser-local, versioned draft saves raw values and summary statistics separately, the active input mode and source label, saved dataset reference and per-dataset sample variable, null mean, significance level, alternative hypothesis, and confidence interval type/direction. Results are recalculated from the recovered inputs. Lesson, power, and effect-size settings remain outside this draft.

Current saved values are read-only in the calculator. They follow library edits even when the row count is unchanged. **Edit a copy** switches to manual raw input and creates a recoverable copy of the usable values without changing the library. Switching back to saved data uses the current library values; returning to manual input restores the copy. Missing datasets, unavailable sample variables, and explicitly cleared choices block calculation.

Edits save immediately; mounting, calculations, and section changes do not write storage. A fresh Data Manager launch takes priority over an older draft and uses default inference settings; the next edit replaces the old draft. Draft removal requires confirmation and leaves current inputs open. Failed saves/deletion preserve the previous draft and report the problem. Malformed or incompatible drafts fall back without overwriting storage. The serialized draft limit is 250,000 characters. Drafts stay in the current browser/device, disappear when site data is cleared, and do not synchronize across tabs.

## Calculation and reporting

Raw input accepts finite decimal/scientific numbers separated by commas, semicolons, spaces, or newlines. Empty separators are ignored. Invalid entries are excluded and disclosed, including when none of the entries are usable. Raw means and sample standard deviations retain full precision through inference. Blank or invalid summary/null inputs remain editable and suppress stale results. Sample size must be a whole number of at least two, and sample standard deviation must be positive.

The calculator uses the existing Student t inference functions. Its significance decision uses the computed p-value compared with alpha. Two-sided intervals and directional confidence bounds are supported, with explicit bound direction when the hypothesis is two-sided. Infinite endpoints are labeled. The null-distribution plot has an accessible description and discloses off-scale markers/boundaries. A results-focus shortcut and copyable report include source, sample statistics, hypothesis, inference settings, exclusions, and analyzed raw values; clipboard failure provides selectable report text.

## Validation

- All 610 tests across 53 files passed. The 39 new cases cover recovery under Strict Mode, raw precision/exclusions, invalid inputs, independent raw/summary drafts, current saved-data edits, manual copies, missing datasets and stale roles, per-dataset selection, fresh launch priority, atomic hypothesis updates, directional bounds, removal/focus, storage failures, incompatible drafts, size limits, and report-copy fallback.
- Eight independent cases generated with base R 4.5.0 `stats::t.test` cover small samples, positive/negative effects, all supported alpha values, directional tests, interval choices, and small-scale inputs. P-values agree within an absolute tolerance of 1e-7 and finite interval endpoints within 1e-6, tighter than the displayed precision for these cases. See the [reference values](audits/2026-09-12/one-sample-reference.json) and [R generator](../scripts/validation/one-sample-calculator-reference.R). From the repository root, run the generator with Rscript to write `.vite/one-sample-reference.csv`.
- Lint, production build, documentation checks, all 30 independent power fixtures, and bundle checks passed. Initial JavaScript is 449,801 bytes / 132,263 bytes gzip, below the 140,000-byte gzip budget.
- Seventeen production-build Edge accessibility/overflow checks passed without application errors: recovered summary analyses at 1440px, 768px, and 375px in both themes; saved analyses at desktop and phone widths in both themes; and phone views for raw exclusions, copy fallback, empty raw input, blank null mean, removal confirmation, failed saving, and an edited copy. Browser workflows verified reloads, source switching, Data Manager priority, read-only saved values, independent manual copies, results focus, and removal. See [browser evidence](audits/2026-09-12/one-sample-drafts.json).

## Remaining scope

Independent/paired t-tests and ANOVA still need equivalent draft recovery. Consistent report exports and manual-input exclusion review remain open across other calculators. Descriptive recovery still saves only input/source information. This increment does not revalidate every statistical engine or the legacy lesson visualizer, and automated accessibility checks do not establish complete screen-reader conformance.
