# Saved-row review and descriptive input recovery

Implemented September 12, 2026, following the [site audit](SITE_AUDIT_2026-09-11.md).

## Saved-row exclusions

One-sample, independent, and paired t-tests, one-way and factorial ANOVA, and ANCOVA now show complete-row counts and an expandable list of excluded saved-data rows. Each entry names the affected variable and whether its value is missing or not a finite number. Counts cover all rows; details display the first 100 exclusions. Row numbers refer to the current saved dataset, without a header, rather than original file line numbers.

Row completeness is separate from model validity. An insufficient group size or empty factorial cell does not turn every observation into an excluded row. Complete counts remain visible while the setup message explains why the calculator is unavailable. Missing, stale, duplicate, or incorrectly typed variable selections block initialization and do not claim row exclusions. The model initialization and statistical calculations otherwise retain their existing behavior.

The review describes saved data used to initialize a calculator. Subsequent edits inside that calculator do not change the saved dataset or its row review. Existing source guidance and the new review make this distinction explicit.

## Descriptive input drafts

Central tendency, variability, and frequency each save their exact input text and source label in a separate, versioned browser-local draft. Edits save immediately, including empty input and invalid entries; mounting or changing display settings does not overwrite storage. Returning to the calculator or reloading restores the draft with a visible notice.

Removing a saved draft requires inline confirmation. It keeps current values open, while a subsequent reload starts with the default example. Cancel returns focus to the removal control. New edits save a new draft. Storage failures leave current edits usable and preserve the previous saved draft; failed deletion is reported. Invalid or incompatible stored data falls back to the example without being overwritten on mount. Inputs over 250,000 characters remain usable but are not saved automatically, with a visible explanation.

## Validation

- 519 tests across 48 files passed. Coverage includes all six row-review adapters and their calculator wrappers, exact missing/nonnumeric exclusions, invalid variable mappings, insufficient ANCOVA group sizes, all-excluded data, detail truncation, and actual row counts independent of stale metadata.
- Draft tests cover all three calculators, independent storage keys, exact and empty input restoration, cancel/confirm removal, failed reads/writes/deletes, incompatible or malformed storage, preserving prior drafts, and the size limit.
- Lint, production build, documentation, all 30 power fixtures, and bundle checks passed. Initial JavaScript remains about 450 kB / 132 kB gzip, within the 140 kB gzip budget.
- 42 final Edge checks found no selected WCAG A/AA violations, document overflow, or application errors. Restored drafts and all six saved-data row reviews were checked at 1440px and 375px in both themes. Additional phone checks covered draft removal confirmation and failed writes. Browser workflows exercised reloads, draft cancellation/removal, failed saves retaining the previous draft, six Data Manager launches, exclusion reasons, and clearing variable roles.
- This review also corrected contrast in the one-sample t-test decision badge and factorial ANOVA residual row. Affected views were rechecked after the fixes. [Browser evidence](audits/2026-09-12/row-review-drafts.json).

## Remaining scope

Input recovery currently covers the three descriptive calculators only. It does not restore display settings, regression variable mappings, t-test/ANOVA inputs, power settings, plots, or reports. Drafts stay in the current browser/device and disappear when site data is cleared. Multiple tabs are not synchronized; the last successful edit to a calculator's draft wins. File/report export and broader draft recovery remain open.

This pass does not comprehensively revalidate statistical engines or establish full screen-reader conformance. Manual/raw inputs inside the older calculators still need a separate exclusion/reporting review.
