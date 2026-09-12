import { useEffect, useMemo, useState } from 'react';
import { buildMultipleRegressionGuidance, calculateMultipleRegressionPrediction, calculateMultipleRegressionStats } from '../stats/multipleRegression.js';
import { parseDelimitedTable } from '../utils/delimitedTable.js';
import { buildNumericAnalysisColumn, countCompleteRows } from '../utils/datasetImport.js';
import { useDatasetLibraryContext } from '../hooks/useDatasetLibrary.js';
import { ACTIVE_DATASET_SESSION_KEY, readAnalysisLaunchPayload, consumeAnalysisLaunchPayload } from '../utils/analysisLaunch.js';
import { SAMPLE_DATASET } from '../data/multipleRegressionLesson.js';
import { countNumericCompleteCasesFromColumns, buildPredictionInputsFromStats, findDefaultPointId } from '../utils/multipleRegressionLesson.js';

export default function useMultipleRegressionCalculator({ onStatsChange }) {
    const { datasets } = useDatasetLibraryContext();

    const [tableText, setTableText] = useState(SAMPLE_DATASET);

    const [launchPayload] = useState(() => readAnalysisLaunchPayload('multiple_regression'));
    const [calculatorInputMode, setCalculatorInputMode] = useState(launchPayload?.datasetId ? 'saved' : 'paste');
    const [selectedDatasetId, setSelectedDatasetId] = useState(launchPayload?.datasetId || '');
    useEffect(() => {
        if (launchPayload) consumeAnalysisLaunchPayload('multiple_regression');
    }, [launchPayload]);

    const [launchPayloadApplied, setLaunchPayloadApplied] = useState(false);

    const [savedRoleSelection, setSavedRoleSelection] = useState({
        outcome: launchPayload?.outcome || '',
        predictors: launchPayload?.predictors || [],
    });

    const [selectedOutcome, setSelectedOutcome] = useState('');

    const [selectedPredictors, setSelectedPredictors] = useState([]);

    const [confidenceLevel, setConfidenceLevel] = useState(0.95);

    const [calculatorSelectedPointId, setCalculatorSelectedPointId] = useState(null);

    const [calculatorPredictionInputs, setCalculatorPredictionInputs] = useState({});

    const parsedTable = useMemo(() => parseDelimitedTable(tableText), [tableText]);

    const numericColumns = useMemo(() => parsedTable.numericColumns || [], [parsedTable]);

    const savedDataset = useMemo(
        () => datasets.find((dataset) => dataset.id === selectedDatasetId) || null,
        [datasets, selectedDatasetId]
    );

    useEffect(() => {
        if (launchPayload?.datasetId) {
            setCalculatorInputMode('saved');
        }
    }, [launchPayload]);

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

        if (
            launchPayload
            && !launchPayloadApplied
            && launchPayload.datasetId === savedDataset.id
        ) {
            const nextOutcome = numericIds.includes(launchPayload.outcome)
                ? launchPayload.outcome
                : numericIds[numericIds.length - 1] || '';
            const availablePredictors = numericIds.filter((columnId) => columnId !== nextOutcome);
            const nextPredictors = (launchPayload.predictors || []).filter((columnId) => availablePredictors.includes(columnId));

            setSavedRoleSelection({
                outcome: nextOutcome,
                predictors: nextPredictors.length >= 2
                    ? nextPredictors
                    : [...new Set([
                        ...nextPredictors,
                        ...availablePredictors.slice(0, Math.max(0, Math.min(3, availablePredictors.length))),
                    ])].slice(0, Math.max(0, Math.min(3, availablePredictors.length))),
            });
            setLaunchPayloadApplied(true);
            return;
        }

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
    }, [launchPayload, launchPayloadApplied, savedDataset]);

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

    const selectedPredictorColumns = useMemo(
        () => numericColumns.filter((column) => selectedPredictors.includes(column.name)),
        [numericColumns, selectedPredictors]
    );

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

    return {
        calculatorStats, setCalculatorInputMode, calculatorInputMode, onUpload,
        setTableText, tableText, selectedOutcome, setSelectedOutcome,
        numericColumns, selectedPredictors, togglePredictor, selectedDatasetId,
        setSelectedDatasetId, datasets, savedDataset, savedRoleSelection,
        setSavedRoleSelection, confidenceLevel, setConfidenceLevel, activeCompleteCaseSummary,
        calculatorNeedsSetup, calculatorModelErrors, activeOutcomeLabel, calculatorSelectedPointId,
        setCalculatorSelectedPointId, calculatorPrediction, calculatorPredictionInputs, setCalculatorPredictionInputs,
        calculatorSelectedPair, calculatorGuidance,
    };
}
