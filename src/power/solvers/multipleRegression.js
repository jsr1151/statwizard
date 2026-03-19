import {
    centralFCriticalValue,
    fPowerFromNoncentrality,
} from '../fMath.js';
import { roundTo } from '../math.js';
import {
    solveEffectSizeByTargetPower,
    solveIntegerSampleSizeByTargetPower,
} from './searchShared.js';

const cleanInputNumber = (value, fallback) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
};

const clampEffectSize = (value, fallback = 0.15) => {
    const parsed = Number(value);

    if (!(parsed > 0)) {
        return fallback;
    }

    return Math.min(3, parsed);
};

const clampPredictorCount = (value, fallback = 2) => {
    const parsed = Math.round(Number(value));

    if (!(parsed >= 2)) {
        return fallback;
    }

    return Math.min(25, parsed);
};

const fSquaredToRSquared = (fSquared) => {
    const value = Math.max(0, Number(fSquared));
    return value / (1 + value);
};

const evaluateMultipleRegressionPower = ({
    alpha,
    effectSize,
    sampleSize,
    predictorCount,
}) => {
    const resolvedPredictorCount = clampPredictorCount(predictorCount, 2);
    const minSampleSize = resolvedPredictorCount + 2;
    const resolvedSampleSize = Math.max(minSampleSize, Math.round(Number(sampleSize) || minSampleSize));
    const resolvedEffectSize = clampEffectSize(effectSize, 0.15);
    const numeratorDf = resolvedPredictorCount;
    const denominatorDf = Math.max(1, resolvedSampleSize - resolvedPredictorCount - 1);
    const criticalValue = centralFCriticalValue({
        alpha,
        numeratorDf,
        denominatorDf,
    });
    const noncentrality = resolvedSampleSize * resolvedEffectSize;
    const power = fPowerFromNoncentrality({
        criticalValue,
        numeratorDf,
        denominatorDf,
        noncentrality,
    });

    return {
        sampleSize: resolvedSampleSize,
        predictorCount: resolvedPredictorCount,
        effectSize: resolvedEffectSize,
        equivalentRSquared: fSquaredToRSquared(resolvedEffectSize),
        numeratorDf,
        denominatorDf,
        criticalValue,
        noncentrality,
        power,
    };
};

const buildMetrics = ({
    sampleSize,
    predictorCount,
    power,
    criticalValue,
    numeratorDf,
    denominatorDf,
    noncentrality,
    effectSize,
    equivalentRSquared,
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
            id: 'predictor_count',
            label: 'Predictors',
            value: `${predictorCount}`,
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
            value: `${numeratorDf}`,
        },
        {
            id: 'denominator_df',
            label: 'Denominator df',
            value: `${denominatorDf}`,
        },
        {
            id: 'effect_size',
            label: 'Effect Size (f²)',
            value: roundTo(effectSize, 4).toFixed(4),
        },
        {
            id: 'r_squared',
            label: 'Equivalent R²',
            value: roundTo(equivalentRSquared, 4).toFixed(4),
        },
        {
            id: 'noncentrality',
            label: 'Noncentrality',
            value: roundTo(noncentrality, 4).toFixed(4),
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

const buildVisualizer = ({
    alpha,
    effectSize,
    sampleSize,
    predictorCount,
    power,
    criticalValue,
    numeratorDf,
    denominatorDf,
    noncentrality,
    targetPower,
}) => ({
    kind: 'f_distribution',
    type: 'f',
    config: {
        uiPreset: 'power_compact',
        alpha,
        effectSize,
        sampleSize,
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
            predictorCount,
            numeratorDf,
            denominatorDf,
            criticalValue,
            noncentrality,
            actualPower: power,
            targetPower: targetPower ?? null,
            designLabel: 'Multiple Regression',
            designSummary: `Omnibus fixed-model F test with ${predictorCount} predictors at total N = ${sampleSize}.`,
            designScopeNote: 'This first slice plans the overall model R² deviation from 0, not an individual coefficient or incremental block test.',
        },
    },
});

const buildSharedResult = ({
    mode,
    alpha,
    sampleSize,
    predictorCount,
    effectSize,
    equivalentRSquared,
    power,
    criticalValue,
    numeratorDf,
    denominatorDf,
    noncentrality,
    targetPower,
}) => ({
    ok: true,
    mode,
    alpha,
    sampleSize,
    predictorCount,
    effectSize,
    equivalentRSquared,
    actualPower: power,
    criticalValue,
    numeratorDf,
    denominatorDf,
    noncentrality,
    metrics: buildMetrics({
        sampleSize,
        predictorCount,
        power,
        criticalValue,
        numeratorDf,
        denominatorDf,
        noncentrality,
        effectSize,
        equivalentRSquared,
        targetPower,
    }),
    summary:
        mode === 'a_priori'
            ? `A multiple-regression study with ${predictorCount} predictors needs N = ${sampleSize} to reach power ${roundTo(power, 3)} at alpha ${alpha} for omnibus effect size f² = ${roundTo(effectSize, 3)} (R² ≈ ${roundTo(equivalentRSquared, 3)}).`
            : mode === 'post_hoc'
                ? `With N = ${sampleSize} and ${predictorCount} predictors, the achieved power is ${roundTo(power, 3)} for omnibus model effect size f² = ${roundTo(effectSize, 3)} (R² ≈ ${roundTo(equivalentRSquared, 3)}).`
                : `With N = ${sampleSize} and ${predictorCount} predictors, the smallest detectable omnibus multiple-regression effect is f² = ${roundTo(effectSize, 3)} (R² ≈ ${roundTo(equivalentRSquared, 3)}) at power ${roundTo(targetPower, 3)}.`,
    visualizer: buildVisualizer({
        alpha,
        effectSize,
        sampleSize,
        predictorCount,
        power,
        criticalValue,
        numeratorDf,
        denominatorDf,
        noncentrality,
        targetPower,
    }),
});

export const solveMultipleRegressionPower = (rawInputs) => {
    const mode = rawInputs?.mode || 'a_priori';
    const alpha = cleanInputNumber(rawInputs?.alpha, 0.05);
    const effectSize = clampEffectSize(rawInputs?.effectSize, 0.15);
    const predictorCount = clampPredictorCount(rawInputs?.predictorCount, 2);
    const minSampleSize = predictorCount + 2;
    const sampleSize = Math.max(minSampleSize, Math.round(cleanInputNumber(rawInputs?.sampleSize, 80)));
    const powerTarget = cleanInputNumber(rawInputs?.powerTarget, 0.8);

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
            evaluateAtSampleSize: (candidateSampleSize) => evaluateMultipleRegressionPower({
                alpha,
                effectSize,
                sampleSize: candidateSampleSize,
                predictorCount,
            }),
        });

        return buildSharedResult({
            mode,
            alpha,
            sampleSize: result.sampleSize,
            predictorCount,
            effectSize,
            equivalentRSquared: fSquaredToRSquared(effectSize),
            power: result.power,
            criticalValue: result.criticalValue,
            numeratorDf: result.numeratorDf,
            denominatorDf: result.denominatorDf,
            noncentrality: result.noncentrality,
            targetPower: powerTarget,
        });
    }

    if (mode === 'post_hoc') {
        const result = evaluateMultipleRegressionPower({
            alpha,
            effectSize,
            sampleSize,
            predictorCount,
        });

        return buildSharedResult({
            mode,
            alpha,
            sampleSize: result.sampleSize,
            predictorCount: result.predictorCount,
            effectSize: result.effectSize,
            equivalentRSquared: result.equivalentRSquared,
            power: result.power,
            criticalValue: result.criticalValue,
            numeratorDf: result.numeratorDf,
            denominatorDf: result.denominatorDf,
            noncentrality: result.noncentrality,
        });
    }

    if (mode === 'sensitivity') {
        const result = solveEffectSizeByTargetPower({
            powerTarget,
            evaluateAtEffectSize: (candidateEffectSize) => evaluateMultipleRegressionPower({
                alpha,
                effectSize: candidateEffectSize,
                sampleSize,
                predictorCount,
            }),
        });

        return buildSharedResult({
            mode,
            alpha,
            sampleSize: result.sampleSize,
            predictorCount,
            effectSize: result.effectSize,
            equivalentRSquared: fSquaredToRSquared(result.effectSize),
            power: result.power,
            criticalValue: result.criticalValue,
            numeratorDf: result.numeratorDf,
            denominatorDf: result.denominatorDf,
            noncentrality: result.noncentrality,
            targetPower: powerTarget,
        });
    }

    return {
        ok: false,
        planned: true,
        errors: [`${mode} mode is reserved in the shared engine, but it is not implemented for this multiple-regression slice yet.`],
    };
};

