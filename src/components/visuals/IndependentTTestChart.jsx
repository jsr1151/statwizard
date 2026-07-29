import React, { useMemo, useRef, useState } from 'react';
import { FileText } from 'lucide-react';
import { getGaussianPoints, getTPoints } from '../../utils/mathHelpers';
import { pointsToPath } from '../../utils/svgHelpers';
import IndependentTTestPlots from './IndependentTTestPlots';

const MODES = [
  ['sampling', 'Sampling dist.'],
  ['distribution', 'Group curves'],
  ['plots', 'Plots'],
];
const PATTERNS = ['none', 'diagonal', 'dots', 'horizontal', 'vertical', 'crosshatch'];

const rasterizeSvg = (svg, background) =>
  new Promise((resolve, reject) => {
    const source = new XMLSerializer().serializeToString(svg);
    const url = URL.createObjectURL(new Blob([source], { type: 'image/svg+xml;charset=utf-8' }));
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 1000;
      canvas.height = 600;
      const context = canvas.getContext('2d');
      context.fillStyle = background;
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Plot conversion failed.'))), 'image/png');
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Plot image failed to load.'));
    };
    image.src = url;
  });

const IndependentTTestChart = ({ darkMode, group1, group2, result, onGroup1MeanChange }) => {
  const [mode, setMode] = useState('sampling');
  const [showWhiskers, setShowWhiskers] = useState(false);
  const [showCriticalGap, setShowCriticalGap] = useState(false);
  const [copyStatus, setCopyStatus] = useState('Copy Plot');
  const [settings, setSettings] = useState({
    type: 'bar',
    errorType: 'se',
    errorDirection: 'both',
    showOutline: true,
    showGrid: true,
    g1Pattern: 'none',
    g2Pattern: 'none',
    g1Color: '#6366f1',
    g2Color: '#10b981',
    yMin: null,
    yMax: null,
    xLabel: 'Group',
    yLabel: 'Outcome',
  });
  const svgRef = useRef(null);
  const center = 150;
  const scale = 35;
  const safeSe = result.se > 0 ? result.se : 1;
  const observedT = Number.isFinite(result.t) ? Math.max(-4.5, Math.min(4.5, result.t)) : Math.sign(result.t) * 4.5;
  const group1Center = Math.max(-15, Math.min(315, center + (result.delta * scale) / safeSe));
  const samplingPath = useMemo(() => pointsToPath(getTPoints(center, scale, result.df, 120, 300)), [result.df]);
  const group1Path = useMemo(() => pointsToPath(getGaussianPoints(group1Center, scale, 100, 300)), [group1Center]);
  const group2Path = useMemo(() => pointsToPath(getGaussianPoints(center, scale, 100, 300)), []);
  const updateSetting = (key, value) => setSettings((previous) => ({ ...previous, [key]: value }));
  const inputClass = `block mt-1 w-full p-2 rounded border ${darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`;

  const moveMean = (event) => {
    if (event.buttons !== 1 || !svgRef.current) return;
    const point = svgRef.current.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;
    const matrix = svgRef.current.getScreenCTM();
    if (!matrix) return;
    const svgPoint = point.matrixTransform(matrix.inverse());
    const nextDelta = ((svgPoint.x - center) / scale) * safeSe;
    if (Number.isFinite(nextDelta)) onGroup1MeanChange(group2.xBar + nextDelta);
  };
  const copyPlot = async () => {
    const svg = document.getElementById('ttest-plot-svg');
    if (!svg || !navigator.clipboard || typeof ClipboardItem === 'undefined') return setCopyStatus('Copy unavailable');
    try {
      const blob = await rasterizeSvg(svg, darkMode ? '#0f172a' : '#ffffff');
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      setCopyStatus('Copied!');
      window.setTimeout(() => setCopyStatus('Copy Plot'), 2000);
    } catch {
      setCopyStatus('Copy unavailable');
    }
  };

  return (
    <section className="w-full">
      <div
        className={`w-full ${mode === 'plots' ? 'h-96' : 'h-72'} relative flex items-end justify-center border overflow-hidden px-4 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-100'}`}
      >
        <div className="absolute top-4 left-4 flex gap-2 z-10">
          {MODES.map(([id, label]) => (
            <button
              key={id}
              type="button"
              aria-pressed={mode === id}
              onClick={() => setMode(id)}
              className={`px-2 py-1 rounded text-[8px] font-black uppercase tracking-widest border ${mode === id ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-500'}`}
            >
              {label}
            </button>
          ))}
        </div>
        {mode === 'distribution' && (
          <div className="absolute top-12 left-4 flex gap-2 z-10">
            <button
              type="button"
              aria-pressed={showWhiskers}
              onClick={() => setShowWhiskers((value) => !value)}
              className={`px-2 py-1 rounded text-[7px] font-bold uppercase border ${showWhiskers ? 'bg-indigo-500 text-white' : 'border-slate-700 text-slate-500'}`}
            >
              Whiskers
            </button>
            <button
              type="button"
              aria-pressed={showCriticalGap}
              onClick={() => setShowCriticalGap((value) => !value)}
              className={`px-2 py-1 rounded text-[7px] font-bold uppercase border ${showCriticalGap ? 'bg-indigo-500 text-white' : 'border-slate-700 text-slate-500'}`}
            >
              Critical gap
            </button>
          </div>
        )}
        {mode === 'plots' ? (
          <IndependentTTestPlots group1={group1} group2={group2} settings={settings} darkMode={darkMode} />
        ) : (
          <svg
            ref={svgRef}
            viewBox="-20 0 340 200"
            className="w-full h-full overflow-visible"
            onPointerDown={moveMean}
            onPointerMove={moveMean}
            role="img"
            aria-label={mode === 'sampling' ? 'Null t sampling distribution' : 'Group mean sampling curves'}
          >
            <defs>
              <linearGradient id="indepGradient" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#818cf8" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#818cf8" stopOpacity="0" />
              </linearGradient>
            </defs>
            <line x1="0" y1="150" x2="300" y2="150" stroke={darkMode ? '#334155' : '#94a3b8'} strokeWidth="2" />
            {mode === 'sampling' ? (
              <>
                <path d={samplingPath} fill="url(#indepGradient)" stroke="#4f46e5" strokeWidth="3" />
                {result.tails === 2 ? (
                  [-1, 1].map((sign) => (
                    <line
                      key={sign}
                      x1={center + sign * result.criticalMagnitude * scale}
                      y1="30"
                      x2={center + sign * result.criticalMagnitude * scale}
                      y2="150"
                      stroke="#ef4444"
                      strokeDasharray="4,2"
                    />
                  ))
                ) : (
                  <line x1={center + result.criticalValue * scale} y1="30" x2={center + result.criticalValue * scale} y2="150" stroke="#ef4444" strokeDasharray="4,2" />
                )}
                <g className="cursor-ew-resize">
                  <line x1={center + observedT * scale} y1="30" x2={center + observedT * scale} y2="150" stroke="#4f46e5" strokeWidth="2" strokeDasharray="4,2" />
                  <circle cx={center + observedT * scale} cy="148" r="7" fill="#4f46e5" stroke="white" strokeWidth="2" />
                  <text x={center + observedT * scale} y="170" textAnchor="middle" className="text-[9px] font-black fill-indigo-500">
                    t = {result.t.toFixed(3)}
                  </text>
                </g>
              </>
            ) : (
              <>
                <path d={group1Path} fill="none" stroke="#6366f1" strokeWidth="3" />
                <path d={group2Path} fill="none" stroke="#10b981" strokeWidth="3" />
                <circle cx={group1Center} cy="150" r="5" fill="#6366f1" />
                <circle cx={center} cy="150" r="5" fill="#10b981" />
                {showWhiskers && (
                  <>
                    <line x1={center - (result.sem2 * scale) / safeSe} x2={center + (result.sem2 * scale) / safeSe} y1="145" y2="145" stroke="#10b981" strokeWidth="2" />
                    <line
                      x1={group1Center - (result.sem1 * scale) / safeSe}
                      x2={group1Center + (result.sem1 * scale) / safeSe}
                      y1="135"
                      y2="135"
                      stroke="#6366f1"
                      strokeWidth="2"
                    />
                  </>
                )}
                {showCriticalGap && (
                  <>
                    <line
                      x1={center + (result.deltaCritical * scale) / safeSe}
                      x2={center + (result.deltaCritical * scale) / safeSe}
                      y1="80"
                      y2="150"
                      stroke="#ef4444"
                      strokeDasharray="3,2"
                    />
                    <text x={center + (result.deltaCritical * scale) / safeSe} y="75" textAnchor="middle" className="text-[7px] fill-red-500">
                      Critical gap {result.deltaCritical.toFixed(2)}
                    </text>
                  </>
                )}
                <text x="280" y="185" textAnchor="end" className="text-[7px] font-bold fill-slate-500">
                  Overlap about {result.overlapPercent.toFixed(0)}%
                </text>
              </>
            )}
          </svg>
        )}
        <div className="absolute top-4 right-4">
          <div className={`px-3 py-1.5 rounded-lg border ${result.isSignificant ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-slate-500/10 border-slate-500/30'}`}>
            <span className={`block text-[8px] font-black uppercase ${result.isSignificant ? 'text-emerald-500' : 'text-slate-400'}`}>
              {result.isSignificant ? 'Significant' : 'Not significant'}
            </span>
            <span className="block text-sm font-black text-slate-500">p {result.p < 0.001 ? '< .001' : `= ${result.p.toFixed(3).replace(/^0/, '')}`}</span>
          </div>
        </div>
      </div>

      {mode === 'plots' && (
        <div className={`w-full p-4 border-b ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            <label className="text-[8px] font-black uppercase text-slate-500">
              Plot type
              <select value={settings.type} onChange={(event) => updateSetting('type', event.target.value)} className={inputClass}>
                <option value="bar">Bar</option>
                <option value="line">Mean line</option>
              </select>
            </label>
            <label className="text-[8px] font-black uppercase text-slate-500">
              Error bars
              <select value={settings.errorType} onChange={(event) => updateSetting('errorType', event.target.value)} className={inputClass}>
                <option value="se">SE</option>
                <option value="sd">SD</option>
                <option value="none">None</option>
              </select>
            </label>
            <label className="text-[8px] font-black uppercase text-slate-500">
              Direction
              <select value={settings.errorDirection} onChange={(event) => updateSetting('errorDirection', event.target.value)} className={inputClass}>
                <option value="both">Both</option>
                <option value="plus">Plus</option>
                <option value="minus">Minus</option>
              </select>
            </label>
            <label className="text-[8px] font-black uppercase text-slate-500">
              Group 1 color
              <input type="color" value={settings.g1Color} onChange={(event) => updateSetting('g1Color', event.target.value)} className={`${inputClass} h-9 p-1`} />
            </label>
            <label className="text-[8px] font-black uppercase text-slate-500">
              Group 2 color
              <input type="color" value={settings.g2Color} onChange={(event) => updateSetting('g2Color', event.target.value)} className={`${inputClass} h-9 p-1`} />
            </label>
            <label className="text-[8px] font-black uppercase text-slate-500">
              Outline
              <select value={settings.showOutline ? 'on' : 'off'} onChange={(event) => updateSetting('showOutline', event.target.value === 'on')} className={inputClass}>
                <option value="on">On</option>
                <option value="off">Off</option>
              </select>
            </label>
            <label className="text-[8px] font-black uppercase text-slate-500">
              Group 1 pattern
              <select value={settings.g1Pattern} onChange={(event) => updateSetting('g1Pattern', event.target.value)} className={inputClass}>
                {PATTERNS.map((pattern) => (
                  <option key={pattern}>{pattern}</option>
                ))}
              </select>
            </label>
            <label className="text-[8px] font-black uppercase text-slate-500">
              Group 2 pattern
              <select value={settings.g2Pattern} onChange={(event) => updateSetting('g2Pattern', event.target.value)} className={inputClass}>
                {PATTERNS.map((pattern) => (
                  <option key={pattern}>{pattern}</option>
                ))}
              </select>
            </label>
            <label className="text-[8px] font-black uppercase text-slate-500">
              X label
              <input value={settings.xLabel} onChange={(event) => updateSetting('xLabel', event.target.value)} className={inputClass} />
            </label>
            <label className="text-[8px] font-black uppercase text-slate-500">
              Y label
              <input value={settings.yLabel} onChange={(event) => updateSetting('yLabel', event.target.value)} className={inputClass} />
            </label>
            <label className="text-[8px] font-black uppercase text-slate-500">
              Y minimum
              <input
                type="number"
                value={settings.yMin ?? ''}
                onChange={(event) => updateSetting('yMin', event.target.value === '' ? null : Number(event.target.value))}
                className={inputClass}
              />
            </label>
            <label className="text-[8px] font-black uppercase text-slate-500">
              Y maximum
              <input
                type="number"
                value={settings.yMax ?? ''}
                onChange={(event) => updateSetting('yMax', event.target.value === '' ? null : Number(event.target.value))}
                className={inputClass}
              />
            </label>
          </div>
          <div className="mt-4 flex justify-between">
            <button
              type="button"
              aria-pressed={settings.showGrid}
              onClick={() => updateSetting('showGrid', !settings.showGrid)}
              className="text-[8px] font-black uppercase text-slate-500"
            >
              Grid: {settings.showGrid ? 'On' : 'Off'}
            </button>
            <button type="button" onClick={copyPlot} className="px-4 py-2 bg-amber-600 text-white text-[9px] font-black uppercase rounded-lg flex items-center gap-2">
              <FileText aria-hidden="true" size={12} />
              <span className="sr-only" aria-live="polite">
                {copyStatus === 'Copied!' ? 'Plot copied to clipboard.' : copyStatus}
              </span>
              <span aria-hidden="true">{copyStatus}</span>
            </button>
          </div>
        </div>
      )}
    </section>
  );
};

export default IndependentTTestChart;
