import React, { useState } from 'react';
import { AlertCircle, CheckCircle, ChevronUp, ChevronDown, Info } from 'lucide-react';
import SkewedDistributionVisual from '../visuals/SkewedDistributionVisual';
const AssumptionItem = ({ assumption, darkMode }) => {
  const [expanded, setExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState('what'); // 'what', 'how', 'fail'
  const [visType, setVisType] = useState('normal');

  return (
    <div className={`border rounded-2xl transition-all duration-300 overflow-hidden ${expanded ? (darkMode ? 'bg-slate-900 border-indigo-500/50 shadow-2xl shadow-indigo-500/10' : 'bg-white border-indigo-200 shadow-xl') : (darkMode ? 'bg-slate-900/40 border-slate-800 hover:border-slate-700' : 'bg-white border-slate-100 hover:border-slate-300')}`}>
      <div className="flex items-center justify-between p-4 cursor-pointer select-none" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center gap-4">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${expanded ? 'bg-indigo-600 text-white' : (darkMode ? 'bg-slate-800 text-slate-500' : 'bg-slate-100 text-slate-400')}`}>
            <CheckCircle className="w-4 h-4" />
          </div>
          <div>
            <span className={`text-base font-black tracking-tight transition-colors ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>{assumption.label}</span>
            {expanded && <div className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mt-0.5">Statistical Requirement</div>}
          </div>
        </div>
        <div className={`p-2 rounded-lg transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`}>
          <ChevronDown className={`w-5 h-5 ${darkMode ? 'text-slate-600' : 'text-slate-400'}`} />
        </div>
      </div>

      {expanded && (
        <div className={`p-5 pt-0 animate-in fade-in slide-in-from-top-2 duration-300`}>
          <div className={`flex border-b mb-6 ${darkMode ? 'border-slate-800' : 'border-slate-100'}`}>
            {[
              { id: 'what', label: 'What is it?', icon: Info },
              { id: 'how', label: 'How to check?', icon: Search },
              { id: 'fail', label: 'If it fails...', icon: AlertCircle }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all ${activeTab === tab.id ? 'border-indigo-500 text-indigo-500 bg-indigo-500/5' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
              >
                <tab.icon size={12} /> {tab.label}
              </button>
            ))}
          </div>

          <div className="space-y-6">
            {activeTab === 'what' && (
              <div className="animate-in fade-in duration-300">
                <p className={`text-sm leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>{assumption.whatItMeans}</p>
                {assumption.id === 'normality' && (
                  <div className="mt-6 space-y-4">
                    <div className="flex gap-2">
                      {['normal', 'positive', 'negative', 'bimodal', 'outliers'].map(t => (
                        <button
                          key={t}
                          onClick={() => setVisType(t)}
                          className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${visType === t ? 'bg-indigo-600 text-white shadow-lg' : (darkMode ? 'bg-slate-800 text-slate-500 hover:text-slate-300' : 'bg-slate-100 text-slate-500 hover:bg-slate-200')}`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                    <SkewedDistributionVisual type={visType} darkMode={darkMode} />
                  </div>
                )}
              </div>
            )}

            {activeTab === 'how' && (
              <div className="animate-in fade-in duration-300 space-y-4">
                <div className={`grid gap-3`}>
                  {assumption.howToTest?.map((test, idx) => (
                    <div key={idx} className={`p-4 rounded-xl border flex items-start gap-4 ${darkMode ? 'bg-slate-950/50 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                      <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0">
                        <Terminal size={14} />
                      </div>
                      <div>
                        <h6 className={`text-xs font-black uppercase mb-1 ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>{test.name}</h6>
                        <p className={`text-[11px] leading-relaxed ${darkMode ? 'text-slate-500' : 'text-slate-600'}`}>{test.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'fail' && (
              <div className="animate-in fade-in duration-300">
                <div className={`p-5 rounded-2xl border-l-4 ${darkMode ? 'bg-amber-500/10 border-amber-600 text-amber-200 shadow-xl shadow-amber-900/10' : 'bg-amber-50 border-amber-500 text-amber-900 shadow-lg shadow-amber-600/5'}`}>
                  <div className="flex items-center gap-3 mb-3">
                    <AlertCircle className="w-5 h-5 text-amber-500" />
                    <h6 className="text-xs font-black uppercase tracking-widest">Recommended Corrective Action</h6>
                  </div>
                  <p className="text-sm leading-relaxed font-medium">{assumption.ifItFails}</p>
                  {assumption.nonParametric && (
                    <div className={`mt-4 pt-4 border-t ${darkMode ? 'border-amber-500/20' : 'border-amber-200'}`}>
                      <span className="text-[10px] font-black uppercase tracking-widest block mb-2 opacity-60">Alternative Test</span>
                      <div className={`flex items-center justify-between p-3 rounded-xl ${darkMode ? 'bg-slate-950/50' : 'bg-white/50'}`}>
                        <span className="text-xs font-bold">{assumption.nonParametric}</span>
                        <RotateCcw size={14} className="opacity-50" />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// --- NAVIGATION COMPONENTS ---


export default AssumptionItem;
