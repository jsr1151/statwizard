import { lazy, useMemo } from "react";
import { PowerNavigationContext } from '../../routing/powerNavigationContext.js';
import { CheckCircle, Calculator, Terminal, MousePointer2, Info, BarChart2, Grid } from "lucide-react";
import TabButton from "../../components/common/TabButton";
import EquationWorkspace from "./EquationWorkspace.jsx";
import EquationPanel from "./EquationPanel.jsx";
import ResultVisualizer from "./ResultVisualizer.jsx";
import { METHOD_AVAILABILITY } from '../../data/methodAvailability.js';
const MethodScopePage = lazy(() => import('../analysis/MethodScopePage.jsx'));
const TutorPanel = lazy(() => import('../../components/tutor/TutorPanel'));
const AssumptionItem = lazy(() => import('../../components/formula/AssumptionItem'));
const PowerAnalysisTab = lazy(() => import('../../components/power/PowerAnalysisTab'));
const EffectSizePanel = lazy(() => import('../../components/power/EffectSizePanel'));
const PearsonCorrelationPage = lazy(() => import('../../components/correlation/PearsonCorrelationPage'));
const SimpleLinearRegressionPage = lazy(() => import('../../components/regression/SimpleLinearRegressionPage'));
const MultipleRegressionPage = lazy(() => import('../../components/regression/MultipleRegressionPage'));
const AnalysisSectionTabs = lazy(() => import('../../components/analysis/AnalysisSectionTabs'));
const AnalysisAssumptionsSection = lazy(() => import('../../components/analysis/AnalysisAssumptionsSection.jsx'));
const OneSampleTTestPage = lazy(() => import('../../components/analysis/OneSampleTTestPage.jsx'));
const IndependentTTestPage = lazy(() => import('../../components/analysis/IndependentTTestPage.jsx'));
const PairedTTestPage = lazy(() => import('../../components/analysis/PairedTTestPage.jsx'));
const OneWayAnovaPage = lazy(() => import('../../components/analysis/OneWayAnovaPage.jsx'));
const FactorialAnovaPage = lazy(() => import('../../components/analysis/FactorialAnovaPage.jsx'));
const AncovaPage = lazy(() => import('../../components/analysis/AncovaPage.jsx'));
const CentralTendencyPage = lazy(() => import('../../components/descriptive/CentralTendencyPage.jsx'));
const VariabilityPage = lazy(() => import('../../components/descriptive/VariabilityPage.jsx'));
const FrequencyPage = lazy(() => import('../../components/descriptive/FrequencyPage.jsx'));
const ProbabilityPage = lazy(() => import('../../components/probability/ProbabilityPage.jsx'));

