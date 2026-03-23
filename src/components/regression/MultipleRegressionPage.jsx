import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    AlertTriangle,
    Calculator,
    ChevronDown,
    ChevronUp,
    CheckCircle,
    Database,
    FileUp,
    Info,
    RefreshCw,
    Sigma,
    SlidersHorizontal,
    Sparkles,
    Target,
    TrendingUp,
} from 'lucide-react';
import ProgressiveTooltip from '../common/ProgressiveTooltip';
import AssumptionItem from '../formula/AssumptionItem';
import PowerAnalysisTab from '../power/PowerAnalysisTab';
import RegressionResidualPlot from './RegressionResidualPlot';
import ObservedFittedPlot from './ObservedFittedPlot';
import MultipleRegressionConditionalEffectPlot from './MultipleRegressionConditionalEffectPlot';
import MultipleRegressionPlanePlot from './MultipleRegressionPlanePlot';
import VariableRolePicker from '../data/VariableRolePicker.jsx';
import {
    buildMultipleRegressionGuidance,
    buildMultipleRegressionInterpretation,
    buildMultipleRegressionTutorBaseDataset,
    calculateMultipleRegressionPrediction,
    calculateMultipleRegressionStats,
    deriveMultipleRegressionTutorDataset,
} from '../../stats/multipleRegression.js';
import { rSquaredToFSquared } from '../../stats/regression.js';
import { parseDelimitedTable } from '../../utils/delimitedTable.js';
import { buildNumericAnalysisColumn, countCompleteRows } from '../../utils/datasetImport.js';
import { useDatasetLibraryContext } from '../../hooks/useDatasetLibrary.js';

