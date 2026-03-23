const DELIMITER_OPTIONS = [',', '\t', ';'];
const MISSING_TOKENS = new Set(['', 'na', 'n/a', 'null', 'none', 'nan']);
const CATEGORY_PREVIEW_LIMIT = 6;

const normalizeTagList = (tags = []) => {
    const seen = new Set();

    return tags
        .map((tag) => String(tag ?? '').trim())
        .filter(Boolean)
        .filter((tag) => {
            const normalized = tag.toLowerCase();

            if (seen.has(normalized)) {
                return false;
            }

            seen.add(normalized);
            return true;
        });
};

const roundTo = (value, decimals = 4) => {
    const factor = 10 ** decimals;
    return Math.round(Number(value) * factor) / factor;
};

const createId = (prefix = 'id') => {
    if (typeof globalThis !== 'undefined' && globalThis.crypto?.randomUUID) {
        return `${prefix}_${globalThis.crypto.randomUUID()}`;
    }

    return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
};

const stripExtension = (fileName = '') =>
    String(fileName).replace(/\.[^/.]+$/, '').trim() || 'Imported Dataset';

const normalizeCell = (value) => {
    if (value == null) {
        return null;
    }

    if (typeof value === 'number') {
        return Number.isFinite(value) ? value : null;
    }

    if (typeof value === 'boolean') {
        return value ? 'TRUE' : 'FALSE';
    }

    const text = String(value).replace(/\r/g, '').trim();
    return text.length ? text : null;
};

export const isMissingValue = (value) => {
    if (value == null) {
        return true;
    }

    if (typeof value === 'number') {
        return !Number.isFinite(value);
    }

    const normalized = String(value).trim().toLowerCase();
    return MISSING_TOKENS.has(normalized);
};

export const parseNumericValue = (value) => {
    if (value == null || typeof value === 'boolean') {
        return null;
    }

    if (typeof value === 'number') {
        return Number.isFinite(value) ? value : null;
    }

    const trimmed = String(value).trim();
    if (!trimmed) {
        return null;
    }

    const normalized = /^-?\d{1,3}(,\d{3})*(\.\d+)?$/.test(trimmed)
        ? trimmed.replace(/,/g, '')
        : trimmed;

    const numeric = Number(normalized);
    return Number.isFinite(numeric) ? numeric : null;
};

const parseDateValue = (value) => {
    if (value == null || typeof value === 'boolean' || typeof value === 'number') {
        return null;
    }

    const trimmed = String(value).trim();

    if (!trimmed || /^\d+(\.\d+)?$/.test(trimmed)) {
        return null;
    }

    const parsed = Date.parse(trimmed);
    return Number.isFinite(parsed) ? parsed : null;
};

const countDelimiter = (line, delimiter) => {
    let inQuotes = false;
    let count = 0;

    for (let index = 0; index < line.length; index += 1) {
        const character = line[index];

        if (character === '"') {
            const nextCharacter = line[index + 1];

            if (inQuotes && nextCharacter === '"') {
                index += 1;
            } else {
                inQuotes = !inQuotes;
            }

            continue;
        }

        if (!inQuotes && character === delimiter) {
            count += 1;
        }
    }

    return count;
};

const detectDelimiter = (text) => {
    const sampleLine = String(text ?? '')
        .split(/\r?\n/)
        .map((line) => line.trim())
        .find((line) => line.length > 0);

    if (!sampleLine) {
        return ',';
    }

    const ranked = DELIMITER_OPTIONS
        .map((delimiter) => ({
            delimiter,
            count: countDelimiter(sampleLine, delimiter),
        }))
        .sort((left, right) => right.count - left.count);

    return ranked[0]?.count > 0 ? ranked[0].delimiter : ',';
};

const parseDelimitedLine = (line, delimiter) => {
    const cells = [];
    let current = '';
    let inQuotes = false;

    for (let index = 0; index < line.length; index += 1) {
        const character = line[index];

        if (character === '"') {
            const nextCharacter = line[index + 1];

            if (inQuotes && nextCharacter === '"') {
                current += '"';
                index += 1;
            } else {
                inQuotes = !inQuotes;
            }

            continue;
        }

        if (!inQuotes && character === delimiter) {
            cells.push(current.trim());
            current = '';
            continue;
        }

        current += character;
    }

    cells.push(current.trim());
    return cells;
};

