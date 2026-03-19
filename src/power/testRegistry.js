import { solveOneSampleZPower } from './solvers/oneSampleZ.js';
import { solveOneSampleTPower } from './solvers/oneSampleT.js';
import { solvePairedTPower } from './solvers/pairedT.js';
import { solveIndependentTPower } from './solvers/independentT.js';
import { solveOneWayAnovaPower } from './solvers/oneWayAnova.js';
import { solveAncovaPower } from './solvers/ancova.js';
import {
    buildPearsonCorrelationCurveModel,
    solvePearsonCorrelationPower,
} from './solvers/pearsonCorrelation.js';

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

const POWER_ASSUMPTION_NOTES = {
    oneSampleZ: 'Known population sigma is assumed. N is the total number of observations in one sample, and this planning view stays focused on effect size, alpha, and power rather than observed-test output.',
    oneSampleT: 'N is the total number of observations in one sample. This planning view uses Cohen\'s d for the standardized mean difference and stays separate from the observed-data calculator.',
    pairedT: 'Paired N means the number of paired observations or participants with both measurements, not the total number of raw scores across two occasions or conditions.',
    independentT: 'A Priori planning uses an allocation ratio to describe the intended group-size split. Post Hoc and Sensitivity use direct Group 1 and Group 2 sample sizes.',
    oneWayAnova: 'This first one-way ANOVA slice assumes balanced groups. Total N is interpreted as an even split across groups, and per-group N is shown as approximate when integer rounding prevents an exact balance.',
    ancova: 'This first ANCOVA slice models the adjusted group main effect only, with balanced groups, fixed continuous covariates, and common slopes across groups.',
    pearsonCorrelation: 'This first Pearson correlation power slice plans against a constant ρ₀ using the Fisher z approximation. The Power tab stays planning-oriented and separate from the observed-data calculator.',
};

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

const etaSquaredToCohensF = (etaSquared) => {
    const eta2 = Number(etaSquared);

    if (!(eta2 >= 0) || !(eta2 < 1)) {
        return null;
    }

    return Math.sqrt(eta2 / Math.max(1e-12, 1 - eta2));
};

const cohensFToEtaSquared = (effectSize) => {
    const f = Math.abs(Number(effectSize));
    const fSquared = f ** 2;
    return fSquared / (1 + fSquared);
};

const buildOneWayAnovaDefaults = (stats = {}, mode = 'a_priori') => {
    const groupCount = Math.max(2, Math.round(stats?.k ?? 3));
    const sampleSize = Math.max(groupCount * 2, Math.round(stats?.N ?? (groupCount * 20)));
    const etaSquared = Number(stats?.eta2);
    const effectSizeFromStats = etaSquaredToCohensF(etaSquared);
    const effectSize = effectSizeFromStats > 0 ? effectSizeFromStats : 0.25;

    return {
        mode,
        alpha: 0.05,
        powerTarget: 0.8,
        effectSize: Number(effectSize.toFixed(3)),
        groupCount,
        sampleSize,
    };
};

const buildAncovaDefaults = (stats = {}, mode = 'a_priori') => {
    const groupCount = Math.max(2, Math.round(stats?.k ?? 3));
    const covariateCount = Math.max(0, Math.round(stats?.dfCov ?? 1));
    const sampleSize = Math.max(groupCount * 2, Math.round(stats?.nTotal ?? stats?.N ?? (groupCount * 20)));
    const partialEtaSquared = Number(stats?.pes_grp);
    const effectSizeFromStats = etaSquaredToCohensF(partialEtaSquared);
    const effectSize = effectSizeFromStats > 0 ? effectSizeFromStats : 0.25;

    return {
        mode,
        alpha: 0.05,
        powerTarget: 0.8,
        effectSize: Number(effectSize.toFixed(3)),
        groupCount,
        covariateCount,
        sampleSize,
    };
};

