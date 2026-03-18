import { clampProbability, inverseNormalCDF, normalCDF, regularizedIncompleteBeta, solveByBinarySearch } from './math.js';

const MIN_GROUP_SIZE = 2;
const NONCENTRAL_T_TOLERANCE = 1e-12;
const NONCENTRAL_T_MAX_TERMS = 512;

const normalizeGroupSampleSize = (value, fallback = MIN_GROUP_SIZE) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? Math.max(MIN_GROUP_SIZE, Math.round(parsed)) : fallback;
};

export const normalizeAllocationRatio = (value, fallback = 1) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

export const splitTotalSampleSize = ({ sampleSize, allocationRatio, minGroupSize = MIN_GROUP_SIZE }) => {
    const totalN = Math.max(minGroupSize * 2, Math.round(Number(sampleSize) || 0));
    const ratio = normalizeAllocationRatio(allocationRatio);
    const idealGroup1 = totalN / (1 + ratio);
    const candidateSet = new Set([
        Math.floor(idealGroup1),
        Math.ceil(idealGroup1),
        minGroupSize,
        totalN - minGroupSize,
    ]);

    let best = null;

    candidateSet.forEach((candidate) => {
        const group1SampleSize = Math.max(minGroupSize, Math.min(totalN - minGroupSize, candidate));
        const group2SampleSize = totalN - group1SampleSize;

        if (group2SampleSize < minGroupSize) {
            return;
        }

        const achievedRatio = group2SampleSize / group1SampleSize;
        const ratioError = Math.abs(achievedRatio - ratio);
        const balanceError = Math.abs(group1SampleSize - idealGroup1);

        if (
            !best ||
            ratioError < best.ratioError - 1e-12 ||
            (Math.abs(ratioError - best.ratioError) <= 1e-12 && balanceError < best.balanceError)
        ) {
            best = {
                sampleSize: totalN,
                group1SampleSize,
                group2SampleSize,
                achievedAllocationRatio: achievedRatio,
                ratioError,
                balanceError,
            };
        }
    });

    return best;
};

export const samplePlanFromGroupSizes = ({ group1SampleSize, group2SampleSize, minGroupSize = MIN_GROUP_SIZE }) => {
    const resolvedGroup1 = normalizeGroupSampleSize(group1SampleSize, minGroupSize);
    const resolvedGroup2 = normalizeGroupSampleSize(group2SampleSize, minGroupSize);

    return {
        sampleSize: resolvedGroup1 + resolvedGroup2,
        group1SampleSize: resolvedGroup1,
        group2SampleSize: resolvedGroup2,
        achievedAllocationRatio: resolvedGroup2 / resolvedGroup1,
        ratioError: 0,
        balanceError: Math.abs(resolvedGroup1 - resolvedGroup2),
    };
};

export const resolveIndependentTSamplePlan = ({
    sampleSize,
    allocationRatio,
    group1SampleSize,
    group2SampleSize,
    minGroupSize = MIN_GROUP_SIZE,
}) => {
    if (Number.isFinite(Number(group1SampleSize)) && Number.isFinite(Number(group2SampleSize))) {
        return samplePlanFromGroupSizes({
            group1SampleSize,
            group2SampleSize,
            minGroupSize,
        });
    }

    return splitTotalSampleSize({
        sampleSize,
        allocationRatio,
        minGroupSize,
    });
};

export const independentTDegreesOfFreedom = ({ group1SampleSize, group2SampleSize }) =>
    Math.max(1, group1SampleSize + group2SampleSize - 2);

export const oneSampleTDegreesOfFreedom = ({ sampleSize }) =>
    Math.max(1, Math.round(sampleSize) - 1);

export const independentTNoncentrality = ({ effectSize, group1SampleSize, group2SampleSize, tails = 2, direction = 'greater' }) => {
    const magnitude = Math.abs(effectSize) * Math.sqrt((group1SampleSize * group2SampleSize) / (group1SampleSize + group2SampleSize));

    if (tails === 2) {
        return magnitude;
    }

    return direction === 'less' ? -magnitude : magnitude;
};

