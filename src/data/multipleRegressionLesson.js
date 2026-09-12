export const SAMPLE_DATASET = `Study Hours,Sleep Hours,Practice Problems,Stress Level,Exam Score
2,5.9,18,8.3,56
3,6.1,21,8.0,58
4,6.2,26,7.7,62
5,6.4,29,7.2,65
6,6.5,34,6.8,69
7,6.8,39,6.4,73
8,7.0,45,6.0,77
9,7.2,50,5.6,80
10,7.3,57,5.1,84
11,7.5,63,4.8,87
12,7.7,68,4.4,90
13,7.8,74,4.0,92
14,8.0,79,3.6,94
15,8.1,84,3.2,96
16,8.3,90,2.9,98`;

export const TUTOR_SCENARIOS = [
    {
        id: 'balanced',
        label: 'Balanced Predictors',
        description: 'Both predictors add useful signal with moderate overlap.',
        settings: { beta1: 1.1, beta2: 0.8, predictorCorrelation: 0.35, noise: 1.05, sampleSize: 84 },
    },
    {
        id: 'x1_dominant',
        label: 'X1 Dominant',
        description: 'One predictor carries most of the conditional slope.',
        settings: { beta1: 1.35, beta2: 0.35, predictorCorrelation: 0.2, noise: 1.0, sampleSize: 84 },
    },
    {
        id: 'competing',
        label: 'Competing Slopes',
        description: 'One predictor raises Y while the other lowers it.',
        settings: { beta1: 1.05, beta2: -0.85, predictorCorrelation: 0.25, noise: 1.1, sampleSize: 84 },
    },
    {
        id: 'overlap',
        label: 'Predictor Overlap',
        description: 'High shared variance makes the slopes work harder to separate.',
        settings: { beta1: 1.0, beta2: 0.9, predictorCorrelation: 0.72, noise: 1.0, sampleSize: 96 },
    },
    {
        id: 'collinearity',
        label: 'Collinearity Stress',
        description: 'Very high predictor correlation can inflate instability even with decent R^2.',
        settings: { beta1: 1.0, beta2: 0.9, predictorCorrelation: 0.88, noise: 1.05, sampleSize: 96 },
    },
];

export const INTERNAL_PREDICTOR_IDS = ['Predictor X1', 'Predictor X2'];

export const LESSON_CONTEXTS = [
    {
        id: 'abstract',
        buttonLabel: 'Abstract X1/X2',
        headline: 'Abstract predictors -> outcome',
        description: 'Keep the labels generic so the regression logic stays front and center.',
        outcomeLabel: 'Outcome Y',
        predictorLabels: ['Predictor X1', 'Predictor X2'],
        supportingText: 'Use this preset when you want the cleanest math-first story.',
        datasetConfig: {
            yBase: 55,
            signalScale: 5.5,
            noiseScale: 5,
            x1Mean: 0,
            x1Scale: 1,
            x2Mean: 0,
            x2Scale: 1,
        },
    },
    {
        id: 'study_attendance',
        buttonLabel: 'Study + Attendance',
        headline: 'Hours studied + class attendance -> exam score',
        description: 'A classroom story where both preparation and attendance can matter at the same time.',
        outcomeLabel: 'Exam score',
        predictorLabels: ['Hours studied', 'Class attendance (%)'],
        supportingText: 'Good for thinking about overlap: students who study more may also attend more often.',
        datasetConfig: {
            yBase: 78,
            signalScale: 9.5,
            noiseScale: 5.5,
            x1Mean: 8,
            x1Scale: 1.7,
            x2Mean: 78,
            x2Scale: 8.5,
        },
    },
    {
        id: 'sleep_caffeine',
        buttonLabel: 'Sleep + Caffeine',
        headline: 'Sleep + caffeine -> reaction time',
        description: 'A human-performance story where two predictors can overlap without meaning the same thing.',
        outcomeLabel: 'Reaction time (ms)',
        predictorLabels: ['Sleep (hours)', 'Caffeine (mg)'],
        supportingText: 'This is useful for showing that prediction and explanation are related, but not identical.',
        datasetConfig: {
            yBase: 290,
            signalScale: 16,
            noiseScale: 18,
            x1Mean: 7,
            x1Scale: 0.8,
            x2Mean: 180,
            x2Scale: 42,
        },
    },
    {
        id: 'ads_sales',
        buttonLabel: 'TV + Online Ads',
        headline: 'TV ads + online ads -> sales',
        description: 'A business story where media channels can overlap yet still contribute unique information.',
        outcomeLabel: 'Sales',
        predictorLabels: ['TV ads budget', 'Online ads budget'],
        supportingText: 'This preset helps show why a strong model fit does not automatically make every slope easy to interpret.',
        datasetConfig: {
            yBase: 120,
            signalScale: 24,
            noiseScale: 20,
            x1Mean: 62,
            x1Scale: 13,
            x2Mean: 46,
            x2Scale: 11,
        },
    },
];

