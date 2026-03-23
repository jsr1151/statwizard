import React, { useMemo, useState } from 'react';
import { CheckCircle2, FlaskConical, MoveVertical, Sparkles } from 'lucide-react';

const BUILDER_MODES = [
    ['derived', 'Derived variable'],
    ['reverse_code', 'Reverse code'],
    ['mean_center', 'Mean-center'],
    ['recode', 'Recode categories'],
];

const Panel = ({ darkMode, children, className = '' }) => (
    <div className={`rounded-2xl border p-4 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'} ${className}`}>
        {children}
    </div>
);

const ActionButton = ({ darkMode, children, onClick, primary = false, className = '', disabled = false }) => (
    <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={`rounded-xl px-4 py-3 text-sm font-black uppercase tracking-widest transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${primary
            ? (darkMode ? 'bg-indigo-600 text-white hover:bg-indigo-500' : 'bg-indigo-600 text-white hover:bg-indigo-700')
            : (darkMode ? 'border border-slate-800 bg-slate-900 text-slate-300 hover:text-white' : 'border border-slate-200 bg-white text-slate-700 hover:text-slate-900')
        } ${className}`}
    >
        {children}
    </button>
);

const Pill = ({ darkMode, active = false, children, onClick, className = '' }) => (
    <button
        type="button"
        onClick={onClick}
        className={`rounded-full border px-3 py-2 text-[11px] font-black uppercase tracking-widest transition-colors ${active
            ? (darkMode ? 'bg-indigo-500/10 border-indigo-500/30 text-white' : 'bg-indigo-50 border-indigo-200 text-slate-900')
            : (darkMode ? 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900')
        } ${className}`}
    >
        {children}
    </button>
);

