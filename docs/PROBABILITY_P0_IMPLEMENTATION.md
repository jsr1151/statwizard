# Probability hardening: P0 implementation

September 11, 2026

Scope: the opening implementation slice in `NEXT_AGENT_HANDOFF.md` (both P0
defects, focused regressions, and full validation). P1 and the complete P2
review remain follow-up work.

## Changes

- Repaired the coefficient-of-variation formula to `({s} / |{x̄}|) × 100%`.
  Added an exact formula regression and a scan of every math-term key and
  content field for common encoding artifacts.
- Replaced Monty Hall's clickable door containers with native buttons.
  Door names include their number, closed/revealed contents, and selection
  when applicable. Hidden prizes remain undisclosed. Selection is disabled
  after the initial pick. The responsive grid and game rules are preserved.
- Added an offset, two-pixel keyboard focus outline, using indigo-700 in
  light mode and indigo-300 in dark mode.
- Added component regressions for 3, 10, 30, and 100 doors, native focusability,
  disabled selection, revealed names, both final choices, and replay retaining
  aggregate history. Game tests mock randomness and restore the mock afterward.

## Validation

- The new regressions reproduced both defects before the production edits.
- Focused tests: 12 passed; repeated within the full suite.
- `npm run lint`: passed.
- `npm test -- --run`: 21 files, 119 tests passed.
- `npm run build`: passed.
- `npm run docs:check`: passed.
- `npm run power:fixtures`: 30 fixtures passed.
- Vite tests/build required normal filesystem access because the sandbox
  denied access to the parent directory, as already recorded in the handoff.
- `MontyHallPanel.jsx` remains below the 500-line cap.

An isolated Edge harness rendered the actual `ProbabilityParadoxes` component
with the application stylesheet. It exercised all 24 combinations of widths
375/768/1440, light/dark modes, and 3/10/30/100 doors. Actual Tab, Enter, and
Space input verified initial selection, stay, switch, and replay. Door grids
fit the viewport, no page overflow was measured, focus outlines were present,
and no console warnings or exceptions were recorded. A second pass used
reduced motion to capture stable focus screenshots; the mobile screenshots
were visually inspected in both modes. Temporary harness files, screenshots,
and measurement results are under the ignored `.vite/monty-review*` paths.
This targeted review does not replace the full application review in P2.

## Follow-up findings (unchanged in this slice)

- Monty Hall uses white heading/probability text on light backgrounds. The
  light-mode screenshot confirms unreadable text in those areas.
- Its door-count input lacks a programmatic label. The reset handler does
  not enforce the displayed 3–100 bounds (HTML input bounds alone do not
  constrain its click handler).
- The paradox mode buttons do not expose selected state programmatically.
- Complete the remaining P1 calculator, birthday, gambler, card/toggle,
  aggregate-simulation, reset-isolation, and axe coverage, followed by the
  full P2 application and accessibility review.
