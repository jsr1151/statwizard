import { CheckCircle2, FlaskConical, MoveVertical, Sparkles } from 'lucide-react';
import { formatDatasetValue } from '../../utils/datasetImport.js';
import { DERIVED_OPERATION_OPTIONS } from '../../data/dataManagerOptions.js';
import { normalizeSearch } from '../../utils/dataManagerHelpers.js';
import { matchesColumnSearch } from '../../utils/dataManagerHelpers.js';
import { getObservedBounds } from '../../utils/dataManagerHelpers.js';
import TonePill from './DatasetTonePill.jsx';
import Card from '../analysis/AnalysisCard.jsx';

export default function DatasetLegacyTransforms({
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
}) {
    return (
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
    );
}
