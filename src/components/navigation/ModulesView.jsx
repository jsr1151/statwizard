import React, { useState } from 'react';
import { ArrowRight, Activity, Layers, ChevronDown, BarChart2 } from 'lucide-react';
import { STAT_PAGE_LIST, FAMILIES } from '../../data/wizardSteps';
const ModulesView = ({ onSelect, darkMode }) => {
  const categories = ['Descriptive', 'Mean Comparisons', 'Linear Modeling', 'Non-parametric'];
  const [activeFamily, setActiveFamily] = useState(null);

  // If a family is selected, show its sub-menu
  if (activeFamily) {
    const familyStats = STAT_PAGE_LIST.filter(p => p.family === activeFamily);
    const familyInfo = FAMILIES[activeFamily];

    return (
      <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-right-8 duration-500">
        <div className="flex items-center gap-4 mb-10">
          <button
            onClick={() => setActiveFamily(null)}
            className={`p-3 rounded-2xl transition-all ${darkMode ? 'bg-slate-900 border border-slate-800 text-indigo-400 hover:text-white hover:border-slate-600' : 'bg-white border border-slate-200 text-indigo-600 hover:shadow-lg'}`}
          >
            <ChevronLeft size={24} />
          </button>
          <div>
            <h2 className={`text-3xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>{activeFamily} Family</h2>
            <p className={`text-sm ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>{familyInfo.desc}</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {familyStats.map(p => (
            <button
              key={p.id}
              onClick={() => onSelect(p.id)}
              className={`w-full group flex items-center justify-between p-6 rounded-2xl border transition-all duration-300 ${darkMode ? 'bg-slate-900 border-slate-800 hover:border-indigo-500 hover:bg-slate-800/50' : 'bg-white border-slate-100 hover:border-indigo-600 hover:shadow-xl hover:shadow-indigo-500/5'}`}
            >
              <span className={`text-base font-bold transition-colors ${darkMode ? 'text-slate-300 group-hover:text-white' : 'text-slate-700 group-hover:text-indigo-700'}`}>{p.title}</span>
              <div className={`p-2 rounded-xl border transition-all duration-300 ${darkMode ? 'bg-slate-950 border-slate-800 group-hover:border-indigo-500' : 'bg-slate-50 border-slate-200 group-hover:border-indigo-500'}`}>
                <Play className={`w-4 h-4 translate-x-0.5 ${darkMode ? 'text-slate-700 group-hover:text-indigo-400' : 'text-slate-400 group-hover:text-indigo-600'}`} />
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500 text-left">
      <div className="text-center max-w-2xl mx-auto mb-8">
        <h2 className={`text-4xl font-black mb-3 ${darkMode ? 'text-white' : 'text-slate-900'}`}>Statistical Modules</h2>
        <p className={`text-lg ${darkMode ? 'text-slate-500' : 'text-slate-600'}`}>Select a family or tool directly to start your analysis.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {categories.map(cat => {
          // Extract unique families for this category
          const familyList = [...new Set(STAT_PAGE_LIST.filter(p => p.category === cat && p.family).map(p => p.family))];
          // Standalone modules
          const standaloneList = STAT_PAGE_LIST.filter(p => p.category === cat && !p.family);

          return (
            <div key={cat} className={`p-6 rounded-3xl border border-dashed ${darkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-slate-50/50 border-slate-200'}`}>
              <h3 className={`text-xs font-black uppercase tracking-widest mb-6 px-2 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>{cat}</h3>
              <div className="space-y-3">
                {familyList.map(fam => (
                  <button
                    key={fam}
                    onClick={() => setActiveFamily(fam)}
                    className={`w-full group flex items-center justify-between p-5 rounded-2xl border transition-all duration-300 ${darkMode ? 'bg-slate-900 border-indigo-500/20 hover:border-indigo-500 hover:bg-slate-800' : 'bg-white border-indigo-50 hover:border-indigo-600 hover:shadow-lg hover:shadow-indigo-500/5'}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-2.5 rounded-xl ${darkMode ? 'bg-slate-950 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
                        {FAMILIES[fam] ? (
                          React.createElement(FAMILIES[fam].icon, { className: "w-5 h-5" })
                        ) : <Activity className="w-5 h-5" />}
                      </div>
                      <div className="text-left">
                        <h4 className={`text-sm font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>{fam} Family</h4>
                        <p className={`text-[10px] font-bold uppercase tracking-wider ${darkMode ? 'text-slate-600' : 'text-slate-400'}`}>
                          {STAT_PAGE_LIST.filter(p => p.family === fam).length} Modules
                        </p>
                      </div>
                    </div>
                    <ArrowRight className={`w-4 h-4 transition-transform group-hover:translate-x-1 ${darkMode ? 'text-slate-700 group-hover:text-indigo-400' : 'text-slate-300 group-hover:text-indigo-600'}`} />
                  </button>
                ))}

                {standaloneList.map(p => (
                  <button
                    key={p.id}
                    onClick={() => onSelect(p.id)}
                    className={`w-full group flex items-center justify-between p-5 rounded-2xl border transition-all duration-300 ${darkMode ? 'bg-slate-900 border-slate-800 hover:border-slate-600 hover:bg-slate-800' : 'bg-white border-slate-100 hover:border-indigo-400 hover:shadow-lg hover:shadow-indigo-500/5'}`}
                  >
                    <span className={`text-sm font-bold transition-colors ${darkMode ? 'text-slate-300 group-hover:text-white' : 'text-slate-700 group-hover:text-indigo-700'}`}>{p.title}</span>
                    <div className={`p-2 rounded-xl border transition-all duration-300 ${darkMode ? 'bg-slate-950 border-slate-800 group-hover:border-indigo-500' : 'bg-slate-50 border-slate-200 group-hover:border-indigo-500'}`}>
                      <Play className={`w-3 h-3 translate-x-0.5 ${darkMode ? 'text-slate-700 group-hover:text-indigo-400' : 'text-slate-400 group-hover:text-indigo-600'}`} />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};


export default ModulesView;
