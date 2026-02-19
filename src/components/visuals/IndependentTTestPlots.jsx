import React, { useMemo } from 'react';

const IndependentTTestPlots = ({
    group1,
    group2,
    settings,
    darkMode
}) => {
    const {
        type = 'bar',
        errorType = 'se',
        g1Color = '#6366f1',
        g2Color = '#10b981',
        yMin = null,
        yMax = null,
        xLabel = 'Group',
        yLabel = 'Outcome'
    } = settings;

    // Helper to get raw numeric data
    const getRawData = (rawText) => {
        if (!rawText) return [];
        return rawText.replace(/,/g, ' ').split(/\s+/).map(v => parseFloat(v)).filter(v => !isNaN(v));
    };

    const g1Raw = useMemo(() => getRawData(group1.raw), [group1.raw]);
    const g2Raw = useMemo(() => getRawData(group2.raw), [group2.raw]);

    // Error calculations
    const g1Error = errorType === 'se' ? group1.s / Math.sqrt(group1.n) : (errorType === 'sd' ? group1.s : 0);
    const g2Error = errorType === 'se' ? group2.s / Math.sqrt(group2.n) : (errorType === 'sd' ? group2.s : 0);

    // Scaling logic
    const margin = { top: 40, right: 40, bottom: 60, left: 60 };
    const width = 400;
    const height = 300;
    const plotWidth = width - margin.left - margin.right;
    const plotHeight = height - margin.top - margin.bottom;

    const allDataPoints = [...g1Raw, ...g2Raw, group1.xBar, group2.xBar, group1.xBar + g1Error, group1.xBar - g1Error, group2.xBar + g2Error, group2.xBar - g2Error];
    const dataMin = Math.min(...allDataPoints);
    const dataMax = Math.max(...allDataPoints);

    // Auto-scale with some padding, ensuring 0 is included if data is positive
    const effectiveYMin = yMin !== null ? yMin : (dataMin > 0 ? 0 : dataMin * 1.1);
    const effectiveYMax = yMax !== null ? yMax : dataMax * 1.1;

    const yToPos = (y) => margin.top + plotHeight - ((y - effectiveYMin) / (effectiveYMax - effectiveYMin || 1)) * plotHeight;
    const xPositions = [margin.left + plotWidth * 0.33, margin.left + plotWidth * 0.66];

    // Jittered points
    const jitter = (points, centerX) => {
        return points.map((val, i) => ({
            y: yToPos(val),
            x: centerX + (Math.sin(i * 13) * (plotWidth * 0.05)) // deterministic jitter
        }));
    };

    const g1Points = jitter(g1Raw, xPositions[0]);
    const g2Points = jitter(g2Raw, xPositions[1]);

    return (
        <div className={`w-full flex items-center justify-center p-4 ${darkMode ? 'bg-slate-900' : 'bg-white'}`}>
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full max-w-xl overflow-visible font-sans">
                {/* --- APA/ggplot Theme Elements --- */}
                {/* Grid Lines (Subtle) */}
                {[0, 0.25, 0.5, 0.75, 1].map(p => {
                    const val = effectiveYMin + p * (effectiveYMax - effectiveYMin);
                    const y = yToPos(val);
                    return (
                        <line
                            key={p}
                            x1={margin.left} y1={y} x2={margin.left + plotWidth} y2={y}
                            stroke={darkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)"}
                            strokeWidth="1"
                        />
                    );
                })}

                {/* Axes */}
                <line x1={margin.left} y1={margin.top} x2={margin.left} y2={margin.top + plotHeight} stroke={darkMode ? "#cbd5e1" : "#000"} strokeWidth="1.5" />
                <line x1={margin.left} y1={margin.top + plotHeight} x2={margin.left + plotWidth} y2={margin.top + plotHeight} stroke={darkMode ? "#cbd5e1" : "#000"} strokeWidth="1.5" />

                {/* Labels */}
                <text x={width / 2} y={height - 10} textAnchor="middle" fontSize="12" fontWeight="bold" fill={darkMode ? "#94a3b8" : "#000"}>{xLabel}</text>
                <text
                    x={20} y={margin.top + plotHeight / 2}
                    textAnchor="middle"
                    fontSize="12" fontWeight="bold"
                    transform={`rotate(-90, 20, ${margin.top + plotHeight / 2})`}
                    fill={darkMode ? "#94a3b8" : "#000"}
                >
                    {yLabel}
                </text>

                {/* Y-Axis Ticks */}
                {[0, 0.25, 0.5, 0.75, 1].map(p => {
                    const val = effectiveYMin + p * (effectiveYMax - effectiveYMin);
                    const y = yToPos(val);
                    return (
                        <g key={p}>
                            <line x1={margin.left - 5} y1={y} x2={margin.left} y2={y} stroke={darkMode ? "#cbd5e1" : "#000"} strokeWidth="1.5" />
                            <text x={margin.left - 10} y={y + 4} textAnchor="end" fontSize="10" fill={darkMode ? "#64748b" : "#475569"}>{val.toFixed(1)}</text>
                        </g>
                    );
                })}

                {/* X-Axis Ticks */}
                <text x={xPositions[0]} y={margin.top + plotHeight + 20} textAnchor="middle" fontSize="11" fill={darkMode ? "#cbd5e1" : "#000"}>Group 1</text>
                <text x={xPositions[1]} y={margin.top + plotHeight + 20} textAnchor="middle" fontSize="11" fill={darkMode ? "#cbd5e1" : "#000"}>Group 2</text>

                {/* --- Data Plotting --- */}

                {/* Raw Points (Geom Jitter) */}
                {g1Points.map((p, i) => (
                    <circle key={`g1-${i}`} cx={p.x} cy={p.y} r="3" fill={g1Color} opacity="0.4" />
                ))}
                {g2Points.map((p, i) => (
                    <circle key={`g2-${i}`} cx={p.x} cy={p.y} r="3" fill={g2Color} opacity="0.4" />
                ))}

                {/* Graphs */}
                {type === 'bar' ? (
                    <>
                        <rect
                            x={xPositions[0] - 30} y={yToPos(group1.xBar)}
                            width="60" height={Math.abs(yToPos(group1.xBar) - yToPos(effectiveYMin))}
                            fill={g1Color} opacity="0.7"
                            stroke={darkMode ? "#cbd5e1" : "#000"} strokeWidth="1"
                        />
                        <rect
                            x={xPositions[1] - 30} y={yToPos(group2.xBar)}
                            width="60" height={Math.abs(yToPos(group2.xBar) - yToPos(effectiveYMin))}
                            fill={g2Color} opacity="0.7"
                            stroke={darkMode ? "#cbd5e1" : "#000"} strokeWidth="1"
                        />
                    </>
                ) : (
                    <>
                        <line
                            x1={xPositions[0]} y1={yToPos(group1.xBar)}
                            x2={xPositions[1]} y2={yToPos(group2.xBar)}
                            stroke={darkMode ? "#cbd5e1" : "#000"} strokeWidth="2"
                        />
                        <circle cx={xPositions[0]} cy={yToPos(group1.xBar)} r="5" fill={g1Color} stroke={darkMode ? "#cbd5e1" : "#000"} strokeWidth="1.5" />
                        <circle cx={xPositions[1]} cy={yToPos(group2.xBar)} r="5" fill={g2Color} stroke={darkMode ? "#cbd5e1" : "#000"} strokeWidth="1.5" />
                    </>
                )}

                {/* Error Bars */}
                {errorType !== 'none' && (
                    <>
                        {/* Group 1 Error Bar */}
                        <line
                            x1={xPositions[0]} y1={yToPos(group1.xBar - g1Error)}
                            x2={xPositions[0]} y2={yToPos(group1.xBar + g1Error)}
                            stroke={darkMode ? "#cbd5e1" : "#000"} strokeWidth="1.5"
                        />
                        <line x1={xPositions[0] - 10} y1={yToPos(group1.xBar - g1Error)} x2={xPositions[0] + 10} y2={yToPos(group1.xBar - g1Error)} stroke={darkMode ? "#cbd5e1" : "#000"} strokeWidth="1.5" />
                        <line x1={xPositions[0] - 10} y1={yToPos(group1.xBar + g1Error)} x2={xPositions[0] + 10} y2={yToPos(group1.xBar + g1Error)} stroke={darkMode ? "#cbd5e1" : "#000"} strokeWidth="1.5" />

                        {/* Group 2 Error Bar */}
                        <line
                            x1={xPositions[1]} y1={yToPos(group2.xBar - g2Error)}
                            x2={xPositions[1]} y2={yToPos(group2.xBar + g2Error)}
                            stroke={darkMode ? "#cbd5e1" : "#000"} strokeWidth="1.5"
                        />
                        <line x1={xPositions[1] - 10} y1={yToPos(group2.xBar - g2Error)} x2={xPositions[1] + 10} y2={yToPos(group2.xBar - g2Error)} stroke={darkMode ? "#cbd5e1" : "#000"} strokeWidth="1.5" />
                        <line x1={xPositions[1] - 10} y1={yToPos(group2.xBar + g2Error)} x2={xPositions[1] + 10} y2={yToPos(group2.xBar + g2Error)} stroke={darkMode ? "#cbd5e1" : "#000"} strokeWidth="1.5" />
                    </>
                )}
            </svg>
        </div>
    );
};

export default IndependentTTestPlots;
