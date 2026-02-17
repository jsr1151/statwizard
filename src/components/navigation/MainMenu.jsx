import React from 'react';
import { ArrowRight, Compass, Search, Book, LayoutGrid, Sparkles, BrainCircuit } from 'lucide-react';
const MainMenu = ({ onSelect, darkMode }) => {
  const modes = [
    { id: 'wizard', title: 'The Wizard', desc: 'Step-by-step guidance to find the right test for your project.', icon: BrainCircuit, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
    { id: 'modules', title: 'Stat Modules', desc: 'Browse all statistical pages organized by analysis type.', icon: LayoutGrid, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { id: 'lessons', title: 'Learning Lab', desc: 'Follow structured lessons from easy to complex (Coming Soon).', icon: Book, color: 'text-amber-400', bg: 'bg-amber-500/10' },
    { id: 'search', title: 'Direct Search', desc: 'Quickly find a specific statistic or concept by name.', icon: Search, color: 'text-rose-400', bg: 'bg-rose-500/10' }
  ];

  return (
    <div className="grid md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
      {modes.map((m) => (
        <button
          key={m.id}
          onClick={() => onSelect(m.id)}
          className={`group relative p-8 rounded-3xl border-2 text-left transition-all duration-500 hover:scale-[1.02] hover:-translate-y-1 ${darkMode ? 'bg-slate-900 border-slate-800 hover:border-indigo-500/50 hover:shadow-2xl hover:shadow-indigo-500/10' : 'bg-white border-slate-100 hover:border-indigo-600 hover:shadow-2xl hover:shadow-indigo-500/5'}`}
        >
          <div className={`w-14 h-14 rounded-2xl ${m.bg} flex items-center justify-center mb-6 transition-transform group-hover:scale-110 duration-500`}>
            <m.icon className={`w-7 h-7 ${m.color}`} />
          </div>
          <h3 className={`text-2xl font-black mb-3 transition-colors ${darkMode ? 'text-white group-hover:text-indigo-300' : 'text-slate-900 group-hover:text-indigo-700'}`}>{m.title}</h3>
          <p className={`text-sm leading-relaxed ${darkMode ? 'text-slate-500 group-hover:text-slate-400' : 'text-slate-500 group-hover:text-slate-600'}`}>{m.desc}</p>
          <div className={`absolute bottom-8 right-8 w-10 h-10 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 translate-x-4 group-hover:translate-x-0 ${darkMode ? 'bg-indigo-600' : 'bg-indigo-600 shadow-lg shadow-indigo-500/40'}`}>
            <ArrowRight className="w-5 h-5 text-white" />
          </div>
        </button>
      ))}
    </div>
  );
};


export default MainMenu;
