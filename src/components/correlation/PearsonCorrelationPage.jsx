import usePearsonCalculator from '../../hooks/usePearsonCalculator.js';
import { useEffect, useMemo, useState } from "react";
import AnalysisAssumptionsSection from "../analysis/AnalysisAssumptionsSection.jsx";
import { buildPearsonTutorBaseDataset, calculatePearsonCorrelationStats, derivePearsonTutorDataset } from "../../stats/correlation.js";
import { PEARSON_TUTOR_PRESETS as TUTOR_PRESETS } from '../../data/pearsonCorrelationPresets.js';
import { PEARSON_SAMPLE_DATASET as SAMPLE_DATASET } from '../../data/pearsonCorrelationPresets.js';
import PearsonPowerSection from './PearsonPowerSection.jsx';
import PearsonEffectSizeSection from './PearsonEffectSizeSection.jsx';
import PearsonCalculatorSection from './PearsonCalculatorSection.jsx';
import PearsonLessonSection from './PearsonLessonSection.jsx';

const buildLessonBaseRequest = ({
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

const PearsonCorrelationPage = ({
    section,
    darkMode,
    currentStats,
    onStatsChange,
    assumptions = [],
    testConfig,
    initialPowerMode,
    onOpenDataManager,
}) => {
    const [lessonPreset, setLessonPreset] = useState('strong_positive');
    const [lessonSampleSize, setLessonSampleSize] = useState(36);
    const [lessonNoise, setLessonNoise] = useState(0.28);
    const [lessonShowLine, setLessonShowLine] = useState(true);
    const [lessonShowBand, setLessonShowBand] = useState(false);
    const [lessonOutlierOn, setLessonOutlierOn] = useState(false);
    const [lessonBaseRequest, setLessonBaseRequest] = useState(() => buildLessonBaseRequest({
        preset: 'strong_positive',
        sampleSize: 36,
        noise: 0.28,
    }));

    const lessonBaseDataset = useMemo(() => buildPearsonTutorBaseDataset({
        preset: lessonBaseRequest.preset,
        targetSampleSize: lessonBaseRequest.sampleSize,
        targetNoise: lessonBaseRequest.noise,
        generationKey: lessonBaseRequest.generationKey,
    }), [lessonBaseRequest]);

    const lessonDataset = useMemo(() => derivePearsonTutorDataset({
        baseDataset: lessonBaseDataset,
        sampleSize: lessonSampleSize,
        noise: lessonNoise,
        includeOutlier: lessonOutlierOn,
    }), [lessonBaseDataset, lessonSampleSize, lessonNoise, lessonOutlierOn]);
    const lessonPairs = useMemo(() => lessonDataset.pairs || [], [lessonDataset]);

    const lessonStats = useMemo(() => calculatePearsonCorrelationStats({
        xValues: lessonPairs.map((pair) => pair.x),
        yValues: lessonPairs.map((pair) => pair.y),
    }), [lessonPairs]);

    const lessonContextStats = useMemo(() => {
        const contextPairs = lessonDataset.contextStatsPairs?.length
            ? lessonDataset.contextStatsPairs
            : lessonDataset.contextPairs;

        if (!contextPairs?.length) {
            return null;
        }

        return calculatePearsonCorrelationStats({
            xValues: contextPairs.map((pair) => pair.x),
            yValues: contextPairs.map((pair) => pair.y),
        });
    }, [lessonDataset.contextPairs, lessonDataset.contextStatsPairs]);

    const lessonSubtitle = useMemo(() => {
        const baseDescription = TUTOR_PRESETS.find((preset) => preset[0] === lessonPreset)?.[2]
            || 'Use the controls to explore how Pearson correlation behaves.';

        if (!lessonOutlierOn) {
            return baseDescription;
        }

        return `${baseDescription} The added outlier lets you compare the same base pattern before and after one influential point.`;
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


    const calculator = usePearsonCalculator(SAMPLE_DATASET, onStatsChange);
    const { calculatorStats } = calculator;

    const effectSourceStats = currentStats?.ok ? currentStats : (calculatorStats?.ok ? calculatorStats : null);
    const [effectRValue, setEffectRValue] = useState(0.35);

    useEffect(() => {
        if (Number.isFinite(effectSourceStats?.r)) {
            setEffectRValue(effectSourceStats.r);
        }
    }, [effectSourceStats?.r]);

    const effectRSquared = Math.max(0, Math.min(1, effectRValue ** 2));



    if (section === 'power') {
        return <PearsonPowerSection {...{
            darkMode, testConfig, currentStats, initialPowerMode,
        }} />;
    }

    if (section === 'assumptions') {
        return (
            <AnalysisAssumptionsSection
                darkMode={darkMode}
                title="Pearson correlation assumptions"
                description="Review the assumptions before trusting the observed correlation coefficient and its inference. Use this page as a practical checklist rather than a rigid pass/fail gate."
                assumptions={assumptions}
            />
        );
    }

    if (section === 'effect_size') {
        return <PearsonEffectSizeSection {...{
            effectSourceStats, darkMode, effectRValue, setEffectRValue,
            effectRSquared,
        }} />;
    }

    if (section === 'calculator') {
        return <PearsonCalculatorSection {...calculator} {...{ darkMode, assumptions, onOpenDataManager }} />;
    }

    return <PearsonLessonSection {...{
        darkMode, lessonPairs, lessonDataset, lessonStats,
        lessonShowLine, lessonShowBand, lessonSubtitle, lessonPreset,
        lessonContextStats, selectLessonPreset, lessonSampleSize, setLessonSampleSize,
        lessonNoise, setLessonNoise, setLessonShowLine, setLessonShowBand,
        setLessonOutlierOn, lessonOutlierOn, regenerateLessonSample,
    }} />;
};

export default PearsonCorrelationPage;
