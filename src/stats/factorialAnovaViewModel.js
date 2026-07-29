const parseFiniteToken = (token) => {
    const value = Number(token);
    return Number.isFinite(value) ? value : null;
};

export const summarizeFactorialCellRaw = (raw = '') => {
    const values = String(raw)
        .split(/[,\s]+/)
        .filter(Boolean)
        .map(parseFiniteToken)
        .filter((value) => value !== null);
    const n = values.length;
    const mean = n > 0 ? values.reduce((sum, value) => sum + value, 0) / n : 0;
    const sumOfSquares = values.reduce((sum, value) => sum + ((value - mean) ** 2), 0);
    const sd = n > 1 ? Math.sqrt(sumOfSquares / (n - 1)) : 0;

    return {
        values,
        summary: {
            n: String(n),
            mean: mean.toFixed(2),
            sd: sd.toFixed(2),
        },
    };
};

export const isFactorialDatasetEmpty = (cellData = {}) => Object.values(cellData).every((cell) => (
    cell.inputMode === 'raw'
        ? (cell.values?.length || 0) === 0
        : !(Number(cell.summary?.n) > 0)
));

export const createResidualHistogram = (residuals = [], binCount = 10) => {
    const safeBinCount = Math.max(1, Math.floor(binCount));
    const finiteResiduals = residuals.filter(Number.isFinite);

    if (finiteResiduals.length === 0) {
        return Array(safeBinCount).fill(0);
    }

    const minimum = Math.min(...finiteResiduals);
    const maximum = Math.max(...finiteResiduals);
    const range = maximum - minimum;
    const histogram = Array(safeBinCount).fill(0);

    finiteResiduals.forEach((value) => {
        const index = range === 0
            ? Math.floor(safeBinCount / 2)
            : Math.min(safeBinCount - 1, Math.floor(((value - minimum) / range) * safeBinCount));
        histogram[index] += 1;
    });

    return histogram;
};

export const createFactorialTutorContext = ({
    activeTab,
    alpha,
    factors,
    cellData,
    results,
}) => {
    const cellStats = results?.cellStats || {};
    const stats = Object.values(cellStats);
    const sampleSizes = stats.map((cell) => cell.n);
    const absoluteMeans = stats.map((cell) => Math.abs(cell.mean));
    const standardDeviations = stats
        .map((cell) => Math.sqrt(cell.ss / Math.max(1, cell.n - 1)))
        .filter((value) => value > 0 && Number.isFinite(value));
    const factorA = factors[0];
    const factorB = factors[1];
    const slopes = factorB?.levels.map((levelB) => {
        const firstLevel = factorA?.levels[0];
        const lastLevel = factorA?.levels[factorA.levels.length - 1];
        const firstMean = cellStats[`${firstLevel?.id}_${levelB.id}`]?.mean || 0;
        const lastMean = cellStats[`${lastLevel?.id}_${levelB.id}`]?.mean || 0;
        return lastMean - firstMean;
    }) || [];

    let interactionType = 'parallel';
    if (factorA?.levels.length >= 2 && slopes.length >= 2) {
        const slopeDifference = Math.abs(slopes[0] - slopes[1]);
        const crosses = Math.sign(slopes[0]) !== Math.sign(slopes[1])
            && Math.abs(slopes[0]) > 0.1
            && Math.abs(slopes[1]) > 0.1;

        if (crosses) interactionType = 'crossing';
        else if (slopeDifference > 0.5) interactionType = 'non-parallel';
    }

    const sortedMeans = [...absoluteMeans].sort((left, right) => left - right);
    const minimumN = sampleSizes.length ? Math.min(...sampleSizes) : 0;
    const maximumN = sampleSizes.length ? Math.max(...sampleSizes) : 0;
    const minimumSd = standardDeviations.length ? Math.min(...standardDeviations) : 0;
    const maximumSd = standardDeviations.length ? Math.max(...standardDeviations) : 0;

    return {
        activeTab,
        alpha,
        interactionType,
        factorCount: factors.length,
        factorALabel: factorA?.label,
        factorBLabel: factorB?.label,
        totalCells: factors.reduce((count, factor) => count * factor.levels.length, 1),
        allCellsEmpty: isFactorialDatasetEmpty(cellData),
        totalN: sampleSizes.reduce((sum, n) => sum + n, 0),
        anyCellN: minimumN,
        nRange: maximumN - minimumN,
        maxMean: absoluteMeans.length ? Math.max(...absoluteMeans) : 0,
        medianMean: sortedMeans.length ? sortedMeans[Math.floor(sortedMeans.length / 2)] : 0,
        sdRatio: minimumSd > 0 ? maximumSd / minimumSd : 0,
        pA: results?.effects?.A?.p ?? 1,
        pB: results?.effects?.B?.p ?? 1,
        pAxB: results?.effects?.AxB?.p ?? 1,
        pesA: results?.effects?.A?.pes ?? 0,
        pesB: results?.effects?.B?.pes ?? 0,
        pesAxB: results?.effects?.AxB?.pes ?? 0,
        hasEmptyCells: factorA?.levels.some((levelA) => factorB?.levels.some((levelB) => {
            const cell = cellData[`${levelA.id}_${levelB.id}`];
            return cell?.inputMode === 'raw'
                ? (cell.values?.length || 0) === 0
                : !(Number(cell?.summary?.n) > 0);
        })) || false,
        themeSelected: factorA?.label !== 'Factor A' || factorB?.label !== 'Factor B',
        hasViewedExplorer: activeTab === 'explorer',
        highlightPooledMS: activeTab === 'explorer',
    };
};
