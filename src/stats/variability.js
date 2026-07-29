const quantile = (sorted, probability) => {
    if (sorted.length === 1) return sorted[0];
    const index = (sorted.length - 1) * probability;
    const lower = Math.floor(index);
    const fraction = index - lower;
    return sorted[lower] + (sorted[Math.min(lower + 1, sorted.length - 1)] - sorted[lower]) * fraction;
};

export const calculateVariability = (input = []) => {
    const sorted = input.filter(Number.isFinite).sort((a, b) => a - b);
    const n = sorted.length;
    if (n === 0) return null;
    const mean = sorted.reduce((sum, value) => sum + value, 0) / n;
    const sumSquaredDeviations = sorted.reduce((sum, value) => sum + (value - mean) ** 2, 0);
    const populationVariance = sumSquaredDeviations / n;
    const sampleVariance = n > 1 ? sumSquaredDeviations / (n - 1) : null;
    const q1 = quantile(sorted, 0.25);
    const median = quantile(sorted, 0.5);
    const q3 = quantile(sorted, 0.75);
    const iqr = q3 - q1;
    const lowerFence = q1 - 1.5 * iqr;
    const upperFence = q3 + 1.5 * iqr;
    const absoluteDeviations = sorted.map((value) => Math.abs(value - median)).sort((a, b) => a - b);

    return {
        n,
        mean,
        min: sorted[0],
        q1,
        median,
        q3,
        max: sorted[n - 1],
        range: sorted[n - 1] - sorted[0],
        iqr,
        lowerFence,
        upperFence,
        outliers: sorted.filter((value) => value < lowerFence || value > upperFence),
        populationVariance,
        populationSd: Math.sqrt(populationVariance),
        sampleVariance,
        sampleSd: sampleVariance === null ? null : Math.sqrt(sampleVariance),
        mad: quantile(absoluteDeviations, 0.5),
        coefficientOfVariation: mean !== 0 && sampleVariance !== null ? Math.sqrt(sampleVariance) / Math.abs(mean) * 100 : null,
        sorted,
    };
};
