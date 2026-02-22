import { Activity, Layers } from 'lucide-react';
import { SOFTWARE_GUIDES } from './softwareGuides';

// --- DATA STRUCTURE ---
export const STEPS = {
    // Navigation Steps
    start: {
        id: 'start',
        title: "Select Analysis Goal",
        question: "What is the primary goal of your analysis?",
        description: "Choose the option that best describes what you want to find out.",
        helpId: 'help_start',
        options: [
            { label: "Summarize Data Only (Descriptive)", value: 'descriptive', next: 'descriptive_type' },
            { label: "Compare Groups / Test Differences", value: 'differences', next: 'num_groups' },
            { label: "Examine Relationships / Associations", value: 'relationships', next: 'relationship_type' }
        ]
    },
    help_start: {
        id: 'help_start',
        type: 'help',
        title: "Clarifying Your Goal",
        question: "Which specific question matches your research?",
        options: [
            { label: "I want to see if Group A scored higher than Group B.", feedback: "You are looking for differences between groups.", targetValue: 'differences' },
            { label: "I want to see if studying more hours is related to higher grades.", feedback: "You are looking for a relationship (association).", targetValue: 'relationships' },
            { label: "I just want to report the average age and gender breakdown.", feedback: "This is purely descriptive.", targetValue: 'descriptive' }
        ]
    },

    descriptive_type: {
        id: 'descriptive_type',
        title: "Descriptive Focus",
        question: "What aspect of the data do you want to describe?",
        description: "Descriptive statistics describe different features of a dataset.",
        options: [
            { label: "Center of the data (Central Tendency)", value: 'center', next: 'res_central_tendency' },
            { label: "Spread/Diversity of the data (Variability)", value: 'spread', next: 'res_variability' },
            { label: "Counts/Distribution (Frequency)", value: 'frequency', next: 'res_frequency' },
            { label: "Likelihood & Chance (Probability)", value: 'probability', next: 'res_probability' }
        ]
    },

    num_groups: {
        id: 'num_groups',
        title: "Study Design",
        question: "How many distinct groups or conditions are you comparing?",
        helpId: 'help_groups',
        options: [
            { label: "1 Group (e.g., Sample vs. Population)", value: '1_group', next: 'population_sd' },
            { label: "2 Groups (e.g., Treatment vs Control)", value: '2_groups', next: 'dependency' },
            { label: "3 or more Groups (e.g., Low, Med, High)", value: '3_groups', next: 'anova_branch' }
        ]
    },
    population_sd: {
        id: 'population_sd',
        title: "Known Parameters",
        question: "Do you know the population Standard Deviation (σ)?",
        description: "In some rare cases, we know the exact spread of the entire population.",
        options: [
            { label: "Yes, σ is known", value: 'sigma_known', next: 'res_ztest' },
            { label: "No, σ is unknown", value: 'sigma_unknown', next: 'res_onesample_ttest' }
        ]
    },
    help_groups: {
        id: 'help_groups',
        type: 'help',
        title: "Counting Groups",
        question: "Select your scenario:",
        options: [
            { label: "I am comparing Men vs. Women.", feedback: "That is 2 Groups.", targetValue: '2_groups' },
            { label: "I am comparing Pre-test vs. Post-test scores.", feedback: "That is 2 Conditions (Timepoints).", targetValue: '2_groups' },
            { label: "I am comparing a Placebo, a Low Dose, and a High Dose.", feedback: "That is 3 Groups.", targetValue: '3_groups' }
        ]
    },
    dependency: {
        id: 'dependency',
        title: "Independence vs. Paired",
        question: "Are the participants in your groups related or independent?",
        description: "This determines if you need a 'Paired' or 'Independent' test.",
        helpId: 'help_dependency',
        options: [
            { label: "Independent (Different people in each group)", value: 'independent', next: 'normality_indep' },
            { label: "Related/Paired (Same people or matched pairs)", value: 'paired', next: 'normality_paired' }
        ]
    },
    help_dependency: {
        id: 'help_dependency',
        type: 'help',
        title: "Paired vs. Independent",
        question: "How were your participants measured?",
        options: [
            { label: "I measured the SAME people twice (e.g., Before and After).", feedback: "This is a Paired/Related design (Within-Subjects).", targetValue: 'paired' },
            { label: "I have two completely separate groups of people.", feedback: "This is an Independent design (Between-Subjects).", targetValue: 'independent' },
            { label: "I recruited couples (Husband vs. Wife).", feedback: "Matched pairs count as Related.", targetValue: 'paired' }
        ]
    },
    relationship_type: {
        id: 'relationship_type',
        title: "Relationship Type",
        question: "Are you looking for an association or a prediction?",
        helpId: 'help_relationship',
        options: [
            { label: "Association (Correlation)", value: 'correlation', next: 'correlation_result' },
            { label: "Prediction (Regression)", value: 'regression', next: 'regression_result' }
        ]
    },
    help_relationship: {
        id: 'help_relationship',
        type: 'help',
        title: "Correlation vs. Regression",
        question: "What is your main output?",
        options: [
            { label: "I want to know if two variables move together.", feedback: "Use Correlation.", targetValue: 'correlation' },
            { label: "I want to predict a specific score based on other variables.", feedback: "Use Regression.", targetValue: 'regression' }
        ]
    },
    normality_indep: {
        id: 'normality_indep',
        title: "Assumptions",
        question: "Is your outcome variable normally distributed?",
        helpId: 'help_normality',
        options: [
            { label: "Yes, Normal (Parametric)", value: 'normal', next: 'res_indep_ttest' },
            { label: "No, Skewed / Ordinal (Non-parametric)", value: 'skewed', next: 'res_mann_whitney' }
        ]
    },
    normality_paired: {
        id: 'normality_paired',
        title: "Assumptions",
        question: "Are the *difference scores* normally distributed?",
        helpId: 'help_normality',
        options: [
            { label: "Yes, Normal", value: 'normal', next: 'res_paired_ttest' },
            { label: "No, Skewed", value: 'skewed', next: 'res_wilcoxon' }
        ]
    },
    help_normality: {
        id: 'help_normality',
        type: 'help',
        title: "Checking Normality",
        question: "How does your data look?",
        options: [
            { label: "It looks like a bell curve (symmetrical).", feedback: "Assume Normality.", targetValue: 'normal' },
            { label: "I have a small sample size (<30) and it looks lopsided.", feedback: "Assume Non-Normal (Skewed).", targetValue: 'skewed' },
            { label: "My data is ranked (1st, 2nd, 3rd) or a scale (1-5 stars).", feedback: "Ordinal data is treated as Non-Parametric.", targetValue: 'skewed' }
        ]
    },
    anova_branch: {
        id: 'anova_branch',
        title: "ANOVA Design",
        question: "How is your study structured?",
        options: [
            { label: "One-Way (1 Factor, 3+ Groups)", value: 'indep', next: 'res_one_way_anova' },
            { label: "Factorial (2+ Factors, e.g., 2x2)", value: 'factorial', next: 'res_factorial_anova' },
            { label: "Repeated Measures (Same people)", value: 'repeated', next: 'res_rm_anova' }
        ]
    },

    // --- RESULTS ---

    res_central_tendency: {
        id: 'res_central_tendency',
        type: 'result',
        title: "Measures of Central Tendency",
        content: "Central tendency refers to the statistical measure that identifies a single value as representative of an entire distribution.",
        details: ["Mean: Use for normal data.", "Median: Use for skewed data.", "Mode: Use for categorical data."],
        formulaId: 'mean',
        visualType: 'skew',
        software: SOFTWARE_GUIDES.central_tendency,
        assumptions: []
    },

    res_variability: {
        id: 'res_variability',
        type: 'result',
        title: "Measures of Variability",
        content: "Variability describes how spread out or diverse your data values are.",
        details: ["Range: Max - Min.", "SD: Spread around mean.", "IQR: Spread of middle 50%."],
        formulaId: 'sd',
        visualType: 'variability',
        software: SOFTWARE_GUIDES.sd,
        assumptions: []
    },

    res_frequency: {
        id: 'res_frequency',
        type: 'result',
        title: "Measures of Frequency",
        content: "Frequency measures count how often distinct values occur in your dataset. It provides a breakdown of the distribution.",
        details: [
            "Absolute Frequency (f): The raw count.",
            "Relative Frequency (rf): The proportion/percentage.",
            "Cumulative Frequency (cf): The running total."
        ],
        formulaId: 'percentage',
        visualType: 'frequency',
        software: SOFTWARE_GUIDES.frequency,
        assumptions: []
    },

    res_indep_ttest: {
        id: 'res_indep_ttest',
        type: 'result',
        title: "Independent Samples t-test",
        content: "Compares means of two independent groups.",
        details: ["Signal vs Noise."],
        formulaId: 't_indep',
        visualType: 'indep_ttest',
        software: SOFTWARE_GUIDES.indep_ttest,
        assumptions: [
            {
                id: 'normality',
                label: "Normality",
                whatItMeans: "The scores in each group should follow a bell-shaped Normal distribution. This ensures the p-values and confidence intervals are accurate.",
                howToTest: [
                    { name: "Visual Check", desc: "Examine a Histogram or Q-Q plot for symmetry and a bell shape.", examples: true },
                    { name: "Shapiro-Wilk Test", desc: "A formal test where p > .05 suggests normality is likely." }
                ],
                ifItFails: "If your sample size is large (N > 30), t-tests are 'robust' to non-normality. For small samples, use a non-parametric alternative.",
                nonParametric: "Mann-Whitney U Test",
                visual: "normality"
            },
            {
                label: "Homogeneity of Variance",
                whatItMeans: "The amount of 'spread' or variability should be roughly equal in both groups.",
                howToTest: [
                    { name: "Levene's Test", desc: "Look for p > .05 in your software output. This confirms equal variances." }
                ],
                ifItFails: "Standard t-tests are sensitive to unequal variances. Most software provides 'Welch's t-test' (Equal Variances Not Assumed). Use that row instead.",
                nonParametric: "Welch's T-Test (Non-pooled)"
            },
            {
                label: "Independence of Observations",
                whatItMeans: "Each data point must come from a different person. One person's score shouldn't influence another's.",
                howToTest: [
                    { name: "Design Review", desc: "Check if you have any 'hidden' relationships (e.g., siblings, repeated measures)." }
                ],
                ifItFails: "There is no statistical fix for independence violations. You must use a Paired-Samples T-test or a Multi-level Model if data is nested."
            }
        ]
    },
    res_paired_ttest: {
        id: 'res_paired_ttest',
        type: 'result',
        title: "Paired Samples t-test",
        content: "Compares means from the same group at different times (e.g. Pre vs Post).",
        details: ["Tests difference scores ($d_i$).", "High correlation increases power."],
        formulaId: 't_paired',
        visualType: 'paired_ttest',
        software: SOFTWARE_GUIDES.paired_ttest,
        assumptions: [
            {
                label: "Continuous Dependent Variable",
                whatItMeans: "The outcome (dependent variable) must be measured on a continuous scale—interval or ratio level.",
                howToTest: [{ name: "Variable Check", desc: "Confirm your DV is interval/ratio (e.g. score, time, weight). Ordinal or categorical data violates this." }],
                ifItFails: "Consider a non-parametric alternative (e.g. Wilcoxon Signed-Rank) or rethink measurement."
            },
            {
                id: 'normality',
                label: "Normality of Difference Scores",
                whatItMeans: "The *change* (Difference = X1 - X2) for each pair should follow a normal distribution.",
                howToTest: [
                    { name: "Q-Q Plot", desc: "Subtract Condition 2 from Condition 1 and check if the residuals follow the diagonal line.", examples: true }
                ],
                ifItFails: "For n < 30, non-normality can bias results. Use Wilcoxon for small skewed samples.",
                nonParametric: "Wilcoxon Signed-Rank Test",
                visual: "normality"
            },
            {
                label: "No Significant Outliers in Differences",
                whatItMeans: "The difference scores should not contain extreme outliers that heavily influence the mean.",
                howToTest: [{ name: "Boxplot", desc: "Plot the difference scores. Look for points beyond 1.5× IQR from the quartiles." }],
                ifItFails: "Investigate outliers. If they are data errors, correct them. Otherwise consider Wilcoxon or bootstrapping."
            },
            {
                label: "Independence of Pairs",
                whatItMeans: "Each pair (person) must be independent of every other pair. The change in one person shouldn't affect another.",
                howToTest: [{ name: "Design Check", desc: "Ensure participants weren't working in linked pairs or influencing each other's results." }]
            }
        ]
    },
    res_mann_whitney: {
        id: 'res_mann_whitney',
        type: 'result',
        title: "Mann-Whitney U Test",
        content: "Non-parametric alternative to independent t-test.",
        details: ["Uses Ranks."],
        formulaId: 'mann_whitney',
        software: SOFTWARE_GUIDES.non_parametric,
        assumptions: [{ label: "Independence", failAdvice: "Wilcoxon if paired" }]
    },
    res_wilcoxon: {
        id: 'res_wilcoxon',
        type: 'result',
        title: "Wilcoxon Signed-Rank Test",
        content: "Non-parametric paired test.",
        details: ["Ranks differences."],
        formulaId: 'none',
        software: SOFTWARE_GUIDES.non_parametric,
        assumptions: [{ label: "Symmetric Dist", failAdvice: "Sign Test", visual: "normality" }]
    },
    res_one_way_anova: {
        id: 'res_one_way_anova',
        type: 'result',
        title: "One-Way ANOVA",
        content: "Compares means of 3+ independent groups.",
        details: ["Between vs Within Variance."],
        formulaId: 'anova',
        visualType: 'anova',
        software: SOFTWARE_GUIDES.anova,
        assumptions: [
            {
                id: 'independence',
                label: "Independence of Observations",
                whatItMeans: "Each person’s score must not be influenced by another person’s score. There should be no pairing, clustering, or repeated measures.",
                howToTest: [
                    { name: "Design Review", desc: "Check if participants were tested in groups (e.g., roommates, classroom clusters) or if the same person was measured twice." }
                ],
                ifItFails: "Independence is the most critical assumption. Violations can seriously break the p-value. If your data is nested or repeated, you need a different test (e.g., RM-ANOVA or Mixed Models).",
                link: "Note: You typically can't diagnose this from a plot; it is a study design issue."
            },
            {
                id: 'normality',
                label: "Normality of Residuals",
                whatItMeans: "The residuals (observed - predicted) should be roughly normal. ANOVA is often robust here if group sizes are moderate and not extremely skewed.",
                howToTest: [
                    { name: "Q-Q Plot", desc: "Points should follow the diagonal line. Curves suggest skew; peeling ends suggest outliers or non-normal errors.", examples: true }
                ],
                ifItFails: "For small samples, extreme skew can hide real differences. Consider a non-parametric alternative like Kruskal-Wallis.",
                nonParametric: "Kruskal-Wallis H Test",
                visual: "normality"
            },
            {
                id: 'homogeneity',
                label: "Homogeneity of Variance",
                whatItMeans: "The within-group spread (variance) should be similar across all groups.",
                howToTest: [
                    { name: "Levene's Test", desc: "Look for p > .05 to confirm groups have similar variance." }
                ],
                ifItFails: "If violated, standard ANOVA is unreliable. Use Welch's ANOVA or variance-stabilizing transforms.",
                nonParametric: "Welch’s ANOVA"
            },
            {
                id: 'outliers',
                label: "No Extreme Outliers",
                whatItMeans: "There should be no extreme scores within groups that distort the means and inflate variability.",
                howToTest: [
                    { name: "Boxplots", desc: "Check for individual points plotted far outside the whiskers." }
                ],
                ifItFails: "Investigate the outlier. If it's a data error, correct it. Otherwise, consider a robust check or transformation."
            },
            {
                id: 'quantitative',
                label: "Quantitative Outcome",
                whatItMeans: "The outcome must be measured on an interval or ratio scale (not purely ordinal categories).",
                howToTest: [
                    { name: "Measurement Scale", desc: "Ensure you are averaging meaningful numbers where the distance between them is consistent." }
                ],
                ifItFails: "If data is purely ordinal (ranks), use Kruskal-Wallis."
            }
        ]
    },
    res_factorial_anova: {
        id: 'res_factorial_anova',
        type: 'result',
        title: "Factorial ANOVA",
        content: "Examines the effects of two or more independent categorical variables on a continuous outcome.",
        details: ["Main Effect A", "Main Effect B", "Interaction (AxB)"],
        formulaId: 'factorial_anova',
        visualType: 'factorial_anova',
        software: SOFTWARE_GUIDES.factorial_anova,
        assumptions: [
            { id: 'independence', label: "Independence", whatItMeans: "Observations are independent." },
            { id: 'normality', label: "Normality", whatItMeans: "Residuals follow a normal distribution." },
            { id: 'homogeneity', label: "Homogeneity", whatItMeans: "Variances are equal across cells." }
        ]
    },
    res_rm_anova: {
        id: 'res_rm_anova',
        type: 'result',
        title: "Repeated Measures ANOVA",
        content: "Compares means of 3+ related conditions.",
        details: ["Accounts for subject error."],
        formulaId: 'anova',
        visualType: 'anova',
        software: SOFTWARE_GUIDES.rm_anova,
        assumptions: [
            {
                label: "Sphericity",
                whatItMeans: "The variances of the differences between all possible pairs of related groups must be equal. Essentially, the 'correlation' between conditions should be consistent.",
                howToTest: [
                    { name: "Mauchly's Test", desc: "Look for p > .05. If p < .05, the assumption of Sphericity is violated." }
                ],
                ifItFails: "Don't panic—Sphericity is often violated. Most software automatically provides 'Corrected' p-values (Greenhouse-Geisser or Huynh-Feldt). Report those instead.",
                nonParametric: "Greenhouse-Geisser Correction"
            },
            {
                id: 'normality',
                label: "Normality of Residuals",
                whatItMeans: "The 'errors' at each time point should follow a normal distribution.",
                howToTest: [
                    { name: "Residual Analysis", desc: "Plot the residuals; they should follow the diagonal line in a Q-Q plot.", examples: true }
                ],
                ifItFails: "If data is extremely non-normal, the F-statistic may be biased.",
                nonParametric: "Friedman Test",
                visual: "normality"
            }
        ]
    },
    correlation_result: {
        id: 'correlation_result',
        type: 'result',
        title: "Pearson Correlation (r)",
        content: "Measures linear relationship.",
        details: ["-1 to +1."],
        formulaId: 'correlation',
        software: SOFTWARE_GUIDES.correlation,
        assumptions: [{ label: "Linearity", failAdvice: "Check plot" }, { label: "Normality", failAdvice: "Spearman", visual: "normality" }]
    },
    regression_result: {
        id: 'regression_result',
        type: 'result',
        title: "Linear Regression",
        content: "Predicts Y based on X.",
        details: ["Line of best fit."],
        formulaId: 'regression',
        software: SOFTWARE_GUIDES.regression,
        assumptions: [{ label: "Homoscedasticity", failAdvice: "Transform" }, { label: "Normality of Res", failAdvice: "Bootstrapping", visual: "normality" }]
    },
    res_ztest: {
        id: 'res_ztest',
        type: 'result',
        title: "Z-Test",
        content: "Compares a sample mean to a hypothesized population mean when the population SD (σ) is known.",
        details: ["Requires σ (Sigma) to be known.", "Assumes Normality or large n."],
        formulaId: 'z_test',
        visualType: 'ttest',
        software: SOFTWARE_GUIDES.z_test,
        assumptions: [
            {
                id: 'normality',
                label: "Normality",
                whatItMeans: "The population from which the sample is drawn must be normally distributed, or the sample size must be large enough.",
                howToTest: [
                    { name: "Central Limit Theorem", desc: "If n > 30, the sampling distribution of the mean is approximately normal even if the raw data is skewed." }
                ],
                ifItFails: "If n < 30 and data is non-normal, you cannot safely use the Z-distribution; p-values will be incorrect.",
                nonParametric: "One-Sample t-test (if σ is actually estimated) or Wilcoxon",
                visual: "normality"
            },
            {
                label: "σ Is Known",
                whatItMeans: "You must have the true Population Standard Deviation. This is rare and usually only found in standardized testing or industry standards.",
                howToTest: [
                    { name: "Data Source Check", desc: "Is your SD from a previous census or a huge national database? If you calculated it from YOUR small sample, it's NOT σ." }
                ],
                ifItFails: "This is the most common error. If you don't have the population σ, you MUST use a One-Sample t-test.",
                nonParametric: "One-Sample t-Test"
            }
        ]
    },
    res_onesample_ttest: {
        id: 'res_onesample_ttest',
        type: 'result',
        title: "One-Sample t-Test",
        content: "Compares a sample mean to a known population mean when the population SD is estimated.",
        details: ["Standard for comparing mean to a value.", "Estimate SD from sample (s)."],
        formulaId: 't_onesample',
        visualType: 'ttest',
        software: SOFTWARE_GUIDES.oneway_ttest,
        assumptions: [
            {
                label: "Continuous Data (Scale)",
                whatItMeans: "The dependent variable must be measured at the interval or ratio level (e.g., height, test scores, weight).",
                howToTest: [
                    { name: "Codebook Review", desc: "Check if your variable is a raw number (continuous) rather than categories (nominal) or ranks (ordinal)." }
                ],
                ifItFails: "If your data is ordinal (ranks), use a non-parametric test. If it's nominal (categories), use a Chi-Square test.",
                nonParametric: "One-Sample Wilcoxon (for ordinal)"
            },
            {
                label: "Independence of Observations",
                whatItMeans: "Each observation must be independent of every other observation. One person's score shouldn't affect another's.",
                howToTest: [
                    { name: "Design Audit", desc: "Ensure participants were tested individually and aren't related or influencing each other." }
                ],
                ifItFails: "Violating independence is critical. You may need to use a Multi-level Model or a different study design."
            },
            {
                id: 'normality',
                label: "Normality",
                whatItMeans: "The scores in your sample should roughly follow a bell-shaped distribution. This is important for the t-distribution math to work correctly.",
                howToTest: [
                    { name: "Histogram", desc: "Check for extreme outliers or gaps in the data." },
                    { name: "Density Plot", desc: "Look for a symmetric 'bump' in the middle of the distribution." }
                ],
                ifItFails: "For small samples (n < 30), non-normality can make your p-value unreliable.",
                nonParametric: "One-Sample Wilcoxon Signed-Rank Test",
                visual: "normality"
            },
            {
                label: "No Significant Outliers",
                whatItMeans: "There shouldn't be any extreme values that are vastly different from the rest of the sample. Outliers can heavily bias the mean.",
                howToTest: [
                    { name: "Boxplot", desc: "Look for points plotted outside the 'whiskers' of the boxplot." },
                    { name: "Z-Score Check", desc: "Scores with a Z > ±3.29 are often considered outliers in some contexts." }
                ],
                ifItFails: "You may need to remove the outlier (with justification), transform the data, or use a robust statistical method.",
                nonParametric: "Bootstrapping or Winsorizing"
            }
        ]
    },
    res_probability: {
        id: 'res_probability',
        type: 'result',
        title: "Probability & Likelihood",
        content: "Probability is the branch of mathematics that quantifies how likely it is that an event will occur.",
        details: [
            "P(A) = Number of favorable outcomes / Total outcomes.",
            "Range: 0 (Impossible) to 1 (Certain).",
            "Complement Rule: P(A) + P(Not A) = 1."
        ],
        formulaId: 'none',
        visualType: 'probability',
        software: { spss: "Probability calculations are usually manual or part of specific tests.", jasp: "Use 'Distributions' module for visual probability.", r: "pnorm(), pbinom(), etc." },
        assumptions: []
    }
};

