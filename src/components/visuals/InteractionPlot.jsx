import { calculate95CI } from '../../utils/mathHelpers';

const InteractionPlot = ({
    factorA,
    factorB,
    cellStats,
    cellData,
    swapAxes,
    outcomeLabel = "Outcome",
    showRawPoints = false,
    showMarginalMeans = false,
    showErrorBars = false,
    focusMode = 'interaction', // 'interaction', 'A', 'B'
    darkMode
}) => {
    const [hoveredLine, setHoveredLine] = React.useState(null);
    const xFactor = swapAxes ? factorB : factorA;
    const lineFactor = swapAxes ? factorA : factorB;

    const xLevels = xFactor.levels;
    const lineLevels = lineFactor.levels;

    // Calculate bounds for Y axis
    const allMeans = Object.values(cellStats).map(c => c.mean);
    const allRawValues = Object.values(cellData || {}).flatMap(c => c.values || []).map(v => parseFloat(v)).filter(v => !isNaN(v));
    const allPoints = [...allMeans, ...allRawValues];

    const minY = Math.min(0, ...allPoints) * 0.9;
    const maxY = Math.max(10, ...allPoints) * 1.2;

    const width = 450;
    const height = 300;
    const padding = 60;

    const yToPos = (y) => {
        return (height - padding) - ((y - minY) / (maxY - minY + 0.0001)) * (height - 2 * padding);
    };

    const xToPos = (index) => {
        return padding + (index * (width - 2 * padding) / (xLevels.length - 1 || 1));
    };

    const colors = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'];

    // Dynamic Interpretation Logic
    const getInterpretation = () => {
        // Calculate max diff in slopes to estimate interaction strength
        const slopes = [];
        lineLevels.forEach((ll, lineIdx) => {
            const y1 = cellStats[swapAxes ? `${ll.id}_${xLevels[0].id}` : `${xLevels[0].id}_${ll.id}`]?.mean || 0;
            const y2 = cellStats[swapAxes ? `${ll.id}_${xLevels[xLevels.length - 1].id}` : `${xLevels[xLevels.length - 1].id}_${ll.id}`]?.mean || 0;
            slopes.push(y2 - y1);
        });

        const slopeDiff = Math.abs(slopes[0] - slopes[1]);
        const maxVal = Math.max(...allPoints);
        const relativeDiff = slopeDiff / (maxVal || 1);

        if (relativeDiff < 0.05) return "Lines are nearly parallel → interaction likely small.";
        if (relativeDiff > 0.2) return "Lines cross or diverge sharply → possible strong interaction.";
        return "Lines are non-parallel → potential interaction detected.";
    };

    return (
        <div className="w-full h-full flex flex-col items-center p-4">
            <div className="w-full flex justify-between items-end mb-4 px-8">
                <div className="flex flex-col gap-1">
                    <h4 className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                        {swapAxes ? `${factorB.label} on X, lines by ${factorA.label}` : `${factorA.label} on X, lines by ${factorB.label}`}
                    </h4>
                    <p className={`text-[11px] font-medium ${darkMode ? 'text-indigo-400/80' : 'text-indigo-600/80'}`}>
                        {getInterpretation()}
                    </p>
                </div>
                <div className="flex gap-4">
                    {lineLevels.map((l, i) => (
                        <div
                            key={l.id}
                            className={`flex items-center gap-2 cursor-default transition-all duration-300 ${hoveredLine !== null && hoveredLine !== i ? 'opacity-30' : 'opacity-100'}`}
                            onMouseEnter={() => setHoveredLine(i)}
                            onMouseLeave={() => setHoveredLine(null)}
                        >
                            <div className="w-3 h-1 rounded-full" style={{ backgroundColor: colors[i % colors.length] }} />
                            <span className={`text-[9px] font-bold uppercase ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{l.label}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="relative w-full h-full flex flex-col items-center">
                <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
                    {/* Y Axis Label */}
                    <text
                        x={-height / 2} y={15}
                        transform="rotate(-90)"
                        textAnchor="middle"
                        className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'fill-slate-500' : 'fill-slate-400'}`}
                    >
                        {outcomeLabel}
                    </text>

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
                            x={xToPos(i)} y={height - padding + 25}
                            textAnchor="middle"
                            className={`text-[9px] font-black uppercase tracking-widest ${darkMode ? 'fill-slate-400' : 'fill-slate-600'}`}
                        >
                            {l.label}
                        </text>
                    ))}
                    <text
                        x={width / 2} y={height - 5}
                        textAnchor="middle"
                        className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'fill-slate-500' : 'fill-slate-400'}`}
                    >
                        {xFactor.label}
                    </text>

                    {/* Lines & Points */}
                    {lineLevels.map((lineL, lineIdx) => {
                        const isActive = hoveredLine === null || hoveredLine === lineIdx;
                        const points = xLevels.map((xL, xIdx) => {
                            const aId = swapAxes ? lineL.id : xL.id;
                            const bId = swapAxes ? xL.id : lineL.id;
                            const stats = cellStats[`${aId}_${bId}`];
                            const cellRaw = cellData?.[`${aId}_${bId}`]?.values || [];
                            return {
                                x: xToPos(xIdx),
                                y: yToPos(stats?.mean || 0),
                                raw: cellRaw.map(v => parseFloat(v)).filter(v => !isNaN(v)),
                                label: stats?.mean?.toFixed(1) || "0.0"
                            };
                        });

                        const pathData = points.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(' ');

                        return (
                            <g key={lineL.id} className={`transition-all duration-300 ${isActive ? 'opacity-100' : 'opacity-10'}`}>
                                {/* Raw Points (Jittered) */}
                                {showRawPoints && points.map((p, pIdx) => (
                                    <g key={`raw-${pIdx}`}>
                                        {p.raw.map((val, vIdx) => (
                                            <circle
                                                key={vIdx}
                                                cx={p.x + (Math.sin(vIdx * 123) * 10)}
                                                cy={yToPos(val)}
                                                r="2"
                                                fill={colors[lineIdx % colors.length]}
                                                className="opacity-20"
                                            />
                                        ))}
                                    </g>
                                ))}

                                <path
                                    d={pathData}
                                    fill="none"
                                    stroke={colors[lineIdx % colors.length]}
                                    strokeWidth={isActive && hoveredLine !== null ? "5" : "3"}
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="transition-all duration-500"
                                    onMouseEnter={() => setHoveredLine(lineIdx)}
                                    onMouseLeave={() => setHoveredLine(null)}
                                />
                                {points.map((p, i) => {
                                    // De-collision logic for labels: if points are too close, offset one
                                    const otherLinesPoints = lineLevels.map((_, otherIdx) => {
                                        if (otherIdx === lineIdx) return null;
                                        const otherY = yToPos(cellStats[swapAxes ? `${lineLevels[otherIdx].id}_${xLevels[i].id}` : `${xLevels[i].id}_${lineLevels[otherIdx].id}`]?.mean || 0);
                                        return otherY;
                                    });
                                    const isTooClose = otherLinesPoints.some(y => y !== null && Math.abs(y - p.y) < 15 && y < p.y);
                                    const labelYOffset = isTooClose ? 15 : -12;

                                    return (
                                        <g key={i}>
                                            {showErrorBars && (
                                                <g>
                                                    {(() => {
                                                        const cell = cellData[swapAxes ? `${lineLevels[lineIdx].id}_${xLevels[i].id}` : `${xLevels[i].id}_${lineLevels[lineIdx].id}`];
                                                        if (!cell) return null;
                                                        const stats = cellStats[swapAxes ? `${lineLevels[lineIdx].id}_${xLevels[i].id}` : `${xLevels[i].id}_${lineLevels[lineIdx].id}`];

                                                        // Fallback for stats input
                                                        let n, sd, mean;
                                                        if (cell.inputMode === 'summary') {
                                                            n = parseFloat(cell.summary.n);
                                                            sd = parseFloat(cell.summary.sd);
                                                            mean = parseFloat(cell.summary.mean);
                                                        } else {
                                                            n = stats.n;
                                                            mean = stats.mean;
                                                            sd = Math.sqrt(stats.ss / (n - 1 || 1));
                                                        }

                                                        const { upper, lower } = calculate95CI(mean, sd, n);
                                                        const yUpper = yToPos(upper);
                                                        const yLower = yToPos(lower);

                                                        return (
                                                            <g opacity="0.5">
                                                                <line
                                                                    x1={p.x} y1={yUpper} x2={p.x} y2={yLower}
                                                                    stroke={colors[lineIdx % colors.length]} strokeWidth="1.5"
                                                                />
                                                                <line
                                                                    x1={p.x - 4} y1={yUpper} x2={p.x + 4} y2={yUpper}
                                                                    stroke={colors[lineIdx % colors.length]} strokeWidth="1.5"
                                                                />
                                                                <line
                                                                    x1={p.x - 4} y1={yLower} x2={p.x + 4} y2={yLower}
                                                                    stroke={colors[lineIdx % colors.length]} strokeWidth="1.5"
                                                                />
                                                            </g>
                                                        );
                                                    })()}
                                                </g>
                                            )}
                                            <circle
                                                cx={p.x} cy={p.y} r={isActive && hoveredLine !== null ? "7" : "5"}
                                                fill={colors[lineIdx % colors.length]}
                                                stroke={darkMode ? "#020617" : "#fff"}
                                                strokeWidth="2"
                                            />
                                            <text
                                                x={p.x} y={p.y + labelYOffset}
                                                textAnchor="middle"
                                                className={`text-[8px] font-bold ${darkMode ? 'fill-indigo-300' : 'fill-indigo-600'}`}
                                            >
                                                {p.label}
                                            </text>
                                        </g>
                                    );
                                })}
                            </g>
                        );
                    })}

                    {/* Marginal Means */}
                    {showMarginalMeans && (
                        <g opacity="0.6">
                            {xLevels.map((l, i) => {
                                // Calculate marginal mean for this level of X factor
                                const relatedCells = lineLevels.map(ll => {
                                    const aId = swapAxes ? ll.id : l.id;
                                    const bId = swapAxes ? l.id : ll.id;
                                    return cellStats[`${aId}_${bId}`];
                                }).filter(c => c && c.n > 0);

                                if (relatedCells.length === 0) return null;
                                const margMean = relatedCells.reduce((sum, c) => sum + c.mean, 0) / relatedCells.length;

                                return (
                                    <rect
                                        key={`marg-${i}`}
                                        x={xToPos(i) - 15}
                                        y={yToPos(margMean) - 1}
                                        width="30" height="2"
                                        fill={darkMode ? "#94a3b8" : "#475569"}
                                        rx="1"
                                    />
                                );
                            })}
                        </g>
                    )}
                </svg>

                {/* Educational Overlay / Key */}
                <div className={`mt-6 grid grid-cols-3 gap-4 w-full p-4 rounded-xl border ${darkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="flex flex-col gap-1">
                        <span className="text-[8px] font-black uppercase text-indigo-500">Parallel Lines</span>
                        <span className={`text-[9px] ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Little to no interaction effect.</span>
                    </div>
                    <div className="flex flex-col gap-1">
                        <span className="text-[8px] font-black uppercase text-emerald-500">Non-Parallel</span>
                        <span className={`text-[9px] ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Possible interaction detected.</span>
                    </div>
                    <div className="flex flex-col gap-1">
                        <span className="text-[8px] font-black uppercase text-rose-500">Crossing Lines</span>
                        <span className={`text-[9px] ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Strong interaction effect present.</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InteractionPlot;
