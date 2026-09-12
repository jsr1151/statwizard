import { CheckCircle } from 'lucide-react';
import Card from '../analysis/AnalysisCard.jsx';

export default function MultipleRegressionDiagnostics({
    darkMode, lessonDiagnostics,
}) {
    return (
        <Card darkMode={darkMode}>
            <div className="flex items-center gap-3 mb-4">
                <CheckCircle size={18} className={darkMode ? 'text-emerald-300' : 'text-emerald-700'} />
                <h3 className={`text-lg font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                    Assumptions and diagnostics
                </h3>
            </div>
            <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                Use these checks as practical questions, not a rigid checklist. Expand any item for what it means, how to check it, what happens if it fails, and what students should do next.
            </p>

            <div className="mt-5 space-y-3">
                {lessonDiagnostics.map((item) => {
                    const toneClass = item.status.includes('Watch') || item.status.includes('High') || item.status.includes('detected') || item.status.includes('changes') || item.status.includes('skewed')
                        ? (darkMode ? 'text-amber-200 bg-amber-500/10 border-amber-500/20' : 'text-amber-700 bg-amber-50 border-amber-200')
                        : item.status.includes('Needs')
                            ? (darkMode ? 'text-slate-300 bg-slate-950 border-slate-800' : 'text-slate-600 bg-slate-50 border-slate-200')
                            : (darkMode ? 'text-emerald-200 bg-emerald-500/10 border-emerald-500/20' : 'text-emerald-700 bg-emerald-50 border-emerald-200');

                    return (
                        <details key={item.id} className={`rounded-2xl border ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                            <summary className="cursor-pointer list-none px-5 py-4">
                                <div className="flex flex-col items-start gap-4">
                                    <div>
                                        <div className={`font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>{item.label}</div>
                                        <div className={`mt-1 text-sm ${darkMode ? 'text-slate-500' : 'text-slate-600'}`}>{item.what}</div>
                                    </div>
                                    <div className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-widest ${toneClass}`}>
                                        {item.status}
                                    </div>
                                </div>
                            </summary>
                            <div className={`px-5 pb-5 text-sm space-y-4 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                                <div>
                                    <div className={`text-[10px] font-black uppercase tracking-widest mb-1 ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>How to check it</div>
                                    <p>{item.check}</p>
                                </div>
                                <div>
                                    <div className={`text-[10px] font-black uppercase tracking-widest mb-1 ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>What happens if it fails</div>
                                    <p>{item.ifFails}</p>
                                </div>
                                <div>
                                    <div className={`text-[10px] font-black uppercase tracking-widest mb-1 ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>What students should do</div>
                                    <p>{item.doNext}</p>
                                </div>
                            </div>
                        </details>
                    );
                })}
            </div>
        </Card>
    );
}
