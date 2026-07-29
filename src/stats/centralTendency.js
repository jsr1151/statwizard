const numberPattern = /^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i;

export const parseNumericInput = (input = '') => {
    const tokens = String(input)
        .split(/[\s,;]+/)
        .map((token) => token.trim())
        .filter(Boolean);
    const values = [];
    const invalid = [];

    tokens.forEach((token) => {
        if (!numberPattern.test(token)) {
            invalid.push(token);
            return;
        }
        const value = Number(token);
        if (Number.isFinite(value)) values.push(value);
        else invalid.push(token);
    });

    return { values, invalid, tokenCount: tokens.length };
};

export const calculateCentralTendency = (input = []) => {
    const values = input.filter(Number.isFinite);
    if (values.length === 0) return null;

    const sorted = [...values].sort((a, b) => a - b);
    const n = sorted.length;
    const sum = sorted.reduce((total, value) => total + value, 0);
    const middle = Math.floor(n / 2);
    const median = n % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
    const frequencies = new Map();
    sorted.forEach((value) => frequencies.set(value, (frequencies.get(value) || 0) + 1));
    const highestFrequency = Math.max(...frequencies.values());
    const modes = highestFrequency > 1
        ? [...frequencies.entries()].filter(([, count]) => count === highestFrequency).map(([value]) => value)
        : [];

    return {
        n,
        sum,
        mean: sum / n,
        median,
        modes,
        modeFrequency: highestFrequency,
        hasUniqueMode: modes.length === 1,
        sorted,
        min: sorted[0],
        max: sorted[n - 1],
        frequencies: [...frequencies.entries()].map(([value, count]) => ({ value, count })),
    };
};

export const calculateWeightedMean = (values = [], weights = []) => {
    if (values.length === 0 || values.length !== weights.length) return null;
    if (!values.every(Number.isFinite) || !weights.every((weight) => Number.isFinite(weight) && weight >= 0)) return null;
    const weightSum = weights.reduce((total, weight) => total + weight, 0);
    if (weightSum === 0) return null;
    return values.reduce((total, value, index) => total + value * weights[index], 0) / weightSum;
};
