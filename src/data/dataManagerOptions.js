export const DERIVED_OPERATION_OPTIONS = [
    { id: 'duplicate', label: 'Duplicate variable', needsNumeric: false, mode: 'single' },
    { id: 'sum', label: 'Sum selected variables', needsNumeric: true, mode: 'multi' },
    { id: 'mean', label: 'Average selected variables', needsNumeric: true, mode: 'multi' },
    { id: 'difference', label: 'Difference (A - B)', needsNumeric: true, mode: 'pair' },
    { id: 'add', label: 'Add (A + B)', needsNumeric: true, mode: 'pair' },
    { id: 'standardize', label: 'Standardize to z-score', needsNumeric: true, mode: 'single' },
];

export const ANALYSIS_OPTIONS = [
    {
        id: 'mann_whitney',
        label: 'Mann–Whitney U',
        summary: 'Compare a numeric or ordered-score outcome across two independent groups.',
        isCompatible: ({ numericCount, binaryCategoricalCount }) => numericCount >= 1 && binaryCategoricalCount >= 1,
        buildDetail: ({ numericCount, binaryCategoricalCount }) => `${numericCount} numeric and ${binaryCategoricalCount} binary grouping variables detected. Confirm independence and meaningful ordering.`,
    },
    {
        id: 'wilcoxon_signed_rank',
        label: 'Wilcoxon Signed-Rank',
        summary: 'Compare two matched numeric measurements, preserving row pairs.',
        isCompatible: ({ numericCount }) => numericCount >= 2,
        buildDetail: ({ numericCount }) => `${numericCount} numeric variables detected. Confirm one participant per row and meaningful paired differences.`,
    },
    {
        id: 'pearson_correlation',
        label: 'Pearson Correlation',
        summary: 'Load two numeric variables into the correlation calculator.',
        isCompatible: ({ numericCount }) => numericCount >= 2,
        buildDetail: ({ numericCount }) => `${numericCount} numeric variable${numericCount === 1 ? '' : 's'} detected.`,
    },
    {
        id: 'multiple_regression',
        label: 'Multiple Regression',
        summary: 'Load one numeric outcome plus at least two numeric predictors into the regression calculator.',
        isCompatible: ({ numericCount }) => numericCount >= 3,
        buildDetail: ({ numericCount }) => `${numericCount} numeric variable${numericCount === 1 ? '' : 's'} detected.`,
    },
    {
        id: 'one_sample_t_test',
        label: 'One-Sample t-Test',
        summary: 'Load one numeric variable into the one-sample t-test calculator.',
        isCompatible: ({ numericCount }) => numericCount >= 1,
        buildDetail: ({ numericCount }) => `${numericCount} numeric variable${numericCount === 1 ? '' : 's'} detected.`,
    },
    {
        id: 'independent_t_test',
        label: 'Independent Samples t-Test',
        summary: 'Load one numeric outcome plus one categorical grouping variable with exactly 2 levels.',
        isCompatible: ({ numericCount, binaryCategoricalCount }) => numericCount >= 1 && binaryCategoricalCount >= 1,
        buildDetail: ({ numericCount, binaryCategoricalCount }) => `${numericCount} numeric and ${binaryCategoricalCount} binary grouping variable${binaryCategoricalCount === 1 ? '' : 's'} detected.`,
    },
    {
        id: 'paired_t_test',
        label: 'Paired Samples t-Test',
        summary: 'Load two numeric variables into the paired-samples calculator.',
        isCompatible: ({ numericCount }) => numericCount >= 2,
        buildDetail: ({ numericCount }) => `${numericCount} numeric variable${numericCount === 1 ? '' : 's'} detected.`,
    },
    {
        id: 'one_way_anova',
        label: 'One-Way ANOVA',
        summary: 'Load one numeric outcome plus one categorical grouping variable with 2 or more levels.',
        isCompatible: ({ numericCount, categoricalCount }) => numericCount >= 1 && categoricalCount >= 1,
        buildDetail: ({ numericCount, categoricalCount }) => `${numericCount} numeric and ${categoricalCount} categorical variable${categoricalCount === 1 ? '' : 's'} detected.`,
    },
    {
        id: 'ancova',
        label: 'ANCOVA',
        summary: 'Load one numeric outcome, one categorical grouping variable, and one numeric covariate.',
        isCompatible: ({ numericCount, categoricalCount }) => numericCount >= 2 && categoricalCount >= 1,
        buildDetail: ({ numericCount, categoricalCount }) => `${numericCount} numeric and ${categoricalCount} categorical variable${categoricalCount === 1 ? '' : 's'} detected.`,
    },
    {
        id: 'factorial_anova',
        label: 'Factorial ANOVA',
        summary: 'Load one numeric outcome plus two categorical factors into the factorial ANOVA calculator.',
        isCompatible: ({ numericCount, categoricalCount }) => numericCount >= 1 && categoricalCount >= 2,
        buildDetail: ({ numericCount, categoricalCount }) => `${numericCount} numeric and ${categoricalCount} categorical variable${categoricalCount === 1 ? '' : 's'} detected.`,
    },
];

export const UNDO_HISTORY_LIMIT = 30;

export const SHOW_LEGACY_DERIVED_VARIABLES = false;
