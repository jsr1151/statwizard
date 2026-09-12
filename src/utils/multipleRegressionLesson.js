import { formatStatistic as formatStat } from '../utils/statFormatters.js';
import { INTERNAL_PREDICTOR_IDS, LESSON_CONTEXTS } from '../data/multipleRegressionLesson.js';

export const clampToRange = (value, min, max) => {
    const numeric = Number(value);

    if (!Number.isFinite(numeric)) {
        return min;
    }

    return Math.min(max, Math.max(min, numeric));
};

export const countNumericCompleteCasesFromColumns = (columns = [], totalRows = 0) => {
    if (!columns.length || totalRows <= 0) {
        return {
            total: totalRows,
            usable: 0,
            dropped: Math.max(0, totalRows),
        };
    }

    const usable = Array.from({ length: totalRows }, (_, rowIndex) => (
        columns.every((column) => Number.isFinite(column?.numericValues?.[rowIndex]))
    )).filter(Boolean).length;

    return {
        total: totalRows,
        usable,
        dropped: Math.max(0, totalRows - usable),
    };
};

export const getLessonContext = (contextId) =>
    LESSON_CONTEXTS.find((context) => context.id === contextId) || LESSON_CONTEXTS[0];

export const getContextualPredictorLabel = (context, predictorId) => (
    predictorId === INTERNAL_PREDICTOR_IDS[0]
        ? context.predictorLabels[0]
        : predictorId === INTERNAL_PREDICTOR_IDS[1]
            ? context.predictorLabels[1]
            : predictorId
);

export const getPredictorSymbol = (predictorId) => (
    predictorId === INTERNAL_PREDICTOR_IDS[0]
        ? 'X1'
        : predictorId === INTERNAL_PREDICTOR_IDS[1]
            ? 'X2'
            : predictorId
);

export const getSlopeSymbol = (predictorId) => (
    predictorId === INTERNAL_PREDICTOR_IDS[0]
        ? 'b₁'
        : predictorId === INTERNAL_PREDICTOR_IDS[1]
            ? 'b₂'
            : 'b'
);

export const findCoefficient = (stats, predictorId) =>
    stats?.coefficients?.find((coefficient) => coefficient.id === predictorId) || null;

export const formatSignedDifference = (value, digits = 3) => {
    const numeric = Number(value);

    if (!Number.isFinite(numeric)) {
        return '--';
    }

    return `${numeric >= 0 ? '+' : '-'}${formatStat(Math.abs(numeric), digits)}`;
};

export const buildEquationText = ({ stats, outcomeLabel = 'Y' }) => {
    if (!stats?.ok) {
        return 'Regression equation unavailable';
    }

    const terms = stats.coefficients
        .filter((coefficient) => coefficient.id !== 'intercept')
        .map((coefficient) => `${coefficient.estimate >= 0 ? '+' : '-'} ${formatStat(Math.abs(coefficient.estimate), 3)} * ${coefficient.label}`);

    return `${outcomeLabel} = ${formatStat(stats.intercept, 3)} ${terms.join(' ')}`;
};

export const buildLessonEquationText = ({ stats, context }) => {
    if (!stats?.ok) {
        return 'Live equation unavailable';
    }

    const predictorOne = getContextualPredictorLabel(context, INTERNAL_PREDICTOR_IDS[0]);
    const predictorTwo = getContextualPredictorLabel(context, INTERNAL_PREDICTOR_IDS[1]);
    const coefficientOne = findCoefficient(stats, INTERNAL_PREDICTOR_IDS[0]);
    const coefficientTwo = findCoefficient(stats, INTERNAL_PREDICTOR_IDS[1]);

    if (!coefficientOne || !coefficientTwo) {
        return 'Live equation unavailable';
    }

    return `Ŷ = ${formatStat(stats.intercept, 2)} ${coefficientOne.estimate >= 0 ? '+' : '-'} ${formatStat(Math.abs(coefficientOne.estimate), 2)}(${predictorOne}) ${coefficientTwo.estimate >= 0 ? '+' : '-'} ${formatStat(Math.abs(coefficientTwo.estimate), 2)}(${predictorTwo})`;
};

export const buildLessonSymbolicEquation = (context) => (
    `Ŷ = b₀ + b₁(${getContextualPredictorLabel(context, INTERNAL_PREDICTOR_IDS[0])}) + b₂(${getContextualPredictorLabel(context, INTERNAL_PREDICTOR_IDS[1])})`
);

export const buildLessonSubstitutedEquation = ({ stats, prediction }) => {
    if (!stats?.ok || !prediction) {
        return 'Substituted prediction unavailable';
    }

    const predictorOne = INTERNAL_PREDICTOR_IDS[0];
    const predictorTwo = INTERNAL_PREDICTOR_IDS[1];
    const coefficientOne = findCoefficient(stats, predictorOne);
    const coefficientTwo = findCoefficient(stats, predictorTwo);
    const valueOne = prediction.predictorValues?.[predictorOne];
    const valueTwo = prediction.predictorValues?.[predictorTwo];

    if (!coefficientOne || !coefficientTwo) {
        return 'Substituted prediction unavailable';
    }

    return `Ŷ = ${formatStat(stats.intercept, 2)} ${coefficientOne.estimate >= 0 ? '+' : '-'} ${formatStat(Math.abs(coefficientOne.estimate), 2)}(${formatStat(valueOne, 2)}) ${coefficientTwo.estimate >= 0 ? '+' : '-'} ${formatStat(Math.abs(coefficientTwo.estimate), 2)}(${formatStat(valueTwo, 2)}) = ${formatStat(prediction.fitted, 2)}`;
};

