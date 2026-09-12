import React from 'react';

const AnalysisSectionTabs = ({
    darkMode,
    sections = [],
    activeSection,
    onChange,
}) => (
    <nav aria-label="Analysis sections" className={`min-w-0 rounded-xl border p-2 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
        <label className={`block text-sm font-bold sm:hidden ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>Section
            <select value={activeSection} onChange={event => onChange?.(event.target.value)} className={`mt-2 w-full rounded-lg border p-3 ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300'}`}>
                {sections.map(section => <option key={section.id} value={section.id}>{section.label}</option>)}
            </select>
        </label>
        <div className="hidden flex-wrap gap-2 sm:flex">
        {sections.map((section) => {
            const Icon = section.icon;
            const isActive = activeSection === section.id;

            return (
                <button
                    key={section.id}
                    type="button"
                    aria-pressed={isActive}
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
    </nav>
);

export default AnalysisSectionTabs;
