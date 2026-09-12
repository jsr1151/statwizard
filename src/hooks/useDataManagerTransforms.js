import { addDerivedVariableToDataset, getDatasetColumn, meanCenterDatasetVariable, meanCenterDatasetVariables, recodeDatasetVariable, reshapeWideToLongDataset, reverseCodeDatasetVariable } from '../utils/datasetImport.js';
import { buildDefaultDerivedDraft } from '../utils/dataManagerHelpers.js';
import { buildDefaultReverseCodeDraft } from '../utils/dataManagerHelpers.js';
import { buildDefaultRecodeDraft } from '../utils/dataManagerHelpers.js';
import { buildDefaultMeanCenterDraft } from '../utils/dataManagerHelpers.js';
import { getObservedBounds } from '../utils/dataManagerHelpers.js';

export default function useDataManagerTransforms({
    setDerivedDraft, editorDataset, derivedDraft, setProblem,
    activeOperation, applyDatasetEdit, setReverseCodeDraft, reverseCodeDraft,
    setRecodeDraft, recodeDraft, setMeanCenterDraft, meanCenterDraft,
    setReshapeDraft, reshapeCandidates, selectedReshapeCandidate, reshapeDraft,
    reshapePlan, resetTransformDrafts, setRecommendedConfigs, recommendedConfigs,
}) {
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

    return {
        toggleDerivedColumn, handleDerivedOperationChange, handleApplyDerivedVariable, handleSelectReverseSource,
        handleApplyReverseCode, handleSelectRecodeSource, handleApplyRecode, handleSelectMeanCenterSource,
        handleApplyMeanCenter, handleToggleReshapeColumn, handleSelectReshapeCandidate, handleToggleReshapeMeasureGroup,
        handleSetReshapeAllowMultiple, handleUpdateReshapeKeyValueOverride, handleApplyReshape, updateRecommendedConfig,
        handleToggleRecommendedColumn, handleAddRecommendedColumn, handleToggleRecommendedReverseColumn, handleApplyRecommendedAction,
        handleApplyRecommendedReverseAverage,
    };
}