export const buildLessonDiagnostics = ({ stats }) => {
    if (!stats?.ok) {
        return [];
    }

    const overlapCorrelation = Math.abs(stats.predictorCorrelationMatrix?.[0]?.values?.[1] || 0);
    const leverageCutoff = (2 * (stats.predictorCount + 1)) / Math.max(1, stats.n);
    const cooksCutoff = 4 / Math.max(1, stats.n);

    return [
        {
            id: 'linearity',
            label: 'Linearity',
            status: stats.residualSpreadRatio > 2.25 ? 'Watch closely' : 'Looks reasonable',
            what: 'The fitted mean should change in a roughly straight-line way as the predictors change.',
            check: 'Use the partial-effect views and the residual plot. Curved patterns or systematic waves suggest the additive straight-line model is incomplete.',
            ifFails: 'The fitted line or plane can miss important structure, so slopes become oversimplified summaries.',
            doNext: 'Transform variables, add polynomial terms, or consider whether an interaction or another model form is needed.',
        },
        {
            id: 'independence',
            label: 'Independence of errors',
            status: 'Needs design context',
            what: 'Residuals from one case should not depend on residuals from another case.',
            check: 'Think about how the data were collected. Repeated measures, clustered classrooms, or time-series data often violate independence.',
            ifFails: 'Standard errors and p values can look more certain than they really are.',
            doNext: 'Use a model that matches the design, such as mixed models, generalized estimating equations, or time-series methods.',
        },
        {
            id: 'homoscedasticity',
            label: 'Homoscedasticity',
            status: stats.residualSpreadRatio > 2.25 ? 'Residual spread changes' : 'Residual spread is fairly even',
            what: 'The residual spread should stay fairly similar across the fitted range.',
            check: `In this sample, the residual spread ratio is about ${formatStat(stats.residualSpreadRatio, 2)}. Funnel shapes in the residual plot are the main warning sign.`,
            ifFails: 'Confidence intervals and p values can become less trustworthy, especially for coefficient tests.',
            doNext: 'Try transformations, robust standard errors, or a model that allows changing variance.',
        },
        {
            id: 'normality',
            label: 'Normality of residuals',
            status: Math.abs(stats.residualSkewness) > 1 ? 'Residuals are skewed' : 'Residuals are fairly balanced',
            what: 'For small samples, the residuals should be reasonably symmetric and not dominated by extreme tails.',
            check: `This sample has residual skewness ${formatStat(stats.residualSkewness, 2)}. A Q-Q plot or histogram is the usual visual check.`,
            ifFails: 'Coefficient estimates can still be useful, but small-sample p values and intervals become more sensitive to unusual cases.',
            doNext: 'Inspect outliers, consider transformations, and rely more on plots and robust methods when needed.',
        },
        {
            id: 'multicollinearity',
            label: 'Multicollinearity',
            status: stats.maxVIF >= 5 ? 'High overlap' : stats.maxVIF >= 2.5 ? 'Moderate overlap' : 'Low overlap',
            what: 'Predictors should not duplicate the same information too heavily.',
            check: `Max VIF is ${formatStat(stats.maxVIF, 2)} and |r| between the two predictors is ${formatStat(overlapCorrelation, 2)}.`,
            ifFails: 'R^2 can stay high while the individual slopes become unstable, noisy, or even flip direction.',
            doNext: 'Drop redundant predictors, combine them, collect more varied data, or center variables before adding interactions.',
        },
        {
            id: 'influence',
            label: 'Influential points / outliers',
            status: stats.influence?.maxCooksDistance > cooksCutoff || stats.maxLeverage > leverageCutoff ? 'Influential case detected' : 'No obvious influence alarm',
            what: 'A case can matter a lot because it has a large residual, unusual predictor values, or both.',
            check: `Max leverage is ${formatStat(stats.maxLeverage, 3)} and max Cook's D is ${formatStat(stats.influence?.maxCooksDistance, 3)}.`,
            ifFails: 'One case can noticeably move the slopes, standard errors, and even the overall fit statistics.',
            doNext: 'Inspect that row carefully, verify the data entry, compare the model with and without the case, and explain any decision transparently.',
        },
    ];
};

export const buildPredictionInputsFromStats = (stats, previous = {}) => {
    if (!stats?.ok) {
        return {};
    }

    return Object.fromEntries(stats.predictorSummaries.map((summary) => {
        const existing = Number(previous?.[summary.label]);
        const resolved = Number.isFinite(existing)
            ? clampToRange(existing, summary.min, summary.max)
            : summary.mean;

        return [summary.label, Number(resolved.toFixed(3))];
    }));
};

export const findDefaultPointId = (stats) => {
    if (!stats?.pairs?.length) {
        return null;
    }

    if (stats.influence?.influentialPoint?.id != null) {
        return stats.influence.influentialPoint.id;
    }

    return stats.pairs[Math.floor(stats.pairs.length / 2)]?.id ?? null;
};

export const buildAdjustedRSquared = (rSquared, sampleSize, predictorCount) => {
    const fit = Number(rSquared);
    const n = Math.max(1, Number(sampleSize));
    const p = Math.max(1, Number(predictorCount));

    if (!(fit >= 0) || !(fit < 1) || !(n > p + 1)) {
        return null;
    }

    return 1 - (((1 - fit) * (n - 1)) / Math.max(1, n - p - 1));
};
