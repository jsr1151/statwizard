import { fisherZTransform, inverseFisherZ } from '../../stats/correlation.js';
import {
    clampProbability,
    inverseNormalCDF,
    normalCDF,
    roundTo,
    solveByBinarySearch,
} from '../math.js';
import { solveIntegerSampleSizeByTargetPower } from './searchShared.js';

const MIN_SAMPLE_SIZE = 4;
const MAX_CORRELATION = 0.95;

const clampCorrelationInput = (value, fallback = 0.3) => {
    const parsed = Number(value);

    if (!Number.isFinite(parsed)) {
        return fallback;
    }

    return Math.max(-MAX_CORRELATION, Math.min(MAX_CORRELATION, parsed));
};

const getCriticalMagnitude = ({ alpha, tails }) =>
    inverseNormalCDF(1 - (tails === 2 ? alpha / 2 : alpha));

const validateDirectionalInputs = ({ effectSize, nullCorrelation, tails, direction, mode }) => {
    const fisherShift = fisherZTransform(effectSize) - fisherZTransform(nullCorrelation);

    if (Math.abs(fisherShift) < 1e-10 && mode !== 'sensitivity') {
        return 'Expected population correlation under H1 (ρ) must differ from ρ₀.';
    }

    if (tails === 1 && direction === 'greater' && !(effectSize > nullCorrelation)) {
        return 'For a positive one-tailed test, the expected population correlation under H1 (ρ) must be greater than ρ₀.';
    }

    if (tails === 1 && direction === 'less' && !(effectSize < nullCorrelation)) {
        return 'For a negative one-tailed test, the expected population correlation under H1 (ρ) must be less than ρ₀.';
    }

    return null;
};

const correlationPowerFromShift = ({ criticalMagnitude, fisherShift, sampleSize, tails, direction }) => {
    const noncentrality = fisherShift * Math.sqrt(sampleSize - 3);

    if (tails === 2) {
        return {
            noncentrality,
            power: clampProbability(
                normalCDF(-criticalMagnitude - noncentrality) +
                (1 - normalCDF(criticalMagnitude - noncentrality))
            ),
        };
    }

    if (direction === 'less') {
        return {
            noncentrality,
            power: clampProbability(normalCDF(-criticalMagnitude - noncentrality)),
        };
    }

    return {
        noncentrality,
        power: clampProbability(1 - normalCDF(criticalMagnitude - noncentrality)),
    };
};

const evaluatePearsonCorrelationPower = ({
    alpha,
    effectSize,
    sampleSize,
    tails,
    direction,
    nullCorrelation,
}) => {
    const resolvedSampleSize = Math.max(MIN_SAMPLE_SIZE, Math.round(Number(sampleSize) || MIN_SAMPLE_SIZE));
    const resolvedEffectSize = clampCorrelationInput(effectSize, 0.3);
    const resolvedNullCorrelation = clampCorrelationInput(nullCorrelation, 0);
    const fisherShift = fisherZTransform(resolvedEffectSize) - fisherZTransform(resolvedNullCorrelation);
    const criticalMagnitude = getCriticalMagnitude({ alpha, tails });
    const criticalValue = tails === 2
        ? criticalMagnitude
        : (direction === 'less' ? -criticalMagnitude : criticalMagnitude);
    const { power, noncentrality } = correlationPowerFromShift({
        criticalMagnitude,
        fisherShift,
        sampleSize: resolvedSampleSize,
        tails,
        direction,
    });

    return {
        sampleSize: resolvedSampleSize,
        effectSize: resolvedEffectSize,
        nullCorrelation: resolvedNullCorrelation,
        fisherShift,
        criticalValue,
        noncentrality,
        power,
    };
};

