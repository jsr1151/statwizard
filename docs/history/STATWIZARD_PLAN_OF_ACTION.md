# StatWizard Plan of Action

> **Historical record:** This remediation plan was completed on 2026-07-28. Use the repository README and AI rulebook for current instructions.

**Created:** 2026-07-28
**Status:** Complete
**Purpose:** Convert the repository-wide code audit into a safe, testable implementation roadmap.

## Implementation Progress

### 2026-07-28 - Initial correctness and verification slice

Completed:

- `SW-001`: Added an ESLint flat configuration; lint now runs with zero errors.
- `SW-002`: Added Vitest and the first numerical unit-test suites.
- `SW-004`: Updated the Pages workflow to require lint, tests, power fixtures, and build before deployment.
- `SW-005`: Fixed complete-case pairing so missing values are excluded rather than converted to zero.
- `SW-006`: Replaced the legacy approximate t CDF and critical-value tables with the accurate shared implementation.
- `SW-007` (partial): Corrected t-based intervals and dynamic report labels for the current one-sample, paired, and independent t-test surfaces.
- `SW-010` (partial): Removed the conditional `useState` call in `FormulaDisplay.jsx`.

Verification at this checkpoint:

- lint: zero errors, 17 pre-existing hook dependency warnings retained for follow-up
- numerical unit tests: 13/13 passing
- power fixtures: 30/30 passing
- production build: passing with the existing large-chunk warning

Still required before Phase 0/1 are complete:

- expand trusted reference fixtures across every statistical calculator
- add component tests for generated reports and interactive calculator state

### 2026-07-28 - Factorial ANOVA correctness slice

Completed:

- `SW-003` (partial): Added trusted factorial ANOVA fixtures for balanced 2×2, balanced 2×3, unbalanced 2×2, incomplete-cell, interaction, and no-interaction cases.
- `SW-008`: Replaced the simulated Levene result with a real median-centered Brown–Forsythe test validated against SciPy's published example.
- `SW-008`: Summary-only cells now state that raw observations are required instead of fabricating an inferential result.
- `SW-009`: Replaced harmonic-mean approximations with a general-linear-model implementation for Type I and Type III sums of squares.
- `SW-009`: Type I now uses the documented sequential order A → B → A×B; Type III uses sum-to-zero contrasts.
- `SW-009`: Empty cells and rank-deficient/saturated designs are rejected instead of being treated as zero-valued cells.
- Corrected the formula panel so unbalanced Type III effect sums of squares are not presented as an additive partition of total variance.
- Revised homogeneity guidance so a non-significant variance test is not described as proof that variances are equal.

Verification at this checkpoint:

- numerical unit tests: 22/22 passing
- factorial reference categories: 8 test cases passing
- lint: zero errors, 17 existing hook dependency warnings retained for follow-up
- power fixtures: 30/30 passing
- production build: passing with the existing large-chunk warning

### 2026-07-28 - Application reliability and state-safety slice

Completed:

- `SW-010`: Resolved all recorded React hook dependency warnings by stabilizing derived arrays, callbacks, and effect dependencies according to their intended behavior.
- `SW-011`: Added guarded, schema-validated, version-aware browser-storage helpers with legacy-data migration and unavailable-storage fallbacks.
- `SW-011`: Migrated the ANOVA, factorial ANOVA, and ANCOVA tutor dismissal state to the defensive storage utility.
- `SW-012`: Scoped tutor idle and polling intervals to their relevant analysis pages and clear active tips when a tutor becomes inactive.
- `SW-012`: Removed the duplicate factorial tutor hook and panel instance; the page now uses the single tutor supplied by `App.jsx`.
- `SW-014`: Replaced forced deployment reloads with a dismissible update notice and explicit Reload button.
- Corrected the simple-effects 95% interval to use the residual t critical value instead of `1.96`.

Verification at this checkpoint:

- numerical unit tests: 27/27 passing
- defensive storage tests: 5/5 passing
- lint: zero errors and zero warnings
- power fixtures: 30/30 passing
- production build: passing with the existing large-chunk warning

### 2026-07-28 - Deterministic routing and error-recovery slice

Completed:

- `SW-013`: Added a tested hash-route parser and serializer for the home, modules, search, lessons, wizard, result-section, and power-calculator views.
- Made the URL authoritative for page identity so fresh loads, refreshes, and browser back/forward navigation restore the correct view.
- Preserved in-session wizard answers and navigation history when a matching browser-history entry is available without placing calculator data in the URL.
- Added canonical fallback behavior for invalid or incomplete hashes and deterministic default result sections for power-enabled analyses.
- Added power-mode deep links and synchronized power-calculator mode changes with the current route.
- Reworked application and visualizer error boundaries with Retry/Reset and Return Home actions, route-aware resets, and development-only diagnostic details.

Verification at this checkpoint:

- route parser/serializer tests: 19/19 passing
- complete automated test suite: 46/46 passing across 5 files
- lint: zero errors and zero warnings
- power fixtures: 30/30 passing
- production build: passing with the existing large-chunk warning (1,062.77 kB JavaScript; 261.00 kB gzip)

Phase 2 is complete. The next implementation slice is Phase 3 architecture work, beginning with `SW-015` and `SW-016` so route-level code splitting can subsequently address the bundle-size warning.

### 2026-07-28 - Result-shell architecture slice

Completed:

- `SW-015`: Reduced `App.jsx` from roughly 1,175 lines to 416 lines so it now focuses on route state, shared application state, tutor hook coordination, and page composition.
- Extracted the result experience into focused components for result navigation, equation exploration, assumptions, software guidance, and visualizer dispatch.
- Extracted the ANOVA, factorial ANOVA, and ANCOVA tutor overlays into a dedicated host with non-JSX explanation content stored separately.
- Added a pure result-presentation mapper for variability tabs, formula selection, software guides, symbol keys, and visualizer layout decisions.
- Added focused presentation-mapping and layout-helper tests.
- Removed the unreachable simulated-AI modal and response stub; there was no UI action capable of opening it.
- All new components remain below the rulebook's 500-line hard cap; the largest new result component is 263 lines.

Verification at this checkpoint:

- complete automated test suite: 51/51 passing across 6 files
- result-presentation tests: 5/5 passing
- lint: zero errors and zero warnings
- power fixtures: 30/30 passing
- production build: passing with the existing large-chunk warning (1,062.55 kB JavaScript; 262.81 kB gzip)

The next Phase 3 slice is `SW-016`: split the oversized feature visualizers, beginning with `ProbabilityVisual.jsx`. Route-level code splitting (`SW-020`) should follow once those feature boundaries are stable.

