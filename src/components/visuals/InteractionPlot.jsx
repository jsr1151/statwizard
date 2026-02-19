import React from 'react';

const InteractionPlot = ({ factorA, factorB, cellStats, swapAxes, darkMode }) => {
    const xFactor = swapAxes ? factorB : factorA;
    const lineFactor = swapAxes ? factorA : factorB;

    const xLevels = xFactor.levels;
    const lineLevels = lineFactor.levels;

    // Calculate bounds for Y axis
    const allMeans = Object.values(cellStats).map(c => c.mean);
    const minY = Math.min(0, ...allMeans) * 0.9;
    const maxY = Math.max(10, ...allMeans) * 1.2;

    const width = 400;
    const height = 240;
    const padding = 40;

    const yToPos = (y) => {
        return (height - padding) - ((y - minY) / (maxY - minY)) * (height - 2 * padding);
    };

    const xToPos = (index) => {
        return padding + (index * (width - 2 * padding) / (xLevels.length - 1 || 1));
    };

    const colors = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'];

    return (
        <div className="w-full h-full flex flex-col items-center justify-center p-4">
            <div className="w-full flex justify-between items-center mb-4 px-8">
                <h4 className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    {swapAxes ? `${factorB.label} on X, lines by ${factorA.label}` : `${factorA.label} on X, lines by ${factorB.label}`}
                </h4>
                <div className="flex gap-4">
                    {lineLevels.map((l, i) => (
                        <div key={l.id} className="flex items-center gap-2">
                            <div className="w-3 h-1 rounded-full" style={{ backgroundColor: colors[i % colors.length] }} />
                            <span className="text-[9px] font-bold text-slate-500 uppercase">{l.label}</span>
                        </div>
                    ))}
                </div>
            </div>

            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
                {/* Grid Lines */}
                {[0, 0.25, 0.5, 0.75, 1].map(p => {
                    const val = minY + p * (maxY - minY);
                    const y = yToPos(val);
                    return (
                        <g key={p}>
                            <line
                                x1={padding} y1={y} x2={width - padding} y2={y}
                                stroke={darkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"}
                                strokeWidth="1"
                            />
                            <text
                                x={padding - 10} y={y + 3}
                                textAnchor="end"
                                className={`text-[8px] font-black ${darkMode ? 'fill-slate-600' : 'fill-slate-400'}`}
                            >
                                {val.toFixed(1)}
                            </text>
                        </g>
                    );
                })}

                {/* X Axis Labels */}
                {xLevels.map((l, i) => (
                    <text
                        key={l.id}
                        x={xToPos(i)} y={height - padding + 20}
                        textAnchor="middle"
                        className={`text-[9px] font-black uppercase tracking-widest ${darkMode ? 'fill-slate-400' : 'fill-slate-600'}`}
                    >
                        {l.label}
                    </text>
                ))}

                {/* Lines */}
                {lineLevels.map((lineL, lineIdx) => {
                    const points = xLevels.map((xL, xIdx) => {
                        const aId = swapAxes ? lineL.id : xL.id;
                        const bId = swapAxes ? xL.id : lineL.id;
                        const stats = cellStats[`${aId}_${bId}`];
                        return { x: xToPos(xIdx), y: yToPos(stats?.mean || 0) };
                    });

                    const pathData = points.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(' ');

                    return (
                        <g key={lineL.id}>
                            <path
                                d={pathData}
                                fill="none"
                                stroke={colors[lineIdx % colors.length]}
                                strokeWidth="3"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="transition-all duration-500"
                            />
                            {points.map((p, i) => (
                                <g key={i}>
                                    <circle
                                        cx={p.x} cy={p.y} r="5"
                                        fill={colors[lineIdx % colors.length]}
                                        stroke={darkMode ? "#020617" : "#fff"}
                                        strokeWidth="2"
                                    />
                                    <text
                                        x={p.x} y={p.y - 10}
                                        textAnchor="middle"
                                        className={`text-[8px] font-bold ${darkMode ? 'fill-indigo-300' : 'fill-indigo-600'}`}
                                    >
                                        {(cellStats[`${swapAxes ? lineL.id : xLevels[i].id}_${swapAxes ? xLevels[i].id : lineL.id}`]?.mean || 0).toFixed(1)}
                                    </text>
                                </g>
                            ))}
                        </g>
                    );
                })}
            </svg>
        </div>
    );
};

export default InteractionPlot;
