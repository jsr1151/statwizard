import { useState } from 'react';
import { Calculator, Info, Sparkles, TrendingUp } from 'lucide-react';

export default function DistributionControls({
  alpha,
  calcData,
  calcMode,
  ciLower,
  ciType,
  ciUpper,
  cohenD,
  darkMode,
  dataInputMode,
  delta,
  df,
  h1Direction,
  isSignificant,
  parseRawData,
  precision,
  rawData,
  reportString,
  setAlpha,
  setCalcData,
  setCalcMode,
  setCiType,
  setDataInputMode,
  setDf,
  setH1Direction,
  setPrecision,
  setRawData,
  setShowCI,
  setShowTailGap,
  setTails,
  setVal,
  showCI,
  showTailGap,
  stdError,
  tails,
  type,
  val,
}) {
  const [copyStatus, setCopyStatus] = useState('Copy report');

  const copyReport = async () => {
    if (!navigator.clipboard) {
      setCopyStatus('Copy unavailable');
      return;
    }

    try {
      await navigator.clipboard.writeText(reportString);
      setCopyStatus('Copied!');
      window.setTimeout(() => setCopyStatus('Copy report'), 2000);
    } catch {
      setCopyStatus('Copy unavailable');
    }
  };

  return (
    <div
      className={`w-full p-4 rounded-b-lg border-x border-b space-y-4 shadow-xl relative z-10 transition-colors ${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-900 text-white border-slate-800'}`}
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="space-y-1.5 col-span-1">
          <label className={`text-[9px] font-black uppercase tracking-widest block ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Significance (α)</label>
          <div className={`flex p-1 rounded-lg border ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-800 border-slate-700'}`}>
            {[0.1, 0.05, 0.01].map((a) => (
              <button
                key={a}
                type="button"
                aria-pressed={alpha === a}
                onClick={() => setAlpha(a)}
                className={`flex-1 py-1 rounded text-[10px] font-bold transition-all ${alpha === a ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
              >
                {a}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-1.5 col-span-1">
          <label className={`text-[9px] font-black uppercase tracking-widest block ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Tails</label>
          <div className={`flex p-1 rounded-lg border ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-800 border-slate-700'}`}>
            {[1, 2].map((t) => (
              <button
                key={t}
                type="button"
                aria-pressed={tails === t}
                onClick={() => {
                  setTails(t);
                  if (t === 2) setH1Direction('greater');
                }}
                className={`flex-1 py-1 rounded text-[10px] font-bold transition-all ${tails === t ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5 col-span-1">
          <label className={`text-[9px] font-black uppercase tracking-widest block ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Precision</label>
          <div className={`flex p-1 rounded-lg border ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-800 border-slate-700'}`}>
            {[2, 3].map((p) => (
              <button
                key={p}
                type="button"
                aria-pressed={precision === p}
                onClick={() => setPrecision(p)}
                className={`flex-1 py-1 rounded text-[10px] font-bold transition-all ${precision === p ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
              >
                {p} dec
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5 col-span-1">
          <label className={`text-[9px] font-black uppercase tracking-widest block ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Estimation</label>
          <button
            type="button"
            aria-pressed={showCI}
            onClick={() => setShowCI(!showCI)}
            className={`w-full py-2 rounded-lg text-[10px] font-black uppercase transition-all ${showCI ? 'bg-indigo-600 text-white shadow-lg' : darkMode ? 'bg-slate-950 text-slate-500 border border-slate-800 hover:text-slate-300' : 'bg-slate-800 text-slate-500 border border-slate-700 hover:text-slate-300'}`}
          >
            {showCI ? 'Hide CI' : 'Show 95% CI'}
          </button>
        </div>
      </div>

      {type === 't' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end pt-2 animate-in slide-in-from-top-2">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className={`text-[9px] font-black uppercase tracking-widest block ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Degrees of Freedom (df = {df})</label>
              <div className="flex gap-1">
                {[2, 5, 10, 100].map((d) => (
                  <button
                    key={d}
                    type="button"
                    aria-pressed={df === d}
                    onClick={() => setDf(d)}
                    className={`px-2 py-0.5 rounded text-[8px] font-bold border transition-colors ${df === d ? 'bg-indigo-600 border-indigo-500 text-white' : 'border-slate-700 text-slate-500 hover:text-slate-300'}`}
                  >
                    {d === 100 ? '∞' : d}
                  </button>
                ))}
              </div>
            </div>
            <input
              aria-label="Degrees of freedom"
              type="range"
              min="1"
              max="100"
              step="1"
              value={df}
              onChange={(e) => setDf(parseInt(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-full appearance-none cursor-pointer accent-indigo-500"
            />
            <div className={`text-[8px] font-medium leading-relaxed ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
              {df < 10 ? (
                <span>
                  <Sparkles className="inline w-3 h-3 mr-1 text-amber-500" /> <b>Tip:</b> Watch how low $df$ makes the tails much "heavier" (higher).
                </span>
              ) : (
                'Notice how the T-distribution looks more like the Z-distribution as $df$ increases.'
              )}
            </div>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              aria-pressed={showTailGap}
              onClick={() => setShowTailGap(!showTailGap)}
              className={`flex-1 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all border ${showTailGap ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-slate-800 border-slate-700 text-slate-500 hover:text-slate-300'}`}
            >
              {showTailGap ? 'Hide Normal Overlay' : 'Show Tail Gap'}
            </button>
            <div className={`flex-1 p-2 rounded-lg bg-slate-950/50 border border-slate-800 transition-opacity ${showTailGap ? 'opacity-100' : 'opacity-40'}`}>
              <div className="text-[7px] font-black text-indigo-400 uppercase mb-1">Gap Explanation</div>
              <div className="text-[8px] text-slate-400 leading-tight">The gap shows how much additional area is in the T-tails vs Normal tails.</div>
            </div>
          </div>
        </div>
      )}

      {tails === 1 && (
        <div className="animate-in fade-in slide-in-from-top-1 duration-200">
          <label className={`text-[9px] font-black uppercase tracking-widest block mb-2 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Hypothesis Direction (H₁)</label>
          <div className={`flex p-1 rounded-lg border max-w-[300px] ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-800 border-slate-700'}`}>
            <button
              type="button"
              aria-pressed={h1Direction === 'greater'}
              onClick={() => setH1Direction('greater')}
              className={`flex-1 py-1.5 rounded text-[10px] font-bold transition-all ${h1Direction === 'greater' ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}
            >
              μ &gt; μ₀ (Right Tail)
            </button>
            <button
              type="button"
              aria-pressed={h1Direction === 'less'}
              onClick={() => setH1Direction('less')}
              className={`flex-1 py-1.5 rounded text-[10px] font-bold transition-all ${h1Direction === 'less' ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}
            >
              μ &lt; μ₀ (Left Tail)
            </button>
          </div>
        </div>
      )}

      <div className={`pt-2 border-t flex flex-col gap-4 ${darkMode ? 'border-slate-800' : 'border-slate-800'}`}>
        <div className={`flex justify-between items-center p-1.5 rounded-lg border ${darkMode ? 'bg-slate-950/50 border-slate-800' : 'bg-slate-800/50 border-slate-700'}`}>
          <div className={`text-[8px] font-black uppercase tracking-widest px-2 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Input Mode</div>
          <div className="flex gap-1">
            <button
              type="button"
              aria-pressed={!calcMode}
              onClick={() => setCalcMode(false)}
              className={`px-3 py-1 rounded text-[8px] font-black uppercase tracking-widest transition-all ${!calcMode ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Direct Z-Score
            </button>
            <button
              type="button"
              aria-pressed={calcMode}
              onClick={() => setCalcMode(true)}
              className={`px-3 py-1 rounded text-[8px] font-black uppercase tracking-widest transition-all ${calcMode ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Step-by-Step Calculator
            </button>
          </div>
        </div>

        {!calcMode ? (
          <div className="flex flex-col md:flex-row gap-4 items-center animate-in fade-in slide-in-from-bottom-1 duration-200">
            <div className="flex-1 w-full space-y-2">
              <div className="flex justify-between items-center">
                <span className={`text-[9px] font-black uppercase tracking-widest flex items-center gap-2 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                  Calculated {type === 'z' ? 'z' : 't'}-score
                  <span className="text-[7px] text-slate-500 lowercase font-normal italic">(Reject H₀ if p ≤ α)</span>
                </span>
                <span
                  className={`text-[10px] font-black px-2 py-0.5 rounded ${isSignificant ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'}`}
                >
                  {isSignificant ? 'Significant' : 'Not Significant'}
                </span>
              </div>
              <input
                aria-label={`Calculated ${type}-score`}
                type="range"
                min="-4"
                max="4"
                step="0.01"
                value={val}
                onChange={(e) => setVal(parseFloat(e.target.value))}
                className={`w-full h-1.5 rounded-full appearance-none cursor-pointer ${isSignificant ? 'bg-red-400/30 accent-red-500' : 'bg-indigo-400/30 accent-indigo-500'}`}
              />
            </div>
            <div className="w-full md:w-32 space-y-1.5">
              <label className={`text-[9px] font-black uppercase tracking-widest block ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Manual Input</label>
              <input
                aria-label={`Manual ${type}-score`}
                type="number"
                step="0.01"
                value={val}
                onChange={(e) => setVal(parseFloat(e.target.value) || 0)}
                className={`w-full border rounded p-1.5 text-xs font-bold text-center focus:outline-none focus:border-indigo-500 transition-colors ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-800 border-slate-700'}`}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex gap-2 p-1 bg-slate-900 rounded-lg border border-slate-800 w-fit">
              <button
                type="button"
                aria-pressed={dataInputMode === 'summary'}
                onClick={() => setDataInputMode('summary')}
                className={`px-3 py-1 rounded text-[8px] font-black uppercase tracking-widest transition-all ${dataInputMode === 'summary' ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}
              >
                Summary Stats
              </button>
              <button
                type="button"
                aria-pressed={dataInputMode === 'raw'}
                onClick={() => setDataInputMode('raw')}
                className={`px-3 py-1 rounded text-[8px] font-black uppercase tracking-widest transition-all ${dataInputMode === 'raw' ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}
              >
                Paste Data
              </button>
            </div>

            {dataInputMode === 'raw' && (
              <div className="space-y-2 animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Enter Raw Data</span>
                  <span className="text-[7px] text-slate-500 italic">Separated by commas, spaces, or lines</span>
                </div>
                <textarea
                  aria-label="Raw sample data"
                  value={rawData}
                  onChange={(e) => {
                    setRawData(e.target.value);
                    parseRawData(e.target.value);
                  }}
                  placeholder="Example: 10, 12, 14, 16..."
                  className={`w-full h-20 p-3 rounded-xl border text-xs font-mono focus:outline-none focus:border-indigo-500 transition-all ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-slate-800 border-slate-700 text-white'}`}
                />
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Sample Mean (x̄)', key: 'xBar' },
                { label: 'Hyp. Mean (μ)', key: 'mu' },
                { label: type === 't' ? 'Sample SD (s)' : 'Pop. SD (σ)', key: 'sigma' },
                { label: 'Sample Size (n)', key: 'n' },
              ].map((param) => (
                <div key={param.key} className={`border p-2 rounded-xl flex flex-col gap-1 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-900 border-slate-700'}`}>
                  <span className="text-[7px] font-black text-indigo-400 uppercase tracking-widest">{param.label}</span>
                  <input
                    aria-label={param.label}
                    type="number"
                    value={calcData[param.key]}
                    onChange={(e) => setCalcData({ ...calcData, [param.key]: parseFloat(e.target.value) || 0 })}
                    className="bg-transparent text-white text-xs font-black focus:outline-none"
                  />
                </div>
              ))}
              <div
                className={`col-span-2 md:col-span-4 border p-2 rounded-xl flex justify-between items-center overflow-hidden relative ${darkMode ? 'bg-indigo-500/10 border-indigo-500/30' : 'bg-indigo-500/10 border-indigo-500/30'}`}
              >
                <div className="flex gap-4 items-center">
                  <div className="flex flex-col">
                    <span className="text-[6px] text-indigo-400 uppercase font-bold">Standard Error (SE)</span>
                    <span className="text-xs font-black text-indigo-300">{stdError.toFixed(3)}</span>
                  </div>
                  <div className="h-4 w-[1px] bg-indigo-500/30" />
                  <div className="flex flex-col">
                    <span className="text-[6px] text-indigo-400 uppercase font-bold">Computed {type === 'z' ? 'Z' : 'T'}</span>
                    <span className="text-xs font-black text-white">{val}</span>
                  </div>
                </div>
                <div
                  className={`text-[10px] font-black px-3 py-1 rounded-lg ${isSignificant ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' : 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'}`}
                >
                  {isSignificant ? 'REJECT H₀' : 'FAIL TO REJECT'}
                </div>
                <div className="absolute -right-2 -bottom-2 opacity-5">
                  <Calculator size={48} className="text-white" />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Report & Stats Footer */}
      <div className={`pt-4 border-t flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2 duration-500 ${darkMode ? 'border-slate-800' : 'border-slate-800'}`}>
        <div className="flex flex-wrap gap-4">
          {calcMode && (
            <>
              <div
                className={`p-2.5 rounded-xl border flex flex-col animate-in slide-in-from-left-2 transition-all ${darkMode ? 'bg-slate-950/40 border-slate-800' : 'bg-slate-800/40 border-slate-700/50'}`}
              >
                <span className="text-[8px] font-black text-indigo-400 uppercase mb-1">Effect Size (Cohen's d)</span>
                <span className="text-xs font-black text-white">{cohenD.toFixed(precision)}</span>
              </div>
              <div
                className={`p-2.5 rounded-xl border flex flex-col animate-in slide-in-from-left-3 transition-all ${darkMode ? 'bg-slate-950/40 border-slate-800' : 'bg-slate-800/40 border-slate-700/50'}`}
              >
                <span className="text-[8px] font-black text-indigo-400 uppercase mb-1">Mean Difference (Δ)</span>
                <span className="text-xs font-black text-white">{delta.toFixed(precision)}</span>
              </div>
            </>
          )}
          {showCI && (
            <div className="bg-indigo-600/20 p-3 rounded-2xl border border-indigo-500/40 flex flex-col animate-in zoom-in-95 group relative overflow-hidden transition-all hover:bg-indigo-600/30">
              <div className="flex justify-between items-start mb-2">
                <div className="flex flex-col">
                  <span className="text-[8px] font-black text-indigo-300 uppercase leading-none mb-1">{(1 - alpha) * 100}% Confidence Interval</span>
                  <span className="text-[7px] text-indigo-400/60 font-bold uppercase tracking-tighter">True Population Mean (μ)</span>
                </div>
                <select
                  aria-label="Confidence interval type"
                  value={ciType}
                  onChange={(e) => setCiType(e.target.value)}
                  className="bg-indigo-500/30 text-[7px] font-black uppercase text-indigo-100 rounded px-1.5 py-0.5 border border-indigo-500/40 outline-none focus:ring-1 ring-indigo-400 transition-all cursor-pointer"
                >
                  <option value="two-sided">Two-Sided</option>
                  <option value="one-sided">One-Sided</option>
                </select>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-lg font-black text-white tracking-tight">
                  [{ciLower === -Infinity ? '-∞' : ciLower.toFixed(precision)}, {ciUpper === Infinity ? '∞' : ciUpper.toFixed(precision)}]
                </span>
                {tails === 1 && (
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-indigo-500/40 border border-indigo-400/30">
                    <Info size={8} className="text-indigo-200" />
                    <span className="text-[6px] font-black text-indigo-200 uppercase leading-none">
                      Two-sided CI shown (common convention). One-tailed tests correspond to a one-sided bound.
                    </span>
                  </div>
                )}
              </div>
              <div className="absolute -right-2 -bottom-2 opacity-10 rotate-12">
                <TrendingUp size={40} className="text-indigo-400" />
              </div>
            </div>
          )}
        </div>

        <div
          className={`rounded-xl border p-3 flex flex-col md:flex-row justify-between items-center gap-4 group transition-colors ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}
        >
          <div className={`text-[10px] font-mono break-all leading-relaxed max-w-[80%] ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
            <span className="text-indigo-500 font-bold tracking-widest mr-2 uppercase text-[8px]">Report Line</span>
            {reportString}
          </div>
          <button
            type="button"
            onClick={copyReport}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-[9px] font-black uppercase tracking-widest rounded-lg transition-all shadow-lg active:scale-95 whitespace-nowrap"
          >
            <span className="sr-only" aria-live="polite">
              {copyStatus === 'Copied!' ? 'Report copied to clipboard.' : copyStatus}
            </span>
            <span aria-hidden="true">{copyStatus}</span>
          </button>
        </div>
      </div>

      {/* Tutor Integration (moved to App for better layout) */}
    </div>
  );
}
