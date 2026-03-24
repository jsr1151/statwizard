import React from 'react';

const AnalysisSectionTabs = ({
    darkMode,
    sections = [],
    activeSection,
    onChange,
}) => (
    <div className={`rounded-xl border p-2 flex flex-wrap gap-2 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
        {sections.map((section) => {
            const Icon = section.icon;
            const isActive = activeSection === section.id;

            return (
                <button
                    key={section.id}
                    type="button"
                    onClick={() => onChange?.(section.id)}
                    className={`inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg min-h-[3.25rem] text-sm font-black uppercase tracking-[0.18em] leading-tight text-center transition-all ${isActive
                        ? 'bg-indigo-600 text-white shadow-lg'
                        : (darkMode ? 'text-slate-400 hover:text-white hover:bg-slate-900' : 'text-slate-600 hover:text-slate-900 hover:bg-white')
                    }`}
                >
                    {Icon ? <Icon className="w-4 h-4" /> : null}
                    {section.label}
                </button>
            );
        })}
    </div>
);

export default AnalysisSectionTabs;
