import React, { useMemo, useState } from 'react';
import {
    centralFDensity,
    centralFQuantile,
    noncentralFDensity,
    noncentralFQuantile,
} from '../../power/fMath';
import { roundTo } from '../../power/math';

const WIDTH = 640;
const HEIGHT = 320;
const MARGIN = { top: 28, right: 24, bottom: 44, left: 54 };
const TAIL_PERCENTILE = 0.995;
const X_PADDING_RATIO = 1.08;
const ALPHA_SYMBOL = '\u03b1';
const BETA_SYMBOL = '\u03b2';
const POWER_SYMBOL = 'Power (1\u2212\u03b2)';

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const buildLinePath = (points) => points.map((point, index) => (
    `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`
)).join(' ');

const buildAreaPath = (points, baselineY) => {
    if (!points.length) {
        return '';
    }

    const first = points[0];
    const last = points[points.length - 1];
    return `M ${first.x.toFixed(2)} ${baselineY.toFixed(2)} L ${points.map((point) => `${point.x.toFixed(2)} ${point.y.toFixed(2)}`).join(' L ')} L ${last.x.toFixed(2)} ${baselineY.toFixed(2)} Z`;
};

const buildRegionLabelAnchor = ({
    points,
    yKey,
    preferredRatio,
    baselineY,
}) => {
    if (!points.length) {
        return null;
    }

    const index = clamp(
        Math.round((points.length - 1) * preferredRatio),
        0,
        points.length - 1
    );
    const point = points[index];

    return {
        x: clamp(point.x, MARGIN.left + 20, WIDTH - MARGIN.right - 28),
        y: clamp(
            Math.min(baselineY - 14, point[yKey] + 22),
            MARGIN.top + 18,
            baselineY - 14
        ),
    };
};

const PlotLabel = ({ x, y, fill, stroke, children }) => (
    <text
        x={x}
        y={y}
        textAnchor="middle"
        fill={fill}
        fontSize="11"
        fontWeight="800"
        stroke={stroke}
        strokeWidth="3"
        paintOrder="stroke"
    >
        {children}
    </text>
);

