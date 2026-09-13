# One-way ANOVA calculator recovery and inference

Implemented September 12, 2026, following the [site audit](SITE_AUDIT_2026-09-11.md).

## Calculator scope

One-way ANOVA now has a dedicated calculator with separate raw-group, summary-group, and supplied-F profiles. Raw and summary groups each retain their labels, group count, exact inputs, and source. The versioned browser draft also stores input mode, saved dataset reference, per-dataset variable choices, significance level, and whether Bonferroni comparisons are shown. Results are recalculated from current inputs after recovery.

The calculator supports 2–20 independent groups. Each raw group must contain at least one finite observation; positive residual degrees of freedom and within-group variability are required. Summary groups require a finite mean, nonnegative sample SD, and integer sample size of at least two. Blank, invalid, degenerate, and unsupported numeric inputs block results, plots, reports, and shared statistics. Adding an empty group immediately blocks inference until it is completed or removed.

Raw parsing retains full precision, rejects partial numbers and non-finite values, and lists excluded entries for each group. Empty separators are ignored. The first 100 excluded entries are displayed while counts include all entries. Individual raw groups with one observation can participate when residual variation exists elsewhere; their sample SD is explicitly undefined in results and reports.

Saved values follow current library edits, including edits that preserve row count. They are read-only, with saved-row exclusion review above the calculator. **Edit a copy** creates a manual raw profile from the current usable groups, preserving summary and F profiles. Missing datasets, missing/cleared roles, and changed variable types block results. Dataset-specific roles recover independently, and fresh Data Manager launches use the requested roles and default settings.

Mounting and calculation do not write drafts. User edits save immediately. Removal requires confirmation, returns focus, affects only this calculator, and leaves current input open. Failed saves/deletion preserve the previous draft and display a status message. Incompatible drafts fall back without overwriting storage. Drafts over 250,000 serialized characters remain editable but are not saved automatically.

## Statistical results and exports

The calculator uses classical equal-variance one-way ANOVA, with weighted group means, between/within sums of squares, residual mean square, the upper-tail F probability, and eta squared. Supplied F mode accepts positive fractional degrees of freedom but does not manufacture sample sizes, group summaries, effect sizes, or pairwise comparisons. The reciprocal F identity preserves small upper-tail probabilities; inverse-CDF range checks block unsupported critical values.

Optional comparisons are explicitly **Bonferroni pairwise comparisons**, using the pooled ANOVA residual variance and residual degrees of freedom for every comparison. Both adjusted p-values and familywise confidence intervals use the selected alpha and the complete family of group pairs. The difference is first group minus second group. These are not labeled Tukey or Games–Howell. The earlier lesson helper uses different degrees of freedom and a fixed comparison threshold; it is not used by this calculator.

Results include group summaries, an ANOVA table, inference metrics, a labeled F null-distribution plot, and a copyable report with source, settings, analyzed values, exclusions, and requested comparisons. Clipboard denial reveals a selectable report. Invalid input removes a previously displayed report. Phone table headings use SS/df/MS with visible definitions; df1/df2 metrics also have visible definitions. Off-range plot markers are identified in captions.

## Validation

- Full suite: **782 tests in 60 files passed**, including 49 new inference/recovery cases. Final display changes also passed the 18 calculator recovery tests.
- Independent base R references: eight raw ANOVAs and pooled Bonferroni comparisons, plus four supplied-F cases. Cases include unequal sizes, equal means, two groups, small-scale data, large F, a singleton, a constant group, and fractional F degrees of freedom. See the [generator](../scripts/validation/one-way-calculator-reference.R) and [reference values](audits/2026-09-12/one-way-reference.json).
- Lint, production build, documentation check, 30 power fixtures, and bundle budget check passed.
- Production Edge review: **20 accessibility/overflow checks**, across 1440/768/375-pixel widths, light/dark themes, invalid inputs, storage failures, copy fallback, Data Manager launch, saved data, and edited copies. No application errors, WCAG A/AA violations, or horizontal page overflow. See [browser evidence](audits/2026-09-12/one-way-draft.json).

## Remaining work

The one-way teaching visual remains separate and does not write calculator drafts. Migrate its inference and pairwise comparisons to the validated calculator model while preserving useful teaching plots and interactions. The calculator currently provides the F null plot; the legacy lesson's group/variance/plot-maker views have not been migrated. Welch ANOVA, Tukey/Games–Howell comparisons, factorial/ANCOVA/repeated-measures draft recovery, and broader report consistency remain separate work. Do not treat independent-groups ANOVA as a repeated or mixed design.
