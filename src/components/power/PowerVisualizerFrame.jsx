import React from 'react';
import NormalDistributionVisual from '../visuals/NormalDistributionVisual';

const PowerVisualizerFrame = ({ result, darkMode }) => {
    return (
        <div className={`rounded-2xl border p-6 h-full ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
            <h3 className={`text-sm font-black uppercase tracking-widest mb-4 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
                Power Visualizer
            </h3>

            {!result?.ok || !result?.visualizer ? (
                <div className={`rounded-xl border p-5 ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                    The shared visualizer frame is ready. As each solver lands, it can hand the page a standardized visualizer model instead of building a second visualization stack.
                </div>
            ) : result.visualizer.kind === 'normal_distribution' ? (
                <NormalDistributionVisual
                    darkMode={darkMode}
                    type={result.visualizer.type}
                    showTutor={false}
                    powerViewConfig={result.visualizer.config}
                />
            ) : (
                <div className={`rounded-xl border p-5 ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                    This test has a solver result, but its visualizer adapter has not been registered yet.
                </div>
            )}
        </div>
    );
};

export default PowerVisualizerFrame;
