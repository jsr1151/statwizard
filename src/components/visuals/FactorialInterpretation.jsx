import React from 'react';

const FactorialInterpretation = ({ alpha, darkMode, factorA, factorB, results, onAlphaChange, onExplore }) => {
    const interactionIsSignificant = results?.effects.AxB.p < alpha;

    return (
        <section className={`p-8 rounded-[3rem] border-2 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-xl'}`}>
            <div className="flex justify-between items-center mb-6">
                <h5 className="text-[12px] font-black uppercase tracking-[0.3em] text-slate-500">Interpretation</h5>
                <div className="flex gap-2" aria-label="Significance level">
                    {[0.1, 0.05, 0.01].map((value) => (
                        <button key={value} type="button" onClick={() => onAlphaChange(value)} className={`px-4 py-1.5 rounded-xl text-[10px] font-black transition-all ${alpha === value ? 'bg-indigo-600 text-white' : 'text-slate-600'}`}>α={value}</button>
                    ))}
                </div>
            </div>

            {interactionIsSignificant ? (
                <div className="p-6 bg-amber-500/10 border-2 border-amber-500/20 rounded-[2rem]">
                    <p className="text-[14px] font-bold text-amber-200 mb-2">Significant Interaction Found!</p>
                    <p className="text-[12px] text-amber-200/70 mb-4">
                        The effect of {factorA.label} depends on the level of {factorB.label}; main effects alone are not the full story.
                    </p>
                    <button type="button" onClick={onExplore} className="bg-amber-600 text-amber-950 px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-amber-500 transition-all">
                        Explore Simple Effects
                    </button>
                </div>
            ) : (
                <div className="p-6 bg-emerald-500/10 border-2 border-emerald-500/20 rounded-[2rem]">
                    <p className="text-[14px] font-bold text-emerald-200 mb-2">No Significant Interaction.</p>
                    <p className="text-[12px] text-emerald-200/70">The main effects of {factorA.label} and {factorB.label} can be interpreted individually.</p>
                </div>
            )}
        </section>
    );
};

export default FactorialInterpretation;
