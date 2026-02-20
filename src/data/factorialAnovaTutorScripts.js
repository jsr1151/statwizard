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

    // --- Data Grid ---
    {
        id: 'small_n_warning',
        type: 'error',
        priority: 90,
        condition: (s) => s.anyCellN < 2,
        title: "Insufficient Data",
        body: "You need at least 2 values in a cell to estimate variability. Add more observations to run the ANOVA.",
        buttons: [{ label: "Add Data", action: "focus_empty_cell" }]
    },
    {
        id: 'unequal_n_caution',
        type: 'misconception',
        priority: 60,
        condition: (s) => s.nRange >= 2,
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
        id: 'interpret_interaction_first',
        type: 'tip',
        priority: 150,
        condition: (s) => s.activeTab === 'table' && !s.hasViewedExplorer && s.pInteraction < 0.05,
        title: "Interaction Found!",
        body: "Significant interaction! This means the effect of one factor depends on the other. Use the Explorer to interpret the pattern via Simple Effects.",
        buttons: [
            { label: "Open Explorer", action: "go_to_explorer" },
            { label: "What are Simple Effects?", action: "explain_simple_effects" }
        ]
    },
    {
        id: 'parallel_lines_hint',
        type: 'tip',
        priority: 50,
        condition: (s) => s.activeTab === 'plot' && s.interactionType === 'parallel',
        title: "Looking for interaction?",
        body: "Lines are roughly parallel. That usually means little to no interaction between these factors.",
        buttons: [{ label: "Tell me more", action: "explain_interaction" }]
    },
    {
        id: 'crossing_lines_hint',
        type: 'tip',
        priority: 100,
        condition: (s) => s.activeTab === 'plot' && s.interactionType === 'crossing',
        title: "Crossed Interaction",
        body: "Lines cross! That often indicates a strong interaction, meaning the effect of one factor changes direction across the other.",
        buttons: [{ label: "See Simple Effects", action: "go_to_explorer" }]
    },
    {
        id: 'simple_effects_pooled_note',
        type: 'tip',
        priority: 40,
        condition: (s) => s.activeTab === 'explorer' && s.highlightPooledMS,
        title: "Pooled MS(error)",
        body: "Simple effects reuse the main ANOVA error term (Pooled MS error). That is why the denominator is the same across tests - it improves stability.",
        buttons: [{ label: "Got it", action: "dismiss_permanent" }]
    },

    // --- F-Dist ---
    {
        id: 'alpha_shift_hint',
        type: 'tip',
        priority: 30,
        condition: (s) => s.lastAction === 'change_alpha',
        title: "Moving Threshold",
        body: "Changing alpha moves the critical value. Smaller alpha makes it harder to declare significance.",
        buttons: [{ label: "Ok", action: "dismiss_session" }]
    }
];