const buildPearsonCorrelationDefaults = (stats = {}, mode = 'a_priori') => {
    const effectSize = Number.isFinite(Number(stats?.r))
        ? Number(stats.r)
        : 0.3;
    const sampleSize = Math.max(4, Math.round(stats?.n ?? 40));
    const direction = effectSize < 0 ? 'less' : 'greater';

    return {
        mode,
        alpha: 0.05,
        tails: 2,
        direction,
        powerTarget: 0.8,
        effectSize: Number(effectSize.toFixed(3)),
        nullCorrelation: Number((Number(stats?.rho0) || 0).toFixed(3)),
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

const oneWayAnovaEffectTransform = {
    primaryMetricLabel: "Cohen's f",
    description: "For a one-way ANOVA, Cohen's f is the omnibus effect size derived from the share of variance explained across the groups.",
    fields: [
        {
            id: 'etaSquared',
            label: 'Eta Squared (eta^2)',
            type: 'number',
            step: 0.001,
            min: 0,
            max: 0.999,
        },
    ],
    fromStats: (stats = {}) => ({
        etaSquared: Number((Number.isFinite(Number(stats?.eta2)) ? Number(stats.eta2) : cohensFToEtaSquared(0.25)).toFixed(3)),
    }),
    compute: ({ etaSquared }) => {
        const eta2 = Number(etaSquared);

        if (!(eta2 >= 0) || !(eta2 < 1)) {
            return {
                ok: false,
                error: 'Eta squared must be between 0 and 1.',
            };
        }

        const effectSize = etaSquaredToCohensF(eta2);
        return {
            ok: true,
            effectSize,
            metricLabel: "Cohen's f",
            summary: `f = sqrt(eta^2 / (1 - eta^2)) = ${effectSize.toFixed(4)}`,
            support: [
                {
                    label: 'Eta Squared',
                    value: eta2.toFixed(4),
                },
            ],
        };
    },
};

const ancovaEffectTransform = {
    primaryMetricLabel: "Cohen's f",
    description: "For this first ANCOVA slice, Cohen's f refers to the adjusted group effect after controlling for the covariates in a fixed-effects ANCOVA model.",
    fields: [
        {
            id: 'partialEtaSquared',
            label: 'Partial Eta Squared (Group Effect)',
            type: 'number',
            step: 0.001,
            min: 0,
            max: 0.999,
        },
    ],
    fromStats: (stats = {}) => ({
        partialEtaSquared: Number((Number.isFinite(Number(stats?.pes_grp)) ? Number(stats.pes_grp) : cohensFToEtaSquared(0.25)).toFixed(3)),
    }),
    compute: ({ partialEtaSquared }) => {
        const eta2 = Number(partialEtaSquared);

        if (!(eta2 >= 0) || !(eta2 < 1)) {
            return {
                ok: false,
                error: 'Partial eta squared must be between 0 and 1.',
            };
        }

        const effectSize = etaSquaredToCohensF(eta2);
        return {
            ok: true,
            effectSize,
            metricLabel: "Cohen's f",
            summary: `f = sqrt(partial eta^2 / (1 - partial eta^2)) = ${effectSize.toFixed(4)}`,
            support: [
                {
                    label: 'Partial Eta Squared',
                    value: eta2.toFixed(4),
                },
            ],
        };
    },
};

const pearsonCorrelationEffectTransform = {
    primaryMetricLabel: 'Correlation Effect Size (r / r²)',
    description: 'For Pearson correlation, the observed effect size is r. r² reframes the same result as shared linear variance.',
    fields: [
        {
            id: 'rValue',
            label: 'Sample Correlation (r)',
            type: 'number',
            step: 0.01,
            min: -0.999,
            max: 0.999,
        },
    ],
    fromStats: (stats = {}) => ({
        rValue: Number((Number.isFinite(Number(stats?.r)) ? Number(stats.r) : 0.3).toFixed(3)),
    }),
    compute: ({ rValue }) => {
        const r = Number(rValue);

        if (!(r > -1) || !(r < 1)) {
            return {
                ok: false,
                error: 'r must stay between -1 and 1.',
            };
        }

        const rSquared = r ** 2;
        return {
            ok: true,
            effectSize: r,
            metricLabel: 'Sample Correlation (r)',
            summary: `r² = ${rSquared.toFixed(4)} (${(rSquared * 100).toFixed(1)}% shared linear variance)`,
            support: [
                {
                    label: 'Sample Correlation (r)',
                    value: r.toFixed(4),
                },
                {
                    label: 'Variance Explained (r²)',
                    value: rSquared.toFixed(4),
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
            assumptionNote: POWER_ASSUMPTION_NOTES.oneSampleZ,
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
            assumptionNote: POWER_ASSUMPTION_NOTES.oneSampleT,
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
            assumptionNote: POWER_ASSUMPTION_NOTES.pairedT,
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
            assumptionNote: POWER_ASSUMPTION_NOTES.independentT,
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
    {
        id: 'one_way_anova',
        family: 'anova',
        slug: 'one-way-anova',
        label: 'One-Way ANOVA',
        stepId: 'res_one_way_anova',
        power: {
            status: 'available',
            gpowerFamily: 'F tests',
            gpowerTest: 'ANOVA: Fixed effects, omnibus, one-way',
            assumptionNote: POWER_ASSUMPTION_NOTES.oneWayAnova,
            supportedPowerModes: ALL_GPOWER_MODES,
            implementedPowerModes: ['a_priori', 'post_hoc', 'sensitivity'],
            defaultPowerMode: 'a_priori',
            inputSchema: {
                a_priori: [
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
                        label: "Effect Size (f)",
                        type: 'number',
                        step: 0.01,
                        min: 0.01,
                        max: 3,
                        helperText: "Cohen's f is the omnibus ANOVA effect size. Rough anchors are 0.10 small, 0.25 medium, and 0.40 large.",
                    },
                    {
                        id: 'groupCount',
                        label: 'Number of Groups',
                        type: 'number',
                        step: 1,
                        min: 2,
                        max: 100,
                        helperText: 'This first one-way ANOVA power slice assumes balanced groups. Enter the number of independent groups or levels being compared.',
                    },
                ],
                post_hoc: [
                    {
                        id: 'alpha',
                        label: 'Alpha',
                        type: 'number',
                        step: 0.01,
                        min: 0.001,
                        max: 0.2,
                    },
                    {
                        id: 'groupCount',
                        label: 'Number of Groups',
                        type: 'number',
                        step: 1,
                        min: 2,
                        max: 100,
                        helperText: 'This first one-way ANOVA power slice assumes balanced groups across these independent groups or levels.',
                    },
                    {
                        id: 'sampleSize',
                        label: 'Total N',
                        type: 'number',
                        step: 1,
                        min: 4,
                        max: 100000,
                        helperText: 'Total N is interpreted as evenly split across groups. If it is not divisible by the group count, the per-group N shown in the results is an approximate balanced average.',
                    },
                    {
                        id: 'effectSize',
                        label: "Effect Size (f)",
                        type: 'number',
                        step: 0.01,
                        min: 0.01,
                        max: 3,
                        helperText: "Cohen's f is the omnibus ANOVA effect size. Rough anchors are 0.10 small, 0.25 medium, and 0.40 large.",
                    },
                ],
                sensitivity: [
                    {
                        id: 'alpha',
                        label: 'Alpha',
                        type: 'number',
                        step: 0.01,
                        min: 0.001,
                        max: 0.2,
                    },
                    {
                        id: 'groupCount',
                        label: 'Number of Groups',
                        type: 'number',
                        step: 1,
                        min: 2,
                        max: 100,
                        helperText: 'This first one-way ANOVA power slice assumes balanced groups across these independent groups or levels.',
                    },
                    {
                        id: 'sampleSize',
                        label: 'Total N',
                        type: 'number',
                        step: 1,
                        min: 4,
                        max: 100000,
                        helperText: 'Total N is interpreted as evenly split across groups. If it is not divisible by the group count, the per-group N shown in the results is an approximate balanced average.',
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
            effectSizeTransforms: oneWayAnovaEffectTransform,
            solver: solveOneWayAnovaPower,
            availableVisualizerModes: ['test', 'power', 'curve'],
            buildInitialInputs: buildOneWayAnovaDefaults,
        },
    },
    {
        id: 'ancova',
        family: 'anova',
        slug: 'ancova',
        label: 'ANCOVA',
        stepId: 'res_ancova',
        power: {
            status: 'available',
            gpowerFamily: 'F tests',
            gpowerTest: 'ANCOVA: Fixed effects, main effects and interactions',
            assumptionNote: POWER_ASSUMPTION_NOTES.ancova,
            supportedPowerModes: ALL_GPOWER_MODES,
            implementedPowerModes: ['a_priori', 'post_hoc', 'sensitivity'],
            defaultPowerMode: 'a_priori',
            inputSchema: {
                a_priori: [
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
                        label: 'Effect Size (f)',
                        type: 'number',
                        step: 0.01,
                        min: 0.01,
                        max: 3,
                        helperText: "For this ANCOVA slice, Cohen's f is the adjusted group-effect size after controlling for the covariates. Rough anchors are 0.10 small, 0.25 medium, and 0.40 large.",
                    },
                    {
                        id: 'groupCount',
                        label: 'Number of Groups',
                        type: 'number',
                        step: 1,
                        min: 2,
                        max: 100,
                        helperText: 'Enter the number of independent groups or treatment conditions. This first ANCOVA power slice assumes balanced groups.',
                    },
                    {
                        id: 'covariateCount',
                        label: 'Number of Covariates',
                        type: 'number',
                        step: 1,
                        min: 0,
                        max: 25,
                        helperText: 'Enter how many continuous covariates are included as fixed adjustment terms. This first slice assumes a common-slope ANCOVA with no group-by-covariate interaction in the power model.',
                    },
                ],
                post_hoc: [
                    {
                        id: 'alpha',
                        label: 'Alpha',
                        type: 'number',
                        step: 0.01,
                        min: 0.001,
                        max: 0.2,
                    },
                    {
                        id: 'groupCount',
                        label: 'Number of Groups',
                        type: 'number',
                        step: 1,
                        min: 2,
                        max: 100,
                        helperText: 'Enter the number of independent groups or treatment conditions. This first ANCOVA power slice assumes balanced groups.',
                    },
                    {
                        id: 'covariateCount',
                        label: 'Number of Covariates',
                        type: 'number',
                        step: 1,
                        min: 0,
                        max: 25,
                        helperText: 'Enter how many continuous covariates are included as fixed adjustment terms. This first slice assumes a common-slope ANCOVA with no group-by-covariate interaction in the power model.',
                    },
                    {
                        id: 'sampleSize',
                        label: 'Total N',
                        type: 'number',
                        step: 1,
                        min: 4,
                        max: 100000,
                        helperText: 'Total N is interpreted as evenly split across groups. If it is not divisible by the group count, the per-group N shown in the results is an approximate balanced average. Covariates reduce the denominator degrees of freedom in this ANCOVA slice.',
                    },
                    {
                        id: 'effectSize',
                        label: 'Effect Size (f)',
                        type: 'number',
                        step: 0.01,
                        min: 0.01,
                        max: 3,
                        helperText: "For this ANCOVA slice, Cohen's f is the adjusted group-effect size after controlling for the covariates. Rough anchors are 0.10 small, 0.25 medium, and 0.40 large.",
                    },
                ],
                sensitivity: [
                    {
                        id: 'alpha',
                        label: 'Alpha',
                        type: 'number',
                        step: 0.01,
                        min: 0.001,
                        max: 0.2,
                    },
                    {
                        id: 'groupCount',
                        label: 'Number of Groups',
                        type: 'number',
                        step: 1,
                        min: 2,
                        max: 100,
                        helperText: 'Enter the number of independent groups or treatment conditions. This first ANCOVA power slice assumes balanced groups.',
                    },
                    {
                        id: 'covariateCount',
                        label: 'Number of Covariates',
                        type: 'number',
                        step: 1,
                        min: 0,
                        max: 25,
                        helperText: 'Enter how many continuous covariates are included as fixed adjustment terms. This first slice assumes a common-slope ANCOVA with no group-by-covariate interaction in the power model.',
                    },
                    {
                        id: 'sampleSize',
                        label: 'Total N',
                        type: 'number',
                        step: 1,
                        min: 4,
                        max: 100000,
                        helperText: 'Total N is interpreted as evenly split across groups. If it is not divisible by the group count, the per-group N shown in the results is an approximate balanced average. Covariates reduce the denominator degrees of freedom in this ANCOVA slice.',
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
            effectSizeTransforms: ancovaEffectTransform,
            solver: solveAncovaPower,
            availableVisualizerModes: ['test', 'power', 'curve'],
            buildInitialInputs: buildAncovaDefaults,
        },
    },
    {
        id: 'pearson_correlation',
        family: 'correlation',
        slug: 'pearson-correlation',
        label: 'Pearson Correlation',
        stepId: 'correlation_result',
        power: {
            status: 'available',
            gpowerFamily: 'Exact / z-approx tests',
            gpowerTest: 'Correlation: Difference from a constant (Fisher z planning model)',
            assumptionNote: POWER_ASSUMPTION_NOTES.pearsonCorrelation,
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
                        label: 'Expected Population Correlation Under H1 (ρ)',
                        type: 'number',
                        step: 0.01,
                        min: -0.95,
                        max: 0.95,
                    },
                    {
                        id: 'nullCorrelation',
                        label: 'Null Population Correlation (ρ₀)',
                        type: 'number',
                        step: 0.01,
                        min: -0.95,
                        max: 0.95,
                        helperText: 'Usually 0. This is the population correlation value used under H0. Non-zero ρ₀ values use the Fisher z approximation in this planning slice.',
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
                        min: 4,
                        max: 100000,
                    },
                    {
                        id: 'effectSize',
                        label: 'Expected Population Correlation Under H1 (ρ)',
                        type: 'number',
                        step: 0.01,
                        min: -0.95,
                        max: 0.95,
                    },
                    {
                        id: 'nullCorrelation',
                        label: 'Null Population Correlation (ρ₀)',
                        type: 'number',
                        step: 0.01,
                        min: -0.95,
                        max: 0.95,
                        helperText: 'Usually 0. This is the population correlation value used under H0. Non-zero ρ₀ values use the Fisher z approximation in this planning slice.',
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
                        min: 4,
                        max: 100000,
                    },
                    {
                        id: 'nullCorrelation',
                        label: 'Null Population Correlation (ρ₀)',
                        type: 'number',
                        step: 0.01,
                        min: -0.95,
                        max: 0.95,
                        helperText: 'Sensitivity solves for the smallest detectable population-correlation departure from ρ₀ at the current N.',
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
            effectSizeTransforms: pearsonCorrelationEffectTransform,
            solver: solvePearsonCorrelationPower,
            buildCurveModel: buildPearsonCorrelationCurveModel,
            availableVisualizerModes: ['test', 'power', 'curve'],
            buildInitialInputs: buildPearsonCorrelationDefaults,
        },
    },
];

export const POWER_TEST_BY_STEP_ID = Object.fromEntries(
    POWER_TEST_REGISTRY.map((test) => [test.stepId, test])
);
