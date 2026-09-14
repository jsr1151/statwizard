# Site audit implementation status

This tracks implementation following the [September 11 site audit](SITE_AUDIT_2026-09-11.md). The audit is a historical record of the previously deployed version; the items below describe subsequent changes.

## September 13: one-way ANOVA lesson parity

The one-way lesson now shares validated calculator inputs, inference, tables, Bonferroni comparisons, and reports. Teaching plots distinguish observed values from summaries, support valid custom ranges and keyboard controls, and explain variance decomposition using current results. The active app report builder follows the selected alpha and handles supplied F and invalid inputs safely. Lesson edits leave calculator drafts unchanged.

Validation: 822 tests in 63 files passed, including 40 new cases and 12 R reference cases through lesson controls. Lint, build, documentation, power fixtures, and bundle checks passed. All 23 production-browser accessibility/overflow checks passed without application errors. See [scope and validation](ANOVA_LESSON_VALIDATION.md). Next: factorial ANOVA draft recovery, followed by ANCOVA and repeated measures.

## September 12: one-way ANOVA calculator recovery

One-way ANOVA now recovers separate raw, summary, and supplied-F profiles, group labels/counts, saved dataset roles, alpha, and pairwise comparison settings. Current saved data offers an explicit manual copy. Invalid groups block stale results. The dedicated calculator adds a report, an ANOVA table, full-precision raw exclusions, and Bonferroni comparisons using residual degrees of freedom and the selected alpha.

Validation: 782 tests in 60 files passed, including 49 new cases and independent base R references for eight ANOVAs/comparison families and four supplied-F cases. Lint, build, documentation, power fixtures, and bundle checks passed. All 20 production-browser accessibility/overflow checks passed without application errors. See [scope and validation](ONE_WAY_DRAFT_VALIDATION.md). Next: one-way lesson inference/report parity, then remaining ANOVA-family drafts.

## September 12: paired lesson inference and report parity

The paired lesson now uses the calculator's validated inference and report formatting, including selected confidence levels and Student t bounds. Invalid lesson inputs suppress results instead of being coerced. Summary plots follow the current summaries; individual observations are shown only from explicit example pairs. Plot controls, report copying, tutor interactions, and condition order have consistent behavior, while calculator drafts remain untouched.

Validation: 733 tests in 58 files passed, including 23 new lesson cases and eight R comparisons through lesson controls. Lint, build, documentation, power fixtures, and bundle checks passed. All 20 production-browser accessibility/overflow checks passed without application errors. See [scope and validation](PAIRED_LESSON_VALIDATION.md). Next: ANOVA draft recovery.

## September 12: paired t-test calculator recovery and matching

Paired t-tests now recover exact matched rows and separate summary profiles, labels/order, saved variable choices, hypothesis, alpha, and interval settings. Whole-row exclusions prevent missing values from shifting pair alignment. Saved pairs follow current library edits and offer **Edit a copy**. The calculator uses Student t confidence bounds and requires a valid within-pair correlation for summaries. Reports include comparison order, confidence level, excluded-row counts, and analyzed pairs.

Validation: 710 tests in 57 files passed, including 57 new cases and eight independent R comparisons. Lint, build, documentation, power fixtures, and bundle checks passed. All 20 production-browser accessibility/overflow checks passed without application errors. See [scope and validation](PAIRED_DRAFT_VALIDATION.md). Paired lesson parity was completed in the subsequent increment above; ANOVA draft recovery remains open.

## September 12: independent-samples t-test calculator recovery

Independent-samples t-tests now recover both raw/summary groups, labels and order, source-specific saved roles, pooled/Welch method, hypothesis, alpha, and interval settings. Saved values follow current library edits and offer an explicit **Edit a copy** action. Invalid and degenerate inputs block stale results. Group order and excluded entries are visible, and the copyable report includes both groups and inference settings.

Validation: 653 tests in 55 files passed, including 43 new cases and eight independent R comparisons. Lint, production build, documentation, power fixtures, and bundle checks passed. All 19 production-browser accessibility/overflow checks passed without application errors. See [scope and validation](INDEPENDENT_DRAFT_VALIDATION.md). Paired t-test and ANOVA draft recovery remain open.

## September 12: one-sample t-test calculator recovery

The one-sample calculator now restores separate raw/summary inputs, source and saved sample-variable choices, null mean, alpha, hypothesis, and interval settings. Saved values follow the current library and offer an explicit **Edit a copy** action. Invalid inputs block stale results, raw calculations retain full precision, exclusions are visible, and a copyable report has a selectable fallback.

