export const METHOD_AVAILABILITY = {
    res_rm_anova: {
        summary: 'Repeated observations must be matched by participant. A repeated-measures model separates participant differences from the within-participant error used to test the condition effect.',
        limitation: 'An on-site repeated-measures calculator is not available. Ordinary independent-groups ANOVA does not account for the pairing and must not be used as a substitute.',
        checklist: ['Keep a participant identifier and preserve the same row order across conditions.', 'Check the repeated-measures error structure and sphericity; report an appropriate correction when needed.', 'State how incomplete participants were handled.'],
    },
    res_mann_whitney: {
        summary: 'Mann–Whitney compares two independent samples using pooled ranks. Interpreting it specifically as a location or median difference requires additional distributional assumptions.',
        limitation: 'An on-site Mann–Whitney calculator is not available. Use the software guide below to run the rank-sum test.',
        checklist: ['Use independent observations from two groups.', 'Review distribution shapes before interpreting the result as a difference in location.', 'Report ties and the exact or approximate inference method used.'],
    },
    res_wilcoxon: {
        summary: 'Wilcoxon signed-rank analyzes paired differences. It ranks the absolute nonzero differences and uses their signs; it is distinct from the independent-samples rank-sum test.',
        limitation: 'An on-site signed-rank calculator is not available. Use the paired software instructions below.',
        checklist: ['Match each observation to its partner before calculating differences.', 'Check symmetry of the distribution of paired differences.', 'Handle missing pairs, zero differences, and ties explicitly.'],
    },
    res_unsupported_design: {
        summary: 'This design falls outside the calculators currently supported by this wizard.',
        limitation: 'No test has been selected. A method for a different data type or study design would not be an appropriate substitute.',
        checklist: ['Identify whether each variable is quantitative, ordinal, categorical, binary, or a count.', 'Record whether observations are independent, paired, or clustered.', 'Use software and guidance that explicitly support your outcome type and design.'],
    },
};
