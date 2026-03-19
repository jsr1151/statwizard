import { runPowerAnalysis } from './engine.js';
import { roundTo } from './math.js';
import { resolveIndependentTSamplePlan } from './tMath.js';

const SAMPLE_CURVE_POINTS = 25;
const EFFECT_CURVE_POINTS = 25;

const getMetricLabel = (result, metricId, fallback) =>
    result?.metrics?.find((metric) => metric.id === metricId)?.label || fallback;

const isFDesign = (result) =>
    result?.visualizer?.kind === 'f_distribution' ||
    (
        Number.isFinite(Number(result?.groupCount)) &&
        Number.isFinite(Number(result?.numeratorDf)) &&
        Number.isFinite(Number(result?.denominatorDf))
    );

const describeTailSetting = (tails, direction) => {
    if (Number(tails) === 2) {
        return 'two-tailed';
    }

    return direction === 'less' ? 'one-tailed (left)' : 'one-tailed (right)';
};

const buildIntegerSequence = ({ min, max, current, pointCount }) => {
    const lower = Math.max(1, Math.round(min));
    const upper = Math.max(lower, Math.round(max));
    const target = Math.max(lower, Math.round(current));

    if (upper - lower + 1 <= pointCount) {
        return Array.from({ length: upper - lower + 1 }, (_, index) => lower + index);
    }

    const values = new Set([lower, upper, target]);
    const step = (upper - lower) / Math.max(1, pointCount - 1);

    for (let index = 0; index < pointCount; index += 1) {
        values.add(Math.round(lower + step * index));
    }

    return Array.from(values).sort((a, b) => a - b);
};

const buildDecimalSequence = ({ min, max, current, pointCount, decimals = 3 }) => {
    const lower = Math.max(0.001, Number(min));
    const upper = Math.max(lower, Number(max));
    const target = Math.min(upper, Math.max(lower, Number(current)));
    const values = new Set([
        Number(lower.toFixed(decimals)),
        Number(upper.toFixed(decimals)),
        Number(target.toFixed(decimals)),
    ]);
    const step = (upper - lower) / Math.max(1, pointCount - 1);

    for (let index = 0; index < pointCount; index += 1) {
        values.add(Number((lower + step * index).toFixed(decimals)));
    }

    return Array.from(values).sort((a, b) => a - b);
};

const getCurrentAllocationRatio = (result) => {
    if (Number.isFinite(Number(result?.achievedAllocationRatio)) && Number(result.achievedAllocationRatio) > 0) {
        return Number(result.achievedAllocationRatio);
    }

    const group1 = Number(result?.group1SampleSize);
    const group2 = Number(result?.group2SampleSize);
    if (group1 > 0 && group2 > 0) {
        return group2 / group1;
    }

    return 1;
};

const isGroupBasedDesign = (result) =>
    Number.isFinite(Number(result?.group1SampleSize)) &&
    Number.isFinite(Number(result?.group2SampleSize));

const buildBalancedSampleSequence = ({ min, max, current, pointCount, groupCount }) => {
    const groups = Math.max(2, Math.round(Number(groupCount) || 2));
    const minimum = Math.max(groups * 2, Math.round(min));
    const maximum = Math.max(minimum, Math.round(max));
    const currentSampleSize = Math.max(minimum, Math.round(current));
    const startMultiple = Math.ceil(minimum / groups);
    const endMultiple = Math.max(startMultiple, Math.floor(maximum / groups));

    if (endMultiple - startMultiple + 1 <= pointCount) {
        const values = Array.from(
            { length: endMultiple - startMultiple + 1 },
            (_, index) => (startMultiple + index) * groups
        );
        values.push(currentSampleSize);
        return Array.from(new Set(values)).sort((a, b) => a - b);
    }

    const multiples = new Set([startMultiple, endMultiple, Math.max(startMultiple, Math.round(currentSampleSize / groups))]);
    const step = (endMultiple - startMultiple) / Math.max(1, pointCount - 1);

    for (let index = 0; index < pointCount; index += 1) {
        multiples.add(Math.round(startMultiple + step * index));
    }

    const values = Array.from(multiples).map((multiple) => multiple * groups);
    values.push(currentSampleSize);
    return Array.from(new Set(values)).sort((a, b) => a - b);
};

