import { roundTo } from '../math.js';
import {
    centralFCriticalValue,
    fPowerFromNoncentrality,
    oneWayAnovaDenominatorDf,
    oneWayAnovaNoncentrality,
    oneWayAnovaNumeratorDf,
    oneWayAnovaPerGroupSize,
} from '../fMath.js';
import {
    buildFPowerMetrics,
    buildFPowerVisualizer,
    solveEffectSizeByTargetPower,
    solveIntegerSampleSizeByTargetPower,
} from './fShared.js';

const MIN_GROUP_COUNT = 2;
const MIN_PER_GROUP_SAMPLE_SIZE = 2;

const cleanNumber = (value, fallback) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
};

const resolveGroupCount = (value) => Math.max(MIN_GROUP_COUNT, Math.round(cleanNumber(value, 3)));

const getMinimumTotalSampleSize = (groupCount) =>
    Math.max(MIN_GROUP_COUNT * MIN_PER_GROUP_SAMPLE_SIZE, resolveGroupCount(groupCount) * MIN_PER_GROUP_SAMPLE_SIZE);

const resolveSampleSize = (value, groupCount) =>
    Math.max(
        getMinimumTotalSampleSize(groupCount),
        Math.round(cleanNumber(value, Math.max(getMinimumTotalSampleSize(groupCount), resolveGroupCount(groupCount) * 20)))
    );

const evaluateOneWayAnovaPower = ({
    alpha,
    effectSize,
    sampleSize,
    groupCount,
}) => {
    const resolvedGroupCount = resolveGroupCount(groupCount);
    const resolvedSampleSize = resolveSampleSize(sampleSize, resolvedGroupCount);
    const numeratorDf = oneWayAnovaNumeratorDf({ groupCount: resolvedGroupCount });
    const denominatorDf = oneWayAnovaDenominatorDf({
        sampleSize: resolvedSampleSize,
        groupCount: resolvedGroupCount,
    });
    const criticalValue = centralFCriticalValue({
        alpha,
        numeratorDf,
        denominatorDf,
    });
    const noncentrality = oneWayAnovaNoncentrality({
        effectSize,
        sampleSize: resolvedSampleSize,
    });
    const { perGroupSampleSize, isExact } = oneWayAnovaPerGroupSize({
        sampleSize: resolvedSampleSize,
        groupCount: resolvedGroupCount,
    });
    const power = fPowerFromNoncentrality({
        criticalValue,
        numeratorDf,
        denominatorDf,
        noncentrality,
    });

    return {
        sampleSize: resolvedSampleSize,
        groupCount: resolvedGroupCount,
        perGroupSampleSize,
        isPerGroupExact: isExact,
        numeratorDf,
        denominatorDf,
        criticalValue,
        noncentrality,
        power,
    };
};

const formatPerGroupSummary = ({ perGroupSampleSize, isPerGroupExact }) =>
    isPerGroupExact
        ? `${Math.round(perGroupSampleSize)} per group`
        : `about ${roundTo(perGroupSampleSize, 2)} per group`;

const buildSharedResult = ({
    mode,
    alpha,
    sampleSize,
    groupCount,
    perGroupSampleSize,
    isPerGroupExact,
    effectSize,
    power,
    criticalValue,
    numeratorDf,
    denominatorDf,
    noncentrality,
    targetPower,
}) => {
    const perGroupText = formatPerGroupSummary({ perGroupSampleSize, isPerGroupExact });
    const balanceNote = isPerGroupExact
        ? 'Balanced groups are exact in this design.'
        : 'Balanced groups are assumed; the per-group count shown is approximate because total N is not divisible by the number of groups.';

    return {
        ok: true,
        mode,
        alpha,
        sampleSize,
        groupCount,
        perGroupSampleSize,
        isPerGroupExact,
        effectSize,
        actualPower: power,
        criticalValue,
        numeratorDf,
        denominatorDf,
        noncentrality,
        metrics: buildFPowerMetrics({
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
        }),
        summary:
            mode === 'a_priori'
                ? `A balanced one-way ANOVA with ${groupCount} groups needs total N = ${sampleSize} (${perGroupText}) to reach power ${roundTo(power, 3)} at alpha ${alpha}. ${balanceNote}`
                : mode === 'post_hoc'
                    ? `With total N = ${sampleSize} across ${groupCount} groups (${perGroupText}), the achieved power is ${roundTo(power, 3)} for effect size f = ${roundTo(effectSize, 3)}. ${balanceNote}`
                    : `With total N = ${sampleSize} across ${groupCount} groups (${perGroupText}), the smallest detectable effect is f = ${roundTo(effectSize, 3)} at power ${roundTo(targetPower, 3)}. ${balanceNote}`,
        visualizer: buildFPowerVisualizer({
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
            extraPowerMeta: {
                mode,
                balancedGroupAssumption: true,
            },
        }),
    };
};