export const autoDetectHeaderRow = (row = []) =>
    row.some((cell) => {
        const trimmed = String(cell ?? '').trim();

        if (!trimmed) {
            return true;
        }

        return Number.isNaN(Number(trimmed));
    });

export const parseDelimitedTextGrid = (text) => {
    const source = String(text ?? '');
    const trimmed = source.trim();

    if (!trimmed) {
        return {
            ok: false,
            errors: ['Add CSV-style text to preview the dataset.'],
            delimiter: ',',
            grid: [],
            suggestedHeader: true,
        };
    }

    const delimiter = detectDelimiter(trimmed);
    const grid = trimmed
        .split(/\r?\n/)
        .map((line) => parseDelimitedLine(line, delimiter))
        .filter((row) => row.some((cell) => String(cell ?? '').trim().length > 0));

    if (!grid.length) {
        return {
            ok: false,
            errors: ['No rows were found in the imported table.'],
            delimiter,
            grid: [],
            suggestedHeader: true,
        };
    }

    return {
        ok: true,
        errors: [],
        delimiter,
        grid,
        suggestedHeader: autoDetectHeaderRow(grid[0]),
    };
};

const formatVariableLabel = (column) => {
    const label = String(column?.label ?? '').trim();
    const originalName = String(column?.originalName ?? '').trim();
    const fallback = String(column?.name ?? '').trim();

    return label || originalName || fallback || 'Variable';
};

const dedupeColumnLabels = (columns = []) => {
    const seen = new Set();

    return columns.map((column, index) => {
        const base = formatVariableLabel(column) || `Column ${index + 1}`;
        let candidate = base;
        let suffix = 2;

        while (seen.has(candidate.toLowerCase())) {
            candidate = `${base} (${suffix})`;
            suffix += 1;
        }

        seen.add(candidate.toLowerCase());
        return {
            ...column,
            label: candidate,
        };
    });
};

const summarizeNumericValues = (values = []) => {
    if (!values.length) {
        return {
            count: 0,
            min: null,
            max: null,
            mean: null,
            sd: null,
            standardError: null,
        };
    }

    const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
    const variance = values.length > 1
        ? values.reduce((sum, value) => sum + ((value - mean) ** 2), 0) / (values.length - 1)
        : 0;

    return {
        count: values.length,
        min: Math.min(...values),
        max: Math.max(...values),
        mean: roundTo(mean, 4),
        sd: roundTo(Math.sqrt(Math.max(0, variance)), 4),
        standardError: values.length > 0
            ? roundTo(Math.sqrt(Math.max(0, variance)) / Math.sqrt(values.length), 4)
            : null,
    };
};

const summarizeCategoricalValues = (values = []) => {
    const counts = new Map();

    values.forEach((value) => {
        const key = String(value);
        counts.set(key, (counts.get(key) || 0) + 1);
    });

    return Array.from(counts.entries())
        .sort((left, right) => right[1] - left[1])
        .slice(0, CATEGORY_PREVIEW_LIMIT)
        .map(([value, count]) => ({ value, count }));
};

const buildIssueTags = ({
    values,
    nonMissingValues,
    uniqueCount,
    numericValidCount,
    mostlyNumeric,
    missingCount,
    label,
}) => {
    const issues = [];
    const normalizedLabel = String(label ?? '').trim().toLowerCase();
    const identifierHints = ['id', 'identifier', 'participant', 'subject', 'respondent', 'record', 'case'];

    if (missingCount > 0) {
        issues.push('Missing data');
    }

    if (missingCount / Math.max(1, values.length) >= 0.5) {
        issues.push('Mostly missing');
    }

    if (mostlyNumeric && numericValidCount < nonMissingValues.length) {
        issues.push('Non-numeric entries');
    }

    if (uniqueCount <= 1 && nonMissingValues.length > 0) {
        issues.push('Single value');
    }

    const likelyId = (
        nonMissingValues.length >= 5
        && uniqueCount === nonMissingValues.length
        && (
            normalizedLabel === 'id'
            || normalizedLabel.endsWith('_id')
            || identifierHints.some((hint) => normalizedLabel.includes(hint))
        )
    ) || (
        nonMissingValues.length >= 8
        && uniqueCount === nonMissingValues.length
        && numericValidCount === nonMissingValues.length
    );

    if (likelyId) {
        issues.push('Identifier');
    }

    return issues;
};

