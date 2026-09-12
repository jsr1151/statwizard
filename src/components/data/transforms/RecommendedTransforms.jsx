import { Sparkles } from 'lucide-react';
import Panel from './TransformPanel.jsx';
import ActionButton from './TransformActionButton.jsx';
import Pill from './TransformPill.jsx';
import Label from './TransformLabel.jsx';
import EmptyState from './TransformEmptyState.jsx';
import { formatSummaryValue } from '../../../utils/dataTransformDisplay.js';

export default function RecommendedTransforms({
    darkMode, recommendedGroups, onApplyRecommendedAction, onToggleRecommendedColumn,
    onAddRecommendedColumn, onToggleRecommendedReverseColumn, onUpdateRecommendedConfig, onApplyRecommendedReverseAverage,
}) {
    return (
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
    );
}
