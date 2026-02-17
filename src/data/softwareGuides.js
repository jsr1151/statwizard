// --- SOFTWARE GUIDES LOOKUP ---
export const SOFTWARE_GUIDES = {
    sd: {
        spss: "Analyze > Descriptive Statistics > Descriptives.\nMove variables to 'Variable(s)'.\nClick Options > Check 'Std. deviation' and 'Variance'.",
        jasp: "Descriptives > Descriptive Statistics.\nMove variables to 'Variables' box.\nUnder 'Statistics', check 'Std. deviation' and 'Variance'.",
        r: "# Calculate SD and Variance\nsd(data$variable)\nvar(data$variable)\n\n# Visual Check\nhist(data$variable)\nabline(v = mean(data$variable), col='red')",
        excel: "1. Use formula: =STDEV.S(A1:A100) for Sample SD.\n2. Use formula: =VAR.S(A1:A100) for Sample Variance.\n3. (Optional) Use Data Analysis Toolpak > Descriptive Statistics."
    },
    range: {
        spss: "Analyze > Descriptive Statistics > Frequencies.\nClick Statistics > Check Quartiles, Percentiles (enter values), Range, IQR.",
        jasp: "Descriptives > Descriptive Statistics.\nCheck 'Quartiles'.\nUnder 'Plots', check 'Boxplots'.",
        r: "# Range and Quantiles\nrange(data$variable)\nIQR(data$variable)\nquantile(data$variable, probs = c(0.25, 0.5, 0.75))\n\n# Boxplot\nboxplot(data$variable)",
        excel: "1. Range: =MAX(range) - MIN(range).\n2. Quartiles: =QUARTILE.EXC(range, 1) or 3.\n3. IQR: Calculate Q3 - Q1 manually."
    },
    shape: {
        spss: "Analyze > Descriptive Statistics > Frequencies.\nClick Statistics > Check Skewness and Kurtosis.\nClick Charts > Histograms > Show normal curve.",
        jasp: "Descriptives > Descriptive Statistics.\nCheck Skewness and Kurtosis.",
        r: "# Shape Statistics\nlibrary(moments)\nskewness(data$variable)\nkurtosis(data$variable)\n\n# Visual\nplot(density(data$variable))",
        excel: "1. Skewness: =SKEW(range).\n2. Kurtosis: =KURT(range).\n(Note: Excel reports 'Excess Kurtosis')."
    },
    frequency: {
        spss: "Analyze > Descriptive Statistics > Frequencies.\nMove variable(s) to the right box.\nEnsure 'Display frequency tables' is checked.",
        jasp: "Descriptives > Descriptive Statistics.\nCheck 'Frequency tables' (for categorical/discrete data).",
        r: "# Absolute counts\ntable(data$variable)\n\n# Proportions (Relative)\nprop.table(table(data$variable))\n\n# Cumulative\ncumsum(table(data$variable))",
        excel: "1. Select data range.\n2. Insert > PivotTable.\n3. Drag variable to 'Rows' AND 'Values'.\n4. For Relative Freq: Right-click value > Show Values As > % of Column Total."
    },
    central_tendency: {
        spss: "Analyze > Descriptive Statistics > Frequencies.\nClick Statistics > Check Mean, Median, and Mode.",
        jasp: "Descriptives > Descriptive Statistics.\nUnder 'Statistics', check 'Mean', 'Median', and 'Mode'.",
        r: "mean(data$variable)\nmedian(data$variable)\n# For mode, use table and sort\nsort(table(data$variable), decreasing=T)[1]",
        excel: "Mean: =AVERAGE(range)\nMedian: =MEDIAN(range)\nMode: =MODE.SNGL(range)",
        google_sheets: "Mean: =AVERAGE(range)\nMedian: =MEDIAN(range)\nMode: =MODE(range)\n(Note: Google Sheets MODE returns the most frequent value similar to MODE.SNGL)."
    },
    z_test: {
        spss: "Analyze > Compare Means > One-Sample T Test (Note: SPSS lacks a built-in Z-test).\nManual Calculation: z = (Mean - μ) / (σ / √n).",
        jasp: "T-Tests > One-Sample T-Test.\nUnder 'Options', you can compare against a known mean.\n(Note: Usually reported as a t-test if SD is estimated).",
        r: "# Z-Test (using BSDA package)\nlibrary(BSDA)\nz.test(data$variable, mu=50, sigma.x=10)",
        excel: "1. Calculate Mean and SE manually.\n2. Z-Score: =(AVERAGE(range) - Mu) / (Sigma / SQRT(COUNT(range))).\n3. P-Value: =NORM.S.DIST(z, TRUE).",
        google_sheets: "Same as Excel.\nUse =NORM.S.DIST(z, TRUE) for the p-value."
    },
    oneway_ttest: {
        spss: "Analyze > Compare Means > One-Sample T Test.\nMove variable to 'Test Variable(s)'.\nEnter population mean in 'Test Value'.",
        jasp: "T-Tests > One-Sample T-Test.\nMove variable to variables box.\nEnter population mean in 'Test Value'.",
        r: "# One-Sample t-test\nt.test(data$variable, mu=50)",
        excel: "1. Data Analysis Toolpak > t-Test or use formula.\n2. T.TEST(range1, range2, tails, type).\n(Note: For 1-sample, use a dummy column of zeros or compare manually).",
        google_sheets: "=T.TEST(range1, {val}, 2, 1)\n(Note: Google Sheets T.TEST is very similar to Excel's old version)."
    },
    indep_ttest: {
        spss: "Analyze > Compare Means > Independent-Samples T Test.\nMove outcome to 'Test Variable(s)', grouping to 'Grouping Variable'.\nClick 'Define Groups' and enter values (e.g., 1 and 2).",
        jasp: "T-Tests > Independent Samples T-Test.\nMove outcome to 'Variables', grouping to 'Grouping Variable'.\nUnder 'Assumption Checks', check 'Homogeneity tests'.",
        r: "# Student's t-test (Equal Variances)\nt.test(y ~ x, data = df, var.equal = TRUE)\n\n# Welch's t-test (Unequal Variances)\nt.test(y ~ x, data = df, var.equal = FALSE)",
        excel: "1. Data > Data Analysis > t-Test: Two-Sample Assuming Equal/Unequal Variances.\n2. Or formula: =T.TEST(range1, range2, tails, type).\nType: 2 = Equal Var, 3 = Unequal Var."
    },
    anova: {
        spss: "Analyze > Compare Means > One-Way ANOVA.\nMove outcome to 'Dependent List', grouping to 'Factor'.\nPost-Hoc: Click 'Post Hoc' > Check 'Tukey'.\nOptions: Check 'Descriptive' and 'Homogeneity of variance test'.",
        jasp: "ANOVA > ANOVA.\nMove outcome to 'Dependent Variable', grouping to 'Fixed Factors'.\nPost-Hoc: Drag Factor to 'Post-Hoc Tests' > Check 'Tukey'.",
        r: "# One-Way ANOVA\nres <- aov(outcome ~ group, data = df)\nsummary(res)\n\n# Post-Hoc\nTukeyHSD(res)",
        excel: "1. Data > Data Analysis > ANOVA: Single Factor.\n2. Select data (columns should be groups).\n3. Check 'Labels in first row' if applicable."
    }
};
