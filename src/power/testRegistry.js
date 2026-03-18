import { solveOneSampleZPower } from './solvers/oneSampleZ.js';
import { solveOneSampleTPower } from './solvers/oneSampleT.js';
import { solvePairedTPower } from './solvers/pairedT.js';
import { solveIndependentTPower } from './solvers/independentT.js';

const ALL_GPOWER_MODES = ['a_priori', 'post_hoc', 'sensitivity', 'compromise', 'criterion'];

const buildTailFields = () => ([
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
]);

const pooledSDFromIndependentStats = (stats = {}) => {
    if (Number.isFinite(stats?.pooledVar) && stats.pooledVar > 0) {
        return Math.sqrt(stats.pooledVar);
    }

    const n1 = Number(stats?.n1);
    const n2 = Number(stats?.n2);
    const s1 = Math.abs(Number(stats?.s1));
    const s2 = Math.abs(Number(stats?.s2));

    if (n1 > 1 && n2 > 1 && s1 > 0 && s2 > 0) {
        const numerator = ((n1 - 1) * (s1 ** 2)) + ((n2 - 1) * (s2 ** 2));
        const denominator = n1 + n2 - 2;
        if (denominator > 0) {
            return Math.sqrt(numerator / denominator);
        }
    }

    if (s1 > 0 && s2 > 0) {
        return Math.sqrt(((s1 ** 2) + (s2 ** 2)) / 2);
    }

    return 1;
};

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

const buildOneSampleTDefaults = (stats = {}, mode = 'a_priori') => {
    const meanDifference = Math.abs((stats?.xBar ?? 0) - (stats?.mu ?? 0));
    const sampleSD = Math.abs(stats?.s ?? stats?.sigma ?? 1) || 1;
    const effectSize = meanDifference > 0 ? meanDifference / sampleSD : 0.5;
    const sampleSize = Math.max(2, Math.round(stats?.n ?? 30));
    const signedDifference = (stats?.xBar ?? 0) - (stats?.mu ?? 0);

    return {
        mode,
        alpha: 0.05,
        tails: 2,
        direction: signedDifference < 0 ? 'less' : 'greater',
        powerTarget: 0.8,
        effectSize: Number(effectSize.toFixed(3)),
        sampleSize,
    };
};

const buildIndependentTDefaults = (stats = {}, mode = 'a_priori') => {
    const group1SampleSize = Math.max(2, Math.round(stats?.n1 ?? 30));
    const group2SampleSize = Math.max(2, Math.round(stats?.n2 ?? 30));
    const pooledSD = pooledSDFromIndependentStats(stats);
    const meanDifference = Math.abs(stats?.delta ?? ((stats?.x1 ?? 0) - (stats?.x2 ?? 0)));
    const effectSize = Math.abs(stats?.d ?? (pooledSD > 0 ? meanDifference / pooledSD : 0.5)) || 0.5;
    const direction = (stats?.delta ?? ((stats?.x1 ?? 0) - (stats?.x2 ?? 0))) < 0 ? 'less' : 'greater';

    return {
        mode,
        alpha: 0.05,
        tails: 2,
        direction,
        powerTarget: 0.8,
        effectSize: Number(effectSize.toFixed(3)),
        group1SampleSize,
        group2SampleSize,
        sampleSize: group1SampleSize + group2SampleSize,
        allocationRatio: Number((group2SampleSize / group1SampleSize).toFixed(3)),
    };
};

