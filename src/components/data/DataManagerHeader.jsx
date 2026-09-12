import { FileUp } from 'lucide-react';
import { buildDefaultDerivedDraft } from '../../utils/dataManagerHelpers.js';
import Card from '../analysis/AnalysisCard.jsx';

export default function DataManagerHeader({
    darkMode, handleFileImport, setEditorDataset, setImportSession,
    clearUndoHistory, setDerivedDraft, setIsDirty, setFeedback,
    infoTone, busy, infoMessage,
}) {
    return (
        <Card darkMode={darkMode}>
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="max-w-3xl">
                    <div className={`text-[10px] font-black uppercase tracking-widest mb-2 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
                        Data Import / Data Manager
                    </div>
                    <h2 className={`text-3xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                        Prepare once, reuse everywhere
                    </h2>
                    <p className={`mt-3 text-sm leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                        Import CSV, Excel, or SPSS data, browse large variable sets without overwhelm, organize variables with editable chips, build derived variables and reshaped datasets, then launch the analysis page with the dataset already active.
                    </p>
                </div>

                <div className="flex flex-wrap gap-3">
                    <label className={`inline-flex cursor-pointer items-center gap-2 rounded-xl border px-4 py-3 text-sm font-bold ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200 hover:border-slate-700' : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'}`}>
                        <FileUp size={16} />
                        Import Data File
                        <input
                            type="file"
                            accept=".csv,.tsv,.txt,.xlsx,.sav"
                            className="hidden"
                            onChange={handleFileImport}
                        />
                    </label>

                    <button
                        type="button"
                        onClick={() => {
                            setEditorDataset(null);
                            setImportSession(null);
                            clearUndoHistory();
                            setDerivedDraft(buildDefaultDerivedDraft());
                            setIsDirty(false);
                            setFeedback({
                                nextNotice: 'Cleared the current workspace. Import a file or reopen a saved dataset to continue.',
                                nextProblem: '',
                            });
                        }}
                        className={`rounded-xl border px-4 py-3 text-sm font-bold ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200 hover:border-slate-700' : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'}`}
                    >
                        New Workspace
                    </button>
                </div>
            </div>

            <div className={`mt-6 rounded-2xl border px-4 py-3 text-sm ${infoTone === 'warning'
                ? (darkMode ? 'bg-amber-500/10 border-amber-500/20 text-amber-200' : 'bg-amber-50 border-amber-200 text-amber-700')
                : infoTone === 'primary'
                    ? (darkMode ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-200' : 'bg-indigo-50 border-indigo-200 text-indigo-700')
                    : (darkMode ? 'bg-slate-950 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600')
            }`}>
                {busy ? 'Working on your dataset...' : infoMessage}
            </div>
        </Card>
    );
}
