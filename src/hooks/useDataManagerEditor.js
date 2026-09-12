import { useEffect, useMemo, useState } from 'react';
import useWorkspaceDraftState from './useWorkspaceDraftState.js';
import { useDatasetLibraryContext } from '../hooks/useDatasetLibrary.js';
import { buildSmartWideToLongReshapePlan, deleteDatasetColumn, getDatasetColumn, getDatasetColumnValues, getRecommendedLongFormatCandidates, getRecommendedVariableGroups, hydrateStoredDataset, isMissingValue, refreshDatasetMetadata, renameDatasetRecord, reshapeWideToLongDataset, updateDatasetColumnTags } from '../utils/datasetImport.js';
import { DERIVED_OPERATION_OPTIONS } from '../data/dataManagerOptions.js';
import { UNDO_HISTORY_LIMIT } from '../data/dataManagerOptions.js';
import {
    buildDefaultDerivedDraft, buildDefaultReverseCodeDraft, buildDefaultRecodeDraft,
    buildDefaultMeanCenterDraft, buildDefaultReshapeDraft, matchesColumnSearch,
    getObservedBounds, buildReversePreviewRows, buildRecodePreviewRows, getAnalysisCompatibility,
} from '../utils/dataManagerHelpers.js';

export default function useDataManagerEditor() {
    const {
        datasets,
        isLoading,
        error,
        saveDataset,
        deleteDataset,
        duplicateDataset,
    } = useDatasetLibraryContext();

    const [editorDataset, setEditorDataset] = useWorkspaceDraftState('editorDataset', null);

    const [importSession, setImportSession] = useWorkspaceDraftState('importSession', null);

    const [derivedDraft, setDerivedDraft] = useWorkspaceDraftState('derivedDraft', buildDefaultDerivedDraft);

    const [reverseCodeDraft, setReverseCodeDraft] = useWorkspaceDraftState('reverseCodeDraft', buildDefaultReverseCodeDraft);

    const [recodeDraft, setRecodeDraft] = useWorkspaceDraftState('recodeDraft', buildDefaultRecodeDraft);

    const [meanCenterDraft, setMeanCenterDraft] = useWorkspaceDraftState('meanCenterDraft', buildDefaultMeanCenterDraft);

    const [reshapeDraft, setReshapeDraft] = useWorkspaceDraftState('reshapeDraft', buildDefaultReshapeDraft);

    const [derivedSearchQuery, setDerivedSearchQuery] = useState('');

    const [recommendedConfigs, setRecommendedConfigs] = useWorkspaceDraftState('recommendedConfigs', {});

    const [analysisMenuDatasetId, setAnalysisMenuDatasetId] = useState('');

    const [busy, setBusy] = useState(false);

    const [notice, setNotice] = useState('');

    const [problem, setProblem] = useState('');

    const [isDirty, setIsDirty] = useWorkspaceDraftState('isDirty', false);

    const [undoStack, setUndoStack] = useWorkspaceDraftState('undoStack', []);

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
    }, [reshapeCandidates, setReshapeDraft]);

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
    // The handler closes over the same undo stack that deliberately controls listener refreshes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

    const infoTone = problem ? 'warning' : notice ? 'primary' : 'default';

    const infoMessage = problem || notice || 'Import a file or open a saved dataset to start preparing data.';

    return {
        datasets, isLoading, error, saveDataset,
        deleteDataset, duplicateDataset, editorDataset, setEditorDataset,
        importSession, setImportSession, derivedDraft, setDerivedDraft,
        reverseCodeDraft, setReverseCodeDraft, recodeDraft, setRecodeDraft,
        meanCenterDraft, setMeanCenterDraft, reshapeDraft, setReshapeDraft,
        derivedSearchQuery, setDerivedSearchQuery, recommendedConfigs, setRecommendedConfigs,
        analysisMenuDatasetId, setAnalysisMenuDatasetId, busy, setBusy,
        setNotice, problem, setProblem, isDirty,
        setIsDirty, undoStack, activeOperation, editorIsSaved,
        numericColumns, categoricalColumns, recommendedGroups, recommendedWorkbenchGroups,
        derivedOptions, recodeLevels, reverseBounds, reverseCodePreviewRows,
        recodePreviewRows, reshapeCandidates, selectedReshapeCandidate, reshapePlan,
        reshapePreviewDataset, analysisMenuDataset, analysisCompatibility, previewRows,
        setFeedback, clearUndoHistory, resetTransformDrafts, applyDatasetEdit,
        handleUndoDatasetEdit, handleDatasetNameChange, handleColumnLabelChange, handleColumnLabelBlur,
        handleAddTag, handleRemoveManualTag, handleHideAutoTag, handleRestoreHiddenAutoTag,
        handleDeleteVariable, infoTone, infoMessage,
    };
}
