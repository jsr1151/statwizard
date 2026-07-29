export const TWO_BY_TWO_FACTORS = {
    factorA: {
        label: 'Factor A',
        levels: [
            { id: 'a1', label: 'A1' },
            { id: 'a2', label: 'A2' },
        ],
    },
    factorB: {
        label: 'Factor B',
        levels: [
            { id: 'b1', label: 'B1' },
            { id: 'b2', label: 'B2' },
        ],
    },
};

export const FACTORIAL_ANOVA_FIXTURES = {
    balancedTwoByTwo: {
        source: 'Hand-verifiable balanced decomposition; Type I and Type III must coincide.',
        cellData: {
            a1_b1: { values: [8, 9, 7], inputMode: 'raw' },
            a1_b2: { values: [12, 11, 13], inputMode: 'raw' },
            a2_b1: { values: [10, 11, 9], inputMode: 'raw' },
            a2_b2: { values: [6, 7, 5], inputMode: 'raw' },
        },
        expected: {
            totalN: 12,
            ssA: 12,
            ssB: 0,
            ssAxB: 48,
            ssError: 8,
            ssTotal: 68,
            fA: 12,
            fB: 0,
            fAxB: 48,
        },
    },
    balancedTwoByThree: {
        source: 'Hand-verifiable additive 2×3 design with equal cell sizes and no interaction.',
        factorA: TWO_BY_TWO_FACTORS.factorA,
        factorB: {
            label: 'Factor B',
            levels: [
                { id: 'b1', label: 'B1' },
                { id: 'b2', label: 'B2' },
                { id: 'b3', label: 'B3' },
            ],
        },
        cellData: {
            a1_b1: { inputMode: 'summary', summary: { n: 4, mean: 10, sd: 2 } },
            a1_b2: { inputMode: 'summary', summary: { n: 4, mean: 12, sd: 2 } },
            a1_b3: { inputMode: 'summary', summary: { n: 4, mean: 14, sd: 2 } },
            a2_b1: { inputMode: 'summary', summary: { n: 4, mean: 15, sd: 2 } },
            a2_b2: { inputMode: 'summary', summary: { n: 4, mean: 17, sd: 2 } },
            a2_b3: { inputMode: 'summary', summary: { n: 4, mean: 19, sd: 2 } },
        },
        expected: {
            totalN: 24,
            ssA: 150,
            ssB: 64,
            ssAxB: 0,
            ssError: 72,
            ssTotal: 286,
            fA: 37.5,
            fB: 8,
            fAxB: 0,
        },
    },
    unbalancedTwoByTwo: {
        source: 'Type III 2×2 marginal-mean contrasts, independently checkable from cell means and n.',
        cellData: {
            a1_b1: { inputMode: 'summary', summary: { n: 3, mean: 10, sd: 2 } },
            a1_b2: { inputMode: 'summary', summary: { n: 4, mean: 14, sd: 2 } },
            a2_b1: { inputMode: 'summary', summary: { n: 5, mean: 13, sd: 2 } },
            a2_b2: { inputMode: 'summary', summary: { n: 6, mean: 20, sd: 2 } },
        },
        expectedTypeIII: {
            ssA: 85.26315789473684,
            ssB: 127.36842105263158,
            ssAxB: 9.473684210526315,
            ssError: 56,
            fA: 21.31578947368421,
            fB: 31.842105263157894,
            fAxB: 2.3684210526315788,
        },
        expectedTypeI: {
            ssA: 87.8795093795094,
            ssB: 151.5912508544087,
            ssAxB: 9.473684210526315,
        },
    },
};

export const SCIPY_BROWN_FORSYTHE_FIXTURE = {
    source: 'https://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.levene.html',
    groups: [
        [8.88, 9.12, 9.04, 8.98, 9.00, 9.08, 9.01, 8.85, 9.06, 8.99],
        [8.88, 8.95, 9.29, 9.44, 9.15, 9.58, 8.36, 9.18, 8.67, 9.05],
        [8.95, 9.12, 8.95, 8.85, 9.03, 8.84, 9.07, 8.98, 8.86, 8.98],
    ],
    expected: {
        p: 0.002431505967249681,
        df1: 2,
        df2: 27,
    },
};
