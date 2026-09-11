import { useEffect, useMemo, useState } from "react";
import AnalysisAssumptionsSection from "../analysis/AnalysisAssumptionsSection.jsx";
import {
    buildRegressionGuidance, buildRegressionTutorBaseDataset, calculateRegressionPrediction,
    calculateSimpleLinearRegressionStats, deriveRegressionTutorDataset, rSquaredToFSquared,
} from "../../stats/regression.js";
import { parseDelimitedTable } from "../../utils/delimitedTable.js";
import {
    REGRESSION_TUTOR_PRESETS as TUTOR_PRESETS,
    REGRESSION_SAMPLE_DATASET as SAMPLE_DATASET,
} from '../../data/regressionPresets.js';
import {
    buildLessonBaseRequest, clampToRange, resolvePredictionStep, findDefaultPointId,
} from '../../utils/simpleRegressionPage.js';
import RegressionPowerSection from './RegressionPowerSection.jsx';
import RegressionEffectSizeSection from './RegressionEffectSizeSection.jsx';
import RegressionCalculatorSection from './RegressionCalculatorSection.jsx';
import RegressionLessonSection from './RegressionLessonSection.jsx';

const SimpleLinearRegressionPage = ({
    section,
    darkMode,
    currentStats,
    onStatsChange,
    assumptions = [],
    testConfig,
    initialPowerMode,
}) => {
    const [lessonPreset, setLessonPreset] = useState('positive_low_noise');
    const [lessonSampleSize, setLessonSampleSize] = useState(36);
    const [lessonNoise, setLessonNoise] = useState(0.28);
    const [lessonShowLine, setLessonShowLine] = useState(true);
    const [lessonShowBand, setLessonShowBand] = useState(false);
    const [lessonShowPredictionBand, setLessonShowPredictionBand] = useState(false);
    const [lessonShowResiduals, setLessonShowResiduals] = useState(false);
    const [lessonOutlierOn, setLessonOutlierOn] = useState(false);
    const [lessonPredictionX, setLessonPredictionX] = useState(5);
    const [lessonSelectedPointId, setLessonSelectedPointId] = useState(null);
    const [lessonBaseRequest, setLessonBaseRequest] = useState(() => buildLessonBaseRequest({
        preset: 'positive_low_noise',
        sampleSize: 36,
        noise: 0.28,
    }));

    const lessonBaseDataset = useMemo(() => buildRegressionTutorBaseDataset({
        preset: lessonBaseRequest.preset,
        targetSampleSize: lessonBaseRequest.sampleSize,
        targetNoise: lessonBaseRequest.noise,
        generationKey: lessonBaseRequest.generationKey,
    }), [lessonBaseRequest]);

    const lessonDataset = useMemo(() => deriveRegressionTutorDataset({
        baseDataset: lessonBaseDataset,
        sampleSize: lessonSampleSize,
        noise: lessonNoise,
        includeOutlier: lessonOutlierOn,
    }), [lessonBaseDataset, lessonSampleSize, lessonNoise, lessonOutlierOn]);

    const lessonStats = useMemo(() => calculateSimpleLinearRegressionStats({
        xValues: (lessonDataset.pairs || []).map((pair) => pair.x),
        yValues: (lessonDataset.pairs || []).map((pair) => pair.y),
        confidenceLevel: 0.95,
    }), [lessonDataset]);

    const lessonPredictionStep = useMemo(
        () => resolvePredictionStep(lessonStats?.xSummary),
        [lessonStats?.xSummary]
    );

    const lessonPrediction = useMemo(() => calculateRegressionPrediction({
        stats: lessonStats,
        xValue: lessonPredictionX,
        confidenceLevel: 0.95,
    }), [lessonStats, lessonPredictionX]);

    const lessonSelectedPair = useMemo(
        () => lessonStats?.pairs?.find((pair) => pair.id === lessonSelectedPointId || pair.index === lessonSelectedPointId) || null,
        [lessonStats, lessonSelectedPointId]
    );

    useEffect(() => {
        if (!lessonStats?.ok) {
            setLessonSelectedPointId(null);
            return;
        }

        setLessonPredictionX((previous) => clampToRange(
            Number.isFinite(Number(previous)) ? Number(previous) : lessonStats.meanX,
            lessonStats.xSummary.min,
            lessonStats.xSummary.max
        ));
        setLessonSelectedPointId((previous) => {
            const hasPrevious = lessonStats.pairs.some((pair) => pair.id === previous || pair.index === previous);

            if (lessonOutlierOn) {
                const outlier = lessonStats.pairs.find((pair) => pair.isSyntheticOutlier);

                if (outlier) {
                    return outlier.id;
                }
            }

            return hasPrevious ? previous : findDefaultPointId(lessonStats);
        });
    }, [lessonStats, lessonOutlierOn]);

    const lessonSubtitle = useMemo(() => {
        const baseDescription = TUTOR_PRESETS.find((preset) => preset[0] === lessonPreset)?.[2]
            || 'Use the controls to see what the fitted line responds to and what it can miss.';

        if (!lessonOutlierOn) {
            return baseDescription;
        }

        return `${baseDescription} The outlier toggle adds one influential case to the same underlying sample.`;
    }, [lessonPreset, lessonOutlierOn]);

    const regenerateLessonSample = () => {
        setLessonBaseRequest((previous) => buildLessonBaseRequest({
            preset: lessonPreset,
            sampleSize: lessonSampleSize,
            noise: lessonNoise,
            generationKey: previous.generationKey + 1,
        }));
    };

    const selectLessonPreset = (nextPreset) => {
        if (nextPreset === lessonPreset) {
            return;
        }

        setLessonPreset(nextPreset);
        setLessonBaseRequest((previous) => buildLessonBaseRequest({
            preset: nextPreset,
            sampleSize: lessonSampleSize,
            noise: lessonNoise,
            generationKey: previous.generationKey + 1,
        }));
    };

    const [tableText, setTableText] = useState(SAMPLE_DATASET);
    const [selectedX, setSelectedX] = useState('');
    const [selectedY, setSelectedY] = useState('');
    const [confidenceLevel, setConfidenceLevel] = useState(0.95);
    const [calculatorShowLine, setCalculatorShowLine] = useState(true);
    const [calculatorShowBand, setCalculatorShowBand] = useState(false);
    const [calculatorShowPredictionBand, setCalculatorShowPredictionBand] = useState(false);
    const [calculatorPredictionX, setCalculatorPredictionX] = useState('');
    const [calculatorSelectedPointId, setCalculatorSelectedPointId] = useState(null);

    const parsedTable = useMemo(() => parseDelimitedTable(tableText), [tableText]);
    const numericColumns = useMemo(() => parsedTable.numericColumns || [], [parsedTable]);

    useEffect(() => {
        if (!numericColumns.length) {
            setSelectedX('');
            setSelectedY('');
            return;
        }

        if (!numericColumns.some((column) => column.name === selectedX)) {
            setSelectedX(numericColumns[0]?.name || '');
        }

        if (!numericColumns.some((column) => column.name === selectedY)) {
            setSelectedY(numericColumns[1]?.name || numericColumns[0]?.name || '');
        }
    }, [numericColumns, selectedX, selectedY]);

    const selectedXColumn = numericColumns.find((column) => column.name === selectedX) || null;
    const selectedYColumn = numericColumns.find((column) => column.name === selectedY) || null;

    const calculatorStats = useMemo(() => {
        if (!selectedXColumn || !selectedYColumn || selectedXColumn.name === selectedYColumn.name) {
            return null;
        }

        return calculateSimpleLinearRegressionStats({
            xValues: selectedXColumn.numericValues,
            yValues: selectedYColumn.numericValues,
            confidenceLevel,
            alpha: 1 - confidenceLevel,
        });
    }, [selectedXColumn, selectedYColumn, confidenceLevel]);

    useEffect(() => {
        if (calculatorStats?.ok && typeof onStatsChange === 'function') {
            onStatsChange(calculatorStats);
        }
    }, [calculatorStats, onStatsChange]);

    const calculatorGuidance = useMemo(
        () => buildRegressionGuidance(calculatorStats),
        [calculatorStats]
    );

    const influentialIndex = calculatorStats?.influence?.maxCooksDistance > 0.5 || calculatorStats?.influence?.maxDeltaSlope > 0.35
        ? calculatorStats.influence.influentialIndex
        : null;
    const calculatorPrediction = useMemo(() => calculateRegressionPrediction({
        stats: calculatorStats,
        xValue: calculatorPredictionX,
        confidenceLevel,
    }), [calculatorStats, calculatorPredictionX, confidenceLevel]);
    const calculatorSelectedPair = useMemo(
        () => calculatorStats?.pairs?.find((pair) => pair.id === calculatorSelectedPointId || pair.index === calculatorSelectedPointId) || null,
        [calculatorStats, calculatorSelectedPointId]
    );

    useEffect(() => {
        if (!calculatorStats?.ok) {
            setCalculatorSelectedPointId(null);
            return;
        }

        setCalculatorPredictionX((previous) => {
            if (previous === '' || previous == null) {
                return calculatorStats.meanX;
            }

            const numeric = Number(previous);
            return Number.isFinite(numeric) ? numeric : calculatorStats.meanX;
        });
        setCalculatorSelectedPointId((previous) => {
            const hasPrevious = calculatorStats.pairs.some((pair) => pair.id === previous || pair.index === previous);
            return hasPrevious ? previous : findDefaultPointId(calculatorStats);
        });
    }, [calculatorStats]);

    const effectSourceStats = currentStats?.ok ? currentStats : (calculatorStats?.ok ? calculatorStats : null);
    const [effectRSquared, setEffectRSquared] = useState(0.25);
    const [effectSlope, setEffectSlope] = useState(0.8);
    const [effectUnitChange, setEffectUnitChange] = useState(1);

    useEffect(() => {
        if (Number.isFinite(effectSourceStats?.rSquared)) {
            setEffectRSquared(effectSourceStats.rSquared);
        }
        if (Number.isFinite(effectSourceStats?.slope)) {
            setEffectSlope(effectSourceStats.slope);
        }
    }, [effectSourceStats?.rSquared, effectSourceStats?.slope]);

    const effectFSquared = rSquaredToFSquared(effectRSquared);
    const effectPredictedChange = effectSlope * effectUnitChange;

    const onUpload = async (event) => {
        const file = event.target.files?.[0];
        if (!file) {
            return;
        }
        const text = await file.text();
        setTableText(text);
        event.target.value = '';
    };

    if (section === 'power') {
        return <RegressionPowerSection {...{
            darkMode, testConfig, currentStats, initialPowerMode,
        }} />;
    }

    if (section === 'assumptions') {
        return (
            <AnalysisAssumptionsSection
                darkMode={darkMode}
                title="Simple linear regression assumptions"
                description="Review the assumptions before trusting the observed slope, confidence interval, and model-fit summaries. Use this page as a practical checklist rather than a rigid pass/fail gate."
                assumptions={assumptions}
            />
        );
    }

    if (section === 'effect_size') {
        return <RegressionEffectSizeSection {...{
            effectSourceStats, darkMode, effectRSquared, setEffectRSquared,
            effectSlope, setEffectSlope, effectUnitChange, setEffectUnitChange,
            effectPredictedChange, effectFSquared,
        }} />;
    }

    if (section === 'calculator') {
        return <RegressionCalculatorSection {...{
            darkMode, onUpload, setTableText, tableText,
            parsedTable, selectedX, setSelectedX, numericColumns,
            selectedY, setSelectedY, confidenceLevel, setConfidenceLevel,
            setCalculatorShowLine, calculatorShowLine, setCalculatorShowBand, calculatorShowBand,
            setCalculatorShowPredictionBand, calculatorShowPredictionBand, calculatorGuidance, calculatorStats,
            influentialIndex, calculatorSelectedPointId, setCalculatorSelectedPointId, calculatorPrediction,
            calculatorPredictionX, setCalculatorPredictionX, calculatorSelectedPair,
        }} />;
    }

    return <RegressionLessonSection {...{
            darkMode, lessonStats, lessonShowLine, lessonShowBand,
            lessonShowPredictionBand, lessonShowResiduals, lessonSelectedPointId, setLessonSelectedPointId,
            lessonPrediction, lessonSubtitle, lessonSelectedPair, lessonPreset,
            lessonOutlierOn, selectLessonPreset, lessonSampleSize, setLessonSampleSize,
            lessonNoise, setLessonNoise, lessonPredictionX, lessonPredictionStep,
            setLessonPredictionX, setLessonShowResiduals, setLessonShowLine, setLessonShowBand,
            setLessonShowPredictionBand, setLessonOutlierOn, regenerateLessonSample,
        }} />;
};

export default SimpleLinearRegressionPage;
