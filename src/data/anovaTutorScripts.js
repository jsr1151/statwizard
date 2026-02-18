export const ANOVA_TUTOR_SCRIPTS = [
    // --- Onboarding (Priority: 200-300) ---
    {
        id: "onboarding_intro",
        priority: 300,
        type: "onboarding",
        title: "ANOVA in one sentence",
        body: "ANOVA compares group means by splitting total variability into between-group signal and within-group noise.",
        condition: (state) => state.isFirstVisit && !state.activeTip,
        buttons: [
            { label: "Start", action: "highlight_ssb", next: "onboarding_how_to" },
            { label: "Skip", action: "dismiss_permanent" }
        ]
    },
    {
        id: "onboarding_how_to",
        priority: 250,
        type: "onboarding",
        title: "How to use this page",
        body: "Tip: Use 'Show Values' to reveal the numbers in each formula. Hover symbols for definitions. Switch Raw Data vs Summary Stats for SS_within.",
        condition: (state) => state.isFirstVisit && state.idleTime >= 10,
        buttons: [
            { label: "Show me", action: "toggle_show_values" },
            { label: "Later", action: "dismiss_session" }
        ]
    },
    {
        id: "onboarding_mode",
        priority: 200,
        type: "onboarding",
        title: "Choose your computation mode",
        body: "If you have raw scores, use Raw Data. If you only have group size and variance, use Summary Stats. Both give the same SS_within.",
        condition: (state) => state.activePanel === 'ss_within' && state.isFirstVisitToPanel,
        buttons: [
            { label: "Raw Data", action: "set_ssw_mode_raw" },
            { label: "Summary Stats", action: "set_ssw_mode_summary" },
            { label: "Don't show again", action: "dismiss_permanent" }
        ]
    },

    // --- Symbol Confusion (Priority: 400) ---
    {
        id: "confusion_indices",
        priority: 400,
        type: "misconception",
        title: "What do i and j mean?",
        body: "j labels groups (1…k). i labels individuals inside a group (1…nⱼ).",
        condition: (state) => state.hoveredTerm === 'sigma' || state.hoveredTerm === 'indices' || state.isSymbolKeyFirstOpen,
        buttons: [
            { label: "Got it", action: "dismiss_session" },
            { label: "Show example", action: "show_index_example" }
        ]
    },
    {
        id: "confusion_grand_mean",
        priority: 400,
        type: "misconception",
        title: "What is the grand mean?",
        body: "Grand mean is the average of all scores from all groups combined.",
        condition: (state) => state.hoveredTerm === 'x_grand' || state.clickedTerm === 'x_grand',
        buttons: [
            { label: "Highlight in table", action: "highlight_grand_mean" },
            { label: "Got it", action: "dismiss_session" }
        ]
    },
    {
        id: "confusion_scaling",
        priority: 400,
        type: "misconception",
        title: "Why is nⱼ multiplying naming?",
        body: "Each group mean represents every score in that group. Multiplying by nⱼ scales that mean difference to the group's total contribution.",
        condition: (state) => state.hoveredTerm === 'nj' && state.activePanel === 'ss_between',
        buttons: [
            { label: "Show numeric example", action: "show_nj_example" },
            { label: "Got it", action: "dismiss_session" }
        ]
    },

    // --- Stuck Detection (Priority: 150) ---
    {
        id: "stuck_show_values",
        priority: 150,
        type: "hint",
        title: "Try Show Values",
        body: "Want it to feel less abstract? Turn on 'Show Values' to see the actual numbers substituted into each term.",
        condition: (state) => state.scrollDepth > 500 && !state.showValues && state.idleTime >= 20 && !state.dismissed_stuck_values,
        buttons: [
            { label: "Show Values", action: "toggle_show_values" },
            { label: "Not now", action: "dismiss_session" }
        ]
    },
    {
        id: "stuck_focus_group",
        priority: 140,
        type: "hint",
        title: "One group at a time",
        body: "Compute SS_between by adding group contributions one at a time: nⱼ(x̄ⱼ - x̄_grand)². Start with just one group.",
        condition: (state) => state.showValues && state.activePanel === 'ss_between' && state.idleTime >= 15,
        buttons: [
            { label: "Focus Group 1", action: "focus_group_1" },
            { label: "Got it", action: "dismiss_session" }
        ]
    },
    {
        id: "stuck_collapse",
        priority: 130,
        type: "hint",
        title: "You can collapse panels",
        body: "Tip: Collapse sections you're done with so you only see the current step.",
        condition: (state) => state.scrollVelocity > 2000 && state.scrollDirection === 'up',
        buttons: [
            { label: "Collapse completed", action: "collapse_all_but_active" },
            { label: "Got it", action: "dismiss_session" }
        ]
    },

    // --- Data Errors (Priority: 1000+) ---
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
        title: "Group must have at least 2 observations",
        body: "A group with 1 score cannot have within-group variance. Add at least one more observation to that group.",
        condition: (state) => state.stats?.anyNj < 2 && state.inputMode === 'raw',
        buttons: [
            { label: "Go to group", action: "focus_empty_group" },
            { label: "Got it", action: "dismiss_session" }
        ]
    },
    {
        id: "error_variance_invalid",
        priority: 1080,
        type: "error",
        title: "Variance undefined",
        body: "Variance must be a nonnegative number. Check your input for sⱼ².",
        condition: (state) => state.stats?.anyInvalidVariance && state.inputMode === 'summary',
        buttons: [
            { label: "Take me there", action: "focus_invalid_variance" }
        ]
    },
    {
        id: "error_df_within",
        priority: 1070,
        type: "error",
        title: "Degrees of freedom issue",
        body: "Within-group degrees of freedom must be positive. You need more total observations than groups.",
        condition: (state) => state.stats?.df_within <= 0,
        buttons: [
            { label: "Show me why", action: "show_df_explanation" },
            { label: "Got it", action: "dismiss_session" }
        ]
    },
    {
        id: "error_ssw_mismatch",
        priority: 1060,
        type: "error",
        title: "Raw vs Summary mismatch",
        body: "Your raw-data SS_within and summary-stats SS_within do not match. This usually means a variance or group size was entered incorrectly.",
        condition: (state) => Math.abs(state.stats?.ssw_raw - state.stats?.ssw_summary) > 0.1,
        buttons: [
            { label: "Compare group-by-group", action: "highlight_mismatch" },
            { label: "Ignore", action: "dismiss_session" }
        ]
    },

    // --- Conceptual (Priority: 500-600) ---
    {
        id: "concept_f_ratio",
        priority: 600,
        type: "misconception",
        title: "F is a ratio, not a difference",
        body: "F compares two averages of variance: MS_between (signal) divided by MS_within (noise). Bigger F means group separation is large relative to within-group spread.",
        condition: (state) => state.hoveredTerm === 'F' || state.clickedTerm === 'F_help',
        buttons: [
            { label: "Show F≈1 example", action: "show_f1_example" },
            { label: "Got it", action: "dismiss_session" }
        ]
    },
    {
        id: "concept_f_near_1",
        priority: 550,
        type: "enrichment",
        title: "Anchor: F near 1",
        body: "F is close to 1. That pattern happens when between-group variation is similar to within-group variation.",
        condition: (state) => state.stats?.F >= 0.8 && state.stats?.F <= 1.2,
        buttons: [
            { label: "What would raise F?", action: "show_f_factors" },
            { label: "Got it", action: "dismiss_session" }
        ]
    },
    {
        id: "concept_f_large",
        priority: 550,
        type: "enrichment",
        title: "When F gets large",
        body: "F is getting large. That happens when group means separate, within-group spread shrinks, or both.",
        condition: (state) => state.stats?.F >= 4,
        buttons: [
            { label: "Highlight which changed", action: "highlight_f_drivers" },
            { label: "Got it", action: "dismiss_session" }
        ]
    },
    {
        id: "concept_ss_size",
        priority: 540,
        type: "misconception",
        title: "SS increases with spread and sample size",
        body: "SS depends on both spread and sample size. If n grows, SS can grow even if the mean differences stay the same.",
        condition: (state) => state.lastAction === 'change_n' && Math.abs(state.last_ss - state.current_ss) > 1,
        buttons: [
            { label: "Show a quick example", action: "show_ss_n_example" }
        ]
    },
    {
        id: "concept_why_square",
        priority: 530,
        type: "misconception",
        title: "Why we square",
        body: "Squaring makes all distances positive and gives more weight to larger deviations. It is why SS captures overall variability.",
        condition: (state) => state.hoveredTerm === 'square',
        buttons: [
            { label: "Show before/after squaring", action: "show_square_demo" }
        ]
    },
    {
        id: "concept_ms_average",
        priority: 520,
        type: "enrichment",
        title: "MS is an average SS",
        body: "Mean square is SS divided by its degrees of freedom. It converts totals into an average variance estimate.",
        condition: (state) => state.activePanel?.includes('ms_') && state.isFirstVisitToMs,
        buttons: [
            { label: "Show with numbers", action: "toggle_show_values" },
            { label: "Got it", action: "dismiss_session" }
        ]
    },
    {
        id: "concept_eta_interpretation",
        priority: 510,
        type: "enrichment",
        title: "Eta squared interpretation",
        body: "η² is the fraction of total variability linked to group membership. Example: η² = .30 means about 30% of the variance is associated with groups.",
        condition: (state) => state.stats?.eta2 !== undefined && state.isFirstVisitToEta,
        buttons: [
            { label: "Give me a plain-language sentence", action: "generate_eta_sentence" },
            { label: "Got it", action: "dismiss_session" }
        ]
    },
    {
        id: "concept_eta_magnitude",
        priority: 505,
        type: "enrichment",
        title: (state) => state.stats?.eta2 < 0.05 ? "Small η²" : "Large η²",
        body: (state) => state.stats?.eta2 < 0.05
            ? "η² is small. Group membership explains a small portion of the total variability here."
            : "η² is large. Group membership accounts for a large portion of the total variability here.",
        condition: (state) => state.stats?.eta2 < 0.05 || state.stats?.eta2 > 0.30,
        buttons: [
            { label: "How to report", action: "show_eta_apa" },
            { label: "Got it", action: "dismiss_session" }
        ]
    },

    // --- Process Guidance (Priority: 200) ---
    {
        id: "process_order",
        priority: 200,
        type: "hint",
        title: "You can compute in this order",
        body: "A reliable order: 1) compute SS_between and SS_within, 2) find df_between and df_within, 3) compute MS_between and MS_within, 4) compute F, 5) interpret p and η².",
        condition: (state) => state.clickedTerm === 'help_general',
        buttons: [
            { label: "Guide me step-by-step", action: "start_step_by_step" },
            { label: "Got it", action: "dismiss_session" }
        ]
    },
    {
        id: "process_check_df",
        priority: 190,
        type: "hint",
        title: "Check your df",
        body: "Before interpreting p, confirm df: df_between = k−1 and df_within = N−k.",
        condition: (state) => state.clickedTerm === 'interpret_p' || state.activePanel === 'p_value',
        buttons: [
            { label: "Verify df", action: "highlight_df_panels" },
            { label: "Continue", action: "dismiss_session" }
        ]
    },
    {
        id: "process_ssb_drivers",
        priority: 180,
        type: "hint",
        title: "What changes SS_between?",
        body: "SS_between increases when group means move farther from the grand mean, especially for larger groups.",
        condition: (state) => state.lastAction === 'drag_mean',
        buttons: [
            { label: "Show contributions per group", action: "highlight_ssb_parts" }
        ]
    },
    {
        id: "process_ssw_drivers",
        priority: 170,
        type: "hint",
        title: "What changes SS_within?",
        body: "SS_within increases when points spread out more around their group mean.",
        condition: (state) => state.lastAction === 'drag_point',
        buttons: [
            { label: "Show within deviations", action: "highlight_ssw_parts" }
        ]
    },

    // --- Assumptions/Edge Cases (Priority: 100) ---
    {
        id: "edge_unbalanced",
        priority: 100,
        type: "hint",
        title: "Unequal group sizes",
        body: "Your group sizes are quite different. ANOVA still works, but large imbalances can affect robustness when variances differ.",
        condition: (state) => state.stats?.maxNj / state.stats?.minNj >= 2,
        buttons: [
            { label: "Tell me more", action: "show_unbalanced_info" },
            { label: "Don't show again", action: "dismiss_permanent" }
        ]
    },
    {
        id: "edge_variances",
        priority: 100,
        type: "hint",
        title: "Variance differences",
        body: "Group variances differ a lot. If this is real data, consider checking the equal-variance assumption.",
        condition: (state) => state.stats?.maxVar / state.stats?.minVar > 4,
        buttons: [
            { label: "Show variance check", action: "show_homogeneity_info" },
            { label: "Ignore", action: "dismiss_session" }
        ]
    },
    {
        id: "edge_outlier",
        priority: 90,
        type: "hint",
        title: "Outlier warning",
        body: "One score is far from its group mean. Outliers can inflate SS_within and reduce F.",
        condition: (state) => state.stats?.hasOutlier,
        buttons: [
            { label: "Highlight point", action: "highlight_outlier" },
            { label: "Ignore", action: "dismiss_session" }
        ]
    },

    // --- Mini Questions (Priority: 50) ---
    {
        id: "quiz_spread_f",
        priority: 50,
        type: "enrichment",
        title: "Predict before reveal",
        body: "Quick check: If within-group spread shrinks, what happens to F?",
        condition: (state) => state.lastAction === 'toggle_values_first_time',
        buttons: [
            { label: "F increases", action: "quiz_correct" },
            { label: "F decreases", action: "quiz_incorrect" },
            { label: "Not sure", action: "show_f_spread_explanation" }
        ]
    },
    {
        id: "quiz_sentence_builder",
        priority: 50,
        type: "enrichment",
        title: "Interpretation sentence builder",
        body: "Want a report-ready sentence? I can generate one using your values.",
        condition: (state) => state.stats?.p !== undefined && state.stats?.F !== undefined,
        buttons: [
            { label: "Generate sentence", action: "generate_apa_report" },
            { label: "No thanks", action: "dismiss_permanent" }
        ]
    }
];
