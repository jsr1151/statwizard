import {
    getDatasetColumn,
    isMissingValue,
    parseNumericValue,
} from './datasetImport.js';

const GROUP_COLORS = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'];

const toDisplayValue = (value) => String(value ?? '').trim();

const sortTextValues = (values = []) => [...values].sort((left, right) => (
    String(left).localeCompare(String(right), undefined, { numeric: true, sensitivity: 'base' })
));

const getSampleMean = (values = []) => {
    if (!values.length) {
        return 0;
    }

    return values.reduce((sum, value) => sum + value, 0) / values.length;
};

const getSampleSd = (values = []) => {
    if (values.length <= 1) {
        return 0;
    }

    const mean = getSampleMean(values);
    const variance = values.reduce((sum, value) => sum + ((value - mean) ** 2), 0) / (values.length - 1);
    return Math.sqrt(variance);
};

const formatSummary = (values = []) => ({
    mean: getSampleMean(values).toFixed(2),
    sd: getSampleSd(values).toFixed(2),
    n: `${values.length}`,
});

const getUsableCategoryLevels = (dataset, columnId) => {
    if (!dataset || !columnId) {
        return [];
    }

    return sortTextValues(
        [...new Set(
            (dataset.rows || [])
                .map((row) => row?.[columnId])
                .filter((value) => !isMissingValue(value))
                .map(toDisplayValue)
                .filter(Boolean)
        )]
    );
};

const buildValidationResponse = (errors = [], extra = {}) => ({
    ok: errors.length === 0,
    errors,
    ...extra,
});

const buildSeedKey = (...parts) => parts.filter(Boolean).join('::');

export const getDatasetColumnLevels = getUsableCategoryLevels;

export const buildIndependentTTestDatasetSetup = (dataset, {
    outcomeColumnId,
    groupingColumnId,
}) => {
    const outcomeColumn = getDatasetColumn(dataset, outcomeColumnId);
    const groupingColumn = getDatasetColumn(dataset, groupingColumnId);
    const errors = [];

    if (!dataset) {
        errors.push('Choose a saved dataset to begin.');
    }

    if (!outcomeColumnId) {
        errors.push('Dependent variable must be numeric.');
    }

    if (!groupingColumnId) {
        errors.push('Grouping variable must have exactly 2 levels for this test.');
    }

    if (outcomeColumn && outcomeColumn.summary?.detectedType !== 'numeric') {
        errors.push('Dependent variable must be numeric.');
    }

    if (groupingColumn && !['categorical', 'text'].includes(groupingColumn.summary?.detectedType)) {
        errors.push('Grouping variable must be categorical.');
    }

    const levels = getUsableCategoryLevels(dataset, groupingColumnId);

    if (groupingColumn && levels.length !== 2) {
        errors.push('Grouping variable must have exactly 2 levels for this test.');
    }

    if (errors.length) {
        return buildValidationResponse(errors, {
            levels,
            usableRows: 0,
            totalRows: dataset?.rowCount || dataset?.rows?.length || 0,
            droppedRows: dataset?.rowCount || dataset?.rows?.length || 0,
        });
    }

    const groupedValues = new Map(levels.map((level) => [level, []]));

    (dataset.rows || []).forEach((row) => {
        const groupValue = toDisplayValue(row?.[groupingColumnId]);
        const numericOutcome = parseNumericValue(row?.[outcomeColumnId]);

        if (!groupedValues.has(groupValue) || numericOutcome == null) {
            return;
        }

        groupedValues.get(groupValue).push(numericOutcome);
    });

    const levelEntries = levels.map((level) => ({
        label: level,
        values: groupedValues.get(level) || [],
    }));

    if (levelEntries.some((entry) => entry.values.length === 0)) {
        return buildValidationResponse(['No usable rows remain after excluding missing values.'], {
            levels,
            usableRows: 0,
            totalRows: dataset.rowCount || dataset.rows.length,
            droppedRows: dataset.rowCount || dataset.rows.length,
        });
    }

    const usableRows = levelEntries.reduce((sum, entry) => sum + entry.values.length, 0);
    const totalRows = dataset.rowCount || dataset.rows.length;

    return buildValidationResponse([], {
        levels,
        usableRows,
        totalRows,
        droppedRows: Math.max(0, totalRows - usableRows),
        seed: {
            key: buildSeedKey(dataset.id, outcomeColumnId, groupingColumnId, usableRows),
            group1: {
                label: levelEntries[0].label,
                raw: levelEntries[0].values.join(', '),
                xBar: Number(formatSummary(levelEntries[0].values).mean),
                s: Number(formatSummary(levelEntries[0].values).sd),
                n: levelEntries[0].values.length,
            },
            group2: {
                label: levelEntries[1].label,
                raw: levelEntries[1].values.join(', '),
                xBar: Number(formatSummary(levelEntries[1].values).mean),
                s: Number(formatSummary(levelEntries[1].values).sd),
                n: levelEntries[1].values.length,
            },
        },
    });
};

