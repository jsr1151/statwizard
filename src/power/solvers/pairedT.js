import {
    pairedTDegreesOfFreedom,
    pairedTNoncentrality,
} from '../tMath.js';
import {
    buildTPowerMetrics,
    buildTPowerVisualizer,
    evaluateSingleSampleTPower,
    solveSingleSampleTPowerModes,
} from './tShared.js';
import { roundTo } from '../math.js';

const MIN_SAMPLE_SIZE = 2;

const evaluatePairedTPower = ({
    alpha,
    effectSize,
    sampleSize,
    tails,
    direction,
}) => evaluateSingleSampleTPower({
    alpha,
    effectSize,
    sampleSize,
    tails,
    direction,
    minSampleSize: MIN_SAMPLE_SIZE,
    degreesOfFreedomResolver: pairedTDegreesOfFreedom,
    noncentralityResolver: pairedTNoncentrality,
});

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
        sampleSizeLabel: 'Total N (Pairs)',
        effectSizeLabel: 'Effect Size (d_z)',
    }),
    summary:
        mode === 'a_priori'
            ? `A paired-samples t test needs N = ${sampleSize} paired participants to reach power ${roundTo(power, 3)} at alpha ${alpha}.`
            : mode === 'post_hoc'
                ? `With N = ${sampleSize} paired participants, the achieved power is ${roundTo(power, 3)} for paired-difference effect size d_z = ${roundTo(effectSize, 3)}.`
                : `With N = ${sampleSize} paired participants, the smallest detectable paired-difference effect is d_z = ${roundTo(effectSize, 3)} at power ${roundTo(targetPower, 3)}.`,
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
            sampleSizeMeaning: 'paired_participants',
            effectSizeMetric: 'd_z',
        },
    }),
});

export const solvePairedTPower = (rawInputs) =>
    solveSingleSampleTPowerModes({
        rawInputs,
        minSampleSize: MIN_SAMPLE_SIZE,
        evaluateAtSampleSize: evaluatePairedTPower,
        buildResult: buildSharedResult,
    });
