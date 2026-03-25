import React, { useEffect, useMemo, useState } from 'react';
import {
    AlertTriangle,
    ArrowRight,
    CheckCircle2,
    Copy,
    Database,
    Download,
    FileUp,
    FlaskConical,
    Layers3,
    MoveVertical,
    RotateCcw,
    Save,
    Sparkles,
    Table2,
    Trash2,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useDatasetLibraryContext } from '../../hooks/useDatasetLibrary.js';
import DataTransformWorkbench from './DataTransformWorkbench.jsx';
import VariableBrowser from './VariableBrowser.jsx';
import {
    addDerivedVariableToDataset,
    autoDetectHeaderRow,
    buildSmartWideToLongReshapePlan,
    buildDatasetCsv,
    buildDatasetFromColumnRecords,
    buildDatasetExportRows,
    buildDatasetFromGrid,
    deleteDatasetColumn,
    formatDatasetValue,
    getDatasetColumn,
    getDatasetColumnValues,
    getRecommendedLongFormatCandidates,
    getRecommendedVariableGroups,
    hydrateStoredDataset,
    isMissingValue,
    meanCenterDatasetVariable,
    meanCenterDatasetVariables,
    parseDelimitedTextGrid,
    parseNumericValue,
    recodeDatasetVariable,
    refreshDatasetMetadata,
    renameDatasetRecord,
    reshapeWideToLongDataset,
    reverseCodeDatasetVariable,
    updateDatasetColumnTags,
} from '../../utils/datasetImport.js';
import { inferAnalysisLaunchSelection, writeAnalysisLaunchPayload } from '../../utils/analysisLaunch.js';

const DERIVED_OPERATION_OPTIONS = [
    { id: 'duplicate', label: 'Duplicate variable', needsNumeric: false, mode: 'single' },
    { id: 'sum', label: 'Sum selected variables', needsNumeric: true, mode: 'multi' },
    { id: 'mean', label: 'Average selected variables', needsNumeric: true, mode: 'multi' },
    { id: 'difference', label: 'Difference (A - B)', needsNumeric: true, mode: 'pair' },
    { id: 'add', label: 'Add (A + B)', needsNumeric: true, mode: 'pair' },
    { id: 'standardize', label: 'Standardize to z-score', needsNumeric: true, mode: 'single' },
];

const buildDefaultDerivedDraft = () => ({
    operation: 'duplicate',
    columns: [],
    outputLabel: '',
});

const buildDefaultReverseCodeDraft = () => ({
    sourceColumnId: '',
    minimum: '',
    maximum: '',
    outputLabel: '',
    overwrite: false,
});

const buildDefaultRecodeDraft = () => ({
    sourceColumnId: '',
    outputLabel: '',
    overwrite: false,
    mappings: {},
});

const buildDefaultMeanCenterDraft = () => ({
    sourceColumnId: '',
    outputLabel: '',
});

