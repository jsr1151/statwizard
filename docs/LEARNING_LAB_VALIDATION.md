# Learning Lab: first complete path

Implemented September 12, 2026. The former placeholder now offers five lessons: data types and independence, center and spread, probability, uncertainty, and one-sample inference. Each lesson contains a worked example, two practice questions, answer-specific feedback, and links to existing modules. All lessons remain available in any order; both answers must be checked and correct to mark a lesson complete.

Checked answers and the current lesson use validated, versioned browser storage. Reloading or returning from a module restores the learner's place. The Start/Continue button and lesson navigation focus the lesson heading. A reset requires an inline confirmation; canceling preserves progress. Invalid saved data starts a fresh path safely, and unavailable/full storage displays a notice while practice remains usable in memory.

The home page presents three primary choices: find a test, Learning Lab, and statistical modules. Data Manager, Power Analysis, and Search remain available as compact secondary tools. Smaller artwork brings the main choices higher on the page.

## Validation

- 478 automated tests across 46 files passed, including 12 Learning Lab regressions covering partial and complete progress, incorrect answers and retries, module destinations, reset/cancel, unrestricted lesson access, malformed/version-mismatched storage, and storage exceptions.
- Lint, production build, documentation, all 30 power fixtures, and the startup bundle check passed. Lesson content remains in a lazy-loaded chunk.
- 27 browser snapshots covered every lesson and the home page at 1440px and 375px in light and dark themes, plus incorrect feedback, completion, and reset confirmation. No selected WCAG A/AA rule violations or document overflow were found. The final home adjustment was checked again in all four combinations.
- Edge workflows exercised native radio-key navigation and Enter submission, heading focus, partial progress after reload, all six module links and return, complete-path reload, reset cancellation/confirmation, and corrupt-storage recovery. No application errors were recorded. See [browser evidence](audits/2026-09-12/learning-lab.json).
- Worked-example arithmetic was independently checked with R 4.5.0: `t.test(c(8, 10, 12, 14, 16), mu = 10)` gives mean 12, t = 1.4142, df = 4, two-sided p = 0.2302, and 95% CI [8.073514, 15.926486]. Sample SD is 3.162278. Lesson values use rounded presentation.

## Scope and limits

This is one introductory path, not a complete statistics curriculum or an assessment of mastery. Progress records the most recently checked answers; selecting a new option alone does not change completion. Unchecked selections are not saved. Progress is local to the browser/device and is removed by clearing site data; there is no account sync or learning-progress export. Invalid storage falls back to a fresh path rather than attempting partial reconstruction.

Module links open existing tools with their own examples. The final lesson provides the inputs needed to reproduce its t-test; it does not silently replace calculator data. Automated accessibility checks and keyboard workflows do not establish full screen-reader conformance. Existing advanced module content and statistical engines were not comprehensively re-audited in this pass.
