import React, { useMemo, useState } from 'react';

const toFiniteNumber = (value, fallback = 0) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
};

const summarizeGroup = (group, index) => {
    const rawValues = Array.isArray(group.values)
        ? group.values.map((value) => Number(value)).filter(Number.isFinite)
        : [];

    if (group.inputMode !== 'summary' && rawValues.length) {
        const n = rawValues.length;
        const mean = rawValues.reduce((sum, value) => sum + value, 0) / n;
        const ss = rawValues.reduce((sum, value) => sum + ((value - mean) ** 2), 0);
        const sd = n > 1 ? Math.sqrt(ss / (n - 1)) : 0;

        return {
            id: group.id ?? index,
            label: group.label || `Group ${index + 1}`,
            color: group.color || '#6366f1',
            n,
            mean,
            sd,
            values: rawValues,
        };
    }

    const mean = toFiniteNumber(group.summary?.mean);
    const sd = Math.max(0, toFiniteNumber(group.summary?.sd));
    const n = Math.max(0, Math.round(toFiniteNumber(group.summary?.n)));
    const syntheticValues = Array.from({ length: Math.min(n, 24) }, (_, itemIndex) => (
        mean + (Math.sin((itemIndex + 1) * 13.17 + index * 5.11) * sd * 0.85)
    ));

    return {
        id: group.id ?? index,
        label: group.label || `Group ${index + 1}`,
        color: group.color || '#6366f1',
        n,
        mean,
        sd,
        values: syntheticValues,
    };
};

