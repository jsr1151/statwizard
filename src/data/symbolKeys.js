// --- SYMBOL KEY DATA ---
export const SYMBOL_KEYS = {
    mean: [
        { sym: "x̄", desc: "Sample Mean" },
        { sym: "μ", desc: "Population Mean" },
        { sym: "Σ", desc: "Summation (Add up)" },
        { sym: "n", desc: "Sample Size" }
    ],
    sd: [
        { sym: "s / SD", desc: "Sample Std Dev" },
        { sym: "σ", desc: "Population SD" },
        { sym: "s²", desc: "Sample Variance" },
        { sym: "x̄", desc: "Sample Mean" }
    ],
    percentage: [
        { sym: "f", desc: "Frequency (Count)" },
        { sym: "rf", desc: "Relative Frequency" },
        { sym: "cf", desc: "Cumulative Freq" },
        { sym: "N", desc: "Total Count" }
    ],
    standard: [
        { sym: "μ", desc: "Pop Mean" },
        { sym: "σ", desc: "Pop SD" },
        { sym: "SE", desc: "Std Error" },
        { sym: "x̄", desc: "Sample Mean" }
    ],
    range: [
        { sym: "Q1", desc: "25th Percentile" },
        { sym: "Q3", desc: "75th Percentile" },
        { sym: "IQR", desc: "Interquartile Range" }
    ],
    sd_pop: [
        { sym: "μ", desc: "Population Mean" },
        { sym: "σ", desc: "Population SD" },
        { sym: "x̄", desc: "Sample Mean" },
        { sym: "n", desc: "Sample Size" }
    ],
    anova: [
        { sym: "MS", desc: "Mean Square", key: "MS" },
        { sym: "SS", desc: "Sum of Squares", key: "SS" },
        { sym: "df", desc: "Degrees of Freedom", key: "df" },
        { sym: "x̄ⱼ", desc: "Group Mean", key: "x̄j" },
        { sym: "x̄<sub>grand</sub>", desc: "Grand Mean", key: "x̄_grand" },
        { sym: "nⱼ", desc: "Group n", key: "nj" },
        { sym: "k", desc: "# of Groups", key: "k" },
        { sym: "N", desc: "Total Obs", key: "N" }
    ]
};
