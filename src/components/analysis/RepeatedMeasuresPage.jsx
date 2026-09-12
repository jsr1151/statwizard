import { useEffect, useRef, useState } from 'react';
import AnalysisCard from './AnalysisCard.jsx';
import RepeatedMeasuresInputs from './RepeatedMeasuresInputs.jsx';
import RepeatedMeasuresResults from './RepeatedMeasuresResults.jsx';
import RepeatedMeasuresGuide from './RepeatedMeasuresGuide.jsx';
import { useDatasetLibraryContext } from '../../hooks/useDatasetLibrary.js';
import { consumeAnalysisLaunchPayload, readAnalysisLaunchPayload } from '../../utils/analysisLaunch.js';
import { parseRepeatedMeasuresText, prepareRepeatedDataset } from '../../utils/repeatedMeasuresData.js';
import { calculateRepeatedMeasures } from '../../stats/repeatedMeasures.js';

const EXAMPLE = 'Participant,A,B,C\nP1,2.2,1.1,8.2\nP2,3.1,2.5,4.5\nP3,4.3,4.1,3.4\nP4,4.1,5.2,6.2\nP5,7.2,6.4,7.2';

export default function RepeatedMeasuresPage({ section, darkMode, onSectionChange, onOpenDataManager }) {
    const { datasets, isLoading } = useDatasetLibraryContext();
    const [launch] = useState(() => readAnalysisLaunchPayload('repeated_measures_anova'));
    useEffect(() => { if (launch) consumeAnalysisLaunchPayload('repeated_measures_anova'); }, [launch]);
    const [source, setSource] = useState(launch?.datasetId ? 'saved' : 'paste');
    const [format, setFormat] = useState('wide');
    const [text, setText] = useState('');
    const [datasetId, setDatasetId] = useState(launch?.datasetId || '');
    const [selection, setSelection] = useState(launch || {});
    const [missingPolicy, setMissingPolicy] = useState('reject');
    const [correction, setCorrection] = useState('gg');
    const [alpha, setAlpha] = useState('0.05');
    const [output, setOutput] = useState(null);
    const outputRegion = useRef(null);
    useEffect(() => {
        if (output) { outputRegion.current?.focus(); outputRegion.current?.scrollIntoView?.({ block: 'start' }); }
    }, [output]);
    const change = setter => value => { setter(value); setOutput(null); };
    const example = () => {
        setText(EXAMPLE); setSource('example'); setFormat('wide'); setOutput(null); setMissingPolicy('reject'); setCorrection('gg'); setAlpha('0.05'); onSectionChange('calculator');
    };
    const calculate = event => {
        event.preventDefault();
        const dataset = datasets.find(item => item.id === datasetId);
        const data = source === 'saved' ? prepareRepeatedDataset(dataset, selection, format) : parseRepeatedMeasuresText(text, format);
        if (data.error) { setOutput({ ok: false, error: data.error }); return; }
        const result = calculateRepeatedMeasures({ ...data, missingPolicy });
        const identity = source === 'saved' ? `Saved dataset: ${dataset.name}; ID variable: ${dataset.columns.find(column=>column.id===selection.subject)?.label}` : source === 'example' ? 'Worked example (sample data)' : 'User-entered table';
        setOutput({ ...result, sourceLabel: `${identity}; ${format} format, matched by participant ID${format === 'long' ? ' and condition label' : ''}` });
    };
    const field = `mt-2 w-full rounded-xl border p-3 ${darkMode ? 'bg-slate-950 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'}`;
    return <div className="space-y-6 [overflow-wrap:anywhere]">
        {section !== 'calculator' ? <RepeatedMeasuresGuide section={section} darkMode={darkMode} onExample={example} /> : <>
            <AnalysisCard darkMode={darkMode}><h3 className="mb-4 text-2xl font-bold">Repeated-measures calculator</h3><p className="mb-5">One within-subject factor, 2–12 conditions, and at least three complete participants. Maximum: 10,000 participants.</p>
                <form onSubmit={calculate} className="space-y-6">
                    <RepeatedMeasuresInputs {...{darkMode,source,format,text,datasets,datasetId,selection,onOpenDataManager}} setSource={change(setSource)} setFormat={value=>{setFormat(value);setSelection({subject:selection.subject});setOutput(null);}} setText={value=>{setText(value);setSource('paste');setOutput(null);}} setDatasetId={value=>{setDatasetId(value);setSelection({});setOutput(null);}} setSelection={change(setSelection)} onExample={example} />
                    <label className="block">Incomplete participants<select className={field} value={missingPolicy} onChange={event=>change(setMissingPolicy)(event.target.value)}><option value="reject">Require complete measurements</option><option value="exclude">Exclude incomplete participants and list exclusions</option></select></label>
                    <div className="grid gap-4 md:grid-cols-2">
                        <label>Reporting correction<select className={field} value={correction} onChange={event=>setCorrection(event.target.value)}><option value="gg">Greenhouse–Geisser (default)</option><option value="hf">Huynh–Feldt</option><option value="uncorrected">Uncorrected (assumes sphericity)</option><option value="lowerBound">Lower bound</option></select></label>
                        <label>Significance level (alpha)<select className={field} value={alpha} onChange={event=>setAlpha(event.target.value)}><option>0.01</option><option>0.05</option><option>0.10</option></select></label>
                    </div>
                    <p className="text-sm">Changing the reporting correction updates the report; every correction is shown in the results table. Missing observations are never imputed, and incomplete participants are never combined into artificial complete rows.</p>
                    <button type="submit" disabled={source==='saved' && isLoading} className="rounded-xl bg-indigo-600 px-6 py-3 font-bold text-white disabled:opacity-60">Calculate repeated-measures ANOVA</button>
                </form>
            </AnalysisCard>
            {output && <div ref={outputRegion} tabIndex={-1} role="region" aria-label="Calculation output" className="scroll-mt-24"><AnalysisCard darkMode={darkMode}>{output.ok ? <RepeatedMeasuresResults result={output} correction={correction} alpha={Number(alpha)} source={output.sourceLabel} darkMode={darkMode} /> : <div><p role="alert">{output.error}</p>{output.excluded && <><ul className="mt-3 list-disc space-y-2 pl-6">{output.excluded.slice(0,100).map(row=><li key={row.id}>{row.id}: missing {row.conditions.join(', ')}</li>)}</ul>{output.excluded.length>100 && <p>Showing the first 100 incomplete participants.</p>}</>}</div>}</AnalysisCard></div>}
        </>}
    </div>;
}
