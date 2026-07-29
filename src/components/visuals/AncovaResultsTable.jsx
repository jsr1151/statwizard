import React, { useRef, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { MATH_TERMS } from '../../data/mathTerms';
import CalculationText from '../common/CalculationText';

const formatP = (value) => (value < 0.001 ? '< .001' : value.toFixed(3).replace(/^0/, ''));

const AncovaResultsTable = ({ alpha, covariateName, darkMode, showValues, stats }) => {
    const [activeEquation, setActiveEquation] = useState('group');
    const [copied, setCopied] = useState(false);
    const reportRef = useRef(null);
    const rows = [
        { key: 'covariate', label: `Covariate (${covariateName})`, color: 'text-emerald-500', ss: stats.SScov, df: stats.dfCov, ms: stats.MScov, f: stats.Fcov, p: stats.pCov, effectSize: stats.pes_cov },
        { key: 'group', label: 'Group (Adjusted)', color: 'text-indigo-500', ss: stats.SSgrp, df: stats.dfGrp, ms: stats.MSgrp, f: stats.Fgrp, p: stats.pGrp, effectSize: stats.pes_grp },
    ];
    const report = stats.pInt < alpha
        ? `A one-way ANCOVA comparing ${stats.k} groups while controlling for ${covariateName} found a significant Group × Covariate interaction, F(${stats.dfInt}, ${stats.dfE_separate}) = ${stats.Fint.toFixed(2)}, p ${formatP(stats.pInt)}, violating homogeneity of regression slopes.`
        : `A one-way ANCOVA comparing ${stats.k} groups while controlling for ${covariateName} found a ${stats.pGrp < alpha ? 'significant' : 'non-significant'} adjusted group effect, F(${stats.dfGrp}, ${stats.dfE_common}) = ${stats.Fgrp.toFixed(2)}, p ${formatP(stats.pGrp)}.`;

    const copyReport = async () => {
        if (!navigator.clipboard || !reportRef.current) return;
        await navigator.clipboard.writeText(reportRef.current.innerText);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div>
                <h3 className={`text-xl font-bold font-mono ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>ANCOVA Summary Table</h3>
                <p className="text-[10px] uppercase font-bold tracking-widest mt-1 text-slate-500">Model: Y ~ Group + Covariate</p>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead><tr className={`border-b-2 text-[10px] uppercase tracking-widest ${darkMode ? 'border-slate-700 text-slate-500' : 'border-slate-300 text-slate-500'}`}>
                        {['Source', 'SS', 'df', 'MS', 'F', 'p', 'Partial η²'].map((heading, index) => <th key={heading} className={`py-3 px-4 font-bold ${index ? 'text-right' : ''}`}>{heading}</th>)}
                    </tr></thead>
                    <tbody className="text-sm">
                        {rows.map((row) => (
                            <tr key={row.key} onClick={() => setActiveEquation(row.key)} className={`border-b cursor-pointer transition-colors ${activeEquation === row.key ? darkMode ? 'bg-indigo-950/30' : 'bg-indigo-50' : 'hover:bg-slate-500/5'} ${darkMode ? 'border-slate-800' : 'border-slate-100'}`}>
                                <td className={`py-3 px-4 font-bold ${row.color}`}>{row.label}</td>
                                {[row.ss.toFixed(2), row.df, row.ms.toFixed(2), row.f.toFixed(2), formatP(row.p), row.effectSize.toFixed(3)].map((value, index) => <td key={index} className={`py-3 px-4 text-right font-mono ${index === 3 && row.p < alpha ? 'text-rose-500 font-bold' : ''}`}>{value}</td>)}
                            </tr>
                        ))}
                        <tr className={`border-b ${darkMode ? 'border-slate-800' : 'border-slate-100'} text-slate-500`}><td className="py-3 px-4">Residual</td><td className="py-3 px-4 text-right font-mono">{stats.SSE_common.toFixed(2)}</td><td className="py-3 px-4 text-right font-mono">{stats.dfE_common}</td><td className="py-3 px-4 text-right font-mono">{stats.MSE_common.toFixed(2)}</td><td colSpan="3" /></tr>
                    </tbody>
                </table>
            </div>

            <section className="space-y-4 pt-4 border-t border-dashed border-slate-700/30">
                <div><h4 className="text-xs font-bold uppercase tracking-widest text-slate-500">Homogeneity of Slopes</h4><p className="text-[9px] text-slate-500 mt-1">Tests the Group × {covariateName} interaction before interpreting adjusted main effects.</p></div>
                <button type="button" onClick={() => setActiveEquation('interaction')} className={`w-full p-4 rounded-xl border text-left flex justify-between ${activeEquation === 'interaction' ? 'border-indigo-500/50 bg-indigo-500/5' : 'border-slate-700/40'}`}>
                    <span className="font-bold text-slate-400">Group × {covariateName}</span><span className="font-mono text-slate-500">F({stats.dfInt}, {stats.dfE_separate}) = {stats.Fint.toFixed(2)}, p {formatP(stats.pInt)}, partial η² = {stats.pes_int.toFixed(3)}</span>
                </button>
                {stats.pInt < alpha && <div className="p-4 rounded-xl border border-rose-500/40 bg-rose-500/10 flex gap-3 text-rose-500"><AlertCircle className="shrink-0" size={18} /><p className="text-sm font-bold">The slope interaction is significant. Standard adjusted group-main-effect interpretation is inappropriate.</p></div>}
            </section>

            <div className={`p-4 rounded-xl border-2 flex items-center justify-center min-h-[100px] ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                {activeEquation === 'group' && <CalculationText raw="F_{Group} = \\frac{MS_{Group}}{MS_{Error}}" values={`${stats.Fgrp.toFixed(2)} = \\frac{${stats.MSgrp.toFixed(2)}}{${stats.MSE_common.toFixed(2)}}`} showValues={showValues} mathTerms={MATH_TERMS} darkMode={darkMode} />}
                {activeEquation === 'covariate' && <CalculationText raw="F_{X} = \\frac{MS_{X}}{MS_{Error}}" values={`${stats.Fcov.toFixed(2)} = \\frac{${stats.MScov.toFixed(2)}}{${stats.MSE_common.toFixed(2)}}`} showValues={showValues} mathTerms={MATH_TERMS} darkMode={darkMode} />}
                {activeEquation === 'interaction' && <CalculationText raw="F_{Group \\times X} = \\frac{MS_{Group \\times X}}{MS_{Error(Separate)}}" values={`${stats.Fint.toFixed(2)} = \\frac{${stats.MSint.toFixed(2)}}{${stats.MSE_separate.toFixed(2)}}`} showValues={showValues} mathTerms={MATH_TERMS} darkMode={darkMode} />}
            </div>

            <div className={`rounded-xl border p-4 flex flex-col md:flex-row justify-between items-center gap-4 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                <p ref={reportRef} className="text-[11px] font-mono leading-relaxed text-slate-500">{report}</p>
                <button type="button" onClick={copyReport} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-[9px] font-black uppercase tracking-widest rounded-lg whitespace-nowrap">{copied ? 'Copied!' : 'Copy APA'}</button>
            </div>
        </div>
    );
};

export default AncovaResultsTable;