export const buildPairedTTestDatasetSetup = (dataset, {
    firstColumnId,
    secondColumnId,
}) => {
    const firstColumn = getDatasetColumn(dataset, firstColumnId);
    const secondColumn = getDatasetColumn(dataset, secondColumnId);
    const errors = [];

    if (!dataset) {
        errors.push('Choose a saved dataset to begin.');
    }

    if (!firstColumnId || !secondColumnId) {
        errors.push('Choose both paired numeric variables.');
    }

    if (firstColumnId && secondColumnId && firstColumnId === secondColumnId) {
        errors.push('Choose two different paired numeric variables.');
    }

    if (firstColumn && firstColumn.summary?.detectedType !== 'numeric') {
        errors.push('Paired variables must both be numeric.');
    }

    if (secondColumn && secondColumn.summary?.detectedType !== 'numeric') {
        errors.push('Paired variables must both be numeric.');
    }

    if (errors.length) {
        return buildValidationResponse(errors, {
            usableRows: 0,
            totalRows: dataset?.rowCount || dataset?.rows?.length || 0,
            droppedRows: dataset?.rowCount || dataset?.rows?.length || 0,
        });
    }

    const pairedRows = (dataset.rows || []).reduce((accumulator, row) => {
        const firstValue = parseNumericValue(row?.[firstColumnId]);
        const secondValue = parseNumericValue(row?.[secondColumnId]);

        if (firstValue == null || secondValue == null) {
            return accumulator;
        }

        accumulator.first.push(firstValue);
        accumulator.second.push(secondValue);
        return accumulator;
    }, { first: [], second: [] });

    const usableRows = pairedRows.first.length;
    const totalRows = dataset.rowCount || dataset.rows.length;

    if (!usableRows) {
        return buildValidationResponse(['No usable rows remain after excluding missing values.'], {
            usableRows,
            totalRows,
            droppedRows: totalRows,
        });
    }

    return buildValidationResponse([], {
        usableRows,
        totalRows,
        droppedRows: Math.max(0, totalRows - usableRows),
        seed: {
            key: buildSeedKey(dataset.id, firstColumnId, secondColumnId, usableRows),
            group1: {
                label: firstColumn?.label || 'Condition 1',
                raw: pairedRows.first.join(', '),
            },
            group2: {
                label: secondColumn?.label || 'Condition 2',
                raw: pairedRows.second.join(', '),
            },
        },
    });
};

export const buildOneWayAnovaDatasetSetup = (dataset, {
    outcomeColumnId,
    groupingColumnId,
}) => {
    const outcomeColumn = getDatasetColumn(dataset, outcomeColumnId);
    const groupingColumn = getDatasetColumn(dataset, groupingColumnId);
    const errors = [];

    if (!dataset) {
        errors.push('Choose a saved dataset to begin.');
    }

    if (!outcomeColumnId) {
        errors.push('Dependent variable must be numeric.');
    }

    if (!groupingColumnId) {
        errors.push('Grouping variable must be categorical with 2 or more levels.');
    }

    if (outcomeColumn && outcomeColumn.summary?.detectedType !== 'numeric') {
        errors.push('Dependent variable must be numeric.');
    }

    if (groupingColumn && !['categorical', 'text'].includes(groupingColumn.summary?.detectedType)) {
        errors.push('Grouping variable must be categorical.');
    }

    const levels = getUsableCategoryLevels(dataset, groupingColumnId);

    if (groupingColumn && levels.length < 2) {
        errors.push('Grouping variable must have 2 or more usable levels.');
    }

    if (errors.length) {
        return buildValidationResponse(errors, {
            levels,
            usableRows: 0,
            totalRows: dataset?.rowCount || dataset?.rows?.length || 0,
            droppedRows: dataset?.rowCount || dataset?.rows?.length || 0,
        });
    }

    const groupedValues = new Map(levels.map((level) => [level, []]));

    (dataset.rows || []).forEach((row) => {
        const groupValue = toDisplayValue(row?.[groupingColumnId]);
        const numericOutcome = parseNumericValue(row?.[outcomeColumnId]);

        if (!groupedValues.has(groupValue) || numericOutcome == null) {
            return;
        }

        groupedValues.get(groupValue).push(numericOutcome);
    });

    const groups = levels.map((level, index) => {
        const values = groupedValues.get(level) || [];

        return {
            id: index + 1,
            label: level,
            color: GROUP_COLORS[index % GROUP_COLORS.length],
            inputMode: 'raw',
            values,
            summary: formatSummary(values),
            collapsed: false,
        };
    });

    if (groups.some((group) => group.values.length === 0)) {
        return buildValidationResponse(['No usable rows remain after excluding missing values.'], {
            levels,
            usableRows: 0,
            totalRows: dataset.rowCount || dataset.rows.length,
            droppedRows: dataset.rowCount || dataset.rows.length,
        });
    }

    const usableRows = groups.reduce((sum, group) => sum + group.values.length, 0);
    const totalRows = dataset.rowCount || dataset.rows.length;

    return buildValidationResponse([], {
        levels,
        usableRows,
        totalRows,
        droppedRows: Math.max(0, totalRows - usableRows),
        seed: {
            key: buildSeedKey(dataset.id, outcomeColumnId, groupingColumnId, usableRows, levels.length),
            groups,
        },
    });
};

