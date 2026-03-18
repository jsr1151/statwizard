import { roundTo, solveByBinarySearch } from '../math.js';
import {
    independentTDegreesOfFreedom,
    independentTNoncentrality,
    normalizeAllocationRatio,
    splitTotalSampleSize,
    studentTCriticalValue,
    tPowerFromNoncentrality,
} from '../tMath.js';

const MIN_TOTAL_SAMPLE_SIZE = 4;

const cleanNumber = (value, fallback) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
};

const evaluateIndependentTPower = ({
    alpha,
    effectSize,
    sampleSize,
    allocationRatio,
    tails,
    direction,
}) => {
    const samplePlan = splitTotalSampleSize({
        sampleSize,
        allocationRatio,
    });
    const df = independentTDegreesOfFreedom(samplePlan);
    const criticalMagnitude = studentTCriticalValue({ alpha, tails, df });
    const criticalValue = tails === 2
        ? criticalMagnitude
        : (direction === 'less' ? -criticalMagnitude : criticalMagnitude);
    const noncentrality = independentTNoncentrality({
        effectSize,
        group1SampleSize: samplePlan.group1SampleSize,
        group2SampleSize: samplePlan.group2SampleSize,
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
        ...samplePlan,
        df,
        power,
        criticalValue,
        noncentrality,
    };
};

const solveRequiredSampleSize = ({
    alpha,
    effectSize,
    powerTarget,
    allocationRatio,
    tails,
    direction,
}) => {
    let upper = MIN_TOTAL_SAMPLE_SIZE;
    let trial = evaluateIndependentTPower({
        alpha,
        effectSize,
        sampleSize: upper,
        allocationRatio,
        tails,
        direction,
    });

    while (trial.power < powerTarget && upper < 100000) {
        upper *= 2;
        trial = evaluateIndependentTPower({
            alpha,
            effectSize,
            sampleSize: upper,
            allocationRatio,
            tails,
            direction,
        });
    }

    if (upper >= 100000 && trial.power < powerTarget) {
        throw new Error('Required sample size exceeded the search limit.');
    }

    let low = MIN_TOTAL_SAMPLE_SIZE;
    let high = upper;

    while (low < high) {
        const mid = Math.floor((low + high) / 2);
        const result = evaluateIndependentTPower({
            alpha,
            effectSize,
            sampleSize: mid,
            allocationRatio,
            tails,
            direction,
        });

        if (result.power >= powerTarget) {
            high = mid;
        } else {
            low = mid + 1;
        }
    }

    return evaluateIndependentTPower({
        alpha,
        effectSize,
        sampleSize: low,
        allocationRatio,
        tails,
        direction,
    });
};

const solveSensitivityEffect = ({
    alpha,
    powerTarget,
    sampleSize,
    allocationRatio,
    tails,
    direction,
}) => {
    const predicate = (effectSize) => {
        const result = evaluateIndependentTPower({
            alpha,
            effectSize,
            sampleSize,
            allocationRatio,
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

    return {
        effectSize,
        ...evaluateIndependentTPower({
            alpha,
            effectSize,
            sampleSize,
            allocationRatio,
            tails,
            direction,
        }),
    };
};

const buildSharedResult = ({
    mode,
    alpha,
    tails,
    direction,
    sampleSize,
    group1SampleSize,
    group2SampleSize,
    achievedAllocationRatio,
    effectSize,
    power,
    criticalValue,
    df,
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
            id: 'group_1_n',
            label: 'Group 1 N',
            value: `${group1SampleSize}`,
        },
        {
            id: 'group_2_n',
            label: 'Group 2 N',
            value: `${group2SampleSize}`,
        },
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
        },
    ];

    if (targetPower != null) {
        metrics.push({
            id: 'target_power',
            label: 'Target Power',
            value: roundTo(targetPower, 4).toFixed(4),
        });
    }

    const groupSplitText = `n1 = ${group1SampleSize}, n2 = ${group2SampleSize}`;

    return {
        ok: true,
        mode,
        alpha,
        tails,
        direction,
        sampleSize,
        group1SampleSize,
        group2SampleSize,
        achievedAllocationRatio,
        effectSize,
        actualPower: power,
        criticalValue,
        df,
        noncentrality,
        metrics,
        summary:
            mode === 'a_priori'
                ? `An independent-samples t test needs total N = ${sampleSize} (${groupSplitText}) to reach power ${roundTo(power, 3)} at alpha ${alpha}.`
                : mode === 'post_hoc'
                    ? `With total N = ${sampleSize} split as ${groupSplitText}, the achieved power is ${roundTo(power, 3)} for effect size d = ${roundTo(effectSize, 3)}.`
                    : `With total N = ${sampleSize} split as ${groupSplitText}, the smallest detectable effect is d = ${roundTo(effectSize, 3)} at power ${roundTo(targetPower, 3)}.`,
        visualizer: {
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
                    mode,
                    alpha,
                    tails,
                    direction,
                    actualPower: power,
                    criticalValue,
                    df,
                    noncentrality,
                    effectSize,
                    sampleSize,
                    group1SampleSize,
                    group2SampleSize,
                    achievedAllocationRatio,
                    targetPower: targetPower ?? null,
                },
            },
        },
    };
};

export const solveIndependentTPower = (rawInputs) => {
    const mode = rawInputs?.mode || 'a_priori';
    const alpha = cleanNumber(rawInputs?.alpha, 0.05);
    const tails = cleanNumber(rawInputs?.tails, 2);
    const direction = rawInputs?.direction || 'greater';
    const effectSize = Math.abs(cleanNumber(rawInputs?.effectSize, 0.5));
    const sampleSize = Math.max(MIN_TOTAL_SAMPLE_SIZE, Math.round(cleanNumber(rawInputs?.sampleSize, 60)));
    const allocationRatio = normalizeAllocationRatio(rawInputs?.allocationRatio, 1);
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
            allocationRatio,
            tails,
            direction,
        });

        return buildSharedResult({
            mode,
            alpha,
            tails,
            direction,
            sampleSize: result.sampleSize,
            group1SampleSize: result.group1SampleSize,
            group2SampleSize: result.group2SampleSize,
            achievedAllocationRatio: result.achievedAllocationRatio,
            effectSize,
            power: result.power,
            criticalValue: result.criticalValue,
            df: result.df,
            noncentrality: result.noncentrality,
            targetPower: powerTarget,
        });
    }

    if (mode === 'post_hoc') {
        const result = evaluateIndependentTPower({
            alpha,
            effectSize,
            sampleSize,
            allocationRatio,
            tails,
            direction,
        });

        return buildSharedResult({
            mode,
            alpha,
            tails,
            direction,
            sampleSize: result.sampleSize,
            group1SampleSize: result.group1SampleSize,
            group2SampleSize: result.group2SampleSize,
            achievedAllocationRatio: result.achievedAllocationRatio,
            effectSize,
            power: result.power,
            criticalValue: result.criticalValue,
            df: result.df,
            noncentrality: result.noncentrality,
        });
    }

    if (mode === 'sensitivity') {
        const result = solveSensitivityEffect({
            alpha,
            powerTarget,
            sampleSize,
            allocationRatio,
            tails,
            direction,
        });

        return buildSharedResult({
            mode,
            alpha,
            tails,
            direction,
            sampleSize: result.sampleSize,
            group1SampleSize: result.group1SampleSize,
            group2SampleSize: result.group2SampleSize,
            achievedAllocationRatio: result.achievedAllocationRatio,
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