### 2026-07-28 - Probability visualizer decomposition slice

Completed:

- `SW-016` (partial): Reduced `ProbabilityVisual.jsx` from roughly 2,414 source lines to a 20-line mode dispatcher.
- Split probability basics, rules, coin experiments, dice experiments, spinner experiments, paradoxes, and card activities into user-oriented feature components under `src/components/probability/`.
- Split the card suite further into poker odds, hunt/betting, replacement, deck tracking, poker outs, and Hi-Lo counting panels.
- Preserved activity state when switching top-level probability modes by keeping the extracted mode components mounted but hidden when inactive.
- Removed the unreachable standalone card-betting branch, which had no navigation option; the active Hunt & Bet experience retains the expected-value controls.
- Moved combinations, binomial probability, and exact dice-sum distributions into `src/stats/probability.js`.
- Added numerical tests for combinatorics, binomial probabilities, normalization, exact two-die probabilities, nonstandard dice, and invalid domains.
- Every extracted probability component is below the 500-line hard cap; the largest is 242 lines.

Verification at this checkpoint:

- complete automated test suite: 60/60 passing across 7 files
- probability-domain tests: 9/9 passing
- lint: zero errors and zero warnings
- power fixtures: 30/30 passing
- production build: passing with the existing large-chunk warning (1,061.89 kB JavaScript; 263.30 kB gzip)

`SW-016` continues with `NormalDistributionVisual.jsx`, followed by the factorial ANOVA, ANCOVA, correlation, and regression surfaces.

### 2026-07-28 - Normal and t distribution decomposition slice

Completed:

- `SW-016` (partial): Reduced `NormalDistributionVisual.jsx` from roughly 1,017 source lines to 367 lines.
- Extracted the interactive curve, rejection regions, power/error shading, plot legends, and p-value explanation into `DistributionChart.jsx`.
- Extracted significance, tails, degrees-of-freedom, calculator, confidence-interval, reporting, and raw-data controls into `DistributionControls.jsx`.
- Kept both extracted distribution components below the 500-line hard cap; the chart is the largest at 458 lines.
- Moved one-sample z/t critical values, p-values, significance decisions, confidence intervals, effect size, standard error, and raw-sample summaries into `src/stats/oneSampleTest.js`.
- Added numerical tests for two-sided and directional z tests, t-distribution p-values, confidence intervals, raw-data parsing, sample standard deviation, and insufficient samples.
- Unified two competing `onStatsUpdate` effects into one complete result payload containing calculator values, aliases, p-value, critical value, and significance decision.
- Raw-data mode now waits for at least two valid observations instead of producing a `NaN` sample standard deviation from a single value.

Verification at this checkpoint:

- complete automated test suite: 66/66 passing across 8 files
- one-sample distribution tests: 6/6 passing
- lint: zero errors and zero warnings
- power fixtures: 30/30 passing
- production build: passing with the existing large-chunk warning (1,064.67 kB JavaScript; 264.71 kB gzip)

`SW-016` continues with `FactorialAnovaVisual.jsx`, followed by ANCOVA, correlation, and regression.

### 2026-07-28 - Factorial ANOVA decomposition slice

Completed:

- `SW-016` (partial): Reduced `FactorialAnovaVisual.jsx` from 931 source lines to 310 lines.
- Extracted navigation/theme selection, interaction-plot controls, ANOVA effect cards, post-hoc comparisons, diagnostics, reporting, and interpretation into focused presenter components.
- Kept every extracted factorial component below the 500-line hard cap; the largest is 122 lines.
- Added an accessible F-curve tab for the existing but previously unreachable `FSamplingDist` view, with the selected ANOVA effect driving its statistic and degrees of freedom.
- Moved raw-cell parsing, sample summaries, dataset-empty detection, tutor context construction, and residual histogram binning into `src/stats/factorialAnovaViewModel.js`.
- Added focused tests for strict raw-value parsing, sample SD, raw/summary empty-state handling, constant residual histograms, interaction classification, and exact zero p-values.
- Fixed the Clear All control so it clears the factorial dataset instead of only emitting a tutor signal.
- Preserved in-progress raw input text so users can type delimiters and multi-value samples without the controlled textarea erasing separators.
- Connected the calculated factorial context to `useFactorialAnovaTutor`, allowing its existing context-based guidance rules to run.

Verification at this checkpoint:

- complete automated test suite: 70/70 passing across 9 files
- focused factorial ANOVA and view-model tests: 13/13 passing
- lint: zero errors and zero warnings
- power fixtures: 30/30 passing
- production build: passing with the existing large-chunk warning (1,064.05 kB JavaScript; 264.90 kB gzip)
- `git diff --check`: passing; only the repository's existing CRLF conversion notices remain

`SW-016` continues with `AncovaVisual.jsx`, followed by correlation and regression. The remaining independent t-test and formula-display files also exceed the rulebook cap and remain in the oversized-file audit.

### 2026-07-28 - ANCOVA decomposition and model extraction slice

Completed:

- `SW-016` (partial): Reduced `AncovaVisual.jsx` from 922 source lines to 185 lines.
- Extracted data/preset setup, adjusted scatterplot controls, ANCOVA results, adjusted comparisons and diagnostics, and the F-distribution calculator into focused presenter components.
- Kept every extracted ANCOVA presenter below 100 lines; the largest is 81 lines.
- Moved the initial examples and study presets into `src/data/ancovaPresets.js` with stable identifiers and no JSX.
- `SW-017` (partial): Moved raw-series parsing, group hydration, common-slope ANCOVA, the slopes-interaction test, adjusted means, residual variances, and pairwise adjusted comparisons into `src/stats/ancova.js`.
- Corrected incomplete-group handling so only complete groups contribute to `k`, group degrees of freedom, and model error degrees of freedom.
- Corrected adjusted pairwise standard errors to use within-group covariate SS rather than residual outcome SS.
- Hardened zero-error and floating-point edge cases for F ratios, separate-slope error, and pairwise statistics.
- Allowed the standalone F calculator to publish valid results even when the data-entry model is incomplete.
- Added focused numerical tests for strict parsing, a hand-calculated common-slope model, incomplete groups, adjusted pairwise standard errors, and insufficient data.

Verification at this checkpoint:

- complete automated test suite: 75/75 passing across 10 files
- focused ANCOVA tests: 5/5 passing
- lint: zero errors and zero warnings
- power fixtures: 30/30 passing
- production build: passing with the existing large-chunk warning (1,059.17 kB JavaScript; 265.16 kB gzip)
- `git diff --check`: passing; only the repository's existing CRLF conversion notices remain

