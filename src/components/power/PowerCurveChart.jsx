import React, { useMemo } from 'react';

const CHART_WIDTH = 640;
const CHART_HEIGHT = 320;
const MARGIN = { top: 24, right: 28, bottom: 48, left: 56 };
const Y_TICKS = [0, 0.25, 0.5, 0.75, 1];

const formatTick = (value, curveType) => {
    if (curveType === 'sample_size') {
        return `${Math.round(value)}`;
    }

    if (Math.abs(value) >= 1) {
        return value.toFixed(2).replace(/\.?0+$/, '');
    }

    return value.toFixed(3).replace(/\.?0+$/, '');
};

const buildLinePath = (points) => points.map((point, index) => (
    `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`
)).join(' ');

const PowerCurveChart = ({ curveModel, darkMode }) => {
    const chartGeometry = useMemo(() => {
        if (!curveModel?.points?.length) {
            return null;
        }

        const innerWidth = CHART_WIDTH - MARGIN.left - MARGIN.right;
        const innerHeight = CHART_HEIGHT - MARGIN.top - MARGIN.bottom;
        const xValues = curveModel.points.map((point) => point.x);
        const xMin = Math.min(...xValues);
        const xMax = Math.max(...xValues);
        const xSpan = Math.max(1e-9, xMax - xMin);
        const toSvgX = (value) => MARGIN.left + ((value - xMin) / xSpan) * innerWidth;
        const toSvgY = (value) => MARGIN.top + (1 - value) * innerHeight;

        return {
            xMin,
            xMax,
            innerWidth,
            innerHeight,
            plottedPoints: curveModel.points.map((point) => ({
                x: toSvgX(point.x),
                y: toSvgY(point.power),
                rawX: point.x,
                rawPower: point.power,
            })),
            currentPoint: {
                x: toSvgX(curveModel.currentPoint.x),
                y: toSvgY(curveModel.currentPoint.power),
            },
            xTicks: Array.from({ length: 5 }, (_, index) => {
                const ratio = index / 4;
                const value = xMin + (xMax - xMin) * ratio;
                return {
                    value,
                    x: toSvgX(value),
                };
            }),
            yTicks: Y_TICKS.map((value) => ({
                value,
                y: toSvgY(value),
            })),
        };
    }, [curveModel]);

    if (!curveModel || !chartGeometry) {
        return (
            <div className={`rounded-xl border p-5 ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                The power curve will appear here once the current design has enough information to generate a sweep.
            </div>
        );
    }

    const axisColor = darkMode ? '#334155' : '#cbd5e1';
    const gridColor = darkMode ? 'rgba(148, 163, 184, 0.18)' : 'rgba(148, 163, 184, 0.35)';
    const lineColor = darkMode ? '#818cf8' : '#4f46e5';
    const markerColor = darkMode ? '#fbbf24' : '#d97706';
    const labelColor = darkMode ? '#94a3b8' : '#64748b';
    const textColor = darkMode ? '#e2e8f0' : '#0f172a';

    return (
        <div className="space-y-4">
            <div className={`rounded-2xl border ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <svg viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`} className="w-full h-auto">
                    {chartGeometry.yTicks.map((tick) => (
                        <g key={`y-${tick.value}`}>
                            <line
                                x1={MARGIN.left}
                                x2={CHART_WIDTH - MARGIN.right}
                                y1={tick.y}
                                y2={tick.y}
                                stroke={gridColor}
                                strokeWidth="1"
                            />
                            <text
                                x={MARGIN.left - 10}
                                y={tick.y + 4}
                                textAnchor="end"
                                fill={labelColor}
                                fontSize="11"
                                fontWeight="700"
                            >
                                {tick.value.toFixed(2).replace(/\.?0+$/, '')}
                            </text>
                        </g>
                    ))}

                    {chartGeometry.xTicks.map((tick, index) => (
                        <g key={`x-${index}`}>
                            <line
                                x1={tick.x}
                                x2={tick.x}
                                y1={MARGIN.top}
                                y2={CHART_HEIGHT - MARGIN.bottom}
                                stroke={gridColor}
                                strokeWidth="1"
                            />
                            <text
                                x={tick.x}
                                y={CHART_HEIGHT - MARGIN.bottom + 20}
                                textAnchor="middle"
                                fill={labelColor}
                                fontSize="11"
                                fontWeight="700"
                            >
                                {formatTick(tick.value, curveModel.curveType)}
                            </text>
                        </g>
                    ))}

                    <line
                        x1={MARGIN.left}
                        x2={CHART_WIDTH - MARGIN.right}
                        y1={CHART_HEIGHT - MARGIN.bottom}
                        y2={CHART_HEIGHT - MARGIN.bottom}
                        stroke={axisColor}
                        strokeWidth="1.5"
                    />
                    <line
                        x1={MARGIN.left}
                        x2={MARGIN.left}
                        y1={MARGIN.top}
                        y2={CHART_HEIGHT - MARGIN.bottom}
                        stroke={axisColor}
                        strokeWidth="1.5"
                    />

                    <path
                        d={buildLinePath(chartGeometry.plottedPoints)}
                        fill="none"
                        stroke={lineColor}
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />

                    <line
                        x1={chartGeometry.currentPoint.x}
                        x2={chartGeometry.currentPoint.x}
                        y1={MARGIN.top}
                        y2={CHART_HEIGHT - MARGIN.bottom}
                        stroke={markerColor}
                        strokeWidth="1.5"
                        strokeDasharray="5 5"
                        opacity="0.7"
                    />
                    <line
                        x1={MARGIN.left}
                        x2={CHART_WIDTH - MARGIN.right}
                        y1={chartGeometry.currentPoint.y}
                        y2={chartGeometry.currentPoint.y}
                        stroke={markerColor}
                        strokeWidth="1.5"
                        strokeDasharray="5 5"
                        opacity="0.45"
                    />
                    <circle
                        cx={chartGeometry.currentPoint.x}
                        cy={chartGeometry.currentPoint.y}
                        r="6"
                        fill={markerColor}
                        stroke={darkMode ? '#0f172a' : '#ffffff'}
                        strokeWidth="2.5"
                    />

                    <text
                        x={(CHART_WIDTH - MARGIN.right + MARGIN.left) / 2}
                        y={CHART_HEIGHT - 10}
                        textAnchor="middle"
                        fill={textColor}
                        fontSize="12"
                        fontWeight="800"
                    >
                        {curveModel.xLabel}
                    </text>

                    <text
                        x="16"
                        y={(CHART_HEIGHT + MARGIN.top - MARGIN.bottom) / 2}
                        textAnchor="middle"
                        fill={textColor}
                        fontSize="12"
                        fontWeight="800"
                        transform={`rotate(-90 16 ${(CHART_HEIGHT + MARGIN.top - MARGIN.bottom) / 2})`}
                    >
                        {curveModel.yLabel}
                    </text>
                </svg>
            </div>

            <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
                <div className={`rounded-xl border p-4 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                    <div className={`text-[10px] font-black uppercase tracking-widest mb-2 ${darkMode ? 'text-indigo-300' : 'text-indigo-700'}`}>
                        Current Design
                    </div>
                    <p className={`text-sm ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                        {curveModel.currentPointSummary}
                    </p>
                </div>
                <div className={`rounded-xl border p-4 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                    <div className={`text-[10px] font-black uppercase tracking-widest mb-2 ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                        Held Constant
                    </div>
                    <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                        {curveModel.assumptions}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default PowerCurveChart;
