import React, { useState, useMemo } from 'react';
import {
    Info, AlertCircle, ChevronRight, Calculator, Activity,
    Lightbulb, BrainCircuit, BarChart2, TrendingUp, Sparkles,
    MousePointer2, Zap, HelpCircle, CheckCircle2, Clipboard,
    Ban, ShieldCheck, Target, Layers
} from 'lucide-react';
import {
    getGaussianPoints, normalCDF, erf, pointsToPath
} from '../../utils/mathHelpers';
import TabButton from '../common/TabButton';

// --- SUB-COMPONENT: P-Value Widget ---
const PValueWidget = ({ darkMode }) => {
    const [statistic, setStatistic] = useState(1.96);
    const [tails, setTails] = useState(2);

    const mean = 150;
    const stdDev = 35;
    const points = useMemo(() => getGaussianPoints(mean, stdDev, 100, 300), []);
    const pathData = pointsToPath(points);

    const pValue = useMemo(() => {
        const z = Math.abs(statistic);
        const pOneTail = 1 - normalCDF(z);
        return tails === 2 ? pOneTail * 2 : (statistic >= 0 ? pOneTail : 1 - pOneTail);
    }, [statistic, tails]);

    return (
        <div className={`p-4 rounded-xl border flex flex-col gap-4 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
            <div className="h-40 relative flex items-end justify-center">
                <svg viewBox="0 0 300 150" className="w-full h-full overflow-visible">
                    {/* Base Axis */}
                    <line x1="0" y1="140" x2="300" y2="140" stroke={darkMode ? "#334155" : "#e2e8f0"} strokeWidth="2" />

                    {/* Shaded P-Value Area */}
                    {tails === 2 ? (
                        <>
                            <path
                                d={`M ${mean + Math.abs(statistic) * stdDev},140 ` + points.filter(p => p[0] >= mean + Math.abs(statistic) * stdDev).map(p => `L ${p[0]},${p[1] - 10}`).join(' ') + ` L 300,140 Z`}
                                fill="#6366f1" fillOpacity="0.4"
                            />
                            <path
                                d={`M 0,140 ` + points.filter(p => p[0] <= mean - Math.abs(statistic) * stdDev).map(p => `L ${p[0]},${p[1] - 10}`).join(' ') + ` L ${mean - Math.abs(statistic) * stdDev},140 Z`}
                                fill="#6366f1" fillOpacity="0.4"
                            />
                        </>
                    ) : (
                        statistic >= 0
                            ? <path d={`M ${mean + statistic * stdDev},140 ` + points.filter(p => p[0] >= mean + statistic * stdDev).map(p => `L ${p[0]},${p[1] - 10}`).join(' ') + ` L 300,140 Z`} fill="#6366f1" fillOpacity="0.4" />
                            : <path d={`M 0,140 ` + points.filter(p => p[0] <= mean + statistic * stdDev).map(p => `L ${p[0]},${p[1] - 10}`).join(' ') + ` L ${mean + statistic * stdDev},140 Z`} fill="#6366f1" fillOpacity="0.4" />
                    )}

                    {/* The Distribution Curve */}
                    <path d={pathData.replace(/150 -/g, '140 -')} fill="none" stroke={darkMode ? "#475569" : "#94a3b8"} strokeWidth="2" />

                    {/* Observed Statistic Marker */}
                    <line
                        x1={mean + statistic * stdDev} y1="20" x2={mean + statistic * stdDev} y2="140"
                        stroke="#6366f1" strokeWidth="2" strokeDasharray="4,2"
                    />
                    <circle cx={mean + statistic * stdDev} cy="140" r="4" fill="#6366f1" />
                    <text x={mean + statistic * stdDev} y="15" textAnchor="middle" className="text-[10px] font-bold fill-indigo-500 uppercase">z = {statistic.toFixed(2)}</text>
                </svg>
            </div>

            <div className="space-y-3">
                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-500">
                    <span>Observed Statistic</span>
                    <span className="text-indigo-500 text-xs">p = {pValue.toFixed(4)}</span>
                </div>
                <input
                    type="range" min="-3.5" max="3.5" step="0.01" value={statistic}
                    onChange={(e) => setStatistic(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 rounded-full appearance-none cursor-pointer accent-indigo-500"
                />
                <div className="flex gap-2">
                    <button onClick={() => setTails(1)} className={`flex-1 py-1.5 text-[9px] font-black rounded uppercase transition-all ${tails === 1 ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}>One-Tailed</button>
                    <button onClick={() => setTails(2)} className={`flex-1 py-1.5 text-[9px] font-black rounded uppercase transition-all ${tails === 2 ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}>Two-Tailed</button>
                </div>
                <p className={`text-[9px] font-medium leading-relaxed ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                    <strong>What this shows:</strong> As the statistic moves further from the center (0), the shaded area (p-value) gets smaller, meaning the data is less likely under the null.
                </p>
            </div>
        </div>
    );
};

// --- SUB-COMPONENT: CI Widget ---
const CIWidget = ({ darkMode }) => {
    const [estimate, setEstimate] = useState(1.5);
    const [range, setRange] = useState(0.8);
    const nullValue = 0;

    const includesNull = Math.abs(estimate - nullValue) <= range;

    return (
        <div className={`p-4 rounded-xl border flex flex-col gap-4 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
            <div className="h-32 flex items-center justify-center relative">
                <svg viewBox="0 0 300 100" className="w-full">
                    {/* Axis */}
                    <line x1="20" y1="70" x2="280" y2="70" stroke={darkMode ? "#334155" : "#e2e8f0"} strokeWidth="1" />
                    {[-2, -1, 0, 1, 2, 3].map(t => (
                        <g key={t} transform={`translate(${150 + t * 40}, 70)`}>
                            <line y2="4" stroke={darkMode ? "#334155" : "#e2e8f0"} />
                            <text y="12" textAnchor="middle" className="text-[8px] fill-slate-400 font-bold">{t}</text>
                        </g>
                    ))}

                    {/* Null Reference */}
                    <line x1={150 + nullValue * 40} y1="50" x2={150 + nullValue * 40} y2="85" stroke="#ef4444" strokeWidth="1" strokeDasharray="2,1" />
                    <text x={150 + nullValue * 40} y="45" textAnchor="middle" className="text-[7px] font-black fill-red-500 uppercase tracking-tighter">Null ({nullValue})</text>

                    {/* CI Bar */}
                    <line
                        x1={150 + (estimate - range) * 40} x2={150 + (estimate + range) * 40} y1="60" y2="60"
                        stroke={includesNull ? "#94a3b8" : "#10b981"} strokeWidth="4" strokeLinecap="round"
                    />
                    <circle cx={150 + estimate * 40} cy="60" r="5" fill={includesNull ? "#94a3b8" : "#10b981"} stroke="white" strokeWidth="2" />

                    {/* Result Tag */}
                    <g transform={`translate(${150 + estimate * 40}, 25)`}>
                        <rect x="-30" y="-8" width="60" height="12" rx="2" fill={includesNull ? "#94a3b8" : "#10b981"} opacity="0.1" />
                        <text textAnchor="middle" className={`text-[7px] font-black uppercase tracking-widest ${includesNull ? 'fill-slate-500' : 'fill-emerald-500'}`}>
                            {includesNull ? 'Includes Null' : 'Excludes Null'}
                        </text>
                    </g>
                </svg>
            </div>

            <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <span className="text-[9px] font-black uppercase text-slate-500">Estimate</span>
                        <input type="range" min="-1.5" max="3" step="0.1" value={estimate} onChange={(e) => setEstimate(parseFloat(e.target.value))} className="w-full h-1 bg-slate-200 rounded-full appearance-none accent-indigo-500" />
                    </div>
                    <div className="space-y-1">
                        <span className="text-[9px] font-black uppercase text-slate-500">Precision (Width)</span>
                        <input type="range" min="0.2" max="1.5" step="0.1" value={range} onChange={(e) => setRange(parseFloat(e.target.value))} className="w-full h-1 bg-slate-200 rounded-full appearance-none accent-indigo-500" />
                    </div>
                </div>
                <div className={`p-2 rounded-lg text-[9px] font-black text-center border uppercase transition-all ${includesNull ? 'bg-slate-100 border-slate-200 text-slate-500' : 'bg-emerald-50 border-emerald-100 text-emerald-600'}`}>
                    {includesNull ? 'Imply p > .05 (Two-sided)' : 'Imply p < .05 (Two-sided)'}
                </div>
                <p className={`text-[9px] font-medium leading-relaxed ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                    <strong>What this shows:</strong> If the CI contains the null value (0), the effect is not significant. If it excludes the null, we have evidence of a real effect.
                </p>
            </div>
        </div>
    );
};

// --- SUB-COMPONENT: Power Widget ---
const PowerWidget = ({ darkMode }) => {
    const [effectSize, setEffectSize] = useState(0.5);
    const [sampleSize, setSampleSize] = useState(30);

    const alpha = 0.05;
    const meanH0 = 100;
    const stdDev = 25;
    const se = stdDev / Math.sqrt(sampleSize);
    const seScale = 15; // Scaled for visualization

    const critZ = 1.96;
    const cutoff = meanH0 + critZ * (seScale);
    const meanH1 = meanH0 + (effectSize * 15 * Math.sqrt(sampleSize / 10)); // Heuristic scaling for visual

    const pointsH0 = useMemo(() => getGaussianPoints(meanH0, seScale, 80, 300), [seScale]);
    const pointsH1 = useMemo(() => getGaussianPoints(meanH1, seScale, 80, 300), [meanH1, seScale]);

    return (
        <div className={`p-4 rounded-xl border flex flex-col gap-4 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
            <div className="h-40 relative flex items-end justify-center">
                <svg viewBox="0 0 300 150" className="w-full h-full overflow-visible">
                    <line x1="0" y1="140" x2="300" y2="140" stroke={darkMode ? "#334155" : "#e2e8f0"} strokeWidth="1" />

                    {/* H0 Distribution */}
                    <path d={pointsToPath(pointsH0).replace(/150 -/g, '140 -')} fill="none" stroke={darkMode ? "#334155" : "#cbd5e1"} strokeWidth="1" strokeDasharray="3,3" />
                    <text x={meanH0} y="148" textAnchor="middle" className="text-[7px] font-bold fill-slate-400">NULL (H₀)</text>

                    {/* H1 Distribution */}
                    <path d={pointsToPath(pointsH1).replace(/150 -/g, '140 -')} fill="none" stroke="#6366f1" strokeWidth="2" />
                    <text x={meanH1} y="148" textAnchor="middle" className="text-[7px] font-bold fill-indigo-500">REAL EFFECT (H₁)</text>

                    {/* Cutoff / Alpha Line */}
                    <line x1={cutoff} y1="30" x2={cutoff} y2="140" stroke="#ef4444" strokeWidth="2" strokeDasharray="4,2" />
                    <text x={cutoff} y="25" textAnchor="middle" className="text-[7px] font-black fill-red-500 uppercase tracking-tighter">Significance Cutoff</text>

                    {/* Shaded Areas */}
                    {/* Power: H1 density beyond cutoff */}
                    <path
                        d={`M ${cutoff},140 ` + pointsH1.filter(p => p[0] >= cutoff).map(p => `L ${p[0]},${p[1] - 10}`).join(' ') + ` L 300,140 Z`}
                        fill="#22c55e" fillOpacity="0.3"
                    />
                    <text x={(cutoff + 280) / 2} y="100" textAnchor="middle" className="text-[8px] font-black fill-emerald-600">Power</text>
                </svg>
            </div>

            <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <span className="text-[9px] font-black uppercase text-slate-500">Effect Size (Cohen's d)</span>
                        <input type="range" min="0" max="1.5" step="0.1" value={effectSize} onChange={(e) => setEffectSize(parseFloat(e.target.value))} className="w-full h-1 bg-slate-200 rounded-full appearance-none accent-indigo-500" />
                    </div>
                    <div className="space-y-1">
                        <span className="text-[9px] font-black uppercase text-slate-500">Sample Size (N)</span>
                        <input type="range" min="2" max="100" step="1" value={sampleSize} onChange={(e) => setSampleSize(parseInt(e.target.value))} className="w-full h-1 bg-slate-200 rounded-full appearance-none accent-indigo-500" />
                    </div>
                </div>
                <div className="flex gap-4">
                    <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400 opacity-50"></span> <span className="text-[8px] font-bold text-slate-500">α (Type I Error)</span></div>
                    <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400 opacity-50"></span> <span className="text-[8px] font-bold text-slate-500">1-β (Power)</span></div>
                </div>
                <p className={`text-[9px] font-medium leading-relaxed ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                    <strong>What this shows:</strong> Power increases as both **Effect Size** (distance between peaks) and **Sample Size** (narrower peaks) increase.
                </p>
            </div>
        </div>
    );
};

// --- MAIN COMPONENT ---
const NhstVisual = ({ darkMode }) => {
    const [activeTab, setActiveTab] = useState('pValue');
    const [activeStep, setActiveStep] = useState(0);

    const steps = [
        { id: 0, title: "H₀ and H₁", desc: "Define the claims." },
        { id: 1, title: "Pick Test", desc: "Z, T, or F?" },
        { id: 2, title: "Compute", desc: "Math happens here." },
        { id: 3, title: "P-Value", desc: "Likelihood of data." },
        { id: 4, title: "Report", desc: "Tell the full story." }
    ];

    const mistakes = [
        { title: "Misinterpreting p > .05", text: "It doesn't mean 'no effect'. It just means we don't have enough evidence yet to reject the null." },
        { title: "Ignoring Effect Size", text: "A result can be 'statistically significant' but so small it doesn't matter' in the real world." },
        { title: "P-Hacking", text: "Testing more variables just to find a p < .05 increases your false positive rate." }
    ];

    return (
        <div className={`w-full max-w-7xl mx-auto flex flex-col gap-8 p-4 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>

            {/* Header & Takeaways */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-6 border-b border-slate-800/10">
                <div className="space-y-1">
                    <h2 className={`text-4xl font-black tracking-tighter ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                        NHST <span className="text-indigo-500">Logic</span>
                    </h2>
                    <p className="text-lg font-medium text-slate-400 italic">"P-values, confidence intervals, and what 'significant' really means."</p>
                </div>
                <div className="flex flex-col gap-2 bg-indigo-500/5 p-4 rounded-2xl border border-indigo-500/10 max-w-md">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase text-indigo-500 tracking-widest mb-1">
                        <Zap size={14} /> Key Takeaways
                    </div>
                    <div className="space-y-1 text-sm font-medium">
                        <div className="flex items-center gap-2">
                            <CheckCircle2 size={12} className="text-indigo-400" />
                            <span>Tests compatibility with a <strong className="text-indigo-400">null model</strong></span>
                        </div>
                        <div className="flex items-center gap-2">
                            <CheckCircle2 size={12} className="text-indigo-400" />
                            <span>Contextualizes whether results are <strong className="text-indigo-400">surprising</strong></span>
                        </div>
                    </div>
                </div>
            </div>

            {/* 5-Step Stepper */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
                    <Layers size={14} /> The NHST Workflow
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {steps.map((step, idx) => (
                        <button
                            key={idx}
                            onClick={() => setActiveStep(idx)}
                            className={`p-4 rounded-xl border-2 text-left transition-all relative overflow-hidden group hover:scale-[1.02] active:scale-95 ${activeStep === idx
                                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg z-10'
                                    : (darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100')
                                }`}
                        >
                            <div className={`text-[10px] font-black mb-1 flex items-center gap-2 ${activeStep === idx ? 'text-indigo-200' : 'text-slate-500'}`}>
                                Step {idx + 1}
                                {activeStep === idx && <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
                            </div>
                            <div className="font-bold text-sm leading-tight mb-1">{step.title}</div>
                            <div className={`text-[10px] leading-snug line-clamp-2 ${activeStep === idx ? 'text-indigo-100' : 'text-slate-600'}`}>
                                {step.desc}
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Exploration Section */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                {/* Left Column: Learn Content */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="flex p-1 bg-slate-900 rounded-2xl border border-slate-800 sticky top-4 z-40">
                        {[
                            { id: 'pValue', label: 'P-Values', icon: Activity },
                            { id: 'confidence', label: 'CIs', icon: ShieldCheck },
                            { id: 'power', label: 'Power', icon: Target }
                        ].map(tab => (
                            <TabButton
                                key={tab.id}
                                active={activeTab === tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                label={tab.label}
                                icon={tab.icon}
                                darkMode={true}
                            />
                        ))}
                    </div>

                    <div className="animate-in fade-in slide-in-from-left-4 duration-500 space-y-6">
                        {activeTab === 'pValue' && (
                            <>
                                <div className="space-y-2">
                                    <h3 className="text-xl font-black text-indigo-400 uppercase tracking-tight">The P-Value Definition</h3>
                                    <div className={`p-4 rounded-2xl font-mono text-xs leading-relaxed border ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                                        "The probability of observing data as extreme or more extreme than ours, <span className="text-indigo-500 font-bold underline italic">assuming</span> H₀ is true."
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-red-400">
                                        <Ban size={14} /> The 3 "Don'ts"
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex items-start gap-3">
                                            <div className="bg-red-500/10 p-1 rounded text-red-500 font-black text-[10px]">01</div>
                                            <p className="text-sm">It's <strong>not</strong> the probability H₀ is true (though we wish it was).</p>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <div className="bg-red-500/10 p-1 rounded text-red-500 font-black text-[10px]">02</div>
                                            <p className="text-sm">It <strong>doesn't</strong> measure the size of the effect (magnitude).</p>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <div className="bg-red-500/10 p-1 rounded text-red-500 font-black text-[10px]">03</div>
                                            <p className="text-sm">It <strong>doesn't</strong> prove that a result will replicate.</p>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}

                        {activeTab === 'confidence' && (
                            <>
                                <div className="space-y-2">
                                    <h3 className="text-xl font-black text-emerald-500 uppercase tracking-tight">Confidence Intervals</h3>
                                    <div className={`p-4 rounded-2xl font-mono text-xs leading-relaxed border ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-emerald-50/10 border-emerald-500/10'}`}>
                                        "If we sampled the population 100 times, 95 of those intervals would capture the true parameter."
                                    </div>
                                </div>
                                <div className="bg-slate-900/50 p-6 rounded-3xl border border-slate-800 space-y-4">
                                    <h4 className="text-xs font-black uppercase tracking-widest flex items-center gap-2 text-emerald-400"><HelpCircle size={14} /> How to read it</h4>
                                    <ul className="text-sm space-y-3">
                                        <li className="flex gap-2 items-start"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5" /> <span>Does it include the null value (usually 0 or 1)?</span></li>
                                        <li className="flex gap-2 items-start"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5" /> <span>How wide is it? Wider = Less precise.</span></li>
                                        <li className="flex gap-2 items-start"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5" /> <span>Is the point estimate near the center?</span></li>
                                    </ul>
                                </div>
                            </>
                        )}

                        {activeTab === 'power' && (
                            <>
                                <div className="space-y-4">
                                    <h3 className="text-xl font-black text-amber-500 uppercase tracking-tight">Decisions & Errors</h3>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="p-3 bg-red-500/10 rounded-2xl border border-red-500/20">
                                            <div className="text-[9px] font-black text-red-500 uppercase mb-1">Type I (α)</div>
                                            <div className="font-bold text-xs uppercase mb-1 leading-none">False Positive</div>
                                            <p className="text-[10px] opacity-70">Convicting an innocent person.</p>
                                        </div>
                                        <div className="p-3 bg-orange-500/10 rounded-2xl border border-orange-500/20">
                                            <div className="text-[9px] font-black text-orange-500 uppercase mb-1">Type II (β)</div>
                                            <div className="font-bold text-xs uppercase mb-1 leading-none">False Negative</div>
                                            <p className="text-[10px] opacity-70">Letting a guilty person go free.</p>
                                        </div>
                                    </div>
                                    <div className="bg-emerald-500/5 p-4 rounded-2xl border border-emerald-500/10">
                                        <div className="text-[10px] font-black text-emerald-500 uppercase mb-1">Statistical Power (1-β)</div>
                                        <p className="text-sm">The ability to detect an effect <span className="font-bold italic underline">if it actually exists</span>.</p>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Right Column: Visual Widgets */}
                <div className="lg:col-span-8 flex flex-col gap-8">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">
                        <MousePointer2 size={14} /> Interactive Visualizer
                    </div>

                    <div className="bg-slate-950/20 border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl relative transition-all duration-700">
                        {activeTab === 'pValue' && <PValueWidget darkMode={darkMode} />}
                        {activeTab === 'confidence' && <CIWidget darkMode={darkMode} />}
                        {activeTab === 'power' && <PowerWidget darkMode={darkMode} />}
                    </div>

                    {/* Examples & Reporting */}
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-[10px] font-black uppercase text-indigo-400 tracking-widest">
                                <Calculator size={14} /> Mini Examples
                            </div>
                            <div className="space-y-3">
                                <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                                    <div className="text-[9px] font-black uppercase text-slate-500 mb-1">Means Comparison</div>
                                    <div className="text-sm font-bold">Difference = 4.2 units</div>
                                    <div className="text-xs italic text-slate-400">95% CI [0.8, 7.6] • p = .012</div>
                                    <div className="mt-2 text-[10px] font-black text-emerald-500 uppercase">Significant (Excludes 0)</div>
                                </div>
                                <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                                    <div className="text-[9px] font-black uppercase text-slate-500 mb-1">Correlation</div>
                                    <div className="text-sm font-bold">Slope = 0.15</div>
                                    <div className="text-xs italic text-slate-400">95% CI [-0.02, 0.32] • p = .08</div>
                                    <div className="mt-2 text-[10px] font-black text-slate-500 uppercase">Non-Significant (Includes 0)</div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-[10px] font-black uppercase text-amber-500 tracking-widest">
                                <Clipboard size={14} /> Report it like this
                            </div>
                            <div className={`p-6 rounded-2xl border bg-slate-950 border-slate-800 relative group`}>
                                <div className="text-xs font-mono text-slate-300 leading-relaxed italic">
                                    "We found a significant difference in means, t(28) = 2.45, p = .021, d = 0.45. The 95% confidence interval [0.85, 4.20] did not include the null value of 0."
                                </div>
                                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button className="text-slate-600 hover:text-indigo-400 transition-colors uppercase text-[8px] font-black tracking-widest">Copy Tag</button>
                                </div>
                            </div>
                            <div className="text-[10px] text-slate-500 italic px-2">
                                💡 Always report effect size (d) and CI, not just p-values.
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer Mistake Grid */}
            <div className="pt-8 border-t border-slate-800/10 space-y-4">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-red-400">
                    <AlertCircle size={14} /> Common Misconceptions
                </div>
                <div className="grid md:grid-cols-3 gap-6">
                    {mistakes.map((m, i) => (
                        <div key={i} className="space-y-2">
                            <h5 className="font-bold text-sm text-slate-300 flex items-center gap-2">
                                <BrainCircuit size={14} className="text-red-400/50" /> {m.title}
                            </h5>
                            <p className="text-xs text-slate-500 leading-relaxed">{m.text}</p>
                        </div>
                    ))}
                </div>
            </div>

        </div>
    );
};

export default NhstVisual;
