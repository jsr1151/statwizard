import { roundTo } from '../math.js';
import {
    solveEffectSizeByTargetPower,
    solveIntegerSampleSizeByTargetPower,
} from './searchShared.js';

export {
    solveEffectSizeByTargetPower,
    solveIntegerSampleSizeByTargetPower,
};

export const buildFPowerMetrics = ({
    sampleSize,
    groupCount,
    perGroupSampleSize,
    isPerGroupExact,
    power,
    criticalValue,
    numeratorDf,
    denominatorDf,
    noncentrality,
    effectSize,
    targetPower,
}) => {
    const metrics = [
        {
            id: 'sample_size',
            label: 'Total N',
            value: `${sampleSize}`,
            tone: 'primary',
        },
        {
            id: 'group_count',
            label: 'Groups',
            value: `${groupCount}`,
        },
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
            label: 'Effect Size (f)',
            value: roundTo(effectSize, 4).toFixed(4),
        },
    ];

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
