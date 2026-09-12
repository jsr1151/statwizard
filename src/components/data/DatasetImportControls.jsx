import { Layers3 } from 'lucide-react';
import Card from '../analysis/AnalysisCard.jsx';

export default function DatasetImportControls({
    darkMode, importSession, handleImportSessionChange,
}) {
    return (
        <Card darkMode={darkMode}>
            <div className="flex items-center gap-3 mb-4">
                <Layers3 size={18} className={darkMode ? 'text-sky-300' : 'text-sky-700'} />
                <h3 className={`text-lg font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                    Import controls
                </h3>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
                {importSession.sourceType === 'xlsx' && (
                    <label className="block">
                        <span className={`text-[11px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                            Excel Sheet
                        </span>
                        <select
                            value={importSession.selectedSheetName}
                            onChange={(event) => handleImportSessionChange({ selectedSheetName: event.target.value })}
                            className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm font-bold outline-none transition-colors ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200 focus:border-indigo-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500'}`}
                        >
                            {importSession.sheets.map((sheet) => (
                                <option key={sheet.name} value={sheet.name}>{sheet.name}</option>
                            ))}
                        </select>
                    </label>
                )}

                <label className={`flex items-center justify-between rounded-xl border px-4 py-3 ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                    <div>
                        <div className="font-bold">First row is header</div>
                        <p className={`mt-1 text-xs ${darkMode ? 'text-slate-500' : 'text-slate-600'}`}>
                            Toggle if the preview rows or variable names look wrong.
                        </p>
                    </div>
                    <input
                        type="checkbox"
                        checked={importSession.hasHeaderRow}
                        onChange={(event) => handleImportSessionChange({ hasHeaderRow: event.target.checked })}
                    />
                </label>
            </div>
        </Card>
    );
}
