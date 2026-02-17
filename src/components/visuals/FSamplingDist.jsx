import React, { useState, useEffect, useMemo, useRef } from 'react';
import { AlertCircle, Sparkles, Calculator, MousePointer2, Info, ArrowDown, MousePointerClick, Maximize2, Minimize2, RefreshCw, Play, ChevronsRight, ChevronUp, ChevronDown, Activity, Lightbulb, BrainCircuit, BarChart2, Sigma, BookOpen, Plus, X, Trash2, Edit2, TrendingUp, Grid, FileText, PieChart } from 'lucide-react';
import { getGaussianPoints, getTPoints, normalCDF, tCDF, erf, getTCrit, getFDensity, fCDF, fPPF, getFCrit, getFPoints, calculateAnova, calculatePostHoc, lnGamma, beta } from '../../utils/mathHelpers';
import { pointsToPath, pointsToLine, getOrdinal } from '../../utils/svgHelpers';
import useTutor from '../../hooks/useTutor';
import TutorPanel from '../tutor/TutorPanel';
import CalculationText from '../common/CalculationText';
import TabButton from '../common/TabButton';
const FSamplingDist = ({ mode = 'data', fCrit = 4.0, fVal = 0, setFVal, darkMode, df1 = 2, df2 = 27, zoomDist, setZoomDist }) => {
  const safeFCrit = typeof fCrit === 'number' ? fCrit : 4.0;
  const safeFVal = typeof fVal === 'number' ? fVal : 0;

  // STABLE SCALE
  const currentMaxX = useMemo(() => {
    if (zoomDist) return Math.max(6, safeFCrit * 3);
    return Math.max(6, safeFCrit * 2, safeFVal * 1.15);
  }, [safeFCrit, safeFVal, zoomDist]);

  // ENLARGED: 800x500 for more vertical room
  const width = 800;
  const height = 500;
  const paddingX = 80;
  const paddingY = 80;
  const plotWidth = width - paddingX * 2;
  const baselineY = height - paddingY;

  const fToX = (f) => {
    const safeF = (typeof f === 'number' && !isNaN(f)) ? f : 0;
    return (safeF / currentMaxX) * plotWidth + paddingX;
  };
  const xToF = (x) => {
    // FIX: Corrected ternary logic (was returning paddingX if valid)
    const safeX = (typeof x === 'number' && !isNaN(x)) ? x : paddingX;
    return Math.max(0, ((safeX - paddingX) / plotWidth) * currentMaxX);
  };

  const handleDrag = (e) => {
    if (mode === 'data') return;
    const svg = e.currentTarget.closest('svg');
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * width;
    // CLAMP: Prevent dragging infinitely
    const newF = Math.max(0, Math.min(currentMaxX * 0.99, xToF(x)));
    setFVal(newF);
  };

  const currentDensity = getFDensity(safeFVal, df1, df2);
  const safeDensity = !isNaN(currentDensity) ? currentDensity : 0;
  // INCREASED distScale for vertical stretch (350 instead of 250)
  const distScale = 350;
  const yValRaw = baselineY - (safeDensity * distScale);
  const yVal = !isNaN(yValRaw) ? yValRaw : baselineY;

  const points = useMemo(() => {
    const pts = [];
    const steps = 200;
    for (let i = 0; i <= steps; i++) {
      const f = (i / steps) * currentMaxX;
      const dens = getFDensity(f, df1, df2);
      pts.push([fToX(f), baselineY - (dens * distScale)]);
    }
    return pts;
  }, [df1, df2, currentMaxX, plotWidth, distScale]);

  const path = pointsToLine(points);

  const alphaPath = useMemo(() => {
    if (safeFCrit >= currentMaxX) return "";
    const pPts = points.filter(pt => xToF(pt[0]) >= safeFCrit);
    if (pPts.length === 0) return "";
    const startX = fToX(safeFCrit);
    const startY = baselineY - (getFDensity(safeFCrit, df1, df2) * distScale);
    let d = `M ${startX},${baselineY} L ${startX},${startY} `;
    pPts.forEach(p => { d += `L ${p[0]},${p[1]} `; });
    d += `L ${fToX(currentMaxX)},${baselineY} Z`;
    return d;
  }, [points, safeFCrit, currentMaxX, fToX, distScale, df1, df2]);

  const pValuePath = useMemo(() => {
    if (safeFVal >= currentMaxX) return "";
    const pPts = points.filter(pt => xToF(pt[0]) >= safeFVal);
    if (pPts.length === 0) return "";
    const startX = fToX(safeFVal);
    const startY = baselineY - (getFDensity(safeFVal, df1, df2) * distScale);
    let d = `M ${startX},${baselineY} L ${startX},${startY} `;
    pPts.forEach(p => { d += `L ${p[0]},${p[1]} `; });
    d += `L ${fToX(currentMaxX)},${baselineY} Z`;
    return d;
  }, [points, safeFVal, currentMaxX, fToX, distScale, df1, df2]);

  return (
    <div className="w-full h-full flex flex-col items-center animate-in fade-in duration-700 overflow-visible">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-[100%] h-[100%] overflow-visible cursor-crosshair touch-none"
        onMouseMove={(e) => e.buttons === 1 && handleDrag(e)}
        onMouseDown={handleDrag}
        style={{ pointerEvents: 'auto' }}
      >
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* AXES */}
        <line x1={paddingX} y1={baselineY} x2={width - paddingX} y2={baselineY} stroke={darkMode ? "#334155" : "#cbd5e1"} strokeWidth="3" strokeLinecap="round" />
        <line x1={paddingX} y1="40" x2={paddingX} y2={baselineY} stroke={darkMode ? "#334155" : "#cbd5e1"} strokeWidth="3" strokeLinecap="round" />

        {/* X-AXIS TICKS */}
        <g className={`text-[10px] font-black tracking-tighter ${darkMode ? 'fill-slate-600' : 'fill-slate-500'}`}>
          {Array.from({ length: Math.floor(currentMaxX) + 1 }).map((_, i) => {
            if (currentMaxX > 15 && i % 5 !== 0 && i !== 0) return null;
            if (currentMaxX > 40 && i % 10 !== 0 && i !== 0) return null;
            return (
              <g key={i} transform={`translate(${fToX(i)}, ${baselineY})`}>
                <line y2="8" stroke={darkMode ? "#334155" : "#cbd5e1"} strokeWidth="2" />
                <text y="22" textAnchor="middle">{i}</text>
              </g>
            );
          })}
        </g>

        <text x={width / 2} y={baselineY + 55} textAnchor="middle" className={`text-[11px] font-black uppercase tracking-[0.5em] ${darkMode ? 'fill-slate-500' : 'fill-slate-400'}`}>F-Ratio Outcome</text>

        {/* REGIONS */}
        {/* REGIONS */}
        <path d={alphaPath} fill="#ef4444" opacity="0.3" />
        <path d={pValuePath} fill="#6366f1" opacity="0.4" className="transition-all duration-300" />

        {/* LEGEND overlay */}
        <g transform={`translate(${width - 160}, 60)`} className="select-none">
          <rect x="0" y="0" width="130" height="50" rx="8" fill={darkMode ? "#0f172a" : "#fff"} stroke={darkMode ? "#334155" : "#e2e8f0"} strokeWidth="1" />
          <g transform="translate(10, 15)">
            <rect width="8" height="8" rx="2" fill="#ef4444" opacity="0.6" />
            <text x="14" y="8" className={`text-[9px] font-black uppercase tracking-widest ${darkMode ? 'fill-slate-400' : 'fill-slate-500'}`}>α region</text>
          </g>
          <g transform="translate(10, 32)">
            <rect width="8" height="8" rx="2" fill="#6366f1" opacity="0.6" />
            <text x="14" y="8" className={`text-[9px] font-black uppercase tracking-widest ${darkMode ? 'fill-slate-400' : 'fill-slate-500'}`}>p-value tail</text>
          </g>
        </g>

        {/* ALPHA BOUNDARY */}
        <line x1={fToX(safeFCrit)} y1="60" x2={fToX(safeFCrit)} y2={baselineY + 15} stroke="#ef4444" strokeWidth="3" strokeDasharray="8,5" />
        <g transform={`translate(${fToX(safeFCrit)}, 45)`}>
          <rect x="-40" y="-12" width="80" height="20" rx="4" fill={darkMode ? "#7f1d1d" : "#fee2e2"} className="opacity-80" />
          <text x="0" y="3" textAnchor="middle" className="text-[11px] font-black fill-rose-500 uppercase tracking-widest">Fcrit = {safeFCrit.toFixed(2)}</text>
        </g>

        {/* CURVE */}
        <path d={path} fill="none" stroke="#6366f1" strokeWidth="4" strokeLinejoin="round" filter="url(#glow)" />

        {/* DRAGGABLE MARKER */}
        <g transform={`translate(${fToX(safeFVal)}, ${Math.max(60, yVal)})`} className="cursor-grab active:cursor-grabbing group">
          <circle r="16" fill={darkMode ? "#0f172a" : "#fff"} stroke="#6366f1" strokeWidth="5" className="shadow-2xl" />
          <line y1="16" y2={baselineY - Math.max(60, yVal)} stroke="#6366f1" strokeWidth="2.5" strokeDasharray="4,4" className="opacity-50" />

          <g transform="translate(0, -50)">
            <rect x="-45" y="-18" width="90" height="36" rx="18" fill="#6366f1" className="shadow-2xl" />
            <text y="5" textAnchor="middle" className="fill-white text-[14px] font-black">F = {safeFVal.toFixed(2)}</text>
          </g>
        </g>

        {/* ZOOM INDICATOR / Large F Handling */}
        {safeFVal > currentMaxX && (
          <g transform={`translate(${width - 100}, ${baselineY - 100})`} className="animate-pulse">
            <rect x="-60" y="-20" width="120" height="40" rx="20" fill="#f59e0b" className="shadow-lg" />
            <path d="M 20,-5 L 35,0 L 20,5 Z" fill="white" />
            <text y="5" x="-10" textAnchor="middle" className="fill-white text-[10px] font-black uppercase tracking-widest">F is off-chart</text>
          </g>
        )}
      </svg>

      {/* ZOOM TOGGLE for large F */}
      {safeFVal > safeFCrit * 3 && (
        <button
          onClick={() => setZoomDist(!zoomDist)}
          className={`mt-4 px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${zoomDist ? 'bg-amber-600 text-white shadow-lg' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
        >
          {zoomDist ? 'Reset Scale' : 'Zoom near cutoff'}
        </button>
      )}
    </div>
  );
};


export default FSamplingDist;
