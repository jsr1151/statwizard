import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  AlertCircle,
  Sparkles,
  Calculator,
  MousePointer2,
  Info,
  ArrowDown,
  MousePointerClick,
  Maximize2,
  Minimize2,
  RefreshCw,
  Play,
  ChevronsRight,
  ChevronUp,
  ChevronDown,
  Activity,
  Lightbulb,
  BrainCircuit,
  BarChart2,
  Sigma,
  BookOpen,
  Plus,
  X,
  Trash2,
  Edit2,
  TrendingUp,
  Grid,
  FileText,
  PieChart,
} from 'lucide-react';
import {
  getGaussianPoints,
  getTPoints,
  normalCDF,
  tCDF,
  erf,
  getTCrit,
  getFDensity,
  fCDF,
  fPPF,
  getFCrit,
  getFPoints,
  calculateAnova,
  calculatePostHoc,
  lnGamma,
  beta,
} from '../../utils/mathHelpers';
import { pointsToPath, pointsToLine, getOrdinal } from '../../utils/svgHelpers';
import useTutor from '../../hooks/useTutor';
import TutorPanel from '../tutor/TutorPanel';
import CalculationText from '../common/CalculationText';
import TabButton from '../common/TabButton';
const FrequencyVisual = ({ darkMode }) => {
  const [scenario, setScenario] = useState('dice');
  const [counts, setCounts] = useState({});
  const [total, setTotal] = useState(0);
  const [mode, setMode] = useState('abs');

  const resetData = useCallback(() => {
    const initial = scenario === 'dice' ? { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 } : { 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0, 11: 0, 12: 0 };
    setCounts(initial);
    setTotal(0);
  }, [scenario]);

  useEffect(() => {
    resetData();
  }, [resetData]);

  const addSamples = (n) => {
    const newCounts = { ...counts };
    let newTotal = total;
    for (let i = 0; i < n; i++) {
      let val = scenario === 'dice' ? Math.floor(Math.random() * 6) + 1 : Math.floor(Math.random() * 6) + 1 + (Math.floor(Math.random() * 6) + 1);
      if (newCounts[val] !== undefined) {
        newCounts[val]++;
        newTotal++;
      }
    }
    setCounts(newCounts);
    setTotal(newTotal);
  };

  const keys = Object.keys(counts)
    .map(Number)
    .sort((a, b) => a - b);
  const maxVal = Math.max(...Object.values(counts)) || 1;
  const maxCum = total || 1;

  // Generate table rows
  const tableData = keys.map((k) => {
    const f = counts[k];
    const rf = total > 0 ? ((f / total) * 100).toFixed(1) : 0;
    let cf = 0;
    for (let j = 0; j <= keys.indexOf(k); j++) cf += counts[keys[j]];
    const cfPct = total > 0 ? ((cf / total) * 100).toFixed(1) : 0;
    return { k, f, rf, cf, cfPct };
  });

  return (
    <div className="w-full flex flex-col items-center">
      <div
        className={`w-full p-3 rounded-t-lg border-x border-t flex justify-between items-start text-xs transition-colors ${darkMode ? 'bg-slate-900 border-slate-800 text-slate-500' : 'bg-slate-50 border-slate-200 text-slate-600'}`}
      >
        <div className="max-w-[60%]">
          <strong className={darkMode ? 'text-indigo-400' : ''}>Why this shape? (Central Limit Theorem)</strong>
          <br />
          {scenario === 'dice'
            ? 'A single die roll is Uniform. Every number has an equal chance (1/6).'
            : 'Summing variables (2 dice) creates a bell curve. There are more ways to roll a 7 than a 2 or 12.'}
        </div>
        <div className="text-right">Total (N): {total}</div>
      </div>

      <div
        className={`w-full h-64 relative border p-4 select-none flex items-center justify-center transition-colors ${darkMode ? 'bg-slate-950 border-slate-800 shadow-inner' : 'bg-white border-slate-200'}`}
      >
        <svg viewBox="0 0 300 160" className="w-full h-full overflow-visible mt-2">
          <line x1="30" y1="140" x2="290" y2="140" stroke={darkMode ? '#334155' : '#94a3b8'} strokeWidth="1" />
          {keys.map((k, i) => {
            const count = counts[k];
            let h = 0,
              label = '';
            if (mode === 'abs') {
              h = (count / maxVal) * 120;
              label = count;
            } else if (mode === 'rel') {
              h = (count / maxVal) * 120;
              label = total > 0 ? Math.round((count / total) * 100) + '%' : '';
            } else if (mode === 'cum') {
              let sum = 0;
              for (let j = 0; j <= i; j++) sum += counts[keys[j]];
              h = (sum / maxCum) * 120;
              label = sum;
            }
            const barW = 260 / keys.length - 4;
            const x = 30 + i * (260 / keys.length) + 2;
            return (
              <g key={k}>
                <rect
                  x={x}
                  y={140 - h}
                  width={barW}
                  height={h}
                  fill={mode === 'cum' ? (darkMode ? '#4338ca' : '#a5b4fc') : '#6366f1'}
                  className="transition-all duration-300 ease-out"
                />
                <text x={x + barW / 2} y="155" textAnchor="middle" className={`text-[10px] font-bold ${darkMode ? 'fill-slate-500' : 'fill-slate-500'}`}>
                  {k}
                </text>
                {h > 15 && (
                  <text x={x + barW / 2} y={140 - h + 10} textAnchor="middle" className="text-[9px] fill-white font-bold">
                    {label}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Controls */}
      <div className={`w-full p-4 border-x border-b space-y-4 transition-colors ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
        <div className="flex justify-between items-center">
          <div className={`flex rounded border p-1 transition-colors ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'}`}>
            <button
              type="button"
              aria-pressed={scenario === 'dice'}
              onClick={() => setScenario('dice')}
              className={`px-3 py-1 text-xs rounded transition-all ${scenario === 'dice' ? (darkMode ? 'bg-indigo-600 text-white font-bold' : 'bg-indigo-100 text-indigo-700 font-bold') : 'text-slate-500 hover:text-slate-300'}`}
            >
              1 Die (Uniform)
            </button>
            <button
              type="button"
              aria-pressed={scenario === 'sum2dice'}
              onClick={() => setScenario('sum2dice')}
              className={`px-3 py-1 text-xs rounded transition-all ${scenario === 'sum2dice' ? (darkMode ? 'bg-indigo-600 text-white font-bold' : 'bg-indigo-100 text-indigo-700 font-bold') : 'text-slate-500 hover:text-slate-300'}`}
            >
              2 Dice (Normal)
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => addSamples(1)}
              className={`flex-1 py-1 rounded text-xs flex items-center justify-center gap-1 font-bold transition-all border ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-white border-slate-300 hover:bg-slate-50 text-slate-700'}`}
            >
              <Plus aria-hidden="true" className="w-3 h-3" /> Add 1
            </button>
            <button
              type="button"
              onClick={() => addSamples(100)}
              className={`flex-1 py-1 rounded text-xs flex items-center justify-center gap-1 font-bold transition-all border ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-white border-slate-300 hover:bg-slate-50 text-slate-700'}`}
            >
              <ChevronsRight aria-hidden="true" className="w-3 h-3" /> Add 100
            </button>
            <button
              type="button"
              onClick={resetData}
              aria-label="Reset frequency samples"
              className={`px-2 rounded transition-all border ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-500 hover:text-red-400' : 'bg-white border-slate-300 hover:text-red-500 text-slate-400'}`}
            >
              <RefreshCw aria-hidden="true" className="w-3 h-3" />
            </button>
          </div>
          <div className={`flex rounded p-1 transition-colors ${darkMode ? 'bg-slate-950' : 'bg-slate-200'}`}>
            <button
              type="button"
              aria-pressed={mode === 'abs'}
              onClick={() => setMode('abs')}
              className={`flex-1 text-[10px] rounded transition-all ${mode === 'abs' ? (darkMode ? 'bg-indigo-600 shadow text-white font-bold' : 'bg-white shadow text-indigo-600 font-bold') : 'text-slate-500 hover:text-slate-300'}`}
            >
              Absolute (<i>f</i>)
            </button>
            <button
              type="button"
              aria-pressed={mode === 'rel'}
              onClick={() => setMode('rel')}
              className={`flex-1 text-[10px] rounded transition-all ${mode === 'rel' ? (darkMode ? 'bg-indigo-600 shadow text-white font-bold' : 'bg-white shadow text-indigo-600 font-bold') : 'text-slate-500 hover:text-slate-300'}`}
            >
              Relative (%)
            </button>
            <button
              type="button"
              aria-pressed={mode === 'cum'}
              onClick={() => setMode('cum')}
              className={`flex-1 text-[10px] rounded transition-all ${mode === 'cum' ? (darkMode ? 'bg-indigo-600 shadow text-white font-bold' : 'bg-white shadow text-indigo-600 font-bold') : 'text-slate-500 hover:text-slate-300'}`}
            >
              Cumulative (<i>cf</i>)
            </button>
          </div>
        </div>

        {/* Frequency Table */}
        <div className={`mt-4 overflow-hidden rounded border transition-colors ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
          <table className="w-full text-xs text-left">
            <thead className={`font-bold transition-colors ${darkMode ? 'bg-slate-950 text-slate-500' : 'bg-slate-100 text-slate-600'}`}>
              <tr>
                <th className="p-2">Value</th>
                <th className="p-2">Freq ($f$)</th>
                <th className="p-2">Rel. Freq (%)</th>
                <th className="p-2">Cum. Freq ($cf$)</th>
              </tr>
            </thead>
            <tbody className={`transition-colors ${darkMode ? 'bg-slate-900 text-slate-400' : 'bg-white'}`}>
              {tableData.map((row) => (
                <tr key={row.k} className={`border-t transition-colors ${darkMode ? 'border-slate-800 hover:bg-slate-800/50' : 'border-slate-100 hover:bg-slate-50'}`}>
                  <td className={`p-2 font-bold ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>{row.k}</td>
                  <td className="p-2">{row.f}</td>
                  <td className="p-2">{row.rf}%</td>
                  <td className="p-2">
                    {row.cf} <span className={darkMode ? 'text-slate-600' : 'text-slate-400'}>({row.cfPct}%)</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default FrequencyVisual;
