import React, { useMemo } from 'react';
import { buildRegressionBand } from '../../stats/correlation.js';

const WIDTH = 760;
const HEIGHT = 420;
const MARGIN = {
  top: 26,
  right: 28,
  bottom: 58,
  left: 68,
};

const buildPath = (points = []) => points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`).join(' ');

const formatTick = (value) => {
  const numeric = Number(value);

  if (Math.abs(numeric) >= 10) {
    return numeric.toFixed(1).replace(/\.0$/, '');
  }

  if (Math.abs(numeric) >= 1) {
    return numeric.toFixed(2).replace(/\.?0+$/, '');
  }

  return numeric.toFixed(3).replace(/\.?0+$/, '');
};

const PearsonScatterplot = ({
  pairs = [],
  backgroundPairs = [],
  stats = null,
  darkMode,
  xLabel = 'X',
  yLabel = 'Y',
  showLine = true,
  showConfidenceBand = false,
  confidenceLevel = 0.95,
  highlightPointIndex = null,
  highlightXRange = null,
  title = null,
  subtitle = null,
}) => {
  const geometry = useMemo(() => {
    const allPairs = [...backgroundPairs, ...pairs];

    if (!allPairs.length) {
      return null;
    }

    const bandPoints =
      showConfidenceBand && stats?.ok
        ? buildRegressionBand({
            stats,
            confidenceLevel,
          })
        : [];
    const xValues = allPairs.map((pair) => pair.x).concat(bandPoints.map((point) => point.x));
    const yValues = allPairs.map((pair) => pair.y).concat(bandPoints.flatMap((point) => [point.lower, point.upper, point.fitted]));
    const minX = Math.min(...xValues);
    const maxX = Math.max(...xValues);
    const minY = Math.min(...yValues);
    const maxY = Math.max(...yValues);
    const xSpan = Math.max(1e-9, maxX - minX);
    const ySpan = Math.max(1e-9, maxY - minY);
    const paddedMinX = minX - xSpan * 0.08;
    const paddedMaxX = maxX + xSpan * 0.08;
    const paddedMinY = minY - ySpan * 0.1;
    const paddedMaxY = maxY + ySpan * 0.1;
    const innerWidth = WIDTH - MARGIN.left - MARGIN.right;
    const innerHeight = HEIGHT - MARGIN.top - MARGIN.bottom;
    const toSvgX = (value) => MARGIN.left + ((value - paddedMinX) / Math.max(1e-9, paddedMaxX - paddedMinX)) * innerWidth;
    const toSvgY = (value) => MARGIN.top + innerHeight * (1 - (value - paddedMinY) / Math.max(1e-9, paddedMaxY - paddedMinY));
    const plottedBackgroundPairs = backgroundPairs.map((pair) => ({
      ...pair,
      svgX: toSvgX(pair.x),
      svgY: toSvgY(pair.y),
    }));
    const plottedPairs = pairs.map((pair) => ({
      ...pair,
      svgX: toSvgX(pair.x),
      svgY: toSvgY(pair.y),
      isHighlighted: pair.index === highlightPointIndex || pair.id === highlightPointIndex,
    }));
    const lineMinX = stats?.ok ? stats.xSummary.min - (stats.xSummary.max - stats.xSummary.min || 1) * 0.06 : paddedMinX;
    const lineMaxX = stats?.ok ? stats.xSummary.max + (stats.xSummary.max - stats.xSummary.min || 1) * 0.06 : paddedMaxX;
    const regressionPoints = stats?.ok
      ? [
          { x: lineMinX, y: stats.intercept + stats.slope * lineMinX },
          { x: lineMaxX, y: stats.intercept + stats.slope * lineMaxX },
        ].map((point) => ({
          x: toSvgX(point.x),
          y: toSvgY(point.y),
        }))
      : [];
    const confidencePolygon =
      bandPoints.length > 1
        ? [
            ...bandPoints.map((point) => ({ x: toSvgX(point.x), y: toSvgY(point.upper) })),
            ...bandPoints
              .slice()
              .reverse()
              .map((point) => ({ x: toSvgX(point.x), y: toSvgY(point.lower) })),
          ]
        : [];
    const highlightedRange = highlightXRange
      ? {
          x: toSvgX(Math.min(highlightXRange.min, highlightXRange.max)),
          width: Math.abs(toSvgX(highlightXRange.max) - toSvgX(highlightXRange.min)),
        }
      : null;

    return {
      plottedBackgroundPairs,
      plottedPairs,
      regressionPoints,
      confidencePolygon,
      highlightedRange,
      xTicks: Array.from({ length: 5 }, (_, index) => {
        const ratio = index / 4;
        const value = paddedMinX + (paddedMaxX - paddedMinX) * ratio;
        return {
          value,
          x: toSvgX(value),
        };
      }),
      yTicks: Array.from({ length: 5 }, (_, index) => {
        const ratio = index / 4;
        const value = paddedMinY + (paddedMaxY - paddedMinY) * ratio;
        return {
          value,
          y: toSvgY(value),
        };
      }),
      innerHeight,
    };
  }, [pairs, backgroundPairs, stats, showConfidenceBand, confidenceLevel, highlightPointIndex, highlightXRange]);

  if (!geometry) {
    return (
      <div className={`rounded-2xl border p-6 ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
        Add valid X and Y data to see the scatterplot.
      </div>
    );
  }

  const axisColor = darkMode ? '#334155' : '#cbd5e1';
  const gridColor = darkMode ? 'rgba(148, 163, 184, 0.18)' : 'rgba(148, 163, 184, 0.35)';
  const pointFill = darkMode ? '#a5b4fc' : '#4f46e5';
  const backgroundPointFill = darkMode ? 'rgba(148, 163, 184, 0.35)' : 'rgba(100, 116, 139, 0.28)';
  const lineColor = darkMode ? '#22c55e' : '#15803d';
  const bandFill = darkMode ? 'rgba(34, 197, 94, 0.16)' : 'rgba(21, 128, 61, 0.12)';
  const rangeFill = darkMode ? 'rgba(99, 102, 241, 0.10)' : 'rgba(79, 70, 229, 0.08)';
  const rangeStroke = darkMode ? 'rgba(129, 140, 248, 0.35)' : 'rgba(79, 70, 229, 0.24)';
  const labelColor = darkMode ? '#94a3b8' : '#64748b';
  const textColor = darkMode ? '#e2e8f0' : '#0f172a';

  return (
    <div className="space-y-4">
      {(title || subtitle) && (
        <div>
          {title && <h3 className={`text-lg font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>{title}</h3>}
          {subtitle && <p className={`text-sm mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>{subtitle}</p>}
        </div>
      )}

      <div className={`rounded-2xl border overflow-hidden ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'}`}>
        <svg role="img" aria-label={`${title || 'Pearson correlation'} scatterplot of ${yLabel} by ${xLabel}`} viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full h-auto">
          {geometry.yTicks.map((tick) => (
            <g key={`y-${tick.value}`}>
              <line x1={MARGIN.left} x2={WIDTH - MARGIN.right} y1={tick.y} y2={tick.y} stroke={gridColor} strokeWidth="1" />
              <text x={MARGIN.left - 10} y={tick.y + 4} textAnchor="end" fill={labelColor} fontSize="11" fontWeight="700">
                {formatTick(tick.value)}
              </text>
            </g>
          ))}

          {geometry.xTicks.map((tick) => (
            <g key={`x-${tick.value}`}>
              <line x1={tick.x} x2={tick.x} y1={MARGIN.top} y2={HEIGHT - MARGIN.bottom} stroke={gridColor} strokeWidth="1" />
              <text x={tick.x} y={HEIGHT - MARGIN.bottom + 22} textAnchor="middle" fill={labelColor} fontSize="11" fontWeight="700">
                {formatTick(tick.value)}
              </text>
            </g>
          ))}

          <line x1={MARGIN.left} x2={WIDTH - MARGIN.right} y1={HEIGHT - MARGIN.bottom} y2={HEIGHT - MARGIN.bottom} stroke={axisColor} strokeWidth="1.5" />
          <line x1={MARGIN.left} x2={MARGIN.left} y1={MARGIN.top} y2={HEIGHT - MARGIN.bottom} stroke={axisColor} strokeWidth="1.5" />

          {geometry.highlightedRange && (
            <rect
              x={geometry.highlightedRange.x}
              y={MARGIN.top}
              width={Math.max(0, geometry.highlightedRange.width)}
              height={geometry.innerHeight}
              fill={rangeFill}
              stroke={rangeStroke}
              strokeWidth="1.2"
              rx="10"
            />
          )}

          {showConfidenceBand && geometry.confidencePolygon.length > 2 && <path d={`${buildPath(geometry.confidencePolygon)} Z`} fill={bandFill} stroke="none" />}

          {geometry.plottedBackgroundPairs.map((pair) => (
            <circle key={`background-${pair.id}-${pair.x}-${pair.y}`} cx={pair.svgX} cy={pair.svgY} r={3.8} fill={backgroundPointFill} stroke="none" />
          ))}

          {showLine && geometry.regressionPoints.length > 1 && (
            <path d={buildPath(geometry.regressionPoints)} fill="none" stroke={lineColor} strokeWidth="3" strokeLinecap="round" />
          )}

          {geometry.plottedPairs.map((pair) => (
            <circle
              key={`${pair.index}-${pair.x}-${pair.y}`}
              cx={pair.svgX}
              cy={pair.svgY}
              r={pair.isHighlighted ? 6.5 : pair.isSyntheticOutlier ? 5.8 : 4.8}
              fill={pair.isHighlighted ? '#f97316' : pair.isSyntheticOutlier ? '#ef4444' : pointFill}
              stroke={darkMode ? '#020617' : '#ffffff'}
              strokeWidth={pair.isHighlighted || pair.isSyntheticOutlier ? 2.2 : 1.8}
              opacity={pair.isHighlighted ? 1 : 0.92}
            />
          ))}

          <text x={(WIDTH - MARGIN.right + MARGIN.left) / 2} y={HEIGHT - 14} textAnchor="middle" fill={textColor} fontSize="13" fontWeight="800">
            {xLabel}
          </text>

          <text
            x="18"
            y={(HEIGHT + MARGIN.top - MARGIN.bottom) / 2}
            textAnchor="middle"
            fill={textColor}
            fontSize="13"
            fontWeight="800"
            transform={`rotate(-90 18 ${(HEIGHT + MARGIN.top - MARGIN.bottom) / 2})`}
          >
            {yLabel}
          </text>
        </svg>
      </div>

      {(showLine || showConfidenceBand || backgroundPairs.length > 0 || highlightXRange) && (
        <div className="grid gap-3 md:grid-cols-2">
          {backgroundPairs.length > 0 && (
            <div className={`rounded-xl border p-4 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
              <div className={`text-[10px] font-black uppercase tracking-widest mb-2 ${darkMode ? 'text-indigo-300' : 'text-indigo-700'}`}>Full Underlying Range</div>
              <p className={`text-sm ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                Faded points show the broader relationship. Solid points show the slice that is actually observed.
              </p>
            </div>
          )}

          {highlightXRange && (
            <div className={`rounded-xl border p-4 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
              <div className={`text-[10px] font-black uppercase tracking-widest mb-2 ${darkMode ? 'text-indigo-300' : 'text-indigo-700'}`}>Observed X-Window</div>
              <p className={`text-sm ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                The highlighted band marks the restricted X range. Narrowing that range often shrinks the observed correlation.
              </p>
            </div>
          )}

          {showLine && (
            <div className={`rounded-xl border p-4 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
              <div className={`text-[10px] font-black uppercase tracking-widest mb-2 ${darkMode ? 'text-emerald-300' : 'text-emerald-700'}`}>Best-Fit Line</div>
              <p className={`text-sm ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>The fitted line summarizes the average straight-line trend in the points.</p>
            </div>
          )}

          {showConfidenceBand && (
            <div className={`rounded-xl border p-4 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
              <div className={`text-[10px] font-black uppercase tracking-widest mb-2 ${darkMode ? 'text-emerald-300' : 'text-emerald-700'}`}>Confidence Band</div>
              <p className={`text-sm ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                The band shows uncertainty around the estimated mean line, not where every individual point should fall.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PearsonScatterplot;
