import { useEffect, useRef, useState } from 'react';
import AnalysisCard from './AnalysisCard.jsx';
import RankTestInputs from './RankTestInputs.jsx';
import RankTestResults from './RankTestResults.jsx';
import RankTestGuide from './RankTestGuide.jsx';
import { useDatasetLibraryContext } from '../../hooks/useDatasetLibrary.js';
import { consumeAnalysisLaunchPayload, readAnalysisLaunchPayload } from '../../utils/analysisLaunch.js';
import { buildRankDataset } from '../../utils/rankDataset.js';
import { calculateRankTest, parseRankSample } from '../../stats/nonparametric.js';

export default function RankTestPage({ paired, section, darkMode, onSectionChange, onOpenDataManager }) {
    const analysisId = paired ? 'wilcoxon_signed_rank' : 'mann_whitney';
    const { datasets, isLoading } = useDatasetLibraryContext();
    const [launch] = useState(() => readAnalysisLaunchPayload(analysisId));
    useEffect(() => { if (launch) consumeAnalysisLaunchPayload(analysisId); }, [analysisId, launch]);
    const [source, setSource] = useState(launch?.datasetId ? 'saved' : 'paste');
    const [datasetId, setDatasetId] = useState(launch?.datasetId || '');
    const [selection, setSelection] = useState(launch || {});
    const [first, setFirst] = useState('');
    const [second, setSecond] = useState('');
    const [alternative, setAlternative] = useState('two-sided');
    const [method, setMethod] = useState('auto');
    const [continuity, setContinuity] = useState(true);
    const [decimals, setDecimals] = useState('none');
    const [alpha, setAlpha] = useState('0.05');
    const [output, setOutput] = useState(null);
    const outputRegion = useRef(null);
    useEffect(() => {
        if (output) {
            outputRegion.current?.focus();
            outputRegion.current?.scrollIntoView?.({ block: 'start' });
        }
    }, [output]);
    const change = setter => value => { setter(value); setOutput(null); };
    const editSample = setter => value => { setter(value); setSource('paste'); setOutput(null); };
    const example = () => {
        setFirst(paired ? '2\n4\n6\n8\n10\n12' : '1\n2\n3');
        setSecond(paired ? '1\n2\n3\n4\n5\n6' : '4\n5\n6');
        setSource('example'); setOutput(null); setAlternative('two-sided'); setMethod('auto'); setDecimals('none'); setAlpha('0.05'); setContinuity(true);
        onSectionChange('calculator');
    };
    const calculate = event => {
        event.preventDefault();
        const data = source === 'saved' ? buildRankDataset(datasets.find(item => item.id === datasetId), selection, paired)
            : { first: parseRankSample(first), second: parseRankSample(second), label: source === 'example' ? 'Worked example (sample data)' : 'User-entered values', excludedGroups: 0 };
        if (data.error) { setOutput({ ok: false, error: data.error }); return; }
        const result = calculateRankTest(data.first, data.second, { paired, alternative, method, continuity, differenceDecimals: decimals === 'none' ? null : Number(decimals) });
        setOutput({ ...result, sourceLabel: `${data.label}${source === 'saved' && !paired ? `; ${data.excludedGroups} rows excluded for missing group labels` : ''}` });
    };
    const inputClass = `mt-2 w-full rounded-xl border p-3 ${darkMode ? 'bg-slate-950 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'}`;
    return <div className="space-y-6 [overflow-wrap:anywhere]">
        {section !== 'calculator' ? <RankTestGuide paired={paired} section={section} darkMode={darkMode} onExample={example} /> : <>
            <AnalysisCard darkMode={darkMode}>
                <h3 className="mb-5 text-2xl font-bold">{paired ? 'Signed-rank calculator' : 'Mann–Whitney calculator'}</h3>
                <form onSubmit={calculate} className="space-y-6">
                    <RankTestInputs {...{ paired, darkMode, source, first, second, datasets, datasetId, selection, onOpenDataManager }} setSource={change(setSource)} setFirst={editSample(setFirst)} setSecond={editSample(setSecond)} setDatasetId={value => { setDatasetId(value); setSelection({}); setOutput(null); }} setSelection={change(setSelection)} onExample={example} />
                    <div className="grid gap-5 md:grid-cols-2">
                        <label>Alternative<select className={inputClass} value={alternative} onChange={event => change(setAlternative)(event.target.value)}>
                            <option value="two-sided">Two-sided difference</option><option value="greater">A greater than B</option><option value="less">A less than B</option>
                        </select></label>
                        <label>Inference method<select className={inputClass} value={method} onChange={event => change(setMethod)(event.target.value)}>
                            <option value="auto">Auto (exact within supported size)</option><option value="exact">Exact conditional</option><option value="asymptotic">Normal approximation</option>
                        </select></label>
                        <label>Significance level (alpha)<select className={inputClass} value={alpha} onChange={event => change(setAlpha)(event.target.value)}><option>0.01</option><option>0.05</option><option>0.10</option></select></label>
                        {paired && <label>Round A − B before ranking<select className={inputClass} value={decimals} onChange={event => change(setDecimals)(event.target.value)}><option value="none">No rounding</option>{Array.from({ length: 11 }, (_, i) => <option key={i} value={i}>{i} decimal places</option>)}</select></label>}
                    </div>
                    <label className="flex items-center gap-3"><input type="checkbox" checked={continuity} onChange={event => change(setContinuity)(event.target.checked)} />Continuity correction for normal approximation (ignored for exact inference)</label>
                    <p className="text-sm">Auto uses exact inference for {paired ? 'up to 50 nonzero pairs' : 'up to 40 observed values across both samples'}, including ties. Above that it uses a normal approximation. Maximum input: 10,000 entries per sample.</p>
                    {paired && <p className="text-sm">Zero differences are omitted before ranking (Wilcox convention). Decimal subtraction can introduce artificial rank differences: choose rounding to match your measurement precision when appropriate. Rounding can create ties or zero differences and changes the analysis.</p>}
                    <button type="submit" disabled={source === 'saved' && isLoading} className="rounded-xl bg-indigo-600 px-6 py-3 font-bold text-white disabled:opacity-60">Calculate test</button>
                </form>
            </AnalysisCard>
            {output && <div ref={outputRegion} tabIndex={-1} role="region" aria-label="Calculation output" className="scroll-mt-24"><AnalysisCard darkMode={darkMode}>{output.ok ? <RankTestResults result={output} alpha={Number(alpha)} sourceLabel={output.sourceLabel} darkMode={darkMode} /> : <p role="alert">{output.error}</p>}</AnalysisCard></div>}
        </>}
    </div>;
}