const FPowerDistributionVisual = ({ config, darkMode }) => {
    const powerMeta = config?.powerMeta || {};
    const [showAlternative, setShowAlternative] = useState(true);
    const [showLabels, setShowLabels] = useState(true);
    const groupCount = Math.max(2, Math.round(Number(powerMeta?.groupCount) || 2));
    const perGroupSampleSize = Number(powerMeta?.perGroupSampleSize);
    const perGroupText = Number.isFinite(perGroupSampleSize)
        ? (powerMeta?.isPerGroupExact
            ? `${Math.round(perGroupSampleSize)} per group`
            : `about ${roundTo(perGroupSampleSize, 2)} per group`)
        : 'balanced groups';

    const chartModel = useMemo(() => {
        const criticalValue = Number(powerMeta?.criticalValue);
        const numeratorDf = Number(powerMeta?.numeratorDf);
        const denominatorDf = Number(powerMeta?.denominatorDf);
        const noncentrality = Math.max(0, Number(powerMeta?.noncentrality));

        if (!(criticalValue > 0) || !(numeratorDf > 0) || !(denominatorDf > 0)) {
            return null;
        }

        const h0UpperQuantile = centralFQuantile({
            probability: TAIL_PERCENTILE,
            numeratorDf,
            denominatorDf,
        });
        const h1UpperQuantile = noncentralFQuantile({
            probability: TAIL_PERCENTILE,
            numeratorDf,
            denominatorDf,
            noncentrality,
        });
        const maxX = Math.max(
            1.5,
            criticalValue * 1.08,
            h0UpperQuantile,
            h1UpperQuantile
        ) * X_PADDING_RATIO;
        const plotWidth = WIDTH - MARGIN.left - MARGIN.right;
        const plotHeight = HEIGHT - MARGIN.top - MARGIN.bottom;
        const steps = 200;
        const rawPoints = [];
        let maxDensity = 0;

        for (let index = 0; index <= steps; index += 1) {
            const fValue = (index / steps) * maxX;
            const h0Density = centralFDensity(fValue, numeratorDf, denominatorDf);
            const h1Density = noncentralFDensity(fValue, numeratorDf, denominatorDf, noncentrality);
            maxDensity = Math.max(maxDensity, h0Density, h1Density);
            rawPoints.push({
                fValue,
                h0Density,
                h1Density,
            });
        }

        const densityScale = maxDensity > 0 ? plotHeight / maxDensity : 1;
        const baselineY = HEIGHT - MARGIN.bottom;
        const plottedPoints = rawPoints.map((point) => ({
            fValue: point.fValue,
            x: MARGIN.left + (point.fValue / maxX) * plotWidth,
            h0Y: baselineY - (point.h0Density * densityScale),
            h1Y: baselineY - (point.h1Density * densityScale),
        }));

        const criticalX = MARGIN.left + (criticalValue / maxX) * plotWidth;
        const alphaPoints = plottedPoints.filter((point) => point.fValue >= criticalValue);
        const betaPoints = plottedPoints.filter((point) => point.fValue <= criticalValue);
        const powerPoints = plottedPoints.filter((point) => point.fValue >= criticalValue);
        const alphaArea = alphaPoints.map((point) => ({ x: point.x, y: point.h0Y }));
        const betaArea = betaPoints.map((point) => ({ x: point.x, y: point.h1Y }));
        const powerArea = powerPoints.map((point) => ({ x: point.x, y: point.h1Y }));
        const xTicks = Array.from({ length: 5 }, (_, index) => {
            const ratio = index / 4;
            const value = maxX * ratio;
            return {
                value,
                x: MARGIN.left + ratio * plotWidth,
            };
        });

        return {
            baselineY,
            maxX,
            criticalValue,
            criticalX,
            h0Line: plottedPoints.map((point) => ({ x: point.x, y: point.h0Y })),
            h1Line: plottedPoints.map((point) => ({ x: point.x, y: point.h1Y })),
            alphaArea,
            betaArea,
            powerArea,
            xTicks,
            regionLabels: {
                alpha: buildRegionLabelAnchor({
                    points: alphaPoints,
                    yKey: 'h0Y',
                    preferredRatio: 0.22,
                    baselineY,
                }),
                beta: buildRegionLabelAnchor({
                    points: betaPoints,
                    yKey: 'h1Y',
                    preferredRatio: 0.58,
                    baselineY,
                }),
                power: buildRegionLabelAnchor({
                    points: powerPoints,
                    yKey: 'h1Y',
                    preferredRatio: 0.62,
                    baselineY,
                }),
            },
        };
    }, [powerMeta]);

    if (!chartModel) {
        return (
            <div className={`rounded-xl border p-5 ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                The F-distribution planning plot will appear here once the ANOVA solver returns a valid design.
            </div>
        );
    }

    const axisColor = darkMode ? '#334155' : '#cbd5e1';
    const textColor = darkMode ? '#e2e8f0' : '#0f172a';
    const labelColor = darkMode ? '#94a3b8' : '#64748b';
    const h0Color = darkMode ? '#818cf8' : '#4f46e5';
    const h1Color = darkMode ? '#22c55e' : '#15803d';
    const labelStroke = darkMode ? '#020617' : '#ffffff';

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                    Balanced one-way ANOVA view: central F under H0 and noncentral F under H1 for {groupCount} groups ({perGroupText}).
                </div>
                <div className={`rounded-xl border p-1 flex gap-1 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                    <button
                        onClick={() => setShowAlternative((value) => !value)}
                        className={`px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${showAlternative ? 'bg-emerald-500 text-slate-950 shadow-lg' : (darkMode ? 'text-slate-500 hover:text-slate-200 hover:bg-slate-900' : 'text-slate-500 hover:text-slate-900 hover:bg-white')}`}
                    >
                        H1
                    </button>
                    <button
                        onClick={() => setShowLabels((value) => !value)}
                        className={`px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${showLabels ? 'bg-amber-500 text-slate-950 shadow-lg' : (darkMode ? 'text-slate-500 hover:text-slate-200 hover:bg-slate-900' : 'text-slate-500 hover:text-slate-900 hover:bg-white')}`}
                    >
                        Labels
                    </button>
                </div>
            </div>

            <div className={`rounded-2xl border ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full h-auto">
                    <line
                        x1={MARGIN.left}
                        x2={MARGIN.left}
                        y1={MARGIN.top}
                        y2={chartModel.baselineY}
                        stroke={axisColor}
                        strokeWidth="1.5"
                    />
                    <line
                        x1={MARGIN.left}
                        x2={WIDTH - MARGIN.right}
                        y1={chartModel.baselineY}
                        y2={chartModel.baselineY}
                        stroke={axisColor}
                        strokeWidth="1.5"
                    />

                    {chartModel.xTicks.map((tick, index) => (
                        <g key={`f-tick-${index}`}>
                            <line
                                x1={tick.x}
                                x2={tick.x}
                                y1={chartModel.baselineY}
                                y2={chartModel.baselineY + 6}
                                stroke={axisColor}
                                strokeWidth="1.5"
                            />
                            <text
                                x={tick.x}
                                y={chartModel.baselineY + 22}
                                textAnchor="middle"
                                fill={labelColor}
                                fontSize="11"
                                fontWeight="700"
                            >
                                {roundTo(tick.value, tick.value >= 10 ? 1 : 2).toFixed(tick.value >= 10 ? 1 : 2).replace(/\.?0+$/, '')}
                            </text>
                        </g>
                    ))}

                    <path d={buildAreaPath(chartModel.alphaArea, chartModel.baselineY)} fill="#ef4444" opacity="0.18" />

                    {showAlternative && (
                        <>
                            <path d={buildAreaPath(chartModel.betaArea, chartModel.baselineY)} fill="#f59e0b" opacity="0.20" />
                            <path d={buildAreaPath(chartModel.powerArea, chartModel.baselineY)} fill="#22c55e" opacity="0.16" />
                        </>
                    )}

                    <path
                        d={buildLinePath(chartModel.h0Line)}
                        fill="none"
                        stroke={h0Color}
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />

                    {showAlternative && (
                        <path
                            d={buildLinePath(chartModel.h1Line)}
                            fill="none"
                            stroke={h1Color}
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeDasharray="8 6"
                        />
                    )}

                    <line
                        x1={chartModel.criticalX}
                        x2={chartModel.criticalX}
                        y1={MARGIN.top}
                        y2={chartModel.baselineY}
                        stroke="#ef4444"
                        strokeWidth="2"
                        strokeDasharray="6 6"
                    />

                    {showLabels && (
                        <>
                            <text x={MARGIN.left + 16} y={MARGIN.top + 10} fill={h0Color} fontSize="11" fontWeight="800">
                                H0
                            </text>
                            {showAlternative && (
                                <text x={MARGIN.left + 56} y={MARGIN.top + 10} fill={h1Color} fontSize="11" fontWeight="800">
                                    H1
                                </text>
                            )}
                            <text
                                x={Math.min(chartModel.criticalX + 10, WIDTH - MARGIN.right - 56)}
                                y={MARGIN.top + 10}
                                fill="#ef4444"
                                fontSize="11"
                                fontWeight="800"
                            >
                                Fcrit = {roundTo(chartModel.criticalValue, 3)}
                            </text>

                            {chartModel.regionLabels.alpha && (
                                <PlotLabel x={chartModel.regionLabels.alpha.x} y={chartModel.regionLabels.alpha.y} fill="#fca5a5" stroke={labelStroke}>
                                    {ALPHA_SYMBOL}
                                </PlotLabel>
                            )}
                            {showAlternative && chartModel.regionLabels.beta && (
                                <PlotLabel x={chartModel.regionLabels.beta.x} y={chartModel.regionLabels.beta.y} fill="#fbbf24" stroke={labelStroke}>
                                    {BETA_SYMBOL}
                                </PlotLabel>
                            )}
                            {showAlternative && chartModel.regionLabels.power && (
                                <PlotLabel x={chartModel.regionLabels.power.x} y={chartModel.regionLabels.power.y} fill="#4ade80" stroke={labelStroke}>
                                    {POWER_SYMBOL}
                                </PlotLabel>
                            )}
                        </>
                    )}

                    <text
                        x={(WIDTH - MARGIN.right + MARGIN.left) / 2}
                        y={HEIGHT - 10}
                        textAnchor="middle"
                        fill={textColor}
                        fontSize="12"
                        fontWeight="800"
                    >
                        F Statistic
                    </text>

                    <text
                        x="18"
                        y={(HEIGHT + MARGIN.top - MARGIN.bottom) / 2}
                        textAnchor="middle"
                        fill={textColor}
                        fontSize="12"
                        fontWeight="800"
                        transform={`rotate(-90 18 ${(HEIGHT + MARGIN.top - MARGIN.bottom) / 2})`}
                    >
                        Density
                    </text>
                </svg>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <div className={`rounded-xl border p-4 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                    <div className={`text-[10px] font-black uppercase tracking-widest mb-2 ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                        Alpha
                    </div>
                    <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                        {ALPHA_SYMBOL} = Type I error. Red marks the right-tail rejection region under the null F distribution.
                    </p>
                </div>
                <div className={`rounded-xl border p-4 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                    <div className={`text-[10px] font-black uppercase tracking-widest mb-2 ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                        Beta
                    </div>
                    <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                        {BETA_SYMBOL} = missed detection. Orange marks the part of H1 that stays left of the critical cutoff.
                    </p>
                </div>
                <div className={`rounded-xl border p-4 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                    <div className={`text-[10px] font-black uppercase tracking-widest mb-2 ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                        Power
                    </div>
                    <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                        {POWER_SYMBOL} = correct detection. Green marks the part of H1 beyond the critical F cutoff.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default FPowerDistributionVisual;
