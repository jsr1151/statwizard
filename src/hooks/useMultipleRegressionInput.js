import { useCallback, useMemo } from 'react';
import { useDatasetLibraryContext } from './useDatasetLibrary.js';
import usePersistentCalculatorDraft from './usePersistentCalculatorDraft.js';
import useAnalysisDatasetSelection from './useAnalysisDatasetSelection.js';
import useAnalysisTableInput from './useAnalysisTableInput.js';
import { multipleRegressionDraftStorage, defaultMultipleRegressionRoles } from '../utils/multipleRegressionDraft.js';
import { parseDelimitedTable } from '../utils/delimitedTable.js';
import { buildNumericAnalysisColumn } from '../utils/datasetImport.js';

export default function useMultipleRegressionInput(example) {
    const { datasets } = useDatasetLibraryContext();
    const { value, patch, draft } = usePersistentCalculatorDraft(multipleRegressionDraftStorage, example);
    const selection = useAnalysisDatasetSelection({ analysisId: 'multiple_regression', datasets, initialSelection: value });
    const { selectedDataset: savedDataset, selectedDatasetId, dataSource } = selection;
    const isSaved = dataSource === 'saved';
    const calculatorInputMode = isSaved ? 'saved' : 'paste';
    const onTableChange = useCallback(change => patch({ ...change, ...(change.tableSource === 'Example data' ? { pastedRoles: null, pastedPredictionInputs: {} } : {}) }), [patch]);
    const table = useAnalysisTableInput(example, calculatorInputMode, { initialValue: value, onChange: onTableChange });
    const parsedTable = useMemo(() => parseDelimitedTable(table.tableText), [table.tableText]);
    const numericColumns = useMemo(() => parsedTable.numericColumns || [], [parsedTable]);
    const savedColumns = useMemo(() => (savedDataset?.columns || []).filter(column => column.summary?.detectedType === 'numeric'), [savedDataset]);
    const pastedRoles = useMemo(() => value.pastedRoles ?? defaultMultipleRegressionRoles(numericColumns.map(column => column.name)), [value.pastedRoles, numericColumns]);
    const savedRoles = useMemo(() => Object.hasOwn(value.savedRoles, selectedDatasetId) ? value.savedRoles[selectedDatasetId]
        : defaultMultipleRegressionRoles(savedColumns.map(column => column.id)), [value.savedRoles, selectedDatasetId, savedColumns]);
    const activeRoles = isSaved ? savedRoles : pastedRoles;
    const activeKeys = isSaved ? savedColumns.map(column => column.id) : numericColumns.map(column => column.name);
    const unavailablePredictors = activeRoles.predictors.filter(key => !activeKeys.includes(key) || key === activeRoles.outcome);
    const activeOutcomeColumn = useMemo(() => isSaved ? (savedColumns.some(column => column.id === savedRoles.outcome) ? buildNumericAnalysisColumn(savedDataset, savedRoles.outcome) : null)
        : numericColumns.find(column => column.name === pastedRoles.outcome) || null, [isSaved, savedDataset, savedColumns, savedRoles.outcome, numericColumns, pastedRoles.outcome]);
    const activePredictorColumns = useMemo(() => isSaved ? savedRoles.predictors.map(id => buildNumericAnalysisColumn(savedDataset, id))
        : pastedRoles.predictors.map(name => numericColumns.find(column => column.name === name) || null), [isSaved, savedDataset, savedRoles.predictors, numericColumns, pastedRoles.predictors]);

    const savedSnapshot = (current, id = selectedDatasetId) => {
        if (Object.hasOwn(current.savedRoles, id)) return current.savedRoles;
        const dataset = datasets.find(item => item.id === id);
        return dataset ? { ...current.savedRoles, [id]: defaultMultipleRegressionRoles(dataset.columns.filter(column => column.summary?.detectedType === 'numeric').map(column => column.id)) } : current.savedRoles;
    };
    const setSavedRoleSelection = next => patch(current => ({ selectedDatasetId, savedRoles: { ...current.savedRoles, [selectedDatasetId]: next } }));
    const setSelectedOutcome = outcome => patch({ pastedRoles: { outcome, predictors: pastedRoles.predictors.filter(key => key !== outcome) } });
    const togglePredictor = key => patch({ pastedRoles: { ...pastedRoles, predictors: pastedRoles.predictors.includes(key) ? pastedRoles.predictors.filter(item => item !== key) : [...pastedRoles.predictors, key] } });
    const predictionValues = isSaved ? value.savedPredictionInputs[selectedDatasetId] || {} : value.pastedPredictionInputs;
    const setPredictionValues = next => patch(current => isSaved
        ? { selectedDatasetId, savedRoles: savedSnapshot(current), savedPredictionInputs: { ...current.savedPredictionInputs, [selectedDatasetId]: next } }
        : { pastedPredictionInputs: next });
    const resetVariableChoices = () => {
        const defaults = defaultMultipleRegressionRoles(activeKeys);
        if (isSaved) setSavedRoleSelection(defaults);
        else patch({ pastedRoles: defaults });
    };

    return {
        ...table, draft,
        datasets, savedDataset, selectedDatasetId, calculatorInputMode, numericColumns,
        selectedOutcome: numericColumns.some(column => column.name === pastedRoles.outcome) ? pastedRoles.outcome : '',
        selectedPredictors: pastedRoles.predictors, setSelectedOutcome, togglePredictor,
        savedRoleSelection: { ...savedRoles, outcome: savedColumns.some(column => column.id === savedRoles.outcome) ? savedRoles.outcome : '' },
        setSavedRoleSelection: next => setSavedRoleSelection({ ...next, predictors: next.predictors.filter(key => key !== next.outcome) }),
        setSelectedDatasetId: id => { selection.setSelectedDatasetId(id); patch(current => ({ selectedDatasetId: id, savedRoles: savedSnapshot(current, id) })); },
        setCalculatorInputMode: mode => { selection.setDataSource(mode === 'saved' ? 'saved' : 'manual'); patch(current => ({ mode, selectedDatasetId, savedRoles: mode === 'saved' ? savedSnapshot(current) : current.savedRoles })); },
        confidenceLevel: value.confidenceLevel,
        setConfidenceLevel: confidenceLevel => patch(current => ({ confidenceLevel, selectedDatasetId, savedRoles: isSaved ? savedSnapshot(current) : current.savedRoles })),
        activeRoles, activeOutcomeColumn, activePredictorColumns, unavailablePredictors, resetVariableChoices,
        predictionValues, setPredictionValues,
        totalRows: isSaved ? savedDataset?.rowCount || 0 : parsedTable.rowCount || 0,
        sourceLabel: isSaved ? savedDataset?.name || 'No dataset selected' : table.tableSource,
        activeOutcomeLabel: activeOutcomeColumn?.label || activeOutcomeColumn?.name || 'Y',
    };
}
