import useAnalysisTableInput from '../../hooks/useAnalysisTableInput.js';
import { summarizeAnalysisRows } from '../../utils/analysisRows.js';
import { useEffect, useMemo, useState } from "react";
import AnalysisAssumptionsSection from "../analysis/AnalysisAssumptionsSection.jsx";
import { buildCorrelationGuidance, buildPearsonTutorBaseDataset, calculatePearsonCorrelationStats, derivePearsonTutorDataset } from "../../stats/correlation.js";
import { parseDelimitedTable } from "../../utils/delimitedTable.js";
import { buildNumericAnalysisColumn } from "../../utils/datasetImport.js";
import { useDatasetLibraryContext } from "../../hooks/useDatasetLibrary.js";
import { ACTIVE_DATASET_SESSION_KEY, readAnalysisLaunchPayload, consumeAnalysisLaunchPayload } from "../../utils/analysisLaunch.js";
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
    const { datasets } = useDatasetLibraryContext();
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


    const [launchPayload] = useState(() => readAnalysisLaunchPayload('pearson_correlation'));
    const [calculatorInputMode, setCalculatorInputMode] = useState(launchPayload?.datasetId ? 'saved' : 'paste');
    const { tableText, setTableText, tableSource, loadExample, onUpload, uploadError, uploadPending } = useAnalysisTableInput(SAMPLE_DATASET, calculatorInputMode);
    const [selectedDatasetId, setSelectedDatasetId] = useState(launchPayload?.datasetId || '');
    useEffect(() => {
        if (launchPayload) consumeAnalysisLaunchPayload('pearson_correlation');
    }, [launchPayload]);

    const [savedRoleSelection, setSavedRoleSelection] = useState({
        x: launchPayload?.x || '',
        y: launchPayload?.y || '',
    });
    const [selectedX, setSelectedX] = useState('');
    const [selectedY, setSelectedY] = useState('');
    const [tails, setTails] = useState(2);
    const [direction, setDirection] = useState('greater');
    const [confidenceLevel, setConfidenceLevel] = useState(0.95);
    const [rho0, setRho0] = useState(0);
    const [calculatorShowLine, setCalculatorShowLine] = useState(true);
    const [calculatorShowBand, setCalculatorShowBand] = useState(false);

    const parsedTable = useMemo(() => parseDelimitedTable(tableText), [tableText]);
    const numericColumns = useMemo(() => parsedTable.numericColumns || [], [parsedTable]);
    const savedDataset = useMemo(
        () => datasets.find((dataset) => dataset.id === selectedDatasetId) || null,
        [datasets, selectedDatasetId]
    );
    const savedNumericColumns = useMemo(
        () => (savedDataset?.columns || []).filter((column) => column.summary?.detectedType === 'numeric'),
        [savedDataset]
    );

    useEffect(() => {
        if (launchPayload?.datasetId) {
            setCalculatorInputMode('saved');
        }
    }, [launchPayload]);

    useEffect(() => {
        if (!datasets.length) {
            return;
        }

        let preferredDatasetId = '';

        try {
            preferredDatasetId = window.sessionStorage.getItem(ACTIVE_DATASET_SESSION_KEY) || '';
        } catch (error) {
            preferredDatasetId = '';
        }

        setSelectedDatasetId((previous) => {
            if (previous) {
                return previous;
            }

            if (launchPayload?.datasetId && datasets.some((dataset) => dataset.id === launchPayload.datasetId)) {
                return launchPayload.datasetId;
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
    }, [datasets, launchPayload?.datasetId]);

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

    useEffect(() => {
        if (!savedDataset) return;
        const numericIds = savedDataset.columns.filter(column => column.summary?.detectedType === 'numeric').map(column => column.id);
        const fromLaunch = launchPayload?.datasetId === savedDataset.id;
        setSavedRoleSelection(previous => {
            const x = numericIds.includes(previous.x) ? previous.x : (fromLaunch ? '' : numericIds[0] || '');
            const y = numericIds.includes(previous.y) && previous.y !== x ? previous.y : (fromLaunch ? '' : numericIds.find(id => id !== x) || '');
            return { x, y };
        });
    }, [savedDataset, launchPayload]);

    const selectedXColumn = numericColumns.find((column) => column.name === selectedX) || null;
    const selectedYColumn = numericColumns.find((column) => column.name === selectedY) || null;
    const savedXColumn = useMemo(
        () => buildNumericAnalysisColumn(savedDataset, savedRoleSelection.x),
        [savedDataset, savedRoleSelection.x]
    );
    const savedYColumn = useMemo(
        () => buildNumericAnalysisColumn(savedDataset, savedRoleSelection.y),
        [savedDataset, savedRoleSelection.y]
    );
    const activeXColumn = calculatorInputMode === 'saved' ? savedXColumn : selectedXColumn;
    const activeYColumn = calculatorInputMode === 'saved' ? savedYColumn : selectedYColumn;
    const rowSummary = useMemo(() => summarizeAnalysisRows([activeXColumn, activeYColumn], calculatorInputMode === 'saved' ? savedDataset?.rowCount || 0 : parsedTable.rowCount || 0), [activeXColumn, activeYColumn, calculatorInputMode, savedDataset, parsedTable.rowCount]);
    const activeCompleteCaseSummary = rowSummary || { total: 0, usable: 0, dropped: 0 };
    const sourceLabel = calculatorInputMode === 'saved' ? savedDataset?.name || 'No dataset selected' : tableSource;
    const activeXLabel = activeXColumn?.label || activeXColumn?.name || 'X';
    const activeYLabel = activeYColumn?.label || activeYColumn?.name || 'Y';

    const calculatorStats = useMemo(() => {
        if (!activeXColumn || !activeYColumn || activeXColumn.name === activeYColumn.name) {
            return null;
        }

        return calculatePearsonCorrelationStats({
            xValues: activeXColumn.numericValues,
            yValues: activeYColumn.numericValues,
            alpha: 1 - confidenceLevel,
            tails,
            direction,
            confidenceLevel,
            rho0,
        });
    }, [activeXColumn, activeYColumn, confidenceLevel, tails, direction, rho0]);

    useEffect(() => {
        onStatsChange?.(calculatorStats?.ok ? calculatorStats : null);
    }, [calculatorStats, onStatsChange]);

    const calculatorGuidance = useMemo(
        () => buildCorrelationGuidance(calculatorStats),
        [calculatorStats]
    );

    const influentialIndex = calculatorStats?.influence?.maxDeltaR >= 0.15
        ? calculatorStats.influence.influentialPoint?.index
        : null;

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
        return <PearsonCalculatorSection {...{
            tails, direction, darkMode, setCalculatorInputMode,
            calculatorInputMode, onUpload, setTableText, tableText,
            selectedDatasetId, setSelectedDatasetId, datasets, savedDataset,
            savedNumericColumns, savedRoleSelection, setSavedRoleSelection, activeCompleteCaseSummary,
            setTails, setDirection, confidenceLevel, setConfidenceLevel,
            rho0, setRho0, setCalculatorShowLine, calculatorShowLine,
            setCalculatorShowBand, calculatorShowBand, parsedTable, numericColumns,
            selectedX, setSelectedX, selectedY, setSelectedY,
            calculatorGuidance, calculatorStats, activeXLabel, activeYLabel,
            influentialIndex, assumptions, onOpenDataManager, tableSource, loadExample, uploadError, uploadPending, sourceLabel, rowSummary,
        }} />;
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