const Label = ({ darkMode, children }) => (
    <span className={`text-[11px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
        {children}
    </span>
);

const formatSummaryValue = (value) => {
    if (value == null || value === '') {
        return '--';
    }

    if (typeof value === 'number' && Number.isFinite(value)) {
        return Number.isInteger(value) ? `${value}` : value.toFixed(2);
    }

    return String(value);
};

const BuilderModeButton = ({ darkMode, active, label, onClick }) => (
    <button
        type="button"
        onClick={onClick}
        className={`rounded-xl border px-4 py-3 text-sm font-black transition-colors ${active
            ? (darkMode ? 'bg-indigo-500/10 border-indigo-500/30 text-white' : 'bg-indigo-50 border-indigo-200 text-slate-900')
            : (darkMode ? 'bg-slate-950 border-slate-800 text-slate-300 hover:text-white' : 'bg-white border-slate-200 text-slate-700 hover:text-slate-900')
        }`}
    >
        {label}
    </button>
);

const EmptyState = ({ darkMode, children }) => (
    <div className={`rounded-xl border px-4 py-5 text-sm ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
        {children}
    </div>
);

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
        reshapePreviewDataset,
        onToggleReshapeColumn,
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
                        <div className="grid gap-4 xl:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
                            <div className="space-y-4">
                                <label className="block">
                                    <Label darkMode={darkMode}>Transformation</Label>
                                    <select
                                        value={derivedDraft.operation}
                                        onChange={(event) => onDerivedOperationChange(event.target.value)}
                                        className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm font-bold outline-none transition-colors ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200 focus:border-indigo-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500'}`}
                                    >
                                        {operationOptions.map((option) => (
                                            <option key={option.id} value={option.id}>{option.label}</option>
                                        ))}
                                    </select>
                                </label>

                                <label className="block">
                                    <Label darkMode={darkMode}>Source search</Label>
                                    <input
                                        value={derivedSearchQuery}
                                        onChange={(event) => setDerivedSearchQuery(event.target.value)}
                                        placeholder="Search by name, tag, or issue"
                                        className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm font-bold outline-none transition-colors ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200 focus:border-indigo-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500'}`}
                                    />
                                </label>

                                <label className="block">
                                    <Label darkMode={darkMode}>New variable label</Label>
                                    <input
                                        value={derivedDraft.outputLabel}
                                        onChange={(event) => setDerivedDraft((previous) => ({ ...previous, outputLabel: event.target.value }))}
                                        placeholder="Leave blank to auto-name"
                                        className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm font-bold outline-none transition-colors ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200 focus:border-indigo-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500'}`}
                                    />
                                </label>

                                <ActionButton darkMode={darkMode} primary onClick={onApplyDerivedVariable} className="w-full">
                                    <span className="inline-flex items-center gap-2">
                                        <CheckCircle2 size={16} />
                                        Add Derived Variable
                                    </span>
                                </ActionButton>

                                <p className={`text-xs ${darkMode ? 'text-slate-500' : 'text-slate-600'}`}>
                                    {activeOperation.mode === 'single'
                                        ? 'Choose one source variable.'
                                        : activeOperation.mode === 'pair'
                                            ? 'Choose exactly two source variables.'
                                            : 'Choose two or more source variables.'}
                                </p>
                            </div>

                            <Panel darkMode={darkMode}>
                                <div className={`mb-3 text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                                    Source variables
                                </div>
                                {!derivedOptions.length && (
                                    <EmptyState darkMode={darkMode}>
                                        No variables match this search yet.
                                    </EmptyState>
                                )}
                                <div className="space-y-2">
                                    {derivedOptions.map((column) => {
                                        const isSelected = derivedDraft.columns.includes(column.id);
                                        const selectionLocked = activeOperation.mode === 'pair' && !isSelected && derivedDraft.columns.length >= 2;

                                        return (
                                            <label
                                                key={`derived-${column.id}`}
                                                className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${selectionLocked ? 'opacity-50' : 'cursor-pointer'} ${isSelected
                                                    ? (darkMode ? 'bg-indigo-500/10 border-indigo-500/30 text-white' : 'bg-indigo-50 border-indigo-200 text-slate-900')
                                                    : (darkMode ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-white border-slate-200 text-slate-700')
                                                }`}
                                            >
                                                <input
                                                    type={activeOperation.mode === 'single' ? 'radio' : 'checkbox'}
                                                    checked={isSelected}
                                                    disabled={selectionLocked}
                                                    onChange={() => {
                                                        if (activeOperation.mode === 'single') {
                                                            setDerivedDraft((previous) => ({ ...previous, columns: [column.id] }));
                                                            return;
                                                        }

                                                        onToggleDerivedColumn(column.id);
                                                    }}
                                                />
                                                <div className="min-w-0">
                                                    <div className="font-bold">{column.label}</div>
                                                    <div className={`text-xs ${darkMode ? 'text-slate-500' : 'text-slate-600'}`}>
                                                        {column.summary?.detectedType} - missing {column.summary?.missingCount || 0}
                                                    </div>
                                                </div>
                                            </label>
                                        );
                                    })}
                                </div>
                            </Panel>
                        </div>
                    )}

                    {builderMode === 'reverse_code' && (
                        <div className="grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
                            <div className="space-y-4">
                                <label className="block">
                                    <Label darkMode={darkMode}>Source variable</Label>
                                    <select
                                        value={reverseCodeDraft.sourceColumnId}
                                        onChange={(event) => onSelectReverseSource(event.target.value)}
                                        className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm font-bold outline-none transition-colors ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200 focus:border-indigo-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500'}`}
                                    >
                                        <option value="">Select numeric variable</option>
                                        {numericColumns.map((column) => (
                                            <option key={column.id} value={column.id}>{column.label}</option>
                                        ))}
                                    </select>
                                </label>

                                <div className="grid gap-4 md:grid-cols-2">
                                    <label className="block">
                                        <Label darkMode={darkMode}>Minimum</Label>
                                        <input
                                            type="number"
                                            value={reverseCodeDraft.minimum}
                                            onChange={(event) => setReverseCodeDraft((previous) => ({ ...previous, minimum: event.target.value }))}
                                            placeholder="Minimum"
                                            className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm font-bold outline-none transition-colors ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200 focus:border-indigo-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500'}`}
                                        />
                                    </label>
                                    <label className="block">
                                        <Label darkMode={darkMode}>Maximum</Label>
                                        <input
                                            type="number"
                                            value={reverseCodeDraft.maximum}
                                            onChange={(event) => setReverseCodeDraft((previous) => ({ ...previous, maximum: event.target.value }))}
                                            placeholder="Maximum"
                                            className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm font-bold outline-none transition-colors ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200 focus:border-indigo-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500'}`}
                                        />
                                    </label>
                                </div>

                                {reverseBounds.min != null && reverseBounds.max != null && (
                                    <ActionButton
                                        darkMode={darkMode}
                                        onClick={() => setReverseCodeDraft((previous) => ({ ...previous, minimum: reverseBounds.min, maximum: reverseBounds.max }))}
                                    >
                                        Use observed range {reverseBounds.min} to {reverseBounds.max}
                                    </ActionButton>
                                )}

                                <label className="block">
                                    <Label darkMode={darkMode}>Output label</Label>
                                    <input
                                        value={reverseCodeDraft.outputLabel}
                                        onChange={(event) => setReverseCodeDraft((previous) => ({ ...previous, outputLabel: event.target.value }))}
                                        placeholder="Create a new reverse-coded variable"
                                        disabled={reverseCodeDraft.overwrite}
                                        className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm font-bold outline-none transition-colors disabled:opacity-50 ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200 focus:border-indigo-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500'}`}
                                    />
                                </label>

                                <label className={`flex items-center justify-between rounded-xl border px-4 py-3 ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                                    <span className="font-bold">Overwrite the existing variable</span>
                                    <input
                                        type="checkbox"
                                        checked={reverseCodeDraft.overwrite}
                                        onChange={(event) => setReverseCodeDraft((previous) => ({ ...previous, overwrite: event.target.checked }))}
                                    />
                                </label>

                                {(reverseCodeDraft.minimum !== '' && reverseCodeDraft.maximum !== '') && (
                                    <Panel darkMode={darkMode}>
                                        <div className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
                                            Formula preview
                                        </div>
                                        <p className={`mt-2 text-sm font-bold ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                                            new = {reverseCodeDraft.maximum} + {reverseCodeDraft.minimum} - old
                                        </p>
                                        {!!reverseCodePreviewRows.length && (
                                            <div className="mt-4 grid gap-2 sm:grid-cols-2">
                                                {reverseCodePreviewRows.map((item, index) => (
                                                    <div
                                                        key={`reverse-preview-${index}`}
                                                        className={`rounded-lg border px-3 py-2 text-sm ${darkMode ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-white border-slate-200 text-slate-700'}`}
                                                    >
                                                        {item.oldValue} {'->'} {item.newValue}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </Panel>
                                )}

                                <ActionButton darkMode={darkMode} primary onClick={onApplyReverseCode} className="w-full">
                                    <span className="inline-flex items-center gap-2">
                                        <CheckCircle2 size={16} />
                                        Apply Reverse Code
                                    </span>
                                </ActionButton>
                            </div>

                            <Panel darkMode={darkMode}>
                                <div className={`mb-3 text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                                    Numeric variables
                                </div>
                                {!numericColumns.length && (
                                    <EmptyState darkMode={darkMode}>
                                        No numeric variables are available for reverse coding.
                                    </EmptyState>
                                )}
                                <div className="space-y-2">
                                    {numericColumns.map((column) => (
                                        <label
                                            key={`reverse-source-${column.id}`}
                                            className={`flex items-center gap-3 rounded-xl border px-4 py-3 cursor-pointer ${reverseCodeDraft.sourceColumnId === column.id
                                                ? (darkMode ? 'bg-indigo-500/10 border-indigo-500/30 text-white' : 'bg-indigo-50 border-indigo-200 text-slate-900')
                                                : (darkMode ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-white border-slate-200 text-slate-700')
                                            }`}
                                        >
                                            <input
                                                type="radio"
                                                checked={reverseCodeDraft.sourceColumnId === column.id}
                                                onChange={() => onSelectReverseSource(column.id)}
                                            />
                                            <div className="min-w-0">
                                                <div className="font-bold">{column.label}</div>
                                                <div className={`text-xs ${darkMode ? 'text-slate-500' : 'text-slate-600'}`}>
                                                    min {formatSummaryValue(column.summary?.numeric?.minimum)} | max {formatSummaryValue(column.summary?.numeric?.maximum)}
                                                </div>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </Panel>
                        </div>
                    )}

                    {builderMode === 'mean_center' && (
                        <div className="grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
                            <div className="space-y-4">
                                <label className="block">
                                    <Label darkMode={darkMode}>Source variable</Label>
                                    <select
                                        value={meanCenterDraft.sourceColumnId}
                                        onChange={(event) => onSelectMeanCenterSource(event.target.value)}
                                        className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm font-bold outline-none transition-colors ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200 focus:border-indigo-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500'}`}
                                    >
                                        <option value="">Select numeric variable</option>
                                        {numericColumns.map((column) => (
                                            <option key={column.id} value={column.id}>{column.label}</option>
                                        ))}
                                    </select>
                                </label>

                                <label className="block">
                                    <Label darkMode={darkMode}>New variable label</Label>
                                    <input
                                        value={meanCenterDraft.outputLabel}
                                        onChange={(event) => setMeanCenterDraft((previous) => ({ ...previous, outputLabel: event.target.value }))}
                                        placeholder="StudyHours_centered"
                                        className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm font-bold outline-none transition-colors ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200 focus:border-indigo-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500'}`}
                                    />
                                </label>

                                <ActionButton darkMode={darkMode} primary onClick={onApplyMeanCenter} className="w-full">
                                    <span className="inline-flex items-center gap-2">
                                        <CheckCircle2 size={16} />
                                        Create Centered Variable
                                    </span>
                                </ActionButton>
                            </div>

                            <Panel darkMode={darkMode}>
                                <div className={`mb-3 text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                                    Numeric variables
                                </div>
                                {!numericColumns.length && (
                                    <EmptyState darkMode={darkMode}>
                                        No numeric variables are available to mean-center.
                                    </EmptyState>
                                )}
                                <div className="space-y-2">
                                    {numericColumns.map((column) => (
                                        <label
                                            key={`center-source-${column.id}`}
                                            className={`flex items-center gap-3 rounded-xl border px-4 py-3 cursor-pointer ${meanCenterDraft.sourceColumnId === column.id
                                                ? (darkMode ? 'bg-indigo-500/10 border-indigo-500/30 text-white' : 'bg-indigo-50 border-indigo-200 text-slate-900')
                                                : (darkMode ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-white border-slate-200 text-slate-700')
                                            }`}
                                        >
                                            <input
                                                type="radio"
                                                checked={meanCenterDraft.sourceColumnId === column.id}
                                                onChange={() => onSelectMeanCenterSource(column.id)}
                                            />
                                            <div className="min-w-0">
                                                <div className="font-bold">{column.label}</div>
                                                <div className={`text-xs ${darkMode ? 'text-slate-500' : 'text-slate-600'}`}>
                                                    mean {formatSummaryValue(column.summary?.numeric?.mean)}
                                                </div>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </Panel>
                        </div>
                    )}

                    {builderMode === 'recode' && (
                        <div className="grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
                            <div className="space-y-4">
                                <label className="block">
                                    <Label darkMode={darkMode}>Source variable</Label>
                                    <select
                                        value={recodeDraft.sourceColumnId}
                                        onChange={(event) => onSelectRecodeSource(event.target.value)}
                                        className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm font-bold outline-none transition-colors ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200 focus:border-indigo-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500'}`}
                                    >
                                        <option value="">Select categorical variable</option>
                                        {categoricalColumns.map((column) => (
                                            <option key={column.id} value={column.id}>{column.label}</option>
                                        ))}
                                    </select>
                                </label>

                                <label className="block">
                                    <Label darkMode={darkMode}>Output label</Label>
                                    <input
                                        value={recodeDraft.outputLabel}
                                        onChange={(event) => setRecodeDraft((previous) => ({ ...previous, outputLabel: event.target.value }))}
                                        disabled={recodeDraft.overwrite}
                                        placeholder="Leave blank to auto-name"
                                        className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm font-bold outline-none transition-colors disabled:opacity-50 ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200 focus:border-indigo-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500'}`}
                                    />
                                </label>

                                <label className={`flex items-center justify-between rounded-xl border px-4 py-3 ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                                    <span className="font-bold">Overwrite the existing variable</span>
                                    <input
                                        type="checkbox"
                                        checked={recodeDraft.overwrite}
                                        onChange={(event) => setRecodeDraft((previous) => ({ ...previous, overwrite: event.target.checked }))}
                                    />
                                </label>

                                <ActionButton darkMode={darkMode} primary onClick={onApplyRecode} className="w-full">
                                    <span className="inline-flex items-center gap-2">
                                        <CheckCircle2 size={16} />
                                        Apply Category Mapping
                                    </span>
                                </ActionButton>
                            </div>

                            <div className="space-y-4">
                                <Panel darkMode={darkMode}>
                                    <div className={`mb-3 text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                                        Category mapping
                                    </div>
                                    {!recodeLevels.length && (
                                        <EmptyState darkMode={darkMode}>
                                            Choose a categorical variable to map old values into new categories.
                                        </EmptyState>
                                    )}
                                    <div className="space-y-3 max-h-[20rem] overflow-y-auto pr-1">
                                        {recodeLevels.map((level) => (
                                            <div key={level} className={`rounded-xl border p-3 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                                                <div className={`text-xs font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                                                    {level}
                                                </div>
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
                                </Panel>

                                {!!recodePreviewRows.length && (
                                    <Panel darkMode={darkMode}>
                                        <div className={`mb-3 text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
                                            Preview
                                        </div>
                                        <div className="space-y-2">
                                            {recodePreviewRows.map((item) => (
                                                <div
                                                    key={`${item.oldValue}-${item.newValue}`}
                                                    className={`rounded-lg border px-3 py-2 text-sm ${darkMode ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-white border-slate-200 text-slate-700'}`}
                                                >
                                                    {item.oldValue} {'->'} {item.newValue} ({item.count})
                                                </div>
                                            ))}
                                        </div>
                                    </Panel>
                                )}
                            </div>
                        </div>
                    )}
                </section>

                <section className="space-y-4">
                    <div className="flex items-center gap-3">
                        <Sparkles size={16} className={darkMode ? 'text-indigo-300' : 'text-indigo-700'} />
                        <div>
                            <div className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
                                Recommendations
                            </div>
                            <div className={`text-base font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                Suggested grouped transforms
                            </div>
                        </div>
                    </div>

                    <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                        These suggestions look for repeated naming patterns. You can remove suggested variables, add more, choose reverse-coded items, then apply the group action directly.
                    </p>

                    {!recommendedGroups.length && (
                        <EmptyState darkMode={darkMode}>
                            No grouped naming patterns were detected yet.
                        </EmptyState>
                    )}

                    <div className="space-y-4">
                        {recommendedGroups.map((group) => (
                            <Panel key={group.id} darkMode={darkMode}>
                                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                                    <div>
                                        <div className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
                                            {group.prefix}
                                        </div>
                                        <div className={`mt-1 text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                            {group.selectedColumns.length} selected variable{group.selectedColumns.length === 1 ? '' : 's'}
                                        </div>
                                    </div>

                                    {group.numericOnly ? (
                                        <div className="flex flex-wrap gap-2">
                                            <ActionButton darkMode={darkMode} primary onClick={() => onApplyRecommendedAction(group, 'average')}>
                                                Average
                                            </ActionButton>
                                            <ActionButton darkMode={darkMode} onClick={() => onApplyRecommendedAction(group, 'sum')}>
                                                Sum
                                            </ActionButton>
                                            <ActionButton darkMode={darkMode} onClick={() => onApplyRecommendedAction(group, 'scale')}>
                                                Scale Score
                                            </ActionButton>
                                            <ActionButton darkMode={darkMode} onClick={() => onApplyRecommendedAction(group, 'center_group')}>
                                                Mean-Center Group
                                            </ActionButton>
                                        </div>
                                    ) : (
                                        <div className={`text-sm ${darkMode ? 'text-slate-500' : 'text-slate-600'}`}>
                                            Direct group actions need numeric variables.
                                        </div>
                                    )}
                                </div>

                                <div className="mt-4 space-y-4">
                                    <div>
                                        <Label darkMode={darkMode}>Selected variables</Label>
                                        <div className="mt-2 flex flex-wrap gap-2">
                                            {!group.selectedColumns.length && (
                                                <span className={`text-sm ${darkMode ? 'text-slate-500' : 'text-slate-600'}`}>
                                                    Choose at least one variable for this group.
                                                </span>
                                            )}
                                            {group.selectedColumns.map((column) => (
                                                <Pill
                                                    key={`${group.id}-${column.id}`}
                                                    darkMode={darkMode}
                                                    active
                                                    onClick={() => onToggleRecommendedColumn(group, column.id)}
                                                >
                                                    {column.label} x
                                                </Pill>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto]">
                                        <label className="block">
                                            <Label darkMode={darkMode}>Add variable to this group</Label>
                                            <select
                                                value=""
                                                onChange={(event) => {
                                                    onAddRecommendedColumn(group, event.target.value);
                                                    event.target.value = '';
                                                }}
                                                className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm font-bold outline-none transition-colors ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200 focus:border-indigo-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500'}`}
                                            >
                                                <option value="">Choose another variable</option>
                                                {group.availableColumns.map((column) => (
                                                    <option key={`${group.id}-add-${column.id}`} value={column.id}>{column.label}</option>
                                                ))}
                                            </select>
                                        </label>

                                        {group.numericOnly && (
                                            <div className={`rounded-xl border px-4 py-3 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                                                <div className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                                                    Observed scale
                                                </div>
                                                <div className={`mt-2 text-sm font-bold ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                                                    {formatSummaryValue(group.bounds.min)} to {formatSummaryValue(group.bounds.max)}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {group.numericOnly && (
                                        <Panel darkMode={darkMode} className={darkMode ? 'bg-slate-900' : 'bg-white'}>
                                            <div className={`mb-3 text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                                                Reverse selected items, then average
                                            </div>

                                            <div className="space-y-4">
                                                <div className="flex flex-wrap gap-2">
                                                    {group.selectedColumns.map((column) => (
                                                        <Pill
                                                            key={`${group.id}-${column.id}-reverse`}
                                                            darkMode={darkMode}
                                                            active={group.reverseColumnIds.includes(column.id)}
                                                            onClick={() => onToggleRecommendedReverseColumn(group, column.id)}
                                                        >
                                                            {column.label}
                                                        </Pill>
                                                    ))}
                                                </div>

                                                <div className="grid gap-4 md:grid-cols-2">
                                                    <label className="block">
                                                        <Label darkMode={darkMode}>Minimum</Label>
                                                        <input
                                                            type="number"
                                                            value={group.minimum}
                                                            onChange={(event) => onUpdateRecommendedConfig(group.id, { minimum: event.target.value })}
                                                            placeholder="Min"
                                                            className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm font-bold outline-none transition-colors ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200 focus:border-indigo-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500'}`}
                                                        />
                                                    </label>
                                                    <label className="block">
                                                        <Label darkMode={darkMode}>Maximum</Label>
                                                        <input
                                                            type="number"
                                                            value={group.maximum}
                                                            onChange={(event) => onUpdateRecommendedConfig(group.id, { maximum: event.target.value })}
                                                            placeholder="Max"
                                                            className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm font-bold outline-none transition-colors ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200 focus:border-indigo-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500'}`}
                                                        />
                                                    </label>
                                                </div>

                                                <ActionButton darkMode={darkMode} primary onClick={() => onApplyRecommendedReverseAverage(group)}>
                                                    Reverse + Average
                                                </ActionButton>
                                            </div>
                                        </Panel>
                                    )}
                                </div>
                            </Panel>
                        ))}
                    </div>
                </section>

                <section className="space-y-4">
                    <div className="flex items-center gap-3">
                        <MoveVertical size={16} className={darkMode ? 'text-sky-300' : 'text-sky-700'} />
                        <div>
                            <div className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-sky-400' : 'text-sky-600'}`}>
                                Reshape
                            </div>
                            <div className={`text-base font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                Wide to long
                            </div>
                        </div>
                    </div>

                    <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                        Choose the repeated-measures variables to pivot into a single long column, keep ID columns separate, then name the new key and value columns before saving the reshaped dataset.
                    </p>

                    <div className="grid gap-4 xl:grid-cols-2">
                        <Panel darkMode={darkMode}>
                            <div className={`mb-3 text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                                1. Variables to pivot into long format
                            </div>
                            <div className="space-y-2 max-h-[18rem] overflow-y-auto pr-1">
                                {(dataset?.columns || []).map((column) => {
                                    const checked = reshapeDraft.pivotColumnIds.includes(column.id);
                                    return (
                                        <label
                                            key={`reshape-pivot-${column.id}`}
                                            className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${checked
                                                ? (darkMode ? 'bg-indigo-500/10 border-indigo-500/30 text-white' : 'bg-indigo-50 border-indigo-200 text-slate-900')
                                                : (darkMode ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-white border-slate-200 text-slate-700')
                                            }`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={checked}
                                                onChange={() => onToggleReshapeColumn(column.id, 'pivotColumnIds')}
                                            />
                                            <div className="min-w-0">
                                                <div className="font-bold">{column.label}</div>
                                                <div className={`text-xs ${darkMode ? 'text-slate-500' : 'text-slate-600'}`}>
                                                    {column.summary?.detectedType}
                                                </div>
                                            </div>
                                        </label>
                                    );
                                })}
                            </div>
                        </Panel>

                        <Panel darkMode={darkMode}>
                            <div className={`mb-3 text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                                2. Identifier columns to preserve
                            </div>
                            <div className="space-y-2 max-h-[18rem] overflow-y-auto pr-1">
                                {(dataset?.columns || []).map((column) => {
                                    const checked = reshapeDraft.idColumnIds.includes(column.id);
                                    return (
                                        <label
                                            key={`reshape-id-${column.id}`}
                                            className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${checked
                                                ? (darkMode ? 'bg-indigo-500/10 border-indigo-500/30 text-white' : 'bg-indigo-50 border-indigo-200 text-slate-900')
                                                : (darkMode ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-white border-slate-200 text-slate-700')
                                            }`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={checked}
                                                onChange={() => onToggleReshapeColumn(column.id, 'idColumnIds')}
                                            />
                                            <div className="min-w-0">
                                                <div className="font-bold">{column.label}</div>
                                                <div className={`text-xs ${darkMode ? 'text-slate-500' : 'text-slate-600'}`}>
                                                    {column.summary?.detectedType}
                                                </div>
                                            </div>
                                        </label>
                                    );
                                })}
                            </div>
                        </Panel>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <label className="block">
                            <Label darkMode={darkMode}>3. New key column name</Label>
                            <input
                                value={reshapeDraft.keyColumnLabel}
                                onChange={(event) => setReshapeDraft((previous) => ({ ...previous, keyColumnLabel: event.target.value }))}
                                placeholder="timepoint"
                                className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm font-bold outline-none transition-colors ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200 focus:border-indigo-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500'}`}
                            />
                        </label>
                        <label className="block">
                            <Label darkMode={darkMode}>4. New value column name</Label>
                            <input
                                value={reshapeDraft.valueColumnLabel}
                                onChange={(event) => setReshapeDraft((previous) => ({ ...previous, valueColumnLabel: event.target.value }))}
                                placeholder="value"
                                className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm font-bold outline-none transition-colors ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200 focus:border-indigo-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500'}`}
                            />
                        </label>
                    </div>

                    {reshapePreviewDataset && (
                        <Panel darkMode={darkMode}>
                            <div className="grid gap-4 xl:grid-cols-[auto_auto_1fr]">
                                <div>
                                    <div className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                                        Preview rows
                                    </div>
                                    <div className={`mt-2 text-sm font-bold ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                                        {reshapePreviewDataset.rows.length}
                                    </div>
                                </div>
                                <div>
                                    <div className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                                        Preview columns
                                    </div>
                                    <div className={`mt-2 text-sm font-bold ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                                        {reshapePreviewDataset.columns.length}
                                    </div>
                                </div>
                                <div className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                    Each original row becomes one row per selected pivot variable, while the chosen identifier columns are copied into each long-format row.
                                </div>
                            </div>

                            <div className="mt-4 overflow-x-auto">
                                <table className="min-w-full text-sm">
                                    <thead>
                                        <tr className={darkMode ? 'text-slate-500' : 'text-slate-500'}>
                                            {reshapePreviewDataset.columns.map((column) => (
                                                <th key={`reshape-preview-head-${column.id}`} className="pb-3 pr-4 text-left text-[10px] font-black uppercase tracking-widest">
                                                    {column.label}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {reshapePreviewDataset.rows.slice(0, 10).map((row) => (
                                            <tr
                                                key={`reshape-preview-row-${row.__rowId}`}
                                                className={`border-t ${darkMode ? 'border-slate-800 text-slate-300' : 'border-slate-200 text-slate-700'}`}
                                            >
                                                {reshapePreviewDataset.columns.map((column) => (
                                                    <td key={`${row.__rowId}-${column.id}`} className="py-2 pr-4">
                                                        {formatDatasetValue(row[column.id]) || '--'}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </Panel>
                    )}

                    <ActionButton darkMode={darkMode} primary onClick={onApplyReshape} className="w-full sm:w-auto">
                        <span className="inline-flex items-center gap-2">
                            <CheckCircle2 size={16} />
                            Reshape to Long
                        </span>
                    </ActionButton>
                </section>
            </div>
        </div>
    );
};

export default DataTransformWorkbench;
