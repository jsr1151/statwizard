// --- SOFTWARE GUIDES LOOKUP ---
export const SOFTWARE_GUIDES = {
    sd: {
        spss: "Analyze > Descriptive Statistics > Descriptives.\nMove variables to 'Variable(s)'.\nClick Options > Check 'Std. deviation' and 'Variance'.",
        jasp: "Descriptives > Descriptive Statistics.\nMove variables to 'Variables' box.\nUnder 'Statistics', check 'Std. deviation' and 'Variance'.",
        r: "# Calculate SD and Variance\nsd(data$variable)\nvar(data$variable)",
        excel: "Standard Deviation: =STDEV.S(range)\nVariance: =VAR.S(range)\n(Use .P for Populations)",
        google_sheets: "Standard Deviation: =STDEV(range)\nVariance: =VAR(range)"
    },
    range: {
        spss: "Analyze > Descriptive Statistics > Frequencies.\nClick Statistics > Check Quartiles, Percentiles (enter values), Range, IQR.",
        jasp: "Descriptives > Descriptive Statistics.\nCheck 'Quartiles'.\nUnder 'Plots', check 'Boxplots'.",
        r: "# Quantiles\nquantile(data$variable, probs = c(0.25, 0.5, 0.75))\nIQR(data$variable)",
        excel: "1. Min: =MIN(range)\n2. Max: =MAX(range)\n3. Q1: =QUARTILE.INC(range, 1)\n4. Q3: =QUARTILE.INC(range, 3)\n5. IQR: =Q3 - Q1",
        google_sheets: "1. Min: =MIN(range)\n2. Max: =MAX(range)\n3. Q1: =QUARTILE(range, 1)\n4. Q3: =QUARTILE(range, 3)\n5. IQR: =Q3 - Q1"
    },
    central_tendency: {
        spss: "Analyze > Descriptive Statistics > Frequencies.\nMove the variable into Variable(s).\nChoose Statistics, then select Mean, Median, and Mode.\nReview missing-value counts before interpreting the output.",
        jasp: "Descriptives > Descriptive Statistics.\nMove the variable into Variables.\nUnder Statistics, select Mean, Median, and Mode.\nCheck Valid and Missing so the denominator is clear.",
        r: "# na.rm ignores missing values\nmean(data$variable, na.rm = TRUE)\nmedian(data$variable, na.rm = TRUE)\n\n# Statistical mode(s); base R mode() is not this measure\nx <- na.omit(data$variable)\ncounts <- table(x)\nas.numeric(names(counts)[counts == max(counts)])",
        excel: "Mean: =AVERAGE(range)\nMedian: =MEDIAN(range)\nOne mode: =MODE.SNGL(range)\nAll tied modes: =MODE.MULT(range)\n\nBlank cells are ignored; verify text and error cells before calculating.",
        google_sheets: "Mean: =AVERAGE(range)\nMedian: =MEDIAN(range)\nOne mode: =MODE(range)\nAll tied modes: =MODE.MULT(range)\n\nBlank cells are ignored; verify text and error cells before calculating."
    },
    z_test: {
        spss: "Manual Calculation: z = (Mean - μ) / (σ / √n).",
        jasp: "T-Tests > One-Sample T-Test (Set known mean as 'Test Value').",
        r: "pnorm(z_score, lower.tail = FALSE) * 2",
        excel: "1. Calculate Z-score manually.\n2. P-Value: =2 * (1 - NORM.S.DIST(ABS(z), TRUE))",
        google_sheets: "1. Calculate Z-score manually.\n2. P-Value: =2 * (1 - NORM.S.DIST(ABS(z), TRUE))"
    },
    oneway_ttest: {
        spss: "Analyze > Compare Means > One-Sample T Test.\nEnter population mean in 'Test Value'.",
        jasp: "T-Tests > One-Sample T-Test.\nEnter population mean in 'Test Value'.",
        r: "t.test(data$variable, mu = 50)",
        excel: "1. Calculate T-stat and df manually.\n2. P-Value: =T.DIST.2T(ABS(t), df)",
        google_sheets: "=T.TEST(range, {hypothesized_mean_array}, 2, 1)\n(Note: Creating a dummy array of the target value allows T.TEST to work)."
    },
    indep_ttest: {
        spss: "Analyze > Compare Means > Independent-Samples T Test.\nDefine Groups (e.g., 1 and 2).",
        jasp: "T-Tests > Independent Samples T-Test.",
        r: "t.test(y ~ x, data = df, var.equal = TRUE)",
        excel: "=T.TEST(range1, range2, 2, 2)\n(Type 2 = Equal Variance, 3 = Unequal)",
        google_sheets: "=T.TEST(range1, range2, 2, 2)\n(Type 2 = Equal Variance, 3 = Unequal)"
    },
    paired_ttest: {
        spss: "Analyze > Compare Means > Paired-Samples T Test.",
        jasp: "T-Tests > Paired Samples T-Test.",
        r: "t.test(t1, t2, paired = TRUE)",
        excel: "=T.TEST(range1, range2, 2, 1)\n(Type 1 = Paired)",
        google_sheets: "=T.TEST(range1, range2, 2, 1)\n(Type 1 = Paired)"
    },
    anova: {
        spss: "Analyze > Compare Means > One-Way ANOVA.\nPost-Hoc: Click 'Post Hoc' > Check 'Tukey'.",
        jasp: "ANOVA > ANOVA.\nFixed Factors: grouping variable.",
        r: "summary(aov(outcome ~ group, data = df))",
        excel: "Path A (Toolpak): Data > Data Analysis > ANOVA: Single Factor.\nPath B (Manual): \n1. Within SS: =SUM(DEVSQ(group1_range), DEVSQ(group2_range)...)\n2. Total SS: =DEVSQ(all_data_range)\n3. Between SS: =Total_SS - Within_SS\n4. P-Value: =F.DIST.RT(F_stat, df_between, df_within)",
        google_sheets: "Path A (Add-on): Install 'Analysis ToolPak' > ANOVA: Single Factor.\nPath B (Manual): Calculate SS-Within using =DEVSQ(range) for each group, then =F.DIST.RT(F, df1, df2) for the p-value."
    },
    rm_anova: {
        spss: "Analyze > General Linear Model > Repeated Measures.",
        jasp: "ANOVA > Repeated Measures ANOVA.",
        r: "aov(y ~ time + Error(sub/time))",
        excel: "Path A (Toolpak): Data Analysis > ANOVA: Two-Factor Without Replication.\nPath B (Manual): Calculate 'Difference' columns (T1-T2, T1-T3) and use =T.TEST or manual ANOVA on residuals using =DEVSQ().",
        google_sheets: "Path A (Add-on): Use 'Analysis ToolPak' > ANOVA: Two-Factor Without Replication.\nPath B (Manual): Use =DEVSQ() on the differences between timepoints."
    },
    correlation: {
        spss: "Analyze > Correlate > Bivariate.",
        jasp: "Regression > Correlation Box.",
        r: "cor.test(var1, var2)",
        excel: "=CORREL(range1, range2)",
        google_sheets: "=CORREL(range1, range2)"
    },
    regression: {
        spss: "Analyze > Regression > Linear.",
        jasp: "Regression > Linear Regression.",
        r: "lm(y ~ x, data = df)",
        excel: "1. Slope: =SLOPE(y_range, x_range)\n2. Intercept: =INTERCEPT(y_range, x_range)\n3. Full: =LINEST(y_range, x_range, TRUE, TRUE)",
        google_sheets: "1. Slope: =SLOPE(y_range, x_range)\n2. Intercept: =INTERCEPT(y_range, x_range)\n3. Full: =LINEST(y_range, x_range, TRUE, TRUE)"
    },
    multiple_regression: {
        spss: "Analyze > Regression > Linear.\nDependent: move the outcome variable.\nIndependent(s): move two or more quantitative predictors.\nStatistics: request confidence intervals and collinearity diagnostics if needed.",
        jasp: "Regression > Linear Regression.\nDependent Variable: move the outcome.\nCovariates: move two or more quantitative predictors.\nModel Fit / Coefficients: request estimates, confidence intervals, and collinearity diagnostics.",
        r: "model <- lm(y ~ x1 + x2 + x3, data = df)\nsummary(model)\nconfint(model)",
        excel: "Use =LINEST(y_range, x_ranges, TRUE, TRUE) with multiple predictor columns. The full regression output array includes coefficients, standard errors, and model fit summaries.",
        google_sheets: "Use =LINEST(y_range, x_ranges, TRUE, TRUE) with multiple predictor columns. Arrange the predictor columns side-by-side before fitting the model."
    },
    frequency: {
        spss: "Analyze > Descriptive Statistics > Frequencies.\nMove variable(s) to the right box.",
        jasp: "Descriptives > Descriptive Statistics.\nCheck 'Frequency tables'.",
        r: "table(data$variable)",
        excel: "1. Insert > PivotTable.\n2. Drag variable to Rows AND Values.",
        google_sheets: "1. Insert > PivotTable.\n2. Drag variable to Rows AND Values."
    },
    shape: {
        spss: "Analyze > Descriptive Statistics > Frequencies.\nStatistics > Check Skewness and Kurtosis.",
        jasp: "Descriptives > Descriptive Statistics.\nCheck Skewness and Kurtosis.",
        r: "library(moments)\nskewness(data$variable)",
        excel: "Skewness: =SKEW(range)\nKurtosis: =KURT(range)",
        google_sheets: "Skewness: =SKEW(range)\nKurtosis: =KURT(range)"
    },
    non_parametric: {
        spss: "Analyze > Nonparametric Tests > Legacy Dialogs.",
        jasp: "T-Tests > Check 'Mann-Whitney' or 'Wilcoxon'.",
        r: "wilcox.test(y1, y2)",
        excel: "1. Use =RANK(cell, range) for every score.\n2. Perform a standard T.TEST on the new Rank columns.",
        google_sheets: "1. Use =RANK(cell, range) for every score.\n2. Perform a standard T.TEST on the new Rank columns."
    },
    factorial_anova: {
        spss: "Analyze > General Linear Model > Univariate.\nFixed Factor(s): Move both factors here.\nDependent Variable: Move outcome variable here.\nPlots: Factor A (Horizontal Axis), Factor B (Separate Lines) > Add.",
        jasp: "ANOVA > ANOVA.\nFixed Factors: Move both factors here.\nDependent Variable: Move outcome here.\nPlots: Factor A (Horizontal Axis), Factor B (Separate Lines).",
        r: "summary(aov(outcome ~ factorA * factorB, data = df))",
        excel: "Path A (Toolpak): Data Analysis > ANOVA: Two-Factor With Replication.\nPath B (Manual): SS for A, B, and Interaction require advanced =SUMPRODUCT calculations.",
        google_sheets: "Path A (Add-on): 'Analysis ToolPak' > ANOVA: Two-Factor With Replication.\nPath B (Manual): Use =SUMPRODUCT results to partition variance manually."
    },
    ancova: {
        spss: "Analyze > General Linear Model > Univariate.\nFixed Factor(s): Grouping variable.\nCovariate(s): Continuous predictor.\nOptions: Move Group to 'Display Means for' and check 'Compare main effects' for adjusted means.",
        jasp: "ANOVA > ANCOVA.\nFixed Factors: Grouping variable.\nCovariates: Continuous predictor.\nEstimated Marginal Means: Add grouping variable to see adjusted means.",
        r: "library(car)\nmodel <- aov(outcome ~ covariate + group, data = df)\nAnova(model, type=\"III\")",
        excel: "Not supported in Data Analysis Toolpak natively. Requires multiple linear regression using dummy coding for the groups and the covariate.",
        google_sheets: "Not supported natively. Requires multiple linear regression with dummy variables using =LINEST()."
    }
};
