import React from 'react';
import { createResidualHistogram } from '../../stats/factorialAnovaViewModel';

const FactorialDiagnosticsPanel = ({ alpha, darkMode, results }) => {
    const histogram = createResidualHistogram(results.residuals || []);
    const maxCount = Math.max(1, ...histogram);

    return (
        <div className="w-full h-full p-8 overflow-y-auto custom-scrollbar">
            <div className="max-w-4xl mx-auto space-y-8">
                <div className="space-y-4">
                    <h3 className={`text-lg font-black uppercase tracking-widest ${darkMode ? 'text-white' : 'text-slate-900'}`}>Assumptions & Diagnostics</h3>
                    <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Review the residual distribution and equality of cell variances.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <section className={`p-6 rounded-[2rem] border-2 ${darkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-slate-100 shadow-xl'}`}>
                        <h4 className="text-xs font-black uppercase tracking-widest text-indigo-400 mb-4">Normality of Residuals</h4>
                        <div className="h-48 flex items-end justify-between gap-1 border-b border-slate-800 mb-2" role="img" aria-label="Histogram of model residuals">
                            {histogram.map((count, index) => (
                                <div
                                    key={index}
                                    className={`flex-1 ${darkMode ? 'bg-indigo-500/30 hover:bg-indigo-400/50' : 'bg-indigo-200 hover:bg-indigo-300'} rounded-t-sm transition-all`}
                                    style={{ height: `${count === 0 ? 2 : (count / maxCount) * 100}%` }}
                                />
                            ))}
                        </div>
                        <div className="flex justify-between text-[8px] font-bold text-slate-500 uppercase tracking-widest"><span>Negative Error</span><span>Positive Error</span></div>
                    </section>

                    <section className={`p-6 rounded-[2rem] border-2 ${darkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-slate-100 shadow-xl'}`}>
                        <h4 className="text-xs font-black uppercase tracking-widest text-indigo-400 mb-4">Brown–Forsythe Test</h4>
                        <div className="flex flex-col items-center justify-center min-h-48 space-y-4 text-center">
                            {results.levene.available ? (
                                <>
                                    <div>
                                        <div className={`text-3xl font-black ${results.levene.p < alpha ? 'text-rose-500' : 'text-emerald-500'}`}>p = {results.levene.p.toFixed(3)}</div>
                                        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mt-2">F({results.levene.df1}, {results.levene.df2}) = {results.levene.f.toFixed(2)}</div>
                                    </div>
                                    <div className={`text-[10px] font-bold px-4 py-2 rounded-full ${results.levene.p < alpha ? 'bg-rose-500/10 text-rose-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                                        {results.levene.p < alpha ? 'Evidence that cell variances differ' : 'No statistically detectable variance difference'}
                                    </div>
                                    <p className="max-w-md text-[9px] leading-relaxed text-slate-500">A non-significant result does not prove equal variances; also inspect cell spreads and sample sizes.</p>
                                </>
                            ) : (
                                <><div className="text-sm font-black text-amber-400">Raw observations required</div><p className="max-w-md text-[10px] leading-relaxed text-slate-500">{results.levene.message}</p></>
                            )}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default FactorialDiagnosticsPanel;
