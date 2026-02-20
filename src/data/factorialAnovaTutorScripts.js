export const FACTORIAL_ANOVA_TUTOR_SCRIPTS = [
    // --- Header & Navigation ---
    {
        id: 'theme_onboarding',
        type: 'onboarding',
        priority: 100,
        condition: (s) => !s.hasInteracted && s.idleTime > 10 && !s.themeSelected && s.allCellsEmpty,
        title: "Need a head start?",
        body: "Not sure where to start? Pick a theme to auto-fill factors and sample data, or build your own below.",
        buttons: [
            { label: "Show Themes", action: "open_themes" },
            { label: "Maybe Later", action: "dismiss_session" }
        ]
    },
    {
        id: 'between_subjects_reminder',
        type: 'tip',
        priority: 50,
        condition: (s) => s.lastAction === 'switch_from_repeated' || s.dualEntryDetected,
        title: "Between-Subjects Rule",
        body: "This is a between-subjects design. The same participant should not appear in more than one cell.",
        buttons: [{ label: "Got it", action: "dismiss_session" }]
    },
    {
        id: 'empty_cells_blocker',
        type: 'error',
        priority: 200,
        condition: (s) => s.lastAction === 'try_unlock_results' && s.hasEmptyCells,
        title: "Missing Data",
        body: "A factorial ANOVA needs data in every cell. Fill all combinations of Factor A × Factor B to unlock the results.",
        buttons: [{ label: "Show Grid", action: "focus_grid" }]
    },

    // --- Data Entry & Parsing ---
    {
        id: 'non_numeric_input',
        type: 'error',
        priority: 110,
        condition: (s) => s.lastAction === 'input_parse_error',
        title: "Numbers Only",
        body: "It looks like some non-numeric text was entered. Please use only numbers and decimal points for cell values.",
        buttons: [{ label: "Fix Input", action: "focus_last_cell" }]
    },
    {
        id: 'scale_mismatch_warning',
        type: 'tip',
        priority: 75,
        condition: (s) => !s.allCellsEmpty && s.maxMean > s.medianMean * 10 && s.medianMean > 0,
        title: "Check your scale",
        body: "One of your cell means is much larger than the others. Double-check for extra zeros or misplaced decimal points.",
        buttons: [{ label: "Check Grid", action: "focus_grid" }]
    },

    // --- Factor Setup ---
    {
        id: 'many_cells_warning',
        type: 'tip',
        priority: 80,
        condition: (s) => s.lastAction === 'add_level' && s.totalCells > 6,
        title: "More cells, more participants",
        body: "You added a level. Remember: you now need data for every A × B combination. More cells means more work and usually requires more participants.",
        buttons: [{ label: "Understood", action: "dismiss_session" }]
    },
    {
        id: 'rename_default_factors',
        type: 'tip',
        priority: 40,
        condition: (s) => s.activeTab === 'table' && (s.factorALabel === 'Factor A' || s.factorBLabel === 'Factor B'),
        title: "Make it yours",
        body: "Tip: rename factors so your ANOVA table reads like your study. Use names like 'Room Temp' and 'Time'.",
        buttons: [{ label: "Rename Factors", action: "focus_factor_labels" }]
    },
    {
        id: 'multiway_anova_warning',
        type: 'tip',
        priority: 30,
        condition: (s) => s.factorCount > 2,
        title: "Multi-way ANOVA",
        body: "You are moving beyond 2-way ANOVA. Interpretation gets harder because there are multiple interactions. Consider starting with 2 factors first.",
        buttons: [{ label: "Stay with 2", action: "remove_factor_3" }, { label: "Keep 3", action: "dismiss_permanent" }]
    },

    // --- Assumptions & Reliability ---
    {
        id: 'variance_heterogeneity',
        type: 'misconception',
        priority: 65,
        condition: (s) => s.sdRatio >= 2.5 && s.activeTab === 'table',
        title: "Unequal spread across cells",
        body: "One cell has much more variance than another (Ratio > 2.5). This can violate the 'homogeneity of variance' assumption and make your F-test less reliable.",
        buttons: [{ label: "Why it matters", action: "explain_homogeneity" }]
    },
    {
        id: 'low_power_caution',
        type: 'tip',
        priority: 55,
        condition: (s) => !s.hasEmptyCells && s.anyCellN < 5 && s.activeTab === 'table',
        title: "Low power with small n",
        body: "Your sample size per cell is quite small (N<5). This reduces 'statistical power,' making it harder to detect true effects even if they exist.",
        buttons: [{ label: "Tell me more", action: "explain_power" }]
    },

    // --- Data Grid ---
    {
        id: 'small_n_warning',
        type: 'error',
        priority: 90,
        condition: (s) => s.anyCellN < 2 && !s.allCellsEmpty,
        title: "Insufficient Data",
        body: "You need at least 2 values in a cell to estimate variability. Add more observations to run the ANOVA.",
        buttons: [{ label: "Add Data", action: "focus_empty_cell" }]
    },
    {
        id: 'unequal_n_caution',
        type: 'misconception',
        priority: 60,
        condition: (s) => s.nRange >= 2 && !s.allCellsEmpty,
        title: "Unequal Sample Sizes",
        body: "Unequal sample sizes across cells can change sums of squares and make interpretation trickier. Balanced designs are easiest to learn and explain.",
        buttons: [
            { label: "Balance N", action: "balance_n" },
            { label: "Why it matters", action: "explain_balanced" }
        ]
    },
    {
        id: 'outlier_detected',
        type: 'misconception',
        priority: 70,
        condition: (s) => s.outlierDetected,
        title: "Outlier Detected",
        body: "Possible outlier detected in one of your cells. Outliers can heavily affect ANOVA means and F values. Double-check for data entry errors.",
        buttons: [{ label: "Find Outlier", action: "highlight_outlier" }]
    },

    // --- Plot & Results ---
    {
        id: 'interaction_main_effects_caution',
        type: 'tip',
        priority: 120,
        condition: (s) => s.pAxB < s.alpha && (s.lastAction === 'expand_card_A' || s.lastAction === 'expand_card_B' || s.lastAction === 'toggle_marginal_means'),
        title: "Main effects can mislead here",
        body: "Since the interaction is significant, the main effects are incomplete stories. The effect of one factor depends on the other—interpret carefully!",
        buttons: [{ label: "Explore Interaction", action: "go_to_explorer" }]
    },
    {
        id: 'borderline_p_value',
        type: 'tip',
        priority: 45,
        condition: (s) => (s.pA >= 0.04 && s.pA <= 0.06) || (s.pB >= 0.04 && s.pB <= 0.06) || (s.pAxB >= 0.04 && s.pAxB <= 0.06),
        title: "Near the cutoff",
        body: "One of your results is very close to the alpha threshold (p ≈ .05). Avoid treating .049 and .051 as fundamentally different; both suggest a borderline effect.",
        buttons: [{ label: "Got it", action: "dismiss_session" }]
    },
    {
        id: 'effect_size_vs_sig',
        type: 'tip',
        priority: 45,
        condition: (s) => (s.pAxB >= s.alpha && s.pesAxB >= 0.06) || (s.pAxB < s.alpha && s.pesAxB < 0.01),
        title: "Effect size ≠ significance",
        body: "Note the mismatch between p-value and effect size. A large effect size can be non-significant if N is small, and a tiny effect can be significant if N is huge.",
        buttons: [{ label: "Tell me more", action: "explain_effect_size" }]
    },
    {
        id: 'simple_effects_next_step',
        type: 'tip',
        priority: 140,
        condition: (s) => s.activeTab === 'table' && !s.hasViewedExplorer && s.pAxB < s.alpha,
        title: "Next: run simple effects",
        body: "Significant interaction! Your next step should be running 'Simple Effects' in the Explorer to see exactly where the differences lie.",
        buttons: [{ label: "Open Explorer", action: "go_to_explorer" }]
    },

    // --- Plot Hints ---
    {
        id: 'crossing_lines_hint',
        type: 'tip',
        priority: 100,
        condition: (s) => s.activeTab === 'plot' && s.interactionType === 'crossing' && s.pAxB < s.alpha,
        title: "Crossed Interaction",
        body: "Lines cross! This visual interaction confirms your significant p-value: the effect of one factor reverses across levels of the other.",
        buttons: [{ label: "See Simple Effects", action: "go_to_explorer" }]
    },
    {
        id: 'nonparallel_lines_hint',
        type: 'tip',
        priority: 95,
        condition: (s) => s.activeTab === 'plot' && s.interactionType === 'non-parallel' && s.pAxB < s.alpha,
        title: "Non-Parallel Lines",
        body: "The lines are converging or diverging. This visual pattern supports your significant interaction effect.",
        buttons: [{ label: "Open Explorer", action: "go_to_explorer" }]
    },
    {
        id: 'parallel_lines_hint',
        type: 'tip',
        priority: 50,
        condition: (s) => s.activeTab === 'plot' && s.interactionType === 'parallel' && s.pAxB >= s.alpha && !s.hasEmptyCells,
        title: "Consistent Main Effects",
        body: "Lines are roughly parallel and the interaction is not significant. You can interpret the main effects of each factor independently.",
        buttons: [{ label: "Back to Table", action: "focus_table" }]
    },

    // --- Explorer & Post-Hoc ---
    {
        id: 'multiple_comparisons_warning',
        type: 'error',
        priority: 60,
        condition: (s) => s.lastAction === 'run_multiple_simple_effects' && !s.alphaCorrectionEnabled,
        title: "Multiple Comparisons",
        body: "Running many follow-up tests increases the risk of 'False Positives.' Consider using a Bonferroni correction to stay rigorous.",
        buttons: [{ label: "How to correct", action: "explain_bonferroni" }]
    },
    {
        id: 'simple_effects_pooled_note',
        type: 'tip',
        priority: 40,
        condition: (s) => s.activeTab === 'explorer' && s.highlightPooledMS,
        title: "Pooled MS(error)",
        body: "Simple effects reuse the main ANOVA error term (Pooled MS error). This improves stability and degrees of freedom for the follow-up tests.",
        buttons: [{ label: "Got it", action: "dismiss_permanent" }]
    },

    // --- Alpha & F-Dist ---
    {
        id: 'alpha_shift_hint',
        type: 'tip',
        priority: 30,
        condition: (s) => s.lastAction === 'change_alpha',
        title: "Moving Threshold",
        body: "Changing alpha moves the critical value. Smaller alpha makes it harder to declare significance.",
        buttons: [{ label: "Ok", action: "dismiss_session" }]
    },

    // --- Destructive Actions ---
    {
        id: 'clear_all_confirm',
        type: 'tip',
        priority: 90,
        condition: (s) => s.lastAction === 'clear_all_attempt' && !s.allCellsEmpty,
        title: "Clear everything?",
        body: "Are you sure you want to delete all your data? This action cannot be undone.",
        buttons: [
            { label: "Yes, Clear All", action: "clear_all_final" },
            { label: "No, Cancel", action: "dismiss_session" }
        ]
    }
];
