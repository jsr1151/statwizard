import React, { useMemo } from 'react';

const WIDTH = 760;
const HEIGHT = 320;
const MARGIN = {
    top: 28,
    right: 28,
    bottom: 56,
    left: 72,
};

const formatTick = (value) => {
    const numeric = Number(value);

    if (Math.abs(numeric) >= 100) {
        return numeric.toFixed(0);
    }

    if (Math.abs(numeric) >= 10) {
        return numeric.toFixed(1).replace(/\.0$/, '');
    }

    return numeric.toFixed(2).replace(/\.?0+$/, '');
};

const ObservedFittedPlot = ({
    stats = null,
    darkMode,
    highlightPointIndex = null,
    selectedPointId = null,
    onPointSelect = null,
    predictionTarget = null,
    title = 'Observed vs Fitted',
    subtitle = 'Points close to the diagonal are predicted well. Vertical distance from the diagonal is the residual.',
    yLabel = 'Observed Y',
}) => {
    const geometry = useMemo(() => {
        if (!stats?.ok || !stats.pairs?.length) {
            return null;
        }

        const fittedValues = stats.pairs.map((pair) => pair.fitted);
        const observedValues = stats.pairs.map((pair) => pair.y);
        const predictionValues = predictionTarget?.fitted != null ? [Number(predictionTarget.fitted)] : [];
        const domainMin = Math.min(...fittedValues, ...observedValues, ...predictionValues);
        const domainMax = Math.max(...fittedValues, ...observedValues, ...predictionValues);
        const span = Math.max(1e-9, domainMax - domainMin);
        const paddedMin = domainMin - (span * 0.08);
        const paddedMax = domainMax + (span * 0.08);
        const innerWidth = WIDTH - MARGIN.left - MARGIN.right;
        const innerHeight = HEIGHT - MARGIN.top - MARGIN.bottom;
        const toSvgX = (value) => MARGIN.left + (((value - paddedMin) / Math.max(1e-9, paddedMax - paddedMin)) * innerWidth);
        const toSvgY = (value) => MARGIN.top + (innerHeight * (1 - ((value - paddedMin) / Math.max(1e-9, paddedMax - paddedMin))));
        const selectedPair = stats.pairs.find((pair) => pair.id === selectedPointId || pair.index === selectedPointId) || null;

        return {
            points: stats.pairs.map((pair) => ({
                id: pair.id,
                x: toSvgX(pair.fitted),
                y: toSvgY(pair.y),
                fittedY: toSvgY(pair.fitted),
                isHighlighted: highlightPointIndex == null
                    ? (pair.id === selectedPointId || pair.index === selectedPointId)
                    : (pair.id === highlightPointIndex || pair.index === highlightPointIndex),
            })),
            selectedSegment: selectedPair ? {
                x: toSvgX(selectedPair.fitted),
                y1: toSvgY(selectedPair.fitted),
                y2: toSvgY(selectedPair.y),
            } : null,
            diagonal: {
                x1: toSvgX(paddedMin),
                y1: toSvgY(paddedMin),
                x2: toSvgX(paddedMax),
                y2: toSvgY(paddedMax),
            },
            predictionPoint: predictionTarget?.fitted != null ? {
                x: toSvgX(Number(predictionTarget.fitted)),
                y: toSvgY(Number(predictionTarget.fitted)),
                label: 'Predicted mean',
            } : null,
            ticks: Array.from({ length: 5 }, (_, index) => {
                const ratio = index / 4;
                const value = paddedMin + ((paddedMax - paddedMin) * ratio);
                return {
                    value,
                    x: toSvgX(value),
                    y: toSvgY(value),
                };
            }),
        };
    }, [stats, highlightPointIndex, selectedPointId, predictionTarget]);

    if (!geometry) {
        return (
            <div className={`rounded-2xl border p-6 ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                Add valid multiple-regression data to see the observed-vs-fitted plot.
            </div>
        );
    }

    const axisColor = darkMode ? '#334155' : '#cbd5e1';
    const gridColor = darkMode ? 'rgba(148, 163, 184, 0.16)' : 'rgba(148, 163, 184, 0.32)';
    const pointFill = darkMode ? '#38bdf8' : '#0284c7';
    const labelColor = darkMode ? '#94a3b8' : '#64748b';
    const textColor = darkMode ? '#e2e8f0' : '#0f172a';

    return (
        <div className="space-y-4">
            <div>
                <h3 className={`text-lg font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                    {title}
                </h3>
                <p className={`text-sm mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                    {subtitle}
                </p>
            </div>

            <div className={`rounded-2xl border overflow-hidden ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'}`}>
                <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full h-auto">
                    {geometry.ticks.map((tick) => (
                        <g key={`grid-${tick.value}`}>
                            <line
                                x1={MARGIN.left}
                                x2={WIDTH - MARGIN.right}
                                y1={tick.y}
                                y2={tick.y}
                                stroke={gridColor}
                                strokeWidth="1"
                            />
                            <line
                                x1={tick.x}
                                x2={tick.x}
                                y1={MARGIN.top}
                                y2={HEIGHT - MARGIN.bottom}
                                stroke={gridColor}
                                strokeWidth="1"
                            />
                            <text
                                x={tick.x}
                                y={HEIGHT - MARGIN.bottom + 22}
                                textAnchor="middle"
                                fill={labelColor}
                                fontSize="11"
                                fontWeight="700"
                            >
                                {formatTick(tick.value)}
                            </text>
                            <text
                                x={MARGIN.left - 10}
                                y={tick.y + 4}
                                textAnchor="end"
                                fill={labelColor}
                                fontSize="11"
                                fontWeight="700"
                            >
                                {formatTick(tick.value)}
                            </text>
                        </g>
                    ))}

                    <line
                        x1={MARGIN.left}
                        x2={WIDTH - MARGIN.right}
                        y1={HEIGHT - MARGIN.bottom}
                        y2={HEIGHT - MARGIN.bottom}
                        stroke={axisColor}
                        strokeWidth="1.5"
                    />
                    <line
                        x1={MARGIN.left}
                        x2={MARGIN.left}
                        y1={MARGIN.top}
                        y2={HEIGHT - MARGIN.bottom}
                        stroke={axisColor}
                        strokeWidth="1.5"
                    />

                    <line
                        x1={geometry.diagonal.x1}
                        y1={geometry.diagonal.y1}
                        x2={geometry.diagonal.x2}
                        y2={geometry.diagonal.y2}
                        stroke={darkMode ? '#22c55e' : '#15803d'}
                        strokeWidth="2.4"
                        strokeDasharray="8 6"
                    />

                    {geometry.selectedSegment && (
                        <line
                            x1={geometry.selectedSegment.x}
                            x2={geometry.selectedSegment.x}
                            y1={geometry.selectedSegment.y1}
                            y2={geometry.selectedSegment.y2}
                            stroke={darkMode ? '#fb923c' : '#ea580c'}
                            strokeWidth="3"
                            strokeLinecap="round"
                        />
                    )}

                    {geometry.points.map((point) => (
                        <circle
                            key={point.id}
                            cx={point.x}
                            cy={point.y}
                            r={point.isHighlighted ? 6.4 : 5}
                            fill={point.isHighlighted ? '#f97316' : pointFill}
                            stroke={darkMode ? '#020617' : '#ffffff'}
                            strokeWidth={point.isHighlighted ? 2.3 : 1.8}
                            className={onPointSelect ? 'cursor-pointer' : ''}
                            onClick={() => onPointSelect?.(point.id)}
                        />
                    ))}

                    {geometry.predictionPoint && (
                        <g>
                            <path
                                d={`M ${geometry.predictionPoint.x} ${geometry.predictionPoint.y - 8} L ${geometry.predictionPoint.x + 8} ${geometry.predictionPoint.y} L ${geometry.predictionPoint.x} ${geometry.predictionPoint.y + 8} L ${geometry.predictionPoint.x - 8} ${geometry.predictionPoint.y} Z`}
                                fill={darkMode ? '#facc15' : '#ca8a04'}
                                stroke={darkMode ? '#020617' : '#ffffff'}
                                strokeWidth="2"
                            />
                            <text
                                x={geometry.predictionPoint.x + 12}
                                y={geometry.predictionPoint.y - 10}
                                fill={darkMode ? '#fde68a' : '#854d0e'}
                                fontSize="11"
                                fontWeight="800"
                            >
                                {geometry.predictionPoint.label}
                            </text>
                        </g>
                    )}

                    <text
                        x={(WIDTH - MARGIN.right + MARGIN.left) / 2}
                        y={HEIGHT - 12}
                        textAnchor="middle"
                        fill={textColor}
                        fontSize="13"
                        fontWeight="800"
                    >
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
                        {yLabel}
                    </text>
                </svg>
            </div>
        </div>
    );
};

export default ObservedFittedPlot;
