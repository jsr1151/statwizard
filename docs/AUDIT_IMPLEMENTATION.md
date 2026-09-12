# Site audit implementation status

This tracks the first implementation pass following the [September 11 site audit](SITE_AUDIT_2026-09-11.md). The audit is a historical record of the previously deployed version; the items below describe subsequent changes.

## Completed in this pass

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

1. **Complete the method destinations.** Build and independently validate dedicated repeated-measures, Mann–Whitney, and signed-rank calculators, including subject matching, ties/zeros, assumptions, effect sizes, reference examples, and reporting. Availability pages are an immediate correctness fix, not these implementations.
2. **Unify the analysis workflow.** Reduce the distance from opening a calculator to entering data; clearly distinguish sample and user data; make excluded rows, variable roles, result summaries, and next actions consistent. Complete an end-to-end keyboard and screen-reader review of nested plots and editors.
3. **Make the Learning Lab usable.** Replace its placeholder levels with a small complete learning path containing worked examples, practice, feedback, and progress. Simplify the home-page choices and connect the learning path to the existing modules.
4. **Expand supported designs deliberately.** Prioritize categorical analyses and rank correlation, then other requested models. Extend wizard reasoning alongside validated calculators instead of suggesting an unsupported method.
5. **Improve reproducibility and recovery.** Add analysis/report export with inputs, exclusions, assumptions, and results; consider durable draft recovery and clearer backup/restore controls. Review power interpretation and advanced model limitations as part of this work.

The larger audit roadmap remains open. This pass addresses the immediate correctness, data-loss, and common access issues without claiming that the full product expansion is finished.
