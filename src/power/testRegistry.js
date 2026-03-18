import { solveOneSampleZPower } from './solvers/oneSampleZ';

const ALL_GPOWER_MODES = ['a_priori', 'post_hoc', 'sensitivity', 'compromise', 'criterion'];

const buildZDefaults = (stats = {}, mode = 'a_priori') => {
    const meanDifference = Math.abs((stats?.xBar ?? 0) - (stats?.mu ?? 0));
    const sigma = Math.abs(stats?.sigma ?? 1) || 1;
    const effectSize = meanDifference > 0 ? meanDifference / sigma : 0.5;
    const sampleSize = Math.max(2, Math.round(stats?.n ?? 30));

    return {
        mode,
        alpha: 0.05,
        tails: 2,
        direction: 'greater',
        powerTarget: 0.8,
        effectSize: Number(effectSize.toFixed(3)),
        sampleSize,
    };
};

const oneSampleZEffectTransform = {
    primaryMetricLabel: "Cohen's d",
    description: 'For the one-sample z test, the standardized effect is the mean difference divided by the known population SD.',
    fields: [
        {
            id: 'meanDifference',
            label: 'Mean Difference',
            type: 'number',
            step: 0.1,
            min: 0,
        },
        {
            id: 'sigma',
            label: 'Known Population SD',
            type: 'number',
            step: 0.1,
            min: 0.01,
        },
    ],
    fromStats: (stats = {}) => ({
        meanDifference: Number(Math.abs((stats?.xBar ?? 0) - (stats?.mu ?? 0)).toFixed(3)),
        sigma: Number(Math.abs(stats?.sigma ?? 1).toFixed(3)),
    }),
    compute: ({ meanDifference, sigma }) => {
        const diff = Number(meanDifference);
        const knownSigma = Number(sigma);

        if (!(knownSigma > 0)) {
            return {
                ok: false,
                error: 'Known population SD must be greater than 0.',
            };
        }

        const effectSize = diff / knownSigma;
        return {
            ok: true,
            effectSize,
            metricLabel: "Cohen's d",
            summary: `d = diff / sigma = ${effectSize.toFixed(4)}`,
            support: [
                {
                    label: 'Mean Difference',
                    value: diff.toFixed(4),
                },
                {
                    label: 'Known Population SD',
                    value: knownSigma.toFixed(4),
                },
            ],
        };
    },
};

const createPlannedTest = ({ id, family, slug, label, stepId, gpowerTest }) => ({
    id,
    family,
    slug,
    label,
    stepId,
    power: {
        status: 'planned',
        gpowerFamily: family === 'anova' ? 'F tests' : 't tests',
        gpowerTest,
        supportedPowerModes: ALL_GPOWER_MODES,
        implementedPowerModes: [],
        availableVisualizerModes: ['test', 'power', 'curve'],
        effectSizeTransforms: {
            primaryMetricLabel: 'Planned',
            description: 'This test is registered in the shared architecture, and its effect-size helper will land in a later slice.',
        },
        buildInitialInputs: (_stats, mode) => ({
            mode,
            alpha: 0.05,
            tails: 2,
            direction: 'greater',
            powerTarget: 0.8,
            effectSize: 0.5,
            sampleSize: 30,
        }),
    },
});

