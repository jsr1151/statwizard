# StatWizard site audit — September 11, 2026

Audited deployment: [StatWizard](https://jsr1151.github.io/statwizard/), commit `ebdd916`, version 1.0.0. Audit date uses America/New_York time.

The site has a strong foundation as an interactive statistics teaching tool. Probability, descriptive statistics, correlation, and regression contain useful explanations and substantial working interfaces. The next phase should prioritize correctness and usability before adding more breadth. Some prominently listed modules are materially less complete than others, and two statistical-content defects need immediate attention.

This is an audit and proposed backlog. No application fixes or deployment changes were made.

## Coverage and limits

- Opened all 18 catalog modules and every declared top-level module section, plus home, modules, Data Manager, power hub, Learning Lab, search, and the wizard entry: **91 routes**.
- Checked each route at **1440 × 900 in dark mode** and **375 × 900 in light mode**: **182 page checks** in headless Microsoft Edge against the live deployment.
- Ran axe accessibility checks on **25 representative routes at both sizes**, including all calculator entry screens, nonparametric pages, NHST, probability learning, and the six main navigation destinations.
- Inspected screenshots and page content; exercised search, a complete wizard branch and browser Back, theme reload, CSV import, saving and reloading, leaving an unsaved workspace, dataset launches, and the repeated-measures Compute/Table and nonparametric software controls.
- Reviewed routing, wizard choices, dataset persistence and launch code, statistical dispatch, and software instructions.
- **No application console errors or warnings were captured in the 182-page sweep.** Seven phone-width routes had document overflow. Successful rendering does not establish statistical correctness or completeness.

These were desktop-browser viewport simulations, not physical iOS/Android tests. The audit did not exhaust every nested visualizer control, perform a screen-reader study, benchmark slow devices/networks, certify every numeric result, or independently retest all Excel/SPSS formats. Dark and light themes were not fully crossed with both sizes. Automated accessibility results vary with overlays and do not constitute a conformance certification.

The previous release's passing test/build checks remain useful evidence, but this review found gaps those checks do not cover. [Coverage and accessibility summary](audits/2026-09-11/coverage.json) records the inspected routes; [workflow observations](audits/2026-09-11/observations.json) preserve key reproduction evidence. Additional local observations remain in `.vite/site-audit/`.

## What looks and works well

| Area | What is worth preserving |
| --- | --- |
| Visual identity | The wizard artwork, indigo/purple palette, cards, and large headings give the product a recognizable identity. The dark theme feels cohesive. |
| Probability | Clear separation of learning, calculators, simulations, demos, and equations. Concrete examples make abstract rules approachable. Calculator constraints are explained near their inputs. |
| Descriptive statistics | Mean/median/mode and spread lessons explain when a measure is useful, including outliers, measurement level, and units. Explorer and software sections provide several ways to learn the same concept. |
| Correlation and regression | Scatterplots, residuals, confidence/prediction intervals, effect sizes, and interpretation coexist. Guidance addresses nonlinearity, causation, missing cases, and collinearity instead of only displaying a p-value. |
| Data preparation | CSV import, variable inspection, missingness summaries, transformations, reshaping, local saving, and compatibility-aware analysis launching form a substantial workflow. Synthetic CSV import/save/reload worked. |
| Saved-data reuse | Explicitly saved data launched successfully into Multiple Regression, Pearson Correlation, and the one-sample t-test in focused checks. The launcher explains why incompatible analyses are unavailable. |
| Power planning | Nine registered tests each expose a priori, post hoc, and sensitivity modes. Separating planning from observed-data analysis is useful. Scope notes exist for approximate designs. |
| Navigation | Direct module/section URLs worked across the full inventory. A wizard path to Multiple Regression and browser Back returned to the expected question. |
| Technical foundation | Lazy loading, error boundaries, tests, and deployment checks provide a useful base for focused improvements. The site does not need a wholesale redesign. |

## Fix first: correctness and incomplete functionality

### 1. Repeated Measures ANOVA runs the ordinary one-way ANOVA workspace — critical, verified

**Reproduce:** Open [Repeated Measures ANOVA → Test Calculator](https://jsr1151.github.io/statwizard/#/wizard/res_rm_anova/calculator), select **Compute**, then **Table**.

The page promises related conditions, but presents independent groups, ordinary between/within sums of squares, and Tukey group comparisons. Its bundled three-group example reports `F(2,12) = 38.00`. There is no participant identifier or repeated-observation model in this calculation path.

The source confirms the mismatch: `res_rm_anova` declares `visualType: 'anova'` in [wizardSteps.js](../src/data/wizardSteps.js); [ResultVisualizer.jsx](../src/components/app/ResultVisualizer.jsx) loads `AnovaVisual`, which calls `calculateAnova(groups)`. That function in [mathHelpers.js](../src/utils/mathHelpers.js) uses `dfWithin = N - k` and does not partition participant effects. [Screenshot of Compute mode](audits/2026-09-11/rm-compute.png).

**Recommended action:** Immediately stop presenting this as an implemented repeated-measures calculator. Provide an explicit scope message and verified external-software instructions until a dedicated model, subject matching, error structure, and appropriate corrections are implemented and independently validated. Reusing a teaching F-distribution plot is fine; labeling independent-groups output as repeated-measures analysis is not.

The Power tab already discloses its approximation. That disclosure does not cover the separate calculator mismatch. R's documentation describes explicit error strata for designs that require them: [official `aov` reference](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/aov.html).

### 2. Nonparametric software instructions can lead to the wrong test — critical, verified

**Reproduce:** Open [Wilcoxon Signed-Rank](https://jsr1151.github.io/statwizard/#/wizard/res_wilcoxon), then **R Code**. It displays `wilcox.test(y1, y2)`. The default is an unpaired rank-sum test; paired signed-rank analysis needs `paired = TRUE`. This distinction is explicit in the [official R documentation](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/wilcox.test.html).

Both nonparametric pages also instruct Excel and Google Sheets users to rank values and run an ordinary `T.TEST` on those ranks. That is not a valid general recipe for the advertised Mann–Whitney or paired signed-rank procedure.

**Recommended action:** Separate the two tests' instructions, correct the paired R call, and replace the spreadsheet shortcut with a verified implementation or a clear unsupported-software message. Add a worked reference example for each guide. Source: [softwareGuides.js](../src/data/softwareGuides.js), `non_parametric`.

### 3. Mann–Whitney and Wilcoxon are incomplete destinations — high, verified

- [Mann–Whitney](https://jsr1151.github.io/statwizard/#/wizard/res_mann_whitney) visibly says **“Formula not rendered”** and has an empty Visual Concept area.
- [Wilcoxon](https://jsr1151.github.io/statwizard/#/wizard/res_wilcoxon) shows an unrelated **“Describing Shape”** card about skewness/kurtosis and another empty Visual Concept area.
- Neither offers the calculator/learning depth suggested by neighboring modules. The wizard can recommend both as its final destination.

**Recommended action:** Give these pages an honest availability state immediately, remove irrelevant fallback content, and then implement test-specific ranked-data explanations, calculators, ties/zero-difference handling, effect sizes, assumptions, and reporting. Do not send a beginner to an unexplained blank result.

### 4. The wizard needs data-type and supported-design checks — high, source-confirmed

The association branch leads directly to Pearson correlation. Prediction branches by predictor count without asking whether the outcome is continuous, binary, or categorical. The factorial choice says **“Two or more factors”**, while the available calculator maps two factors. The independent t-test branch reduces selection to a normal/skewed choice.

**Recommended action:** Ask about variable measurement type and design before naming a method; add **“I'm not sure”** explanations; explicitly identify unsupported outcomes/designs. Limit factorial wording to the implemented scope. Add an explanation of why the final method fits the answers, including cautions that still need checking. Source: [wizardSteps.js](../src/data/wizardSteps.js).

## Fix next: data safety, access, and usability

### 5. Unsaved Data Manager work disappears on navigation — high, verified

**Reproduce:** Import a CSV without saving, select the home logo, and return to Data Manager. The imported workspace is gone; no leave/save warning appears. The interface does show an **Unsaved edits** badge before leaving, but does not preserve the draft. **New Workspace** also clears editor state directly.

**Recommended action:** Preserve a recoverable draft and offer Save/Discard/Cancel when an action would replace or abandon unsaved work. Make the last-saved state visible. Keep the existing successful local-save behavior. Sources: [DataManagerHeader.jsx](../src/components/data/DataManagerHeader.jsx), [useDataManagerEditor.js](../src/hooks/useDataManagerEditor.js), [useDataManagerFiles.js](../src/hooks/useDataManagerFiles.js).

### 6. File import has no normal keyboard entry point — high, verified in live DOM and source

Data Manager's **Import Data File** is a nonfocusable label around an input with `display: none`. Neither the visible label nor the actual input participates in normal Tab navigation. It is the empty workspace's primary action.

**Recommended action:** Use a keyboard-operable button connected to the input, or an accessible visually hidden input with a visible focus indicator. Apply the same review to upload controls elsewhere. [Source](../src/components/data/DataManagerHeader.jsx). W3C explains the requirement for equivalent keyboard operation in its [keyboard accessibility guidance](https://www.w3.org/WAI/WCAG22/Understanding/keyboard.html).

### 7. Labels and contrast need a coordinated pass — high, verified automated findings

Across 50 accessibility snapshots, contrast findings appeared in 49. These include repeated shared elements, so this is not 49 independent defects. The scan also found unnamed inputs on 19 snapshots, unnamed selects on 10, unnamed buttons on seven, and one inaccessible scroll region on Frequency's phone-width calculator.

Concrete examples: the independent t-test calculator has seven unnamed inputs and two unnamed selects in the desktop snapshot; the ANCOVA calculator has six unnamed buttons. Dim gray captions, small uppercase labels, and secondary text are often hard to read in the dark theme. Automated node details are retained locally.

**Recommended action:** Fix shared text colors and control labeling first, then review each visualizer. Increase tiny instructional text where possible. Test keyboard operation and focus visibility after the fixes. Use measured contrast, not appearance alone; [W3C contrast guidance](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) specifies the relevant thresholds.

### 8. Seven ANOVA routes overflow on phones — high, verified

At a 375px viewport, these routes made the entire document wider than the screen:

| Module | Section | Document width |
| --- | --- | ---: |
| One-Way ANOVA | Tutor / Lessons | 483px |
| One-Way ANOVA | Test Calculator | 507px |
| Factorial ANOVA | Tutor / Lessons | 448px |
| Factorial ANOVA | Test Calculator | 472px |
| Factorial ANOVA | Equation | 398px |
| Repeated Measures ANOVA | Tutor / Lessons | 538px |
| Repeated Measures ANOVA | Test Calculator | 507px |

Alpha-button groups and formula/visualizer containers were the observed contributors. No document overflow was detected in the other swept routes at the tested widths; that does not exclude clipped content or problems in untested nested views.

**Recommended action:** Wrap control groups, constrain shrinking containers, and contain wide tables/equations in clearly indicated, keyboard-accessible scroll regions. Verify actual controls at 320–430px as well as the overall page width.

### 9. Useful content takes too much scrolling to reach — medium, visual assessment

The homepage's large artwork pushes most destinations below the first screen. On phones, module tabs become a tall vertical list. Several calculators then show multiple saved-data/setup cards before any actual calculation inputs. Even Probability's small calculator begins below a large title and navigation stack. The Multiple Regression lesson was approximately **11,828px tall** at the tested phone width.

**Recommended action:** Make a compact mobile section selector; put data-source choice in one panel; collapse unavailable saved-data setup; add a short contents/jump menu for long lessons; keep the active analysis/result summary easy to find. Reduce homepage hero height so users see meaningful choices sooner. Preserve the artwork, with a light-theme treatment that avoids its conspicuous dark rectangle. [Phone homepage](audits/2026-09-11/home-mobile.png).

### 10. Search misses ordinary words for existing concepts — medium, verified

**“average”** and **“standard deviation”** return no results, while **“mean”** and **“SD”** find relevant modules. “SD” also matches Probability because punctuation and spaces are removed before substring matching. The interface promises search across concepts, but the implementation searches only module titles/categories.

**Recommended action:** Add synonyms and concept keywords, rank exact/title matches first, and provide suggestions when nothing matches. Consider searching lesson headings later. [Search](https://jsr1151.github.io/statwizard/#/search); [source](../src/components/navigation/SearchView.jsx).

### 11. Automatic tutor cards can obstruct the work — medium, observed

A tutor card covered the ANCOVA title and upper navigation on a phone-sized screen. Other ANOVA screens show unsolicited cards while entering calculator mode. The tutoring is useful, but its placement competes with the task. [Observed overlay](audits/2026-09-11/tutor-mobile.png).

**Recommended action:** Prefer an inline hint or user-opened help panel on phones, and respect the distinction between lessons and calculator work. Use consistent names such as **Guided hints** for scripted support; labels such as **“ANOVA TUTOR AI • VERSION 1.0”** introduce unnecessary uncertainty about how advice is generated.

### 12. Product wording exposes development details — medium, verified copy

The power hub refers to a **“shared registry,” “shared architecture,”** and **“future solver slices.”** Regression lessons say **“first slice”** and **“formal lesson engine.”** These explain implementation history rather than the user's next decision.

**Recommended action:** Replace them with task language: choose a test, calculate sample size, enter data, inspect assumptions. Keep mathematical limitations prominent, but state them directly. Standardize **Learn / Tutor / Lessons**, **Calculator / Test Calculator**, and **Equation / Equations** where differences do not serve users.

### 13. Preferences and navigation context are shallow — medium/low, verified

Light mode resets to dark on reload. Every audited route uses the same browser title, **“StatWizard — Interactive Statistics.”** Long workspaces lack a persistent cross-module destination list; users mainly rely on Home and Back.

**Recommended action:** Persist theme preference, set module-specific document titles, and add a compact module switcher/breadcrumb. Distinguish a page bookmark from a saved analysis: the working inputs are not represented by the route alone.

### 14. Dataset launch should never briefly look like the user's sample was replaced — investigate, not a confirmed persistent failure

One early capture after launching an unsaved six-row CSV into Multiple Regression showed the built-in 15-row example. Five subsequent Multiple Regression launch checks, including three unsaved/auto-save launches observed after three seconds, settled on the correct six-row dataset. Saved launches into Pearson and the one-sample t-test also worked.

**Recommended action:** Add an explicit loading/selected-dataset state and a full browser regression test for the entire import → save/auto-save → launch sequence. Do not present sample results as though they are the launch result while initialization is unsettled. The initial observation is retained in the evidence; this audit does **not** claim a reproducible persistent wrong-dataset failure.

## Areas to expand

| Area | Recommended expansion | Priority |
| --- | --- | --- |
| Learning Lab | Start with one complete path: data types → center/spread → probability → uncertainty → one-sample inference. Add objectives, worked examples, short checks, feedback, progress, and “continue learning.” Existing module lessons can supply much of the material. | High after correctness fixes |
| Nonparametric and repeated measures | Complete the already-advertised methods before adding more catalog cards. Include data entry, honest scope, assumptions, plots, validated inference, and reporting. | High |
| A common analysis workflow | Offer consistent Sample data / Paste / Upload / Saved dataset choices, show active dataset and usable rows, then results and interpretation. Simple Linear Regression and descriptive modules are absent from the Data Manager launcher despite being natural destinations. | High |
| Reproducible output | Save an analysis configuration as well as a dataset; export inputs, exclusions, settings, results, method, and version together. Provide a consistent report/plot export surface instead of different copy/report features in each module. | Medium |
| Method transparency | Add per-method references, implemented scope, limitations, validation examples, and tested software-guide versions. Make these reachable from the actual calculator, not only repository documentation. | High |
| Dataset recovery and portability | Add a sample file/template in the empty state, explicit “saved on this browser/device” wording, and portable backup/restore that preserves variable metadata and transformations. Explain that a cleaned CSV export is not the whole project. | Medium |
| Power analysis | Give effect-size choice more worked help. Add true repeated-measures and effect-specific factorial planning before promoting approximate views as equivalent. Expand regression planning beyond the omnibus model when justified by user demand. | Medium |
| Broader statistical coverage | After repairing current gaps, consider chi-square/Fisher tests for categorical data, Spearman correlation, Kruskal–Wallis/Friedman tests, and logistic regression. Add wizard branches only when their destination is usable. | Later |
| Keyboard-friendly plots | Offer a focusable case selector or data table for point inspection. For example, the observed-vs-fitted plot currently assigns pointer clicks to SVG circles without keyboard handlers. | High access improvement |
| Help and feedback | Add a concise getting-started page, searchable glossary, supported-feature list, and an obvious way to report a problem with module/version context. | Medium |

The current **Learning Lab is explicitly marked “Coming Soon”** and contains three noninteractive roadmap cards. It is an acknowledged placeholder, not a broken loading process. Until a real path exists, link it to the working lessons so it is useful when opened.

## Module-by-module assessment

All listed top-level sections were opened in both tested layouts. “Strong” below describes the reviewed product experience, not independent validation of every numerical method.

| Module | Assessment | Most useful next improvement |
| --- | --- | --- |
| Central Tendency | Strong learning/calculator/explorer structure | Saved-data integration and a guided worked dataset |
| Variability | Strong explanations of SD, IQR, MAD, and outliers | Common data source workflow and linked practice |
| Frequency | Useful calculator and exploration coverage | Keyboard access to the mobile scroll region; data integration |
| Probability | One of the most coherent learning areas | Short learning sequence and compact phone navigation |
| NHST | Useful interactive conceptual coverage; older page layout | Labels/contrast, consistency with module sections, exercises |
| One-Sample Z-Test | Working visual calculator and power entry | Accessible input labels and clearer sample/population input guidance |
| One-Sample t-Test | Saved-data launch worked; rich visual explanation | Labels/contrast and less setup scrolling |
| Independent t-Test | Broad calculator and teaching surface | Accessible controls, streamlined setup, wizard guidance |
| Paired t-Test | Working structured surface and saved-data support | Accessible selects; make pairing and excluded pairs unmistakable |
| One-Way ANOVA | Substantial plots, table, and post-hoc workspace | Phone overflow, labels, tutor placement |
| ANCOVA | Rich covariate/data and visual surfaces | Keyboard button names, tutor obstruction, stronger guide validation |
| Factorial ANOVA | Rich data, plots, diagnostics, and report controls | Two-factor scope wording, phone overflow, accessible inputs |
| Repeated Measures ANOVA | Material mismatch between label and calculator | Replace/disable misleading calculation path; implement actual model |
| Pearson Correlation | Strong interpretation, plots, and saved-data flow | Labels, common workflow copy, keyboard case inspection |
| Simple Linear Regression | Strong fit/prediction/residual explanation | Data Manager integration, keyboard case inspection, compact mobile layout |
| Multiple Regression | Deepest modeling workspace; useful diagnostics | Shorter lessons, progressive disclosure, explicit launch loading state |
| Mann–Whitney U | Incomplete result page | Missing formula/visual/calculator and incorrect spreadsheet guidance |
| Wilcoxon Signed-Rank | Incomplete result page with wrong fallback content | Correct software calls, replace fallback, build ranked-pair workflow |

## Suggested implementation order

1. **Correctness:** repair or clearly gate Repeated Measures ANOVA; fix the nonparametric software instructions; label incomplete module destinations honestly; constrain wizard recommendations to supported designs.
2. **Protect and enable users:** preserve drafts, make import keyboard accessible, fix labels/contrast, and repair the seven overflowing ANOVA routes.
3. **Simplify the experience:** compact phone navigation, unify data-source setup, improve search synonyms, persist preferences, and make tutor hints less intrusive.
4. **Expand deliberately:** complete one Learning Lab path and the unfinished advertised methods; then add reproducible analysis reports and additional statistical families.

The most valuable next delivery is the correctness/data-safety pass. The site already has enough breadth to be useful; these changes would make that breadth more dependable.
