// --- HELPER: Tutor Script Engine ---
export const TUTOR_SCRIPTS = {
    z_test: [
        {
            id: "z_n_increase",
            priority: 80,
            condition: (prev, next) => prev && next.n > prev.n,
            content: {
                now: "Sample size (n) increased!",
                whatChanged: "Increasing n reduces the standard error (SE), making the sampling distribution narrower.",
                why: "The Law of Large Numbers: larger samples are more representative of the population, so our estimate of the mean becomes more precise.",
                math: "SE = σ / √n",
                tryNext: "Watch how H₁ (dashed) separates further from H₀, increasing your Power."
            }
        },
        {
            id: "z_p_cross_alpha",
            priority: 100,
            condition: (prev, next) => prev && prev.p > prev.alpha && next.p <= next.alpha,
            content: (prev, next) => ({
                now: "Statistically Significant! (Reject H₀)",
                whatChanged: `Calculated z (${next.val.toFixed(3)}) has entered the Rejection Region.`,
                why: "This result is 'Significant' because it's very unlikely (p < α) to happen by random chance if the Null were true. We have evidence of a real effect!",
                math: `p = ${next.p.toFixed(4)} \\le α = ${next.alpha}`,
                tryNext: "Try decreasing α to 0.01. Is the evidence strong enough to stay significant?"
            })
        },
        {
            id: "z_p_exit_alpha",
            priority: 100,
            condition: (prev, next) => prev && prev.p <= prev.alpha && next.p > next.alpha,
            content: (prev, next) => ({
                now: "No longer Significant. (Fail to Reject H₀)",
                whatChanged: `The p-value (${next.p.toFixed(4)}) is now above your α threshold (${next.alpha}).`,
                why: "The observed difference could reasonably be due to random sampling error. We don't have enough evidence to claim a real effect at this alpha level.",
                math: `p = ${next.p.toFixed(4)} > α = ${next.alpha}`,
                tryNext: "Try increasing your sample size (n) to reduce noise and see if a real pattern emerges."
            })
        },
        {
            id: "z_tails_change",
            priority: 70,
            condition: (prev, next) => prev && prev.tails !== next.tails,
            content: (prev, next) => ({
                now: `Switched to a ${next.tails === 2 ? 'two-tailed' : 'one-tailed'} test.`,
                whatChanged: `The rejection region is now ${next.tails === 2 ? 'split across both tails' : 'concentrated in one tail'}.`,
                why: "Two-tailed tests are more conservative; they require more extreme evidence because α is split (α/2 in each tail).",
                math: next.tails === 2 ? "|z| ≥ z_crit" : "z ≥ z_crit",
                tryNext: "Notice how the critical value (1.64 vs 1.96) changes."
            })
        },
        {
            id: "z_score_moved",
            priority: 10,
            condition: (prev, next) => prev && Math.abs(prev.val - next.val) > 0.05,
            content: (prev, next) => ({
                now: "Observing changes in the test statistic.",
                whatChanged: `Calculated z-score is now ${next.val.toFixed(3)}.`,
                why: "As you move the sample mean (x̄) or change the sample size (n), the z-score reflects how many standard errors the result is from the null mean (μ₀).",
                math: `z = ({xBar} - {mu}) / ({sigma} / √{n}) = ${next.val.toFixed(3)}`,
                tryNext: "Try to get the red dot into the 'Rejection Region' (shaded area)."
            })
        },
        {
            id: "z_alpha_change",
            priority: 75,
            condition: (prev, next) => prev && prev.alpha !== next.alpha,
            content: (prev, next) => ({
                now: `α level changed to ${next.alpha}.`,
                whatChanged: "This directly adjusts the size of the Rejection Region.",
                why: "α is your 'Significance Threshold'. A smaller α (0.01) makes it harder to reject the Null, protecting you against Type I Errors (False Positives).",
                math: "Threshold = α",
                tryNext: "Toggle to 'Errors/Power' view to see the Red Alpha region grow or shrink."
            })
        },
        {
            id: "z_direction_change",
            priority: 70,
            condition: (prev, next) => prev && prev.direction !== next.direction && next.tails === 1,
            content: (prev, next) => ({
                now: `Hypothesis direction flipped to ${next.direction === 'greater' ? 'Right' : 'Left'} Tail.`,
                whatChanged: "The rejection region moved to the opposite side of the null curve.",
                why: "In a one-tailed test, you are only interested in effects in one specific direction. Evidence in the other direction is completely ignored.",
                math: next.direction === 'greater' ? "$Z \\ge Z_{crit}$" : "$Z \\le Z_{crit}$",
                tryNext: "Check the 'Critical Value' label—it just changed sign!"
            })
        },
        {
            id: "z_effect_size_change",
            priority: 65,
            condition: (prev, next) => prev && Math.abs(prev.targetEffect - next.targetEffect) > 0.1,
            content: {
                now: "Hypothesized effect size adjusted.",
                whatChanged: "The Alternative Distribution ($H_1$) shifted to a new 'what-if' location.",
                why: "Effect size ($d$) represents how large of a real-world difference you are looking for. Larger effects are easier to detect.",
                math: "Z_{shift} = d \\times \\sqrt{n}",
                tryNext: "Watch the 'Power' region grow as you pull the slider to the right."
            }
        },
        {
            id: "z_clt_warning",
            priority: 95,
            condition: (prev, next) => prev && next.n < 30 && prev.n >= 30,
            content: {
                now: "Small sample size ($n < 30$) detected.",
                whatChanged: "The Central Limit Theorem works best when $n \\ge 30$.",
                why: "When $n$ is small, the sampling distribution might not be perfectly normal unless the underlying population is also normal. For very small samples, a t-test is often more appropriate.",
                math: "n < 30 \\implies \\text{Caution}",
                tryNext: "Try bumping $n$ up to $60$ and watch how stable the 'Power' of your test becomes."
            }
        },
        {
            id: "z_missed_tail",
            priority: 90,
            condition: (prev, next) => {
                if (next.tails !== 1) return false;
                const delta = next.xBar - next.mu;
                return (next.direction === 'greater' && delta < 0) || (next.direction === 'less' && delta > 0);
            },
            content: {
                now: "Effect is in the 'wrong' direction!",
                whatChanged: "Your hypothesized direction (H₁) doesn't match the observed data.",
                why: "In a one-tailed test, you are committing to one direction. Even if the difference is huge, you cannot reject the Null if it's on the wrong side.",
                math: "Effect Size (d) sign must match H₁",
                tryNext: "Switch to a two-tailed test to capture effects in both directions."
            }
        },
        {
            id: "z_ci_equivalence",
            priority: 85,
            condition: (prev, next) => prev && next.showCI && (prev.val !== next.val || prev.alpha !== next.alpha || prev.tails !== next.tails),
            content: (prev, next) => ({
                now: "CI ↔ Hypothesis Equivalence",
                whatChanged: "The Confidence Interval and Hypothesis Test are mathematically linked.",
                why: next.tails === 2
                    ? `For a two-tailed test, if the null mean (μ₀=${next.mu}) falls OUTSIDE the CI, the result is significant at α=${next.alpha}.`
                    : `For one-tailed tests, we compare the null mean to the one-sided bound.`,
                math: next.tails === 2
                    ? `Reject H₀ if μ₀ ∉ [${next.ciLower.toFixed(2)}, ${next.ciUpper.toFixed(2)}]`
                    : `Check if μ₀ is beyond the ${next.direction === 'greater' ? 'lower' : 'upper'} bound.`,
                tryNext: "Notice how the red marker moves relative to the CI bounds as you change parameters."
            })
        }
    ],
    t_test: [
        {
            id: "t_df_change",
            priority: 90,
            condition: (prev, next) => prev && Math.abs(prev.df - next.df) >= 1,
            content: (prev, next) => ({
                now: `Degrees of Freedom ($df$) changed to ${next.df}.`,
                whatChanged: "The shape of the T-distribution is adjusting.",
                why: "Lower $df$ creates 'fatter tails' because we have more uncertainty about the population spread. Larger samples ($n$) increase $df$, making the curve converge to the Normal distribution!",
                math: `df = ${next.n} - 1 = ${next.df}`,
                tryNext: "Watch the 'Tail Gap' shrink as you increase the sample size ($n$)."
            })
        },
        {
            id: "t_alpha_change",
            priority: 75,
            condition: (prev, next) => prev && prev.alpha !== next.alpha,
            content: (prev, next) => ({
                now: `α level set to ${next.alpha}.`,
                whatChanged: `This shifts your significance threshold (${next.crit}).`,
                why: "α is your threshold for 'enough evidence.' A smaller α (0.01) is more conservative, requiring a more extreme t-score to reject the Null Hypothesis.",
                math: `Threshold: |t| \\ge ${Math.abs(next.crit)}`,
                tryNext: "Try decreasing α to 0.01. Notice how much harder it becomes to reach the Rejection Region!"
            })
        },
        {
            id: "t_tails_change",
            priority: 70,
            condition: (prev, next) => prev && prev.tails !== next.tails,
            content: (prev, next) => ({
                now: `Switched to a ${next.tails === 2 ? 'two-tailed' : 'one-tailed'} test.`,
                whatChanged: `Alpha is now ${next.tails === 2 ? 'split' : 'weighted'}!`,
                why: "Two-tailed tests check for differences in ANY direction, but split the α (making the critical value higher). One-tailed tests are more sensitive but only in one specific direction.",
                math: next.tails === 2 ? `α/2 = ${next.alpha / 2} per tail` : `α = ${next.alpha} in one tail`,
                tryNext: "Watch the shaded regions jump between one or two tails."
            })
        },
        {
            id: "t_direction_change",
            priority: 70,
            condition: (prev, next) => prev && prev.direction !== next.direction && next.tails === 1,
            content: (prev, next) => ({
                now: `Hypothesis direction switched to ${next.direction === 'greater' ? 'Right' : 'Left'} side.`,
                whatChanged: "The Rejection Region moved to target the opposite tail.",
                why: "You are now only testing if the sample is significantly ${next.direction === 'greater' ? 'higher' : 'lower'} than the null mean. Any result on the other side is ignored.",
                math: next.direction === 'greater' ? "$t \\ge t_{crit}$" : "$t \\le t_{crit}$",
                tryNext: "Observe how the critical value becomes ${next.direction === 'greater' ? 'positive' : 'negative'}."
            })
        },
        {
            id: "t_significance",
            priority: 100,
            condition: (prev, next) => prev && prev.p > prev.alpha && next.p <= next.alpha,
            content: (prev, next) => ({
                now: "Statistically Significant! (Reject H₀)",
                whatChanged: `Calculated t (${next.val.toFixed(3)}) is beyond the cutoff (${next.crit}).`,
                why: "This result is 'Significant' because it's very unlikely (p < α) to happen by random chance alone. We have evidence that the difference is a real effect, not just noise!",
                math: `p = ${next.p.toFixed(4)} \\le α = ${next.alpha}`,
                tryNext: "Try the 'Direct T-Score' slider to see exactly where the significance cutoff is."
            })
        },
        {
            id: "t_exit_significance",
            priority: 100,
            condition: (prev, next) => prev && prev.p <= prev.alpha && next.p > next.alpha,
            content: (prev, next) => ({
                now: "No longer Significant. (Fail to Reject H₀)",
                whatChanged: `The p-value (${next.p.toFixed(4)}) is now above α (${next.alpha}).`,
                why: "The difference you see could reasonably be explained by random sampling error. We do not have strong enough evidence to claim the effect is 'real' at this alpha level.",
                math: `p > α`,
                tryNext: "Increase the sample size ($n$) to see if a more precise estimate reveals an effect."
            })
        },
        {
            id: "t_score_moved",
            priority: 10,
            condition: (prev, next) => prev && Math.abs(prev.val - next.val) > 0.05,
            content: (prev, next) => ({
                now: "Updating the T-statistic.",
                whatChanged: `The calculated t-score is now ${next.val.toFixed(3)}.`,
                why: "The t-score tells you how many standard errors the sample mean is from the null. As the t-score increases, the evidence against H₀ gets stronger.",
                math: `t = ({x̄} - {μ}) / {SEt} = ${next.val.toFixed(3)}`,
                tryNext: "Try to push the red dot into the shaded Rejection Region."
            })
        },
        {
            id: "t_missed_tail",
            priority: 95,
            condition: (prev, next) => {
                if (next.tails !== 1) return false;
                const delta = next.xBar - next.mu;
                const isWrongSide = (next.direction === 'greater' && delta < -0.1) || (next.direction === 'less' && delta > 0.1);
                const wasNotWrongSide = prev && (prev.direction === 'greater' && (prev.xBar - prev.mu) >= -0.1) || (prev.direction === 'less' && (prev.xBar - prev.mu) <= 0.1) || prev.tails === 2;
                return isWrongSide && wasNotWrongSide;
            },
            content: (prev, next) => ({
                now: "Testing the Wrong Tail!",
                whatChanged: "The data shows a difference in the opposite direction of your hypothesis.",
                why: "Since you chose a one-tailed test, you effectively 'blinded' yourself to results in this direction. Even if the gap is large, you cannot reject the Null on this side.",
                math: "Directional Gap",
                tryNext: "Flip the 'Hypothesis Direction' or use a Two-Tailed test to see both sides."
            })
        },
        {
            id: "t_ci_equivalence",
            priority: 85,
            condition: (prev, next) => prev && next.showCI && (prev.val !== next.val || prev.alpha !== next.alpha || prev.tails !== next.tails),
            content: (prev, next) => ({
                now: "Equivalence Principle",
                whatChanged: "A $1-α$ Confidence Interval contains all values of μ₀ that would NOT be rejected.",
                why: next.tails === 2
                    ? `Since μ₀=${next.mu} is ${next.mu >= next.ciLower && next.mu <= next.ciUpper ? 'INSIDE' : 'OUTSIDE'} the interval, we ${next.mu >= next.ciLower && next.mu <= next.ciUpper ? 'fail to reject' : 'reject'} the Null.`
                    : "For one-sided tests, the interval becomes a single bound (Limit).",
                math: next.tails === 2
                    ? `μ₀ ∉ [${next.ciLower.toFixed(2)}, ${next.ciUpper.toFixed(2)}] ⟺ p \\le α`
                    : `Check if μ₀ is beyond the CI bound.`,
                tryNext: "Switch between Two-Sided and One-Sided CI type in the result box to see the difference."
            })
        }
    ],
    t_test_indep: [
        {
            id: "t_indep_welch_change",
            priority: 95,
            condition: (prev, next) => prev && prev.testType !== next.testType,
            content: (prev, next) => ({
                now: `Switched to ${next.testType === 'student' ? 'Student (Pooled)' : 'Welch (Unpooled)'} test.`,
                whatChanged: next.testType === 'student' ? "Assuming equal variances across groups." : "Accounting for unequal variances.",
                why: next.testType === 'student'
                    ? "Pooled t-tests are more powerful if variances are equal, but biased if they differ significantly."
                    : "Welch's t-test is safer; it adjusts degrees of freedom ($df$) to handle unequal spreads.",
                math: next.testType === 'welch' ? "df_{Welch} \\approx \\text{Satterthwaite approx}" : "df = n_1 + n_2 - 2",
                tryNext: "Check the 'Variance Ratio'—if it's > 4, Welch is strongly recommended."
            })
        },
        {
            id: "t_indep_swap",
            priority: 80,
            condition: (prev, next) => prev && next.delta !== prev.delta && Math.abs(next.delta + prev.delta) < 0.01 && Math.abs(next.delta) > 0.1,
            content: {
                now: "Groups Swapped!",
                whatChanged: "The sign of the mean difference ($\\Delta$) and t-score flipped.",
                why: "Distance is the same, but direction changed. Crucially, the p-value for a two-tailed test stays exactly the same!",
                math: "x̄_1 - x̄_2 = -(x̄_2 - x̄_1)",
                tryNext: "Notice how the red marker moved to the opposite side of the distribution."
            }
        },
        {
            id: "t_indep_unbalanced",
            priority: 70,
            condition: (prev, next) => prev && Math.abs(next.n1 - next.n2) > 10 && Math.abs(prev.n1 - prev.n2) <= 10,
            content: {
                now: "Unbalanced sample sizes detected.",
                whatChanged: "One group is significantly larger than the other.",
                why: "Unbalanced designs are more sensitive to violations of the equal variance assumption. Welch's t-test is much more robust here.",
                math: "n_1 \\neq n_2",
                tryNext: "Try equalizing the group sizes to see how the Standard Error ($SE$) stabilizes."
            }
        },
        {
            id: "t_indep_delta_moved",
            priority: 10,
            condition: (prev, next) => prev && Math.abs(prev.delta - next.delta) > 0.05,
            content: (prev, next) => ({
                now: "Mean difference (Δ) updated.",
                whatChanged: `The gap between groups is now ${next.delta.toFixed(2)} units.`,
                why: "The t-score is calculated by dividing this gap by the Standard Error. A larger gap (relative to noise) makes the result more significant.",
                math: `t = Δ / SE = ${next.t.toFixed(3)}`,
                tryNext: "Drag the marker to see how the p-value responds to the size of the effect."
            })
        },
        {
            id: "t_indep_significance",
            priority: 100,
            condition: (prev, next) => prev && !prev.isSignificant && next.isSignificant,
            content: (prev, next) => ({
                now: "Statistically Significant! (Reject H₀)",
                whatChanged: `The p-value (${next.p.toFixed(4)}) is now below your α threshold (${next.alpha}).`,
                why: "The observed difference is unlikely to be due to chance alone. We have evidence of a real difference between these populations.",
                math: `p < α`,
                tryNext: "Try reducing the sample size (n) to see how it affects your ability to detect this difference (Power)."
            })
        },
        {
            id: "t_indep_exit_significance",
            priority: 100,
            condition: (prev, next) => prev && prev.isSignificant && !next.isSignificant,
            content: (prev, next) => ({
                now: "No longer Significant. (Fail to Reject H₀)",
                whatChanged: `The p-value (${next.p.toFixed(4)}) has risen above α (${next.alpha}).`,
                why: "We no longer have enough evidence to claim the groups are different. The current gap could be just random sampling noise.",
                math: `p > α`,
                tryNext: "Increase the sample size or reduce the variance (s) to gain more statistical power."
            })
        },
        {
            id: "t_indep_alpha_change",
            priority: 75,
            condition: (prev, next) => prev && prev.alpha !== next.alpha,
            content: (prev, next) => ({
                now: `Significance level (α) changed to ${next.alpha}.`,
                whatChanged: "The 'burden of proof' has been adjusted.",
                why: "A smaller α (0.01) requires stronger evidence to reject the Null, while a larger α (0.10) is more lenient but increases False Positive risk.",
                math: `α = ${next.alpha}`,
                tryNext: "Watch the red rejection regions on the sampling distribution grow or shrink."
            })
        },
        {
            id: "t_indep_tails_change",
            priority: 70,
            condition: (prev, next) => prev && prev.tails !== next.tails,
            content: (prev, next) => ({
                now: `Switched to ${next.tails === 2 ? 'Two-Tailed' : 'One-Tailed'} test.`,
                whatChanged: `The rejection region is now ${next.tails === 2 ? 'split between both sides' : 'concentrated on one side'}.`,
                why: "Two-tailed tests are safer as they detect differences in either direction. One-tailed tests are more powerful but 'blind' to results in the opposite direction.",
                math: next.tails === 2 ? "α/2 in each tail" : "α in one tail",
                tryNext: "Observe how the critical t-value changes when you toggle tails."
            })
        }
    ],
    t_test_paired: [
        {
            id: "t_paired_mismatch",
            priority: 150,
            condition: (prev, next) => prev && next.n1 !== next.n2 && next.raw1 && next.raw2,
            content: {
                now: "⚠️ Data mismatch detected.",
                whatChanged: "Condition 1 and Condition 2 have different number of observations.",
                why: "A paired t-test requires every score in Condition 1 to have a matching partner in Condition 2. You cannot calculate difference scores ($d_i$) if pairs are missing.",
                math: "n_1 must equal n_2",
                tryNext: "Check your data for missing values or extra rows and ensure both columns match in length."
            }
        },
        {
            id: "t_paired_swap",
            priority: 80,
            condition: (prev, next) => prev && next.dBar !== prev.dBar && Math.abs(next.dBar + prev.dBar) < 0.01 && Math.abs(next.dBar) > 0.1,
            content: {
                now: "Conditions Swapped!",
                whatChanged: "The sign of the mean difference ($\\bar{d}$) and t-score have flipped.",
                why: "By swapping which condition is subtracted from which, you've changed the direction of the 'change'. The magnitude of the effect stays the same.",
                math: "Condition 2 - Condition 1 = -(Condition 1 - Condition 2)",
                tryNext: "Notice that while the t-score flipped, the two-tailed p-value remains identical."
            }
        },
        {
            id: "t_paired_correlation",
            priority: 90,
            condition: (prev, next) => prev && next.r > 0.7 && prev.r <= 0.7,
            content: (prev, next) => ({
                now: `Strong correlation detected (r = ${next.r.toFixed(2)})!`,
                whatChanged: "Participants are responding very consistently across conditions.",
                why: "High correlation within pairs reduces the variance of the difference scores ($s_d$). This is the 'secret weapon' of paired designs—it makes the test much more powerful than an independent test.",
                math: "s_d^2 = s_1^2 + s_2^2 - 2r s_1 s_2",
                tryNext: "Look at how small the Standard Error ($SE$) is compared to the individual group spreads."
            })
        },
        {
            id: "t_paired_moved",
            priority: 10,
            condition: (prev, next) => prev && Math.abs(prev.dBar - next.dBar) > 0.05,
            content: (prev, next) => ({
                now: "Average change ($\\bar{d}$) updated.",
                whatChanged: `The mean difference is now ${next.dBar.toFixed(2)} units.`,
                why: "The paired t-score represents how many standard errors this average change is from zero (the null hypothesis).",
                math: `t = \\bar{d} / (s_d / √n) = ${next.t.toFixed(3)}`,
                tryNext: "Drag the marker to see how much 'average change' is needed to reach significance."
            })
        },
        {
            id: "t_paired_significance",
            priority: 100,
            condition: (prev, next) => prev && !prev.isSignificant && next.isSignificant,
            content: (prev, next) => ({
                now: "Statistically Significant! (Reject H₀)",
                whatChanged: `The p-value (${next.p.toFixed(4)}) is below α (${next.alpha}).`,
                why: "The consistent change observed across your pairs is very unlikely to be due to chance. There is likely a real effect of the treatment/condition.",
                math: "p < α",
                tryNext: "Switch to 'Paired Lines' view to see how many individuals improved vs. declined."
            })
        }
    ]
};