`SW-016` continues with `PearsonCorrelationPage.jsx`, followed by simple linear regression. The independent t-test visual and formula display remain in the oversized-file audit.

### 2026-07-28 - Pearson correlation page decomposition slice

Completed:

- `SW-016` (partial): Reduced `PearsonCorrelationPage.jsx` from 907 source lines to a 46-line section dispatcher.
- Extracted the calculator, concept lesson, effect-size translator, and power-planning surface into independent section components that own only their active state.
- Kept every extracted correlation component below the 500-line hard cap; the largest is 103 lines.
- Moved correlation sample data and tutor preset metadata into `src/data/pearsonCorrelationPresets.js`.
- `SW-018` (partial): Added shared `AnalysisCard` and `AnalysisMetricTile` components for the duplicated correlation/regression page vocabulary.
- Added shared finite-statistic and conventional p-value formatters in `src/utils/statFormatters.js`, with focused tests for rounding, trailing zeroes, non-finite values, and small p-values.
- Scoped lesson generation, calculator parsing, and effect-size translation state to their respective sections instead of keeping every section active in one monolith.
- Calculator invalidation now clears stale page statistics instead of leaving the previous valid result visible to downstream panels.

Verification at this checkpoint:

- complete automated test suite: 77/77 passing across 11 files
- focused correlation-pairing and formatter tests: 8/8 passing
- lint: zero errors and zero warnings
- power fixtures: 30/30 passing
- production build: passing with the existing large-chunk warning (1,051.77 kB JavaScript; 263.79 kB gzip)
- `git diff --check`: passing; only the repository's existing CRLF conversion notices remain

`SW-016` and `SW-018` continue together with `SimpleLinearRegressionPage.jsx`, which can now adopt the shared analysis primitives. The independent t-test visual and formula display remain in the oversized-file audit.

### 2026-07-28 - Simple regression page decomposition slice

Completed:

- `SW-016` (partial): Reduced `SimpleLinearRegressionPage.jsx` from 845 source lines to a 46-line section dispatcher.
- Extracted the regression calculator, concept lesson, effect-size translator, and power-planning surface into independent section components with scoped state.
- Kept every extracted regression component below the 500-line hard cap; the largest is 95 lines.
- Moved regression sample data and tutor preset metadata into `src/data/regressionPresets.js`.
- `SW-018` (partial): Reused the shared `AnalysisCard`, `AnalysisMetricTile`, `formatStatistic`, and `formatPValue` implementations introduced by the correlation slice, removing the second maintained copy of each concept.
- Preserved regression scatterplots, confidence and prediction bands, residual plots, coefficient inference, lesson presets, outlier exploration, effect-size translation, and power integration behind focused component boundaries.
- Regression calculator invalidation now clears stale page statistics consistently with the correlation calculator.

Verification at this checkpoint:

- complete automated test suite: 77/77 passing across 11 files
- focused complete-case and shared-formatter tests: 8/8 passing
- lint: zero errors and zero warnings
- power fixtures: 30/30 passing
- production build: passing with the existing large-chunk warning (1,042.96 kB JavaScript; 263.25 kB gzip)
- `git diff --check`: passing; only the repository's existing CRLF conversion notices remain

The six visualizers originally prioritized under `SW-016` are now below the rulebook cap. The oversized-file audit still contains `IndependentTTestVisual.jsx` and `FormulaDisplay.jsx`; the independent t-test visual is the next structural target.

### 2026-07-28 - Independent t-test decomposition and model extraction slice

Completed:

- `SW-016` (partial): Reduced `IndependentTTestVisual.jsx` from 707 source lines to a 128-line state and integration coordinator.
- Extracted the sampling/group-curve/plot display, statistical controls, and repeated group input panel into focused components; the largest extracted file is 117 lines.
- Preserved plot type, error bars and direction, fill patterns, colors, labels, range, outline, grid, and image-copy controls within the dedicated chart component.
- `SW-017` (partial): Moved pooled and Welch standard errors, Welch-Satterthwaite degrees of freedom, p-values, critical values, confidence bounds, effect sizes, variance ratios, raw-sample summaries, and report construction into `src/stats/independentTTest.js`.
- Added focused numerical tests for pooled and Welch reference cases, directional alternatives, one-sided confidence bounds, raw-sample summaries, and report labels.
- Fixed raw-data entry so incomplete text remains visible instead of being discarded by the controlled textarea.
- Enforced the model's minimum sample size of two observations per group and protected the visual layer from zero-standard-error infinities.
- Replaced direct DOM text mutation, alerts, and console logging in copy actions with explicit status state and guarded Clipboard API handling.

Verification at this checkpoint:

- complete automated test suite: 82/82 passing across 12 files
- focused independent t-test tests: 5/5 passing
- lint: zero errors and zero warnings
- power fixtures: 30/30 passing
- production build: passing with the existing large-chunk warning (1,029.72 kB JavaScript; 262.11 kB gzip)
- `git diff --check`: passing; only the repository's existing CRLF conversion notices remain

The component oversized-file audit now has one remaining target: `FormulaDisplay.jsx` at 642 lines. It is the next `SW-016` structural slice.

### 2026-07-28 - Formula display decomposition and render coverage slice

Completed:

- `SW-016`: Reduced `FormulaDisplay.jsx` from 642 source lines to a 28-line stateless formula-family dispatcher.
- Extracted basic/descriptive formulas, t-test formulas, one-way ANOVA, factorial ANOVA, ANCOVA, and bounded-summation presentation into focused components.
- Moved the one-way ANOVA raw/summary within-group formula state into `AnovaFormulaDisplay.jsx`, the only component that uses it, completing the earlier `SW-010` hook fix structurally.
- Preserved formula values, term tooltips, hover guidance, pooled/Welch variants, worked one-way ANOVA output, Type III non-additivity guidance, and partial effect-size presentation behind the new boundaries.
- Added keyboard activation to the clickable ANOVA effect-size cards and explicit button types to the interactive formula tabs.
- `SW-019` (partial): Removed the formula file's copied unused imports and consistently formatted all extracted formula modules.
- Added server-render smoke tests covering every supported formula identifier, pooled and Welch independent-test branches, balanced and unbalanced Type III factorial output, and the unknown-formula fallback.
- Every React component now satisfies the rulebook's 500-line hard cap; the largest extracted formula component is the 364-line one-way ANOVA lesson.

Verification at this checkpoint:

