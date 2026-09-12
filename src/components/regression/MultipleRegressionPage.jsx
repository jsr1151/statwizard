import { useEffect, useState } from 'react';
import AnalysisAssumptionsSection from '../analysis/AnalysisAssumptionsSection.jsx';
import { rSquaredToFSquared } from '../../stats/regression.js';
import { buildAdjustedRSquared } from '../../utils/multipleRegressionLesson.js';
import MultipleRegressionPowerSection from './MultipleRegressionPowerSection.jsx';
import MultipleRegressionEffectSizeSection from './MultipleRegressionEffectSizeSection.jsx';
import MultipleRegressionCalculatorSection from './MultipleRegressionCalculatorSection.jsx';
import MultipleRegressionLessonSection from './MultipleRegressionLessonSection.jsx';
import useMultipleRegressionLesson from '../../hooks/useMultipleRegressionLesson.js';
import useMultipleRegressionCalculator from '../../hooks/useMultipleRegressionCalculator.js';

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
    const {
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
    } = useMultipleRegressionLesson();

    const {
        calculatorStats, setCalculatorInputMode, calculatorInputMode, onUpload,
        setTableText, tableText, selectedOutcome, setSelectedOutcome,
        numericColumns, selectedPredictors, togglePredictor, selectedDatasetId,
        setSelectedDatasetId, datasets, savedDataset, savedRoleSelection,
        setSavedRoleSelection, confidenceLevel, setConfidenceLevel,
        calculatorNeedsSetup, calculatorModelErrors, activeOutcomeLabel, calculatorSelectedPointId,
        setCalculatorSelectedPointId, calculatorPrediction, calculatorPredictionInputs, setCalculatorPredictionInputs,
        calculatorSelectedPair, calculatorGuidance, tableSource, loadExample, uploadError, uploadPending, sourceLabel, rowSummary,
    } = useMultipleRegressionCalculator({ onStatsChange });

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

    if (section === 'power') {
        return (
            <MultipleRegressionPowerSection {...{
                darkMode, testConfig, currentStats, initialPowerMode,
            }} />
        );
    }

    if (section === 'assumptions') {
        return (
            <AnalysisAssumptionsSection
                darkMode={darkMode}
                title="Multiple regression assumptions"
                description="Review the assumptions before trusting the observed coefficients, confidence intervals, and model-fit summaries. Use this page as a practical checklist rather than a rigid pass/fail gate."
                assumptions={assumptions}
            />
        );
    }

    if (section === 'effect_size') {
        return (
            <MultipleRegressionEffectSizeSection {...{
                effectSourceStats, darkMode, effectRSquared, setEffectRSquared,
                effectSampleSize, setEffectSampleSize, effectPredictorCount, setEffectPredictorCount,
                effectAdjustedRSquared, effectFSquared,
            }} />
        );
    }

    if (section === 'calculator') {
        return (
            <MultipleRegressionCalculatorSection {...{
                darkMode, setCalculatorInputMode, calculatorInputMode, onUpload,
                setTableText, tableText, selectedOutcome, setSelectedOutcome,
                numericColumns, selectedPredictors, togglePredictor, selectedDatasetId,
                setSelectedDatasetId, datasets, savedDataset, onOpenDataManager,
                savedRoleSelection, setSavedRoleSelection, confidenceLevel, setConfidenceLevel,
                calculatorNeedsSetup, calculatorModelErrors, calculatorStats,
                activeOutcomeLabel, calculatorSelectedPointId, setCalculatorSelectedPointId, calculatorPrediction,
                calculatorPredictionInputs, setCalculatorPredictionInputs, calculatorSelectedPair, calculatorGuidance, tableSource, loadExample, uploadError, uploadPending, sourceLabel, rowSummary,
            }} />
        );
    }

    return (
        <MultipleRegressionLessonSection {...{
            darkMode, lessonContext, lessonMainVisualRef, lessonMainViews,
            lessonMainView, setLessonMainView, lessonEquationText, lessonSymbolicEquation,
            lessonPredictorLabels, lessonStats, lessonPredictionInputs, setLessonPredictionInputs,
            lessonPrediction, lessonSelectedPointId, setLessonSelectedPointId, lessonShowResiduals,
            lessonOverlapCorrelation, lessonOutlierComparison, lessonBaselineStats, lessonPredictionPlaygroundRef,
            lessonSubstitutedEquation, lessonSelectedIsInfluential, lessonSelectedPair, lessonShowPartialEffects,
            lessonShowCoefficientTable, lessonOutlierOn, setLessonContextId, lessonContextId,
            applyScenario, lessonScenario, lessonBeta1, setLessonBeta1,
            lessonBeta2, setLessonBeta2, lessonPredictorCorrelation, setLessonPredictorCorrelation,
            lessonNoise, setLessonNoise, lessonSampleSize, setLessonSampleSize,
            lessonPredictionPlaygroundVisible, setLessonOutlierOn, setLessonShowCoefficientTable, setLessonShowPartialEffects,
            setLessonShowResiduals, setLessonGenerationKey, lessonDiagnostics, lessonShouldFloatVisual,
            setLessonFloatVisualMinimized, lessonFloatVisualMinimized,
        }} />
    );
};

export default MultipleRegressionPage;
