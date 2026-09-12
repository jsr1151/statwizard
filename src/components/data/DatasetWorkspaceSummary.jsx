import { ArrowRight, Copy, Download, RotateCcw, Save } from 'lucide-react';
import { formatTimestamp } from '../../utils/dataManagerHelpers.js';
import TonePill from './DatasetTonePill.jsx';
import InfoRow from './DatasetInfoRow.jsx';
import Card from '../analysis/AnalysisCard.jsx';

export default function DatasetWorkspaceSummary({
    darkMode, editorDataset, handleDatasetNameChange, handleUndoDatasetEdit,
    undoStack, handleSaveDataset, editorIsSaved, handleSaveDatasetAsNew,
    handleExportDataset, setAnalysisMenuDatasetId, isDirty,
}) {
    return (
        <Card darkMode={darkMode}>
            <div className="flex flex-col gap-6">
                <div className="min-w-0">
                    <div className={`text-[10px] font-black uppercase tracking-widest mb-2 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
                        Active workspace
                    </div>
                    <input
                        aria-label="Dataset name"
                        value={editorDataset.name}
                        onChange={(event) => handleDatasetNameChange(event.target.value)}
                        className={`w-full rounded-2xl border px-4 py-3 text-xl font-black outline-none transition-colors ${darkMode ? 'bg-slate-950 border-slate-800 text-white focus:border-indigo-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500'}`}
                    />
                    <p className={`mt-2 text-sm ${darkMode ? 'text-slate-500' : 'text-slate-600'}`}>
                        Source file: {editorDataset.originalFileName || 'Local dataset'}
                        {editorDataset.sheetName ? ` / Sheet: ${editorDataset.sheetName}` : ''}
                    </p>
                </div>

                <div className="flex flex-wrap gap-3">
                    <button
                        type="button"
                        onClick={handleUndoDatasetEdit}
                        disabled={!undoStack.length}
                        className={`inline-flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-black uppercase tracking-widest disabled:cursor-not-allowed disabled:opacity-50 ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200 hover:border-slate-700' : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'}`}
                    >
                        <RotateCcw size={16} />
                        Undo
                    </button>

                    <button
                        type="button"
                        onClick={handleSaveDataset}
                        className={`inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-black uppercase tracking-widest ${darkMode ? 'bg-indigo-600 text-white hover:bg-indigo-500' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
                    >
                        <Save size={16} />
                        {editorIsSaved ? 'Save Updates' : 'Save Dataset'}
                    </button>

                    <button
                        type="button"
                        onClick={handleSaveDatasetAsNew}
                        className={`inline-flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-black uppercase tracking-widest ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200 hover:border-slate-700' : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'}`}
                    >
                        <Copy size={16} />
                        Save As New
                    </button>

                    <button
                        type="button"
                        onClick={() => handleExportDataset('csv')}
                        className={`inline-flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-black uppercase tracking-widest ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200 hover:border-slate-700' : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'}`}
                    >
                        <Download size={16} />
                        Export CSV
                    </button>

                    <button
                        type="button"
                        onClick={() => handleExportDataset('xlsx')}
                        className={`inline-flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-black uppercase tracking-widest ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200 hover:border-slate-700' : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'}`}
                    >
                        <Download size={16} />
                        Export Excel
                    </button>

                    <button
                        type="button"
                        onClick={() => setAnalysisMenuDatasetId(editorDataset.id)}
                        className={`inline-flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-black uppercase tracking-widest ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200 hover:border-slate-700' : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'}`}
                    >
                        <ArrowRight size={16} />
                        Use in Analysis
                    </button>
                </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <InfoRow darkMode={darkMode} label="Rows" value={editorDataset.rowCount} />
                <InfoRow darkMode={darkMode} label="Variables" value={editorDataset.columnCount} />
                <InfoRow darkMode={darkMode} label="Source Type" value={editorDataset.fileType} />
                <InfoRow darkMode={darkMode} label="Last Updated" value={formatTimestamp(editorDataset.updatedAt)} />
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
                {editorDataset.statusSummary.map((status) => (
                    <TonePill
                        key={`editor-status-${status}`}
                        darkMode={darkMode}
                        tone={status === 'Missing data' || status === 'Type warnings' ? 'warning' : 'default'}
                    >
                        {status}
                    </TonePill>
                ))}
                {isDirty && <TonePill darkMode={darkMode} tone="primary">Unsaved edits</TonePill>}
            </div>
        </Card>
    );
}
