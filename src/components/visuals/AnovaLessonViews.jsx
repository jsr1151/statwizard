import FTestNullPlot from '../common/FTestNullPlot.jsx';
import AnovaLessonGroupPlot from './AnovaLessonGroupPlot.jsx';
import { formatStatistic as number } from '../../utils/statFormatters.js';

export default function AnovaLessonViews({ result, view, setView, darkMode, onExploreF }) {
    const button = `rounded-lg border px-3 py-2 text-sm font-semibold ${darkMode ? 'border-slate-700 text-slate-200' : 'border-slate-300 text-slate-800'}`;
    return <div className="mt-5 space-y-4" aria-label="ANOVA lesson visualization">
        <div className="flex flex-wrap gap-2">{[['fDist', 'F distribution'], ['means', 'Group means'], ['plots', 'Plot maker'], ['decomp', 'Variance decomposition'], ['table', 'Table guide']].map(([id, label]) => <button key={id} type="button" aria-pressed={view === id} className={`${button} ${view === id ? 'bg-indigo-600 text-white' : ''}`} onClick={() => setView(id)}>{label}</button>)}</div>
        {view === 'fDist' ? <><FTestNullPlot result={result} darkMode={darkMode} />{onExploreF && result.F <= 1e6 && <label className="block text-sm font-semibold">Explore F: {number(result.F, 3)}<input aria-label="Explore F slider" className="mt-2 block w-full" type="range" min="0" max={Math.max(25, result.F * 1.2)} step=".1" value={result.F} onChange={event => onExploreF(Number(event.target.value))} /></label>}</> : !result.samples ? <p role="status" className="text-sm">Group plots, variance decomposition, and the ANOVA table require group observations or summaries. Select Raw data or Summary statistics to explore them; F and degrees of freedom alone cannot reconstruct groups.</p> : <>
            {(view === 'means' || view === 'plots') && <AnovaLessonGroupPlot result={result} darkMode={darkMode} editable={view === 'plots'} />}
            {view === 'decomp' && <div className="space-y-4 text-sm">
                <h4 className="text-lg font-bold">Where the variation comes from</h4>
                <p>Between-group SS = {number(result.ssB, 6)}; within-group SS = {number(result.ssW, 6)}; total SS = {number(result.ssT, 6)}.</p>
                {[[result.eta2, 'Between groups'], [1 - result.eta2, 'Within groups']].map(([fraction, label]) => <div key={label}><p className="mb-2">{label}: {number(fraction * 100, 2)}% of total variation</p><div className={`h-6 overflow-hidden rounded ${darkMode ? 'bg-slate-800' : 'bg-slate-200'}`}><div className="h-full bg-indigo-600" style={{ width: `${fraction * 100}%` }} /></div></div>)}
                <p>Divide each sum of squares by its degrees of freedom: MS between = {number(result.msB, 6)}, MS within = {number(result.msW, 6)}. Their ratio is F = {number(result.F, 6)}.</p>
                <p>Eta squared = SS between / SS total = {number(result.eta2, 6)}. It describes the proportion associated with group membership; statistical significance also depends on degrees of freedom and alpha.</p>
            </div>}
            {view === 'table' && <div className="space-y-3 text-sm"><h4 className="text-lg font-bold">Read the ANOVA table</h4><p>The table above uses SS for sum of squares, df for degrees of freedom, and MS for mean square.</p><p>Between groups: sum each group's size times its squared distance from the weighted grand mean ({number(result.grandMean, 6)}). Divide by k − 1 = {result.df1} to get MS between.</p><p>Within groups: sum squared distances of observations from their group means, or sum (n − 1) × sample SD squared. Divide by N − k = {result.df2} to get MS within.</p><p>Total: SS between + SS within = {number(result.ssT, 6)} with N − 1 = {result.N - 1} degrees of freedom. A zero between-group SS is valid and gives F = 0 and p = 1.</p><p>F = MS between / MS within. The p-value is the upper-tail F probability. Eta squared = SS between / SS total.</p>{result.k === 2 && <p>With two groups, this equal-variance ANOVA has F = t² for the pooled, two-sided independent-samples t-test.</p>}</div>}
        </>}
    </div>;
}
