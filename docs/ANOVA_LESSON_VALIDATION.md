# One-way ANOVA lesson inference and report parity

Implemented September 13, 2026, following the [one-way calculator recovery](ONE_WAY_DRAFT_VALIDATION.md).

## Shared inference and reports

The one-way lesson now uses the calculator's input/results component and validated statistical model. Raw groups, summary groups, and supplied F inputs stay in separate lesson profiles. Raw parsing retains exact text and precision, lists exclusions, and never silently removes an empty group. Blank, invalid, degenerate, or unsupported inputs suppress plots, inference, reports, and shared statistics. Calculator drafts are neither read nor written by the lesson; resetting or revisiting the lesson restores its own example.

The ANOVA table, group summaries, upper-tail F probability, selected alpha, eta squared, and Bonferroni comparisons match the calculator. Pairwise tests use the pooled residual variance, residual degrees of freedom, adjusted p-values, and familywise confidence intervals. Zero between-group variation remains valid: the table and variance view show F = 0, p = 1, and eta squared = 0. Supplied F mode accepts fractional degrees of freedom without inventing group summaries or effect sizes.

**Copy lesson report** uses the same report formatter as the calculator. **Open report builder** works through the active app overlay, even when automatic tutor tips are disabled. Its report follows the current inputs and alpha, updates while open, removes stale output after invalidation, and handles supplied F without requiring eta squared. Clipboard failure reveals selectable text. The native dialog supports keyboard focus, Escape, and focus restoration; it renders at the document root. Background scrolling is locked while the modal is open and restored on close, preventing sticky-header overflow when the report expands on phones. Loading the modal is isolated from the main page.

## Teaching views

- **F distribution:** the shared labeled null-distribution plot and a keyboard-accessible F slider in supplied-F mode. Numerical inputs support degrees of freedom and values outside the slider range.
- **Group means:** means, observed raw points when available, standard errors, and the weighted grand mean. Summary input never generates synthetic observations. Singleton groups have no SD/error bar.
- **Plot maker:** dots, bars, or a line of independent group means; SD/SE/no error bars; observed-value, grid, and grand-mean toggles; axis labels/limits; group colors and keyboard-adjustable horizontal positions; reset. Lines are explicitly distinguished from individual change or time trends. Display edits leave inference unchanged.
- **Variance decomposition:** current between/within/total sums of squares, proportions, mean squares, and the F ratio.
- **Table guide:** visible explanations of SS/df/MS, weighting, degrees of freedom, and the two-group pooled-t equivalence.

Plots use validated current results. Automatic limits include negative and small-scale data, observations, and error bars. Custom limits must be finite and ordered; invalid limits hide the plot while retaining numerical results. Marks outside custom limits are clipped and identified in captions. Raw plots show at most 100 observations per group; calculations and automatic limits use all analyzed values. Short G1/G2 labels map to a full text legend. SD/SE bars are explicitly not confidence intervals.

The lesson uses one raw or summary mode for the whole analysis, with separate profiles. Horizontal-position sliders replace pointer-only category dragging; the F slider replaces pointer-only marker editing. The unused legacy editor/results/plot components were removed. Tutor actions still navigate to variance explanations, enable comparisons, and add groups; invalid results dismiss stale statistical tips.

## Validation

- Full suite: **822 tests in 63 files passed**, including 40 new lesson, plot, and active-overlay cases. Final dialog placement passed its six focused tests. The final full run used `--maxWorkers=2 --testTimeout=15000` after one unrelated UI test exceeded the default 5-second timeout under concurrent build/browser load; no assertions or repository test defaults were changed.
- Eight independent base R ANOVA/Bonferroni fixtures and four supplied-F fixtures pass through actual lesson controls. Lesson and calculator report bodies match apart from source identification.
- Tests cover invalid raw/summary/F inputs, source-profile separation, zero between-group variation, plot limits and clipping, real versus summary observations, point caps, tutor actions, disabled tutor tips, current report updates, clipboard failure, focus restoration, and calculator-draft isolation.
- Lint, production build, documentation check, 30 power fixtures, and bundle budget checks passed.
- Production Edge review: **23 accessibility/overflow checks** across 1440/768/375-pixel widths and light/dark themes, including the report dialog, copy fallback, plots, invalid ranges, raw exclusions, and zero-variation table. No application errors or WCAG A/AA violations; no horizontal page overflow. See [browser evidence](audits/2026-09-13/anova-lesson.json).

## Remaining work

Continue draft recovery for factorial ANOVA, ANCOVA, and repeated-measures ANOVA. Welch ANOVA, Tukey/Games–Howell comparisons, mixed raw/summary groups, and mixed/factorial repeated designs remain separate extensions. Repeated-measures power remains unsupported. Other ANOVA-family teaching visualizers still use their existing implementations and need separate audits; do not substitute an independent-groups model for repeated observations.
