# Power Parity Fixtures

These fixture files are the first step toward a repeatable StatWizard parity workflow.

Each JSON file stores:

- `testId`: the live solver id
- `reference`: where the expected values came from
- `defaultTolerances`: field-level tolerances for numeric comparisons
- `cases`: named solver cases with `inputs` and `expected` outputs

Current status:

- `one-sample-z.json` seeds the format for the existing live z solver
- `independent-samples-t.json` seeds the format for the new independent-t solver

These first fixtures are baseline compatibility cases generated from the current shared solver implementation. They are intended to be replaced or augmented with pinned G*Power reference outputs as the parity workflow matures.

Run the local check with:

```bash
npm run power:fixtures
```
