import { formatStatistic as formatStat } from './statFormatters.js';

export const buildEquationText = ({ stats, xLabel, yLabel }) => {
    if (!stats?.ok) {
        return 'Regression equation unavailable';
    }

    const intercept = Number(stats.intercept);
    const slope = Number(stats.slope);
    const sign = slope >= 0 ? '+' : '-';
    return `${yLabel} = ${formatStat(intercept, 3)} ${sign} ${formatStat(Math.abs(slope), 3)} x ${xLabel}`;
};

export const buildLessonBaseRequest = ({
    preset,
    sampleSize,
    noise,
    generationKey = 0,
}) => ({
    preset,
    sampleSize,
    noise,
    generationKey,
});

export const clampToRange = (value, min, max) => {
    const numeric = Number(value);

    if (!Number.isFinite(numeric)) {
        return min;
    }

    return Math.min(max, Math.max(min, numeric));
};

export const resolvePredictionStep = (summary) => {
    if (!summary) {
        return 0.1;
    }

    const span = Math.max(0, Number(summary.max) - Number(summary.min));

    if (span <= 1) {
        return 0.01;
    }

    if (span <= 10) {
        return 0.1;
    }

    return Math.max(0.1, Number((span / 100).toFixed(2)));
};

export const findDefaultPointId = (stats, preferSyntheticOutlier = false) => {
    if (!stats?.pairs?.length) {
        return null;
    }

    if (preferSyntheticOutlier) {
        const outlier = stats.pairs.find((pair) => pair.isSyntheticOutlier);

        if (outlier) {
            return outlier.id;
        }
    }

    if (stats.influence?.influentialIndex != null) {
        const matchingInfluentialPair = stats.pairs.find((pair) => pair.index === stats.influence.influentialIndex || pair.id === stats.influence.influentialIndex);

        if (matchingInfluentialPair) {
            return matchingInfluentialPair.id;
        }
    }

    return stats.pairs[Math.floor(stats.pairs.length / 2)]?.id ?? null;
};