- complete automated test suite: 86/86 passing across 13 files
- focused formula rendering tests: 4/4 passing
- lint: zero errors and zero warnings
- power fixtures: 30/30 passing
- production build: passing with the existing large-chunk warning (1,025.83 kB JavaScript; 261.86 kB gzip)
- `git diff --check`: passing; only the repository's existing CRLF conversion notices remain

`SW-016` is complete and the Phase 3 component-size exit criterion is satisfied. The feature boundaries are now stable enough to begin `SW-020` route-level code splitting, which is the next target for the persistent bundle-size warning.

### 2026-07-28 - Route and analysis code-splitting slice

Completed:

- `SW-020`: Added lazy route boundaries for modules, search, lessons, the power hub, result pages, and the tutor overlay while keeping the home menu immediately available.
- Added independent lazy chunks for probability, distributions, ANOVA/factorial ANOVA/ANCOVA, t-test visualizers, correlation, regression, descriptive visualizers, formulas, power analysis, and effect-size panels.
- Added an accessible shared loading fallback with a polite live-region status for route and analysis transitions.
- Removed the full power registry and solver graph from `App.jsx` by introducing a lightweight power-route registry containing only step identifiers and implemented modes.
- Moved full power configuration lookup into the lazy result shell so solver code is requested only when a power or result surface needs it.
- Added a parity test that requires the lightweight route registry to match every step and implemented mode in the full power registry.
- Preserved canonical hash parsing, direct result/power deep links, result-section defaults, error-boundary placement, calculator state callbacks, and tutor activation wiring across the lazy boundaries.

Bundle result:

- primary JavaScript chunk: reduced from 1,025.83 kB to 303.09 kB minified (about 70% smaller)
- primary gzip size: reduced from 261.86 kB to 94.14 kB
- largest deferred feature chunk: 110.69 kB for the probability suite
- Vite's 500 kB oversized-chunk warning: resolved

Verification at this checkpoint:

- complete automated test suite: 87/87 passing across 14 files
- focused power-route and hash-route tests: 20/20 passing
- lint: zero errors and zero warnings
- power fixtures: 30/30 passing
- production build: passing with no oversized-chunk warning
- `git diff --check`: passing; only the repository's existing CRLF conversion notices remain
- component audit: no React component exceeds 500 lines; `App.jsx` remains at 400 lines

`SW-020` is complete and the initial bundle target is satisfied. The next Phase 4 priority is `SW-021`: review and upgrade vulnerable development dependencies in an isolated dependency-focused slice.

### 2026-07-28 - Dependency and development-server security slice

Completed:

- `SW-021`: Reduced `npm audit` from 11 vulnerabilities (8 high, 1 moderate, 2 low) to zero known vulnerabilities.
- Updated Vite within its existing major line from 7.3.1 to 7.3.6 and PostCSS from 8.5.6 to 8.5.24, resolving the direct path-traversal, file-disclosure, and stylesheet-stringification advisories.
- Updated React/React DOM to 19.2.8, Tailwind and its Vite plugin to 4.3.3, the React SWC plugin to 4.3.2, Autoprefixer to 10.5.4, React types to 19.2.17, and the React hooks lint plugin to 7.1.1.
- Applied compatible transitive lockfile repairs for Rollup, esbuild, picomatch, YAML parsing, AJV, flatted, minimatch, and related tooling dependencies.
- Performed a reviewed ESLint 9 to ESLint 10 upgrade after confirming Node and React-plugin compatibility; this removed the remaining high-severity glob-expansion chain without using a blind forced audit fix.
- Kept unrelated major upgrades for Vite 8, Lucide 1.x, globals 17, and the React Refresh lint plugin out of the security patch because they are not required to resolve an advisory.
- Retained the stricter ESLint 10 recommended rule set and removed four dead initial assignments that the upgraded linter identified.
- Changed the Vite development server default from `0.0.0.0` to `127.0.0.1`, preventing unintended LAN exposure while preserving local development.

Verification at this checkpoint:

- `npm audit`: 0 vulnerabilities across 260 dependencies
- complete automated test suite: 87/87 passing across 14 files
- lint with ESLint 10.8.0: zero errors and zero warnings
- power fixtures: 30/30 passing
- production build with Vite 7.3.6: passing with no oversized-chunk warning
- primary JavaScript chunk remains 303.09 kB minified / 94.14 kB gzip
- `git diff --check`: passing; only the repository's existing CRLF conversion notices remain

`SW-021` is complete. The next Phase 4 priority is `SW-022`: systematic accessibility remediation and automated accessibility smoke coverage now that the major UI boundaries are stable.

### 2026-07-28 - Accessibility remediation and automated baseline slice

Completed:

- `SW-022`: Added an automated WCAG smoke-test baseline with `axe-core` 4.12.1 and the Node-compatible `jsdom` 29.1.1 release. The focused `npm run test:a11y` command covers the header, main menu, result navigation, search, update notification, and explorable equation terms; the normal CI test command also runs this suite.
- Added accessible names, explicit button types, decorative-icon hiding, toggle/current-state semantics, and visible focus treatment across the shared header, primary navigation, module browser, search, result tabs, power hub, tutor controls, frequency controls, and representative calculator controls.
- Replaced mouse-only explorable equation spans with semantic buttons that support focus, keyboard activation, and the same symbol-key highlighting used by pointer hover.
- Added a global `prefers-reduced-motion` fallback and disabled the update-toast entrance animation when reduced motion is requested.
- Added polite live announcements for update availability and copy-to-clipboard outcomes without relying on direct DOM text mutation.
- Added programmatic labels to the main distribution inputs, independent t-test settings, and search control; selection buttons now expose their active state with `aria-pressed` or `aria-current`.
- Added meaningful image labels to the correlation, regression, residual, power-curve, t/F distribution, ANCOVA, and independent-test SVG paths audited in this slice.
- Converted the p-value explanation trigger to a real button and marked its explanation as a modal dialog with an initial keyboard focus target.
- Extracted the distribution legend into `DistributionChartLegend.jsx`, keeping the SVG-heavy `DistributionChart.jsx` at 451 lines and every React component under the rulebook's 500-line cap.

Verification at this checkpoint:

- focused accessibility smoke suite: 4/4 passing with no axe violations in the representative WCAG A/AA checks
- complete automated test suite: 91/91 passing across 15 files
- lint: zero errors and zero warnings
- power fixtures: 30/30 passing
- `npm audit`: zero known vulnerabilities
- production build: passing with no oversized-chunk warning
- primary JavaScript chunk: 304.36 kB minified / 94.39 kB gzip
- `git diff --check`: passing; only the repository's existing CRLF conversion notices remain

