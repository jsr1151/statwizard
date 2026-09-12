# Structural extraction progress

Updated September 11, 2026.

Probability hardening is complete. The remaining structural work is being
handled as independent slices, with interaction coverage established before
moving each page's implementation.

## Completed: application shell

The [navigation implementation](NAVIGATION_IMPLEMENTATION.md) extracted the
application content, result page/visualizer, equation panel/workspace, and
overlays. `App.jsx` is 294 lines. Route and section history are handled by a
dedicated hook. Local commits: `076a99e` and `74d795b`.

## Completed: Simple Linear Regression

`SimpleLinearRegressionPage.jsx` decreased from 1,162 to 305 lines. The page
retains its state and calculations so switching sections preserves entered
data, selected variables/cases, predictions, lesson controls, and effect-size
edits. Its views now live in these existing section files:

| Component | Lines | Responsibility |
| --- | ---: | --- |
| `RegressionCalculatorSection.jsx` | 353 | Data entry, fitted model, prediction, coefficient and residual views |
| `RegressionLessonSection.jsx` | 248 | Presets, plot controls, prediction and residual spotlights |
| `RegressionEffectSizeSection.jsx` | 151 | Fit/slope explanations and effect-size controls |
| `RegressionPowerSection.jsx` | 34 | Shared power-planning surface |

Those files previously contained unused, simplified implementations. They now
render the live page's existing content and interactions. The extraction also
reuses the shared analysis cards, metric tiles, and statistical formatters.
Live presets/sample data are in `src/data/regressionPresets.js`; pure display
and selection helpers are in `src/utils/simpleRegressionPage.js`. Statistical
algorithms and the scatterplot/residual components were not changed.

Seven component tests were added and passed before and after extraction.
They cover known regression coefficients, extrapolation, confidence levels,
invalid inputs and recovery, state preservation across sections/themes,
lesson outliers/regeneration, effect-size edits, power-mode selection,
CSV upload, and selected-case persistence.

Repository validation: 29 test files / 260 tests passed, along with lint,
production build, documentation checks, and all 30 power fixtures.

The browser review compared six sections at 375, 768, and 1440 px in both
themes: all 36 before/after comparisons matched for displayed content,
control values, plot points, and overflow status. No console warnings or
errors occurred. A source-tree comparison also confirmed that page state,
effects, handlers, and all four extracted section render trees match the
original implementation, ignoring formatting. Browser captures must let the
shared power chart finish updating before comparing its displayed results.

## Completed: regression calculator mobile layout

The calculator's implicit mobile grid column inherited the coefficient
table's minimum width, expanding a 375 px viewport to a 646 px page. Explicit
single-column tracks and shrinkable grid items now keep the cards within the
viewport. Long variable names wrap, and the fitted-model summary stacks on
narrow screens. The coefficient table scrolls inside its card, with a named,
keyboard-focusable region and visible focus styling.

The follow-up passed 62 Edge checks across 375, 414, 768, 1024, and 1440 px in
both themes. Sample data, confidence/prediction bands, extrapolation, long
variable names, invalid data, empty data, and recovery had no page overflow
or clipped controls. Tab and Arrow Right reached and scrolled the coefficient
table without scrolling the page horizontally. Screenshots were inspected;
no console warnings or errors occurred. All 260 tests, lint, build,
documentation checks, and 30 power fixtures passed again.

## Completed: Pearson Correlation

`PearsonCorrelationPage.jsx` decreased from 1,233 to 376 lines. The page
retains its state, dataset launch handling, calculations, and event handlers.
Its live views now use the existing section files, replacing their previously
unused, simplified implementations:

| Component | Lines | Responsibility |
| --- | ---: | --- |
| `PearsonCalculatorSection.jsx` | 402 | Variable mapping, inference settings, scatterplot, results, and guidance |
| `PearsonDataSourceCard.jsx` | 101 | Pasted/uploaded data and saved-dataset selection |
| `PearsonLessonSection.jsx` | 173 | Presets, plot controls, and concept explanations |
| `PearsonEffectSizeSection.jsx` | 157 | Signed correlation and explained-variance controls |
| `PearsonPowerSection.jsx` | 34 | Shared power-planning surface |

The sections reuse shared analysis cards, metric tiles, and statistical
formatters. `src/data/pearsonCorrelationPresets.js` now contains the live
page's preset descriptions and sample data. The statistical algorithms,
dataset storage, and scatterplot implementation are unchanged.

Interaction coverage passed against the original page before extraction.
The final nine tests cover known correlations, directional and nonzero-null
tests, confidence levels, invalid data and recovery, CSV upload, persistence
across sections/themes, lesson controls and regeneration, effect-size
conversion, power-mode selection, empty saved libraries, and dataset launch
roles with incomplete observations. The longer lesson journey was split
into two focused tests after hitting the five-second timeout during a
concurrent build and full-suite run.

All 36 browser comparisons matched for displayed content, control values,
plot points, and overflow status: six sections at 375, 768, and 1440 px in
both themes. No page overflow, console errors, or React warnings occurred.
Calculator and lesson screenshots were inspected. A source-tree comparison
also confirmed that state, effects, calculations, handlers, and the four
section render trees (including the extracted data-source card) preserve
the original implementation, ignoring formatting.

