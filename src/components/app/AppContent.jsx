import { lazy } from "react";
import { ArrowRight, LayoutGrid } from "lucide-react";
import { STEPS } from "../../data/wizardSteps";
import MainMenu from "../../components/navigation/MainMenu";
import ResultPage from "./ResultPage.jsx";
const ModulesView = lazy(() => import('../../components/navigation/ModulesView'));
const SearchView = lazy(() => import('../../components/navigation/SearchView'));
const LessonsView = lazy(() => import('../../components/navigation/LessonsView'));
const DataManagerPage = lazy(() => import('../../components/data/DataManagerPage'));
const PowerAnalysisHub = lazy(() => import('../../components/power/PowerAnalysisHub'));

export default function AppContent({
        appMode, darkMode, setAppMode, openStep, searchQuery,
        setSearchQuery, handleOpenPowerCalculator, isResult, isHelp,
        currentStepId, currentStep, handleOptionClick, resultProps, history,
}) {
    return (
    <main className="max-w-[1400px] mx-auto p-4 md:p-8">
        <div className="mb-12">
            {appMode === 'menu' && (
                <div className="text-center mb-12 animate-in fade-in slide-in-from-top-4 duration-1000">
                    <div className="mb-8 flex justify-center">
                        <img
                            src={`${import.meta.env.BASE_URL}statwizard.png`}
                            alt="StatWizard artwork"
                            className="w-full max-w-[540px]"
                        />
                    </div>
                    <h2 className={`text-5xl md:text-7xl font-black mb-6 tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                        Master Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400">Data.</span>
                    </h2>
                    <p className={`text-xl md:text-2xl font-light max-w-3xl mx-auto leading-relaxed ${darkMode ? 'text-slate-500' : 'text-slate-600'}`}>
                        Whether you're an expert researcher or a student starting out, choose your path to statistical clarity.
                    </p>
                </div>
            )}

            {appMode === 'menu' && <MainMenu onSelect={setAppMode} darkMode={darkMode} />}

            {appMode === 'modules' && <ModulesView onSelect={openStep} darkMode={darkMode} />}

            {appMode === 'search' && <SearchView searchQuery={searchQuery} setSearchQuery={setSearchQuery} onSelect={openStep} darkMode={darkMode} />}

            {appMode === 'power' && (
                <PowerAnalysisHub
                    darkMode={darkMode}
                    onOpenCalculator={handleOpenPowerCalculator}
                />
            )}

            {appMode === 'lessons' && <LessonsView darkMode={darkMode} />}

            {appMode === 'data_manager' && (
                <DataManagerPage
                    darkMode={darkMode}
                    onOpenAnalysis={(analysisId) => {
                        const nextStepIdByAnalysisId = {
                            pearson_correlation: 'correlation_result',
                            multiple_regression: 'multiple_regression_result',
                            one_sample_t_test: 'res_onesample_ttest',
                            independent_t_test: 'res_indep_ttest',
                            paired_t_test: 'res_paired_ttest',
                            one_way_anova: 'res_one_way_anova',
                            ancova: 'res_ancova',
                            factorial_anova: 'res_factorial_anova',
                        };
                        const nextStepId = nextStepIdByAnalysisId[analysisId] || null;

                        if (!nextStepId) {
                            return;
                        }

                        openStep(nextStepId, { section: 'calculator' });
                    }}
                />
            )}

            {appMode === 'wizard' && (
                <div className={`rounded-2xl shadow-xl border ${isResult ? 'overflow-visible' : 'overflow-hidden'} transition-all duration-300 ${darkMode ? 'bg-slate-900 border-slate-800 shadow-2xl shadow-black/50' : 'bg-white border-slate-200'} ${isHelp ? (darkMode ? 'border-amber-500/30 ring-4 ring-amber-500/10' : 'border-amber-200 shadow-amber-100 ring-4 ring-amber-50') : ''}`}>
                    {!isResult && (
                        <div className={`p-6 md:p-8 ${isHelp ? (darkMode ? 'bg-amber-950/20 text-slate-200' : 'bg-amber-50 text-slate-900') : (darkMode ? 'bg-slate-900' : 'bg-white')}`}>
                            <div className="flex justify-between items-center mb-4">
                                <span className="text-indigo-400 font-bold tracking-wider text-xs uppercase block">
                                    {isHelp ? 'Clarification' : `Question ${history.filter(id => !STEPS[id]?.type).indexOf(currentStepId) + 1}`}
                                </span>
                                {history.length === 1 && (
                                    <button onClick={() => setAppMode('menu')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${darkMode ? 'bg-slate-800 text-slate-500 hover:text-white' : 'bg-slate-100 text-slate-400 hover:text-slate-900'}`}>
                                        <LayoutGrid className="w-3 h-3" /> All Modes
                                    </button>
                                )}
                            </div>
                            {currentStep?.title && currentStep?.question && currentStep.title !== currentStep.question && (
                                <p className={`text-sm md:text-base font-black uppercase tracking-[0.25em] mb-3 ${darkMode ? 'text-indigo-400/80' : 'text-indigo-600'}`}>
                                    {currentStep.title}
                                </p>
                            )}
                            <h2 className={`text-2xl md:text-4xl font-extrabold mb-4 ${darkMode ? 'text-white' : 'text-slate-900'}`}>{currentStep?.question || currentStep?.title}</h2>
                            {currentStep?.description && <p className={`text-lg md:text-xl font-light leading-relaxed max-w-3xl ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>{currentStep?.description}</p>}
                            <div className="mt-8 grid gap-4">
                                {currentStep?.options?.map((option, idx) => (
                                    <button key={idx} onClick={() => handleOptionClick(option)} className={`flex items-center justify-between p-6 text-left border-2 rounded-xl transition-all duration-200 group ${darkMode ? 'border-slate-800 bg-slate-900/50 hover:border-indigo-500 hover:bg-indigo-500/10' : 'border-slate-100 bg-white hover:border-indigo-600 hover:bg-indigo-50 hover:shadow-md'}`}>
                                        <span className={`text-lg font-semibold transition-colors ${darkMode ? 'text-slate-300 group-hover:text-indigo-400' : 'text-slate-700 group-hover:text-indigo-700'}`}>{option.label}</span>
                                        <ArrowRight className={`w-5 h-5 transition-colors ${darkMode ? 'text-slate-700 group-hover:text-indigo-500' : 'text-slate-300 group-hover:text-indigo-600'}`} />
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {isResult && <ResultPage {...resultProps} />}
                </div>
            )}
        </div>
    </main>

    );
}