export const TOOLTIP_COPY = {
    intercept: {
        term: 'Intercept',
        title: 'Predicted outcome when every predictor is 0',
        desc: 'The intercept is the model baseline. It is most useful when 0 is realistic or when predictors were centered first.',
    },
    slope: {
        term: 'Slope',
        title: 'Change in predicted Y for a 1-unit increase',
        desc: 'A slope tells how much the fitted mean changes for one predictor while the other predictor is held constant.',
    },
    term: {
        term: 'Term',
        title: 'Which model part this row describes',
        desc: 'The intercept is the baseline prediction. Each slope row describes one predictor after the other predictors are held constant.',
    },
    coefficientEstimate: {
        term: 'Estimate',
        title: 'The fitted coefficient value',
        desc: 'For a slope, this is the expected change in the outcome for a 1-unit predictor increase while the other predictors stay fixed.',
    },
    standardizedBeta: {
        term: 'Standardized beta',
        title: 'Slope after putting variables on a shared SD scale',
        desc: 'Standardized beta removes the original units so the predictor effects are easier to compare in the same model.',
    },
    standardError: {
        term: 'Standard error',
        title: 'How much the estimate would vary across similar samples',
        desc: 'A larger standard error means the coefficient is less stable from sample to sample.',
    },
    tStatistic: {
        term: 't statistic',
        title: 'Estimate divided by its standard error',
        desc: 'The t statistic compares the slope size to its uncertainty. Larger absolute values usually mean stronger evidence against a zero slope.',
    },
    pValue: {
        term: 'p value',
        title: 'How surprising the result would be if the true slope were 0',
        desc: 'A small p value means the observed slope would be unlikely if that predictor had no conditional relationship with the outcome.',
    },
    vif: {
        term: 'VIF',
        title: 'Variance inflation factor',
        desc: 'VIF shows how much predictor overlap is inflating the coefficient uncertainty. Larger values mean more multicollinearity.',
    },
    confidenceInterval: {
        term: 'Confidence interval',
        title: 'Plausible range for the coefficient',
        desc: 'The interval shows a range of coefficient values compatible with the data. Intervals crossing 0 suggest weaker evidence for a nonzero coefficient.',
    },
    zeroOrderCorrelation: {
        term: 'Zero-order correlation',
        title: 'Simple X-Y correlation before controlling for the other predictor',
        desc: 'This is the raw correlation between one predictor and the outcome, without holding the other predictor constant.',
    },
    partialRSquared: {
        term: 'Partial R^2',
        title: 'Unique fit contribution from one predictor',
        desc: 'Partial R^2 is the share of remaining outcome variance that this predictor explains after the other predictor is already in the model.',
    },
    meanInterval: {
        term: 'CI for mean response',
        title: 'Likely range for the fitted mean',
        desc: 'This interval is about the average outcome for cases with this predictor profile, not one individual person or row.',
    },
    predictionInterval: {
        term: 'Prediction interval',
        title: 'Likely range for one new individual case',
        desc: 'Prediction intervals are wider because single cases still vary around the fitted mean.',
    },
    residual: {
        term: 'Residual',
        title: 'Observed outcome minus fitted outcome',
        desc: 'Residuals show how far each real case sits above or below what the model predicted.',
    },
    adjustedRSquared: {
        term: 'Adjusted R^2',
        title: 'Model fit after a penalty for extra predictors',
        desc: 'Adjusted R^2 helps prevent us from over-crediting a model just because it uses more predictors.',
    },
    rSquared: {
        term: 'R^2',
        title: 'Share of outcome variance explained by the whole model',
        desc: 'R^2 is an overall model-fit summary. It does not tell you whether every individual slope is stable or easy to interpret.',
    },
    fStatistic: {
        term: 'F statistic',
        title: 'Omnibus test for whether the full model explains more than a flat mean-only model',
        desc: 'The F statistic asks whether the predictor set, taken together, improves fit beyond predicting the same mean for everyone.',
    },
    leverage: {
        term: 'Leverage',
        title: 'How unusual a case is in predictor space',
        desc: 'A high-leverage case has a rare combination of predictor values, so it has extra opportunity to pull the fitted model.',
    },
    cooksDistance: {
        term: "Cook's D",
        title: 'How much one case changes the fitted model',
        desc: "Cook's D combines leverage and residual size into one influence measure. Larger values mean the model depends more on that case.",
    },
};