const buildPairedTDefaults = (stats = {}, mode = 'a_priori') => {
    const meanDifference = Math.abs(stats?.dBar ?? stats?.delta ?? 0);
    const pairedDifferenceSD = Math.abs(stats?.sd ?? stats?.sd_diff ?? 1) || 1;
    const effectSize = Math.abs(stats?.dz ?? (pairedDifferenceSD > 0 ? meanDifference / pairedDifferenceSD : 0.5)) || 0.5;
    const sampleSize = Math.max(2, Math.round(stats?.n ?? stats?.n_pairs ?? 30));
    const signedDifference = stats?.dBar ?? stats?.delta ?? 0;

    return {
        mode,
        alpha: 0.05,
        tails: 2,
        direction: signedDifference < 0 ? 'less' : 'greater',
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

const oneSampleTEffectTransform = {
    primaryMetricLabel: "Cohen's d",
    description: "For the one-sample t test, Cohen's d is the mean difference divided by the sample SD used to estimate variability.",
    fields: [
        {
            id: 'meanDifference',
            label: 'Mean Difference',
            type: 'number',
            step: 0.1,
            min: 0,
        },
        {
            id: 'sampleSD',
            label: 'Sample SD',
            type: 'number',
            step: 0.1,
            min: 0.01,
        },
    ],
    fromStats: (stats = {}) => ({
        meanDifference: Number(Math.abs((stats?.xBar ?? 0) - (stats?.mu ?? 0)).toFixed(3)),
        sampleSD: Number(Math.abs(stats?.s ?? stats?.sigma ?? 1).toFixed(3)),
    }),
    compute: ({ meanDifference, sampleSD }) => {
        const diff = Number(meanDifference);
        const sd = Number(sampleSD);

        if (!(sd > 0)) {
            return {
                ok: false,
                error: 'Sample SD must be greater than 0.',
            };
        }

        const effectSize = diff / sd;
        return {
            ok: true,
            effectSize,
            metricLabel: "Cohen's d",
            summary: `d = diff / sample SD = ${effectSize.toFixed(4)}`,
            support: [
                {
                    label: 'Mean Difference',
                    value: diff.toFixed(4),
                },
                {
                    label: 'Sample SD',
                    value: sd.toFixed(4),
                },
            ],
        };
    },
};

const independentTEffectTransform = {
    primaryMetricLabel: "Cohen's d",
    description: "For the independent-samples t test, Cohen's d is the mean difference divided by the pooled within-group SD.",
    fields: [
        {
            id: 'meanDifference',
            label: 'Mean Difference',
            type: 'number',
            step: 0.1,
            min: 0,
        },
        {
            id: 'pooledSD',
            label: 'Pooled SD',
            type: 'number',
            step: 0.1,
            min: 0.01,
        },
    ],
    fromStats: (stats = {}) => ({
        meanDifference: Number(Math.abs(stats?.delta ?? ((stats?.x1 ?? 0) - (stats?.x2 ?? 0))).toFixed(3)),
        pooledSD: Number(pooledSDFromIndependentStats(stats).toFixed(3)),
    }),
    compute: ({ meanDifference, pooledSD }) => {
        const diff = Number(meanDifference);
        const pooled = Number(pooledSD);

        if (!(pooled > 0)) {
            return {
                ok: false,
                error: 'Pooled SD must be greater than 0.',
            };
        }

        const effectSize = diff / pooled;
        return {
            ok: true,
            effectSize,
            metricLabel: "Cohen's d",
            summary: `d = diff / pooled SD = ${effectSize.toFixed(4)}`,
            support: [
                {
                    label: 'Mean Difference',
                    value: diff.toFixed(4),
                },
                {
                    label: 'Pooled SD',
                    value: pooled.toFixed(4),
                },
            ],
        };
    },
};

const pairedTEffectTransform = {
    primaryMetricLabel: "Cohen's d_z",
    description: 'For a paired-samples t test, d_z is the mean paired difference divided by the SD of the paired differences.',
    fields: [
        {
            id: 'meanDifference',
            label: 'Mean Paired Difference',
            type: 'number',
            step: 0.1,
            min: 0,
        },
        {
            id: 'pairedDifferenceSD',
            label: 'SD of Paired Differences',
            type: 'number',
            step: 0.1,
            min: 0.01,
        },
    ],
    fromStats: (stats = {}) => ({
        meanDifference: Number(Math.abs(stats?.dBar ?? stats?.delta ?? 0).toFixed(3)),
        pairedDifferenceSD: Number(Math.abs(stats?.sd ?? stats?.sd_diff ?? 1).toFixed(3)),
    }),
    compute: ({ meanDifference, pairedDifferenceSD }) => {
        const diff = Number(meanDifference);
        const sd = Number(pairedDifferenceSD);

        if (!(sd > 0)) {
            return {
                ok: false,
                error: 'The SD of the paired differences must be greater than 0.',
            };
        }

        const effectSize = diff / sd;
        return {
            ok: true,
            effectSize,
            metricLabel: "Cohen's d_z",
            summary: `d_z = mean paired difference / SD of paired differences = ${effectSize.toFixed(4)}`,
            support: [
                {
                    label: 'Mean Paired Difference',
                    value: diff.toFixed(4),
                },
                {
                    label: 'SD of Paired Differences',
                    value: sd.toFixed(4),
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
                    ...buildTailFields(),
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
                    ...buildTailFields(),
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
                    ...buildTailFields(),
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
    {
        id: 'one_sample_t',
        family: 't_tests',
        slug: 'one-sample-t',
        label: 'One-Sample T-Test',
        stepId: 'res_onesample_ttest',
        power: {
            status: 'available',
            gpowerFamily: 't tests',
            gpowerTest: 'Means: Difference from constant (one sample case)',
            supportedPowerModes: ALL_GPOWER_MODES,
            implementedPowerModes: ['a_priori', 'post_hoc', 'sensitivity'],
            defaultPowerMode: 'a_priori',
            inputSchema: {
                a_priori: [
                    ...buildTailFields(),
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
                    ...buildTailFields(),
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
                    ...buildTailFields(),
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
            effectSizeTransforms: oneSampleTEffectTransform,
            solver: solveOneSampleTPower,
            availableVisualizerModes: ['test', 'power'],
            buildInitialInputs: buildOneSampleTDefaults,
        },
    },
    {
        id: 'paired_t',
        family: 't_tests',
        slug: 'paired-t',
        label: 'Paired Samples T-Test',
        stepId: 'res_paired_ttest',
        power: {
            status: 'available',
            gpowerFamily: 't tests',
            gpowerTest: 'Means: Difference between two dependent means (matched pairs)',
            supportedPowerModes: ALL_GPOWER_MODES,
            implementedPowerModes: ['a_priori', 'post_hoc', 'sensitivity'],
            defaultPowerMode: 'a_priori',
            inputSchema: {
                a_priori: [
                    ...buildTailFields(),
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
                        label: 'Effect Size (d_z)',
                        type: 'number',
                        step: 0.01,
                        min: 0.01,
                        max: 3,
                    },
                ],
                post_hoc: [
                    ...buildTailFields(),
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
                        label: 'Paired N (participants with both measurements)',
                        type: 'number',
                        step: 1,
                        min: 2,
                        max: 100000,
                        helperText: 'N is the number of paired observations or participants who have both measurements, not the total count of raw scores across two time points or conditions.',
                    },
                    {
                        id: 'effectSize',
                        label: 'Effect Size (d_z)',
                        type: 'number',
                        step: 0.01,
                        min: 0.01,
                        max: 3,
                    },
                ],
                sensitivity: [
                    ...buildTailFields(),
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
                        label: 'Paired N (participants with both measurements)',
                        type: 'number',
                        step: 1,
                        min: 2,
                        max: 100000,
                        helperText: 'N is the number of paired observations or participants who have both measurements, not the total count of raw scores across two time points or conditions.',
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
            effectSizeTransforms: pairedTEffectTransform,
            solver: solvePairedTPower,
            availableVisualizerModes: ['test', 'power'],
            buildInitialInputs: buildPairedTDefaults,
        },
    },
    {
        id: 'independent_t',
        family: 't_tests',
        slug: 'independent-samples-t',
        label: 'Independent Samples T-Test',
        stepId: 'res_indep_ttest',
        power: {
            status: 'available',
            gpowerFamily: 't tests',
            gpowerTest: 'Means: Difference between two independent means (two groups)',
            supportedPowerModes: ALL_GPOWER_MODES,
            implementedPowerModes: ['a_priori', 'post_hoc', 'sensitivity'],
            defaultPowerMode: 'a_priori',
            inputSchema: {
                a_priori: [
                    ...buildTailFields(),
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
                    {
                        id: 'allocationRatio',
                        label: 'Allocation Ratio (Group 2 / Group 1)',
                        type: 'number',
                        step: 0.1,
                        min: 0.05,
                        max: 20,
                        helperText: '1.0 means equal group sizes. 2.0 means Group 2 is twice as large as Group 1. In most cases, 1.0 is recommended.',
                    },
                ],
                post_hoc: [
                    ...buildTailFields(),
                    {
                        id: 'alpha',
                        label: 'Alpha',
                        type: 'number',
                        step: 0.01,
                        min: 0.001,
                        max: 0.2,
                    },
                    {
                        id: 'group1SampleSize',
                        label: 'Group 1 N',
                        type: 'number',
                        step: 1,
                        min: 2,
                        max: 100000,
                    },
                    {
                        id: 'group2SampleSize',
                        label: 'Group 2 N',
                        type: 'number',
                        step: 1,
                        min: 2,
                        max: 100000,
                        helperText: 'Enter the actual or planned group sizes directly here. Total N and the allocation ratio are derived automatically.',
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
                    ...buildTailFields(),
                    {
                        id: 'alpha',
                        label: 'Alpha',
                        type: 'number',
                        step: 0.01,
                        min: 0.001,
                        max: 0.2,
                    },
                    {
                        id: 'group1SampleSize',
                        label: 'Group 1 N',
                        type: 'number',
                        step: 1,
                        min: 2,
                        max: 100000,
                    },
                    {
                        id: 'group2SampleSize',
                        label: 'Group 2 N',
                        type: 'number',
                        step: 1,
                        min: 2,
                        max: 100000,
                        helperText: 'Enter the actual or planned group sizes directly here. Total N and the allocation ratio are derived automatically.',
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
            effectSizeTransforms: independentTEffectTransform,
            solver: solveIndependentTPower,
            availableVisualizerModes: ['test', 'power'],
            buildInitialInputs: buildIndependentTDefaults,
        },
    },
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
