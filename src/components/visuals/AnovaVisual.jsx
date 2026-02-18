import React, { useState, useEffect, useMemo } from 'react';
import { Activity, LayoutGrid, PieChart, Plus, Sigma, X } from 'lucide-react';
import { fCDF, fPPF, calculateAnova, calculatePostHoc } from '../../utils/mathHelpers';
import AnovaDatasetEditor from './AnovaDatasetEditor';
import AnovaResults from './AnovaResults';
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
  const [highlightTarget, setHighlightTarget] = useState(null);

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

  // --- Reactive Signals for Tutor ---
  useEffect(() => {
    if (activeTab) {
      window.dispatchEvent(new CustomEvent('anovaTutorAction', {
        detail: { signal: `change_tab_${activeTab.toLowerCase()}` }
      }));
    }
  }, [activeTab]);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('anovaTutorAction', {
      detail: { signal: 'change_alpha', val: alpha }
    }));
  }, [alpha]);

  useEffect(() => {
    if (anovaMode === 'calc') {
      window.dispatchEvent(new CustomEvent('anovaTutorAction', {
        detail: { signal: 'change_df1', val: calcDf1 }
      }));
    }
  }, [calcDf1, anovaMode]);

  useEffect(() => {
    if (anovaMode === 'calc') {
      window.dispatchEvent(new CustomEvent('anovaTutorAction', {
        detail: { signal: 'change_df2', val: calcDf2 }
      }));
    }
  }, [calcDf2, anovaMode]);

  useEffect(() => {
    if (anovaMode === 'calc') {
      window.dispatchEvent(new CustomEvent('anovaTutorAction', {
        detail: { signal: 'change_f_calc', val: calcF }
      }));
    }
  }, [calcF, anovaMode]);

  useEffect(() => {
    if (showPostHoc) {
      window.dispatchEvent(new CustomEvent('anovaTutorAction', {
        detail: { signal: 'run_post_hoc' }
      }));
    }
  }, [showPostHoc]);

  // --- Navigation & Action Handlers ---
  useEffect(() => {
    const handleAction = (e) => {
      const detail = e.detail;
      if (!detail) return;

      // Tutor actions can be strings
      if (typeof detail === 'string') {
        handleTutorAction(detail);
      }
    };
    window.addEventListener('anovaTutorAction', handleAction);
    return () => window.removeEventListener('anovaTutorAction', handleAction);
  }, [groups, localShowValues]);

  const handleTutorAction = (action) => {
    switch (action) {
      case 'toggle_show_values':
        setLocalShowValues(!localShowValues);
        break;
      case 'add_group':
        addGroup();
        break;
      case 'highlight_ssb':
        onTutorUpdate({
          id: 'highlight_ssb',
          body: "Focusing on between-group distances.",
          content: {
            now: "Highlighting SS_between",
            whatChanged: "The distances from each group mean to the grand mean are emphasized.",
            tryNext: "Try moving a group mean to see the distances grow."
          }
        });
        break;
      case 'highlight_f_drivers':
        setHighlightTarget('f_ratio');
        onTutorUpdate({
          id: 'highlight_f_drivers',
          body: "Highlighting the F-ratio and its components.",
          content: {
            now: "Showing F-ratio drivers",
            whatChanged: "The F-ratio box is highlighted above.",
            tryNext: "Adjust the data to see how the ratio responds."
          }
        });
        setTimeout(() => setHighlightTarget(null), 3000);
        break;
      default: console.log("Tutor Action:", action);
    }
  };

  const addGroup = () => {
    const newId = groups.length > 0 ? Math.max(...groups.map(g => g.id)) + 1 : 1;
    const labels = ['A', 'B', 'C', 'D', 'E', 'F'];
    const colors = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'];
    if (groups.length >= colors.length) return;

    const newGroup = {
      id: newId,
      label: `Group ${labels[groups.length]}`,
      color: colors[groups.length],
      inputMode: groups[0]?.inputMode || 'raw',
      values: [5, 6, 7],
      summary: { mean: "6.0", sd: "1.0", n: "3" },
      collapsed: false
    };
    setGroups([...groups, newGroup]);
    window.dispatchEvent(new CustomEvent('anovaTutorAction', { detail: { signal: 'add_group' } }));
  };

  const removeGroup = (id) => {
    if (groups.length <= 2) return;
    setGroups(groups.filter(g => g.id !== id));
    window.dispatchEvent(new CustomEvent('anovaTutorAction', { detail: { signal: 'remove_group' } }));
  };

  const updateGroup = (id, field, val) => {
    setGroups(groups.map(g => g.id === id ? { ...g, [field]: val } : g));
  };

  const updateGroupStats = (id, field, val) => {
    setGroups(groups.map(g => g.id === id ? { ...g, summary: { ...g.summary, [field]: val } } : g));
    if (val === "" || isNaN(parseFloat(val))) {
      window.dispatchEvent(new CustomEvent('anovaTutorAction', { detail: 'data_error_summary' }));
    } else {
      window.dispatchEvent(new CustomEvent('anovaTutorAction', { detail: { signal: 'change_stats', field, value: val } }));
    }
  };

  const parseRaw = (id, rawStr) => {
    const tokens = rawStr.split(/[,\s\t\n]+/).filter(t => t.trim() !== "");
    const rawVals = tokens.map(v => parseFloat(v));
    const vals = rawVals.filter(v => !isNaN(v));
    const n = vals.length;

    if (rawVals.some(v => isNaN(v))) {
      window.dispatchEvent(new CustomEvent('anovaTutorAction', { detail: 'data_error_missing' }));
    }

    if (n > 0) {
      window.dispatchEvent(new CustomEvent('anovaTutorAction', { detail: { signal: 'change_raw', count: n } }));
    }

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
      onMouseMove={() => tutor?.resetIdle?.()}
    >
      {/* Visualizer Frame */}
      <div className={`w-full h-[600px] overflow-hidden border-2 rounded-3xl relative transition-all ${darkMode ? 'bg-slate-950/50 border-slate-800' : 'bg-white border-slate-200'}`}>
        <div className="absolute top-4 left-4 flex gap-2 z-40">
          {['fDist', 'means', 'decomp'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all ${activeTab === tab ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-900/90 text-slate-500 hover:text-slate-300'}`}>
              {tab === 'fDist' ? 'F-Dist' : tab === 'means' ? 'Means' : 'Decomp'}
            </button>
          ))}
        </div>

        <div className="w-full h-full">
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
          {activeTab === 'means' && <GroupsMeansView groups={groups} grandMean={renderModel.grandMean} darkMode={darkMode} showSpread={showSpread} />}
          {activeTab === 'decomp' && <VarianceDecomposition ssB={renderModel.ssB || 0} ssW={renderModel.ssW || 0} ssT={renderModel.ssT || 1} darkMode={darkMode} />}
        </div>
      </div>

      {/* Mode Controls */}
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center px-2">
          <div className="flex items-center gap-6">
            <h6 className="text-[11px] font-black uppercase text-slate-500 tracking-widest flex items-center gap-2"><Sigma size={14} /> ANOVA {anovaMode.toUpperCase()}</h6>
            <div className="flex p-1 rounded-2xl bg-slate-900 border border-slate-800">
              {['data', 'calc'].map(m => (
                <button key={m} onClick={() => toggleMode(m)} className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${anovaMode === m ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}>
                  {m === 'data' ? 'Compute' : 'Explore'}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex bg-slate-800/50 p-1.5 rounded-xl border border-slate-700">
              {[0.1, 0.05, 0.01].map(a => (
                <button key={a} onClick={() => setAlpha(a)} className={`px-3 py-1 rounded-lg text-[10px] font-black transition-all ${alpha === a ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500'}`}>{a}</button>
              ))}
            </div>
            {anovaMode === 'data' && (
              <button onClick={addGroup} className="bg-indigo-600 text-white text-[10px] font-black uppercase px-6 py-3 rounded-2xl flex items-center gap-2">
                <Plus size={16} /> ADD GROUP
              </button>
            )}
          </div>
        </div>

        {/* Explore Sliders */}
        {anovaMode === 'calc' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-8 bg-indigo-500/5 border-2 border-indigo-500/10 rounded-[2.5rem]">
            {[
              { label: 'df1', val: calcDf1, min: 1, max: 50, setter: setCalcDf1 },
              { label: 'df2', val: calcDf2, min: 1, max: 250, setter: setCalcDf2 },
              { label: 'F', val: calcF, min: 0, max: 25, step: 0.1, setter: setCalcF }
            ].map(s => (
              <div key={s.label} className="p-5 bg-slate-900/40 rounded-2xl border border-slate-800">
                <div className="flex justify-between text-[9px] font-black text-slate-500 uppercase mb-2">
                  <span>{s.label}</span>
                  <span className="text-indigo-400">{s.val}</span>
                </div>
                <input type="range" min={s.min} max={s.max} step={s.step} value={s.val} onChange={e => s.setter(parseFloat(e.target.value))} className="w-full accent-indigo-500" />
              </div>
            ))}
          </div>
        )}

        {/* Editor */}
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

export default AnovaVisual;
