export default function PearsonInferenceFields({
    darkMode, tails, direction, setHypothesis, confidenceLevel, setConfidenceLevel, rho0, setRho0,
    calculatorShowLine, setCalculatorShowLine, calculatorShowBand, setCalculatorShowBand,
}) {
    const setupState = tails === 2 ? 'two_tailed' : direction === 'less' ? 'negative' : 'positive';
    const label = 'text-[11px] font-black uppercase tracking-widest text-slate-500';
    const field = `mt-2 w-full rounded-xl border px-4 py-3 text-sm font-bold outline-none ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200 focus:border-indigo-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500'}`;
    const invalidNull = String(rho0).trim() === '' || !Number.isFinite(Number(rho0)) || Number(rho0) < -0.95 || Number(rho0) > 0.95;
    return <div className="space-y-4">
        <div role="group" aria-label="Hypothesis direction">
            <span className={label}>Hypothesis Direction</span>
            <div className={`mt-2 rounded-xl border p-1 flex gap-1 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                {[['two_tailed', 'Two-tailed'], ['positive', 'Positive'], ['negative', 'Negative']].map(([id, text]) => <button
                    key={id} type="button" aria-pressed={setupState === id} onClick={() => setHypothesis(id)}
                    className={`flex-1 px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest ${setupState === id ? 'bg-indigo-600 text-white shadow-lg' : darkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'}`}>{text}</button>)}
            </div>
        </div>
        <label className="block"><span className={label}>Confidence Level</span>
            <select value={confidenceLevel} onChange={event => setConfidenceLevel(Number(event.target.value))} className={field}>
                <option value={0.9}>90%</option><option value={0.95}>95%</option><option value={0.99}>99%</option>
            </select>
        </label>
        <label className="block"><span className={label}>Null Population Correlation (rho0)</span>
            <input type="number" min={-0.95} max={0.95} step={0.01} value={rho0} aria-invalid={invalidNull} aria-describedby="pearson-null-help" onChange={event => setRho0(event.target.value)} className={field} />
        </label>
        <p id="pearson-null-help" className={`text-xs leading-relaxed ${invalidNull ? darkMode ? 'text-amber-200' : 'text-amber-800' : darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
            {invalidNull ? 'Enter a null population correlation between -0.95 and 0.95 to run the test.' : 'Usually 0. This is the population correlation value the hypothesis test is evaluated against.'}
        </p>
        <div className="grid grid-cols-2 gap-3">
            {[[calculatorShowLine, setCalculatorShowLine, 'Line'], [calculatorShowBand, setCalculatorShowBand, 'Band']].map(([active, setActive, name]) => <button
                key={name} type="button" aria-pressed={active} onClick={() => setActive(value => !value)}
                className={`rounded-xl border px-4 py-3 text-xs font-black uppercase tracking-widest ${active ? 'bg-indigo-600 text-white border-indigo-500' : darkMode ? 'bg-slate-950 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>{active ? 'Hide' : 'Show'} {name}</button>)}
        </div>
        <p className={`text-sm ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>The sample correlation is r. Population correlation is rho; rho0 is the null value being tested.</p>
    </div>;
}
