import React, { useMemo } from 'react';

const WIDTH = 760;
const HEIGHT = 360;
const MARGIN = {
    top: 24,
    right: 36,
    bottom: 54,
    left: 52,
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

const MultipleRegressionPlanePlot = ({
    stats = null,
    darkMode,
    predictorLabels = ['Predictor X1', 'Predictor X2'],
    outcomeLabel = 'Outcome',
    selectedPointId = null,
    onPointSelect = null,
    predictionTarget = null,
    title = '3D Regression Plane',
    subtitle = '',
}) => {
    const geometry = useMemo(() => {
        if (!stats?.ok || stats.predictorCount !== 2 || !stats.pairs?.length) {
            return null;
        }

        const x1Values = stats.predictorMatrix.map((row) => row[0]);
        const x2Values = stats.predictorMatrix.map((row) => row[1]);
        const yValues = stats.pairs.flatMap((pair) => [pair.y, pair.fitted]);
        const predictionX1 = Number(predictionTarget?.predictorValues?.['Predictor X1']);
        const predictionX2 = Number(predictionTarget?.predictorValues?.['Predictor X2']);
        const predictionY = Number(predictionTarget?.fitted);

        if (Number.isFinite(predictionX1) && Number.isFinite(predictionX2) && Number.isFinite(predictionY)) {
            x1Values.push(predictionX1);
            x2Values.push(predictionX2);
            yValues.push(predictionY);
        }

        const minX1 = Math.min(...x1Values);
        const maxX1 = Math.max(...x1Values);
        const minX2 = Math.min(...x2Values);
        const maxX2 = Math.max(...x2Values);
        const minY = Math.min(...yValues);
        const maxY = Math.max(...yValues);
        const x1Span = Math.max(1e-9, maxX1 - minX1);
        const x2Span = Math.max(1e-9, maxX2 - minX2);
        const ySpan = Math.max(1e-9, maxY - minY);
        const planeWidth = WIDTH - MARGIN.left - MARGIN.right - 132;
        const planeDepthX = 122;
        const planeDepthY = 74;
        const planeHeight = HEIGHT - MARGIN.top - MARGIN.bottom - 42;
        const baseX = MARGIN.left + 26;
        const baseY = HEIGHT - MARGIN.bottom;
        const normalizeX1 = (value) => (value - minX1) / x1Span;
        const normalizeX2 = (value) => (value - minX2) / x2Span;
        const normalizeY = (value) => (value - minY) / ySpan;
        const project = (x1Value, x2Value, yValue) => {
            const x1Ratio = normalizeX1(x1Value);
            const x2Ratio = normalizeX2(x2Value);
            const yRatio = normalizeY(yValue);

            return {
                x: baseX + (x1Ratio * planeWidth) + (x2Ratio * planeDepthX),
                y: baseY - (yRatio * planeHeight) - (x2Ratio * planeDepthY),
            };
        };

        const planeCorners = [
            { x1: minX1, x2: minX2 },
            { x1: maxX1, x2: minX2 },
            { x1: maxX1, x2: maxX2 },
            { x1: minX1, x2: maxX2 },
        ].map((corner) => ({
            ...corner,
            fitted: stats.intercept + (corner.x1 * stats.betaVector[1]) + (corner.x2 * stats.betaVector[2]),
        }));
        const selectedPair = stats.pairs.find((pair) => pair.id === selectedPointId || pair.index === selectedPointId) || null;

        return {
            project,
            baseX,
            baseY,
            planeWidth,
            planeDepthX,
            planeDepthY,
            planeHeight,
            planeCorners,
            gridLines: Array.from({ length: 4 }, (_, index) => {
                const ratio = (index + 1) / 5;
                const x1Value = minX1 + (x1Span * ratio);
                const x2Value = minX2 + (x2Span * ratio);

                return {
                    x1Constant: [
                        { x1: x1Value, x2: minX2 },
                        { x1: x1Value, x2: maxX2 },
                    ].map((point) => ({
                        ...project(point.x1, point.x2, stats.intercept + (point.x1 * stats.betaVector[1]) + (point.x2 * stats.betaVector[2])),
                    })),
                    x2Constant: [
                        { x1: minX1, x2: x2Value },
                        { x1: maxX1, x2: x2Value },
                    ].map((point) => ({
                        ...project(point.x1, point.x2, stats.intercept + (point.x1 * stats.betaVector[1]) + (point.x2 * stats.betaVector[2])),
                    })),
                };
            }),
            points: stats.pairs.map((pair) => ({
                id: pair.id,
                actual: project(pair.predictorValues[0], pair.predictorValues[1], pair.y),
                fitted: project(pair.predictorValues[0], pair.predictorValues[1], pair.fitted),
                isHighlighted: pair.id === selectedPointId || pair.index === selectedPointId,
            })),
            selectedSegment: selectedPair ? {
                actual: project(selectedPair.predictorValues[0], selectedPair.predictorValues[1], selectedPair.y),
                fitted: project(selectedPair.predictorValues[0], selectedPair.predictorValues[1], selectedPair.fitted),
            } : null,
            predictionPoint: Number.isFinite(predictionX1) && Number.isFinite(predictionX2) && Number.isFinite(predictionY)
                ? project(predictionX1, predictionX2, predictionY)
                : null,
            axisEnds: {
                x1: project(maxX1, minX2, minY),
                x2: project(minX1, maxX2, minY),
                y: project(minX1, minX2, maxY),
            },
            x1Ticks: Array.from({ length: 4 }, (_, index) => {
                const ratio = index / 3;
                const value = minX1 + (x1Span * ratio);
                return {
                    value,
                    point: project(value, minX2, minY),
                };
            }),
            x2Ticks: Array.from({ length: 4 }, (_, index) => {
                const ratio = index / 3;
                const value = minX2 + (x2Span * ratio);
                return {
                    value,
                    point: project(minX1, value, minY),
                };
            }),
            yTicks: Array.from({ length: 4 }, (_, index) => {
                const ratio = index / 3;
                const value = minY + (ySpan * ratio);
                return {
                    value,
                    point: project(minX1, minX2, value),
                };
            }),
        };
    }, [stats, selectedPointId, predictionTarget]);

    if (!geometry) {
        return (
            <div className={`rounded-2xl border p-6 ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                The 3D plane view is available for the two-predictor lesson view.
            </div>
        );
    }

    const axisColor = darkMode ? '#64748b' : '#94a3b8';
    const gridColor = darkMode ? 'rgba(148, 163, 184, 0.18)' : 'rgba(148, 163, 184, 0.3)';
    const textColor = darkMode ? '#e2e8f0' : '#0f172a';
    const labelColor = darkMode ? '#94a3b8' : '#64748b';
    const planeOutline = darkMode ? 'rgba(99, 102, 241, 0.95)' : 'rgba(79, 70, 229, 0.9)';

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
                    <defs>
                        <linearGradient id="multiple-regression-plane-fill" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor={darkMode ? 'rgba(99, 102, 241, 0.45)' : 'rgba(99, 102, 241, 0.25)'} />
                            <stop offset="100%" stopColor={darkMode ? 'rgba(16, 185, 129, 0.18)' : 'rgba(16, 185, 129, 0.16)'} />
                        </linearGradient>
                    </defs>

                    {geometry.gridLines.map((lineSet, index) => (
                        <g key={`grid-${index}`}>
                            <line
                                x1={lineSet.x1Constant[0].x}
                                y1={lineSet.x1Constant[0].y}
                                x2={lineSet.x1Constant[1].x}
                                y2={lineSet.x1Constant[1].y}
                                stroke={gridColor}
                                strokeWidth="1"
                            />
                            <line
                                x1={lineSet.x2Constant[0].x}
                                y1={lineSet.x2Constant[0].y}
                                x2={lineSet.x2Constant[1].x}
                                y2={lineSet.x2Constant[1].y}
                                stroke={gridColor}
                                strokeWidth="1"
                            />
                        </g>
                    ))}

                    <polygon
                        points={geometry.planeCorners.map((corner) => {
                            const point = geometry.project(corner.x1, corner.x2, corner.fitted);
                            return `${point.x},${point.y}`;
                        }).join(' ')}
                        fill="url(#multiple-regression-plane-fill)"
                        stroke={planeOutline}
                        strokeWidth="2"
                    />

                    <line x1={geometry.baseX} y1={geometry.baseY} x2={geometry.axisEnds.x1.x} y2={geometry.axisEnds.x1.y} stroke={axisColor} strokeWidth="2" />
                    <line x1={geometry.baseX} y1={geometry.baseY} x2={geometry.axisEnds.x2.x} y2={geometry.axisEnds.x2.y} stroke={axisColor} strokeWidth="2" />
                    <line x1={geometry.baseX} y1={geometry.baseY} x2={geometry.axisEnds.y.x} y2={geometry.axisEnds.y.y} stroke={axisColor} strokeWidth="2" />

                    {geometry.x1Ticks.map((tick) => (
                        <g key={`x1-${tick.value}`}>
                            <text x={tick.point.x} y={tick.point.y + 18} textAnchor="middle" fill={labelColor} fontSize="11" fontWeight="700">
                                {formatTick(tick.value)}
                            </text>
                        </g>
                    ))}

                    {geometry.x2Ticks.map((tick) => (
                        <g key={`x2-${tick.value}`}>
                            <text x={tick.point.x - 10} y={tick.point.y + 6} textAnchor="end" fill={labelColor} fontSize="11" fontWeight="700">
                                {formatTick(tick.value)}
                            </text>
                        </g>
                    ))}

                    {geometry.yTicks.map((tick) => (
                        <g key={`y-${tick.value}`}>
                            <text x={tick.point.x - 10} y={tick.point.y + 4} textAnchor="end" fill={labelColor} fontSize="11" fontWeight="700">
                                {formatTick(tick.value)}
                            </text>
                        </g>
                    ))}

                    {geometry.points.map((point) => (
                        <circle
                            key={point.id}
                            cx={point.actual.x}
                            cy={point.actual.y}
                            r={point.isHighlighted ? 6.2 : 4.8}
                            fill={point.isHighlighted ? '#f97316' : (darkMode ? '#38bdf8' : '#0284c7')}
                            stroke={darkMode ? '#020617' : '#ffffff'}
                            strokeWidth={point.isHighlighted ? 2.3 : 1.7}
                            opacity={point.isHighlighted ? 1 : 0.85}
                            className={onPointSelect ? 'cursor-pointer' : ''}
                            onClick={() => onPointSelect?.(point.id)}
                        />
                    ))}

                    {geometry.selectedSegment && (
                        <line
                            x1={geometry.selectedSegment.actual.x}
                            y1={geometry.selectedSegment.actual.y}
                            x2={geometry.selectedSegment.fitted.x}
                            y2={geometry.selectedSegment.fitted.y}
                            stroke={darkMode ? '#fb923c' : '#ea580c'}
                            strokeWidth="3"
                            strokeLinecap="round"
                        />
                    )}

                    {geometry.predictionPoint && (
                        <path
                            d={`M ${geometry.predictionPoint.x} ${geometry.predictionPoint.y - 8} L ${geometry.predictionPoint.x + 8} ${geometry.predictionPoint.y} L ${geometry.predictionPoint.x} ${geometry.predictionPoint.y + 8} L ${geometry.predictionPoint.x - 8} ${geometry.predictionPoint.y} Z`}
                            fill={darkMode ? '#facc15' : '#ca8a04'}
                            stroke={darkMode ? '#020617' : '#ffffff'}
                            strokeWidth="2"
                        />
                    )}

                    <text x={geometry.axisEnds.x1.x + 8} y={geometry.axisEnds.x1.y + 8} fill={textColor} fontSize="13" fontWeight="800">
                        {predictorLabels[0]}
                    </text>
                    <text x={geometry.axisEnds.x2.x - 10} y={geometry.axisEnds.x2.y - 10} textAnchor="end" fill={textColor} fontSize="13" fontWeight="800">
                        {predictorLabels[1]}
                    </text>
                    <text x={geometry.axisEnds.y.x - 8} y={geometry.axisEnds.y.y - 8} textAnchor="end" fill={textColor} fontSize="13" fontWeight="800">
                        {outcomeLabel}
                    </text>
                </svg>
            </div>
        </div>
    );
};

export default MultipleRegressionPlanePlot;