Validation: 610 tests in 53 files passed, including 39 new cases and eight independent R inference comparisons. All 17 production-browser accessibility/overflow checks passed without application errors. Lint, production build, documentation, power fixtures, and bundle checks passed. See [scope and validation](ONE_SAMPLE_DRAFT_VALIDATION.md). Independent/paired t-test and ANOVA recovery remains open.

## September 12: Pearson correlation draft recovery

Pearson now restores its table/source, X/Y choices for each source, hypothesis direction, confidence level, null population correlation, and plot display settings. Fresh Data Manager launches take priority over older drafts. Cleared or unavailable variables remain unselected. Blank and out-of-range null values stay editable and block test output rather than being converted to zero or clamped. Shared inference controls expose selected states and validation to assistive technology.

Validation: 571 tests in 51 files, lint, production build, documentation, power fixtures, and bundle checks passed. All 16 production-browser accessibility/overflow checks passed without application errors. See [scope and validation](PEARSON_DRAFT_VALIDATION.md). T-test/ANOVA draft recovery remains open.

## September 12: multiple regression draft recovery

Multiple regression now recovers its table/source, outcome and predictor choices, confidence level, and prediction inputs. Pasted data and each saved dataset have separate variable choices and prediction profiles, with stable column IDs preserving saved prediction inputs through renames. Cleared or unavailable predictors no longer cause automatic reselection or a silently reduced model. Prediction inputs retain out-of-range values and blank fields instead of being clamped or treated as zero.

Validation: 551 tests in 50 files, lint, production build, documentation, power fixtures, and bundle checks passed. All 14 production-browser accessibility/overflow checks passed without application errors. See [scope and validation](MULTIPLE_REGRESSION_DRAFT_VALIDATION.md). Correlation and t-test/ANOVA recovery remain open.

## September 12: simple regression draft recovery

Simple regression now restores its entered/uploaded table, source, saved dataset reference, variable choices, confidence level, prediction input, and plot display settings as one calculator draft. Fresh Data Manager launches take precedence over older drafts. Missing datasets and cleared or unavailable variables block results instead of silently selecting alternatives. Recovery has confirmation before removal, visible storage failure handling, and a compact explanation of its scope.

Validation: 534 tests in 49 files, lint, production build, documentation, power fixtures, and bundle checks passed. All 14 production-browser accessibility/overflow checks passed with no application errors. See [scope and validation](SIMPLE_REGRESSION_DRAFT_VALIDATION.md). Multiple regression, correlation, and t-test/ANOVA recovery remain open.

## September 12: saved-row review and descriptive input recovery

All six older t-test/ANOVA saved-data wrappers now show row numbers and variable-specific exclusion reasons. Counts distinguish incomplete rows from invalid model setups, retain complete-row totals for blocked designs, and reject stale variable mappings. Central tendency, variability, and frequency now recover exact input drafts after reload, with separate local storage, confirmation before removal, and visible failure handling. This saves input text and its source label; broader calculator settings and drafts remain open.

Validation: 519 tests in 48 files, lint, production build, documentation, power fixtures, and bundle checks passed. All 42 final browser accessibility/overflow checks were clean, with no application errors. See [scope and validation](ROW_REVIEW_DRAFT_VALIDATION.md).

## September 12: descriptive inputs and saved simple regression

Central tendency, variability, and frequency now identify their example/entered source and report included/excluded entry counts. Numeric exclusions remain visible when all entries are invalid. Results have a focus shortcut, and existing copy actions include source, inputs, counts, and results with a selectable fallback when clipboard access fails. Simple regression now launches saved data from Data Manager, preserves row pairs and readable variable labels, and respects missing datasets and cleared roles. Loading example data explicitly restores its variable choices.

Validation: 493 tests in 47 files, lint, production build, documentation, power fixtures, and bundle checks passed. All 34 final browser accessibility/overflow checks were clean, with no application errors. See [scope and validation](DESCRIPTIVE_WORKFLOW_VALIDATION.md).

## September 12: first complete Learning Lab path

The Learning Lab now offers five connected lessons from data types through one-sample inference, with worked examples, ten practice questions, answer-specific feedback, completion tracking, and browser-local progress. Learners can resume, review any lesson, reset with confirmation, and open related modules. Storage failures leave practice usable with a visible notice. The home page now emphasizes three primary choices and places the remaining tools below them; smaller artwork brings the choices higher on the page.

