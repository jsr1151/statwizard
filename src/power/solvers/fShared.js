import { roundTo } from '../math.js';
import {
    solveEffectSizeByTargetPower,
    solveIntegerSampleSizeByTargetPower,
} from './searchShared.js';

export {
    solveEffectSizeByTargetPower,
    solveIntegerSampleSizeByTargetPower,
};

export const cleanFInputNumber = (value, fallback) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
};

export const resolveFGroupCount = (value, minimumGroupCount = 2) =>
    Math.max(minimumGroupCount, Math.round(cleanFInputNumber(value, minimumGroupCount)));

export const resolveCovariateCount = (value) =>
    Math.max(0, Math.round(cleanFInputNumber(value, 0)));

export const getMinimumBalancedFTestSampleSize = ({
    groupCount,
    covariateCount = 0,
    minPerGroupSampleSize = 2,
}) => {
    const resolvedGroups = resolveFGroupCount(groupCount);
    const resolvedCovariates = resolveCovariateCount(covariateCount);

    return Math.max(
        resolvedGroups * minPerGroupSampleSize,
        resolvedGroups + resolvedCovariates + 1
    );
};

export const resolveBalancedFSampleSize = ({
    value,
    groupCount,
    covariateCount = 0,
    minPerGroupSampleSize = 2,
    fallbackMultiplier = 20,
}) => {
    const resolvedGroups = resolveFGroupCount(groupCount);
    const minimumSampleSize = getMinimumBalancedFTestSampleSize({
        groupCount: resolvedGroups,
        covariateCount,
        minPerGroupSampleSize,
    });

    return Math.max(
        minimumSampleSize,
        Math.round(cleanFInputNumber(value, Math.max(minimumSampleSize, resolvedGroups * fallbackMultiplier)))
    );
};

export const formatBalancedPerGroupSummary = ({ perGroupSampleSize, isPerGroupExact }) =>
    isPerGroupExact
        ? `${Math.round(perGroupSampleSize)} per group`
        : `about ${roundTo(perGroupSampleSize, 2)} per group`;

export const buildFPowerMetrics = ({
    sampleSize,
    groupCount,
    covariateCount,
    perGroupSampleSize,
    isPerGroupExact,
    power,
    criticalValue,
    numeratorDf,
    denominatorDf,
    noncentrality,
    effectSize,
    targetPower,
    sampleSizeLabel = 'Total N',
    effectSizeLabel = 'Effect Size (f)',
}) => {
    const metrics = [
        {
            id: 'sample_size',
            label: sampleSizeLabel,
            value: `${sampleSize}`,
            tone: 'primary',
        },
        {
            id: 'group_count',
            label: 'Groups',
            value: `${groupCount}`,
        },
    ];

    if (covariateCount != null) {
        metrics.push({
            id: 'covariate_count',
            label: 'Covariates',
            value: `${covariateCount}`,
        });
    }

    metrics.push(
        {
            id: 'per_group_n',
            label: isPerGroupExact ? 'Per-Group N' : 'Per-Group N (approx.)',
            value: isPerGroupExact
                ? `${Math.round(perGroupSampleSize)}`
                : roundTo(perGroupSampleSize, 2).toFixed(2),
        },
        {
            id: 'actual_power',
            label: 'Actual Power',
            value: roundTo(power, 4).toFixed(4),
        },
        {
            id: 'critical_value',
            label: 'Critical F',
            value: roundTo(criticalValue, 4).toFixed(4),
        },
        {
            id: 'numerator_df',
            label: 'Numerator df',
            value: roundTo(numeratorDf, 4).toFixed(4),
        },
        {
            id: 'denominator_df',
            label: 'Denominator df',
            value: roundTo(denominatorDf, 4).toFixed(4),
        },
        {
            id: 'noncentrality',
            label: 'Noncentrality',
            value: roundTo(noncentrality, 4).toFixed(4),
        },
        {
            id: 'effect_size',
            label: effectSizeLabel,
            value: roundTo(effectSize, 4).toFixed(4),
        },
    );

    if (targetPower != null) {
        metrics.push({
            id: 'target_power',
            label: 'Target Power',
            value: roundTo(targetPower, 4).toFixed(4),
        });
    }

    return metrics;
};

export const buildFPowerVisualizer = ({
    alpha,
    effectSize,
    sampleSize,
    groupCount,
    perGroupSampleSize,
    isPerGroupExact,
    numeratorDf,
    denominatorDf,
    power,
    criticalValue,
    noncentrality,
    targetPower,
    extraPowerMeta = {},
}) => ({
    kind: 'f_distribution',
    type: 'f',
    config: {
        uiPreset: 'power_compact',
        alpha,
        effectSize,
        sampleSize,
        groupCount,
        perGroupSampleSize,
        isPerGroupExact,
        numeratorDf,
        denominatorDf,
        criticalValue,
        noncentrality,
        actualPower: power,
        targetPower: targetPower ?? null,
        powerMeta: {
            alpha,
            effectSize,
            sampleSize,
            groupCount,
            perGroupSampleSize,
            isPerGroupExact,
            numeratorDf,
            denominatorDf,
            criticalValue,
            noncentrality,
            actualPower: power,
            targetPower: targetPower ?? null,
            ...extraPowerMeta,
        },
    },
});
