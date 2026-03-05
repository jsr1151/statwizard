import React, { useState, useEffect, useMemo, useRef } from 'react';
import { AlertCircle, Sparkles, Calculator, MousePointer2, Info, ArrowDown, MousePointerClick, Maximize2, Minimize2, RefreshCw, Play, ChevronsRight, ChevronUp, ChevronDown, Activity, Lightbulb, BrainCircuit, BarChart2, Sigma, BookOpen, Plus, X, Trash2, Edit2, TrendingUp, Grid, FileText, PieChart } from 'lucide-react';
import { getGaussianPoints, getTPoints, normalCDF, tCDF, erf, getTCrit, getFDensity, fCDF, fPPF, getFCrit, getFPoints, calculateAnova, calculatePostHoc, lnGamma, beta } from '../../utils/mathHelpers';
import { pointsToPath, pointsToLine, getOrdinal } from '../../utils/svgHelpers';
import useTutor from '../../hooks/useTutor';
import TutorPanel from '../tutor/TutorPanel';
import CalculationText from '../common/CalculationText';
import TabButton from '../common/TabButton';
const ShapeVisual = ({ darkMode }) => {
  const [skew, setSkew] = useState(0);
  const [kurtosis, setKurtosis] = useState(0);
  const [showMarkers, setShowMarkers] = useState(false);
  const stdDev = 40;
  const mean = 150;

  const getSkewKurtPoints = () => {
    const pts = [];
    const effectiveSD = stdDev * (1 - (kurtosis * 0.4));
    const effectiveHeight = 120 * (1 + (kurtosis * 0.5));
    const alpha = skew * 5;
    for (let x = 0; x <= 300; x += 2) {
      const z = (x - mean) / effectiveSD;
      let pdf = Math.exp(-0.5 * z * z);
      if (Math.abs(alpha) > 0.01) {
        const cdfApprox = 1 / (1 + Math.exp(-1.7 * alpha * z));
        pdf = pdf * 2 * cdfApprox;
      }
      const y = effectiveHeight * pdf;
      pts.push([x, 150 - y]);
    }
    return pts;
  };

  const points = getSkewKurtPoints();
  const path = pointsToPath(points);

  const markers = useMemo(() => {
    if (!showMarkers) return [];

    const alpha = skew * 5;
    const delta = alpha / Math.sqrt(1 + alpha * alpha);
    const effectiveSD = stdDev * (1 - (kurtosis * 0.4));

    // Theoretical Skew Normal properties (approx)
    const theoreticalMean = mean + effectiveSD * delta * Math.sqrt(2 / Math.PI);

    // Mode calculation (approximate peak finder)
    let maxVal = -1;
    let modeX = mean;
    points.forEach(([px, py]) => {
      const val = 150 - py;
      if (val > maxVal) {
        maxVal = val;
        modeX = px;
      }
    });

    // Median approx: roughly between mean and mode
    const theoreticalMedian = theoreticalMean - (effectiveSD * delta * 0.2);

    return [
      { label: 'Mode', x: modeX, color: '#f59e0b' },
      { label: 'Median', x: theoreticalMedian, color: '#10b981' },
      { label: 'Mean', x: theoreticalMean, color: '#6366f1' }
    ];
  }, [showMarkers, skew, kurtosis, points, mean, stdDev]);

  return (
    <div className="w-full flex flex-col items-center">
      <div className={`w-full h-64 relative border rounded-lg p-4 select-none flex items-center justify-center overflow-hidden transition-colors ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
        <h4 className={`absolute top-2 text-[10px] font-bold text-center uppercase tracking-widest transition-colors ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Shape Simulator</h4>

        <div className="absolute top-2 right-2 z-10">
          <button
            onClick={() => setShowMarkers(!showMarkers)}
            className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-tighter transition-all flex items-center gap-1.5 ${showMarkers ? 'bg-indigo-600 text-white' : (darkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-200 text-slate-600')}`}
          >
            <Activity className="w-3 h-3" /> {showMarkers ? 'Hide Markers' : 'Show Central Tendency'}
          </button>
        </div>

        <svg viewBox="0 0 300 160" className="w-full h-full overflow-visible mt-2">
          <line x1="0" y1="150" x2="300" y2="150" stroke={darkMode ? "#334155" : "#94a3b8"} strokeWidth="2" />

          {/* Normal Curve Reference */}
          <path d={pointsToPath(getGaussianPoints(150, 40, 120))} fill="none" stroke={darkMode ? "#334155" : "#94a3b8"} strokeWidth="1" strokeDasharray="4" opacity="0.3" />

          {/* Actual Distribution */}
          <path d={path} fill={darkMode ? "rgba(99, 102, 241, 0.05)" : "rgba(99, 102, 241, 0.1)"} stroke="#4f46e5" strokeWidth="3" className="transition-all duration-100 ease-out" />

          {/* Markers */}
          {markers.map((m, i) => (
            <g key={i} className="transition-all duration-300">
              <line
                x1={m.x} y1="150" x2={m.x} y2="10"
                stroke={m.color}
                strokeWidth="2"
                strokeDasharray="4 2"
                className="opacity-60"
              />
              <text
                x={m.x} y="8"
                textAnchor="middle"
                fill={m.color}
                className="text-[7px] font-black uppercase tracking-tighter"
              >
                {m.label}
              </text>
            </g>
          ))}
        </svg>
      </div>
      <div className={`w-full p-4 rounded-b-lg border-x border-b space-y-4 transition-colors ${darkMode ? 'bg-slate-900 border-slate-800 shadow-indigo-500/5' : 'bg-slate-50 border-slate-200'}`}>
        <div className="grid grid-cols-2 gap-6">
          <div className="flex flex-col gap-1">
            <div className={`flex justify-between items-center text-xs font-bold uppercase ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}><span>Skewness</span></div>
            <input type="range" min="-1" max="1" step="0.1" value={skew} onChange={(e) => setSkew(parseFloat(e.target.value))} className={`w-full h-2 rounded-lg appearance-none cursor-pointer accent-indigo-600 ${darkMode ? 'bg-slate-800' : 'bg-indigo-200'}`} />
            <div className={`flex justify-between text-[10px] ${darkMode ? 'text-slate-600' : 'text-slate-400'}`}><span>Neg (-1)</span><span>0</span><span>Pos (+1)</span></div>
          </div>
          <div className="flex flex-col gap-1">
            <div className={`flex justify-between items-center text-xs font-bold uppercase ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}><span>Kurtosis</span></div>
            <input type="range" min="-1" max="1" step="0.1" value={kurtosis} onChange={(e) => setKurtosis(parseFloat(e.target.value))} className={`w-full h-2 rounded-lg appearance-none cursor-pointer accent-emerald-600 ${darkMode ? 'bg-slate-800' : 'bg-emerald-200'}`} />
            <div className={`flex justify-between text-[10px] ${darkMode ? 'text-slate-600' : 'text-slate-400'}`}><span>Flat (-1)</span><span>0</span><span>Tall (+1)</span></div>
          </div>
        </div>
        <div className={`p-3 rounded text-xs border transition-colors ${darkMode ? 'bg-amber-950/20 border-amber-900/30 text-amber-200/70' : 'bg-amber-50 text-amber-900 border-amber-100'}`}>
          <strong className={darkMode ? 'text-amber-500' : ''}>Rules of Thumb:</strong><br />
          • <strong>Central Tendency:</strong> In a normal curve, Mean = Median = Mode. As skew increases, the Mean is pulled furthest toward the tail.<br />
          • <strong>Skewness:</strong> &gt; ±1.0 is considered highly skewed. ±0.5 is moderately skewed.<br />
          • <strong>Kurtosis:</strong> Excess kurtosis &gt; 1.0 (Leptokurtic/Tall) or &lt; -1.0 (Platykurtic/Flat) indicates non-normality.
        </div>
      </div>
    </div>
  );
};

// F. Frequency Visual (Generative)

export default ShapeVisual;
