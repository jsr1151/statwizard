import { CheckCircle2 } from 'lucide-react';
import Panel from './TransformPanel.jsx';
import ActionButton from './TransformActionButton.jsx';
import Label from './TransformLabel.jsx';
import EmptyState from './TransformEmptyState.jsx';
import { formatSummaryValue } from '../../../utils/dataTransformDisplay.js';

export default function MeanCenterBuilder({
    darkMode, meanCenterDraft, onSelectMeanCenterSource, numericColumns,
    setMeanCenterDraft, onApplyMeanCenter,
}) {
    return (
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
    );
}