const buildCorrelationPowerMetrics = ({
    sampleSize,
    power,
    criticalValue,
    effectSize,
    nullCorrelation,
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
            label: 'Critical z',
            value: roundTo(criticalValue, 4).toFixed(4),
        },
        {
            id: 'effect_size',
            label: 'Expected Population Correlation (ρ)',
            value: roundTo(effectSize, 4).toFixed(4),
        },
        {
            id: 'null_correlation',
            label: 'Null Population Correlation (ρ₀)',
            value: roundTo(nullCorrelation, 4).toFixed(4),
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

const buildPearsonCorrelationVisualizer = ({
    alpha,
    tails,
    direction,
    effectSize,
    sampleSize,
    nullCorrelation,
    power,
    criticalValue,
    noncentrality,
    targetPower,
}) => ({
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
        targetEffect: Math.abs(effectSize),
        calcMode: false,
        showBothH1: tails === 2,
        calcData: {
            xBar: effectSize,
            mu: nullCorrelation,
            sigma: 1,
            n: sampleSize,
        },
        powerMeta: {
            alpha,
            tails,
            direction,
            effectSize,
            nullCorrelation,
            sampleSize,
            actualPower: power,
            criticalValue,
            noncentrality,
            targetPower: targetPower ?? null,
        },
    },
});

const buildSensitivityResult = ({
    alpha,
    tails,
    direction,
    sampleSize,
    nullCorrelation,
    powerTarget,
}) => {
    const fisherNull = fisherZTransform(nullCorrelation);
    const sign = tails === 1 && direction === 'less' ? -1 : 1;
    const upperDistance = 4;
    const upperEffectSize = inverseFisherZ(fisherNull + (sign * upperDistance));
    const upperResult = evaluatePearsonCorrelationPower({
        alpha,
        effectSize: upperEffectSize,
        sampleSize,
        tails,
        direction,
        nullCorrelation,
    });

    if (upperResult.power < powerTarget) {
        throw new Error('Sensitivity search exceeded the supported correlation range before reaching the target power.');
    }

    const distance = solveByBinarySearch({
        low: 0,
        high: upperDistance,
        tolerance: 1e-6,
        predicate: (candidateDistance) => {
            const candidateEffectSize = inverseFisherZ(fisherNull + (sign * candidateDistance));
            const result = evaluatePearsonCorrelationPower({
                alpha,
                effectSize: candidateEffectSize,
                sampleSize,
                tails,
                direction,
                nullCorrelation,
            });

            return result.power >= powerTarget;
        },
    });

    const effectSize = inverseFisherZ(fisherNull + (sign * distance));
    return evaluatePearsonCorrelationPower({
        alpha,
        effectSize,
        sampleSize,
        tails,
        direction,
        nullCorrelation,
    });
};

const buildSharedResult = ({
    mode,
    alpha,
    tails,
    direction,
    sampleSize,
    effectSize,
    nullCorrelation,
    power,
    criticalValue,
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
    nullCorrelation,
    actualPower: power,
    criticalValue,
    noncentrality,
    metrics: buildCorrelationPowerMetrics({
        sampleSize,
        power,
        criticalValue,
        effectSize,
        nullCorrelation,
        targetPower,
    }),
    summary:
        mode === 'a_priori'
            ? `A Pearson correlation study needs N = ${sampleSize} to reach power ${roundTo(power, 3)} at alpha ${alpha} when planning for ρ = ${roundTo(effectSize, 3)} against ρ₀ = ${roundTo(nullCorrelation, 3)}.`
            : mode === 'post_hoc'
                ? `With N = ${sampleSize}, the achieved power is ${roundTo(power, 3)} when the expected population correlation is ρ = ${roundTo(effectSize, 3)} against ρ₀ = ${roundTo(nullCorrelation, 3)}.`
                : `With N = ${sampleSize}, the smallest detectable population correlation is about ρ = ${roundTo(effectSize, 3)} against ρ₀ = ${roundTo(nullCorrelation, 3)} at power ${roundTo(targetPower, 3)}.`,
    visualizer: buildPearsonCorrelationVisualizer({
        alpha,
        tails,
        direction,
        effectSize,
        sampleSize,
        nullCorrelation,
        power,
        criticalValue,
        noncentrality,
        targetPower,
    }),
});

export const solvePearsonCorrelationPower = (rawInputs) => {
    const mode = rawInputs?.mode || 'a_priori';
    const alpha = Number(rawInputs?.alpha ?? 0.05);
    const tails = Number(rawInputs?.tails ?? 2);
    const direction = rawInputs?.direction || 'greater';
    const effectSize = clampCorrelationInput(rawInputs?.effectSize, 0.3);
    const nullCorrelation = clampCorrelationInput(rawInputs?.nullCorrelation, 0);
    const sampleSize = Math.max(MIN_SAMPLE_SIZE, Math.round(Number(rawInputs?.sampleSize ?? 40)));
    const powerTarget = Number(rawInputs?.powerTarget ?? 0.8);

    if (!(alpha > 0 && alpha < 1)) {
        return { ok: false, errors: ['Alpha must be between 0 and 1.'] };
    }

    if (mode !== 'post_hoc' && !(powerTarget > 0 && powerTarget < 1)) {
        return { ok: false, errors: ['Target power must be between 0 and 1.'] };
    }

    if (mode !== 'sensitivity') {
        const validationError = validateDirectionalInputs({
            effectSize,
            nullCorrelation,
            tails,
            direction,
            mode,
        });

        if (validationError) {
            return { ok: false, errors: [validationError] };
        }
    }

    if (mode === 'a_priori') {
        try {
            const result = solveIntegerSampleSizeByTargetPower({
                minSampleSize: MIN_SAMPLE_SIZE,
                powerTarget,
                evaluateAtSampleSize: (candidateSampleSize) => evaluatePearsonCorrelationPower({
                    alpha,
                    effectSize,
                    sampleSize: candidateSampleSize,
                    tails,
                    direction,
                    nullCorrelation,
                }),
            });

            return buildSharedResult({
                mode,
                alpha,
                tails,
                direction,
                sampleSize: result.sampleSize,
                effectSize,
                nullCorrelation,
                power: result.power,
                criticalValue: result.criticalValue,
                noncentrality: result.noncentrality,
                targetPower: powerTarget,
            });
        } catch (error) {
            return { ok: false, errors: [error.message] };
        }
    }

    if (mode === 'post_hoc') {
        const result = evaluatePearsonCorrelationPower({
            alpha,
            effectSize,
            sampleSize,
            tails,
            direction,
            nullCorrelation,
        });

        return buildSharedResult({
            mode,
            alpha,
            tails,
            direction,
            sampleSize: result.sampleSize,
            effectSize: result.effectSize,
            nullCorrelation: result.nullCorrelation,
            power: result.power,
            criticalValue: result.criticalValue,
            noncentrality: result.noncentrality,
        });
    }

    if (mode === 'sensitivity') {
        try {
            const result = buildSensitivityResult({
                alpha,
                tails,
                direction,
                sampleSize,
                nullCorrelation,
                powerTarget,
            });

            return buildSharedResult({
                mode,
                alpha,
                tails,
                direction,
                sampleSize: result.sampleSize,
                effectSize: result.effectSize,
                nullCorrelation: result.nullCorrelation,
                power: result.power,
                criticalValue: result.criticalValue,
                noncentrality: result.noncentrality,
                targetPower: powerTarget,
            });
        } catch (error) {
            return { ok: false, errors: [error.message] };
        }
    }

    return {
        ok: false,
        planned: true,
        errors: [`${mode} mode is reserved in the shared engine, but it is not implemented for Pearson correlation yet.`],
    };
};

const buildIntegerSequence = ({ min, max, current, pointCount }) => {
    const lower = Math.max(MIN_SAMPLE_SIZE, Math.round(min));
    const upper = Math.max(lower, Math.round(max));
    const target = Math.max(lower, Math.round(current));

    if (upper - lower + 1 <= pointCount) {
        return Array.from({ length: upper - lower + 1 }, (_, index) => lower + index);
    }

    const values = new Set([lower, upper, target]);
    const step = (upper - lower) / Math.max(1, pointCount - 1);

    for (let index = 0; index < pointCount; index += 1) {
        values.add(Math.round(lower + (step * index)));
    }

    return Array.from(values).sort((left, right) => left - right);
};

const buildDecimalSequence = ({ min, max, current, pointCount, decimals = 4 }) => {
    const lower = Number(min);
    const upper = Number(max);
    const target = Math.min(upper, Math.max(lower, Number(current)));
    const values = new Set([
        Number(lower.toFixed(decimals)),
        Number(upper.toFixed(decimals)),
        Number(target.toFixed(decimals)),
    ]);
    const step = (upper - lower) / Math.max(1, pointCount - 1);

    for (let index = 0; index < pointCount; index += 1) {
        values.add(Number((lower + (step * index)).toFixed(decimals)));
    }

    return Array.from(values).sort((left, right) => left - right);
};

const describeTailSetting = (tails, direction) => {
    if (tails === 2) {
        return 'two-tailed';
    }

    return direction === 'less' ? 'one-tailed (negative)' : 'one-tailed (positive)';
};

export const buildPearsonCorrelationCurveModel = ({ result, curveType = 'sample_size' }) => {
    if (!result?.ok) {
        return null;
    }

    if (curveType === 'effect_size') {
        let lowerBound = -MAX_CORRELATION;
        let upperBound = MAX_CORRELATION;

        if (result.tails === 1 && result.direction === 'greater') {
            lowerBound = Math.min(MAX_CORRELATION, result.nullCorrelation + 0.01);
        }

        if (result.tails === 1 && result.direction === 'less') {
            upperBound = Math.max(-MAX_CORRELATION, result.nullCorrelation - 0.01);
        }

        if (!(lowerBound < upperBound)) {
            return null;
        }

        const candidateEffectSizes = buildDecimalSequence({
            min: lowerBound,
            max: upperBound,
            current: result.effectSize,
            pointCount: 81,
            decimals: 4,
        });

        const points = candidateEffectSizes.map((candidateEffectSize) => {
            const curveResult = evaluatePearsonCorrelationPower({
                alpha: result.alpha,
                effectSize: candidateEffectSize,
                sampleSize: result.sampleSize,
                tails: result.tails,
                direction: result.direction,
                nullCorrelation: result.nullCorrelation,
            });

            return {
                x: curveResult.effectSize,
                power: curveResult.power,
            };
        });

        return {
            ok: true,
            curveType: 'effect_size',
            curveNature: 'continuous',
            title: 'Power vs Population Correlation',
            xLabel: 'Expected Population Correlation (ρ)',
            yLabel: 'Power',
            points,
            currentPoint: {
                x: result.effectSize,
                power: result.actualPower,
            },
            assumptions: `Holding N = ${result.sampleSize}, alpha = ${roundTo(result.alpha, 3)}, ρ₀ = ${roundTo(result.nullCorrelation, 3)}, and ${describeTailSetting(result.tails, result.direction)}.`,
            currentPointSummary: `ρ = ${roundTo(result.effectSize, 4)} gives power ${roundTo(result.actualPower, 4)} at N = ${result.sampleSize}.`,
        };
    }

    const currentSampleSize = Math.max(MIN_SAMPLE_SIZE, Math.round(result.sampleSize));
    const candidateSampleSizes = buildIntegerSequence({
        min: Math.max(MIN_SAMPLE_SIZE, Math.floor(currentSampleSize * 0.3)),
        max: Math.max(currentSampleSize + 12, Math.ceil(currentSampleSize * 2)),
        current: currentSampleSize,
        pointCount: 25,
    });
    const points = candidateSampleSizes.map((candidateSampleSize) => {
        const curveResult = evaluatePearsonCorrelationPower({
            alpha: result.alpha,
            effectSize: result.effectSize,
            sampleSize: candidateSampleSize,
            tails: result.tails,
            direction: result.direction,
            nullCorrelation: result.nullCorrelation,
        });

        return {
            x: curveResult.sampleSize,
            power: curveResult.power,
        };
    });

    return {
        ok: true,
        curveType: 'sample_size',
        curveNature: 'discrete',
        title: 'Power vs Sample Size',
        xLabel: 'Total N',
        yLabel: 'Power',
        points,
        currentPoint: {
            x: currentSampleSize,
            power: result.actualPower,
        },
        assumptions: `Holding expected ρ = ${roundTo(result.effectSize, 3)}, ρ₀ = ${roundTo(result.nullCorrelation, 3)}, alpha = ${roundTo(result.alpha, 3)}, and ${describeTailSetting(result.tails, result.direction)}.`,
        currentPointSummary: `N = ${currentSampleSize} gives power ${roundTo(result.actualPower, 4)} for ρ = ${roundTo(result.effectSize, 3)} against ρ₀ = ${roundTo(result.nullCorrelation, 3)}.`,
    };
};
