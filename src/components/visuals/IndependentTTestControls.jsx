import React, { useState } from 'react';
import IndependentTTestGroupInput from './IndependentTTestGroupInput';

const IndependentTTestControls = ({
  alpha,
  ciType,
  darkMode,
  direction,
  group1,
  group2,
  inputMode,
  onAlphaChange,
  onCiTypeChange,
  onDirectionChange,
  onGroup1Change,
  onGroup2Change,
  onInputModeChange,
  onRawChange,
  onShowCIChange,
  onSwap,
  onTailsChange,
  onTestTypeChange,
  reportLine,
  result,
  showCI,
  tails,
  testType,
}) => {
  const [copyStatus, setCopyStatus] = useState('Copy APA');
  const panelClass = darkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200 shadow-sm';
  const effectLabel = result.cohenD < 0.2 ? 'Negligible' : result.cohenD < 0.5 ? 'Small' : result.cohenD < 0.8 ? 'Medium' : 'Large';
  const confidencePercent = Math.round((1 - alpha) * 100);
  const copyReport = async () => {
    if (!navigator.clipboard) return setCopyStatus('Copy unavailable');
    try {
      await navigator.clipboard.writeText(reportLine);
      setCopyStatus('Copied!');
      window.setTimeout(() => setCopyStatus('Copy APA'), 2000);
    } catch {
      setCopyStatus('Copy unavailable');
    }
  };

  return (
    <section className={`w-full p-6 space-y-8 ${darkMode ? 'bg-slate-900' : 'bg-slate-50'}`}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Variance assumption</span>
          <div className={`mt-1 p-1 rounded-lg flex ${darkMode ? 'bg-slate-950' : 'bg-white border'}`}>
            <button
              type="button"
              aria-pressed={testType === 'student'}
              onClick={() => onTestTypeChange('student')}
              className={`px-3 py-1 text-[10px] font-bold rounded ${testType === 'student' ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}
            >
              Pooled (Student)
            </button>
            <button
              type="button"
              aria-pressed={testType === 'welch'}
              onClick={() => onTestTypeChange('welch')}
              className={`px-3 py-1 text-[10px] font-bold rounded ${testType === 'welch' ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}
            >
              Unpooled (Welch)
            </button>
          </div>
        </div>
        <div className={`p-2 rounded-lg border ${result.varianceRatio > 4 ? 'border-amber-500/30 bg-amber-500/5' : 'border-slate-800'}`}>
          <span className="block text-[9px] font-bold text-slate-500 uppercase">Variance ratio (max/min)</span>
          <span className={`block text-right text-xs font-mono font-bold ${result.varianceRatio > 4 ? 'text-amber-500' : 'text-slate-400'}`}>
            {Number.isFinite(result.varianceRatio) ? result.varianceRatio.toFixed(2) : 'Infinite'}
          </span>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <IndependentTTestGroupInput
          color="text-indigo-400"
          darkMode={darkMode}
          group={group1}
          groupNumber={1}
          inputMode={inputMode}
          onChange={onGroup1Change}
          onRawChange={(text) => onRawChange(1, text)}
          onSecondaryAction={() => onInputModeChange(inputMode === 'summary' ? 'raw' : 'summary')}
          secondaryActionLabel={inputMode === 'summary' ? 'Paste data' : 'Summary inputs'}
        />
        <IndependentTTestGroupInput
          color="text-emerald-400"
          darkMode={darkMode}
          group={group2}
          groupNumber={2}
          inputMode={inputMode}
          onChange={onGroup2Change}
          onRawChange={(text) => onRawChange(2, text)}
          onSecondaryAction={onSwap}
          secondaryActionLabel="Swap groups"
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <label className="flex flex-col gap-1 text-[9px] font-bold text-slate-500 uppercase tracking-widest">
          Threshold (alpha)
          <select value={alpha} onChange={(event) => onAlphaChange(Number(event.target.value))} className={`p-2 rounded text-xs font-bold border ${panelClass}`}>
            <option value={0.01}>0.01</option>
            <option value={0.05}>0.05</option>
            <option value={0.1}>0.10</option>
          </select>
        </label>
        <div className="flex flex-col gap-1">
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Tails</span>
          <div className={`p-1 rounded flex ${panelClass}`}>
            <button
              type="button"
              aria-pressed={tails === 2}
              onClick={() => onTailsChange(2)}
              className={`flex-1 py-1 text-[10px] font-bold rounded ${tails === 2 ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}
            >
              Two
            </button>
            <button
              type="button"
              aria-pressed={tails === 1}
              onClick={() => onTailsChange(1)}
              className={`flex-1 py-1 text-[10px] font-bold rounded ${tails === 1 ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}
            >
              One
            </button>
          </div>
        </div>
        {tails === 1 ? (
          <div className="flex flex-col gap-1">
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Alternative</span>
            <div className={`p-1 rounded flex ${panelClass}`}>
              <button
                type="button"
                aria-pressed={direction === 'greater'}
                onClick={() => onDirectionChange('greater')}
                className={`flex-1 py-1 text-[10px] font-bold rounded ${direction === 'greater' ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}
              >
                mu1 &gt; mu2
              </button>
              <button
                type="button"
                aria-pressed={direction === 'less'}
                onClick={() => onDirectionChange('less')}
                className={`flex-1 py-1 text-[10px] font-bold rounded ${direction === 'less' ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}
              >
                mu1 &lt; mu2
              </button>
            </div>
          </div>
        ) : (
          <div />
        )}
        <div className="flex flex-col gap-1">
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Reporting CI</span>
          <div className="flex gap-2">
            <button
              type="button"
              aria-pressed={showCI}
              onClick={() => onShowCIChange(!showCI)}
              className={`flex-1 py-2 text-[9px] font-black rounded border uppercase ${showCI ? 'bg-indigo-600 text-white border-indigo-500' : panelClass}`}
            >
              {showCI ? 'Shown' : 'Hidden'}
            </button>
            {showCI && (
              <select
                aria-label="Confidence interval type"
                value={ciType}
                onChange={(event) => onCiTypeChange(event.target.value)}
                className={`p-2 rounded text-[8px] font-black border uppercase ${panelClass}`}
              >
                <option value="two-sided">Two-sided</option>
                <option value="one-sided">One-sided</option>
              </select>
            )}
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4 pt-4">
        <div className={`p-4 rounded-xl border text-center ${panelClass}`}>
          <span className="block text-[8px] font-black text-slate-500 uppercase tracking-widest">Test statistics</span>
          <span className={`text-xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>{result.t.toFixed(3)}</span>
          <span className="ml-2 text-[8px] font-bold text-slate-500">t({result.df.toFixed(1)})</span>
          <span className="block text-[8px] font-bold text-slate-600 uppercase">SE = {result.se.toFixed(3)}</span>
        </div>
        <div className={`p-4 rounded-xl border text-center ${panelClass}`}>
          <span className="block text-[8px] font-black text-slate-500 uppercase tracking-widest">Effect sizes</span>
          <div className="flex justify-center gap-6">
            <span className={`text-sm font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>d = {result.cohenD.toFixed(3)}</span>
            <span className={`text-sm font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>g = {result.hedgesG.toFixed(3)}</span>
          </div>
          <span className="block text-[8px] font-bold text-indigo-500 uppercase">{effectLabel} effect</span>
        </div>
        <div className={`p-4 rounded-xl border text-center ${showCI ? 'border-indigo-500/30' : 'opacity-50'} ${panelClass}`}>
          <span className="block text-[8px] font-black text-indigo-500 uppercase tracking-widest">{confidencePercent}% confidence interval</span>
          {showCI ? (
            <span className="text-sm font-black font-mono text-indigo-600">
              {ciType === 'two-sided'
                ? `[${result.ciLower.toFixed(2)}, ${result.ciUpper.toFixed(2)}]`
                : direction === 'greater'
                  ? `> ${result.ciLower.toFixed(2)}`
                  : `< ${result.ciUpper.toFixed(2)}`}
            </span>
          ) : (
            <span className="text-[9px] font-bold text-slate-500 uppercase">Hidden</span>
          )}
        </div>
      </div>

      <div className={`rounded-xl border p-3 flex flex-col md:flex-row justify-between items-center gap-4 ${panelClass}`}>
        <p className={`text-[10px] font-mono leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
          <span className="text-indigo-500 font-bold tracking-widest mr-2 uppercase text-[7px]">Report line</span>
          {reportLine}
        </p>
        <button type="button" onClick={copyReport} className="px-4 py-2 bg-indigo-600 text-white text-[8px] font-black uppercase tracking-widest rounded-lg whitespace-nowrap">
          <span className="sr-only" aria-live="polite">
            {copyStatus === 'Copied!' ? 'APA report copied to clipboard.' : copyStatus}
          </span>
          <span aria-hidden="true">{copyStatus}</span>
        </button>
      </div>
    </section>
  );
};

export default IndependentTTestControls;
