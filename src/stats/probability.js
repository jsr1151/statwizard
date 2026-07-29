export const combinations = (n, r) => {
    if (!Number.isInteger(n) || !Number.isInteger(r) || n < 0 || r < 0 || r > n) return 0;
    if (r === 0 || r === n) return 1;

    const smallerR = Math.min(r, n - r);
    let result = 1;
    for (let index = 1; index <= smallerR; index += 1) {
        result = result * (n - index + 1) / index;
    }
    return result;
};

export const binomialProbability = ({ successes, trials, probability }) => {
    if (!Number.isInteger(trials) || trials < 0) return Number.NaN;
    if (!Number.isInteger(successes) || successes < 0 || successes > trials) return 0;
    if (!Number.isFinite(probability) || probability < 0 || probability > 1) return Number.NaN;

    return combinations(trials, successes)
        * probability ** successes
        * (1 - probability) ** (trials - successes);
};

export const diceSumDistribution = (diceCount, sides = 6) => {
    if (!Number.isInteger(diceCount) || diceCount < 1) return [];
    if (!Number.isInteger(sides) || sides < 2) return [];

    let counts = new Map([[0, 1]]);
    for (let die = 0; die < diceCount; die += 1) {
        const nextCounts = new Map();
        for (const [currentSum, count] of counts) {
            for (let face = 1; face <= sides; face += 1) {
                const nextSum = currentSum + face;
                nextCounts.set(nextSum, (nextCounts.get(nextSum) || 0) + count);
            }
        }
        counts = nextCounts;
    }

    const outcomeCount = sides ** diceCount;
    return Array.from(counts, ([sum, count]) => ({
        sum,
        probability: count / outcomeCount,
    })).sort((left, right) => left.sum - right.sum);
};
