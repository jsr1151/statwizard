import React, { useState, useEffect, useMemo, useRef } from 'react';
import { AlertCircle, Sparkles, Calculator, MousePointer2, Info, ArrowDown, MousePointerClick, Maximize2, Minimize2, RefreshCw, Play, ChevronsRight, ChevronUp, ChevronDown, Activity, Lightbulb, BrainCircuit, BarChart2, Sigma, BookOpen, Plus, X, Trash2, Edit2, TrendingUp, Grid, FileText, PieChart } from 'lucide-react';
import { getGaussianPoints, getTPoints, normalCDF, tCDF, erf, getTCrit, getFDensity, fCDF, fPPF, getFCrit, getFPoints, calculateAnova, calculatePostHoc, lnGamma, beta } from '../../utils/mathHelpers';
import { pointsToPath, pointsToLine, getOrdinal } from '../../utils/svgHelpers';
import useTutor from '../../hooks/useTutor';
import TutorPanel from '../tutor/TutorPanel';
import CalculationText from '../common/CalculationText';
import TabButton from '../common/TabButton';
const SkewedDistributionVisual = ({ type = 'normal', darkMode }) => {
  const getSkewPoints = (skewType) => {
    const mean = 150;
    const points = [];
    const res = 100;
    const width = 300;

    for (let i = 0; i <= res; i++) {
      const x = (i / res) * width;
      let y = 0;
      const z = (x - mean) / 40;

      if (skewType === 'normal') {
        y = Math.exp(-0.5 * z * z);
      } else if (skewType === 'positive') {
        // Skew Normal PDF approx
        const alpha = 5;
        const pdf = Math.exp(-0.5 * z * z);
        const cdf = 0.5 * (1 + Math.tanh(0.8 * alpha * z)); // approx erf
        y = pdf * cdf * 2;
      } else if (skewType === 'negative') {
        const alpha = -5;
        const pdf = Math.exp(-0.5 * z * z);
        const cdf = 0.5 * (1 + Math.tanh(0.8 * alpha * z));
        y = pdf * cdf * 2;
      } else if (skewType === 'bimodal') {
        const z1 = (x - 90) / 30;
        const z2 = (x - 210) / 30;
        y = 0.8 * (Math.exp(-0.5 * z1 * z1) + Math.exp(-0.5 * z2 * z2));
      } else if (skewType === 'outliers') {
        y = Math.exp(-0.5 * z * z);
        // Add tiny bumps at the ends
        if (x > 270) y += 0.2;
      }
      points.push([x, 140 - (y * 100)]);
    }
    return points;
  };

  const points = useMemo(() => getSkewPoints(type), [type]);
  const path = pointsToPath(points);
  const isProblem = type !== 'normal';

  return (
    <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
      <svg viewBox="0 0 300 160" className="w-full h-32 overflow-visible">
        <line x1="0" y1="140" x2="300" y2="140" stroke={darkMode ? "#334155" : "#cbd5e1"} strokeWidth="2" />
        <path
          d={path}
          fill="none"
          stroke={isProblem ? "#ef4444" : "#4f46e5"}
          strokeWidth="3"
          strokeLinecap="round"
          className="transition-all duration-500"
        />
        {type === 'outliers' && (
          <circle cx="285" cy="138" r="3" fill="#ef4444" className="animate-pulse" />
        )}
      </svg>
      <div className="flex justify-between items-center mt-2 px-2">
        <span className={`text-[10px] font-black uppercase tracking-tighter ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Frequency Source View</span>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isProblem ? (darkMode ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-700') : (darkMode ? 'bg-indigo-500/20 text-indigo-300' : 'bg-indigo-100 text-indigo-700')}`}>
          {type.charAt(0).toUpperCase() + type.slice(1)} Pattern {isProblem ? '⚠️' : '✅'}
        </span>
      </div>
    </div>
  );
};


export default SkewedDistributionVisual;
