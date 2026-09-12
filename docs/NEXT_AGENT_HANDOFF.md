# StatWizard Next-Agent Handoff

> September 12, 2026: the probability tasks below are historical. Continue from [audit implementation status](AUDIT_IMPLEMENTATION.md), including the [rank-test calculators](NONPARAMETRIC_VALIDATION.md), [repeated-measures ANOVA](REPEATED_MEASURES_VALIDATION.md), [shared t-test/ANOVA workflow](ANALYSIS_WORKFLOW_VALIDATION.md), and [correlation/regression workflow](TABULAR_WORKFLOW_VALIDATION.md). The [first complete Learning Lab path](LEARNING_LAB_VALIDATION.md) is implemented. The [descriptive source review and simple-regression saved launches](DESCRIPTIVE_WORKFLOW_VALIDATION.md) are also implemented. The [saved-row review and descriptive input recovery](ROW_REVIEW_DRAFT_VALIDATION.md) are implemented. Next: expand drafts to regression and t-test/ANOVA inputs, roles, and settings; add consistent report exports and review manual-input exclusions. Descriptive draft recovery currently saves only input text and source labels, not display settings. Descriptive inputs remain single-variable lists; saved-data launches for these modules are a separate extension. Repeated-measures power and mixed/factorial repeated designs remain unsupported; do not substitute independent-groups models.

Updated: September 11, 2026

## Current state

The working tree was clean at the start of the audit. `main` was at `2e33f20` and matched `origin/main`.

The last feature sequence, completed July 29, 2026, built and refined the probability learning workspace:

1. `f0380b3` — reorganized the probability and demos workspace.
2. `13db940` — registered the structured probability sections.
3. `2e33f20` — improved Birthday Paradox, Gambler's Fallacy, Monty Hall, probability-basics, and card-demo interactions.

Repository validation on September 11 was green:

- `npm run lint`
- `npm test -- --run` — 19 files and 107 tests passed
- `npm run build`
- `npm run docs:check`
- `npm run power:fixtures` — 30 fixtures passed

The initial sandboxed test/build attempt could not load `vite.config.js` because access to the parent directory was denied. Both commands passed when rerun with normal filesystem access; this was not an application failure.

## Recommended next implementation: probability hardening

Keep this first slice narrow. Do not combine it with the repository-wide component decomposition work.

### P0 — Correct visible and accessible defects

1. Fix the corrupted coefficient-of-variation formula in `src/data/mathTerms.js`.
   - Current text contains `xÌ„` and `Ã—`.
   - Intended formula: `({s} / |{x̄}|) × 100%`.
   - Add or extend a test that fails if common mojibake markers appear in math-term content.

2. Make every selectable Monty Hall door keyboard-accessible in `src/components/probability/MontyHallPanel.jsx`.
   - Replace the clickable `div` with a semantic `button`.
   - Preserve the current responsive grid, visual states, and click behavior.
   - Give each door an accessible name that communicates its number and, when appropriate, revealed state.
   - Disable doors when they cannot be selected instead of relying only on the click-handler condition.
   - Confirm visible focus styling in light and dark modes.

### P1 — Add probability interaction coverage

Add focused component tests under `src/components/probability/__tests__/`. Prefer deterministic control of randomness (mock `Math.random` or extract injectable/pure helpers) so tests never flake.

Minimum coverage:

- Probability calculator renders valid results and handles invalid `n`, `k`, `p`, favorable, and total values.
- Monty Hall supports keyboard selection, reveal, stay/switch choice, replay, and aggregate simulation.
- Birthday Paradox regenerates a group and reports a 1,000-trial result.
- Gambler's Fallacy records a prediction/flip and demonstrates that the next-flip estimate remains near one half after a streak.
- Probability/card mode controls expose selected state and switch to the correct instructional panel.
- Reset controls clear their corresponding histories without affecting unrelated state.

Extend the existing accessibility suite or add targeted axe checks for the Probability foundations, calculator, simulations, and demos views.

### P2 — Manual browser review

Review at approximately 375 px, 768 px, and 1440 px in both color modes.

Check:

- No clipped controls or horizontal scrolling.
- Monty Hall grids remain usable at 3, 10, 30, and the maximum supported door count.
- Every control is reachable and operable by keyboard with a visible focus indicator.
- Toggle groups clearly expose the active choice.
- Simulation result changes are understandable without relying only on color.
- Empty, invalid, running, completed, and reset states read clearly.
- No console errors or React warnings occur during repeated interactions.

### Acceptance criteria

- Both P0 defects are fixed with regression coverage.
- Probability component tests are deterministic and pass repeatedly.
- The manual review has no high-impact accessibility or responsive-layout defect left open.
- `npm run lint`, `npm test -- --run`, `npm run build`, `npm run docs:check`, and `npm run power:fixtures` all pass.
- No touched component exceeds the 500-line hard cap in `AI_RULEBOOK.md`.
- Changes are split into reviewable commits (suggested: defects, interaction tests, follow-up polish).

## Deferred repository-wide work

Do not let this block probability hardening, but open a separate structural initiative afterward. The current largest JSX files substantially exceed the rulebook's 500-line cap:

- `src/components/regression/MultipleRegressionPage.jsx` — about 2,844 lines
- `src/components/data/DataManagerPage.jsx` — about 2,484 lines
- `src/App.jsx` — about 1,731 lines
- `src/components/correlation/PearsonCorrelationPage.jsx` — about 1,233 lines
- `src/components/regression/SimpleLinearRegressionPage.jsx` — about 1,162 lines

Plan these as independent, behavior-preserving extraction slices with tests before changing structure. Also review bundle weight after structural work; the September 11 build reported an approximately 492 kB SheetJS chunk, 305 kB main chunk, and several feature chunks over 100 kB.

## Suggested opening instruction for the next agent

> Read `AI_RULEBOOK.md` and `docs/NEXT_AGENT_HANDOFF.md` completely. Implement the P0 probability-hardening fixes first, add focused regression tests, and run the full validation suite. Preserve current behavior and styling outside the defects described in the handoff. Report any additional issues separately rather than expanding scope without approval.