const buildPostHocInputs = ({ result, effectSize, sampleSize }) => {
    const baseInputs = {
        mode: 'post_hoc',
        alpha: result.alpha,
        effectSize,
    };

    if (result.tails != null) {
        baseInputs.tails = result.tails;
    }

    if (result.direction != null) {
        baseInputs.direction = result.direction;
    }

    if (isFDesign(result)) {
        baseInputs.groupCount = Math.max(2, Math.round(Number(result.groupCount) || 2));
    }

    if (isGroupBasedDesign(result)) {
        const currentRatio = getCurrentAllocationRatio(result);
        const samplePlan = sampleSize == null
            ? {
                group1SampleSize: Math.round(Number(result.group1SampleSize)),
                group2SampleSize: Math.round(Number(result.group2SampleSize)),
            }
            : resolveIndependentTSamplePlan({
                sampleSize,
                allocationRatio: currentRatio,
            });

        return {
            ...baseInputs,
            group1SampleSize: samplePlan.group1SampleSize,
            group2SampleSize: samplePlan.group2SampleSize,
        };
    }

    return {
        ...baseInputs,
        sampleSize: sampleSize == null ? Math.round(Number(result.sampleSize)) : sampleSize,
    };
};

const evaluateCurvePoint = ({ testConfig, inputs, xAccessor }) => {
    const curveResult = runPowerAnalysis(testConfig, inputs);

    if (!curveResult?.ok) {
        return null;
    }

    return {
        x: xAccessor(curveResult),
        power: curveResult.actualPower,
    };
};

const buildSampleCurve = ({ testConfig, result }) => {
    const currentSampleSize = Math.max(2, Math.round(Number(result.sampleSize)));
    const minimumSampleSize = isGroupBasedDesign(result)
        ? 4
        : (isFDesign(result) ? Math.max(4, Math.round(Number(result.groupCount) || 2) * 2) : 2);
    const lowerBound = Math.max(minimumSampleSize, Math.floor(currentSampleSize * 0.25));
    const upperBound = Math.max(
        currentSampleSize,
        Math.min(2500, Math.max(currentSampleSize + 12, Math.ceil(currentSampleSize * 2)))
    );
    const candidateSampleSizes = isFDesign(result)
        ? buildBalancedSampleSequence({
            min: lowerBound,
            max: upperBound,
            current: currentSampleSize,
            pointCount: SAMPLE_CURVE_POINTS,
            groupCount: result.groupCount,
        })
        : buildIntegerSequence({
            min: lowerBound,
            max: upperBound,
            current: currentSampleSize,
            pointCount: SAMPLE_CURVE_POINTS,
        });

    const points = candidateSampleSizes
        .map((candidateSampleSize) => evaluateCurvePoint({
            testConfig,
            inputs: buildPostHocInputs({
                result,
                sampleSize: candidateSampleSize,
                effectSize: result.effectSize,
            }),
            xAccessor: (curveResult) => curveResult.sampleSize,
        }))
        .filter(Boolean);

    if (points.length < 2) {
        return null;
    }

    const effectLabel = getMetricLabel(result, 'effect_size', 'Effect Size');
    const sampleLabel = getMetricLabel(result, 'sample_size', 'Total N');
    const ratioNote = isGroupBasedDesign(result)
        ? ` and allocation ratio about ${roundTo(getCurrentAllocationRatio(result), 2)}`
        : '';
    const assumptions = isFDesign(result)
        ? `Holding ${effectLabel} = ${roundTo(result.effectSize, 3)}, alpha = ${roundTo(result.alpha, 3)}, ${Math.round(Number(result.groupCount) || 2)} groups, and a balanced split across groups.`
        : `Holding ${effectLabel} = ${roundTo(result.effectSize, 3)}, alpha = ${roundTo(result.alpha, 3)}, ${describeTailSetting(result.tails, result.direction)}${ratioNote}.`;
    const currentPointSummary = isFDesign(result)
        ? `${sampleLabel} = ${currentSampleSize} gives power ${roundTo(result.actualPower, 4)} with ${Math.round(Number(result.groupCount) || 2)} balanced groups${Number.isFinite(Number(result?.perGroupSampleSize)) ? ` (~${roundTo(result.perGroupSampleSize, result.isPerGroupExact ? 0 : 2)} per group)` : ''}.`
        : `${sampleLabel} = ${currentSampleSize} gives power ${roundTo(result.actualPower, 4)}.`;

    return {
        ok: true,
        curveType: 'sample_size',
        title: 'Power vs Sample Size',
        xLabel: sampleLabel,
        yLabel: 'Power',
        points,
        currentPoint: {
            x: currentSampleSize,
            power: result.actualPower,
        },
        assumptions,
        currentPointSummary,
    };
};

