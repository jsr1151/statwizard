import { roundTo, solveByBinarySearch } from '../math.js';

export const solveIntegerSampleSizeByTargetPower = ({
    minSampleSize,
    powerTarget,
    evaluateAtSampleSize,
    maxSampleSize = 100000,
}) => {
    let upper = minSampleSize;
    let trial = evaluateAtSampleSize(upper);

    while (trial.power < powerTarget && upper < maxSampleSize) {
        upper *= 2;
        trial = evaluateAtSampleSize(upper);
    }

    if (upper >= maxSampleSize && trial.power < powerTarget) {
        throw new Error('Required sample size exceeded the search limit.');
    }

    let low = minSampleSize;
    let high = upper;

    while (low < high) {
        const mid = Math.floor((low + high) / 2);
        const result = evaluateAtSampleSize(mid);

        if (result.power >= powerTarget) {
            high = mid;
        } else {
            low = mid + 1;
        }
    }

    return evaluateAtSampleSize(low);
};

export const solveEffectSizeByTargetPower = ({
    powerTarget,
    evaluateAtEffectSize,
    maxEffectSize = 5,
    initialUpper = 0.05,
}) => {
    let upper = initialUpper;

    while (evaluateAtEffectSize(upper).power < powerTarget && upper < maxEffectSize) {
        upper *= 2;
    }

    if (upper >= maxEffectSize && evaluateAtEffectSize(upper).power < powerTarget) {
        throw new Error('Sensitivity search exceeded the effect-size limit.');
    }

    const effectSize = solveByBinarySearch({
        low: 0,
        high: upper,
        tolerance: 1e-5,
        predicate: (candidate) => evaluateAtEffectSize(candidate).power >= powerTarget,
    });

    return {
        effectSize,
        ...evaluateAtEffectSize(effectSize),
    };
};

export const buildTPowerMetrics = ({
    sampleSize,
    group1SampleSize,
    group2SampleSize,
    power,
    criticalValue,
    df,
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
    ];

    if (group1SampleSize != null && group2SampleSize != null) {
        metrics.push(
            {
                id: 'group_1_n',
                label: 'Group 1 N',
                value: `${group1SampleSize}`,
            },
            {
                id: 'group_2_n',
                label: 'Group 2 N',
                value: `${group2SampleSize}`,
            }
        );
    }

    metrics.push(
        {
            id: 'actual_power',
            label: 'Actual Power',
            value: roundTo(power, 4).toFixed(4),
        },
        {
            id: 'critical_value',
            label: 'Critical t',
            value: roundTo(criticalValue, 4).toFixed(4),
        },
        {
            id: 'degrees_freedom',
            label: 'Degrees of Freedom',
            value: roundTo(df, 4).toFixed(4),
        },
        {
            id: 'noncentrality',
            label: 'Noncentrality',
            value: roundTo(noncentrality, 4).toFixed(4),
        },
        {
            id: 'effect_size',
            label: "Effect Size (d)",
            value: roundTo(effectSize, 4).toFixed(4),
        }
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

export const buildTPowerVisualizer = ({
    alpha,
    tails,
    direction,
    effectSize,
    sampleSize,
    df,
    power,
    criticalValue,
    noncentrality,
    targetPower,
    extraPowerMeta = {},
}) => ({
    kind: 'normal_distribution',
    type: 't',
    config: {
        uiPreset: 'power_compact',
        visualMode: 'power',
        showPopulation: true,
        showPowerLabels: true,
        alpha,
        tails,
        h1Direction: direction,
        targetEffect: effectSize,
        calcMode: false,
        df,
        calcData: {
            xBar: effectSize,
            mu: 0,
            sigma: 1,
            n: sampleSize,
        },
        showBothH1: tails === 2,
        powerMeta: {
            alpha,
            tails,
            direction,
            actualPower: power,
            criticalValue,
            df,
            noncentrality,
            effectSize,
            sampleSize,
            targetPower: targetPower ?? null,
            ...extraPowerMeta,
        },
    },
});
