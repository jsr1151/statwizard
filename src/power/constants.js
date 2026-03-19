export const POWER_MODE_ORDER = [
    'a_priori',
    'post_hoc',
    'sensitivity',
    'compromise',
    'criterion',
];

export const POWER_MODE_META = {
    a_priori: {
        label: 'A Priori',
        shortLabel: 'A Priori',
        description: 'Solve for the required sample size from alpha, target power, and effect size.',
    },
    post_hoc: {
        label: 'Post Hoc',
        shortLabel: 'Post Hoc',
        description: 'Estimate achieved power from sample size, alpha, and effect size.',
    },
    sensitivity: {
        label: 'Sensitivity',
        shortLabel: 'Sensitivity',
        description: 'Solve for the smallest detectable effect at a fixed sample size and target power.',
    },
    compromise: {
        label: 'Compromise',
        shortLabel: 'Compromise',
        description: 'Balance alpha and beta jointly under a chosen error ratio.',
    },
    criterion: {
        label: 'Criterion',
        shortLabel: 'Criterion',
        description: 'Solve for the decision threshold under fixed error constraints.',
    },
};

export const POWER_FAMILY_META = {
    z_tests: {
        label: 'Z Tests',
        description: 'Known-sigma mean tests and related normal-model power analyses.',
    },
    t_tests: {
        label: 'T-Tests',
        description: 'Mean-comparison tests where variability is estimated from the sample.',
    },
    anova: {
        label: 'ANOVA / ANCOVA',
        description: 'Omnibus F-test models for multiple groups and covariate-adjusted designs.',
    },
    correlation: {
        label: 'Correlation',
        description: 'Association-focused power analyses for correlation designs and related relationship tests.',
    },
    regression: {
        label: 'Regression',
        description: 'Prediction-focused power analyses for regression models and related F-test planning workflows.',
    },
};
