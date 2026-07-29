import React, { useMemo, useState } from 'react';
import { Info, RefreshCw, SlidersHorizontal, Sparkles, Target } from 'lucide-react';
import {
    buildRegressionInterpretation,
    buildRegressionTutorBaseDataset,
    calculateSimpleLinearRegressionStats,
    deriveRegressionTutorDataset,
} from '../../stats/regression';
import { REGRESSION_TUTOR_PRESETS } from '../../data/regressionPresets';
import { formatStatistic } from '../../utils/statFormatters';
import AnalysisCard from '../analysis/AnalysisCard';
import AnalysisMetricTile from '../analysis/AnalysisMetricTile';
import RegressionResidualPlot from './RegressionResidualPlot';
import RegressionScatterplot from './RegressionScatterplot';

const RegressionLessonSection = ({ darkMode }) => {
    const [preset, setPreset] = useState('positive_low_noise');
    const [sampleSize, setSampleSize] = useState(36);
    const [noise, setNoise] = useState(0.28);
    const [showLine, setShowLine] = useState(true);
    const [showBand, setShowBand] = useState(false);
    const [showPredictionBand, setShowPredictionBand] = useState(false);
    const [showResiduals, setShowResiduals] = useState(false);
    const [includeOutlier, setIncludeOutlier] = useState(false);
    const [baseRequest, setBaseRequest] = useState({ preset, sampleSize, noise, generationKey: 0 });
    const baseDataset = useMemo(() => buildRegressionTutorBaseDataset({
        preset: baseRequest.preset,
        targetSampleSize: baseRequest.sampleSize,
        targetNoise: baseRequest.noise,
        generationKey: baseRequest.generationKey,
    }), [baseRequest]);
    const dataset = useMemo(() => deriveRegressionTutorDataset({ baseDataset, sampleSize, noise, includeOutlier }), [baseDataset, includeOutlier, noise, sampleSize]);
    const stats = useMemo(() => calculateSimpleLinearRegressionStats({ xValues: (dataset.pairs || []).map(({ x }) => x), yValues: (dataset.pairs || []).map(({ y }) => y), confidenceLevel: 0.95 }), [dataset.pairs]);
    const baseDescription = REGRESSION_TUTOR_PRESETS.find(([id]) => id === preset)?.[2] || 'Explore the fitted line.';
    const subtitle = includeOutlier ? `${baseDescription} The outlier adds one influential case to the same sample.` : baseDescription;

    const selectPreset = (nextPreset) => {
        if (nextPreset === preset) return;
        setPreset(nextPreset);
        setBaseRequest((previous) => ({ preset: nextPreset, sampleSize, noise, generationKey: previous.generationKey + 1 }));
    };
    const regenerate = () => setBaseRequest((previous) => ({ preset, sampleSize, noise, generationKey: previous.generationKey + 1 }));
    const lessonText = preset === 'nonlinear'
        ? 'The curved pattern shows why one straight regression line can be misleading even when it returns a slope and R².'
        : includeOutlier
            ? 'Because the outlier is added to the same underlying sample, its influence on slope, residuals, and fit is visible.'
            : buildRegressionInterpretation(stats);

    return (
        <div className="space-y-8">
            <AnalysisCard darkMode={darkMode}><div className="flex items-start gap-4"><div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400"><Sparkles size={20} /></div><div><h3 className={`text-xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>Simple linear regression tutor / lessons</h3><p className="mt-2 text-sm max-w-3xl text-slate-500">Explore how slopes, residuals, prediction intervals, outliers, and nonlinear patterns affect the fitted line.</p></div></div></AnalysisCard>
            <div className="grid lg:grid-cols-12 gap-8 items-start">
                <div className="lg:col-span-8 space-y-6">
                    <AnalysisCard darkMode={darkMode}><RegressionScatterplot pairs={stats?.pairs || []} stats={stats} darkMode={darkMode} xLabel="Predictor X" yLabel="Outcome Y" showLine={showLine} showConfidenceBand={showBand} showPredictionBand={showPredictionBand} showResiduals={showResiduals} confidenceLevel={0.95} highlightPointIndex={stats?.influence?.influentialIndex} title="Interactive regression plot" subtitle={subtitle} /></AnalysisCard>
                    {showResiduals && stats?.ok && <AnalysisCard darkMode={darkMode}><RegressionResidualPlot stats={stats} darkMode={darkMode} /></AnalysisCard>}
                    <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4"><AnalysisMetricTile darkMode={darkMode} label="Slope" value={formatStatistic(stats?.slope)} tone="primary" /><AnalysisMetricTile darkMode={darkMode} label="Intercept" value={formatStatistic(stats?.intercept)} /><AnalysisMetricTile darkMode={darkMode} label="R²" value={formatStatistic(stats?.rSquared)} /><AnalysisMetricTile darkMode={darkMode} label="n" value={`${stats?.n || 0}`} detail={stats?.interpretation || 'Waiting for data'} /></div>
                    <AnalysisCard darkMode={darkMode}><div className="flex items-center gap-3 mb-3"><Target size={18} className="text-amber-500" /><h3 className={`text-lg font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>What this view is teaching</h3></div><p className="text-sm leading-relaxed text-slate-500">{lessonText}</p></AnalysisCard>
                </div>
                <div className="lg:col-span-4 space-y-6">
                    <AnalysisCard darkMode={darkMode}>
                        <div className="flex items-center gap-3 mb-4"><SlidersHorizontal size={18} className="text-indigo-500" /><div><div className="text-[10px] font-black uppercase tracking-widest text-indigo-500">Presets</div><h3 className={`text-xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>Explore the model</h3></div></div>
                        <div className="grid grid-cols-2 gap-3">{REGRESSION_TUTOR_PRESETS.map(([id, label]) => <button key={id} type="button" onClick={() => selectPreset(id)} className={`rounded-xl border px-3 py-3 text-left text-xs font-black uppercase tracking-widest ${preset === id ? 'bg-indigo-600 text-white border-indigo-500' : 'border-slate-800 text-slate-500'}`}>{label}</button>)}</div>
                        <div className="mt-6 space-y-4"><label className="block"><span className="flex justify-between text-[11px] font-black uppercase tracking-widest text-slate-500"><span>Sample Size</span><span>{sampleSize}</span></span><input type="range" min="12" max="90" step="1" value={sampleSize} onChange={(event) => setSampleSize(Number(event.target.value))} className="mt-2 w-full accent-indigo-500" /></label><label className="block"><span className="flex justify-between text-[11px] font-black uppercase tracking-widest text-slate-500"><span>Noise</span><span>{Math.round(noise * 100)}%</span></span><input type="range" min="0" max="1" step="0.01" value={noise} onChange={(event) => setNoise(Number(event.target.value))} className="mt-2 w-full accent-indigo-500" /></label></div>
                        <div className="mt-6 grid grid-cols-2 gap-3">{[
                            [showLine, setShowLine, 'Line'],
                            [showBand, setShowBand, 'CI'],
                            [showPredictionBand, setShowPredictionBand, 'PI'],
                            [showResiduals, setShowResiduals, 'Residuals'],
                        ].map(([active, setter, label]) => <button key={label} type="button" onClick={() => setter((value) => !value)} className={`rounded-xl border px-4 py-3 text-xs font-black uppercase ${active ? 'bg-indigo-600 text-white border-indigo-500' : 'border-slate-800 text-slate-500'}`}>{active ? `Hide ${label}` : `Show ${label}`}</button>)}<button type="button" onClick={() => setIncludeOutlier((value) => !value)} className={`col-span-2 rounded-xl border px-4 py-3 text-xs font-black uppercase ${includeOutlier ? 'bg-indigo-600 text-white border-indigo-500' : 'border-slate-800 text-slate-500'}`}>{includeOutlier ? 'Remove Outlier' : 'Add Outlier'}</button><button type="button" onClick={regenerate} className="col-span-2 inline-flex items-center justify-center gap-2 rounded-xl border border-slate-800 px-4 py-3 text-xs font-black uppercase text-slate-500"><RefreshCw size={14} />Regenerate Sample</button></div>
                    </AnalysisCard>
                    <AnalysisCard darkMode={darkMode}><div className="flex items-center gap-3 mb-4"><Info size={18} className="text-amber-500" /><h3 className={`text-xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>Core ideas</h3></div><div className="space-y-3">{['The line models mean Y as X changes.', 'Residuals are prediction errors.', 'R² summarizes fit, not causation.', 'Outliers and curves can make one line misleading.'].map((idea) => <p key={idea} className="rounded-xl border border-slate-800 p-4 text-sm text-slate-500">{idea}</p>)}</div></AnalysisCard>
                </div>
            </div>
        </div>
    );
};

export default RegressionLessonSection;
