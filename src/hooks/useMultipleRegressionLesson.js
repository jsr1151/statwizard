import {
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import {
    buildMultipleRegressionTutorBaseDataset,
    calculateMultipleRegressionPrediction,
    calculateMultipleRegressionStats,
    deriveMultipleRegressionTutorDataset,
} from '../stats/multipleRegression.js';
import { TUTOR_SCENARIOS, INTERNAL_PREDICTOR_IDS } from '../data/multipleRegressionLesson.js';
import {
    getLessonContext,
    getContextualPredictorLabel,
    getSlopeSymbol,
    buildLessonEquationText,
    buildLessonSymbolicEquation,
    buildLessonSubstitutedEquation,
    buildLessonDiagnostics,
    buildPredictionInputsFromStats,
    findDefaultPointId,
} from '../utils/multipleRegressionLesson.js';

export default function useMultipleRegressionLesson() {
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

    return {
        lessonContext, lessonMainVisualRef, lessonMainViews, lessonMainView,
        setLessonMainView, lessonEquationText, lessonSymbolicEquation, lessonPredictorLabels,
        lessonStats, lessonPredictionInputs, setLessonPredictionInputs, lessonPrediction,
        lessonSelectedPointId, setLessonSelectedPointId, lessonShowResiduals, lessonOverlapCorrelation,
        lessonOutlierComparison, lessonBaselineStats, lessonPredictionPlaygroundRef, lessonSubstitutedEquation,
        lessonSelectedIsInfluential, lessonSelectedPair, lessonShowPartialEffects, lessonShowCoefficientTable,
        lessonOutlierOn, setLessonContextId, lessonContextId, applyScenario,
        lessonScenario, lessonBeta1, setLessonBeta1, lessonBeta2,
        setLessonBeta2, lessonPredictorCorrelation, setLessonPredictorCorrelation, lessonNoise,
        setLessonNoise, lessonSampleSize, setLessonSampleSize, lessonPredictionPlaygroundVisible,
        setLessonOutlierOn, setLessonShowCoefficientTable, setLessonShowPartialEffects, setLessonShowResiduals,
        setLessonGenerationKey, lessonDiagnostics, lessonShouldFloatVisual, setLessonFloatVisualMinimized,
        lessonFloatVisualMinimized,
    };
}