const buildColumnSummary = ({ values, label }) => {
    const nonMissingValues = values.filter((value) => !isMissingValue(value));
    const missingCount = values.length - nonMissingValues.length;
    const numericValues = nonMissingValues.map(parseNumericValue).filter((value) => value != null);
    const dateValues = nonMissingValues.map(parseDateValue).filter((value) => value != null);
    const uniqueCount = new Set(nonMissingValues.map((value) => String(value))).size;
    const numericRatio = numericValues.length / Math.max(1, nonMissingValues.length);
    const dateRatio = dateValues.length / Math.max(1, nonMissingValues.length);
    const mostlyNumeric = numericRatio >= 0.8;

    let detectedType = 'text';

    if (!nonMissingValues.length) {
        detectedType = 'empty';
    } else if (numericRatio >= 0.8) {
        detectedType = 'numeric';
    } else if (dateRatio >= 0.8) {
        detectedType = 'date';
    } else if (uniqueCount <= 12 || uniqueCount / Math.max(1, nonMissingValues.length) <= 0.35) {
        detectedType = 'categorical';
    }

    return {
        detectedType,
        missingCount,
        nonMissingCount: nonMissingValues.length,
        uniqueCount,
        numericValidCount: numericValues.length,
        nonNumericValueCount: Math.max(0, nonMissingValues.length - numericValues.length),
        missingRate: roundTo(missingCount / Math.max(1, values.length), 4),
        numeric: summarizeNumericValues(numericValues),
        categories: summarizeCategoricalValues(nonMissingValues),
        issues: buildIssueTags({
            values,
            nonMissingValues,
            uniqueCount,
            numericValidCount: numericValues.length,
            mostlyNumeric,
            missingCount,
            label,
        }),
    };
};

const buildStatusSummary = (columns = []) => {
    const tags = [];

    if (columns.some((column) => column.summary?.missingCount > 0)) {
        tags.push('Missing data');
    }

    if (columns.some((column) => column.derived)) {
        tags.push('Derived vars');
    }

    if (columns.some((column) => (column.summary?.issues || []).includes('Non-numeric entries'))) {
        tags.push('Type warnings');
    }

    if (!tags.length) {
        tags.push('Ready to analyze');
    }

    return tags;
};

const buildAutoTags = ({ column, summary }) => {
    const tags = [];
    const transformType = column.transform?.type;

    tags.push(column.derived ? 'derived' : 'original');

    if (summary?.detectedType === 'numeric') {
        tags.push('numeric');
    } else if (summary?.detectedType === 'categorical') {
        tags.push('categorical');
    } else if (summary?.detectedType === 'date') {
        tags.push('date');
    } else if (summary?.detectedType === 'text') {
        tags.push('text');
    }

    if ((summary?.issues || []).includes('Identifier')) {
        tags.push('identifier');
    }

    if (transformType === 'reverse_code') {
        tags.push('reverse coded');
    }

    if (transformType === 'recode') {
        tags.push('recoded');
    }

    if (transformType === 'center') {
        tags.push('centered');
    }

    if ((transformType === 'mean' || transformType === 'sum') && (column.transform?.sourceColumnIds || []).length >= 2) {
        tags.push('scale score');
    }

    if (transformType === 'wide_to_long_key' || transformType === 'wide_to_long_value') {
        tags.push('reshaped');
    }

    return normalizeTagList(tags);
};

export const getDatasetColumn = (dataset, columnId) =>
    dataset?.columns?.find((column) => column.id === columnId) || null;

export const getDatasetColumnValues = (dataset, columnId) =>
    (dataset?.rows || []).map((row) => row?.[columnId] ?? null);

const cloneRows = (rows = []) => rows.map((row) => ({ ...row }));

