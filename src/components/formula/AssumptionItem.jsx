import React, { useState } from 'react';
import { AlertCircle, CheckCircle, ChevronUp, ChevronDown, Info, RotateCcw, Search, Terminal, X } from 'lucide-react';
import SkewedDistributionVisual from '../visuals/SkewedDistributionVisual';
import QQPlotVisual from '../visuals/QQPlotVisual';
const AssumptionItem = ({ assumption, darkMode }) => {
  const [expanded, setExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState('what'); // 'what', 'how', 'fail'
  const [visType, setVisType] = useState('normal');
  const [showExamplesModal, setShowExamplesModal] = useState(false);

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
                {assumption.link && (
                  <div className={`mt-4 p-3 rounded-lg border-l-2 text-[11px] italic transition-colors ${darkMode ? 'bg-indigo-500/5 border-indigo-500/30 text-indigo-400' : 'bg-indigo-50 border-indigo-200 text-indigo-700'}`}>
                    {assumption.link}
                  </div>
                )}
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
                    <div key={idx} className={`p-4 rounded-xl border flex flex-col gap-3 ${darkMode ? 'bg-slate-950/50 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                      <div className="flex items-start gap-4">
                        <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0">
                          <Terminal size={14} />
                        </div>
                        <div className="flex-1">
                          <h6 className={`text-xs font-black uppercase mb-1 ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>{test.name}</h6>
                          <p className={`text-[11px] leading-relaxed ${darkMode ? 'text-slate-500' : 'text-slate-600'}`}>{test.desc}</p>
                        </div>
                      </div>
                      {test.examples && (
                        <button
                          onClick={() => setShowExamplesModal(true)}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all w-fit ${darkMode ? 'bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/30' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md hover:shadow-lg'}`}
                        >
                          <Info size={12} /> Show Examples
                        </button>
                      )}
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

      {showExamplesModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className={`w-full max-w-2xl rounded-3xl border shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
            <div className={`flex items-center justify-between p-6 border-b ${darkMode ? 'border-slate-800' : 'border-slate-100'}`}>
              <div>
                <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>Q–Q Plot Examples</h3>
                <p className={`text-xs font-medium ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Normality of Residuals Distribution</p>
              </div>
              <button onClick={() => setShowExamplesModal(false)} className={`p-2 rounded-xl transition-colors ${darkMode ? 'hover:bg-slate-800 text-slate-500 hover:text-white' : 'hover:bg-slate-100 text-slate-400 hover:text-slate-800'}`}>
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <QQPlotVisual type="good" darkMode={darkMode} />
                  <h4 className="text-sm font-bold text-green-500 flex items-center gap-2"><CheckCircle size={14} /> Good: Normal</h4>
                  <ul className={`text-[11px] space-y-1 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                    <li>• Points fall close to the diagonal line</li>
                    <li>• Small wiggles are normal & expected</li>
                    <li>• Indicates residuals are roughly balanced</li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <QQPlotVisual type="bad" darkMode={darkMode} />
                  <h4 className="text-sm font-bold text-rose-500 flex items-center gap-2"><AlertCircle size={14} /> Bad: Non-Normal</h4>
                  <ul className={`text-[11px] space-y-1 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                    <li>• Clear curve or S-shape (heavy tails)</li>
                    <li>• Ends peel away strongly from the line</li>
                    <li>• Points far from line (extreme outliers)</li>
                  </ul>
                </div>
              </div>

              <div className={`p-4 rounded-2xl border-2 border-indigo-500/20 ${darkMode ? 'bg-indigo-500/5' : 'bg-indigo-50'}`}>
                <h5 className={`text-xs font-black uppercase tracking-widest mb-2 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>What to look for:</h5>
                <p className={`text-xs leading-relaxed ${darkMode ? 'text-indigo-200/70' : 'text-indigo-800/70'}`}>
                  In a Q–Q plot, points should follow the line. Curves suggest skew or heavy tails. Big tail departures often mean outliers or non-normal errors. Small deviations are common in real-world data and often acceptable.
                </p>
              </div>
            </div>

            <div className={`p-6 border-t flex justify-end animate-in slide-in-from-bottom-2 ${darkMode ? 'border-slate-800 bg-slate-950/50' : 'border-slate-100 bg-slate-50/50'}`}>
              <button
                onClick={() => setShowExamplesModal(false)}
                className={`px-8 py-3 rounded-xl font-black uppercase tracking-widest text-xs transition-all ${darkMode ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg' : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md'}`}
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- NAVIGATION COMPONENTS ---


export default AssumptionItem;
