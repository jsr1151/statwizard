import React, { useState, useEffect, useMemo, useRef } from 'react';
import { AlertCircle, Sparkles, Calculator, MousePointer2, Info, ArrowDown, MousePointerClick, Maximize2, Minimize2, RefreshCw, Play, ChevronsRight, ChevronUp, ChevronDown, Activity, Lightbulb, BrainCircuit, BarChart2, Sigma, BookOpen, Plus, X, Trash2, Edit2, TrendingUp, Grid, FileText, PieChart, CheckCircle, Layers, LayoutGrid } from 'lucide-react';
import { getGaussianPoints, getTPoints, normalCDF, tCDF, erf, getTCrit, getFDensity, fCDF, fPPF, getFCrit, getFPoints, calculateAnova, calculatePostHoc, lnGamma, beta } from '../../utils/mathHelpers';
import { pointsToPath, pointsToLine, getOrdinal } from '../../utils/svgHelpers';
import useTutor from '../../hooks/useTutor';
import TutorPanel from '../tutor/TutorPanel';
import CalculationText from '../common/CalculationText';
import TabButton from '../common/TabButton';
import MathTerm from '../common/MathTerm';
import FSamplingDist from './FSamplingDist';
import GroupsMeansView from './GroupsMeansView';
import VarianceDecomposition from './VarianceDecomposition';
const AnovaVisual = ({ highlight = null, darkMode, showValues, onTutorUpdate, onStatsUpdate }) => {
  const [groups, setGroups] = useState([
    { id: 1, label: 'Control', color: '#6366f1', inputMode: 'raw', values: [5, 6, 7, 5, 6], summary: { mean: "5.8", sd: "0.8", n: "5" }, collapsed: false },
    { id: 2, label: 'Treatment A', color: '#ec4899', inputMode: 'raw', values: [8, 7, 9, 8, 7], summary: { mean: "7.8", sd: "0.8", n: "5" }, collapsed: false },
    { id: 3, label: 'Treatment B', color: '#10b981', inputMode: 'raw', values: [3, 4, 2, 3, 4], summary: { mean: "3.2", sd: "0.8", n: "5" }, collapsed: false }
  ]);
  const [anovaMode, setAnovaMode] = useState('data'); // 'data' | 'calc'
  const [calcDf1, setCalcDf1] = useState(2);
  const [calcDf2, setCalcDf2] = useState(25);
  const [calcF, setCalcF] = useState(3.5);
  const [zoomDist, setZoomDist] = useState(false);
  const [modeToast, setModeToast] = useState(null);

  const toggleMode = (newMode) => {
    setAnovaMode(newMode);
    setModeToast(newMode === 'data' ? 'Data Mode: F computed from dataset' : 'Explore Mode: F is user-controlled');
    setTimeout(() => setModeToast(null), 3000);
  };
  const [activeTab, setActiveTab] = useState('fDist');
  const [alpha, setAlpha] = useState(0.05);
  const [showPostHoc, setShowPostHoc] = useState(false);
  const [showSpread, setShowSpread] = useState(true);
  const [manualF, setManualF] = useState(null);

  const anovaStats = useMemo(() => calculateAnova(groups), [groups]);

  const renderModel = useMemo(() => {
    if (anovaMode === 'data') {
      const stats = anovaStats || { fVal: 0, dfB: 2, dfW: 27, p: 1, k: 0, eta2: 0, ssB: 0, ssW: 0, ssT: 1, msB: 0, msW: 0, grandMean: 0 };
      const fVal = manualF ?? stats.fVal;
      const fCrit = fPPF(1 - alpha, stats.dfB, stats.dfW);
      const pVal = 1 - fCDF(fVal, stats.dfB, stats.dfW);
      return {
        mode: 'data',
        alpha,
        df1: stats.dfB,
        df2: stats.dfW,
        F: fVal,
        p: pVal,
        Fcrit: fCrit,
        ...stats,
        valid: (anovaStats !== null)
      };
    } else {
      const fCrit = fPPF(1 - alpha, calcDf1, calcDf2);
      const pVal = 1 - fCDF(calcF, calcDf1, calcDf2);
      return {
        mode: 'calc',
        alpha,
        df1: calcDf1,
        df2: calcDf2,
        F: calcF,
        p: pVal,
        Fcrit: fCrit,
        valid: true
      };
    }
  }, [anovaMode, anovaStats, alpha, manualF, calcDf1, calcDf2, calcF]);

  const postHoc = useMemo(() => (anovaMode === 'data' && anovaStats) ? calculatePostHoc(groups, anovaStats) : [], [groups, anovaStats, anovaMode]);

  useEffect(() => {
    if (anovaMode === 'data' && anovaStats) setManualF(anovaStats.fVal);
  }, [anovaStats, anovaMode]);

  useEffect(() => {
    if (onStatsUpdate) onStatsUpdate(renderModel);
  }, [renderModel, onStatsUpdate]);

  const tutorState = useMemo(() => ({
    k: renderModel.k,
    dfB: renderModel.df1,
    dfW: renderModel.df2,
    fVal: renderModel.F,
    fCrit: renderModel.Fcrit,
    p: renderModel.p,
    alpha: renderModel.alpha,
    eta2: renderModel.eta2,
    mode: renderModel.mode
  }), [renderModel]);

  const tutor = useTutor('anova', tutorState);
  useEffect(() => {
    if (onTutorUpdate && tutor.activeScript) onTutorUpdate(tutor.activeScript);
  }, [tutor.activeScript, onTutorUpdate]);

  const addGroup = () => {
    if (groups.length >= 6) return;
    const labels = ['A', 'B', 'C', 'D', 'E', 'F'];
    const colors = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'];
    setGroups([...groups, {
      id: Date.now(),
      label: `Group ${labels[groups.length]}`,
      color: colors[groups.length],
      inputMode: 'raw',
      values: [5, 5, 5, 5, 5],
      summary: { mean: "5.0", sd: "1.0", n: "5" },
      collapsed: false
    }]);
  };

  const removeGroup = (id) => {
    if (groups.length <= 2) return;
    setGroups(groups.filter(g => g.id !== id));
  };

  const updateGroup = (id, field, val) => {
    setGroups(groups.map(g => g.id === id ? { ...g, [field]: val } : g));
  };

  const updateGroupStats = (id, field, val) => {
    // Keep as string to avoid finicky decimal typing issues
    setGroups(groups.map(g => g.id === id ? { ...g, summary: { ...g.summary, [field]: val } } : g));
  };

  const parseRaw = (id, rawStr) => {
    // Forgiving parsing: split on any whitespace or commas, filter out non-numbers
    const tokens = rawStr.split(/[,\s\t\n]+/).filter(t => t.trim() !== "");
    const vals = tokens.map(v => parseFloat(v)).filter(v => !isNaN(v));
    const n = vals.length;

    // Update group even if n < 2, but calculate stats only if possible
    setGroups(groups.map(g => {
      if (g.id !== id) return g;
      const meanVal = n > 0 ? vals.reduce((a, b) => a + b, 0) / n : 0;
      const ss = n > 1 ? vals.reduce((a, b) => a + Math.pow(b - meanVal, 2), 0) : 0;
      return {
        ...g,
        values: vals,
        summary: {
          mean: n > 0 ? meanVal.toFixed(2) : "0",
          sd: n > 1 ? Math.sqrt(ss / (n - 1)).toFixed(2) : "0",
          n: n.toString()
        }
      };
    }));
  };

  return (
    <div className="w-full flex flex-col gap-8 animate-in fade-in duration-700 relative">
      {/* MODE SWITCH TOAST */}
      {modeToast && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-bottom-10 fade-in duration-500">
          <div className={`px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border-2 ${anovaMode === 'data' ? 'bg-indigo-600 border-indigo-400 text-white' : 'bg-amber-500 border-amber-300 text-white'}`}>
            <Activity size={18} />
            <span className="text-[11px] font-black uppercase tracking-widest">{modeToast}</span>
          </div>
        </div>
      )}
      {/* 1. TOP SECTION: THE VISUALIZER (Full Width & Enlarged) */}
      <div className={`w-full overflow-hidden border-2 rounded-3xl relative transition-all ${darkMode ? 'bg-slate-950/50 border-slate-800 shadow-2xl shadow-black/40' : 'bg-white border-slate-200 shadow-xl'}`}>
        {/* COMPACT TOOLBAR CLUSTER */}
        <div className="absolute top-4 left-4 flex gap-2 z-40">
          <button onClick={() => setActiveTab('fDist')} className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all ${activeTab === 'fDist' ? 'bg-indigo-600 text-white shadow-lg' : (darkMode ? 'bg-slate-900/90 text-slate-500 hover:text-slate-300' : 'bg-slate-100 text-slate-400 hover:bg-slate-200')}`}><Activity size={14} /> F-Dist</button>
          <button onClick={() => setActiveTab('means')} className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all ${activeTab === 'means' ? 'bg-indigo-600 text-white shadow-lg' : (darkMode ? 'bg-slate-900/90 text-slate-500 hover:text-slate-300' : 'bg-slate-100 text-slate-400 hover:bg-slate-200')}`}><LayoutGrid size={14} /> Means</button>
          <button onClick={() => setActiveTab('decomp')} className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all ${activeTab === 'decomp' ? 'bg-indigo-600 text-white shadow-lg' : (darkMode ? 'bg-slate-900/90 text-slate-500 hover:text-slate-300' : 'bg-slate-100 text-slate-400 hover:bg-slate-200')}`}><PieChart size={14} /> Decomp</button>
        </div>

        <div className="absolute top-4 right-4 flex items-center gap-3 z-40 pointer-events-none">
          <div className={`px-4 py-2 rounded-xl border-2 flex flex-col items-center justify-center min-w-[90px] shadow-lg animate-in zoom-in-95 duration-300 pointer-events-auto ${renderModel.p < renderModel.alpha ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-slate-500/5 border-slate-500/10'}`}>
            <span className={`text-[8px] font-black uppercase tracking-widest leading-none mb-1 ${renderModel.p < renderModel.alpha ? 'text-emerald-500' : 'text-slate-500'}`}>Signif. (p)</span>
            <span className={`text-xl font-black tabular-nums transition-colors ${renderModel.p < renderModel.alpha ? 'text-emerald-400' : 'text-slate-400'}`}>
              {renderModel.p < 0.001 ? '< .001' : renderModel.p.toFixed(4)}
            </span>
            <span className={`text-[6px] font-black uppercase tracking-tighter mt-0.5 ${renderModel.mode === 'data' ? 'text-blue-400/60' : 'text-amber-400/60'}`}>
              {renderModel.mode === 'data' ? 'From Dataset' : 'From Calculator'}
            </span>
          </div>
          {renderModel.p < renderModel.alpha && (
            <div className="px-3 py-3 rounded-xl bg-emerald-500 shadow-xl shadow-emerald-500/40 flex items-center justify-center animate-in slide-in-from-right-4 pointer-events-auto">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
          )}
        </div>

        {/* ENLARGED: Height increased to 600px for y-axis stretch */}
        <div className="w-full h-[600px] flex items-center justify-center overflow-hidden">
          {activeTab === 'fDist' && (
            <FSamplingDist
              mode={anovaMode}
              fCrit={renderModel.Fcrit}
              fVal={renderModel.F}
              df1={renderModel.df1}
              df2={renderModel.df2}
              setFVal={anovaMode === 'data' ? setManualF : setCalcF}
              darkMode={darkMode}
              zoomDist={zoomDist}
              setZoomDist={setZoomDist}
            />
          )}
          {activeTab === 'means' && (
            <div className="w-full h-full relative">
              {anovaMode === 'calc' && (
                <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px] z-10 flex items-center justify-center text-center p-8">
                  <div className="max-w-xs">
                    <LayoutGrid size={48} className="mx-auto text-slate-500 mb-4 opacity-30" />
                    <p className="text-sm font-black text-slate-400 uppercase tracking-widest leading-relaxed">Means view requires dataset computation.</p>
                    <button onClick={() => setAnovaMode('data')} className="mt-4 text-[10px] font-black text-indigo-400 border border-indigo-400/30 px-4 py-2 rounded-xl hover:bg-indigo-400/10 transition-colors">SWITCH TO DATA MODE</button>
                  </div>
                </div>
              )}
              <GroupsMeansView groups={groups} grandMean={renderModel.grandMean} darkMode={darkMode} showSpread={showSpread} />
            </div>
          )}
          {activeTab === 'decomp' && (
            <div className="w-full h-full relative">
              {anovaMode === 'calc' && (
                <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px] z-10 flex items-center justify-center text-center p-8">
                  <div className="max-w-xs">
                    <PieChart size={48} className="mx-auto text-slate-500 mb-4 opacity-30" />
                    <p className="text-sm font-black text-slate-400 uppercase tracking-widest leading-relaxed">Decomp is dataset-only.</p>
                  </div>
                </div>
              )}
              <VarianceDecomposition ssB={renderModel.ssB || 0} ssW={renderModel.ssW || 0} ssT={renderModel.ssT || 1} darkMode={darkMode} />
            </div>
          )}
        </div>
      </div>


      {/* 2. MIDDLE SECTION: DATASET EDITOR & MODE TOGGLE */}
      <div className="w-full flex flex-col gap-4">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center px-2 gap-4">
          <div className="flex items-center gap-6">
            <h6 className={`text-[11px] font-black uppercase tracking-[0.2em] p-1 flex items-center gap-2 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}><Sigma size={14} /> ANOVA {anovaMode === 'data' ? 'DATASET' : 'EXPLORE'}</h6>

            {/* MODE TOGGLE (Global) */}
            <div className={`flex p-1 rounded-2xl border transition-all ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-200 shadow-inner'}`}>
              <button
                onClick={() => toggleMode('data')}
                className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${anovaMode === 'data' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Data (Compute)
              </button>
              <button
                onClick={() => toggleMode('calc')}
                className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${anovaMode === 'calc' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Explore
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex bg-slate-800/50 p-1.5 rounded-xl border border-slate-700">
              <span className="text-[8px] font-black text-slate-500 uppercase px-2 py-1">ALPHA:</span>
              {[0.1, 0.05, 0.01].map(a => (
                <button key={a} onClick={() => setAlpha(a)} className={`px-3 py-1 rounded-lg text-[10px] font-black transition-all ${alpha === a ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'}`}>{a}</button>
              ))}
            </div>

            {anovaMode === 'data' && (
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setShowSpread(!showSpread)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${showSpread ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-500 hover:text-slate-300'}`}
                  title="Offsets overlapping points so the full distribution is visible"
                >
                  <Activity size={14} /> {showSpread ? 'Jitter ON' : 'Show Jitter'}
                </button>
                <button
                  onClick={addGroup}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black uppercase px-6 py-3 rounded-2xl transition-all shadow-xl shadow-indigo-600/20 active:scale-95 flex items-center gap-2"
                >
                  <Plus size={16} /> ADD GROUP
                </button>
              </div>
            )}
          </div>
        </div>

        {/* EXPLORE CONTROLS (Only in Explore mode) */}
        {anovaMode === 'calc' && (
          <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-6 px-4 py-8 bg-indigo-500/5 border-2 border-indigo-500/10 rounded-[2.5rem] animate-in slide-in-from-top-4 shadow-inner">
            <div className="flex flex-col gap-3 p-5 bg-slate-900/40 rounded-2xl border border-slate-800/80 shadow-lg">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Between-Groups (df₁)</span>
                <span className="text-[10px] font-black text-indigo-400 tabular-nums bg-indigo-400/10 px-2 py-0.5 rounded-md">{calcDf1}</span>
              </div>
              <input
                type="range" min="1" max="50"
                value={calcDf1}
                onChange={e => setCalcDf1(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full accent-indigo-500 cursor-pointer"
              />
            </div>

            <div className="flex flex-col gap-3 p-5 bg-slate-900/40 rounded-2xl border border-slate-800/80 shadow-lg">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Within-Groups (df₂)</span>
                <span className="text-[10px] font-black text-indigo-400 tabular-nums bg-indigo-400/10 px-2 py-0.5 rounded-md">{calcDf2}</span>
              </div>
              <input
                type="range" min="1" max="250"
                value={calcDf2}
                onChange={e => setCalcDf2(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full accent-indigo-500 cursor-pointer"
              />
            </div>

            <div className="flex flex-col gap-3 p-5 bg-slate-900/40 rounded-2xl border border-slate-800/80 shadow-lg">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[9px] font-black text-amber-500/60 uppercase tracking-widest">Test statistic F</span>
                <span className="text-[10px] font-black text-amber-400 tabular-nums bg-amber-400/10 px-2 py-0.5 rounded-md">{calcF.toFixed(2)}</span>
              </div>
              <input
                type="range" min="0" max="25" step="0.1"
                value={calcF}
                onChange={e => setCalcF(parseFloat(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>
          </div>
        )}

        {/* DATA MODE EDITOR */}
        {anovaMode === 'data' && (
          <div className="flex flex-wrap gap-4 justify-center lg:justify-start transition-opacity">
            {groups.map(g => {
              const n = g.inputMode === 'summary' ? (parseInt(g.summary?.n) || 0) : (g.values?.length || 0);
              const isValid = n >= 2;

              return (
                <div key={g.id} className={`min-w-[280px] flex-1 max-w-[360px] p-3 rounded-[1.2rem] border-2 transition-all relative group ${darkMode ? 'bg-slate-900 border-slate-800 shadow-xl' : 'bg-white border-slate-100 shadow-lg'}`}>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full shadow-[0_0_10px_rgba(0,0,0,0.5)]" style={{ backgroundColor: g.color }} />
                      <input
                        value={g.label}
                        onChange={e => updateGroup(g.id, 'label', e.target.value)}
                        className={`text-[12px] font-black uppercase tracking-widest bg-transparent border-none focus:outline-none w-32 ${darkMode ? 'text-white' : 'text-slate-800'}`}
                      />
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] font-bold uppercase tabular-nums tracking-tight px-2 py-0.5 rounded-md ${isValid ? (darkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500') : 'bg-rose-500/10 text-rose-500'}`}>
                          {isValid ? (
                            <span className="flex items-center gap-2">
                              <span>N={n}</span>
                              <span className="opacity-30">|</span>
                              <span>M={parseFloat(g.summary.mean).toFixed(2)}</span>
                              <span className="opacity-30">|</span>
                              <span>SD={parseFloat(g.summary.sd).toFixed(2)}</span>
                            </span>
                          ) : (
                            <span>{n} Obs (Needs ≥2)</span>
                          )}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => updateGroup(g.id, 'collapsed', !g.collapsed)}
                        className="text-slate-500 hover:text-indigo-500 transition-colors bg-slate-800/10 p-1.5 rounded-lg"
                      >
                        {g.collapsed ? <Maximize2 size={12} /> : <Minimize2 size={12} />}
                      </button>
                      {groups.length > 2 && (
                        <button onClick={() => removeGroup(g.id)} className="text-slate-500 hover:text-rose-500 transition-colors bg-slate-800/10 p-1.5 rounded-lg">
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  </div>

                  {!g.collapsed && (
                    <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                      <div className="flex gap-2 my-4 p-1 bg-slate-800/20 rounded-xl w-fit">
                        <button
                          onClick={() => updateGroup(g.id, 'inputMode', 'raw')}
                          className={`text-[9px] font-black uppercase tracking-widest px-4 py-2 rounded-lg transition-all ${g.inputMode === 'raw' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                          Raw Data
                        </button>
                        <button
                          onClick={() => updateGroup(g.id, 'inputMode', 'summary')}
                          className={`text-[9px] font-black uppercase tracking-widest px-4 py-2 rounded-lg transition-all ${g.inputMode === 'summary' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                          Summary Stats
                        </button>
                      </div>

                      {g.inputMode === 'summary' ? (
                        <div className="flex flex-col gap-2 px-1">
                          {['mean', 'sd', 'n'].map(field => (
                            <div key={field} className={`group flex flex-col gap-0.5 p-2 rounded-xl border-2 transition-all ${darkMode ? 'bg-slate-900 border-slate-800 focus-within:border-indigo-500' : 'bg-white border-slate-100 focus-within:border-indigo-600'}`}>
                              <label className={`text-[7px] font-black uppercase tracking-[0.2em] ml-1 ${darkMode ? 'text-slate-500 group-focus-within:text-indigo-400' : 'text-slate-400 group-focus-within:text-indigo-600'}`}>{field}</label>
                              <input
                                type="text"
                                value={g.summary[field]}
                                onFocus={(e) => e.target.select()}
                                onChange={e => updateGroupStats(g.id, field, e.target.value)}
                                className={`w-full bg-transparent text-[16px] font-black outline-none px-1 ${darkMode ? 'text-indigo-300' : 'text-indigo-600'}`}
                                placeholder="0.00"
                              />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="relative mt-4">
                          <textarea
                            placeholder="Enter numbers (5, 8, 12...)"
                            value={g.values?.join(', ')}
                            onChange={e => parseRaw(g.id, e.target.value)}
                            className={`w-full h-24 p-3 rounded-xl text-[11px] font-mono border-2 transition-all outline-none resize-none ${darkMode ? 'bg-slate-950 border-slate-800 text-indigo-400 focus:border-indigo-500 custom-scrollbar' : 'bg-slate-50 border-slate-200 text-indigo-700 focus:border-indigo-600'}`}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="w-full grid grid-cols-1 gap-8 pb-12">
        {/* Full Width Omnibus Summary */}
        <div className={`p-10 rounded-[2.5rem] border-2 transition-all flex flex-col md:flex-row items-center justify-between gap-12 overflow-hidden ${darkMode ? 'bg-slate-900 border-slate-800 shadow-2xl shadow-black/40' : 'bg-white border-slate-100 shadow-xl'}`}>
          <div className="flex flex-col items-center md:items-start text-center md:text-left shrink-0 max-w-full">
            <h6 className={`text-[12px] font-black uppercase tracking-[0.3em] mb-6 flex items-center gap-3 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}><Layers size={18} /> ANOVA {anovaMode === 'data' ? 'Observed Results' : 'Explore Output'}</h6>
            <div className={`text-5xl md:text-7xl font-black text-indigo-500 uppercase tracking-tighter mb-4 flex flex-wrap items-baseline gap-2 justify-center md:justify-start`}>
              <MathTerm term="F" showValue={false} darkMode={darkMode} onInfo={() => { }} />
              <span className="text-3xl md:text-4xl">
                (<MathTerm term="df_between" value={renderModel.df1.toString()} showValue={true} darkMode={darkMode} onInfo={() => { }} />,
                <MathTerm term="df_within" value={renderModel.df2.toString()} showValue={true} darkMode={darkMode} onInfo={() => { }} />)
              </span>
              <span className="mx-1 md:mx-2">=</span>
              <span className="truncate">{renderModel.F?.toFixed(2)}</span>
            </div>
            <div className={`text-[16px] font-black uppercase tracking-[0.2em] flex flex-wrap items-center justify-center md:justify-start gap-3 ${renderModel.F > renderModel.Fcrit ? 'text-emerald-400' : 'text-slate-500'}`}>
              {renderModel.F > renderModel.Fcrit ? <CheckCircle size={24} /> : <AlertCircle size={24} />}
              <span>p {renderModel.p < 0.001 ? '< .001' : (renderModel.p < 0.05 ? '< .05' : '> .05')}</span>
              <span className="opacity-50 tracking-widest">{renderModel.p < 0.05 ? '(Significant)' : '(Non-Sig)'}</span>
            </div>
            {anovaMode === 'calc' && <p className="text-[10px] font-black text-amber-500/60 uppercase tracking-widest mt-4">Exploring hypothetical inputs</p>}
          </div>

          <div className={`hidden md:block w-px h-32 ${darkMode ? 'bg-slate-800' : 'bg-slate-100'}`} />

          {
            anovaMode === 'data' ? (
              <div className="flex flex-col gap-6 flex-1 max-w-sm animate-in fade-in">
                <div className="flex justify-between items-center text-[12px] font-black uppercase tracking-widest">
                  <span className={darkMode ? 'text-slate-500' : 'text-slate-400'}>
                    <MathTerm term="F" showValue={false} darkMode={darkMode} onInfo={() => { }} /> Critical Value
                  </span>
                  <span className="text-indigo-400 text-lg">{renderModel.Fcrit?.toFixed?.(2) || '0.00'}</span>
                </div>
                <div className="flex justify-between items-center text-[12px] font-black uppercase tracking-widest">
                  <span className={darkMode ? 'text-slate-500' : 'text-slate-400'}>
                    Effect Size (<MathTerm term="eta2" showValue={false} darkMode={darkMode} onInfo={() => { }} />)
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-emerald-400 text-lg">
                      <MathTerm term="eta2" value={renderModel.eta2} showValue={showValues} darkMode={darkMode} onInfo={() => { }} />
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-4 flex-1 min-w-[200px] max-w-sm animate-in slide-in-from-left-4">
                <div className={`p-4 rounded-2xl border-2 border-dashed ${darkMode ? 'border-slate-800 bg-slate-950/30' : 'border-slate-200 bg-slate-50'} text-center`}>
                  <p className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Explore Result</p>
                  <div className="flex justify-around mt-4 flex-wrap gap-2">
                    <div className="flex flex-col">
                      <span className="text-[8px] font-black text-slate-600">F-CRIT</span>
                      <span className="font-black text-indigo-400">{renderModel.Fcrit?.toFixed(3)}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[8px] font-black text-slate-600">P-VALUE</span>
                      <span className={`font-black ${renderModel.p < renderModel.alpha ? 'text-emerald-400' : 'text-rose-400'}`}>{renderModel.p?.toFixed(4)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )
          }

          <button
            onClick={() => {
              const line = `One-way ANOVA revealed a ${renderModel.p < renderModel.alpha ? 'significant' : 'non-significant'} effect${renderModel.mode === 'data' ? ' of group' : ''}, F(${renderModel.df1}, ${renderModel.df2}) = ${renderModel.F.toFixed(2)}, p ${renderModel.p < 0.05 ? '< .05' : '> .05'}${renderModel.mode === 'data' ? `, η² = ${renderModel.eta2?.toFixed(3)}` : ''}.`;
              navigator.clipboard.writeText(line);
              const btn = document.activeElement;
              if (btn) {
                const oldText = btn.innerHTML;
                btn.innerHTML = "✓ COPIED APA RESULT!";
                setTimeout(() => { btn.innerHTML = oldText; }, 2000);
              }
            }}
            className="w-full md:w-auto px-12 py-6 bg-indigo-600 hover:bg-indigo-500 text-white text-[12px] font-black uppercase tracking-[0.3em] rounded-3xl transition-all shadow-2xl shadow-indigo-600/30 active:scale-95 flex items-center justify-center gap-4 group"
          >
            <FileText size={20} className="group-hover:scale-110 transition-transform" /> COPY TO CLIPBOARD
          </button>
        </div>

        {/* Full Width Post-Hoc section */}
        {/* Full Width Post-Hoc section */}
        {
          anovaMode === 'data' ? (
            <div className={`p-10 rounded-[2.5rem] border-2 transition-colors ${darkMode ? 'bg-slate-900 border-slate-800 shadow-2xl shadow-black/40' : 'bg-white border-slate-100 shadow-xl'}`}>
              <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6">
                <div className="text-center md:text-left">
                  <h6 className={`text-[12px] font-black uppercase tracking-[0.3em] flex items-center justify-center md:justify-start gap-3 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}><Sparkles size={18} /> Pairwise Post-Hoc Comparisons</h6>
                  <p className={`text-[10px] font-medium mt-2 ${darkMode ? 'text-slate-600' : 'text-slate-500'}`}>Tukey's HSD ($p$-adj) for identifying specific group differences</p>
                </div>
                <button onClick={() => setShowPostHoc(!showPostHoc)} className={`text-[10px] font-black uppercase tracking-widest px-8 py-4 rounded-2xl transition-all ${showPostHoc ? 'bg-rose-500/20 text-rose-400 border border-rose-500/20 shadow-[0_0_20px_rgba(244,63,94,0.15)]' : 'bg-indigo-600 text-white shadow-2xl shadow-indigo-600/30'}`}>
                  {showPostHoc ? 'Close Analysis' : 'Run Pairwise Tests'}
                </button>
              </div>

              <div className="w-full mt-10">
                {showPostHoc && renderModel.F > renderModel.Fcrit ? (
                  <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
                    {postHoc.map((ph, i) => (
                      <div key={i} className={`group relative overflow-hidden flex flex-row items-center justify-between gap-6 px-6 py-3 rounded-2xl border-2 transition-all duration-500 ${ph.sig
                        ? 'bg-emerald-500/5 border-emerald-500/30'
                        : 'bg-slate-500/5 border-slate-500/20'}`}>

                        <div className="flex items-center gap-4 shrink-0 min-w-[150px]">
                          <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <div className={`w-2 h-2 rounded-full ${ph.sig ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]' : 'bg-slate-700'}`} />
                              <span className={`text-[11px] font-black uppercase tracking-tight ${ph.sig ? 'text-emerald-400' : 'text-slate-500'}`}>{ph.pair[0]}</span>
                              <span className="text-[8px] font-bold text-slate-600">(M={ph.m1.toFixed(1)}, SD={ph.sd1.toFixed(1)})</span>
                            </div>
                            <div className="text-[8px] font-black text-slate-700 uppercase tracking-tighter mx-auto italic opacity-50">vs</div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <div className={`w-2 h-2 rounded-full ${ph.sig ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]' : 'bg-slate-700'}`} />
                              <span className={`text-[11px] font-black uppercase tracking-tight ${ph.sig ? 'text-emerald-400' : 'text-slate-500'}`}>{ph.pair[1]}</span>
                              <span className="text-[8px] font-bold text-slate-600">(M={ph.m2.toFixed(1)}, SD={ph.sd2.toFixed(1)})</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex-1 flex flex-col items-center">
                          <span className={`text-[8px] uppercase font-black tracking-[0.15em] mb-0 ${darkMode ? 'text-slate-600' : 'text-slate-400'}`}>Mean Diff</span>
                          <div className="flex items-baseline gap-1">
                            <span className={`text-xl font-black italic tracking-tighter ${ph?.sig ? 'text-white' : 'text-slate-600'}`}>Δ</span>
                            <span className={`text-2xl font-black ${ph?.sig ? 'text-white' : 'text-slate-600'}`}>{ph?.diff?.toFixed?.(2) || '0.00'}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 min-w-[160px] justify-end">
                          <div className="flex flex-col items-end mr-3">
                            <span className={`text-[8px] font-black uppercase tracking-widest ${ph.sig ? 'text-emerald-400' : 'text-slate-600'}`}>p-adj</span>
                            <span className={`text-[10px] font-black tabular-nums ${ph.sig ? 'text-emerald-400' : 'text-slate-500'}`}>{ph.pAdj < 0.001 ? '< .001' : ph.pAdj.toFixed(3)}</span>
                          </div>
                          <div className={`flex items-center gap-2 px-5 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-transform duration-300 ${ph.sig
                            ? 'bg-emerald-500 text-white shadow-[0_4px_12px_rgba(16,185,129,0.3)]'
                            : 'bg-slate-900 text-slate-600'}`}>
                            {ph.sig ? (
                              <>
                                <Activity size={10} />
                                <span>Significant</span>
                              </>
                            ) : (
                              <span>Non-Sig</span>
                            )}
                          </div>
                          {ph.sig && <Sparkles size={14} className="text-emerald-300 animate-pulse" />}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : renderModel.F <= renderModel.Fcrit && showPostHoc ? (
                  <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed rounded-[3rem] border-rose-500/20 bg-rose-500/5 animate-in zoom-in-95 duration-500">
                    <AlertCircle size={48} className="text-rose-500 mb-6 group-hover:scale-110 transition-transform" />
                    <p className="text-[14px] text-rose-500 uppercase font-black tracking-[0.4em]">Omnibus Non-Significant</p>
                    <p className="text-[11px] text-slate-500 mt-4 text-center px-12 max-w-lg leading-relaxed font-medium italic">Pairwise tests are typically only performed when the overall ANOVA is significant (p {'<'} .05). Exploring differences here would increase Type I Error risk.</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed rounded-[3rem] border-slate-800 bg-slate-900/10 group cursor-pointer" onClick={() => setShowPostHoc(true)}>
                    <Sparkles size={48} className="text-slate-700 mb-6 group-hover:scale-110 group-hover:text-indigo-500 transition-all duration-500" />
                    <p className="text-[14px] text-slate-500 uppercase font-black tracking-[0.4em] group-hover:text-slate-300">Ready for Post-Hoc Analysis</p>
                    <p className="text-[11px] text-slate-600 mt-4 text-center px-12 max-w-lg leading-relaxed font-medium">Click to reveal specific pairwise differences and identify which groups are driving your results.</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className={`p-10 rounded-[2.5rem] border-2 border-dashed flex flex-col items-center justify-center text-center opacity-40 ${darkMode ? 'bg-slate-900/10 border-slate-800 text-slate-500' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
              <Sparkles size={32} className="mb-4 opacity-20" />
              <p className="text-xs font-black uppercase tracking-widest">Post-hoc Analysis is disabled in Explore Mode.</p>
              <p className="text-[9px] mt-2 opacity-60">Pairwise comparisons require observed dataset statistics.</p>
            </div>
          )
        }
      </div>
      {/* T-Test Equivalence Badge */}
      {
        anovaStats?.k === 2 && (
          <div className="bg-amber-500/10 border border-amber-500/20 px-8 py-4 rounded-3xl flex items-center gap-4 animate-in slide-in-from-bottom-2 duration-500">
            <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center text-white font-black text-sm shadow-lg shadow-amber-500/30">!</div>
            <div>
              <h6 className="text-[11px] font-black text-amber-500 uppercase tracking-widest leading-none">The T-Test Equivalence</h6>
              <p className="text-[10px] text-amber-600/80 font-medium mt-1.5">With exactly 2 groups, ANOVA is identical to a t-test. F = t² ({anovaStats?.fVal?.toFixed?.(2) || '0.00'} = {Math.sqrt(anovaStats?.fVal || 0)?.toFixed?.(2) || '0.00'}²).</p>
            </div>
          </div>
        )
      }
    </div>
  );
};

// --- ANOVA SUB-COMPONENTS ---


export default AnovaVisual;
