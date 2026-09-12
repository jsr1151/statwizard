import { useMemo, useState } from 'react';
import { useDatasetLibraryContext } from './useDatasetLibrary.js';
import useAnalysisDatasetSelection from './useAnalysisDatasetSelection.js';
import useAnalysisTableInput from './useAnalysisTableInput.js';
import { parseDelimitedTable } from '../utils/delimitedTable.js';
import { buildNumericAnalysisColumn } from '../utils/datasetImport.js';
import { summarizeAnalysisRows } from '../utils/analysisRows.js';

export default function useSimpleRegressionInput(example) {
    const { datasets } = useDatasetLibraryContext();
    const selection = useAnalysisDatasetSelection({ analysisId: 'simple_regression', datasets });
    const { selectedDataset: savedDataset, selectedDatasetId, setSelectedDatasetId, launchPayload, dataSource, setDataSource } = selection;
    const calculatorInputMode = dataSource === 'saved' ? 'saved' : 'paste';
    const table = useAnalysisTableInput(example, calculatorInputMode);
    const parsedTable = useMemo(() => parseDelimitedTable(table.tableText), [table.tableText]);
    const [pastedRoles, setPastedRoles] = useState({});
    const [savedRoles, setSavedRoles] = useState(() => launchPayload ? {
        [launchPayload.datasetId]: { x: launchPayload.x || '', y: launchPayload.y || '' },
    } : {});
    const isSaved = calculatorInputMode === 'saved';
    const numericColumns = useMemo(() => isSaved
        ? (savedDataset?.columns || []).filter(column => column.summary?.detectedType === 'numeric').map(column => ({ key: column.id, label: column.label }))
        : (parsedTable.numericColumns || []).map(column => ({ key: column.name, label: column.name })), [isSaved, savedDataset, parsedTable]);
    const roles = isSaved ? savedRoles[selectedDatasetId] || {} : pastedRoles;
    // Explicitly cleared or unavailable roles stay empty. Only an untouched source gets defaults.
    const selectedX = Object.hasOwn(roles, 'x') ? (numericColumns.some(column => column.key === roles.x) ? roles.x : '') : numericColumns[0]?.key || '';
    const selectedY = Object.hasOwn(roles, 'y') ? (numericColumns.some(column => column.key === roles.y) ? roles.y : '') : numericColumns.find(column => column.key !== selectedX)?.key || '';
    const setRole = (role, value) => {
        const next = { x: selectedX, y: selectedY, [role]: value };
        if (isSaved) setSavedRoles(current => ({ ...current, [selectedDatasetId]: next }));
        else setPastedRoles(next);
    };
    const selectedXColumn = useMemo(() => isSaved ? buildNumericAnalysisColumn(savedDataset, selectedX)
        : parsedTable.numericColumns?.find(column => column.name === selectedX) || null, [isSaved, savedDataset, selectedX, parsedTable]);
    const selectedYColumn = useMemo(() => isSaved ? buildNumericAnalysisColumn(savedDataset, selectedY)
        : parsedTable.numericColumns?.find(column => column.name === selectedY) || null, [isSaved, savedDataset, selectedY, parsedTable]);
    const rowSummary = useMemo(() => summarizeAnalysisRows([selectedXColumn, selectedYColumn], isSaved ? savedDataset?.rowCount || 0 : parsedTable.rowCount || 0),
        [selectedXColumn, selectedYColumn, isSaved, savedDataset, parsedTable.rowCount]);
    return {
        ...table, loadExample: () => { setPastedRoles({}); table.loadExample(); },
        parsedTable, datasets, savedDataset, selectedDatasetId, setSelectedDatasetId,
        calculatorInputMode, setCalculatorInputMode: mode => setDataSource(mode === 'saved' ? 'saved' : 'manual'),
        numericColumns, selectedX, selectedY, setSelectedX: value => setRole('x', value), setSelectedY: value => setRole('y', value),
        selectedXColumn, selectedYColumn, rowSummary,
        activeXLabel: selectedXColumn?.label || selectedXColumn?.name || 'X',
        activeYLabel: selectedYColumn?.label || selectedYColumn?.name || 'Y',
        sourceLabel: isSaved ? savedDataset?.name || 'No dataset selected' : table.tableSource,
    };
}