export const oneSampleTNoncentrality = ({ effectSize, sampleSize, tails = 2, direction = 'greater' }) => {
    const magnitude = Math.abs(effectSize) * Math.sqrt(sampleSize);

    if (tails === 2) {
        return magnitude;
    }

    return direction === 'less' ? -magnitude : magnitude;
};

export const studentTCDF = (value, df) => {
    if (!(df > 0)) {
        return NaN;
    }

    if (!Number.isFinite(value)) {
        return value < 0 ? 0 : 1;
    }

    if (Math.abs(value) < 1e-12) {
        return 0.5;
    }

    const x = df / (df + value * value);
    const betaTerm = regularizedIncompleteBeta(x, df / 2, 0.5);
    return value > 0 ? 1 - 0.5 * betaTerm : 0.5 * betaTerm;
};

export const studentTCriticalValue = ({ alpha, tails = 2, df }) => {
    const targetProbability = tails === 2 ? 1 - alpha / 2 : 1 - alpha;
    let high = Math.max(1, inverseNormalCDF(Math.min(0.999999, Math.max(0.500001, targetProbability))));

    while (studentTCDF(high, df) < targetProbability) {
        high *= 2;
    }

    return solveByBinarySearch({
        low: 0,
        high,
        tolerance: 1e-7,
        predicate: (candidate) => studentTCDF(candidate, df) >= targetProbability,
    });
};

const noncentralTCDFPositive = (absoluteValue, df, noncentrality) => {
    const y = (absoluteValue * absoluteValue) / (absoluteValue * absoluteValue + df);
    const noncentralitySquaredHalf = (noncentrality * noncentrality) / 2;
    const expComponent = Math.exp(-noncentralitySquaredHalf);
    let pTerm = expComponent;
    let qTerm = noncentrality * Math.sqrt(2 / Math.PI) * expComponent;
    let sum = normalCDF(-noncentrality);

    for (let j = 0; j < NONCENTRAL_T_MAX_TERMS; j += 1) {
        const increment = 0.5 * (
            pTerm * regularizedIncompleteBeta(y, j + 0.5, df / 2) +
            qTerm * regularizedIncompleteBeta(y, j + 1, df / 2)
        );

        sum += increment;

        if (Math.abs(increment) < NONCENTRAL_T_TOLERANCE) {
            break;
        }

        pTerm *= noncentralitySquaredHalf / (j + 1);
        qTerm *= noncentralitySquaredHalf / (j + 1.5);
    }

    return clampProbability(sum);
};

export const noncentralTCDF = (value, df, noncentrality) => {
    if (!(df > 0)) {
        return NaN;
    }

    if (Math.abs(noncentrality) < 1e-12) {
        return studentTCDF(value, df);
    }

    if (!Number.isFinite(value)) {
        return value < 0 ? 0 : 1;
    }

    if (value >= 0) {
        return noncentralTCDFPositive(value, df, noncentrality);
    }

    return clampProbability(1 - noncentralTCDFPositive(Math.abs(value), df, -noncentrality));
};

export const tPowerFromNoncentrality = ({ criticalValue, df, noncentrality, tails = 2, direction = 'greater' }) => {
    const criticalMagnitude = Math.abs(criticalValue);

    if (tails === 2) {
        return clampProbability(
            1 - noncentralTCDF(criticalMagnitude, df, Math.abs(noncentrality)) +
            noncentralTCDF(-criticalMagnitude, df, Math.abs(noncentrality))
        );
    }

    if (direction === 'less') {
        return clampProbability(noncentralTCDF(-criticalMagnitude, df, noncentrality));
    }

    return clampProbability(1 - noncentralTCDF(criticalMagnitude, df, noncentrality));
};
