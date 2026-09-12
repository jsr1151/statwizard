import { useCallback, useEffect, useMemo } from 'react';
import { useDatasetLibraryContext } from './useDatasetLibrary.js';
import usePersistentCalculatorDraft from './usePersistentCalculatorDraft.js';
import useAnalysisDatasetSelection from './useAnalysisDatasetSelection.js';
import useAnalysisTableInput from './useAnalysisTableInput.js';
import { pearsonDraftStorage, defaultPearsonRoles } from '../utils/pearsonDraft.js';
import { parseDelimitedTable } from '../utils/delimitedTable.js';
import { buildNumericAnalysisColumn } from '../utils/datasetImport.js';
import { summarizeAnalysisRows } from '../utils/analysisRows.js';
import { buildCorrelationGuidance, calculatePearsonCorrelationStats } from '../stats/correlation.js';

export default function usePearsonCalculator(example, onStatsChange) {
    const { datasets } = useDatasetLibraryContext();
    const { value, patch, draft } = usePersistentCalculatorDraft(pearsonDraftStorage, example);
    const selection = useAnalysisDatasetSelection({ analysisId: 'pearson_correlation', datasets, initialSelection: value });
    const { selectedDataset: savedDataset, selectedDatasetId, dataSource } = selection;
    const isSaved = dataSource === 'saved';
    const calculatorInputMode = isSaved ? 'saved' : 'paste';
    const onTableChange = useCallback(change => patch({ ...change, ...(change.tableSource === 'Example data' ? { pastedRoles: null } : {}) }), [patch]);
    const table = useAnalysisTableInput(example, calculatorInputMode, { initialValue: value, onChange: onTableChange });
    const parsedTable = useMemo(() => parseDelimitedTable(table.tableText), [table.tableText]);
    const numericColumns = useMemo(() => parsedTable.numericColumns || [], [parsedTable]);
    const savedNumericColumns = useMemo(() => (savedDataset?.columns || []).filter(column => column.summary?.detectedType === 'numeric'), [savedDataset]);
    const pastedRoles = useMemo(() => value.pastedRoles ?? defaultPearsonRoles(numericColumns.map(column => column.name)), [value.pastedRoles, numericColumns]);
    const savedRoles = useMemo(() => Object.hasOwn(value.savedRoles, selectedDatasetId) ? value.savedRoles[selectedDatasetId]
        : defaultPearsonRoles(savedNumericColumns.map(column => column.id)), [value.savedRoles, selectedDatasetId, savedNumericColumns]);
    const activeRoles = isSaved ? savedRoles : pastedRoles;
    const availableSavedRole = key => savedNumericColumns.some(column => column.id === savedRoles[key]) ? savedRoles[key] : '';
    const selectedX = numericColumns.some(column => column.name === pastedRoles.x) ? pastedRoles.x : '';
    const selectedY = numericColumns.some(column => column.name === pastedRoles.y) ? pastedRoles.y : '';
    const savedX = availableSavedRole('x');
    const savedY = availableSavedRole('y');
    const activeXColumn = useMemo(() => isSaved ? buildNumericAnalysisColumn(savedDataset, savedX)
        : numericColumns.find(column => column.name === selectedX) || null, [isSaved, savedDataset, savedX, numericColumns, selectedX]);
    const activeYColumn = useMemo(() => isSaved ? buildNumericAnalysisColumn(savedDataset, savedY)
        : numericColumns.find(column => column.name === selectedY) || null, [isSaved, savedDataset, savedY, numericColumns, selectedY]);
    const validRoles = !!activeXColumn && !!activeYColumn && activeRoles.x !== activeRoles.y;
    const rowSummary = useMemo(() => validRoles ? summarizeAnalysisRows([activeXColumn, activeYColumn], isSaved ? savedDataset.rowCount : parsedTable.rowCount) : null,
        [validRoles, activeXColumn, activeYColumn, isSaved, savedDataset, parsedTable.rowCount]);
    const { tails, direction, confidenceLevel, rho0 } = value;
    const validNull = String(rho0).trim() !== '' && Number.isFinite(Number(rho0)) && Number(rho0) >= -0.95 && Number(rho0) <= 0.95;
    const setupError = !validRoles ? 'Choose two different numeric columns to calculate Pearson correlation.'
        : !validNull ? 'Enter a null population correlation between -0.95 and 0.95.' : '';
    const calculatorStats = useMemo(() => setupError ? null : calculatePearsonCorrelationStats({
        xValues: activeXColumn.numericValues, yValues: activeYColumn.numericValues,
        alpha: 1 - confidenceLevel, tails, direction, confidenceLevel, rho0: Number(rho0),
    }), [setupError, activeXColumn, activeYColumn, confidenceLevel, tails, direction, rho0]);
    useEffect(() => { onStatsChange?.(calculatorStats?.ok ? calculatorStats : null); }, [calculatorStats, onStatsChange]);
    const calculatorGuidance = useMemo(() => buildCorrelationGuidance(calculatorStats), [calculatorStats]);

    const savedSnapshot = (current, id = selectedDatasetId) => {
        if (Object.hasOwn(current.savedRoles, id)) return current.savedRoles;
        const dataset = datasets.find(item => item.id === id);
        return dataset ? { ...current.savedRoles, [id]: defaultPearsonRoles(dataset.columns.filter(column => column.summary?.detectedType === 'numeric').map(column => column.id)) } : current.savedRoles;
    };
    const setOptions = change => patch(current => ({ ...change, selectedDatasetId, savedRoles: isSaved ? savedSnapshot(current) : current.savedRoles }));
    const setDisplay = (key, next) => patch(current => ({ [key]: typeof next === 'function' ? next(current[key]) : next, selectedDatasetId, savedRoles: isSaved ? savedSnapshot(current) : current.savedRoles }));
    return {
        ...table, draft, parsedTable, numericColumns, savedNumericColumns, datasets, savedDataset, selectedDatasetId,
        calculatorInputMode, selectedX, selectedY, savedRoleSelection: { x: savedX, y: savedY },
        setSelectedX: x => patch({ pastedRoles: { ...pastedRoles, x } }),
        setSelectedY: y => patch({ pastedRoles: { ...pastedRoles, y } }),
        setSavedRoleSelection: roles => patch(current => ({ selectedDatasetId, savedRoles: { ...current.savedRoles, [selectedDatasetId]: roles } })),
        setSelectedDatasetId: id => { selection.setSelectedDatasetId(id); patch(current => ({ selectedDatasetId: id, savedRoles: savedSnapshot(current, id) })); },
        setCalculatorInputMode: mode => { selection.setDataSource(mode === 'saved' ? 'saved' : 'manual'); patch(current => ({ mode, selectedDatasetId, savedRoles: mode === 'saved' ? savedSnapshot(current) : current.savedRoles })); },
        tails, direction, confidenceLevel, rho0,
        setHypothesis: hypothesis => setOptions(hypothesis === 'two_tailed' ? { tails: 2 } : { tails: 1, direction: hypothesis === 'negative' ? 'less' : 'greater' }),
        setConfidenceLevel: confidenceLevel => setOptions({ confidenceLevel }), setRho0: rho0 => setOptions({ rho0 }),
        calculatorShowLine: value.showLine, calculatorShowBand: value.showBand,
        setCalculatorShowLine: next => setDisplay('showLine', next), setCalculatorShowBand: next => setDisplay('showBand', next),
        calculatorStats, calculatorGuidance, setupError, rowSummary, activeCompleteCaseSummary: rowSummary,
        activeXLabel: activeXColumn?.label || activeXColumn?.name || 'X', activeYLabel: activeYColumn?.label || activeYColumn?.name || 'Y',
        sourceLabel: isSaved ? savedDataset?.name || 'No dataset selected' : table.tableSource,
        influentialIndex: calculatorStats?.influence?.maxDeltaR >= 0.15 ? calculatorStats.influence.influentialPoint?.index : null,
    };
}