const buildIntegerSequence = ({ min, max, current, pointCount }) => {
    const lower = Math.max(4, Math.round(min));
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

export const buildMultipleRegressionCurveModel = ({ result, curveType = 'sample_size' }) => {
    if (!result?.ok) {
        return null;
    }

    if (curveType === 'effect_size') {
        const candidateEffectSizes = buildDecimalSequence({
            min: 0.005,
            max: Math.min(3, Math.max(result.effectSize + 0.18, result.effectSize * 2.5, 0.45)),
            current: result.effectSize,
            pointCount: 81,
            decimals: 4,
        });
        const points = candidateEffectSizes.map((candidateEffectSize) => {
            const curveResult = evaluateMultipleRegressionPower({
                alpha: result.alpha,
                effectSize: candidateEffectSize,
                sampleSize: result.sampleSize,
                predictorCount: result.predictorCount,
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
            title: 'Power vs Effect Size',
            xLabel: 'Effect Size (f²)',
            yLabel: 'Power',
            points,
            currentPoint: {
                x: result.effectSize,
                power: result.actualPower,
            },
            assumptions: `Holding total N = ${result.sampleSize}, alpha = ${roundTo(result.alpha, 3)}, and predictor count = ${result.predictorCount} for the omnibus fixed-model regression test.`,
            currentPointSummary: `f² = ${roundTo(result.effectSize, 4)} (R² ≈ ${roundTo(result.equivalentRSquared, 4)}) gives power ${roundTo(result.actualPower, 4)}.`,
        };
    }

    const minimumSampleSize = result.predictorCount + 2;
    const currentSampleSize = Math.max(minimumSampleSize, Math.round(result.sampleSize));
    const candidateSampleSizes = buildIntegerSequence({
        min: Math.max(minimumSampleSize, Math.floor(currentSampleSize * 0.35)),
        max: Math.max(currentSampleSize + 20, Math.ceil(currentSampleSize * 2)),
        current: currentSampleSize,
        pointCount: 28,
    });
    const points = candidateSampleSizes.map((candidateSampleSize) => {
        const curveResult = evaluateMultipleRegressionPower({
            alpha: result.alpha,
            effectSize: result.effectSize,
            sampleSize: candidateSampleSize,
            predictorCount: result.predictorCount,
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
        assumptions: `Holding effect size f² = ${roundTo(result.effectSize, 3)} (R² ≈ ${roundTo(result.equivalentRSquared, 3)}), alpha = ${roundTo(result.alpha, 3)}, and predictor count = ${result.predictorCount}.`,
        currentPointSummary: `N = ${currentSampleSize} gives power ${roundTo(result.actualPower, 4)} for f² = ${roundTo(result.effectSize, 3)} with ${result.predictorCount} predictors.`,
    };
};