export const refreshDatasetMetadata = (dataset, { touch = true } = {}) => {
    const rows = cloneRows(dataset?.rows || []);
    const preparedColumns = dedupeColumnLabels(
        (dataset?.columns || []).map((column, index) => ({
            id: column.id || createId('column'),
            index,
            originalName: String(column.originalName ?? column.label ?? column.name ?? `Column ${index + 1}`),
            name: column.name || column.id || `column_${index + 1}`,
            label: column.label ?? column.originalName ?? `Column ${index + 1}`,
            derived: Boolean(column.derived),
            transform: column.transform || { type: 'import' },
            manualTags: normalizeTagList(column.manualTags || []),
            hiddenAutoTags: normalizeTagList(column.hiddenAutoTags || []),
        }))
    );

    const columns = preparedColumns.map((column, index) => {
        const values = rows.map((row) => row?.[column.id] ?? null);
        const summary = buildColumnSummary({
            values,
            label: column.label,
        });
        const autoTags = buildAutoTags({
            column,
            summary,
        });
        const tags = normalizeTagList([
            ...autoTags.filter((tag) => !column.hiddenAutoTags.includes(tag)),
            ...column.manualTags,
        ]);

        return {
            ...column,
            index,
            sourceKind: column.derived ? 'derived' : 'original',
            autoTags,
            tags,
            summary,
        };
    });

    return {
        id: dataset?.id || createId('dataset'),
        name: String(dataset?.name ?? '').trim() || 'Untitled Dataset',
        sourceType: dataset?.sourceType || 'csv',
        originalFileName: dataset?.originalFileName || null,
        fileType: dataset?.fileType || 'CSV',
        sheetName: dataset?.sheetName || null,
        delimiter: dataset?.delimiter || null,
        hasHeaderRow: Boolean(dataset?.hasHeaderRow),
        createdAt: dataset?.createdAt || new Date().toISOString(),
        updatedAt: touch ? new Date().toISOString() : (dataset?.updatedAt || new Date().toISOString()),
        rowCount: rows.length,
        columnCount: columns.length,
        rows,
        columns,
        statusSummary: buildStatusSummary(columns),
        derivedVariables: columns
            .filter((column) => column.derived)
            .map((column) => ({
                id: column.id,
                label: column.label,
                transform: column.transform,
            })),
    };
};

export const buildDatasetFromGrid = ({
    grid = [],
    datasetId,
    datasetName,
    sourceType = 'csv',
    originalFileName = null,
    fileType = 'CSV',
    sheetName = null,
    delimiter = null,
    hasHeaderRow = true,
    createdAt,
}) => {
    const width = grid.reduce((maxWidth, row) => Math.max(maxWidth, row.length), 0);
    const preparedRows = grid
        .map((row) => {
            const padded = Array.from({ length: width }, (_, index) => normalizeCell(row[index]));
            return padded;
        })
        .filter((row) => row.some((value) => !isMissingValue(value)));

    const headerSource = preparedRows[0] || [];
    const dataRows = hasHeaderRow ? preparedRows.slice(1) : preparedRows;
    const baseColumns = Array.from({ length: width }, (_, index) => ({
        id: createId('column'),
        index,
        name: `column_${index + 1}`,
        originalName: hasHeaderRow
            ? String(headerSource[index] ?? '').trim() || `Column ${index + 1}`
            : `Column ${index + 1}`,
        label: hasHeaderRow
            ? String(headerSource[index] ?? '').trim() || `Column ${index + 1}`
            : `Column ${index + 1}`,
        derived: false,
        transform: { type: 'import' },
    }));
    const columns = dedupeColumnLabels(baseColumns);
    const rows = dataRows.map((row, rowIndex) => {
        const entry = { __rowId: rowIndex };

        columns.forEach((column, columnIndex) => {
            entry[column.id] = row[columnIndex] ?? null;
        });

        return entry;
    });

    return refreshDatasetMetadata({
        id: datasetId || createId('dataset'),
        name: datasetName || stripExtension(originalFileName),
        sourceType,
        originalFileName,
        fileType,
        sheetName,
        delimiter,
        hasHeaderRow,
        createdAt: createdAt || new Date().toISOString(),
        rows,
        columns,
    });
};