export const solveOneWayAnovaPower = (rawInputs) => {
    const mode = rawInputs?.mode || 'a_priori';
    const alpha = cleanNumber(rawInputs?.alpha, 0.05);
    const groupCount = resolveGroupCount(rawInputs?.groupCount);
    const sampleSize = resolveSampleSize(rawInputs?.sampleSize, groupCount);
    const effectSize = Math.abs(cleanNumber(rawInputs?.effectSize, 0.25));
    const powerTarget = cleanNumber(rawInputs?.powerTarget, 0.8);

    if (!(alpha > 0 && alpha < 1)) {
        return { ok: false, errors: ['Alpha must be between 0 and 1.'] };
    }

    if (!(groupCount >= MIN_GROUP_COUNT)) {
        return { ok: false, errors: ['Number of groups must be at least 2.'] };
    }

    if (!(sampleSize >= getMinimumTotalSampleSize(groupCount)) && mode !== 'a_priori') {
        return {
            ok: false,
            errors: [`Total N must be at least ${getMinimumTotalSampleSize(groupCount)} so the balanced design has about 2 observations per group.`],
        };
    }

    if (!(powerTarget > 0 && powerTarget < 1) && mode !== 'post_hoc') {
        return { ok: false, errors: ['Target power must be between 0 and 1.'] };
    }

    if (!(effectSize > 0) && mode !== 'sensitivity') {
        return { ok: false, errors: ['Effect size must be greater than 0.'] };
    }

    if (mode === 'a_priori') {
        const result = solveIntegerSampleSizeByTargetPower({
            minSampleSize: MIN_PER_GROUP_SAMPLE_SIZE,
            powerTarget,
            evaluateAtSampleSize: (candidatePerGroupSampleSize) => evaluateOneWayAnovaPower({
                alpha,
                effectSize,
                groupCount,
                sampleSize: groupCount * Math.max(MIN_PER_GROUP_SAMPLE_SIZE, Math.round(candidatePerGroupSampleSize)),
            }),
        });

        return buildSharedResult({
            mode,
            alpha,
            sampleSize: result.sampleSize,
            groupCount: result.groupCount,
            perGroupSampleSize: result.perGroupSampleSize,
            isPerGroupExact: result.isPerGroupExact,
            effectSize,
            power: result.power,
            criticalValue: result.criticalValue,
            numeratorDf: result.numeratorDf,
            denominatorDf: result.denominatorDf,
            noncentrality: result.noncentrality,
            targetPower: powerTarget,
        });
    }

    if (mode === 'post_hoc') {
        const result = evaluateOneWayAnovaPower({
            alpha,
            effectSize,
            sampleSize,
            groupCount,
        });

        return buildSharedResult({
            mode,
            alpha,
            sampleSize: result.sampleSize,
            groupCount: result.groupCount,
            perGroupSampleSize: result.perGroupSampleSize,
            isPerGroupExact: result.isPerGroupExact,
            effectSize,
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
            evaluateAtEffectSize: (candidateEffectSize) => evaluateOneWayAnovaPower({
                alpha,
                effectSize: candidateEffectSize,
                sampleSize,
                groupCount,
            }),
        });

        return buildSharedResult({
            mode,
            alpha,
            sampleSize: result.sampleSize,
            groupCount: result.groupCount,
            perGroupSampleSize: result.perGroupSampleSize,
            isPerGroupExact: result.isPerGroupExact,
            effectSize: result.effectSize,
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
        errors: [`${mode} mode is reserved in the shared engine, but it is not implemented for this F-test slice yet.`],
    };
};
