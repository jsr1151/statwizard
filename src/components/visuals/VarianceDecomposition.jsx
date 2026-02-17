import React, { useState, useEffect, useMemo, useRef } from 'react';
import { AlertCircle, Sparkles, Calculator, MousePointer2, Info, ArrowDown, MousePointerClick, Maximize2, Minimize2, RefreshCw, Play, ChevronsRight, ChevronUp, ChevronDown, Activity, Lightbulb, BrainCircuit, BarChart2, Sigma, BookOpen, Plus, X, Trash2, Edit2, TrendingUp, Grid, FileText, PieChart } from 'lucide-react';
import { getGaussianPoints, getTPoints, normalCDF, tCDF, erf, getTCrit, getFDensity, fCDF, fPPF, getFCrit, getFPoints, calculateAnova, calculatePostHoc, lnGamma, beta } from '../../utils/mathHelpers';
import { pointsToPath, pointsToLine, getOrdinal } from '../../utils/svgHelpers';
import useTutor from '../../hooks/useTutor';
import TutorPanel from '../tutor/TutorPanel';
import CalculationText from '../common/CalculationText';
import TabButton from '../common/TabButton';
const VarianceDecomposition = ({ ssB = 0, ssW = 0, ssT = 1, darkMode }) => {
  const safeSST = ssT || 1;
  const bPct = (ssB / safeSST) * 100;
  const wPct = (ssW / safeSST) * 100;
  const eta2 = (ssB / safeSST);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-12 animate-in fade-in duration-700">
      <div className="w-full max-w-xl space-y-8">
        <div className="flex flex-col gap-2">
          <div className="flex justify-between text-[13px] font-black uppercase tracking-[0.3em] text-indigo-400">
            <span>Model Variance (Explained)</span>
            <span>{bPct.toFixed(1)}%</span>
          </div>
          <div className="h-12 bg-slate-900 rounded-2xl overflow-hidden flex border-2 border-slate-800 shadow-2xl">
            <div className="h-full bg-indigo-500 transition-all duration-1000 ease-out shadow-[0_0_35px_rgba(99,102,241,0.6)]" style={{ width: `${bPct}%` }} />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex justify-between text-[13px] font-black uppercase tracking-[0.3em] text-emerald-400">
            <span>Residual Variance (Noise)</span>
            <span>{wPct.toFixed(1)}%</span>
          </div>
          <div className="h-12 bg-slate-900 rounded-2xl overflow-hidden flex border-2 border-slate-800 shadow-2xl">
            <div className="h-full bg-emerald-500 transition-all duration-1000 ease-out shadow-[0_0_35px_rgba(16,185,129,0.5)]" style={{ width: `${wPct}%` }} />
          </div>
        </div>
      </div>

      <div className={`p-10 rounded-[40px] border-4 border-dashed text-center max-w-lg ${darkMode ? 'bg-slate-900/50 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
        <p className="text-sm leading-relaxed font-bold italic">
          “ANOVA partitions total variation into explained (between-groups) and residual (within-groups) parts. η² ({eta2.toFixed(3)}) shows the proportion explained. Significance is determined by the F ratio, which compares MS_between to MS_within given df and α.”
        </p>
      </div>
    </div>
  );
};


// C. Variability Visual (SD)

export default VarianceDecomposition;
