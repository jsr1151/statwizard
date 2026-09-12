import { SOFTWARE_GUIDES } from '../../data/softwareGuides.js';

export default function RankTestGuide({ paired, section, darkMode, onExample }) {
    const name = paired ? 'Wilcoxon signed-rank' : 'Mann–Whitney U';
    if (section === 'software') return <section className="space-y-4">
        <h3 className="text-2xl font-bold">Check the result in other software</h3>
        <p>Match the alternative, missing-data exclusions, tie handling, zero handling, and continuity correction. Software defaults can differ from this calculator. Its Auto setting uses exact conditional inference for up to 40 pooled observations or 50 nonzero pairs; larger inputs use a normal approximation.</p>
        <div className="grid gap-4 lg:grid-cols-2">{Object.entries(paired ? SOFTWARE_GUIDES.wilcoxon_signed_rank : SOFTWARE_GUIDES.mann_whitney).map(([key, value]) => <div key={key} className={`min-w-0 rounded-xl border p-4 ${darkMode ? 'bg-slate-950 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
            <h4 className="font-bold">{({ r: 'R', spss: 'SPSS', jasp: 'JASP', excel: 'Excel', google_sheets: 'Google Sheets' })[key]}</h4>
            <pre className="mt-3 whitespace-pre-wrap break-words text-sm">{value}</pre>
        </div>)}</div>
        <p>In R, use exact = FALSE and correct = TRUE to match the normal approximation with continuity correction. Older R versions cannot compute exact inference with ties or zeros; use a validated conditional permutation implementation for those comparisons. For signed-rank comparisons, subtract A − B, apply the same rounding, remove missing pairs and zero differences, then test that difference vector.</p>
        <p><a className="underline" href="https://stat.ethz.ch/R-manual/R-devel/library/stats/html/wilcox.test.html">R method reference</a> · <a className="underline" href={paired ? 'https://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.wilcoxon.html' : 'https://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.mannwhitneyu.html'}>SciPy method reference</a></p>
    </section>;
    if (section === 'equation') return <section className="space-y-4">
        <h3 className="text-2xl font-bold">From observations to ranks</h3>
        {paired ? <>
            <p>dᵢ = Aᵢ − Bᵢ. Exclude incomplete pairs, apply any chosen difference rounding, and omit zero differences before ranking |dᵢ|. Ties receive average ranks.</p>
            <p>W+ = sum of ranks where dᵢ &gt; 0; W− = sum of ranks where dᵢ &lt; 0.</p>
            <p>E(W+) = n(n + 1)/4; Var(W+) = Σrᵢ²/4 for the retained ranks. Using the actual ranks incorporates ties.</p>
            <p>Paired rank-biserial correlation = (W+ − W−)/(W+ + W−).</p>
        </> : <>
            <p>Pool both samples and assign average ranks to ties. R_A is the sum of ranks belonging to sample A.</p>
            <p>U_A = R_A − n_A(n_A + 1)/2; U_B = n_A n_B − U_A.</p>
            <p>E(U_A) = n_A n_B/2. For N = n_A + n_B and pooled tie-block sizes tⱼ:</p>
            <p>Var(U_A) = (n_A n_B/12)[N + 1 − Σ(tⱼ³ − tⱼ)/(N(N − 1))].</p>
            <p>Rank-biserial correlation = 2U_A/(n_A n_B) − 1.</p>
        </>}
        <p>Exact inference counts {paired ? 'all sign assignments to the nonzero absolute ranks' : 'all assignments of pooled observations to two groups of the observed sizes'}. Tied observations remain distinct assignments. Two-sided p = min(1, 2 × the smaller inclusive tail probability). This is not a mid-p test.</p>
        <p>For the normal approximation, z = (statistic − null mean − correction)/standard error. The optional continuity correction is 0.5 toward the null mean for two-sided inference, +0.5 for A greater, and −0.5 for A less.</p>
    </section>;
    if (section === 'assumptions') return <section className="space-y-4">
        <h3 className="text-2xl font-bold">Check the design before interpreting p</h3>
        <ul className="list-disc space-y-3 pl-6">
            <li>{paired ? 'Pairs must be matched correctly, with independent participants/pairs.' : 'The two samples must consist of independent observations. Repeated or clustered data need a different model.'}</li>
            <li>{paired ? 'Paired differences must have meaningful magnitudes and a distribution symmetric about the hypothesized zero center. Ranking does not remove this assumption.' : 'Outcomes must have a meaningful order. Enter ordered scores numerically; arbitrary category codes are not ordered measurements.'}</li>
            <li>{paired ? 'Review difference symmetry and outliers. If symmetry is implausible, consider a sign test or another suitable method; a sign test is not implemented here.' : 'A general distribution comparison is not automatically a comparison of medians. A location interpretation requires comparable distributional shapes and spread.'}</li>
            <li>Missing-data exclusion can change the population represented. Review every exclusion and its reason.</li>
            <li>Choose a directional alternative before inspecting the result. Account for multiple tests in the study design; this calculator does not adjust a family of p-values.</li>
        </ul>
        <p>These checks are not automatically established by a successful calculation. This workspace does not estimate location-shift confidence intervals, perform power analysis, or fit clustered/repeated-measures models.</p>
    </section>;
    return <section className="space-y-5">
        <h3 className="text-2xl font-bold">Learn {name}</h3>
        <p>{paired ? 'Compare two measurements on the same participants by ranking the magnitudes of their differences and retaining the signs. Positive ranks favor A; negative ranks favor B.' : 'Compare independent samples by ranking their pooled values. U_A counts A–B comparisons in which A is larger, with tied comparisons contributing one half.'}</p>
        <p>{paired ? 'Worked example: A = 2, 4, 6, 8, 10, 12 and B = 1, 2, 3, 4, 5, 6. Differences have ranks 1 through 6 and are all positive: W+ = 21, W− = 0. Of 64 sign assignments, two are equally extreme, giving two-sided exact p = .03125.' : 'Worked example: A = 1, 2, 3 and B = 4, 5, 6. Every A value is lower, so U_A = 0 and U_B = 9. Only two of the 20 group assignments are equally extreme: two-sided exact p = .10. Complete separation in a tiny sample does not guarantee p < .05.'}</p>
        <button type="button" onClick={onExample} className="rounded-xl bg-indigo-600 px-4 py-3 font-bold text-white">Try the worked example</button>
        <p>Inspect the rank table and effect estimate alongside p. The calculator supports two-sided and directional alternatives, exact conditional inference for small samples, and a tie-adjusted normal approximation for larger samples.</p>
    </section>;
}