Manual release testing remains intentionally required because automation cannot validate the full assistive-technology experience. Before a public accessibility claim, test the menu and every calculator with keyboard-only navigation and at least NVDA/Firefox or NVDA/Chrome plus VoiceOver/Safari; verify focus order and dialog focus return; inspect both themes for contrast; test 200% and 400% zoom/reflow; and confirm that every drag interaction has an equivalent labeled form control. The automated suite is a regression baseline, not a substitute for that matrix.

`SW-022` is complete at the planned automated/core-workflow scope. The next Phase 4 priority is `SW-023`: fix the favicon, metadata, and conflicting product version identity.

### 2026-07-28 - Product metadata and version identity slice

Completed:

- `SW-023`: Replaced the missing `/vite.svg` reference with a repository-owned `public/statwizard-mark.svg` favicon that is emitted under the configured GitHub Pages base path.
- Made `package.json` the canonical identity record for the package name, display name, tagline, description, homepage, and semantic version.
- Removed the conflicting “Alpha” and “BETA v9.6” labels. The application now consistently presents `StatWizard v1.0.0`, and the header reads the version through the shared `src/config/product.js` adapter.
- Added a Vite HTML transform that derives the document title, description, application name, canonical URL, Open Graph fields, and Twitter summary fields from the canonical package metadata.
- Added light/dark theme-color metadata and declared the supported color scheme.
- Extended the deployment `version.json` manifest with the same package version while retaining the unique build timestamp used by the non-destructive update notification.
- Added product-metadata regression tests that verify canonical-source parity, required document/social metadata, favicon routing, template replacement, and removal of stale stage labels.

Verification at this checkpoint:

- focused metadata/accessibility tests: 6/6 passing
- complete automated test suite: 93/93 passing across 16 files
- lint: zero errors and zero warnings
- power fixtures: 30/30 passing
- `npm audit`: zero known vulnerabilities
- production build: passing with no oversized-chunk warning
- generated document metadata contains no unresolved product tokens and uses `/statwizard/statwizard-mark.svg`
- generated deployment manifest contains version `1.0.0` and a unique build timestamp
- primary JavaScript chunk: 304.81 kB minified / 94.59 kB gzip
- `git diff --check`: passing; only the repository's existing CRLF conversion notices remain

`SW-023` is complete. The next and final planned Phase 4 work item is `SW-024`: add the repository README and archive stale artifacts and historical implementation notes.

### 2026-07-28 - Repository documentation and historical archive slice

Completed:

- `SW-024`: Added a current root `README.md` covering the product, prerequisites, local setup, commands, architecture, statistical validation policy, accessibility expectations, versioning, deployment, contribution rules, and historical-record routing.
- Added `npm run docs:check` to enforce required documentation, current README sections, valid local documentation links, historical status banners, and removal of known stale root artifacts.
- Added the documentation check to the GitHub Pages deployment gate alongside lint, tests, power fixtures, and the production build.
- Retained `AI_RULEBOOK.md` at the repository root as active engineering policy.
- Moved this completed plan and the dated power-analysis implementation report into `docs/history/`, added explicit historical banners, and added a history index that directs readers back to current instructions.
- Removed the obsolete `deploy_working.yml` workflow duplicate and the generated `build.log` failure artifact. Both remain recoverable from Git history.
- Expanded `.gitignore` to exclude coverage output, log files, and common operating-system metadata.

Verification at this checkpoint:

- documentation check: 6/6 required files passing, including local-link validation
- complete automated test suite: 93/93 passing across 16 files
- lint: zero errors and zero warnings
- power fixtures: 30/30 passing
- `npm audit`: zero known vulnerabilities
- production build: passing with no oversized-chunk warning
- component audit: no JSX file exceeds 500 lines
- primary JavaScript chunk: 304.81 kB minified / 94.59 kB gzip
- `git diff --check`: passing; only the repository's existing CRLF conversion notices remain

`SW-024` and the planned Phase 4 backlog are complete. This document is now a historical implementation record; future work should begin from the current README, rulebook, automated gates, and a newly scoped issue or roadmap.

## 1. Executive Summary

StatWizard has a strong educational concept and a promising newer architecture under `src/stats/` and `src/power/`. The immediate concern is that several legacy calculators can display plausible but incorrect results, while the repository currently lacks the automated checks needed to prevent regressions.

Work should proceed in this order:

1. Establish a reliable test and lint baseline.
2. Correct statistical calculations and misleading output.
3. Fix application-level reliability and data-loss risks.
4. Break apart oversized components and remove duplication.
5. Improve performance, accessibility, security, and documentation.

Correctness work must come before broad formatting or visual redesign. Refactoring statistical code without pinned expected results would make it difficult to distinguish an intentional change from a regression.

## 2. Guiding Principles

- **Correctness before polish.** Statistical output must be defensible before UI refinement.
- **One statistical source of truth.** Distribution functions and critical-value calculations should not have competing implementations.
- **Tests before risky refactors.** Capture current intended behavior and known reference values first.
- **Never present approximations as exact output.** Educational approximations must be clearly labeled and must not produce formal pass/fail conclusions unless validated.
- **Preserve working vertical slices.** The power-analysis fixture suite and newer correlation/regression architecture should remain operational throughout the work.
- **Small, reviewable commits.** Each commit should address one concern and leave the build usable.
- **Follow `AI_RULEBOOK.md`.** In particular, restore the 500-line component limit and keep `App.jsx` focused on orchestration.

## 3. Release Gates

Before a revised version is considered ready for deployment, all of the following must be true:

- Production build passes.
- ESLint passes with no errors.
- Unit and numerical reference tests pass.
- Existing power fixtures pass.
- No calculator treats a missing value as zero unless the user explicitly entered zero.
- No displayed diagnostic is mocked or unlabeled.
- Statistical reports reflect the selected test, alpha, tails, and confidence level.
- Direct module URLs work on a fresh browser load.
- A deployment cannot automatically discard an active analysis without user confirmation.
- High-severity direct dependency advisories are resolved or explicitly documented with mitigation.
- The deployed site passes a focused keyboard and screen-reader smoke test.

## 4. Recommended Work Sequence

### Phase 0: Create the Safety Net

**Goal:** Make failures visible before changing numerical or architectural code.

#### 0.1 Restore the lint command

Create `eslint.config.js` using the packages already declared in `package.json`:

- `@eslint/js`
- `eslint-plugin-react-hooks`
- `eslint-plugin-react-refresh`
- `globals`

