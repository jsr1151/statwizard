import React from 'react';
import { ChevronLeft, Sparkles, Monitor } from 'lucide-react';

const Header = ({ onBack, onHome, canGoBack, darkMode, onToggleDarkMode }) => (
    <header className={`${darkMode ? 'bg-slate-950' : 'bg-slate-900'} text-white p-4 shadow-lg flex items-center justify-between sticky top-0 z-20 border-b ${darkMode ? 'border-slate-800' : 'border-slate-700/30'}`}>
        <div className="flex items-center gap-6">
            <button
                onClick={onHome}
                className="flex items-center gap-3 group transition-transform active:scale-95 text-left"
            >
                <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:rotate-6 transition-all duration-300">
                    <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div className="flex flex-col">
                    <h1 className="text-xl font-black tracking-tighter leading-none group-hover:text-indigo-400 transition-colors">StatWizard</h1>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Master Data</span>
                </div>
            </button>
            {canGoBack && (
                <button
                    onClick={onBack}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm ${darkMode ? 'bg-slate-900 border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
                >
                    <ChevronLeft size={16} /> Back
                </button>
            )}
        </div>

        <div className="flex items-center gap-2 md:gap-3">
            <button
                onClick={onToggleDarkMode}
                className={`p-2 rounded-xl transition-all border ${darkMode ? 'bg-slate-900 border-slate-700 text-amber-400 hover:bg-slate-800' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white hover:bg-slate-700'}`}
                title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
                {darkMode ? <Sparkles className="w-4 h-4" /> : <Monitor className="w-4 h-4" />}
            </button>
            <div className={`hidden sm:block text-[10px] font-semibold px-2.5 py-1 rounded-full border ${darkMode ? 'bg-indigo-900/40 text-indigo-400 border-indigo-500/40' : 'bg-indigo-600/20 text-indigo-400 border-indigo-500/30'}`}>
                BETA v9.6
            </div>
        </div>
    </header>
);

export default Header;