const buildEffectCurve = ({ testConfig, result }) => {
    const currentEffectSize = Math.max(0.001, Number(result.effectSize));
    const lowerBound = currentEffectSize < 0.05 ? 0.01 : 0.05;
    const upperBound = Math.min(3, Math.max(1, currentEffectSize * 2.5, currentEffectSize + 0.5));
    const candidateEffectSizes = buildDecimalSequence({
        min: lowerBound,
        max: upperBound,
        current: currentEffectSize,
        pointCount: EFFECT_CURVE_POINTS,
        decimals: 3,
    });

    const points = candidateEffectSizes
        .map((candidateEffectSize) => evaluateCurvePoint({
            testConfig,
            inputs: buildPostHocInputs({
                result,
                effectSize: candidateEffectSize,
            }),
            xAccessor: (curveResult) => curveResult.effectSize,
        }))
        .filter(Boolean);

    if (points.length < 2) {
        return null;
    }

    const effectLabel = getMetricLabel(result, 'effect_size', 'Effect Size');
    const sampleLabel = getMetricLabel(result, 'sample_size', 'Total N');
    const sampleNote = isGroupBasedDesign(result)
        ? `${sampleLabel} = ${result.sampleSize} (n1 = ${result.group1SampleSize}, n2 = ${result.group2SampleSize})`
        : (isFDesign(result)
            ? `${sampleLabel} = ${result.sampleSize} across ${Math.round(Number(result.groupCount) || 2)} balanced groups${Number.isFinite(Number(result?.perGroupSampleSize)) ? ` (~${roundTo(result.perGroupSampleSize, result.isPerGroupExact ? 0 : 2)} per group)` : ''}`
            : `${sampleLabel} = ${result.sampleSize}`);
    const assumptions = isFDesign(result)
        ? `Holding ${sampleNote}, alpha = ${roundTo(result.alpha, 3)}, and the same balanced one-way ANOVA group structure.`
        : `Holding ${sampleNote}, alpha = ${roundTo(result.alpha, 3)}, and ${describeTailSetting(result.tails, result.direction)}.`;

    return {
        ok: true,
        curveType: 'effect_size',
        title: 'Power vs Effect Size',
        xLabel: effectLabel,
        yLabel: 'Power',
        points,
        currentPoint: {
            x: currentEffectSize,
            power: result.actualPower,
        },
        assumptions,
        currentPointSummary: `${effectLabel} = ${roundTo(currentEffectSize, 4)} gives power ${roundTo(result.actualPower, 4)}.`,
    };
};

export const buildPowerCurveModel = ({ testConfig, result, curveType = 'sample_size' }) => {
    if (!result?.ok || !(result.actualPower >= 0)) {
        return null;
    }

    if (curveType === 'effect_size') {
        return buildEffectCurve({ testConfig, result });
    }

    return buildSampleCurve({ testConfig, result });
};
