import React, { useState, useEffect, useMemo, useRef } from 'react';
import { AlertCircle, Sparkles, Calculator, MousePointer2, Info, ArrowDown, MousePointerClick, Maximize2, Minimize2, RefreshCw, Play, ChevronsRight, ChevronUp, ChevronDown, Activity, Lightbulb, BrainCircuit, BarChart2, Sigma, BookOpen, Plus, X, Trash2, Edit2, TrendingUp, Grid, FileText, PieChart, HelpCircle } from 'lucide-react';
import { getGaussianPoints, getTPoints, normalCDF, tCDF, erf, getTCrit, getFDensity, fCDF, fPPF, getFCrit, getFPoints, calculateAnova, calculatePostHoc, lnGamma, beta } from '../../utils/mathHelpers';
import { pointsToPath, pointsToLine, getOrdinal } from '../../utils/svgHelpers';
import useTutor from '../../hooks/useTutor';
import TutorPanel from '../tutor/TutorPanel';
import CalculationText from '../common/CalculationText';
import TabButton from '../common/TabButton';
const NormalDistributionVisual = ({ highlight = null, label = "Distribution", type = "z", darkMode, tutorLevel = 'tutor', showTutor: showTutorProp = true, onTutorUpdate, onStatsUpdate, powerViewConfig = null }) => {
  const [showTutor, setShowTutor] = useState(showTutorProp);
  const [val, setVal] = useState(0);
  const [alpha, setAlpha] = useState(0.05);
  const [tails, setTails] = useState(2);
  const [showPopulation, setShowPopulation] = useState(false);
  const [visualMode, setVisualMode] = useState('p-value'); // 'p-value' or 'power'
  const [showPModal, setShowPModal] = useState(false);
  const [hoveredRegion, setHoveredRegion] = useState(null);
  const [calcMode, setCalcMode] = useState(false);
  const [calcData, setCalcData] = useState({ xBar: 105, mu: 100, sigma: 15, n: 30 });
  const [h1Direction, setH1Direction] = useState('greater'); // 'greater' or 'less'
  const [precision, setPrecision] = useState(2);
  const [showCI, setShowCI] = useState(false);
  const [altH1Dir, setAltH1Dir] = useState('greater'); // For two-tailed power view
  const [showBothH1, setShowBothH1] = useState(false);
  const [targetEffect, setTargetEffect] = useState(0.5); // Hypothesized Cohen's d for H1
  const [df, setDf] = useState(29);
  const [ciType, setCiType] = useState('two-sided'); // 'two-sided' or 'one-sided'
  const [dataInputMode, setDataInputMode] = useState('summary'); // 'summary' or 'raw'
  const [rawData, setRawData] = useState("");

  // Sync df with n when in t-test mode and calculator is active
  useEffect(() => {
    if (type === 't' && calcMode) {
      const newDf = Math.max(1, calcData.n - 1);
      if (df !== newDf) setDf(newDf);
    }
  }, [calcData.n, type, calcMode, df]);
  const [showTailGap, setShowTailGap] = useState(false);
  const [isHovering, setIsHovering] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const svgRef = useRef(null);

  useEffect(() => {
    if (!powerViewConfig) return;

    if (powerViewConfig.visualMode) setVisualMode(powerViewConfig.visualMode);
    if (typeof powerViewConfig.alpha === 'number') setAlpha(powerViewConfig.alpha);
    if (typeof powerViewConfig.tails === 'number') setTails(powerViewConfig.tails);
    if (typeof powerViewConfig.showPopulation === 'boolean') setShowPopulation(powerViewConfig.showPopulation);
    if (typeof powerViewConfig.targetEffect === 'number') setTargetEffect(powerViewConfig.targetEffect);
    if (typeof powerViewConfig.calcMode === 'boolean') setCalcMode(powerViewConfig.calcMode);
    if (typeof powerViewConfig.showBothH1 === 'boolean') setShowBothH1(powerViewConfig.showBothH1);
    if (typeof powerViewConfig.h1Direction === 'string') {
      setH1Direction(powerViewConfig.h1Direction);
      setAltH1Dir(powerViewConfig.h1Direction);
    }
    if (typeof powerViewConfig.df === 'number') setDf(powerViewConfig.df);
    if (typeof powerViewConfig.val === 'number') setVal(powerViewConfig.val);
    if (powerViewConfig.calcData) {
      setCalcData(prev => ({ ...prev, ...powerViewConfig.calcData }));
    }
  }, [powerViewConfig]);

  // --- REORGANIZED CALCULATIONS ---

  const getCriticalValue = () => {
    if (type === 't') {
      const tcritMap = {
        0.05: {
          2: [1, 12.706, 4.303, 3.182, 2.776, 2.571, 2.447, 2.365, 2.306, 2.262, 2.228, 2.201, 2.179, 2.160, 2.145, 2.131, 2.120, 2.110, 2.101, 2.093, 2.086, 2.080, 2.074, 2.069, 2.064, 2.060, 2.056, 2.052, 2.048, 2.045, 2.042],
          1: [1, 6.314, 2.920, 2.353, 2.132, 2.015, 1.943, 1.895, 1.860, 1.833, 1.812, 1.796, 1.782, 1.771, 1.761, 1.753, 1.746, 1.740, 1.734, 1.729, 1.725, 1.721, 1.717, 1.714, 1.711, 1.708, 1.706, 1.703, 1.701, 1.699, 1.697]
        },
        0.01: {
          2: [1, 63.657, 9.925, 5.841, 4.604, 4.032, 3.707, 3.499, 3.355, 3.250, 3.169, 3.106, 3.055, 3.012, 2.977, 2.947, 2.921, 2.898, 2.878, 2.861, 2.845, 2.831, 2.819, 2.807, 2.797, 2.787, 2.779, 2.771, 2.763, 2.756, 2.750],
          1: [1, 31.821, 6.965, 4.541, 3.747, 3.365, 3.143, 2.998, 2.896, 2.821, 2.764, 2.718, 2.681, 2.650, 2.624, 2.602, 2.583, 2.567, 2.552, 2.539, 2.528, 2.518, 2.508, 2.500, 2.492, 2.485, 2.479, 2.473, 2.467, 2.462, 2.457]
        },
        0.10: {
          2: [1, 6.314, 2.920, 2.353, 2.132, 2.015, 1.943, 1.895, 1.860, 1.833, 1.812, 1.796, 1.782, 1.771, 1.761, 1.753, 1.746, 1.740, 1.734, 1.729, 1.725, 1.721, 1.717, 1.714, 1.711, 1.708, 1.706, 1.703, 1.701, 1.699, 1.697],
          1: [1, 3.078, 1.886, 1.638, 1.533, 1.476, 1.440, 1.415, 1.397, 1.383, 1.372, 1.363, 1.356, 1.350, 1.345, 1.341, 1.337, 1.333, 1.330, 1.328, 1.325, 1.323, 1.321, 1.319, 1.318, 1.316, 1.315, 1.314, 1.313, 1.311, 1.310]
        }
      };
      const dIdx = Math.min(df, 30);
      let crit = tcritMap[alpha][tails][dIdx];
      if (df > 30) {
        const normalCrit = tails === 2 ? (alpha === 0.05 ? 1.96 : alpha === 0.01 ? 2.58 : 1.645) : (alpha === 0.05 ? 1.645 : alpha === 0.01 ? 2.33 : 1.28);
        const weight = 30 / df;
        crit = crit * weight + normalCrit * (1 - weight);
      }
      return h1Direction === 'greater' ? Math.abs(crit) : -Math.abs(crit);
    }
    if (tails === 2) {
      if (alpha === 0.05) return 1.96;
      if (alpha === 0.01) return 2.58;
      if (alpha === 0.10) return 1.645;
    } else {
      const crit = alpha === 0.05 ? 1.645 : alpha === 0.01 ? 2.33 : 1.28;
      return h1Direction === 'greater' ? Math.abs(crit) : -Math.abs(crit);
    }
    return 1.96;
  };

  const criticalValue = getCriticalValue();
  const isSignificant = tails === 2
    ? Math.abs(val) >= (Math.abs(criticalValue) - 0.001)
    : (h1Direction === 'greater' ? val >= (criticalValue - 0.001) : val <= (criticalValue + 0.001));

  const pTail = type === 't'
    ? (tails === 2
      ? (Math.abs(val) > 0 ? (1 - tCDF(Math.abs(val), df)) * 2 : 1)
      : (h1Direction === 'greater' ? (1 - tCDF(val, df)) : tCDF(val, df)))
    : (tails === 2
      ? (Math.abs(val) > 0 ? (1 - normalCDF(Math.abs(val))) * 2 : 1)
      : (h1Direction === 'greater' ? (1 - normalCDF(val)) : normalCDF(val)));

  const stdError = calcData.sigma / Math.sqrt(calcData.n);

  useEffect(() => {
    if (onStatsUpdate) {
      onStatsUpdate({
        xBar: calcData.xBar,
        "x̄": calcData.xBar,
        mu: calcData.mu,
        "μ": calcData.mu,
        n: calcData.n,
        sigma: calcData.sigma,
        "σ": calcData.sigma,
        s: calcData.sigma,
        df: df,
        se: stdError,
        "SE": stdError,
        "SEz": stdError,
        "SEt": stdError,
        z: val,
        t: val,
        p: pTail,
        crit: criticalValue
      });
    }
  }, [calcData, stdError, val, pTail, criticalValue, df, onStatsUpdate]);

  const delta = calcData.xBar - calcData.mu;
  const cohenD = delta / calcData.sigma;

  const getCIValue = () => {
    const currentCiTails = ciType === 'two-sided' ? 2 : 1;
    if (type === 't') {
      const tcritMap = {
        0.05: { 2: [1, 12.706, 4.303, 3.182, 2.776, 2.571, 2.447, 2.365, 2.306, 2.262, 2.228, 2.201, 2.179, 2.160, 2.145, 2.131, 2.120, 2.110, 2.101, 2.093, 2.086, 2.080, 2.074, 2.069, 2.064, 2.060, 2.056, 2.052, 2.048, 2.045, 2.042], 1: [1, 6.314, 2.920, 2.353, 2.132, 2.015, 1.943, 1.895, 1.860, 1.833, 1.812, 1.796, 1.782, 1.771, 1.761, 1.753, 1.746, 1.740, 1.734, 1.729, 1.725, 1.721, 1.717, 1.714, 1.711, 1.708, 1.706, 1.703, 1.701, 1.699, 1.697] },
        0.01: { 2: [1, 63.657, 9.925, 5.841, 4.604, 4.032, 3.707, 3.499, 3.355, 3.250, 3.169, 3.106, 3.055, 3.012, 2.977, 2.947, 2.921, 2.898, 2.878, 2.861, 2.845, 2.831, 2.819, 2.807, 2.797, 2.787, 2.779, 2.771, 2.763, 2.756, 2.750], 1: [1, 31.821, 6.965, 4.541, 3.747, 3.365, 3.143, 2.998, 2.896, 2.821, 2.764, 2.718, 2.681, 2.650, 2.624, 2.602, 2.583, 2.567, 2.552, 2.539, 2.528, 2.518, 2.508, 2.500, 2.492, 2.485, 2.479, 2.473, 2.467, 2.462, 2.457] },
        0.10: { 2: [1, 6.314, 2.920, 2.353, 2.132, 2.015, 1.943, 1.895, 1.860, 1.833, 1.812, 1.796, 1.782, 1.771, 1.761, 1.753, 1.746, 1.740, 1.734, 1.729, 1.725, 1.721, 1.717, 1.714, 1.711, 1.708, 1.706, 1.703, 1.701, 1.699, 1.697], 1: [1, 3.078, 1.886, 1.638, 1.533, 1.476, 1.440, 1.415, 1.397, 1.383, 1.372, 1.363, 1.356, 1.350, 1.345, 1.341, 1.337, 1.333, 1.330, 1.328, 1.325, 1.323, 1.321, 1.319, 1.318, 1.316, 1.315, 1.314, 1.313, 1.311, 1.310] }
      };
      const dIdx = Math.min(df, 30);
      let crit = tcritMap[alpha][currentCiTails][dIdx];
      if (df > 30) {
        const normalCrit = currentCiTails === 2 ? (alpha === 0.05 ? 1.96 : alpha === 0.01 ? 2.58 : 1.645) : (alpha === 0.05 ? 1.645 : alpha === 0.01 ? 2.33 : 1.28);
        const weight = 30 / df;
        crit = crit * weight + normalCrit * (1 - weight);
      }
      return Math.abs(crit);
    } else {
      if (currentCiTails === 2) {
        return alpha === 0.01 ? 2.576 : alpha === 0.05 ? 1.96 : 1.645;
      } else {
        return alpha === 0.01 ? 2.326 : alpha === 0.05 ? 1.645 : 1.282;
      }
    }
  };

  const ciBound = getCIValue() * stdError;
  const ciLower = ciType === 'two-sided' ? calcData.xBar - ciBound : (h1Direction === 'greater' ? calcData.xBar - ciBound : -Infinity);
  const ciUpper = ciType === 'two-sided' ? calcData.xBar + ciBound : (h1Direction === 'greater' ? Infinity : calcData.xBar + ciBound);

  const parseRawData = (text) => {
    const numbers = text.replace(/,/g, ' ').split(/\s+/).map(v => parseFloat(v)).filter(v => !isNaN(v));
    if (numbers.length === 0) return;
    const n = numbers.length;
    const sum = numbers.reduce((a, b) => a + b, 0);
    const mean = sum / n;
    const variance = numbers.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (n - 1);
    const sd = Math.sqrt(variance);
    setCalcData(prev => ({ ...prev, n, xBar: parseFloat(mean.toFixed(precision)), sigma: parseFloat(sd.toFixed(3)) }));
  };

  const reportString = `One-sample z-test, z = ${val.toFixed(precision)}, p = ${pTail < 0.001 ? '< .001' : pTail.toFixed(precision === 2 ? 3 : 4)}, α = ${alpha}, ${isSignificant ? 'reject H₀' : 'fail to reject H₀'}. (x̄=${calcData.xBar}, μ₀=${calcData.mu}, n=${calcData.n}, σ=${calcData.sigma})`;

  const stdDev = 35;
  const mean = 150;
  const h1Sign = (tails === 1) ? (h1Direction === 'greater' ? 1 : -1) : (altH1Dir === 'greater' ? 1 : -1);
  const altMeanZ = h1Sign * (targetEffect * Math.sqrt(calcData.n));

  // --- HOOKS ---

  const tutorState = useMemo(() => ({
    n: calcData.n,
    alpha,
    tails,
    direction: h1Direction,
    val,
    p: pTail,
    isSignificant,
    targetEffect,
    calcMode,
    xBar: calcData.xBar,
    mu: calcData.mu,
    df,
    showCI,
    ciLower,
    ciUpper,
    crit: Math.abs(criticalValue).toFixed(3)
  }), [calcData, alpha, tails, h1Direction, val, pTail, isSignificant, targetEffect, calcMode, df, criticalValue, showCI, ciLower, ciUpper]);

  const tutor = useTutor(type === 't' ? 't_test' : 'z_test', tutorState);

  useEffect(() => {
    if (onTutorUpdate && tutor.activeScript) {
      onTutorUpdate(tutor.activeScript);
    }
  }, [tutor.activeScript, onTutorUpdate]);

  useEffect(() => {
    if (calcMode) {
      const seCalc = calcData.sigma / Math.sqrt(calcData.n);
      const computedZ = (calcData.xBar - calcData.mu) / seCalc;
      setVal(parseFloat(computedZ.toFixed(precision)));
      const deltaCalc = calcData.xBar - calcData.mu;
      const dCalc = Math.abs(deltaCalc / calcData.sigma);
      setTargetEffect(Math.min(1.2, parseFloat(dCalc.toFixed(2))));
    }
  }, [calcMode, calcData, precision]);

  useEffect(() => {
    if (onStatsUpdate) {
      onStatsUpdate({
        val,
        p: pTail,
        isSignificant,
        crit: criticalValue,
        mu: calcData.mu,
        xBar: calcData.xBar,
        sigma: calcData.sigma,
        n: calcData.n,
        df,
        se: type === 'z' ? calcData.sigma / Math.sqrt(calcData.n) : calcData.sigma / Math.sqrt(calcData.n)
      });
    }
  }, [val, pTail, isSignificant, criticalValue, calcData, df, type, onStatsUpdate]);

  useEffect(() => {
    if (highlight === 't_score' || highlight === 'z_score') setVal(2.2);
  }, [highlight]);

  const handlePointerDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
    e.target.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e) => {
    if (!isDragging || !svgRef.current) return;

    const svg = svgRef.current;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;

    const svgP = pt.matrixTransform(svg.getScreenCTM().inverse());
    let relativeX = svgP.x;

    // Clamp to statistical display range (-4.5 to 4.5 SD)
    const minX = mean - 4.5 * stdDev;
    const maxX = mean + 4.5 * stdDev;
    relativeX = Math.max(minX, Math.min(maxX, relativeX));

    const newVal = (relativeX - mean) / stdDev;

    if (calcMode) {
      const seCalc = calcData.sigma / Math.sqrt(calcData.n);
      const newXBar = newVal * seCalc + calcData.mu;

      // Update calcData with rounded value for the calculator logic
      setCalcData(prev => ({ ...prev, xBar: parseFloat(newXBar.toFixed(precision)) }));
      // Keep val high-precision for smooth marker following
      setVal(newVal);

      const dCalc = Math.abs((newXBar - calcData.mu) / calcData.sigma);
      setTargetEffect(Math.min(1.2, parseFloat(dCalc.toFixed(2))));
    } else {
      setVal(newVal);
    }
  };

  const handlePointerUp = (e) => {
    setIsDragging(false);
  };

  const points = useMemo(() => {
    if (type === 't') return getTPoints(mean, stdDev, df, 120, 300);
    return getGaussianPoints(mean, stdDev, 120, 300);
  }, [mean, stdDev, df, type]);

  const zPoints = useMemo(() => getGaussianPoints(mean, stdDev, 120, 300), [mean, stdDev]);

  const altPoints = useMemo(() => {
    if (type === 't') return getTPoints(mean + altMeanZ * stdDev, stdDev, df, 120, 300);
    return getGaussianPoints(mean + altMeanZ * stdDev, stdDev, 120, 300);
  }, [altMeanZ, mean, stdDev, df, type]);

  const altPointsNeg = useMemo(() => {
    if (type === 't') return getTPoints(mean - (targetEffect * Math.sqrt(calcData.n)) * stdDev, stdDev, df, 120, 300);
    return getGaussianPoints(mean - (targetEffect * Math.sqrt(calcData.n)) * stdDev, stdDev, 120, 300);
  }, [targetEffect, calcData.n, mean, stdDev, df, type]);

  const pathData = pointsToPath(points);
  const zPathData = pointsToPath(zPoints);
  const altPathData = pointsToPath(altPoints);
  const altPathDataNeg = pointsToPath(altPointsNeg);

  const getOpacity = (part) => {
    if (!highlight) {
      if (isHovering && isHovering !== part) return 0.3;
      return 1;
    }
    if (highlight === 'all') return 1;
    if (highlight === part || (highlight === 't_score' && part === 'val') || (highlight === 'z_score' && part === 'val')) return 1;
    return 0.2;
  };

  return (
    <div className="w-full flex">
      <div className={`flex-1 flex flex-col items-center transition-all duration-500`}>
        <div className={`w-full h-72 relative flex items-end justify-center select-none border overflow-hidden px-4 transition-colors ${darkMode ? 'bg-slate-950 border-slate-800 shadow-inner' : 'bg-white rounded-t-lg border-slate-100'}`}>
          <svg
            ref={svgRef}
            viewBox="-20 0 340 200"
            className={`w-full h-full overflow-visible select-none ${isDragging ? 'cursor-grabbing' : 'cursor-default'}`}
            style={{ touchAction: 'none' }}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
          >
            <style>{`
                            .marker-group { transition: none !important; }
                            ${isDragging ? 'svg * { transition: none !important; }' : ''}
                        `}</style>
            <defs>
              <linearGradient id="curveGradient" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#818cf8" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#818cf8" stopOpacity="0.0" />
              </linearGradient>
              <linearGradient id="nullGradient" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor={darkMode ? "#1e293b" : "#94a3b8"} stopOpacity="0.2" />
                <stop offset="100%" stopColor={darkMode ? "#1e293b" : "#94a3b8"} stopOpacity="0.0" />
              </linearGradient>
              <pattern id="diagonalHatch" patternUnits="userSpaceOnUse" width="4" height="4" patternTransform="rotate(45)">
                <line x1="0" y1="0" x2="0" y2="4" stroke="#22c55e" strokeWidth="1" strokeOpacity="0.5" />
              </pattern>
              <pattern id="dotsPattern" patternUnits="userSpaceOnUse" width="4" height="4">
                <circle cx="1" cy="1" r="0.8" fill="#f97316" fillOpacity="0.5" />
              </pattern>
            </defs>

            {/* X-Axis titles */}
            <text x="150" y="185" textAnchor="middle" className={`text-[7px] font-bold tracking-tight transition-colors ${darkMode ? 'fill-slate-600' : 'fill-slate-400'}`}>Test statistic ({type === 'z' ? 'Z' : 'T'})</text>

            <g className={`text-[8px] font-mono transition-colors ${darkMode ? 'fill-slate-600' : 'fill-slate-400'}`}>
              {[-3, -2, -1, 0, 1, 2, 3].map(sd => (
                <g key={sd} transform={`translate(${mean + sd * stdDev}, 150)`}>
                  <line y2="5" stroke={darkMode ? "#334155" : "#e2e8f0"} />
                  <text y="15" textAnchor="middle">{sd > 0 ? `+${sd}` : sd}</text>
                  {calcMode && (
                    <text y="25" textAnchor="middle" className="fill-indigo-500 font-bold animate-in fade-in duration-300">
                      {(calcData.mu + sd * (calcData.sigma / Math.sqrt(calcData.n))).toFixed(1)}
                    </text>
                  )}
                </g>
              ))}
            </g>

            <line x1="0" y1="150" x2="300" y2="150" stroke={darkMode ? "#334155" : "#94a3b8"} strokeWidth="2" />

            {/* Alternative Distribution (H1) - Dimmed in P-value mode */}
            {showPopulation && (
              <>
                <path d={altPathData} fill="url(#nullGradient)" stroke={darkMode ? "#475569" : "#94a3b8"} strokeWidth="2" strokeDasharray="4" opacity={visualMode === 'p-value' ? "0.15" : "0.6"} className="transition-all duration-500" />
                {tails === 2 && showBothH1 && (
                  <path d={altPathDataNeg} fill="url(#nullGradient)" stroke={darkMode ? "#475569" : "#94a3b8"} strokeWidth="2" strokeDasharray="4" opacity={visualMode === 'p-value' ? "0.15" : "0.6"} className="transition-all duration-500" />
                )}
              </>
            )}

            {/* Alternative/Sample Distribution */}
            <path d={pathData} fill="url(#curveGradient)" stroke="#4f46e5" strokeWidth="3" opacity={getOpacity('curve')} />

            {/* Tail Gap Overlay (Normal Distribution as Reference) */}
            {type === 't' && showTailGap && (
              <path d={zPathData} fill="none" stroke={darkMode ? "#475569" : "#cbd5e1"} strokeWidth="1" strokeDasharray="3,3" opacity="0.6" className="animate-in fade-in duration-500" />
            )}

            {/* Power / Beta Shading (Alternative Curve Area) - Only in Power Mode */}
            {showPopulation && visualMode === 'power' && (
              <g className="transition-all duration-300">
                {/* Power: Area under H1 that falls in H0 rejection region */}
                {tails === 2 ? (
                  <>
                    <path d={`M ${mean + Math.abs(criticalValue) * stdDev},150 ` +
                      altPoints.filter(p => p[0] >= mean + Math.abs(criticalValue) * stdDev)
                        .map((p, i) => (i === 0 ? `L ${p[0]},${p[1]}` : `L ${p[0]},${p[1]}`))
                        .join(' ') + ` L 300,150 Z`} fill="url(#diagonalHatch)" onMouseEnter={() => setHoveredRegion('power')} onMouseLeave={() => setHoveredRegion(null)} className="cursor-help" stroke="none" />
                    <path d={`M 0,150 ` +
                      (showBothH1 ? altPointsNeg : altPoints).filter(p => p[0] <= mean - Math.abs(criticalValue) * stdDev)
                        .map(p => `L ${p[0]},${p[1]}`).join(' ') +
                      ` L ${mean - Math.abs(criticalValue) * stdDev},150 Z`} fill="url(#diagonalHatch)" onMouseEnter={() => setHoveredRegion('power')} onMouseLeave={() => setHoveredRegion(null)} className="cursor-help" stroke="none" />
                  </>
                ) : (
                  h1Direction === 'greater'
                    ? <path d={`M ${mean + criticalValue * stdDev},150 ` +
                      altPoints.filter(p => p[0] >= mean + criticalValue * stdDev)
                        .map(p => `L ${p[0]},${p[1]}`).join(' ') + ` L 300,150 Z`} fill="url(#diagonalHatch)" onMouseEnter={() => setHoveredRegion('power')} onMouseLeave={() => setHoveredRegion(null)} className="cursor-help" stroke="none" />
                    : <path d={`M 0,150 ` + altPoints.filter(p => p[0] <= mean + criticalValue * stdDev).map(p => `L ${p[0]},${p[1]}`).join(' ') + ` L ${mean + criticalValue * stdDev},150 Z`} fill="url(#diagonalHatch)" onMouseEnter={() => setHoveredRegion('power')} onMouseLeave={() => setHoveredRegion(null)} className="cursor-help" stroke="none" />
                )}

                {/* Beta: Area under H1 that falls in H0 non-rejection region (The entire interval) */}
                <path d={`M ${mean - (tails === 1 ? (h1Direction === 'greater' ? 4 : Math.abs(criticalValue)) : Math.abs(criticalValue)) * stdDev},150 ` +
                  altPoints.filter(p => {
                    const z = (p[0] - mean) / stdDev;
                    if (tails === 2) return z > -Math.abs(criticalValue) && z < Math.abs(criticalValue);
                    return h1Direction === 'greater' ? z < criticalValue : z > criticalValue;
                  }).map(p => `L ${p[0]},${p[1]}`).join(' ') +
                  ` L ${mean + (tails === 1 ? (h1Direction === 'greater' ? Math.abs(criticalValue) : 4) : Math.abs(criticalValue)) * stdDev},150 Z`}
                  fill="url(#dotsPattern)" onMouseEnter={() => setHoveredRegion('beta')} onMouseLeave={() => setHoveredRegion(null)} className="cursor-help" stroke="none" />

                {/* Plot Labels for Power Mode - Positioned relative to H1 center */}
                <text x={mean + altMeanZ * stdDev + (altMeanZ >= 0 ? 30 : -30)} y="125" textAnchor="middle" stroke={darkMode ? "#020617" : "#ffffff"} strokeWidth="2" paintOrder="stroke" className="text-[6px] fill-green-500 font-bold bg-white/50 px-1">Power (1-β)</text>
                <text x={mean + altMeanZ * stdDev + (altMeanZ >= 0 ? -30 : 30)} y="145" textAnchor="middle" stroke={darkMode ? "#020617" : "#ffffff"} strokeWidth="2" paintOrder="stroke" className="text-[6px] fill-orange-500 font-bold italic">β (Type II)</text>

                {/* Decision Rule UI Label */}
                <g transform="translate(150, 20)">
                  <rect x="-40" y="-8" width="80" height="12" rx="2" fill="#1e293b" fillOpacity="0.8" />
                  <text textAnchor="middle" className="text-[6px] fill-slate-300 font-black tracking-widest uppercase">
                    Reject if Z {tails === 2 ? '±' : ''}{h1Direction === 'greater' ? '≥' : '≤'} {tails === 2 ? Math.abs(criticalValue).toFixed(3) : criticalValue.toFixed(3)}
                  </text>
                </g>
              </g>
            )}

            {/* p-value shading (Null Curve Area) - Only in P-value Mode */}
            {visualMode === 'p-value' && (
              <g className="transition-all duration-300">
                {tails === 2 ? (
                  <>
                    <path d={`M ${mean + Math.abs(val) * stdDev},150 ` + points.filter(p => p[0] >= mean + Math.abs(val) * stdDev).map(p => `L ${p[0]},${p[1]}`).join(' ') + ` L 300,150 Z`} fill="#4f46e5" fillOpacity="0.3" />
                    <path d={`M 0,150 ` + points.filter(p => p[0] <= mean - Math.abs(val) * stdDev).map(p => `L ${p[0]},${p[1]}`).join(' ') + ` L ${mean - Math.abs(val) * stdDev},150 Z`} fill="#4f46e5" fillOpacity="0.3" />
                  </>
                ) : (
                  h1Direction === 'greater'
                    ? <path d={`M ${mean + Math.max(-4, val) * stdDev},150 ` + points.filter(p => p[0] >= mean + Math.max(-4, val) * stdDev).map(p => `L ${p[0]},${p[1]}`).join(' ') + ` L 300,150 Z`} fill="#4f46e5" fillOpacity="0.3" />
                    : <path d={`M 0,150 ` + points.filter(p => p[0] <= mean + Math.min(4, val) * stdDev).map(p => `L ${p[0]},${p[1]}`).join(' ') + ` L ${mean + Math.min(4, val) * stdDev},150 Z`} fill="#4f46e5" fillOpacity="0.3" />
                )}
              </g>
            )}

            {/* Rejection Regions (Anchored to Null/H0) */}
            <g opacity={getOpacity('tails')} className="transition-all duration-300">
              {tails === 2 ? (
                <>
                  <path d={`M 0,150 ` + points.filter(p => p[0] <= mean - Math.abs(criticalValue) * stdDev).map(p => `L ${p[0]},${p[1]}`).join(' ') + ` L ${mean - Math.abs(criticalValue) * stdDev},150 Z`}
                    fill="#fca5a5" fillOpacity="0.5" onMouseEnter={() => setHoveredRegion('alpha')} onMouseLeave={() => setHoveredRegion(null)} className="cursor-help" />
                  <path d={`M ${mean + Math.abs(criticalValue) * stdDev},150 ` + points.filter(p => p[0] >= mean + Math.abs(criticalValue) * stdDev).map(p => `L ${p[0]},${p[1]}`).join(' ') + ` L 300,150 Z`}
                    fill="#fca5a5" fillOpacity="0.5" onMouseEnter={() => setHoveredRegion('alpha')} onMouseLeave={() => setHoveredRegion(null)} className="cursor-help" />

                  {/* Left Critical Boundary Line */}
                  <line
                    x1={mean - Math.abs(criticalValue) * stdDev} y1="30"
                    x2={mean - Math.abs(criticalValue) * stdDev} y2="150"
                    stroke="#ef4444" strokeWidth="1.5" strokeDasharray="4,2"
                  />
                  {/* Right Critical Boundary Line */}
                  <line
                    x1={mean + Math.abs(criticalValue) * stdDev} y1="30"
                    x2={mean + Math.abs(criticalValue) * stdDev} y2="150"
                    stroke="#ef4444" strokeWidth="1.5" strokeDasharray="4,2"
                  />
                </>
              ) : (
                <>
                  {h1Direction === 'greater'
                    ? <path d={`M ${mean + criticalValue * stdDev},150 ` + points.filter(p => p[0] >= mean + criticalValue * stdDev).map(p => `L ${p[0]},${p[1]}`).join(' ') + ` L 300,150 Z`}
                      fill="#fca5a5" fillOpacity="0.5" onMouseEnter={() => setHoveredRegion('alpha')} onMouseLeave={() => setHoveredRegion(null)} className="cursor-help" />
                    : <path d={`M 0,150 ` + points.filter(p => p[0] <= mean + criticalValue * stdDev).map(p => `L ${p[0]},${p[1]}`).join(' ') + ` L ${mean + criticalValue * stdDev},150 Z`}
                      fill="#fca5a5" fillOpacity="0.5" onMouseEnter={() => setHoveredRegion('alpha')} onMouseLeave={() => setHoveredRegion(null)} className="cursor-help" />
                  }
                  <line
                    x1={mean + criticalValue * stdDev} y1="30"
                    x2={mean + criticalValue * stdDev} y2="150"
                    stroke="#ef4444" strokeWidth="1.5" strokeDasharray="4,2"
                  />
                </>
              )}

              {/* Cutoff Labels & Alpha annotations */}
              {tails === 2 && (
                <g transform={`translate(${mean - Math.abs(criticalValue) * stdDev}, 150)`}>
                  <text y="-125" textAnchor="middle" stroke={darkMode ? "#020617" : "#ffffff"} strokeWidth="2" paintOrder="stroke" className="text-[7px] fill-red-500 font-black">
                    {type === 'z' ? 'z' : 't'}Crit = -{Math.abs(criticalValue).toFixed(2)}
                  </text>
                  <text y="-5" textAnchor="middle" stroke={darkMode ? "#020617" : "#ffffff"} strokeWidth="2" paintOrder="stroke" className="text-[6px] fill-red-500 font-bold italic">α/2={(alpha / 2).toFixed(3)}</text>
                </g>
              )}
              <g transform={`translate(${mean + (tails === 1 && h1Direction === 'less' ? criticalValue : Math.abs(criticalValue)) * stdDev}, 150)`}>
                <text y="-125" textAnchor="middle" stroke={darkMode ? "#020617" : "#ffffff"} strokeWidth="2" paintOrder="stroke" className="text-[7px] fill-red-500 font-black">
                  {type === 'z' ? 'z' : 't'}Crit = {tails === 2 ? '+' : ''}{criticalValue.toFixed(2)}
                </text>
                <text y="-5" textAnchor="middle" stroke={darkMode ? "#020617" : "#ffffff"} strokeWidth="2" paintOrder="stroke" className="text-[6px] fill-red-500 font-bold italic">{tails === 2 ? `α/2=${(alpha / 2).toFixed(3)}` : `α=${alpha}`}</text>
              </g>
            </g>

            {/* Score Marker (Follows Curve) */}
            {(() => {
              // Clamp visual position to +/- 4.0 SD so it stays on the graph line
              const displayVal = Math.max(-4, Math.min(4, val));
              const markerX = mean + displayVal * stdDev;
              const pdfValue = type === 't'
                ? Math.pow(1 + (displayVal * displayVal) / Math.max(0.1, df), -(df + 1) / 2)
                : Math.exp(-0.5 * Math.pow(displayVal, 2));
              const markerY = 150 - (120 * pdfValue);

              if (isNaN(markerX) || isNaN(markerY)) return null;

              return (
                <g
                  opacity={getOpacity('val')}
                  className={`marker-group ${isDragging ? '' : 'transition-opacity duration-200'}`}
                  style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
                >
                  <line
                    x1={markerX} y1={markerY} x2={markerX} y2="150"
                    stroke={isSignificant ? "#dc2626" : "#4f46e5"}
                    strokeWidth="1.5" strokeDasharray="2,2"
                    pointerEvents="none"
                  />
                  <circle
                    cx={markerX}
                    cy={markerY}
                    r="6"
                    fill={isSignificant ? "#dc2626" : "#4f46e5"}
                    stroke={darkMode ? "#020617" : "white"}
                    strokeWidth="2"
                    className="drop-shadow-lg"
                    pointerEvents="none"
                  />
                  {/* Larger Hit Area (Transparent) */}
                  <circle
                    cx={markerX}
                    cy={markerY}
                    r="20"
                    fill="transparent"
                    className="cursor-grab active:cursor-grabbing"
                    onPointerDown={handlePointerDown}
                  />
                  <text
                    x={markerX} y={markerY - 15} textAnchor="middle"
                    stroke={darkMode ? "#020617" : "#ffffff"} strokeWidth="3"
                    paintOrder="stroke"
                    className={`text-[10px] font-black pointer-events-none ${isSignificant ? "fill-red-500" : "fill-indigo-600"}`}
                  >
                    {type === 'z' ? 'z' : 't'} = {val.toFixed(2)}
                  </text>
                </g>
              );
            })()}
          </svg>

          <div className="absolute top-4 right-4 flex flex-col items-end gap-2 text-right">
            <div className={`backdrop-blur-sm border rounded-lg p-2 shadow-sm cursor-pointer transition-colors ${darkMode ? 'bg-slate-900/90 border-slate-800 hover:bg-slate-800' : 'bg-white/90 border-slate-200 hover:bg-slate-50'}`} onClick={() => setShowPModal(true)}>
              <div className={`text-[8px] font-black uppercase tracking-widest mb-1 flex items-center gap-1 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>p-value (Null Area) <HelpCircle size={8} /></div>
              <div className={`text-sm font-black ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>p = {pTail.toFixed(4)}</div>
            </div>

            <div className={`flex p-0.5 rounded-lg border transition-colors ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-200'}`}>
              <button onClick={() => setVisualMode('p-value')} className={`px-2 py-1 rounded text-[8px] font-black uppercase tracking-widest transition-all ${visualMode === 'p-value' ? (darkMode ? 'bg-slate-800 text-indigo-400' : 'bg-white text-indigo-600 shadow-sm') : 'text-slate-400 hover:text-slate-600'}`}>P-Value View</button>
              <button onClick={() => setVisualMode('power')} className={`px-2 py-1 rounded text-[8px] font-black uppercase tracking-widest transition-all ${visualMode === 'power' ? (darkMode ? 'bg-slate-800 text-indigo-400' : 'bg-white text-indigo-600 shadow-sm') : 'text-slate-400 hover:text-slate-600'}`}>Errors/Power</button>
            </div>

            <button onClick={() => setShowPopulation(!showPopulation)} className={`px-2 py-1 rounded text-[8px] font-black uppercase tracking-widest transition-all ${showPopulation ? (darkMode ? 'bg-indigo-500 text-white shadow-lg' : 'bg-indigo-600 text-white shadow-lg') : (darkMode ? 'bg-slate-900 text-slate-500 hover:bg-slate-800' : 'bg-slate-100 text-slate-500 hover:bg-slate-200')}`}>
              {showPopulation ? 'Hide' : 'Show'} Alternative (H₁)
            </button>
          </div>

          {showPopulation && (
            <div className={`absolute top-4 left-4 max-w-[160px] text-[8px] p-2.5 rounded-xl backdrop-blur-md border shadow-2xl animate-in fade-in slide-in-from-left-2 transition-all ${darkMode ? 'bg-slate-900/95 border-slate-800 text-slate-300' : 'bg-slate-800/95 text-white border-slate-700'}`}>
              <div className={`font-black uppercase mb-2 text-[9px] flex items-center gap-2 ${darkMode ? 'text-indigo-400' : 'text-indigo-300'}`}>
                <Info size={10} /> {hoveredRegion ? 'Concept Review' : 'NHST Model View'}
              </div>

              {!hoveredRegion ? (
                <>
                  <p className="mb-2"><strong className={darkMode ? 'text-slate-100' : 'text-white'}>Solid Curve:</strong> Null Distribution ($H_0$). Assumes no effect.</p>
                  <p><strong className={darkMode ? 'text-slate-100' : 'text-white'}>Dashed Curve:</strong> Alternative distribution ($H_1$).</p>

                  {visualMode === 'power' && (
                    <div className={`mt-2 pt-2 border-t ${darkMode ? 'border-slate-800' : 'border-slate-700'}`}>
                      <div className="flex justify-between items-center mb-1">
                        <div className={`text-[7px] font-black uppercase tracking-tighter ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Hypothesized Effect (Cohen's d)</div>
                        <div className="text-[7px] font-bold text-indigo-400">{targetEffect.toFixed(2)}</div>
                      </div>
                      <input
                        type="range" min="0" max="1.2" step="0.05"
                        value={targetEffect}
                        onChange={(e) => setTargetEffect(parseFloat(e.target.value))}
                        className={`w-full h-1 rounded-lg appearance-none cursor-pointer accent-indigo-500 mb-1 ${darkMode ? 'bg-slate-800' : 'bg-slate-900'}`}
                      />
                      <div className={`flex justify-between text-[4.5px] font-bold uppercase px-0.5 ${darkMode ? 'text-slate-600' : 'text-slate-500'}`}>
                        <span className={targetEffect === 0 ? 'text-indigo-400' : ''}>Zero</span>
                        <span className={Math.abs(targetEffect - 0.2) < 0.05 ? 'text-indigo-400' : ''}>Small (0.2)</span>
                        <span className={Math.abs(targetEffect - 0.5) < 0.05 ? 'text-indigo-400' : ''}>Med (0.5)</span>
                        <span className={Math.abs(targetEffect - 0.8) < 0.05 ? 'text-indigo-400' : ''}>Large (0.8)</span>
                      </div>
                    </div>
                  )}

                  {tails === 2 && (
                    <div className={`mt-2 pt-2 border-t ${darkMode ? 'border-slate-800' : 'border-slate-700'}`}>
                      <div className={`text-[7px] font-black uppercase mb-1 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Plot Direction</div>
                      <div className={`flex p-0.5 rounded border ${darkMode ? 'bg-slate-950/50 border-slate-800' : 'bg-slate-900/50 border-slate-700'}`}>
                        <button onClick={() => setAltH1Dir('greater')} className={`flex-1 py-1 rounded text-[7px] font-bold ${altH1Dir === 'greater' ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}>+δ</button>
                        <button onClick={() => setAltH1Dir('less')} className={`flex-1 py-1 rounded text-[7px] font-bold ${altH1Dir === 'less' ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}>-δ</button>
                        <button onClick={() => setShowBothH1(!showBothH1)} className={`px-1 py-1 rounded text-[7px] font-bold ${showBothH1 ? 'text-indigo-400' : 'text-slate-600'}`}>Both</button>
                      </div>
                    </div>
                  )}

                  {visualMode === 'power' && (
                    <div className={`mt-2 pt-2 border-t space-y-1 ${darkMode ? 'border-slate-800' : 'border-slate-600'}`}>
                      <p className="flex items-center gap-1.5"><span className="w-2 h-2 bg-green-500 rounded-sm"></span> <strong className={darkMode ? 'text-slate-100' : 'text-white'}>Power ($1-\beta$):</strong> Correct rejection.</p>
                      <p className="flex items-center gap-1.5"><span className="w-2 h-2 bg-orange-500 rounded-sm"></span> <strong className={darkMode ? 'text-slate-100' : 'text-white'}>Beta ($\beta$):</strong> Type II Error.</p>
                      <p className="flex items-center gap-1.5"><span className="w-2 h-2 bg-red-400 rounded-sm"></span> <strong className={darkMode ? 'text-slate-100' : 'text-white'}>Alpha ($\alpha$):</strong> Type I Error.</p>
                    </div>
                  )}
                  <div className={`mt-2 text-[7px] italic ${darkMode ? 'text-slate-600' : 'text-slate-400'}`}>Hover over shaded regions for details.</div>
                </>
              ) : (
                <div className="animate-in fade-in zoom-in-95 duration-200">
                  {hoveredRegion === 'alpha' && (
                    <p><strong className="text-red-400">Alpha (Type I Error):</strong> The probability of rejecting the Null Hypothesis when it is actually true (False Positive).</p>
                  )}
                  {hoveredRegion === 'beta' && (
                    <p><strong className="text-orange-400">Beta (Type II Error):</strong> The probability of failing to reject the Null Hypothesis when a true effect actually exists (False Negative).</p>
                  )}
                  {hoveredRegion === 'power' && (
                    <p><strong className="text-green-400">Power (1-Beta):</strong> The probability of correctly rejecting the Null Hypothesis if there is a real effect in the population.</p>
                  )}
                </div>
              )}
            </div>
          )}

          {showPModal && (
            <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setShowPModal(false)}>
              <div className={`rounded-xl shadow-2xl p-6 max-w-xs border animate-in zoom-in duration-200 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`} onClick={e => e.stopPropagation()}>
                <div className="text-xs font-black text-indigo-500 uppercase mb-2">What is a p-value?</div>
                <p className={`text-xs leading-relaxed italic ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                  "The probability of observing a result at least this extreme, assuming the Null Hypothesis ($H_0$) is true."
                </p>
                <div className={`mt-4 text-[10px] font-medium ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>It is NOT the probability that the null is false. It is area under the null curve beyond your score.</div>
                <button onClick={() => setShowPModal(false)} className={`mt-6 w-full py-2 text-xs font-black rounded-lg transition-colors ${darkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}`}>Got it</button>
              </div>
            </div>
          )}
        </div>

        <div className={`w-full p-4 rounded-b-lg border-x border-b space-y-4 shadow-xl relative z-10 transition-colors ${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-900 text-white border-slate-800'}`}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="space-y-1.5 col-span-1">
              <label className={`text-[9px] font-black uppercase tracking-widest block ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Significance (α)</label>
              <div className={`flex p-1 rounded-lg border ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-800 border-slate-700'}`}>
                {[0.10, 0.05, 0.01].map(a => (
                  <button key={a} onClick={() => setAlpha(a)} className={`flex-1 py-1 rounded text-[10px] font-bold transition-all ${alpha === a ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>{a}</button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5 col-span-1">
              <label className={`text-[9px] font-black uppercase tracking-widest block ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Tails</label>
              <div className={`flex p-1 rounded-lg border ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-800 border-slate-700'}`}>
                {[1, 2].map(t => (
                  <button key={t} onClick={() => { setTails(t); if (t === 2) setH1Direction('greater') }} className={`flex-1 py-1 rounded text-[10px] font-bold transition-all ${tails === t ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>{t}</button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5 col-span-1">
              <label className={`text-[9px] font-black uppercase tracking-widest block ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Precision</label>
              <div className={`flex p-1 rounded-lg border ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-800 border-slate-700'}`}>
                {[2, 3].map(p => (
                  <button key={p} onClick={() => setPrecision(p)} className={`flex-1 py-1 rounded text-[10px] font-bold transition-all ${precision === p ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>{p} dec</button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5 col-span-1">
              <label className={`text-[9px] font-black uppercase tracking-widest block ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Estimation</label>
              <button onClick={() => setShowCI(!showCI)} className={`w-full py-2 rounded-lg text-[10px] font-black uppercase transition-all ${showCI ? 'bg-indigo-600 text-white shadow-lg' : (darkMode ? 'bg-slate-950 text-slate-500 border border-slate-800 hover:text-slate-300' : 'bg-slate-800 text-slate-500 border border-slate-700 hover:text-slate-300')}`}>
                {showCI ? 'Hide CI' : 'Show 95% CI'}
              </button>
            </div>
          </div>

          {type === 't' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end pt-2 animate-in slide-in-from-top-2">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className={`text-[9px] font-black uppercase tracking-widest block ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Degrees of Freedom (df = {df})</label>
                  <div className="flex gap-1">
                    {[2, 5, 10, 100].map(d => (
                      <button key={d} onClick={() => setDf(d)} className={`px-2 py-0.5 rounded text-[8px] font-bold border transition-colors ${df === d ? 'bg-indigo-600 border-indigo-500 text-white' : 'border-slate-700 text-slate-500 hover:text-slate-300'}`}>{d === 100 ? '∞' : d}</button>
                    ))}
                  </div>
                </div>
                <input type="range" min="1" max="100" step="1" value={df} onChange={(e) => setDf(parseInt(e.target.value))} className="w-full h-1.5 bg-slate-800 rounded-full appearance-none cursor-pointer accent-indigo-500" />
                <div className={`text-[8px] font-medium leading-relaxed ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                  {df < 10 ? <span><Sparkles className="inline w-3 h-3 mr-1 text-amber-500" /> <b>Tip:</b> Watch how low $df$ makes the tails much "heavier" (higher).</span> : "Notice how the T-distribution looks more like the Z-distribution as $df$ increases."}
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowTailGap(!showTailGap)}
                  className={`flex-1 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all border ${showTailGap ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-slate-800 border-slate-700 text-slate-500 hover:text-slate-300'}`}
                >
                  {showTailGap ? 'Hide Normal Overlay' : 'Show Tail Gap'}
                </button>
                <div className={`flex-1 p-2 rounded-lg bg-slate-950/50 border border-slate-800 transition-opacity ${showTailGap ? 'opacity-100' : 'opacity-40'}`}>
                  <div className="text-[7px] font-black text-indigo-400 uppercase mb-1">Gap Explanation</div>
                  <div className="text-[8px] text-slate-400 leading-tight">The gap shows how much additional area is in the T-tails vs Normal tails.</div>
                </div>
              </div>
            </div>
          )}

          {tails === 1 && (
            <div className="animate-in fade-in slide-in-from-top-1 duration-200">
              <label className={`text-[9px] font-black uppercase tracking-widest block mb-2 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Hypothesis Direction (H₁)</label>
              <div className={`flex p-1 rounded-lg border max-w-[300px] ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-800 border-slate-700'}`}>
                <button
                  onClick={() => setH1Direction('greater')}
                  className={`flex-1 py-1.5 rounded text-[10px] font-bold transition-all ${h1Direction === 'greater' ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}
                >
                  μ &gt; μ₀ (Right Tail)
                </button>
                <button
                  onClick={() => setH1Direction('less')}
                  className={`flex-1 py-1.5 rounded text-[10px] font-bold transition-all ${h1Direction === 'less' ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}
                >
                  μ &lt; μ₀ (Left Tail)
                </button>
              </div>
            </div>
          )}


          <div className={`pt-2 border-t flex flex-col gap-4 ${darkMode ? 'border-slate-800' : 'border-slate-800'}`}>
            <div className={`flex justify-between items-center p-1.5 rounded-lg border ${darkMode ? 'bg-slate-950/50 border-slate-800' : 'bg-slate-800/50 border-slate-700'}`}>
              <div className={`text-[8px] font-black uppercase tracking-widest px-2 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Input Mode</div>
              <div className="flex gap-1">
                <button onClick={() => setCalcMode(false)} className={`px-3 py-1 rounded text-[8px] font-black uppercase tracking-widest transition-all ${!calcMode ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}>Direct Z-Score</button>
                <button onClick={() => setCalcMode(true)} className={`px-3 py-1 rounded text-[8px] font-black uppercase tracking-widest transition-all ${calcMode ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}>Step-by-Step Calculator</button>
              </div>
            </div>

            {!calcMode ? (
              <div className="flex flex-col md:flex-row gap-4 items-center animate-in fade-in slide-in-from-bottom-1 duration-200">
                <div className="flex-1 w-full space-y-2">
                  <div className="flex justify-between items-center">
                    <span className={`text-[9px] font-black uppercase tracking-widest flex items-center gap-2 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                      Calculated {type === 'z' ? 'z' : 't'}-score
                      <span className="text-[7px] text-slate-500 lowercase font-normal italic">(Reject H₀ if p ≤ α)</span>
                    </span>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded ${isSignificant ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'}`}>{isSignificant ? "Significant" : "Not Significant"}</span>
                  </div>
                  <input type="range" min="-4" max="4" step="0.01" value={val} onChange={(e) => setVal(parseFloat(e.target.value))} className={`w-full h-1.5 rounded-full appearance-none cursor-pointer ${isSignificant ? 'bg-red-400/30 accent-red-500' : 'bg-indigo-400/30 accent-indigo-500'}`} />
                </div>
                <div className="w-full md:w-32 space-y-1.5">
                  <label className={`text-[9px] font-black uppercase tracking-widest block ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Manual Input</label>
                  <input type="number" step="0.01" value={val} onChange={(e) => setVal(parseFloat(e.target.value) || 0)} className={`w-full border rounded p-1.5 text-xs font-bold text-center focus:outline-none focus:border-indigo-500 transition-colors ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-800 border-slate-700'}`} />
                </div>
              </div>
            ) : (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex gap-2 p-1 bg-slate-900 rounded-lg border border-slate-800 w-fit">
                  <button onClick={() => setDataInputMode('summary')} className={`px-3 py-1 rounded text-[8px] font-black uppercase tracking-widest transition-all ${dataInputMode === 'summary' ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}>Summary Stats</button>
                  <button onClick={() => setDataInputMode('raw')} className={`px-3 py-1 rounded text-[8px] font-black uppercase tracking-widest transition-all ${dataInputMode === 'raw' ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}>Paste Data</button>
                </div>

                {dataInputMode === 'raw' && (
                  <div className="space-y-2 animate-in zoom-in-95 duration-200">
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Enter Raw Data</span>
                      <span className="text-[7px] text-slate-500 italic">Separated by commas, spaces, or lines</span>
                    </div>
                    <textarea
                      value={rawData}
                      onChange={(e) => { setRawData(e.target.value); parseRawData(e.target.value); }}
                      placeholder="Example: 10, 12, 14, 16..."
                      className={`w-full h-20 p-3 rounded-xl border text-xs font-mono focus:outline-none focus:border-indigo-500 transition-all ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-slate-800 border-slate-700 text-white'}`}
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: 'Sample Mean (x̄)', key: 'xBar' },
                    { label: 'Hyp. Mean (μ)', key: 'mu' },
                    { label: 'Pop. SD (σ)', key: 'sigma' },
                    { label: 'Sample Size (n)', key: 'n' }
                  ].map(param => (
                    <div key={param.key} className={`border p-2 rounded-xl flex flex-col gap-1 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-900 border-slate-700'}`}>
                      <span className="text-[7px] font-black text-indigo-400 uppercase tracking-widest">{param.label}</span>
                      <input
                        type="number"
                        value={calcData[param.key]}
                        onChange={(e) => setCalcData({ ...calcData, [param.key]: parseFloat(e.target.value) || 0 })}
                        className="bg-transparent text-white text-xs font-black focus:outline-none"
                      />
                    </div>
                  ))}
                  <div className={`col-span-2 md:col-span-4 border p-2 rounded-xl flex justify-between items-center overflow-hidden relative ${darkMode ? 'bg-indigo-500/10 border-indigo-500/30' : 'bg-indigo-500/10 border-indigo-500/30'}`}>
                    <div className="flex gap-4 items-center">
                      <div className="flex flex-col">
                        <span className="text-[6px] text-indigo-400 uppercase font-bold">Standard Error (SE)</span>
                        <span className="text-xs font-black text-indigo-300">{stdError.toFixed(3)}</span>
                      </div>
                      <div className="h-4 w-[1px] bg-indigo-500/30" />
                      <div className="flex flex-col">
                        <span className="text-[6px] text-indigo-400 uppercase font-bold">Computed {type === 'z' ? 'Z' : 'T'}</span>
                        <span className="text-xs font-black text-white">{val}</span>
                      </div>
                    </div>
                    <div className={`text-[10px] font-black px-3 py-1 rounded-lg ${isSignificant ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' : 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'}`}>
                      {isSignificant ? "REJECT H₀" : "FAIL TO REJECT"}
                    </div>
                    <div className="absolute -right-2 -bottom-2 opacity-5">
                      <Calculator size={48} className="text-white" />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Report & Stats Footer */}
          <div className={`pt-4 border-t flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2 duration-500 ${darkMode ? 'border-slate-800' : 'border-slate-800'}`}>
            <div className="flex flex-wrap gap-4">
              {calcMode && (
                <>
                  <div className={`p-2.5 rounded-xl border flex flex-col animate-in slide-in-from-left-2 transition-all ${darkMode ? 'bg-slate-950/40 border-slate-800' : 'bg-slate-800/40 border-slate-700/50'}`}>
                    <span className="text-[8px] font-black text-indigo-400 uppercase mb-1">Effect Size (Cohen's d)</span>
                    <span className="text-xs font-black text-white">{cohenD.toFixed(precision)}</span>
                  </div>
                  <div className={`p-2.5 rounded-xl border flex flex-col animate-in slide-in-from-left-3 transition-all ${darkMode ? 'bg-slate-950/40 border-slate-800' : 'bg-slate-800/40 border-slate-700/50'}`}>
                    <span className="text-[8px] font-black text-indigo-400 uppercase mb-1">Mean Difference (Δ)</span>
                    <span className="text-xs font-black text-white">{delta.toFixed(precision)}</span>
                  </div>
                </>
              )}
              {showCI && (
                <div className="bg-indigo-600/20 p-3 rounded-2xl border border-indigo-500/40 flex flex-col animate-in zoom-in-95 group relative overflow-hidden transition-all hover:bg-indigo-600/30">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex flex-col">
                      <span className="text-[8px] font-black text-indigo-300 uppercase leading-none mb-1">{(1 - alpha) * 100}% Confidence Interval</span>
                      <span className="text-[7px] text-indigo-400/60 font-bold uppercase tracking-tighter">True Population Mean (μ)</span>
                    </div>
                    <select
                      value={ciType}
                      onChange={(e) => setCiType(e.target.value)}
                      className="bg-indigo-500/30 text-[7px] font-black uppercase text-indigo-100 rounded px-1.5 py-0.5 border border-indigo-500/40 outline-none focus:ring-1 ring-indigo-400 transition-all cursor-pointer"
                    >
                      <option value="two-sided">Two-Sided</option>
                      <option value="one-sided">One-Sided</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-black text-white tracking-tight">[{ciLower === -Infinity ? '-∞' : ciLower.toFixed(precision)}, {ciUpper === Infinity ? '∞' : ciUpper.toFixed(precision)}]</span>
                    {tails === 1 && (
                      <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-indigo-500/40 border border-indigo-400/30">
                        <Info size={8} className="text-indigo-200" />
                        <span className="text-[6px] font-black text-indigo-200 uppercase leading-none">Two-sided CI shown (common convention). One-tailed tests correspond to a one-sided bound.</span>
                      </div>
                    )}
                  </div>
                  <div className="absolute -right-2 -bottom-2 opacity-10 rotate-12">
                    <TrendingUp size={40} className="text-indigo-400" />
                  </div>
                </div>
              )}
            </div>

            <div className={`rounded-xl border p-3 flex flex-col md:flex-row justify-between items-center gap-4 group transition-colors ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
              <div className={`text-[10px] font-mono break-all leading-relaxed max-w-[80%] ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                <span className="text-indigo-500 font-bold tracking-widest mr-2 uppercase text-[8px]">Report Line</span>
                {reportString}
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(reportString);
                  const btn = document.activeElement;
                  if (btn) { btn.innerText = "COPIED!"; setTimeout(() => btn.innerText = "COPY REPORT", 2000); }
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-[9px] font-black uppercase tracking-widest rounded-lg transition-all shadow-lg active:scale-95 whitespace-nowrap"
              >
                COPY REPORT
              </button>
            </div>
          </div>

          {/* Tutor Integration (moved to App for better layout) */}
        </div>
      </div>
    </div>
  );
};

// B. Independent Samples T-Test Visual

export default NormalDistributionVisual;
