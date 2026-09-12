import { CheckCircle2, MoveVertical } from 'lucide-react';
import Panel from './TransformPanel.jsx';
import ActionButton from './TransformActionButton.jsx';
import Pill from './TransformPill.jsx';
import Label from './TransformLabel.jsx';
import EmptyState from './TransformEmptyState.jsx';

export default function WideToLongTransform({
    darkMode, reshapeCandidates, reshapeDraft, onSetReshapeAllowMultiple,
    selectedReshapeCandidate, onToggleReshapeMeasureGroup, onSelectReshapeCandidate, setReshapeDraft,
    onUpdateReshapeKeyValueOverride, reshapePlan, reshapePreviewDataset, formatDatasetValue,
    onApplyReshape,
}) {
    return (
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
                Pick the repeated-measures variable you want condensed into long format, let StatWizard create a smart grouping variable such as `Time`, and preview which columns will be copied forward automatically.
            </p>

            {!reshapeCandidates.length && (
                <EmptyState darkMode={darkMode}>
                    StatWizard did not detect a repeated-measures pattern yet. This smart reshape looks for labels such as `Confidence Time 1` / `Confidence Time 2`, `Calmness T1` / `Calmness T2`, or `Stress (Pre)` / `Stress (Post)`.
                </EmptyState>
            )}

            {reshapeCandidates.length > 0 && (
                <>
                    <Panel darkMode={darkMode}>
                        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                            <div>
                                <div className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                                    1. Variable to condense into long format
                                </div>
                                <div className={`mt-2 text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                    Default to one repeated-measures variable, or turn on multi-variable mode if you want several long-format columns created together.
                                </div>
                            </div>

                            <label className={`flex items-center justify-between gap-4 rounded-xl border px-4 py-3 ${darkMode ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-white border-slate-200 text-slate-700'}`}>
                                <div>
                                    <div className="font-bold">Allow multiple long columns</div>
                                    <div className={`mt-1 text-xs ${darkMode ? 'text-slate-500' : 'text-slate-600'}`}>
                                        Keep this off when you only need one condensed variable.
                                    </div>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={reshapeDraft.allowMultipleMeasureGroups}
                                    onChange={(event) => onSetReshapeAllowMultiple(event.target.checked)}
                                />
                            </label>
                        </div>

                        <div className="mt-4 space-y-2 max-h-[18rem] overflow-y-auto pr-1">
                            {selectedReshapeCandidate?.measureGroups.map((measureGroup) => {
                                const checked = reshapeDraft.selectedMeasureGroupIds.includes(measureGroup.id);
                                return (
                                    <label
                                        key={`reshape-measure-group-${measureGroup.id}`}
                                        className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${checked
                                            ? (darkMode ? 'bg-indigo-500/10 border-indigo-500/30 text-white' : 'bg-indigo-50 border-indigo-200 text-slate-900')
                                            : (darkMode ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-white border-slate-200 text-slate-700')
                                        }`}
                                    >
                                        <input
                                            type={reshapeDraft.allowMultipleMeasureGroups ? 'checkbox' : 'radio'}
                                            name="reshape-measure-group"
                                            checked={checked}
                                            onChange={() => onToggleReshapeMeasureGroup(measureGroup.id)}
                                        />
                                        <div className="min-w-0 flex-1">
                                            <div className="font-bold">{measureGroup.label}</div>
                                            <div className={`mt-1 text-xs ${darkMode ? 'text-slate-500' : 'text-slate-600'}`}>
                                                Detected {selectedReshapeCandidate.dimensionLabel.toLowerCase()} values: {measureGroup.keyValues.join(', ')}
                                            </div>
                                        </div>
                                    </label>
                                );
                            })}
                        </div>
                    </Panel>

                    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
                        <Panel darkMode={darkMode}>
                            <div className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                                2. Smart grouping variable to create
                            </div>
                            <div className={`mt-2 text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                StatWizard can infer a grouping variable from the selected wide columns and use it to build the long-format rows automatically.
                            </div>

                            <div className="mt-4 flex flex-wrap gap-2">
                                {reshapeCandidates.map((candidate) => (
                                    <Pill
                                        key={candidate.id}
                                        darkMode={darkMode}
                                        active={selectedReshapeCandidate?.id === candidate.id}
                                        onClick={() => onSelectReshapeCandidate(candidate.id)}
                                    >
                                        {candidate.dimensionLabel}: {candidate.keyValues.join(', ')}
                                    </Pill>
                                ))}
                            </div>

                            <label className="mt-4 block">
                                <Label darkMode={darkMode}>New grouping column name</Label>
                                <input
                                    value={reshapeDraft.keyColumnLabel}
                                    onChange={(event) => setReshapeDraft((previous) => ({ ...previous, keyColumnLabel: event.target.value }))}
                                    placeholder={selectedReshapeCandidate?.dimensionLabel || 'Timepoint'}
                                    className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm font-bold outline-none transition-colors ${darkMode ? 'bg-slate-900 border-slate-800 text-slate-200 focus:border-indigo-500' : 'bg-white border-slate-200 text-slate-900 focus:border-indigo-500'}`}
                                />
                            </label>

                            {!!selectedReshapeCandidate?.keyValues?.length && (
                                <div className="mt-4">
                                    <Label darkMode={darkMode}>Manual grouping value labels</Label>
                                    <div className="mt-3 space-y-3">
                                        {selectedReshapeCandidate.keyValues.map((keyValue) => (
                                            <div key={`reshape-key-override-${keyValue}`} className="grid gap-3 md:grid-cols-[minmax(0,0.45fr)_minmax(0,0.55fr)]">
                                                <div className={`rounded-xl border px-4 py-3 text-sm font-bold ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                                                    Detected: {keyValue}
                                                </div>
                                                <input
                                                    value={reshapeDraft.keyValueOverrides?.[keyValue] || ''}
                                                    onChange={(event) => onUpdateReshapeKeyValueOverride(keyValue, event.target.value)}
                                                    placeholder={`Keep ${keyValue} or rename it`}
                                                    className={`rounded-xl border px-4 py-3 text-sm font-bold outline-none transition-colors ${darkMode ? 'bg-slate-900 border-slate-800 text-slate-200 focus:border-indigo-500' : 'bg-white border-slate-200 text-slate-900 focus:border-indigo-500'}`}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                    <div className={`mt-3 text-xs ${darkMode ? 'text-slate-500' : 'text-slate-600'}`}>
                                        Use this when the detected values should become factor labels like `Control` and `Treatment` instead of the raw source labels.
                                    </div>
                                </div>
                            )}
                        </Panel>

                        <Panel darkMode={darkMode}>
                            <div className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                                3. Columns copied forward automatically
                            </div>
                            {reshapePlan?.idColumns?.length ? (
                                <div className="mt-3 flex flex-wrap gap-2">
                                    {reshapePlan.idColumns.map((column) => (
                                        <span
                                            key={`reshape-carry-column-${column.id}`}
                                            className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-widest ${darkMode ? 'border-slate-700 bg-slate-900 text-slate-300' : 'border-slate-200 bg-white text-slate-700'}`}
                                        >
                                            {column.label}
                                        </span>
                                    ))}
                                </div>
                            ) : (
                                <div className={`mt-3 text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                    No stable columns were detected outside the repeated-measures structure, so the reshaped result will mainly contain the new grouping variable and the selected long-format variables.
                                </div>
                            )}

                            {reshapePlan?.omittedMeasureGroups?.length > 0 && (
                                <div className={`mt-4 text-sm ${darkMode ? 'text-amber-200' : 'text-amber-700'}`}>
                                    Not currently merged: {reshapePlan.omittedMeasureGroups.map((measureGroup) => measureGroup.label).join(', ')}
                                </div>
                            )}
                        </Panel>
                    </div>
                </>
            )}

            {reshapeCandidates.length > 0 && reshapePlan && !reshapePlan.ok && (
                <Panel darkMode={darkMode} className={darkMode ? 'border-rose-500/30 bg-rose-500/10' : 'border-rose-200 bg-rose-50'}>
                    <div className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-rose-300' : 'text-rose-700'}`}>
                        Reshape issue
                    </div>
                    <div className={`mt-2 text-sm font-bold ${darkMode ? 'text-rose-100' : 'text-rose-900'}`}>
                        {reshapePlan.errors[0]}
                    </div>
                </Panel>
            )}

            {reshapeCandidates.length > 0 && reshapePlan?.ok && (
                <Panel darkMode={darkMode}>
                    <div className="grid gap-4 xl:grid-cols-[auto_1fr]">
                        <div>
                            <div className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                                Detected {selectedReshapeCandidate?.dimensionLabel || 'grouping'} values
                            </div>
                            <div className={`mt-2 flex flex-wrap gap-2 text-sm font-bold ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                                {reshapePlan.keyLevels.map((keyValue) => (
                                    <span
                                        key={`reshape-key-level-${keyValue}`}
                                        className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-widest ${darkMode ? 'border-indigo-500/30 bg-indigo-500/10 text-indigo-200' : 'border-indigo-200 bg-indigo-50 text-indigo-700'}`}
                                    >
                                        {keyValue}
                                    </span>
                                ))}
                            </div>
                        </div>
                        <div className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                            Each original case becomes one row per detected {selectedReshapeCandidate?.dimensionLabel?.toLowerCase() || 'grouping'} value. The selected repeated-measures variable becomes one long-format column, while stable columns such as participant ID or age are copied into each row automatically.
                        </div>
                    </div>
                </Panel>
            )}

            {reshapeCandidates.length > 0 && reshapePreviewDataset && (
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
                            The preview shows the selected long-format variable(s), the new grouping column, and every non-repeated column that will be copied forward into each reshaped row.
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

            {reshapeCandidates.length > 0 && (
                <ActionButton darkMode={darkMode} primary onClick={onApplyReshape} className="w-full sm:w-auto">
                    <span className="inline-flex items-center gap-2">
                        <CheckCircle2 size={16} />
                        Reshape to Long
                    </span>
                </ActionButton>
            )}
        </section>
    );
}
