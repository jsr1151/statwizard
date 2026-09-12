import { getDatasetColumnValues, isMissingValue, parseNumericValue } from './datasetImport.js';
import { ANALYSIS_OPTIONS } from '../data/dataManagerOptions.js';

export const buildDefaultDerivedDraft = () => ({
    operation: 'duplicate',
    columns: [],
    outputLabel: '',
});

export const buildDefaultReverseCodeDraft = () => ({
    sourceColumnId: '',
    minimum: '',
    maximum: '',
    outputLabel: '',
    overwrite: false,
});

export const buildDefaultRecodeDraft = () => ({
    sourceColumnId: '',
    outputLabel: '',
    overwrite: false,
    mappings: {},
});

export const buildDefaultMeanCenterDraft = () => ({
    sourceColumnId: '',
    outputLabel: '',
});

export const buildDefaultReshapeDraft = () => ({
    mode: 'smart_groups',
    pivotColumnIds: [],
    idColumnIds: [],
    keyColumnLabel: '',
    valueColumnLabel: 'value',
    smartCandidateId: '',
    selectedMeasureGroupIds: [],
    allowMultipleMeasureGroups: true,
    keyValueOverrides: {},
});

export const stripExtension = (fileName = '') =>
    String(fileName).replace(/\.[^/.]+$/, '').trim() || 'Imported Dataset';

export const formatTimestamp = (value) => {
    const parsed = new Date(value);

    if (!Number.isFinite(parsed.getTime())) {
        return 'Just now';
    }

    return parsed.toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    });
};

export const INVALID_FILENAME_CHARACTERS = new Set('<>:"/\\|?*');

export const sanitizeFileName = (value = 'dataset') => {
    const sanitized = String(value)
        .trim()
        .split('')
        .map((character) => (
            character.charCodeAt(0) <= 31 || INVALID_FILENAME_CHARACTERS.has(character)
                ? '_'
                : character
        ))
        .join('')
        .replace(/\s+/g, '_');

    return sanitized || 'dataset';
};

export const normalizeSearch = (value) => String(value ?? '').trim().toLowerCase();

export const matchesColumnSearch = (column, query) => {
    if (!query) {
        return true;
    }

    const haystack = [
        column.label,
        column.originalName,
        ...(column.tags || []),
        ...(column.summary?.issues || []),
    ].join(' ').toLowerCase();

    return haystack.includes(query.toLowerCase());
};

export const getObservedBounds = (dataset, columnId) => {
    const values = getDatasetColumnValues(dataset, columnId)
        .map(parseNumericValue)
        .filter((value) => value != null);

    if (!values.length) {
        return {
            min: null,
            max: null,
        };
    }

    return {
        min: Math.min(...values),
        max: Math.max(...values),
    };
};

export const buildReversePreviewRows = (dataset, columnId, minimum, maximum) => {
    if (!columnId || minimum == null || maximum == null) {
        return [];
    }

    return getDatasetColumnValues(dataset, columnId)
        .map((value) => {
            const numeric = parseNumericValue(value);

            if (numeric == null) {
                return null;
            }

            return {
                oldValue: numeric,
                newValue: Number(maximum) + Number(minimum) - numeric,
            };
        })
        .filter(Boolean)
        .slice(0, 6);
};

export const buildRecodePreviewRows = (dataset, columnId, mappings) => {
    if (!columnId) {
        return [];
    }

    const counts = new Map();

    getDatasetColumnValues(dataset, columnId)
        .filter((value) => !isMissingValue(value))
        .forEach((value) => {
            const oldValue = String(value);
            const newValue = String(mappings?.[oldValue] ?? oldValue).trim() || '(missing)';
            const key = `${oldValue}__${newValue}`;
            counts.set(key, {
                oldValue,
                newValue,
                count: (counts.get(key)?.count || 0) + 1,
            });
        });

    return Array.from(counts.values()).sort((left, right) => right.count - left.count);
};

export const getAnalysisCompatibility = (dataset) => {
    const numericCount = (dataset?.columns || []).filter((column) => column.summary?.detectedType === 'numeric').length;
    const categoricalColumns = (dataset?.columns || []).filter((column) => ['categorical', 'text'].includes(column.summary?.detectedType));
    const categoricalCount = categoricalColumns.filter((column) => (column.summary?.uniqueCount || 0) >= 2).length;
    const binaryCategoricalCount = categoricalColumns.filter((column) => (column.summary?.uniqueCount || 0) === 2).length;

    return ANALYSIS_OPTIONS.map((analysis) => ({
        ...analysis,
        compatible: analysis.isCompatible({
            numericCount,
            categoricalCount,
            binaryCategoricalCount,
        }),
        detail: analysis.buildDetail({
            numericCount,
            categoricalCount,
            binaryCategoricalCount,
        }),
    })).sort((left, right) => Number(right.compatible) - Number(left.compatible));
};
