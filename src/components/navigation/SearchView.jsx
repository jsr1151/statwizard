import React from 'react';
import { Search, ArrowRight } from 'lucide-react';
import { STAT_PAGE_LIST } from '../../data/wizardSteps';
const SearchView = ({ onSelect, darkMode, searchQuery, setSearchQuery }) => {
  const normalize = (str) => str.toLowerCase().replace(/[^a-z0-9]/g, '');
  const normQuery = normalize(searchQuery);

  const filtered = STAT_PAGE_LIST.filter(p =>
    normalize(p.title).includes(normQuery) ||
    normalize(p.category).includes(normQuery)
  );

  return (
    <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center mb-12">
        <h2 className={`text-4xl font-black mb-3 ${darkMode ? 'text-white' : 'text-slate-900'}`}>Find a Statistic</h2>
        <p className={`text-lg ${darkMode ? 'text-slate-500' : 'text-slate-600'}`}>Search across all modules and concepts.</p>
      </div>

      <div className="relative mb-12">
        <Search className={`absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 ${darkMode ? 'text-slate-600' : 'text-slate-400'}`} />
        <input
          autoFocus
          type="text"
          placeholder="Search by name (e.g., 'ANOVA', 'T-Test', 'Mean')..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={`w-full h-16 pl-16 pr-6 rounded-3xl text-xl font-medium outline-none border-4 transition-all ${darkMode ? 'bg-slate-900 border-slate-800 text-white focus:border-indigo-600' : 'bg-white border-slate-100 text-slate-800 focus:border-indigo-500 focus:shadow-2xl focus:shadow-indigo-500/10'}`}
        />
      </div>

      <div className="space-y-4">
        {filtered.length > 0 ? (
          filtered.map(p => (
            <button
              key={p.id}
              onClick={() => onSelect(p.id)}
              className={`w-full group flex items-center gap-6 p-6 rounded-3xl border-2 transition-all duration-300 ${darkMode ? 'bg-slate-900 border-slate-800 hover:border-indigo-500 hover:bg-indigo-500/5' : 'bg-white border-slate-100 hover:border-indigo-600 hover:shadow-xl hover:shadow-indigo-500/5'}`}
            >
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${darkMode ? 'bg-slate-950 text-slate-700 group-hover:bg-indigo-600 group-hover:text-white' : 'bg-slate-50 text-slate-400 group-hover:bg-indigo-600 group-hover:text-white'}`}>
                <Activity className="w-5 h-5" />
              </div>
              <div className="text-left">
                <h4 className={`text-lg font-black transition-colors ${darkMode ? 'text-white group-hover:text-indigo-300' : 'text-slate-800 group-hover:text-indigo-700'}`}>{p.title}</h4>
                <span className={`text-xs font-black uppercase tracking-widest ${darkMode ? 'text-slate-600' : 'text-slate-400'}`}>{p.category}</span>
              </div>
            </button>
          ))
        ) : (
          <div className="py-20 text-center">
            <div className={`inline-flex w-16 h-16 rounded-full items-center justify-center mb-4 ${darkMode ? 'bg-slate-800 text-slate-600' : 'bg-slate-100 text-slate-400'}`}>
              <AlertCircle className="w-8 h-8" />
            </div>
            <p className={`font-bold ${darkMode ? 'text-slate-600' : 'text-slate-400'}`}>No modules found matching "{searchQuery}"</p>
          </div>
        )}
      </div>
    </div>
  );
};


export default SearchView;
