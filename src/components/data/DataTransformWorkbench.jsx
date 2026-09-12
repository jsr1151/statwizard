import { useMemo, useState } from 'react';
import { FlaskConical, Sparkles } from 'lucide-react';
import BuilderModeButton from './transforms/TransformModeButton.jsx';
import { BUILDER_MODES } from '../../data/dataTransformModes.js';
import DerivedVariableBuilder from './transforms/DerivedVariableBuilder.jsx';
import ReverseCodeBuilder from './transforms/ReverseCodeBuilder.jsx';
import MeanCenterBuilder from './transforms/MeanCenterBuilder.jsx';
import RecodeBuilder from './transforms/RecodeBuilder.jsx';
import RecommendedTransforms from './transforms/RecommendedTransforms.jsx';
import WideToLongTransform from './transforms/WideToLongTransform.jsx';

const DataTransformWorkbench = (props) => {
    const [builderMode, setBuilderMode] = useState('derived');
    const {
        darkMode,
        dataset,
        operationOptions,
        activeOperation,
        derivedDraft,
        setDerivedDraft,
        derivedSearchQuery,
        setDerivedSearchQuery,
        derivedOptions,
        onDerivedOperationChange,
        onToggleDerivedColumn,
        onApplyDerivedVariable,
        recommendedGroups,
        onToggleRecommendedColumn,
        onAddRecommendedColumn,
        onToggleRecommendedReverseColumn,
        onUpdateRecommendedConfig,
        onApplyRecommendedAction,
        onApplyRecommendedReverseAverage,
        numericColumns,
        categoricalColumns,
        reverseCodeDraft,
        setReverseCodeDraft,
        onSelectReverseSource,
        reverseBounds,
        reverseCodePreviewRows,
        onApplyReverseCode,
        meanCenterDraft,
        setMeanCenterDraft,
        onSelectMeanCenterSource,
        onApplyMeanCenter,
        recodeDraft,
        setRecodeDraft,
        onSelectRecodeSource,
        recodeLevels,
        recodePreviewRows,
        onApplyRecode,
        reshapeDraft,
        setReshapeDraft,
        reshapeCandidates,
        selectedReshapeCandidate,
        reshapePlan,
        reshapePreviewDataset,
        onSelectReshapeCandidate,
        onToggleReshapeMeasureGroup,
        onSetReshapeAllowMultiple,
        onUpdateReshapeKeyValueOverride,
        onApplyReshape,
        formatDatasetValue,
    } = props;

    const builderModeLabel = useMemo(
        () => BUILDER_MODES.find(([value]) => value === builderMode)?.[1] || 'Derived variable',
        [builderMode]
    );

    return (
        <div className={`rounded-2xl border p-6 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
            <div className="flex items-center gap-3">
                <FlaskConical size={18} className={darkMode ? 'text-amber-300' : 'text-amber-700'} />
                <div>
                    <h3 className={`text-lg font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>Derived variables and transforms</h3>
                    <p className={`mt-1 text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                        Build new variables, reverse code, mean-center, recode categories, use grouped recommendations, and reshape wide data to long format from one workflow.
                    </p>
                </div>
            </div>

            <div className="mt-6 space-y-6">
                <section className="space-y-4">
                    <div className="flex items-center gap-3">
                        <Sparkles size={16} className={darkMode ? 'text-indigo-300' : 'text-indigo-700'} />
                        <div>
                            <div className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>Builder</div>
                            <div className={`text-base font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>{builderModeLabel}</div>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {BUILDER_MODES.map(([value, label]) => (
                            <BuilderModeButton
                                key={value}
                                darkMode={darkMode}
                                active={builderMode === value}
                                label={label}
                                onClick={() => setBuilderMode(value)}
                            />
                        ))}
                    </div>

                    {builderMode === 'derived' && (
                        <DerivedVariableBuilder {...{
                            darkMode, derivedDraft, onDerivedOperationChange, operationOptions,
                            derivedSearchQuery, setDerivedSearchQuery, setDerivedDraft, onApplyDerivedVariable,
                            activeOperation, derivedOptions, onToggleDerivedColumn,
                        }} />
                    )}

                    {builderMode === 'reverse_code' && (
                        <ReverseCodeBuilder {...{
                            darkMode, reverseCodeDraft, onSelectReverseSource, numericColumns,
                            setReverseCodeDraft, reverseBounds, reverseCodePreviewRows, onApplyReverseCode,
                        }} />
                    )}

                    {builderMode === 'mean_center' && (
                        <MeanCenterBuilder {...{
                            darkMode, meanCenterDraft, onSelectMeanCenterSource, numericColumns,
                            setMeanCenterDraft, onApplyMeanCenter,
                        }} />
                    )}

                    {builderMode === 'recode' && (
                        <RecodeBuilder {...{
                            darkMode, recodeDraft, onSelectRecodeSource, categoricalColumns,
                            setRecodeDraft, onApplyRecode, recodeLevels, recodePreviewRows,
                        }} />
                    )}
                </section>

                <RecommendedTransforms {...{
                    darkMode, recommendedGroups, onApplyRecommendedAction, onToggleRecommendedColumn,
                    onAddRecommendedColumn, onToggleRecommendedReverseColumn, onUpdateRecommendedConfig, onApplyRecommendedReverseAverage,
                }} />

                <WideToLongTransform {...{
                    darkMode, reshapeCandidates, reshapeDraft, onSetReshapeAllowMultiple,
                    selectedReshapeCandidate, onToggleReshapeMeasureGroup, onSelectReshapeCandidate, setReshapeDraft,
                    onUpdateReshapeKeyValueOverride, reshapePlan, reshapePreviewDataset, formatDatasetValue,
                    onApplyReshape,
                }} />
            </div>
        </div>
    );
};

export default DataTransformWorkbench;
