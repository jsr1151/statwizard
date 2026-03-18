# Power Analysis Changes - 2026-03-18

This document records exactly what was added in the first power-analysis implementation slice for StatWizard.

## Goal of This Slice

Build the shared architecture for power analysis inside the existing StatWizard app, without creating a separate disconnected mini-app.

This slice intentionally focused on:

- shared architecture
- page-level integration
- global launch flow
- one working solver slice
- safe rollback points

## Safe Rollback Commits

- `0c7bfb6` - `Checkpoint before power analysis scaffolding`
- `e26fc44` - `Add shared power analysis scaffold and z-test slice`

## What Was Added

### 1. Global Power Analysis Entry Point

Added a new top-level main-menu mode:

- `Power Analysis`

This was wired in:

- `src/components/navigation/MainMenu.jsx`
- `src/App.jsx`

Behavior:

- opens a new global power-analysis hub
- lets the user choose:
  - test family
  - statistical test
  - power-analysis mode
- launches the same shared page-level power UI used inside the relevant test page

### 2. Shared Power Analysis Domain Layer

Added a new shared domain under:

- `src/power/constants.js`
- `src/power/math.js`
- `src/power/engine.js`
- `src/power/testRegistry.js`
- `src/power/solvers/oneSampleZ.js`

Responsibilities:

- `constants.js`
  - power mode metadata
  - power family metadata
- `math.js`
  - inverse normal CDF
  - rounding helpers
  - generic binary-search solver helper
  - normal-model power calculation helper
- `engine.js`
  - single `runPowerAnalysis(testConfig, inputs)` entry point
  - planned-vs-live solver handling
- `testRegistry.js`
  - shared registry for supported tests
  - maps StatWizard result pages to power-analysis definitions
  - defines supported/implemented power modes
  - defines input schemas
  - defines effect-size helper config
  - marks future tests as planned but registered
- `solvers/oneSampleZ.js`
  - first live solver implementation
  - supports:
    - `a_priori`
    - `post_hoc`
    - `sensitivity`

### 3. Shared UI Components for Power Analysis

Added:

- `src/components/power/PowerAnalysisHub.jsx`
- `src/components/power/PowerAnalysisPanel.jsx`
- `src/components/power/PowerAnalysisTab.jsx`
- `src/components/power/PowerVisualizerFrame.jsx`
- `src/components/power/EffectSizePanel.jsx`

Responsibilities:

- `PowerAnalysisHub`
  - global launcher/router UI
- `PowerAnalysisPanel`
  - shared calculator form for a registered test and power mode
- `PowerAnalysisTab`
  - page-level wrapper combining calculator + visualizer
- `PowerVisualizerFrame`
  - shared visualizer host for solver output
- `EffectSizePanel`
  - shared effect-size section for registered tests

### 4. Page-Level Tabs on Registered Test Pages

Registered result pages now show first-class sections:

- `Test Calculator`
- `Effect Size`
- `Power Analysis`

This was integrated in:

- `src/App.jsx`

Current behavior:

- if the current result page is registered in `POWER_TEST_BY_STEP_ID`, the page shows the new section buttons
- `Effect Size` uses the shared effect-size transform when available
- `Power Analysis` uses the shared solver/registry system

### 5. First Live Vertical Slice: One-Sample Z Test

The first fully wired power-analysis slice is:

- `One-Sample Z-Test`

Backed by:

- registry entry in `src/power/testRegistry.js`
- solver in `src/power/solvers/oneSampleZ.js`

Implemented modes:

- `A Priori`
- `Post Hoc`
- `Sensitivity`

Current outputs include:

- total `N`
- actual power
- critical `Z`
- noncentrality
- effect size `d`

Current page integrations:

- global `Power Analysis` hub can launch it
- `res_ztest` page can open it via the page-level `Power Analysis` section
- `res_ztest` page has a working `Effect Size` section

### 6. Existing Visualizer Reused for Power Mode

Did not create a separate power-only visualizer system.

Instead, extended:

- `src/components/visuals/NormalDistributionVisual.jsx`

Added support for:

- external `powerViewConfig`
- preconfigured power mode
- preconfigured alpha/tails/H1/effect size/sample size state

This lets the shared power layer drive the existing distribution visualizer for the one-sample z slice.

## Tests Registered in the Shared Architecture

These are now registered in `src/power/testRegistry.js`:

- `One-Sample Z-Test` - live
- `One-Sample T-Test` - planned
- `Paired Samples T-Test` - planned
- `Independent Samples T-Test` - planned
- `One-Way ANOVA` - planned
- `ANCOVA` - planned

This means the architecture is already shaped for the next slices, even where the solver is not implemented yet.

## App-Level Wiring Details

### Added State in `src/App.jsx`

Added:

- `activeResultSection`
- `pendingPowerLaunch`

Purpose:

- track whether the user is looking at:
  - calculator
  - effect size
  - power analysis
- support launching a test page directly from the global power hub into the correct power mode

### Added Lookup in `src/App.jsx`

Added:

- `currentTestConfig = POWER_TEST_BY_STEP_ID[currentStepId] || null`

Purpose:

- detect whether the current result page participates in the shared power-analysis system

## Verification Performed

### Dependency Installation

Ran:

- `npm.cmd ci`

### Production Build

Ran:

- `npm.cmd run build`

Result:

- build succeeded

Note:

- Vite reported a large-chunk warning, but the production build completed successfully

## Files Changed In This Slice

Modified:

- `src/App.jsx`
- `src/components/navigation/MainMenu.jsx`
- `src/components/visuals/NormalDistributionVisual.jsx`

Added:

- `src/components/power/EffectSizePanel.jsx`
- `src/components/power/PowerAnalysisHub.jsx`
- `src/components/power/PowerAnalysisPanel.jsx`
- `src/components/power/PowerAnalysisTab.jsx`
- `src/components/power/PowerVisualizerFrame.jsx`
- `src/power/constants.js`
- `src/power/engine.js`
- `src/power/math.js`
- `src/power/solvers/oneSampleZ.js`
- `src/power/testRegistry.js`

## What Was Not Done Yet

Not yet implemented in this slice:

- independent-samples t solver
- one-sample t solver
- paired t solver
- ANOVA power solver
- ANCOVA power solver
- `compromise` mode
- `criterion` mode
- G*Power parity fixture suite
- deployed documentation page inside the app itself

## Recommended Next Directions

Best next implementation step:

- add the `Independent Samples T-Test` slice next

Why:

- it is already an existing StatWizard page
- it is a common power-analysis use case
- it exercises more shared architecture than the z-test slice
- it moves the project closer to G*Power-style parity for the t-test family

After that:

- one-sample t
- paired t
- ANOVA
- ANCOVA
- parity fixtures against pinned G*Power outputs

## Notes About Uncommitted Local Files

This work did **not** include:

- `instructions3.18.yaml`

That file remained untracked and was intentionally left out of the commits.
