import React, { useMemo, useState } from 'react';
import { Info, RefreshCw, SlidersHorizontal, Sparkles, Target } from 'lucide-react';
import {
    buildPearsonTutorBaseDataset,
    calculatePearsonCorrelationStats,
    derivePearsonTutorDataset,
} from '../../stats/correlation';
import { PEARSON_TUTOR_PRESETS } from '../../data/pearsonCorrelationPresets';
import { formatStatistic } from '../../utils/statFormatters';
import AnalysisCard from '../analysis/AnalysisCard';
import AnalysisMetricTile from '../analysis/AnalysisMetricTile';
import PearsonScatterplot from './PearsonScatterplot';

const PearsonLessonSection = ({ darkMode }) => {
    const [preset, setPreset] = useState('strong_positive');
    const [sampleSize, setSampleSize] = useState(36);
    const [noise, setNoise] = useState(0.28);
    const [showLine, setShowLine] = useState(true);
    const [showBand, setShowBand] = useState(false);
    const [includeOutlier, setIncludeOutlier] = useState(false);
    const [generationKey, setGenerationKey] = useState(0);
    const [baseRequest, setBaseRequest] = useState({ preset, sampleSize, noise, generationKey });

    const baseDataset = useMemo(() => buildPearsonTutorBaseDataset({
        preset: baseRequest.preset,
        targetSampleSize: baseRequest.sampleSize,
        targetNoise: baseRequest.noise,
        generationKey: baseRequest.generationKey,
    }), [baseRequest]);
    const dataset = useMemo(() => derivePearsonTutorDataset({
        baseDataset,
        sampleSize,
        noise,
        includeOutlier,
    }), [baseDataset, includeOutlier, noise, sampleSize]);
    const stats = useMemo(() => calculatePearsonCorrelationStats({
        xValues: (dataset.pairs || []).map(({ x }) => x),
        yValues: (dataset.pairs || []).map(({ y }) => y),
    }), [dataset.pairs]);
    const contextStats = useMemo(() => {
        const pairs = dataset.contextStatsPairs?.length ? dataset.contextStatsPairs : dataset.contextPairs;
        return pairs?.length ? calculatePearsonCorrelationStats({ xValues: pairs.map(({ x }) => x), yValues: pairs.map(({ y }) => y) }) : null;
    }, [dataset.contextPairs, dataset.contextStatsPairs]);
    const baseDescription = PEARSON_TUTOR_PRESETS.find(([id]) => id === preset)?.[2]
        || 'Explore how Pearson correlation behaves.';
    const subtitle = includeOutlier ? `${baseDescription} Compare the same pattern before and after one influential point.` : baseDescription;

    const selectPreset = (nextPreset) => {
        if (nextPreset === preset) return;
        setPreset(nextPreset);
        setGenerationKey((value) => value + 1);
        setBaseRequest(({ generationKey: previousKey }) => ({ preset: nextPreset, sampleSize, noise, generationKey: previousKey + 1 }));
    };
    const regenerate = () => {
        const nextKey = generationKey + 1;
        setGenerationKey(nextKey);
        setBaseRequest({ preset, sampleSize, noise, generationKey: nextKey });
    };

    return (
        <div className="space-y-8">
            <AnalysisCard darkMode={darkMode}><div className="flex items-start gap-4"><div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400"><Sparkles size={20} /></div><div><h3 className={`text-xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>Pearson correlation tutor / lessons</h3><p className="mt-2 text-sm max-w-3xl text-slate-500">Use the presets and controls to see what r responds to and what it misses.</p></div></div></AnalysisCard>
            <div className="grid lg:grid-cols-12 gap-8 items-start">
                <div className="lg:col-span-8 space-y-6">
                    <AnalysisCard darkMode={darkMode}><PearsonScatterplot pairs={dataset.pairs || []} backgroundPairs={dataset.contextPairs} stats={stats} darkMode={darkMode} xLabel="X Variable" yLabel="Y Variable" showLine={showLine} showConfidenceBand={showBand} highlightPointIndex={stats?.influence?.influentialPoint?.index} highlightXRange={dataset.highlightXRange} title="Interactive Scatterplot" subtitle={subtitle} /></AnalysisCard>
                    <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4"><AnalysisMetricTile darkMode={darkMode} label="r" value={formatStatistic(stats?.r)} tone="primary" /><AnalysisMetricTile darkMode={darkMode} label="r²" value={formatStatistic(stats?.rSquared)} /><AnalysisMetricTile darkMode={darkMode} label="n" value={`${stats?.n || 0}`} /><AnalysisMetricTile darkMode={darkMode} label="Live Read" value={stats?.interpretation || 'Waiting for data'} /></div>
                    {preset === 'restricted_range' && contextStats?.ok && stats?.ok && <AnalysisCard darkMode={darkMode}><div className="flex items-center gap-3 mb-3"><Target size={18} className="text-amber-500" /><h3 className={`text-lg font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>Why restricted range looks weaker</h3></div><p className="text-sm leading-relaxed text-slate-500">The broader relationship has r = {formatStatistic(contextStats.r)}. Observing only part of X compresses the visible spread and changes r to {formatStatistic(stats.r)}.</p></AnalysisCard>}
                </div>

                <div className="lg:col-span-4 space-y-6">
                    <AnalysisCard darkMode={darkMode}>
                        <div className="flex items-center gap-3 mb-4"><SlidersHorizontal size={18} className="text-indigo-500" /><div><div className="text-[10px] font-black uppercase tracking-widest text-indigo-500">Presets</div><h3 className={`text-xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>Explore the pattern</h3></div></div>
                        <div className="grid grid-cols-2 gap-3">{PEARSON_TUTOR_PRESETS.map(([id, label]) => <button key={id} type="button" onClick={() => selectPreset(id)} className={`rounded-xl border px-3 py-3 text-left text-xs font-black uppercase tracking-widest ${preset === id ? 'bg-indigo-600 text-white border-indigo-500' : darkMode ? 'bg-slate-950 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>{label}</button>)}</div>
                        <div className="mt-6 space-y-4">
                            <label className="block"><span className="flex justify-between text-[11px] font-black uppercase tracking-widest text-slate-500"><span>Sample Size</span><span>{sampleSize}</span></span><input type="range" min="12" max="90" step="1" value={sampleSize} onChange={(event) => setSampleSize(Number(event.target.value))} className="mt-2 w-full accent-indigo-500" /></label>
                            <label className="block"><span className="flex justify-between text-[11px] font-black uppercase tracking-widest text-slate-500"><span>Noise</span><span>{Math.round(noise * 100)}%</span></span><input type="range" min="0" max="1" step="0.01" value={noise} onChange={(event) => setNoise(Number(event.target.value))} className="mt-2 w-full accent-indigo-500" /></label>
                        </div>
                        <div className="mt-6 grid grid-cols-2 gap-3"><button type="button" onClick={() => setShowLine((value) => !value)} className={`rounded-xl border px-4 py-3 text-xs font-black uppercase ${showLine ? 'bg-indigo-600 text-white border-indigo-500' : 'border-slate-700 text-slate-500'}`}>{showLine ? 'Hide Line' : 'Show Line'}</button><button type="button" onClick={() => setShowBand((value) => !value)} className={`rounded-xl border px-4 py-3 text-xs font-black uppercase ${showBand ? 'bg-indigo-600 text-white border-indigo-500' : 'border-slate-700 text-slate-500'}`}>{showBand ? 'Hide Band' : 'Show Band'}</button><button type="button" onClick={() => setIncludeOutlier((value) => !value)} className={`col-span-2 rounded-xl border px-4 py-3 text-xs font-black uppercase ${includeOutlier ? 'bg-indigo-600 text-white border-indigo-500' : 'border-slate-700 text-slate-500'}`}>{includeOutlier ? 'Remove Outlier' : 'Add Outlier'}</button><button type="button" onClick={regenerate} className="col-span-2 inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 px-4 py-3 text-xs font-black uppercase text-slate-500"><RefreshCw size={14} />Regenerate Sample</button></div>
                    </AnalysisCard>
                    <AnalysisCard darkMode={darkMode}><div className="flex items-center gap-3 mb-4"><Info size={18} className="text-amber-500" /><h3 className={`text-xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>Core ideas</h3></div><div className="space-y-3">{['r summarizes a straight-line association.', 'r = 0 does not rule out a nonlinear relationship.', 'Outliers and restriction of range can strongly change r.', 'Correlation does not establish causation.'].map((idea) => <p key={idea} className="rounded-xl border border-slate-800 p-4 text-sm text-slate-500">{idea}</p>)}</div></AnalysisCard>
                </div>
            </div>
        </div>
    );
};

export default PearsonLessonSection;
