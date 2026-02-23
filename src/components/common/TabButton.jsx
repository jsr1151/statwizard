import React from 'react';

const TabButton = ({ active, onClick, icon: Icon, label, children, darkMode }) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-2 px-4 py-2 rounded-t-lg text-sm font-medium transition-all border-t-2 ${active
            ? (darkMode ? 'bg-slate-900 text-indigo-400 border-indigo-500 shadow-[0_-2px_10px_rgba(0,0,0,0.3)] z-10' : 'bg-white text-indigo-700 border-indigo-600 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] z-10')
            : (darkMode ? 'bg-slate-950/50 text-slate-500 border-transparent hover:bg-slate-900 hover:text-slate-300' : 'bg-slate-100 text-slate-500 border-transparent hover:bg-slate-200 hover:text-slate-700')
            }`}
    >
        {Icon && <Icon className={`w-3.5 h-3.5 ${active ? 'text-indigo-500' : 'text-slate-400'}`} />}
        {label || children}
    </button>
);

export default TabButton;