export const buildDatasetFromDelimitedText = ({
    text,
    datasetName,
    sourceType = 'csv',
    originalFileName = null,
    fileType = 'CSV',
}) => {
    const parsed = parseDelimitedTextGrid(text);

    if (!parsed.ok) {
        return parsed;
    }

    return {
        ok: true,
        dataset: buildDatasetFromGrid({
            grid: parsed.grid,
            datasetName,
            sourceType,
            originalFileName,
            fileType,
            delimiter: parsed.delimiter,
            hasHeaderRow: parsed.suggestedHeader,
        }),
        delimiter: parsed.delimiter,
        suggestedHeader: parsed.suggestedHeader,
    };
};

export const renameDatasetRecord = (dataset, nextName) => refreshDatasetMetadata({
    ...dataset,
    name: String(nextName ?? '').trim() || dataset?.name || 'Untitled Dataset',
});

export const updateDatasetColumnLabel = (dataset, columnId, nextLabel) => refreshDatasetMetadata({
    ...dataset,
    columns: (dataset?.columns || []).map((column) => (
        column.id === columnId
            ? { ...column, label: String(nextLabel ?? '').trim() || column.originalName || column.label }
            : column
    )),
});

export const updateDatasetColumnTags = (dataset, columnId, { manualTags, hiddenAutoTags }) => refreshDatasetMetadata({
    ...dataset,
    columns: (dataset?.columns || []).map((column) => (
        column.id === columnId
            ? {
                ...column,
                manualTags: normalizeTagList(manualTags ?? column.manualTags ?? []),
                hiddenAutoTags: normalizeTagList(hiddenAutoTags ?? column.hiddenAutoTags ?? []),
            }
            : column
    )),
});

export const deleteDatasetColumn = (dataset, columnId) => {
    const nextColumns = (dataset?.columns || []).filter((column) => column.id !== columnId);
    const nextRows = (dataset?.rows || []).map((row, rowIndex) => {
        const nextRow = {
            __rowId: rowIndex,
        };

        nextColumns.forEach((column) => {
            nextRow[column.id] = row?.[column.id] ?? null;
        });

        return nextRow;
    });

    return refreshDatasetMetadata({
        ...dataset,
        columns: nextColumns,
        rows: nextRows,
    });
};

export const duplicateDatasetRecord = (dataset) => {
    const columnMap = Object.fromEntries(
        (dataset?.columns || []).map((column) => [column.id, createId('column')])
    );

    return refreshDatasetMetadata({
        ...dataset,
        id: createId('dataset'),
        name: `${dataset?.name || 'Dataset'} Copy`,
        createdAt: new Date().toISOString(),
        rows: rebuildRowsForColumnIds({
            dataset,
            columnMap,
        }),
        columns: (dataset?.columns || []).map((column) => ({
            ...column,
            id: columnMap[column.id],
        })),
    });
};

const rebuildRowsForColumnIds = ({ dataset, columnMap }) =>
    (dataset?.rows || []).map((row, rowIndex) => {
        const nextRow = { __rowId: rowIndex };

        Object.entries(columnMap).forEach(([oldId, newId]) => {
            nextRow[newId] = row?.[oldId] ?? null;
        });

        return nextRow;
    });

export const hydrateStoredDataset = (dataset, { touch = false } = {}) => {
    const columnMap = Object.fromEntries(
        (dataset?.columns || []).map((column) => [column.id, column.id || createId('column')])
    );

    const hydratedRows = rebuildRowsForColumnIds({
        dataset,
        columnMap,
    });

    return refreshDatasetMetadata({
        ...dataset,
        rows: hydratedRows,
        columns: (dataset?.columns || []).map((column) => ({
            ...column,
            id: columnMap[column.id],
        })),
        createdAt: dataset?.createdAt || new Date().toISOString(),
    }, { touch });
};

const buildDerivedLabel = ({ operation, columns, dataset, outputLabel }) => {
    if (String(outputLabel ?? '').trim()) {
        return String(outputLabel).trim();
    }

    const selected = columns
        .map((columnId) => getDatasetColumn(dataset, columnId)?.label)
        .filter(Boolean);

    if (!selected.length) {
        return 'Derived Variable';
    }

    switch (operation) {
        case 'duplicate':
            return `${selected[0]} Copy`;
        case 'sum':
            return `${selected.join(' + ')} Sum`;
        case 'mean':
            return `${selected.join(' + ')} Mean`;
        case 'difference':
            return `${selected[0]} - ${selected[1]}`;
        case 'add':
            return `${selected[0]} + ${selected[1]}`;
        case 'standardize':
            return `${selected[0]} (z)`;
        case 'center':
            return `${selected[0]} Centered`;
        case 'recode':
            return `${selected[0]} Recoded`;
        case 'reverse_code':
            return `${selected[0]} Reverse Coded`;
        default:
            return 'Derived Variable';
    }
};