Configure separate browser and Node scopes for:

- `src/**/*.{js,jsx}`
- `scripts/**/*.mjs`
- `vite.config.js`

Start with rules that catch correctness problems:

- React hook ordering
- missing hook dependencies
- duplicate object keys
- undefined variables
- unused imports and variables

Do not suppress findings globally. If a rule needs an exception, make it narrow and explain why.

**Acceptance criteria:**

- `npm run lint` executes successfully.
- Existing findings are either corrected or recorded as explicitly scoped follow-up items.
- The conditional hook in `FormulaDisplay.jsx` is treated as a blocking error.

#### 0.2 Add a test runner

Add Vitest as the initial unit/numerical test runner. Add scripts such as:

```json
{
  "test": "vitest run",
  "test:watch": "vitest"
}
```

Recommended initial test locations:

```text
src/stats/__tests__/
src/power/__tests__/
src/utils/__tests__/
```

React Testing Library and browser-level tests can follow after the numerical baseline. The first goal is fast, deterministic validation of pure functions.

#### 0.3 Establish numerical reference cases

Create fixtures from trustworthy external references or independently verified calculations for:

- one-sample t test
- paired-samples t test
- independent-samples Student t test
- Welch t test
- one-way ANOVA
- two-way factorial ANOVA
- Pearson correlation
- simple linear regression
- confidence intervals
- missing-value behavior

Each fixture should record:

- input values
- expected statistic
- degrees of freedom
- expected p-value
- expected confidence interval when applicable
- reference source and tolerated numerical error

Use tight tolerances for deterministic central-distribution calculations. Do not use snapshots as the primary validation for numerical output.

#### 0.4 Strengthen continuous integration

Update `.github/workflows/deploy.yml` so deployment depends on a verification job that runs:

```text
npm ci
npm run lint
npm test
npm run power:fixtures
npm run build
```

The deploy job must not run if any verification step fails.

**Phase 0 exit criteria:**

- The project has working lint and test commands.
- CI blocks statistically or structurally invalid changes.
- The current 30-case power fixture suite remains green.

---

### Phase 1: Correct Statistical Output

**Goal:** Eliminate silent data corruption, inaccurate t-test output, and simulated diagnostics.

#### 1.1 Fix complete-case pairing

**Affected files:**

- `src/utils/delimitedTable.js`
- `src/stats/correlation.js`
- `src/stats/regression.js`
- correlation and regression tests

Current behavior converts parser `null` values to zero through `Number(null)`.

Implementation approach:

1. Define a shared predicate that distinguishes missing values from valid numeric zero.
2. Reject `null`, `undefined`, empty strings, and nonnumeric strings before numeric conversion.
3. Pair X/Y values by row and retain a row only when both values are finite numbers.
4. Return metadata describing included and excluded row counts.
5. Show the exclusion count in the calculator UI so users understand the analyzed `N`.

Required tests:

- blank X with valid Y is excluded
- valid X with blank Y is excluded
- explicit `0` remains valid
- whitespace-only cells are excluded
- nonnumeric cells are excluded
- row alignment remains intact
- fewer than the minimum complete cases produces a clear error

**Acceptance criteria:** Missing observations never enter an analysis as zero unless zero was explicitly supplied.

#### 1.2 Consolidate Student-t mathematics

**Affected files:**

- `src/utils/mathHelpers.js`
- `src/power/tMath.js`
- `src/components/visuals/NormalDistributionVisual.jsx`
- `src/components/visuals/PairedTTestVisual.jsx`
- `src/components/visuals/IndependentTTestVisual.jsx`

The accurate `studentTCDF` and `studentTCriticalValue` implementation in `src/power/tMath.js` should become the shared source of truth.

Implementation approach:

1. Move generally applicable central t-distribution functions into a neutral statistics/math module, or formally expose `tMath.js` as the shared implementation.
2. Replace the approximate `tCDF()` and lookup/interpolation tables in legacy visualizers.
3. Use the same implementation for p-values, critical values, and confidence intervals.
4. Validate alpha, tails, direction, sample size, and degrees of freedom before calculation.
5. Remove obsolete lookup tables only after all consumers are migrated and tested.

Mandatory reference cases include:

- `t(1) = 12.706` gives a two-sided p-value near `.050`
- `t(2) = 4.303` gives a two-sided p-value near `.050`
- one- and two-tailed direction handling
- alpha `.01`, `.05`, and `.10`
- fractional Welch degrees of freedom

**Acceptance criteria:** Every t-test surface agrees on p-values and critical values for the same inputs.

#### 1.3 Correct confidence intervals and generated reports

**Affected files:**

- `src/components/visuals/NormalDistributionVisual.jsx`
- `src/components/visuals/PairedTTestVisual.jsx`
- `src/components/visuals/IndependentTTestVisual.jsx`

Required corrections:

- Replace the paired-test hardcoded `1.96` interval multiplier with the correct t critical value.
- Make interval labels reflect the selected confidence level.
- Make APA output reflect one-sided versus two-sided intervals where supported.
- Report one-sample t tests as t tests, not z tests.
- Label sample SD as `s` for t tests and population SD as `sigma` for z tests.
- Fix the independent-test clipboard string so Cohen's d is interpolated rather than copied as source text.
- Ensure copied output exactly matches the values shown on screen.

Required tests:

- report text for z, one-sample t, paired t, Student independent t, and Welch t
- 90%, 95%, and 99% interval labels and bounds
- one-tailed direction labels
- clipboard/report formatter unit tests separated from rendering code

#### 1.4 Replace simulated Levene output

**Affected files:**

- `src/utils/mathHelpers.js`
- `src/components/visuals/FactorialAnovaVisual.jsx`

Preferred approach:

1. Implement a real Levene or Brown-Forsythe test for raw cell data.
2. Validate it against trusted reference output.
3. For summary-only inputs, do not fabricate a p-value. State that the diagnostic requires raw observations unless a validated summary-data method is deliberately supported.

Short-term safe alternative:

- Remove the p-value and pass/fail badge.
- Replace them with a clearly labeled descriptive variance warning based on SD ratios.

Also revise educational language: `p > .05` does not confirm equal variances; it means the test did not find sufficient evidence of unequal variances.

#### 1.5 Correct factorial sums-of-squares handling

**Affected files:**

- `src/utils/mathHelpers.js`
- `src/components/visuals/FactorialAnovaVisual.jsx`

Implementation approach:

