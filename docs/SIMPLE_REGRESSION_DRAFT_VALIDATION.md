# Simple regression draft recovery

Implemented September 12, 2026, following the [site audit](SITE_AUDIT_2026-09-11.md).

## Recovery contract

Simple linear regression saves a single versioned calculator draft in this browser. It includes the exact entered or uploaded table and source label, active source, saved dataset reference, variable choices for pasted and saved sources, confidence level, prediction input, and line/confidence-band/prediction-interval display settings. Invalid and empty input and explicitly cleared roles are retained. Results are recalculated from the recovered inputs.

Edits and completed uploads save immediately. Mounting, switching sections, and automatic result calculations do not write a draft. An untouched prediction input follows the current predictor mean; explicitly entered or cleared predictions are retained. A late upload cannot replace a newer table edit, example, or source switch, and a completed upload retains settings changed while the read was pending.

A fresh Data Manager launch takes precedence over an older draft and starts with default settings and the requested variable mapping. Its notice explains that the next edit replaces the previous draft. Merely opening the launch does not overwrite the previous draft. Saved datasets are references to the current library version, not snapshots. A missing dataset remains selected while the library loads and is never silently replaced with another dataset. Missing or no-longer-numeric selected variables block results until corrected.

Removal requires inline confirmation and leaves the current analysis open. Cancellation and successful removal return focus to the removal control. Reloading after removal opens the default example; subsequent edits create a new draft. Failed storage writes or deletion are reported without discarding the current analysis or previous saved draft. Malformed, incompatible, or invalid stored settings fall back to the example without being overwritten on mount. The serialized draft has a 250,000-character limit; oversized drafts remain usable but are not saved.

## Validation

- 534 tests across 49 files passed. New recovery coverage checks coherent reloads under React Strict Mode, exact unfinished input, cleared roles and predictions, uploaded sources, late reads, failed reads, delayed and missing saved datasets, removed variables, fresh-launch priority, confirmation/focus, failed writes/deletion, incompatible storage, and size limits. Existing simple/multiple regression, correlation, and shared saved-launch tests also pass.
- Lint, production build, documentation checks, all 30 independent power fixtures, and bundle checks passed. Initial JavaScript is 449,933 bytes / 132,288 bytes gzip, within the 140,000-byte gzip budget.
- Fourteen production-build Edge accessibility/overflow checks passed with no application errors: restored entered analyses at 1440px, 768px, and 375px in both themes; restored saved-data analyses at desktop and phone widths in both themes; and phone views for recovery details, removal confirmation, failed saving, and empty input. Browser workflows verified reloads, uploaded text/source, Data Manager priority, saved roles/settings, removal, failed-write recovery, and Enter activation of the removal control. [Browser evidence](audits/2026-09-12/simple-regression-drafts.json).

## Remaining scope

This extends recovery to the simple regression calculator only. Multiple regression, correlation, and t-test/ANOVA drafts remain open, as do consistent report exports. Descriptive calculators retain their existing input/source-only drafts. Lesson, power, effect-size, and highlighted-point choices are not saved by this feature.

Drafts stay in the current browser/device and disappear when site data is cleared. Multiple tabs are not synchronized; the last successful edit wins. This pass does not independently revalidate every statistical engine or establish complete screen-reader conformance.
