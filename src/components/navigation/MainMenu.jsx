import React from 'react';
import { ArrowRight, Search, Book, LayoutGrid, Database } from 'lucide-react';
import { PowerBetaIcon, WizardHatIcon } from '../common/AppIcons';

const MainMenu = ({ onSelect, darkMode }) => {
  const modes = [
    { id: 'wizard', title: 'Find the right test', desc: 'Answer a few questions about your data and study design with the Wizard.', icon: WizardHatIcon },
    { id: 'lessons', title: 'Learning Lab', desc: 'Start with the basics: five short lessons, worked examples, and practice with saved progress.', icon: Book },
    { id: 'modules', title: 'Explore stat modules', desc: 'Go straight to a concept, calculator, or interactive visualization.', icon: LayoutGrid },
  ];
  const tools = [
    { id: 'data_manager', title: 'Data Manager', desc: 'Import, prepare, and save datasets.', icon: Database },
    { id: 'power', title: 'Power Analysis', desc: 'Explore power and plan sample size.', icon: PowerBetaIcon },
    { id: 'search', title: 'Direct Search', desc: 'Find a statistic or concept by name.', icon: Search },
  ];

  return (
    <div className="space-y-8">
    <div className="grid md:grid-cols-3 gap-6">
      {modes.map((m) => (
        <button
          key={m.id}
          onClick={() => onSelect(m.id)}
          className={`group relative p-8 rounded-3xl border-2 text-left transition-all duration-500 hover:scale-[1.02] hover:-translate-y-1 ${darkMode ? 'bg-slate-900 border-slate-800 hover:border-indigo-500/50 hover:shadow-2xl hover:shadow-indigo-500/10' : 'bg-white border-slate-100 hover:border-indigo-600 hover:shadow-2xl hover:shadow-indigo-500/5'}`}
        >
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 ${darkMode ? 'bg-indigo-950 text-indigo-300' : 'bg-indigo-50 text-indigo-700'}`}>
            <m.icon aria-hidden="true" className="w-7 h-7" />
          </div>
          <h3 className={`text-2xl font-black mb-3 transition-colors ${darkMode ? 'text-white group-hover:text-indigo-300' : 'text-slate-900 group-hover:text-indigo-700'}`}>{m.title}</h3>
          <p className={`text-sm leading-relaxed ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>{m.desc}</p>
          <div className={`absolute bottom-8 right-8 w-10 h-10 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 translate-x-4 group-hover:translate-x-0 ${darkMode ? 'bg-indigo-600' : 'bg-indigo-600 shadow-lg shadow-indigo-500/40'}`}>
            <ArrowRight className="w-5 h-5 text-white" />
          </div>
        </button>
      ))}
    </div>
    <section aria-label="More tools" className="space-y-3">
      <h3 className={`font-bold ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>More tools</h3>
      <div className="grid md:grid-cols-3 gap-3">
        {tools.map(tool => <button key={tool.id} onClick={() => onSelect(tool.id)} className={`flex items-start gap-3 p-4 rounded-xl border text-left ${darkMode ? 'border-slate-700 text-slate-200 hover:bg-slate-900' : 'border-slate-300 text-slate-800 hover:bg-white'}`}>
          <tool.icon aria-hidden="true" className="w-5 h-5 mt-1 shrink-0" />
          <span><span className="block font-bold">{tool.title}</span><span className="block text-sm mt-1">{tool.desc}</span></span>
        </button>)}
      </div>
    </section>
    </div>
  );
};


export default MainMenu;