Validation: 478 tests in 46 files, lint, production build, documentation, power fixtures, and bundle checks passed. All 27 final browser accessibility/overflow snapshots were clean; keyboard practice, reload, reset, completion, and all six module links passed without application errors. R independently confirmed the worked t-test example. See [scope and validation](LEARNING_LAB_VALIDATION.md).

## September 12: correlation and regression data workflow

Pearson correlation, simple linear regression, and multiple regression now share labeled example/paste/upload controls and a keyboard-operable upload button. Both the input panel and results identify the active source. Results include usable/excluded counts and the first 100 excluded data-row numbers with the affected variables. Pearson's pasted-data count now checks complete pairs rather than the lengths of arrays that contain missing values. A shortcut moves focus to the results.

Invalid calculations clear shared statistics. Saved launches into Pearson and multiple regression retain the requested dataset while the library loads, do not substitute another dataset when it is missing, and respect cleared roles. Switching between saved and pasted data preserves the pasted table. Failed uploads keep the current table; a late file read cannot overwrite a newer edit or upload.

Validation: 466 tests across 45 files passed, plus lint, production build, documentation, power fixtures, and the startup bundle check. All 18 final browser accessibility/overflow checks were clean, with no application errors. See [scope and validation](TABULAR_WORKFLOW_VALIDATION.md).

## September 12: shared calculator entry workflow

One-sample, independent, and paired t-tests, one-way and factorial ANOVA, and ANCOVA now share a compact source selector. Example/manual input opens directly; saved-data setup appears only when selected. The active dataset, variable roles, usable rows, and excluded rows stay together. A keyboard-operable shortcut moves focus to the calculator. Import opens Data Manager.

Saved-data mode mounts a calculator only after its data mapping is valid. Incomplete roles clear the displayed results and shared statistics. Saved-data launch requests survive React Strict Mode and delayed library loading; a missing launch target cannot silently select a different dataset. Changing sources reloads calculator inputs, with a visible notice to copy edits first; this is not durable calculator draft recovery.

The browser review also fixed a deferred tutor-history update that could crash ANOVA navigation, mobile group-editor overflow, clipped ANOVA view controls, unnamed group buttons and the ANCOVA adjustment slider, and contrast in populated result notices. See [workflow scope and validation](ANALYSIS_WORKFLOW_VALIDATION.md).

Validation: 455 tests across 43 files passed, along with lint, build, documentation, power fixtures, and bundle checks. The final browser review contains 35 clean accessibility/overflow snapshots and no application errors, including all six saved-data launch paths and all five mobile ANOVA views. [Browser evidence](audits/2026-09-12/analysis-workflow.json).

## September 12: repeated-measures ANOVA

A dedicated one-factor repeated-measures calculator now supports wide and long data with explicit participant IDs. It reports the within-participant error model, Greenhouse–Geisser/Huynh–Feldt/lower-bound corrections, Mauchly's diagnostic when estimable, effect sizes, matched rows, exclusions, and report text. Complete measurements are required by default; users must explicitly choose incomplete-participant exclusion. Data Manager requires explicit selection of repeated columns.

Validation: 440 tests across 41 files passed, including seven independent R model reference datasets and participant-matching/workflow checks. See [model scope and validation evidence](REPEATED_MEASURES_VALIDATION.md). Repeated-measures power, mixed/factorial designs, pairwise comparisons, and confidence intervals remain outside this calculator's scope.

The production-build browser review passed 14 accessibility snapshots across all six sections at desktop and phone widths, with no document overflow or application errors. It also checked saved-data launches, long-format participant matching, duplicate rejection, and explicit incomplete-participant exclusion. [Browser evidence](audits/2026-09-12/repeated-measures.json).

## September 12: rank-test calculators

Mann–Whitney U and Wilcoxon signed-rank now have dedicated calculators, worked examples, rank tables, effect estimates, assumption guidance, and report text. Both accept entered values and saved datasets launched from Data Manager. Small-sample exact inference includes ties; large-sample normal inference states the correction used. Missing pairs retain their positions and exclusions are reported. Edited inputs clear stale output.

Validation at this milestone: 417 tests across 38 files passed, including 45 independent R reference cases and exhaustive tied-sample checks. See the [model contract and validation evidence](NONPARAMETRIC_VALIDATION.md).

The production browser review passed 22 accessibility snapshots across both themes, all ten module sections, and both Data Manager launch paths, with no page overflow or application errors. It also checked paired exclusions, stale-result clearing, and keyboard focus after calculation. [Browser evidence](audits/2026-09-12/rank-calculators.json).

