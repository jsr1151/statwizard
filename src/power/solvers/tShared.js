import { roundTo } from '../math.js';
import { studentTCriticalValue, tPowerFromNoncentrality } from '../tMath.js';
export {
    solveIntegerSampleSizeByTargetPower,
    solveEffectSizeByTargetPower,
} from './searchShared.js';
import {
    solveEffectSizeByTargetPower,
    solveIntegerSampleSizeByTargetPower,
} from './searchShared.js';

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
    sampleSizeLabel = 'Total N',
    effectSizeLabel = "Effect Size (d)",
}) => {
    const metrics = [
        {
            id: 'sample_size',
            label: sampleSizeLabel,
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
            label: effectSizeLabel,
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

export const evaluateSingleSampleTPower = ({
    alpha,
    effectSize,
    sampleSize,
    tails,
    direction,
    minSampleSize = 2,
    degreesOfFreedomResolver,
    noncentralityResolver,
}) => {
    const resolvedSampleSize = Math.max(minSampleSize, Math.round(sampleSize));
    const df = degreesOfFreedomResolver({ sampleSize: resolvedSampleSize });
    const criticalMagnitude = studentTCriticalValue({ alpha, tails, df });
    const criticalValue = tails === 2
        ? criticalMagnitude
        : (direction === 'less' ? -criticalMagnitude : criticalMagnitude);
    const noncentrality = noncentralityResolver({
        effectSize,
        sampleSize: resolvedSampleSize,
        tails,
        direction,
    });
    const power = tPowerFromNoncentrality({
        criticalValue,
        df,
        noncentrality,
        tails,
        direction,
    });

    return {
        sampleSize: resolvedSampleSize,
        df,
        power,
        criticalValue,
        noncentrality,
    };
};

const cleanNumber = (value, fallback) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
};

export const solveSingleSampleTPowerModes = ({
    rawInputs,
    minSampleSize = 2,
    evaluateAtSampleSize,
    buildResult,
}) => {
    const mode = rawInputs?.mode || 'a_priori';
    const alpha = cleanNumber(rawInputs?.alpha, 0.05);
    const tails = cleanNumber(rawInputs?.tails, 2);
    const direction = rawInputs?.direction || 'greater';
    const effectSize = Math.abs(cleanNumber(rawInputs?.effectSize, 0.5));
    const sampleSize = Math.max(minSampleSize, Math.round(cleanNumber(rawInputs?.sampleSize, 30)));
    const powerTarget = cleanNumber(rawInputs?.powerTarget, 0.8);

    if (!(alpha > 0 && alpha < 1)) {
        return { ok: false, errors: ['Alpha must be between 0 and 1.'] };
    }

    if (!(powerTarget > 0 && powerTarget < 1) && mode !== 'post_hoc') {
        return { ok: false, errors: ['Target power must be between 0 and 1.'] };
    }

    if (!(effectSize > 0) && mode !== 'sensitivity') {
        return { ok: false, errors: ['Effect size must be greater than 0.'] };
    }

    if (mode === 'a_priori') {
        const result = solveIntegerSampleSizeByTargetPower({
            minSampleSize,
            powerTarget,
            evaluateAtSampleSize: (candidateSampleSize) => evaluateAtSampleSize({
                alpha,
                effectSize,
                sampleSize: candidateSampleSize,
                tails,
                direction,
            }),
        });

        return buildResult({
            mode,
            alpha,
            tails,
            direction,
            sampleSize: result.sampleSize,
            effectSize,
            power: result.power,
            criticalValue: result.criticalValue,
            df: result.df,
            noncentrality: result.noncentrality,
            targetPower: powerTarget,
        });
    }

    if (mode === 'post_hoc') {
        const result = evaluateAtSampleSize({
            alpha,
            effectSize,
            sampleSize,
            tails,
            direction,
        });

        return buildResult({
            mode,
            alpha,
            tails,
            direction,
            sampleSize: result.sampleSize,
            effectSize,
            power: result.power,
            criticalValue: result.criticalValue,
            df: result.df,
            noncentrality: result.noncentrality,
        });
    }

    if (mode === 'sensitivity') {
        const result = solveEffectSizeByTargetPower({
            powerTarget,
            evaluateAtEffectSize: (candidateEffectSize) => evaluateAtSampleSize({
                alpha,
                effectSize: candidateEffectSize,
                sampleSize,
                tails,
                direction,
            }),
        });

        return buildResult({
            mode,
            alpha,
            tails,
            direction,
            sampleSize: result.sampleSize,
            effectSize: result.effectSize,
            power: result.power,
            criticalValue: result.criticalValue,
            df: result.df,
            noncentrality: result.noncentrality,
            targetPower: powerTarget,
        });
    }

    return {
        ok: false,
        planned: true,
        errors: [`${mode} mode is reserved in the shared engine, but it is not implemented for this t-test slice yet.`],
    };
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
