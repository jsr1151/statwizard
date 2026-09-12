# Structural extraction progress

Updated September 11, 2026.

Probability hardening and extraction of all five oversized files named in
the handoff are complete. Each extraction established interaction coverage
before moving the implementation. Remaining layout and bundle work is
tracked below.

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
and `DatasetAnalysisLauncher`. Their sizes range from 50 to 116 lines.
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
cases overflowed after extraction; the responsive follow-up below resolves them.

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
| `WideToLongTransform.jsx` | 289 | Measure selection, grouping labels, copied columns, and reshape preview |

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
the original implementation. Mobile overflow remained present in all
twelve 375 px cases until the responsive follow-up below.

Repository validation: 31 test files / 284 tests passed, along with lint,
production build, documentation checks, and all 30 power fixtures. The Data
Manager feature chunk is now approximately 92.1 kB before gzip (19.4 kB
gzip), compared with 89.7 kB (19.0 kB gzip) before this extraction.

## Completed: Data Manager responsive layout

The imported workspace expanded a 375 px viewport to 409 px because its
implicit grid track inherited the contents' minimum width. Explicit
single-column tracks and shrinkable grid items now keep it within the
viewport. Long names can wrap, variable summaries and chips stack on small
screens, and the dataset name has its own full-width row above the actions.
Expanded variable editors can also shrink their tag-entry fields.

The analysis launcher previously exceeded the screen height, putting its
top and bottom out of reach. It now uses a named native dialog with a
viewport-height limit and internal vertical scrolling. Close, Escape, and
backdrop dismissal return focus to the opener; the native modal prevents
background controls from receiving focus. Both dataset and reshape preview
tables have named, keyboard-focusable scroll regions with visible focus
styling.

The browser review passed 140 layout checks across 375, 414, 768, 1024, and
1440 px in both themes. It covered empty/imported data, expanded variables,
builder modes, edited recommendations, reshaping, invalid imports, long
names, recovery, and dialog dismissal. None had page overflow or
horizontally clipped controls. Ten dialog checks verified viewport bounds,
initial focus, keyboard traversal, Escape, and focus restoration. Additional
checks at 375 x 667 px verified backdrop dismissal and that Tab/Arrow Right
reach and scroll both wide tables in both themes without moving the page
horizontally. Screenshots were inspected; there were no console errors or
React warnings.

A component test covers the dialog's accessible name and cancel/Close
dismissal. jsdom lacks native dialog methods, so the test supplies only
open/close stubs; real modal focus and scrolling were verified in Edge.
All 31 test files / 285 tests pass, together with lint, production build,
documentation checks, and all 30 power fixtures. The Data Manager feature
chunk is approximately 93.1 kB before gzip (19.7 kB gzip).

## Completed: Multiple Regression extraction

`MultipleRegressionPage.jsx` is now 136 lines. Calculator input, dataset
launch mapping, complete-case summaries, model fitting, and prediction
state live in `useMultipleRegressionCalculator.js` (370 lines). The tutor's
sample generation, scenarios, context, prediction controls, selection, and
floating-visual state live in `useMultipleRegressionLesson.js` (294 lines).
Both hooks remain mounted across section changes, preserving independent
calculator and lesson settings.

The page delegates calculator, lesson, effect-size, and power rendering to
section components. Data setup, predictions, coefficients, lesson controls,
diagnostics, and teaching panels have focused components. The largest new
view is 227 lines. Shared analysis cards, metric tiles, and statistical
formatters replace local duplicates; lesson presets, tooltip copy, and
pure helpers live outside component files.

Tests added before moving the implementation exposed two prerequisite
defects. The pasted-data predictor list was recreated on every render,
invalidating the fitted model and repeatedly resetting prediction state.
Memoizing that list stops the render loop and prevents prediction edits
from publishing an unchanged model. Separately, the model fitter converted
missing values to zero, disagreeing with the complete-case summary. It now
excludes missing, blank, boolean, and nonfinite values while retaining
numeric zero. Tests cover missing outcomes and predictors independently.

Eight page interaction tests cover known coefficients, prediction edits,
confidence levels, incomplete and singular data, recovery, uploads,
scenario/context controls, outliers, visual switching, regeneration,
section/theme persistence, effect size, power mode, and saved-data launches.
Seven model tests cover complete-case filtering. An AST comparison against
the corrected baseline verifies all 15 extracted view trees, visual
branches, both hooks, routing/effect state, tooltip primitives, constants,
and helpers.

