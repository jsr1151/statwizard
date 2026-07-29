import React from 'react';
import { Sigma } from 'lucide-react';
import { fPPF } from '../../utils/mathHelpers';
import FSamplingDist from './FSamplingDist';

const AncovaDistributionPanel = ({
    alpha,
    calcDf1,
    calcDf2,
    calcF,
    darkMode,
    mode,
    stats,
    zoom,
    onAlphaChange,
    onCalcDf1Change,
    onCalcDf2Change,
    onCalcFChange,
    onManualFChange,
    onModeChange,
    onZoomChange,
}) => {
    const dataMode = mode === 'data';
    const df1 = dataMode ? stats.dfB || 2 : calcDf1;
    const df2 = dataMode ? stats.dfW || 20 : calcDf2;
    const fValue = dataMode ? stats.F || 0 : calcF;

    return (
        <div className="max-w-4xl mx-auto flex flex-col gap-6">
            <div className="flex flex-wrap justify-between items-center gap-4 px-2">
                <div className="flex items-center gap-6">
                    <h3 className="text-[11px] font-black uppercase tracking-widest flex items-center gap-2 text-indigo-500"><Sigma size={14} />ANCOVA {mode.toUpperCase()}</h3>
                    <div className="flex p-1 rounded-2xl bg-slate-900 border border-slate-800">{['data', 'calc'].map((value) => <button key={value} type="button" onClick={() => onModeChange(value)} className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${mode === value ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}>{value === 'data' ? 'Compute' : 'Explore'}</button>)}</div>
                </div>
                <div className="flex bg-slate-800/50 p-1.5 rounded-xl border border-slate-700">{[0.1, 0.05, 0.01].map((value) => <button key={value} type="button" onClick={() => onAlphaChange(value)} className={`px-3 py-1 rounded-lg text-[10px] font-black ${alpha === value ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}>{value}</button>)}</div>
            </div>

            {!dataMode && <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-8 bg-indigo-500/5 border-2 border-indigo-500/10 rounded-[2.5rem]">{[
                { label: 'df1', value: calcDf1, min: 1, max: 50, onChange: onCalcDf1Change },
                { label: 'df2', value: calcDf2, min: 1, max: 250, onChange: onCalcDf2Change },
                { label: 'F', value: calcF, min: 0, max: 25, step: 0.1, onChange: onCalcFChange },
            ].map((control) => <label key={control.label} className="p-5 bg-slate-900/40 rounded-2xl border border-slate-800"><span className="flex justify-between text-[9px] font-black text-slate-500 uppercase mb-2"><span>{control.label}</span><span className="text-indigo-400">{control.value}</span></span><input type="range" min={control.min} max={control.max} step={control.step} value={control.value} onChange={(event) => control.onChange(Number(event.target.value))} className="w-full accent-indigo-500" /></label>)}</div>}

            <div className={`w-full h-[500px] overflow-hidden border-2 rounded-3xl relative ${darkMode ? 'bg-slate-950/50 border-slate-800' : 'bg-white border-slate-200'}`}>
                {!stats.ready && dataMode ? <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs font-black uppercase tracking-widest">Awaiting Data...</div> : <FSamplingDist mode={mode} fCrit={fPPF(1 - alpha, df1, df2)} fVal={fValue} df1={df1} df2={df2} setFVal={dataMode ? onManualFChange : onCalcFChange} darkMode={darkMode} zoomDist={zoom} setZoomDist={onZoomChange} />}
            </div>
        </div>
    );
};

export default AncovaDistributionPanel;
