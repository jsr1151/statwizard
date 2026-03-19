import { solveByBinarySearch } from '../math.js';

export const solveIntegerSampleSizeByTargetPower = ({
    minSampleSize,
    powerTarget,
    evaluateAtSampleSize,
    maxSampleSize = 100000,
}) => {
    let upper = minSampleSize;
    let trial = evaluateAtSampleSize(upper);

    while (trial.power < powerTarget && upper < maxSampleSize) {
        upper *= 2;
        trial = evaluateAtSampleSize(upper);
    }

    if (upper >= maxSampleSize && trial.power < powerTarget) {
        throw new Error('Required sample size exceeded the search limit.');
    }

    let low = minSampleSize;
    let high = upper;

    while (low < high) {
        const mid = Math.floor((low + high) / 2);
        const result = evaluateAtSampleSize(mid);

        if (result.power >= powerTarget) {
            high = mid;
        } else {
            low = mid + 1;
        }
    }

    return evaluateAtSampleSize(low);
};

export const solveEffectSizeByTargetPower = ({
    powerTarget,
    evaluateAtEffectSize,
    maxEffectSize = 5,
    initialUpper = 0.05,
}) => {
    let upper = initialUpper;

    while (evaluateAtEffectSize(upper).power < powerTarget && upper < maxEffectSize) {
        upper *= 2;
    }

    if (upper >= maxEffectSize && evaluateAtEffectSize(upper).power < powerTarget) {
        throw new Error('Sensitivity search exceeded the effect-size limit.');
    }

    const effectSize = solveByBinarySearch({
        low: 0,
        high: upper,
        tolerance: 1e-5,
        predicate: (candidate) => evaluateAtEffectSize(candidate).power >= powerTarget,
    });

    return {
        effectSize,
        ...evaluateAtEffectSize(effectSize),
    };
};