All 33 test files / 300 tests pass, together with lint, production build,
documentation checks, and all 30 power fixtures. The browser comparison
passed 36 cases: six sections at 375, 768, and 1440 px in both themes.
Visible text, control values, plotted points, and overflow match the fixed
baseline, with no console errors or React warnings. The comparison waits
for calculator prediction inputs to initialize before taking snapshots.
The extraction preserved the existing overflow; the layout follow-up below
resolves it.

The production build reports approximately 135.2 kB for the Multiple
Regression feature chunk (31.8 kB gzip), compared with 123.3 kB (27.7 kB
gzip) before extraction. Bundle optimization remains a separate task.

## Completed: Multiple Regression responsive layout

At 375 px, the calculator expanded to 846 px and the lesson to 966 px.
Their implicit grid columns inherited the coefficient tables' minimum
widths. Explicit single-column tracks and shrinkable grid items now keep
both sections within the viewport. Long variable names can wrap, summary
badges flow onto another line when needed, and diagnostic status badges sit
below their explanations. The floating graph dock keeps its Minimize
button on one line.

Both coefficient tables now have named, keyboard-focusable scroll regions
with visible focus outlines. The tables retain their column widths and
scroll internally without moving the page sideways.

Browser review passed 170 layout cases at 375, 414, 768, 1024, and 1440 px
in both themes, covering calculator setup/recovery, lesson visualizations,
context/outlier changes, expanded diagnostics, and the floating dock.
Ten additional cases verified fitted models with long variable names.
Four keyboard checks verified Tab access, Arrow Right scrolling, and
visible focus for both tables in both themes. Two checks at 375 x 667 px
verified that the dock stays inside the viewport with a long plot title.
Screenshots were inspected; no console errors or React warnings occurred.

All 33 test files / 300 tests pass, together with lint, production build,
documentation checks, and all 30 power fixtures. All touched components
remain below 500 lines.

## Completed: bundle review and deferred dependencies

The production module audit found that route metadata imported every power
solver into the initial bundle. Power configurations now reference solver
and curve-builder keys; the power engine resolves those keys in a separate
implementation registry. Explicit function callbacks remain supported.
The numerical algorithms are unchanged.

Data Manager previously loaded SheetJS even for CSV-only work. Excel
import and export now load a small workbook adapter on demand. The adapter
uses static named SheetJS imports so tree shaking retains the same library
size. Import loading and error feedback still cover the asynchronous work;
export failures still use the existing error feedback.

Production browser measurements, with cache disabled:

| JavaScript downloaded | Before | After | Reduction |
| --- | ---: | ---: | ---: |
| Main application chunk | 313.44 kB | 232.72 kB | 25.8% |
| Initial page, including vendor | 521.16 kB | 440.45 kB | 15.5% |
| Cold Data Manager visit and CSV workflow | 1,109.04 kB | 536.63 kB | 51.6% |

These are decoded JavaScript bytes, using decimal kB; images and CSS are
excluded. Initial JavaScript is approximately 129.8 kB when each chunk is
gzipped separately. The savings come from loading dependencies later: the
491.83 kB SheetJS chunk is unchanged, and the power UI chunk grows from
about 33.5 kB to 96.6 kB as it takes ownership of the solver code. Analysis
feature bundles can load power support before the power tab is selected.

`npm run bundle:check` builds in memory and checks the final static import
graph. It excludes power solvers from startup, excludes SheetJS from both
startup and the CSV workspace, verifies the Excel adapter remains in the
build, and enforces a 140 kB gzip startup budget. The command is documented
in the README and runs in the deployment workflow before the production
build.

Production Edge checks compared all 27 supported power-mode screens with
the baseline; visible results and inputs matched. CSV export, Excel export
with matching cell values, and multi-sheet Excel import passed. Network
records confirmed SheetJS is absent for CSV and requested for Excel. No
console errors or React warnings occurred. New tests exercise all registered
power modes, sample/effect curves, and solver error handling; the existing
real-workbook test now waits for the deferred import.

All 34 test files / 337 tests pass, together with lint, production build,
documentation checks, all 30 power fixtures, and the new bundle check.
No dependencies were added.

The handoff's probability hardening, five component extractions, documented
layout follow-ups, and bundle review are complete. Further reductions to
individual feature chunks can be considered separately.

Browser comparison artifacts and temporary extraction scripts remain ignored
under `.vite`; they are not production dependencies.
