import React, { useMemo } from 'react';

const parseRawValues = (rawText = '') =>
    rawText.replace(/,/g, ' ').split(/\s+/).map((value) => parseFloat(value)).filter((value) => !Number.isNaN(value));

const PairedTTestPlots = ({ stats, group1, group2, settings, darkMode }) => {
    const {
        type = 'paired',
        errorType = 'se',
        showGrid = true,
        condition1Color = '#6366f1',
        condition2Color = '#10b981',
        differenceColor = '#f59e0b',
        yMin = null,
        yMax = null,
        yLabel = 'Score',
    } = settings;

    const rawPairs = useMemo(() => {
        const firstValues = stats.raw1?.length ? stats.raw1 : parseRawValues(group1.raw);
        const secondValues = stats.raw2?.length ? stats.raw2 : parseRawValues(group2.raw);
        const pairCount = Math.min(firstValues.length, secondValues.length);

        return Array.from({ length: pairCount }, (_, index) => ({
            first: firstValues[index],
            second: secondValues[index],
            difference: firstValues[index] - secondValues[index],
        })).filter((pair) => Number.isFinite(pair.first) && Number.isFinite(pair.second));
    }, [group1.raw, group2.raw, stats.raw1, stats.raw2]);

    const margin = { top: 34, right: 34, bottom: 56, left: 66 };
    const width = 520;
    const height = 300;
    const plotWidth = width - margin.left - margin.right;
    const plotHeight = height - margin.top - margin.bottom;
    const conditionError = (sd) => errorType === 'sd' ? sd : errorType === 'se' ? sd / Math.sqrt(Math.max(1, stats.n)) : 0;
    const c1Error = conditionError(stats.sd1 || 0);
    const c2Error = conditionError(stats.sd2 || 0);
    const scoreValues = rawPairs.flatMap((pair) => [pair.first, pair.second]);
    const differenceValues = rawPairs.map((pair) => pair.difference);
    const allValues = (type === 'change'
        ? [
            ...differenceValues,
            stats.dBar,
            0,
        ]
        : [
            ...scoreValues,
            stats.mean1,
            stats.mean2,
            stats.mean1 + c1Error,
            stats.mean1 - c1Error,
            stats.mean2 + c2Error,
            stats.mean2 - c2Error,
            0,
        ]).filter(Number.isFinite);
    const dataMin = yMin !== null ? yMin : Math.min(...allValues);
    const dataMax = yMax !== null ? yMax : Math.max(...allValues);
    const span = Math.max(1, dataMax - dataMin);
    const autoYMin = type === 'change'
        ? dataMin - (span * 0.18)
        : (dataMin >= 0 ? 0 : dataMin - (span * 0.12));
    const effectiveYMin = yMin !== null ? yMin : autoYMin;
    const effectiveYMax = yMax !== null ? yMax : dataMax + (span * 0.18);
    const yToPos = (value) => margin.top + plotHeight - ((value - effectiveYMin) / Math.max(1e-9, effectiveYMax - effectiveYMin)) * plotHeight;
    const x1 = margin.left + plotWidth * 0.32;
    const x2 = margin.left + plotWidth * 0.68;
    const xDiff = margin.left + plotWidth * 0.5;
    const baselineY = yToPos(Math.max(0, effectiveYMin));
    const lineLabelY = Math.max(margin.top + 14, Math.min(yToPos(stats.mean1), yToPos(stats.mean2)) - 12);

    const tickValues = [0, 0.25, 0.5, 0.75, 1].map((ratio) => effectiveYMin + ((effectiveYMax - effectiveYMin) * ratio));
    const jitter = (index) => Math.sin(index * 9.7) * 10;

    const renderErrorBar = (x, center, error) => {
        if (!error || errorType === 'none') return null;

        return (
            <g>
                <line x1={x} y1={yToPos(center - error)} x2={x} y2={yToPos(center + error)} stroke={darkMode ? '#e2e8f0' : '#0f172a'} strokeWidth="1.5" />
                <line x1={x - 9} y1={yToPos(center - error)} x2={x + 9} y2={yToPos(center - error)} stroke={darkMode ? '#e2e8f0' : '#0f172a'} strokeWidth="1.5" />
                <line x1={x - 9} y1={yToPos(center + error)} x2={x + 9} y2={yToPos(center + error)} stroke={darkMode ? '#e2e8f0' : '#0f172a'} strokeWidth="1.5" />
            </g>
        );
    };

    return (
        <div className={`w-full h-full flex items-center justify-center p-4 ${darkMode ? 'bg-slate-900' : 'bg-white'}`}>
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible font-sans">
                {showGrid && tickValues.map((tick) => (
                    <line key={`grid-${tick}`} x1={margin.left} y1={yToPos(tick)} x2={margin.left + plotWidth} y2={yToPos(tick)} stroke={darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(15,23,42,0.08)'} />
                ))}

                <line x1={margin.left} y1={margin.top} x2={margin.left} y2={margin.top + plotHeight} stroke={darkMode ? '#cbd5e1' : '#0f172a'} strokeWidth="1.5" />
                <line x1={margin.left} y1={margin.top + plotHeight} x2={margin.left + plotWidth} y2={margin.top + plotHeight} stroke={darkMode ? '#cbd5e1' : '#0f172a'} strokeWidth="1.5" />

                {tickValues.map((tick) => (
                    <g key={`tick-${tick}`}>
                        <line x1={margin.left - 5} y1={yToPos(tick)} x2={margin.left} y2={yToPos(tick)} stroke={darkMode ? '#cbd5e1' : '#0f172a'} />
                        <text x={margin.left - 10} y={yToPos(tick) + 4} textAnchor="end" fontSize="10" fill={darkMode ? '#94a3b8' : '#475569'}>{tick.toFixed(1)}</text>
                    </g>
                ))}

                <text x={24} y={margin.top + plotHeight / 2} textAnchor="middle" fontSize="12" fontWeight="800" transform={`rotate(-90, 24, ${margin.top + plotHeight / 2})`} fill={darkMode ? '#94a3b8' : '#475569'}>{yLabel}</text>

                {type === 'bar' && (
                    <>
                        {[{ x: x1, mean: stats.mean1, error: c1Error, color: condition1Color }, { x: x2, mean: stats.mean2, error: c2Error, color: condition2Color }].map((bar, index) => (
                            <g key={`bar-${index}`}>
                                <rect x={bar.x - 32} y={Math.min(yToPos(bar.mean), baselineY)} width="64" height={Math.abs(baselineY - yToPos(bar.mean))} fill={bar.color} opacity="0.72" stroke={darkMode ? '#e2e8f0' : '#0f172a'} />
                                {renderErrorBar(bar.x, bar.mean, bar.error)}
                            </g>
                        ))}
                    </>
                )}

                {type === 'paired' && rawPairs.map((pair, index) => (
                    <g key={`pair-${index}`} opacity="0.72">
                        <line x1={x1 + jitter(index)} y1={yToPos(pair.first)} x2={x2 + jitter(index)} y2={yToPos(pair.second)} stroke={pair.second >= pair.first ? '#22c55e' : '#f97316'} strokeWidth="1.4" opacity="0.55" />
                        <circle cx={x1 + jitter(index)} cy={yToPos(pair.first)} r="3" fill={condition1Color} />
                        <circle cx={x2 + jitter(index)} cy={yToPos(pair.second)} r="3" fill={condition2Color} />
                    </g>
                ))}

                {type === 'line' && (
                    <>
                        <line x1={x1} y1={yToPos(stats.mean1)} x2={x2} y2={yToPos(stats.mean2)} stroke={stats.mean2 >= stats.mean1 ? '#22c55e' : '#f97316'} strokeWidth="4" strokeLinecap="round" opacity="0.85" />
                        <text x={(x1 + x2) / 2} y={lineLabelY} textAnchor="middle" fontSize="10" fontWeight="800" fill={darkMode ? '#cbd5e1' : '#475569'}>
                            C2 - C1 = {(stats.mean2 - stats.mean1).toFixed(2)}
                        </text>
                    </>
                )}

                {type === 'change' && (
                    <>
                        <line x1={margin.left} y1={yToPos(0)} x2={margin.left + plotWidth} y2={yToPos(0)} stroke={darkMode ? '#64748b' : '#94a3b8'} strokeDasharray="4,3" />
                        {rawPairs.map((pair, index) => (
                            <circle key={`diff-${index}`} cx={xDiff + jitter(index)} cy={yToPos(pair.difference)} r="3.2" fill={differenceColor} opacity="0.62" />
                        ))}
                        <line x1={xDiff - 46} y1={yToPos(stats.dBar)} x2={xDiff + 46} y2={yToPos(stats.dBar)} stroke={differenceColor} strokeWidth="3" />
                    </>
                )}

                {type !== 'change' && (
                    <>
                        <circle cx={x1} cy={yToPos(stats.mean1)} r="5" fill={condition1Color} stroke={darkMode ? '#020617' : '#ffffff'} strokeWidth="2" />
                        <circle cx={x2} cy={yToPos(stats.mean2)} r="5" fill={condition2Color} stroke={darkMode ? '#020617' : '#ffffff'} strokeWidth="2" />
                    </>
                )}

                {type !== 'change' ? (
                    <>
                        <text x={x1} y={margin.top + plotHeight + 22} textAnchor="middle" fontSize="11" fontWeight="800" fill={darkMode ? '#cbd5e1' : '#0f172a'}>{group1.name || 'Condition 1'}</text>
                        <text x={x2} y={margin.top + plotHeight + 22} textAnchor="middle" fontSize="11" fontWeight="800" fill={darkMode ? '#cbd5e1' : '#0f172a'}>{group2.name || 'Condition 2'}</text>
                    </>
                ) : (
                    <>
                        <text x={xDiff} y={margin.top + plotHeight + 22} textAnchor="middle" fontSize="11" fontWeight="800" fill={darkMode ? '#cbd5e1' : '#0f172a'}>Difference scores ({group1.name || 'Condition 1'} - {group2.name || 'Condition 2'})</text>
                        <text x={xDiff} y={height - 10} textAnchor="middle" fontSize="10" fontWeight="800" fill={darkMode ? '#fbbf24' : '#92400e'}>Mean difference = {stats.dBar.toFixed(2)}</text>
                    </>
                )}
            </svg>
        </div>
    );
};

export default PairedTTestPlots;
