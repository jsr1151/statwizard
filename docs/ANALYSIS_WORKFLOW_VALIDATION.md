# Shared calculator workflow

This documents the first workflow pass. The subsequent [correlation and regression pass](TABULAR_WORKFLOW_VALIDATION.md) adds source labels and row-level exclusion details to those calculators.

This pass updates one-sample, independent, and paired t-tests, one-way ANOVA, factorial ANOVA, and ANCOVA. Statistical engines and exclusion rules are unchanged.

## Behavior

- Example/manual input shows the existing editable starting values with an explicit example notice. Saved-data cards do not obstruct this path.
- Saved-data mode uses one compact setup panel. Variable roles have accessible names; usable/excluded counts and warnings remain visible, while storage metadata is in a disclosure.
- Invalid saved-data mappings show guidance and remove the calculator and its shared statistics. Selecting saved data never falls back to example results when roles are incomplete.
- Launch payloads are read without consuming them during render, then consumed after mounting. The requested dataset ID survives an initially empty library. Missing launch targets require a new selection rather than substituting another saved dataset.
- The calculator shortcut moves both focus and the viewport. Import/manage opens Data Manager. Changing source reloads the calculator; the interface tells users to copy edits first. Saved records are not changed by calculator edits.
- One-way ANOVA has a compact phone view selector, wrapping group editors, and named group controls. The ANCOVA adjustment slider has a name. Shared notice colors follow the nearest light/dark surface.
- Tutor history captures the tip when an action occurs, so a deferred React update cannot read a later null tip and crash the page. The same dismissal pattern was corrected in all three ANOVA tutor hooks.

## Validation

455 tests across 43 files passed (`npm test -- --maxWorkers=2`). An earlier concurrent run hit worker timeouts; the reduced-worker full run passed. Lint, documentation, production build, all 30 power fixtures, and the startup bundle check passed. The browser review finished with 35 clean accessibility/overflow snapshots: example/manual and empty saved-data states for six calculators at desktop and phone widths, six populated phone launch workflows, and all five mobile ANOVA views. It recorded no application exceptions or console errors after the fixes.

Workflow regressions cover all six pages under React Strict Mode, delayed library loading, missing launch targets, invalid role selections, source switching, the Data Manager action, and focus transfer. Tutor regressions exercise an override/dismissal interrupted by deactivation.

- [Workflow tests](../src/components/analysis/__tests__/AnalysisCalculatorWorkflow.test.jsx)
- [Tutor interruption tests](../src/hooks/__tests__/useAnovaTutor.test.jsx)
- [Production-build browser evidence](audits/2026-09-12/analysis-workflow.json)

## Remaining scope

This is the first shared workflow pass, not a rewrite of every calculator. It does not add raw-table import directly to each wrapper, durable calculator drafts, analysis export, new statistical procedures, or row identities for exclusions. Existing analysis inputs remain editable and their statistics update through their existing engines. Imported data must be prepared and saved in Data Manager. Correlation, regression, and descriptive pages still need the same source/provenance review. Automated accessibility checks and desktop viewport simulation do not replace a full screen-reader or physical-device review.
