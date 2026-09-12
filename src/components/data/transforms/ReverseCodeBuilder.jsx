import { CheckCircle2 } from 'lucide-react';
import Panel from './TransformPanel.jsx';
import ActionButton from './TransformActionButton.jsx';
import Label from './TransformLabel.jsx';
import EmptyState from './TransformEmptyState.jsx';
import { formatSummaryValue } from '../../../utils/dataTransformDisplay.js';

export default function ReverseCodeBuilder({
    darkMode, reverseCodeDraft, onSelectReverseSource, numericColumns,
    setReverseCodeDraft, reverseBounds, reverseCodePreviewRows, onApplyReverseCode,
}) {
    return (
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
    );
}
