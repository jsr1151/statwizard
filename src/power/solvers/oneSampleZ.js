import { inverseNormalCDF, normalPowerFromShift, roundTo, solveByBinarySearch } from '../math';

const MIN_SAMPLE_SIZE = 2;

const cleanNumber = (value, fallback) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
};

const getCriticalValue = (alpha, tails) => {
    if (tails === 2) {
        return inverseNormalCDF(1 - alpha / 2);
    }

    return inverseNormalCDF(1 - alpha);
};

const getPostHocPower = ({ sampleSize, alpha, effectSize, tails, direction }) => {
    const criticalValue = getCriticalValue(alpha, tails);
    const noncentrality = Math.abs(effectSize) * Math.sqrt(sampleSize);
    const power = normalPowerFromShift({
        criticalValue,
        noncentrality,
        tails,
        direction,
    });

    return {
        power,
        criticalValue,
        noncentrality,
    };
};

const solveRequiredSampleSize = ({ alpha, effectSize, powerTarget, tails, direction }) => {
    let upper = MIN_SAMPLE_SIZE;
    let trial = getPostHocPower({
        sampleSize: upper,
        alpha,
        effectSize,
        tails,
        direction,
    });

    while (trial.power < powerTarget && upper < 100000) {
        upper *= 2;
        trial = getPostHocPower({
            sampleSize: upper,
            alpha,
            effectSize,
            tails,
            direction,
        });
    }

    if (upper >= 100000 && trial.power < powerTarget) {
        throw new Error('Required sample size exceeded the search limit.');
    }

    let low = MIN_SAMPLE_SIZE;
    let high = upper;

    while (low < high) {
        const mid = Math.floor((low + high) / 2);
        const result = getPostHocPower({
            sampleSize: mid,
            alpha,
            effectSize,
            tails,
            direction,
        });

        if (result.power >= powerTarget) {
            high = mid;
        } else {
            low = mid + 1;
        }
    }

    const finalResult = getPostHocPower({
        sampleSize: low,
        alpha,
        effectSize,
        tails,
        direction,
    });

    return {
        sampleSize: low,
        ...finalResult,
    };
};

const solveSensitivityEffect = ({ alpha, powerTarget, sampleSize, tails, direction }) => {
    const predicate = (effectSize) => {
        const result = getPostHocPower({
            sampleSize,
            alpha,
            effectSize,
            tails,
            direction,
        });

        return result.power >= powerTarget;
    };

    let upper = 0.05;
    while (!predicate(upper) && upper < 5) {
        upper *= 2;
    }

    if (upper >= 5 && !predicate(upper)) {
        throw new Error('Sensitivity search exceeded the effect-size limit.');
    }

    const effectSize = solveByBinarySearch({
        low: 0,
        high: upper,
        tolerance: 1e-5,
        predicate,
    });

    const postHoc = getPostHocPower({
        sampleSize,
        alpha,
        effectSize,
        tails,
        direction,
    });

    return {
        effectSize,
        ...postHoc,
    };
};

const buildSharedResult = ({
    mode,
    alpha,
    tails,
    direction,
    sampleSize,
    effectSize,
    power,
    criticalValue,
    noncentrality,
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
            id: 'actual_power',
            label: 'Actual Power',
            value: roundTo(power, 4).toFixed(4),
        },
        {
            id: 'critical_value',
            label: 'Critical Z',
            value: roundTo(criticalValue, 4).toFixed(4),
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
        },
    ];

    if (targetPower != null) {
        metrics.push({
            id: 'target_power',
            label: 'Target Power',
            value: roundTo(targetPower, 4).toFixed(4),
        });
    }

    return {
        ok: true,
        mode,
        alpha,
        tails,
        direction,
        sampleSize,
        effectSize,
        actualPower: power,
        criticalValue,
        noncentrality,
        metrics,
        summary:
            mode === 'a_priori'
                ? `A one-sample z test needs N = ${sampleSize} to reach power ${roundTo(power, 3)} at alpha ${alpha}.`
                : mode === 'post_hoc'
                    ? `With N = ${sampleSize}, the achieved power is ${roundTo(power, 3)} for effect size d = ${roundTo(effectSize, 3)}.`
                    : `With N = ${sampleSize}, the smallest detectable effect is d = ${roundTo(effectSize, 3)} at power ${roundTo(targetPower, 3)}.`,
        visualizer: {
            kind: 'normal_distribution',
            type: 'z',
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
                calcData: {
                    xBar: effectSize,
                    mu: 0,
                    sigma: 1,
                    n: sampleSize,
                },
                showBothH1: tails === 2,
                powerMeta: {
                    mode,
                    alpha,
                    tails,
                    direction,
                    actualPower: power,
                    criticalValue,
                    noncentrality,
                    effectSize,
                    sampleSize,
                    targetPower: targetPower ?? null,
                },
            },
        },
    };
};

export const solveOneSampleZPower = (rawInputs) => {
    const mode = rawInputs?.mode || 'a_priori';
    const alpha = cleanNumber(rawInputs?.alpha, 0.05);
    const tails = cleanNumber(rawInputs?.tails, 2);
    const direction = rawInputs?.direction || 'greater';
    const effectSize = Math.abs(cleanNumber(rawInputs?.effectSize, 0.5));
    const sampleSize = Math.max(MIN_SAMPLE_SIZE, Math.round(cleanNumber(rawInputs?.sampleSize, 30)));
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
        const result = solveRequiredSampleSize({
            alpha,
            effectSize,
            powerTarget,
            tails,
            direction,
        });

        return buildSharedResult({
            mode,
            alpha,
            tails,
            direction,
            sampleSize: result.sampleSize,
            effectSize,
            power: result.power,
            criticalValue: result.criticalValue,
            noncentrality: result.noncentrality,
            targetPower: powerTarget,
        });
    }

    if (mode === 'post_hoc') {
        const result = getPostHocPower({
            sampleSize,
            alpha,
            effectSize,
            tails,
            direction,
        });

        return buildSharedResult({
            mode,
            alpha,
            tails,
            direction,
            sampleSize,
            effectSize,
            power: result.power,
            criticalValue: result.criticalValue,
            noncentrality: result.noncentrality,
        });
    }

    if (mode === 'sensitivity') {
        const result = solveSensitivityEffect({
            alpha,
            powerTarget,
            sampleSize,
            tails,
            direction,
        });

        return buildSharedResult({
            mode,
            alpha,
            tails,
            direction,
            sampleSize,
            effectSize: result.effectSize,
            power: result.power,
            criticalValue: result.criticalValue,
            noncentrality: result.noncentrality,
            targetPower: powerTarget,
        });
    }

    return {
        ok: false,
        planned: true,
        errors: [`${mode} mode is reserved in the shared engine, but it is not implemented in this first slice yet.`],
    };
};