const getNumericSeries = (dataset, columnId) => getDatasetColumnValues(dataset, columnId).map(parseNumericValue);

const buildDerivedValues = ({
    dataset,
    operation,
    columns = [],
    mappings = {},
    minimum = null,
    maximum = null,
}) => {
    if (!columns.length) {
        return [];
    }

    if (operation === 'duplicate') {
        return getDatasetColumnValues(dataset, columns[0]);
    }

    if (operation === 'sum' || operation === 'mean') {
        return (dataset?.rows || []).map((row) => {
            const numericValues = columns.map((columnId) => parseNumericValue(row?.[columnId]));

            if (numericValues.some((value) => value == null)) {
                return null;
            }

            const total = numericValues.reduce((sum, value) => sum + value, 0);
            return operation === 'mean' ? roundTo(total / numericValues.length, 6) : roundTo(total, 6);
        });
    }

    if (operation === 'difference' || operation === 'add') {
        return (dataset?.rows || []).map((row) => {
            const left = parseNumericValue(row?.[columns[0]]);
            const right = parseNumericValue(row?.[columns[1]]);

            if (left == null || right == null) {
                return null;
            }

            return operation === 'difference'
                ? roundTo(left - right, 6)
                : roundTo(left + right, 6);
        });
    }

    if (operation === 'standardize' || operation === 'center') {
        const sourceSeries = getNumericSeries(dataset, columns[0]);
        const valid = sourceSeries.filter((value) => value != null);

        if (!valid.length) {
            return sourceSeries.map(() => null);
        }

        const mean = valid.reduce((sum, value) => sum + value, 0) / valid.length;
        const variance = valid.length > 1
            ? valid.reduce((sum, value) => sum + ((value - mean) ** 2), 0) / (valid.length - 1)
            : 0;
        const sd = Math.sqrt(Math.max(variance, 0));

        return sourceSeries.map((value) => {
            if (value == null) {
                return null;
            }

            if (operation === 'center') {
                return roundTo(value - mean, 6);
            }

            if (!(sd > 0)) {
                return 0;
            }

            return roundTo((value - mean) / sd, 6);
        });
    }

    if (operation === 'recode') {
        return getDatasetColumnValues(dataset, columns[0]).map((value) => {
            if (isMissingValue(value)) {
                return null;
            }

            const key = String(value);
            return String(mappings?.[key] ?? value).trim() || null;
        });
    }

    if (operation === 'reverse_code') {
        return getDatasetColumnValues(dataset, columns[0]).map((value) => {
            const numeric = parseNumericValue(value);

            if (numeric == null || minimum == null || maximum == null) {
                return null;
            }

            return roundTo(maximum + minimum - numeric, 6);
        });
    }

    return [];
};

const replaceDatasetColumnValues = ({
    dataset,
    columnId,
    values,
    label,
    derived = true,
    transform,
}) => {
    const nextRows = (dataset?.rows || []).map((row, rowIndex) => ({
        ...row,
        __rowId: rowIndex,
        [columnId]: values[rowIndex] ?? null,
    }));

    const nextColumns = (dataset?.columns || []).map((column) => (
        column.id === columnId
            ? {
                ...column,
                label: label || column.label,
                derived,
                transform,
            }
            : column
    ));

    return refreshDatasetMetadata({
        ...dataset,
        rows: nextRows,
        columns: nextColumns,
    });
};

