export const ANOVA_TUTOR_SCRIPTS = [
    // --- MODE / TAB TRIGGERS (Elevated Priority: 800) ---
    {
        id: "tab_fdist_info",
        priority: 800,
        type: "hint",
        title: "The F-Distribution",
        body: "This curve shows the F values you’d expect if the null hypothesis were true (all population means are equal). Its shape depends on df_between (df1) and df_within (df2).",
        condition: (state) => state.lastAction === 'change_tab_fdist',
        buttons: [
            { label: "Why starts at 0?", action: "show_f_starts_0" },
            { label: "Got it", action: "dismiss_session" }
        ]
    },
    {
        id: "tab_means_info",
        priority: 801,
        type: "hint",
        title: "Group Means Visualizer",
        body: "Between-group variability comes from how far each group mean is from the grand mean, with larger groups counting more.",
        condition: (state) => state.lastAction === 'change_tab_means',
        buttons: [
            { label: "Show SS_between", action: "highlight_ssb" },
            { label: "Got it", action: "dismiss_session" }
        ]
    },
    {
        id: "tab_decomp_info",
        priority: 802,
        type: "hint",
        title: "Variance Decomposition",
        body: "Total variability splits into SS_total = SS_between + SS_within. ANOVA turns these into mean squares (MS), then computes F = MS_between / MS_within.",
        condition: (state) => state.lastAction === 'change_tab_decomp',
        buttons: [
            { label: "Check assumptions", action: "show_assumptions_checklist" },
            { label: "Got it", action: "dismiss_session" }
        ]
    },

    // --- INTERACTION TRIGGERS (Elevated Priority: 850) ---
    {
        id: "signal_add_group",
        priority: 850,
        type: "enrichment",
        title: "Adding Groups Changes df",
        body: "Adding a group increases df_between (k - 1). If total N stays the same, df_within (N - k) decreases.",
        condition: (state) => state.lastAction === 'add_group',
        buttons: [
            { label: "Show df calculation", action: "show_df_explanation" },
            { label: "Got it", action: "dismiss_session" }
        ]
    },
    {
        id: "signal_remove_group",
        priority: 850,
        type: "enrichment",
        title: "Removing Groups",
        body: "With fewer groups, df_between (k - 1) decreases. If total N stays the same, df_within (N - k) increases.",
        condition: (state) => state.lastAction === 'remove_group',
        buttons: [{ label: "Got it", action: "dismiss_session" }]
    },
    {
        id: "signal_post_hoc",
        priority: 860,
        type: "enrichment",
        title: "Why use Post-Hocs?",
        body: "ANOVA can show evidence that at least one mean differs, but it does not identify which groups differ. Post-hoc tests (like Tukey) compare pairs while controlling the overall Type I error rate.",
        condition: (state) => state.lastAction === 'run_post_hoc',
        buttons: [{ label: "Got it", action: "dismiss_session" }]
    },
    {
        id: "signal_alpha",
        priority: 870,
        type: "hint",
        title: "Adjusting Alpha",
        body: "Alpha is the cutoff for calling a result ‘significant.’ Lower alpha (like .01) makes significance harder and pushes F_crit to the right.",
        condition: (state) => state.lastAction === 'change_alpha',
        buttons: [{ label: "Got it", action: "dismiss_session" }]
    },

    // --- EXPLORE MODE (Elevated Priority: 820) ---
    {
        id: "explore_df1",
        priority: 820,
        type: "hint",
        title: "Adjusting df1 (Numerator)",
        body: "Increasing df1 usually makes the curve less skewed and more concentrated near 1.",
        condition: (state) => state.lastAction === 'change_df1',
        buttons: [{ label: "Got it", action: "dismiss_session" }]
    },
    {
        id: "explore_df2",
        priority: 820,
        type: "hint",
        title: "Adjusting df2 (Denominator)",
        body: "Increasing df2 usually makes the curve less skewed and more concentrated near 1, which stabilizes p-values.",
        condition: (state) => state.lastAction === 'change_df2',
        buttons: [{ label: "Got it", action: "dismiss_session" }]
    },
    {
        id: "explore_f_calc",
        priority: 820,
        type: "hint",
        title: "Adjusting the F-statistic",
        body: "As F increases, the shaded right-tail area (the p-value) gets smaller. F is MS_between / MS_within.",
        condition: (state) => state.lastAction === 'change_f_calc',
        buttons: [{ label: "Got it", action: "dismiss_session" }]
    },

    // --- GLOBAL THRESHOLDS (Elevated Priority: 900) ---
    {
        id: "global_near_cutoff",
        priority: 950,
        type: "enrichment",
        title: "Near the Edge",
        body: "This is a borderline result. Your F-value is very close to the critical cutoff, meaning small changes in data could flip the significance.",
        condition: (state) => {
            if (!state.stats?.valid) return false;
            const p = state.stats.p;
            const alpha = state.stats.alpha;
            const fVal = state.stats.F;
            const fCrit = state.stats.Fcrit;
            return Math.abs(p - alpha) <= 0.01 || (Math.abs(fVal - fCrit) / fCrit <= 0.05);
        },
        buttons: [
            { label: "What is F_crit?", action: "show_df_explanation" },
            { label: "Got it", action: "dismiss_session" }
        ]
    },
    {
        id: "global_f_near_1",
        priority: 900,
        type: "hint",
        title: "F near 1",
        body: "F near 1 means the between-group variability is about the same size as within-group variability. That usually leads to a larger p-value.",
        condition: (state) => state.stats?.F >= 0.9 && state.stats?.F <= 1.1,
        buttons: [{ label: "Got it", action: "dismiss_session" }]
    },
    {
        id: "global_f_large",
        priority: 920,
        type: "enrichment",
        title: "Significant F-ratio",
        body: "When F is significantly larger than F_crit (and p < alpha), it suggests group differences are larger than expected by random noise.",
        condition: (state) => state.stats?.p <= (state.stats?.alpha || 0.05),
        buttons: [
            { label: "Highlight what changed", action: "highlight_f_drivers" },
            { label: "Got it", action: "dismiss_session" }
        ]
    },

    // --- INTERPRETATION (Priority: 900) ---
    {
        id: "res_significant",
        priority: 900,
        type: "enrichment",
        title: "Significant Result",
        body: "Result is significant. This supports that at least one group mean differs. Next step is usually a post-hoc test or planned contrasts.",
        condition: (state) => state.stats?.p < state.stats?.alpha && state.lastAction === 'calc_results',
        buttons: [
            { label: "Run Post-Hoc", action: "run_post_hoc" },
            { label: "Show Effect Size", action: "show_effect_size_info" }
        ]
    },
    {
        id: "res_nonsignificant",
        priority: 900,
        type: "enrichment",
        title: "Not Significant",
        body: "Not significant. This means the data do not provide strong evidence that the group means differ. Small samples and high within-group variability can reduce power.",
        condition: (state) => state.stats?.p >= state.stats?.alpha && state.lastAction === 'calc_results',
        buttons: [
            { label: "Show Power Tip", action: "show_power_tip" },
            { label: "What does this mean?", action: "show_nonsig_explanation" }
        ]
    },

    // --- Onboarding (Priority: 300-300) ---
    {
        id: "onboarding_intro",
        priority: 300,
        type: "onboarding",
        title: "ANOVA Introduction",
        body: "ANOVA evaluates whether observed separation between groups is larger than expected from within-group noise (random chance).",
        condition: (state) => state.isFirstVisit && !state.activeTip,
        buttons: [
            { label: "Start", action: "onboarding_step_1", next: "onboarding_how_to" },
            { label: "Skip", action: "dismiss_permanent" }
        ]
    },

    // --- Symbol Confusion (Priority: 400) ---
    {
        id: "confusion_indices",
        priority: 400,
        type: "misconception",
        title: "What do i and j mean?",
        body: "j labels groups (1…k). i labels individuals inside a group (1…nⱼ).",
        condition: (state) => state.hoveredTerm === 'Sigma' || state.hoveredTerm === 'i' || state.hoveredTerm === 'j' || state.hoveredTerm === 'indices',
        buttons: [
            { label: "Got it", action: "dismiss_session" },
            { label: "Show example", action: "show_index_example" }
        ]
    },
    {
        id: "confusion_ms",
        priority: 450,
        type: "hint",
        title: "What is MS (Mean Square)?",
        body: "Mean square is a sum of squares divided by its df: MS_between = SS_between/df_between, MS_within = SS_within/df_within.",
        condition: (state) => state.hoveredTerm === 'MS_between' || state.hoveredTerm === 'MS_within',
        buttons: [{ label: "Got it", action: "dismiss_session" }]
    },
    {
        id: "concept_eta2",
        priority: 450,
        type: "enrichment",
        title: "Effect Size (η²)",
        body: "Effect size estimates how much total variability is associated with group membership. For example, η² ≈ SS_between / SS_total.",
        condition: (state) => state.hoveredTerm === 'eta2',
        buttons: [{ label: "Got it", action: "dismiss_session" }]
    },

    // --- Data Errors (Priority: 1100+) ---
    {
        id: "error_k_count",
        priority: 1100,
        type: "error",
        title: "You need at least 2 groups",
        body: "ANOVA compares two or more group means. Add another group to continue.",
        condition: (state) => state.stats?.k < 2,
        buttons: [
            { label: "Add group", action: "add_group" }
        ]
    },
    {
        id: "error_nj_count",
        priority: 1090,
        type: "error",
        title: "Min 2 observations per group",
        body: "A group with only 1 score has no within-group variance. Add another observation.",
        condition: (state) => state.stats?.anyNj < 2 && state.inputMode === 'raw',
        buttons: [
            { label: "Got it", action: "dismiss_session" }
        ]
    },
    {
        id: "error_invalid_input",
        priority: 1150,
        type: "error",
        title: "Data Entry Issues",
        body: "Some entries are missing or not numbers. ANOVA needs numeric scores in each group.",
        condition: (state) => state.lastAction === 'data_error_missing',
        buttons: [{ label: "Got it", action: "dismiss_session" }]
    },
    {
        id: "error_summary_missing",
        priority: 1150,
        type: "error",
        title: "Summary Stats Missing",
        body: "To compute SS_within from summary stats, each group needs a variance (or SD) and sample size.",
        condition: (state) => state.lastAction === 'data_error_summary',
        buttons: [{ label: "Got it", action: "dismiss_session" }]
    },

    // --- Assumptions/Edge Cases (Priority: 850) ---
    {
        id: "edge_unbalanced",
        priority: 850,
        type: "hint",
        title: "Unequal group sizes",
        body: "Imbalanced group sizes + variance differences together are when ANOVA becomes most vulnerable. Check both.",
        condition: (state) => (state.stats?.maxNj / state.stats?.minNj >= 2) && (state.lastAction === 'add_group' || state.lastAction === 'remove_group' || state.lastAction === 'change_raw'),
        buttons: [
            { label: "Tell me more", action: "show_unbalanced_info" },
            { label: "Don't show again", action: "dismiss_permanent" }
        ]
    },
    {
        id: "edge_variances",
        priority: 850,
        type: "hint",
        title: "Homogeneity of Variance",
        body: "Group variances differ significantly. Big differences can inflate false positives or reduce power. Consider Welch's ANOVA.",
        condition: (state) => (state.stats?.maxVar / state.stats?.minVar > 4) && (state.lastAction === 'change_stats' || state.lastAction === 'change_raw'),
        buttons: [
            { label: "What is Welch ANOVA?", action: "show_welch_info" },
            { label: "Check assumptions", action: "show_assumptions_checklist" }
        ]
    }
];
