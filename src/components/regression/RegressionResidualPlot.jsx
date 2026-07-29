import React, { useMemo } from 'react';

const WIDTH = 760;
const HEIGHT = 280;
const MARGIN = {
  top: 26,
  right: 28,
  bottom: 52,
  left: 68,
};

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

const RegressionResidualPlot = ({
  stats = null,
  darkMode,
  title = 'Residual Plot',
  subtitle = 'Residuals should look roughly patternless around zero when the simple linear model is doing a good job.',
}) => {
  const geometry = useMemo(() => {
    if (!stats?.ok || !stats.pairs?.length) {
      return null;
    }

    const fittedValues = stats.pairs.map((pair) => pair.fitted);
    const residualValues = stats.pairs.map((pair) => pair.residual);
    const minX = Math.min(...fittedValues);
    const maxX = Math.max(...fittedValues);
    const residualExtent = Math.max(...residualValues.map((value) => Math.abs(value)));
    const minY = -Math.max(1e-9, residualExtent * 1.15);
    const maxY = Math.max(1e-9, residualExtent * 1.15);
    const xSpan = Math.max(1e-9, maxX - minX);
    const ySpan = Math.max(1e-9, maxY - minY);
    const paddedMinX = minX - xSpan * 0.08;
    const paddedMaxX = maxX + xSpan * 0.08;
    const innerWidth = WIDTH - MARGIN.left - MARGIN.right;
    const innerHeight = HEIGHT - MARGIN.top - MARGIN.bottom;
    const toSvgX = (value) => MARGIN.left + ((value - paddedMinX) / Math.max(1e-9, paddedMaxX - paddedMinX)) * innerWidth;
    const toSvgY = (value) => MARGIN.top + innerHeight * (1 - (value - minY) / ySpan);
    const zeroY = toSvgY(0);

    return {
      points: stats.pairs.map((pair) => ({
        id: pair.id,
        x: toSvgX(pair.fitted),
        y: toSvgY(pair.residual),
        isHighlighted: pair.index === stats.influence?.influentialIndex || pair.id === stats.influence?.influentialIndex,
      })),
      zeroY,
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
        const value = minY + (maxY - minY) * ratio;
        return {
          value,
          y: toSvgY(value),
        };
      }),
    };
  }, [stats]);

  if (!geometry) {
    return (
      <div className={`rounded-2xl border p-6 ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
        Add valid regression data to see the residual plot.
      </div>
    );
  }

  const axisColor = darkMode ? '#334155' : '#cbd5e1';
  const gridColor = darkMode ? 'rgba(148, 163, 184, 0.18)' : 'rgba(148, 163, 184, 0.35)';
  const pointFill = darkMode ? '#fbbf24' : '#d97706';
  const labelColor = darkMode ? '#94a3b8' : '#64748b';
  const textColor = darkMode ? '#e2e8f0' : '#0f172a';

  return (
    <div className="space-y-4">
      <div>
        <h3 className={`text-lg font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>{title}</h3>
        <p className={`text-sm mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>{subtitle}</p>
      </div>

      <div className={`rounded-2xl border overflow-hidden ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'}`}>
        <svg role="img" aria-label={`${title}: residuals by fitted value`} viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full h-auto">
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
              <text x={tick.x} y={HEIGHT - MARGIN.bottom + 20} textAnchor="middle" fill={labelColor} fontSize="11" fontWeight="700">
                {formatTick(tick.value)}
              </text>
            </g>
          ))}

          <line x1={MARGIN.left} x2={WIDTH - MARGIN.right} y1={HEIGHT - MARGIN.bottom} y2={HEIGHT - MARGIN.bottom} stroke={axisColor} strokeWidth="1.5" />
          <line x1={MARGIN.left} x2={MARGIN.left} y1={MARGIN.top} y2={HEIGHT - MARGIN.bottom} stroke={axisColor} strokeWidth="1.5" />

          <line
            x1={MARGIN.left}
            x2={WIDTH - MARGIN.right}
            y1={geometry.zeroY}
            y2={geometry.zeroY}
            stroke={darkMode ? '#22c55e' : '#15803d'}
            strokeWidth="2"
            strokeDasharray="6 6"
          />

          {geometry.points.map((point) => (
            <circle
              key={point.id}
              cx={point.x}
              cy={point.y}
              r={point.isHighlighted ? 6 : 4.8}
              fill={point.isHighlighted ? '#f97316' : pointFill}
              stroke={darkMode ? '#020617' : '#ffffff'}
              strokeWidth={point.isHighlighted ? 2.2 : 1.8}
            />
          ))}

          <text x={(WIDTH - MARGIN.right + MARGIN.left) / 2} y={HEIGHT - 12} textAnchor="middle" fill={textColor} fontSize="13" fontWeight="800">
            Fitted Y
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
            Residual
          </text>
        </svg>
      </div>
    </div>
  );
};

export default RegressionResidualPlot;