export default function ResultPage({
        showTutorHints,
        darkMode, currentStep, availableResultSections, activeResultSection, handleResultSectionChange,
        isCentralTendencyPage, displayFormulaId, equationProps, isVariabilityPage, setCurrentStats,
        isFrequencyPage, isProbabilityPage, isPearsonCorrelationPage, currentStats, currentTestConfig,
        pendingPowerLaunch, currentStepId, isSimpleLinearRegressionPage, isMultipleRegressionPage, setAppMode,
        isOneSampleTTestPage, setActiveTutorScript, activeTutorScript, isIndependentTTestPage, isPairedTTestPage,
        isOneWayAnovaPage, anovaTutor, showEquationValues, isFactorialAnovaPage, isAncovaPage,
        showStructuredCalculator, displayVisualType, visualizerProps, isStructuredResultPage, setShowEquationValues,
        setSymbolKeyOpen, symbolKeyOpen, safeRelevantSymbols, hoveredTerm, equationWorkspaceProps,
        activeTab, setActiveTab, currentSoftware, selectPowerMode,
}) {
    const powerNavigation = useMemo(() => activeResultSection === 'power' ? {
        stepId: currentStepId,
        mode: pendingPowerLaunch?.mode,
        onModeChange: selectPowerMode,
    } : null, [activeResultSection, currentStepId, pendingPowerLaunch?.mode, selectPowerMode]);
    return (
<PowerNavigationContext.Provider value={powerNavigation}>
            <div className={`p-8 md:p-10 text-center transition-colors ${darkMode ? 'bg-slate-950 text-white' : 'bg-slate-900 text-white'}`}>
                <h2 className="text-3xl md:text-4xl font-extrabold mb-4">{currentStep?.title}</h2>
                <p className={`text-lg max-w-3xl mx-auto leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-300'}`}>{currentStep?.content}</p>
            </div>
            <div className={`p-6 md:p-8 space-y-12 transition-colors ${darkMode ? 'bg-slate-900' : 'bg-white'}`}>
                {availableResultSections.length > 0 && (
                    <AnalysisSectionTabs
                        darkMode={darkMode}
                        sections={availableResultSections}
                        activeSection={activeResultSection}
                        onChange={handleResultSectionChange}
                    />
                )}

                {METHOD_AVAILABILITY[currentStepId] ? (
                    <MethodScopePage step={currentStep} section={activeResultSection} darkMode={darkMode} />
                ) : isCentralTendencyPage ? (
                    <CentralTendencyPage
                        section={activeResultSection}
                        darkMode={darkMode}
                    />
                ) : activeResultSection === 'equation' && displayFormulaId && displayFormulaId !== 'none' ? (
                    <div className="space-y-8">
                        <div className={`rounded-xl border p-6 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                            <div className="flex flex-wrap items-start justify-between gap-4">
                                <div>
                                    <h3 className={`text-sm font-black uppercase tracking-widest mb-2 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
                                        Equation Reference
                                    </h3>
                                    <p className={`text-sm max-w-3xl ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                        Open the formula card here whenever you want the notation, symbol key, or a worked reference alongside the structured lessons and calculator sections.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {<EquationPanel {...equationProps} />}
                    </div>
                ) : isVariabilityPage ? (
                    <VariabilityPage
                        section={activeResultSection}
                        darkMode={darkMode}
                        onStatsChange={setCurrentStats}
                    />
                ) : isFrequencyPage ? (
                    <FrequencyPage
                        section={activeResultSection}
                        darkMode={darkMode}
                        onStatsChange={setCurrentStats}
                    />
                ) : isProbabilityPage ? (
                    <ProbabilityPage
                        section={activeResultSection}
                        darkMode={darkMode}
                    />
                ) : isPearsonCorrelationPage ? (
                    <PearsonCorrelationPage
                        section={activeResultSection}
                        darkMode={darkMode}
                        currentStats={currentStats}
                        onStatsChange={setCurrentStats}
                        assumptions={currentStep?.assumptions || []}
                        testConfig={currentTestConfig}
                        initialPowerMode={pendingPowerLaunch?.stepId === currentStepId ? pendingPowerLaunch?.mode : undefined}
                    />
                ) : isSimpleLinearRegressionPage ? (
                    <SimpleLinearRegressionPage
                        section={activeResultSection}
                        darkMode={darkMode}
                        currentStats={currentStats}
                        onStatsChange={setCurrentStats}
                        assumptions={currentStep?.assumptions || []}
                        testConfig={currentTestConfig}
                        initialPowerMode={pendingPowerLaunch?.stepId === currentStepId ? pendingPowerLaunch?.mode : undefined}
                    />
                ) : isMultipleRegressionPage ? (
                    <MultipleRegressionPage
                        section={activeResultSection}
                        darkMode={darkMode}
                        currentStats={currentStats}
                        onStatsChange={setCurrentStats}
                        assumptions={currentStep?.assumptions || []}
                        testConfig={currentTestConfig}
                        initialPowerMode={pendingPowerLaunch?.stepId === currentStepId ? pendingPowerLaunch?.mode : undefined}
                        onOpenDataManager={() => setAppMode('data_manager')}
                    />
                ) : isOneSampleTTestPage ? (
                    <div className="space-y-8">
                        <OneSampleTTestPage
                            section={activeResultSection}
                            darkMode={darkMode}
                            currentStats={currentStats}
                            onStatsChange={setCurrentStats}
                            assumptions={currentStep?.assumptions || []}
                            testConfig={currentTestConfig}
                            initialPowerMode={pendingPowerLaunch?.stepId === currentStepId ? pendingPowerLaunch?.mode : undefined}
                            onOpenDataManager={() => setAppMode('data_manager')}
                            onTutorUpdate={setActiveTutorScript}
                        />

                        {activeResultSection === 'lessons' && activeTutorScript && (
                            <TutorPanel
                                script={activeTutorScript}
                                level="tutor"
                                inline={true}
                                darkMode={darkMode}
                                onClose={() => setActiveTutorScript(null)}
                            />
                        )}
                    </div>
                ) : isIndependentTTestPage ? (
                    <div className="space-y-8">
                        <IndependentTTestPage
                            section={activeResultSection}
                            darkMode={darkMode}
                            currentStats={currentStats}
                            onStatsChange={setCurrentStats}
                            assumptions={currentStep?.assumptions || []}
                            testConfig={currentTestConfig}
                            initialPowerMode={pendingPowerLaunch?.stepId === currentStepId ? pendingPowerLaunch?.mode : undefined}
                            onOpenDataManager={() => setAppMode('data_manager')}
                            onTutorUpdate={setActiveTutorScript}
                        />

                        {activeResultSection === 'lessons' && activeTutorScript && (
                            <TutorPanel
                                script={activeTutorScript}
                                level="tutor"
                                inline={true}
                                darkMode={darkMode}
                                onClose={() => setActiveTutorScript(null)}
                            />
                        )}
                    </div>
                ) : isPairedTTestPage ? (
                    <div className="space-y-8">
                        <PairedTTestPage
                            section={activeResultSection}
                            darkMode={darkMode}
                            currentStats={currentStats}
                            onStatsChange={setCurrentStats}
                            assumptions={currentStep?.assumptions || []}
                            testConfig={currentTestConfig}
                            initialPowerMode={pendingPowerLaunch?.stepId === currentStepId ? pendingPowerLaunch?.mode : undefined}
                            onOpenDataManager={() => setAppMode('data_manager')}
                            onTutorUpdate={setActiveTutorScript}
                        />

                        {activeResultSection === 'lessons' && activeTutorScript && (
                            <TutorPanel
                                script={activeTutorScript}
                                level="tutor"
                                inline={true}
                                darkMode={darkMode}
                                onClose={() => setActiveTutorScript(null)}
                            />
                        )}
                    </div>
                ) : isOneWayAnovaPage ? (
                    <OneWayAnovaPage
                        section={activeResultSection}
                        darkMode={darkMode}
                        currentStats={currentStats}
                        onStatsChange={setCurrentStats}
                        assumptions={currentStep?.assumptions || []}
                        testConfig={currentTestConfig}
                        initialPowerMode={pendingPowerLaunch?.stepId === currentStepId ? pendingPowerLaunch?.mode : undefined}
                        onOpenDataManager={() => setAppMode('data_manager')}
                        onTutorUpdate={setActiveTutorScript}
                        tutor={anovaTutor}
                        showValues={showEquationValues}
                    />
                ) : isFactorialAnovaPage ? (
                    <FactorialAnovaPage
                        showTutorHints={showTutorHints}
                        section={activeResultSection}
                        darkMode={darkMode}
                        currentStats={currentStats}
                        onStatsChange={setCurrentStats}
                        assumptions={currentStep?.assumptions || []}
                        testConfig={currentTestConfig}
                        initialPowerMode={pendingPowerLaunch?.stepId === currentStepId ? pendingPowerLaunch?.mode : undefined}
                        onOpenDataManager={() => setAppMode('data_manager')}
                    />
                ) : isAncovaPage ? (
                    <AncovaPage
                        section={activeResultSection}
                        darkMode={darkMode}
                        currentStats={currentStats}
                        onStatsChange={setCurrentStats}
                        assumptions={currentStep?.assumptions || []}
                        testConfig={currentTestConfig}
                        initialPowerMode={pendingPowerLaunch?.stepId === currentStepId ? pendingPowerLaunch?.mode : undefined}
                        onOpenDataManager={() => setAppMode('data_manager')}
                        showValues={showEquationValues}
                    />
                ) : activeResultSection === 'assumptions' && (currentStep?.assumptions || []).length > 0 ? (
                    <AnalysisAssumptionsSection
                        darkMode={darkMode}
                        title={`${currentStep?.title || 'Analysis'} assumptions`}
                        description="Review the assumptions before trusting the observed analysis results. Use this page as a practical checklist rather than a rigid pass/fail gate."
                        assumptions={currentStep?.assumptions || []}
                    />
                ) : activeResultSection === 'power' && currentTestConfig ? (
                    <PowerAnalysisTab
                        key={`${currentStepId}-${pendingPowerLaunch?.mode || activeResultSection}`}
                        testConfig={currentTestConfig}
                        currentStats={currentStats}
                        darkMode={darkMode}
                        initialMode={pendingPowerLaunch?.stepId === currentStepId ? pendingPowerLaunch?.mode : undefined}
                    />
                ) : activeResultSection === 'effect_size' && currentTestConfig ? (
                    <EffectSizePanel
                        testConfig={currentTestConfig}
                        currentStats={currentStats}
                        darkMode={darkMode}
                    />
                ) : showStructuredCalculator ? (
                    <div className="space-y-8">
                        <div className={`rounded-xl border p-6 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                            <div className="flex flex-wrap items-start justify-between gap-4">
                                <div>
                                    <h3 className={`text-sm font-black uppercase tracking-widest mb-2 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
                                        Test Calculator
                                    </h3>
                                    <p className={`text-sm max-w-3xl ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                        Use this workspace to enter or inspect data-driven analysis inputs and outputs. Formulas, assumptions, software walkthroughs, and guided explanations stay in Tutor / Lessons.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className={`border rounded-xl p-6 min-h-[400px] transition-colors ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                            <h4 className={`font-bold mb-4 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                <BarChart2 className="w-4 h-4 text-indigo-400" /> Analysis Workspace
                            </h4>
                            <div className={`rounded-lg min-h-[250px] transition-colors ${displayVisualType === 'anova' || displayVisualType === 'factorial_anova' || displayVisualType === 'ancova' ? '' : (darkMode ? 'bg-slate-950/50 border border-dashed border-slate-800' : 'bg-slate-50/50 border border-dashed border-slate-200')}`}>
                                {<ResultVisualizer {...visualizerProps} teachingMode={false} />}
                            </div>
                        </div>
                    </div>
                ) : (
                <>
                <div className="grid lg:grid-cols-12 gap-8 items-start">
                    {currentStepId !== 'res_probability' && currentStepId !== 'res_nhst' && !isStructuredResultPage && (
                        <div className="lg:col-span-4 flex flex-col gap-6">
                            {displayFormulaId && displayFormulaId !== 'none' && activeResultSection !== 'lessons' && !isStructuredResultPage && (
                                <div className={`border-2 rounded-xl shadow-sm overflow-visible flex flex-col relative z-0 min-h-[250px] transition-colors ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'}`}>
                                    <div className={`px-4 py-2 border-b flex justify-between items-center ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                                        <h3 className={`text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}><Calculator className="w-4 h-4" /> The Equation</h3>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setShowEquationValues(!showEquationValues)}
                                                className={`text-[10px] flex items-center gap-1 px-2 py-1 rounded transition-all font-bold ${showEquationValues ? 'bg-indigo-600 text-white' : (darkMode ? 'text-slate-400 hover:text-indigo-400 bg-slate-800' : 'text-slate-500 hover:text-indigo-600 bg-slate-100')}`}
                                            >
                                                {showEquationValues ? 'HIDE VALUES' : 'SHOW VALUES'}
                                            </button>
                                            <button onClick={() => setSymbolKeyOpen(!symbolKeyOpen)} className={`text-[10px] flex items-center gap-1 px-2 py-1 rounded transition-colors ${darkMode ? 'text-slate-400 hover:text-indigo-400 bg-slate-800' : 'text-slate-500 hover:text-indigo-600 bg-slate-100'}`}><Info className="w-3 h-3" /> Symbol Key</button>
                                        </div>
                                    </div>

                                    {symbolKeyOpen && (
                                        <div className="bg-slate-800 text-slate-200 text-xs p-3 grid grid-cols-2 gap-2 animate-in fade-in slide-in-from-top-2">
                                            {safeRelevantSymbols.map((s, i) => {
                                                const isHovered = hoveredTerm && (
                                                    hoveredTerm === s.key ||
                                                    hoveredTerm.startsWith(s.key + '_') ||
                                                    s.sym.includes(hoveredTerm)
                                                );
                                                return (
                                                    <div key={i} className={`transition-all duration-200 rounded px-1 flex items-center gap-1 ${isHovered ? 'bg-indigo-500/30 text-white font-bold ring-1 ring-indigo-400' : ''}`}>
                                                        <span className="text-indigo-300 font-bold" dangerouslySetInnerHTML={{ __html: s.sym }} />
                                                        <span>=</span>
                                                        <span>{s.desc}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}

                                    <div className={`p-8 flex flex-col items-center justify-center flex-1 transition-colors ${darkMode ? 'bg-slate-950' : 'bg-white'}`}>
                                        {<EquationWorkspace {...equationWorkspaceProps} />}
                                    </div>
                                </div>
                            )}

                            {activeTutorScript && (
                                <TutorPanel
                                    script={activeTutorScript}
                                    level="tutor"
                                    inline={true}
                                    darkMode={darkMode}
                                    onClose={() => setActiveTutorScript(null)}
                                />
                            )}

                            {displayFormulaId === 'none' && (
                                <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 text-center">
                                    <h3 className="font-bold text-slate-700 mb-2">Describing Shape</h3>
                                    <p className="text-sm text-slate-600 mb-4">Instead of a formula, we look at symmetry (Skewness) and peak height (Kurtosis).</p>
                                </div>
                            )}
                        </div>
                    )}

                    <div className={(currentStepId === 'res_probability' || currentStepId === 'res_nhst' || activeResultSection === 'lessons' || isStructuredResultPage) ? 'lg:col-span-12' : 'lg:col-span-8'}>
                        <div className={`border rounded-xl p-6 h-full flex flex-col min-h-[400px] transition-colors ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                            <h4 className={`font-bold mb-2 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}><BarChart2 className="w-4 h-4 text-indigo-400" /> Visual Concept</h4>
                            <div className={`flex-1 flex items-stretch justify-center rounded-lg min-h-[250px] transition-colors ${displayVisualType === 'anova' || displayVisualType === 'factorial_anova' || displayVisualType === 'ancova' ? '' : (darkMode ? 'bg-slate-950/50 border border-dashed border-slate-800' : 'bg-slate-50/50 border border-dashed border-slate-200')}`}>
                                {<ResultVisualizer {...visualizerProps} teachingMode={true} />}
                            </div>
                        </div>
                    </div>
                </div>

                {currentStep?.assumptions && currentStep?.assumptions.length > 0 && (
                    <div className={`border rounded-xl p-6 transition-colors ${darkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200'}`}>
                        <h3 className={`text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                            <CheckCircle className="w-4 h-4" /> Assumptions to Check
                        </h3>
                        <div className="space-y-3">
                            {currentStep?.assumptions.map((a, i) => (
                                <AssumptionItem key={i} assumption={a} darkMode={darkMode} />
                            ))}
                        </div>
                    </div>
                )}

                <div className={`border-t pt-8 ${darkMode ? 'border-slate-800' : 'border-slate-100'}`}>
                    <h3 className={`text-sm font-bold uppercase tracking-wider mb-4 ${darkMode ? 'text-slate-600' : 'text-slate-400'}`}>Part 2: Run the Test</h3>
                    <div className={`rounded-xl border overflow-hidden transition-colors ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                        <div className={`flex border-b px-4 pt-4 gap-2 overflow-x-auto no-scrollbar transition-colors ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                            <TabButton label="SPSS" icon={MousePointer2} active={activeTab === 'spss'} onClick={() => setActiveTab('spss')} darkMode={darkMode} />
                            <TabButton label="JASP" icon={CheckCircle} active={activeTab === 'jasp'} onClick={() => setActiveTab('jasp')} darkMode={darkMode} />
                            <TabButton label="Excel" icon={Grid} active={activeTab === 'excel'} onClick={() => setActiveTab('excel')} darkMode={darkMode} />
                            <TabButton label="G-Sheets" icon={Grid} active={activeTab === 'google_sheets'} onClick={() => setActiveTab('google_sheets')} darkMode={darkMode} />
                            <TabButton label="R Code" icon={Terminal} active={activeTab === 'r'} onClick={() => setActiveTab('r')} darkMode={darkMode} />
                        </div>
                        <div className={`p-6 min-h-[100px] transition-colors ${darkMode ? 'bg-slate-900 shadow-inner' : 'bg-white'}`}>
                            <p className={`whitespace-pre-wrap leading-relaxed font-medium ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                                {activeTab === 'spss' && currentSoftware?.spss}
                                {activeTab === 'jasp' && currentSoftware?.jasp}
                                {activeTab === 'excel' && currentSoftware?.excel}
                                {activeTab === 'google_sheets' && (currentSoftware?.google_sheets || currentSoftware?.excel)}
                                {activeTab === 'r' && currentSoftware?.r}
                            </p>
                        </div>
                    </div>
                </div>
                </>
                )}
            </div>
        </PowerNavigationContext.Provider>
    );
}
