# Correlation and regression workflow validation

This pass covers Pearson correlation, simple linear regression, and multiple regression. It changes input/source presentation, row-use summaries, upload handling, and saved-data selection. Statistical engines and complete-case exclusion rules remain unchanged.

## Implemented behavior

- All three pages label example, entered, and uploaded tables. Uploaded filenames are visible until the table is edited. Result summaries name the active source.
- Upload uses a native button and accepts CSV, TSV, and text tables. The existing parser still handles the input. A pending read identifies the current results' source; failed reads retain the current table and show an error. Newer edits, example loads, uploads, or source changes cancel older reads.
- Pearson and multiple regression expose selected source state, saved dataset names, and Data Manager access. Switching source preserves the pasted table in the mounted page. Missing launch targets do not select another available dataset; delayed loading preserves launch roles. Clearing a role does not silently reselect it.
- The results shortcut transfers focus and scrolls to a named results region. Invalid calculations clear the statistics shared with other sections.
- The data summary checks each selected variable in each original data row. It reports usable/excluded counts and the first 100 excluded row numbers, naming the missing or nonnumeric variables. This fixes Pearson's pasted-data count, which previously counted array slots containing nulls as usable rows. Values remain paired by row in the existing engine.
- Simple regression still supports example/paste/upload only; a saved-data launch path remains future work. These input states persist while switching sections/sources in the mounted page, not across a refresh or leaving the module. No durable analysis save or report export is added.

## Evidence

466 tests across 45 files passed, including the existing numeric regression and correlation checks, new matched-row/exclusion checks, source preservation, delayed/missing launches, cleared roles, and upload failure/race checks. Lint, production build, documentation, all 30 power fixtures, and bundle checks passed. Initial JavaScript is 132,309 bytes gzip, below the 140,000-byte budget.

- [Three-page workflow regressions](../src/components/analysis/__tests__/TabularAnalysisWorkflow.test.jsx)
- [Upload race/failure regressions](../src/hooks/__tests__/useAnalysisTableInput.test.jsx)
- [Browser review](audits/2026-09-12/tabular-workflow.json)

All 18 final browser accessibility/overflow snapshots were clean, with no application errors. The review covers desktop/dark and phone/light states, example and entered data on all three pages, empty saved-data states, the two saved-data launch paths, keyboard upload, source labels, exclusions, focus transfer, and invalid-role recovery. Automated checks do not establish full screen-reader or physical-device accessibility. The existing parser's format limitations and statistical model limitations are unchanged.
