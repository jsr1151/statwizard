import React, { useState, useEffect, useMemo, useRef } from 'react';
import { AlertCircle, Sparkles, Calculator, MousePointer2, Info, ArrowDown, MousePointerClick, Maximize2, Minimize2, RefreshCw, Play, ChevronsRight, ChevronUp, ChevronDown, Activity, Lightbulb, BrainCircuit, BarChart2, Sigma, BookOpen, Plus, X, Trash2, Edit2, TrendingUp, Grid, FileText, PieChart } from 'lucide-react';
import { getGaussianPoints, getTPoints, normalCDF, tCDF, erf, getTCrit, getFDensity, fCDF, fPPF, getFCrit, getFPoints, calculateAnova, calculatePostHoc, lnGamma, beta } from '../../utils/mathHelpers';
import { pointsToPath, pointsToLine, getOrdinal } from '../../utils/svgHelpers';
import useTutor from '../../hooks/useTutor';
import TutorPanel from '../tutor/TutorPanel';
import CalculationText from '../common/CalculationText';
import TabButton from '../common/TabButton';
const VariabilityVisual = ({ darkMode }) => {
  const [spread, setSpread] = useState(2);
  const [activeRules, setActiveRules] = useState(['1sd', '2sd', '3sd']); // All enabled by default
  const [hoverRegion, setHoverRegion] = useState(null);

  const mean = 150;
  const stdDev = 15 * spread;
  const heightScale = 140;

  const points = useMemo(() => getGaussianPoints(mean, stdDev, heightScale), [spread]);
  const curvePath = pointsToPath(points);

  const toggleRule = (rule) => {
    setActiveRules(prev => prev.includes(rule) ? prev.filter(r => r !== rule) : [...prev, rule]);
  };

  const getShadedRegion = (zScore) => {
    const limit = zScore * stdDev;
    const regionPoints = points.filter(p => p[0] >= mean - limit && p[0] <= mean + limit);
    if (regionPoints.length === 0) return "";
    const startX = regionPoints[0][0];
    const endX = regionPoints[regionPoints.length - 1][0];
    return `M ${startX},150 L ` + regionPoints.map(p => `${p[0]},${p[1]}`).join(' L ') + ` L ${endX},150 Z`;
  };

  const getRegionText = (z) => {
    if (z === 1) return "68% of data falls within ±1 SD";
    if (z === 2) return "95% of data falls within ±2 SD";
    if (z === 3) return "99.7% of data falls within ±3 SD";
    return "";
  };

  return (
    <div className="w-full flex flex-col items-center">
      <div className={`w-full h-64 relative border rounded-lg p-4 flex flex-col items-center justify-center select-none overflow-hidden group transition-colors ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
        <h4 className={`absolute top-2 text-[10px] font-bold text-center uppercase tracking-widest transition-colors ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Visualizing Standard Deviation (σ)</h4>

        <svg viewBox="0 0 300 160" className="w-full h-full overflow-visible mt-4">
          {activeRules.includes('3sd') && <path d={getShadedRegion(3)} fill={darkMode ? "#1e293b" : "#a5b4fc"} stroke="none" opacity="0.4" onMouseEnter={() => setHoverRegion(3)} onMouseLeave={() => setHoverRegion(null)} className="cursor-pointer hover:opacity-60 transition-opacity" />}
          {activeRules.includes('2sd') && <path d={getShadedRegion(2)} fill={darkMode ? "#312e81" : "#6366f1"} stroke="none" opacity="0.5" onMouseEnter={() => setHoverRegion(2)} onMouseLeave={() => setHoverRegion(null)} className="cursor-pointer hover:opacity-70 transition-opacity" />}
          {activeRules.includes('1sd') && <path d={getShadedRegion(1)} fill="#4338ca" stroke="none" opacity="0.6" onMouseEnter={() => setHoverRegion(1)} onMouseLeave={() => setHoverRegion(null)} className="cursor-pointer hover:opacity-80 transition-opacity" />}

          <path d={curvePath} fill="none" stroke="#4f46e5" strokeWidth="3" className="transition-all duration-300 ease-out" />
          <line x1="0" y1="150" x2="300" y2="150" stroke={darkMode ? "#334155" : "#94a3b8"} strokeWidth="1" />

          <g className={`text-[9px] font-mono transition-all duration-300 ${darkMode ? 'fill-slate-500' : 'fill-slate-500'}`}>
            <text x="150" y="165" textAnchor="middle" className="font-bold">μ</text>
            <line x1="150" y1="150" x2="150" y2="155" stroke={darkMode ? "#334155" : "#94a3b8"} />
            {[1, 2, 3].map(i => (
              <React.Fragment key={i}>
                <text x={150 + stdDev * i} y="165" textAnchor="middle">+{i}σ</text>
                <line x1={150 + stdDev * i} y1="150" x2={150 + stdDev * i} y2="155" stroke={darkMode ? "#334155" : "#94a3b8"} />
                <text x={150 - stdDev * i} y="165" textAnchor="middle">-{i}σ</text>
                <line x1={150 - stdDev * i} y1="150" x2={150 - stdDev * i} y2="155" stroke={darkMode ? "#334155" : "#94a3b8"} />
              </React.Fragment>
            ))}
          </g>
        </svg>

        {hoverRegion && (
          <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-xs p-2 rounded shadow-lg z-20 pointer-events-none transition-colors ${darkMode ? 'bg-indigo-900 border border-indigo-700 text-indigo-100' : 'bg-slate-800 text-white'}`}>
            {getRegionText(hoverRegion)}
          </div>
        )}

        <div className="absolute top-8 right-4 flex flex-col gap-1">
          <button onClick={() => toggleRule('1sd')} className={`text-[10px] px-2 py-1 rounded border transition-colors ${activeRules.includes('1sd') ? 'bg-indigo-600 text-white border-indigo-700' : (darkMode ? 'bg-slate-900 text-slate-500 border-slate-800' : 'bg-white text-slate-500 hover:bg-slate-50')}`}>68% (1σ)</button>
          <button onClick={() => toggleRule('2sd')} className={`text-[10px] px-2 py-1 rounded border transition-colors ${activeRules.includes('2sd') ? 'bg-indigo-500 text-white border-indigo-600' : (darkMode ? 'bg-slate-900 text-slate-500 border-slate-800' : 'bg-white text-slate-500 hover:bg-slate-50')}`}>95% (2σ)</button>
          <button onClick={() => toggleRule('3sd')} className={`text-[10px] px-2 py-1 rounded border transition-colors ${activeRules.includes('3sd') ? 'bg-indigo-400 text-white border-indigo-500' : (darkMode ? 'bg-slate-900 text-slate-500 border-slate-800' : 'bg-white text-slate-500 hover:bg-slate-50')}`}>99.7% (3σ)</button>
        </div>
      </div>

      <div className={`w-full p-4 rounded-b-lg border-x border-b transition-colors ${darkMode ? 'bg-slate-900/50 border-slate-800 shadow-indigo-500/5' : 'bg-slate-50 border-slate-200'}`}>
        <div className="flex flex-col gap-2">
          <div className={`flex justify-between items-center text-xs font-bold uppercase ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
            <span>Low Variability</span>
            <span>High Variability</span>
          </div>
          <input type="range" min="1" max="3.5" step="0.1" value={spread} onChange={(e) => setSpread(parseFloat(e.target.value))} className={`w-full h-2 rounded-lg appearance-none cursor-pointer accent-indigo-600 ${darkMode ? 'bg-slate-800' : 'bg-indigo-200'}`} />
        </div>
      </div>
    </div>
  );
};


export default VariabilityVisual;
