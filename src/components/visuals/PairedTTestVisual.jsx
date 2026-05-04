import React, { useState, useEffect, useMemo, useRef } from 'react';
import { AlertCircle, Sparkles, Calculator, MousePointer2, Info, ArrowDown, MousePointerClick, Maximize2, Minimize2, RefreshCw, Play, ChevronsRight, ChevronUp, ChevronDown, Activity, Lightbulb, BrainCircuit, BarChart2, Sigma, BookOpen, Plus, X, Trash2, Edit2, TrendingUp, Grid, FileText, PieChart } from 'lucide-react';
import { getGaussianPoints, getTPoints, normalCDF, tCDF, erf, getTCrit, getFDensity, fCDF, fPPF, getFCrit, getFPoints, calculateAnova, calculatePostHoc, lnGamma, beta } from '../../utils/mathHelpers';
import { pointsToPath, pointsToLine, getOrdinal } from '../../utils/svgHelpers';
import useTutor from '../../hooks/useTutor';
import TutorPanel from '../tutor/TutorPanel';
import CalculationText from '../common/CalculationText';
import TabButton from '../common/TabButton';
const PairedTTestVisual = ({ highlight = null, darkMode, onTutorUpdate, onStatsUpdate, datasetSeed = null, mode = 'lessons' }) => {
  const [group1, setGroup1] = useState({ name: "Condition 1", raw: "12, 14, 11, 15, 13, 16, 14, 12, 15, 14" });
  const [group2, setGroup2] = useState({ name: "Condition 2", raw: "10, 11, 12, 11, 10, 13, 12, 11, 11, 12" });
  const [summaryData, setSummaryData] = useState({ mean1: 14.0, sd1: 1.6, mean2: 11.3, sd2: 1.1, n: 10, r: 0.8 });
  const [inputMode, setInputMode] = useState(mode === 'calculator' ? 'raw' : 'summary');
  const [alpha, setAlpha] = useState(0.05);
  const [tails, setTails] = useState(2);
  const [h1Direction, setH1Direction] = useState('greater');
  const [displayMode, setDisplayMode] = useState('sampling'); // 'sampling', 'difference', 'paired'
  const [showCI] = useState(true);
  const [ciType, setCiType] = useState('two-sided');
  const allowRawInput = mode === 'calculator';

  useEffect(() => {
    if (!allowRawInput && inputMode === 'raw') {
      setInputMode('summary');
    }
  }, [allowRawInput, inputMode]);

  useEffect(() => {
    if (!datasetSeed?.key) {
      return;
    }

    setInputMode('raw');
    setGroup1((previous) => ({
      ...previous,
      name: datasetSeed.group1?.label || previous.name,
      raw: datasetSeed.group1?.raw || previous.raw,
    }));
    setGroup2((previous) => ({
      ...previous,
      name: datasetSeed.group2?.label || previous.name,
      raw: datasetSeed.group2?.raw || previous.raw,
    }));
  }, [datasetSeed?.key]);

  const stats = useMemo(() => {
    let n1 = 0, n2 = 0, dBar = 0, sd = 0, r = 0, n = 0;
    let mean1 = summaryData.mean1, mean2 = summaryData.mean2;
    let sd1 = summaryData.sd1, sd2 = summaryData.sd2;
    let diffs = [];
    let raw1 = [], raw2 = [];

    if (inputMode === 'raw') {
      raw1 = group1.raw.replace(/,/g, ' ').split(/\s+/).map(v => parseFloat(v)).filter(v => !isNaN(v));
      raw2 = group2.raw.replace(/,/g, ' ').split(/\s+/).map(v => parseFloat(v)).filter(v => !isNaN(v));
      n1 = raw1.length; n2 = raw2.length;
      n = Math.min(n1, n2);
      if (n >= 1) {
        const d = [];
        for (let i = 0; i < n; i++) d.push(raw1[i] - raw2[i]);
        diffs = d;
        dBar = d.reduce((a, b) => a + b, 0) / n;
        sd = n > 1 ? Math.sqrt(d.reduce((a, b) => a + Math.pow(b - dBar, 2), 0) / (n - 1)) : 0;
        mean1 = raw1.slice(0, n).reduce((a, b) => a + b, 0) / n;
        mean2 = raw2.slice(0, n).reduce((a, b) => a + b, 0) / n;
        sd1 = n > 1 ? Math.sqrt(raw1.slice(0, n).reduce((acc, v) => acc + Math.pow(v - mean1, 2), 0) / (n - 1)) : 0;
        sd2 = n > 1 ? Math.sqrt(raw2.slice(0, n).reduce((acc, v) => acc + Math.pow(v - mean2, 2), 0) / (n - 1)) : 0;
        const num = raw1.slice(0, n).reduce((acc, v, i) => acc + (v - mean1) * (raw2[i] - mean2), 0);
        const den = Math.sqrt(raw1.slice(0, n).reduce((acc, v) => acc + Math.pow(v - mean1, 2), 0) * raw2.slice(0, n).reduce((acc, v) => acc + Math.pow(v - mean2, 2), 0));
        r = den === 0 ? 0 : num / den;
      }
    } else {
      n = summaryData.n;
      n1 = n; n2 = n;
      dBar = summaryData.mean1 - summaryData.mean2;
      // Derive sd of differences from individual SDs and correlation:
      // sd_diff = sqrt(sd1^2 + sd2^2 - 2*r*sd1*sd2)
      const s1 = summaryData.sd1, s2 = summaryData.sd2, rVal = summaryData.r || 0;
      sd = Math.sqrt(Math.max(0, s1 * s1 + s2 * s2 - 2 * rVal * s1 * s2));
      r = rVal;
    }

    const se = sd / Math.sqrt(n);
    const tScore = se === 0 ? 0 : dBar / se;
    const df = n - 1;
    const pValue = df > 0 ? (tails === 2 ? (1 - tCDF(Math.abs(tScore), df)) * 2 : (h1Direction === 'greater' ? (1 - tCDF(tScore, df)) : tCDF(tScore, df))) : 1;
    const dz = sd === 0 ? 0 : dBar / sd;
    const tCrit = df > 0 ? getTCrit(alpha, df, tails) : 2.0;

    let ciLower, ciUpper;
    const ciBound = 1.96 * se; // Simplified for visual
    ciLower = ciType === 'two-sided' ? dBar - ciBound : (h1Direction === 'greater' ? dBar - ciBound : -Infinity);
    ciUpper = ciType === 'two-sided' ? dBar + ciBound : (h1Direction === 'greater' ? Infinity : dBar + ciBound);

    return {
      n, n1, n2, mean1, mean2, sd1, sd2, dBar, sd, se, t: tScore, df, p: pValue, r, dz,
      isSignificant: pValue < alpha, tCrit, diffs, raw1, raw2,
      ciLower, ciUpper, ciType, alpha, tails, h1Direction
    };
  }, [group1, group2, summaryData, inputMode, alpha, tails, h1Direction, ciType]);

  useEffect(() => {
    if (onStatsUpdate) onStatsUpdate(stats);
  }, [stats, onStatsUpdate]);

  const tutor = useTutor('t_test_paired', stats);
  useEffect(() => { if (onTutorUpdate && tutor.activeScript) onTutorUpdate(tutor.activeScript); }, [tutor.activeScript, onTutorUpdate]);

  const handleSwap = () => {
    if (inputMode === 'raw') {
      const t = group1.raw;
      setGroup1({ ...group1, raw: group2.raw });
      setGroup2({ ...group2, raw: t });
    } else {
      setSummaryData(prev => ({ ...prev, mean1: prev.mean2, sd1: prev.sd2, mean2: prev.mean1, sd2: prev.sd1 }));
    }
  };

  return (
    <div className="w-full flex">
      <div className="flex-1 flex flex-col items-center">
        <div className={`w-full h-72 sticky top-4 z-20 flex items-end justify-center select-none border overflow-hidden px-4 transition-colors ${darkMode ? 'bg-slate-950 border-slate-800 shadow-inner' : 'bg-white rounded-t-lg border-slate-100 shadow-inner'}`}>
          <div className="absolute top-4 left-4 flex gap-2 z-10">
            {['sampling', 'difference', 'paired'].map(m => (
              <button key={m} onClick={() => setDisplayMode(m)} className={`px-2 py-1 rounded text-[8px] font-black uppercase tracking-widest border transition-all ${displayMode === m ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg' : 'bg-slate-800 border-slate-700 text-slate-500 hover:text-white'}`}>{m}</button>
            ))}
          </div>

          <svg viewBox="-20 0 340 200" className="w-full h-full overflow-visible">
            <text x="150" y="192" textAnchor="middle" className={`text-[7px] font-bold uppercase transition-colors ${darkMode ? 'fill-slate-600' : 'fill-slate-400'}`}>{displayMode === 'sampling' ? "Sampling Distribution of t (H₀)" : (displayMode === 'difference' ? "Distribution of Difference Scores" : "Paired Observations Flow")}</text>

            {displayMode === 'sampling' && (() => {
              const tPoints = getTPoints(150, 35, stats.df, 140, 300).map(p => [p[0] - 150, p[1] - 150]);
              const tPath = `M ${tPoints[0][0]},0 L ` + tPoints.map(p => `${p[0]},${p[1]}`).join(' L ') + ` L ${tPoints[tPoints.length - 1][0]},0 Z`;
              const tCritX = stats.tCrit * 35;

              const leftRejectPoints = tPoints.filter(p => p[0] <= -tCritX);
              const rightRejectPoints = tPoints.filter(p => p[0] >= tCritX);

              const leftPath = leftRejectPoints.length > 1 ? `M ${leftRejectPoints[0][0]},0 L ` + leftRejectPoints.map(p => `${p[0]},${p[1]}`).join(' L ') + ` L ${leftRejectPoints[leftRejectPoints.length - 1][0]},0 Z` : "";
              const rightPath = rightRejectPoints.length > 1 ? `M ${rightRejectPoints[0][0]},0 L ` + rightRejectPoints.map(p => `${p[0]},${p[1]}`).join(' L ') + ` L ${rightRejectPoints[rightRejectPoints.length - 1][0]},0 Z` : "";

              return (
                <g transform="translate(150, 160)">
                  {/* Rejection Shading */}
                  {(stats.tails === 2 || stats.h1Direction === 'less') && <path d={leftPath} fill="#ef4444" opacity="0.15" className="animate-pulse" />}
                  {(stats.tails === 2 || stats.h1Direction === 'greater') && <path d={rightPath} fill="#ef4444" opacity="0.15" className="animate-pulse" />}

                  {/* Distribution Curve */}
                  <path d={tPath} fill="none" stroke={darkMode ? "#6366f1" : "#4f46e5"} strokeWidth="2" />
                  <path d={tPath} fill="url(#pairedGradient)" opacity="0.5" />

                  {/* Axis */}
                  <line x1="-150" y1="0" x2="150" y2="0" stroke={darkMode ? "#334155" : "#94a3b8"} strokeWidth="2" />
                  {[-3, -2, -1, 0, 1, 2, 3].map(z => (
                    <g key={z} transform={`translate(${z * 35}, 0)`}>
                      <line y2="5" stroke={darkMode ? "#334155" : "#e2e8f0"} />
                      <text y="12" textAnchor="middle" className="text-[6px] fill-slate-500 font-mono">{z}</text>
                    </g>
                  ))}

                  {/* Critical Value Lines */}
                  {(stats.tails === 2 || stats.h1Direction === 'greater') && (
                    <>
                      <line x1={tCritX} y1="0" x2={tCritX} y2="-120" stroke="#ef4444" strokeWidth="1" strokeDasharray="3,3" />
                      <text x={tCritX} y="-124" textAnchor="middle" className="text-[7px] font-bold fill-rose-400">+tcrit</text>
                    </>
                  )}
                  {(stats.tails === 2 || stats.h1Direction === 'less') && (
                    <>
                      <line x1={-tCritX} y1="0" x2={-tCritX} y2="-120" stroke="#ef4444" strokeWidth="1" strokeDasharray="3,3" />
                      <text x={-tCritX} y="-124" textAnchor="middle" className="text-[7px] font-bold fill-rose-400">-tcrit</text>
                    </>
                  )}

                  {/* Observed t marker */}
                  <g className="marker-group transform transition-transform duration-500" style={{ transform: `translateX(${Math.max(-145, Math.min(145, stats.t * 35))}px)` }}>
                    <line x1="0" y1="-120" x2="0" y2="0" stroke="#6366f1" strokeWidth="2" strokeDasharray="4" />
                    <circle cx="0" cy="0" r="4" fill="#6366f1" stroke="white" strokeWidth="1" />
                    <g transform="translate(0, -135)">
                      <rect x="-20" y="-8" width="40" height="16" rx="4" fill={darkMode ? "#1e1b4b" : "white"} stroke="#6366f1" strokeWidth="1" />
                      <text textAnchor="middle" dy="2" className="text-[9px] font-black fill-indigo-500">t = {stats.t.toFixed(2)}</text>
                    </g>
                    <g transform="translate(0, 10)">
                      <rect x="-23" y="-8" width="46" height="16" rx="6" fill={darkMode ? 'rgba(15,23,42,0.82)' : 'rgba(255,255,255,0.92)'} stroke="#818cf8" strokeWidth="1" />
                      <text textAnchor="middle" dy="2" className="text-[7px] font-bold fill-indigo-300">d̄ = {stats.dBar.toFixed(2)}</text>
                    </g>
                  </g>
                  <text x="0" y="22" textAnchor="middle" className={`text-[6px] font-bold uppercase ${darkMode ? 'fill-slate-600' : 'fill-slate-400'}`}>t-score Units (df = {stats.df})</text>
                </g>
              );
            })()}
            {displayMode === 'difference' && (
              <g transform="translate(30, 20)">
                <line x1="120" y1="0" x2="120" y2="130" stroke={darkMode ? "#475569" : "#cbd5e1"} strokeWidth="1" strokeDasharray="2,2" />
                <text x="120" y="-5" textAnchor="middle" className="text-[7px] fill-slate-500 font-bold uppercase">Zero Change</text>
                {stats.diffs.map((d, i) => (
                  <circle key={i} cx={(d / (stats.sd || 1)) * 30 + 120} cy={120 - (i * 5)} r="3" fill="#818cf8" opacity="0.6" />
                ))}
                <line x1={(stats.dBar / (stats.sd || 1)) * 30 + 120} y1="0" x2={(stats.dBar / (stats.sd || 1)) * 30 + 120} y2="130" stroke="#6366f1" strokeWidth="2" />
                <text x={(stats.dBar / (stats.sd || 1)) * 30 + 120} y="145" textAnchor="middle" className="text-[10px] font-black fill-indigo-500">d̄ = {stats.dBar.toFixed(2)}</text>
                {/* Axis Labels */}
                <text x="120" y="160" textAnchor="middle" className={`text-[8px] font-bold uppercase ${darkMode ? 'fill-slate-500' : 'fill-slate-500'}`}>Difference Score (X₁ - X₂)</text>
                <text transform="translate(-10, 65) rotate(-90)" textAnchor="middle" className={`text-[8px] font-bold uppercase ${darkMode ? 'fill-slate-500' : 'fill-slate-500'}`}>Paired Case</text>
              </g>
            )}
            {displayMode === 'paired' && (
              <g transform="translate(50, 20)">
                <line x1="50" y1="10" x2="50" y2="120" stroke={darkMode ? "#334155" : "#e2e8f0"} strokeWidth="2" />
                <line x1="200" y1="10" x2="200" y2="120" stroke={darkMode ? "#334155" : "#e2e8f0"} strokeWidth="2" />
                <text x="50" y="135" textAnchor="middle" className="text-[7px] font-bold fill-slate-500 uppercase">Cond. 1</text>
                <text x="200" y="135" textAnchor="middle" className="text-[7px] font-bold fill-slate-500 uppercase">Cond. 2</text>
                {stats.raw1.map((v1, i) => (
                  <g key={i}>
                    <circle cx="50" cy={120 - (v1 * 4)} r="3" fill="#6366f1" />
                    <circle cx="200" cy={120 - (stats.raw2[i] * 4)} r="3" fill="#10b981" />
                    <line x1="50" y1={120 - (v1 * 4)} x2="200" y2={120 - (stats.raw2[i] * 4)} stroke={darkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"} />
                  </g>
                ))}
                {/* Axis Labels */}
                <text transform="translate(30, 65) rotate(-90)" textAnchor="middle" className={`text-[6px] font-bold uppercase ${darkMode ? 'fill-slate-600' : 'fill-slate-400'}`}>Score Value</text>
              </g>
            )}
          </svg>

          <div className="absolute top-2 right-2 flex flex-col gap-1 items-end z-20">
            <div className={`px-3 py-1.5 rounded-xl border-2 flex flex-col items-center min-w-[110px] shadow-lg transition-all ${stats.isSignificant ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-500' : 'bg-slate-500/10 border-slate-500/40 text-slate-400'}`}>
              <span className="text-[8px] font-black uppercase tracking-[0.2em] mb-0.5">{stats.isSignificant ? 'Significant' : 'Not Significant'}</span>
              <span className={`text-xs font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>p = {stats.p < 0.001 ? '< .001' : stats.p.toFixed(3).replace(/^0/, '')}</span>
            </div>
            {displayMode === 'sampling' && (
              <div className={`px-2 py-0.5 rounded-lg border text-[7px] font-bold ${darkMode ? 'bg-slate-900/80 border-slate-700 text-slate-400' : 'bg-white/80 border-slate-200 text-slate-500 font-mono shadow-sm'}`}>
                Critical t = ±{stats.tCrit.toFixed(2)}
              </div>
            )}
          </div>
        </div>

        <div className={`w-full p-6 space-y-8 transition-colors ${darkMode ? 'bg-slate-900 shadow-inner' : 'bg-slate-50'}`}>
          <div className="grid md:grid-cols-2 gap-6">
            <div className={`p-4 rounded-xl border-2 transition-all ${darkMode ? 'bg-slate-950/50 border-slate-800' : 'bg-white border-slate-200'}`}>
              <div className="flex justify-between items-center mb-4">
                <h5 className="text-[10px] font-black uppercase text-indigo-400 flex items-center gap-2 pt-1"><div className="w-2 h-2 rounded-full bg-indigo-500"></div> Condition 1</h5>
                {allowRawInput && (
                  <button onClick={() => setInputMode(inputMode === 'summary' ? 'raw' : 'summary')} className="text-[8px] font-black text-slate-500 hover:text-indigo-400 underline uppercase tracking-widest">{inputMode === 'summary' ? 'Paste Data' : 'Use Summary Stats'}</button>
                )}
              </div>
              {inputMode === 'summary' || !allowRawInput ? (
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-[8px] font-bold text-slate-500 uppercase">Mean (͸1)</label>
                    <input type="number" step="0.1" value={summaryData.mean1} onChange={e => setSummaryData({ ...summaryData, mean1: parseFloat(e.target.value) || 0 })} className={`p-2 rounded text-sm font-bold border transition-colors ${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[8px] font-bold text-slate-500 uppercase">SD (s₁)</label>
                    <input type="number" step="0.1" min="0.01" value={summaryData.sd1} onChange={e => setSummaryData({ ...summaryData, sd1: Math.max(0.01, parseFloat(e.target.value) || 0.01) })} className={`p-2 rounded text-sm font-bold border transition-colors ${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`} />
                  </div>
                </div>
              ) : (
                <textarea placeholder="Paste Condition 1 values..." value={group1.raw} onChange={e => setGroup1({ ...group1, raw: e.target.value })} className={`w-full h-16 p-2 rounded text-[10px] font-mono border transition-colors ${darkMode ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'}`} />
              )}
            </div>
            <div className={`p-4 rounded-xl border-2 transition-all ${darkMode ? 'bg-slate-950/50 border-slate-800' : 'bg-white border-slate-200'}`}>
              <div className="flex justify-between items-center mb-4">
                <h5 className="text-[10px] font-black uppercase text-emerald-400 flex items-center gap-2 pt-1"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Condition 2</h5>
                <button onClick={handleSwap} className="text-[8px] font-black text-slate-500 hover:text-indigo-400 flex items-center gap-1 uppercase tracking-widest pt-1"><RefreshCw size={10} /> Swap Conditions</button>
              </div>
              {inputMode === 'summary' || !allowRawInput ? (
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-[8px] font-bold text-slate-500 uppercase">Mean (͸2)</label>
                    <input type="number" step="0.1" value={summaryData.mean2} onChange={e => setSummaryData({ ...summaryData, mean2: parseFloat(e.target.value) || 0 })} className={`p-2 rounded text-sm font-bold border transition-colors ${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[8px] font-bold text-slate-500 uppercase">SD (s₂)</label>
                    <input type="number" step="0.1" min="0.01" value={summaryData.sd2} onChange={e => setSummaryData({ ...summaryData, sd2: Math.max(0.01, parseFloat(e.target.value) || 0.01) })} className={`p-2 rounded text-sm font-bold border transition-colors ${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`} />
                  </div>
                </div>
              ) : (
                <textarea placeholder="Paste Condition 2 values..." value={group2.raw} onChange={e => setGroup2({ ...group2, raw: e.target.value })} className={`w-full h-16 p-2 rounded text-[10px] font-mono border transition-colors ${darkMode ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'}`} />
              )}
            </div>
          </div>
          {inputMode === 'summary' && (
            <div className="grid grid-cols-2 gap-4">
              <div className={`p-3 rounded-xl border transition-all ${darkMode ? 'bg-slate-950/50 border-slate-800' : 'bg-white border-slate-200'}`}>
                <div className="flex flex-col gap-1">
                  <label className="text-[8px] font-bold text-slate-500 uppercase">Number of Pairs (n)</label>
                  <input type="number" step="1" min="1" value={summaryData.n} onChange={e => setSummaryData({ ...summaryData, n: Math.max(1, parseInt(e.target.value) || 1) })} className={`p-2 rounded text-sm font-bold border transition-colors ${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`} />
                </div>
              </div>
              <div className={`p-3 rounded-xl border transition-all ${darkMode ? 'bg-slate-950/50 border-slate-800' : 'bg-white border-slate-200'}`}>
                <div className="flex flex-col gap-1">
                  <label className="text-[8px] font-bold text-slate-500 uppercase">Correlation (r)</label>
                  <input type="number" step="0.05" min="-1" max="1" value={summaryData.r} onChange={e => setSummaryData({ ...summaryData, r: Math.max(-1, Math.min(1, parseFloat(e.target.value) || 0)) })} className={`p-2 rounded text-sm font-bold border transition-colors ${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`} />
                  <span className={`text-[7px] italic ${darkMode ? 'text-slate-600' : 'text-slate-400'}`}>Used to derive s<sub>d</sub> = √(s₁² + s₂² - 2r·s₁·s₂)</span>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest px-1">Significance Level (α)</span>
              <select value={alpha} onChange={e => setAlpha(parseFloat(e.target.value))} className={`p-2 rounded text-xs font-bold border transition-colors ${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
                <option value={0.01}>0.01 (Conservative)</option>
                <option value={0.05}>0.05 (Standard)</option>
                <option value={0.10}>0.10 (Exploratory)</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest px-1">Tails</span>
              <div className={`p-1 rounded flex transition-colors ${darkMode ? 'bg-slate-950' : 'bg-white border'}`}>
                <button onClick={() => setTails(2)} className={`flex-1 py-1 text-[10px] font-bold rounded ${tails === 2 ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}>Two</button>
                <button onClick={() => setTails(1)} className={`flex-1 py-1 text-[10px] font-bold rounded ${tails === 1 ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}>One</button>
              </div>
            </div>
            {tails === 1 && (
              <div className="flex flex-col gap-1 animate-in slide-in-from-left-2 duration-300">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest px-1">Direction ($H_1$)</span>
                <div className={`p-1 rounded flex transition-colors ${darkMode ? 'bg-slate-950' : 'bg-white border'}`}>
                  <button onClick={() => setH1Direction('less')} className={`flex-1 py-1 text-[10px] font-bold rounded ${h1Direction === 'less' ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}>{"C1 < C2"}</button>
                  <button onClick={() => setH1Direction('greater')} className={`flex-1 py-1 text-[10px] font-bold rounded ${h1Direction === 'greater' ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}>{"C1 > C2"}</button>
                </div>
              </div>
            )}
            <div className="flex flex-col gap-1">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest px-1">Reporting CI</span>
              <div className="flex items-center gap-2">
                <div className={`flex-1 py-2 px-3 text-[10px] font-black rounded border uppercase tracking-widest ${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
                  {ciType === 'two-sided' ? 'Two-Sided CI' : 'One-Sided Bound'}
                </div>
                <select value={ciType} onChange={e => setCiType(e.target.value)} className={`p-2 rounded text-[8px] font-black border uppercase transition-colors ${darkMode ? 'bg-slate-950 border-slate-700 text-indigo-400' : 'bg-white border-slate-200 text-indigo-600'}`}>
                  <option value="two-sided">Two-Sided</option>
                  <option value="one-sided">One-Sided</option>
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4">
            <div className={`p-4 rounded-xl border flex flex-col items-center justify-center transition-colors ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-white shadow-sm'}`}>
              <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Test Stats</span>
              <div className="flex items-baseline gap-2">
                <span className={`text-xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>{stats.t.toFixed(3)}</span>
                <span className="text-[8px] font-bold text-slate-500 uppercase">t({stats.df.toFixed(0)})</span>
              </div>
              <span className="text-[8px] font-bold text-slate-600 mt-1 uppercase leading-none">SE_d̄ = {stats.se.toFixed(3)}</span>
            </div>
            <div className={`p-4 rounded-xl border flex flex-col items-center justify-center transition-colors ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-white shadow-sm'}`}>
              <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Effect Sizes</span>
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <span className={`text-sm font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>{stats.dz.toFixed(3)}</span>
                  <span className="text-[7px] font-bold text-slate-600 uppercase">Cohen's d_z</span>
                </div>
                {inputMode === 'raw' && allowRawInput && (
                  <div className="flex flex-col items-center group relative cursor-help">
                    <span className={`text-sm font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>{stats.r.toFixed(3)}</span>
                    <span className="text-[7px] font-bold text-slate-600 uppercase border-b border-dotted border-slate-400">Correlation (r)</span>
                    <div className={`absolute bottom-full mb-2 w-48 p-2 rounded bg-slate-800 text-white text-[9px] leading-tight opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none`}>
                      A higher correlation between pairs reduces the $s_d$, which increases your test's power to find a difference.
                    </div>
                  </div>
                )}
              </div>
              <span className="text-[8px] font-bold text-indigo-500 mt-1 uppercase tracking-tighter">
                {Math.abs(stats.dz) < 0.2 ? 'Negligible' : Math.abs(stats.dz) < 0.5 ? 'Small' : Math.abs(stats.dz) < 0.8 ? 'Medium' : 'Large'} Effect
              </span>
            </div>
            <div className={`p-4 rounded-xl border flex flex-col justify-center transition-colors ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-white shadow-sm'}`}>
              <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-2">Condition Summaries</span>
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[8px] font-bold text-indigo-400 uppercase">C1</span>
                  <span className={`text-sm font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>M = {stats.mean1.toFixed(2)}, SD = {stats.sd1.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[8px] font-bold text-emerald-400 uppercase">C2</span>
                  <span className={`text-sm font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>M = {stats.mean2.toFixed(2)}, SD = {stats.sd2.toFixed(2)}</span>
                </div>
              </div>
            </div>
            <div className={`p-4 rounded-xl border flex flex-col items-center justify-center relative overflow-hidden transition-colors ${showCI ? (darkMode ? 'bg-indigo-950/20 border-indigo-500/30' : 'bg-indigo-50 border-indigo-100') : (darkMode ? 'bg-slate-950 border-slate-800 opacity-50' : 'bg-white opacity-50')}`}>
              <span className="text-[8px] font-black text-indigo-500 uppercase tracking-widest mb-1">{(1 - alpha) * 100}% Confidence Interval</span>
              {showCI ? (
                <div className="text-sm font-black font-mono tracking-tighter text-indigo-600">
                  {ciType === 'two-sided' ? `[${stats.ciLower.toFixed(2)}, ${stats.ciUpper.toFixed(2)}]` : (h1Direction === 'greater' ? `> ${stats.ciLower.toFixed(2)}` : `< ${stats.ciUpper.toFixed(2)}`)}
                </div>
              ) : <div className="text-[9px] font-bold text-slate-500 uppercase">Hidden</div>}
            </div>
          </div>

          <div className={`rounded-xl border p-3 flex flex-col md:flex-row justify-between items-center gap-4 group transition-colors ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
            <div className={`text-[10px] font-mono break-all leading-relaxed max-w-[85%] ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              <span className="text-indigo-500 font-bold tracking-widest mr-2 uppercase text-[7px]">Report Line</span>
              Paired samples t-test, t({stats.df.toFixed(0)}) = {stats.t.toFixed(2)}, p = {stats.p < 0.001 ? '< .001' : stats.p.toFixed(3).replace(/^0/, '')}, d_z = {stats.dz.toFixed(2)}{showCI ? `, 95% CI [${stats.ciLower.toFixed(2)}, ${stats.ciUpper.toFixed(2)}]` : ''}.
            </div>
            <button
              onClick={() => {
                const line = `Paired samples t-test, t(${stats.df.toFixed(0)}) = ${stats.t.toFixed(2)}, p = ${stats.p < 0.001 ? '< .001' : stats.p.toFixed(3).replace(/^0/, '')}, dz = ${stats.dz.toFixed(2)}${showCI ? `, 95% CI [${stats.ciLower.toFixed(2)}, ${stats.ciUpper.toFixed(2)}]` : ''}.`;
                navigator.clipboard.writeText(line);
                const btn = document.activeElement;
                if (btn) { btn.innerText = "COPIED!"; setTimeout(() => btn.innerText = "COPY APA", 2000); }
              }}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-[8px] font-black uppercase tracking-widest rounded-lg transition-all shadow-lg active:scale-95 whitespace-nowrap"
            >
              COPY APA
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// D. ANOVA Visual

export default PairedTTestVisual;
