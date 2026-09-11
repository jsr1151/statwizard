# Application navigation integration

Completed September 11, 2026, following the probability-hardening review.

## Behavior

Result tabs and power modes now update the address. Pasted links, reload,
browser Back/Forward, and hash changes while the app is open restore the
corresponding visible section. Examples:

- `#/wizard/res_probability/demos`
- `#/wizard/res_probability/calculator`
- `#/wizard/res_variability/equation`
- `#/wizard/correlation_result/power/sensitivity`

Existing page/module URLs remain supported. A module URL with no section
opens its default section. Unsupported step, section, or power-mode URLs
return Home. Matching valid browser state preserves wizard answers and
question history; stale or malformed state is rebuilt from the address.
Startup and repeated selections replace the current entry. A changed route
adds one entry, and browser navigation does not add another entry.

Power Hub launches open the requested mode. Data Manager analysis launches
open the calculator directly. Section and power-mode buttons expose their
selected state with `aria-pressed`.

## Structure

The initial extraction was committed separately as `076a99e`. Regression
coverage was added before extraction; the full suite and build passed before
that commit. The extraction retained lazy feature imports, error boundaries,
equation interactions, and tutor overlays.

- `src/components/app/`: equation workspace/panel, result visualizer/page,
  application content, and overlays. Each component stays below 500 lines.
- `src/routing/resultPageConfig.js`: shared page/section definitions, used by
  both the UI and validation rather than maintaining a separate section list.
- `src/routing/useAppNavigation.js`: atomic route updates and browser history
  restoration, with duplicate native hash/pop events handled together.
- `src/routing/initializeAppHistory.js`: shared URL/history validation for
  startup and later browser navigation.
- `src/routing/powerNavigationContext.js`: connects shared power panels to
  their surrounding route while preserving their standalone callback API.

The former 1,731-line `App.jsx` is now below the 500-line limit. This is the
first independent structural slice from the handoff. Multiple Regression,
Data Manager, Pearson Correlation, and Simple Linear Regression still need
their own behavior-preserving extractions. Bundle optimization remains
separate: the current build is about 313 kB for the main chunk and 492 kB for
SheetJS, before gzip.

## Validation

- 28 test files / 253 tests passed, including real React StrictMode mounts,
  all exposed section routes, wizard-answer history, malformed state,
  state-free hash navigation, and section/power-mode Back/Forward behavior.
- Lint, production build, documentation checks, and 30 power fixtures passed.
- Edge completed 92 checks: every result-section route, section and power-mode
  reload/history journeys, and probability layouts at 375, 768, and 1440 px
  in both themes. No console warnings or errors occurred. Probability layout
  checks had no horizontal overflow or axe violations; narrow and wide
  screenshots were visually inspected.

The browser harness and artifacts remain ignored under `.vite`. Links encode
navigation state; calculator inputs and simulation histories retain their
existing component-level persistence behavior.
