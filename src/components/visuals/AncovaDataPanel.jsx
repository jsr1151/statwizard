import React from 'react';
import { Plus, Sparkles } from 'lucide-react';
import { ANCOVA_PRESETS } from '../../data/ancovaPresets';
import AncovaDatasetEditor from './AncovaDatasetEditor';

const AncovaDataPanel = ({
    covariateName,
    darkMode,
    groups,
    onAddGroup,
    onCovariateNameChange,
    onGroupChange,
    onGroupRemove,
    onPresetLoad,
    onRawChange,
}) => (
    <div className="max-w-4xl mx-auto flex flex-col items-center">
        <AncovaDatasetEditor
            covariateName={covariateName}
            setCovariateName={onCovariateNameChange}
            groups={groups}
            updateGroup={onGroupChange}
            parseRaw={onRawChange}
            removeGroup={onGroupRemove}
            darkMode={darkMode}
        />
        <button type="button" onClick={onAddGroup} className={`mt-6 px-6 py-3 rounded-xl border-2 border-dashed flex items-center gap-2 font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95 ${darkMode ? 'border-slate-700 text-slate-400 hover:text-indigo-400 hover:border-indigo-500 hover:bg-indigo-950/30' : 'border-slate-300 text-slate-500 hover:text-indigo-600 hover:border-indigo-400 hover:bg-indigo-50'}`}>
            <Plus size={16} /> Add Group Level
        </button>
        <section className={`mt-8 w-full p-6 rounded-2xl border-2 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} shadow-sm`}>
            <h3 className={`text-sm font-black uppercase tracking-widest mb-4 flex items-center gap-2 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}><Sparkles size={16} /> Study Themes</h3>
            <div className="grid md:grid-cols-2 gap-4">
                {ANCOVA_PRESETS.map((preset) => (
                    <button key={preset.id} type="button" onClick={() => onPresetLoad(preset)} className={`p-4 rounded-xl border-2 text-left transition-all hover:scale-[1.02] active:scale-95 ${darkMode ? 'border-slate-800 hover:border-indigo-500 hover:bg-indigo-950/30' : 'border-slate-200 hover:border-indigo-400 hover:bg-indigo-50'}`}>
                        <span className={`font-bold mb-1 block ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>{preset.label}</span>
                        <span className="text-xs text-slate-500">{preset.description}</span>
                    </button>
                ))}
            </div>
        </section>
    </div>
);

export default AncovaDataPanel;
