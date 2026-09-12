export default function RepeatedMeasuresGuide({ section, onExample, darkMode }) {
    if (section === 'power') return <section className="space-y-4"><h3 className="text-2xl font-bold">Repeated-measures power is not available here</h3><p>The observed-data calculator now fits a repeated-measures model. Power planning still needs a separately validated implementation with repeated-observation correlations and nonsphericity assumptions. An independent-groups sample-size estimate is not an equivalent calculation.</p></section>;
    if (section === 'software') return <section className="space-y-4">
        <h3 className="text-2xl font-bold">Verify in statistical software</h3>
        <p>Match the participant set, condition order, and correction. For a wide table, select only the repeated measurements in Y, with one complete participant per row. Check participant IDs for duplicates first.</p>
        <pre className={`whitespace-pre-wrap break-words rounded-xl border p-4 text-sm ${darkMode ? 'bg-slate-950 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>{`# Replace A, B, C with your repeated-measurement columns\nstopifnot(!anyNA(df$participant), !anyDuplicated(df$participant))\nY <- as.matrix(df[c('A', 'B', 'C')])\nstopifnot(is.numeric(Y))\nkeep <- apply(Y, 1, function(row) all(is.finite(row)))\nY <- Y[keep, , drop = FALSE]\n\n# Multivariate representation of the repeated measurements\nfit <- lm(Y ~ 1)\nanova(fit, X = ~1, test = 'Spherical')\nmauchly.test(fit, X = ~1)\n\n# Equivalent uncorrected ANOVA with explicit error strata\nlong <- data.frame(\n  participant = factor(rep(seq_len(nrow(Y)), ncol(Y))),\n  condition = factor(rep(colnames(Y), each = nrow(Y))),\n  value = as.vector(Y))\nsummary(aov(value ~ condition + Error(participant/condition), data = long))`}</pre>
        <p>R versions may display an uncapped Huynh–Feldt epsilon estimate; adjusted tests cap epsilon at 1. For two conditions, sphericity is automatic and a Mauchly test is unnecessary.</p>
        <p>In SPSS or JASP, choose repeated-measures ANOVA, define one within-subject factor, and assign the repeated columns to its levels. Report the chosen corrected row. Excel/Sheets shortcuts and independent-groups ANOVA do not substitute for this model.</p>
        <p><a className="underline" href="https://stat.ethz.ch/R-manual/R-devel/library/stats/html/anova.mlm.html">R repeated-measures comparison reference</a> · <a className="underline" href="https://stat.ethz.ch/R-manual/R-devel/library/stats/html/mauchly.test.html">R Mauchly reference</a></p>
    </section>;
    if (section === 'equation') return <section className="space-y-4">
        <h3 className="text-2xl font-bold">Separate participant variation from within-participant error</h3>
        <p>For n complete participants and k conditions, let mⱼ be condition means, sᵢ participant means, and g the grand mean.</p>
        <p>SS_condition = n Σ(mⱼ − g)²; SS_participant = k Σ(sᵢ − g)².</p>
        <p>SS_error = Σᵢ Σⱼ(yᵢⱼ − sᵢ − mⱼ + g)².</p>
        <p>F = [SS_condition/(k − 1)] / [SS_error/((n − 1)(k − 1))].</p>
        <p>Corrections multiply both degrees of freedom by epsilon while leaving F unchanged. For an orthonormal contrast covariance C and q = k − 1, ε_GG = trace(C)²/[q trace(C²)].</p>
        <p>ε_HF = [n q ε_GG − 2]/[q(n − 1 − q ε_GG)], capped at 1. The lower-bound epsilon is 1/q. With two conditions all epsilons equal 1.</p>
        <p>Partial η² = SS_condition/(SS_condition + SS_error). Generalized η² adds SS_participant to this denominator for the one-factor design supported here.</p>
        <p><a className="underline" href="https://pingouin-stats.org/generated/pingouin.epsilon.html">Epsilon definitions and assumptions</a></p>
    </section>;
    if (section === 'assumptions') return <section className="space-y-4">
        <h3 className="text-2xl font-bold">Check participant matching and model assumptions</h3>
        <ul className="list-disc space-y-3 pl-6">
            <li>Each participant must contribute one measurement of the same numeric outcome under each selected condition. Resolve duplicate trials yourself; the calculator does not choose or average them.</li>
            <li>Participants are independent of each other. Measurements within a participant are allowed to be dependent.</li>
            <li>Review residual/contrast distributions and influential participants. Normality assumptions matter for the F test and Mauchly diagnostic, especially with small samples.</li>
            <li>Sphericity concerns equal variances of pairwise differences, not simply equal variances of the original measurements. It is automatic with two conditions.</li>
            <li>Greenhouse–Geisser is the default reporting correction here. Huynh–Feldt and uncorrected results remain visible. A nonsignificant Mauchly result does not establish sphericity, and a singular covariance cannot yield a reliable Mauchly test.</li>
            <li>Complete-participant exclusion can discard substantial information or create bias. Review missingness; consider a suitable mixed model when complete-case ANOVA is not appropriate.</li>
        </ul>
        <p>This implementation does not fit between-subject factors, mixed designs, multiple within-subject factors, covariates, or random slopes. It does not perform post-hoc comparisons, confidence intervals, or power planning.</p>
    </section>;
    return <section className="space-y-5">
        <h3 className="text-2xl font-bold">Learn one-way repeated-measures ANOVA</h3>
        <p>Track the same participants across conditions. Stable differences between participants are separated from the error used to test the condition effect. Treating these observations as independent groups would use the wrong error model.</p>
        <p>The worked example has five participants and three conditions. The uncorrected p-value is approximately .179; Greenhouse–Geisser gives approximately .212. F is the same in both rows—the corrected degrees of freedom account for nonsphericity.</p>
        <button type="button" onClick={onExample} className="rounded-xl bg-indigo-600 px-4 py-3 font-bold text-white">Try the worked example</button>
        <p>The calculator accepts wide data with one row per participant, or long data matched by participant ID and condition label. Inspect the matched rows and exclusions before interpreting the report.</p>
    </section>;
}