export const buildFactorialAnovaDatasetSetup = (dataset, {
    outcomeColumnId,
    factorAColumnId,
    factorBColumnId,
}) => {
    const outcomeColumn = getDatasetColumn(dataset, outcomeColumnId);
    const factorAColumn = getDatasetColumn(dataset, factorAColumnId);
    const factorBColumn = getDatasetColumn(dataset, factorBColumnId);
    const errors = [];

    if (!dataset) {
        errors.push('Choose a saved dataset to begin.');
    }

    if (!outcomeColumnId) {
        errors.push('Dependent variable must be numeric.');
    }

    if (!factorAColumnId || !factorBColumnId) {
        errors.push('Choose both factor variables.');
    }

    if (factorAColumnId && factorBColumnId && factorAColumnId === factorBColumnId) {
        errors.push('Factor A and Factor B must be different categorical variables.');
    }

    if (outcomeColumn && outcomeColumn.summary?.detectedType !== 'numeric') {
        errors.push('Dependent variable must be numeric.');
    }

    if (factorAColumn && !['categorical', 'text'].includes(factorAColumn.summary?.detectedType)) {
        errors.push('Factor A must be categorical.');
    }

    if (factorBColumn && !['categorical', 'text'].includes(factorBColumn.summary?.detectedType)) {
        errors.push('Factor B must be categorical.');
    }

    const factorALevels = getUsableCategoryLevels(dataset, factorAColumnId);
    const factorBLevels = getUsableCategoryLevels(dataset, factorBColumnId);

    if (factorAColumn && factorALevels.length < 2) {
        errors.push('Factor A must have 2 or more usable levels.');
    }

    if (factorBColumn && factorBLevels.length < 2) {
        errors.push('Factor B must have 2 or more usable levels.');
    }

    if (errors.length) {
        return buildValidationResponse(errors, {
            usableRows: 0,
            totalRows: dataset?.rowCount || dataset?.rows?.length || 0,
            droppedRows: dataset?.rowCount || dataset?.rows?.length || 0,
        });
    }

    const factorA = {
        label: factorAColumn?.label || 'Factor A',
        levels: factorALevels.map((label, index) => ({ id: `a${index + 1}`, label })),
    };
    const factorB = {
        label: factorBColumn?.label || 'Factor B',
        levels: factorBLevels.map((label, index) => ({ id: `b${index + 1}`, label })),
    };

    const levelIdByLabelA = new Map(factorA.levels.map((level) => [level.label, level.id]));
    const levelIdByLabelB = new Map(factorB.levels.map((level) => [level.label, level.id]));
    const cellData = {};

    factorA.levels.forEach((aLevel) => {
        factorB.levels.forEach((bLevel) => {
            cellData[`${aLevel.id}_${bLevel.id}`] = {
                values: [],
                summary: { mean: '0.00', sd: '0.00', n: '0' },
                inputMode: 'raw',
            };
        });
    });

    let usableRows = 0;

    (dataset.rows || []).forEach((row) => {
        const factorAValue = toDisplayValue(row?.[factorAColumnId]);
        const factorBValue = toDisplayValue(row?.[factorBColumnId]);
        const numericOutcome = parseNumericValue(row?.[outcomeColumnId]);
        const aId = levelIdByLabelA.get(factorAValue);
        const bId = levelIdByLabelB.get(factorBValue);

        if (!aId || !bId || numericOutcome == null) {
            return;
        }

        usableRows += 1;
        cellData[`${aId}_${bId}`].values.push(numericOutcome);
    });

    Object.keys(cellData).forEach((cellKey) => {
        cellData[cellKey].summary = formatSummary(cellData[cellKey].values);
    });

    const hasEmptyCells = Object.values(cellData).some((cell) => cell.values.length === 0);
    const totalRows = dataset.rowCount || dataset.rows.length;

    if (usableRows === 0) {
        return buildValidationResponse(['No usable rows remain after excluding missing values.'], {
            usableRows,
            totalRows,
            droppedRows: totalRows,
        });
    }

    if (hasEmptyCells) {
        return buildValidationResponse(['Every Factor A × Factor B combination needs at least one usable row.'], {
            usableRows,
            totalRows,
            droppedRows: Math.max(0, totalRows - usableRows),
        });
    }

    return buildValidationResponse([], {
        usableRows,
        totalRows,
        droppedRows: Math.max(0, totalRows - usableRows),
        seed: {
            key: buildSeedKey(dataset.id, outcomeColumnId, factorAColumnId, factorBColumnId, usableRows),
            factorA,
            factorB,
            outcomeLabel: outcomeColumn?.label || 'Outcome Variable',
            cellData,
        },
    });
};