// --- STAT PAGE LIST ---
export const STAT_PAGE_LIST = [
    { id: 'res_central_tendency', title: 'Central Tendency (Mean, Median, Mode)', category: 'Descriptive' },
    { id: 'res_variability', title: 'Variability (SD, Range, Skew)', category: 'Descriptive' },
    { id: 'res_frequency', title: 'Frequency Distributions', category: 'Descriptive' },
    { id: 'res_probability', title: 'Probability Basics & Demos', category: 'Descriptive' },
    { id: 'res_ztest', title: 'One-Sample Z-Test', category: 'Mean Comparisons' },
    { id: 'res_onesample_ttest', title: 'One-Sample T-Test', category: 'Mean Comparisons', family: 'T-Tests' },
    { id: 'res_indep_ttest', title: 'Independent Samples T-Test', category: 'Mean Comparisons', family: 'T-Tests' },
    { id: 'res_paired_ttest', title: 'Paired Samples T-Test', category: 'Mean Comparisons', family: 'T-Tests' },
    { id: 'res_one_way_anova', title: 'One-Way ANOVA', category: 'Mean Comparisons', family: 'ANOVA' },
    { id: 'res_factorial_anova', title: 'Factorial ANOVA (Two-Way)', category: 'Mean Comparisons', family: 'ANOVA' },
    { id: 'res_rm_anova', title: 'Repeated Measures ANOVA', category: 'Mean Comparisons', family: 'ANOVA' },
    { id: 'correlation_result', title: 'Pearson Correlation', category: 'Linear Modeling' },
    { id: 'regression_result', title: 'Linear Regression', category: 'Linear Modeling' },
    { id: 'res_mann_whitney', title: 'Mann-Whitney U Test (Non-parametric)', category: 'Non-parametric' },
    { id: 'res_wilcoxon', title: 'Wilcoxon Signed-Rank Test (Non-parametric)', category: 'Non-parametric' }
];

// --- FAMILIES ---
export const FAMILIES = {
    'T-Tests': { icon: Activity, desc: 'Compare means between groups or to a known value.' },
    'ANOVA': { icon: Layers, desc: 'Analyze variance across three or more groups.' }
};
