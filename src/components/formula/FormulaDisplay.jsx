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
  const [ssWTab, setSsWTab] = useState('raw');
  const [factorialEffectKey, setFactorialEffectKey] = useState('AxB');
  const [oneSampleFocus, setOneSampleFocus] = useState('test');

  const getV = (key) => stats ? stats[key] : undefined;
  const calc = (term, val) => <MathTerm term={term} value={val} showValue={showValues} onInfo={onInfo} onHover={onHover} darkMode={darkMode} />;

  if (type === 'mean') return (
    <div className="flex flex-col items-center gap-8 w-full">
      <div className="flex flex-col items-center">
        <div className={`text-xs font-bold mb-3 uppercase tracking-wider ${labelCol}`}>Arithmetic Mean</div>
        <div className={`flex items-center text-xl md:text-2xl font-serif ${textCol}`}>
          <span>{calc("x̄", getV('xBar'))}</span>
          <span className="mx-3">=</span>
          <div className="flex flex-col items-center">
            <span className={`border-b-2 px-2 pb-1 mb-1 ${borderCol}`}>Σx</span>
            <span>{calc("n", getV('n'))}</span>
          </div>
        </div>
      </div>

      <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 w-full border-t border-dashed ${darkMode ? 'border-slate-800' : 'border-slate-200'} pt-6`}>
        <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-slate-50 border-slate-100'} flex flex-col items-center`}>
          <div className={`text-[10px] font-black uppercase tracking-widest ${labelCol} mb-2`}>Median</div>
          <div className={`text-lg font-serif ${textCol} text-center`}>
            {calc("Median", undefined)}
          </div>
          <div className={`text-[10px] ${labelCol} mt-1 text-center`}>
            The middle value when data is ordered. Better for skewed data.
          </div>
        </div>
        <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-slate-50 border-slate-100'} flex flex-col items-center`}>
          <div className={`text-[10px] font-black uppercase tracking-widest ${labelCol} mb-2`}>Mode</div>
          <div className={`text-lg font-serif ${textCol} text-center`}>
            {calc("Mode", undefined)}
          </div>
          <div className={`text-[10px] ${labelCol} mt-1 text-center`}>
            The most frequent value. Best for categorical data.
          </div>
        </div>
      </div>
    </div>
  );
  if (type === 'sd') return <div className="flex flex-col items-center"><div className={`text-xs font-bold mb-3 uppercase tracking-wider ${labelCol}`}>Sample Standard Deviation</div><div className={`flex items-center text-xl md:text-2xl font-serif ${textCol}`}><span className="font-bold mr-3 italic">s</span><span className="mr-3">=</span><div className="flex items-center"><span className="text-4xl mr-1 font-light">√</span><div className={`flex flex-col items-center border-t pt-1 ${borderCol}`}><div className={`flex flex-col items-center border-b pb-1 mb-1 px-2 ${borderCol}`}><span>Σ({calc("x", undefined)} - {calc("x̄", getV('xBar'))})²</span></div><span>{calc("n", getV('n'))} - 1</span></div></div></div></div>;
  if (type === 'range') return <div className="flex flex-col items-center"><div className={`text-xs font-bold mb-3 uppercase tracking-wider ${labelCol}`}>Range & IQR Equations</div><div className={`flex flex-col gap-4 text-xl md:text-2xl font-serif ${textCol}`}><div>{calc("Range", undefined)} = Max - Min</div><div>{calc("IQR", undefined)} = {calc("Q3", undefined)} - {calc("Q1", undefined)}</div></div></div>;
  if (type === 'variability') return (
    <div className="flex flex-col gap-8 w-full">
      <div className="grid gap-6 lg:grid-cols-2">
        <div className={`rounded-xl border p-5 flex flex-col items-center ${darkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
          <div className={`text-xs font-bold mb-4 uppercase tracking-wider ${labelCol}`}>Sample Variance</div>
          <div className={`flex items-center text-xl md:text-2xl font-serif ${textCol}`}>
            <span>{calc("s2", getV('sampleVariance'))}</span><span className="mx-3">=</span>
            <div className="flex flex-col items-center">
              <span className={`border-b-2 px-2 pb-1 mb-1 ${borderCol}`}>&Sigma;({calc("x", undefined)} &minus; {calc("xBar", getV('mean'))})<sup>2</sup></span>
              <span>{calc("n", getV('n'))} &minus; 1</span>
            </div>
          </div>
        </div>
        <div className={`rounded-xl border p-5 flex flex-col items-center ${darkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
          <div className={`text-xs font-bold mb-4 uppercase tracking-wider ${labelCol}`}>Sample Standard Deviation</div>
          <div className={`flex items-center text-xl md:text-2xl font-serif ${textCol}`}>
            <span>{calc("s", getV('sampleSd'))}</span><span className="mx-3">=</span><span className="text-4xl mr-1">&radic;</span><span className={`border-t-2 px-2 pt-1 ${borderCol}`}>{calc("s2", getV('sampleVariance'))}</span>
          </div>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className={`rounded-xl border p-5 text-center ${darkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-slate-50 border-slate-200'}`}><div className={`text-xs font-bold uppercase tracking-wider ${labelCol}`}>Range</div><div className={`mt-4 text-xl font-serif ${textCol}`}>{calc("Range", getV('range'))} = {calc("Max", getV('max'))} &minus; {calc("Min", getV('min'))}</div></div>
        <div className={`rounded-xl border p-5 text-center ${darkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-slate-50 border-slate-200'}`}><div className={`text-xs font-bold uppercase tracking-wider ${labelCol}`}>Interquartile Range</div><div className={`mt-4 text-xl font-serif ${textCol}`}>{calc("IQR", getV('iqr'))} = {calc("Q3", getV('q3'))} &minus; {calc("Q1", getV('q1'))}</div></div>
        <div className={`rounded-xl border p-5 text-center ${darkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-slate-50 border-slate-200'}`}><div className={`text-xs font-bold uppercase tracking-wider ${labelCol}`}>Median Absolute Deviation</div><div className={`mt-4 text-lg font-serif ${textCol}`}>{calc("MAD", getV('mad'))} = median(|{calc("x", undefined)} &minus; {calc("Median", getV('median'))}|)</div></div>
        <div className={`rounded-xl border p-5 text-center ${darkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-slate-50 border-slate-200'}`}><div className={`text-xs font-bold uppercase tracking-wider ${labelCol}`}>Coefficient of Variation</div><div className={`mt-4 text-lg font-serif ${textCol}`}>{calc("CV", getV('coefficientOfVariation'))} = <span className="inline-flex flex-col align-middle mx-1"><span className={`border-b ${borderCol}`}>{calc("s", getV('sampleSd'))}</span><span>|{calc("xBar", getV('mean'))}|</span></span> &times; 100%</div></div>
      </div>
    </div>
  );
  if (type === 'percentage') return <div className="flex flex-col items-center"><div className={`text-xs font-bold mb-3 uppercase tracking-wider ${labelCol}`}>Relative Frequency Equation</div><div className={`flex flex-col gap-3 text-xl md:text-2xl font-serif ${textCol}`}><div className="flex items-center"><span className="mr-2 italic">rf</span><span>=</span><div className="flex flex-col items-center mx-1"><span className={`border-b-2 px-1 ${borderCol}`}>{calc("f", undefined)}</span><span>{calc("N", getV('n'))}</span></div></div></div></div>;
  if (type === 'frequency') return (
    <div className="grid gap-6 md:grid-cols-3 w-full">
      <div className={`rounded-xl border p-6 flex flex-col items-center ${darkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
        <div className={`text-xs font-bold uppercase tracking-wider ${labelCol}`}>Relative Frequency</div>
        <div className={`mt-5 flex items-center text-xl md:text-2xl font-serif ${textCol}`}><span>{calc("rf", undefined)}</span><span className="mx-3">=</span><span className="inline-flex flex-col items-center"><span className={`border-b-2 px-3 ${borderCol}`}>{calc("f", undefined)}</span><span>{calc("N", getV('n'))}</span></span></div>
      </div>
      <div className={`rounded-xl border p-6 flex flex-col items-center ${darkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
        <div className={`text-xs font-bold uppercase tracking-wider ${labelCol}`}>Percentage</div>
        <div className={`mt-5 flex items-center text-xl md:text-2xl font-serif ${textCol}`}><span>{calc("Percentage", undefined)}</span><span className="mx-3">=</span><span>{calc("rf", undefined)} &times; 100%</span></div>
      </div>
      <div className={`rounded-xl border p-6 flex flex-col items-center ${darkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
        <div className={`text-xs font-bold uppercase tracking-wider ${labelCol}`}>Cumulative Frequency</div>
        <div className={`mt-5 flex items-center text-xl md:text-2xl font-serif ${textCol}`}><span>{calc("cf", undefined)}</span><span className="mx-3">=</span><span>&Sigma; {calc("f", undefined)} through the current ordered value</span></div>
      </div>
    </div>
  );
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
              <span className="mr-1">{calc("SE_delta", getV('se'))}</span>
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
                <span>{calc("n", getV('n'))}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  if (type === 'z_test') return (
    <div className="flex flex-col items-center">
      <div className={`flex items-center text-xl md:text-2xl font-serif ${textCol}`}>
        <span className="font-bold mr-3 italic">z</span>
        <span className="mr-3">=</span>
        <div className="flex flex-col items-center">
          <div className={`border-b-2 px-2 pb-1 mb-1 w-full text-center group relative ${borderCol}`}>
            ({calc("x̄", getV('xBar'))} - {calc("mu", getV('mu'))})
          </div>
          <div className="pt-1 flex items-center group relative">
            <span className="mr-1">{calc("SE", getV('se'))}</span>
          </div>
        </div>
      </div>
      <div className={`mt-3 pt-3 border-t border-dashed ${darkMode ? 'border-slate-700' : 'border-slate-200'} w-full flex flex-col items-center gap-2`}>
        <div className={`text-[9px] font-black uppercase tracking-widest ${labelCol}`}>Standard Error</div>
        <div className={`flex items-center text-sm md:text-base font-serif ${textCol}`}>
          <span>{calc("SE", getV('se'))}</span>
          <span className="mx-2">=</span>
          <div className="flex flex-col items-center">
            <span className={`border-b ${borderCol} px-1`}>{calc("sigma", getV('sigma'))}</span>
            <div className="flex items-center">
              <span className="text-xs mr-1">√</span>
              <span>{calc("n", getV('n'))}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
  if (type === 't_onesample') {
    const xBar = getV('xBar');
    const mu = getV('mu');
    const s = getV('s');
    const n = getV('n');
    const se = getV('se');
    const t = getV('t');
    const df = getV('df');
    const fmt = (value, digits = 3) => Number.isFinite(Number(value)) ? Number(value).toFixed(digits) : '--';
    const focusCards = {
      test: {
        title: 'Test statistic',
        detail: 'Compares the observed sample mean to the hypothesized mean in standard-error units.',
        hover: 't',
      },
      se: {
        title: 'Standard error',
        detail: 'Shrinks when n increases and grows when the sample standard deviation is larger.',
        hover: 'SE',
      },
      df: {
        title: 'Degrees of freedom',
        detail: 'A one-sample t test estimates one mean, so df is n - 1.',
        hover: 'df',
      },
    };
    const activeFocus = focusCards[oneSampleFocus] || focusCards.test;

    return (
      <div className="flex flex-col items-center gap-6 w-full max-w-full overflow-visible px-1">
        <div className={`text-[10px] font-black uppercase tracking-widest ${labelCol} flex flex-wrap items-center justify-center gap-2`}>
          {[
            { id: 'test', label: 't statistic' },
            { id: 'se', label: 'standard error' },
            { id: 'df', label: 'df' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setOneSampleFocus(item.id)}
              className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wide transition-all ${
                oneSampleFocus === item.id
                  ? 'bg-indigo-600 text-white shadow'
                  : (darkMode ? 'bg-slate-800 text-slate-400 hover:text-white' : 'bg-slate-100 text-slate-500 hover:text-slate-900')
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div
          className="flex flex-col items-center w-full group cursor-help"
          onMouseEnter={() => onHover && onHover(activeFocus.hover)}
          onMouseLeave={() => onHover && onHover(null)}
        >
          <div className={`text-[10px] font-black uppercase tracking-widest ${labelCol} mb-1`}>{activeFocus.title}</div>
          <p className={`text-[11px] ${labelCol} text-center leading-tight max-w-lg mb-3`}>{activeFocus.detail}</p>
          <div className={`flex items-center text-xl md:text-3xl font-serif ${textCol} whitespace-nowrap bg-slate-500/5 p-4 rounded-2xl border ${borderCol} max-w-full overflow-visible`}>
            <span className="font-bold mr-3 italic">t</span>
            <span className="mr-3">=</span>
            <div className="flex flex-col items-center">
              <div className={`border-b-2 px-3 pb-1 mb-1 w-full text-center group relative ${borderCol}`}>
                ({calc("x̄", xBar)} - {calc("mu", mu)})
              </div>
              <div className="pt-1 flex items-center group relative">
                <span className="mr-1">{calc("SE", se)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className={`w-full grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-dashed ${darkMode ? 'border-slate-800' : 'border-slate-200'} pt-5`}>
          <div
            className={`p-5 rounded-2xl border flex flex-col items-center gap-2 min-w-0 transition-all cursor-help ${oneSampleFocus === 'se' ? 'border-indigo-500/50 bg-indigo-500/5' : (darkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-slate-50 border-slate-100')}`}
            onMouseEnter={() => onHover && onHover('SE')}
            onMouseLeave={() => onHover && onHover(null)}
          >
            <div className={`text-[9px] font-black uppercase tracking-widest ${labelCol}`}>Standard Error</div>
            <div className={`flex items-center text-base md:text-lg font-serif ${textCol}`}>
              <span>{calc("SE", se)}</span>
              <span className="mx-2">=</span>
              <div className="flex flex-col items-center">
                <span className={`border-b ${borderCol} px-2`}>{calc("s", s)}</span>
                <div className="flex items-center">
                  <span className="text-xs mr-1">√</span>
                  <span>{calc("n", n)}</span>
                </div>
              </div>
            </div>
            <p className={`text-[10px] text-center leading-tight ${labelCol}`}>The denominator is the expected sampling noise for the sample mean.</p>
          </div>

          <div
            className={`p-5 rounded-2xl border flex flex-col items-center gap-2 min-w-0 transition-all cursor-help ${oneSampleFocus === 'df' ? 'border-indigo-500/50 bg-indigo-500/5' : (darkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-slate-50 border-slate-100')}`}
            onMouseEnter={() => onHover && onHover('df')}
            onMouseLeave={() => onHover && onHover(null)}
          >
            <div className={`text-[9px] font-black uppercase tracking-widest ${labelCol}`}>Degrees of Freedom</div>
            <div className={`flex items-center text-base md:text-lg font-serif ${textCol}`}>
              <span>{calc("df", df)}</span>
              <span className="mx-2">=</span>
              <span>{calc("n", n)} - 1</span>
            </div>
            <p className={`text-[10px] text-center leading-tight ${labelCol}`}>Lower df makes the t distribution heavier-tailed than the normal curve.</p>
          </div>
        </div>

        {showValues && (
          <div className={`w-full p-4 rounded-2xl border-2 border-dashed ${darkMode ? 'bg-indigo-500/5 border-indigo-500/20' : 'bg-indigo-50 border-indigo-100'} animate-in fade-in slide-in-from-top-2`}>
            <div className="text-[8px] font-black uppercase tracking-widest text-indigo-500 mb-2 text-center">Worked substitution</div>
            <div className={`text-[12px] md:text-sm font-serif text-center leading-relaxed ${textCol}`}>
              t = ({fmt(xBar)} - {fmt(mu)}) / {fmt(se)} = {fmt(t)}
              <span className={`block mt-1 text-[11px] font-sans font-bold uppercase tracking-widest ${labelCol}`}>
                SE = {fmt(s)} / sqrt({fmt(n, 0)}) = {fmt(se)}; df = {fmt(df, 0)}
              </span>
            </div>
          </div>
        )}
      </div>
    );
  }
  if (type === 'anova') {
    const groupStats = getV('groupStats') || [];
    const grandM = getV('grandMean') || 0;

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
                {calc("MS_error", getV('msW'))}
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
              <div className={`text-[9px] font-black uppercase tracking-widest ${labelCol}`}>Mean Square Error (Residual)</div>
              <div className={`text-[10px] ${labelCol} text-center leading-tight mb-2 max-w-[200px]`}>
                Turns SS_error into an average by dividing by its degrees of freedom. MS_error estimates the typical unexplained variability (noise).
              </div>
              <div className="eq-wrap">
                <div className={`flex flex-col items-center eq-text font-serif ${textCol} whitespace-nowrap`}>
                  <div className="flex items-center gap-2">
                    <span>{calc("MS_error", getV('msW'))}</span>
                    <span className="opacity-50">=</span>
                    <div className="flex flex-col items-center">
                      <span className={`border-b ${borderCol} px-3 pb-0.5 mb-0.5`}>{calc("SS_error", getV('ssW'))}</span>
                      <span className="text-[0.9em]">{calc("df_error", getV('dfW'))}</span>
                    </div>
                  </div>
                  <div className={`mt-2 text-[0.6em] ${labelCol} opacity-80 flex flex-col items-center gap-1 italic`}>
                    <span>{calc("df_error", getV('dfW'))} = {calc("N", undefined)} - {calc("k", undefined)}</span>
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

  if (type === 'factorial_anova') {
    const effectKey = factorialEffectKey;
    const effects = getV('effects') || {};
    const factors = getV('factors') || [];

    const effectItem = effects[effectKey] || {};
    const errorItem = effects.Error || {};
    const totalItem = effects.Total || {};
    const partitionsTotal = getV('ssType') === 'I' || Boolean(getV('isBalanced'));

    // Determine which effect to show based on expandedEffect
    let effectTerm = 'MS_AxB';
    let dfTerm = 'df_AxB';
    let ssTerm = 'SS_AxB';
    let fTerm = 'F_AxB';

    if (effectKey === 'A') {
      effectTerm = 'MS_A';
      dfTerm = 'df_A';
      ssTerm = 'SS_A';
      fTerm = 'F_A';
    } else if (effectKey === 'B') {
      effectTerm = 'MS_B';
      dfTerm = 'df_B';
      ssTerm = 'SS_B';
      fTerm = 'F_B';
    }

    return (
      <div className="flex flex-col items-center gap-6 w-full max-w-full overflow-visible px-2 pb-4 animate-in fade-in duration-300">
        {/* Main F-Ratio Card */}
        <div
          className="flex flex-col items-center w-full group cursor-help"
          onMouseEnter={() => onHover && onHover('f_ratio')}
          onMouseLeave={() => onHover && onHover(null)}
        >
          <div className={`text-[10px] font-black uppercase tracking-widest ${labelCol} mb-1 flex items-center justify-between w-full max-w-sm`}>
            <span>The F-Ratio</span>
            <div className="flex gap-1">
              {[
                { key: 'A', label: factors[0]?.label || 'Factor A' },
                { key: 'B', label: factors[1]?.label || 'Factor B' },
                { key: 'AxB', label: 'Interaction' },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setFactorialEffectKey(key)}
                  className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wide transition-all ${
                    effectKey === key
                      ? 'bg-indigo-600 text-white shadow'
                      : 'bg-slate-700/50 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className={`flex items-center text-2xl md:text-3xl font-serif ${textCol} whitespace-nowrap bg-slate-500/5 p-4 rounded-2xl border ${borderCol} w-full max-w-sm justify-center transition-all duration-300 overflow-visible`}>
            <span className="font-bold mr-3 italic">F</span>
            <span className="mr-3">=</span>
            <div className="flex flex-col items-center">
              <div className={`border-b-2 px-4 pb-1 w-full text-center group relative ${borderCol} overflow-visible`}>
                {calc(effectTerm, effectItem.ms)}
              </div>
              <div className="pt-1 px-4 group relative text-center overflow-visible">
                {calc("MS_error", errorItem.ms)}
              </div>
            </div>
          </div>
        </div>

        <div className={`w-full flex flex-col gap-6 border-t border-dashed ${darkMode ? 'border-slate-800' : 'border-slate-200'} pt-6 overflow-visible`}>
          {/* Mean Square Components */}
          <div className="ms-grid grid grid-cols-1 md:grid-cols-2 gap-4 overflow-visible">
            <div
              className={`p-5 rounded-2xl border flex flex-col items-center gap-2 min-w-0 overflow-visible transition-all duration-300 ${darkMode ? 'bg-indigo-900/10 border-indigo-500/20 shadow-lg shadow-indigo-900/10' : 'bg-indigo-50/50 border-indigo-200 shadow-lg shadow-indigo-100/30'}`}
            >
              <div className={`text-[9px] font-black uppercase tracking-widest text-indigo-500`}>Mean Square ({effectItem.label || 'Effect'})</div>
              <div className={`text-[10px] ${labelCol} text-center leading-tight mb-2 px-2`}>
                Estimates variation due to <span className="font-bold text-indigo-400">{effectItem.label}</span>.
              </div>
              <div className="eq-wrap overflow-visible">
                <div className={`flex flex-col items-center eq-text font-serif ${textCol} whitespace-nowrap overflow-visible`}>
                  <div className="flex items-center gap-2">
                    <span>{calc(effectTerm, effectItem.ms)}</span>
                    <span className="opacity-50">=</span>
                    <div className="flex flex-col items-center">
                      <span className={`border-b ${borderCol} px-3 pb-0.5 mb-0.5`}>{calc(ssTerm, effectItem.ss)}</span>
                      <span className="text-[0.9em]">{calc(dfTerm, effectItem.df)}</span>
                    </div>
                  </div>
                  <div className={`mt-2 text-[0.6em] ${labelCol} opacity-80 flex items-center gap-2 italic text-center`}>
                    {effectKey === 'A' && <span>{calc('df_A', effectItem.df)} = a - 1</span>}
                    {effectKey === 'B' && <span>{calc('df_B', effectItem.df)} = b - 1</span>}
                    {effectKey === 'AxB' && <span>{calc('df_AxB', effectItem.df)} = (a-1)(b-1)</span>}
                  </div>
                </div>
              </div>
            </div>

            <div
              className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-slate-50 border-slate-100'} flex flex-col items-center gap-2 min-w-0 overflow-visible transition-all hover:border-indigo-500/50 cursor-link`}
            >
              <div className={`text-[9px] font-black uppercase tracking-widest ${labelCol}`}>Mean Square Error (Residual)</div>
              <div className={`text-[10px] ${labelCol} text-center leading-tight mb-2 px-4`}>
                Estimates the typical unexplained variability (noise).
              </div>
              <div className="eq-wrap overflow-visible">
                <div className={`flex flex-col items-center eq-text font-serif ${textCol} whitespace-nowrap overflow-visible`}>
                  <div className="flex items-center gap-2">
                    <span>{calc("MS_error", errorItem.ms)}</span>
                    <span className="opacity-50">=</span>
                    <div className="flex flex-col items-center">
                      <span className={`border-b ${borderCol} px-3 pb-0.5 mb-0.5`}>{calc("SS_error", errorItem.ss)}</span>
                      <span className="text-[0.9em]">{calc("df_error", errorItem.df)}</span>
                    </div>
                  </div>
                  <div className={`mt-2 text-[0.6em] ${labelCol} opacity-80 flex items-center gap-2 italic text-center leading-tight px-4`}>
                    <span>{calc("df_error", errorItem.df)} = N - (a × b)<br />(requires all a × b cells populated)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SS Total Identity Card */}
          <div
            className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-950/50 border-slate-800' : 'bg-zinc-50 border-slate-100'} flex flex-col items-center gap-2 min-w-0 overflow-visible transition-all hover:border-indigo-500/50 cursor-link`}
          >
            <div className={`text-[9px] font-black uppercase tracking-widest ${labelCol} text-center px-4`}>
              {partitionsTotal ? 'The SS Total identity for Factorial ANOVA' : 'Type III sums of squares'}
            </div>
            <div className={`text-[11px] ${labelCol} text-center leading-tight mb-1 px-4`}>
              {partitionsTotal
                ? 'Total variability is partitioned into main effects, the interaction, and error.'
                : 'In an unbalanced Type III model, each effect is tested in the full model; effect sums of squares are not additive parts of SS total.'}
            </div>

            <div className={`flex flex-col items-center gap-2 w-full mt-2 overflow-visible`}>
              <div className="eq-wrap overflow-x-auto w-full pb-2 scrollbar-thin scrollbar-thumb-slate-700 no-scrollbar">
                <div className={`eq-text font-serif ${textCol} flex items-center justify-center min-w-max whitespace-nowrap mx-auto px-6`}>
                  {partitionsTotal ? (
                    <>
                      <span>{calc("SS_total", totalItem.ss)}</span>
                      <span className="mx-2 opacity-50">=</span>
                      <span>{calc("SS_A", effects.A?.ss)}</span>
                      <span className="mx-2 opacity-30">+</span>
                      <span>{calc("SS_B", effects.B?.ss)}</span>
                      <span className="mx-2 opacity-30">+</span>
                      <span>{calc("SS_AxB", effects.AxB?.ss)}</span>
                      <span className="mx-2 opacity-30">+</span>
                      <span>{calc("SS_error", errorItem.ss)}</span>
                    </>
                  ) : (
                    <>
                      <span>{calc("SS_A", effects.A?.ss)}</span>
                      <span className="mx-2 opacity-30">;</span>
                      <span>{calc("SS_B", effects.B?.ss)}</span>
                      <span className="mx-2 opacity-30">;</span>
                      <span>{calc("SS_AxB", effects.AxB?.ss)}</span>
                    </>
                  )}
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
            <div className={`text-[9px] font-black uppercase tracking-widest text-indigo-500 text-center flex items-center justify-center gap-1`}>
              <span>Partial Effect Size</span>
              <span className="text-indigo-500 normal-case tracking-normal" style={{ textTransform: 'none' }}>
                (partial eta squared)
              </span>
            </div>
            <div className={`text-[11px] ${labelCol} text-center leading-tight mb-1 px-6`}>
              Proportion of variance associated with {effectItem.label}, after excluding other effects.
            </div>
            <div className="eq-wrap mt-2">
              <div className={`eq-text font-serif ${textCol} flex items-center whitespace-nowrap`}>
                {calc("eta2_partial", effectItem.pes)}
                <span className="mx-4 font-light opacity-50">=</span>
                <div className="flex flex-col items-center">
                  <span className={`border-b-2 ${borderCol} px-4 pb-0.5 mb-0.5`}>{calc(ssTerm, effectItem.ss)}</span>
                  <span className="text-[0.9em]">{calc(ssTerm, effectItem.ss)} + {calc("SS_error", errorItem.ss)}</span>
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
  if (type === 'ancova') {
    return (
      <div className="flex flex-col items-center gap-6 w-full max-w-full overflow-hidden px-1">
        <div className="flex flex-col items-center w-full group cursor-help">
          <div className={`text-[10px] font-black uppercase tracking-widest ${labelCol} mb-1`}>F for Group (controlling for X)</div>
          <div className={`flex items-center text-2xl md:text-3xl font-serif ${textCol} whitespace-nowrap`}>
            <span className="font-bold mr-3 italic text-indigo-500">F<sub>adj</sub></span>
            <span className="mr-3">=</span>
            <div className="flex flex-col items-center">
              <div className={`border-b-2 px-4 pb-1 mb-1 w-full text-center group relative ${borderCol}`}>
                {calc("MS_Group", getV('msB'))}
              </div>
              <div className="pt-1 px-4 group relative">
                {calc("MS_error", getV('msW'))}
              </div>
            </div>
          </div>
          <div className={`mt-2 text-[10px] uppercase tracking-widest font-bold ${labelCol}`}>
            Model: Y ~ Group + X
          </div>
        </div>

        <div className={`w-full flex flex-col gap-4 border-t border-dashed ${darkMode ? 'border-slate-800' : 'border-slate-200'} pt-4`}>
          <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-slate-50 border-slate-100'} flex flex-col items-center gap-2`}>
            <div className={`text-[9px] font-black uppercase tracking-widest ${labelCol}`}>Mean Adjustment</div>
            <div className={`text-center font-serif ${textCol} whitespace-nowrap`}>
              <span>{calc("Ȳ_adj", undefined)}</span>
              <span className="mx-2">=</span>
              <span>{calc("Ȳ", undefined)} - {calc("b_w", getV('b_w'))} ({calc("X̄", undefined)} - {calc("X̄_grand", undefined)})</span>
            </div>
          </div>
        </div>
      </div>
    );
  }
  return <div className="text-slate-500">Formula not rendered</div>;
};

// --- PROBABILITY VISUAL ---

export default FormulaDisplay;
