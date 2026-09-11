# Probability hardening

September 11, 2026

This continues the P0 implementation recorded in `PROBABILITY_P0_IMPLEMENTATION.md`
and completes the P1 interaction coverage and P2 browser review from
`NEXT_AGENT_HANDOFF.md`.

## Behavior and accessibility

- Calculator fields preserve blank values and reject invalid counts and
  probabilities instead of turning blanks into zero or invalid k into a valid
  zero probability. Invalid controls expose `aria-invalid` with explanatory
  text. Zero/one boundaries and the empty binomial experiment remain valid.
  The calculator is extracted into its own component; values remain owned by
  the page so switching sections preserves entries.
- Monty Hall labels its door-count input, normalizes counts to whole numbers
  in 3–100, and clears incompatible aggregate results when the count changes.
  Replaying with the same count preserves aggregate history.
- Birthday regenerates groups and resets accumulated trials when group size
  changes. Its 365-day calendar uses a non-leap year.
- Gambler prediction totals survive switching panels and remain consistent
  with the recorded flips.
- Probability/card mode buttons expose selected state, inputs have accessible
  names, and Hunt's replacement toggle is a native keyboard-operable switch.
- The complement slider accepts zero. Probability-scale help uses keyboard
  disclosures, and selected-event descriptions wrap independently of the
  scale marker so extreme probabilities do not push text off-screen.
- A coin flip completes even when its animated panel is temporarily hidden.
  The single-flip control is disabled while a flip is running and reset
  immediately makes it available again.
- Spinner weights of zero occupy no wheel space. An all-zero distribution
  gives an explicit empty state and disables spinning. Edits no longer mutate
  shared defaults; distribution/payout edits clear incompatible history.
  Spins announce their label and points in text.
- A palette scoped to `.probability-workspace` fixes light/dark contrast,
  including inset dark controls, without changing other application pages.
  Keyboard controls have visible outlines. Replacement comparisons stack on
  narrow screens, and poker hand names wrap instead of truncating.

## Regression coverage

The probability component suite includes:

- Valid calculator results, invalid n/k/p/favorable/total values, blank and
  fractional counts, correction/recovery, boundaries, and section persistence.
- Monty selection/reveal/stay/switch/replay, 10,000 paired strategy simulations,
  door-count normalization, and history behavior.
- Birthday regeneration, deterministic 1,000-group results, and changing the
  experiment's group size.
- Predictions/flips and an exact 500/500 controlled next-flip simulation after
  a streak, illustrating independence without flaky tolerance checks.
- Probability/card mode instructions and selected states; independent resets
  across coin experiments and poker/deck-tracker/Hi-Lo histories.
- Coin running/reset transitions and spinner zero weights/default isolation.
- 48 axe checks: all 24 probability views in both themes. jsdom contrast is
  disabled in these tests because it requires browser layout; browser audits
  below include contrast.

Randomness is mocked where results are asserted, mocks are restored after each
test, and the timer test restores real timers. The initial regressions were
run against the defects before their fixes.

Final validation: `npm run lint`, `npm test -- --run` (26 files, 205 tests),
`npm run build`, `npm run docs:check`, and `npm run power:fixtures` (30 fixtures)
all passed. No touched component exceeds 500 lines. Tests/build used normal
filesystem access for Vite, matching the sandbox limitation in the handoff.
The large existing SheetJS and feature bundles remain deferred.

## Browser review

The review used isolated Edge profiles and actual application components with
the application stylesheet. A 144-case matrix covered all 24 views at 375,
768, and 1440 pixels in both themes. Final audits reported no accessibility
violations, clipped controls, horizontal page overflow, or console warnings
and errors.

Additional journeys entered through Stat Modules in the actual application
and exercised selected foundation events, invalid calculator values, coin
completion/reset, Monty at 3/10/30/100 doors, Birthday at 100 people, completed
Gambler and poker results, and maximum replacement draw counts. Tab, Enter,
and Space exercised door selection and event controls; visible focus was
checked within the application shell. Mobile, tablet, and desktop screenshots
were visually inspected, including both themes and narrow-screen comparisons.
The final 96 state checks completed with no accessibility violations,
horizontal overflow, console warnings, or errors.

Temporary harnesses and reports are in ignored `.vite/probability-review*`
and `.vite/probability-journeys*` paths. Browser profiles are isolated under
ignored `node_modules/.cache`. These are local review artifacts, not production
dependencies.

## Startup navigation follow-up (completed)

The browser review found that a fresh `#/wizard/res_probability` URL returned
to Home: the shell initialized empty browser history without reading the URL.
`src/routing/initializeAppHistory.js` now seeds the existing history contract
from the address before React mounts. This also supports direct wizard-step
links and the Modules, Search, Power, Lessons, and Data Manager pages. Matching,
valid saved history retains wizard progress on reload; stale or malformed state
is rebuilt from the URL. Invalid routes fall back to Home. Startup replaces
the current history entry and uses the shell's `#/menu` spelling for Home.

This first follow-up left `App.jsx` unchanged and covered initial page/module
loads. The subsequent [navigation integration](NAVIGATION_IMPLEMENTATION.md)
now also supports result sections, power-mode suffixes, and state-free hash
changes after mounting. It extracted the application views and navigation
hook; decomposition of the remaining large feature pages and bundle work
remain deferred.

Validation after this follow-up: 28 test files / 238 tests passed, including
real-app StrictMode startup regressions and route/state validation. Lint,
production build, documentation checks, and all 30 power fixtures passed.
A separate Edge review passed 12 checks covering direct pages, invalid URLs,
probability reload with saved answers, and browser Back/Forward after using
the actual Home and Stat Modules buttons. No console warnings or errors were
reported. Its local harness and results are ignored artifacts under `.vite`.