export const addDerivedVariableToDataset = (dataset, config) => {
    const operation = config?.operation;
    const columns = Array.isArray(config?.columns) ? config.columns.filter(Boolean) : [];

    const values = buildDerivedValues({
        dataset,
        operation,
        columns,
        mappings: config?.mappings,
        minimum: config?.minimum,
        maximum: config?.maximum,
    });

    const nextColumn = {
        id: createId('column'),
        name: `column_${(dataset?.columns?.length || 0) + 1}`,
        originalName: buildDerivedLabel({
            operation,
            columns,
            dataset,
            outputLabel: config?.outputLabel,
        }),
        label: buildDerivedLabel({
            operation,
            columns,
            dataset,
            outputLabel: config?.outputLabel,
        }),
        derived: true,
        transform: {
            type: operation,
            sourceColumnIds: columns,
        },
    };

    const rows = (dataset?.rows || []).map((row, rowIndex) => ({
        ...row,
        __rowId: rowIndex,
        [nextColumn.id]: values[rowIndex] ?? null,
    }));

    return refreshDatasetMetadata({
        ...dataset,
        rows,
        columns: [...(dataset?.columns || []), nextColumn],
    });
};

export const reverseCodeDatasetVariable = (dataset, {
    sourceColumnId,
    minimum,
    maximum,
    outputLabel,
    overwrite = false,
}) => {
    const values = buildDerivedValues({
        dataset,
        operation: 'reverse_code',
        columns: [sourceColumnId],
        minimum,
        maximum,
    });

    if (overwrite) {
        return replaceDatasetColumnValues({
            dataset,
            columnId: sourceColumnId,
            values,
            label: outputLabel || getDatasetColumn(dataset, sourceColumnId)?.label,
            derived: true,
            transform: {
                type: 'reverse_code',
                sourceColumnIds: [sourceColumnId],
                minimum,
                maximum,
                overwrite: true,
            },
        });
    }

    return addDerivedVariableToDataset(dataset, {
        operation: 'reverse_code',
        columns: [sourceColumnId],
        outputLabel,
        minimum,
        maximum,
    });
};

export const recodeDatasetVariable = (dataset, {
    sourceColumnId,
    mappings,
    outputLabel,
    overwrite = false,
}) => {
    const values = buildDerivedValues({
        dataset,
        operation: 'recode',
        columns: [sourceColumnId],
        mappings,
    });

    if (overwrite) {
        return replaceDatasetColumnValues({
            dataset,
            columnId: sourceColumnId,
            values,
            label: outputLabel || getDatasetColumn(dataset, sourceColumnId)?.label,
            derived: true,
            transform: {
                type: 'recode',
                sourceColumnIds: [sourceColumnId],
                overwrite: true,
            },
        });
    }

    return addDerivedVariableToDataset(dataset, {
        operation: 'recode',
        columns: [sourceColumnId],
        outputLabel,
        mappings,
    });
};

export const meanCenterDatasetVariable = (dataset, { sourceColumnId, outputLabel }) =>
    addDerivedVariableToDataset(dataset, {
        operation: 'center',
        columns: [sourceColumnId],
        outputLabel,
    });

export const meanCenterDatasetVariables = (dataset, columnIds = []) => columnIds.reduce(
    (currentDataset, columnId) => meanCenterDatasetVariable(currentDataset, {
        sourceColumnId: columnId,
        outputLabel: `${getDatasetColumn(currentDataset, columnId)?.label || 'variable'}_centered`,
    }),
    dataset
);

export const reshapeWideToLongDataset = (dataset, {
    pivotColumnIds = [],
    idColumnIds = [],
    keyColumnLabel = 'variable',
    valueColumnLabel = 'value',
}) => {
    const pivotColumns = pivotColumnIds
        .map((columnId) => getDatasetColumn(dataset, columnId))
        .filter(Boolean);
    const idColumns = idColumnIds
        .map((columnId) => getDatasetColumn(dataset, columnId))
        .filter(Boolean);

    const keyColumnId = createId('column');
    const valueColumnId = createId('column');
    const nextRows = [];

    (dataset?.rows || []).forEach((row) => {
        pivotColumns.forEach((pivotColumn) => {
            const nextRow = {
                __rowId: nextRows.length,
                [keyColumnId]: pivotColumn.label,
                [valueColumnId]: row?.[pivotColumn.id] ?? null,
            };

            idColumns.forEach((idColumn) => {
                nextRow[idColumn.id] = row?.[idColumn.id] ?? null;
            });

            nextRows.push(nextRow);
        });
    });

    return refreshDatasetMetadata({
        ...dataset,
        name: `${dataset?.name || 'Dataset'} Long`,
        rows: nextRows,
        columns: [
            ...idColumns.map((column) => ({
                ...column,
                transform: column.transform || { type: 'import' },
            })),
            {
                id: keyColumnId,
                name: 'long_key',
                originalName: keyColumnLabel,
                label: keyColumnLabel,
                derived: true,
                transform: { type: 'wide_to_long_key', sourceColumnIds: pivotColumnIds },
            },
            {
                id: valueColumnId,
                name: 'long_value',
                originalName: valueColumnLabel,
                label: valueColumnLabel,
                derived: true,
                transform: { type: 'wide_to_long_value', sourceColumnIds: pivotColumnIds },
            },
        ],
    });
};

