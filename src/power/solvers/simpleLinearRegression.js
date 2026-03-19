import {
    centralFCriticalValue,
    fPowerFromNoncentrality,
} from '../fMath.js';
import { roundTo } from '../math.js';
import {
    solveEffectSizeByTargetPower,
    solveIntegerSampleSizeByTargetPower,
} from './searchShared.js';

const MIN_SAMPLE_SIZE = 4;

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

const fSquaredToRSquared = (fSquared) => {
    const value = Math.max(0, Number(fSquared));
    return value / (1 + value);
};

const evaluateSimpleLinearRegressionPower = ({
    alpha,
    effectSize,
    sampleSize,
}) => {
    const resolvedSampleSize = Math.max(MIN_SAMPLE_SIZE, Math.round(Number(sampleSize) || MIN_SAMPLE_SIZE));
    const resolvedEffectSize = clampEffectSize(effectSize, 0.15);
    const numeratorDf = 1;
    const denominatorDf = Math.max(1, resolvedSampleSize - 2);
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
        effectSize: resolvedEffectSize,
        equivalentRSquared: fSquaredToRSquared(resolvedEffectSize),
        numeratorDf,
        denominatorDf,
        criticalValue,
        noncentrality,
        power,
    };
};

const buildRegressionPowerMetrics = ({
    sampleSize,
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

const buildRegressionPowerVisualizer = ({
    alpha,
    effectSize,
    sampleSize,
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
            numeratorDf,
            denominatorDf,
            criticalValue,
            noncentrality,
            actualPower: power,
            targetPower: targetPower ?? null,
            designLabel: 'Simple Linear Regression',
            designSummary: `One predictor regression: central F under H0 and noncentral F under H1 at total N = ${sampleSize}.`,
            designScopeNote: 'Testing the slope against 0 is equivalent to testing one-predictor model R² against 0 in this slice.',
        },
    },
});

const buildSharedResult = ({
    mode,
    alpha,
    sampleSize,
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
    effectSize,
    equivalentRSquared,
    actualPower: power,
    criticalValue,
    numeratorDf,
    denominatorDf,
    noncentrality,
    metrics: buildRegressionPowerMetrics({
        sampleSize,
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
            ? `A simple linear regression study with one predictor needs N = ${sampleSize} to reach power ${roundTo(power, 3)} at alpha ${alpha} for effect size f² = ${roundTo(effectSize, 3)} (R² ≈ ${roundTo(equivalentRSquared, 3)}).`
            : mode === 'post_hoc'
                ? `With N = ${sampleSize}, the achieved power is ${roundTo(power, 3)} for a one-predictor regression effect of f² = ${roundTo(effectSize, 3)} (R² ≈ ${roundTo(equivalentRSquared, 3)}).`
                : `With N = ${sampleSize}, the smallest detectable one-predictor regression effect is f² = ${roundTo(effectSize, 3)} (R² ≈ ${roundTo(equivalentRSquared, 3)}) at power ${roundTo(targetPower, 3)}.`,
    visualizer: buildRegressionPowerVisualizer({
        alpha,
        effectSize,
        sampleSize,
        power,
        criticalValue,
        numeratorDf,
        denominatorDf,
        noncentrality,
        targetPower,
    }),
});

export const solveSimpleLinearRegressionPower = (rawInputs) => {
    const mode = rawInputs?.mode || 'a_priori';
    const alpha = cleanInputNumber(rawInputs?.alpha, 0.05);
    const effectSize = clampEffectSize(rawInputs?.effectSize, 0.15);
    const sampleSize = Math.max(MIN_SAMPLE_SIZE, Math.round(cleanInputNumber(rawInputs?.sampleSize, 50)));
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
            minSampleSize: MIN_SAMPLE_SIZE,
            powerTarget,
            evaluateAtSampleSize: (candidateSampleSize) => evaluateSimpleLinearRegressionPower({
                alpha,
                effectSize,
                sampleSize: candidateSampleSize,
            }),
        });

        return buildSharedResult({
            mode,
            alpha,
            sampleSize: result.sampleSize,
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
        const result = evaluateSimpleLinearRegressionPower({
            alpha,
            effectSize,
            sampleSize,
        });

        return buildSharedResult({
            mode,
            alpha,
            sampleSize: result.sampleSize,
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
            evaluateAtEffectSize: (candidateEffectSize) => evaluateSimpleLinearRegressionPower({
                alpha,
                effectSize: candidateEffectSize,
                sampleSize,
            }),
        });

        return buildSharedResult({
            mode,
            alpha,
            sampleSize: result.sampleSize,
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
        errors: [`${mode} mode is reserved in the shared engine, but it is not implemented for this regression power slice yet.`],
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

export const buildSimpleLinearRegressionCurveModel = ({ result, curveType = 'sample_size' }) => {
    if (!result?.ok) {
        return null;
    }

    if (curveType === 'effect_size') {
        const candidateEffectSizes = buildDecimalSequence({
            min: 0.005,
            max: Math.min(3, Math.max(result.effectSize + 0.15, result.effectSize * 2.5, 0.4)),
            current: result.effectSize,
            pointCount: 81,
            decimals: 4,
        });
        const points = candidateEffectSizes.map((candidateEffectSize) => {
            const curveResult = evaluateSimpleLinearRegressionPower({
                alpha: result.alpha,
                effectSize: candidateEffectSize,
                sampleSize: result.sampleSize,
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
            assumptions: `Holding total N = ${result.sampleSize} and alpha = ${roundTo(result.alpha, 3)} for a one-predictor regression model.`,
            currentPointSummary: `f² = ${roundTo(result.effectSize, 4)} (R² ≈ ${roundTo(result.equivalentRSquared, 4)}) gives power ${roundTo(result.actualPower, 4)}.`,
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
        const curveResult = evaluateSimpleLinearRegressionPower({
            alpha: result.alpha,
            effectSize: result.effectSize,
            sampleSize: candidateSampleSize,
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
        assumptions: `Holding effect size f² = ${roundTo(result.effectSize, 3)} (R² ≈ ${roundTo(result.equivalentRSquared, 3)}) and alpha = ${roundTo(result.alpha, 3)} for a one-predictor regression model.`,
        currentPointSummary: `N = ${currentSampleSize} gives power ${roundTo(result.actualPower, 4)} for f² = ${roundTo(result.effectSize, 3)}.`,
    };
};