## Completed in the first pass

| Audit area | Result |
| --- | --- |
| Repeated-measures correctness | Calculator, equation, and power links now explain availability and the required repeated-observation model. They cannot run the independent-groups ANOVA or its power approximation. |
| Nonparametric methods | Mann–Whitney and signed-rank have separate software guidance, correct independent/paired R calls, and explicit calculator availability. Invalid rank-then-T.TEST recipes and unrelated/empty fallback content were removed. |
| Wizard scope | New measurement-type and design questions prevent unsupported categorical outcomes, dependent regression observations, and repeated/mixed or three-factor designs from reaching an inappropriate calculator. |
| Workspace protection | Unsaved Data Manager state and undo history survive navigation inside the app. Import, opening/duplicating a saved dataset, and New Workspace offer Save/Discard/Cancel before replacement. A failed save leaves the workspace open. |
| Saved-data launches | Pearson and Multiple Regression initialize directly into the requested saved-data mode. Reading the launch request no longer consumes it during a render that React may retry. |
| Keyboard access | Import Data File is a native keyboard-operable button. Audited controls have accessible names; the frequency table scroll region and observed-versus-fitted point selection support keyboard access. |
| Mobile layout | Analysis sections use a labeled compact selector on phones. Formula grids, ANOVA controls, and factorial view navigation fit the viewport. Calculator pages no longer display ANOVA guided-hint panels. |
| Readability | Shared text colors follow the nearest light/dark surface. Dimmed lesson text and several translucent dark controls were corrected. Focus indicators are visible. |
| Discoverability and preferences | Search understands common synonyms such as average and standard deviation and avoids accidental cross-word matches. Theme choice survives reloads; document titles identify the current module. |
| Result consistency | The ANOVA significance badge follows the selected critical threshold rather than a hard-coded .05 cutoff. |

Draft protection is **in memory within the open app**, not disk autosave or cloud sync. Save datasets before closing or refreshing; the app requests a browser leave warning while a draft is dirty, but browsers can suppress such warnings. Saved datasets remain local to the browser/device. Export copies for backup.

## Validation

- 346 automated tests across 35 files, including new scope, draft-replacement, search, and React Strict Mode launch regressions.
- Lint, documentation, production build, and bundle checks passed. Initial JavaScript was approximately 449 kB uncompressed / 132 kB gzip at the measured build.
- An initial implementation sweep covered 182 desktop/phone views with no document overflow or application console errors.
- A subsequent production-build check covered 56 targeted views, including all calculator destinations: no document overflow or application errors. All 50 automated accessibility snapshots in this check had zero violations for the selected WCAG A/AA rules.
- A real-browser workflow verified theme persistence, Tab/Enter file import, draft retention, Escape cancellation, save-before-replacement, reopening saved data, launching six saved rows into Multiple Regression, mobile section navigation, method availability, and all seven factorial views at 375px width.
- [Recorded validation summary](audits/2026-09-11/implementation-validation.json).

Automated accessibility snapshots do not establish complete accessibility conformance. This pass did not independently revalidate every statistical engine, every dataset shape, every nested interaction, or all screen-reader behavior.

## Remaining work, in recommended order

1. **Finish analysis workflow coverage.** Extend draft recovery from descriptive inputs, Pearson correlation, and simple/multiple regression to t-test/ANOVA data, variable mappings, and settings. Add consistent reporting actions and review manual-input exclusions inside the older calculators. Complete an end-to-end keyboard and screen-reader review of nested plots and editors. Descriptive saved-data launches and multi-column file selection remain potential extensions beyond the now-labeled single-variable inputs.
2. **Expand supported designs deliberately.** Prioritize categorical analyses and rank correlation, then other requested models. Extend wizard reasoning alongside validated calculators. Repeated-measures power, mixed/factorial repeated designs, post-hoc comparisons, and additional confidence intervals need separate validation.
3. **Improve reproducibility and recovery.** Add analysis/report export with inputs, exclusions, assumptions, and results; consider durable draft recovery and clearer backup/restore controls. Review power interpretation and advanced model limitations as part of this work.
4. **Expand learning beyond the introductory path.** Add further worked examples and practice for comparing groups, association, and model assumptions. Review existing module explanations for consistency, and consider progress export and broader screen-reader testing.

The larger audit roadmap remains open. This pass addresses the immediate correctness, data-loss, and common access issues without claiming that the full product expansion is finished.
