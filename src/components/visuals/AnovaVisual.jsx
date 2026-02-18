import React, { useState, useEffect, useMemo, useRef } from 'react';
import { AlertCircle, Sparkles, Calculator, MousePointer2, Info, ArrowDown, MousePointerClick, Maximize2, Minimize2, RefreshCw, Play, Activity, Lightbulb, BrainCircuit, BarChart2, Sigma, BookOpen, Plus, X, Trash2, Edit2, TrendingUp, Grid, FileText, PieChart, CheckCircle, Layers, LayoutGrid, RotateCcw } from 'lucide-react';
import { getGaussianPoints, getTPoints, normalCDF, tCDF, erf, getTCrit, getFDensity, fCDF, fPPF, getFCrit, getFPoints, calculateAnova, calculatePostHoc, lnGamma, beta } from '../../utils/mathHelpers';
import { pointsToPath, pointsToLine, getOrdinal } from '../../utils/svgHelpers';
import AnovaDatasetEditor from './AnovaDatasetEditor';
import AnovaResults from './AnovaResults';
import CalculationText from '../common/CalculationText';
import TabButton from '../common/TabButton';
import MathTerm from '../common/MathTerm';
import FSamplingDist from './FSamplingDist';
import GroupsMeansView from './GroupsMeansView';
import VarianceDecomposition from './VarianceDecomposition';
const AnovaVisual = ({ highlight = null, darkMode, showValues: propShowValues, onTutorUpdate, onStatsUpdate, tutor }) => {
  const [localShowValues, setLocalShowValues] = useState(propShowValues);
  useEffect(() => { setLocalShowValues(propShowValues); }, [propShowValues]);

  const showValues = localShowValues;
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

  // --- Navigation & Scroll Logic ---

  useEffect(() => {
    const handleAction = (e) => {
      if (e.detail) handleTutorAction(e.detail);
    };
    window.addEventListener('anovaTutorAction', handleAction);
    return () => window.removeEventListener('anovaTutorAction', handleAction);
  }, [groups, localShowValues]); // dependencies for handlers used inside handleTutorAction

  const handleTutorAction = (action) => {
    if (!action) return;
    switch (action) {
      case 'toggle_show_values':
        setLocalShowValues(!localShowValues);
        break;
      case 'add_group':
        addGroup();
        break;
      case 'set_ssw_mode_raw':
        setGroups(groups.map(g => ({ ...g, inputMode: 'raw' })));
        break;
      case 'set_ssw_mode_summary':
        setGroups(groups.map(g => ({ ...g, inputMode: 'summary' })));
        break;
      case 'highlight_ssb':
        onTutorUpdate({ id: 'highlight', target: 'ss_between' });
        break;
      case 'highlight_ssb_parts':
        onTutorUpdate({ id: 'highlight', target: 'ssb_contributions' });
        break;
      case 'highlight_ssw_parts':
        onTutorUpdate({ id: 'highlight', target: 'ssw_contributions' });
        break;
      case 'highlight_grand_mean':
        onTutorUpdate({ id: 'highlight', target: 'x_grand' });
        break;
      case 'focus_group_1':
        setGroups(groups.map((g, i) => i === 0 ? { ...g, collapsed: false } : { ...g, collapsed: true }));
        break;
      case 'collapse_all_but_active':
        setGroups(groups.map(g => ({ ...g, collapsed: true })));
        break;
      default: console.log("Tutor Action:", action);
    }
  };

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
    <div
      className="w-full flex flex-col gap-8 animate-in fade-in duration-700 relative"
      onMouseMove={() => tutor.resetIdle()}
      onKeyDown={() => tutor.resetIdle()}
    >
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
          <AnovaDatasetEditor
            groups={groups}
            updateGroup={updateGroup}
            updateGroupStats={updateGroupStats}
            parseRaw={parseRaw}
            removeGroup={removeGroup}
            darkMode={darkMode}
          />
        )}
      </div>

      <AnovaResults
        renderModel={renderModel}
        anovaStats={anovaStats}
        anovaMode={anovaMode}
        showPostHoc={showPostHoc}
        setShowPostHoc={setShowPostHoc}
        postHoc={postHoc}
        showValues={showValues}
        darkMode={darkMode}
      />
    </div>
  );
};

// --- ANOVA SUB-COMPONENTS ---


export default AnovaVisual;
