import React from 'react';
import { Database, ExternalLink, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import VariableRolePicker from '../data/VariableRolePicker.jsx';

const Card = ({ darkMode, children, className = '' }) => (
    <div className={`rounded-2xl border p-6 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} ${className}`}>
        {children}
    </div>
);

const NoticeList = ({ darkMode, messages = [], tone = 'error' }) => {
    if (!messages.length) {
        return null;
    }

    const toneClass = tone === 'warning'
        ? (darkMode ? 'bg-amber-500/10 border-amber-500/20 text-amber-200' : 'bg-amber-50 border-amber-200 text-amber-700')
        : tone === 'success'
            ? (darkMode ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-200' : 'bg-emerald-50 border-emerald-200 text-emerald-700')
            : (darkMode ? 'bg-rose-500/10 border-rose-500/20 text-rose-200' : 'bg-rose-50 border-rose-200 text-rose-700');

    const Icon = tone === 'warning'
        ? AlertTriangle
        : tone === 'success'
            ? CheckCircle2
            : XCircle;

    return (
        <div className={`rounded-xl border p-4 ${toneClass}`}>
            <div className="flex items-start gap-3">
                <Icon size={18} className="mt-0.5 shrink-0" />
                <div className="space-y-2 text-sm">
                    {messages.map((message, index) => (
                        <p key={`${tone}-${index}`}>{message}</p>
                    ))}
                </div>
            </div>
        </div>
    );
};

const AnalysisDatasetWorkspace = ({
    darkMode,
    title = 'Use a saved dataset',
    description = 'Choose a saved dataset, assign the variable roles, and the calculator will preload those values into the active analysis workspace.',
    datasets = [],
    selectedDatasetId = '',
    onSelectDatasetId,
    dataset,
    roles = [],
    roleSelection = {},
    onRoleSelectionChange,
    emptyMessage = 'Save a dataset in Data Manager first, then come back here to reuse it.',
    validationMessages = [],
    warningMessages = [],
    successMessages = [],
    summaryItems = [],
    onOpenDataManager,
}) => (
    <div className="space-y-6">
        <Card darkMode={darkMode}>
            <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl ${darkMode ? 'bg-sky-500/10 text-sky-300' : 'bg-sky-50 text-sky-700'}`}>
                    <Database size={20} />
                </div>
                <div>
                    <div className={`text-[10px] font-black uppercase tracking-widest mb-2 ${darkMode ? 'text-sky-300' : 'text-sky-700'}`}>
                        Saved Dataset Workflow
                    </div>
                    <h3 className={`text-xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>{title}</h3>
                    <p className={`mt-2 text-sm max-w-3xl ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>{description}</p>
                </div>
            </div>
        </Card>

        <Card darkMode={darkMode}>
            <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
                <div>
                    <div className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
                        Dataset Selection
                    </div>
                    <h3 className={`mt-1 text-lg font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                        Reuse saved data
                    </h3>
                </div>

                {typeof onOpenDataManager === 'function' && (
                    <button
                        type="button"
                        onClick={onOpenDataManager}
                        className={`inline-flex items-center gap-2 rounded-xl border px-4 py-3 text-xs font-black uppercase tracking-widest transition-all ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-300 hover:text-white hover:border-indigo-500' : 'bg-slate-50 border-slate-200 text-slate-700 hover:text-slate-900 hover:border-indigo-500'}`}
                    >
                        <ExternalLink size={14} />
                        Open Data Manager
                    </button>
                )}
            </div>

            <label className="block">
                <span className={`text-[11px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                    Saved Dataset
                </span>
                <select
                    value={selectedDatasetId}
                    onChange={(event) => onSelectDatasetId?.(event.target.value)}
                    className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm font-bold outline-none transition-colors ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200 focus:border-indigo-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500'}`}
                >
                    {!datasets.length && <option value="">No saved datasets yet</option>}
                    {datasets.map((item) => (
                        <option key={item.id} value={item.id}>{item.name}</option>
                    ))}
                </select>
            </label>

            {dataset ? (
                <div className="mt-5 grid gap-4 md:grid-cols-3">
                    <div className={`rounded-xl border p-4 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                        <div className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>Rows</div>
                        <div className={`mt-2 text-xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>{dataset.rowCount}</div>
                    </div>
                    <div className={`rounded-xl border p-4 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                        <div className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>Variables</div>
                        <div className={`mt-2 text-xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>{dataset.columnCount}</div>
                    </div>
                    <div className={`rounded-xl border p-4 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                        <div className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>Source</div>
                        <div className={`mt-2 text-sm font-bold ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>{dataset.originalFileName || 'Saved dataset'}</div>
                    </div>
                </div>
            ) : (
                <div className={`mt-5 rounded-xl border px-4 py-5 text-sm ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                    {emptyMessage}
                </div>
            )}
        </Card>

        <Card darkMode={darkMode}>
            <div className={`text-[10px] font-black uppercase tracking-widest mb-4 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
                Variable Roles
            </div>
            <VariableRolePicker
                darkMode={darkMode}
                dataset={dataset}
                roles={roles}
                selection={roleSelection}
                onChange={onRoleSelectionChange}
                emptyMessage={emptyMessage}
            />
        </Card>

        {!!summaryItems.length && (
            <div className="grid gap-4 md:grid-cols-3">
                {summaryItems.map((item) => (
                    <Card key={item.label} darkMode={darkMode}>
                        <div className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                            {item.label}
                        </div>
                        <div className={`mt-2 text-2xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                            {item.value}
                        </div>
                        {item.detail && (
                            <p className={`mt-2 text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                {item.detail}
                            </p>
                        )}
                    </Card>
                ))}
            </div>
        )}

        <NoticeList darkMode={darkMode} messages={validationMessages} tone="error" />
        <NoticeList darkMode={darkMode} messages={warningMessages} tone="warning" />
        <NoticeList darkMode={darkMode} messages={successMessages} tone="success" />
    </div>
);

export default AnalysisDatasetWorkspace;
