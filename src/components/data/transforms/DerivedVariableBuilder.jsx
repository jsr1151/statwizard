import { CheckCircle2 } from 'lucide-react';
import Panel from './TransformPanel.jsx';
import ActionButton from './TransformActionButton.jsx';
import Label from './TransformLabel.jsx';
import EmptyState from './TransformEmptyState.jsx';

export default function DerivedVariableBuilder({
    darkMode, derivedDraft, onDerivedOperationChange, operationOptions,
    derivedSearchQuery, setDerivedSearchQuery, setDerivedDraft, onApplyDerivedVariable,
    activeOperation, derivedOptions, onToggleDerivedColumn,
}) {
    return (
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
    );
}
