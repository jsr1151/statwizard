import { normalCDF } from '../utils/mathHelpers.js';
import { studentTCDF, studentTCriticalValue } from '../power/tMath.js';

const EPSILON = 1e-12;
const CORRELATION_LIMIT = 0.999999;
const DEFAULT_TUTOR_REFERENCE_SAMPLE_SIZE = 36;
const DEFAULT_TUTOR_REFERENCE_NOISE = 0.28;
const DEFAULT_TUTOR_CONTEXT_DISPLAY_POINTS = 220;
const DEFAULT_TUTOR_POOL_SIZE = 180;
const RESTRICTED_RANGE_FULL_POOL_SIZE = 720;
const TUTOR_ACCEPTANCE_ATTEMPTS = 72;

const clampCorrelation = (value, limit = CORRELATION_LIMIT) => {
    const numeric = Number(value);

    if (!Number.isFinite(numeric)) {
        return 0;
    }

    return Math.max(-limit, Math.min(limit, numeric));
};

const inverseNormalCDF = (p) => {
    if (!(p > 0) || !(p < 1)) {
        throw new Error('Probability must be between 0 and 1.');
    }

    const a = [
        -3.969683028665376e+01,
        2.209460984245205e+02,
        -2.759285104469687e+02,
        1.38357751867269e+02,
        -3.066479806614716e+01,
        2.506628277459239e+00,
    ];
    const b = [
        -5.447609879822406e+01,
        1.615858368580409e+02,
        -1.556989798598866e+02,
        6.680131188771972e+01,
        -1.328068155288572e+01,
    ];
    const c = [
        -7.784894002430293e-03,
        -3.223964580411365e-01,
        -2.400758277161838e+00,
        -2.549732539343734e+00,
        4.374664141464968e+00,
        2.938163982698783e+00,
    ];
    const d = [
        7.784695709041462e-03,
        3.224671290700398e-01,
        2.445134137142996e+00,
        3.754408661907416e+00,
    ];

    const low = 0.02425;
    const high = 1 - low;

    if (p < low) {
        const q = Math.sqrt(-2 * Math.log(p));
        return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
            ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
    }

    if (p > high) {
        const q = Math.sqrt(-2 * Math.log(1 - p));
        return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
            ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
    }

    const q = p - 0.5;
    const r = q * q;
    return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q /
        (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
};

const roundTo = (value, decimals = 4) => {
    const factor = 10 ** decimals;
    return Math.round(Number(value) * factor) / factor;
};

const normalizedAxisPosition = (index, sampleSize) => {
    if (sampleSize <= 1) {
        return 0;
    }

    return ((index / (sampleSize - 1)) * 2) - 1;
};

const clampToRange = (value, min, max) => Math.max(min, Math.min(max, value));

const hashSeedParts = (...parts) => {
    const text = parts.map((part) => `${part}`).join('|');
    let hash = 2166136261;

    for (let index = 0; index < text.length; index += 1) {
        hash ^= text.charCodeAt(index);
        hash = Math.imul(hash, 16777619);
    }

    return hash >>> 0;
};

const createSeededRandom = (seed) => {
    let state = seed >>> 0;

    return () => {
        state = (state + 0x6D2B79F5) | 0;
        let value = Math.imul(state ^ (state >>> 15), 1 | state);
        value ^= value + Math.imul(value ^ (value >>> 7), 61 | value);
        return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
    };
};

const sampleStandardNormal = (random) => {
    const u1 = Math.max(random(), 1e-12);
    const u2 = random();
    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
};

const calculateSimpleCorrelationFromPairs = (pairs = []) => {
    if (pairs.length < 3) {
        return null;
    }

    const xs = pairs.map((pair) => Number(pair.x));
    const ys = pairs.map((pair) => Number(pair.y));
    const meanX = xs.reduce((sum, value) => sum + value, 0) / xs.length;
    const meanY = ys.reduce((sum, value) => sum + value, 0) / ys.length;
    let sumXX = 0;
    let sumYY = 0;
    let sumXY = 0;

    for (let index = 0; index < pairs.length; index += 1) {
        const dx = xs[index] - meanX;
        const dy = ys[index] - meanY;
        sumXX += dx ** 2;
        sumYY += dy ** 2;
        sumXY += dx * dy;
    }

    if (!(sumXX > EPSILON) || !(sumYY > EPSILON)) {
        return null;
    }

    return clampCorrelation(sumXY / Math.sqrt(sumXX * sumYY));
};

const buildTutorAxisValues = ({
    sampleSize,
    random,
    span = 1.35,
    jitterScale = 0.065,
}) => (
    Array.from({ length: sampleSize }, (_, index) => {
        const base = normalizedAxisPosition(index, sampleSize) * span;
        const jitter = sampleStandardNormal(random) * jitterScale * span;
        return clampToRange(base + jitter, -span * 1.08, span * 1.08);
    }).sort((left, right) => left - right)
);

const takeEvenlySpacedPairs = (pairs = [], targetCount = pairs.length) => {
    if (pairs.length <= targetCount) {
        return pairs.map((pair, index) => ({
            ...pair,
            id: index,
        }));
    }

    return Array.from({ length: targetCount }, (_, index) => {
        const ratio = targetCount <= 1 ? 0 : index / (targetCount - 1);
        const sourceIndex = Math.round(ratio * (pairs.length - 1));
        return {
            ...pairs[sourceIndex],
            id: index,
        };
    });
};

const buildNestedTutorSelectionOrder = (count) => {
    if (count <= 0) {
        return [];
    }

    if (count === 1) {
        return [0];
    }

    const order = [0, count - 1];
    const selected = new Set(order);

    while (order.length < count) {
        const sortedSelected = Array.from(selected).sort((left, right) => left - right);
        let bestGap = -1;
        let bestIndex = null;

        for (let index = 0; index < sortedSelected.length - 1; index += 1) {
            const left = sortedSelected[index];
            const right = sortedSelected[index + 1];

            if (right - left <= 1) {
                continue;
            }

            const candidate = Math.floor((left + right) / 2);
            const gap = right - left;

            if (!selected.has(candidate) && gap > bestGap) {
                bestGap = gap;
                bestIndex = candidate;
            }
        }

        if (bestIndex == null) {
            for (let index = 0; index < count; index += 1) {
                if (!selected.has(index)) {
                    bestIndex = index;
                    break;
                }
            }
        }

        if (bestIndex == null) {
            break;
        }

        selected.add(bestIndex);
        order.push(bestIndex);
    }

    return order;
};

const takeNestedTutorPairs = (pairs = [], targetCount = pairs.length) => {
    if (pairs.length <= targetCount) {
        return pairs.map((pair, index) => ({
            ...pair,
            id: index,
        }));
    }

    const selectedIndices = new Set(
        buildNestedTutorSelectionOrder(pairs.length).slice(0, targetCount)
    );

    return pairs
        .filter((_, index) => selectedIndices.has(index))
        .map((pair, index) => ({
            ...pair,
            id: index,
        }));
};

const buildLinearTutorSource = ({
    pointCount,
    slope,
    seed,
    span = 1.35,
    jitterScale = 0.065,
}) => {
    const random = createSeededRandom(seed);
    const xs = buildTutorAxisValues({
        sampleSize: pointCount,
        random,
        span,
        jitterScale,
    });

    return xs.map((x, index) => ({
        id: index,
        x,
        signalY: slope * x,
        residualUnit: sampleStandardNormal(random),
    }));
};

const buildIndependentTutorSource = ({
    pointCount,
    seed,
    xScale = 0.92,
    yScale = 0.88,
}) => {
    const random = createSeededRandom(seed);
    const xs = Array.from(
        { length: pointCount },
        () => clampToRange(sampleStandardNormal(random) * xScale, -1.6, 1.6)
    ).sort((left, right) => left - right);

    return xs.map((x, index) => ({
        id: index,
        x,
        signalY: clampToRange(sampleStandardNormal(random) * yScale, -1.8, 1.8),
        residualUnit: sampleStandardNormal(random),
    }));
};

const buildNonlinearTutorSource = ({
    pointCount,
    seed,
    span = 1.38,
    jitterScale = 0.045,
    curveScale = 1.18,
}) => {
    const random = createSeededRandom(seed);
    const xs = buildTutorAxisValues({
        sampleSize: pointCount,
        random,
        span,
        jitterScale,
    });

    return xs.map((x, index) => {
        const scaledX = x / span;
        return {
            id: index,
            x,
            signalY: curveScale * ((scaledX ** 2) - 0.42),
            residualUnit: sampleStandardNormal(random),
        };
    });
};

const calculateCorrelationFromArrays = (xValues = [], yValues = []) => calculateSimpleCorrelationFromPairs(
    xValues.map((x, index) => ({
        id: index,
        x,
        y: yValues[index],
    }))
);

const buildTutorPatternDiagnostics = (pairs = []) => {
    if (!pairs.length) {
        return {
            r: 0,
            quadraticCorrelation: 0,
            quartileDelta: 0,
            binMeans: [0, 0, 0, 0],
            riseSteps: 0,
            fallSteps: 0,
            edgeVsMiddle: 0,
            binSpan: 0,
            xRange: 0,
            n: 0,
        };
    }

    const sortedPairs = [...pairs].sort((left, right) => left.x - right.x);
    const xs = sortedPairs.map((pair) => pair.x);
    const ys = sortedPairs.map((pair) => pair.y);
    const r = calculateSimpleCorrelationFromPairs(sortedPairs) ?? 0;
    const quadraticCorrelation = calculateCorrelationFromArrays(
        xs.map((value) => value ** 2),
        ys
    ) ?? 0;
    const binCount = 4;
    const binMeans = Array.from({ length: binCount }, (_, index) => {
        const start = Math.floor((index * sortedPairs.length) / binCount);
        const end = index === binCount - 1
            ? sortedPairs.length
            : Math.floor(((index + 1) * sortedPairs.length) / binCount);
        const slice = sortedPairs.slice(start, Math.max(start + 1, end));
        return slice.reduce((sum, pair) => sum + pair.y, 0) / Math.max(1, slice.length);
    });
    const binDiffs = binMeans.slice(1).map((mean, index) => mean - binMeans[index]);
    const riseSteps = binDiffs.filter((diff) => diff > 0.05).length;
    const fallSteps = binDiffs.filter((diff) => diff < -0.05).length;
    const quartileDelta = binMeans[binMeans.length - 1] - binMeans[0];
    const edgeVsMiddle = ((binMeans[0] + binMeans[binMeans.length - 1]) / 2)
        - ((binMeans[1] + binMeans[2]) / 2);
    const binSpan = Math.max(...binMeans) - Math.min(...binMeans);
    const xRange = xs[xs.length - 1] - xs[0];

    return {
        r,
        quadraticCorrelation,
        quartileDelta,
        binMeans,
        riseSteps,
        fallSteps,
        edgeVsMiddle,
        binSpan,
        xRange,
        n: sortedPairs.length,
    };
};

const rangePenalty = (value, min, max, weight = 1) => {
    if (value < min) {
        return (min - value) * weight;
    }

    if (value > max) {
        return (value - max) * weight;
    }

    return 0;
};

const minimumPenalty = (value, min, weight = 1) => (value < min ? (min - value) * weight : 0);
const maximumPenalty = (value, max, weight = 1) => (value > max ? (value - max) * weight : 0);

const evaluateTutorCandidate = ({
    preset,
    visiblePairs = [],
    contextPairs = [],
}) => {
    const visible = buildTutorPatternDiagnostics(visiblePairs);
    const context = buildTutorPatternDiagnostics(contextPairs.length ? contextPairs : visiblePairs);
    let penalty = 0;

    if (preset === 'strong_positive') {
        penalty += rangePenalty(visible.r, 0.84, 0.985, 4);
        penalty += minimumPenalty(visible.quartileDelta, 1.15, 2.5);
        penalty += minimumPenalty(visible.riseSteps, 3, 0.9);
        penalty += maximumPenalty(Math.abs(visible.quadraticCorrelation), 0.24, 2.2);
    } else if (preset === 'weak_positive') {
        penalty += rangePenalty(visible.r, 0.3, 0.62, 4.4);
        penalty += minimumPenalty(visible.quartileDelta, 0.52, 2.2);
        penalty += minimumPenalty(visible.riseSteps, 2, 0.8);
        penalty += maximumPenalty(Math.abs(visible.quadraticCorrelation), 0.24, 2.2);
    } else if (preset === 'strong_negative') {
        penalty += rangePenalty(visible.r, -0.985, -0.84, 4);
        penalty += maximumPenalty(visible.quartileDelta, -1.15, 2.5);
        penalty += minimumPenalty(visible.fallSteps, 3, 0.9);
        penalty += maximumPenalty(Math.abs(visible.quadraticCorrelation), 0.24, 2.2);
    } else if (preset === 'near_zero') {
        const nearZeroLimit = Math.min(0.12, 0.08 + (0.14 / Math.sqrt(Math.max(12, visible.n))));
        penalty += maximumPenalty(Math.abs(visible.r), nearZeroLimit, 6);
        penalty += maximumPenalty(Math.abs(visible.quartileDelta), 0.4, 3);
        penalty += maximumPenalty(Math.abs(visible.quadraticCorrelation), 0.18, 4.5);
        penalty += maximumPenalty(visible.binSpan, 0.7, 2.2);
    } else if (preset === 'nonlinear') {
        penalty += maximumPenalty(Math.abs(visible.r), 0.32, 6);
        penalty += minimumPenalty(visible.edgeVsMiddle, 0.62, 3.4);
        penalty += minimumPenalty(visible.quadraticCorrelation, 0.74, 5.5);
    } else if (preset === 'restricted_range') {
        const rangeRatio = visible.xRange / Math.max(EPSILON, context.xRange);
        penalty += rangePenalty(context.r, 0.84, 0.985, 3.4);
        penalty += rangePenalty(visible.r, 0.12, 0.55, 4.5);
        penalty += minimumPenalty(context.r - visible.r, 0.32, 5.2);
        penalty += maximumPenalty(rangeRatio, 0.34, 3.5);
        penalty += minimumPenalty(visible.quartileDelta, 0.12, 1.4);
    }

    return {
        ok: penalty <= 1e-9,
        penalty,
        visible,
        context,
    };
};

const injectTutorOutlier = ({
    pairs,
    orientation = 'high_x_low_y',
}) => {
    if (!pairs.length) {
        return pairs;
    }

    const xValues = pairs.map((pair) => pair.x);
    const yValues = pairs.map((pair) => pair.y);
    const minX = Math.min(...xValues);
    const maxX = Math.max(...xValues);
    const minY = Math.min(...yValues);
    const maxY = Math.max(...yValues);
    const xSpan = Math.max(0.75, maxX - minX);
    const ySpan = Math.max(0.75, maxY - minY);
    let x = maxX + (xSpan * 0.28);
    let y = minY - (ySpan * 0.34);

    if (orientation === 'high_x_high_y') {
        y = maxY + (ySpan * 0.34);
    }

    const nextId = pairs.reduce((maxId, pair) => Math.max(maxId, Number(pair.id) || 0), -1) + 1;
    return [
        ...pairs,
        {
            id: nextId,
            x,
            y,
            isSyntheticOutlier: true,
        },
    ];
};

const PEARSON_TUTOR_PRESET_CONFIG = {
    strong_positive: {
        kind: 'linear',
        slope: 0.95,
        poolSize: DEFAULT_TUTOR_POOL_SIZE,
        span: 1.35,
        baseResidual: 0.06,
        noiseMultiplier: 0.42,
        outlierOrientation: 'high_x_low_y',
    },
    weak_positive: {
        kind: 'linear',
        slope: 0.34,
        poolSize: DEFAULT_TUTOR_POOL_SIZE,
        span: 1.35,
        baseResidual: 0.16,
        noiseMultiplier: 0.72,
        outlierOrientation: 'high_x_low_y',
    },
    strong_negative: {
        kind: 'linear',
        slope: -0.95,
        poolSize: DEFAULT_TUTOR_POOL_SIZE,
        span: 1.35,
        baseResidual: 0.06,
        noiseMultiplier: 0.42,
        outlierOrientation: 'high_x_high_y',
    },
    near_zero: {
        kind: 'independent',
        poolSize: DEFAULT_TUTOR_POOL_SIZE,
        baseResidual: 0.05,
        noiseMultiplier: 0.22,
        outlierOrientation: 'high_x_high_y',
    },
    nonlinear: {
        kind: 'nonlinear',
        poolSize: DEFAULT_TUTOR_POOL_SIZE,
        baseResidual: 0.06,
        noiseMultiplier: 0.18,
        outlierOrientation: 'high_x_low_y',
    },
    restricted_range: {
        kind: 'restricted_range',
        slope: 0.94,
        fullPoolSize: RESTRICTED_RANGE_FULL_POOL_SIZE,
        displayContextCount: DEFAULT_TUTOR_CONTEXT_DISPLAY_POINTS,
        span: 1.42,
        windowHalfWidth: 0.24,
        baseResidual: 0.1,
        noiseMultiplier: 0.34,
        outlierOrientation: 'high_x_low_y',
    },
};

const resolveTutorPresetConfig = (preset = 'strong_positive') => PEARSON_TUTOR_PRESET_CONFIG[preset]
    || PEARSON_TUTOR_PRESET_CONFIG.strong_positive;

const buildPearsonTutorBaseCandidate = ({
    preset = 'strong_positive',
    generationKey = 0,
    attempt = 0,
}) => {
    const config = resolveTutorPresetConfig(preset);
    const seed = hashSeedParts('pearson_tutor', preset, generationKey, attempt);

    if (config.kind === 'independent') {
        return {
            preset,
            config,
            sourcePairs: buildIndependentTutorSource({
                pointCount: config.poolSize,
                seed,
            }),
        };
    }

    if (config.kind === 'nonlinear') {
        return {
            preset,
            config,
            sourcePairs: buildNonlinearTutorSource({
                pointCount: config.poolSize,
                seed,
            }),
        };
    }

    return {
        preset,
        config,
        sourcePairs: buildLinearTutorSource({
            pointCount: config.kind === 'restricted_range' ? config.fullPoolSize : config.poolSize,
            slope: config.slope,
            seed,
            span: config.span,
            jitterScale: config.kind === 'restricted_range' ? 0.055 : 0.065,
        }),
    };
};

export const derivePearsonTutorDataset = ({
    baseDataset = null,
    sampleSize = DEFAULT_TUTOR_REFERENCE_SAMPLE_SIZE,
    noise = DEFAULT_TUTOR_REFERENCE_NOISE,
    includeOutlier = false,
}) => {
    if (!baseDataset?.sourcePairs?.length) {
        return {
            preset: baseDataset?.preset || 'strong_positive',
            pairs: [],
            contextPairs: [],
            contextStatsPairs: [],
            highlightXRange: null,
        };
    }

    const config = baseDataset.config || resolveTutorPresetConfig(baseDataset.preset);
    const resolvedSampleSize = Math.max(8, Math.round(sampleSize));
    const resolvedNoise = Math.max(0, Math.min(1, Number(noise)));
    const residualScale = config.baseResidual + (resolvedNoise * config.noiseMultiplier);
    const transformedFullPairs = baseDataset.sourcePairs.map((pair, index) => ({
        id: index,
        x: pair.x,
        y: clampToRange(pair.signalY + (pair.residualUnit * residualScale), -2.25, 2.25),
    }));
    const visiblePool = config.kind === 'restricted_range'
        ? transformedFullPairs.filter((pair) => Math.abs(pair.x) <= config.windowHalfWidth)
        : transformedFullPairs;
    const visiblePairs = takeNestedTutorPairs(visiblePool, resolvedSampleSize);
    const pairs = includeOutlier
        ? injectTutorOutlier({
            pairs: visiblePairs,
            orientation: config.outlierOrientation,
        })
        : visiblePairs;

    return {
        preset: baseDataset.preset,
        pairs,
        contextPairs: config.kind === 'restricted_range'
            ? takeEvenlySpacedPairs(transformedFullPairs, config.displayContextCount || DEFAULT_TUTOR_CONTEXT_DISPLAY_POINTS)
            : [],
        contextStatsPairs: config.kind === 'restricted_range' ? transformedFullPairs : [],
        highlightXRange: config.kind === 'restricted_range'
            ? {
                min: -config.windowHalfWidth,
                max: config.windowHalfWidth,
            }
            : null,
    };
};

export const buildPearsonTutorBaseDataset = ({
    preset = 'strong_positive',
    targetSampleSize = DEFAULT_TUTOR_REFERENCE_SAMPLE_SIZE,
    targetNoise = DEFAULT_TUTOR_REFERENCE_NOISE,
    generationKey = 0,
}) => {
    let bestCandidate = null;
    let bestPenalty = Number.POSITIVE_INFINITY;

    for (let attempt = 0; attempt < TUTOR_ACCEPTANCE_ATTEMPTS; attempt += 1) {
        const candidate = buildPearsonTutorBaseCandidate({
            preset,
            generationKey,
            attempt,
        });
        const renderedCandidate = derivePearsonTutorDataset({
            baseDataset: candidate,
            sampleSize: targetSampleSize,
            noise: targetNoise,
            includeOutlier: false,
        });
        const evaluation = evaluateTutorCandidate({
            preset,
            visiblePairs: renderedCandidate.pairs,
            contextPairs: renderedCandidate.contextStatsPairs,
        });

        if (evaluation.penalty < bestPenalty) {
            bestCandidate = candidate;
            bestPenalty = evaluation.penalty;
        }

        if (evaluation.ok) {
            return candidate;
        }
    }

    return bestCandidate || buildPearsonTutorBaseCandidate({
        preset,
        generationKey,
        attempt: 0,
    });
};

export const fisherZTransform = (correlation) => {
    const r = clampCorrelation(correlation);
    return 0.5 * Math.log((1 + r) / (1 - r));
};

export const inverseFisherZ = (zValue) => {
    const expTerm = Math.exp(2 * Number(zValue));
    return clampCorrelation((expTerm - 1) / (expTerm + 1));
};

export const getCorrelationConventionLabel = (correlation) => {
    const magnitude = Math.abs(Number(correlation));

    if (magnitude < 0.1) {
        return 'Very small';
    }

    if (magnitude < 0.3) {
        return 'Small';
    }

    if (magnitude < 0.5) {
        return 'Medium';
    }

    return 'Large';
};

export const buildCorrelationInterpretation = (correlation) => {
    const r = Number(correlation);

    if (!Number.isFinite(r)) {
        return 'Sample correlation r is not available yet.';
    }

    const magnitude = Math.abs(r);

    if (magnitude < 0.05) {
        return 'Near-zero linear association. A curved relationship could still exist.';
    }

    const strength = magnitude < 0.2
        ? 'very weak'
        : magnitude < 0.4
            ? 'weak'
            : magnitude < 0.6
                ? 'moderate'
                : magnitude < 0.8
                    ? 'strong'
                    : 'very strong';
    const direction = r > 0 ? 'positive' : 'negative';

    return `${strength[0].toUpperCase()}${strength.slice(1)} ${direction} linear association.`;
};

export const pairNumericColumns = (xValues = [], yValues = []) => {
    const pairCount = Math.min(xValues.length, yValues.length);
    const pairs = [];

    for (let index = 0; index < pairCount; index += 1) {
        const x = Number(xValues[index]);
        const y = Number(yValues[index]);

        if (Number.isFinite(x) && Number.isFinite(y)) {
            pairs.push({
                id: index,
                index,
                x,
                y,
            });
        }
    }

    return pairs;
};

const summarizeSeries = (values) => {
    const count = values.length;

    if (!count) {
        return null;
    }

    const mean = values.reduce((sum, value) => sum + value, 0) / count;
    const deviations = values.map((value) => value - mean);
    const sumSquares = deviations.reduce((sum, value) => sum + (value ** 2), 0);
    const sampleVariance = count > 1 ? sumSquares / (count - 1) : 0;

    return {
        count,
        mean,
        sampleVariance,
        sampleSD: Math.sqrt(Math.max(0, sampleVariance)),
        min: Math.min(...values),
        max: Math.max(...values),
        range: Math.max(...values) - Math.min(...values),
        uniqueCount: new Set(values.map((value) => roundTo(value, 8))).size,
    };
};

export const calculatePearsonCorrelationStats = ({
    xValues = [],
    yValues = [],
    alpha = 0.05,
    tails = 2,
    direction = 'greater',
    confidenceLevel = 0.95,
    rho0 = 0,
    skipInfluence = false,
}) => {
    const pairedValues = pairNumericColumns(xValues, yValues);
    const n = pairedValues.length;

    if (n < 3) {
        return {
            ok: false,
            errors: ['Pearson correlation needs at least 3 complete X/Y pairs.'],
            pairs: pairedValues,
            n,
        };
    }

    const xs = pairedValues.map((pair) => pair.x);
    const ys = pairedValues.map((pair) => pair.y);
    const xSummary = summarizeSeries(xs);
    const ySummary = summarizeSeries(ys);

    if (!(xSummary?.sampleSD > EPSILON)) {
        return {
            ok: false,
            errors: ['The X variable has almost no variance, so Pearson r cannot be computed.'],
            pairs: pairedValues,
            n,
        };
    }

    if (!(ySummary?.sampleSD > EPSILON)) {
        return {
            ok: false,
            errors: ['The Y variable has almost no variance, so Pearson r cannot be computed.'],
            pairs: pairedValues,
            n,
        };
    }

    let sumXX = 0;
    let sumYY = 0;
    let sumXY = 0;

    pairedValues.forEach((pair) => {
        const dx = pair.x - xSummary.mean;
        const dy = pair.y - ySummary.mean;
        sumXX += dx ** 2;
        sumYY += dy ** 2;
        sumXY += dx * dy;
    });

    if (!(sumXX > EPSILON) || !(sumYY > EPSILON)) {
        return {
            ok: false,
            errors: ['Pearson r could not be computed because one variable has nearly zero spread.'],
            pairs: pairedValues,
            n,
        };
    }

    const r = clampCorrelation(sumXY / Math.sqrt(sumXX * sumYY));
    const rSquared = Math.max(0, Math.min(1, r ** 2));
    const covariance = sumXY / Math.max(1, n - 1);
    const slope = sumXY / sumXX;
    const intercept = ySummary.mean - (slope * xSummary.mean);
    const residualSS = Math.max(0, sumYY - (slope * sumXY));
    const df = Math.max(1, n - 2);
    const residualMSE = df > 0 ? residualSS / df : 0;
    const residualSE = Math.sqrt(Math.max(0, residualMSE));

    const fittedPairs = pairedValues.map((pair) => {
        const fitted = intercept + (slope * pair.x);
        return {
            ...pair,
            fitted,
            residual: pair.y - fitted,
        };
    });

    const confidenceInterval = calculateCorrelationConfidenceInterval({
        r,
        n,
        confidenceLevel,
    });

    const hypothesisTest = calculateCorrelationHypothesisTest({
        r,
        n,
        alpha,
        tails,
        direction,
        rho0,
    });

    const influence = skipInfluence
        ? {
            influentialIndex: null,
            influentialPoint: null,
            maxDeltaR: 0,
            leaveOneOutR: [],
        }
        : calculateCorrelationInfluence({
            xValues: xs,
            yValues: ys,
            baselineR: r,
        });

    return {
        ok: true,
        alpha,
        tails,
        direction,
        confidenceLevel,
        rho0,
        n,
        pairs: fittedPairs,
        xValues: xs,
        yValues: ys,
        xSummary,
        ySummary,
        meanX: xSummary.mean,
        meanY: ySummary.mean,
        sdX: xSummary.sampleSD,
        sdY: ySummary.sampleSD,
        covariance,
        r,
        rSquared,
        slope,
        intercept,
        df,
        sumXX,
        sumYY,
        sumXY,
        residualSS,
        residualMSE,
        residualSE,
        confidenceInterval,
        hypothesisTest,
        influence,
        interpretation: buildCorrelationInterpretation(r),
        conventionLabel: getCorrelationConventionLabel(r),
    };
};

export const calculateCorrelationConfidenceInterval = ({
    r,
    n,
    confidenceLevel = 0.95,
}) => {
    const resolvedCorrelation = clampCorrelation(r);
    const resolvedConfidence = Number(confidenceLevel);

    if (!(n > 3) || !(resolvedConfidence > 0) || !(resolvedConfidence < 1)) {
        return null;
    }

    const alpha = 1 - resolvedConfidence;
    const zCritical = inverseNormalCDF(1 - (alpha / 2));
    const fisherZ = fisherZTransform(resolvedCorrelation);
    const standardError = 1 / Math.sqrt(n - 3);

    return {
        confidenceLevel: resolvedConfidence,
        lower: inverseFisherZ(fisherZ - (zCritical * standardError)),
        upper: inverseFisherZ(fisherZ + (zCritical * standardError)),
        standardError,
        zCritical,
    };
};

export const calculateCorrelationHypothesisTest = ({
    r,
    n,
    alpha = 0.05,
    tails = 2,
    direction = 'greater',
    rho0 = 0,
}) => {
    const resolvedR = clampCorrelation(r);
    const resolvedNull = clampCorrelation(rho0);

    if (!(n >= 3)) {
        return null;
    }

    if (Math.abs(resolvedNull) < 1e-10) {
        const df = Math.max(1, n - 2);
        const tStatistic = resolvedR * Math.sqrt(df / Math.max(EPSILON, 1 - (resolvedR ** 2)));
        const criticalMagnitude = studentTCriticalValue({ alpha, tails, df });
        const criticalValue = tails === 2
            ? Math.abs(criticalMagnitude)
            : (direction === 'less' ? -Math.abs(criticalMagnitude) : Math.abs(criticalMagnitude));
        const pValue = tails === 2
            ? (1 - studentTCDF(Math.abs(tStatistic), df)) * 2
            : (direction === 'greater' ? (1 - studentTCDF(tStatistic, df)) : studentTCDF(tStatistic, df));

        return {
            method: 'exact_t',
            statisticLabel: 't',
            testStatistic: tStatistic,
            criticalValue,
            pValue,
            df,
        };
    }

    const zStatistic = (fisherZTransform(resolvedR) - fisherZTransform(resolvedNull)) * Math.sqrt(Math.max(1, n - 3));
    const criticalMagnitude = inverseNormalCDF(1 - (tails === 2 ? alpha / 2 : alpha));
    const criticalValue = tails === 2
        ? Math.abs(criticalMagnitude)
        : (direction === 'less' ? -Math.abs(criticalMagnitude) : Math.abs(criticalMagnitude));
    const pValue = tails === 2
        ? (1 - normalCDF(Math.abs(zStatistic))) * 2
        : (direction === 'greater' ? (1 - normalCDF(zStatistic)) : normalCDF(zStatistic));

    return {
        method: 'fisher_z',
        statisticLabel: 'z',
        testStatistic: zStatistic,
        criticalValue,
        pValue,
        df: null,
        referenceLabel: 'Fisher z approximation',
    };
};

export const calculateRegressionBandAtX = ({
    stats,
    x,
    confidenceLevel = 0.95,
}) => {
    if (!stats?.ok || !(stats.n > 2) || !(stats.sumXX > EPSILON)) {
        return null;
    }

    const alpha = 1 - Number(confidenceLevel);

    if (!(alpha > 0) || !(alpha < 1)) {
        return null;
    }

    const criticalValue = studentTCriticalValue({ alpha, tails: 2, df: stats.df });
    const fitted = stats.intercept + (stats.slope * x);
    const leverage = (1 / stats.n) + (((x - stats.meanX) ** 2) / stats.sumXX);
    const margin = criticalValue * Math.sqrt(Math.max(0, stats.residualMSE) * leverage);

    return {
        x,
        fitted,
        lower: fitted - margin,
        upper: fitted + margin,
    };
};

export const buildRegressionBand = ({
    stats,
    confidenceLevel = 0.95,
    pointCount = 36,
}) => {
    if (!stats?.ok) {
        return [];
    }

    const span = Math.max(EPSILON, stats.xSummary.max - stats.xSummary.min);
    const minX = stats.xSummary.min - (span * 0.05);
    const maxX = stats.xSummary.max + (span * 0.05);

    return Array.from({ length: pointCount }, (_, index) => {
        const ratio = pointCount <= 1 ? 0 : index / (pointCount - 1);
        const x = minX + ((maxX - minX) * ratio);
        return calculateRegressionBandAtX({
            stats,
            x,
            confidenceLevel,
        });
    }).filter(Boolean);
};

export const calculateCorrelationInfluence = ({
    xValues = [],
    yValues = [],
    baselineR = null,
}) => {
    const pairedValues = pairNumericColumns(xValues, yValues);

    if (pairedValues.length < 4) {
        return {
            influentialIndex: null,
            influentialPoint: null,
            maxDeltaR: 0,
            leaveOneOutR: [],
        };
    }

    const referenceR = baselineR == null
        ? calculatePearsonCorrelationStats({ xValues, yValues }).r
        : baselineR;
    const leaveOneOutR = pairedValues.map((_, index) => {
        const filteredPairs = pairedValues.filter((pair) => pair.index !== index);
        const reducedStats = calculatePearsonCorrelationStats({
            xValues: filteredPairs.map((pair) => pair.x),
            yValues: filteredPairs.map((pair) => pair.y),
            skipInfluence: true,
        });

        return reducedStats?.ok ? reducedStats.r : null;
    });

    let maxDeltaR = 0;
    let influentialIndex = null;

    leaveOneOutR.forEach((leaveOneOutValue, index) => {
        if (!Number.isFinite(leaveOneOutValue)) {
            return;
        }

        const delta = Math.abs(referenceR - leaveOneOutValue);

        if (delta > maxDeltaR) {
            maxDeltaR = delta;
            influentialIndex = index;
        }
    });

    return {
        influentialIndex,
        influentialPoint: influentialIndex == null ? null : pairedValues[influentialIndex],
        maxDeltaR,
        leaveOneOutR,
    };
};

export const buildCorrelationGuidance = (stats) => {
    if (!stats?.ok) {
        return [];
    }

    const guidance = [
        {
            tone: 'note',
            title: 'Pearson targets linear association',
            body: 'A low r can still happen when the relationship is curved, segmented, or otherwise non-linear.',
        },
        {
            tone: 'note',
            title: 'Inspect the scatterplot',
            body: 'Look for a roughly straight-line pattern before leaning on r as your main summary.',
        },
        {
            tone: 'note',
            title: 'Correlation is not causation',
            body: 'Even a strong correlation does not tell you whether X causes Y or whether a third variable is driving both.',
        },
    ];

    if (stats.xSummary.range <= Math.max(1e-6, stats.xSummary.sampleSD * 0.25) || stats.xSummary.uniqueCount <= 3) {
        guidance.unshift({
            tone: 'warning',
            title: 'X has very limited spread',
            body: 'Restricted or nearly constant X values can make r unstable or misleadingly small.',
        });
    }

    if (stats.ySummary.range <= Math.max(1e-6, stats.ySummary.sampleSD * 0.25) || stats.ySummary.uniqueCount <= 3) {
        guidance.unshift({
            tone: 'warning',
            title: 'Y has very limited spread',
            body: 'Restricted or nearly constant Y values can make r unstable or misleadingly small.',
        });
    }

    if (stats.influence?.maxDeltaR >= 0.15) {
        guidance.unshift({
            tone: 'warning',
            title: 'One point may be highly influential',
            body: `Leaving out the most influential point changes r by about ${roundTo(stats.influence.maxDeltaR, 3)}.`,
        });
    }

    return guidance;
};

export const generatePearsonTutorDataset = ({
    preset = 'strong_positive',
    sampleSize = DEFAULT_TUTOR_REFERENCE_SAMPLE_SIZE,
    noise = DEFAULT_TUTOR_REFERENCE_NOISE,
    includeOutlier = false,
    generationKey = 0,
}) => {
    const baseDataset = buildPearsonTutorBaseDataset({
        preset,
        targetSampleSize: sampleSize,
        targetNoise: noise,
        generationKey,
    });

    return derivePearsonTutorDataset({
        baseDataset,
        sampleSize,
        noise,
        includeOutlier,
    });
};
