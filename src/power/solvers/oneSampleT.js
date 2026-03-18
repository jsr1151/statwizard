import {
    oneSampleTDegreesOfFreedom,
    oneSampleTNoncentrality,
    studentTCriticalValue,
    tPowerFromNoncentrality,
} from '../tMath.js';
import {
    buildTPowerMetrics,
    buildTPowerVisualizer,
    solveEffectSizeByTargetPower,
    solveIntegerSampleSizeByTargetPower,
} from './tShared.js';
import { roundTo } from '../math.js';

const MIN_SAMPLE_SIZE = 2;

const cleanNumber = (value, fallback) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
};

const evaluateOneSampleTPower = ({
    alpha,
    effectSize,
    sampleSize,
    tails,
    direction,
}) => {
    const resolvedSampleSize = Math.max(MIN_SAMPLE_SIZE, Math.round(sampleSize));
    const df = oneSampleTDegreesOfFreedom({ sampleSize: resolvedSampleSize });
    const criticalMagnitude = studentTCriticalValue({ alpha, tails, df });
    const criticalValue = tails === 2
        ? criticalMagnitude
        : (direction === 'less' ? -criticalMagnitude : criticalMagnitude);
    const noncentrality = oneSampleTNoncentrality({
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

const buildSharedResult = ({
    mode,
    alpha,
    tails,
    direction,
    sampleSize,
    effectSize,
    power,
    criticalValue,
    df,
    noncentrality,
    targetPower,
}) => ({
    ok: true,
    mode,
    alpha,
    tails,
    direction,
    sampleSize,
    effectSize,
    actualPower: power,
    criticalValue,
    df,
    noncentrality,
    metrics: buildTPowerMetrics({
        sampleSize,
        power,
        criticalValue,
        df,
        noncentrality,
        effectSize,
        targetPower,
    }),
    summary:
        mode === 'a_priori'
            ? `A one-sample t test needs N = ${sampleSize} to reach power ${roundTo(power, 3)} at alpha ${alpha}.`
            : mode === 'post_hoc'
                ? `With N = ${sampleSize}, the achieved power is ${roundTo(power, 3)} for effect size d = ${roundTo(effectSize, 3)}.`
                : `With N = ${sampleSize}, the smallest detectable effect is d = ${roundTo(effectSize, 3)} at power ${roundTo(targetPower, 3)}.`,
    visualizer: buildTPowerVisualizer({
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
        extraPowerMeta: {
            mode,
        },
    }),
});

export const solveOneSampleTPower = (rawInputs) => {
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
        const result = solveIntegerSampleSizeByTargetPower({
            minSampleSize: MIN_SAMPLE_SIZE,
            powerTarget,
            evaluateAtSampleSize: (candidateSampleSize) => evaluateOneSampleTPower({
                alpha,
                effectSize,
                sampleSize: candidateSampleSize,
                tails,
                direction,
            }),
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
            df: result.df,
            noncentrality: result.noncentrality,
            targetPower: powerTarget,
        });
    }

    if (mode === 'post_hoc') {
        const result = evaluateOneSampleTPower({
            alpha,
            effectSize,
            sampleSize,
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
            df: result.df,
            noncentrality: result.noncentrality,
        });
    }

    if (mode === 'sensitivity') {
        const result = solveEffectSizeByTargetPower({
            powerTarget,
            evaluateAtEffectSize: (candidateEffectSize) => evaluateOneSampleTPower({
                alpha,
                effectSize: candidateEffectSize,
                sampleSize,
                tails,
                direction,
            }),
        });

        return buildSharedResult({
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
