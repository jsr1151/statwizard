import React, { useState, useEffect, useMemo, useRef } from 'react';
import { AlertCircle, Sparkles, Calculator, MousePointer2, Info, ArrowDown, MousePointerClick, Maximize2, Minimize2, RefreshCw, Play, ChevronsRight, ChevronUp, ChevronDown, Activity, Lightbulb, BrainCircuit, BarChart2, Sigma, BookOpen, Plus, X, Trash2, Edit2, TrendingUp, Grid, FileText, PieChart } from 'lucide-react';
import { getGaussianPoints, getTPoints, normalCDF, tCDF, erf, getTCrit, getFDensity, fCDF, fPPF, getFCrit, getFPoints, calculateAnova, calculatePostHoc, lnGamma, beta } from '../../utils/mathHelpers';
import { pointsToPath, pointsToLine, getOrdinal } from '../../utils/svgHelpers';
import useTutor from '../../hooks/useTutor';
import TutorPanel from '../tutor/TutorPanel';
import CalculationText from '../common/CalculationText';
import TabButton from '../common/TabButton';
const GroupsMeansView = ({ groups = [], grandMean = 0, darkMode, showSpread = true }) => {
  const activeGroups = groups.filter(g => (g.inputMode === 'summary' ? (parseFloat(g.summary?.n) > 0) : (g.values && g.values.length > 0)));

  const getSummaryPoints = (mean, sd, n, groupIndex) => {
    const pts = [];
    if (!n || isNaN(n)) return pts;
    for (let i = 0; i < Math.min(n, 24); i++) {
      const val = (mean || 0) + (Math.sin(i * 123.45 + groupIndex * 67.89) * (sd || 0) * 1.5);
      pts.push(val);
    }
    return pts;
  };

  const maxY = Math.max(15, ...groups.map(g => {
    const m = parseFloat(g.summary?.mean || 0);
    const s = parseFloat(g.summary?.sd || 0);
    return isNaN(m + s) ? 0 : m + s * 2;
  }));
  const height = 240;
  const yToPos = (y) => {
    const safeY = (typeof y === 'number' && !isNaN(y)) ? y : 0;
    const safeMax = (maxY && !isNaN(maxY) && maxY !== 0) ? maxY : 15;
    return 200 - (safeY / safeMax) * 180;
  };

  return (
    <div className="w-full h-full flex flex-col animate-in fade-in duration-500 overflow-visible">
      <svg viewBox="0 0 400 240" className="w-full h-full overflow-visible">
        {/* Y-AXIS */}
        <line x1="40" y1="20" x2="40" y2="200" stroke={darkMode ? "#334155" : "#cbd5e1"} strokeWidth="1.5" />
        {[0, 0.25, 0.5, 0.75, 1].map(p => {
          const val = p * maxY;
          const y = yToPos(val);
          return (
            <g key={p}>
              <line x1="35" y1={y} x2="40" y2={y} stroke={darkMode ? "#475569" : "#cbd5e1"} />
              <text x="30" y={y + 3} textAnchor="end" className={`text-[8px] font-black ${darkMode ? 'fill-slate-500' : 'fill-slate-400'}`}>{val?.toFixed?.(0) || '0'}</text>
            </g>
          );
        })}
        <text x="15" y="110" textAnchor="middle" transform="rotate(-90, 15, 110)" className={`text-[9px] font-black uppercase tracking-widest ${darkMode ? 'fill-slate-500' : 'fill-slate-400'}`}>Score / Measurement</text>

        {/* GROUPS */}
        {activeGroups.map((g, i) => {
          const x = 80 + (i * (300 / (activeGroups.length || 1)));
          let n, mean, sd, pts;
          if (g.inputMode === 'summary') {
            n = parseFloat(g.summary.n || 0);
            mean = parseFloat(g.summary.mean || 0);
            sd = parseFloat(g.summary.sd || 0);
            pts = getSummaryPoints(mean, sd, n, i);
          } else {
            n = g.values.length;
            mean = g.values.reduce((a, b) => a + parseFloat(b || 0), 0) / n;
            const ss = g.values.reduce((a, b) => a + Math.pow(parseFloat(b || 0) - mean, 2), 0);
            sd = Math.sqrt(ss / (n - 1 || 1));
            pts = g.values.map(v => parseFloat(v || 0));
          }

          const se = sd / Math.sqrt(n);

          return (
            <g key={i}>
              {/* Jittered points */}
              {pts.map((v, j) => (
                <circle
                  key={j}
                  cx={x + (Math.sin(j * 56.78 + i * 91.23) * 25)}
                  cy={yToPos(v)}
                  r="4.5"
                  fill={g.color}
                  className="opacity-25 transition-all duration-300"
                />
              ))}

              {/* Spread Whiskers (SD) - Only if toggled */}
              {showSpread && (
                <g className="opacity-30">
                  <line x1={x} y1={yToPos(mean - sd)} x2={x} y2={yToPos(mean + sd)} stroke={g.color} strokeWidth="1.5" strokeDasharray="4,2" />
                  <line x1={x - 12} y1={yToPos(mean - sd)} x2={x + 12} y2={yToPos(mean - sd)} stroke={g.color} strokeWidth="1" />
                  <line x1={x - 12} y1={yToPos(mean + sd)} x2={x + 12} y2={yToPos(mean + sd)} stroke={g.color} strokeWidth="1" />
                </g>
              )}

              {/* Error Bars (SE) */}
              <line x1={x} y1={yToPos(mean - se)} x2={x} y2={yToPos(mean + se)} stroke={g.color} strokeWidth="4" strokeLinecap="round" />
              <line x1={x - 8} y1={yToPos(mean - se)} x2={x + 8} y2={yToPos(mean - se)} stroke={g.color} strokeWidth="2.5" />
              <line x1={x - 8} y1={yToPos(mean + se)} x2={x + 8} y2={yToPos(mean + se)} stroke={g.color} strokeWidth="2.5" />

              {/* Mean Marker */}
              <circle cx={x} cy={yToPos(mean)} r="7" fill={g.color} stroke="#fff" strokeWidth="2.5" className="shadow-2xl" />

              {/* Labels */}
              <text x={x} y="220" textAnchor="middle" className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'fill-white' : 'fill-slate-800'}`}>{g.label}</text>
              <text x={x} y="232" textAnchor="middle" className="text-[8px] font-bold fill-slate-500">M={mean?.toFixed?.(1) || '0.0'}</text>
            </g>
          );
        })}

        {/* Grand Mean Line */}
        <line x1="40" y1={yToPos(grandMean || 0)} x2="380" y2={yToPos(grandMean || 0)} stroke="#f59e0b" strokeWidth="2" strokeDasharray="8,6" className="opacity-40" />
        <rect x="300" y={yToPos(grandMean || 0) - 15} width="80" height="12" rx="4" fill="#f59e0b" className="opacity-80" />
        <text x="340" y={yToPos(grandMean || 0) - 6} textAnchor="middle" className="fill-white text-[7px] font-black uppercase tracking-widest">GRAND MEAN: {grandMean?.toFixed?.(2) || '0.00'}</text>
      </svg>
    </div>
  );
};


export default GroupsMeansView;
