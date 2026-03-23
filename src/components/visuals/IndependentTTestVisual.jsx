import React, { useState, useEffect, useMemo, useRef } from 'react';
import { AlertCircle, Sparkles, Calculator, MousePointer2, Info, ArrowDown, MousePointerClick, Maximize2, Minimize2, RefreshCw, Play, ChevronsRight, ChevronUp, ChevronDown, Activity, Lightbulb, BrainCircuit, BarChart2, Sigma, BookOpen, Plus, X, Trash2, Edit2, TrendingUp, Grid, FileText, PieChart, Palette, Settings2 } from 'lucide-react';
import { getGaussianPoints, getTPoints, normalCDF, tCDF, erf, getTCrit, getFDensity, fCDF, fPPF, getFCrit, getFPoints, calculateAnova, calculatePostHoc, lnGamma, beta } from '../../utils/mathHelpers';
import { pointsToPath, pointsToLine, getOrdinal } from '../../utils/svgHelpers';
import useTutor from '../../hooks/useTutor';
import TutorPanel from '../tutor/TutorPanel';
import CalculationText from '../common/CalculationText';
import TabButton from '../common/TabButton';
import IndependentTTestPlots from './IndependentTTestPlots';
const IndependentTTestVisual = ({ highlight = null, darkMode, onTutorUpdate, onStatsUpdate, datasetSeed = null }) => {
  const [group1, setGroup1] = useState({ xBar: 12, s: 2.5, n: 30, raw: "" });
  const [group2, setGroup2] = useState({ xBar: 10, s: 2.5, n: 30, raw: "" });
  const [testType, setTestType] = useState('student'); // 'student' (pooled) or 'welch'
  const [inputMode, setInputMode] = useState('summary'); // 'summary' or 'raw'
  const [alpha, setAlpha] = useState(0.05);
  const [tails, setTails] = useState(2);
  const [h1Direction, setH1Direction] = useState('greater');
  const [ciType, setCiType] = useState('two-sided');
  const [visualMode, setVisualMode] = useState('p-value');
  const [targetEffect, setTargetEffect] = useState(0.5);
  const [precision, setPrecision] = useState(2);
  const [showCI, setShowCI] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [displayVisual, setDisplayVisual] = useState('sampling'); // 'sampling', 'distribution', or 'plots'
  const [showWhiskers, setShowWhiskers] = useState(false);
  const [showCritGap, setShowCritGap] = useState(false);
  const [plotSettings, setPlotSettings] = useState({
    type: 'bar',
    errorType: 'se',
    errorDirection: 'both',
    showOutline: true,
    showGrid: true,
    g1Pattern: 'none',
    g2Pattern: 'none',
    g1Color: '#6366f1',
    g2Color: '#10b981',
    yMin: null,
    yMax: null,
    xLabel: 'Group',
    yLabel: 'Outcome'
  });
  const svgRef = useRef(null);

  useEffect(() => {
    if (!datasetSeed?.key) {
      return;
    }

    setInputMode('raw');
    setGroup1((previous) => ({
      ...previous,
      xBar: Number.isFinite(datasetSeed.group1?.xBar) ? datasetSeed.group1.xBar : previous.xBar,
      s: Number.isFinite(datasetSeed.group1?.s) ? datasetSeed.group1.s : previous.s,
      n: Number.isFinite(datasetSeed.group1?.n) ? datasetSeed.group1.n : previous.n,
      raw: datasetSeed.group1?.raw || previous.raw,
    }));
    setGroup2((previous) => ({
      ...previous,
      xBar: Number.isFinite(datasetSeed.group2?.xBar) ? datasetSeed.group2.xBar : previous.xBar,
      s: Number.isFinite(datasetSeed.group2?.s) ? datasetSeed.group2.s : previous.s,
      n: Number.isFinite(datasetSeed.group2?.n) ? datasetSeed.group2.n : previous.n,
      raw: datasetSeed.group2?.raw || previous.raw,
    }));
  }, [datasetSeed?.key]);

  // --- Calculations ---
  const delta = group1.xBar - group2.xBar;

  // Pooled Variance & SE
  const pooledVarNum = ((group1.n - 1) * Math.pow(group1.s, 2) + (group2.n - 1) * Math.pow(group2.s, 2));
  const pooledVarDen = (group1.n + group2.n - 2);
  const pooledVar = pooledVarDen > 0 ? pooledVarNum / pooledVarDen : 0;
  const sePooled = Math.sqrt(pooledVar * (1 / group1.n + 1 / group2.n));

  // Welch SE
  const seWelch = Math.sqrt(Math.pow(group1.s, 2) / group1.n + Math.pow(group2.s, 2) / group2.n);

  const se = testType === 'student' ? sePooled : seWelch;
  const tScore = delta / se;

  // df calculation
  const dfStudent = group1.n + group2.n - 2;
  const dfWelchNum = Math.pow(Math.pow(group1.s, 2) / group1.n + Math.pow(group2.s, 2) / group2.n, 2);
  const dfWelchDen = (group1.n > 1 ? Math.pow(Math.pow(group1.s, 2) / group1.n, 2) / (group1.n - 1) : 0) + (group2.n > 1 ? Math.pow(Math.pow(group2.s, 2) / group2.n, 2) / (group2.n - 1) : 0);
  const dfWelch = dfWelchDen > 0 ? dfWelchNum / dfWelchDen : 1;

  const df = testType === 'student' ? dfStudent : dfWelch;

  // Critical Value & p-value
  const getCritMap = (a, t, d) => {
    const tcritMap = {
      0.05: { 2: [1, 12.706, 4.303, 3.182, 2.776, 2.571, 2.447, 2.365, 2.306, 2.262, 2.228, 2.201, 2.179, 2.160, 2.145, 2.131, 2.120, 2.110, 2.101, 2.093, 2.086, 2.080, 2.074, 2.069, 2.064, 2.060, 2.056, 2.052, 2.048, 2.045, 2.042], 1: [1, 6.314, 2.920, 2.353, 2.132, 2.015, 1.943, 1.895, 1.860, 1.833, 1.812, 1.796, 1.782, 1.771, 1.761, 1.753, 1.746, 1.740, 1.734, 1.729, 1.725, 1.721, 1.717, 1.714, 1.711, 1.708, 1.706, 1.703, 1.701, 1.699, 1.697] },
      0.01: { 2: [1, 63.657, 9.925, 5.841, 4.604, 4.032, 3.707, 3.499, 3.355, 3.250, 3.169, 3.106, 3.055, 3.012, 2.977, 2.947, 2.921, 2.898, 2.878, 2.861, 2.845, 2.831, 2.819, 2.807, 2.797, 2.787, 2.779, 2.771, 2.763, 2.756, 2.750], 1: [1, 31.821, 6.965, 4.541, 3.747, 3.365, 3.143, 2.998, 2.896, 2.821, 2.764, 2.718, 2.681, 2.650, 2.624, 2.602, 2.583, 2.567, 2.552, 2.539, 2.528, 2.518, 2.508, 2.500, 2.492, 2.485, 2.479, 2.473, 2.467, 2.462, 2.457] },
      0.10: { 2: [1, 6.314, 2.920, 2.353, 2.132, 2.015, 1.943, 1.895, 1.860, 1.833, 1.812, 1.796, 1.782, 1.771, 1.761, 1.753, 1.746, 1.740, 1.734, 1.729, 1.725, 1.721, 1.717, 1.714, 1.711, 1.708, 1.706, 1.703, 1.701, 1.699, 1.697], 1: [1, 3.078, 1.886, 1.638, 1.533, 1.476, 1.440, 1.415, 1.397, 1.383, 1.372, 1.363, 1.356, 1.350, 1.345, 1.341, 1.337, 1.333, 1.330, 1.328, 1.325, 1.323, 1.321, 1.319, 1.318, 1.316, 1.315, 1.314, 1.313, 1.311, 1.310] }
    };
    const dIdx = Math.min(Math.round(d), 30);
    let crit = tcritMap[a][t][dIdx];
    if (d > 30) {
      const normalCrit = t === 2 ? (a === 0.05 ? 1.96 : a === 0.01 ? 2.58 : 1.645) : (a === 0.05 ? 1.645 : a === 0.01 ? 2.33 : 1.28);
      const weight = 30 / d;
      crit = crit * weight + normalCrit * (1 - weight);
    }
    return crit;
  };

  const critValue = getCritMap(alpha, tails, df);
  const criticalValue = h1Direction === 'greater' ? Math.abs(critValue) : -Math.abs(critValue);

  const isSignificant = tails === 2
    ? Math.abs(tScore) >= (Math.abs(criticalValue) - 0.001)
    : (h1Direction === 'greater' ? tScore >= (criticalValue - 0.001) : tScore <= (criticalValue + 0.001));

  const pValue = tails === 2
    ? (1 - tCDF(Math.abs(tScore), df)) * 2
    : (h1Direction === 'greater' ? (1 - tCDF(tScore, df)) : tCDF(tScore, df));

  // CI
  const ciCrit = getCritMap(alpha, ciType === 'two-sided' ? 2 : 1, df);
  const ciBound = ciCrit * se;
  const ciLower = ciType === 'two-sided' ? delta - ciBound : (h1Direction === 'greater' ? delta - ciBound : -Infinity);
  const ciUpper = ciType === 'two-sided' ? delta + ciBound : (h1Direction === 'greater' ? Infinity : delta + ciBound);

  // Effect Sizes
  const cohenD = Math.abs(delta) / Math.sqrt(pooledVar);
  const hedgeCorrection = 1 - (3 / (4 * (group1.n + group2.n) - 9));
  const hedgesG = cohenD * hedgeCorrection;

  // Advanced Stats for Visuals
  const sem1 = group1.s / Math.sqrt(group1.n);
  const sem2 = group2.s / Math.sqrt(group2.n);
  const deltaCrit = Math.abs(critValue * se);

  // Approximation for Overlap Coefficient (OVL)
  // OVL = 2 * Phi(-|d|/2)
  const normCDF = (x) => tCDF(x, 1000); // Approximation
  const overlapPct = (2 * normCDF(-cohenD / 2) * 100);

  // Helpers
  const parseRaw = (text, setFn) => {
    const nums = text.replace(/,/g, ' ').split(/\s+/).map(v => parseFloat(v)).filter(v => !isNaN(v));
    if (nums.length < 2) return;
    const n = nums.length;
    const mean = nums.reduce((a, b) => a + b, 0) / n;
    const variance = nums.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (n - 1);
    setFn({ xBar: parseFloat(mean.toFixed(2)), s: parseFloat(Math.sqrt(variance).toFixed(3)), n, raw: text });
  };

  const handleSwap = () => {
    const temp = { ...group1 };
    setGroup1({ ...group2 });
    setGroup2(temp);
  };

  // Tutor & Stats Update
  useEffect(() => {
    if (onStatsUpdate) {
      onStatsUpdate({
        delta, t: tScore, p: pValue, df, se, isSignificant, crit: criticalValue, d: cohenD, g: hedgesG,
        n1: group1.n, n2: group2.n, x1: group1.xBar, x2: group2.xBar, s1: group1.s, s2: group2.s,
        testType, pooledVar
      });
    }
  }, [delta, tScore, pValue, df, se, isSignificant, criticalValue, cohenD, hedgesG, group1, group2, onStatsUpdate, testType, pooledVar]);

  const tutorState = useMemo(() => ({
    n1: group1.n, n2: group2.n, x1: group1.xBar, x2: group2.xBar, s1: group1.s, s2: group2.s,
    testType, delta, t: tScore, p: pValue, df, alpha, tails, isSignificant, ciLower, ciUpper, showCI
  }), [group1, group2, testType, delta, tScore, pValue, df, alpha, tails, isSignificant, ciLower, ciUpper, showCI]);

  const tutor = useTutor('t_test_indep', tutorState);
  useEffect(() => { if (onTutorUpdate && tutor.activeScript) onTutorUpdate(tutor.activeScript); }, [tutor.activeScript, onTutorUpdate]);

  // Visual Helpers
  const mean = 150;
  const stdDev = 35;
  const points = getTPoints(mean, stdDev, df, 120, 300);
  const pathData = pointsToPath(points);

  // Group Distribution Helpers
  const combinedSD = Math.sqrt((group1.s ** 2 + group2.s ** 2) / 2);
  const g1Points = getGaussianPoints(mean + (group1.xBar - group2.xBar) * (stdDev / se), stdDev, 100, 300);
  const g2Points = getGaussianPoints(mean, stdDev, 100, 300);
  // Note: This is an idealized visualization where group 2 is centered and group 1 is offset by delta.
  // To be more accurate, we should center them around a common mean, but offset is better for "seeing the gap".
  const g1Path = pointsToPath(g1Points);
  const g2Path = pointsToPath(g2Points);

  // Marker drag logic
  const handlePointerMove = (e) => {
    if (!isDragging || !svgRef.current) return;
    const svg = svgRef.current;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX; pt.y = e.clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return;
    const svgP = pt.matrixTransform(ctm.inverse());
    const newVal = (svgP.x - mean) / stdDev;
    const newDelta = newVal * se;
    if (isNaN(newDelta)) return;
    setGroup1(prev => ({ ...prev, xBar: parseFloat((newDelta + group2.xBar).toFixed(2)) }));
  };

  const copyPlotToClipboard = async () => {
    const svg = document.getElementById('ttest-plot-svg');
    if (!svg) return;

    try {
      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);

      img.onload = async () => {
        canvas.width = svg.viewBox.baseVal.width * 2; // High res
        canvas.height = svg.viewBox.baseVal.height * 2;
        ctx.fillStyle = darkMode ? '#0f172a' : '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        canvas.toBlob(async (blob) => {
          try {
            await navigator.clipboard.write([
              new ClipboardItem({ 'image/png': blob })
            ]);
            alert('Plot copied to clipboard as image!');
          } catch (err) {
            console.error('Copy failed:', err);
          }
          URL.revokeObjectURL(url);
        });
      };
      img.src = url;
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="w-full flex">
      <div className="flex-1 flex flex-col items-center">
        <div className={`w-full ${displayVisual === 'plots' ? 'h-96' : 'h-72'} relative flex items-end justify-center select-none border overflow-hidden px-4 transition-all duration-500 ${darkMode ? 'bg-slate-950 border-slate-800 shadow-inner' : 'bg-white rounded-t-lg border-slate-100 shadow-inner'}`}>
          <div className="absolute top-4 left-4 flex gap-2 z-10">
            <button onClick={() => setDisplayVisual('sampling')} className={`px-2 py-1 rounded text-[8px] font-black uppercase tracking-widest border transition-all ${displayVisual === 'sampling' ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg' : 'bg-slate-800 border-slate-700 text-slate-500 hover:text-white'}`}>Sampling dist.</button>
            <button onClick={() => setDisplayVisual('distribution')} className={`px-2 py-1 rounded text-[8px] font-black uppercase tracking-widest border transition-all ${displayVisual === 'distribution' ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg' : 'bg-slate-800 border-slate-700 text-slate-500 hover:text-white'}`}>Group curves</button>
            <button onClick={() => setDisplayVisual('plots')} className={`px-2 py-1 rounded text-[8px] font-black uppercase tracking-widest border transition-all ${displayVisual === 'plots' ? 'bg-amber-600 border-amber-500 text-white shadow-lg' : 'bg-slate-800 border-slate-700 text-slate-500 hover:text-white'}`}>Plots</button>
          </div>

          {displayVisual === 'distribution' && (
            <div className="absolute top-12 left-4 flex gap-2 z-10 animate-in fade-in slide-in-from-left-2 duration-300">
              <button onClick={() => setShowWhiskers(!showWhiskers)} className={`px-2 py-1 rounded text-[7px] font-bold uppercase border transition-all ${showWhiskers ? 'bg-indigo-500 border-indigo-400 text-white' : 'bg-slate-900/50 border-slate-700 text-slate-400 hover:text-white'}`}>Whiskers (SE)</button>
              <button onClick={() => setShowCritGap(!showCritGap)} className={`px-2 py-1 rounded text-[7px] font-bold uppercase border transition-all ${showCritGap ? 'bg-indigo-500 border-indigo-400 text-white' : 'bg-slate-900/50 border-slate-700 text-slate-400 hover:text-white'}`}>Crit. Gap</button>
            </div>
          )}


          {displayVisual === 'plots' ? (
            <IndependentTTestPlots
              group1={group1}
              group2={group2}
              settings={plotSettings}
              darkMode={darkMode}
            />
          ) : (
            <svg ref={svgRef} viewBox="-20 0 340 200" className="w-full h-full overflow-visible" onPointerMove={handlePointerMove} onPointerUp={() => setIsDragging(false)} onPointerLeave={() => setIsDragging(false)}>
              <defs>
                <linearGradient id="indepGradient" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#818cf8" stopOpacity="0.4" /><stop offset="100%" stopColor="#818cf8" stopOpacity="0" /></linearGradient>
                <linearGradient id="g1Gradient" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#6366f1" stopOpacity="0.3" /><stop offset="100%" stopColor="#6366f1" stopOpacity="0" /></linearGradient>
                <linearGradient id="g2Gradient" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#10b981" stopOpacity="0.3" /><stop offset="100%" stopColor="#10b981" stopOpacity="0" /></linearGradient>
              </defs>
              <text x="150" y="192" textAnchor="middle" className={`text-[7px] font-bold uppercase transition-colors ${darkMode ? 'fill-slate-600' : 'fill-slate-400'}`}>{displayVisual === 'sampling' ? "Sampling Distribution (H₀)" : "Relative Group Positions (Mean estimate distributions)"}</text>

              {displayVisual === 'sampling' ? (
                <>
                  <g className={`text-[8px] font-mono transition-colors ${darkMode ? 'fill-slate-600' : 'fill-slate-400'}`}>
                    {[-3, -2, -1, 0, 1, 2, 3].map(z => (
                      <g key={z} transform={`translate(${mean + z * stdDev}, 150)`}>
                        <line y2="5" stroke={darkMode ? "#334155" : "#e2e8f0"} />
                        <text y="15" textAnchor="middle">{z}</text>
                      </g>
                    ))}
                  </g>
                  <line x1="0" y1="150" x2="300" y2="150" stroke={darkMode ? "#334155" : "#94a3b8"} strokeWidth="2" />
                  <text x="150" y="180" textAnchor="middle" className={`text-[7px] font-bold uppercase transition-colors ${darkMode ? 'fill-slate-600' : 'fill-slate-400'}`}>Test statistic (T)</text>
                  <path d={pathData} fill="url(#indepGradient)" stroke="#4f46e5" strokeWidth="3" />

                  {/* Shading */}
                  {tails === 2 ? (
                    <>
                      <path d={`M ${mean + Math.abs(criticalValue) * stdDev},150 ` + points.filter(p => p[0] >= mean + Math.abs(criticalValue) * stdDev).map(p => `L ${p[0]},${p[1]}`).join(' ') + ` L 300,150 Z`} fill="#ef4444" opacity="0.2" />
                      <path d={`M 0,150 ` + points.filter(p => p[0] <= mean - Math.abs(criticalValue) * stdDev).map(p => `L ${p[0]},${p[1]}`).join(' ') + ` L ${mean - Math.abs(criticalValue) * stdDev},150 Z`} fill="#ef4444" opacity="0.2" />
                    </>
                  ) : (
                    h1Direction === 'greater'
                      ? <path d={`M ${mean + criticalValue * stdDev},150 ` + points.filter(p => p[0] >= mean + criticalValue * stdDev).map(p => `L ${p[0]},${p[1]}`).join(' ') + ` L 300,150 Z`} fill="#ef4444" opacity="0.2" />
                      : <path d={`M 0,150 ` + points.filter(p => p[0] <= mean + criticalValue * stdDev).map(p => `L ${p[0]},${p[1]}`).join(' ') + ` L ${mean + criticalValue * stdDev},150 Z`} fill="#ef4444" opacity="0.2" />
                  )}

                  {/* Critical Boundaries */}
                  {tails === 2 ? (
                    <>
                      <line x1={mean + Math.abs(criticalValue) * stdDev} y1="30" x2={mean + Math.abs(criticalValue) * stdDev} y2="150" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="4,2" />
                      <line x1={mean - Math.abs(criticalValue) * stdDev} y1="30" x2={mean - Math.abs(criticalValue) * stdDev} y2="150" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="4,2" />
                      <text x={mean + Math.abs(criticalValue) * stdDev} y="25" textAnchor="middle" className="text-[6px] fill-red-500 font-bold">{`tCrit = ${Math.abs(criticalValue).toFixed(3)}`}</text>
                      <text x={mean - Math.abs(criticalValue) * stdDev} y="25" textAnchor="middle" className="text-[6px] fill-red-500 font-bold">{`tCrit = -${Math.abs(criticalValue).toFixed(3)}`}</text>
                    </>
                  ) : (
                    <>
                      <line x1={mean + criticalValue * stdDev} y1="30" x2={mean + criticalValue * stdDev} y2="150" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="4,2" />
                      <text x={mean + criticalValue * stdDev} y="25" textAnchor="middle" className="text-[6px] fill-red-500 font-bold">{`tCrit = ${criticalValue.toFixed(3)}`}</text>
                    </>
                  )}

                  <g className="cursor-grab active:cursor-grabbing marker-group" onPointerDown={(e) => { e.preventDefault(); setIsDragging(true); e.target.setPointerCapture(e.pointerId); }}>
                    <line x1={mean + tScore * stdDev} y1="30" x2={mean + tScore * stdDev} y2="150" stroke="#4f46e5" strokeWidth="2" strokeDasharray="4,2" opacity="0.5" />
                    <circle cx={mean + tScore * stdDev} cy="148" r="7" fill="#4f46e5" stroke="white" strokeWidth="2" />
                    <g transform={`translate(${mean + tScore * stdDev}, 165)`}>
                      <text textAnchor="middle" className="text-[10px] font-black fill-indigo-500">{`Δ = ${delta.toFixed(2)}`}</text>
                      <text y="12" textAnchor="middle" className="text-[9px] font-bold fill-indigo-400">{`t(${df.toFixed(0)}) = ${tScore.toFixed(3)}`}</text>
                    </g>
                  </g>
                </>
              ) : (
                <>
                  {/* X-Axis and Ticks */}
                  <line x1="0" y1="150" x2="300" y2="150" stroke={darkMode ? "#334155" : "#94a3b8"} strokeWidth="2" />
                  {[-2, -1, 0, 1, 2].map(tick => {
                    const tickVal = tick * 50 * (se / stdDev);
                    return (
                      <g key={tick} transform={`translate(${mean + tick * 50}, 150)`}>
                        <line y2="4" stroke={darkMode ? "#475569" : "#cbd5e1"} strokeWidth="1" />
                        <text y="12" textAnchor="middle" className="text-[6px] fill-slate-500 font-bold">
                          {tick === 0 ? "0 REF" : tickVal.toFixed(1)}
                        </text>
                      </g>
                    );
                  })}

                  <path d={g1Path} fill="url(#g1Gradient)" stroke="#6366f1" strokeWidth="2" />
                  <path d={g2Path} fill="url(#g2Gradient)" stroke="#10b981" strokeWidth="2" />

                  {/* Group 2 Mean & SEM */}
                  <g transform={`translate(${mean}, 150)`}>
                    <circle r="4" fill="#10b981" stroke="white" strokeWidth="1" />
                    <text y="22" textAnchor="middle" className="text-[8px] font-black fill-emerald-500">{`x̄₂ = ${group2.xBar}`}</text>
                    {showWhiskers && (
                      <g className="animate-in fade-in duration-500">
                        <line x1={-sem2 * (stdDev / se)} x2={sem2 * (stdDev / se)} y1="0" y2="0" stroke="#10b981" strokeWidth="2" />
                        <line x1={-sem2 * (stdDev / se)} x2={-sem2 * (stdDev / se)} y1="-3" y2="3" stroke="#10b981" strokeWidth="1" />
                        <line x1={sem2 * (stdDev / se)} x2={sem2 * (stdDev / se)} y1="-3" y2="3" stroke="#10b981" strokeWidth="1" />
                        <text y="-8" textAnchor="middle" className="text-[5px] fill-emerald-600 font-bold">±1 SEM ({sem2.toFixed(2)} units)</text>
                      </g>
                    )}
                  </g>

                  {/* Group 1 Mean & SEM */}
                  <g transform={`translate(${mean + (group1.xBar - group2.xBar) * (stdDev / se)}, 150)`} className="cursor-grab active:cursor-grabbing" onPointerDown={(e) => { e.preventDefault(); setIsDragging(true); e.target.setPointerCapture(e.pointerId); }}>
                    <circle r="4" fill="#6366f1" stroke="white" strokeWidth="1" />
                    <text y="22" textAnchor="middle" className="text-[8px] font-black fill-indigo-500">{`x̄₁ = ${group1.xBar}`}</text>
                    <line y1="-100" y2="0" stroke="#6366f1" strokeWidth="1" strokeDasharray="4,2" opacity="0.3" />
                    {showWhiskers && (
                      <g className="animate-in fade-in duration-500">
                        <line x1={-sem1 * (stdDev / se)} x2={sem1 * (stdDev / se)} y1="0" y2="0" stroke="#6366f1" strokeWidth="2" />
                        <line x1={-sem1 * (stdDev / se)} x2={-sem1 * (stdDev / se)} y1="-3" y2="3" stroke="#6366f1" strokeWidth="1" />
                        <line x1={sem1 * (stdDev / se)} x2={sem1 * (stdDev / se)} y1="-3" y2="3" stroke="#6366f1" strokeWidth="1" />
                        <text y="-8" textAnchor="middle" className="text-[5px] fill-indigo-600 font-bold">±1 SEM ({sem1.toFixed(2)} units)</text>
                      </g>
                    )}
                  </g>

                  {/* GAP and SE_delta */}
                  <path d={`M ${mean},70 L ${mean + (group1.xBar - group2.xBar) * (stdDev / se)},70`} stroke="#4f46e5" strokeWidth="2" markerEnd="url(#arrowhead)" />
                  <g transform={`translate(${mean + (group1.xBar - group2.xBar) * (stdDev / se) / 2}, 60)`}>
                    <text textAnchor="middle" className="text-[9px] font-black fill-indigo-500">{`Δ = ${delta.toFixed(2)} units`}</text>
                    <text y="10" textAnchor="middle" className="text-[8px] font-bold fill-indigo-400">{`d = ${cohenD.toFixed(2)}`}</text>
                  </g>

                  {showWhiskers && (
                    <g transform={`translate(${mean + (group1.xBar - group2.xBar) * (stdDev / se) / 2}, 85)`} className="animate-in fade-in duration-500">
                      <path d={`M ${-(stdDev / 2)},0 L ${(stdDev / 2)},0`} stroke="#4f46e5" strokeWidth="1.5" strokeDasharray="2,1" />
                      <line x1={-(stdDev / 2)} x2={-(stdDev / 2)} y1="-3" y2="3" stroke="#4f46e5" strokeWidth="1" />
                      <line x1={(stdDev / 2)} x2={(stdDev / 2)} y1="-3" y2="3" stroke="#4f46e5" strokeWidth="1" />
                      <text y="10" textAnchor="middle" className="text-[6px] fill-indigo-500 font-black uppercase tracking-tighter">SE₍Δ₎</text>
                    </g>
                  )}

                  {/* Critical Gap Overlay */}
                  {showCritGap && (
                    <g className="animate-in slide-in-from-top-2 duration-500">
                      {/* Reference Zone(s) */}
                      {tails === 2 ? (
                        <>
                          {/* Left side */}
                          <rect transform={`translate(${mean}, 110)`} x={-deltaCrit * (stdDev / se)} y="-5" width={deltaCrit * (stdDev / se)} height="10" fill={delta <= -deltaCrit ? "#10b981" : "#ef4444"} opacity="0.1" rx="2" />
                          <line transform={`translate(${mean}, 110)`} x1={-deltaCrit * (stdDev / se)} x2={-deltaCrit * (stdDev / se)} y1="-10" y2="10" stroke={delta <= -deltaCrit ? "#10b981" : "#ef4444"} strokeWidth="1.5" strokeDasharray="3,1" />

                          {/* Right side */}
                          <rect transform={`translate(${mean}, 110)`} x="0" width={deltaCrit * (stdDev / se)} height="10" fill={delta >= deltaCrit ? "#10b981" : "#ef4444"} opacity="0.1" rx="2" />
                          <line transform={`translate(${mean}, 110)`} x1={deltaCrit * (stdDev / se)} x2={deltaCrit * (stdDev / se)} y1="-10" y2="10" stroke={delta >= deltaCrit ? "#10b981" : "#ef4444"} strokeWidth="1.5" strokeDasharray="3,1" />

                          <text x={mean} y="105" textAnchor="middle" className={`text-[6px] font-black fill-slate-500 uppercase tracking-tighter`}>Significance Thresholds</text>
                          <text x={mean + deltaCrit * (stdDev / se) + 3} y="113" textAnchor="start" className={`text-[7px] font-black ${delta >= deltaCrit ? 'fill-emerald-500' : 'fill-red-500'}`}>{`+${deltaCrit.toFixed(2)}`}</text>
                          <text x={mean - deltaCrit * (stdDev / se) - 3} y="113" textAnchor="end" className={`text-[7px] font-black ${delta <= -deltaCrit ? 'fill-emerald-500' : 'fill-red-500'}`}>{`-${deltaCrit.toFixed(2)}`}</text>
                        </>
                      ) : (
                        <g transform={`translate(${mean}, 110)`}>
                          <rect x={h1Direction === 'greater' ? 0 : -deltaCrit * (stdDev / se)} y="-5" width={deltaCrit * (stdDev / se)} height="10" fill={isSignificant ? "#10b981" : "#ef4444"} opacity="0.1" rx="2" />
                          <line x1={h1Direction === 'greater' ? deltaCrit * (stdDev / se) : -deltaCrit * (stdDev / se)} x2={h1Direction === 'greater' ? deltaCrit * (stdDev / se) : -deltaCrit * (stdDev / se)} y1="-10" y2="10" stroke={isSignificant ? "#10b981" : "#ef4444"} strokeWidth="1.5" strokeDasharray="3,1" />
                          <text x={h1Direction === 'greater' ? deltaCrit * (stdDev / se) + 5 : -deltaCrit * (stdDev / se) - 5} y="3" textAnchor={h1Direction === 'greater' ? "start" : "end"} className={`text-[7px] font-black ${isSignificant ? 'fill-emerald-500' : 'fill-red-500'}`}>
                            {`Need |Δ| ≥ ${deltaCrit.toFixed(2)} units`}
                          </text>
                        </g>
                      )}
                    </g>
                  )}

                  {/* Overlap Readout */}
                  <g transform="translate(280, 185)" className="cursor-help" title="Approximate overlap of the two raw-score curves (intuitive effect size cue).">
                    <text textAnchor="end" className={`text-[7px] font-bold ${darkMode ? 'fill-slate-600' : 'fill-slate-400'}`}>
                      {`Overlap ≈ ${overlapPct.toFixed(0)}%`}
                    </text>
                  </g>
                </>
              )}
            </svg>
          )}

          <div className="absolute top-4 right-4 flex flex-col gap-2 items-end">
            <div className={`px-3 py-1.5 rounded-lg border flex flex-col items-center min-w-[100px] ${isSignificant ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-slate-500/10 border-slate-500/30'}`}>
              <span className={`text-[8px] font-black uppercase tracking-widest ${isSignificant ? 'text-emerald-500' : 'text-slate-400'}`}>{isSignificant ? 'Significant' : 'Not Significant'}</span>
              <span className={`text-sm font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>p = {pValue < 0.001 ? '< .001' : pValue.toFixed(3).replace(/^0/, '')}</span>
            </div>
            <div className={`px-3 py-1.5 rounded-lg border flex flex-col items-center min-w-[100px] ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
              <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">
                {displayVisual === 'distribution' && showCritGap ? "Crit. Threshold (Δ)" : "Critical Value (tcrit)"}
              </span>
              <span className={`text-xs font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                {displayVisual === 'distribution' && showCritGap
                  ? `±${deltaCrit.toFixed(3)}`
                  : (tails === 2 ? `±${Math.abs(criticalValue).toFixed(3)}` : criticalValue.toFixed(3))}
              </span>
            </div>
          </div>
        </div>

        {
          displayVisual === 'plots' && (
            <div className={`w-full p-4 border-b animate-in fade-in slide-in-from-top-4 duration-500 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'}`}>
              <div className="max-w-5xl mx-auto">
                <div className="flex items-center gap-2 mb-6">
                  <Settings2 size={16} className="text-amber-500" />
                  <h5 className="text-[10px] font-black uppercase text-amber-500 tracking-widest">Plot Customization</h5>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                  <div className="space-y-4">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Core Style</span>
                    <div className="space-y-3">
                      <div className={`p-1 rounded-lg flex ${darkMode ? 'bg-slate-950' : 'bg-slate-100'}`}>
                        {['bar', 'line'].map(t => (
                          <button key={t} onClick={() => setPlotSettings({ ...plotSettings, type: t })} className={`flex-1 py-1.5 text-[9px] font-black rounded uppercase transition-all ${plotSettings.type === t ? 'bg-amber-500 text-white shadow-md' : 'text-slate-500'}`}>{t}</button>
                        ))}
                      </div>
                      <div className="flex items-center justify-between px-1">
                        <span className="text-[8px] font-bold text-slate-500 uppercase">Outline</span>
                        <button onClick={() => setPlotSettings({ ...plotSettings, showOutline: !plotSettings.showOutline })} className={`w-8 h-4 rounded-full transition-all relative ${plotSettings.showOutline ? 'bg-emerald-500' : 'bg-slate-700'}`}>
                          <div className={`absolute top-1 w-2 h-2 rounded-full bg-white transition-all ${plotSettings.showOutline ? 'left-5' : 'left-1'}`} />
                        </button>
                      </div>
                      <div className="flex items-center justify-between px-1">
                        <span className="text-[8px] font-bold text-slate-500 uppercase">Grid Lines</span>
                        <button onClick={() => setPlotSettings({ ...plotSettings, showGrid: !plotSettings.showGrid })} className={`w-8 h-4 rounded-full transition-all relative ${plotSettings.showGrid ? 'bg-emerald-500' : 'bg-slate-700'}`}>
                          <div className={`absolute top-1 w-2 h-2 rounded-full bg-white transition-all ${plotSettings.showGrid ? 'left-5' : 'left-1'}`} />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 col-span-1 md:col-span-2">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Fill Patterns</span>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <span className="text-[7px] font-bold text-indigo-400 uppercase">Group 1</span>
                        <select
                          value={plotSettings.g1Pattern}
                          onChange={e => setPlotSettings({ ...plotSettings, g1Pattern: e.target.value })}
                          className={`w-full p-1.5 rounded text-[8px] font-black uppercase border transition-all ${darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200'}`}
                        >
                          {['none', 'diagonal', 'dots', 'horizontal', 'vertical', 'crosshatch'].map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <span className="text-[7px] font-bold text-emerald-400 uppercase">Group 2</span>
                        <select
                          value={plotSettings.g2Pattern}
                          onChange={e => setPlotSettings({ ...plotSettings, g2Pattern: e.target.value })}
                          className={`w-full p-1.5 rounded text-[8px] font-black uppercase border transition-all ${darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200'}`}
                        >
                          {['none', 'diagonal', 'dots', 'horizontal', 'vertical', 'crosshatch'].map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Group Details</span>
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        {['g1Color', 'g2Color'].map((key, i) => (
                          <div key={key} className="flex-1 flex flex-col gap-1">
                            <label className="text-[7px] font-bold text-slate-500 uppercase">G{i + 1}</label>
                            <input type="color" value={plotSettings[key]} onChange={e => setPlotSettings({ ...plotSettings, [key]: e.target.value })} className="w-full h-8 rounded cursor-pointer bg-transparent border-none" />
                          </div>
                        ))}
                      </div>
                      <div className="space-y-1">
                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block">Error Bars</span>
                        <div className={`p-1 rounded-lg flex ${darkMode ? 'bg-slate-950' : 'bg-slate-100'}`}>
                          {['none', 'se', 'sd'].map(type => (
                            <button key={type} onClick={() => setPlotSettings({ ...plotSettings, errorType: type })} className={`flex-1 py-1 text-[8px] font-black rounded uppercase transition-all ${plotSettings.errorType === type ? 'bg-slate-500 text-white' : 'text-slate-500'}`}>{type}</button>
                          ))}
                        </div>
                        {plotSettings.errorType !== 'none' && (
                          <div className={`p-1 rounded-lg flex ${darkMode ? 'bg-slate-950' : 'bg-slate-100'} animate-in fade-in duration-300`}>
                            {['both', 'plus', 'minus'].map(dir => (
                              <button key={dir} onClick={() => setPlotSettings({ ...plotSettings, errorDirection: dir })} className={`flex-1 py-1 text-[7px] font-black rounded uppercase transition-all ${plotSettings.errorDirection === dir ? 'bg-indigo-500 text-white' : 'text-slate-500'}`}>
                                {dir === 'both' ? '±1' : dir === 'plus' ? '+1' : '-1'}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Labels & Range</span>
                    <div className="grid grid-cols-2 gap-2">
                      <input type="text" placeholder="X Label" value={plotSettings.xLabel} onChange={e => setPlotSettings({ ...plotSettings, xLabel: e.target.value })} className={`p-1.5 rounded text-[9px] font-bold border ${darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50'}`} />
                      <input type="text" placeholder="Y Label" value={plotSettings.yLabel} onChange={e => setPlotSettings({ ...plotSettings, yLabel: e.target.value })} className={`p-1.5 rounded text-[9px] font-bold border ${darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50'}`} />
                      <input type="number" placeholder="Y Min" value={plotSettings.yMin ?? ''} onChange={e => setPlotSettings({ ...plotSettings, yMin: e.target.value === '' ? null : parseFloat(e.target.value) })} className={`p-1.5 rounded text-[9px] font-bold border ${darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50'}`} />
                      <input type="number" placeholder="Y Max" value={plotSettings.yMax ?? ''} onChange={e => setPlotSettings({ ...plotSettings, yMax: e.target.value === '' ? null : parseFloat(e.target.value) })} className={`p-1.5 rounded text-[9px] font-bold border ${darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50'}`} />
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800/50 flex justify-between items-center">
                  <button onClick={() => setPlotSettings({ ...plotSettings, yMin: null, yMax: null })} className="text-[8px] font-black text-slate-500 hover:text-amber-500 uppercase tracking-widest transition-colors">Reset Range</button>
                  <button onClick={copyPlotToClipboard} className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-[9px] font-black uppercase tracking-widest rounded-lg transition-all shadow-md flex items-center gap-2">
                    <FileText size={12} /> Copy Plot
                  </button>
                </div>
              </div>
            </div>
          )
        }

        <div className={`w-full p-6 space-y-8 transition-colors ${darkMode ? 'bg-slate-900 shadow-inner' : 'bg-slate-50'}`}>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Variance Assumption</span>
              <div className={`p-1 rounded-lg flex transition-colors ${darkMode ? 'bg-slate-950' : 'bg-white border'}`}>
                <button onClick={() => setTestType('student')} className={`px-3 py-1 text-[10px] font-bold rounded transition-all ${testType === 'student' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-indigo-400'}`}>Pooled (Student)</button>
                <button onClick={() => setTestType('welch')} className={`px-3 py-1 text-[10px] font-bold rounded transition-all ${testType === 'welch' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-indigo-400'}`}>Unpooled (Welch)</button>
              </div>
            </div>
            <div className={`flex flex-col items-end gap-1 p-2 rounded-lg border ${Math.max(Math.pow(group1.s, 2), Math.pow(group2.s, 2)) / Math.min(Math.pow(group1.s, 2), Math.pow(group2.s, 2)) > 4 ? 'border-amber-500/30 bg-amber-500/5' : 'border-slate-800'}`}>
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">Variance Ratio (Max/Min)</span>
              <span className={`text-xs font-mono font-bold ${(Math.max(Math.pow(group1.s, 2), Math.pow(group2.s, 2)) / Math.min(Math.pow(group1.s, 2), Math.pow(group2.s, 2)) > 4) ? 'text-amber-500' : 'text-slate-400'}`}>{(Math.max(Math.pow(group1.s, 2), Math.pow(group2.s, 2)) / Math.min(Math.pow(group1.s, 2), Math.pow(group2.s, 2))).toFixed(2)}</span>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className={`p-4 rounded-xl border-2 transition-all ${darkMode ? 'bg-slate-950/50 border-slate-800' : 'bg-white border-slate-200'}`}>
              <div className="flex justify-between items-center mb-4">
                <h5 className="text-[10px] font-black uppercase text-indigo-400 flex items-center gap-2 pt-1"><div className="w-2 h-2 rounded-full bg-indigo-500"></div> Group 1</h5>
                <button onClick={() => setInputMode(inputMode === 'summary' ? 'raw' : 'summary')} className="text-[8px] font-black text-slate-500 hover:text-indigo-400 underline uppercase tracking-widest">{inputMode === 'summary' ? 'Paste Data' : 'Settings'}</button>
              </div>
              {inputMode === 'summary' ? (
                <div className="grid grid-cols-3 gap-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-[8px] font-bold text-slate-500 uppercase">{"Mean (x̄₁)"}</label>
                    <input type="number" step="0.1" value={group1.xBar} onChange={e => setGroup1({ ...group1, xBar: parseFloat(e.target.value) })} className={`p-2 rounded text-sm font-bold border transition-colors ${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[8px] font-bold text-slate-500 uppercase">SD ($s_1$)</label>
                    <input type="number" step="0.1" min="0.1" value={group1.s} onChange={e => setGroup1({ ...group1, s: Math.max(0.1, parseFloat(e.target.value)) })} className={`p-2 rounded text-sm font-bold border transition-colors ${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[8px] font-bold text-slate-500 uppercase">Size ($n_1$)</label>
                    <input type="number" step="1" min="1" value={group1.n} onChange={e => setGroup1({ ...group1, n: Math.max(1, parseInt(e.target.value) || 1) })} className={`p-2 rounded text-sm font-bold border transition-colors ${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`} />
                  </div>
                </div>
              ) : (
                <textarea placeholder="Paste values separated by comma or space..." value={group1.raw} onChange={e => parseRaw(e.target.value, setGroup1)} className={`w-full h-16 p-2 rounded text-[10px] font-mono border transition-colors ${darkMode ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'}`} />
              )}
            </div>

            <div className={`p-4 rounded-xl border-2 transition-all ${darkMode ? 'bg-slate-950/50 border-slate-800' : 'bg-white border-slate-200'}`}>
              <div className="flex justify-between items-center mb-4">
                <h5 className="text-[10px] font-black uppercase text-emerald-400 flex items-center gap-2 pt-1"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Group 2</h5>
                <button onClick={handleSwap} className="text-[8px] font-black text-slate-500 hover:text-indigo-400 flex items-center gap-1 uppercase tracking-widest pt-1"><RefreshCw size={10} /> Swap Groups</button>
              </div>
              {inputMode === 'summary' ? (
                <div className="grid grid-cols-3 gap-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-[8px] font-bold text-slate-500 uppercase">{"Mean (x̄₂)"}</label>
                    <input type="number" step="0.1" value={group2.xBar} onChange={e => setGroup2({ ...group2, xBar: parseFloat(e.target.value) })} className={`p-2 rounded text-sm font-bold border transition-colors ${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[8px] font-bold text-slate-500 uppercase">SD ($s_2$)</label>
                    <input type="number" step="0.1" min="0.1" value={group2.s} onChange={e => setGroup2({ ...group2, s: Math.max(0.1, parseFloat(e.target.value)) })} className={`p-2 rounded text-sm font-bold border transition-colors ${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[8px] font-bold text-slate-500 uppercase">Size ($n_2$)</label>
                    <input type="number" step="1" min="1" value={group2.n} onChange={e => setGroup2({ ...group2, n: Math.max(1, parseInt(e.target.value) || 1) })} className={`p-2 rounded text-sm font-bold border transition-colors ${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`} />
                  </div>
                </div>
              ) : (
                <textarea placeholder="Paste values separated by comma or space..." value={group2.raw} onChange={e => parseRaw(e.target.value, setGroup2)} className={`w-full h-16 p-2 rounded text-[10px] font-mono border transition-colors ${darkMode ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'}`} />
              )}
            </div>
          </div>


          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest px-1">Threshold ($\alpha$)</span>
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
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest px-1">H₁ Direction</span>
                <div className={`p-1 rounded flex transition-colors ${darkMode ? 'bg-slate-950' : 'bg-white border'}`}>
                  <button onClick={() => setH1Direction('greater')} className={`flex-1 py-1 text-[10px] font-bold rounded ${h1Direction === 'greater' ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}>{"μ₁ > μ₂"}</button>
                  <button onClick={() => setH1Direction('less')} className={`flex-1 py-1 text-[10px] font-bold rounded ${h1Direction === 'less' ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}>{"μ₁ < μ₂"}</button>
                </div>
              </div>
            )}
            <div className="flex flex-col gap-1">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest px-1">Reporting CI</span>
              <div className="flex items-center gap-2">
                <button onClick={() => setShowCI(!showCI)} className={`flex-1 py-2 text-[10px] font-black rounded border transition-all uppercase tracking-widest ${showCI ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg' : (darkMode ? 'bg-slate-900 border-slate-800 text-slate-500' : 'bg-white text-slate-400')}`}>
                  {showCI ? (ciType === 'two-sided' ? 'Two-Sided CI' : 'One-Sided Bound') : 'Show Confidence'}
                </button>
                {showCI && (
                  <select value={ciType} onChange={e => setCiType(e.target.value)} className={`p-2 rounded text-[8px] font-black border uppercase transition-colors ${darkMode ? 'bg-slate-950 border-slate-700 text-indigo-400' : 'bg-white border-slate-200 text-indigo-600'}`}>
                    <option value="two-sided">Two-Sided</option>
                    <option value="one-sided">One-Sided</option>
                  </select>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
            <div className={`p-4 rounded-xl border flex flex-col items-center justify-center transition-colors ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-white shadow-sm'}`}>
              <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Test Stats</span>
              <div className="flex items-baseline gap-2">
                <span className={`text-xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>{tScore.toFixed(3)}</span>
                <span className="text-[8px] font-bold text-slate-500 uppercase">t({df.toFixed(1)})</span>
              </div>
              <span className="text-[8px] font-bold text-slate-600 mt-1 uppercase leading-none">SE = {se.toFixed(3)}</span>
            </div>
            <div className={`p-4 rounded-xl border flex flex-col items-center justify-center transition-colors ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-white shadow-sm'}`}>
              <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Effect Sizes</span>
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <span className={`text-sm font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>{cohenD.toFixed(3)}</span>
                  <span className="text-[7px] font-bold text-slate-600 uppercase">Cohen's d</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className={`text-sm font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>{hedgesG.toFixed(3)}</span>
                  <span className="text-[7px] font-bold text-slate-600 uppercase">Hedges' g</span>
                </div>
              </div>
              <span className="text-[8px] font-bold text-indigo-500 mt-1 uppercase tracking-tighter">
                {cohenD < 0.2 ? 'Negligible' : cohenD < 0.5 ? 'Small' : cohenD < 0.8 ? 'Medium' : 'Large'} Effect
              </span>
            </div>
            <div className={`p-4 rounded-xl border flex flex-col items-center justify-center relative overflow-hidden transition-colors ${showCI ? (darkMode ? 'bg-indigo-950/20 border-indigo-500/30' : 'bg-indigo-50 border-indigo-100') : (darkMode ? 'bg-slate-950 border-slate-800 opacity-50' : 'bg-white opacity-50')}`}>
              <span className="text-[8px] font-black text-indigo-500 uppercase tracking-widest mb-1">{(1 - alpha) * 100}% Confidence Interval</span>
              {showCI ? (
                <div className="text-sm font-black font-mono tracking-tighter text-indigo-600">
                  {ciType === 'two-sided'
                    ? `[${ciLower.toFixed(2)}, ${ciUpper.toFixed(2)}]`
                    : (h1Direction === 'greater' ? `> ${ciLower.toFixed(2)}` : `< ${ciUpper.toFixed(2)}`)}
                </div>
              ) : <div className="text-[9px] font-bold text-slate-500 uppercase">Hidden</div>}
              {showCI && (
                <div className="mt-1 flex flex-col items-center">
                  <span className="text-[6px] font-black text-indigo-200 uppercase leading-none">{(tails === 2 && ciType === 'two-sided') || (tails === 1 && ciType === 'one-sided') ? 'Aligned with alpha' : 'Check tutor for alignment'}</span>
                </div>
              )}
            </div>
          </div>

          <div className={`rounded-xl border p-3 flex flex-col md:flex-row justify-between items-center gap-4 group transition-colors ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
            <div className={`text-[10px] font-mono break-all leading-relaxed max-w-[85%] ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              <span className="text-indigo-500 font-bold tracking-widest mr-2 uppercase text-[7px]">Report Line</span>
              {testType === 'student' ? '' : "Welch's "}Independent samples t-test, t({df.toFixed(df === Math.floor(df) ? 0 : 2)}) = {tScore.toFixed(2)}, p = {pValue < 0.001 ? '< .001' : pValue.toFixed(3).replace(/^0/, '')}, d = {cohenD.toFixed(2)}{showCI ? `, 95% CI [${ciLower.toFixed(2)}, ${ciUpper.toFixed(2)}]` : ''}.
            </div>
            <button
              onClick={() => {
                const line = `${testType === 'student' ? '' : "Welch's "}Independent samples t-test, t(${df.toFixed(df === Math.floor(df) ? 0 : 2)}) = ${tScore.toFixed(2)}, p = ${pValue < 0.001 ? '< .001' : pValue.toFixed(3).replace(/^0/, '')}, d = {cohenD.toFixed(2)}${showCI ? `, 95% CI [${ciLower.toFixed(2)}, ${ciUpper.toFixed(2)}]` : ''}.`;
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

// C. Paired Samples T-Test Visual

export default IndependentTTestVisual;