export const POWER_TEST_REGISTRY = [
    {
        id: 'one_sample_z',
        family: 'z_tests',
        slug: 'one-sample-z',
        label: 'One-Sample Z-Test',
        stepId: 'res_ztest',
        power: {
            status: 'available',
            gpowerFamily: 'z tests',
            gpowerTest: 'Means: Difference from constant (known sigma)',
            supportedPowerModes: ALL_GPOWER_MODES,
            implementedPowerModes: ['a_priori', 'post_hoc', 'sensitivity'],
            defaultPowerMode: 'a_priori',
            inputSchema: {
                a_priori: [
                    {
                        id: 'tails',
                        label: 'Tails',
                        type: 'select',
                        options: [
                            { label: 'Two-Tailed', value: 2 },
                            { label: 'One-Tailed', value: 1 },
                        ],
                    },
                    {
                        id: 'direction',
                        label: 'Direction',
                        type: 'select',
                        hidden: (inputs) => Number(inputs?.tails) !== 1,
                        options: [
                            { label: 'Greater Than', value: 'greater' },
                            { label: 'Less Than', value: 'less' },
                        ],
                    },
                    {
                        id: 'alpha',
                        label: 'Alpha',
                        type: 'number',
                        step: 0.01,
                        min: 0.001,
                        max: 0.2,
                    },
                    {
                        id: 'powerTarget',
                        label: 'Target Power',
                        type: 'number',
                        step: 0.01,
                        min: 0.5,
                        max: 0.999,
                    },
                    {
                        id: 'effectSize',
                        label: "Effect Size (d)",
                        type: 'number',
                        step: 0.01,
                        min: 0.01,
                        max: 3,
                    },
                ],
                post_hoc: [
                    {
                        id: 'tails',
                        label: 'Tails',
                        type: 'select',
                        options: [
                            { label: 'Two-Tailed', value: 2 },
                            { label: 'One-Tailed', value: 1 },
                        ],
                    },
                    {
                        id: 'direction',
                        label: 'Direction',
                        type: 'select',
                        hidden: (inputs) => Number(inputs?.tails) !== 1,
                        options: [
                            { label: 'Greater Than', value: 'greater' },
                            { label: 'Less Than', value: 'less' },
                        ],
                    },
                    {
                        id: 'alpha',
                        label: 'Alpha',
                        type: 'number',
                        step: 0.01,
                        min: 0.001,
                        max: 0.2,
                    },
                    {
                        id: 'sampleSize',
                        label: 'Total N',
                        type: 'number',
                        step: 1,
                        min: 2,
                        max: 100000,
                    },
                    {
                        id: 'effectSize',
                        label: "Effect Size (d)",
                        type: 'number',
                        step: 0.01,
                        min: 0.01,
                        max: 3,
                    },
                ],
                sensitivity: [
                    {
                        id: 'tails',
                        label: 'Tails',
                        type: 'select',
                        options: [
                            { label: 'Two-Tailed', value: 2 },
                            { label: 'One-Tailed', value: 1 },
                        ],
                    },
                    {
                        id: 'direction',
                        label: 'Direction',
                        type: 'select',
                        hidden: (inputs) => Number(inputs?.tails) !== 1,
                        options: [
                            { label: 'Greater Than', value: 'greater' },
                            { label: 'Less Than', value: 'less' },
                        ],
                    },
                    {
                        id: 'alpha',
                        label: 'Alpha',
                        type: 'number',
                        step: 0.01,
                        min: 0.001,
                        max: 0.2,
                    },
                    {
                        id: 'sampleSize',
                        label: 'Total N',
                        type: 'number',
                        step: 1,
                        min: 2,
                        max: 100000,
                    },
                    {
                        id: 'powerTarget',
                        label: 'Target Power',
                        type: 'number',
                        step: 0.01,
                        min: 0.5,
                        max: 0.999,
                    },
                ],
            },
            effectSizeTransforms: oneSampleZEffectTransform,
            solver: solveOneSampleZPower,
            availableVisualizerModes: ['test', 'power'],
            buildInitialInputs: buildZDefaults,
        },
    },
    createPlannedTest({
        id: 'one_sample_t',
        family: 't_tests',
        slug: 'one-sample-t',
        label: 'One-Sample T-Test',
        stepId: 'res_onesample_ttest',
        gpowerTest: 'Means: Difference from constant (one sample case)',
    }),
    createPlannedTest({
        id: 'paired_t',
        family: 't_tests',
        slug: 'paired-t',
        label: 'Paired Samples T-Test',
        stepId: 'res_paired_ttest',
        gpowerTest: 'Means: Difference between two dependent means (matched pairs)',
    }),
    createPlannedTest({
        id: 'independent_t',
        family: 't_tests',
        slug: 'independent-samples-t',
        label: 'Independent Samples T-Test',
        stepId: 'res_indep_ttest',
        gpowerTest: 'Means: Difference between two independent means (two groups)',
    }),
    createPlannedTest({
        id: 'one_way_anova',
        family: 'anova',
        slug: 'one-way-anova',
        label: 'One-Way ANOVA',
        stepId: 'res_one_way_anova',
        gpowerTest: 'ANOVA: Fixed effects, omnibus, one-way',
    }),
    createPlannedTest({
        id: 'ancova',
        family: 'anova',
        slug: 'ancova',
        label: 'ANCOVA',
        stepId: 'res_ancova',
        gpowerTest: 'ANCOVA: Fixed effects, main effects and interactions',
    }),
];

export const POWER_TEST_BY_STEP_ID = Object.fromEntries(
    POWER_TEST_REGISTRY.map((test) => [test.stepId, test])
);
