# Multiple regression draft recovery

Implemented September 12, 2026, following the [site audit](SITE_AUDIT_2026-09-11.md).

## Recovery contract

Multiple regression saves a separate, versioned browser-local draft containing the exact entered/uploaded table and source label, active source, saved dataset reference, outcome and predictor choices, confidence level, and prediction values. Pasted data and each saved dataset retain separate role selections and prediction profiles. Saved prediction values use column IDs, so renaming a variable preserves its prediction input. Results are recalculated from recovered data; saved references use the current library version.

Edits and completed uploads save immediately. Mounting, result calculations, and section changes do not write a draft. Fresh Data Manager launches take precedence over old drafts, start with default settings, and replace the previous draft on the next edit. A missing saved dataset stays selected while the library loads and is never replaced automatically with another dataset. Failed and late file reads preserve the current table; an upload finishing after a settings edit retains those settings.

Invalid and empty table input, explicitly cleared outcomes, and empty predictor selections survive reloads. Unavailable or no-longer-numeric selected variables block the model instead of silently fitting fewer predictors. Changing an outcome removes that variable from the predictor selection without adding replacement predictors. The explicit **Reset variable choices** action selects the last numeric column as outcome and up to three preceding numeric columns as predictors. **Load example data** restores the example, default pasted roles, and default pasted prediction inputs together.

Prediction values are no longer clamped to the observed range when confidence or model settings change. Out-of-range inputs retain the existing extrapolation warning. Blank prediction fields remain blank, suppress the prediction output, and show a completion message; the fitted model remains available. Untouched prediction inputs start at predictor means.

Draft removal requires confirmation and keeps the current analysis open. Cancellation and successful removal return focus to the removal control. Reloading after removal opens the example; another edit creates a new draft. Failed saves or deletion are visible and preserve the previous saved draft. Malformed, incompatible, or invalid drafts are ignored without being overwritten on mount. Drafts over 250,000 serialized characters remain usable but are not saved automatically.

## Validation

- 551 tests across 50 files passed. Seventeen new workflow cases cover coherent reloads under React Strict Mode, prediction extrapolation and blanks, cleared roles, invalid/empty input, separate dataset profiles, missing datasets, unavailable predictors, renamed columns, changed outcome types, launch priority, late/failed uploads, removal/focus, failed storage writes/deletion, incompatible storage, and the size limit. Existing simple-regression recovery and shared analysis tests also pass after extracting the common draft hook.
- Lint, production build, documentation checks, all 30 independent power fixtures, and bundle checks passed. Initial JavaScript is 449,678 bytes / 132,225 bytes gzip, below the 140,000-byte gzip budget.
- Fourteen production-build Edge accessibility/overflow checks passed without application errors: restored entered analyses at 1440px, 768px, and 375px in both themes; restored saved analyses at desktop and phone widths in both themes; and phone views for scope details, removal confirmation, blank prediction input, and failed saving. Browser workflows checked reloads, uploads, fresh Data Manager launches, source-specific predictions, cleared roles, explicit reset, draft removal, failed-save recovery, and keyboard activation. [Browser evidence](audits/2026-09-12/multiple-regression-drafts.json).

## Remaining scope

Simple and multiple regression now support calculator drafts; descriptive calculators still save only their inputs and source labels. Correlation and t-test/ANOVA drafts remain open, along with report exports and manual-input exclusion review. Lesson, power, effect-size, and highlighted-point choices are not saved by this feature.

Drafts stay in the current browser/device and disappear when site data is cleared. Multiple tabs are not synchronized; the last successful edit wins. This work does not independently revalidate every statistical engine or establish complete screen-reader conformance.
