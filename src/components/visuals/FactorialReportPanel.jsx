import React, { useRef } from 'react';

const formatP = (p) => (p < 0.001 ? '< .001' : `= ${p.toFixed(3)}`);

const FactorialReportPanel = ({ alpha, darkMode, factorA, factorB, outcomeLabel, results, onCopy }) => {
    const reportRef = useRef(null);
    const { A, B, AxB, Error: error } = results.effects;
    const interactionIsSignificant = AxB.p < alpha;

    const copyReport = () => {
        const text = reportRef.current?.innerText;
        if (!text || !navigator.clipboard) return;
        navigator.clipboard.writeText(text);
        onCopy();
    };

    return (
        <div className="w-full h-full p-8 overflow-y-auto custom-scrollbar">
            <div className="max-w-4xl mx-auto space-y-8">
                <div className="flex justify-between items-center">
                    <div className="space-y-1">
                        <h3 className={`text-lg font-black uppercase tracking-widest ${darkMode ? 'text-white' : 'text-slate-900'}`}>APA-Style Results</h3>
                        <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>A human-readable summary of the statistical findings.</p>
                    </div>
                    <button type="button" onClick={copyReport} className="bg-indigo-600 text-white px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-indigo-500/30 hover:scale-105 transition-all">Copy to Clipboard</button>
                </div>

                <article ref={reportRef} className={`p-10 rounded-[2.5rem] border-2 text-[15px] leading-relaxed shadow-2xl ${darkMode ? 'bg-slate-900/40 border-slate-800 text-slate-300' : 'bg-white border-slate-100 text-slate-600'}`}>
                    <div className="space-y-6">
                        <p>A two-way between-subjects ANOVA examined the effects of <strong>{factorA.label}</strong> and <strong>{factorB.label}</strong> on <strong>{outcomeLabel}</strong>.</p>
                        <p>
                            The analysis revealed {interactionIsSignificant ? 'a significant' : 'no significant'} interaction between {factorA.label} and {factorB.label},
                            <em> F</em>({AxB.df}, {error.df}) = {AxB.f.toFixed(2)}, <em>p</em> {formatP(AxB.p)}, η<sub>p</sub>² = {AxB.pes.toFixed(2)}.
                            {interactionIsSignificant ? ` This suggests that the effect of ${factorA.label} depends on ${factorB.label}.` : ' Both factors operated independently in their effect on the outcome.'}
                        </p>
                        <p>
                            There was {A.p < alpha ? 'a significant' : 'no significant'} main effect of {factorA.label}, <em>F</em>({A.df}, {error.df}) = {A.f.toFixed(2)}, <em>p</em> {formatP(A.p)}, η<sub>p</sub>² = {A.pes.toFixed(2)}. The main effect of {factorB.label} was {B.p < alpha ? 'significant' : 'not significant'}, <em>F</em>({B.df}, {error.df}) = {B.f.toFixed(2)}, <em>p</em> {formatP(B.p)}, η<sub>p</sub>² = {B.pes.toFixed(2)}.
                        </p>
                        {interactionIsSignificant && <p className="p-4 bg-indigo-500/5 border border-indigo-500/20 rounded-xl italic">Given the significant interaction, use the Explorer tab to examine simple effects.</p>}
                    </div>
                </article>
            </div>
        </div>
    );
};

export default FactorialReportPanel;
