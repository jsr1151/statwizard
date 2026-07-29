import React from 'react';
import { AlertCircle } from 'lucide-react';

const AncovaPlotPanel = ({
    covariateName,
    darkMode,
    showAdjustedMeans,
    showRawMeans,
    showRegressionLines,
    stats,
    onAdjustXChange,
    onShowAdjustedMeansChange,
    onShowRawMeansChange,
    onShowRegressionLinesChange,
}) => {
    const scaleX = (value) => ((value - stats.pMinX) / (stats.pMaxX - stats.pMinX)) * 800;
    const scaleY = (value) => 400 - (((value - stats.pMinY) / (stats.pMaxY - stats.pMinY)) * 400);
    const extrapolates = stats.validGroups.some((group) => (
        stats.adjustX < Math.min(...group.xVals) || stats.adjustX > Math.max(...group.xVals)
    ));

    return (
        <div className="max-w-4xl mx-auto flex flex-col items-center justify-center p-4">
            <div className={`w-full p-4 mb-4 rounded-xl border flex flex-wrap gap-4 items-center justify-between ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <div className="flex flex-wrap gap-4">
                    <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={showRegressionLines} onChange={(event) => onShowRegressionLinesChange(event.target.checked)} className="accent-indigo-500" /><span className="text-sm font-bold text-slate-500">Regression Lines</span></label>
                    <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={showRawMeans} onChange={(event) => onShowRawMeansChange(event.target.checked)} className="accent-indigo-500" /><span className="text-sm font-bold text-slate-500">Raw Means</span></label>
                    <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={showAdjustedMeans} onChange={(event) => onShowAdjustedMeansChange(event.target.checked)} className="accent-indigo-500" /><span className="text-sm font-bold text-slate-500">Adjusted Means</span></label>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-xs font-black text-indigo-500 font-mono">Adjust X = {stats.adjustX.toFixed(2)}</span>
                    <input aria-label="Covariate adjustment value" type="range" min={stats.pMinX} max={stats.pMaxX} step={(stats.pMaxX - stats.pMinX) / 100} value={stats.adjustX} onChange={(event) => onAdjustXChange(Number(event.target.value))} className="w-48 accent-indigo-500" />
                    <button type="button" onClick={() => onAdjustXChange(stats.grandMeanX)} className="text-[10px] uppercase font-bold tracking-widest text-slate-500 hover:text-indigo-500">Grand Mean</button>
                </div>
            </div>

            <div className={`relative w-full aspect-[2/1] rounded-xl border overflow-hidden shadow-sm ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <svg viewBox="-40 -20 860 460" className="w-full h-full" role="img" aria-labelledby="ancova-plot-title ancova-plot-description">
                    <title id="ancova-plot-title">ANCOVA scatterplot and common-slope regression lines</title>
                    <desc id="ancova-plot-description">Observed outcomes by covariate for each group, with raw and adjusted means when enabled.</desc>
                    {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                        const y = ratio * 400;
                        const value = stats.pMaxY - (ratio * (stats.pMaxY - stats.pMinY));
                        return <g key={`y-${ratio}`}><line x1="0" y1={y} x2="800" y2={y} stroke={darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'} /><text x="-10" y={y + 4} textAnchor="end" className="text-[10px] font-mono fill-slate-500">{value.toFixed(1)}</text></g>;
                    })}
                    {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                        const x = ratio * 800;
                        const value = stats.pMinX + (ratio * (stats.pMaxX - stats.pMinX));
                        return <g key={`x-${ratio}`}><line x1={x} y1="0" x2={x} y2="400" stroke={darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'} /><text x={x} y="415" textAnchor="middle" className="text-[10px] font-mono fill-slate-500">{value.toFixed(1)}</text></g>;
                    })}
                    <line x1="0" y1="400" x2="800" y2="400" stroke="currentColor" opacity="0.2" strokeWidth="2" />
                    <line x1="0" y1="0" x2="0" y2="400" stroke="currentColor" opacity="0.2" strokeWidth="2" />

                    {stats.validGroups.map((group) => <g key={`rug-${group.id}`}>{group.xVals.map((value, index) => <line key={index} x1={scaleX(value)} y1="400" x2={scaleX(value)} y2="410" stroke={group.color} opacity="0.4" />)}</g>)}
                    <text x="400" y="440" textAnchor="middle" className="text-xs uppercase font-bold tracking-widest fill-emerald-500">Covariate: {covariateName}</text>
                    <text transform="translate(-30, 200) rotate(-90)" textAnchor="middle" className="text-xs uppercase font-bold tracking-widest fill-indigo-500">Outcome Variable</text>

                    {showAdjustedMeans && <line x1={scaleX(stats.adjustX)} y1="0" x2={scaleX(stats.adjustX)} y2="400" stroke="#8b5cf6" strokeWidth="2" strokeDasharray="5,5" opacity="0.5" />}
                    {showAdjustedMeans && extrapolates && <g transform={`translate(${scaleX(stats.adjustX)}, 20)`}><rect x="-70" y="-12" width="140" height="24" rx="4" fill="#ef4444" /><AlertCircle size={10} x="-64" y="-5" className="stroke-white" /><text x="5" y="4" textAnchor="middle" className="text-[9px] font-black fill-white uppercase">Extrapolation warning</text></g>}
                    {stats.adjustX !== stats.grandMeanX && <line x1={scaleX(stats.grandMeanX)} y1="0" x2={scaleX(stats.grandMeanX)} y2="400" stroke="currentColor" opacity="0.1" strokeDasharray="3,3" />}

                    {stats.validGroups.map((group) => {
                        const adjusted = stats.adjustedMeans.find(({ id }) => id === group.id);
                        const firstLineY = scaleY(group.my - (stats.b_w * (group.mx - stats.pMinX)));
                        const lastLineY = scaleY(group.my - (stats.b_w * (group.mx - stats.pMaxX)));
                        return (
                            <g key={group.id}>
                                {group.xVals.map((x, index) => <circle key={index} cx={scaleX(x)} cy={scaleY(group.yVals[index])} r="4" fill={group.color} opacity="0.6"><title>{group.label}: X={x.toFixed(1)}, Y={group.yVals[index].toFixed(1)}</title></circle>)}
                                {showRegressionLines && <line x1={scaleX(stats.pMinX)} y1={firstLineY} x2={scaleX(stats.pMaxX)} y2={lastLineY} stroke={group.color} strokeWidth="3" opacity="0.8" />}
                                {showRawMeans && <g transform={`translate(${scaleX(group.mx)}, ${scaleY(group.my)})`}><circle r="4" fill="white" stroke={group.color} strokeWidth="2" /><text x="-8" y="3" textAnchor="end" className="text-[10px] font-bold" fill={group.color}>Raw M</text></g>}
                                {showAdjustedMeans && <g transform={`translate(${scaleX(stats.adjustX)}, ${scaleY(adjusted.adjM)})`}><circle r="6" fill={group.color} stroke="white" strokeWidth="2" /><text x="10" y="3" className="text-[9px] font-black" fill={group.color}>Adj: {adjusted.adjM.toFixed(1)}</text></g>}
                            </g>
                        );
                    })}
                </svg>
            </div>
        </div>
    );
};

export default AncovaPlotPanel;
