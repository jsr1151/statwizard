import { Table2 } from 'lucide-react';
import { formatDatasetValue } from '../../utils/datasetImport.js';
import Card from '../analysis/AnalysisCard.jsx';

export default function DatasetPreviewCard({
    darkMode, editorDataset, previewRows,
}) {
    return (
        <Card darkMode={darkMode}>
            <div className="flex items-center gap-3 mb-4">
                <Table2 size={18} className={darkMode ? 'text-emerald-300' : 'text-emerald-700'} />
                <h3 className={`text-lg font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                    Data preview
                </h3>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                    <thead>
                        <tr className={darkMode ? 'text-slate-500' : 'text-slate-500'}>
                            <th className="sticky left-0 z-10 bg-inherit pb-3 pr-4 text-left text-[10px] font-black uppercase tracking-widest">Row</th>
                            {editorDataset.columns.map((column) => (
                                <th key={`preview-head-${column.id}`} className="pb-3 pr-4 text-left text-[10px] font-black uppercase tracking-widest">
                                    {column.label}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {previewRows.map((row, rowIndex) => (
                            <tr key={`preview-row-${row.__rowId}`} className={`border-t ${darkMode ? 'border-slate-800 text-slate-300' : 'border-slate-200 text-slate-700'}`}>
                                <td className={`sticky left-0 bg-inherit py-2 pr-4 text-xs font-black ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>{rowIndex + 1}</td>
                                {editorDataset.columns.map((column) => (
                                    <td key={`${row.__rowId}-${column.id}`} className="max-w-[16rem] truncate py-2 pr-4">
                                        {formatDatasetValue(row[column.id]) || '—'}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <p className={`mt-4 text-xs ${darkMode ? 'text-slate-500' : 'text-slate-600'}`}>
                Showing the first {previewRows.length} rows. Statistical pages will use the full saved dataset.
            </p>
        </Card>
    );
}
