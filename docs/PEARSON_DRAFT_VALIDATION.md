# Pearson correlation draft recovery

Implemented September 12, 2026, following the [site audit](SITE_AUDIT_2026-09-11.md).

## Recovery contract

Pearson correlation now saves a separate, versioned browser-local calculator draft containing the exact entered/uploaded table and source label, active source, saved dataset reference, X/Y choices for pasted data and each saved dataset, hypothesis direction, confidence level, null population correlation, and line/band display settings. Results are recalculated from recovered inputs. Saved datasets use their current library version, with variable selections tracked by stable column IDs through renames.

Edits and completed uploads save immediately. Mounting, automatic calculations, and section changes do not overwrite storage. Selecting a hypothesis saves its tail count and direction together in one write. A fresh Data Manager launch takes priority over an older draft and opens the requested dataset and roles with default inference settings; the next edit replaces the previous draft. Missing saved datasets remain selected while the library loads and are not replaced automatically. Late or failed uploads preserve the current table and newer settings.

Cleared and unavailable variables stay unselected and block calculation until corrected. The pasted X/Y selectors now include an explicit empty choice. Pair matching and exclusion details retain their original row positions after recovery. Incomplete variable selection no longer reports a misleading zero-of-zero complete-case count. Loading the example restores its table and variable choices while retaining inference settings.

The null-correlation input now preserves blank and out-of-range entries instead of silently converting blanks to zero or clamping values. Such input blocks test output and shared statistics, with an accessible validation message explaining the calculator's supported range of -0.95 to 0.95. Entering a valid value resumes calculation. Hypothesis and plot controls expose their selected state to assistive technology. Saved and pasted sources use the same inference controls.

Removal requires confirmation and leaves the current analysis open. Cancellation and successful removal return focus to the removal control. Reloading after removal opens the example; a subsequent edit creates a new draft. Other calculators' drafts are unaffected. Failed saves or deletion report the problem and preserve the previous draft. Malformed, incompatible, or invalid draft settings fall back to the example without overwriting storage on mount. Drafts over 250,000 serialized characters remain usable but are not saved automatically.

## Validation

- 571 tests across 51 files passed. Twenty new recovery cases cover coherent Strict Mode reloads, atomic hypothesis changes, blank/out-of-range null values, pair matching and exclusions, unfinished tables, cleared/stale roles, separate saved-data selections, missing datasets, renames and changed types, launch priority, late/failed uploads, confirmation/focus, storage failures, incompatible settings, independent draft removal, and the size limit. Existing Pearson model, lesson, and shared saved-launch tests also pass.
- Lint, production build, documentation checks, all 30 independent power fixtures, and bundle checks passed. Initial JavaScript is 449,681 bytes / 132,200 bytes gzip, below the 140,000-byte gzip budget.
- Sixteen production-build Edge accessibility/overflow checks passed without application errors: restored entered analyses at 1440px, 768px, and 375px in both themes; restored saved-data analyses at desktop and phone widths in both themes; and phone views for scope details, removal confirmation, blank/out-of-range null values, cleared variables, and failed saving. Browser workflows checked reloads, paired exclusions, upload recovery, Data Manager priority, saved roles/inference settings, draft removal, failed-save recovery, and keyboard activation. [Browser evidence](audits/2026-09-12/pearson-drafts.json).

## Remaining scope

Pearson correlation, simple regression, and multiple regression now support calculator drafts. Descriptive calculators retain input/source-only recovery. T-test/ANOVA drafts, report exports, and manual-input exclusion review remain open. Lesson, power, and effect-size settings are not saved by this feature.

Drafts stay in the current browser/device and disappear when site data is cleared. Multiple tabs are not synchronized; the last successful edit wins. This work does not independently revalidate every statistical engine or establish complete screen-reader conformance.
