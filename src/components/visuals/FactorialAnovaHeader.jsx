import React from 'react';
import ProgressiveTooltip from '../common/ProgressiveTooltip';
import { FACTORIAL_PRESETS } from '../../data/factorialPresets';

const TABS = [
    { id: 'data', label: 'Data', description: 'Enter your factorial data groups.' },
    { id: 'plot', label: 'Plot', description: 'Visualize main effects and interactions.' },
    { id: 'table', label: 'Table', description: 'View the ANOVA summary results.' },
    { id: 'fdist', label: 'F Curve', description: 'View the selected effect on an F distribution.' },
    { id: 'explorer', label: 'Explorer', description: 'Drill down into simple effects.' },
    { id: 'posthoc', label: 'Post-hoc', description: 'Compare factor-level marginal means.' },
    { id: 'diagnostics', label: 'Diagnostics', description: 'Check residuals and cell variances.' },
    { id: 'report', label: 'Report', description: 'Generate an APA-style write-up.' },
];

const FactorialAnovaHeader = ({
    activeTab,
    darkMode,
    hasResults,
    onPresetChange,
    onTabChange,
    onLockedTab,
}) => (
    <>
        <nav className="absolute top-6 left-6 right-6 flex gap-2 z-40 overflow-x-auto pb-2" aria-label="Factorial ANOVA views">
            {TABS.map((tab) => (
                <ProgressiveTooltip
                    key={tab.id}
                    term={tab.label}
                    title={`${tab.label} View`}
                    desc={tab.description}
                    darkMode={darkMode}
                >
                    <button
                        type="button"
                        onClick={() => {
                            if (tab.id !== 'data' && !hasResults) {
                                onLockedTab();
                                return;
                            }
                            onTabChange(tab.id);
                        }}
                        className={`shrink-0 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-900/90 text-slate-500 hover:text-slate-300'}`}
                    >
                        {tab.label}
                    </button>
                </ProgressiveTooltip>
            ))}
        </nav>

        <div className="absolute top-[85px] right-8 text-right z-40 pointer-events-none">
            <ProgressiveTooltip
                term="Design Model"
                title="Between-Subjects"
                desc="Each person contributes data to only one cell."
                pedagogy="Scores in different cells are assumed to be independent because they come from different people."
                darkMode={darkMode}
            >
                <div className="flex flex-col gap-0.5 pointer-events-auto cursor-help">
                    <span className="text-[10px] font-black uppercase text-indigo-500/60 tracking-widest px-1">Design Model</span>
                    <span className={`text-[9px] font-bold ${darkMode ? 'text-slate-600' : 'text-slate-400'} italic`}>Between-subjects (Independent Groups)</span>
                </div>
            </ProgressiveTooltip>
        </div>

        <div className="absolute top-[85px] left-6 z-40 flex flex-col gap-1.5">
            <ProgressiveTooltip
                term="Themes"
                title="Study Themes"
                desc="Pre-fill common factorial designs and example datasets."
                pedagogy="Themes show how typical research questions map to factors and levels."
                darkMode={darkMode}
            >
                <span className="text-[10px] font-black uppercase text-indigo-500/50 tracking-[0.2em] px-1 cursor-help">Study Themes</span>
            </ProgressiveTooltip>
            <select
                aria-label="Factorial ANOVA study theme"
                defaultValue=""
                onChange={(event) => onPresetChange(event.target.value)}
                className="bg-slate-900/40 backdrop-blur-2xl text-slate-300 text-[10px] font-black uppercase tracking-widest px-5 py-3 rounded-2xl border border-white/5 outline-none hover:border-indigo-500/30 hover:text-white transition-all cursor-pointer shadow-2xl min-w-[220px]"
            >
                <option value="">Select a Theme...</option>
                {FACTORIAL_PRESETS.map((preset) => (
                    <option key={preset.id} value={preset.id}>{preset.name}</option>
                ))}
            </select>
        </div>
    </>
);

export default FactorialAnovaHeader;
