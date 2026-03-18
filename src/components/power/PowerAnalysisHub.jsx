import React, { useEffect, useMemo, useState } from 'react';
import { POWER_FAMILY_META, POWER_MODE_META, POWER_MODE_ORDER } from '../../power/constants';
import { POWER_TEST_REGISTRY } from '../../power/testRegistry';

const PowerAnalysisHub = ({ darkMode, onOpenCalculator }) => {
    const families = useMemo(() => Object.keys(POWER_FAMILY_META), []);
    const [family, setFamily] = useState(families[0]);
    const testsForFamily = useMemo(
        () => POWER_TEST_REGISTRY.filter((test) => test.family === family),
        [family]
    );
    const [selectedTestId, setSelectedTestId] = useState(testsForFamily[0]?.id);

    useEffect(() => {
        setSelectedTestId(testsForFamily[0]?.id);
    }, [testsForFamily]);

    const selectedTest = useMemo(
        () => testsForFamily.find((test) => test.id === selectedTestId) || testsForFamily[0],
        [testsForFamily, selectedTestId]
    );

    const modes = useMemo(() => {
        const modeList = selectedTest?.power?.implementedPowerModes?.length
            ? selectedTest.power.implementedPowerModes
            : selectedTest?.power?.supportedPowerModes || [];
        return POWER_MODE_ORDER.filter((mode) => modeList.includes(mode));
    }, [selectedTest]);

    const [mode, setMode] = useState(modes[0] || 'a_priori');

    useEffect(() => {
        setMode(modes[0] || 'a_priori');
    }, [modes]);

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center max-w-3xl mx-auto">
                <h2 className={`text-4xl md:text-5xl font-black mb-4 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                    Power Analysis
                </h2>
                <p className={`text-lg ${darkMode ? 'text-slate-500' : 'text-slate-600'}`}>
                    Use the shared registry to choose a test family, pick the statistical test, and launch the same power-analysis surface that lives inside each test page.
                </p>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                <div className={`rounded-3xl border p-6 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                    <div className={`text-xs font-black uppercase tracking-widest mb-4 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
                        1. Test Family
                    </div>
                    <div className="space-y-3">
                        {families.map((familyId) => (
                            <button
                                key={familyId}
                                onClick={() => setFamily(familyId)}
                                className={`w-full rounded-2xl border px-4 py-4 text-left transition-all ${family === familyId ? 'border-indigo-500 bg-indigo-500/10' : (darkMode ? 'border-slate-800 bg-slate-950 hover:border-slate-700' : 'border-slate-200 bg-slate-50 hover:border-slate-300')}`}
                            >
                                <div className={`font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                    {POWER_FAMILY_META[familyId].label}
                                </div>
                                <div className={`text-sm mt-1 ${darkMode ? 'text-slate-500' : 'text-slate-600'}`}>
                                    {POWER_FAMILY_META[familyId].description}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                <div className={`rounded-3xl border p-6 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                    <div className={`text-xs font-black uppercase tracking-widest mb-4 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
                        2. Statistical Test
                    </div>
                    <div className="space-y-3">
                        {testsForFamily.map((test) => (
                            <button
                                key={test.id}
                                onClick={() => setSelectedTestId(test.id)}
                                className={`w-full rounded-2xl border px-4 py-4 text-left transition-all ${selectedTest?.id === test.id ? 'border-indigo-500 bg-indigo-500/10' : (darkMode ? 'border-slate-800 bg-slate-950 hover:border-slate-700' : 'border-slate-200 bg-slate-50 hover:border-slate-300')}`}
                            >
                                <div className="flex items-center justify-between gap-3">
                                    <div className={`font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>{test.label}</div>
                                    <div className={`px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${test.power.status === 'available' ? (darkMode ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20' : 'bg-emerald-50 text-emerald-700 border border-emerald-200') : (darkMode ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20' : 'bg-amber-50 text-amber-700 border border-amber-200')}`}>
                                        {test.power.status === 'available' ? 'Live' : 'Planned'}
                                    </div>
                                </div>
                                <div className={`text-sm mt-2 ${darkMode ? 'text-slate-500' : 'text-slate-600'}`}>
                                    {test.power.gpowerTest}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                <div className={`rounded-3xl border p-6 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                    <div className={`text-xs font-black uppercase tracking-widest mb-4 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
                        3. Power Mode
                    </div>
                    <div className="space-y-3">
                        {modes.map((modeId) => (
                            <button
                                key={modeId}
                                onClick={() => setMode(modeId)}
                                className={`w-full rounded-2xl border px-4 py-4 text-left transition-all ${mode === modeId ? 'border-indigo-500 bg-indigo-500/10' : (darkMode ? 'border-slate-800 bg-slate-950 hover:border-slate-700' : 'border-slate-200 bg-slate-50 hover:border-slate-300')}`}
                            >
                                <div className={`font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                    {POWER_MODE_META[modeId]?.label || modeId}
                                </div>
                                <div className={`text-sm mt-1 ${darkMode ? 'text-slate-500' : 'text-slate-600'}`}>
                                    {POWER_MODE_META[modeId]?.description}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className={`rounded-3xl border p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-6 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <div>
                    <div className={`text-xs font-black uppercase tracking-widest mb-2 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
                        Launch Shared Calculator
                    </div>
                    <div className={`text-xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                        {selectedTest?.label}
                    </div>
                    <p className={`mt-2 ${darkMode ? 'text-slate-500' : 'text-slate-600'}`}>
                        This opens the same page-level power section used inside the test itself, instead of a duplicated standalone calculator.
                    </p>
                </div>

                <button
                    onClick={() => selectedTest && onOpenCalculator?.(selectedTest, mode)}
                    className={`px-6 py-4 rounded-2xl text-sm font-black uppercase tracking-widest transition-all ${darkMode ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg' : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl'}`}
                >
                    Open {POWER_MODE_META[mode]?.shortLabel || mode}
                </button>
            </div>
        </div>
    );
};

export default PowerAnalysisHub;
