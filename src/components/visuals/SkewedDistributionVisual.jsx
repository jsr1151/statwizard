import React, { useMemo } from 'react';
import { pointsToPath } from '../../utils/svgHelpers';

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
        const alpha = 5;
        const pdf = Math.exp(-0.5 * z * z);
        const cdf = 0.5 * (1 + Math.tanh(0.8 * alpha * z));
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
        if (x > 270) y += 0.2;
      }
      points.push([x, 140 - (y * 100)]);
    }
    return points;
  };

  const points = useMemo(() => getSkewPoints(type), [type]);
  const path = pointsToPath(points);
  const isProblem = type !== 'normal';

  const markers = useMemo(() => {
    const baseMean = 150;
    if (type === 'normal') {
      return [
        { label: 'Mean/Med/Mode', x: baseMean, color: darkMode ? '#818cf8' : '#4f46e5' }
      ];
    }
    if (type === 'positive') {
      return [
        { label: 'Mode', x: 125, color: '#f59e0b' },
        { label: 'Median', x: 140, color: '#10b981' },
        { label: 'Mean', x: 165, color: '#6366f1' }
      ];
    }
    if (type === 'negative') {
      return [
        { label: 'Mean', x: 135, color: '#6366f1' },
        { label: 'Median', x: 160, color: '#10b981' },
        { label: 'Mode', x: 175, color: '#f59e0b' }
      ];
    }
    return [];
  }, [type, darkMode]);

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

        {markers.map((m, i) => (
          <g key={i} className="transition-all duration-500">
            <line
              x1={m.x} y1="140" x2={m.x} y2="20"
              stroke={m.color}
              strokeWidth="2"
              strokeDasharray="4 2"
              className="opacity-60"
            />
            <text
              x={m.x} y="15"
              textAnchor="middle"
              fill={m.color}
              className="text-[8px] font-black uppercase tracking-tighter"
            >
              {m.label}
            </text>
          </g>
        ))}

        {type === 'outliers' && (
          <circle cx="285" cy="138" r="3" fill="#ef4444" className="animate-pulse" />
        )}
      </svg>
      <div className="flex justify-between items-center mt-2 px-2">
        <span className={`text-[10px] font-black uppercase tracking-tighter ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Central Tendency Visualization</span>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isProblem ? (darkMode ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-700') : (darkMode ? 'bg-indigo-500/20 text-indigo-300' : 'bg-indigo-100 text-indigo-700')}`}>
          {type.charAt(0).toUpperCase() + type.slice(1)} Pattern {isProblem ? '⚠️' : '✅'}
        </span>
      </div>
    </div>
  );
};

export default SkewedDistributionVisual;
