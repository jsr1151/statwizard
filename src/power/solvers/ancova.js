import { roundTo } from '../math.js';
import {
    ancovaDenominatorDf,
    ancovaNoncentrality,
    ancovaNumeratorDf,
    centralFCriticalValue,
    fPowerFromNoncentrality,
    oneWayAnovaPerGroupSize,
} from '../fMath.js';
import {
    buildFPowerMetrics,
    buildFPowerVisualizer,
    cleanFInputNumber,
    formatBalancedPerGroupSummary,
    getMinimumBalancedFTestSampleSize,
    resolveBalancedFSampleSize,
    resolveCovariateCount,
    resolveFGroupCount,
    solveEffectSizeByTargetPower,
    solveIntegerSampleSizeByTargetPower,
} from './fShared.js';

const MIN_PER_GROUP_SAMPLE_SIZE = 2;

const evaluateAncovaPower = ({
    alpha,
    effectSize,
    sampleSize,
    groupCount,
    covariateCount,
}) => {
    const resolvedGroupCount = resolveFGroupCount(groupCount);
    const resolvedCovariateCount = resolveCovariateCount(covariateCount);
    const resolvedSampleSize = resolveBalancedFSampleSize({
        value: sampleSize,
        groupCount: resolvedGroupCount,
        covariateCount: resolvedCovariateCount,
        minPerGroupSampleSize: MIN_PER_GROUP_SAMPLE_SIZE,
    });
    const numeratorDf = ancovaNumeratorDf({ groupCount: resolvedGroupCount });
    const denominatorDf = ancovaDenominatorDf({
        sampleSize: resolvedSampleSize,
        groupCount: resolvedGroupCount,
        covariateCount: resolvedCovariateCount,
    });
    const criticalValue = centralFCriticalValue({
        alpha,
        numeratorDf,
        denominatorDf,
    });
    const noncentrality = ancovaNoncentrality({
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
        covariateCount: resolvedCovariateCount,
        perGroupSampleSize,
        isPerGroupExact: isExact,
        numeratorDf,
        denominatorDf,
        criticalValue,
        noncentrality,
        power,
    };
};

const buildAncovaSummary = ({
    mode,
    alpha,
    sampleSize,
    groupCount,
    covariateCount,
    perGroupSampleSize,
    isPerGroupExact,
    effectSize,
    power,
    targetPower,
}) => {
    const perGroupText = formatBalancedPerGroupSummary({ perGroupSampleSize, isPerGroupExact });
    const covariateText = `${covariateCount} covariate${covariateCount === 1 ? '' : 's'}`;
    const balanceNote = isPerGroupExact
        ? 'Balanced groups are exact in this design.'
        : 'Balanced groups are assumed; the per-group count shown is approximate because total N is not divisible by the number of groups.';
    const scopeNote = 'This first ANCOVA slice models the adjusted group main effect only, with fixed effects and common slopes across groups.';

    if (mode === 'a_priori') {
        return `A balanced ANCOVA for the adjusted group effect with ${groupCount} groups and ${covariateText} needs total N = ${sampleSize} (${perGroupText}) to reach power ${roundTo(power, 3)} at alpha ${alpha}. ${scopeNote} ${balanceNote}`;
    }

    if (mode === 'post_hoc') {
        return `With total N = ${sampleSize} across ${groupCount} groups (${perGroupText}) and ${covariateText}, the achieved power for the adjusted group effect is ${roundTo(power, 3)} for effect size f = ${roundTo(effectSize, 3)}. ${scopeNote} ${balanceNote}`;
    }

    return `With total N = ${sampleSize} across ${groupCount} groups (${perGroupText}) and ${covariateText}, the smallest detectable adjusted-group effect is f = ${roundTo(effectSize, 3)} at power ${roundTo(targetPower, 3)}. ${scopeNote} ${balanceNote}`;
};

const buildSharedResult = ({
    mode,
    alpha,
    sampleSize,
    groupCount,
    covariateCount,
    perGroupSampleSize,
    isPerGroupExact,
    effectSize,
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
    groupCount,
    covariateCount,
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
        covariateCount,
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
    summary: buildAncovaSummary({
        mode,
        alpha,
        sampleSize,
        groupCount,
        covariateCount,
        perGroupSampleSize,
        isPerGroupExact,
        effectSize,
        power,
        targetPower,
    }),
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
            covariateCount,
            balancedGroupAssumption: true,
            designLabel: 'Balanced ANCOVA',
            designScopeNote: 'Adjusted group effect with fixed covariates and common slopes.',
        },
    }),
});

export const solveAncovaPower = (rawInputs) => {
    const mode = rawInputs?.mode || 'a_priori';
    const alpha = cleanFInputNumber(rawInputs?.alpha, 0.05);
    const groupCount = resolveFGroupCount(rawInputs?.groupCount);
    const covariateCount = resolveCovariateCount(rawInputs?.covariateCount);
    const sampleSize = resolveBalancedFSampleSize({
        value: rawInputs?.sampleSize,
        groupCount,
        covariateCount,
        minPerGroupSampleSize: MIN_PER_GROUP_SAMPLE_SIZE,
    });
    const effectSize = Math.abs(cleanFInputNumber(rawInputs?.effectSize, 0.25));
    const powerTarget = cleanFInputNumber(rawInputs?.powerTarget, 0.8);
    const minimumSampleSize = getMinimumBalancedFTestSampleSize({
        groupCount,
        covariateCount,
        minPerGroupSampleSize: MIN_PER_GROUP_SAMPLE_SIZE,
    });

    if (!(alpha > 0 && alpha < 1)) {
        return { ok: false, errors: ['Alpha must be between 0 and 1.'] };
    }

    if (!(sampleSize >= minimumSampleSize) && mode !== 'a_priori') {
        return {
            ok: false,
            errors: [`Total N must be at least ${minimumSampleSize} for this balanced ANCOVA slice, given ${groupCount} groups and ${covariateCount} covariates.`],
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
            minSampleSize: Math.max(
                MIN_PER_GROUP_SAMPLE_SIZE,
                Math.ceil(minimumSampleSize / Math.max(1, groupCount))
            ),
            powerTarget,
            evaluateAtSampleSize: (candidatePerGroupSampleSize) => evaluateAncovaPower({
                alpha,
                effectSize,
                groupCount,
                covariateCount,
                sampleSize: groupCount * Math.max(MIN_PER_GROUP_SAMPLE_SIZE, Math.round(candidatePerGroupSampleSize)),
            }),
        });

        return buildSharedResult({
            mode,
            alpha,
            sampleSize: result.sampleSize,
            groupCount: result.groupCount,
            covariateCount: result.covariateCount,
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
        const result = evaluateAncovaPower({
            alpha,
            effectSize,
            sampleSize,
            groupCount,
            covariateCount,
        });

        return buildSharedResult({
            mode,
            alpha,
            sampleSize: result.sampleSize,
            groupCount: result.groupCount,
            covariateCount: result.covariateCount,
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
            evaluateAtEffectSize: (candidateEffectSize) => evaluateAncovaPower({
                alpha,
                effectSize: candidateEffectSize,
                sampleSize,
                groupCount,
                covariateCount,
            }),
        });

        return buildSharedResult({
            mode,
            alpha,
            sampleSize: result.sampleSize,
            groupCount: result.groupCount,
            covariateCount: result.covariateCount,
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
        errors: [`${mode} mode is reserved in the shared engine, but it is not implemented for this ANCOVA slice yet.`],
    };
};
