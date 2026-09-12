import { AlertTriangle, Database, Table2 } from 'lucide-react';
import DataTransformWorkbench from './DataTransformWorkbench.jsx';
import VariableBrowser from './VariableBrowser.jsx';
import { formatDatasetValue } from '../../utils/datasetImport.js';
import { DERIVED_OPERATION_OPTIONS } from '../../data/dataManagerOptions.js';
import { SHOW_LEGACY_DERIVED_VARIABLES } from '../../data/dataManagerOptions.js';
import Card from '../analysis/AnalysisCard.jsx';
import DataManagerHeader from './DataManagerHeader.jsx';
import DatasetLibraryCard from './DatasetLibraryCard.jsx';
import DatasetWorkspaceSummary from './DatasetWorkspaceSummary.jsx';
import DatasetImportControls from './DatasetImportControls.jsx';
import DatasetPreviewCard from './DatasetPreviewCard.jsx';
import DatasetAnalysisLauncher from './DatasetAnalysisLauncher.jsx';
import DatasetLegacyTransforms from './DatasetLegacyTransforms.jsx';
import useDataManagerEditor from '../../hooks/useDataManagerEditor.js';
import useDataManagerFiles from '../../hooks/useDataManagerFiles.js';
import useDataManagerTransforms from '../../hooks/useDataManagerTransforms.js';

const DataManagerPage = ({ darkMode, onOpenAnalysis, onOpenMultipleRegression }) => {
    const {
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
    } = useDataManagerEditor();

    const {
        handleFileImport, handleSaveDataset, handleSaveDatasetAsNew, handleOpenSavedDataset,
        handleDeleteDataset, handleDuplicateDataset, handleLaunchAnalysis, handleImportSessionChange,
        handleExportDataset,
    } = useDataManagerFiles({
        setProblem, clearUndoHistory, setEditorDataset, setIsDirty,
        setFeedback, setBusy, setImportSession, resetTransformDrafts,
        editorDataset, saveDataset, setNotice, duplicateDataset,
        deleteDataset, datasets, isDirty, editorIsSaved,
        onOpenAnalysis, onOpenMultipleRegression, analysisMenuDatasetId, setAnalysisMenuDatasetId,
    });

    const {
        toggleDerivedColumn, handleDerivedOperationChange, handleApplyDerivedVariable, handleSelectReverseSource,
        handleApplyReverseCode, handleSelectRecodeSource, handleApplyRecode, handleSelectMeanCenterSource,
        handleApplyMeanCenter, handleToggleReshapeColumn, handleSelectReshapeCandidate, handleToggleReshapeMeasureGroup,
        handleSetReshapeAllowMultiple, handleUpdateReshapeKeyValueOverride, handleApplyReshape, updateRecommendedConfig,
        handleToggleRecommendedColumn, handleAddRecommendedColumn, handleToggleRecommendedReverseColumn, handleApplyRecommendedAction,
        handleApplyRecommendedReverseAverage,
    } = useDataManagerTransforms({
        setDerivedDraft, editorDataset, derivedDraft, setProblem,
        activeOperation, applyDatasetEdit, setReverseCodeDraft, reverseCodeDraft,
        setRecodeDraft, recodeDraft, setMeanCenterDraft, meanCenterDraft,
        setReshapeDraft, reshapeCandidates, selectedReshapeCandidate, reshapeDraft,
        reshapePlan, resetTransformDrafts, setRecommendedConfigs, recommendedConfigs,
    });

    return (
        <div className="min-w-0 space-y-8 [overflow-wrap:anywhere]">
            <DataManagerHeader {...{
                darkMode, handleFileImport, setEditorDataset, setImportSession,
                clearUndoHistory, setDerivedDraft, setIsDirty, setFeedback,
                infoTone, busy, infoMessage,
            }} />

            <div className="grid grid-cols-1 gap-8 xl:grid-cols-12">
                <div className="min-w-0 xl:col-span-4 space-y-6">
                    <DatasetLibraryCard {...{
                        darkMode, isLoading, datasets, editorDataset,
                        handleOpenSavedDataset, handleDuplicateDataset, setAnalysisMenuDatasetId, handleDeleteDataset,
                        error,
                    }} />
                </div>

                <div className="min-w-0 xl:col-span-8 space-y-6">
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
                            <DatasetWorkspaceSummary {...{
                                darkMode, editorDataset, handleDatasetNameChange, handleUndoDatasetEdit,
                                undoStack, handleSaveDataset, editorIsSaved, handleSaveDatasetAsNew,
                                handleExportDataset, setAnalysisMenuDatasetId, isDirty,
                            }} />

                            {importSession && (
                                <DatasetImportControls {...{
                                    darkMode, importSession, handleImportSessionChange,
                                }} />
                            )}

                            <DatasetPreviewCard {...{
                                darkMode, editorDataset, previewRows,
                            }} />

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

                            {SHOW_LEGACY_DERIVED_VARIABLES && (
                                <DatasetLegacyTransforms {...{
                                    darkMode, derivedDraft, handleDerivedOperationChange, derivedSearchQuery,
                                    setDerivedSearchQuery, setDerivedDraft, handleApplyDerivedVariable, derivedOptions,
                                    activeOperation, toggleDerivedColumn, recommendedGroups, recommendedConfigs,
                                    editorDataset, handleApplyRecommendedAction, updateRecommendedConfig, handleApplyRecommendedReverseAverage,
                                    reverseCodeDraft, handleSelectReverseSource, numericColumns, setReverseCodeDraft,
                                    reverseBounds, reverseCodePreviewRows, handleApplyReverseCode, meanCenterDraft,
                                    handleSelectMeanCenterSource, setMeanCenterDraft, handleApplyMeanCenter, recodeDraft,
                                    handleSelectRecodeSource, categoricalColumns, setRecodeDraft, recodeLevels,
                                    recodePreviewRows, handleApplyRecode, reshapeDraft, handleToggleReshapeColumn,
                                    setReshapeDraft, reshapePreviewDataset, handleApplyReshape,
                                }} />
                            )}
                        </>
                    )}
                </div>
            </div>

            {analysisMenuDataset && (
                <DatasetAnalysisLauncher {...{
                    setAnalysisMenuDatasetId, darkMode, analysisMenuDataset, analysisCompatibility,
                    handleLaunchAnalysis,
                }} />
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