const buildDefaultReshapeDraft = () => ({
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

const ANALYSIS_OPTIONS = [
    {
        id: 'pearson_correlation',
        label: 'Pearson Correlation',
        summary: 'Load two numeric variables into the correlation calculator.',
        isCompatible: ({ numericCount }) => numericCount >= 2,
        buildDetail: ({ numericCount }) => `${numericCount} numeric variable${numericCount === 1 ? '' : 's'} detected.`,
    },
    {
        id: 'multiple_regression',
        label: 'Multiple Regression',
        summary: 'Load one numeric outcome plus at least two numeric predictors into the regression calculator.',
        isCompatible: ({ numericCount }) => numericCount >= 3,
        buildDetail: ({ numericCount }) => `${numericCount} numeric variable${numericCount === 1 ? '' : 's'} detected.`,
    },
    {
        id: 'independent_t_test',
        label: 'Independent Samples t-Test',
        summary: 'Load one numeric outcome plus one categorical grouping variable with exactly 2 levels.',
        isCompatible: ({ numericCount, binaryCategoricalCount }) => numericCount >= 1 && binaryCategoricalCount >= 1,
        buildDetail: ({ numericCount, binaryCategoricalCount }) => `${numericCount} numeric and ${binaryCategoricalCount} binary grouping variable${binaryCategoricalCount === 1 ? '' : 's'} detected.`,
    },
    {
        id: 'paired_t_test',
        label: 'Paired Samples t-Test',
        summary: 'Load two numeric variables into the paired-samples calculator.',
        isCompatible: ({ numericCount }) => numericCount >= 2,
        buildDetail: ({ numericCount }) => `${numericCount} numeric variable${numericCount === 1 ? '' : 's'} detected.`,
    },
    {
        id: 'one_way_anova',
        label: 'One-Way ANOVA',
        summary: 'Load one numeric outcome plus one categorical grouping variable with 2 or more levels.',
        isCompatible: ({ numericCount, categoricalCount }) => numericCount >= 1 && categoricalCount >= 1,
        buildDetail: ({ numericCount, categoricalCount }) => `${numericCount} numeric and ${categoricalCount} categorical variable${categoricalCount === 1 ? '' : 's'} detected.`,
    },
    {
        id: 'ancova',
        label: 'ANCOVA',
        summary: 'Load one numeric outcome, one categorical grouping variable, and one numeric covariate.',
        isCompatible: ({ numericCount, categoricalCount }) => numericCount >= 2 && categoricalCount >= 1,
        buildDetail: ({ numericCount, categoricalCount }) => `${numericCount} numeric and ${categoricalCount} categorical variable${categoricalCount === 1 ? '' : 's'} detected.`,
    },
    {
        id: 'factorial_anova',
        label: 'Factorial ANOVA',
        summary: 'Load one numeric outcome plus two categorical factors into the factorial ANOVA calculator.',
        isCompatible: ({ numericCount, categoricalCount }) => numericCount >= 1 && categoricalCount >= 2,
        buildDetail: ({ numericCount, categoricalCount }) => `${numericCount} numeric and ${categoricalCount} categorical variable${categoricalCount === 1 ? '' : 's'} detected.`,
    },
];

const stripExtension = (fileName = '') =>
    String(fileName).replace(/\.[^/.]+$/, '').trim() || 'Imported Dataset';

const formatTimestamp = (value) => {
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

const sanitizeFileName = (value = 'dataset') =>
    String(value)
        .trim()
        .replace(/[<>:"/\\|?*\x00-\x1F]/g, '_')
        .replace(/\s+/g, '_')
    || 'dataset';

const UNDO_HISTORY_LIMIT = 30;

const normalizeSearch = (value) => String(value ?? '').trim().toLowerCase();

const matchesColumnSearch = (column, query) => {
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

const getObservedBounds = (dataset, columnId) => {
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

const buildReversePreviewRows = (dataset, columnId, minimum, maximum) => {
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

const buildRecodePreviewRows = (dataset, columnId, mappings) => {
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

const getAnalysisCompatibility = (dataset) => {
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

const Card = ({ darkMode, children, className = '' }) => (
    <div className={`rounded-2xl border p-6 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} ${className}`}>
        {children}
    </div>
);

const TonePill = ({ darkMode, children, tone = 'default' }) => {
    const toneClass = tone === 'warning'
        ? (darkMode ? 'bg-amber-500/10 text-amber-200 border-amber-500/20' : 'bg-amber-50 text-amber-700 border-amber-200')
        : tone === 'primary'
            ? (darkMode ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20' : 'bg-indigo-50 text-indigo-700 border-indigo-200')
            : (darkMode ? 'bg-slate-950 text-slate-400 border-slate-800' : 'bg-slate-50 text-slate-600 border-slate-200');

    return (
        <span className={`inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-widest ${toneClass}`}>
            {children}
        </span>
    );
};

const InfoRow = ({ darkMode, label, value }) => (
    <div className={`rounded-xl border px-4 py-3 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
        <div className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
            {label}
        </div>
        <div className={`mt-2 text-sm font-bold ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
            {value}
        </div>
    </div>
);

const DataManagerPage = ({ darkMode, onOpenAnalysis, onOpenMultipleRegression }) => {
    const {
        datasets,
        isLoading,
        error,
        saveDataset,
        deleteDataset,
        duplicateDataset,
    } = useDatasetLibraryContext();
    const [editorDataset, setEditorDataset] = useState(null);
    const [importSession, setImportSession] = useState(null);
    const [derivedDraft, setDerivedDraft] = useState(buildDefaultDerivedDraft);
    const [reverseCodeDraft, setReverseCodeDraft] = useState(buildDefaultReverseCodeDraft);
    const [recodeDraft, setRecodeDraft] = useState(buildDefaultRecodeDraft);
    const [meanCenterDraft, setMeanCenterDraft] = useState(buildDefaultMeanCenterDraft);
    const [reshapeDraft, setReshapeDraft] = useState(buildDefaultReshapeDraft);
    const [derivedSearchQuery, setDerivedSearchQuery] = useState('');
    const [recommendedConfigs, setRecommendedConfigs] = useState({});
    const [analysisMenuDatasetId, setAnalysisMenuDatasetId] = useState('');
    const [busy, setBusy] = useState(false);
    const [notice, setNotice] = useState('');
    const [problem, setProblem] = useState('');
    const [isDirty, setIsDirty] = useState(false);
    const [undoStack, setUndoStack] = useState([]);

    const activeOperation = useMemo(
        () => DERIVED_OPERATION_OPTIONS.find((option) => option.id === derivedDraft.operation) || DERIVED_OPERATION_OPTIONS[0],
        [derivedDraft.operation]
    );

    const savedDatasetIds = useMemo(() => new Set(datasets.map((dataset) => dataset.id)), [datasets]);
    const editorIsSaved = Boolean(editorDataset && savedDatasetIds.has(editorDataset.id));
    const numericColumns = useMemo(
        () => (editorDataset?.columns || []).filter((column) => column.summary?.detectedType === 'numeric'),
        [editorDataset]
    );
    const categoricalColumns = useMemo(
        () => (editorDataset?.columns || []).filter((column) => ['categorical', 'text'].includes(column.summary?.detectedType)),
        [editorDataset]
    );
    const recommendedGroups = useMemo(
        () => getRecommendedVariableGroups(editorDataset),
        [editorDataset]
    );
    const recommendedWorkbenchGroups = useMemo(() => (
        recommendedGroups.map((group) => {
            const config = recommendedConfigs[group.id] || {};
            const defaultSelectedColumnIds = group.columns.map((column) => column.id);
            const selectedColumnIds = (config.selectedColumnIds || defaultSelectedColumnIds)
                .filter((columnId) => getDatasetColumn(editorDataset, columnId));
            const selectedColumns = selectedColumnIds
                .map((columnId) => getDatasetColumn(editorDataset, columnId))
                .filter(Boolean);
            const reverseColumnIds = (config.reverseColumnIds || []).filter((columnId) => selectedColumnIds.includes(columnId));
            const sourcePool = group.numericOnly ? numericColumns : (editorDataset?.columns || []);
            const availableColumns = sourcePool.filter((column) => !selectedColumnIds.includes(column.id));
            const bounds = selectedColumns.reduce((accumulator, column) => {
                const numericBounds = getObservedBounds(editorDataset, column.id);

                return {
                    min: accumulator.min == null ? numericBounds.min : Math.min(accumulator.min, numericBounds.min ?? accumulator.min),
                    max: accumulator.max == null ? numericBounds.max : Math.max(accumulator.max, numericBounds.max ?? accumulator.max),
                };
            }, { min: null, max: null });

            return {
                ...group,
                selectedColumnIds,
                selectedColumns,
                availableColumns,
                reverseColumnIds,
                minimum: config.minimum ?? bounds.min ?? '',
                maximum: config.maximum ?? bounds.max ?? '',
                bounds,
            };
        })
    ), [editorDataset, numericColumns, recommendedConfigs, recommendedGroups]);
    const derivedOptions = useMemo(() => {
        const sourceColumns = activeOperation.needsNumeric ? numericColumns : (editorDataset?.columns || []);
        return sourceColumns.filter((column) => matchesColumnSearch(column, derivedSearchQuery));
    }, [activeOperation.needsNumeric, derivedSearchQuery, editorDataset?.columns, numericColumns]);
    const recodeLevels = useMemo(() => {
        if (!editorDataset || !recodeDraft.sourceColumnId) {
            return [];
        }

        return [...new Set(
            getDatasetColumnValues(editorDataset, recodeDraft.sourceColumnId)
                .filter((value) => !isMissingValue(value))
                .map((value) => String(value))
        )].sort((left, right) => left.localeCompare(right, undefined, { numeric: true }));
    }, [editorDataset, recodeDraft.sourceColumnId]);
    const reverseBounds = useMemo(
        () => getObservedBounds(editorDataset, reverseCodeDraft.sourceColumnId),
        [editorDataset, reverseCodeDraft.sourceColumnId]
    );
    const reverseCodePreviewRows = useMemo(() => {
        const minimum = reverseCodeDraft.minimum === '' ? null : Number(reverseCodeDraft.minimum);
        const maximum = reverseCodeDraft.maximum === '' ? null : Number(reverseCodeDraft.maximum);
        return buildReversePreviewRows(editorDataset, reverseCodeDraft.sourceColumnId, minimum, maximum);
    }, [editorDataset, reverseCodeDraft.maximum, reverseCodeDraft.minimum, reverseCodeDraft.sourceColumnId]);
    const recodePreviewRows = useMemo(
        () => buildRecodePreviewRows(editorDataset, recodeDraft.sourceColumnId, recodeDraft.mappings),
        [editorDataset, recodeDraft.mappings, recodeDraft.sourceColumnId]
    );
    const reshapeCandidates = useMemo(
        () => getRecommendedLongFormatCandidates(editorDataset),
        [editorDataset]
    );
    const selectedReshapeCandidate = useMemo(
        () => reshapeCandidates.find((candidate) => candidate.id === reshapeDraft.smartCandidateId) || reshapeCandidates[0] || null,
        [reshapeCandidates, reshapeDraft.smartCandidateId]
    );
    const reshapeRepeatedColumnIds = useMemo(
        () => Array.from(new Set(reshapeCandidates.flatMap((candidate) => candidate.allColumnIds))),
        [reshapeCandidates]
    );
    const reshapePlan = useMemo(() => {
        if (!editorDataset || !selectedReshapeCandidate) {
            return null;
        }

        return buildSmartWideToLongReshapePlan(editorDataset, {
            candidate: selectedReshapeCandidate,
            selectedMeasureGroupIds: reshapeDraft.selectedMeasureGroupIds,
            keyColumnLabel: reshapeDraft.keyColumnLabel,
            keyValueOverrides: reshapeDraft.keyValueOverrides,
            carryForwardColumnIds: (editorDataset?.columns || [])
                .filter((column) => !reshapeRepeatedColumnIds.includes(column.id))
                .map((column) => column.id),
        });
    }, [
        editorDataset,
        reshapeDraft.keyColumnLabel,
        reshapeDraft.keyValueOverrides,
        reshapeDraft.selectedMeasureGroupIds,
        reshapeRepeatedColumnIds,
        selectedReshapeCandidate,
    ]);
    const reshapePreviewDataset = useMemo(() => {
        if (!editorDataset || !reshapePlan?.ok) {
            return null;
        }

        return reshapeWideToLongDataset(editorDataset, {
            keyColumnLabel: reshapeDraft.keyColumnLabel || selectedReshapeCandidate?.dimensionLabel || 'Timepoint',
            mode: 'smart_groups',
            analysis: reshapePlan,
        });
    }, [editorDataset, reshapeDraft.keyColumnLabel, reshapePlan, selectedReshapeCandidate?.dimensionLabel]);
    const analysisMenuDataset = useMemo(() => {
        if (!analysisMenuDatasetId) {
            return null;
        }

        if (editorDataset?.id === analysisMenuDatasetId) {
            return editorDataset;
        }

        return datasets.find((dataset) => dataset.id === analysisMenuDatasetId) || null;
    }, [analysisMenuDatasetId, datasets, editorDataset]);
    const analysisCompatibility = useMemo(
        () => getAnalysisCompatibility(analysisMenuDataset),
        [analysisMenuDataset]
    );
    const previewRows = useMemo(
        () => (editorDataset?.rows || []).slice(0, 24),
        [editorDataset]
    );

    const setFeedback = ({ nextNotice = '', nextProblem = '' }) => {
        setNotice(nextNotice);
        setProblem(nextProblem);
    };

    const clearUndoHistory = () => {
        setUndoStack([]);
    };

    const pushUndoSnapshot = (dataset) => {
        if (!dataset) {
            return;
        }

        const snapshot = hydrateStoredDataset(dataset, { touch: false });

        setUndoStack((previous) => ([
            ...previous.slice(Math.max(0, previous.length - (UNDO_HISTORY_LIMIT - 1))),
            snapshot,
        ]));
    };

    useEffect(() => {
        setReshapeDraft((previous) => {
            const nextCandidate = reshapeCandidates.find((candidate) => candidate.id === previous.smartCandidateId) || reshapeCandidates[0] || null;
            const nextCandidateId = nextCandidate?.id || '';
            const availableMeasureGroupIds = nextCandidate?.measureGroups.map((measureGroup) => measureGroup.id) || [];
            const availableKeyValues = nextCandidate?.keyValues || [];
            let nextSelectedMeasureGroupIds = previous.selectedMeasureGroupIds
                .filter((measureGroupId) => availableMeasureGroupIds.includes(measureGroupId));

            if (!previous.allowMultipleMeasureGroups && nextSelectedMeasureGroupIds.length > 1) {
                nextSelectedMeasureGroupIds = nextSelectedMeasureGroupIds.slice(0, 1);
            }

            if (!nextSelectedMeasureGroupIds.length && availableMeasureGroupIds.length) {
                nextSelectedMeasureGroupIds = previous.allowMultipleMeasureGroups
                    ? availableMeasureGroupIds
                    : [availableMeasureGroupIds[0]];
            }

            const nextKeyColumnLabel = String(previous.keyColumnLabel ?? '').trim()
                && previous.smartCandidateId === nextCandidateId
                ? previous.keyColumnLabel
                : (nextCandidate?.dimensionLabel || '');
            const nextKeyValueOverrides = Object.fromEntries(
                Object.entries(previous.keyValueOverrides || {})
                    .filter(([key]) => availableKeyValues.includes(key))
            );

            if (
                previous.smartCandidateId === nextCandidateId
                && previous.keyColumnLabel === nextKeyColumnLabel
                && Object.keys(previous.keyValueOverrides || {}).length === Object.keys(nextKeyValueOverrides).length
                && Object.entries(previous.keyValueOverrides || {}).every(([key, value]) => nextKeyValueOverrides[key] === value)
                && previous.selectedMeasureGroupIds.length === nextSelectedMeasureGroupIds.length
                && previous.selectedMeasureGroupIds.every((measureGroupId, index) => measureGroupId === nextSelectedMeasureGroupIds[index])
            ) {
                return previous;
            }

            return {
                ...previous,
                smartCandidateId: nextCandidateId,
                keyColumnLabel: nextKeyColumnLabel,
                selectedMeasureGroupIds: nextSelectedMeasureGroupIds,
                keyValueOverrides: nextKeyValueOverrides,
            };
        });
    }, [reshapeCandidates]);

    useEffect(() => {
        const handleKeyDown = (event) => {
            if (!(event.ctrlKey || event.metaKey) || event.altKey || event.shiftKey || event.key.toLowerCase() !== 'z') {
                return;
            }

            const target = event.target;

            if (target instanceof HTMLElement) {
                const tagName = target.tagName;
                const isEditable = target.isContentEditable || tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT';

                if (isEditable) {
                    return;
                }
            }

            if (!undoStack.length || busy) {
                return;
            }

            event.preventDefault();
            handleUndoDatasetEdit();
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [busy, undoStack]);

    const resetTransformDrafts = () => {
        setDerivedDraft(buildDefaultDerivedDraft());
        setReverseCodeDraft(buildDefaultReverseCodeDraft());
        setRecodeDraft(buildDefaultRecodeDraft());
        setMeanCenterDraft(buildDefaultMeanCenterDraft());
        setReshapeDraft(buildDefaultReshapeDraft());
        setDerivedSearchQuery('');
        setRecommendedConfigs({});
    };

    const clearColumnFromDrafts = (columnId) => {
        setDerivedDraft((previous) => ({
            ...previous,
            columns: previous.columns.filter((item) => item !== columnId),
        }));
        setReverseCodeDraft((previous) => previous.sourceColumnId === columnId ? buildDefaultReverseCodeDraft() : previous);
        setRecodeDraft((previous) => previous.sourceColumnId === columnId ? buildDefaultRecodeDraft() : previous);
        setMeanCenterDraft((previous) => previous.sourceColumnId === columnId ? buildDefaultMeanCenterDraft() : previous);
        setReshapeDraft((previous) => ({
            ...previous,
            pivotColumnIds: previous.pivotColumnIds.filter((item) => item !== columnId),
            idColumnIds: previous.idColumnIds.filter((item) => item !== columnId),
        }));
        setRecommendedConfigs((previous) => Object.fromEntries(
            Object.entries(previous).map(([groupId, config]) => [
                groupId,
                {
                    ...config,
                    selectedColumnIds: (config?.selectedColumnIds || []).filter((item) => item !== columnId),
                    reverseColumnIds: (config?.reverseColumnIds || []).filter((item) => item !== columnId),
                },
            ])
        ));
    };

    const updateEditorDataset = (updater) => {
        setEditorDataset((previous) => {
            if (!previous) {
                return previous;
            }

            return typeof updater === 'function' ? updater(previous) : updater;
        });
        setIsDirty(true);
    };

    const applyDatasetEdit = (nextDataset, successMessage) => {
        if (editorDataset) {
            pushUndoSnapshot(editorDataset);
        }

        setEditorDataset(nextDataset);
        setIsDirty(true);
        setFeedback({
            nextNotice: successMessage,
            nextProblem: '',
        });
    };

    const handleUndoDatasetEdit = () => {
        if (!undoStack.length) {
            return;
        }

        const previousDataset = undoStack[undoStack.length - 1];

        setUndoStack((previous) => previous.slice(0, -1));
        setEditorDataset(hydrateStoredDataset(previousDataset, { touch: false }));
        setIsDirty(true);
        setFeedback({
            nextNotice: 'Undid the last dataset edit.',
            nextProblem: '',
        });
    };

    const rebuildEditorFromSession = (session, previousDataset = null) => {
        const activeSheet = session?.sheets?.find((sheet) => sheet.name === session.selectedSheetName) || session?.sheets?.[0];

        if (!activeSheet) {
            setProblem('This file did not contain any readable sheets or rows.');
            return;
        }

        const nextDataset = buildDatasetFromGrid({
            grid: activeSheet.grid,
            datasetId: previousDataset?.id,
            datasetName: session.datasetName,
            sourceType: session.sourceType,
            originalFileName: session.originalFileName,
            fileType: session.fileType,
            sheetName: session.sourceType === 'xlsx' ? activeSheet.name : null,
            delimiter: session.delimiter || null,
            hasHeaderRow: session.hasHeaderRow,
            createdAt: previousDataset?.createdAt,
        });

        clearUndoHistory();
        setEditorDataset(nextDataset);
        setIsDirty(true);
        setFeedback({
            nextNotice: `Prepared ${nextDataset.name} with ${nextDataset.rowCount} rows and ${nextDataset.columnCount} variables.`,
            nextProblem: '',
        });
    };

    const handleFileImport = async (event) => {
        const file = event.target.files?.[0];
        event.target.value = '';

        if (!file) {
            return;
        }

        setBusy(true);
        setFeedback({ nextNotice: '', nextProblem: '' });

        try {
            const lowerName = file.name.toLowerCase();

            if (lowerName.endsWith('.xlsx')) {
                const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array', cellDates: false });
                const sheets = workbook.SheetNames.map((sheetName) => ({
                    name: sheetName,
                    grid: XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
                        header: 1,
                        raw: false,
                        defval: null,
                    }),
                })).filter((sheet) => sheet.grid.some((row) => row.some((value) => !isMissingValue(value))));

                if (!sheets.length) {
                    throw new Error('The Excel workbook did not contain any readable rows.');
                }

                const initialSheet = sheets[0];
                const session = {
                    datasetName: stripExtension(file.name),
                    sourceType: 'xlsx',
                    fileType: 'XLSX',
                    originalFileName: file.name,
                    sheets,
                    selectedSheetName: initialSheet.name,
                    hasHeaderRow: autoDetectHeaderRow(initialSheet.grid[0] || []),
                    delimiter: null,
                };

                setImportSession(session);
                resetTransformDrafts();
                rebuildEditorFromSession(session);
            } else if (lowerName.endsWith('.sav')) {
                const jsavvyModule = await import('jsavvy');
                const Feeder = jsavvyModule.Feeder || jsavvyModule.default?.Feeder;
                const SavParser = jsavvyModule.SavParser || jsavvyModule.default?.SavParser;
                const Savvy = jsavvyModule.default?.Savvy;

                if (!Feeder || !SavParser || !Savvy) {
                    throw new Error('The SPSS importer is installed, but could not be loaded correctly.');
                }

                const parser = new SavParser();
                const parsed = await parser.all(new Feeder(await file.arrayBuffer()));
                const savvyDataset = new Savvy(parsed);
                const nextDataset = buildDatasetFromColumnRecords({
                    datasetName: stripExtension(file.name),
                    sourceType: 'sav',
                    originalFileName: file.name,
                    fileType: 'SPSS (.sav)',
                    hasHeaderRow: true,
                    columns: savvyDataset.keys.map((key) => ({
                        sourceKey: key,
                        name: key,
                        originalName: savvyDataset.names.get(key) || key,
                        label: savvyDataset.labels.get(key) || savvyDataset.names.get(key) || key,
                    })),
                    rows: Array.from({ length: savvyDataset.n }, (_, index) => savvyDataset.row(index)),
                });

                setImportSession(null);
                resetTransformDrafts();
                clearUndoHistory();
                setEditorDataset(nextDataset);
                setIsDirty(true);
                setFeedback({
                    nextNotice: `Imported ${nextDataset.name} from SPSS with ${nextDataset.rowCount} rows and ${nextDataset.columnCount} variables.`,
                    nextProblem: '',
                });
            } else {
                const parsed = parseDelimitedTextGrid(await file.text());

                if (!parsed.ok) {
                    throw new Error(parsed.errors?.[0] || 'The file could not be parsed as CSV-style text.');
                }

                const session = {
                    datasetName: stripExtension(file.name),
                    sourceType: lowerName.endsWith('.tsv') ? 'tsv' : 'csv',
                    fileType: lowerName.endsWith('.tsv') ? 'TSV' : 'CSV',
                    originalFileName: file.name,
                    sheets: [{ name: 'Imported Table', grid: parsed.grid }],
                    selectedSheetName: 'Imported Table',
                    hasHeaderRow: parsed.suggestedHeader,
                    delimiter: parsed.delimiter,
                };

                setImportSession(session);
                resetTransformDrafts();
                rebuildEditorFromSession(session);
            }
        } catch (importError) {
            setProblem(importError instanceof Error ? importError.message : 'Import failed.');
        } finally {
            setBusy(false);
        }
    };

    const handleSaveDataset = async () => {
        if (!editorDataset) {
            return null;
        }

        setBusy(true);
        setFeedback({ nextNotice: '', nextProblem: '' });

        try {
            const saved = await saveDataset(editorDataset);
            setEditorDataset(saved);
            setIsDirty(false);
            setNotice(`${saved.name} was saved locally and is ready across sessions.`);
            return saved;
        } catch (saveError) {
            setProblem(saveError instanceof Error ? saveError.message : 'Could not save the dataset.');
            return null;
        } finally {
            setBusy(false);
        }
    };

    const handleSaveDatasetAsNew = async () => {
        if (!editorDataset) {
            return null;
        }

        setBusy(true);
        setFeedback({ nextNotice: '', nextProblem: '' });

        try {
            const duplicated = await duplicateDataset(editorDataset);
            clearUndoHistory();
            setEditorDataset(duplicated);
            setImportSession(null);
            resetTransformDrafts();
            setIsDirty(false);
            setNotice(`${duplicated.name} was saved as a new dataset.`);
            return duplicated;
        } catch (duplicateError) {
            setProblem(duplicateError instanceof Error ? duplicateError.message : 'Could not save the dataset as a new copy.');
            return null;
        } finally {
            setBusy(false);
        }
    };

    const handleOpenSavedDataset = (dataset) => {
        clearUndoHistory();
        setEditorDataset(hydrateStoredDataset(dataset));
        setImportSession(null);
        resetTransformDrafts();
        setIsDirty(false);
        setFeedback({
            nextNotice: `Opened ${dataset.name}. Adjust variables, transform what you need, then save your updates.`,
            nextProblem: '',
        });
    };

    const handleDeleteDataset = async (dataset) => {
        if (!window.confirm(`Delete ${dataset.name}? This removes the saved dataset from local storage.`)) {
            return;
        }

        setBusy(true);
        setFeedback({ nextNotice: '', nextProblem: '' });

        try {
            await deleteDataset(dataset.id);

            if (editorDataset?.id === dataset.id) {
                setEditorDataset(null);
                setImportSession(null);
                resetTransformDrafts();
                setIsDirty(false);
                clearUndoHistory();
            }

            setNotice(`${dataset.name} was removed from the local library.`);
        } catch (deleteError) {
            setProblem(deleteError instanceof Error ? deleteError.message : 'Could not delete the dataset.');
        } finally {
            setBusy(false);
        }
    };

    const handleDuplicateDataset = async (dataset) => {
        setBusy(true);
        setFeedback({ nextNotice: '', nextProblem: '' });

        try {
            const duplicated = await duplicateDataset(dataset);
            clearUndoHistory();
            setEditorDataset(duplicated);
            setImportSession(null);
            resetTransformDrafts();
            setIsDirty(false);
            setNotice(`Created ${duplicated.name}.`);
        } catch (duplicateError) {
            setProblem(duplicateError instanceof Error ? duplicateError.message : 'Could not duplicate the dataset.');
        } finally {
            setBusy(false);
        }
    };

    const resolveLaunchDataset = async (datasetId) => {
        if (!datasetId) {
            return null;
        }

        let targetDataset = editorDataset?.id === datasetId
            ? editorDataset
            : (datasets.find((dataset) => dataset.id === datasetId) || null);

        if (!targetDataset) {
            return null;
        }

        if (editorDataset?.id === datasetId && (isDirty || !editorIsSaved)) {
            setBusy(true);
            setFeedback({ nextNotice: '', nextProblem: '' });

            try {
                targetDataset = await saveDataset(editorDataset);
                setEditorDataset(targetDataset);
                setIsDirty(false);
            } catch (saveError) {
                setProblem(saveError instanceof Error ? saveError.message : 'Could not save the dataset before launching analysis.');
                return null;
            } finally {
                setBusy(false);
            }
        }

        return targetDataset;
    };

    const openAnalysisDestination = (analysisId) => {
        if (typeof onOpenAnalysis === 'function') {
            onOpenAnalysis(analysisId);
            return;
        }

        if (analysisId === 'multiple_regression') {
            onOpenMultipleRegression?.();
        }
    };

    const handleLaunchAnalysis = async (analysisId) => {
        const targetDataset = await resolveLaunchDataset(analysisMenuDatasetId);

        if (!targetDataset) {
            setProblem('Choose a dataset before launching analysis.');
            return;
        }

        const selection = inferAnalysisLaunchSelection(targetDataset, analysisId);

        writeAnalysisLaunchPayload({
            analysisId,
            datasetId: targetDataset.id,
            ...(selection || {}),
        });

        setAnalysisMenuDatasetId('');
        openAnalysisDestination(analysisId);
    };

    const handleDatasetNameChange = (value) => {
        if (!editorDataset) {
            return;
        }

        updateEditorDataset((previous) => renameDatasetRecord(previous, value));

        if (importSession) {
            setImportSession((previous) => ({
                ...previous,
                datasetName: String(value ?? '').trim() || previous.datasetName,
            }));
        }
    };

    const handleColumnLabelChange = (columnId, value) => {
        updateEditorDataset((previous) => ({
            ...previous,
            columns: previous.columns.map((column) => (
                column.id === columnId
                    ? { ...column, label: value }
                    : column
            )),
        }));
    };

    const handleColumnLabelBlur = () => {
        setEditorDataset((previous) => previous ? refreshDatasetMetadata(previous) : previous);
    };

    const handleAddTag = (columnId, tag) => {
        const currentColumn = getDatasetColumn(editorDataset, columnId);

        updateEditorDataset((previous) => updateDatasetColumnTags(previous, columnId, {
            manualTags: [...(currentColumn?.manualTags || []), tag],
        }));
    };

    const handleRemoveManualTag = (columnId, tag) => {
        const currentColumn = getDatasetColumn(editorDataset, columnId);

        updateEditorDataset((previous) => updateDatasetColumnTags(previous, columnId, {
            manualTags: (currentColumn?.manualTags || []).filter((item) => item !== tag),
        }));
    };

    const handleHideAutoTag = (columnId, tag) => {
        const currentColumn = getDatasetColumn(editorDataset, columnId);

        updateEditorDataset((previous) => updateDatasetColumnTags(previous, columnId, {
            hiddenAutoTags: [...(currentColumn?.hiddenAutoTags || []), tag],
        }));
    };

    const handleRestoreHiddenAutoTag = (columnId, tag) => {
        const currentColumn = getDatasetColumn(editorDataset, columnId);

        updateEditorDataset((previous) => updateDatasetColumnTags(previous, columnId, {
            hiddenAutoTags: (currentColumn?.hiddenAutoTags || []).filter((item) => item !== tag),
        }));
    };

    const handleDeleteVariable = (column) => {
        if (!editorDataset || !column) {
            return;
        }

        const shouldDelete = column.sourceKind === 'original'
            ? window.confirm(`Delete the original imported variable "${column.label}"? This removes it from the working dataset.`)
            : window.confirm(`Delete the derived variable "${column.label}"?`);

        if (!shouldDelete) {
            return;
        }

        const nextDataset = deleteDatasetColumn(editorDataset, column.id);
        clearColumnFromDrafts(column.id);
        applyDatasetEdit(nextDataset, `Deleted ${column.label} from the active workspace.`);
    };

    const handleImportSessionChange = (patch) => {
        setImportSession((previous) => {
            const next = { ...previous, ...patch };
            rebuildEditorFromSession(next, editorDataset);
            return next;
        });
    };

    const toggleDerivedColumn = (columnId) => {
        setDerivedDraft((previous) => {
            const hasColumn = previous.columns.includes(columnId);

            return {
                ...previous,
                columns: hasColumn
                    ? previous.columns.filter((item) => item !== columnId)
                    : [...previous.columns, columnId],
            };
        });
    };

    const handleDerivedOperationChange = (operation) => {
        setDerivedDraft({
            operation,
            columns: [],
            outputLabel: '',
        });
    };

    const handleApplyDerivedVariable = () => {
        if (!editorDataset) {
            return;
        }

        const columns = derivedDraft.columns.filter(Boolean);

        if (!columns.length) {
            setProblem('Choose at least one source variable before creating a derived variable.');
            return;
        }

        if (activeOperation.mode === 'pair' && columns.length !== 2) {
            setProblem('This transformation needs exactly two source variables.');
            return;
        }

        if (activeOperation.mode === 'single' && columns.length !== 1) {
            setProblem('This transformation needs one source variable.');
            return;
        }

        if (activeOperation.mode === 'multi' && columns.length < 2) {
            setProblem('Select at least two variables for this transformation.');
            return;
        }

        const nextDataset = addDerivedVariableToDataset(editorDataset, {
            operation: derivedDraft.operation,
            columns,
            outputLabel: derivedDraft.outputLabel,
        });

        setDerivedDraft(buildDefaultDerivedDraft());
        applyDatasetEdit(nextDataset, 'Added a derived variable to the current dataset workspace.');
    };

    const handleSelectReverseSource = (columnId) => {
        const selectedColumn = getDatasetColumn(editorDataset, columnId);
        const bounds = getObservedBounds(editorDataset, columnId);

        setReverseCodeDraft({
            sourceColumnId: columnId,
            minimum: bounds.min ?? '',
            maximum: bounds.max ?? '',
            outputLabel: selectedColumn ? `${selectedColumn.label} Reverse Coded` : '',
            overwrite: false,
        });
    };

    const handleApplyReverseCode = () => {
        if (!editorDataset || !reverseCodeDraft.sourceColumnId) {
            setProblem('Choose a numeric variable before reverse coding.');
            return;
        }

        const minimum = Number(reverseCodeDraft.minimum);
        const maximum = Number(reverseCodeDraft.maximum);

        if (!Number.isFinite(minimum) || !Number.isFinite(maximum) || maximum <= minimum) {
            setProblem('Choose valid minimum and maximum scale values before reverse coding.');
            return;
        }

        const nextDataset = reverseCodeDatasetVariable(editorDataset, {
            sourceColumnId: reverseCodeDraft.sourceColumnId,
            minimum,
            maximum,
            outputLabel: reverseCodeDraft.overwrite
                ? getDatasetColumn(editorDataset, reverseCodeDraft.sourceColumnId)?.label
                : reverseCodeDraft.outputLabel,
            overwrite: reverseCodeDraft.overwrite,
        });

        setReverseCodeDraft(buildDefaultReverseCodeDraft());
        applyDatasetEdit(nextDataset, 'Reverse-coded the selected variable.');
    };

    const handleSelectRecodeSource = (columnId) => {
        const selectedColumn = getDatasetColumn(editorDataset, columnId);

        setRecodeDraft({
            sourceColumnId: columnId,
            outputLabel: selectedColumn ? `${selectedColumn.label} Recoded` : '',
            overwrite: false,
            mappings: {},
        });
    };

    const handleApplyRecode = () => {
        if (!editorDataset || !recodeDraft.sourceColumnId) {
            setProblem('Choose a categorical variable before recoding categories.');
            return;
        }

        const nextDataset = recodeDatasetVariable(editorDataset, {
            sourceColumnId: recodeDraft.sourceColumnId,
            mappings: recodeDraft.mappings,
            outputLabel: recodeDraft.overwrite
                ? getDatasetColumn(editorDataset, recodeDraft.sourceColumnId)?.label
                : recodeDraft.outputLabel,
            overwrite: recodeDraft.overwrite,
        });

        setRecodeDraft(buildDefaultRecodeDraft());
        applyDatasetEdit(nextDataset, 'Applied the category mapping to the workspace.');
    };

    const handleSelectMeanCenterSource = (columnId) => {
        const selectedColumn = getDatasetColumn(editorDataset, columnId);

        setMeanCenterDraft({
            sourceColumnId: columnId,
            outputLabel: selectedColumn ? `${selectedColumn.label}_centered` : '',
        });
    };

    const handleApplyMeanCenter = () => {
        if (!editorDataset || !meanCenterDraft.sourceColumnId) {
            setProblem('Choose a numeric variable before mean-centering.');
            return;
        }

        const nextDataset = meanCenterDatasetVariable(editorDataset, {
            sourceColumnId: meanCenterDraft.sourceColumnId,
            outputLabel: meanCenterDraft.outputLabel,
        });

        setMeanCenterDraft(buildDefaultMeanCenterDraft());
        applyDatasetEdit(nextDataset, 'Created a centered version of the selected variable.');
    };

    const handleToggleReshapeColumn = (columnId, field) => {
        setReshapeDraft((previous) => {
            const currentItems = previous[field];
            const hasColumn = currentItems.includes(columnId);

            return {
                ...previous,
                [field]: hasColumn
                    ? currentItems.filter((item) => item !== columnId)
                    : [...currentItems, columnId],
            };
        });
    };

    const handleSelectReshapeCandidate = (candidateId) => {
        const candidate = reshapeCandidates.find((item) => item.id === candidateId) || null;
        const defaultMeasureGroupIds = candidate?.measureGroups.map((measureGroup) => measureGroup.id) || [];

        setReshapeDraft((previous) => ({
            ...previous,
            smartCandidateId: candidateId,
            keyColumnLabel: candidate?.dimensionLabel || '',
            selectedMeasureGroupIds: previous.allowMultipleMeasureGroups
                ? defaultMeasureGroupIds
                : defaultMeasureGroupIds.slice(0, 1),
        }));
    };

    const handleToggleReshapeMeasureGroup = (measureGroupId) => {
        setReshapeDraft((previous) => {
            if (!previous.allowMultipleMeasureGroups) {
                return {
                    ...previous,
                    selectedMeasureGroupIds: [measureGroupId],
                };
            }

            const hasMeasureGroup = previous.selectedMeasureGroupIds.includes(measureGroupId);
            const nextSelectedMeasureGroupIds = hasMeasureGroup
                ? previous.selectedMeasureGroupIds.filter((item) => item !== measureGroupId)
                : [...previous.selectedMeasureGroupIds, measureGroupId];

            return {
                ...previous,
                selectedMeasureGroupIds: nextSelectedMeasureGroupIds,
            };
        });
    };

    const handleSetReshapeAllowMultiple = (allowMultipleMeasureGroups) => {
        setReshapeDraft((previous) => ({
            ...previous,
            allowMultipleMeasureGroups,
            selectedMeasureGroupIds: allowMultipleMeasureGroups
                ? previous.selectedMeasureGroupIds
                : previous.selectedMeasureGroupIds.slice(0, 1),
        }));
    };

    const handleUpdateReshapeKeyValueOverride = (sourceKeyValue, nextValue) => {
        setReshapeDraft((previous) => ({
            ...previous,
            keyValueOverrides: {
                ...(previous.keyValueOverrides || {}),
                [sourceKeyValue]: nextValue,
            },
        }));
    };

    const handleApplyReshape = () => {
        if (!editorDataset) {
            return;
        }

        if (!selectedReshapeCandidate) {
            setProblem('No smart repeated-measures pattern was detected in this dataset yet.');
            return;
        }

        if (reshapeDraft.selectedMeasureGroupIds.length === 0) {
            setProblem('Choose at least one variable to condense into long format.');
            return;
        }

        if (reshapePlan && !reshapePlan.ok) {
            setProblem(reshapePlan.errors[0] || 'The selected wide-to-long settings could not be parsed.');
            return;
        }

        const nextDataset = reshapeWideToLongDataset(editorDataset, {
            keyColumnLabel: reshapeDraft.keyColumnLabel || selectedReshapeCandidate.dimensionLabel,
            mode: 'smart_groups',
            analysis: reshapePlan,
        });

        if (!nextDataset) {
            setProblem('The selected wide-to-long settings could not be applied.');
            return;
        }

        resetTransformDrafts();
        applyDatasetEdit(
            nextDataset,
            'Reshaped the selected repeated-measures variables into long format.'
        );
    };

    const updateRecommendedConfig = (groupId, patch) => {
        setRecommendedConfigs((previous) => ({
            ...previous,
            [groupId]: {
                ...previous[groupId],
                ...patch,
            },
        }));
    };

    const handleToggleRecommendedColumn = (group, columnId) => {
        const currentItems = (recommendedConfigs[group.id]?.selectedColumnIds || group.columns.map((column) => column.id));
        const nextSelectedColumnIds = currentItems.includes(columnId)
            ? currentItems.filter((item) => item !== columnId)
            : [...currentItems, columnId];

        updateRecommendedConfig(group.id, {
            selectedColumnIds: nextSelectedColumnIds,
            reverseColumnIds: (recommendedConfigs[group.id]?.reverseColumnIds || []).filter((item) => nextSelectedColumnIds.includes(item)),
        });
    };

    const handleAddRecommendedColumn = (group, columnId) => {
        if (!columnId) {
            return;
        }

        const currentItems = (recommendedConfigs[group.id]?.selectedColumnIds || group.columns.map((column) => column.id));

        if (currentItems.includes(columnId)) {
            return;
        }

        updateRecommendedConfig(group.id, {
            selectedColumnIds: [...currentItems, columnId],
        });
    };

    const handleToggleRecommendedReverseColumn = (group, columnId) => {
        const currentItems = recommendedConfigs[group.id]?.reverseColumnIds || [];

        updateRecommendedConfig(group.id, {
            reverseColumnIds: currentItems.includes(columnId)
                ? currentItems.filter((item) => item !== columnId)
                : [...currentItems, columnId],
        });
    };

    const handleApplyRecommendedAction = (group, actionId) => {
        if (!editorDataset) {
            return;
        }

        const groupColumnIds = group.selectedColumnIds || group.columns.map((column) => column.id);

        if (!groupColumnIds.length) {
            setProblem(`Choose at least one variable for the ${group.prefix} recommendation before applying it.`);
            return;
        }

        let nextDataset = editorDataset;

        if (actionId === 'average') {
            if (groupColumnIds.length < 2) {
                setProblem('Select at least two variables before creating an average.');
                return;
            }

            nextDataset = addDerivedVariableToDataset(editorDataset, {
                operation: 'mean',
                columns: groupColumnIds,
                outputLabel: `${group.prefix} Average`,
            });
        }

        if (actionId === 'sum') {
            if (groupColumnIds.length < 2) {
                setProblem('Select at least two variables before creating a sum.');
                return;
            }

            nextDataset = addDerivedVariableToDataset(editorDataset, {
                operation: 'sum',
                columns: groupColumnIds,
                outputLabel: `${group.prefix} Sum`,
            });
        }

        if (actionId === 'scale') {
            if (groupColumnIds.length < 2) {
                setProblem('Select at least two variables before creating a scale score.');
                return;
            }

            nextDataset = addDerivedVariableToDataset(editorDataset, {
                operation: 'mean',
                columns: groupColumnIds,
                outputLabel: `${group.prefix} Scale Score`,
            });
        }

        if (actionId === 'center_group') {
            nextDataset = meanCenterDatasetVariables(editorDataset, groupColumnIds);
        }

        applyDatasetEdit(nextDataset, `Applied the recommended ${actionId.replace('_', ' ')} transformation for ${group.prefix}.`);
    };

    const handleApplyRecommendedReverseAverage = (group) => {
        if (!editorDataset) {
            return;
        }

        const reverseColumnIds = group.reverseColumnIds || [];
        const selectedColumnIds = group.selectedColumnIds || [];
        const minimum = Number(group.minimum);
        const maximum = Number(group.maximum);

        if (selectedColumnIds.length < 2) {
            setProblem('Select at least two variables before building a reverse-coded averaged scale score.');
            return;
        }

        if (reverseColumnIds.length === 0) {
            setProblem('Choose at least one item to reverse code before creating the averaged scale score.');
            return;
        }

        if (!Number.isFinite(minimum) || !Number.isFinite(maximum) || maximum <= minimum) {
            setProblem('Set valid minimum and maximum scale bounds before reverse coding selected items.');
            return;
        }

        let nextDataset = editorDataset;
        const replacementColumnIds = {};

        reverseColumnIds.forEach((columnId) => {
            const sourceColumn = getDatasetColumn(nextDataset, columnId);

            nextDataset = reverseCodeDatasetVariable(nextDataset, {
                sourceColumnId: columnId,
                minimum,
                maximum,
                outputLabel: `${sourceColumn?.label || 'Item'} (RC)`,
                overwrite: false,
            });

            const createdColumn = nextDataset.columns[nextDataset.columns.length - 1];

            if (createdColumn) {
                replacementColumnIds[columnId] = createdColumn.id;
            }
        });

        const averagedColumnIds = selectedColumnIds.map((columnId) => replacementColumnIds[columnId] || columnId);

        nextDataset = addDerivedVariableToDataset(nextDataset, {
            operation: 'mean',
            columns: averagedColumnIds,
            outputLabel: `${group.prefix} Scale Score`,
        });

        applyDatasetEdit(nextDataset, `Reverse-coded selected ${group.prefix} items and created an averaged scale score.`);
    };

    const handleExportDataset = (format) => {
        if (!editorDataset) {
            return;
        }

        try {
            const baseFileName = sanitizeFileName(editorDataset.name);

            if (format === 'csv') {
                const csvText = buildDatasetCsv(editorDataset);
                const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8;' });
                const url = window.URL.createObjectURL(blob);
                const link = window.document.createElement('a');
                link.href = url;
                link.download = `${baseFileName}.csv`;
                link.click();
                window.URL.revokeObjectURL(url);
                setNotice(`Exported ${editorDataset.name} as CSV.`);
                return;
            }

            const workbook = XLSX.utils.book_new();
            const worksheet = XLSX.utils.json_to_sheet(buildDatasetExportRows(editorDataset));
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Dataset');
            XLSX.writeFile(workbook, `${baseFileName}.xlsx`);
            setNotice(`Exported ${editorDataset.name} as Excel.`);
        } catch (exportError) {
            setProblem(exportError instanceof Error ? exportError.message : 'Could not export the dataset.');
        }
    };

    const infoTone = problem ? 'warning' : notice ? 'primary' : 'default';
    const infoMessage = problem || notice || 'Import a file or open a saved dataset to start preparing data.';

    return (
        <div className="space-y-8">
            <Card darkMode={darkMode}>
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div className="max-w-3xl">
                        <div className={`text-[10px] font-black uppercase tracking-widest mb-2 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
                            Data Import / Data Manager
                        </div>
                        <h2 className={`text-3xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                            Prepare once, reuse everywhere
                        </h2>
                        <p className={`mt-3 text-sm leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                            Import CSV, Excel, or SPSS data, browse large variable sets without overwhelm, organize variables with editable chips, build derived variables and reshaped datasets, then launch the analysis page with the dataset already active.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <label className={`inline-flex cursor-pointer items-center gap-2 rounded-xl border px-4 py-3 text-sm font-bold ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200 hover:border-slate-700' : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'}`}>
                            <FileUp size={16} />
                            Import Data File
                            <input
                                type="file"
                                accept=".csv,.tsv,.txt,.xlsx,.sav"
                                className="hidden"
                                onChange={handleFileImport}
                            />
                        </label>

                        <button
                            type="button"
                            onClick={() => {
                                setEditorDataset(null);
                                setImportSession(null);
                                clearUndoHistory();
                                setDerivedDraft(buildDefaultDerivedDraft());
                                setIsDirty(false);
                                setFeedback({
                                    nextNotice: 'Cleared the current workspace. Import a file or reopen a saved dataset to continue.',
                                    nextProblem: '',
                                });
                            }}
                            className={`rounded-xl border px-4 py-3 text-sm font-bold ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200 hover:border-slate-700' : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'}`}
                        >
                            New Workspace
                        </button>
                    </div>
                </div>

                <div className={`mt-6 rounded-2xl border px-4 py-3 text-sm ${infoTone === 'warning'
                    ? (darkMode ? 'bg-amber-500/10 border-amber-500/20 text-amber-200' : 'bg-amber-50 border-amber-200 text-amber-700')
                    : infoTone === 'primary'
                        ? (darkMode ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-200' : 'bg-indigo-50 border-indigo-200 text-indigo-700')
                        : (darkMode ? 'bg-slate-950 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600')
                }`}>
                    {busy ? 'Working on your dataset...' : infoMessage}
                </div>
            </Card>

            <div className="grid gap-8 xl:grid-cols-12">
                <div className="xl:col-span-4 space-y-6">
                    <Card darkMode={darkMode}>
                        <div className="flex items-center gap-3 mb-4">
                            <Database size={18} className={darkMode ? 'text-sky-300' : 'text-sky-700'} />
                            <h3 className={`text-lg font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                Dataset library
                            </h3>
                        </div>

                        <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                            Saved datasets persist between sessions. Open one to refine variables, export a cleaned copy, or send it straight into a supported analysis page.
                        </p>

                        <div className="mt-5 space-y-3">
                            {isLoading && (
                                <div className={`rounded-xl border px-4 py-5 text-sm ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                                    Loading saved datasets...
                                </div>
                            )}

                            {!isLoading && !datasets.length && (
                                <div className={`rounded-xl border px-4 py-5 text-sm ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                                    No saved datasets yet. Import a CSV, Excel, or SPSS file to start your local library.
                                </div>
                            )}

                            {!isLoading && datasets.map((dataset) => (
                                <div
                                    key={dataset.id}
                                    className={`rounded-2xl border p-4 transition-colors ${editorDataset?.id === dataset.id
                                        ? (darkMode ? 'bg-indigo-500/10 border-indigo-500/30' : 'bg-indigo-50 border-indigo-200')
                                        : (darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200')
                                    }`}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <h4 className={`font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>{dataset.name}</h4>
                                            <p className={`mt-1 text-xs ${darkMode ? 'text-slate-500' : 'text-slate-600'}`}>
                                                {dataset.originalFileName || 'Local dataset'} / {dataset.fileType}
                                                {dataset.sheetName ? ` / ${dataset.sheetName}` : ''}
                                            </p>
                                        </div>
                                        <TonePill darkMode={darkMode}>{dataset.rowCount} rows</TonePill>
                                    </div>

                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {dataset.statusSummary.map((status) => (
                                            <TonePill
                                                key={`${dataset.id}-${status}`}
                                                darkMode={darkMode}
                                                tone={status === 'Missing data' || status === 'Type warnings' ? 'warning' : 'default'}
                                            >
                                                {status}
                                            </TonePill>
                                        ))}
                                    </div>

                                    <div className={`mt-3 text-xs ${darkMode ? 'text-slate-500' : 'text-slate-600'}`}>
                                        {dataset.columnCount} variables / Updated {formatTimestamp(dataset.updatedAt)}
                                    </div>

                                    <div className="mt-4 flex flex-wrap gap-2">
                                        <button
                                            type="button"
                                            onClick={() => handleOpenSavedDataset(dataset)}
                                            className={`rounded-lg px-3 py-2 text-[11px] font-black uppercase tracking-widest ${darkMode ? 'bg-slate-900 text-slate-200 hover:text-white' : 'bg-white text-slate-700 hover:text-slate-900 border border-slate-200'}`}
                                        >
                                            Open
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleDuplicateDataset(dataset)}
                                            className={`inline-flex items-center gap-1 rounded-lg px-3 py-2 text-[11px] font-black uppercase tracking-widest ${darkMode ? 'bg-slate-900 text-slate-200 hover:text-white' : 'bg-white text-slate-700 hover:text-slate-900 border border-slate-200'}`}
                                        >
                                            <Copy size={12} />
                                            Duplicate
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setAnalysisMenuDatasetId(dataset.id)}
                                            className={`inline-flex items-center gap-1 rounded-lg px-3 py-2 text-[11px] font-black uppercase tracking-widest ${darkMode ? 'bg-indigo-600 text-white hover:bg-indigo-500' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
                                        >
                                            <ArrowRight size={12} />
                                            Analyze Dataset
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleDeleteDataset(dataset)}
                                            className={`inline-flex items-center gap-1 rounded-lg px-3 py-2 text-[11px] font-black uppercase tracking-widest ${darkMode ? 'bg-slate-900 text-rose-300 hover:text-rose-200' : 'bg-white text-rose-600 hover:text-rose-700 border border-slate-200'}`}
                                        >
                                            <Trash2 size={12} />
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {error && (
                            <div className={`mt-4 rounded-xl border px-4 py-3 text-sm ${darkMode ? 'bg-amber-500/10 border-amber-500/20 text-amber-200' : 'bg-amber-50 border-amber-200 text-amber-700'}`}>
                                {error}
                            </div>
                        )}
                    </Card>
                </div>

                <div className="xl:col-span-8 space-y-6">
                    {!editorDataset ? (
                        <Card darkMode={darkMode}>
                            <div className="flex items-start gap-4">
                                <div className={`rounded-xl p-3 ${darkMode ? 'bg-indigo-500/10 text-indigo-300' : 'bg-indigo-50 text-indigo-700'}`}>
                                    <Table2 size={20} />
                                </div>
                                <div>
                                    <h3 className={`text-xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                        Import a dataset or open one from the library
                                    </h3>
                                    <p className={`mt-2 text-sm max-w-2xl ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                        This workspace is where you confirm headers, inspect missingness, tag variables, build scale scores, reshape repeated-measures data, export cleaned files, and launch directly into a supported calculator page with the dataset already active.
                                    </p>
                                </div>
                            </div>
                        </Card>
                    ) : (
                        <>
                            <Card darkMode={darkMode}>
                                <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
                                    <div className="flex-1">
                                        <div className={`text-[10px] font-black uppercase tracking-widest mb-2 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
                                            Active workspace
                                        </div>
                                        <input
                                            value={editorDataset.name}
                                            onChange={(event) => handleDatasetNameChange(event.target.value)}
                                            className={`w-full rounded-2xl border px-4 py-3 text-xl font-black outline-none transition-colors ${darkMode ? 'bg-slate-950 border-slate-800 text-white focus:border-indigo-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500'}`}
                                        />
                                        <p className={`mt-2 text-sm ${darkMode ? 'text-slate-500' : 'text-slate-600'}`}>
                                            Source file: {editorDataset.originalFileName || 'Local dataset'}
                                            {editorDataset.sheetName ? ` / Sheet: ${editorDataset.sheetName}` : ''}
                                        </p>
                                    </div>

                                    <div className="flex flex-wrap gap-3">
                                        <button
                                            type="button"
                                            onClick={handleUndoDatasetEdit}
                                            disabled={!undoStack.length}
                                            className={`inline-flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-black uppercase tracking-widest disabled:cursor-not-allowed disabled:opacity-50 ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200 hover:border-slate-700' : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'}`}
                                        >
                                            <RotateCcw size={16} />
                                            Undo
                                        </button>

                                        <button
                                            type="button"
                                            onClick={handleSaveDataset}
                                            className={`inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-black uppercase tracking-widest ${darkMode ? 'bg-indigo-600 text-white hover:bg-indigo-500' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
                                        >
                                            <Save size={16} />
                                            {editorIsSaved ? 'Save Updates' : 'Save Dataset'}
                                        </button>

                                        <button
                                            type="button"
                                            onClick={handleSaveDatasetAsNew}
                                            className={`inline-flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-black uppercase tracking-widest ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200 hover:border-slate-700' : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'}`}
                                        >
                                            <Copy size={16} />
                                            Save As New
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => handleExportDataset('csv')}
                                            className={`inline-flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-black uppercase tracking-widest ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200 hover:border-slate-700' : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'}`}
                                        >
                                            <Download size={16} />
                                            Export CSV
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => handleExportDataset('xlsx')}
                                            className={`inline-flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-black uppercase tracking-widest ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200 hover:border-slate-700' : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'}`}
                                        >
                                            <Download size={16} />
                                            Export Excel
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => setAnalysisMenuDatasetId(editorDataset.id)}
                                            className={`inline-flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-black uppercase tracking-widest ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200 hover:border-slate-700' : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'}`}
                                        >
                                            <ArrowRight size={16} />
                                            Use in Analysis
                                        </button>
                                    </div>
                                </div>

                                <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                                    <InfoRow darkMode={darkMode} label="Rows" value={editorDataset.rowCount} />
                                    <InfoRow darkMode={darkMode} label="Variables" value={editorDataset.columnCount} />
                                    <InfoRow darkMode={darkMode} label="Source Type" value={editorDataset.fileType} />
                                    <InfoRow darkMode={darkMode} label="Last Updated" value={formatTimestamp(editorDataset.updatedAt)} />
                                </div>

                                <div className="mt-4 flex flex-wrap gap-2">
                                    {editorDataset.statusSummary.map((status) => (
                                        <TonePill
                                            key={`editor-status-${status}`}
                                            darkMode={darkMode}
                                            tone={status === 'Missing data' || status === 'Type warnings' ? 'warning' : 'default'}
                                        >
                                            {status}
                                        </TonePill>
                                    ))}
                                    {isDirty && <TonePill darkMode={darkMode} tone="primary">Unsaved edits</TonePill>}
                                </div>
                            </Card>

                            {importSession && (
                                <Card darkMode={darkMode}>
                                    <div className="flex items-center gap-3 mb-4">
                                        <Layers3 size={18} className={darkMode ? 'text-sky-300' : 'text-sky-700'} />
                                        <h3 className={`text-lg font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                            Import controls
                                        </h3>
                                    </div>

                                    <div className="grid gap-4 lg:grid-cols-2">
                                        {importSession.sourceType === 'xlsx' && (
                                            <label className="block">
                                                <span className={`text-[11px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                                                    Excel Sheet
                                                </span>
                                                <select
                                                    value={importSession.selectedSheetName}
                                                    onChange={(event) => handleImportSessionChange({ selectedSheetName: event.target.value })}
                                                    className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm font-bold outline-none transition-colors ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200 focus:border-indigo-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500'}`}
                                                >
                                                    {importSession.sheets.map((sheet) => (
                                                        <option key={sheet.name} value={sheet.name}>{sheet.name}</option>
                                                    ))}
                                                </select>
                                            </label>
                                        )}

                                        <label className={`flex items-center justify-between rounded-xl border px-4 py-3 ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                                            <div>
                                                <div className="font-bold">First row is header</div>
                                                <p className={`mt-1 text-xs ${darkMode ? 'text-slate-500' : 'text-slate-600'}`}>
                                                    Toggle if the preview rows or variable names look wrong.
                                                </p>
                                            </div>
                                            <input
                                                type="checkbox"
                                                checked={importSession.hasHeaderRow}
                                                onChange={(event) => handleImportSessionChange({ hasHeaderRow: event.target.checked })}
                                            />
                                        </label>
                                    </div>
                                </Card>
                            )}

                            <Card darkMode={darkMode}>
                                <div className="flex items-center gap-3 mb-4">
                                    <Table2 size={18} className={darkMode ? 'text-emerald-300' : 'text-emerald-700'} />
                                    <h3 className={`text-lg font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                        Data preview
                                    </h3>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="min-w-full text-sm">
                                        <thead>
                                            <tr className={darkMode ? 'text-slate-500' : 'text-slate-500'}>
                                                <th className="sticky left-0 z-10 bg-inherit pb-3 pr-4 text-left text-[10px] font-black uppercase tracking-widest">Row</th>
                                                {editorDataset.columns.map((column) => (
                                                    <th key={`preview-head-${column.id}`} className="pb-3 pr-4 text-left text-[10px] font-black uppercase tracking-widest">
                                                        {column.label}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {previewRows.map((row, rowIndex) => (
                                                <tr key={`preview-row-${row.__rowId}`} className={`border-t ${darkMode ? 'border-slate-800 text-slate-300' : 'border-slate-200 text-slate-700'}`}>
                                                    <td className={`sticky left-0 bg-inherit py-2 pr-4 text-xs font-black ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>{rowIndex + 1}</td>
                                                    {editorDataset.columns.map((column) => (
                                                        <td key={`${row.__rowId}-${column.id}`} className="max-w-[16rem] truncate py-2 pr-4">
                                                            {formatDatasetValue(row[column.id]) || '—'}
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                <p className={`mt-4 text-xs ${darkMode ? 'text-slate-500' : 'text-slate-600'}`}>
                                    Showing the first {previewRows.length} rows. Statistical pages will use the full saved dataset.
                                </p>
                            </Card>

                            <Card darkMode={darkMode}>
                                <div className="flex items-center gap-3 mb-4">
                                    <Database size={18} className={darkMode ? 'text-sky-300' : 'text-sky-700'} />
                                    <h3 className={`text-lg font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                        Variable inspection
                                    </h3>
                                </div>

                                <VariableBrowser
                                    darkMode={darkMode}
                                    dataset={editorDataset}
                                    onUpdateLabel={handleColumnLabelChange}
                                    onCommitLabel={handleColumnLabelBlur}
                                    onDeleteVariable={handleDeleteVariable}
                                    onAddTag={handleAddTag}
                                    onRemoveManualTag={handleRemoveManualTag}
                                    onHideAutoTag={handleHideAutoTag}
                                    onRestoreHiddenAutoTag={handleRestoreHiddenAutoTag}
                                />
                            </Card>

                            <DataTransformWorkbench
                                darkMode={darkMode}
                                dataset={editorDataset}
                                operationOptions={DERIVED_OPERATION_OPTIONS}
                                activeOperation={activeOperation}
                                derivedDraft={derivedDraft}
                                setDerivedDraft={setDerivedDraft}
                                derivedSearchQuery={derivedSearchQuery}
                                setDerivedSearchQuery={setDerivedSearchQuery}
                                derivedOptions={derivedOptions}
                                onDerivedOperationChange={handleDerivedOperationChange}
                                onToggleDerivedColumn={toggleDerivedColumn}
                                onApplyDerivedVariable={handleApplyDerivedVariable}
                                recommendedGroups={recommendedWorkbenchGroups}
                                onToggleRecommendedColumn={handleToggleRecommendedColumn}
                                onAddRecommendedColumn={handleAddRecommendedColumn}
                                onToggleRecommendedReverseColumn={handleToggleRecommendedReverseColumn}
                                onUpdateRecommendedConfig={updateRecommendedConfig}
                                onApplyRecommendedAction={handleApplyRecommendedAction}
                                onApplyRecommendedReverseAverage={handleApplyRecommendedReverseAverage}
                                numericColumns={numericColumns}
                                categoricalColumns={categoricalColumns}
                                reverseCodeDraft={reverseCodeDraft}
                                setReverseCodeDraft={setReverseCodeDraft}
                                onSelectReverseSource={handleSelectReverseSource}
                                reverseBounds={reverseBounds}
                                reverseCodePreviewRows={reverseCodePreviewRows}
                                onApplyReverseCode={handleApplyReverseCode}
                                meanCenterDraft={meanCenterDraft}
                                setMeanCenterDraft={setMeanCenterDraft}
                                onSelectMeanCenterSource={handleSelectMeanCenterSource}
                                onApplyMeanCenter={handleApplyMeanCenter}
                                recodeDraft={recodeDraft}
                                setRecodeDraft={setRecodeDraft}
                                onSelectRecodeSource={handleSelectRecodeSource}
                                recodeLevels={recodeLevels}
                                recodePreviewRows={recodePreviewRows}
                                onApplyRecode={handleApplyRecode}
                                reshapeDraft={reshapeDraft}
                                setReshapeDraft={setReshapeDraft}
                                reshapeCandidates={reshapeCandidates}
                                selectedReshapeCandidate={selectedReshapeCandidate}
                                reshapePlan={reshapePlan}
                                reshapePreviewDataset={reshapePreviewDataset}
                                onSelectReshapeCandidate={handleSelectReshapeCandidate}
                                onToggleReshapeMeasureGroup={handleToggleReshapeMeasureGroup}
                                onSetReshapeAllowMultiple={handleSetReshapeAllowMultiple}
                                onUpdateReshapeKeyValueOverride={handleUpdateReshapeKeyValueOverride}
                                onApplyReshape={handleApplyReshape}
                                formatDatasetValue={formatDatasetValue}
                            />

                            {false && (
                                <>
                            <Card darkMode={darkMode}>
                                <div className="flex items-center gap-3 mb-4">
                                    <FlaskConical size={18} className={darkMode ? 'text-amber-300' : 'text-amber-700'} />
                                    <h3 className={`text-lg font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                        Derived variables
                                    </h3>
                                </div>

                                <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                    Search source variables, highlight matches, and build duplicate, sum, mean, difference, add, or z-score variables without leaving the active dataset.
                                </p>

                                <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
                                    <div className="space-y-4">
                                        <label className="block">
                                            <span className={`text-[11px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                                                Transformation
                                            </span>
                                            <select
                                                value={derivedDraft.operation}
                                                onChange={(event) => handleDerivedOperationChange(event.target.value)}
                                                className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm font-bold outline-none transition-colors ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200 focus:border-indigo-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500'}`}
                                            >
                                                {DERIVED_OPERATION_OPTIONS.map((option) => (
                                                    <option key={option.id} value={option.id}>{option.label}</option>
                                                ))}
                                            </select>
                                        </label>

                                        <label className="block">
                                            <span className={`text-[11px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                                                Source search
                                            </span>
                                            <input
                                                value={derivedSearchQuery}
                                                onChange={(event) => setDerivedSearchQuery(event.target.value)}
                                                placeholder="Search by name, tag, or issue"
                                                className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm font-bold outline-none transition-colors ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200 focus:border-indigo-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500'}`}
                                            />
                                        </label>

                                        <label className="block">
                                            <span className={`text-[11px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                                                New variable label
                                            </span>
                                            <input
                                                value={derivedDraft.outputLabel}
                                                onChange={(event) => setDerivedDraft((previous) => ({ ...previous, outputLabel: event.target.value }))}
                                                placeholder="Leave blank to auto-name"
                                                className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm font-bold outline-none transition-colors ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200 focus:border-indigo-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500'}`}
                                            />
                                        </label>

                                        <button
                                            type="button"
                                            onClick={handleApplyDerivedVariable}
                                            className={`inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-black uppercase tracking-widest ${darkMode ? 'bg-indigo-600 text-white hover:bg-indigo-500' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
                                        >
                                            <CheckCircle2 size={16} />
                                            Add Derived Variable
                                        </button>
                                    </div>

                                    <div className={`rounded-2xl border p-4 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                                        <div className={`text-[10px] font-black uppercase tracking-widest mb-3 ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                                            Source variables
                                        </div>

                                        <div className="space-y-2">
                                            {derivedOptions.map((column) => {
                                                const isSelected = derivedDraft.columns.includes(column.id);
                                                const selectionLocked = activeOperation.mode === 'pair' && !isSelected && derivedDraft.columns.length >= 2;
                                                const isMatched = normalizeSearch(derivedSearchQuery).length > 0 && matchesColumnSearch(column, derivedSearchQuery);

                                                return (
                                                    <label
                                                        key={`derived-${column.id}`}
                                                        className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${selectionLocked ? 'opacity-50' : 'cursor-pointer'} ${isSelected
                                                            ? (darkMode ? 'bg-indigo-500/10 border-indigo-500/30 text-white' : 'bg-indigo-50 border-indigo-200 text-slate-900')
                                                            : isMatched
                                                                ? (darkMode ? 'bg-indigo-500/5 border-indigo-500/20 text-slate-200' : 'bg-indigo-50/60 border-indigo-200 text-slate-800')
                                                                : (darkMode ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-white border-slate-200 text-slate-700')
                                                        }`}
                                                    >
                                                        <input
                                                            type={activeOperation.mode === 'single' ? 'radio' : 'checkbox'}
                                                            name="derived-source"
                                                            checked={isSelected}
                                                            disabled={selectionLocked}
                                                            onChange={() => {
                                                                if (activeOperation.mode === 'single') {
                                                                    setDerivedDraft((previous) => ({ ...previous, columns: [column.id] }));
                                                                    return;
                                                                }

                                                                toggleDerivedColumn(column.id);
                                                            }}
                                                        />
                                                        <div className="min-w-0">
                                                            <div className="font-bold">{column.label}</div>
                                                            <div className={`text-xs ${darkMode ? 'text-slate-500' : 'text-slate-600'}`}>
                                                                {column.summary?.detectedType} • missing {column.summary?.missingCount || 0}
                                                            </div>
                                                        </div>
                                                    </label>
                                                );
                                            })}
                                        </div>

                                    </div>
                                </div>
                            </Card>

                            <Card darkMode={darkMode}>
                                <div className="flex items-center gap-3 mb-4">
                                    <Sparkles size={18} className={darkMode ? 'text-indigo-300' : 'text-indigo-700'} />
                                    <h3 className={`text-lg font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                        Recommended transformations
                                    </h3>
                                </div>

                                <div className="space-y-4">
                                    {!recommendedGroups.length && (
                                        <div className={`rounded-xl border px-4 py-5 text-sm ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                                            No grouped naming patterns were detected yet.
                                        </div>
                                    )}

                                    {recommendedGroups.map((group) => {
                                        const groupConfig = recommendedConfigs[group.id] || {};
                                        const groupBounds = group.columns.reduce((bounds, column) => {
                                            const numericBounds = getObservedBounds(editorDataset, column.id);

                                            return {
                                                min: bounds.min == null ? numericBounds.min : Math.min(bounds.min, numericBounds.min ?? bounds.min),
                                                max: bounds.max == null ? numericBounds.max : Math.max(bounds.max, numericBounds.max ?? bounds.max),
                                            };
                                        }, { min: null, max: null });

                                        return (
                                            <div key={group.id} className={`rounded-2xl border p-4 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                                                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                                                    <div>
                                                        <div className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
                                                            {group.prefix}
                                                        </div>
                                                        <div className="mt-3 flex flex-wrap gap-2">
                                                            {group.columns.map((column) => (
                                                                <TonePill key={`${group.id}-${column.id}`} darkMode={darkMode} tone={column.summary?.detectedType === 'numeric' ? 'primary' : 'default'}>
                                                                    {column.label}
                                                                </TonePill>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {group.numericOnly && (
                                                        <div className="flex flex-wrap gap-2">
                                                            <button type="button" onClick={() => handleApplyRecommendedAction(group, 'average')} className={`rounded-xl px-3 py-2 text-[11px] font-black uppercase tracking-widest ${darkMode ? 'bg-indigo-600 text-white hover:bg-indigo-500' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}>Average</button>
                                                            <button type="button" onClick={() => handleApplyRecommendedAction(group, 'sum')} className={`rounded-xl border px-3 py-2 text-[11px] font-black uppercase tracking-widest ${darkMode ? 'border-slate-800 bg-slate-900 text-slate-300 hover:text-white' : 'border-slate-200 bg-white text-slate-700 hover:text-slate-900'}`}>Sum</button>
                                                            <button type="button" onClick={() => handleApplyRecommendedAction(group, 'scale')} className={`rounded-xl border px-3 py-2 text-[11px] font-black uppercase tracking-widest ${darkMode ? 'border-slate-800 bg-slate-900 text-slate-300 hover:text-white' : 'border-slate-200 bg-white text-slate-700 hover:text-slate-900'}`}>Scale Score</button>
                                                            <button type="button" onClick={() => handleApplyRecommendedAction(group, 'center_group')} className={`rounded-xl border px-3 py-2 text-[11px] font-black uppercase tracking-widest ${darkMode ? 'border-slate-800 bg-slate-900 text-slate-300 hover:text-white' : 'border-slate-200 bg-white text-slate-700 hover:text-slate-900'}`}>Mean-Center Group</button>
                                                        </div>
                                                    )}
                                                </div>

                                                {group.numericOnly && (
                                                    <div className={`mt-4 rounded-xl border p-4 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                                                        <div className={`text-[10px] font-black uppercase tracking-widest mb-3 ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                                                            Reverse selected items, then average
                                                        </div>
                                                        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_repeat(2,minmax(0,10rem))_auto]">
                                                            <div className="space-y-2">
                                                                {group.columns.map((column) => {
                                                                    const checked = (groupConfig.reverseColumnIds || []).includes(column.id);

                                                                    return (
                                                                        <label key={`${group.id}-${column.id}`} className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${checked ? (darkMode ? 'bg-indigo-500/10 border-indigo-500/30 text-white' : 'bg-indigo-50 border-indigo-200 text-slate-900') : (darkMode ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700')}`}>
                                                                            <input
                                                                                type="checkbox"
                                                                                checked={checked}
                                                                                onChange={() => {
                                                                                    const currentItems = groupConfig.reverseColumnIds || [];
                                                                                    updateRecommendedConfig(group.id, {
                                                                                        reverseColumnIds: checked ? currentItems.filter((item) => item !== column.id) : [...currentItems, column.id],
                                                                                        minimum: groupConfig.minimum ?? groupBounds.min ?? '',
                                                                                        maximum: groupConfig.maximum ?? groupBounds.max ?? '',
                                                                                    });
                                                                                }}
                                                                            />
                                                                            <span className="font-bold">{column.label}</span>
                                                                        </label>
                                                                    );
                                                                })}
                                                            </div>
                                                            <input type="number" value={groupConfig.minimum ?? groupBounds.min ?? ''} onChange={(event) => updateRecommendedConfig(group.id, { minimum: event.target.value })} placeholder="Min" className={`rounded-xl border px-4 py-3 text-sm font-bold outline-none transition-colors ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200 focus:border-indigo-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500'}`} />
                                                            <input type="number" value={groupConfig.maximum ?? groupBounds.max ?? ''} onChange={(event) => updateRecommendedConfig(group.id, { maximum: event.target.value })} placeholder="Max" className={`rounded-xl border px-4 py-3 text-sm font-bold outline-none transition-colors ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200 focus:border-indigo-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500'}`} />
                                                            <button type="button" onClick={() => handleApplyRecommendedReverseAverage(group)} className={`rounded-xl px-4 py-3 text-sm font-black uppercase tracking-widest ${darkMode ? 'bg-indigo-600 text-white hover:bg-indigo-500' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}>
                                                                Reverse + Average
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </Card>

                            <div className="grid gap-6 xl:grid-cols-2">
                                <Card darkMode={darkMode}>
                                    <div className="flex items-center gap-3 mb-4">
                                        <FlaskConical size={18} className={darkMode ? 'text-amber-300' : 'text-amber-700'} />
                                        <h3 className={`text-lg font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>Reverse code</h3>
                                    </div>

                                    <div className="space-y-4">
                                        <select value={reverseCodeDraft.sourceColumnId} onChange={(event) => handleSelectReverseSource(event.target.value)} className={`w-full rounded-xl border px-4 py-3 text-sm font-bold outline-none transition-colors ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200 focus:border-indigo-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500'}`}>
                                            <option value="">Select numeric variable</option>
                                            {numericColumns.map((column) => <option key={`reverse-${column.id}`} value={column.id}>{column.label}</option>)}
                                        </select>
                                        <div className="grid gap-4 md:grid-cols-2">
                                            <input type="number" value={reverseCodeDraft.minimum} onChange={(event) => setReverseCodeDraft((previous) => ({ ...previous, minimum: event.target.value }))} placeholder="Minimum" className={`rounded-xl border px-4 py-3 text-sm font-bold outline-none transition-colors ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200 focus:border-indigo-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500'}`} />
                                            <input type="number" value={reverseCodeDraft.maximum} onChange={(event) => setReverseCodeDraft((previous) => ({ ...previous, maximum: event.target.value }))} placeholder="Maximum" className={`rounded-xl border px-4 py-3 text-sm font-bold outline-none transition-colors ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200 focus:border-indigo-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500'}`} />
                                        </div>
                                        {reverseBounds.min != null && reverseBounds.max != null && (
                                            <button type="button" onClick={() => setReverseCodeDraft((previous) => ({ ...previous, minimum: reverseBounds.min, maximum: reverseBounds.max }))} className={`rounded-xl border px-4 py-3 text-sm font-bold ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-300 hover:text-white' : 'bg-slate-50 border-slate-200 text-slate-700 hover:text-slate-900'}`}>
                                                Use observed range {reverseBounds.min} to {reverseBounds.max}
                                            </button>
                                        )}
                                        <input value={reverseCodeDraft.outputLabel} onChange={(event) => setReverseCodeDraft((previous) => ({ ...previous, outputLabel: event.target.value }))} placeholder="Create a new reverse-coded variable" disabled={reverseCodeDraft.overwrite} className={`w-full rounded-xl border px-4 py-3 text-sm font-bold outline-none transition-colors disabled:opacity-50 ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200 focus:border-indigo-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500'}`} />
                                        <label className={`flex items-center justify-between rounded-xl border px-4 py-3 ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                                            <span className="font-bold">Overwrite the existing variable</span>
                                            <input type="checkbox" checked={reverseCodeDraft.overwrite} onChange={(event) => setReverseCodeDraft((previous) => ({ ...previous, overwrite: event.target.checked }))} />
                                        </label>
                                        {(reverseCodeDraft.minimum !== '' && reverseCodeDraft.maximum !== '') && (
                                            <div className={`rounded-xl border p-4 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                                                <div className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>Formula preview</div>
                                                <p className={`mt-2 text-sm font-bold ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>new = {reverseCodeDraft.maximum} + {reverseCodeDraft.minimum} - old</p>
                                                {!!reverseCodePreviewRows.length && (
                                                    <div className="mt-4 grid gap-2 sm:grid-cols-2">
                                                        {reverseCodePreviewRows.map((item, index) => (
                                                            <div key={`reverse-preview-${index}`} className={`rounded-lg border px-3 py-2 text-sm ${darkMode ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-white border-slate-200 text-slate-700'}`}>{item.oldValue} {'->'} {item.newValue}</div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                        <button type="button" onClick={handleApplyReverseCode} className={`inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-black uppercase tracking-widest ${darkMode ? 'bg-indigo-600 text-white hover:bg-indigo-500' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}>
                                            <CheckCircle2 size={16} />
                                            Apply Reverse Code
                                        </button>
                                    </div>
                                </Card>

                                <Card darkMode={darkMode}>
                                    <div className="flex items-center gap-3 mb-4">
                                        <FlaskConical size={18} className={darkMode ? 'text-amber-300' : 'text-amber-700'} />
                                        <h3 className={`text-lg font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>Mean-center variable</h3>
                                    </div>

                                    <div className="space-y-4">
                                        <select value={meanCenterDraft.sourceColumnId} onChange={(event) => handleSelectMeanCenterSource(event.target.value)} className={`w-full rounded-xl border px-4 py-3 text-sm font-bold outline-none transition-colors ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200 focus:border-indigo-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500'}`}>
                                            <option value="">Select numeric variable</option>
                                            {numericColumns.map((column) => <option key={`center-${column.id}`} value={column.id}>{column.label}</option>)}
                                        </select>
                                        <input value={meanCenterDraft.outputLabel} onChange={(event) => setMeanCenterDraft((previous) => ({ ...previous, outputLabel: event.target.value }))} placeholder="StudyHours_centered" className={`w-full rounded-xl border px-4 py-3 text-sm font-bold outline-none transition-colors ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200 focus:border-indigo-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500'}`} />
                                        <button type="button" onClick={handleApplyMeanCenter} className={`inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-black uppercase tracking-widest ${darkMode ? 'bg-indigo-600 text-white hover:bg-indigo-500' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}>
                                            <CheckCircle2 size={16} />
                                            Create Centered Variable
                                        </button>
                                    </div>
                                </Card>
                            </div>

                            <div className="grid gap-6 xl:grid-cols-2">
                                <Card darkMode={darkMode}>
                                    <div className="flex items-center gap-3 mb-4">
                                        <FlaskConical size={18} className={darkMode ? 'text-amber-300' : 'text-amber-700'} />
                                        <h3 className={`text-lg font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>Recode / combine categories</h3>
                                    </div>

                                    <div className="space-y-4">
                                        <select value={recodeDraft.sourceColumnId} onChange={(event) => handleSelectRecodeSource(event.target.value)} className={`w-full rounded-xl border px-4 py-3 text-sm font-bold outline-none transition-colors ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200 focus:border-indigo-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500'}`}>
                                            <option value="">Select categorical variable</option>
                                            {categoricalColumns.map((column) => <option key={`recode-${column.id}`} value={column.id}>{column.label}</option>)}
                                        </select>
                                        <input value={recodeDraft.outputLabel} onChange={(event) => setRecodeDraft((previous) => ({ ...previous, outputLabel: event.target.value }))} disabled={recodeDraft.overwrite} placeholder="Leave blank to auto-name" className={`w-full rounded-xl border px-4 py-3 text-sm font-bold outline-none transition-colors disabled:opacity-50 ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200 focus:border-indigo-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500'}`} />
                                        <label className={`flex items-center justify-between rounded-xl border px-4 py-3 ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                                            <span className="font-bold">Overwrite the existing variable</span>
                                            <input type="checkbox" checked={recodeDraft.overwrite} onChange={(event) => setRecodeDraft((previous) => ({ ...previous, overwrite: event.target.checked }))} />
                                        </label>
                                        <div className={`rounded-2xl border p-4 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                                            <div className="space-y-3 max-h-[20rem] overflow-y-auto pr-1">
                                                {!recodeLevels.length && (
                                                    <div className={`rounded-xl border px-4 py-4 text-sm ${darkMode ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-600'}`}>
                                                        Choose a categorical variable to map old values into new categories.
                                                    </div>
                                                )}
                                                {recodeLevels.map((level) => (
                                                    <div key={`map-${level}`} className={`rounded-xl border p-3 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                                                        <div className={`text-xs font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>{level}</div>
                                                        <input
                                                            value={recodeDraft.mappings[level] ?? level}
                                                            onChange={(event) => setRecodeDraft((previous) => ({
                                                                ...previous,
                                                                mappings: {
                                                                    ...previous.mappings,
                                                                    [level]: event.target.value,
                                                                },
                                                            }))}
                                                            className={`mt-2 w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200 focus:border-indigo-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500'}`}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        {!!recodePreviewRows.length && (
                                            <div className={`rounded-2xl border p-4 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                                                <div className="space-y-2">
                                                    {recodePreviewRows.map((item) => (
                                                        <div key={`${item.oldValue}-${item.newValue}`} className={`rounded-lg border px-3 py-2 text-sm ${darkMode ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-white border-slate-200 text-slate-700'}`}>{item.oldValue} {'->'} {item.newValue} ({item.count})</div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        <button type="button" onClick={handleApplyRecode} className={`inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-black uppercase tracking-widest ${darkMode ? 'bg-indigo-600 text-white hover:bg-indigo-500' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}>
                                            <CheckCircle2 size={16} />
                                            Apply Category Mapping
                                        </button>
                                    </div>
                                </Card>

                                <Card darkMode={darkMode}>
                                    <div className="flex items-center gap-3 mb-4">
                                        <MoveVertical size={18} className={darkMode ? 'text-sky-300' : 'text-sky-700'} />
                                        <h3 className={`text-lg font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>Wide to long</h3>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="grid gap-4 xl:grid-cols-2">
                                            <div className={`rounded-2xl border p-4 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                                                <div className="space-y-2 max-h-[18rem] overflow-y-auto pr-1">
                                                    {editorDataset.columns.map((column) => {
                                                        const checked = reshapeDraft.pivotColumnIds.includes(column.id);
                                                        return (
                                                            <label key={`reshape-pivot-${column.id}`} className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${checked ? (darkMode ? 'bg-indigo-500/10 border-indigo-500/30 text-white' : 'bg-indigo-50 border-indigo-200 text-slate-900') : (darkMode ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-white border-slate-200 text-slate-700')}`}>
                                                                <input type="checkbox" checked={checked} onChange={() => handleToggleReshapeColumn(column.id, 'pivotColumnIds')} />
                                                                <div className="min-w-0">
                                                                    <div className="font-bold">{column.label}</div>
                                                                    <div className={`text-xs ${darkMode ? 'text-slate-500' : 'text-slate-600'}`}>{column.summary?.detectedType}</div>
                                                                </div>
                                                            </label>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                            <div className={`rounded-2xl border p-4 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                                                <div className="space-y-2 max-h-[18rem] overflow-y-auto pr-1">
                                                    {editorDataset.columns.map((column) => {
                                                        const checked = reshapeDraft.idColumnIds.includes(column.id);
                                                        return (
                                                            <label key={`reshape-id-${column.id}`} className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${checked ? (darkMode ? 'bg-indigo-500/10 border-indigo-500/30 text-white' : 'bg-indigo-50 border-indigo-200 text-slate-900') : (darkMode ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-white border-slate-200 text-slate-700')}`}>
                                                                <input type="checkbox" checked={checked} onChange={() => handleToggleReshapeColumn(column.id, 'idColumnIds')} />
                                                                <div className="min-w-0">
                                                                    <div className="font-bold">{column.label}</div>
                                                                    <div className={`text-xs ${darkMode ? 'text-slate-500' : 'text-slate-600'}`}>{column.summary?.detectedType}</div>
                                                                </div>
                                                            </label>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="grid gap-4 md:grid-cols-2">
                                            <input value={reshapeDraft.keyColumnLabel} onChange={(event) => setReshapeDraft((previous) => ({ ...previous, keyColumnLabel: event.target.value }))} placeholder="Target variable column" className={`rounded-xl border px-4 py-3 text-sm font-bold outline-none transition-colors ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200 focus:border-indigo-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500'}`} />
                                            <input value={reshapeDraft.valueColumnLabel} onChange={(event) => setReshapeDraft((previous) => ({ ...previous, valueColumnLabel: event.target.value }))} placeholder="Value column" className={`rounded-xl border px-4 py-3 text-sm font-bold outline-none transition-colors ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200 focus:border-indigo-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500'}`} />
                                        </div>
                                        {reshapePreviewDataset && (
                                            <div className={`rounded-2xl border p-4 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                                                <div className="overflow-x-auto">
                                                    <table className="min-w-full text-sm">
                                                        <thead>
                                                            <tr className={darkMode ? 'text-slate-500' : 'text-slate-500'}>
                                                                {reshapePreviewDataset.columns.map((column) => (
                                                                    <th key={`reshape-preview-head-${column.id}`} className="pb-3 pr-4 text-left text-[10px] font-black uppercase tracking-widest">{column.label}</th>
                                                                ))}
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {reshapePreviewDataset.rows.slice(0, 10).map((row) => (
                                                                <tr key={`reshape-preview-row-${row.__rowId}`} className={`border-t ${darkMode ? 'border-slate-800 text-slate-300' : 'border-slate-200 text-slate-700'}`}>
                                                                    {reshapePreviewDataset.columns.map((column) => (
                                                                        <td key={`${row.__rowId}-${column.id}`} className="py-2 pr-4">{formatDatasetValue(row[column.id]) || '--'}</td>
                                                                    ))}
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        )}
                                        <button type="button" onClick={handleApplyReshape} className={`inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-black uppercase tracking-widest ${darkMode ? 'bg-indigo-600 text-white hover:bg-indigo-500' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}>
                                            <CheckCircle2 size={16} />
                                            Reshape to Long
                                        </button>
                                    </div>
                                </Card>
                            </div>
                                </>
                            )}
                        </>
                    )}
                </div>
            </div>

            {analysisMenuDataset && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
                        onClick={() => setAnalysisMenuDatasetId('')}
                        role="presentation"
                    />
                    <div className={`relative z-10 w-full max-w-3xl rounded-3xl border p-6 shadow-2xl ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <div className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
                                    Analysis launcher
                                </div>
                                <h3 className={`mt-1 text-2xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                    Choose analysis for {analysisMenuDataset.name}
                                </h3>
                                <p className={`mt-2 text-sm max-w-2xl ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                    Supported analysis pages open directly on their calculator tab with this dataset already active.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setAnalysisMenuDatasetId('')}
                                className={`rounded-xl border px-4 py-3 text-sm font-black uppercase tracking-widest ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-300 hover:text-white' : 'bg-slate-50 border-slate-200 text-slate-700 hover:text-slate-900'}`}
                            >
                                Close
                            </button>
                        </div>

                        <div className="mt-6 grid gap-4 md:grid-cols-2">
                            {analysisCompatibility.map((analysis) => (
                                <div
                                    key={analysis.id}
                                    className={`rounded-2xl border p-5 ${analysis.compatible
                                        ? (darkMode ? 'bg-indigo-500/10 border-indigo-500/30' : 'bg-indigo-50 border-indigo-200')
                                        : (darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200')
                                    }`}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <h4 className={`text-lg font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                                {analysis.label}
                                            </h4>
                                            <p className={`mt-2 text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                                {analysis.summary}
                                            </p>
                                        </div>
                                        <TonePill darkMode={darkMode} tone={analysis.compatible ? 'primary' : 'warning'}>
                                            {analysis.compatible ? 'Ready' : 'Needs more variables'}
                                        </TonePill>
                                    </div>

                                    <p className={`mt-4 text-xs ${darkMode ? 'text-slate-500' : 'text-slate-600'}`}>
                                        {analysis.detail}
                                    </p>

                                    <button
                                        type="button"
                                        onClick={() => handleLaunchAnalysis(analysis.id)}
                                        disabled={!analysis.compatible}
                                        className={`mt-4 inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-black uppercase tracking-widest disabled:cursor-not-allowed disabled:opacity-50 ${analysis.compatible
                                            ? (darkMode ? 'bg-indigo-600 text-white hover:bg-indigo-500' : 'bg-indigo-600 text-white hover:bg-indigo-700')
                                            : (darkMode ? 'bg-slate-900 text-slate-500' : 'bg-slate-100 text-slate-400')
                                        }`}
                                    >
                                        <ArrowRight size={16} />
                                        Open Calculator
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {problem && (
                <Card darkMode={darkMode}>
                    <div className="flex items-start gap-4">
                        <div className={`rounded-xl p-3 ${darkMode ? 'bg-amber-500/10 text-amber-300' : 'bg-amber-50 text-amber-700'}`}>
                            <AlertTriangle size={20} />
                        </div>
                        <div>
                            <h3 className={`text-lg font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                Something needs attention
                            </h3>
                            <p className={`mt-2 text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                {problem}
                            </p>
                        </div>
                    </div>
                </Card>
            )}
        </div>
    );
};

export default DataManagerPage;
