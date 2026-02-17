// --- EXPANDED MATH TERMS ---
export const MATH_TERMS = {
    // Frequency Terms
    "f": { title: "Absolute Frequency", desc: "The raw count of how many times a value appears.", calc: "Count(x)" },
    "rf": { title: "Relative Frequency", desc: "The proportion of the total.", calc: "f / N" },
    "cf": { title: "Cumulative Frequency", desc: "The running total of frequencies up to the current value.", calc: "Sum of f from start to current." },
    "N": { title: "Total Observations", desc: "Sum of all frequencies.", calc: "Σf" },

    // Descriptive
    "x̄": { title: "Arithmetic Mean", desc: "The average value.", calc: "Σx / {n}" },
    "n": { title: "Sample Size", desc: "Total observations.", calc: "Count." },
    "s": { title: "Sample Standard Deviation (SD)", desc: "Average spread.", calc: "√ {s2}" },
    "x": { title: "Individual Score", desc: "A single data point.", calc: "Raw value." },
    "s2": { title: "Sample Variance", desc: "Squared dispersion.", calc: "{SS} / {df}" },
    "s1_2": { title: "Variance (Group 1)", desc: "Squared dispersion of group 1 scores.", calc: "s₁²" },
    "s2_2": { title: "Variance (Group 2)", desc: "Squared dispersion of group 2 scores.", calc: "s₂²" },
    "n1": { title: "Sample Size (Group 1)", desc: "Count of scores in group 1.", calc: "Count." },
    "n2": { title: "Sample Size (Group 2)", desc: "Count of scores in group 2.", calc: "Count." },
    "x1": { title: "Mean (Group 1)", desc: "Average of scores in group 1.", calc: "Σx₁ / n₁" },
    "x2": { title: "Mean (Group 2)", desc: "Average of scores in group 2.", calc: "Σx₂ / n₂" },
    "df": { title: "Degrees of Freedom", desc: "Values free to vary.", calc: "{n} - 1" },
    "SS": { title: "Sum of Squares", desc: "Total Squared Distance.", calc: "Σ ({x} - {x̄})²" },
    "Range": { title: "Range", desc: "Max - Min.", calc: "Distance." },
    "IQR": { title: "Interquartile Range", desc: "Spread of middle 50%.", calc: "{Q3} - {Q1}" },
    "Q1": { title: "First Quartile", desc: "25th Percentile.", calc: "Median of lower half." },
    "Q3": { title: "Third Quartile", desc: "75th Percentile.", calc: "Median of upper half." },
    "Percentage": { title: "Percentage (%)", desc: "Part of whole.", calc: "({f} / {n}) * 100" },
    // 1-Group Focus
    "z": { title: "Z-Score", desc: "Standardized diff.", calc: "({x̄} - {μ}) / {SE}" },
    "mu": { title: "Population Mean (μ)", desc: "Known average.", calc: "Constant." },
    "sigma": { title: "Population SD (σ)", desc: "Known spread.", calc: "Constant." },
    "SEz": { title: "Standard Error (z)", desc: "Noise (σ known).", calc: "{σ} / √{n}" },
    "SEt": { title: "Standard Error (t)", desc: "Noise (s known).", calc: "{s} / √{n}" },
    // T-Test
    "x̄1": { title: "Mean Group 1", desc: "Average of Group 1.", calc: "Σ{x1} / {n1}" },
    "x̄2": { title: "Mean Group 2", desc: "Average of Group 2.", calc: "Σ{x2} / {n2}" },
    "SE": { title: "Standard Error (SE)", desc: "Expected noise/spread of sampling dist.", calc: "varies by test." },
    "SE_delta": { title: "SE of Difference", desc: "Estimated noise in the mean gap.", calc: "√( {s₁²}/{n₁} + {s₂²}/{n₂} )" },
    "sp2": { title: "Pooled Variance ($s_p^2$)", desc: "Weighted average of both group variances.", calc: "( ({n₁}-1)s₁² + ({n₂}-1)s₂² ) / (n₁+n₂-2)" },
    // Paired T-Test
    "dBar": { title: "Mean Difference (d̄)", desc: "The average change between paired scores.", calc: "Σd / {n_pairs}" },
    "sd_diff": { title: "SD of Differences (s_d)", desc: "Spread of the change scores.", calc: "√[ Σ(d - {dBar})² / ({n_pairs} - 1) ]" },
    "n_pairs": { title: "Number of Pairs (n)", desc: "Total matched observations.", calc: "Count of paired rows." },
    "dz": { title: "Cohen's d_z", desc: "Standardized mean difference for paired data.", calc: "{dBar} / {sd_diff}" },
    "r_corr": { title: "Correlation (r)", desc: "Relationship between paired measurements.", calc: "Cov(X₁, X₂) / (s₁ · s₂)" },
    "SE_paired": { title: "Standard Error (SE_d̄)", desc: "Estimated noise in the mean change.", calc: "{sd_diff} / √{n_pairs}" },
    // ANOVA
    "MS_between": { title: "Mean Square Between ($MS_{between}$)", desc: "The 'Signal': variance explained by group differences.", calc: "{SS_between} / {df_between}" },
    "MS_within": { title: "Mean Square Within ($MS_{within}$)", desc: "The 'Noise': average variance within groups (residual).", calc: "{SS_within} / {df_within}" },
    "SS_between": { title: "Sum of Squares Between ($SS_{between}$)", desc: "Variation due to group differences (Signal).", calc: "Σ nⱼ (x̄ⱼ - x̄_grand)²" },
    "SS_within": { title: "Sum of Squares Within ($SS_{within}$)", desc: "Variation due to individual differences (Noise).", calc: "Σ Σ (xᵢⱼ - x̄ⱼ)² or Σ (nⱼ-1)sⱼ²" },
    "SS_total": { title: "Sum of Squares Total ($SS_{total}$)", desc: "Total variation in the dataset.", calc: "Σ Σ (xᵢⱼ - x̄_grand)²" },
    "df_between": { title: "Degrees of Freedom (Between)", desc: "Values free to vary between groups.", calc: "k - 1 (k = # of groups)" },
    "df_within": { title: "Degrees of Freedom (Within)", desc: "Values free to vary within groups.", calc: "N - k (N = total observations)" },
    "F": { title: "F-Ratio", desc: "Signal-to-noise ratio. If H₀ is true, F is expected to be near 1.", calc: "{MS_between} / {MS_within}" },
    "eta2": { title: "Eta-Squared (η²)", desc: "Effect Size: Proportion of total variance explained by the groups.", calc: "{SS_between} / {SS_total}" },
    // Correlation
    "r": { title: "Pearson's r", desc: "Correlation.", calc: "Cov / SDs" },
    "Beta": { title: "Beta", desc: "Slope.", calc: "Rise/Run" },
    "Covariance": { title: "Covariance", desc: "Joint var.", calc: "Σxy..." }
};
