import React, { useState } from 'react';
import { Calculator, Info, ChevronUp, ChevronDown, BookOpen, Lightbulb, Sigma, BarChart2 } from 'lucide-react';
import { MATH_TERMS } from '../../data/mathTerms';
import { SYMBOL_KEYS } from '../../data/symbolKeys';
import CalculationText from '../common/CalculationText';
import MathTerm from '../common/MathTerm';
const FormulaDisplay = ({ type, onInfo, onHover, darkMode, showValues, stats }) => {
  const borderCol = darkMode ? 'border-slate-700' : 'border-slate-800';
  const labelCol = darkMode ? 'text-slate-500' : 'text-slate-400';
  const textCol = darkMode ? 'text-slate-200' : 'text-slate-800';

  const getV = (key) => stats ? stats[key] : undefined;
  const calc = (term, val) => <MathTerm term={term} value={val} showValue={showValues} onInfo={onInfo} onHover={onHover} darkMode={darkMode} />;

  if (type === 'mean') return <div className="flex flex-col items-center"><div className={`text-xs font-bold mb-3 uppercase tracking-wider ${labelCol}`}>Arithmetic Mean</div><div className={`flex items-center text-xl md:text-2xl font-serif ${textCol}`}><span>{calc("x̄", getV('xBar'))}</span><span className="mx-3">=</span><div className="flex flex-col items-center"><span className={`border-b-2 px-2 pb-1 mb-1 ${borderCol}`}>Σx</span><span>{calc("n", getV('n'))}</span></div></div></div>;
  if (type === 'sd') return <div className="flex flex-col items-center"><div className={`text-xs font-bold mb-3 uppercase tracking-wider ${labelCol}`}>Sample Standard Deviation</div><div className={`flex items-center text-xl md:text-2xl font-serif ${textCol}`}><span className="font-bold mr-3 italic">s</span><span className="mr-3">=</span><div className="flex items-center"><span className="text-4xl mr-1 font-light">√</span><div className={`flex flex-col items-center border-t pt-1 ${borderCol}`}><div className={`flex flex-col items-center border-b pb-1 mb-1 px-2 ${borderCol}`}><span>Σ({calc("x", undefined)} - {calc("x̄", getV('xBar'))})²</span></div><span>{calc("n", getV('n'))} - 1</span></div></div></div></div>;
  if (type === 'range') return <div className="flex flex-col items-center"><div className={`text-xs font-bold mb-3 uppercase tracking-wider ${labelCol}`}>Range & IQR Equations</div><div className={`flex flex-col gap-4 text-xl md:text-2xl font-serif ${textCol}`}><div>{calc("Range", undefined)} = Max - Min</div><div>{calc("IQR", undefined)} = {calc("Q3", undefined)} - {calc("Q1", undefined)}</div></div></div>;
  if (type === 'percentage') return <div className="flex flex-col items-center"><div className={`text-xs font-bold mb-3 uppercase tracking-wider ${labelCol}`}>Relative Frequency Equation</div><div className={`flex flex-col gap-3 text-xl md:text-2xl font-serif ${textCol}`}><div className="flex items-center"><span className="mr-2 italic">rf</span><span>=</span><div className="flex flex-col items-center mx-1"><span className={`border-b-2 px-1 ${borderCol}`}>{calc("f", undefined)}</span><span>{calc("N", getV('n'))}</span></div></div></div></div>;
  if (type === 't_indep') {
    const isWelch = stats?.testType === 'welch';
    return (
      <div className="flex flex-col items-center">
        <div className={`flex items-center text-xl md:text-2xl font-serif ${textCol}`}>
          <span className="font-bold mr-3 italic">t</span>
          <span className="mr-3">=</span>
          <div className="flex flex-col items-center">
            <div className={`border-b-2 px-2 pb-1 mb-1 w-full text-center group relative ${borderCol}`}>
              ({calc("x̄1", getV('x1'))} - {calc("x̄2", getV('x2'))})
            </div>
            <div className="pt-1 flex items-center group relative">
              <span className="mr-1">SE<sub>Δ</sub></span>
              {showValues && <span className="text-xs font-bold text-indigo-500 ml-1">({getV('se')?.toFixed(3)})</span>}
            </div>
          </div>
        </div>
        {/* Expanded SE Line */}
        <div className={`mt-3 pt-3 border-t border-dashed ${darkMode ? 'border-slate-700' : 'border-slate-200'} w-full flex flex-col items-center gap-2`}>
          <div className={`text-[9px] font-black uppercase tracking-widest ${labelCol}`}>
            Standard Error ({isWelch ? 'Unpooled' : 'Pooled'})
          </div>
          <div className={`flex items-center text-sm md:text-base font-serif ${textCol}`}>
            <span>{calc("SE_delta", getV('se'))}</span>
            <span className="mx-2">=</span>
            {isWelch ? (
              <div className="flex items-center">
                <div className="flex items-start">
                  <span className="text-2xl -mr-0.5 leading-none mt-[-1px]">√</span>
                  <div className={`border-t-2 pt-1.5 ${borderCol} flex items-center gap-3 px-1`}>
                    <div className="flex flex-col items-center">
                      <span className={`border-b ${borderCol} px-1 leading-tight`}>{calc("s1_2", getV('s1') ** 2)}</span>
                      <span className="leading-tight">{calc("n1", getV('n1'))}</span>
                    </div>
                    <span className="self-center font-bold px-1">+</span>
                    <div className="flex flex-col items-center">
                      <span className={`border-b ${borderCol} px-1 leading-tight`}>{calc("s2_2", getV('s2') ** 2)}</span>
                      <span className="leading-tight">{calc("n2", getV('n2'))}</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center">
                <span className="mr-1">{calc("sp", Math.sqrt(getV('pooledVar')))}</span>
                <div className="flex items-start">
                  <span className="text-2xl -mr-0.5 leading-none mt-[-1px]">√</span>
                  <div className={`border-t-2 pt-1.5 ${borderCol} flex items-center gap-2 px-1`}>
                    <div className="flex flex-col items-center">
                      <span className={`border-b ${borderCol} px-1 leading-tight`}>1</span>
                      <span className="leading-tight">{calc("n1", getV('n1'))}</span>
                    </div>
                    <span className="self-center font-bold">+</span>
                    <div className="flex flex-col items-center">
                      <span className={`border-b ${borderCol} px-1 leading-tight`}>1</span>
                      <span className="leading-tight">{calc("n2", getV('n2'))}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          {!isWelch && (
            <div className={`text-[9px] font-serif ${labelCol} mt-2 flex items-center gap-2`}>
              {calc("sp2", getV('pooledVar'))}
              <span className="mx-1">=</span>
              <div className="flex flex-col items-center">
                <span className={`border-b ${borderCol} px-2`}>({calc("n1", getV('n1'))}-1){calc("s1_2", getV('s1') ** 2)} + ({calc("n2", getV('n2'))}-1){calc("s2_2", getV('s2') ** 2)}</span>
                <span>{calc("n1", getV('n1'))} + {calc("n2", getV('n2'))} - 2</span>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
  if (type === 't_paired') {
    return (
      <div className="flex flex-col items-center">
        <div className={`flex items-center text-xl md:text-2xl font-serif ${textCol}`}>
          <span className="font-bold mr-3 italic">t</span>
          <span className="mr-3">=</span>
          <div className="flex flex-col items-center">
            <div className={`border-b-2 px-2 pb-1 mb-1 w-full text-center ${borderCol}`}>
              {calc("dBar", getV('dBar'))}
            </div>
            <div className="pt-1">
              {calc("SE_paired", getV('se'))}
            </div>
          </div>
        </div>
        <div className={`mt-3 pt-3 border-t border-dashed ${darkMode ? 'border-slate-700' : 'border-slate-200'} w-full flex flex-col items-center gap-2`}>
          <div className={`text-[9px] font-black uppercase tracking-widest ${labelCol}`}>Standard Error of Differences</div>
          <div className={`flex items-center text-sm md:text-base font-serif ${textCol}`}>
            <span>{calc("SE_paired", getV('se'))}</span>
            <span className="mx-2">=</span>
            <div className="flex flex-col items-center">
              <span className={`border-b ${borderCol} px-1`}>{calc("sd_diff", getV('sd'))}</span>
              <div className="flex items-center">
                <span className="text-xs mr-1">√</span>
                <span>{calc("n_pairs", getV('n'))}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  if (type === 'z_test') return <div className={`flex items-center text-xl md:text-2xl font-serif ${textCol}`}><span className="font-bold mr-3 italic">z</span><span className="mr-3">=</span><div className="flex flex-col items-center"><div className={`border-b-2 px-2 pb-1 mb-1 w-full text-center group relative ${borderCol}`}>({calc("x̄", getV('xBar'))} - {calc("mu", getV('mu'))})</div><div className="pt-1 flex items-center group relative"><span className="mr-1">{calc("SEz", getV('se'))}</span></div></div></div>;
  if (type === 't_onesample') return (
    <div className="flex flex-col items-center">
      <div className={`flex items-center text-xl md:text-2xl font-serif ${textCol}`}>
        <span className="font-bold mr-3 italic">t</span>
        <span className="mr-3">=</span>
        <div className="flex flex-col items-center">
          <div className={`border-b-2 px-2 pb-1 mb-1 w-full text-center group relative ${borderCol}`}>
            ({calc("x̄", getV('xBar'))} - {calc("mu", getV('mu'))})
          </div>
          <div className="pt-1 flex items-center group relative">
            <span className="mr-1">{calc("SEt", getV('se'))}</span>
          </div>
        </div>
      </div>
      <div className={`mt-2 text-[10px] uppercase tracking-widest font-bold ${labelCol}`}>
        with {calc("df", getV('df'))} Degrees of Freedom
      </div>
    </div>
  );
  if (type === 'anova') {
    const groupStats = getV('groupStats') || [];
    const grandM = getV('grandMean') || 0;
    const [ssWTab, setSsWTab] = useState('raw'); // 'raw' or 'stats'

    const SigmaWithLimits = ({ top, bottom, className, term }) => (
      <div className={`inline-flex flex-col items-center leading-none mx-1 ${className}`}>
        <span className="text-[10px] h-3 select-none">{calc(top, undefined)}</span>
        <span className="text-2xl -my-1 select-none" title={term ? MATH_TERMS[term]?.desc : undefined}>Σ</span>
        <span className="text-[10px] h-3 select-none">{calc(bottom, undefined)}</span>
      </div>
    );

    return (
      <div className="flex flex-col items-center gap-6 w-full max-w-full overflow-hidden px-1">
        {/* Main F-Ratio Card */}
        <div
          className="flex flex-col items-center w-full group cursor-help"
          onMouseEnter={() => onHover && onHover('f_ratio')}
          onMouseLeave={() => onHover && onHover(null)}
        >
          <div className={`text-[10px] font-black uppercase tracking-widest ${labelCol} mb-1`}>The F-Ratio</div>
          <div className={`flex items-center text-2xl md:text-4xl font-serif ${textCol} whitespace-nowrap`}>
            <span className="font-bold mr-3 italic">F</span>
            <span className="mr-3">=</span>
            <div className="flex flex-col items-center">
              <div className={`border-b-2 px-4 pb-1 mb-1 w-full text-center group relative ${borderCol}`}>
                {calc("MS_between", getV('msB'))}
              </div>
              <div className="pt-1 px-4 group relative">
                {calc("MS_within", getV('msW'))}
              </div>
            </div>
          </div>
        </div>

        <div className={`w-full flex flex-col gap-6 border-t border-dashed ${darkMode ? 'border-slate-800' : 'border-slate-200'} pt-6 overflow-visible`}>
          {/* Mean Square Components */}
          <div className="ms-grid">
            <div
              className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-slate-50 border-slate-100'} flex flex-col items-center gap-2 min-w-0 overflow-visible transition-all hover:border-indigo-500/50 cursor-link`}
              onMouseEnter={() => onHover && onHover('ms_between')}
              onMouseLeave={() => onHover && onHover(null)}
            >
              <div className={`text-[9px] font-black uppercase tracking-widest ${labelCol}`}>Mean Square Between</div>
              <div className={`text-[10px] ${labelCol} text-center leading-tight mb-2 max-w-[200px]`}>
                Turns SS_between into an average by dividing by its degrees of freedom. MS_between estimates variation due to group differences.
              </div>
              <div className="eq-wrap">
                <div className={`flex flex-col items-center eq-text font-serif ${textCol} whitespace-nowrap`}>
                  <div className="flex items-center gap-2">
                    <span>{calc("MS_between", getV('msB'))}</span>
                    <span className="opacity-50">=</span>
                    <div className="flex flex-col items-center">
                      <span className={`border-b ${borderCol} px-3 pb-0.5 mb-0.5`}>{calc("SS_between", getV('ssB'))}</span>
                      <span className="text-[0.9em]">{calc("df_between", getV('dfB'))}</span>
                    </div>
                  </div>
                  <div className={`mt-2 text-[0.6em] ${labelCol} opacity-80 flex items-center gap-2 italic`}>
                    <span>{calc("df_between", getV('dfB'))} = {calc("k", undefined)} - 1</span>
                    <span className="w-1 h-1 rounded-full bg-slate-500/30" />
                    <span className="text-indigo-400 font-bold">{calc("k", undefined)} = # of groups</span>
                  </div>
                </div>
              </div>
            </div>

            <div
              className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-slate-50 border-slate-100'} flex flex-col items-center gap-2 min-w-0 overflow-visible transition-all hover:border-indigo-500/50 cursor-link`}
              onMouseEnter={() => onHover && onHover('ms_within')}
              onMouseLeave={() => onHover && onHover(null)}
            >
              <div className={`text-[9px] font-black uppercase tracking-widest ${labelCol}`}>Mean Square Within</div>
              <div className={`text-[10px] ${labelCol} text-center leading-tight mb-2 max-w-[200px]`}>
                Turns SS_within into an average by dividing by its degrees of freedom. MS_within estimates the typical within-group variability (noise).
              </div>
              <div className="eq-wrap">
                <div className={`flex flex-col items-center eq-text font-serif ${textCol} whitespace-nowrap`}>
                  <div className="flex items-center gap-2">
                    <span>{calc("MS_within", getV('msW'))}</span>
                    <span className="opacity-50">=</span>
                    <div className="flex flex-col items-center">
                      <span className={`border-b ${borderCol} px-3 pb-0.5 mb-0.5`}>{calc("SS_within", getV('ssW'))}</span>
                      <span className="text-[0.9em]">{calc("df_within", getV('dfW'))}</span>
                    </div>
                  </div>
                  <div className={`mt-2 text-[0.6em] ${labelCol} opacity-80 flex flex-col items-center gap-1 italic`}>
                    <span>{calc("df_within", getV('dfW'))} = {calc("N", undefined)} - {calc("k", undefined)}</span>
                    <span className="flex items-center gap-1 text-indigo-400 font-bold">
                      {calc("N", undefined)} = <SigmaWithLimits top="k" bottom="j=1" term="Sigma_k" className="scale-75 origin-center mx-0.5" /> {calc("nj", undefined)} = total sample size
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sum of Squares Definitions */}
          <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-900/20 border-slate-800' : 'bg-white border-slate-100'} flex flex-col gap-4 min-w-0 overflow-visible`}>
            {/* SS BETWEEN PANEL */}
            <div
              className="flex flex-col items-center gap-2 p-2 rounded-xl transition-all hover:bg-slate-500/5 cursor-link"
              onMouseEnter={() => onHover && onHover('ss_between')}
              onMouseLeave={() => onHover && onHover(null)}
            >
              <div className={`text-[9px] font-black uppercase tracking-widest ${labelCol}`}>SS Between (Signal)</div>
              <div className={`text-[11px] ${labelCol} text-center leading-tight max-w-lg mb-1`}>
                Adds up how far each group mean is from the grand mean, weighted by the group’s size. Larger gaps between group means create larger SS_between.
                <br />
                <span className="italic mt-1 block">Think: “How separated are the group averages?”</span>
              </div>

              <div className="eq-wrap mt-2">
                <div className={`eq-text font-serif ${textCol} flex items-center whitespace-nowrap`}>
                  {calc("SS_between", getV('ssB'))}
                  <span className="mx-2 opacity-50">=</span>
                  <SigmaWithLimits top="k" bottom="j=1" term="Sigma_k" />
                  <span>{calc("nj", undefined)}<span title={MATH_TERMS["Square"].desc}>({calc("x̄j", undefined)} - {calc("x̄_grand", undefined)})²</span></span>
                </div>
              </div>

              <div className={`text-[10px] font-bold ${darkMode ? 'text-emerald-500/80' : 'text-emerald-600/80'} uppercase tracking-tight mt-1`}>
                Between: “Increases when group means separate.”
              </div>
            </div>

            <div className="border-t border-slate-800/10 dark:border-slate-100/10 my-1" />

            {/* SS WITHIN PANEL */}
            <div
              className="flex flex-col items-center gap-2 p-2 rounded-xl transition-all hover:bg-slate-500/5 cursor-link"
              onMouseEnter={() => onHover && onHover('ss_within')}
              onMouseLeave={() => onHover && onHover(null)}
            >
              <div className={`text-[9px] font-black uppercase tracking-widest ${labelCol}`}>SS Within (Noise)</div>
              <div className={`text-[11px] ${labelCol} text-center leading-tight max-w-lg mb-3`}>
                Adds up how far each individual score is from its own group mean. More spread inside groups creates larger SS_within.
              </div>

              {/* TABS FOR SS WITHIN */}
              <div className="flex p-1 bg-slate-500/10 rounded-lg mb-3">
                <button
                  onClick={() => setSsWTab('raw')}
                  className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${ssWTab === 'raw' ? (darkMode ? 'bg-indigo-600 text-white' : 'bg-white text-indigo-600 shadow-sm') : (labelCol + ' hover:bg-slate-500/10')}`}>
                  RAW DATA
                </button>
                <button
                  onClick={() => setSsWTab('stats')}
                  className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${ssWTab === 'stats' ? (darkMode ? 'bg-indigo-600 text-white' : 'bg-white text-indigo-600 shadow-sm') : (labelCol + ' hover:bg-slate-500/10')}`}>
                  SUMMARY STATS
                </button>
              </div>

              <div className="flex flex-col gap-3 w-full items-center min-h-[40px]">
                {ssWTab === 'raw' ? (
                  <div className="eq-wrap animate-in fade-in duration-300">
                    <div className={`eq-text font-serif ${textCol} flex items-center whitespace-nowrap`}>
                      {calc("SS_within", getV('ssW'))}
                      <span className="mx-2 opacity-50">=</span>
                      <SigmaWithLimits top="k" bottom="j=1" term="Sigma_k" />
                      <SigmaWithLimits top="nⱼ" bottom="i=1" term="Sigma_nj" />
                      <span><span title={MATH_TERMS["Square"].desc}>({calc("xij", undefined)} - {calc("x̄j", undefined)})²</span></span>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center animate-in fade-in duration-300">
                    <div className={`text-[9px] italic ${labelCol} mb-2 opacity-80`}>
                      Computed from each group’s variance: {calc("SS_within", getV('ssW'))} = {calc("nj_minus_1_sj2", undefined)}
                    </div>
                    <div className="eq-wrap">
                      <div className={`eq-text font-serif ${textCol} flex items-center whitespace-nowrap`}>
                        {calc("SS_within", getV('ssW'))}
                        <span className="mx-2 opacity-50">=</span>
                        <SigmaWithLimits top="k" bottom="j=1" term="Sigma_k" />
                        <span>({calc("nj", undefined)} - 1){calc("sj2", undefined)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className={`text-[10px] font-bold ${darkMode ? 'text-amber-500/80' : 'text-amber-600/80'} uppercase tracking-tight mt-1`}>
                Within: “Increases when points spread out within groups.”
              </div>
            </div>
          </div>

          {/* Worked Example for SS Between */}
          {showValues && groupStats.length > 0 && (
            <div className={`p-4 rounded-2xl border-2 border-dashed ${darkMode ? 'bg-indigo-500/5 border-indigo-500/20' : 'bg-indigo-50 border-indigo-100'} animate-in fade-in slide-in-from-top-2 min-w-0 overflow-visible`}>
              <div className={`text-[8px] font-black uppercase tracking-widest text-indigo-500 mb-2 text-center`}>Worked Calculation: SS Between</div>
              <div className="eq-wrap">
                <div className={`text-[11px] font-serif ${textCol} text-center leading-relaxed italic`}>
                  SS<sub>between</sub> =
                  {groupStats.map((g, i) => (
                    <span key={i}>
                      {i > 0 && " + "}
                      <span className="font-bold">{g.n}</span>(<span className="text-indigo-400">{g.mean.toFixed(2)}</span> - <span className="text-amber-500">{grandM.toFixed(2)}</span>)²
                    </span>
                  ))}
                  <span className="ml-2 font-bold text-indigo-500">= {getV('ssB')?.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}

          {/* SS Total Identity Card */}
          <div
            className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-950/50 border-slate-800' : 'bg-zinc-50 border-slate-100'} flex flex-col items-center gap-2 min-w-0 overflow-visible transition-all hover:border-indigo-500/50 cursor-link`}
            onMouseEnter={() => onHover && onHover('ss_total')}
            onMouseLeave={() => onHover && onHover(null)}
          >
            <div className={`text-[9px] font-black uppercase tracking-widest ${labelCol}`}>The SS Total identity</div>
            <div className={`text-[11px] ${labelCol} text-center leading-tight max-w-lg mb-1`}>
              Total variability equals variability explained by group differences plus variability inside the groups.
              <br />
              <span className="italic mt-1 block">“This identity is what makes ANOVA a ‘variance partitioning’ method.”</span>
            </div>

            <div className={`flex flex-col items-center gap-2 w-full mt-2`}>
              <div className="eq-wrap">
                <div className={`eq-text font-serif ${textCol} flex items-center whitespace-nowrap`}>
                  <span>{calc("SS_total", getV('ssT'))}</span>
                  <span className="mx-3 opacity-50">=</span>
                  <span>{calc("SS_between", getV('ssB'))}</span>
                  <span className="mx-2 opacity-30">+</span>
                  <span>{calc("SS_within", getV('ssW'))}</span>
                </div>
              </div>
              <div className={`text-[10px] font-bold text-indigo-500/80 uppercase tracking-tight py-1 bg-indigo-500/5 px-3 rounded-full border border-indigo-500/10`}>
                Total variability = explained (between) + unexplained (within)
              </div>
              <div className="eq-wrap">
                <div className={`text-[10px] flex items-center font-serif ${labelCol} opacity-70 mt-1 whitespace-nowrap`}>
                  Formula: {calc("SS_total", getV('ssT'))} = <SigmaWithLimits top="k" bottom="j=1" term="Sigma_k" className="scale-75 origin-center" /><SigmaWithLimits top="nⱼ" bottom="i=1" term="Sigma_nj" className="scale-75 origin-center" />({calc("xij", undefined)} - {calc("x̄_grand", undefined)})²
                </div>
              </div>
            </div>
          </div>

          {/* Effect Size Card */}
          <div
            className={`p-5 rounded-2xl border flex flex-col items-center gap-2 min-w-0 ${darkMode ? 'bg-indigo-500/5 border-indigo-500/20' : 'bg-indigo-50 border-indigo-100 hover:border-indigo-200'} transition-all cursor-link`}
            onClick={() => onInfo && onInfo('eta2')}
            onMouseEnter={() => onHover && onHover('eta_squared')}
            onMouseLeave={() => onHover && onHover(null)}
          >
            <div className={`text-[9px] font-black uppercase tracking-widest text-indigo-500 text-center`}>Effect Size (Eta Squared)</div>
            <div className={`text-[11px] ${labelCol} text-center leading-tight max-w-lg mb-1`}>
              Proportion of total variability accounted for by group differences. For example, η² = .30 means about 30% of the variance is associated with group membership.
            </div>
            <div className="eq-wrap mt-2">
              <div className={`eq-text font-serif ${textCol} flex items-center whitespace-nowrap`}>
                {calc("eta2", getV('eta2'))}
                <span className="mx-4 font-light opacity-50">=</span>
                <div className="flex flex-col items-center">
                  <span className={`border-b-2 ${borderCol} px-4 pb-0.5 mb-0.5`}>{calc("SS_between", getV('ssB'))}</span>
                  <span className="text-[0.9em]">{calc("SS_total", getV('ssT'))}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  if (type === 'correlation') return <div className={`flex items-center text-xl md:text-2xl font-serif ${textCol}`}><span className="font-bold mr-3 italic">r</span><span className="mr-3">=</span><div className="flex flex-col items-center"><div className={`border-b-2 px-2 pb-1 mb-1 w-full text-center ${borderCol}`}>{calc("Covariance", undefined)}</div><div className="pt-1">( {calc("s", undefined)}x * {calc("s", undefined)}y )</div></div></div>;
  if (type === 'regression') return <div className={`flex items-center text-xl md:text-2xl font-serif ${textCol}`}><span className="font-bold italic mr-2">Y</span><span>=</span><span className="mx-2">Intercept</span><span>+</span><span className="mx-2">{calc("Beta", undefined)}(X)</span><span>+</span><span className="mx-2">Error</span></div>;
  return <div className="text-slate-500">Formula not rendered</div>;
};

// --- PROBABILITY VISUAL ---

export default FormulaDisplay;