Repository validation: 30 test files / 269 tests passed, along with lint,
production build, documentation checks, and all 30 power fixtures.

## Completed: Data Manager page

`DataManagerPage.jsx` decreased from 2,484 to 239 lines. The page now composes
the library, workspace, import controls, preview, transformation workbench,
and analysis launcher. Editing state remains mounted at page scope through
three hooks:

| Hook | Lines | Responsibility |
| --- | ---: | --- |
| `useDataManagerEditor.js` | 498 | Editor/draft state, derived previews, metadata edits, and undo |
| `useDataManagerFiles.js` | 366 | Import, save, duplicate, delete, export, and analysis launch |
| `useDataManagerTransforms.js` | 448 | Derived variables, reverse coding, recoding, centering, and reshaping |

The extracted views are `DataManagerHeader`, `DatasetLibraryCard`,
`DatasetWorkspaceSummary`, `DatasetImportControls`, `DatasetPreviewCard`,
and `DatasetAnalysisLauncher`. Their sizes range from 49 to 116 lines.
Dataset status pills and summary fields also have separate components, and
the page reuses the shared analysis card. The existing disabled legacy
transform controls remain disabled in `DatasetLegacyTransforms.jsx`
(434 lines). Pure helpers and options live in
`src/utils/dataManagerHelpers.js` and `src/data/dataManagerOptions.js`.

Nine component tests passed before and after extraction. They cover invalid
imports and recovery, CSV header selection, real Excel sheet switching,
save/clear/reopen/rename, duplication and deletion cancellation, derived
variables, centering and reverse coding, button and keyboard undo, save
failure recovery, and saving dirty data before an analysis launch with its
variable roles. Tests use the real dataset library provider and mock storage
at its persistence boundary.

All 24 browser comparisons matched for displayed content, control values,
and overflow status: empty, imported, centered, and analysis-launcher states
at 375, 768, and 1440 px in both themes. No console errors or React warnings
occurred. Mobile and desktop screenshots were inspected. A source-tree
comparison confirmed that every original page statement moved exactly once
and that all state, effects, handlers, helpers, constants, and extracted
render trees match the original implementation, ignoring formatting.

The baseline already overflowed horizontally at 375 px after import, in
the centered state, and with the launcher open, in both themes. The same six
cases overflow after extraction. Address this in a separate layout change.

Repository validation: 31 test files / 278 tests passed, along with lint,
production build, documentation checks, and all 30 power fixtures. The Data
Manager feature chunk grew from approximately 82.5 to 89.7 kB before gzip
(17.5 to 19.0 kB gzip); bundle optimization remains a separate follow-up.

## Completed: transformation workbench

`DataTransformWorkbench.jsx` decreased from 1,018 to 151 lines. It retains
the selected builder mode and composes six views in
`src/components/data/transforms/`:

| Component | Lines | Responsibility |
| --- | ---: | --- |
| `DerivedVariableBuilder.jsx` | 112 | Operations, source search, and single/pair/multiple selection |
| `ReverseCodeBuilder.jsx` | 147 | Bounds, overwrite option, and reverse-code preview |
| `MeanCenterBuilder.jsx` | 82 | Source selection and centered-variable creation |
| `RecodeBuilder.jsx` | 108 | Category mapping, overwrite option, and preview |
| `RecommendedTransforms.jsx` | 179 | Group membership, aggregate actions, and reverse-coded scale scores |
| `WideToLongTransform.jsx` | 283 | Measure selection, grouping labels, copied columns, and reshape preview |

Six small shared controls also live in that directory. Builder modes and
summary formatting moved to `src/data/dataTransformModes.js` and
`src/utils/dataTransformDisplay.js`. Transformation drafts, calculations,
and action handlers remain in the existing Data Manager hooks.

Six additional interaction tests passed before and after extraction,
bringing Data Manager coverage to 15 tests. They verify category-map
persistence across modes and overwrite behavior; source search and pair
selection limits; edited group averages; reverse-coded scale scores with
undo; multi-measure reshaping with renamed grouping values and preserved
identifiers; and single-measure selection.

All 36 browser comparisons matched for displayed content, control values,
and overflow status: four builder modes, edited recommendations, and a
reshape preview at 375, 768, and 1440 px in both themes. No console errors
or React warnings occurred. A source-tree comparison confirmed that state,
props, all six view trees, shared controls, modes, and formatting preserve
the original implementation. The existing mobile overflow remains present
in all twelve 375 px cases and is tracked below.

Repository validation: 31 test files / 284 tests passed, along with lint,
production build, documentation checks, and all 30 power fixtures. The Data
Manager feature chunk is now approximately 92.1 kB before gzip (19.4 kB
gzip), compared with 89.7 kB (19.0 kB gzip) before this extraction.

## Follow-ups

- Multiple Regression still exceeds the 500-line component limit and
  remains a separate extraction with interaction coverage first.
- Fix Data Manager's existing mobile overflow, including imported data,
  transformation states, and its analysis launcher.
- Bundle optimization remains separate. This build reports approximately
  313 kB for the main chunk, 492 kB for SheetJS, and 55 kB for the Simple Linear
  Regression feature chunk before gzip. The extracted Pearson feature chunk
  is approximately 50 kB before gzip.

Browser comparison artifacts and temporary extraction scripts remain ignored
under `.vite`; they are not production dependencies.
