import { CheckCircle2 } from 'lucide-react';
import Panel from './TransformPanel.jsx';
import ActionButton from './TransformActionButton.jsx';
import Label from './TransformLabel.jsx';
import EmptyState from './TransformEmptyState.jsx';

export default function RecodeBuilder({
    darkMode, recodeDraft, onSelectRecodeSource, categoricalColumns,
    setRecodeDraft, onApplyRecode, recodeLevels, recodePreviewRows,
}) {
    return (
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
    );
}
