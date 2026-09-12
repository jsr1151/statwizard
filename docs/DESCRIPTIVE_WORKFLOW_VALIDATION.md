# Descriptive inputs and saved simple regression

Implemented September 12, 2026, following the [site audit](SITE_AUDIT_2026-09-11.md).

## Changes

Central tendency, variability, and frequency calculators and explorers identify the active example or entered values. A results summary reports included and excluded nonempty entries. Numeric calculators disclose excluded non-numeric/nonfinite entries, including when no usable values remain, with the first 100 displayed. A Go to results button focuses the result section. Loading the default example is named explicitly, and input/source state survives switching between calculator and explorer.

The existing copy actions now include source, inputs, counts, numeric exclusions, and results. Frequency copies also identify the displayed ordering. Clipboard errors expose selectable text instead of rejecting silently; changing the report invalidates old copy status, including pending requests. Central tendency now updates and clears shared statistics consistently with the other descriptive pages.

Simple regression can launch from Data Manager or select a saved dataset directly. Launch selection respects outcome/predictor tags, otherwise using the final numeric column as the outcome and the first eligible numeric predictor. Learners must confirm these roles. Column IDs identify saved roles, while readable labels appear in plots and result interpretations. Saved row matching and exclusion details use the existing regression engine and common row-summary helper.

The requested saved dataset survives delayed library loading and React Strict Mode. A missing requested dataset cannot substitute another. Explicitly cleared roles remain empty, including across source switches. Pasted values and selections remain separate from saved-dataset roles. Loading example data explicitly restores default predictor/outcome choices. Upload reads retain the existing protection against overwriting newer edits or source changes.

## Validation

- 493 tests across 47 files passed, including descriptive source/exclusion/copy workflows, missing and delayed saved datasets, cleared roles, preserved complete pairs, variable labels, tagged launches, Data Manager save-before-launch, and existing regression lesson/calculator behavior.
- Lint, production build, documentation, all 30 power fixtures, and startup bundle checks passed. Initial JavaScript remains approximately 450 kB / 132 kB gzip, within the 140 kB gzip budget.
- 34 Edge browser checks found no selected WCAG A/AA rule violations, document overflow, or application errors. Each descriptive calculator and populated explorer was reviewed at 1440px and 375px in light and dark themes; clipboard-failure states were checked on phones. Saved regression was checked in all four viewport/theme combinations, with additional checks for cleared roles, restored pasted input, and resetting an example.
- Browser workflows covered entry counts/exclusions, focus navigation, calculator-to-explorer input retention, denied clipboard access, clearing inputs, importing and saving a dataset in Data Manager, launching simple regression, row-matched exclusions, readable labels, and switching sources. [Browser evidence](audits/2026-09-12/descriptive-workflow.json).

## Scope and limits

Descriptive inputs remain single-variable lists, without a header or automatic multi-column file import. Blank separators do not count as observations; excluded counts refer to nonempty entries rather than dataset rows. Frequency treats nonempty labels such as NA as categories. The interface explains delimiter behavior, including how to preserve spaces in category labels. Descriptive saved-dataset launches are not included.

This pass improves existing copy actions; it does not add durable calculator drafts, report files, or backup/sync. Saved datasets remain local to the browser/device, and calculator state is held in memory. No statistical engine was changed or comprehensively revalidated. Automated checks and targeted focus workflows do not establish full screen-reader conformance.
