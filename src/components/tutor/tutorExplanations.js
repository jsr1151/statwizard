export const ANOVA_EXPLANATIONS = {
    show_f_starts_0: {
        title: 'Why does F start at 0?',
        body: 'F is a ratio of two variances (MS_between / MS_within). Since variances are sums of squares (always positive), the ratio can never be negative. F starts at 0 and goes to positive infinity.',
    },
    show_welch_info: {
        title: 'Welch’s ANOVA',
        body: "Standard ANOVA assumes equal variances (homogeneity). If your group variances differ significantly, Welch’s ANOVA is a robust alternative that doesn't require this assumption.",
    },
    show_power_tip: {
        title: 'Low Statistical Power',
        body: "A non-significant result doesn't mean there's no effect—it might just mean the study was too small to find it. Power increases with larger sample sizes and less within-group noise.",
    },
    show_nonsig_explanation: {
        title: "What is 'Non-Significant'?",
        body: "It means the observed differences are small enough that they could easily happen by random chance. We fail to reject the null hypothesis because the evidence isn't strong enough.",
    },
    show_assumptions_checklist: {
        title: 'ANOVA Assumptions Checklist',
        body: 'For your results to be valid, check these: 1. Independent observations, 2. Normality (scores are bell-curved in each group), 3. Homogeneity (variances are similar).',
    },
    show_effect_size_info: {
        title: 'Strength of Effect (η²)',
        body: "While p-values tell you if an effect is likely real, η² tells you how big it is. It's the percentage of total variance explained by your groups.",
    },
    show_index_example: {
        title: 'Example: indices i and j',
        body: 'If Group 1 has scores [5, 6, 7], then j=1 for all of them. The first score (5) is x₁,₁. The second (6) is x₂,₁. The third (7) is x₃,₁.',
    },
    show_nj_example: {
        title: 'Numeric Example: Scaling',
        body: 'If group size nⱼ = 10 and the squared mean difference is 4, that group contributes 10 × 4 = 40 to SS_between.',
    },
    show_f1_example: {
        title: 'F ≈ 1 Example',
        body: 'If between-group variance is 20 and within-group variance is 20, F = 20/20 = 1.0. This happens when the treatment has no more effect than random chance.',
    },
    show_df_explanation: {
        title: 'Understanding df_within',
        body: "df_within = N - k. Every group uses one degree of freedom to calculate its mean. If you have 30 people and 3 groups, you have 30 - 3 = 27 degrees of freedom left for noise.",
    },
    show_f_factors: {
        title: 'What raises F?',
        body: 'Increasing group separation (bigger numerator) or decreasing individual spread (smaller denominator) both raise the F-ratio.',
    },
    highlight_f_drivers: {
        title: 'What is driving your F-ratio?',
        body: "Is it a large difference between groups, or very small differences within them? I'll highlight the components in the table for you.",
    },
    show_eta_apa: {
        title: 'Reporting η² in APA Style',
        body: 'Include η² after the F-test results. Example: F(2, 27) = 4.54, p = .020, η² = .25.',
    },
    show_unbalanced_info: {
        title: 'Unequal Group Sizes',
        body: "When group sizes differ, ANOVA is less robust if variances differ too. Levene's or Brown–Forsythe can detect evidence of unequal variances, but a non-significant result does not prove equality.",
    },
    show_square_demo: {
        title: 'Why we square',
        body: 'If we just added differences from the mean, they would sum to zero because positives and negatives cancel out. Squaring ensures every distance counts toward total variability.',
    },
};

export const FACTORIAL_ANOVA_EXPLANATIONS = {
    explain_balanced: {
        title: 'Why Balance Matters',
        body: "When every cell has the same number of people, the factors are perfectly independent (orthogonal). If sample sizes are unequal, the factors overlap and sums of squares are harder to calculate and interpret.",
    },
    explain_simple_effects: {
        title: 'What are Simple Effects?',
        body: "Simple effects examine one factor within a single level of the other factor. For example: Does Factor A matter only when Factor B is at Level 1?",
    },
    explain_interaction: {
        title: 'Visualizing Interaction',
        body: 'If lines are parallel, the effect of Factor A is the same regardless of Factor B. If they cross or diverge, the effect changes—which we call an interaction.',
    },
};
