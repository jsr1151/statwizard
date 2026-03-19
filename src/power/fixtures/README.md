# Power Parity Fixtures

These fixture files are the first step toward a repeatable StatWizard parity workflow.

Each JSON file stores:

- `testId`: the live solver id
- `parityTarget`: the pinned external parity target, including the intended G*Power version
- `reference`: where the expected values came from
- `defaultTolerances`: field-level tolerances for numeric comparisons
- `cases`: named solver cases with `inputs` and `expected` outputs

Current status:

- `one-sample-z.json` seeds the format for the existing live z solver
- `one-sample-t.json` seeds the format for the new one-sample t solver
- `paired-samples-t.json` seeds the format for the new paired-samples t solver
- `independent-samples-t.json` seeds the format for the new independent-t solver
- `one-way-anova.json` seeds the format for the new one-way ANOVA solver
- `ancova.json` seeds the format for the new ANCOVA solver

These first fixtures are baseline compatibility cases generated from the current shared solver implementation. They are intended to be replaced or augmented with pinned G*Power reference outputs as the parity workflow matures.

Current local coverage now includes:

- `A Priori`, `Post Hoc`, and `Sensitivity` cases for every live solver
- one-tailed and two-tailed branches where relevant
- left-tail and right-tail direction handling
- unequal independent-group allocation and ratio rounding
- balanced-group exact vs approximate per-group N for F-family tests
- ANCOVA denominator-df shifts from covariate counts

The local checker also validates more than the scalar solver outputs:

- fixture file structure and duplicate-case protection
- solver output parity against saved expectations
- visualizer metadata consistency with the solver result
- power-curve current-point consistency with the active solver state

Current pinned parity target for replacement/reference work:

- `G*Power 3.1.9.7`

Run the local check with:

```bash
npm run power:fixtures
```
