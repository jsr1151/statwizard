import React, { useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, Search, Trash2, X } from 'lucide-react';

const FILTERS = ['All', 'Numeric', 'Categorical', 'Derived', 'Identifier'];

const TonePill = ({ darkMode, children, tone = 'default', onClick }) => {
    const toneClass = tone === 'warning'
        ? (darkMode ? 'bg-amber-500/10 text-amber-200 border-amber-500/20' : 'bg-amber-50 text-amber-700 border-amber-200')
        : tone === 'primary'
            ? (darkMode ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20' : 'bg-indigo-50 text-indigo-700 border-indigo-200')
            : (darkMode ? 'bg-slate-950 text-slate-400 border-slate-800' : 'bg-slate-50 text-slate-600 border-slate-200');

    const Tag = onClick ? 'button' : 'span';

    return (
        <Tag
            type={onClick ? 'button' : undefined}
            onClick={onClick}
            className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-widest ${toneClass}`}
        >
            {children}
        </Tag>
    );
};

const matchesFilter = (column, filter) => {
    if (filter === 'All') {
        return true;
    }

    if (filter === 'Numeric') {
        return column.summary?.detectedType === 'numeric';
    }

    if (filter === 'Categorical') {
        return column.summary?.detectedType === 'categorical';
    }

    if (filter === 'Derived') {
        return column.derived;
    }

    if (filter === 'Identifier') {
        return (column.tags || []).includes('identifier') || (column.summary?.issues || []).includes('Identifier');
    }

    return true;
};

const matchesSearch = (column, query) => {
    if (!query) {
        return true;
    }

    const haystack = [
        column.label,
        column.originalName,
        column.summary?.detectedType,
        ...(column.tags || []),
        ...(column.summary?.issues || []),
    ].join(' ').toLowerCase();

    return haystack.includes(query.toLowerCase());
};

const VariableBrowser = ({
    darkMode,
    dataset,
    onUpdateLabel,
    onCommitLabel,
    onDeleteVariable,
    onAddTag,
    onRemoveManualTag,
    onHideAutoTag,
    onRestoreHiddenAutoTag,
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState('All');
    const [expandedVariableId, setExpandedVariableId] = useState(null);
    const [tagInputByColumn, setTagInputByColumn] = useState({});

    const visibleColumns = useMemo(
        () => (dataset?.columns || []).filter((column) => matchesFilter(column, activeFilter) && matchesSearch(column, searchQuery)),
        [activeFilter, dataset?.columns, searchQuery]
    );

    return (
        <div className="space-y-5">
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-center">
                <label className="block">
                    <span className={`text-[11px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                        Search variables
                    </span>
                    <div className={`mt-2 flex items-center gap-3 rounded-xl border px-4 py-3 ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-900'}`}>
                        <Search size={16} className={darkMode ? 'text-slate-500' : 'text-slate-500'} />
                        <input
                            value={searchQuery}
                            onChange={(event) => setSearchQuery(event.target.value)}
                            placeholder="Search by label, raw name, chip, or issue"
                            className="w-full bg-transparent text-sm font-medium outline-none"
                        />
                    </div>
                </label>

                <div className="flex flex-wrap gap-2 xl:justify-end">
                    {FILTERS.map((filter) => (
                        <button
                            key={filter}
                            type="button"
                            onClick={() => setActiveFilter(filter)}
                            className={`rounded-full border px-3 py-2 text-[11px] font-black uppercase tracking-widest ${activeFilter === filter
                                ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300'
                                : (darkMode ? 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700 hover:text-slate-200' : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:text-slate-900')
                            }`}
                        >
                            {filter}
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-3">
                {!visibleColumns.length && (
                    <div className={`rounded-2xl border px-4 py-5 text-sm ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                        No variables match the current search or filter.
                    </div>
                )}

                {visibleColumns.map((column) => {
                    const expanded = expandedVariableId === column.id;
                    const matched = searchQuery && matchesSearch(column, searchQuery);

                    return (
                        <div
                            key={column.id}
                            className={`rounded-2xl border transition-colors ${matched
                                ? (darkMode ? 'bg-indigo-500/5 border-indigo-500/20' : 'bg-indigo-50/60 border-indigo-200')
                                : (darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200')
                            }`}
                        >
                            <button
                                type="button"
                                onClick={() => setExpandedVariableId((previous) => previous === column.id ? null : column.id)}
                                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                            >
                                <div className="min-w-0">
                                    <div className={`font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                        {column.label}
                                    </div>
                                    <div className={`mt-1 text-xs ${darkMode ? 'text-slate-500' : 'text-slate-600'}`}>
                                        {column.originalName} • {column.sourceKind} • missing {column.summary?.missingCount || 0}
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    {(column.tags || []).slice(0, 3).map((tag) => (
                                        <TonePill
                                            key={`${column.id}-${tag}`}
                                            darkMode={darkMode}
                                            tone={tag === 'numeric' ? 'primary' : 'default'}
                                        >
                                            {tag}
                                        </TonePill>
                                    ))}
                                    {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                </div>
                            </button>

                            {expanded && (
                                <div className={`border-t px-5 pb-5 pt-4 ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                                    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
                                        <div className="space-y-4">
                                            <label className="block">
                                                <span className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                                                    Display label
                                                </span>
                                                <input
                                                    value={column.label}
                                                    onChange={(event) => onUpdateLabel?.(column.id, event.target.value)}
                                                    onBlur={onCommitLabel}
                                                    className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm font-bold outline-none transition-colors ${darkMode ? 'bg-slate-900 border-slate-800 text-slate-200 focus:border-indigo-500' : 'bg-white border-slate-200 text-slate-900 focus:border-indigo-500'}`}
                                                />
                                            </label>

                                            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                                                <TonePill darkMode={darkMode} tone={column.summary?.detectedType === 'numeric' ? 'primary' : 'default'}>
                                                    {column.summary?.detectedType || 'unknown'}
                                                </TonePill>
                                                <TonePill darkMode={darkMode}>{column.sourceKind}</TonePill>
                                                {(column.tags || []).includes('identifier') && <TonePill darkMode={darkMode}>identifier</TonePill>}
                                            </div>

                                            <div className={`rounded-xl border p-4 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                                                <div className={`text-[10px] font-black uppercase tracking-widest mb-2 ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                                                    Raw variable
                                                </div>
                                                <p className={`text-sm font-bold ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                                                    {column.originalName}
                                                </p>
                                                <p className={`mt-2 text-xs ${darkMode ? 'text-slate-500' : 'text-slate-600'}`}>
                                                    Missing {column.summary?.missingCount || 0} of {dataset?.rowCount || 0} rows
                                                </p>
                                            </div>

                                            {(column.summary?.issues || []).length > 0 && (
                                                <div className={`rounded-xl border p-4 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                                                    <div className={`text-[10px] font-black uppercase tracking-widest mb-2 ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                                                        Notes
                                                    </div>
                                                    <div className="flex flex-wrap gap-2">
                                                        {column.summary.issues.map((issue) => (
                                                            <TonePill key={`${column.id}-issue-${issue}`} darkMode={darkMode} tone={issue === 'Identifier' ? 'default' : 'warning'}>
                                                                {issue}
                                                            </TonePill>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="space-y-4">
                                            {column.summary?.detectedType === 'numeric' ? (
                                                <div className="grid gap-3 sm:grid-cols-2">
                                                    {[
                                                        ['Mean', column.summary.numeric.mean],
                                                        ['Min', column.summary.numeric.min],
                                                        ['Max', column.summary.numeric.max],
                                                        ['SD', column.summary.numeric.sd],
                                                        ['SE', column.summary.numeric.standardError],
                                                    ].map(([label, value]) => (
                                                        <div key={`${column.id}-${label}`} className={`rounded-xl border px-4 py-3 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                                                            <div className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>{label}</div>
                                                            <div className={`mt-2 text-sm font-bold ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>{value ?? '--'}</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className={`rounded-xl border p-4 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                                                    <div className={`text-[10px] font-black uppercase tracking-widest mb-2 ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                                                        Unique levels
                                                    </div>
                                                    <div className="flex flex-wrap gap-2">
                                                        {(column.summary?.categories || []).length ? column.summary.categories.map((item) => (
                                                            <TonePill key={`${column.id}-${item.value}`} darkMode={darkMode}>
                                                                {item.value}: {item.count}
                                                            </TonePill>
                                                        )) : (
                                                            <span className={`text-sm ${darkMode ? 'text-slate-500' : 'text-slate-600'}`}>
                                                                No non-missing values yet.
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="mt-4 space-y-3">
                                        <div className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                                            Variable chips
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {(column.autoTags || []).filter((tag) => !column.hiddenAutoTags?.includes(tag)).map((tag) => (
                                                <TonePill key={`${column.id}-auto-${tag}`} darkMode={darkMode} tone={tag === 'numeric' ? 'primary' : 'default'} onClick={() => onHideAutoTag?.(column.id, tag)}>
                                                    {tag}
                                                    <X size={10} />
                                                </TonePill>
                                            ))}
                                            {(column.manualTags || []).map((tag) => (
                                                <TonePill key={`${column.id}-manual-${tag}`} darkMode={darkMode} tone="primary" onClick={() => onRemoveManualTag?.(column.id, tag)}>
                                                    {tag}
                                                    <X size={10} />
                                                </TonePill>
                                            ))}
                                        </div>

                                        {(column.hiddenAutoTags || []).length > 0 && (
                                            <div className="flex flex-wrap gap-2">
                                                {column.hiddenAutoTags.map((tag) => (
                                                    <TonePill key={`${column.id}-hidden-${tag}`} darkMode={darkMode} onClick={() => onRestoreHiddenAutoTag?.(column.id, tag)}>
                                                        restore {tag}
                                                    </TonePill>
                                                ))}
                                            </div>
                                        )}

                                        <div className="flex flex-wrap gap-3">
                                            <input
                                                value={tagInputByColumn[column.id] || ''}
                                                onChange={(event) => setTagInputByColumn((previous) => ({
                                                    ...previous,
                                                    [column.id]: event.target.value,
                                                }))}
                                                placeholder="Add custom chip and press Enter"
                                                onKeyDown={(event) => {
                                                    if (event.key !== 'Enter') {
                                                        return;
                                                    }

                                                    event.preventDefault();
                                                    const value = tagInputByColumn[column.id] || '';
                                                    if (!value.trim()) {
                                                        return;
                                                    }

                                                    onAddTag?.(column.id, value.trim());
                                                    setTagInputByColumn((previous) => ({
                                                        ...previous,
                                                        [column.id]: '',
                                                    }));
                                                }}
                                                className={`min-w-[14rem] flex-1 rounded-xl border px-4 py-3 text-sm outline-none transition-colors ${darkMode ? 'bg-slate-900 border-slate-800 text-slate-200 focus:border-indigo-500' : 'bg-white border-slate-200 text-slate-900 focus:border-indigo-500'}`}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => onDeleteVariable?.(column)}
                                                className={`inline-flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-black uppercase tracking-widest ${darkMode ? 'bg-slate-900 border-slate-800 text-rose-300 hover:text-rose-200' : 'bg-white border-slate-200 text-rose-600 hover:text-rose-700'}`}
                                            >
                                                <Trash2 size={14} />
                                                Delete Variable
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default VariableBrowser;
