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
| `RegressionCalculatorSection.jsx` | 354 | Data entry, fitted model, prediction, coefficient and residual views |
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

## Follow-ups

- Pearson Correlation, Data Manager, and Multiple Regression still exceed
  the 500-line component limit. Extract each separately with regression
  coverage; do not replace the current live views with older simplified ones.
- Bundle optimization remains separate. This build reports approximately
  313 kB for the main chunk, 492 kB for SheetJS, and 55 kB for the Simple Linear
  Regression feature chunk before gzip.

Browser comparison artifacts and temporary extraction scripts remain ignored
under `.vite`; they are not production dependencies.