1. Define the supported model explicitly: two-way between-subjects factorial ANOVA.
2. Detect balance by comparing every populated cell size, not by checking whether total N is divisible by the number of cells.
3. Implement validated Type I and Type III calculations using a design-matrix/general-linear-model approach.
4. Define behavior for empty cells and rank-deficient designs.
5. Label any intentionally simplified teaching calculation as an approximation and keep it separate from formal result output.

Required fixture categories:

- balanced 2x2
- balanced larger design
- unbalanced design
- empty cell
- unequal cell variances
- interaction present and absent
- comparison with trusted statistical software output

**Phase 1 exit criteria:**

- No known calculator silently alters data.
- All t-test output uses validated shared mathematics.
- No mocked inferential statistic is displayed as real.
- Reports and confidence intervals match user-selected settings.

---

### Phase 2: Application Reliability and State Safety

**Goal:** Prevent runtime crashes, broken links, unnecessary background work, and analysis loss.

#### 2.1 Fix React hook violations

Move `FormulaDisplay` state to the unconditional top level of the component or extract the ANOVA formula into its own component.

Review and resolve the hooks-focused lint findings, especially:

- conditional hooks
- missing dependencies
- functions referenced before declaration in effects
- random-number generation during render
- effects used only to mirror derived state

Do not mechanically add every value to a dependency array. First decide whether the effect is necessary, whether the value should be derived during render, or whether the callback needs stable identity.

#### 2.2 Make tutor persistence defensive

Create a small storage utility with:

- guarded reads
- JSON validation
- fallback values
- guarded writes
- optional schema/version handling

Migrate:

- `useAnovaTutor`
- `useFactorialAnovaTutor`
- `useAncovaTutor`

Only mount or activate tutor timers for the relevant analysis page. The current top-level hooks create background intervals even when the user is on the menu or an unrelated module.

**Acceptance criteria:** Invalid or unavailable local storage never prevents the main application from rendering.

#### 2.3 Implement deterministic routing

Replace ad hoc history synchronization with either:

- a small tested route parser/serializer, or
- a lightweight router appropriate for GitHub Pages hash routing.

Required behaviors:

- direct fresh load of a result/module URL
- browser back and forward
- refresh on a module page
- invalid route fallback
- menu/home navigation
- power calculator deep links if retained

The URL should be sufficient to reconstruct the page identity. Ephemeral calculator data does not need to be placed in the URL.

#### 2.4 Protect active work during deployments

Change the deployment update flow from forced reload to user-controlled reload:

- show “A new version is available”
- provide a Reload button
- allow dismissal/postponement
- optionally warn when unsaved calculator input exists

Clear all polling and countdown timers during cleanup.

#### 2.5 Add an application-level error recovery path

Keep error boundaries around complex visualizers, but make the fallback user-oriented:

- concise explanation
- retry/reset action
- return-home action
- development-only stack details

Do not expose full component stacks in the production UI.

**Phase 2 exit criteria:**

- No known hook-order violations.
- Fresh deep links and browser navigation work.
- Storage failures degrade gracefully.
- Background tutor work is scoped to active pages.
- Users control when an update reload occurs.

---

### Phase 3: Architecture and Maintainability

**Goal:** Restore the modular design promised by `AI_RULEBOOK.md`.

#### 3.1 Reduce `App.jsx` to orchestration

Extract responsibilities into focused modules:

```text
src/components/results/ResultPageShell.jsx
src/components/results/ResultNavigation.jsx
src/components/results/EquationPanel.jsx
src/components/results/SoftwareGuidePanel.jsx
src/components/results/AssumptionsPanel.jsx
src/components/tutor/TutorOverlayHost.jsx
src/hooks/useHashNavigation.js
```

Move the large inline tutor explanation maps into data or dedicated presenter modules, while respecting the rule against JSX in `src/data/`.

Target: `App.jsx` should coordinate route state and compose page-level components, ideally remaining below 500 lines.

#### 3.2 Split oversized feature components

Prioritize files in this order:

1. `ProbabilityVisual.jsx`
2. `NormalDistributionVisual.jsx`
3. `FactorialAnovaVisual.jsx`
4. `AncovaVisual.jsx`
5. `PearsonCorrelationPage.jsx`
6. `SimpleLinearRegressionPage.jsx`

Split by user-visible responsibility, not arbitrary line ranges. For example, probability can be divided into separate simulation modules for coins, dice, spinners, paradoxes, and cards.

#### 3.3 Extract shared analysis-page UI

The correlation and regression pages duplicate concepts such as:

- cards
- metric tiles
- statistic and p-value formatters
- delimited-data input
- variable selectors
- analysis guidance layout

Extract reusable pieces only after behavior is protected by tests. Avoid an overly generic component API; share stable concepts rather than coincidentally similar markup.

#### 3.4 Separate domain calculations from rendering

Visual components should consume calculation results rather than calculate inferential statistics inline.

Recommended domain layout:

```text
src/stats/distributions/
src/stats/tests/
src/stats/anova/
src/stats/regression/
src/stats/data/
```

Each test module should expose a predictable result shape containing:

- `ok`
- `errors`
- normalized inputs
- descriptive statistics
- test statistic
- degrees of freedom
- p-value
- effect size
- confidence interval
- warnings/assumptions

#### 3.5 Clean imports and formatting

Add Prettier or adopt an explicitly documented ESLint formatting strategy. Then:

- remove unused imports
- eliminate blanket copied import lists
- standardize indentation and quotes
- standardize semicolon policy
- use stable naming for alpha, confidence level, tails, and direction

Perform formatting in a dedicated commit so functional changes remain reviewable.

**Phase 3 exit criteria:**

- No component exceeds the rulebook's 500-line hard cap without a documented temporary exception.
- `App.jsx` contains orchestration rather than feature implementation.
- Statistical calculations are independently testable outside React.
- Shared analysis UI has one maintained implementation where appropriate.

---

### Phase 4: Performance, Accessibility, Security, and Repository Quality

**Goal:** Improve delivery quality after correctness and structure are stable.

#### 4.1 Add route-level code splitting

Use `React.lazy()` and `Suspense` for major result visualizers and learning modules. Suggested chunk boundaries:

- probability
- ANOVA/factorial/ANCOVA
- t-test visualizers
- correlation
- regression
- power analysis

Set a measurable bundle goal after inspecting chunk composition. Initial target: keep the primary application chunk below 500 kB minified and defer analysis-specific code until needed.

#### 4.2 Resolve dependency advisories

Update affected direct development dependencies, especially Vite and PostCSS, using a reviewed lockfile update.

Process:

