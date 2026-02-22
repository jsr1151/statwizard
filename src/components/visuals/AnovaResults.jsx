import React from 'react';
import { Layers, CheckCircle, AlertCircle, Sparkles, Activity, FileText } from 'lucide-react';
import MathTerm from '../common/MathTerm';

const AnovaResults = ({
    renderModel,
    anovaStats,
    anovaMode,
    showPostHoc,
    setShowPostHoc,
    postHoc,
    showValues,
    darkMode
}) => {
    return (
        <div className="w-full grid grid-cols-1 gap-8 pb-12">
            {/* 4. Full Width Omnibus Summary */}
            <div className={`p-10 rounded-[2.5rem] border-2 transition-all flex flex-col md:flex-row items-center justify-between gap-12 overflow-hidden ${darkMode ? 'bg-slate-900 border-slate-800 shadow-2xl shadow-black/40' : 'bg-white border-slate-100 shadow-xl'}`}>
                <div className="flex flex-col items-center md:items-start text-center md:text-left shrink-0 max-w-full">
                    <h6 className={`text-[12px] font-black uppercase tracking-[0.3em] mb-6 flex items-center gap-3 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}><Layers size={18} /> ANOVA {anovaMode === 'data' ? 'Observed Results' : 'Explore Output'}</h6>
                    <div className={`text-5xl md:text-7xl font-black text-indigo-500 uppercase tracking-tighter mb-4 flex flex-wrap items-baseline gap-2 justify-center md:justify-start`}>
                        <MathTerm term="F" showValue={false} darkMode={darkMode} onInfo={() => { }} />
                        <span className="text-3xl md:text-4xl" onMouseEnter={() => window.dispatchEvent(new CustomEvent('anovaTutorAction', { detail: 'indices' }))}>
                            (<MathTerm term="df_between" value={renderModel.df1.toString()} showValue={true} darkMode={darkMode} onInfo={() => { }} />,
                            <MathTerm term="df_error" value={renderModel.df2.toString()} showValue={true} darkMode={darkMode} onInfo={() => { }} />)
                        </span>
                        <span className="mx-1 md:mx-2">=</span>
                        <span className="truncate">{renderModel.F?.toFixed(2)}</span>
                    </div>
                    <div
                        onMouseEnter={() => window.dispatchEvent(new CustomEvent('anovaTutorAction', { detail: 'calc_results' }))}
                        className={`text-[16px] font-black uppercase tracking-[0.2em] flex flex-wrap items-center justify-center md:justify-start gap-3 ${renderModel.F > renderModel.Fcrit ? 'text-emerald-400' : 'text-slate-500'}`}
                    >
                        {renderModel.F > renderModel.Fcrit ? <CheckCircle size={24} /> : <AlertCircle size={24} />}
                        <span>p {renderModel.p < 0.001 ? '< .001' : (renderModel.p < 0.05 ? '< .05' : '> .05')}</span>
                        <span className="opacity-50 tracking-widest">{renderModel.p < 0.05 ? '(Significant)' : '(Non-Sig)'}</span>
                    </div>
                    {anovaMode === 'calc' && <p className="text-[10px] font-black text-amber-500/60 uppercase tracking-widest mt-4">Exploring hypothetical inputs</p>}
                </div>

                <div className={`hidden md:block w-px h-32 ${darkMode ? 'bg-slate-800' : 'bg-slate-100'}`} />

                {
                    anovaMode === 'data' ? (
                        <div className="flex flex-col gap-6 flex-1 max-w-sm animate-in fade-in">
                            <div className="flex justify-between items-center text-[12px] font-black uppercase tracking-widest">
                                <span className={darkMode ? 'text-slate-500' : 'text-slate-400'}>
                                    <MathTerm term="F" showValue={false} darkMode={darkMode} onInfo={() => { }} /> Critical Value
                                </span>
                                <span className="text-indigo-400 text-lg">{renderModel.Fcrit?.toFixed?.(2) || '0.00'}</span>
                            </div>
                            <div className="flex justify-between items-center text-[12px] font-black uppercase tracking-widest">
                                <span className={darkMode ? 'text-slate-500' : 'text-slate-400'}>
                                    Effect Size (<MathTerm term="eta2" showValue={false} darkMode={darkMode} onInfo={() => { }} />)
                                </span>
                                <div className="flex items-center gap-3">
                                    <span className="text-emerald-400 text-lg">
                                        <MathTerm term="eta2" value={renderModel.eta2} showValue={showValues} darkMode={darkMode} onInfo={() => { }} />
                                    </span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-4 flex-1 min-w-[200px] max-w-sm animate-in slide-in-from-left-4">
                            <div className={`p-4 rounded-2xl border-2 border-dashed ${darkMode ? 'border-slate-800 bg-slate-950/30' : 'border-slate-200 bg-slate-50'} text-center`}>
                                <p className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Explore Result</p>
                                <div className="flex justify-around mt-4 flex-wrap gap-2">
                                    <div className="flex flex-col">
                                        <span className="text-[8px] font-black text-slate-600">F-CRIT</span>
                                        <span className="font-black text-indigo-400">{renderModel.Fcrit?.toFixed(3)}</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[8px] font-black text-slate-600">P-VALUE</span>
                                        <span className={`font-black ${renderModel.p < renderModel.alpha ? 'text-emerald-400' : 'text-rose-400'}`}>{renderModel.p?.toFixed(4)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                }

                <button
                    onClick={() => {
                        window.dispatchEvent(new CustomEvent('anovaTutorAction', { detail: 'calc_results' }));
                        const line = `One-way ANOVA revealed a ${renderModel.p < renderModel.alpha ? 'significant' : 'non-significant'} effect${renderModel.mode === 'data' ? ' of group' : ''}, F(${renderModel.df1}, ${renderModel.df2}) = ${renderModel.F.toFixed(2)}, p ${renderModel.p < 0.05 ? '< .05' : '> .05'}${renderModel.mode === 'data' ? `, η² = ${renderModel.eta2?.toFixed(3)}` : ''}.`;
                        navigator.clipboard.writeText(line);
                        const btn = document.activeElement;
                        if (btn) {
                            const oldText = btn.innerHTML;
                            btn.innerHTML = "✓ COPIED APA RESULT!";
                            setTimeout(() => { btn.innerHTML = oldText; }, 2000);
                        }
                    }}
                    className="w-full md:w-auto px-12 py-6 bg-indigo-600 hover:bg-indigo-500 text-white text-[12px] font-black uppercase tracking-[0.3em] rounded-3xl transition-all shadow-2xl shadow-indigo-600/30 active:scale-95 flex items-center justify-center gap-4 group"
                >
                    <FileText size={20} className="group-hover:scale-110 transition-transform" /> COPY TO CLIPBOARD
                </button>
            </div>

            {/* 5. Full Width Post-Hoc section */}
            {
                anovaMode === 'data' ? (
                    <div className={`p-10 rounded-[2.5rem] border-2 transition-colors ${darkMode ? 'bg-slate-900 border-slate-800 shadow-2xl shadow-black/40' : 'bg-white border-slate-100 shadow-xl'}`}>
                        <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6">
                            <div className="text-center md:text-left">
                                <h6 className={`text-[12px] font-black uppercase tracking-[0.3em] flex items-center justify-center md:justify-start gap-3 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}><Sparkles size={18} /> Pairwise Post-Hoc Comparisons</h6>
                                <p className={`text-[10px] font-medium mt-2 ${darkMode ? 'text-slate-600' : 'text-slate-500'}`}>Tukey's HSD ($p$-adj) for identifying specific group differences</p>
                            </div>
                            <button onClick={() => setShowPostHoc(!showPostHoc)} className={`text-[10px] font-black uppercase tracking-widest px-8 py-4 rounded-2xl transition-all ${showPostHoc ? 'bg-rose-500/20 text-rose-400 border border-rose-500/20 shadow-[0_0_20px_rgba(244,63,94,0.15)]' : 'bg-indigo-600 text-white shadow-2xl shadow-indigo-600/30'}`}>
                                {showPostHoc ? 'Close Analysis' : 'Run Pairwise Tests'}
                            </button>
                        </div>

                        <div className="w-full mt-10">
                            {showPostHoc && renderModel.F > renderModel.Fcrit ? (
                                <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
                                    {postHoc.map((ph, i) => (
                                        <div key={i} className={`group relative overflow-hidden flex flex-row items-center justify-between gap-6 px-6 py-3 rounded-2xl border-2 transition-all duration-500 ${ph.sig
                                            ? 'bg-emerald-500/5 border-emerald-500/30'
                                            : 'bg-slate-500/5 border-slate-500/20'}`}>

                                            <div className="flex items-center gap-4 shrink-0 min-w-[150px]">
                                                <div className="flex flex-col gap-0.5">
                                                    <div className="flex items-center gap-1.5 flex-wrap">
                                                        <div className={`w-2 h-2 rounded-full ${ph.sig ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]' : 'bg-slate-700'}`} />
                                                        <span className={`text-[11px] font-black uppercase tracking-tight ${ph.sig ? 'text-emerald-400' : 'text-slate-500'}`}>{ph.pair[0]}</span>
                                                        <span className="text-[8px] font-bold text-slate-600">(M={ph.m1.toFixed(1)}, SD={ph.sd1.toFixed(1)})</span>
                                                    </div>
                                                    <div className="text-[8px] font-black text-slate-700 uppercase tracking-tighter mx-auto italic opacity-50">vs</div>
                                                    <div className="flex items-center gap-1.5 flex-wrap">
                                                        <div className={`w-2 h-2 rounded-full ${ph.sig ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]' : 'bg-slate-700'}`} />
                                                        <span className={`text-[11px] font-black uppercase tracking-tight ${ph.sig ? 'text-emerald-400' : 'text-slate-500'}`}>{ph.pair[1]}</span>
                                                        <span className="text-[8px] font-bold text-slate-600">(M={ph.m2.toFixed(1)}, SD={ph.sd2.toFixed(1)})</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex-1 flex flex-col items-center">
                                                <span className={`text-[8px] uppercase font-black tracking-[0.15em] mb-0 ${darkMode ? 'text-slate-600' : 'text-slate-400'}`}>Mean Diff</span>
                                                <div className="flex items-baseline gap-1">
                                                    <span className={`text-xl font-black italic tracking-tighter ${ph?.sig ? 'text-white' : 'text-slate-600'}`}>Δ</span>
                                                    <span className={`text-2xl font-black ${ph?.sig ? 'text-white' : 'text-slate-600'}`}>{ph?.diff?.toFixed?.(2) || '0.00'}</span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3 min-w-[160px] justify-end">
                                                <div className="flex flex-col items-end mr-3">
                                                    <span className={`text-[8px] font-black uppercase tracking-widest ${ph.sig ? 'text-emerald-400' : 'text-slate-600'}`}>p-adj</span>
                                                    <span className={`text-[10px] font-black tabular-nums ${ph.sig ? 'text-emerald-400' : 'text-slate-500'}`}>{ph.pAdj < 0.001 ? '< .001' : ph.pAdj.toFixed(3)}</span>
                                                </div>
                                                <div className={`flex items-center gap-2 px-5 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-transform duration-300 ${ph.sig
                                                    ? 'bg-emerald-500 text-white shadow-[0_4px_12px_rgba(16,185,129,0.3)]'
                                                    : 'bg-slate-900 text-slate-600'}`}>
                                                    {ph.sig ? (
                                                        <>
                                                            <Activity size={10} />
                                                            <span>Significant</span>
                                                        </>
                                                    ) : (
                                                        <span>Non-Sig</span>
                                                    )}
                                                </div>
                                                {ph.sig && <Sparkles size={14} className="text-emerald-300 animate-pulse" />}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : renderModel.F <= renderModel.Fcrit && showPostHoc ? (
                                <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed rounded-[3rem] border-rose-500/20 bg-rose-500/5 animate-in zoom-in-95 duration-500">
                                    <AlertCircle size={48} className="text-rose-500 mb-6 group-hover:scale-110 transition-transform" />
                                    <p className="text-[14px] text-rose-500 uppercase font-black tracking-[0.4em]">Omnibus Non-Significant</p>
                                    <p className="text-[11px] text-slate-500 mt-4 text-center px-12 max-w-lg leading-relaxed font-medium italic">Pairwise tests are typically only performed when the overall ANOVA is significant (p {'<'} .05). Exploring differences here would increase Type I Error risk.</p>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed rounded-[3rem] border-slate-800 bg-slate-900/10 group cursor-pointer" onClick={() => setShowPostHoc(true)}>
                                    <Sparkles size={48} className="text-slate-700 mb-6 group-hover:scale-110 group-hover:text-indigo-500 transition-all duration-500" />
                                    <p className="text-[14px] text-slate-500 uppercase font-black tracking-[0.4em] group-hover:text-slate-300">Ready for Post-Hoc Analysis</p>
                                    <p className="text-[11px] text-slate-600 mt-4 text-center px-12 max-w-lg leading-relaxed font-medium">Click to reveal specific pairwise differences and identify which groups are driving your results.</p>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className={`p-10 rounded-[2.5rem] border-2 border-dashed flex flex-col items-center justify-center text-center opacity-40 ${darkMode ? 'bg-slate-900/10 border-slate-800 text-slate-500' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
                        <Sparkles size={32} className="mb-4 opacity-20" />
                        <p className="text-xs font-black uppercase tracking-widest">Post-hoc Analysis is disabled in Explore Mode.</p>
                        <p className="text-[9px] mt-2 opacity-60">Pairwise comparisons require observed dataset statistics.</p>
                    </div>
                )
            }

            {/* 6. T-Test Equivalence Badge */}
            {
                anovaStats?.k === 2 && (
                    <div className="bg-amber-500/10 border border-amber-500/20 px-8 py-4 rounded-3xl flex items-center gap-4 animate-in slide-in-from-bottom-2 duration-500">
                        <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center text-white font-black text-sm shadow-lg shadow-amber-500/30">!</div>
                        <div>
                            <h6 className="text-[11px] font-black text-amber-500 uppercase tracking-widest leading-none">The T-Test Equivalence</h6>
                            <p className="text-[10px] text-amber-600/80 font-medium mt-1.5">With exactly 2 groups, ANOVA is identical to a t-test. F = t² ({anovaStats?.fVal?.toFixed?.(2) || '0.00'} = {Math.sqrt(anovaStats?.fVal || 0)?.toFixed?.(2) || '0.00'}²).</p>
                        </div>
                    </div>
                )
            }
        </div>
    );
};

export default AnovaResults;