const SAMPLE_DATASET = `Study Hours,Sleep Hours,Practice Problems,Stress Level,Exam Score
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

const TUTOR_SCENARIOS = [
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

const INTERNAL_PREDICTOR_IDS = ['Predictor X1', 'Predictor X2'];
const ACTIVE_DATASET_SESSION_KEY = 'statwizard_active_dataset_id';

const LESSON_CONTEXTS = [
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

const TOOLTIP_COPY = {
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

const Card = ({ darkMode, children, className = '' }) => (
    <div className={`rounded-2xl border p-6 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} ${className}`}>
        {children}
    </div>
);

const TooltipLabel = ({ darkMode, label, tooltipKey, className = '' }) => {
    const tooltip = TOOLTIP_COPY[tooltipKey];

    if (!tooltip) {
        return <span className={className}>{label}</span>;
    }

    return (
        <ProgressiveTooltip
            as="span"
            term={tooltip.term}
            title={tooltip.title}
            desc={tooltip.desc}
            darkMode={darkMode}
        >
            <span className={`inline-flex items-center gap-1 ${className}`}>
                <span>{label}</span>
                <Info size={12} className={darkMode ? 'text-slate-500' : 'text-slate-500'} />
            </span>
        </ProgressiveTooltip>
    );
};

const MetricTile = ({ darkMode, label, value, detail = null, tone = 'default' }) => {
    const toneClass = tone === 'primary'
        ? (darkMode ? 'bg-indigo-500/10 border-indigo-500/30' : 'bg-indigo-50 border-indigo-200')
        : tone === 'warning'
            ? (darkMode ? 'bg-amber-500/10 border-amber-500/20' : 'bg-amber-50 border-amber-200')
            : (darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200');

    return (
        <div className={`rounded-xl border p-4 ${toneClass}`}>
            <div className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                {label}
            </div>
            <div className={`mt-2 text-2xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                {value}
            </div>
            {detail && (
                <p className={`mt-2 text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                    {detail}
                </p>
            )}
        </div>
    );
};

const formatStat = (value, digits = 3) => {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) {
        return '--';
    }
    return numeric.toFixed(digits).replace(/\.?0+$/, '');
};

const formatPValue = (value) => {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) {
        return '--';
    }
    if (numeric < 0.001) {
        return '< .001';
    }
    return `= ${numeric.toFixed(3).replace(/^0/, '')}`;
};

const clampToRange = (value, min, max) => {
    const numeric = Number(value);

    if (!Number.isFinite(numeric)) {
        return min;
    }

    return Math.min(max, Math.max(min, numeric));
};

const countNumericCompleteCasesFromColumns = (columns = [], totalRows = 0) => {
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

const getLessonContext = (contextId) =>
    LESSON_CONTEXTS.find((context) => context.id === contextId) || LESSON_CONTEXTS[0];

const getContextualPredictorLabel = (context, predictorId) => (
    predictorId === INTERNAL_PREDICTOR_IDS[0]
        ? context.predictorLabels[0]
        : predictorId === INTERNAL_PREDICTOR_IDS[1]
            ? context.predictorLabels[1]
            : predictorId
);

const getPredictorSymbol = (predictorId) => (
    predictorId === INTERNAL_PREDICTOR_IDS[0]
        ? 'X1'
        : predictorId === INTERNAL_PREDICTOR_IDS[1]
            ? 'X2'
            : predictorId
);

const getSlopeSymbol = (predictorId) => (
    predictorId === INTERNAL_PREDICTOR_IDS[0]
        ? 'b₁'
        : predictorId === INTERNAL_PREDICTOR_IDS[1]
            ? 'b₂'
            : 'b'
);

const findCoefficient = (stats, predictorId) =>
    stats?.coefficients?.find((coefficient) => coefficient.id === predictorId) || null;

const formatSignedDifference = (value, digits = 3) => {
    const numeric = Number(value);

    if (!Number.isFinite(numeric)) {
        return '--';
    }

    return `${numeric >= 0 ? '+' : '-'}${formatStat(Math.abs(numeric), digits)}`;
};

const buildEquationText = ({ stats, outcomeLabel = 'Y' }) => {
    if (!stats?.ok) {
        return 'Regression equation unavailable';
    }

    const terms = stats.coefficients
        .filter((coefficient) => coefficient.id !== 'intercept')
        .map((coefficient) => `${coefficient.estimate >= 0 ? '+' : '-'} ${formatStat(Math.abs(coefficient.estimate), 3)} * ${coefficient.label}`);

    return `${outcomeLabel} = ${formatStat(stats.intercept, 3)} ${terms.join(' ')}`;
};

const buildLessonEquationText = ({ stats, context }) => {
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

const buildLessonSymbolicEquation = (context) => (
    `Ŷ = b₀ + b₁(${getContextualPredictorLabel(context, INTERNAL_PREDICTOR_IDS[0])}) + b₂(${getContextualPredictorLabel(context, INTERNAL_PREDICTOR_IDS[1])})`
);

const buildLessonSubstitutedEquation = ({ stats, prediction }) => {
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

const buildLessonDiagnostics = ({ stats }) => {
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

const buildPredictionInputsFromStats = (stats, previous = {}) => {
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

const findDefaultPointId = (stats) => {
    if (!stats?.pairs?.length) {
        return null;
    }

    if (stats.influence?.influentialPoint?.id != null) {
        return stats.influence.influentialPoint.id;
    }

    return stats.pairs[Math.floor(stats.pairs.length / 2)]?.id ?? null;
};

const buildAdjustedRSquared = (rSquared, sampleSize, predictorCount) => {
    const fit = Number(rSquared);
    const n = Math.max(1, Number(sampleSize));
    const p = Math.max(1, Number(predictorCount));

    if (!(fit >= 0) || !(fit < 1) || !(n > p + 1)) {
        return null;
    }

    return 1 - (((1 - fit) * (n - 1)) / Math.max(1, n - p - 1));
};

const MultipleRegressionPage = ({
    section,
    darkMode,
    currentStats,
    onStatsChange,
    assumptions = [],
    testConfig,
    initialPowerMode,
    onOpenDataManager,
}) => {
    const { datasets } = useDatasetLibraryContext();
    const [lessonScenario, setLessonScenario] = useState('balanced');
    const [lessonContextId, setLessonContextId] = useState('abstract');
    const [lessonBeta1, setLessonBeta1] = useState(1.1);
    const [lessonBeta2, setLessonBeta2] = useState(0.8);
    const [lessonPredictorCorrelation, setLessonPredictorCorrelation] = useState(0.35);
    const [lessonNoise, setLessonNoise] = useState(1.05);
    const [lessonSampleSize, setLessonSampleSize] = useState(84);
    const [lessonShowCoefficientTable, setLessonShowCoefficientTable] = useState(true);
    const [lessonShowPartialEffects, setLessonShowPartialEffects] = useState(true);
    const [lessonShowResiduals, setLessonShowResiduals] = useState(false);
    const [lessonOutlierOn, setLessonOutlierOn] = useState(false);
    const [lessonGenerationKey, setLessonGenerationKey] = useState(0);
    const [lessonSelectedPointId, setLessonSelectedPointId] = useState(null);
    const [lessonPredictionInputs, setLessonPredictionInputs] = useState({});
    const [lessonMainView, setLessonMainView] = useState('observed');
    const [lessonFloatVisualMinimized, setLessonFloatVisualMinimized] = useState(false);
    const [lessonShouldFloatVisual, setLessonShouldFloatVisual] = useState(false);
    const lessonMainVisualRef = useRef(null);
    const lessonPredictionPlaygroundRef = useRef(null);
    const [lessonPredictionPlaygroundVisible, setLessonPredictionPlaygroundVisible] = useState(false);

    const lessonContext = useMemo(() => getLessonContext(lessonContextId), [lessonContextId]);

    const lessonBaseDataset = useMemo(() => buildMultipleRegressionTutorBaseDataset({
        generationKey: lessonGenerationKey,
    }), [lessonGenerationKey]);

    const lessonDataset = useMemo(() => deriveMultipleRegressionTutorDataset({
        baseDataset: lessonBaseDataset,
        sampleSize: lessonSampleSize,
        beta1: lessonBeta1,
        beta2: lessonBeta2,
        predictorCorrelation: lessonPredictorCorrelation,
        noise: lessonNoise,
        includeOutlier: lessonOutlierOn,
        contextConfig: lessonContext.datasetConfig,
    }), [lessonBaseDataset, lessonSampleSize, lessonBeta1, lessonBeta2, lessonPredictorCorrelation, lessonNoise, lessonOutlierOn, lessonContext]);

    const lessonBaselineDataset = useMemo(() => deriveMultipleRegressionTutorDataset({
        baseDataset: lessonBaseDataset,
        sampleSize: lessonSampleSize,
        beta1: lessonBeta1,
        beta2: lessonBeta2,
        predictorCorrelation: lessonPredictorCorrelation,
        noise: lessonNoise,
        includeOutlier: false,
        contextConfig: lessonContext.datasetConfig,
    }), [lessonBaseDataset, lessonSampleSize, lessonBeta1, lessonBeta2, lessonPredictorCorrelation, lessonNoise, lessonContext]);

    const lessonStats = useMemo(() => calculateMultipleRegressionStats({
        outcomeValues: lessonDataset.outcomeValues,
        predictorColumns: lessonDataset.predictorColumns,
        confidenceLevel: 0.95,
    }), [lessonDataset]);

    const lessonBaselineStats = useMemo(() => calculateMultipleRegressionStats({
        outcomeValues: lessonBaselineDataset.outcomeValues,
        predictorColumns: lessonBaselineDataset.predictorColumns,
        confidenceLevel: 0.95,
    }), [lessonBaselineDataset]);

    const lessonPrediction = useMemo(() => calculateMultipleRegressionPrediction({
        stats: lessonStats,
        predictorValues: lessonPredictionInputs,
        confidenceLevel: 0.95,
    }), [lessonStats, lessonPredictionInputs]);

    const lessonSelectedPair = useMemo(
        () => lessonStats?.pairs?.find((pair) => pair.id === lessonSelectedPointId || pair.index === lessonSelectedPointId) || null,
        [lessonStats, lessonSelectedPointId]
    );
    const lessonDiagnostics = useMemo(
        () => buildLessonDiagnostics({ stats: lessonStats }),
        [lessonStats]
    );
    const lessonPredictorLabels = useMemo(() => ({
        [INTERNAL_PREDICTOR_IDS[0]]: getContextualPredictorLabel(lessonContext, INTERNAL_PREDICTOR_IDS[0]),
        [INTERNAL_PREDICTOR_IDS[1]]: getContextualPredictorLabel(lessonContext, INTERNAL_PREDICTOR_IDS[1]),
    }), [lessonContext]);
    const lessonEquationText = useMemo(
        () => buildLessonEquationText({ stats: lessonStats, context: lessonContext }),
        [lessonStats, lessonContext]
    );
    const lessonSymbolicEquation = useMemo(
        () => buildLessonSymbolicEquation(lessonContext),
        [lessonContext]
    );
    const lessonSubstitutedEquation = useMemo(
        () => buildLessonSubstitutedEquation({ stats: lessonStats, prediction: lessonPrediction, context: lessonContext }),
        [lessonStats, lessonPrediction, lessonContext]
    );
    const lessonOutlierComparison = useMemo(() => {
        if (!lessonOutlierOn || !lessonStats?.ok || !lessonBaselineStats?.ok) {
            return null;
        }

        return {
            metrics: [
                {
                    id: 'r_squared',
                    label: 'R^2',
                    before: lessonBaselineStats.rSquared,
                    after: lessonStats.rSquared,
                    tooltipKey: 'rSquared',
                },
                {
                    id: 'adjusted_r_squared',
                    label: 'Adjusted R^2',
                    before: lessonBaselineStats.adjustedRSquared,
                    after: lessonStats.adjustedRSquared,
                    tooltipKey: 'adjustedRSquared',
                },
            ],
            coefficients: lessonStats.coefficients.map((coefficient) => {
                const baselineCoefficient = lessonBaselineStats.coefficients.find((item) => item.id === coefficient.id);
                return {
                    id: coefficient.id,
                    label: coefficient.id === 'intercept'
                        ? 'Intercept'
                        : `Slope for ${lessonPredictorLabels[coefficient.id]} (${getSlopeSymbol(coefficient.id)})`,
                    estimateBefore: baselineCoefficient?.estimate,
                    estimateAfter: coefficient.estimate,
                    seBefore: baselineCoefficient?.standardError,
                    seAfter: coefficient.standardError,
                };
            }),
            influentialCase: lessonStats.influence?.influentialPoint || null,
        };
    }, [lessonOutlierOn, lessonStats, lessonBaselineStats, lessonPredictorLabels]);
    const lessonMainViews = useMemo(() => ([
        { id: 'observed', label: 'Observed vs Fitted' },
        { id: 'partial_x1', label: `Partial Effect of ${lessonPredictorLabels[INTERNAL_PREDICTOR_IDS[0]]}` },
        { id: 'partial_x2', label: `Partial Effect of ${lessonPredictorLabels[INTERNAL_PREDICTOR_IDS[1]]}` },
        { id: 'residual', label: 'Residual Plot' },
        { id: 'plane', label: '3D Plane View' },
    ]), [lessonPredictorLabels]);
    const lessonOverlapCorrelation = Math.abs(lessonStats?.predictorCorrelationMatrix?.[0]?.values?.[1] || 0);
    const lessonSelectedIsInfluential = Boolean(
        lessonSelectedPair
        && (
            lessonSelectedPair.id === lessonStats?.influence?.influentialPoint?.id
            || lessonSelectedPair.index === lessonStats?.influence?.influentialIndex
        )
    );
    const renderLessonMainVisual = ({ compact = false } = {}) => {
        const observedSubtitle = compact
            ? `Live view of observed versus fitted ${lessonContext.outcomeLabel}.`
            : `The whole predictor profile maps onto one fitted value. Click a sample case to compare its observed ${lessonContext.outcomeLabel} with the fitted mean.`;
        const partialX1Subtitle = compact
            ? `${lessonPredictorLabels[INTERNAL_PREDICTOR_IDS[1]]} held at ${formatStat(lessonPredictionInputs?.[INTERNAL_PREDICTOR_IDS[1]], 2)}.`
            : `${lessonPredictorLabels[INTERNAL_PREDICTOR_IDS[1]]} is held at ${formatStat(lessonPredictionInputs?.[INTERNAL_PREDICTOR_IDS[1]], 2)} in this view, so the green line is the conditional slope for ${lessonPredictorLabels[INTERNAL_PREDICTOR_IDS[0]]}.`;
        const partialX2Subtitle = compact
            ? `${lessonPredictorLabels[INTERNAL_PREDICTOR_IDS[0]]} held at ${formatStat(lessonPredictionInputs?.[INTERNAL_PREDICTOR_IDS[0]], 2)}.`
            : `${lessonPredictorLabels[INTERNAL_PREDICTOR_IDS[0]]} is held at ${formatStat(lessonPredictionInputs?.[INTERNAL_PREDICTOR_IDS[0]], 2)} in this view, so the green line is the conditional slope for ${lessonPredictorLabels[INTERNAL_PREDICTOR_IDS[1]]}.`;

        if (lessonMainView === 'partial_x1') {
            return (
                <MultipleRegressionConditionalEffectPlot
                    stats={lessonStats}
                    darkMode={darkMode}
                    focusPredictorId={INTERNAL_PREDICTOR_IDS[0]}
                    focusLabel={lessonPredictorLabels[INTERNAL_PREDICTOR_IDS[0]]}
                    outcomeLabel={lessonContext.outcomeLabel}
                    heldValues={lessonPredictionInputs}
                    selectedPointId={lessonSelectedPointId}
                    onPointSelect={setLessonSelectedPointId}
                    predictionTarget={lessonPrediction}
                    title={`Partial Effect of ${lessonPredictorLabels[INTERNAL_PREDICTOR_IDS[0]]}`}
                    subtitle={partialX1Subtitle}
                />
            );
        }

        if (lessonMainView === 'partial_x2') {
            return (
                <MultipleRegressionConditionalEffectPlot
                    stats={lessonStats}
                    darkMode={darkMode}
                    focusPredictorId={INTERNAL_PREDICTOR_IDS[1]}
                    focusLabel={lessonPredictorLabels[INTERNAL_PREDICTOR_IDS[1]]}
                    outcomeLabel={lessonContext.outcomeLabel}
                    heldValues={lessonPredictionInputs}
                    selectedPointId={lessonSelectedPointId}
                    onPointSelect={setLessonSelectedPointId}
                    predictionTarget={lessonPrediction}
                    title={`Partial Effect of ${lessonPredictorLabels[INTERNAL_PREDICTOR_IDS[1]]}`}
                    subtitle={partialX2Subtitle}
                />
            );
        }

        if (lessonMainView === 'residual') {
            return (
                <RegressionResidualPlot
                    stats={lessonStats}
                    darkMode={darkMode}
                    highlightPointIndex={lessonSelectedPointId}
                    title="Residual Plot"
                    subtitle={compact
                        ? `Residuals for ${lessonContext.outcomeLabel} around the fitted model.`
                        : `Residuals are observed ${lessonContext.outcomeLabel} minus fitted ${lessonContext.outcomeLabel}. Patternless scatter around zero supports the additive linear model.`}
                />
            );
        }

        if (lessonMainView === 'plane') {
            return (
                <MultipleRegressionPlanePlot
                    stats={lessonStats}
                    darkMode={darkMode}
                    predictorLabels={[
                        lessonPredictorLabels[INTERNAL_PREDICTOR_IDS[0]],
                        lessonPredictorLabels[INTERNAL_PREDICTOR_IDS[1]],
                    ]}
                    outcomeLabel={lessonContext.outcomeLabel}
                    selectedPointId={lessonSelectedPointId}
                    onPointSelect={setLessonSelectedPointId}
                    predictionTarget={lessonPrediction}
                    title="3D Regression Plane"
                    subtitle={compact
                        ? 'The fitted plane follows your scroll here.'
                        : 'The plane is the fitted mean from the model. Vertical distance from a real point to the plane is the residual.'}
                />
            );
        }

        return (
            <ObservedFittedPlot
                stats={lessonStats}
                darkMode={darkMode}
                selectedPointId={lessonSelectedPointId}
                onPointSelect={setLessonSelectedPointId}
                predictionTarget={lessonPrediction}
                title="Observed vs Fitted"
                subtitle={observedSubtitle}
                yLabel={`Observed ${lessonContext.outcomeLabel}`}
            />
        );
    };

    useEffect(() => {
        if (!lessonStats?.ok) {
            setLessonSelectedPointId(null);
            setLessonPredictionInputs({});
            return;
        }

        setLessonSelectedPointId((previous) => {
            const hasPrevious = lessonStats.pairs.some((pair) => pair.id === previous || pair.index === previous);
            return hasPrevious ? previous : findDefaultPointId(lessonStats);
        });
        setLessonPredictionInputs((previous) => buildPredictionInputsFromStats(lessonStats, previous));
    }, [lessonStats]);

    useEffect(() => {
        if (lessonOutlierOn && lessonStats?.influence?.influentialPoint?.id != null) {
            setLessonSelectedPointId(lessonStats.influence.influentialPoint.id);
        }
    }, [lessonOutlierOn, lessonStats?.influence?.influentialPoint?.id]);

    useEffect(() => {
        if (typeof window === 'undefined') {
            return undefined;
        }

        const updateFloatingVisualState = () => {
            const card = lessonMainVisualRef.current;
            const playground = lessonPredictionPlaygroundRef.current;

            if (!card) {
                setLessonShouldFloatVisual(false);
            } else {
                const rect = card.getBoundingClientRect();
                const stillVisible = rect.bottom > 140 && rect.top < (window.innerHeight - 140);
                setLessonShouldFloatVisual(!stillVisible);
            }

            if (!playground) {
                setLessonPredictionPlaygroundVisible(false);
                return;
            }

            const playgroundRect = playground.getBoundingClientRect();
            const playgroundVisible = playgroundRect.bottom > 120 && playgroundRect.top < (window.innerHeight - 120);
            setLessonPredictionPlaygroundVisible(playgroundVisible);
        };

        updateFloatingVisualState();
        window.addEventListener('scroll', updateFloatingVisualState, { passive: true });
        window.addEventListener('resize', updateFloatingVisualState);

        return () => {
            window.removeEventListener('scroll', updateFloatingVisualState);
            window.removeEventListener('resize', updateFloatingVisualState);
        };
    }, []);

    useEffect(() => {
        if (!lessonShouldFloatVisual) {
            setLessonFloatVisualMinimized(false);
        }
    }, [lessonShouldFloatVisual]);

    const applyScenario = (scenarioId) => {
        const scenario = TUTOR_SCENARIOS.find((item) => item.id === scenarioId);

        if (!scenario) {
            return;
        }

        setLessonScenario(scenario.id);
        setLessonBeta1(scenario.settings.beta1);
        setLessonBeta2(scenario.settings.beta2);
        setLessonPredictorCorrelation(scenario.settings.predictorCorrelation);
        setLessonNoise(scenario.settings.noise);
        setLessonSampleSize(scenario.settings.sampleSize);
        setLessonGenerationKey((previous) => previous + 1);
    };

    const [tableText, setTableText] = useState(SAMPLE_DATASET);
    const [calculatorInputMode, setCalculatorInputMode] = useState('paste');
    const [selectedDatasetId, setSelectedDatasetId] = useState('');
    const [savedRoleSelection, setSavedRoleSelection] = useState({
        outcome: '',
        predictors: [],
    });
    const [selectedOutcome, setSelectedOutcome] = useState('');
    const [selectedPredictors, setSelectedPredictors] = useState([]);
    const [confidenceLevel, setConfidenceLevel] = useState(0.95);
    const [calculatorSelectedPointId, setCalculatorSelectedPointId] = useState(null);
    const [calculatorPredictionInputs, setCalculatorPredictionInputs] = useState({});

    const parsedTable = useMemo(() => parseDelimitedTable(tableText), [tableText]);
    const numericColumns = parsedTable.numericColumns || [];
    const savedDataset = useMemo(
        () => datasets.find((dataset) => dataset.id === selectedDatasetId) || null,
        [datasets, selectedDatasetId]
    );

    useEffect(() => {
        if (!datasets.length) {
            setSelectedDatasetId('');
            return;
        }

        let preferredDatasetId = '';

        try {
            preferredDatasetId = window.sessionStorage.getItem(ACTIVE_DATASET_SESSION_KEY) || '';
        } catch (error) {
            preferredDatasetId = '';
        }

        setSelectedDatasetId((previous) => {
            if (datasets.some((dataset) => dataset.id === previous)) {
                return previous;
            }

            if (preferredDatasetId && datasets.some((dataset) => dataset.id === preferredDatasetId)) {
                try {
                    window.sessionStorage.removeItem(ACTIVE_DATASET_SESSION_KEY);
                } catch (error) {
                    // Ignore sessionStorage access problems and keep going.
                }

                return preferredDatasetId;
            }

            return datasets[0]?.id || '';
        });
    }, [datasets]);

    useEffect(() => {
        if (!savedDataset) {
            setSavedRoleSelection({
                outcome: '',
                predictors: [],
            });
            return;
        }

        const numericIds = savedDataset.columns
            .filter((column) => column.summary?.detectedType === 'numeric')
            .map((column) => column.id);

        setSavedRoleSelection((previous) => {
            const nextOutcome = numericIds.includes(previous.outcome)
                ? previous.outcome
                : numericIds[numericIds.length - 1] || '';
            const availablePredictors = numericIds.filter((columnId) => columnId !== nextOutcome);
            const validPredictors = (previous.predictors || []).filter((columnId) => availablePredictors.includes(columnId));

            if (validPredictors.length >= 2) {
                return {
                    outcome: nextOutcome,
                    predictors: validPredictors,
                };
            }

            return {
                outcome: nextOutcome,
                predictors: [...new Set([
                    ...validPredictors,
                    ...availablePredictors.slice(0, Math.max(0, Math.min(3, availablePredictors.length))),
                ])].slice(0, Math.max(0, Math.min(3, availablePredictors.length))),
            };
        });
    }, [savedDataset]);

    useEffect(() => {
        if (!numericColumns.length) {
            setSelectedOutcome('');
            setSelectedPredictors([]);
            return;
        }

        setSelectedOutcome((previous) => {
            if (numericColumns.some((column) => column.name === previous)) {
                return previous;
            }

            return numericColumns[numericColumns.length - 1]?.name || '';
        });
    }, [numericColumns]);

    useEffect(() => {
        if (!numericColumns.length || !selectedOutcome) {
            return;
        }

        setSelectedPredictors((previous) => {
            const valid = previous.filter((name) => (
                name !== selectedOutcome && numericColumns.some((column) => column.name === name)
            ));

            if (valid.length >= 2) {
                return valid;
            }

            const fallback = numericColumns
                .filter((column) => column.name !== selectedOutcome)
                .slice(0, Math.max(0, Math.min(3, numericColumns.length - 1)))
                .map((column) => column.name);

            return [...new Set([...valid, ...fallback])].slice(0, Math.max(0, Math.min(3, numericColumns.length - 1)));
        });
    }, [numericColumns, selectedOutcome]);

    const selectedOutcomeColumn = numericColumns.find((column) => column.name === selectedOutcome) || null;
    const selectedPredictorColumns = numericColumns.filter((column) => selectedPredictors.includes(column.name));
    const savedOutcomeColumn = useMemo(
        () => buildNumericAnalysisColumn(savedDataset, savedRoleSelection.outcome),
        [savedDataset, savedRoleSelection.outcome]
    );
    const savedPredictorColumns = useMemo(
        () => (savedRoleSelection.predictors || [])
            .map((columnId) => buildNumericAnalysisColumn(savedDataset, columnId))
            .filter(Boolean),
        [savedDataset, savedRoleSelection.predictors]
    );
    const pasteCompleteCaseSummary = useMemo(
        () => countNumericCompleteCasesFromColumns(
            [selectedOutcomeColumn, ...selectedPredictorColumns].filter(Boolean),
            parsedTable.rowCount || 0
        ),
        [parsedTable.rowCount, selectedOutcomeColumn, selectedPredictorColumns]
    );
    const savedCompleteCaseSummary = useMemo(
        () => countCompleteRows(
            savedDataset,
            [savedRoleSelection.outcome, ...(savedRoleSelection.predictors || [])].filter(Boolean),
            true
        ),
        [savedDataset, savedRoleSelection]
    );
    const activeOutcomeColumn = calculatorInputMode === 'saved' ? savedOutcomeColumn : selectedOutcomeColumn;
    const activePredictorColumns = calculatorInputMode === 'saved' ? savedPredictorColumns : selectedPredictorColumns;
    const activeCompleteCaseSummary = calculatorInputMode === 'saved' ? savedCompleteCaseSummary : pasteCompleteCaseSummary;
    const activeOutcomeLabel = calculatorInputMode === 'saved'
        ? (savedOutcomeColumn?.label || 'Y')
        : (selectedOutcome || 'Y');
    const calculatorSetupErrors = useMemo(() => {
        if (calculatorInputMode === 'saved') {
            if (!datasets.length) {
                return ['No saved datasets are available yet. Open the Data Manager to import and save one first.'];
            }

            if (!savedDataset) {
                return ['Choose a saved dataset to begin.'];
            }

            const numericVariableCount = savedDataset.columns.filter((column) => column.summary?.detectedType === 'numeric').length;

            if (!savedRoleSelection.outcome) {
                return ['Outcome variable must be numeric.'];
            }

            if ((savedRoleSelection.predictors || []).length < 2) {
                return ['Select at least two quantitative predictors.'];
            }

            if (numericVariableCount < 3) {
                return ['This saved dataset needs at least three numeric variables for the current multiple-regression setup.'];
            }

            if (activeCompleteCaseSummary.usable === 0) {
                return ['No usable rows remain after excluding missing values.'];
            }

            return [];
        }

        if (!selectedOutcome) {
            return ['Choose one outcome variable and at least two predictors to fit the multiple-regression model.'];
        }

        if (selectedPredictors.length < 2) {
            return ['Select at least two quantitative predictors for the multiple-regression model.'];
        }

        if (activeCompleteCaseSummary.usable === 0) {
            return ['No usable rows remain after excluding missing values.'];
        }

        return [];
    }, [
        activeCompleteCaseSummary.usable,
        calculatorInputMode,
        datasets.length,
        savedDataset,
        savedRoleSelection.outcome,
        savedRoleSelection.predictors,
        selectedOutcome,
        selectedPredictors.length,
    ]);
    const calculatorStats = useMemo(() => calculateMultipleRegressionStats({
        outcomeValues: activeOutcomeColumn?.numericValues || [],
        predictorColumns: activePredictorColumns,
        confidenceLevel,
        alpha: 1 - confidenceLevel,
    }), [activeOutcomeColumn, activePredictorColumns, confidenceLevel]);
    const calculatorModelErrors = calculatorSetupErrors.length
        ? calculatorSetupErrors
        : (calculatorStats?.errors || []);
    const calculatorNeedsSetup = calculatorSetupErrors.length > 0 || !calculatorStats?.ok;

    const calculatorGuidance = useMemo(
        () => buildMultipleRegressionGuidance(calculatorStats),
        [calculatorStats]
    );

    const calculatorPrediction = useMemo(() => calculateMultipleRegressionPrediction({
        stats: calculatorStats,
        predictorValues: calculatorPredictionInputs,
        confidenceLevel,
    }), [calculatorStats, calculatorPredictionInputs, confidenceLevel]);

    const calculatorSelectedPair = useMemo(
        () => calculatorStats?.pairs?.find((pair) => pair.id === calculatorSelectedPointId || pair.index === calculatorSelectedPointId) || null,
        [calculatorStats, calculatorSelectedPointId]
    );

    useEffect(() => {
        if (calculatorStats?.ok && typeof onStatsChange === 'function') {
            onStatsChange(calculatorStats);
        }
    }, [calculatorStats, onStatsChange]);

    useEffect(() => {
        if (!calculatorStats?.ok) {
            setCalculatorSelectedPointId(null);
            setCalculatorPredictionInputs({});
            return;
        }

        setCalculatorSelectedPointId((previous) => {
            const hasPrevious = calculatorStats.pairs.some((pair) => pair.id === previous || pair.index === previous);
            return hasPrevious ? previous : findDefaultPointId(calculatorStats);
        });
        setCalculatorPredictionInputs((previous) => buildPredictionInputsFromStats(calculatorStats, previous));
    }, [calculatorStats]);

    const effectSourceStats = currentStats?.ok ? currentStats : (calculatorStats?.ok ? calculatorStats : null);
    const [effectRSquared, setEffectRSquared] = useState(0.35);
    const [effectSampleSize, setEffectSampleSize] = useState(90);
    const [effectPredictorCount, setEffectPredictorCount] = useState(2);

    useEffect(() => {
        if (Number.isFinite(effectSourceStats?.rSquared)) {
            setEffectRSquared(effectSourceStats.rSquared);
        }
        if (Number.isFinite(effectSourceStats?.n)) {
            setEffectSampleSize(effectSourceStats.n);
        }
        if (Number.isFinite(effectSourceStats?.predictorCount)) {
            setEffectPredictorCount(effectSourceStats.predictorCount);
        }
    }, [effectSourceStats?.rSquared, effectSourceStats?.n, effectSourceStats?.predictorCount]);

    const effectAdjustedRSquared = buildAdjustedRSquared(effectRSquared, effectSampleSize, effectPredictorCount);
    const effectFSquared = rSquaredToFSquared(effectRSquared);

    const onUpload = async (event) => {
        const file = event.target.files?.[0];
        if (!file) {
            return;
        }
        const text = await file.text();
        setTableText(text);
        event.target.value = '';
    };

    const togglePredictor = (predictorName) => {
        setSelectedPredictors((previous) => {
            if (previous.includes(predictorName)) {
                return previous.filter((item) => item !== predictorName);
            }

            return [...previous, predictorName];
        });
    };

    if (section === 'power') {
        return (
            <div className="space-y-8">
                <Card darkMode={darkMode}>
                    <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-xl ${darkMode ? 'bg-indigo-500/10 text-indigo-300' : 'bg-indigo-50 text-indigo-700'}`}>
                            <Target size={20} />
                        </div>
                        <div>
                            <h3 className={`text-xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                Multiple regression power planning
                            </h3>
                            <p className={`mt-2 text-sm max-w-3xl ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                This first slice uses the standard omnibus fixed-model test of whether model R^2 differs from 0. It keeps the power tab planning-oriented while the calculator handles coefficient-level observed-data output.
                            </p>
                        </div>
                    </div>
                </Card>

                <PowerAnalysisTab
                    testConfig={testConfig}
                    currentStats={currentStats}
                    darkMode={darkMode}
                    initialMode={initialPowerMode}
                />
            </div>
        );
    }

    if (section === 'effect_size') {
        return (
            <div className="space-y-8">
                {effectSourceStats?.ok && (
                    <Card darkMode={darkMode}>
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <div className={`text-[10px] font-black uppercase tracking-widest mb-2 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
                                    Current Calculator Snapshot
                                </div>
                                <h3 className={`text-2xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                    R^2 = {formatStat(effectSourceStats.rSquared, 3)}
                                </h3>
                                <p className={`mt-2 text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                    The active model uses {effectSourceStats.predictorCount} predictors, adjusted R^2 = {formatStat(effectSourceStats.adjustedRSquared, 3)}, and RMSE = {formatStat(effectSourceStats.rmse, 3)}.
                                </p>
                            </div>
                            <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${darkMode ? 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20' : 'bg-indigo-50 text-indigo-700 border border-indigo-200'}`}>
                                f^2 = {formatStat(rSquaredToFSquared(effectSourceStats.rSquared), 3)}
                            </div>
                        </div>
                    </Card>
                )}

                <div className="grid lg:grid-cols-12 gap-8">
                    <div className="lg:col-span-5">
                        <Card darkMode={darkMode} className="h-full">
                            <div className="flex items-center gap-3 mb-4">
                                <div className={`p-3 rounded-xl ${darkMode ? 'bg-indigo-500/10 text-indigo-300' : 'bg-indigo-50 text-indigo-700'}`}>
                                    <Sigma size={18} />
                                </div>
                                <div>
                                    <div className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
                                        Effect Size
                                    </div>
                                    <h3 className={`text-2xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                        Fit, complexity, and slope are different ideas
                                    </h3>
                                </div>
                            </div>

                            <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                In multiple regression, R^2 is the main overall fit summary. Adjusted R^2 discounts some of that fit for model complexity. The coefficients still matter, but they are not the same thing as overall effect size.
                            </p>

                            <div className="mt-6 grid gap-4">
                                <label className="block">
                                    <span className={`text-[11px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                                        Model Fit (R^2)
                                    </span>
                                    <input type="number" min={0} max={0.999} step={0.01} value={Number.isFinite(effectRSquared) ? effectRSquared : ''} onChange={(event) => {
                                        const numeric = Number(event.target.value);
                                        if (Number.isFinite(numeric)) {
                                            setEffectRSquared(Math.max(0, Math.min(0.999, numeric)));
                                        }
                                    }} className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm font-bold outline-none transition-colors ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200 focus:border-indigo-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500'}`} />
                                </label>

                                <label className="block">
                                    <span className={`text-[11px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                                        Sample Size (N)
                                    </span>
                                    <input type="number" min={4} step={1} value={Number.isFinite(effectSampleSize) ? effectSampleSize : ''} onChange={(event) => {
                                        const numeric = Number(event.target.value);
                                        if (Number.isFinite(numeric)) {
                                            setEffectSampleSize(Math.max(4, Math.round(numeric)));
                                        }
                                    }} className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm font-bold outline-none transition-colors ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200 focus:border-indigo-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500'}`} />
                                </label>

                                <label className="block">
                                    <span className={`text-[11px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                                        Predictor Count
                                    </span>
                                    <input type="number" min={2} step={1} value={Number.isFinite(effectPredictorCount) ? effectPredictorCount : ''} onChange={(event) => {
                                        const numeric = Number(event.target.value);
                                        if (Number.isFinite(numeric)) {
                                            setEffectPredictorCount(Math.max(2, Math.round(numeric)));
                                        }
                                    }} className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm font-bold outline-none transition-colors ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200 focus:border-indigo-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500'}`} />
                                </label>
                            </div>
                        </Card>
                    </div>

                    <div className="lg:col-span-7 space-y-6">
                        <div className="grid md:grid-cols-3 gap-4">
                            <MetricTile
                                darkMode={darkMode}
                                label="R^2"
                                value={formatStat(effectRSquared, 3)}
                                detail={`${formatStat(effectRSquared * 100, 1)}% of the outcome variance is explained by the full model.`}
                                tone="primary"
                            />
                            <MetricTile
                                darkMode={darkMode}
                                label="Adjusted R^2"
                                value={formatStat(effectAdjustedRSquared, 3)}
                                detail="Adjusted R^2 pulls the fit estimate back a bit when the model uses more predictors."
                            />
                            <MetricTile
                                darkMode={darkMode}
                                label="Cohen's f^2"
                                value={formatStat(effectFSquared, 3)}
                                detail="The shared power-analysis architecture uses f^2 = R^2 / (1 - R^2) for this omnibus regression slice."
                            />
                        </div>

                        <Card darkMode={darkMode}>
                            <div className="flex items-center gap-3 mb-4">
                                <TrendingUp size={18} className={darkMode ? 'text-emerald-300' : 'text-emerald-700'} />
                                <h3 className={`text-lg font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                    What the effect-size numbers are telling you
                                </h3>
                            </div>
                            <div className="space-y-4">
                                <div className={`rounded-xl border p-4 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                                    <div className={`text-[10px] font-black uppercase tracking-widest mb-2 ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>Overall fit</div>
                                    <p className={`text-sm ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                                        R^2 is the share of outcome variance explained by the whole predictor set together. It is an overall model-fit story, not a statement that every coefficient is equally important.
                                    </p>
                                </div>
                                <div className={`rounded-xl border p-4 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                                    <div className={`text-[10px] font-black uppercase tracking-widest mb-2 ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>Conditional slopes</div>
                                    <p className={`text-sm ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                                        Each coefficient is a conditional rate of change: how predicted Y changes for one predictor after the others in the model are held constant. That means slope size depends on units and overlap among predictors.
                                    </p>
                                </div>
                                <div className={`rounded-xl border p-4 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                                    <div className={`text-[10px] font-black uppercase tracking-widest mb-2 ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>Shared variance</div>
                                    <p className={`text-sm ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                                        When predictors overlap, a model can still have a strong R^2 while individual coefficients become unstable. That is why adjusted R^2 and collinearity checks belong in the same conversation.
                                    </p>
                                </div>
                            </div>
                        </Card>

                        {effectSourceStats?.ok && (
                            <Card darkMode={darkMode}>
                                <div className="flex items-center gap-3 mb-4">
                                    <Calculator size={18} className={darkMode ? 'text-sky-300' : 'text-sky-700'} />
                                    <h3 className={`text-lg font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                        Current conditional slopes
                                    </h3>
                                </div>

                                <div className="grid md:grid-cols-2 gap-4">
                                    {effectSourceStats.coefficients.filter((coefficient) => coefficient.id !== 'intercept').map((coefficient) => (
                                        <div key={coefficient.id} className={`rounded-xl border p-4 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                                            <div className={`text-[10px] font-black uppercase tracking-widest mb-2 ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>{coefficient.label}</div>
                                            <p className={`text-xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                                b = {formatStat(coefficient.estimate, 3)}
                                            </p>
                                            <p className={`mt-2 text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                                {coefficient.interpretation}
                                            </p>
                                            <p className={`mt-3 text-xs font-bold uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                                                Standardized beta {formatStat(coefficient.standardizedBeta, 3)} | VIF {formatStat(coefficient.vif, 2)}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    if (section === 'calculator') {
        return (
            <div className="space-y-8">
                <Card darkMode={darkMode}>
                    <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-xl ${darkMode ? 'bg-indigo-500/10 text-indigo-300' : 'bg-indigo-50 text-indigo-700'}`}>
                            <Calculator size={20} />
                        </div>
                        <div>
                            <div className={`text-[10px] font-black uppercase tracking-widest mb-2 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
                                Test Calculator
                            </div>
                            <h3 className={`text-xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                Fit a multiple-regression model from your data
                            </h3>
                            <p className={`mt-2 text-sm max-w-3xl ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                Choose one quantitative outcome and at least two quantitative predictors. The page estimates the fitted equation, coefficient table, omnibus model test, prediction outputs, and compact collinearity guidance.
                            </p>
                        </div>
                    </div>
                </Card>

                <div className="grid lg:grid-cols-12 gap-8 items-start">
                    <div className="lg:col-span-4 space-y-6">
                        <Card darkMode={darkMode}>
                            <div className="flex items-center gap-3 mb-4">
                                <Database size={18} className={darkMode ? 'text-sky-300' : 'text-sky-700'} />
                                <h3 className={`text-lg font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                    Data workspace
                                </h3>
                            </div>

                            <div className="flex flex-wrap gap-2 mb-5">
                                {[
                                    { id: 'paste', label: 'Paste / Upload' },
                                    { id: 'saved', label: 'Saved Dataset' },
                                ].map((mode) => (
                                    <button
                                        key={mode.id}
                                        type="button"
                                        onClick={() => setCalculatorInputMode(mode.id)}
                                        className={`rounded-full border px-3 py-2 text-[11px] font-black uppercase tracking-widest transition-colors ${calculatorInputMode === mode.id
                                            ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300'
                                            : (darkMode ? 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700 hover:text-slate-200' : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:text-slate-900')
                                        }`}
                                    >
                                        {mode.label}
                                    </button>
                                ))}
                            </div>

                            {calculatorInputMode === 'paste' ? (
                                <>
                                    <div className="flex flex-wrap gap-3">
                                        <label className={`inline-flex items-center gap-2 px-4 py-3 rounded-xl cursor-pointer font-bold text-sm border ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200 hover:border-slate-700' : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'}`}>
                                            <FileUp size={16} />
                                            Upload CSV
                                            <input type="file" accept=".csv,.tsv,.txt" className="hidden" onChange={onUpload} />
                                        </label>
                                        <button
                                            onClick={() => setTableText(SAMPLE_DATASET)}
                                            className={`px-4 py-3 rounded-xl font-bold text-sm border ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200 hover:border-slate-700' : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'}`}
                                        >
                                            Load Sample Dataset
                                        </button>
                                    </div>

                                    <label className="block mt-5">
                                        <span className={`text-[11px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                                            Paste CSV / Table Data
                                        </span>
                                        <textarea
                                            value={tableText}
                                            onChange={(event) => setTableText(event.target.value)}
                                            rows={12}
                                            className={`mt-2 w-full rounded-2xl border px-4 py-3 text-sm font-medium outline-none resize-y transition-colors ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200 focus:border-indigo-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500'}`}
                                        />
                                    </label>

                                    <label className="block">
                                        <span className={`text-[11px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                                            Outcome Variable (Y)
                                        </span>
                                        <select value={selectedOutcome} onChange={(event) => setSelectedOutcome(event.target.value)} className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm font-bold outline-none transition-colors ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200 focus:border-indigo-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500'}`}>
                                            {numericColumns.map((column) => (
                                                <option key={column.name} value={column.name}>{column.name}</option>
                                            ))}
                                        </select>
                                    </label>

                                    <div>
                                        <div className={`text-[11px] font-black uppercase tracking-widest mb-3 ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                                            Predictor Variables (Select 2+)
                                        </div>
                                        <div className="space-y-2">
                                            {numericColumns.filter((column) => column.name !== selectedOutcome).map((column) => (
                                                <label key={column.name} className={`flex items-center gap-3 rounded-xl border px-4 py-3 cursor-pointer ${selectedPredictors.includes(column.name) ? (darkMode ? 'bg-indigo-500/10 border-indigo-500/30 text-white' : 'bg-indigo-50 border-indigo-200 text-slate-900') : (darkMode ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700')}`}>
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedPredictors.includes(column.name)}
                                                        onChange={() => togglePredictor(column.name)}
                                                        className="rounded border-slate-400"
                                                    />
                                                    <span className="font-bold text-sm">{column.name}</span>
                                                </label>
                                            ))}
                                        </div>
                                        <p className={`mt-3 text-sm ${darkMode ? 'text-slate-500' : 'text-slate-600'}`}>
                                            This fast lane keeps the existing quick-entry workflow intact for sample data and pasted tables.
                                        </p>
                                    </div>
                                </>
                            ) : (
                                <div className="space-y-5">
                                    <label className="block">
                                        <span className={`text-[11px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                                            Saved Dataset
                                        </span>
                                        <select
                                            value={selectedDatasetId}
                                            onChange={(event) => setSelectedDatasetId(event.target.value)}
                                            className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm font-bold outline-none transition-colors ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200 focus:border-indigo-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500'}`}
                                        >
                                            {!datasets.length && <option value="">No saved datasets yet</option>}
                                            {datasets.map((dataset) => (
                                                <option key={dataset.id} value={dataset.id}>{dataset.name}</option>
                                            ))}
                                        </select>
                                    </label>

                                    {savedDataset && (
                                        <div className={`rounded-2xl border p-4 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                                            <div className="flex flex-wrap items-center justify-between gap-3">
                                                <div>
                                                    <div className={`text-[10px] font-black uppercase tracking-widest mb-1 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
                                                        Dataset snapshot
                                                    </div>
                                                    <p className={`text-sm font-bold ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                                                        {savedDataset.rowCount} rows • {savedDataset.columnCount} variables
                                                    </p>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => onOpenDataManager?.()}
                                                    className={`rounded-lg border px-3 py-2 text-[11px] font-black uppercase tracking-widest ${darkMode ? 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white' : 'bg-white border-slate-200 text-slate-700 hover:text-slate-900'}`}
                                                >
                                                    Open Data Manager
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    <VariableRolePicker
                                        darkMode={darkMode}
                                        dataset={savedDataset}
                                        selection={savedRoleSelection}
                                        onChange={setSavedRoleSelection}
                                        emptyMessage="Save a dataset in Data Manager first, then come back here to map the outcome and predictors."
                                        roles={[
                                            {
                                                id: 'outcome',
                                                label: 'Outcome Variable (Y)',
                                                selection: 'single',
                                                allowedTypes: ['numeric'],
                                                placeholder: 'Select numeric outcome',
                                                emptyOptionsText: 'This dataset does not currently have any numeric variables for the outcome role.',
                                            },
                                            {
                                                id: 'predictors',
                                                label: 'Predictor Variables (Select 2+)',
                                                selection: 'multiple',
                                                allowedTypes: ['numeric'],
                                                excludeRoleIds: ['outcome'],
                                                helperText: 'Only numeric variables are shown for the current multiple-regression workflow.',
                                                emptyOptionsText: 'This dataset needs more numeric variables before it can drive the current multiple-regression calculator.',
                                            },
                                        ]}
                                    />

                                    {savedDataset && (
                                        <p className={`text-sm ${darkMode ? 'text-slate-500' : 'text-slate-600'}`}>
                                            Data preparation lives in the Data Manager. This calculator only maps variables and runs the existing regression engine.
                                        </p>
                                    )}
                                </div>
                            )}

                            <label className="block">
                                <span className={`text-[11px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                                    Confidence Level
                                </span>
                                <input
                                    type="number"
                                    min={0.8}
                                    max={0.99}
                                    step={0.01}
                                    value={confidenceLevel}
                                    onChange={(event) => {
                                        const numeric = Number(event.target.value);
                                        if (numeric >= 0.8 && numeric < 1) {
                                            setConfidenceLevel(numeric);
                                        }
                                    }}
                                    className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm font-bold outline-none transition-colors ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200 focus:border-indigo-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500'}`}
                                />
                            </label>
                        </Card>
                    </div>

                    <div className="lg:col-span-8 space-y-6">
                        {(activeCompleteCaseSummary.total > 0 && (activeCompleteCaseSummary.usable > 0 || activeCompleteCaseSummary.dropped > 0)) && (
                            <Card darkMode={darkMode}>
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <div className={`text-[10px] font-black uppercase tracking-widest mb-2 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
                                            Complete-case summary
                                        </div>
                                        <h3 className={`text-lg font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                            {activeCompleteCaseSummary.usable} usable rows remain for this model
                                        </h3>
                                        <p className={`mt-2 text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                            {activeCompleteCaseSummary.dropped > 0
                                                ? `${activeCompleteCaseSummary.dropped} rows were excluded because at least one selected analysis variable was missing or non-numeric.`
                                                : 'All rows are currently usable for the selected variables.'}
                                        </p>
                                    </div>
                                    <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${activeCompleteCaseSummary.dropped > 0
                                        ? (darkMode ? 'bg-amber-500/10 text-amber-200 border border-amber-500/20' : 'bg-amber-50 text-amber-700 border border-amber-200')
                                        : (darkMode ? 'bg-slate-950 border border-slate-800 text-slate-400' : 'bg-slate-50 border border-slate-200 text-slate-600')
                                    }`}>
                                        {activeCompleteCaseSummary.usable} / {activeCompleteCaseSummary.total} rows
                                    </div>
                                </div>
                            </Card>
                        )}

                        {calculatorNeedsSetup ? (
                            <Card darkMode={darkMode}>
                                <div className="flex items-start gap-4">
                                    <div className={`p-3 rounded-xl ${darkMode ? 'bg-amber-500/10 text-amber-300' : 'bg-amber-50 text-amber-700'}`}>
                                        <AlertTriangle size={20} />
                                    </div>
                                    <div>
                                        <h3 className={`text-lg font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                            Complete the model setup
                                        </h3>
                                        <div className={`mt-3 space-y-2 text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                            {(calculatorModelErrors.length ? calculatorModelErrors : ['Choose one outcome and at least two predictors to fit the multiple-regression model.']).map((error) => (
                                                <p key={error}>{error}</p>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        ) : (
                            <>
                                <div className="grid md:grid-cols-2 xl:grid-cols-5 gap-4">
                                    <MetricTile darkMode={darkMode} label="R^2" value={formatStat(calculatorStats.rSquared, 3)} detail={`${formatStat(calculatorStats.rSquared * 100, 1)}% variance explained`} tone="primary" />
                                    <MetricTile darkMode={darkMode} label="Adjusted R^2" value={formatStat(calculatorStats.adjustedRSquared, 3)} detail="Complexity-adjusted model fit" />
                                    <MetricTile darkMode={darkMode} label="RMSE" value={formatStat(calculatorStats.rmse, 3)} detail="Typical prediction error size" />
                                    <MetricTile darkMode={darkMode} label="Model F" value={formatStat(calculatorStats.modelF, 3)} detail={`p ${formatPValue(calculatorStats.modelPValue)}`} />
                                    <MetricTile darkMode={darkMode} label="Max VIF" value={formatStat(calculatorStats.maxVIF, 2)} detail={`${calculatorStats.collinearityLabel} predictor overlap`} tone={calculatorStats.maxVIF >= 5 ? 'warning' : 'default'} />
                                </div>

                                <Card darkMode={darkMode}>
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <div className={`text-[10px] font-black uppercase tracking-widest mb-2 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
                                                Fitted Model
                                            </div>
                                            <h3 className={`text-xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                                {buildEquationText({ stats: calculatorStats, outcomeLabel: activeOutcomeLabel })}
                                            </h3>
                                            <p className={`mt-2 text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                                {buildMultipleRegressionInterpretation(calculatorStats, activeOutcomeLabel)}
                                            </p>
                                        </div>
                                        <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${darkMode ? 'bg-slate-950 border border-slate-800 text-slate-400' : 'bg-slate-50 border border-slate-200 text-slate-600'}`}>
                                            F({calculatorStats.dfModel}, {calculatorStats.dfError}) = {formatStat(calculatorStats.modelF, 3)}, p {formatPValue(calculatorStats.modelPValue)}
                                        </div>
                                    </div>
                                </Card>

                                <div className="grid xl:grid-cols-2 gap-6">
                                    <Card darkMode={darkMode}>
                                        <ObservedFittedPlot
                                            stats={calculatorStats}
                                            darkMode={darkMode}
                                            selectedPointId={calculatorSelectedPointId}
                                            onPointSelect={setCalculatorSelectedPointId}
                                            predictionTarget={calculatorPrediction}
                                            subtitle="The diagonal is perfect prediction. Click a case to inspect how far its observed outcome sits above or below the fitted value."
                                            yLabel={activeOutcomeLabel || 'Observed Y'}
                                        />
                                    </Card>

                                    <Card darkMode={darkMode}>
                                        <RegressionResidualPlot
                                            stats={calculatorStats}
                                            darkMode={darkMode}
                                            highlightPointIndex={calculatorSelectedPointId}
                                            subtitle="Residuals should look roughly patternless around zero if the linear conditional mean is doing a reasonable job."
                                        />
                                    </Card>
                                </div>

                                <Card darkMode={darkMode}>
                                    <div className="grid lg:grid-cols-12 gap-6 items-start">
                                        <div className="lg:col-span-5">
                                            <div className="flex items-center gap-3 mb-4">
                                                <Target size={18} className={darkMode ? 'text-amber-300' : 'text-amber-700'} />
                                                <h3 className={`text-lg font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                                    Predict from the fitted model
                                                </h3>
                                            </div>

                                            <div className="space-y-4">
                                                {calculatorStats.predictorSummaries.map((summary) => (
                                                    <label key={summary.label} className="block">
                                                        <span className={`text-[11px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                                                            {summary.label}
                                                        </span>
                                                        <input
                                                            type="number"
                                                            step={0.1}
                                                            value={calculatorPredictionInputs?.[summary.label] ?? ''}
                                                            onChange={(event) => setCalculatorPredictionInputs((previous) => ({
                                                                ...previous,
                                                                [summary.label]: event.target.value,
                                                            }))}
                                                            className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm font-bold outline-none transition-colors ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200 focus:border-indigo-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500'}`}
                                                        />
                                                        <div className={`mt-2 text-xs ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                                                            Observed range {formatStat(summary.min, 2)} to {formatStat(summary.max, 2)}
                                                        </div>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="lg:col-span-7">
                                            <div className="grid md:grid-cols-3 gap-4">
                                                <div className={`rounded-xl border p-4 ${darkMode ? 'bg-indigo-500/10 border-indigo-500/20' : 'bg-indigo-50 border-indigo-200'}`}>
                                                    <div className={`text-[10px] font-black uppercase tracking-widest mb-2 ${darkMode ? 'text-indigo-300' : 'text-indigo-700'}`}>Predicted Mean {activeOutcomeLabel}</div>
                                                    <p className={`text-2xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>{formatStat(calculatorPrediction?.fitted, 3)}</p>
                                                </div>
                                                <div className={`rounded-xl border p-4 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                                                    <div className={`text-[10px] font-black uppercase tracking-widest mb-2 ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>{Math.round(confidenceLevel * 100)}% Mean CI</div>
                                                    <p className={`text-sm ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                                                        [{formatStat(calculatorPrediction?.meanInterval?.lower, 3)}, {formatStat(calculatorPrediction?.meanInterval?.upper, 3)}]
                                                    </p>
                                                </div>
                                                <div className={`rounded-xl border p-4 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                                                    <div className={`text-[10px] font-black uppercase tracking-widest mb-2 ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>{Math.round(confidenceLevel * 100)}% Prediction Interval</div>
                                                    <p className={`text-sm ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                                                        [{formatStat(calculatorPrediction?.predictionInterval?.lower, 3)}, {formatStat(calculatorPrediction?.predictionInterval?.upper, 3)}]
                                                    </p>
                                                </div>
                                            </div>

                                            <p className={`mt-4 text-sm leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                                Multiple regression predicts the mean outcome from the whole predictor profile at once. The prediction interval is wider because individual cases still vary around that mean prediction.
                                            </p>

                                            {calculatorPrediction?.isExtrapolation && (
                                                <div className={`mt-4 rounded-xl border p-4 ${darkMode ? 'bg-amber-500/10 border-amber-500/20 text-amber-200' : 'bg-amber-50 border-amber-200 text-amber-700'}`}>
                                                    At least one predictor value is outside the observed range, so this is an extrapolation rather than a within-sample interpolation.
                                                </div>
                                            )}

                                            <div className={`mt-6 rounded-xl border p-4 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                                                <div className={`text-[10px] font-black uppercase tracking-widest mb-2 ${darkMode ? 'text-amber-300' : 'text-amber-700'}`}>Selected Case</div>
                                                <p className={`text-sm ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                                                    Click a point in the observed-vs-fitted plot to inspect how one case sits around the model.
                                                </p>
                                                <div className="mt-4 grid md:grid-cols-3 gap-3">
                                                    <div className={`rounded-xl border p-3 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                                                        <div className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>Observed {activeOutcomeLabel}</div>
                                                        <p className={`mt-1 text-lg font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>{formatStat(calculatorSelectedPair?.y, 3)}</p>
                                                    </div>
                                                    <div className={`rounded-xl border p-3 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                                                        <div className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>Fitted {activeOutcomeLabel}</div>
                                                        <p className={`mt-1 text-lg font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>{formatStat(calculatorSelectedPair?.fitted, 3)}</p>
                                                    </div>
                                                    <div className={`rounded-xl border p-3 ${darkMode ? 'bg-amber-500/10 border-amber-500/20' : 'bg-amber-50 border-amber-200'}`}>
                                                        <div className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-amber-300' : 'text-amber-700'}`}>Residual</div>
                                                        <p className={`mt-1 text-lg font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>{formatStat(calculatorSelectedPair?.residual, 3)}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </Card>

                                <Card darkMode={darkMode}>
                                    <div className="flex items-center gap-3 mb-4">
                                        <TrendingUp size={18} className={darkMode ? 'text-emerald-300' : 'text-emerald-700'} />
                                        <h3 className={`text-lg font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                            Coefficient summary
                                        </h3>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[760px] text-sm">
                                            <thead>
                                                <tr className={darkMode ? 'text-slate-500' : 'text-slate-500'}>
                                                    <th className="text-left pb-3 font-black uppercase tracking-widest text-[10px]">Term</th>
                                                    <th className="text-left pb-3 font-black uppercase tracking-widest text-[10px]">Estimate</th>
                                                    <th className="text-left pb-3 font-black uppercase tracking-widest text-[10px]">SE</th>
                                                    <th className="text-left pb-3 font-black uppercase tracking-widest text-[10px]">t</th>
                                                    <th className="text-left pb-3 font-black uppercase tracking-widest text-[10px]">p</th>
                                                    <th className="text-left pb-3 font-black uppercase tracking-widest text-[10px]">Std. Beta</th>
                                                    <th className="text-left pb-3 font-black uppercase tracking-widest text-[10px]">VIF</th>
                                                    <th className="text-left pb-3 font-black uppercase tracking-widest text-[10px]">{Math.round(confidenceLevel * 100)}% CI</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {calculatorStats.coefficients.map((coefficient) => (
                                                    <tr key={coefficient.id} className={`border-t ${darkMode ? 'border-slate-800 text-slate-200' : 'border-slate-200 text-slate-700'}`}>
                                                        <td className="py-3 font-bold">{coefficient.label}</td>
                                                        <td className="py-3">{formatStat(coefficient.estimate, 3)}</td>
                                                        <td className="py-3">{formatStat(coefficient.standardError, 3)}</td>
                                                        <td className="py-3">{formatStat(coefficient.tStatistic, 3)}</td>
                                                        <td className="py-3">p {formatPValue(coefficient.pValue)}</td>
                                                        <td className="py-3">{coefficient.standardizedBeta == null ? '--' : formatStat(coefficient.standardizedBeta, 3)}</td>
                                                        <td className="py-3">{coefficient.vif == null ? '--' : formatStat(coefficient.vif, 2)}</td>
                                                        <td className="py-3">[{formatStat(coefficient.confidenceInterval.lower, 3)}, {formatStat(coefficient.confidenceInterval.upper, 3)}]</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </Card>

                                <div className="grid xl:grid-cols-2 gap-6">
                                    <Card darkMode={darkMode}>
                                        <div className="flex items-center gap-3 mb-4">
                                            <Info size={18} className={darkMode ? 'text-sky-300' : 'text-sky-700'} />
                                            <h3 className={`text-lg font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                                Conditional predictor summaries
                                            </h3>
                                        </div>

                                        <div className="space-y-3">
                                            {calculatorStats.coefficients.filter((coefficient) => coefficient.id !== 'intercept').map((coefficient) => (
                                                <div key={coefficient.id} className={`rounded-xl border p-4 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                                                    <div className="flex items-center justify-between gap-3">
                                                        <h4 className={`font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>{coefficient.label}</h4>
                                                        <div className={`px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${coefficient.vif >= 5 ? (darkMode ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20' : 'bg-amber-50 text-amber-700 border border-amber-200') : (darkMode ? 'bg-slate-900 border border-slate-800 text-slate-400' : 'bg-white border border-slate-200 text-slate-600')}`}>
                                                            VIF {formatStat(coefficient.vif, 2)}
                                                        </div>
                                                    </div>
                                                    <p className={`mt-2 text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                                        {coefficient.interpretation.replace('predicted Y', `predicted ${activeOutcomeLabel}`)}
                                                    </p>
                                                    <p className={`mt-3 text-xs font-bold uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                                                        Zero-order r {formatStat(coefficient.zeroOrderCorrelation, 3)} | Partial R^2 {formatStat(coefficient.partialRSquared, 3)}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </Card>

                                    <Card darkMode={darkMode}>
                                        <div className="flex items-center gap-3 mb-4">
                                            <AlertTriangle size={18} className={darkMode ? 'text-amber-300' : 'text-amber-700'} />
                                            <h3 className={`text-lg font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                                Practical model guidance
                                            </h3>
                                        </div>

                                        <div className="space-y-3">
                                            {calculatorGuidance.map((item) => (
                                                <div key={item.title} className={`rounded-xl border p-4 ${item.tone === 'warning' ? (darkMode ? 'bg-amber-500/10 border-amber-500/20' : 'bg-amber-50 border-amber-200') : (darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200')}`}>
                                                    <h4 className={`font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>{item.title}</h4>
                                                    <p className={`mt-2 text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>{item.body}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </Card>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {assumptions.length > 0 && (
                    <Card darkMode={darkMode}>
                        <div className="flex items-start gap-4">
                            <div className={`p-3 rounded-xl ${darkMode ? 'bg-indigo-500/10 text-indigo-300' : 'bg-indigo-50 text-indigo-700'}`}>
                                <CheckCircle size={20} />
                            </div>
                            <div>
                                <div className={`text-[10px] font-black uppercase tracking-widest mb-2 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
                                    Guidance / Assumptions
                                </div>
                                <h3 className={`text-xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                    What to check before trusting the model
                                </h3>
                                <p className={`mt-2 text-sm max-w-3xl ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                    Treat these as practical checks rather than a rigid fail gate. The goal is to understand when one linear conditional-mean model is useful and when overlap, residual patterns, or study design call for more caution.
                                </p>
                            </div>
                        </div>

                        <div className="mt-6 space-y-3">
                            {assumptions.map((assumption, index) => (
                                <AssumptionItem key={`${assumption.label}-${index}`} assumption={assumption} darkMode={darkMode} />
                            ))}
                        </div>
                    </Card>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <Card darkMode={darkMode}>
                <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-xl ${darkMode ? 'bg-indigo-500/10 text-indigo-300' : 'bg-indigo-50 text-indigo-700'}`}>
                        <Sparkles size={20} />
                    </div>
                    <div>
                        <h3 className={`text-xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>Multiple regression tutor / lessons</h3>
                        <p className={`mt-2 text-sm max-w-3xl ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                            This lesson page is about the logic of multiple regression: what the equation does, what “holding the other predictor constant” means, why predictor overlap matters, and how fit, prediction, and interpretation answer different questions.
                        </p>
                        <p className={`mt-3 text-sm max-w-3xl ${darkMode ? 'text-slate-500' : 'text-slate-600'}`}>
                            Active example preset: <span className={`font-black ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>{lessonContext.headline}</span>. {lessonContext.supportingText}
                        </p>
                    </div>
                </div>
            </Card>

            <div className="grid lg:grid-cols-12 gap-8 items-start">
                <div className="lg:col-span-8 space-y-6">
                    <div ref={lessonMainVisualRef}>
                        <Card darkMode={darkMode} className="lg:sticky lg:top-24 xl:top-28 z-10 space-y-5">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <div className={`text-[10px] font-black uppercase tracking-widest mb-2 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
                                    Main teaching view
                                </div>
                                <h3 className={`text-lg font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                    {lessonMainViews.find((view) => view.id === lessonMainView)?.label || 'Observed vs Fitted'}
                                </h3>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {lessonMainViews.map((view) => (
                                    <button
                                        key={view.id}
                                        onClick={() => setLessonMainView(view.id)}
                                        className={`rounded-full border px-3 py-2 text-[11px] font-black uppercase tracking-widest transition-colors ${lessonMainView === view.id ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300' : (darkMode ? 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700 hover:text-slate-200' : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:text-slate-900')}`}
                                    >
                                        {view.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className={`rounded-2xl border p-4 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                            <div className="flex flex-wrap items-start justify-between gap-4">
                                <div>
                                    <div className={`text-[10px] font-black uppercase tracking-widest mb-2 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
                                        Live regression equation
                                    </div>
                                    <p className={`text-xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                        {lessonEquationText}
                                    </p>
                                    <p className={`mt-2 text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                        {lessonSymbolicEquation}
                                    </p>
                                </div>
                                <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${darkMode ? 'bg-amber-500/10 text-amber-200 border border-amber-500/20' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                                    Additive model only
                                </div>
                            </div>
                            <p className={`mt-3 text-sm leading-relaxed ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                                Each slope is conditional: it tells the change in predicted {lessonContext.outcomeLabel} for a 1-unit increase in one predictor while the other predictor is held constant.
                            </p>
                            <p className={`mt-2 text-xs leading-relaxed ${darkMode ? 'text-slate-500' : 'text-slate-600'}`}>
                                This model assumes the effect of {lessonPredictorLabels[INTERNAL_PREDICTOR_IDS[0]]} does not depend on {lessonPredictorLabels[INTERNAL_PREDICTOR_IDS[1]]}, and vice versa. That would require an interaction term.
                            </p>
                        </div>

                        <div className={`lg:hidden rounded-2xl border p-4 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <div className={`text-[10px] font-black uppercase tracking-widest mb-2 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
                                        Prediction controls
                                    </div>
                                    <p className={`text-xs ${darkMode ? 'text-slate-500' : 'text-slate-600'}`}>
                                        Mirrors the custom predictor profile so you can adjust prediction inputs while the graph stays in view.
                                    </p>
                                </div>
                                <div className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-widest ${darkMode ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-600'}`}>
                                    Graph-side helper
                                </div>
                            </div>

                            <div className="mt-4 grid gap-3">
                                {lessonStats?.predictorSummaries?.map((summary) => (
                                    <label key={`quick-${summary.label}`} className="block">
                                        <span className={`text-[11px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                                            {lessonPredictorLabels[summary.label]}
                                        </span>
                                        <input
                                            type="range"
                                            min={summary.min}
                                            max={summary.max}
                                            step={0.05}
                                            value={lessonPredictionInputs?.[summary.label] ?? summary.mean}
                                            onChange={(event) => setLessonPredictionInputs((previous) => ({
                                                ...previous,
                                                [summary.label]: Number(event.target.value),
                                            }))}
                                            className="mt-3 w-full"
                                        />
                                        <div className={`mt-2 flex items-center justify-between gap-3 text-sm ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                                            <span className="font-black">{formatStat(lessonPredictionInputs?.[summary.label] ?? summary.mean, 2)}</span>
                                            <span className={darkMode ? 'text-slate-500' : 'text-slate-500'}>
                                                {formatStat(summary.min, 1)} to {formatStat(summary.max, 1)}
                                            </span>
                                        </div>
                                    </label>
                                ))}
                            </div>

                            <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
                                <div className={`rounded-xl border p-4 ${darkMode ? 'bg-indigo-500/10 border-indigo-500/20' : 'bg-indigo-50 border-indigo-200'}`}>
                                    <div className={`text-[10px] font-black uppercase tracking-widest mb-2 ${darkMode ? 'text-indigo-300' : 'text-indigo-700'}`}>
                                        Predicted {lessonContext.outcomeLabel}
                                    </div>
                                    <p className={`text-2xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>{formatStat(lessonPrediction?.fitted, 3)}</p>
                                </div>
                                <div className={`rounded-xl border px-4 py-3 text-sm ${darkMode ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-white border-slate-200 text-slate-700'}`}>
                                    <div className={`text-[10px] font-black uppercase tracking-widest mb-1 ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                                        Current view
                                    </div>
                                    <p className="font-bold">
                                        {lessonMainViews.find((view) => view.id === lessonMainView)?.label || 'Observed vs Fitted'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {renderLessonMainVisual()}
                        </Card>
                    </div>

                    {lessonShowResiduals && lessonStats?.ok && (
                        <Card darkMode={darkMode}>
                            <RegressionResidualPlot
                                stats={lessonStats}
                                darkMode={darkMode}
                                highlightPointIndex={lessonSelectedPointId}
                                title="Pinned Residual Plot"
                                subtitle="This extra residual panel stays visible while you look at the other main views."
                            />
                        </Card>
                    )}

                    {lessonStats?.ok && (
                        <Card darkMode={darkMode}>
                            <div className="flex items-start justify-between gap-4 mb-5">
                                <div>
                                    <div className={`text-[10px] font-black uppercase tracking-widest mb-2 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
                                        Model summary
                                    </div>
                                    <h3 className={`text-lg font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                        Fit, prediction, and interpretation are different questions
                                    </h3>
                                    <p className={`mt-2 text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                        R^2 and the F statistic summarize the whole model. The slopes explain conditional relationships. Predictions use the whole equation for a specific predictor profile.
                                    </p>
                                </div>
                                <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${lessonStats.maxVIF >= 5 ? (darkMode ? 'bg-amber-500/10 text-amber-200 border border-amber-500/20' : 'bg-amber-50 text-amber-700 border border-amber-200') : (darkMode ? 'bg-slate-950 text-slate-400 border border-slate-800' : 'bg-slate-50 text-slate-600 border border-slate-200')}`}>
                                    Predictor overlap |r| = {formatStat(lessonOverlapCorrelation, 2)}
                                </div>
                            </div>

                            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
                                <MetricTile
                                    darkMode={darkMode}
                                    label={<TooltipLabel darkMode={darkMode} label="Intercept" tooltipKey="intercept" />}
                                    value={formatStat(lessonStats.intercept, 3)}
                                    detail={`Predicted ${lessonContext.outcomeLabel} when both predictors are 0. Most meaningful when 0 is realistic or the predictors are centered.`}
                                />
                                <MetricTile
                                    darkMode={darkMode}
                                    label={<TooltipLabel darkMode={darkMode} label="R^2" tooltipKey="rSquared" />}
                                    value={formatStat(lessonStats.rSquared, 3)}
                                    detail={lessonOutlierComparison ? `Δ ${formatSignedDifference(lessonStats.rSquared - lessonBaselineStats.rSquared, 3)} after adding the influential case.` : 'Overall model fit.'}
                                    tone={lessonOutlierComparison ? 'warning' : 'primary'}
                                />
                                <MetricTile
                                    darkMode={darkMode}
                                    label={<TooltipLabel darkMode={darkMode} label="Adjusted R^2" tooltipKey="adjustedRSquared" />}
                                    value={formatStat(lessonStats.adjustedRSquared, 3)}
                                    detail={lessonOutlierComparison ? `Δ ${formatSignedDifference(lessonStats.adjustedRSquared - lessonBaselineStats.adjustedRSquared, 3)} after adding the influential case.` : 'Fit after a small complexity penalty.'}
                                    tone={lessonOutlierComparison ? 'warning' : 'default'}
                                />
                                <MetricTile
                                    darkMode={darkMode}
                                    label={<TooltipLabel darkMode={darkMode} label="F statistic" tooltipKey="fStatistic" />}
                                    value={formatStat(lessonStats.modelF, 3)}
                                    detail={`Model p ${formatPValue(lessonStats.modelPValue)}`}
                                />
                                <MetricTile
                                    darkMode={darkMode}
                                    label={<TooltipLabel darkMode={darkMode} label="Model p-value" tooltipKey="pValue" />}
                                    value={formatPValue(lessonStats.modelPValue)}
                                    detail="Omnibus evidence that the full model explains more than a flat mean-only model."
                                />
                                <MetricTile
                                    darkMode={darkMode}
                                    label="Sample size (n)"
                                    value={`${lessonStats.n}`}
                                    detail={`Max VIF ${formatStat(lessonStats.maxVIF, 2)} | RMSE ${formatStat(lessonStats.rmse, 2)}`}
                                    tone={lessonStats.maxVIF >= 5 ? 'warning' : 'default'}
                                />
                            </div>
                        </Card>
                    )}

                    <div ref={lessonPredictionPlaygroundRef}>
                    <Card darkMode={darkMode}>
                        <div className="flex items-center gap-3 mb-4">
                            <Target size={18} className={darkMode ? 'text-amber-300' : 'text-amber-700'} />
                            <h3 className={`text-lg font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                Prediction playground
                            </h3>
                        </div>
                        <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                            The custom predictor profile is a hypothetical combination of predictor values. The selected sample case is one actual observed row from the sample. They are not meant to match unless you happen to choose the same values.
                        </p>
                        <p className={`mt-2 text-sm ${darkMode ? 'text-slate-500' : 'text-slate-600'}`}>
                            The same prediction sliders are mirrored in the tutor controls panel so you can keep the graph in view while you adjust them.
                        </p>

                        <div className="mt-6 grid xl:grid-cols-2 gap-6 items-start">
                            <div className={`rounded-2xl border p-5 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                                <div className={`text-[10px] font-black uppercase tracking-widest mb-2 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
                                    Custom predictor profile
                                </div>
                                <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                    Hypothetical combination of predictor values. Use this to see what the equation predicts for a profile you choose.
                                </p>

                                <div className="mt-5 space-y-4">
                                    {lessonStats?.predictorSummaries?.map((summary) => (
                                        <label key={summary.label} className="block">
                                            <span className={`text-[11px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                                                {lessonPredictorLabels[summary.label]}
                                            </span>
                                            <input
                                                type="range"
                                                min={summary.min}
                                                max={summary.max}
                                                step={0.05}
                                                value={lessonPredictionInputs?.[summary.label] ?? summary.mean}
                                                onChange={(event) => setLessonPredictionInputs((previous) => ({
                                                    ...previous,
                                                    [summary.label]: Number(event.target.value),
                                                }))}
                                                className="mt-3 w-full"
                                            />
                                            <div className={`mt-2 flex items-center justify-between gap-3 text-sm ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                                                <span className="font-black">{formatStat(lessonPredictionInputs?.[summary.label] ?? summary.mean, 2)}</span>
                                                <span className={darkMode ? 'text-slate-500' : 'text-slate-500'}>
                                                    Observed range {formatStat(summary.min, 2)} to {formatStat(summary.max, 2)}
                                                </span>
                                            </div>
                                        </label>
                                    ))}
                                </div>

                                <div className={`mt-5 rounded-xl border p-4 ${darkMode ? 'bg-indigo-500/10 border-indigo-500/20' : 'bg-indigo-50 border-indigo-200'}`}>
                                    <div className={`text-[10px] font-black uppercase tracking-widest mb-2 ${darkMode ? 'text-indigo-300' : 'text-indigo-700'}`}>
                                        Substitute into the equation
                                    </div>
                                    <p className={`text-sm font-black leading-relaxed ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                        {lessonSubstitutedEquation}
                                    </p>
                                </div>

                                <div className="mt-5 grid md:grid-cols-3 gap-4">
                                    <div className={`rounded-xl border p-4 ${darkMode ? 'bg-indigo-500/10 border-indigo-500/20' : 'bg-indigo-50 border-indigo-200'}`}>
                                        <div className={`text-[10px] font-black uppercase tracking-widest mb-2 ${darkMode ? 'text-indigo-300' : 'text-indigo-700'}`}>
                                            Predicted {lessonContext.outcomeLabel}
                                        </div>
                                        <p className={`text-2xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>{formatStat(lessonPrediction?.fitted, 3)}</p>
                                    </div>
                                    <div className={`rounded-xl border p-4 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                                        <div className={`text-[10px] font-black uppercase tracking-widest mb-2 ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                                            <TooltipLabel darkMode={darkMode} label="95% CI for mean response" tooltipKey="meanInterval" />
                                        </div>
                                        <p className={`text-sm ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                                            [{formatStat(lessonPrediction?.meanInterval?.lower, 3)}, {formatStat(lessonPrediction?.meanInterval?.upper, 3)}]
                                        </p>
                                    </div>
                                    <div className={`rounded-xl border p-4 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                                        <div className={`text-[10px] font-black uppercase tracking-widest mb-2 ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                                            <TooltipLabel darkMode={darkMode} label="95% PI for single new case" tooltipKey="predictionInterval" />
                                        </div>
                                        <p className={`text-sm ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                                            [{formatStat(lessonPrediction?.predictionInterval?.lower, 3)}, {formatStat(lessonPrediction?.predictionInterval?.upper, 3)}]
                                        </p>
                                    </div>
                                </div>

                                <p className={`mt-4 text-sm leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                    The fitted mean is about the model&apos;s average prediction for this profile. The prediction interval is wider because one new case can still land above or below that mean.
                                </p>

                                {lessonPrediction?.isExtrapolation && (
                                    <div className={`mt-4 rounded-xl border p-4 ${darkMode ? 'bg-amber-500/10 border-amber-500/20 text-amber-200' : 'bg-amber-50 border-amber-200 text-amber-700'}`}>
                                        At least one predictor value is outside the observed sample range, so this is an extrapolation rather than an interpolation.
                                    </div>
                                )}
                            </div>

                            <div className={`rounded-2xl border p-5 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <div className={`text-[10px] font-black uppercase tracking-widest mb-2 ${darkMode ? 'text-amber-300' : 'text-amber-700'}`}>
                                            Selected sample case
                                        </div>
                                        <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                            Actual observed row from the sample. Click a point in the main visual to inspect one case under the fitted model.
                                        </p>
                                    </div>
                                    {lessonSelectedIsInfluential && (
                                        <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${darkMode ? 'bg-amber-500/10 text-amber-200 border border-amber-500/20' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                                            Influential case
                                        </div>
                                    )}
                                </div>

                                <div className="mt-5 grid md:grid-cols-2 gap-4">
                                    {lessonStats?.predictorSummaries?.map((summary) => (
                                        <div key={summary.label} className={`rounded-xl border p-4 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                                            <div className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                                                {lessonPredictorLabels[summary.label]}
                                            </div>
                                            <p className={`mt-2 text-lg font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                                {formatStat(lessonSelectedPair?.predictors?.[summary.label], 3)}
                                            </p>
                                        </div>
                                    ))}
                                    <div className={`rounded-xl border p-4 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                                        <div className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                                            Observed {lessonContext.outcomeLabel}
                                        </div>
                                        <p className={`mt-2 text-lg font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                            {formatStat(lessonSelectedPair?.y, 3)}
                                        </p>
                                    </div>
                                    <div className={`rounded-xl border p-4 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                                        <div className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                                            Fitted {lessonContext.outcomeLabel}
                                        </div>
                                        <p className={`mt-2 text-lg font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                            {formatStat(lessonSelectedPair?.fitted, 3)}
                                        </p>
                                    </div>
                                    <div className={`rounded-xl border p-4 ${darkMode ? 'bg-amber-500/10 border-amber-500/20' : 'bg-amber-50 border-amber-200'}`}>
                                        <div className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-amber-300' : 'text-amber-700'}`}>
                                            <TooltipLabel darkMode={darkMode} label="Residual" tooltipKey="residual" />
                                        </div>
                                        <p className={`mt-2 text-lg font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                            {formatStat(lessonSelectedPair?.residual, 3)}
                                        </p>
                                    </div>
                                    <div className={`rounded-xl border p-4 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                                        <div className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                                            <TooltipLabel darkMode={darkMode} label="Leverage" tooltipKey="leverage" />
                                        </div>
                                        <p className={`mt-2 text-lg font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                            {formatStat(lessonSelectedPair?.leverage, 3)}
                                        </p>
                                    </div>
                                    <div className={`rounded-xl border p-4 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                                        <div className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                                            <TooltipLabel darkMode={darkMode} label="Cook's D" tooltipKey="cooksDistance" />
                                        </div>
                                        <p className={`mt-2 text-lg font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                            {formatStat(lessonSelectedPair?.cooksDistance, 3)}
                                        </p>
                                    </div>
                                </div>

                                <p className={`mt-4 text-sm leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                    Residual = observed {lessonContext.outcomeLabel} - fitted {lessonContext.outcomeLabel}. This case does not need to match the custom predictor profile unless you happened to choose the same predictor values yourself.
                                </p>
                            </div>
                        </div>
                    </Card>
                    </div>

                    {lessonOutlierComparison && (
                        <Card darkMode={darkMode}>
                            <div className="flex items-center gap-3 mb-4">
                                <AlertTriangle size={18} className={darkMode ? 'text-amber-300' : 'text-amber-700'} />
                                <h3 className={`text-lg font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                    What changed when the influential case was added
                                </h3>
                            </div>
                            <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                This comparison uses the same underlying sample before and after adding one influential case. Notice that the fitted model can move even though most rows stay the same.
                            </p>

                            <div className="mt-5 grid md:grid-cols-2 gap-4">
                                {lessonOutlierComparison.metrics.map((metric) => (
                                    <div key={metric.id} className={`rounded-xl border p-4 ${darkMode ? 'bg-amber-500/10 border-amber-500/20' : 'bg-amber-50 border-amber-200'}`}>
                                        <div className={`text-[10px] font-black uppercase tracking-widest mb-2 ${darkMode ? 'text-amber-200' : 'text-amber-700'}`}>
                                            <TooltipLabel darkMode={darkMode} label={metric.label} tooltipKey={metric.tooltipKey} />
                                        </div>
                                        <p className={`text-sm font-bold ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                                            {formatStat(metric.before, 3)} to {formatStat(metric.after, 3)}
                                        </p>
                                        <p className={`mt-2 text-sm ${darkMode ? 'text-amber-100' : 'text-amber-700'}`}>
                                            Delta {formatSignedDifference(metric.after - metric.before, 3)}
                                        </p>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-5 grid md:grid-cols-2 gap-4">
                                {lessonOutlierComparison.coefficients.map((coefficient) => (
                                    <div key={coefficient.id} className={`rounded-xl border p-4 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                                        <h4 className={`font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                            {coefficient.label}
                                        </h4>
                                        <p className={`mt-2 text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                            Estimate: {formatStat(coefficient.estimateBefore, 3)} to {formatStat(coefficient.estimateAfter, 3)} ({formatSignedDifference((coefficient.estimateAfter || 0) - (coefficient.estimateBefore || 0), 3)})
                                        </p>
                                        <p className={`mt-1 text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                            SE: {formatStat(coefficient.seBefore, 3)} to {formatStat(coefficient.seAfter, 3)} ({formatSignedDifference((coefficient.seAfter || 0) - (coefficient.seBefore || 0), 3)})
                                        </p>
                                    </div>
                                ))}
                            </div>

                            <div className={`mt-5 rounded-xl border p-4 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                                <p className={`text-sm ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                                    The most influential case in this version has leverage {formatStat(lessonStats.influence?.influentialPoint?.leverage, 3)} and Cook&apos;s D {formatStat(lessonStats.influence?.influentialPoint?.cooksDistance, 3)}.
                                </p>
                            </div>
                        </Card>
                    )}

                    {lessonShowPartialEffects && lessonStats?.ok && (
                        <Card darkMode={darkMode}>
                            <div className="flex items-center gap-3 mb-4">
                                <TrendingUp size={18} className={darkMode ? 'text-emerald-300' : 'text-emerald-700'} />
                                <h3 className={`text-lg font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                    How to interpret the slopes
                                </h3>
                            </div>

                            <div className="grid md:grid-cols-2 gap-4">
                                {lessonStats.coefficients.filter((coefficient) => coefficient.id !== 'intercept').map((coefficient) => {
                                    const otherPredictorId = coefficient.id === INTERNAL_PREDICTOR_IDS[0] ? INTERNAL_PREDICTOR_IDS[1] : INTERNAL_PREDICTOR_IDS[0];
                                    const signFlip = Math.sign(coefficient.zeroOrderCorrelation || 0) !== Math.sign(coefficient.estimate || 0);

                                    return (
                                        <div key={coefficient.id} className={`rounded-xl border p-4 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                                            <div className="flex items-center justify-between gap-3">
                                                <div>
                                                    <div className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                                                        <TooltipLabel darkMode={darkMode} label={`Slope for ${lessonPredictorLabels[coefficient.id]} (${getSlopeSymbol(coefficient.id)})`} tooltipKey="slope" />
                                                    </div>
                                                    <p className={`mt-2 text-2xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                                        {formatStat(coefficient.estimate, 3)}
                                                    </p>
                                                </div>
                                                <div className={`px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${coefficient.vif >= 5 ? (darkMode ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20' : 'bg-amber-50 text-amber-700 border border-amber-200') : (darkMode ? 'bg-slate-900 border border-slate-800 text-slate-400' : 'bg-white border border-slate-200 text-slate-600')}`}>
                                                    VIF {formatStat(coefficient.vif, 2)}
                                                </div>
                                            </div>
                                            <p className={`mt-3 text-sm leading-relaxed ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                                                Change in predicted {lessonContext.outcomeLabel} for a 1-unit increase in {lessonPredictorLabels[coefficient.id]}, holding {lessonPredictorLabels[otherPredictorId]} constant.
                                            </p>
                                            {signFlip && (
                                                <div className={`mt-4 rounded-xl border p-3 ${darkMode ? 'bg-amber-500/10 border-amber-500/20 text-amber-100' : 'bg-amber-50 border-amber-200 text-amber-700'}`}>
                                                    The simple X-Y correlation and the conditional slope point in different directions here. That can happen when the predictors overlap strongly.
                                                </div>
                                            )}
                                            <details className={`mt-4 rounded-xl border px-4 py-3 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                                                <summary className={`cursor-pointer text-sm font-black ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                                                    More detail
                                                </summary>
                                                <div className={`mt-4 space-y-2 text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                                    <p><TooltipLabel darkMode={darkMode} label="Zero-order correlation" tooltipKey="zeroOrderCorrelation" />: {formatStat(coefficient.zeroOrderCorrelation, 3)}</p>
                                                    <p><TooltipLabel darkMode={darkMode} label="Standardized beta" tooltipKey="standardizedBeta" />: {formatStat(coefficient.standardizedBeta, 3)}</p>
                                                    <p><TooltipLabel darkMode={darkMode} label="Partial R^2" tooltipKey="partialRSquared" />: {formatStat(coefficient.partialRSquared, 3)}</p>
                                                    <p><TooltipLabel darkMode={darkMode} label="Standard error" tooltipKey="standardError" />: {formatStat(coefficient.standardError, 3)}</p>
                                                </div>
                                            </details>
                                        </div>
                                    );
                                })}
                            </div>
                        </Card>
                    )}

                    {lessonShowCoefficientTable && lessonStats?.ok && (
                        <Card darkMode={darkMode}>
                            <div className="flex items-center gap-3 mb-4">
                                <Calculator size={18} className={darkMode ? 'text-indigo-300' : 'text-indigo-700'} />
                                <h3 className={`text-lg font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                    Live coefficient table
                                </h3>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[880px] text-sm">
                                    <thead>
                                        <tr className={darkMode ? 'text-slate-500' : 'text-slate-500'}>
                                            <th className="text-left pb-3 font-black uppercase tracking-widest text-[10px]">Term</th>
                                            <th className="text-left pb-3 font-black uppercase tracking-widest text-[10px]">Estimate</th>
                                            <th className="text-left pb-3 font-black uppercase tracking-widest text-[10px]"><TooltipLabel darkMode={darkMode} label="SE" tooltipKey="standardError" /></th>
                                            <th className="text-left pb-3 font-black uppercase tracking-widest text-[10px]"><TooltipLabel darkMode={darkMode} label="t" tooltipKey="tStatistic" /></th>
                                            <th className="text-left pb-3 font-black uppercase tracking-widest text-[10px]"><TooltipLabel darkMode={darkMode} label="p" tooltipKey="pValue" /></th>
                                            <th className="text-left pb-3 font-black uppercase tracking-widest text-[10px]"><TooltipLabel darkMode={darkMode} label="Standardized beta" tooltipKey="standardizedBeta" /></th>
                                            <th className="text-left pb-3 font-black uppercase tracking-widest text-[10px]"><TooltipLabel darkMode={darkMode} label="VIF" tooltipKey="vif" /></th>
                                            <th className="text-left pb-3 font-black uppercase tracking-widest text-[10px]">95% CI</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {lessonStats.coefficients.map((coefficient) => {
                                            const baselineCoefficient = lessonBaselineStats?.coefficients?.find((item) => item.id === coefficient.id);
                                            const rowChanged = lessonOutlierOn && baselineCoefficient && (
                                                Math.abs((coefficient.estimate || 0) - (baselineCoefficient.estimate || 0)) > 0.0001
                                                || Math.abs((coefficient.standardError || 0) - (baselineCoefficient.standardError || 0)) > 0.0001
                                            );

                                            return (
                                                <tr key={coefficient.id} className={`border-t ${darkMode ? 'border-slate-800 text-slate-200' : 'border-slate-200 text-slate-700'} ${rowChanged ? (darkMode ? 'bg-amber-500/5' : 'bg-amber-50/50') : ''}`}>
                                                    <td className="py-3 font-bold">
                                                        {coefficient.id === 'intercept'
                                                            ? 'Intercept'
                                                            : `Slope for ${lessonPredictorLabels[coefficient.id]} (${getSlopeSymbol(coefficient.id)})`}
                                                    </td>
                                                    <td className="py-3">
                                                        <div>{formatStat(coefficient.estimate, 3)}</div>
                                                        {rowChanged && (
                                                            <div className={`text-[10px] font-bold ${darkMode ? 'text-amber-300' : 'text-amber-700'}`}>
                                                                Delta {formatSignedDifference((coefficient.estimate || 0) - (baselineCoefficient?.estimate || 0), 3)}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="py-3">
                                                        <div>{formatStat(coefficient.standardError, 3)}</div>
                                                        {rowChanged && (
                                                            <div className={`text-[10px] font-bold ${darkMode ? 'text-amber-300' : 'text-amber-700'}`}>
                                                                Delta {formatSignedDifference((coefficient.standardError || 0) - (baselineCoefficient?.standardError || 0), 3)}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="py-3">{formatStat(coefficient.tStatistic, 3)}</td>
                                                    <td className="py-3">p {formatPValue(coefficient.pValue)}</td>
                                                    <td className="py-3">{coefficient.standardizedBeta == null ? '--' : formatStat(coefficient.standardizedBeta, 3)}</td>
                                                    <td className="py-3">{coefficient.vif == null ? '--' : formatStat(coefficient.vif, 2)}</td>
                                                    <td className="py-3">[{formatStat(coefficient.confidenceInterval?.lower, 3)}, {formatStat(coefficient.confidenceInterval?.upper, 3)}]</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    )}
                </div>

                <div className="lg:col-span-4 space-y-6">
                    <Card darkMode={darkMode} className="lg:sticky lg:top-24 xl:top-28">
                        <div className="flex items-center gap-3 mb-4">
                            <SlidersHorizontal size={18} className={darkMode ? 'text-indigo-300' : 'text-indigo-700'} />
                            <h3 className={`text-lg font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                Tutor controls
                            </h3>
                        </div>

                        <div>
                            <div className={`text-[11px] font-black uppercase tracking-widest mb-3 ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                                Example presets
                            </div>
                            <div className="grid gap-2">
                                {LESSON_CONTEXTS.map((context) => (
                                    <button
                                        key={context.id}
                                        onClick={() => setLessonContextId(context.id)}
                                        className={`rounded-xl border px-4 py-3 text-left transition-colors ${lessonContextId === context.id ? 'border-indigo-500 bg-indigo-500/10' : (darkMode ? 'bg-slate-950 border-slate-800 hover:border-slate-700' : 'bg-slate-50 border-slate-200 hover:border-slate-300')}`}
                                    >
                                        <div className={`font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>{context.buttonLabel}</div>
                                        <div className={`text-sm mt-1 ${darkMode ? 'text-slate-500' : 'text-slate-600'}`}>{context.description}</div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="mt-6">
                            <div className={`text-[11px] font-black uppercase tracking-widest mb-3 ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                                Quick scenarios
                            </div>
                            <div className="grid gap-2">
                                {TUTOR_SCENARIOS.map((scenario) => (
                                    <button
                                        key={scenario.id}
                                        onClick={() => applyScenario(scenario.id)}
                                        className={`rounded-xl border px-4 py-3 text-left transition-colors ${lessonScenario === scenario.id ? 'border-indigo-500 bg-indigo-500/10' : (darkMode ? 'bg-slate-950 border-slate-800 hover:border-slate-700' : 'bg-slate-50 border-slate-200 hover:border-slate-300')}`}
                                    >
                                        <div className={`font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>{scenario.label}</div>
                                        <div className={`text-sm mt-1 ${darkMode ? 'text-slate-500' : 'text-slate-600'}`}>{scenario.description}</div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="mt-6 space-y-5">
                            <label className="block">
                                <span className={`text-[11px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                                    Strength of {getPredictorSymbol(INTERNAL_PREDICTOR_IDS[0])}
                                </span>
                                <input type="range" min={-1.5} max={1.5} step={0.05} value={lessonBeta1} onChange={(event) => setLessonBeta1(Number(event.target.value))} className="mt-3 w-full" />
                                <div className={`mt-2 text-sm font-bold ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>{formatStat(lessonBeta1, 2)}</div>
                            </label>

                            <label className="block">
                                <span className={`text-[11px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                                    Strength of {getPredictorSymbol(INTERNAL_PREDICTOR_IDS[1])}
                                </span>
                                <input type="range" min={-1.5} max={1.5} step={0.05} value={lessonBeta2} onChange={(event) => setLessonBeta2(Number(event.target.value))} className="mt-3 w-full" />
                                <div className={`mt-2 text-sm font-bold ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>{formatStat(lessonBeta2, 2)}</div>
                            </label>

                            <label className="block">
                                <span className={`text-[11px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                                    Correlation Between Predictors
                                </span>
                                <input type="range" min={-0.9} max={0.9} step={0.01} value={lessonPredictorCorrelation} onChange={(event) => setLessonPredictorCorrelation(Number(event.target.value))} className="mt-3 w-full" />
                                <div className={`mt-2 text-sm font-bold ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>{formatStat(lessonPredictorCorrelation, 2)}</div>
                            </label>

                            <label className="block">
                                <span className={`text-[11px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                                    Noise Level
                                </span>
                                <input type="range" min={0.4} max={2.3} step={0.05} value={lessonNoise} onChange={(event) => setLessonNoise(Number(event.target.value))} className="mt-3 w-full" />
                                <div className={`mt-2 text-sm font-bold ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>{formatStat(lessonNoise, 2)}</div>
                            </label>

                            <label className="block">
                                <span className={`text-[11px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                                    Sample Size
                                </span>
                                <input type="range" min={30} max={180} step={1} value={lessonSampleSize} onChange={(event) => setLessonSampleSize(Number(event.target.value))} className="mt-3 w-full" />
                                <div className={`mt-2 text-sm font-bold ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>{lessonSampleSize}</div>
                            </label>
                        </div>

                        {!lessonPredictionPlaygroundVisible && (
                            <div className={`mt-6 rounded-2xl border p-3.5 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <div className={`text-[11px] font-black uppercase tracking-widest mb-1.5 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
                                            Graph-side prediction controls
                                        </div>
                                        <p className={`text-xs ${darkMode ? 'text-slate-500' : 'text-slate-600'}`}>
                                            Mirrors the custom predictor profile.
                                        </p>
                                    </div>
                                    <div className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-widest ${darkMode ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-600'}`}>
                                        Live
                                    </div>
                                </div>

                                <div className="mt-3 space-y-3">
                                    {lessonStats?.predictorSummaries?.map((summary) => (
                                        <label key={`sidebar-${summary.label}`} className="block">
                                            <span className={`text-[11px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                                                {lessonPredictorLabels[summary.label]}
                                            </span>
                                            <input
                                                type="range"
                                                min={summary.min}
                                                max={summary.max}
                                                step={0.05}
                                                value={lessonPredictionInputs?.[summary.label] ?? summary.mean}
                                                onChange={(event) => setLessonPredictionInputs((previous) => ({
                                                    ...previous,
                                                    [summary.label]: Number(event.target.value),
                                                }))}
                                                className="mt-2.5 w-full"
                                            />
                                            <div className={`mt-1.5 flex items-center justify-between gap-3 text-xs ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                                                <span className="font-black">{formatStat(lessonPredictionInputs?.[summary.label] ?? summary.mean, 2)}</span>
                                                <span className={darkMode ? 'text-slate-500' : 'text-slate-500'}>
                                                    {formatStat(summary.min, 1)} to {formatStat(summary.max, 1)}
                                                </span>
                                            </div>
                                        </label>
                                    ))}
                                </div>

                                <div className="mt-3 flex items-center justify-between gap-3">
                                    <div className={`rounded-xl border px-4 py-3 ${darkMode ? 'bg-indigo-500/10 border-indigo-500/20' : 'bg-indigo-50 border-indigo-200'}`}>
                                        <div className={`text-[10px] font-black uppercase tracking-widest mb-1.5 ${darkMode ? 'text-indigo-300' : 'text-indigo-700'}`}>
                                            Predicted {lessonContext.outcomeLabel}
                                        </div>
                                        <p className={`text-xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>{formatStat(lessonPrediction?.fitted, 3)}</p>
                                    </div>
                                    <div className={`text-right text-xs ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                        <div className={`text-[10px] font-black uppercase tracking-widest mb-1 ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                                            Current view
                                        </div>
                                        <p className="font-bold">
                                            {lessonMainViews.find((view) => view.id === lessonMainView)?.label || 'Observed vs Fitted'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="mt-6 space-y-3">
                            <label className={`flex items-center justify-between rounded-xl border px-4 py-3 ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                                <span className="font-bold text-sm">Add influential outlier</span>
                                <input type="checkbox" checked={lessonOutlierOn} onChange={(event) => setLessonOutlierOn(event.target.checked)} />
                            </label>
                            <label className={`flex items-center justify-between rounded-xl border px-4 py-3 ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                                <span className="font-bold text-sm">Show coefficient table</span>
                                <input type="checkbox" checked={lessonShowCoefficientTable} onChange={(event) => setLessonShowCoefficientTable(event.target.checked)} />
                            </label>
                            <label className={`flex items-center justify-between rounded-xl border px-4 py-3 ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                                <span className="font-bold text-sm">Show partial summaries</span>
                                <input type="checkbox" checked={lessonShowPartialEffects} onChange={(event) => setLessonShowPartialEffects(event.target.checked)} />
                            </label>
                            <label className={`flex items-center justify-between rounded-xl border px-4 py-3 ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                                <span className="font-bold text-sm">Show residual plot</span>
                                <input
                                    type="checkbox"
                                    checked={lessonShowResiduals}
                                    onChange={(event) => {
                                        setLessonShowResiduals(event.target.checked);
                                        if (event.target.checked) {
                                            setLessonMainView('residual');
                                        }
                                    }}
                                />
                            </label>
                        </div>

                        <button
                            onClick={() => setLessonGenerationKey((previous) => previous + 1)}
                            className={`mt-6 w-full inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-black uppercase tracking-widest ${darkMode ? 'bg-indigo-600 hover:bg-indigo-500 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}
                        >
                            <RefreshCw size={16} />
                            Regenerate Sample
                        </button>

                        <p className={`mt-4 text-xs font-bold uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                            Strength, overlap, noise, sample size, and the outlier toggle now modify the same active sample. Use regenerate when you want a fresh draw.
                        </p>
                    </Card>

                    <Card darkMode={darkMode}>
                        <div className="flex items-center gap-3 mb-4">
                            <Info size={18} className={darkMode ? 'text-sky-300' : 'text-sky-700'} />
                            <h3 className={`text-lg font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                What this tutor is teaching
                            </h3>
                        </div>

                        <div className="space-y-3">
                            <div className={`rounded-xl border p-4 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                                <div className={`text-[10px] font-black uppercase tracking-widest mb-2 ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>Coefficients are conditional</div>
                                <p className={`text-sm ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                                    Each slope shows the change in predicted {lessonContext.outcomeLabel} for one predictor while the other predictor stays fixed.
                                </p>
                            </div>
                            <div className={`rounded-xl border p-4 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                                <div className={`text-[10px] font-black uppercase tracking-widest mb-2 ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>Predictors can overlap</div>
                                <p className={`text-sm ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                                    The current predictor overlap is |r| = {formatStat(lessonOverlapCorrelation, 2)}. Predictors can share variance and still both matter, but heavy overlap makes the individual slopes less stable.
                                </p>
                            </div>
                            <div className={`rounded-xl border p-4 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                                <div className={`text-[10px] font-black uppercase tracking-widest mb-2 ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>Fit, prediction, and interpretation differ</div>
                                <p className={`text-sm ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                                    High R^2 means the whole model predicts well overall. It does not guarantee that each coefficient is stable, precise, or easy to explain.
                                </p>
                            </div>
                            <div className={`rounded-xl border p-4 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                                <div className={`text-[10px] font-black uppercase tracking-widest mb-2 ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>Additive effects only</div>
                                <p className={`text-sm ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                                    This page models additive effects only. If the effect of one predictor depends on the level of the other predictor, the model needs an interaction term.
                                </p>
                            </div>
                        </div>
                    </Card>

                    <Card darkMode={darkMode}>
                        <div className="flex items-center gap-3 mb-4">
                            <CheckCircle size={18} className={darkMode ? 'text-emerald-300' : 'text-emerald-700'} />
                            <h3 className={`text-lg font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                Assumptions and diagnostics
                            </h3>
                        </div>
                        <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                            Use these checks as practical questions, not a rigid checklist. Expand any item for what it means, how to check it, what happens if it fails, and what students should do next.
                        </p>

                        <div className="mt-5 space-y-3">
                            {lessonDiagnostics.map((item) => {
                                const toneClass = item.status.includes('Watch') || item.status.includes('High') || item.status.includes('detected') || item.status.includes('changes') || item.status.includes('skewed')
                                    ? (darkMode ? 'text-amber-200 bg-amber-500/10 border-amber-500/20' : 'text-amber-700 bg-amber-50 border-amber-200')
                                    : item.status.includes('Needs')
                                        ? (darkMode ? 'text-slate-300 bg-slate-950 border-slate-800' : 'text-slate-600 bg-slate-50 border-slate-200')
                                        : (darkMode ? 'text-emerald-200 bg-emerald-500/10 border-emerald-500/20' : 'text-emerald-700 bg-emerald-50 border-emerald-200');

                                return (
                                    <details key={item.id} className={`rounded-2xl border ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                                        <summary className="cursor-pointer list-none px-5 py-4">
                                            <div className="flex items-center justify-between gap-4">
                                                <div>
                                                    <div className={`font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>{item.label}</div>
                                                    <div className={`mt-1 text-sm ${darkMode ? 'text-slate-500' : 'text-slate-600'}`}>{item.what}</div>
                                                </div>
                                                <div className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-widest ${toneClass}`}>
                                                    {item.status}
                                                </div>
                                            </div>
                                        </summary>
                                        <div className={`px-5 pb-5 text-sm space-y-4 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                                            <div>
                                                <div className={`text-[10px] font-black uppercase tracking-widest mb-1 ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>How to check it</div>
                                                <p>{item.check}</p>
                                            </div>
                                            <div>
                                                <div className={`text-[10px] font-black uppercase tracking-widest mb-1 ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>What happens if it fails</div>
                                                <p>{item.ifFails}</p>
                                            </div>
                                            <div>
                                                <div className={`text-[10px] font-black uppercase tracking-widest mb-1 ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>What students should do</div>
                                                <p>{item.doNext}</p>
                                            </div>
                                        </div>
                                    </details>
                                );
                            })}
                        </div>
                    </Card>
                </div>
            </div>

            {lessonShouldFloatVisual && (
                <div className="fixed z-40 bottom-4 right-4 left-4 sm:left-auto sm:w-[26rem] xl:w-[30rem] pointer-events-none">
                    <div className={`pointer-events-auto rounded-3xl border shadow-2xl ${darkMode ? 'bg-slate-950/95 border-slate-800 backdrop-blur-xl' : 'bg-white/95 border-slate-200 backdrop-blur-xl'}`}>
                        <div className={`flex items-center justify-between gap-3 px-4 py-3 border-b ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                            <div>
                                <div className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
                                    Live graph dock
                                </div>
                                <p className={`text-sm font-bold ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                                    {lessonMainViews.find((view) => view.id === lessonMainView)?.label || 'Observed vs Fitted'}
                                </p>
                            </div>
                            <button
                                onClick={() => setLessonFloatVisualMinimized((previous) => !previous)}
                                className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-[11px] font-black uppercase tracking-widest ${darkMode ? 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white' : 'bg-slate-50 border-slate-200 text-slate-700 hover:text-slate-900'}`}
                            >
                                {lessonFloatVisualMinimized ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                {lessonFloatVisualMinimized ? 'Show' : 'Minimize'}
                            </button>
                        </div>

                        {!lessonFloatVisualMinimized && (
                            <div className="p-3 max-h-[70vh] overflow-auto">
                                <div className={`mb-3 rounded-2xl border px-4 py-3 text-sm ${darkMode ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                                    This dock follows your scroll so lower sliders can still update the graph in view.
                                </div>
                                {renderLessonMainVisual({ compact: true })}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default MultipleRegressionPage;
