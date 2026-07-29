# StatWizard

StatWizard is an interactive statistics learning application. It combines guided test selection, focused lessons, calculators, effect-size interpretation, power analysis, and visual explanations in one React application.

[Open StatWizard](https://jsr1151.github.io/statwizard/)

## What It Includes

- A guided wizard for choosing an appropriate statistical analysis.
- Browsable modules for descriptive statistics, mean comparisons, linear modeling, and related concepts.
- Interactive visualizers for probability, distributions, t tests, ANOVA, factorial ANOVA, ANCOVA, correlation, and regression.
- Shared calculator, lesson, effect-size, and power-analysis surfaces for supported result pages.
- Hash-based deep links that preserve the selected module and result section.
- Light and dark themes, keyboard-accessible shared controls, reduced-motion support, and automated accessibility smoke coverage.
- Deployment update notifications that do not interrupt or discard the active page.

StatWizard is an educational tool. Its outputs should be reviewed in the context of the study design, assumptions, data quality, and the validation notes below.

## Requirements

- Node.js 20 or newer
- npm

The deployment workflow currently tests the project with Node.js 20.

## Local Development

```bash
git clone https://github.com/jsr1151/statwizard.git
cd statwizard
npm ci
npm run dev
```

The development server listens on `127.0.0.1:5174` by default. Vite prints the exact local URL when it starts.

## Commands

| Command                  | Purpose                                                        |
| ------------------------ | -------------------------------------------------------------- |
| `npm run dev`            | Start the local Vite development server.                       |
| `npm run build`          | Create the GitHub Pages production bundle in `dist/`.          |
| `npm run preview`        | Preview the production bundle locally.                         |
| `npm run lint`           | Run the ESLint repository gate.                                |
| `npm test`               | Run all Vitest suites once.                                    |
| `npm run test:watch`     | Run Vitest in watch mode.                                      |
| `npm run test:a11y`      | Run the focused axe accessibility smoke suite.                 |
| `npm run power:fixtures` | Validate saved power-analysis cases and UI/solver parity.      |
| `npm run docs:check`     | Check required documentation and historical-file organization. |

Before submitting a change, run:

```bash
npm run lint
npm test
npm run power:fixtures
npm run docs:check
npm run build
```

## Architecture

```text
src/
├── components/
│   ├── analysis/       Shared analysis-page building blocks
│   ├── common/         Cross-feature UI and recovery components
│   ├── distribution/   Distribution chart and control boundaries
│   ├── formula/        Equation renderers
│   ├── navigation/     Menu, module, lesson, and search views
│   ├── power/          Shared power-analysis UI
│   ├── probability/    Probability learning panels
│   ├── results/        Shared result-page shell and navigation
│   ├── tutor/          Tutor presentation components
│   └── visuals/        Statistical visualizers and editors
├── config/             Product metadata adapter
├── data/               Module registries, presets, and lesson content
├── hooks/              Tutor, storage, and deployment-update hooks
├── power/              Power registries, solvers, curves, and fixtures
├── routing/            Hash-route parsing and serialization
├── stats/              Pure statistical calculation modules
└── utils/              Shared numerical, SVG, storage, and formatting helpers
```

[App.jsx](src/App.jsx) is the orchestration boundary. Statistical calculations belong in `src/stats/` or `src/power/`, not inside React rendering code. The detailed engineering constraints are maintained in [AI_RULEBOOK.md](AI_RULEBOOK.md).

## Statistical Validation Policy

Statistical correctness is treated as a release requirement:

- Numerical algorithms are implemented as pure functions where practical.
- Edge cases and known reference values are covered with Vitest tests under `src/stats/__tests__/` and `src/utils/__tests__/`.
- Missing or invalid data must be handled explicitly rather than silently converted to zero.
- Calculators must distinguish approximations from exact or externally validated results.
- UI reports and confidence intervals must use the same tested calculation source as the displayed statistics.
- Power solvers are checked against saved parity fixtures with documented tolerances.

The current power fixtures are compatibility baselines generated from StatWizard's shared solvers. They are designed to be replaced or supplemented with independently pinned G\*Power 3.1.9.7 outputs as external parity work matures. See [the fixture documentation](src/power/fixtures/README.md).

## Accessibility

The automated suite checks representative shared workflows against WCAG A/AA axe rules. It does not replace manual testing. Release review should still cover keyboard-only operation, screen-reader behavior, focus order and focus return, both color themes, reduced motion, and 200%/400% zoom and reflow.

## Product Metadata and Versioning

`package.json` is the canonical source for the product name, description, homepage, and semantic version. Vite uses those values to generate document/social metadata and `dist/version.json`; the React header reads the same source through `src/config/product.js`.

Update the package version with the appropriate npm version workflow rather than editing a separate UI label.

## Deployment

Pushes to `main` trigger [.github/workflows/deploy.yml](.github/workflows/deploy.yml). The workflow:

1. Installs the locked dependencies with `npm ci`.
2. Runs lint, tests, power fixtures, and documentation checks.
3. Builds the production bundle.
4. Publishes `dist/` to GitHub Pages.

The Vite base path is `/statwizard/`. Asset and metadata changes must be verified against that deployed subpath.

## Contributing

- Keep changes narrow and reviewable.
- Preserve existing user work and avoid unrelated formatting churn.
- Add or update tests for statistical behavior and regressions.
- Keep React component files below 500 lines and maintain one component per file.
- Use shared statistical and analysis primitives instead of duplicating formulas or UI.
- Do not commit `node_modules/`, `dist/`, `.vite/`, generated logs, or temporary files.
- Run the complete verification sequence before committing.

## Project Records

Active engineering rules remain in [AI_RULEBOOK.md](AI_RULEBOOK.md). Completed implementation plans and dated change reports are retained as historical records under [docs/history](docs/history/README.md); they describe past checkpoints and should not be treated as current setup instructions.