const AnovaPlotMaker = ({ groups = [], grandMean = 0, darkMode }) => {
    const [settings, setSettings] = useState({
        type: 'dot',
        errorType: 'se',
        showGrid: true,
        showRaw: true,
        showGrandMean: true,
        yLabel: 'Score',
        yMin: '',
        yMax: '',
    });
    const [categoryPositions, setCategoryPositions] = useState({});
    const [draggingGroupId, setDraggingGroupId] = useState(null);

    const summaries = useMemo(() => (
        groups
            .map(summarizeGroup)
            .filter((group) => group.n > 0 && Number.isFinite(group.mean))
    ), [groups]);

    const width = 560;
    const height = 320;
    const margin = { top: 34, right: 38, bottom: 74, left: 68 };
    const plotWidth = width - margin.left - margin.right;
    const plotHeight = height - margin.top - margin.bottom;
    const minCategoryX = margin.left + 34;
    const maxCategoryX = margin.left + plotWidth - 34;
    const numericYMin = settings.yMin === '' ? null : Number(settings.yMin);
    const numericYMax = settings.yMax === '' ? null : Number(settings.yMax);
    const activeErrorType = settings.type === 'bar' || settings.type === 'line' ? settings.errorType : 'none';
    const errorFor = (group) => {
        if (activeErrorType === 'sd') return group.sd;
        if (activeErrorType === 'se') return group.sd / Math.sqrt(Math.max(1, group.n));
        return 0;
    };
    const allValues = summaries.flatMap((group) => [
        ...(settings.showRaw ? group.values : []),
        group.mean,
        group.mean + errorFor(group),
        group.mean - errorFor(group),
    ]).concat(settings.showGrandMean ? [grandMean] : []).filter(Number.isFinite);
    const fallbackValues = allValues.length ? allValues : [0, 1];
    const observedMin = Math.min(...fallbackValues);
    const observedMax = Math.max(...fallbackValues);
    const observedSpan = Math.max(1, observedMax - observedMin);
    const yMin = Number.isFinite(numericYMin) ? numericYMin : (observedMin >= 0 ? 0 : observedMin - observedSpan * 0.12);
    const yMax = Number.isFinite(numericYMax) ? numericYMax : observedMax + observedSpan * 0.18;
    const yToPos = (value) => margin.top + plotHeight - ((value - yMin) / Math.max(1e-9, yMax - yMin)) * plotHeight;
    const xFor = (index) => {
        const groupId = summaries[index]?.id;
        const savedPosition = categoryPositions[groupId];
        if (Number.isFinite(savedPosition)) {
            return Math.max(minCategoryX, Math.min(maxCategoryX, savedPosition));
        }
        if (summaries.length <= 1) return margin.left + plotWidth / 2;
        return margin.left + (plotWidth * ((index + 1) / (summaries.length + 1)));
    };
    const tickValues = [0, 0.25, 0.5, 0.75, 1].map((ratio) => yMin + ((yMax - yMin) * ratio));
    const baselineY = yToPos(Math.max(0, yMin));
    const linePoints = summaries.map((group, index) => `${xFor(index)},${yToPos(group.mean)}`).join(' ');

    const renderErrorBar = (group, x) => {
        const error = errorFor(group);
        if (!error || activeErrorType === 'none') return null;

        return (
            <g>
                <line x1={x} y1={yToPos(group.mean - error)} x2={x} y2={yToPos(group.mean + error)} stroke={darkMode ? '#e2e8f0' : '#0f172a'} strokeWidth="1.5" />
                <line x1={x - 9} y1={yToPos(group.mean - error)} x2={x + 9} y2={yToPos(group.mean - error)} stroke={darkMode ? '#e2e8f0' : '#0f172a'} strokeWidth="1.5" />
                <line x1={x - 9} y1={yToPos(group.mean + error)} x2={x + 9} y2={yToPos(group.mean + error)} stroke={darkMode ? '#e2e8f0' : '#0f172a'} strokeWidth="1.5" />
            </g>
        );
    };

    const pointerXToSvg = (event) => {
        const bounds = event.currentTarget.getBoundingClientRect();
        const ratio = (event.clientX - bounds.left) / Math.max(1, bounds.width);
        return ratio * width;
    };

    const updateDraggedCategory = (event) => {
        if (draggingGroupId === null) return;
        const nextX = Math.max(minCategoryX, Math.min(maxCategoryX, pointerXToSvg(event)));
        setCategoryPositions((previous) => ({
            ...previous,
            [draggingGroupId]: nextX,
        }));
    };

    return (
        <div className={`w-full h-full flex flex-col gap-3 px-5 pb-5 pt-16 ${darkMode ? 'bg-slate-950' : 'bg-white'}`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h5 className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-amber-300' : 'text-amber-700'}`}>ANOVA plot maker</h5>
                    <p className={`mt-1 text-[11px] ${darkMode ? 'text-slate-500' : 'text-slate-600'}`}>Build a presentation-ready group comparison plot from the current ANOVA data.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    {[
                        ['showGrid', 'Grid'],
                        ['showRaw', 'Raw'],
                        ['showGrandMean', 'Grand mean'],
                    ].map(([key, label]) => (
                        <button
                            key={key}
                            onClick={() => setSettings((previous) => ({ ...previous, [key]: !previous[key] }))}
                            className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest border ${settings[key] ? 'bg-emerald-600 border-emerald-500 text-white' : (darkMode ? 'bg-slate-900 border-slate-700 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600')}`}
                        >
                            {label}
                        </button>
                    ))}
                    <button
                        onClick={() => setCategoryPositions({})}
                        className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest border ${Object.keys(categoryPositions).length ? 'bg-amber-600 border-amber-500 text-white' : (darkMode ? 'bg-slate-900 border-slate-700 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600')}`}
                    >
                        Reset positions
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="space-y-2">
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Plot type</span>
                    <div className={`p-1 rounded-lg flex ${darkMode ? 'bg-slate-900' : 'bg-slate-100'}`}>
                        {[
                            ['dot', 'Dot'],
                            ['bar', 'Bar'],
                            ['line', 'Line'],
                        ].map(([id, label]) => (
                            <button key={id} onClick={() => setSettings((previous) => ({ ...previous, type: id }))} className={`flex-1 py-1 rounded text-[8px] font-black uppercase ${settings.type === id ? 'bg-amber-500 text-white' : 'text-slate-500'}`}>
                                {label}
                            </button>
                        ))}
                    </div>
                </div>

                {(settings.type === 'bar' || settings.type === 'line') && (
                    <div className="space-y-2">
                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Error bars</span>
                        <div className={`p-1 rounded-lg flex ${darkMode ? 'bg-slate-900' : 'bg-slate-100'}`}>
                            {['none', 'se', 'sd'].map((option) => (
                                <button key={option} onClick={() => setSettings((previous) => ({ ...previous, errorType: option }))} className={`flex-1 py-1 rounded text-[8px] font-black uppercase ${settings.errorType === option ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}>
                                    {option}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <input type="text" value={settings.yLabel} onChange={(event) => setSettings((previous) => ({ ...previous, yLabel: event.target.value }))} className={`self-end p-2 rounded text-xs font-bold border ${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`} placeholder="Y-axis label" />
                <div className="grid grid-cols-2 gap-2 self-end">
                    <input type="number" value={settings.yMin} onChange={(event) => setSettings((previous) => ({ ...previous, yMin: event.target.value }))} className={`p-2 rounded text-xs font-bold border ${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`} placeholder="Y min" />
                    <input type="number" value={settings.yMax} onChange={(event) => setSettings((previous) => ({ ...previous, yMax: event.target.value }))} className={`p-2 rounded text-xs font-bold border ${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`} placeholder="Y max" />
                </div>
            </div>

            <div className={`min-h-0 flex-1 rounded-xl border ${darkMode ? 'bg-slate-900/70 border-slate-800' : 'bg-white border-slate-200'}`}>
                <svg
                    viewBox={`0 0 ${width} ${height}`}
                    className="w-full h-full overflow-visible font-sans"
                    onPointerMove={updateDraggedCategory}
                    onPointerUp={() => setDraggingGroupId(null)}
                    onPointerLeave={() => setDraggingGroupId(null)}
                >
                    {settings.showGrid && tickValues.map((tick) => (
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

                    <text x={24} y={margin.top + plotHeight / 2} textAnchor="middle" fontSize="12" fontWeight="800" transform={`rotate(-90, 24, ${margin.top + plotHeight / 2})`} fill={darkMode ? '#94a3b8' : '#475569'}>{settings.yLabel}</text>

                    {settings.showGrandMean && Number.isFinite(grandMean) && (
                        <>
                            <line x1={margin.left} y1={yToPos(grandMean)} x2={margin.left + plotWidth} y2={yToPos(grandMean)} stroke="#f59e0b" strokeWidth="2" strokeDasharray="7,5" opacity="0.7" />
                            <text x={margin.left + plotWidth - 4} y={yToPos(grandMean) - 6} textAnchor="end" fontSize="9" fontWeight="800" fill="#d97706">Grand mean {grandMean.toFixed(2)}</text>
                        </>
                    )}

                    {settings.type === 'line' && summaries.length > 1 && (
                        <polyline points={linePoints} fill="none" stroke={darkMode ? '#fbbf24' : '#d97706'} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" opacity="0.82" />
                    )}

                    {summaries.map((group, index) => {
                        const x = xFor(index);
                        const barWidth = Math.max(28, Math.min(58, plotWidth / Math.max(1, summaries.length) * 0.52));

                        return (
                            <g
                                key={group.id}
                                className="cursor-ew-resize"
                                onPointerDown={(event) => {
                                    event.preventDefault();
                                    event.currentTarget.setPointerCapture?.(event.pointerId);
                                    setDraggingGroupId(group.id);
                                }}
                            >
                                {settings.type === 'bar' && (
                                    <rect x={x - barWidth / 2} y={Math.min(yToPos(group.mean), baselineY)} width={barWidth} height={Math.abs(baselineY - yToPos(group.mean))} fill={group.color} opacity="0.72" stroke={darkMode ? '#e2e8f0' : '#0f172a'} />
                                )}

                                {settings.showRaw && settings.type !== 'bar' && group.values.map((value, valueIndex) => (
                                    <circle
                                        key={`${group.id}-raw-${valueIndex}`}
                                        cx={x + Math.sin((valueIndex + 1) * 7.19 + index * 4.07) * 14}
                                        cy={yToPos(value)}
                                        r="3"
                                        fill={group.color}
                                        opacity="0.34"
                                    />
                                ))}

                                {renderErrorBar(group, x)}
                                <circle cx={x} cy={yToPos(group.mean)} r="5.5" fill={group.color} stroke={darkMode ? '#020617' : '#ffffff'} strokeWidth="2" />
                                <text x={x} y={margin.top + plotHeight + 22} textAnchor="middle" fontSize="10" fontWeight="800" fill={darkMode ? '#cbd5e1' : '#0f172a'}>{group.label}</text>
                                <text x={x} y={margin.top + plotHeight + 36} textAnchor="middle" fontSize="9" fontWeight="700" fill={darkMode ? '#64748b' : '#64748b'}>M={group.mean.toFixed(1)}, n={group.n}</text>
                            </g>
                        );
                    })}
                </svg>
            </div>
        </div>
    );
};

export default AnovaPlotMaker;
