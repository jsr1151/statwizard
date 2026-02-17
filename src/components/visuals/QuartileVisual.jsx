import React, { useState, useEffect, useMemo, useRef } from 'react';
import { AlertCircle, Sparkles, Calculator, MousePointer2, Info, ArrowDown, MousePointerClick, Maximize2, Minimize2, RefreshCw, Play, ChevronsRight, ChevronUp, ChevronDown, Activity, Lightbulb, BrainCircuit, BarChart2, Sigma, BookOpen, Plus, X, Trash2, Edit2, TrendingUp, Grid, FileText, PieChart } from 'lucide-react';
import { getGaussianPoints, getTPoints, normalCDF, tCDF, erf, getTCrit, getFDensity, fCDF, fPPF, getFCrit, getFPoints, calculateAnova, calculatePostHoc, lnGamma, beta } from '../../utils/mathHelpers';
import { pointsToPath, pointsToLine, getOrdinal } from '../../utils/svgHelpers';
import useTutor from '../../hooks/useTutor';
import TutorPanel from '../tutor/TutorPanel';
import CalculationText from '../common/CalculationText';
import TabButton from '../common/TabButton';
const QuartileVisual = ({ darkMode }) => {
  const [mode, setMode] = useState('quartile');
  const [hoverSlice, setHoverSlice] = useState(null);
  const [showIQR, setShowIQR] = useState(false);
  const [showBoxPlot, setShowBoxPlot] = useState(false);
  const [showOutliers, setShowOutliers] = useState(false);
  const [percentileVal, setPercentileVal] = useState(50);

  const mean = 150;
  const stdDev = 40;
  const points = useMemo(() => getGaussianPoints(mean, stdDev, 130), []);
  const curvePath = pointsToPath(points);
  const totalArea = points.reduce((acc, val) => acc + (150 - val[1]), 0);

  const getXForPercentile = (p) => {
    let currentArea = 0;
    const targetArea = totalArea * (p / 100);
    for (let i = 0; i < points.length; i++) {
      currentArea += (150 - points[i][1]);
      if (currentArea >= targetArea) return points[i][0];
    }
    return 300;
  };

  const q1X = getXForPercentile(25);
  const q3X = getXForPercentile(75);
  const medianX = getXForPercentile(50);

  const renderSlices = () => {
    if (mode === 'percentile') {
      const x = getXForPercentile(percentileVal);
      const regionPath = `M 0,150 ` + points.filter(pt => pt[0] <= x).map(pt => `L ${pt[0]},${pt[1]}`).join(' ') + ` L ${x},150 Z`;
      return (
        <g>
          <path d={regionPath} fill={darkMode ? "#4338ca" : "#818cf8"} opacity="0.5" />
          <line x1={x} y1={20} x2={x} y2={150} stroke="#4f46e5" strokeWidth="2" />
          <text x={x} y="15" textAnchor="middle" className={`text-[10px] font-bold ${darkMode ? 'fill-indigo-400' : 'fill-indigo-700'}`}>{getOrdinal(percentileVal)} %</text>
        </g>
      );
    }

    const slices = [];
    let count = mode === 'quartile' ? 4 : 10;

    for (let i = 1; i <= count; i++) {
      const pStart = ((i - 1) / count) * 100;
      const pEnd = (i / count) * 100;
      const xStart = i === 1 ? 0 : getXForPercentile(pStart);
      const xEnd = i === count ? 300 : getXForPercentile(pEnd);
      const slicePoints = points.filter(pt => pt[0] >= xStart && pt[0] <= xEnd);
      if (slicePoints.length > 0) {
        const slicePath = `M ${xStart},150 L ` + slicePoints.map(pt => `${pt[0]},${pt[1]}`).join(' ') + ` L ${xEnd},150 Z`;
        slices.push(
          <path key={`slice-${i}`} d={slicePath} fill={(mode === 'quartile' && showIQR && (i === 2 || i === 3)) || hoverSlice === i ? (darkMode ? "#4338ca" : "#818cf8") : "transparent"} opacity={darkMode ? "0.6" : "0.4"} onMouseEnter={() => setHoverSlice(i)} onMouseLeave={() => setHoverSlice(null)} className="cursor-pointer" />
        );
      }
    }
    for (let i = 1; i < count; i++) {
      const x = getXForPercentile((i / count) * 100);
      slices.push(<line key={`line-${i}`} x1={x} y1={20} x2={x} y2={150} stroke={i === count / 2 ? "#4f46e5" : (darkMode ? "#334155" : "#cbd5e1")} strokeWidth={i === count / 2 ? 2 : 1} strokeDasharray="4" className="pointer-events-none" />);
    }
    return slices;
  };

  return (
    <div className="w-full flex flex-col items-center">
      <div className={`w-full h-64 relative border rounded-lg p-4 select-none flex items-center justify-center transition-colors ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
        <h4 className={`absolute top-2 text-[10px] font-bold text-center uppercase tracking-widest transition-colors ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>{mode === 'quartile' ? 'Quartiles (4 Parts)' : mode === 'decile' ? 'Deciles (10 Parts)' : 'Percentile Finder'}</h4>

        <svg viewBox="0 0 300 160" className="w-full h-full overflow-visible mt-2">
          <path d={curvePath} fill="none" stroke={darkMode ? "#334155" : "#64748b"} strokeWidth="2" opacity="0.5" />
          <line x1="0" y1="150" x2="300" y2="150" stroke={darkMode ? "#475569" : "#94a3b8"} strokeWidth="2" />
          {renderSlices()}
          {mode === 'quartile' && showBoxPlot && (
            <g className="animate-in fade-in zoom-in duration-300">
              <line x1="30" y1="130" x2={q1X} y2="130" stroke={darkMode ? "#94a3b8" : "#1e293b"} strokeWidth="2" />
              <line x1={q3X} y1="130" x2="270" y2="130" stroke={darkMode ? "#94a3b8" : "#1e293b"} strokeWidth="2" />
              <line x1="30" y1="125" x2="30" y2="135" stroke={darkMode ? "#94a3b8" : "#1e293b"} strokeWidth="2" />
              <line x1="270" y1="125" x2="270" y2="135" stroke={darkMode ? "#94a3b8" : "#1e293b"} strokeWidth="2" />
              <rect x={q1X} y="115" width={q3X - q1X} height="30" fill={darkMode ? "#1e293b" : "white"} stroke={darkMode ? "#94a3b8" : "#1e293b"} strokeWidth="2" />
              <line x1={medianX} y1="115" x2={medianX} y2="145" stroke="#4f46e5" strokeWidth="3" />
              {showOutliers && (
                <g fill="#ef4444">
                  <circle cx="10" cy="130" r="2" /> <circle cx="18" cy="130" r="2" />
                  <circle cx="290" cy="130" r="2" />
                </g>
              )}
              <text x={medianX} y="110" textAnchor="middle" className="text-[9px] fill-indigo-500 font-bold">Median</text>
              <text x={q1X} y="155" textAnchor="middle" className={`text-[9px] ${darkMode ? 'fill-slate-500' : 'fill-slate-500'}`}>Q1</text>
              <text x={q3X} y="155" textAnchor="middle" className={`text-[9px] ${darkMode ? 'fill-slate-500' : 'fill-slate-500'}`}>Q3</text>
            </g>
          )}
          {mode === 'quartile' && !showBoxPlot && (
            <g className={`text-[10px] font-bold ${darkMode ? 'fill-slate-500' : 'fill-slate-500'}`}>
              <text x={q1X} y="165" textAnchor="middle">Q1</text>
              <text x={medianX} y="165" textAnchor="middle">Median</text>
              <text x={q3X} y="165" textAnchor="middle">Q3</text>
            </g>
          )}
        </svg>
        {hoverSlice && mode !== 'percentile' && (
          <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-xs p-2 rounded shadow-lg border z-10 text-center transition-colors ${darkMode ? 'bg-slate-900 border-slate-700 text-indigo-400' : 'bg-white border-indigo-100 text-indigo-700'}`}>
            <strong>{mode === 'quartile' ? `Quartile ${hoverSlice}` : `Decile ${hoverSlice}`}</strong><br />
            <span className={darkMode ? 'text-slate-300' : 'text-slate-600'}>Contains data from {getOrdinal(Math.round((hoverSlice - 1) * (100 / (mode === 'quartile' ? 4 : 10))))} to {getOrdinal(Math.round(hoverSlice * (100 / (mode === 'quartile' ? 4 : 10))))} Percentile</span>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2 mt-4 items-center justify-center">
        <div className={`flex p-1 rounded-lg transition-colors ${darkMode ? 'bg-slate-900' : 'bg-slate-100'}`}>
          <button onClick={() => { setMode('quartile'); setShowBoxPlot(false); }} className={`px-3 py-1 text-xs rounded transition-all ${mode === 'quartile' ? (darkMode ? 'bg-indigo-600 shadow text-white font-bold' : 'bg-white shadow text-indigo-600 font-bold') : 'text-slate-500 hover:text-slate-300'}`}>Quartiles</button>
          <button onClick={() => setMode('decile')} className={`px-3 py-1 text-xs rounded transition-all ${mode === 'decile' ? (darkMode ? 'bg-indigo-600 shadow text-white font-bold' : 'bg-white shadow text-indigo-600 font-bold') : 'text-slate-500 hover:text-slate-300'}`}>Deciles</button>
          <button onClick={() => setMode('percentile')} className={`px-3 py-1 text-xs rounded transition-all ${mode === 'percentile' ? (darkMode ? 'bg-indigo-600 shadow text-white font-bold' : 'bg-white shadow text-indigo-600 font-bold') : 'text-slate-500 hover:text-slate-300'}`}>Percentiles</button>
        </div>
        {mode === 'quartile' && (
          <div className="flex gap-2">
            <button onClick={() => setShowIQR(!showIQR)} className={`px-3 py-1 text-xs rounded border transition-colors ${showIQR ? 'bg-indigo-600 text-white' : (darkMode ? 'bg-slate-900 text-slate-400 border-slate-700' : 'bg-white text-slate-600 border-slate-300')}`}>{showIQR ? 'Hide IQR' : 'Highlight IQR'}</button>
            <button onClick={() => setShowBoxPlot(!showBoxPlot)} className={`px-3 py-1 text-xs rounded border transition-colors ${showBoxPlot ? (darkMode ? 'bg-slate-100 text-slate-900' : 'bg-slate-800 text-white') : (darkMode ? 'bg-slate-900 text-slate-400 border-slate-700' : 'bg-white text-slate-600 border-slate-300')}`}>{showBoxPlot ? 'Hide Box Plot' : 'Overlay Box Plot'}</button>
            {showBoxPlot && <button onClick={() => setShowOutliers(!showOutliers)} className={`px-3 py-1 text-xs rounded border transition-colors ${showOutliers ? 'bg-red-500 text-white' : (darkMode ? 'bg-slate-900 text-red-400 border-red-900/30' : 'bg-white text-slate-600')}`}>{showOutliers ? 'Hide Outliers' : 'Show Outliers'}</button>}
          </div>
        )}
      </div>
      {mode === 'percentile' && (
        <div className="w-full mt-3 px-8">
          <input type="range" min="1" max="99" value={percentileVal} onChange={(e) => setPercentileVal(parseInt(e.target.value))} className={`w-full h-2 rounded-lg appearance-none cursor-pointer accent-indigo-600 ${darkMode ? 'bg-slate-800' : 'bg-indigo-200'}`} />
          <div className={`text-center text-xs mt-2 p-2 rounded transition-colors ${darkMode ? 'text-slate-400 bg-slate-900/50' : 'text-slate-500 bg-slate-50'}`}>
            <strong className={darkMode ? 'text-indigo-400' : 'text-indigo-600'}>{getOrdinal(percentileVal)} Percentile</strong>: Your score is higher than {percentileVal}% of the population.
          </div>
        </div>
      )}
    </div>
  );
};

// E. Shape Visual

export default QuartileVisual;