export const getDatasetVariableOptions = (dataset, allowedTypes = []) =>
    (dataset?.columns || []).filter((column) => (
        !allowedTypes.length || allowedTypes.includes(column.summary?.detectedType)
    ));

export const getRecommendedVariableGroups = (dataset) => {
    const groups = new Map();

    (dataset?.columns || []).forEach((column) => {
        const candidateNames = normalizeTagList([
            column.originalName,
            column.label,
        ]);

        candidateNames.forEach((candidateName) => {
            const match = String(candidateName).trim().match(/^(.*?)(?:[_\-\s]?)(\d+)$/i);

            if (!match || match[1].trim().length < 2) {
                return;
            }

            const key = match[1].trim().toLowerCase();
            const current = groups.get(key) || {
                id: key,
                prefix: match[1].trim(),
                columns: [],
                seenColumnIds: new Set(),
            };

            if (!current.seenColumnIds.has(column.id)) {
                current.columns.push(column);
                current.seenColumnIds.add(column.id);
            }

            groups.set(key, current);
        });
    });

    return Array.from(groups.values())
        .filter((group) => group.columns.length >= 2)
        .map((group) => ({
            ...group,
            columns: group.columns.sort((left, right) => left.label.localeCompare(right.label, undefined, { numeric: true })),
            numericOnly: group.columns.every((column) => column.summary?.detectedType === 'numeric'),
        }))
        .sort((left, right) => right.columns.length - left.columns.length);
};

export const buildNumericAnalysisColumn = (dataset, columnId) => {
    const column = getDatasetColumn(dataset, columnId);

    if (!column) {
        return null;
    }

    return {
        id: column.id,
        name: column.label,
        label: column.label,
        originalName: column.originalName,
        numericValues: getDatasetColumnValues(dataset, column.id).map(parseNumericValue),
        values: getDatasetColumnValues(dataset, column.id),
    };
};

export const buildDatasetExportRows = (dataset) => {
    const columns = dataset?.columns || [];

    return (dataset?.rows || []).map((row) => Object.fromEntries(
        columns.map((column) => [column.label, row?.[column.id] ?? null])
    ));
};

export const buildDatasetCsv = (dataset) => {
    const columns = dataset?.columns || [];
    const escapeValue = (value) => {
        const text = formatDatasetValue(value);

        if (/[",\n]/.test(text)) {
            return `"${text.replace(/"/g, '""')}"`;
        }

        return text;
    };

    const lines = [
        columns.map((column) => escapeValue(column.label)).join(','),
        ...(dataset?.rows || []).map((row) => columns.map((column) => escapeValue(row?.[column.id] ?? null)).join(',')),
    ];

    return lines.join('\n');
};

export const countCompleteRows = (dataset, columnIds = [], numericOnly = false) => {
    const rows = dataset?.rows || [];

    if (!columnIds.length) {
        return {
            total: rows.length,
            usable: 0,
            dropped: rows.length,
        };
    }

    const usable = rows.filter((row) => columnIds.every((columnId) => {
        const value = row?.[columnId];
        return numericOnly ? parseNumericValue(value) != null : !isMissingValue(value);
    })).length;

    return {
        total: rows.length,
        usable,
        dropped: Math.max(0, rows.length - usable),
    };
};

export const formatDatasetValue = (value) => {
    if (value == null) {
        return '';
    }

    if (typeof value === 'number') {
        return Number.isFinite(value) ? `${value}` : '';
    }

    return String(value);
};
