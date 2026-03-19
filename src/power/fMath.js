import {
    clampProbability,
    logGamma,
    regularizedIncompleteBeta,
    solveByBinarySearch,
} from './math.js';

const NONCENTRAL_F_TOLERANCE = 1e-10;
const NONCENTRAL_F_MAX_TERMS = 512;

export const centralFDensity = (value, numeratorDf, denominatorDf) => {
    if (!(value > 0) || !(numeratorDf > 0) || !(denominatorDf > 0)) {
        return 0;
    }

    const halfNumerator = numeratorDf / 2;
    const halfDenominator = denominatorDf / 2;
    const logConstant =
        halfNumerator * Math.log(numeratorDf / denominatorDf) -
        (logGamma(halfNumerator) + logGamma(halfDenominator) - logGamma(halfNumerator + halfDenominator));
    const logKernel =
        (halfNumerator - 1) * Math.log(value) -
        (halfNumerator + halfDenominator) * Math.log(1 + (numeratorDf / denominatorDf) * value);
    const density = Math.exp(logConstant + logKernel);

    return Number.isFinite(density) ? density : 0;
};

export const centralFCDF = (value, numeratorDf, denominatorDf) => {
    if (!(numeratorDf > 0) || !(denominatorDf > 0)) {
        return NaN;
    }

    if (!(value > 0)) {
        return 0;
    }

    const x = (numeratorDf * value) / ((numeratorDf * value) + denominatorDf);
    return regularizedIncompleteBeta(x, numeratorDf / 2, denominatorDf / 2);
};

const resolveFUpperBound = ({ targetProbability, evaluator }) => {
    let high = 1;

    while (evaluator(high) < targetProbability && high < 1000000) {
        high *= 2;
    }

    return high;
};

export const centralFQuantile = ({ probability, numeratorDf, denominatorDf }) => {
    const targetProbability = clampProbability(probability);
    const high = resolveFUpperBound({
        targetProbability,
        evaluator: (candidate) => centralFCDF(candidate, numeratorDf, denominatorDf),
    });

    return solveByBinarySearch({
        low: 0,
        high,
        tolerance: 1e-7,
        predicate: (candidate) => centralFCDF(candidate, numeratorDf, denominatorDf) >= targetProbability,
    });
};

export const centralFCriticalValue = ({ alpha, numeratorDf, denominatorDf }) =>
    centralFQuantile({
        probability: 1 - alpha,
        numeratorDf,
        denominatorDf,
    });

const iterateNoncentralFTerms = ({ noncentrality, callback }) => {
    const lambdaHalf = noncentrality / 2;
    let weight = Math.exp(-lambdaHalf);

    for (let index = 0; index < NONCENTRAL_F_MAX_TERMS; index += 1) {
        const contribution = callback(weight, index);

        if (Math.abs(contribution) < NONCENTRAL_F_TOLERANCE) {
            break;
        }

        weight *= lambdaHalf / (index + 1);
    }
};

export const noncentralFCDF = (value, numeratorDf, denominatorDf, noncentrality) => {
    if (!(numeratorDf > 0) || !(denominatorDf > 0)) {
        return NaN;
    }

    if (!(value > 0)) {
        return 0;
    }

    if (!(noncentrality > 1e-12)) {
        return centralFCDF(value, numeratorDf, denominatorDf);
    }

    let sum = 0;
    iterateNoncentralFTerms({
        noncentrality,
        callback: (weight, index) => {
            const mixedNumeratorDf = numeratorDf + (2 * index);
            const scale = numeratorDf / mixedNumeratorDf;
            const term = weight * centralFCDF(value * scale, mixedNumeratorDf, denominatorDf);
            sum += term;
            return term;
        },
    });

    return clampProbability(sum);
};

export const noncentralFDensity = (value, numeratorDf, denominatorDf, noncentrality) => {
    if (!(value > 0) || !(numeratorDf > 0) || !(denominatorDf > 0)) {
        return 0;
    }

    if (!(noncentrality > 1e-12)) {
        return centralFDensity(value, numeratorDf, denominatorDf);
    }

    let sum = 0;
    iterateNoncentralFTerms({
        noncentrality,
        callback: (weight, index) => {
            const mixedNumeratorDf = numeratorDf + (2 * index);
            const scale = numeratorDf / mixedNumeratorDf;
            const term = weight * centralFDensity(value * scale, mixedNumeratorDf, denominatorDf) * scale;
            sum += term;
            return term;
        },
    });

    return sum;
};

export const noncentralFQuantile = ({ probability, numeratorDf, denominatorDf, noncentrality }) => {
    const targetProbability = clampProbability(probability);
    const high = resolveFUpperBound({
        targetProbability,
        evaluator: (candidate) => noncentralFCDF(candidate, numeratorDf, denominatorDf, noncentrality),
    });

    return solveByBinarySearch({
        low: 0,
        high,
        tolerance: 1e-7,
        predicate: (candidate) => noncentralFCDF(candidate, numeratorDf, denominatorDf, noncentrality) >= targetProbability,
    });
};

export const fixedEffectsNumeratorDf = ({ groupCount }) =>
    Math.max(1, Math.round(groupCount) - 1);

export const ancovaDenominatorDf = ({ sampleSize, groupCount, covariateCount = 0 }) =>
    Math.max(1, Math.round(sampleSize) - Math.round(groupCount) - Math.max(0, Math.round(covariateCount)));

export const fixedEffectsNoncentrality = ({ effectSize, sampleSize }) =>
    Math.max(0, Number(sampleSize) * (Math.abs(effectSize) ** 2));

export const balancedFPerGroupSize = ({ sampleSize, groupCount }) => {
    const resolvedGroups = Math.max(2, Math.round(groupCount));
    const resolvedSampleSize = Math.max(resolvedGroups + 1, Math.round(sampleSize));
    const perGroupSampleSize = resolvedSampleSize / resolvedGroups;

    return {
        perGroupSampleSize,
        isExact: Math.abs(perGroupSampleSize - Math.round(perGroupSampleSize)) < 1e-9,
    };
};

export const oneWayAnovaNumeratorDf = ({ groupCount }) =>
    fixedEffectsNumeratorDf({ groupCount });

export const ancovaNumeratorDf = ({ groupCount }) =>
    fixedEffectsNumeratorDf({ groupCount });

export const oneWayAnovaDenominatorDf = ({ sampleSize, groupCount }) =>
    ancovaDenominatorDf({ sampleSize, groupCount, covariateCount: 0 });

export const oneWayAnovaNoncentrality = ({ effectSize, sampleSize }) =>
    fixedEffectsNoncentrality({ effectSize, sampleSize });

export const ancovaNoncentrality = ({ effectSize, sampleSize }) =>
    fixedEffectsNoncentrality({ effectSize, sampleSize });

export const oneWayAnovaPerGroupSize = ({ sampleSize, groupCount }) =>
    balancedFPerGroupSize({ sampleSize, groupCount });

export const fPowerFromNoncentrality = ({
    criticalValue,
    numeratorDf,
    denominatorDf,
    noncentrality,
}) => clampProbability(
    1 - noncentralFCDF(criticalValue, numeratorDf, denominatorDf, noncentrality)
);
