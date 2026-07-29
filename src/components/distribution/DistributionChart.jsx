import { HelpCircle } from 'lucide-react';
import DistributionChartLegend from './DistributionChartLegend';

export default function DistributionChart({ altDistributionCenter, altH1Dir, altMeanZ, altPathData, altPathDataNeg, altPoints, altPointsNeg, calcMode, darkMode, df, getOpacity, h1Sign, h1Direction, handlePointerDown, handlePointerMove, handlePointerUp, hoveredRegion, isDragging, isPowerCompactPreset, isSignificant, label, mean, pTail, pathData, plotAlpha, plotCalcData, plotCriticalValue, plotDirection, plotEffectSize, plotNoncentrality, plotSampleSize, plotShowBothH1, plotShowPopulation, plotTails, plotVisualMode, points, powerMeta, setAltH1Dir, setHoveredRegion, setShowBothH1, setShowPModal, setShowPopulation, setShowPowerLabels, setTargetEffect, setVisualMode, showBothH1, showPModal, showPopulation, showPowerLabels, showTailGap, stdDev, svgRef, tails, targetEffect, type, val, visualMode, zPathData }) {
  return (
    <div className={`w-full ${isPowerCompactPreset ? 'h-80 rounded-2xl' : 'h-72'} relative flex items-end justify-center select-none border overflow-hidden px-4 transition-colors ${darkMode ? `bg-slate-950 border-slate-800 shadow-inner ${isPowerCompactPreset ? 'rounded-2xl' : ''}` : `bg-white border-slate-100 ${isPowerCompactPreset ? 'rounded-2xl' : 'rounded-t-lg'}`}`}>
      <svg ref={svgRef} role="img" aria-label={`${label} distribution plot with draggable test-statistic marker`} viewBox="-20 0 340 200" className={`w-full h-full overflow-visible select-none ${isDragging ? 'cursor-grabbing' : 'cursor-default'}`} style={{ touchAction: 'none' }} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerLeave={handlePointerUp}>
        <style>{`
                            .marker-group { transition: none !important; }
                            ${isDragging ? 'svg * { transition: none !important; }' : ''}
                        `}</style>
        <defs>
          <linearGradient id="curveGradient" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#818cf8" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#818cf8" stopOpacity="0.0" />
          </linearGradient>
          <linearGradient id="nullGradient" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={darkMode ? '#1e293b' : '#94a3b8'} stopOpacity="0.2" />
            <stop offset="100%" stopColor={darkMode ? '#1e293b' : '#94a3b8'} stopOpacity="0.0" />
          </linearGradient>
          <pattern id="diagonalHatch" patternUnits="userSpaceOnUse" width="4" height="4" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="4" stroke="#22c55e" strokeWidth="1" strokeOpacity="0.5" />
          </pattern>
          <pattern id="dotsPattern" patternUnits="userSpaceOnUse" width="4" height="4">
            <circle cx="1" cy="1" r="0.8" fill="#f59e0b" fillOpacity="0.65" />
          </pattern>
        </defs>

        {/* X-Axis titles */}
        <text x="150" y="185" textAnchor="middle" className={`text-[7px] font-bold tracking-tight transition-colors ${darkMode ? 'fill-slate-600' : 'fill-slate-400'}`}>
          Test statistic ({type === 'z' ? 'Z' : 'T'})
        </text>

        <g className={`text-[8px] font-mono transition-colors ${darkMode ? 'fill-slate-600' : 'fill-slate-400'}`}>
          {[-3, -2, -1, 0, 1, 2, 3].map((sd) => (
            <g key={sd} transform={`translate(${mean + sd * stdDev}, 150)`}>
              <line y2="5" stroke={darkMode ? '#334155' : '#e2e8f0'} />
              <text y="15" textAnchor="middle">
                {sd > 0 ? `+${sd}` : sd}
              </text>
              {calcMode && !isPowerCompactPreset && (
                <text y="25" textAnchor="middle" className="fill-indigo-500 font-bold animate-in fade-in duration-300">
                  {(plotCalcData.mu + sd * (plotCalcData.sigma / Math.sqrt(plotCalcData.n))).toFixed(1)}
                </text>
              )}
            </g>
          ))}
        </g>

        <line x1="0" y1="150" x2="300" y2="150" stroke={darkMode ? '#334155' : '#94a3b8'} strokeWidth="2" />

        {/* Alternative Distribution (H1) - Dimmed in P-value mode */}
        {plotShowPopulation && (
          <>
            <path d={altPathData} fill="url(#nullGradient)" stroke={darkMode ? '#475569' : '#94a3b8'} strokeWidth="2" strokeDasharray="4" opacity={plotVisualMode === 'p-value' ? '0.15' : '0.6'} className="transition-all duration-500" />
            {plotTails === 2 && plotShowBothH1 && <path d={altPathDataNeg} fill="url(#nullGradient)" stroke={darkMode ? '#475569' : '#94a3b8'} strokeWidth="2" strokeDasharray="4" opacity={plotVisualMode === 'p-value' ? '0.15' : '0.6'} className="transition-all duration-500" />}
          </>
        )}

        {/* Alternative/Sample Distribution */}
        <path d={pathData} fill="url(#curveGradient)" stroke="#4f46e5" strokeWidth="3" opacity={getOpacity('curve')} />

        {/* Tail Gap Overlay (Normal Distribution as Reference) */}
        {type === 't' && showTailGap && <path d={zPathData} fill="none" stroke={darkMode ? '#475569' : '#cbd5e1'} strokeWidth="1" strokeDasharray="3,3" opacity="0.6" className="animate-in fade-in duration-500" />}

        {/* Power / Beta Shading (Alternative Curve Area) - Only in Power Mode */}
        {plotShowPopulation && plotVisualMode === 'power' && (
          <g className="transition-all duration-300">
            {/* Power: Area under H1 that falls in H0 rejection region */}
            {plotTails === 2 ? (
              <>
                <path
                  d={
                    `M ${mean + Math.abs(plotCriticalValue) * stdDev},150 ` +
                    altPoints
                      .filter((p) => p[0] >= mean + Math.abs(plotCriticalValue) * stdDev)
                      .map((p, i) => (i === 0 ? `L ${p[0]},${p[1]}` : `L ${p[0]},${p[1]}`))
                      .join(' ') +
                    ` L 300,150 Z`
                  }
                  fill="url(#diagonalHatch)"
                  onMouseEnter={() => setHoveredRegion('power')}
                  onMouseLeave={() => setHoveredRegion(null)}
                  className="cursor-help"
                  stroke="none"
                />
                <path
                  d={
                    `M 0,150 ` +
                    (plotShowBothH1 ? altPointsNeg : altPoints)
                      .filter((p) => p[0] <= mean - Math.abs(plotCriticalValue) * stdDev)
                      .map((p) => `L ${p[0]},${p[1]}`)
                      .join(' ') +
                    ` L ${mean - Math.abs(plotCriticalValue) * stdDev},150 Z`
                  }
                  fill="url(#diagonalHatch)"
                  onMouseEnter={() => setHoveredRegion('power')}
                  onMouseLeave={() => setHoveredRegion(null)}
                  className="cursor-help"
                  stroke="none"
                />
              </>
            ) : plotDirection === 'greater' ? (
              <path
                d={
                  `M ${mean + plotCriticalValue * stdDev},150 ` +
                  altPoints
                    .filter((p) => p[0] >= mean + plotCriticalValue * stdDev)
                    .map((p) => `L ${p[0]},${p[1]}`)
                    .join(' ') +
                  ` L 300,150 Z`
                }
                fill="url(#diagonalHatch)"
                onMouseEnter={() => setHoveredRegion('power')}
                onMouseLeave={() => setHoveredRegion(null)}
                className="cursor-help"
                stroke="none"
              />
            ) : (
              <path
                d={
                  `M 0,150 ` +
                  altPoints
                    .filter((p) => p[0] <= mean + plotCriticalValue * stdDev)
                    .map((p) => `L ${p[0]},${p[1]}`)
                    .join(' ') +
                  ` L ${mean + plotCriticalValue * stdDev},150 Z`
                }
                fill="url(#diagonalHatch)"
                onMouseEnter={() => setHoveredRegion('power')}
                onMouseLeave={() => setHoveredRegion(null)}
                className="cursor-help"
                stroke="none"
              />
            )}

            {/* Beta: Area under H1 that falls in H0 non-rejection region (The entire interval) */}
            <path
              d={
                `M ${mean - (plotTails === 1 ? (plotDirection === 'greater' ? 4 : Math.abs(plotCriticalValue)) : Math.abs(plotCriticalValue)) * stdDev},150 ` +
                altPoints
                  .filter((p) => {
                    const z = (p[0] - mean) / stdDev;
                    if (plotTails === 2) return z > -Math.abs(plotCriticalValue) && z < Math.abs(plotCriticalValue);
                    return plotDirection === 'greater' ? z < plotCriticalValue : z > plotCriticalValue;
                  })
                  .map((p) => `L ${p[0]},${p[1]}`)
                  .join(' ') +
                ` L ${mean + (plotTails === 1 ? (plotDirection === 'greater' ? Math.abs(plotCriticalValue) : 4) : Math.abs(plotCriticalValue)) * stdDev},150 Z`
              }
              fill="url(#dotsPattern)"
              onMouseEnter={() => setHoveredRegion('beta')}
              onMouseLeave={() => setHoveredRegion(null)}
              className="cursor-help"
              stroke="none"
            />

            {/* Plot Labels for Power Mode - Positioned relative to H1 center */}
            {(!isPowerCompactPreset || showPowerLabels) && (
              <>
                <text x={mean + altMeanZ * stdDev + (altMeanZ >= 0 ? 30 : -30)} y="125" textAnchor="middle" stroke={darkMode ? '#020617' : '#ffffff'} strokeWidth="2" paintOrder="stroke" className="text-[6px] fill-green-500 font-bold bg-white/50 px-1">
                  Power (1-β)
                </text>
                <text x={mean + altMeanZ * stdDev + (altMeanZ >= 0 ? -30 : 30)} y="145" textAnchor="middle" stroke={darkMode ? '#020617' : '#ffffff'} strokeWidth="2" paintOrder="stroke" className="text-[6px] fill-amber-500 font-bold italic">
                  β (Type II)
                </text>
              </>
            )}

            {isPowerCompactPreset && showPowerLabels && (
              <>
                <text x="150" y="22" textAnchor="middle" stroke={darkMode ? '#020617' : '#ffffff'} strokeWidth="2" paintOrder="stroke" className="text-[7px] fill-indigo-500 font-black">
                  H0
                </text>
                {plotShowPopulation && (
                  <text x={altDistributionCenter} y="34" textAnchor="middle" stroke={darkMode ? '#020617' : '#ffffff'} strokeWidth="2" paintOrder="stroke" className="text-[7px] fill-slate-500 font-black">
                    H1
                  </text>
                )}
                {plotShowPopulation && plotTails === 2 && plotShowBothH1 && (
                  <text x={mean - plotNoncentrality * stdDev} y="34" textAnchor="middle" stroke={darkMode ? '#020617' : '#ffffff'} strokeWidth="2" paintOrder="stroke" className="text-[7px] fill-slate-500 font-black">
                    H1
                  </text>
                )}
              </>
            )}

            {/* Decision Rule UI Label */}
            {!isPowerCompactPreset && (
              <g transform="translate(150, 20)">
                <rect x="-40" y="-8" width="80" height="12" rx="2" fill="#1e293b" fillOpacity="0.8" />
                <text textAnchor="middle" className="text-[6px] fill-slate-300 font-black tracking-widest uppercase">
                  Reject if Z {plotTails === 2 ? '±' : ''}
                  {plotDirection === 'greater' ? '≥' : '≤'} {plotTails === 2 ? Math.abs(plotCriticalValue).toFixed(3) : plotCriticalValue.toFixed(3)}
                </text>
              </g>
            )}
          </g>
        )}

        {/* p-value shading (Null Curve Area) - Only in P-value Mode */}
        {visualMode === 'p-value' && (
          <g className="transition-all duration-300">
            {tails === 2 ? (
              <>
                <path
                  d={
                    `M ${mean + Math.abs(val) * stdDev},150 ` +
                    points
                      .filter((p) => p[0] >= mean + Math.abs(val) * stdDev)
                      .map((p) => `L ${p[0]},${p[1]}`)
                      .join(' ') +
                    ` L 300,150 Z`
                  }
                  fill="#4f46e5"
                  fillOpacity="0.3"
                />
                <path
                  d={
                    `M 0,150 ` +
                    points
                      .filter((p) => p[0] <= mean - Math.abs(val) * stdDev)
                      .map((p) => `L ${p[0]},${p[1]}`)
                      .join(' ') +
                    ` L ${mean - Math.abs(val) * stdDev},150 Z`
                  }
                  fill="#4f46e5"
                  fillOpacity="0.3"
                />
              </>
            ) : h1Direction === 'greater' ? (
              <path
                d={
                  `M ${mean + Math.max(-4, val) * stdDev},150 ` +
                  points
                    .filter((p) => p[0] >= mean + Math.max(-4, val) * stdDev)
                    .map((p) => `L ${p[0]},${p[1]}`)
                    .join(' ') +
                  ` L 300,150 Z`
                }
                fill="#4f46e5"
                fillOpacity="0.3"
              />
            ) : (
              <path
                d={
                  `M 0,150 ` +
                  points
                    .filter((p) => p[0] <= mean + Math.min(4, val) * stdDev)
                    .map((p) => `L ${p[0]},${p[1]}`)
                    .join(' ') +
                  ` L ${mean + Math.min(4, val) * stdDev},150 Z`
                }
                fill="#4f46e5"
                fillOpacity="0.3"
              />
            )}
          </g>
        )}

        {/* Rejection Regions (Anchored to Null/H0) */}
        <g opacity={getOpacity('tails')} className="transition-all duration-300">
          {plotTails === 2 ? (
            <>
              <path
                d={
                  `M 0,150 ` +
                  points
                    .filter((p) => p[0] <= mean - Math.abs(plotCriticalValue) * stdDev)
                    .map((p) => `L ${p[0]},${p[1]}`)
                    .join(' ') +
                  ` L ${mean - Math.abs(plotCriticalValue) * stdDev},150 Z`
                }
                fill="#fca5a5"
                fillOpacity="0.5"
                onMouseEnter={() => setHoveredRegion('alpha')}
                onMouseLeave={() => setHoveredRegion(null)}
                className="cursor-help"
              />
              <path
                d={
                  `M ${mean + Math.abs(plotCriticalValue) * stdDev},150 ` +
                  points
                    .filter((p) => p[0] >= mean + Math.abs(plotCriticalValue) * stdDev)
                    .map((p) => `L ${p[0]},${p[1]}`)
                    .join(' ') +
                  ` L 300,150 Z`
                }
                fill="#fca5a5"
                fillOpacity="0.5"
                onMouseEnter={() => setHoveredRegion('alpha')}
                onMouseLeave={() => setHoveredRegion(null)}
                className="cursor-help"
              />

              {/* Left Critical Boundary Line */}
              <line x1={mean - Math.abs(plotCriticalValue) * stdDev} y1="30" x2={mean - Math.abs(plotCriticalValue) * stdDev} y2="150" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="4,2" />
              {/* Right Critical Boundary Line */}
              <line x1={mean + Math.abs(plotCriticalValue) * stdDev} y1="30" x2={mean + Math.abs(plotCriticalValue) * stdDev} y2="150" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="4,2" />
            </>
          ) : (
            <>
              {plotDirection === 'greater' ? (
                <path
                  d={
                    `M ${mean + plotCriticalValue * stdDev},150 ` +
                    points
                      .filter((p) => p[0] >= mean + plotCriticalValue * stdDev)
                      .map((p) => `L ${p[0]},${p[1]}`)
                      .join(' ') +
                    ` L 300,150 Z`
                  }
                  fill="#fca5a5"
                  fillOpacity="0.5"
                  onMouseEnter={() => setHoveredRegion('alpha')}
                  onMouseLeave={() => setHoveredRegion(null)}
                  className="cursor-help"
                />
              ) : (
                <path
                  d={
                    `M 0,150 ` +
                    points
                      .filter((p) => p[0] <= mean + plotCriticalValue * stdDev)
                      .map((p) => `L ${p[0]},${p[1]}`)
                      .join(' ') +
                    ` L ${mean + plotCriticalValue * stdDev},150 Z`
                  }
                  fill="#fca5a5"
                  fillOpacity="0.5"
                  onMouseEnter={() => setHoveredRegion('alpha')}
                  onMouseLeave={() => setHoveredRegion(null)}
                  className="cursor-help"
                />
              )}
              <line x1={mean + plotCriticalValue * stdDev} y1="30" x2={mean + plotCriticalValue * stdDev} y2="150" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="4,2" />
            </>
          )}

          {/* Cutoff Labels & Alpha annotations */}
          {(!isPowerCompactPreset || showPowerLabels) && (
            <>
              {plotTails === 2 && (
                <g transform={`translate(${mean - Math.abs(plotCriticalValue) * stdDev}, 150)`}>
                  <text y="-125" textAnchor="middle" stroke={darkMode ? '#020617' : '#ffffff'} strokeWidth="2" paintOrder="stroke" className="text-[7px] fill-red-500 font-black">
                    {type === 'z' ? 'z' : 't'}Crit = -{Math.abs(plotCriticalValue).toFixed(2)}
                  </text>
                  <text y="-5" textAnchor="middle" stroke={darkMode ? '#020617' : '#ffffff'} strokeWidth="2" paintOrder="stroke" className="text-[6px] fill-red-500 font-bold italic">
                    α/2={(plotAlpha / 2).toFixed(3)}
                  </text>
                </g>
              )}
              <g transform={`translate(${mean + (plotTails === 1 && plotDirection === 'less' ? plotCriticalValue : Math.abs(plotCriticalValue)) * stdDev}, 150)`}>
                <text y="-125" textAnchor="middle" stroke={darkMode ? '#020617' : '#ffffff'} strokeWidth="2" paintOrder="stroke" className="text-[7px] fill-red-500 font-black">
                  {type === 'z' ? 'z' : 't'}Crit = {plotTails === 2 ? '+' : ''}
                  {plotCriticalValue.toFixed(2)}
                </text>
                <text y="-5" textAnchor="middle" stroke={darkMode ? '#020617' : '#ffffff'} strokeWidth="2" paintOrder="stroke" className="text-[6px] fill-red-500 font-bold italic">
                  {plotTails === 2 ? `α/2=${(plotAlpha / 2).toFixed(3)}` : `α=${plotAlpha}`}
                </text>
              </g>
            </>
          )}
        </g>

        {/* Score Marker (Follows Curve) */}
        {!isPowerCompactPreset &&
          (() => {
            // Clamp visual position to +/- 4.0 SD so it stays on the graph line
            const displayVal = Math.max(-4, Math.min(4, val));
            const markerX = mean + displayVal * stdDev;
            const pdfValue = type === 't' ? Math.pow(1 + (displayVal * displayVal) / Math.max(0.1, df), -(df + 1) / 2) : Math.exp(-0.5 * Math.pow(displayVal, 2));
            const markerY = 150 - 120 * pdfValue;

            if (isNaN(markerX) || isNaN(markerY)) return null;

            return (
              <g opacity={getOpacity('val')} className={`marker-group ${isDragging ? '' : 'transition-opacity duration-200'}`} style={{ cursor: isDragging ? 'grabbing' : 'grab' }}>
                <line x1={markerX} y1={markerY} x2={markerX} y2="150" stroke={isSignificant ? '#dc2626' : '#4f46e5'} strokeWidth="1.5" strokeDasharray="2,2" pointerEvents="none" />
                <circle cx={markerX} cy={markerY} r="6" fill={isSignificant ? '#dc2626' : '#4f46e5'} stroke={darkMode ? '#020617' : 'white'} strokeWidth="2" className="drop-shadow-lg" pointerEvents="none" />
                {/* Larger Hit Area (Transparent) */}
                <circle cx={markerX} cy={markerY} r="20" fill="transparent" className="cursor-grab active:cursor-grabbing" onPointerDown={handlePointerDown} />
                <text x={markerX} y={markerY - 15} textAnchor="middle" stroke={darkMode ? '#020617' : '#ffffff'} strokeWidth="3" paintOrder="stroke" className={`text-[10px] font-black pointer-events-none ${isSignificant ? 'fill-red-500' : 'fill-indigo-600'}`}>
                  {type === 'z' ? 'z' : 't'} = {val.toFixed(2)}
                </text>
              </g>
            );
          })()}
      </svg>

      <div className="absolute top-4 right-4 flex flex-col items-end gap-2 text-right">
        {isPowerCompactPreset ? (
          <>
            <div className={`backdrop-blur-sm border rounded-lg px-3 py-2 shadow-sm ${darkMode ? 'bg-slate-900/90 border-slate-800 text-slate-300' : 'bg-white/90 border-slate-200 text-slate-700'}`}>
              <div className={`text-[8px] font-black uppercase tracking-widest ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>Planning View</div>
              <div className={`mt-1 text-[11px] font-bold ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Alpha, beta, power, and critical cutoffs only</div>
            </div>

            <div className="flex flex-wrap justify-end gap-2 max-w-[220px]">
              <button type="button" aria-pressed={showPopulation} onClick={() => setShowPopulation(!showPopulation)} className={`px-2.5 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${showPopulation ? (darkMode ? 'bg-indigo-500 text-white shadow-lg' : 'bg-indigo-600 text-white shadow-lg') : darkMode ? 'bg-slate-900 text-slate-500 hover:bg-slate-800' : 'bg-white text-slate-500 hover:bg-slate-100 border border-slate-200'}`}>
                {showPopulation ? 'Hide' : 'Show'} H1
              </button>
              <button type="button" aria-pressed={showPowerLabels} onClick={() => setShowPowerLabels(!showPowerLabels)} className={`px-2.5 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${showPowerLabels ? (darkMode ? 'bg-slate-800 text-indigo-300 border border-slate-700' : 'bg-slate-900 text-white') : darkMode ? 'bg-slate-900 text-slate-500 hover:bg-slate-800' : 'bg-white text-slate-500 hover:bg-slate-100 border border-slate-200'}`}>
                {showPowerLabels ? 'Hide' : 'Show'} Labels
              </button>
            </div>
          </>
        ) : (
          <>
            <button type="button" aria-haspopup="dialog" className={`backdrop-blur-sm border rounded-lg p-2 shadow-sm cursor-pointer transition-colors text-right ${darkMode ? 'bg-slate-900/90 border-slate-800 hover:bg-slate-800' : 'bg-white/90 border-slate-200 hover:bg-slate-50'}`} onClick={() => setShowPModal(true)}>
              <div className={`text-[8px] font-black uppercase tracking-widest mb-1 flex items-center gap-1 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                p-value (Null Area) <HelpCircle aria-hidden="true" size={8} />
              </div>
              <div className={`text-sm font-black ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>p = {pTail.toFixed(4)}</div>
            </button>

            <div className={`flex p-0.5 rounded-lg border transition-colors ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-200'}`}>
              <button type="button" aria-pressed={visualMode === 'p-value'} onClick={() => setVisualMode('p-value')} className={`px-2 py-1 rounded text-[8px] font-black uppercase tracking-widest transition-all ${visualMode === 'p-value' ? (darkMode ? 'bg-slate-800 text-indigo-400' : 'bg-white text-indigo-600 shadow-sm') : 'text-slate-400 hover:text-slate-600'}`}>
                P-Value View
              </button>
              <button type="button" aria-pressed={visualMode === 'power'} onClick={() => setVisualMode('power')} className={`px-2 py-1 rounded text-[8px] font-black uppercase tracking-widest transition-all ${visualMode === 'power' ? (darkMode ? 'bg-slate-800 text-indigo-400' : 'bg-white text-indigo-600 shadow-sm') : 'text-slate-400 hover:text-slate-600'}`}>
                Errors/Power
              </button>
            </div>

            <button type="button" aria-pressed={showPopulation} onClick={() => setShowPopulation(!showPopulation)} className={`px-2 py-1 rounded text-[8px] font-black uppercase tracking-widest transition-all ${showPopulation ? (darkMode ? 'bg-indigo-500 text-white shadow-lg' : 'bg-indigo-600 text-white shadow-lg') : darkMode ? 'bg-slate-900 text-slate-500 hover:bg-slate-800' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
              {showPopulation ? 'Hide' : 'Show'} Alternative (H₁)
            </button>
          </>
        )}
      </div>

      <DistributionChartLegend altH1Dir={altH1Dir} darkMode={darkMode} hoveredRegion={hoveredRegion} isPowerCompactPreset={isPowerCompactPreset} setAltH1Dir={setAltH1Dir} setShowBothH1={setShowBothH1} setTargetEffect={setTargetEffect} showBothH1={showBothH1} showPopulation={showPopulation} tails={tails} targetEffect={targetEffect} visualMode={visualMode} />

      {showPModal && !isPowerCompactPreset && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setShowPModal(false)}>
          <div role="dialog" aria-modal="true" aria-labelledby="p-value-dialog-title" className={`rounded-xl shadow-2xl p-6 max-w-xs border animate-in zoom-in duration-200 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`} onClick={(e) => e.stopPropagation()}>
            <div id="p-value-dialog-title" className="text-xs font-black text-indigo-500 uppercase mb-2">
              What is a p-value?
            </div>
            <p className={`text-xs leading-relaxed italic ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>"The probability of observing a result at least this extreme, assuming the Null Hypothesis ($H_0$) is true."</p>
            <div className={`mt-4 text-[10px] font-medium ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>It is NOT the probability that the null is false. It is area under the null curve beyond your score.</div>
            <button type="button" autoFocus onClick={() => setShowPModal(false)} className={`mt-6 w-full py-2 text-xs font-black rounded-lg transition-colors ${darkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}`}>
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