1. Create a dependency-only branch/commit.
2. Update direct dependencies to patched compatible versions.
3. Run lint, tests, fixtures, and production build.
4. Re-run `npm audit`.
5. Review breaking-change notes rather than applying a blind forced audit fix.

Because the Vite server currently binds to `0.0.0.0`, consider defaulting to localhost and requiring an explicit flag for LAN exposure.

#### 4.3 Complete accessibility work

Perform keyboard and screen-reader testing across the menu and each calculator.

Minimum work:

- accessible names for icon-only buttons
- proper `<label>` associations for inputs and selects
- visible focus states
- keyboard-accessible tooltips
- semantic status announcements for copied text, errors, and recalculation
- adequate contrast in both themes
- reduced-motion support
- accessible SVG titles/descriptions where visuals convey meaning
- no essential interaction available only on hover

Automate baseline checks with an accessibility test tool, while retaining manual keyboard testing.

#### 4.4 Improve metadata and product identity

- Replace the nonexistent Vite favicon reference.
- Choose one product stage/version source instead of “Alpha,” “BETA v9.6,” and package `1.0.0` simultaneously.
- Add description, theme color, and social metadata.
- Derive the displayed version from build/package metadata when practical.

#### 4.5 Add repository documentation

Create `README.md` with:

- product overview
- prerequisites
- install and development commands
- test/lint/build commands
- architecture map
- deployment notes
- statistical validation policy
- contribution expectations

Move historical implementation notes into a `docs/` directory. Remove or archive:

- stale `build.log`
- duplicate `deploy_working.yml`

Retain change documents when they provide useful design history, but clearly label them as historical.

**Phase 4 exit criteria:**

- Initial bundle is materially smaller.
- Direct high-severity advisories are resolved or mitigated.
- Core workflows pass accessibility smoke tests.
- Repository setup and architecture are documented.
- Product version and metadata are consistent.

## 5. Proposed Issue Backlog

| ID | Priority | Work item | Phase | Depends on |
|---|---:|---|---:|---|
| SW-001 | P0 | Restore ESLint flat configuration | 0 | None |
| SW-002 | P0 | Add Vitest and numerical test structure | 0 | None |
| SW-003 | P0 | Add verified statistical reference fixtures | 0 | SW-002 |
| SW-004 | P0 | Gate deployment on lint, tests, fixtures, and build | 0 | SW-001, SW-002 |
| SW-005 | P0 | Fix missing values being converted to zero | 1 | SW-002, SW-003 |
| SW-006 | P0 | Replace approximate legacy t-distribution math | 1 | SW-003 |
| SW-007 | P0 | Correct t-test confidence intervals and reports | 1 | SW-006 |
| SW-008 | P0 | Remove or replace mocked Levene output | 1 | SW-003 |
| SW-009 | P0 | Validate factorial Type I/III calculations | 1 | SW-003 |
| SW-010 | P1 | Fix conditional and unstable React hooks | 2 | SW-001 |
| SW-011 | P1 | Add defensive tutor storage utility | 2 | SW-002 |
| SW-012 | P1 | Scope tutor timers to active pages | 2 | SW-010, SW-011 |
| SW-013 | P1 | Implement tested hash routing/deep links | 2 | SW-002 |
| SW-014 | P1 | Replace forced deployment reload | 2 | None |
| SW-015 | P1 | Extract result shell and reduce `App.jsx` | 3 | SW-010, SW-013 |
| SW-016 | P1 | Split oversized visualizer components | 3 | Phase 1 complete |
| SW-017 | P1 | Move calculations out of React components | 3 | SW-003, SW-006 |
| SW-018 | P2 | Extract shared correlation/regression UI | 3 | SW-005 |
| SW-019 | P2 | Standardize formatting and clean imports | 3 | SW-001, structural work complete |
| SW-020 | P2 | Add route-level code splitting | 4 | SW-015, SW-016 |
| SW-021 | P1 | Upgrade vulnerable development dependencies | 4 | Phase 0 green |
| SW-022 | P1 | Accessibility remediation and tests | 4 | Major UI restructuring complete |
| SW-023 | P2 | Fix favicon, metadata, and version identity | 4 | None |
| SW-024 | P2 | Add README and archive stale artifacts | 4 | Architecture stabilized |

## 6. Suggested Commit and Review Strategy

Use narrow commits that can be reverted independently. A recommended early sequence is:

1. `Add ESLint flat configuration`
2. `Add Vitest numerical test harness`
3. `Add baseline statistical reference fixtures`
4. `Fix complete-case numeric pairing`
5. `Unify central t-distribution calculations`
6. `Correct t-test intervals and reports`
7. `Remove simulated Levene conclusions`
8. `Gate Pages deployment on verification`

For statistical changes, each pull request should include:

- the defect and its user impact
- a minimal failing example
- trusted expected output
- tests that fail before and pass after the change
- any intentional changes to displayed wording or rounding
- confirmation that the power fixture suite still passes

Avoid combining dependency upgrades, broad formatting, structural refactors, and numerical changes in the same pull request.

## 7. Verification Matrix

| Area | Unit | Numerical fixture | Component | Browser smoke test |
|---|---:|---:|---:|---:|
| Data parsing / missing values | Required | Required | Required | Required |
| Distribution math | Required | Required | Optional | Optional |
| t-test calculators | Required | Required | Required | Required |
| ANOVA / factorial ANOVA | Required | Required | Required | Required |
| Correlation / regression | Required | Required | Required | Required |
| Power analysis | Existing | Existing | Recommended | Required |
| Routing/history | Required | N/A | Required | Required |
| Tutor persistence | Required | N/A | Required | Required |
| Update/reload flow | Required | N/A | Required | Required |
| Accessibility | Limited | N/A | Automated | Manual required |

## 8. Scope Boundaries

The first implementation cycle should not include a visual redesign, a new state-management framework, or expansion into additional statistical tests. Those changes would increase review surface before the current calculations and safeguards are trustworthy.

The immediate success criterion is narrower: make the existing site statistically dependable, test-protected, recoverable, and easier to change safely.

## 9. First Recommended Implementation Slice

The best first delivery slice is:

1. Add ESLint configuration.
2. Add Vitest.
3. Add tests demonstrating the missing-value and t-CDF failures.
4. Fix complete-case pairing.
5. Migrate one-sample and paired t calculations to the accurate shared implementation.
6. Run lint, tests, power fixtures, and build in CI.

This slice addresses two of the highest-risk correctness defects while building the infrastructure required for every later phase. It should be completed before factorial ANOVA refactoring or large component decomposition begins.
