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

const MultipleRegressionConditionalEffectPlot = ({
    stats = null,
    darkMode,
    focusPredictorId = '',
    focusLabel = 'Predictor',
    outcomeLabel = 'Outcome',
    heldValues = {},
    selectedPointId = null,
    onPointSelect = null,
    predictionTarget = null,
    title = 'Partial Effect',
    subtitle = '',
}) => {
    const geometry = useMemo(() => {
        if (!stats?.ok || !stats.pairs?.length || !focusPredictorId) {
            return null;
        }

        const focusIndex = stats.predictorSummaries.findIndex((summary) => summary.label === focusPredictorId);

        if (focusIndex < 0) {
            return null;
        }

        const coefficientById = Object.fromEntries(
            stats.coefficients
                .filter((coefficient) => coefficient.id !== 'intercept')
                .map((coefficient) => [coefficient.id, coefficient.estimate])
        );
        const resolvedHeldValues = Object.fromEntries(
            stats.predictorSummaries.map((summary) => {
                const raw = Number(heldValues?.[summary.label]);
                return [summary.label, Number.isFinite(raw) ? raw : summary.mean];
            })
        );
        const lineIntercept = stats.intercept + stats.predictorSummaries.reduce((sum, summary, predictorIndex) => {
            if (predictorIndex === focusIndex) {
                return sum;
            }

            return sum + ((coefficientById[summary.label] || 0) * resolvedHeldValues[summary.label]);
        }, 0);
        const focusSlope = coefficientById[focusPredictorId] || 0;
        const plottedPoints = stats.pairs.map((pair) => {
            const focusValue = pair.predictorValues[focusIndex];
            const adjustment = stats.predictorSummaries.reduce((sum, summary, predictorIndex) => {
                if (predictorIndex === focusIndex) {
                    return sum;
                }

                return sum + ((coefficientById[summary.label] || 0) * (pair.predictorValues[predictorIndex] - resolvedHeldValues[summary.label]));
            }, 0);
            const adjustedObserved = pair.y - adjustment;
            const conditionalFitted = lineIntercept + (focusSlope * focusValue);

            return {
                id: pair.id,
                xValue: focusValue,
                adjustedObserved,
                conditionalFitted,
            };
        });
        const xValues = plottedPoints.map((point) => point.xValue);
        const yValues = plottedPoints.flatMap((point) => [point.adjustedObserved, point.conditionalFitted]);
        const predictionX = Number(predictionTarget?.predictorValues?.[focusPredictorId]);
        const predictionY = Number(predictionTarget?.fitted);

        if (Number.isFinite(predictionX) && Number.isFinite(predictionY)) {
            xValues.push(predictionX);
            yValues.push(predictionY);
        }

        const minX = Math.min(...xValues);
        const maxX = Math.max(...xValues);
        const minY = Math.min(...yValues);
        const maxY = Math.max(...yValues);
        const xSpan = Math.max(1e-9, maxX - minX);
        const ySpan = Math.max(1e-9, maxY - minY);
        const paddedMinX = minX - (xSpan * 0.08);
        const paddedMaxX = maxX + (xSpan * 0.08);
        const paddedMinY = minY - (ySpan * 0.1);
        const paddedMaxY = maxY + (ySpan * 0.1);
        const innerWidth = WIDTH - MARGIN.left - MARGIN.right;
        const innerHeight = HEIGHT - MARGIN.top - MARGIN.bottom;
        const toSvgX = (value) => MARGIN.left + (((value - paddedMinX) / Math.max(1e-9, paddedMaxX - paddedMinX)) * innerWidth);
        const toSvgY = (value) => MARGIN.top + (innerHeight * (1 - ((value - paddedMinY) / Math.max(1e-9, paddedMaxY - paddedMinY))));
        const selectedPoint = plottedPoints.find((point) => point.id === selectedPointId) || null;

        return {
            points: plottedPoints.map((point) => ({
                id: point.id,
                x: toSvgX(point.xValue),
                y: toSvgY(point.adjustedObserved),
                fittedY: toSvgY(point.conditionalFitted),
                isHighlighted: point.id === selectedPointId,
            })),
            selectedSegment: selectedPoint ? {
                x: toSvgX(selectedPoint.xValue),
                y1: toSvgY(selectedPoint.conditionalFitted),
                y2: toSvgY(selectedPoint.adjustedObserved),
            } : null,
            line: {
                x1: toSvgX(paddedMinX),
                y1: toSvgY(lineIntercept + (focusSlope * paddedMinX)),
                x2: toSvgX(paddedMaxX),
                y2: toSvgY(lineIntercept + (focusSlope * paddedMaxX)),
            },
            predictionPoint: Number.isFinite(predictionX) && Number.isFinite(predictionY) ? {
                x: toSvgX(predictionX),
                y: toSvgY(predictionY),
            } : null,
            xTicks: Array.from({ length: 5 }, (_, index) => {
                const ratio = index / 4;
                const value = paddedMinX + ((paddedMaxX - paddedMinX) * ratio);
                return {
                    value,
                    x: toSvgX(value),
                };
            }),
            yTicks: Array.from({ length: 5 }, (_, index) => {
                const ratio = index / 4;
                const value = paddedMinY + ((paddedMaxY - paddedMinY) * ratio);
                return {
                    value,
                    y: toSvgY(value),
                };
            }),
        };
    }, [stats, focusPredictorId, heldValues, predictionTarget, selectedPointId]);

    if (!geometry) {
        return (
            <div className={`rounded-2xl border p-6 ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                Add valid multiple-regression data to see the conditional slope view.
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
                    {geometry.yTicks.map((tick) => (
                        <g key={`y-${tick.value}`}>
                            <line
                                x1={MARGIN.left}
                                x2={WIDTH - MARGIN.right}
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
                                {formatTick(tick.value)}
                            </text>
                        </g>
                    ))}

                    {geometry.xTicks.map((tick) => (
                        <g key={`x-${tick.value}`}>
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
                                y={HEIGHT - MARGIN.bottom + 20}
                                textAnchor="middle"
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
                        x1={geometry.line.x1}
                        y1={geometry.line.y1}
                        x2={geometry.line.x2}
                        y2={geometry.line.y2}
                        stroke={darkMode ? '#22c55e' : '#15803d'}
                        strokeWidth="3"
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
                        <path
                            d={`M ${geometry.predictionPoint.x} ${geometry.predictionPoint.y - 8} L ${geometry.predictionPoint.x + 8} ${geometry.predictionPoint.y} L ${geometry.predictionPoint.x} ${geometry.predictionPoint.y + 8} L ${geometry.predictionPoint.x - 8} ${geometry.predictionPoint.y} Z`}
                            fill={darkMode ? '#facc15' : '#ca8a04'}
                            stroke={darkMode ? '#020617' : '#ffffff'}
                            strokeWidth="2"
                        />
                    )}

                    <text
                        x={(WIDTH - MARGIN.right + MARGIN.left) / 2}
                        y={HEIGHT - 12}
                        textAnchor="middle"
                        fill={textColor}
                        fontSize="13"
                        fontWeight="800"
                    >
                        {focusLabel}
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
                        Adjusted {outcomeLabel}
                    </text>
                </svg>
            </div>
        </div>
    );
};

export default MultipleRegressionConditionalEffectPlot;
