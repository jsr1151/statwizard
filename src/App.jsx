// StatWizard - Modular Architecture
// App.jsx - Orchestration Layer

import React, { lazy, Suspense, useState, useEffect, useMemo, useRef } from 'react';
import { ArrowRight, LayoutGrid } from 'lucide-react';

// --- Data ---
import { STEPS } from './data/wizardSteps';
import { MATH_TERMS } from './data/mathTerms';

// --- Common Components ---
import ErrorBoundary from './components/common/ErrorBoundary';
import Header from './components/common/Header';
import RouteLoadingFallback from './components/common/RouteLoadingFallback';

// --- Hooks ---
import useAutoReload from './hooks/useAutoReload';
import useAnovaTutor from './hooks/useAnovaTutor';
import useFactorialAnovaTutor from './hooks/useFactorialAnovaTutor';
import useAncovaTutor from './hooks/useAncovaTutor';
import { hasStoredValue } from './utils/storage';
import { parseAppRoute, serializeAppRoute } from './routing/appRoutes';

// --- Navigation ---
import MainMenu from './components/navigation/MainMenu';
import UpdateToast from './components/common/UpdateToast';
import { getResultPresentation } from './components/results/resultPresentation';

// --- Tutor Components ---
import { POWER_ROUTE_BY_STEP_ID } from './power/powerRouteRegistry';

const LessonsView = lazy(() => import('./components/navigation/LessonsView'));
const ModulesView = lazy(() => import('./components/navigation/ModulesView'));
const PowerAnalysisHub = lazy(() => import('./components/power/PowerAnalysisHub'));
const ResultPageShell = lazy(() => import('./components/results/ResultPageShell'));
const SearchView = lazy(() => import('./components/navigation/SearchView'));
const TutorOverlayHost = lazy(() => import('./components/tutor/TutorOverlayHost'));

const getDefaultResultSection = (stepId) => (POWER_ROUTE_BY_STEP_ID[stepId] ? 'lessons' : 'calculator');

const parseRoute = (hash) =>
  parseAppRoute(hash, {
    isValidStep: (stepId) => Boolean(STEPS[stepId]),
    isValidResultSection: (stepId, section) => Boolean(POWER_ROUTE_BY_STEP_ID[stepId]) && ['lessons', 'calculator', 'effect_size', 'power'].includes(section),
    isValidPowerMode: (stepId, mode) => POWER_ROUTE_BY_STEP_ID[stepId]?.implementedPowerModes.includes(mode) || false,
  });

const buildDefaultWizardHistory = (route) => (route.appMode === 'wizard' && route.currentStepId !== 'start' ? ['start', route.currentStepId] : ['start']);

const restoreNavigationState = (route, historyState) => {
  const stateMatchesRoute = historyState && historyState.appMode === route.appMode && historyState.currentStepId === route.currentStepId;

  return {
    history: stateMatchesRoute && Array.isArray(historyState.history) ? historyState.history : buildDefaultWizardHistory(route),
    answers: stateMatchesRoute && historyState.answers && typeof historyState.answers === 'object' && !Array.isArray(historyState.answers) ? historyState.answers : {},
  };
};

// --- MAIN APP ---
export default function App() {
  // --- 1. CORE REFS (Top priority to avoid TDZ/hoisting issues) ---
  const initialRouteRef = useRef(null);
  const hasSyncedInitialRouteRef = useRef(false);

  if (!initialRouteRef.current) {
    const route = parseRoute(typeof window === 'undefined' ? '#/' : window.location.hash);
    const restored = restoreNavigationState(route, typeof window === 'undefined' ? null : window.history.state);
    initialRouteRef.current = { route, ...restored };
  }

  const initialNavigation = initialRouteRef.current;

  // --- 2. STANDARD STATE ---
  const [appMode, setAppMode] = useState(initialNavigation.route.appMode);
  const [searchQuery, setSearchQuery] = useState('');
  const [history, setHistory] = useState(initialNavigation.history);
  const [answers, setAnswers] = useState(initialNavigation.answers);
  const [currentStepId, setCurrentStepId] = useState(initialNavigation.route.currentStepId);
  const [activeTab, setActiveTab] = useState('spss');
  const [variabilityTab, setVariabilityTab] = useState('sd');
  const [probabilityTab, setProbabilityTab] = useState('basics');
  const [mathHistory, setMathHistory] = useState([]);
  const [symbolKeyOpen, setSymbolKeyOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [activeTutorScript, setActiveTutorScript] = useState(null);
  const [showEquationValues, setShowEquationValues] = useState(false);
  const [currentStats, setCurrentStats] = useState(null);
  const [hoveredTerm, setHoveredTerm] = useState(null);
  const [activeResultSection, setActiveResultSection] = useState(initialNavigation.route.resultSection || getDefaultResultSection(initialNavigation.route.currentStepId));
  const [pendingPowerLaunch, setPendingPowerLaunch] = useState(() =>
    initialNavigation.route.resultSection === 'power'
      ? {
          stepId: initialNavigation.route.currentStepId,
          mode: initialNavigation.route.powerMode || undefined,
        }
      : null,
  );

  // --- 3. STATE WITH INITIALIZERS / SIDE EFFECTS ---
  const [anovaIsFirstVisit] = useState(() => !hasStoredValue({ key: 'anova_tutor_onboarded' }));

  // --- 4. CUSTOM HOOKS ---
  const { updateAvailable, reload: reloadForUpdate, dismiss: dismissUpdate } = useAutoReload();

  // --- BROWSER HISTORY SYNC ---
  useEffect(() => {
    const initialRoute = initialRouteRef.current.route;

    if (!initialRoute.valid || window.location.hash !== initialRoute.canonicalHash) {
      window.history.replaceState(window.history.state, '', initialRoute.canonicalHash);
    }

    const handleNavigation = () => {
      const route = parseRoute(window.location.hash);
      const restored = restoreNavigationState(route, window.history.state);
      const resultSection = route.resultSection || getDefaultResultSection(route.currentStepId);
      const canonicalHash = serializeAppRoute({
        appMode: route.appMode,
        currentStepId: route.currentStepId,
        resultSection: route.appMode === 'wizard' && POWER_ROUTE_BY_STEP_ID[route.currentStepId] ? resultSection : null,
        powerMode: route.powerMode,
      });

      setAppMode(route.appMode);
      setCurrentStepId(route.currentStepId);
      setHistory(restored.history);
      setAnswers(restored.answers);
      setActiveResultSection(resultSection);
      setPendingPowerLaunch(route.resultSection === 'power' ? { stepId: route.currentStepId, mode: route.powerMode || undefined } : null);

      // Clear ephemeral UI state while retaining in-session route state.
      setMathHistory([]);

      if (!route.valid || window.location.hash !== canonicalHash) {
        window.history.replaceState(
          {
            appMode: route.appMode,
            currentStepId: route.currentStepId,
            history: restored.history,
            answers: restored.answers,
            activeResultSection: resultSection,
          },
          '',
          canonicalHash,
        );
      }
    };

    window.addEventListener('popstate', handleNavigation);
    window.addEventListener('hashchange', handleNavigation);

    return () => {
      window.removeEventListener('popstate', handleNavigation);
      window.removeEventListener('hashchange', handleNavigation);
    };
  }, []);

  // Sync app state TO browser history
  useEffect(() => {
    const currentTest = POWER_ROUTE_BY_STEP_ID[currentStepId] || null;
    const resultSection = appMode === 'wizard' && currentTest ? activeResultSection : null;
    const powerMode = resultSection === 'power' && pendingPowerLaunch?.stepId === currentStepId ? pendingPowerLaunch.mode : null;
    const statePayload = {
      appMode,
      currentStepId,
      history,
      answers,
      activeResultSection: resultSection,
      powerMode,
    };
    const newHash = serializeAppRoute({
      appMode,
      currentStepId,
      resultSection,
      powerMode,
    });

    if (!hasSyncedInitialRouteRef.current) {
      hasSyncedInitialRouteRef.current = true;
      window.history.replaceState(statePayload, '', newHash);
      return;
    }

    // Only PUSH if the identifying URL characteristics (hash) changed
    // Use REPLACE for internal state changes that shouldn't clog the back stack
    if (window.location.hash !== newHash) {
      window.history.pushState(statePayload, '', newHash);
    } else {
      window.history.replaceState(statePayload, '', newHash);
    }
  }, [appMode, currentStepId, history, answers, activeResultSection, pendingPowerLaunch]);

  const currentStep = STEPS[currentStepId];
  const isResult = currentStep?.type === 'result';
  const isHelp = currentStep?.type === 'help';

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setMathHistory([]);
    setActiveTab('spss');
    setVariabilityTab('sd');
    setProbabilityTab('basics');
    setSymbolKeyOpen(false);
  }, [currentStepId]);

  useEffect(() => {
    if (appMode !== 'wizard') {
      setPendingPowerLaunch(null);
    }
  }, [appMode]);

  const handleOptionClick = (option) => {
    const nextStepId = option.next;
    setAnswers({ ...answers, [currentStepId]: option.label });
    setHistory([...history, nextStepId]);
    setCurrentStepId(nextStepId);
    setActiveResultSection(getDefaultResultSection(nextStepId));
    setPendingPowerLaunch(null);
  };

  const handleBack = () => {
    // Just call browser back - if we have history within the app, it will pop.
    // If we don't (e.g. at Menu), it will go to last site.
    window.history.back();
  };

  const handleRestart = () => {
    setAppMode('menu');
    setHistory(['start']);
    setAnswers({});
    setCurrentStepId('start');
    setMathHistory([]);
    setActiveResultSection('calculator');
    setPendingPowerLaunch(null);
  };

  const handleOpenPowerCalculator = (testConfig, mode) => {
    setPendingPowerLaunch({ stepId: testConfig.stepId, mode });
    setCurrentStepId(testConfig.stepId);
    setAppMode('wizard');
    setActiveResultSection('power');
    setActiveTutorScript(null);
    setMathHistory([]);
  };
  const pushMathTerm = (term) => setMathHistory([...mathHistory, term]);
  const popMathTerm = () => {
    const newHistory = [...mathHistory];
    newHistory.pop();
    setMathHistory(newHistory);
  };
  const closeMath = () => setMathHistory([]);
  const activeMathTermKey = mathHistory.length > 0 ? mathHistory[mathHistory.length - 1] : null;
  const activeMathTerm = activeMathTermKey ? MATH_TERMS[activeMathTermKey] : null;

  const toggleDarkMode = () => setDarkMode(!darkMode);

  const anovaTutorContext = useMemo(
    () => ({
      isFirstVisit: anovaIsFirstVisit,
      activePanel: mathHistory.length > 0 ? mathHistory[mathHistory.length - 1] : null, // activeMathTermKey
      hoveredTerm: hoveredTerm,
      showValues: showEquationValues,
      isSymbolKeyFirstOpen: symbolKeyOpen,
    }),
    [anovaIsFirstVisit, mathHistory, hoveredTerm, showEquationValues, symbolKeyOpen],
  );

  const isAnovaActive = currentStepId === 'res_anova' || currentStepId === 'res_one_way_anova' || currentStepId === 'res_rm_anova' || currentStep?.visualType === 'anova';
  const isFactorialAnovaActive = currentStepId === 'res_factorial_anova' || currentStep?.visualType === 'factorial_anova';
  const isAncovaActive = currentStepId === 'res_ancova' || currentStep?.visualType === 'ancova';

  const anovaTutor = useAnovaTutor(currentStats, anovaTutorContext, isAnovaActive);
  const factorialAnovaTutor = useFactorialAnovaTutor(currentStats, anovaTutorContext, isFactorialAnovaActive);
  const ancovaTutor = useAncovaTutor(currentStats, anovaTutorContext, isAncovaActive);

  const resultPresentation = getResultPresentation({
    step: currentStep,
    stepId: currentStepId,
    variabilityTab,
  });

  return (
    <ErrorBoundary resetKey={`${appMode}-${currentStepId}`} onReturnHome={handleRestart}>
      <div
        className={`min-h-screen transition-colors duration-500 font-sans selection:bg-indigo-500/30 pb-20 ${darkMode ? 'bg-slate-950 text-slate-200' : 'bg-slate-50 text-slate-800'}`}
      >
        <Header onBack={handleBack} onHome={handleRestart} canGoBack={appMode !== 'menu'} darkMode={darkMode} onToggleDarkMode={toggleDarkMode} />
        {appMode === 'wizard' && !isHelp && (
          <div className="w-full bg-slate-200 h-1.5">
            <div className="bg-indigo-600 h-1.5 transition-all duration-700 ease-out" style={{ width: `${Math.min((history.length / 5) * 100, 100)}%` }} />
          </div>
        )}

        <main className="max-w-[1400px] mx-auto p-4 md:p-8">
          <div className="mb-12">
            {appMode === 'menu' && (
              <div className="text-center mb-12 animate-in fade-in slide-in-from-top-4 duration-1000">
                <h2 className={`text-5xl md:text-7xl font-black mb-6 tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                  Master Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400">Data.</span>
                </h2>
                <p className={`text-xl md:text-2xl font-light max-w-3xl mx-auto leading-relaxed ${darkMode ? 'text-slate-500' : 'text-slate-600'}`}>
                  Whether you're an expert researcher or a student starting out, choose your path to statistical clarity.
                </p>
              </div>
            )}

            {appMode === 'menu' && <MainMenu onSelect={setAppMode} darkMode={darkMode} />}

            <Suspense fallback={<RouteLoadingFallback darkMode={darkMode} />}>
              {appMode === 'modules' && (
                <ModulesView
                  onSelect={(id) => {
                    setCurrentStepId(id);
                    setActiveResultSection(getDefaultResultSection(id));
                    setPendingPowerLaunch(null);
                    setAppMode('wizard');
                  }}
                  darkMode={darkMode}
                />
              )}

              {appMode === 'search' && (
                <SearchView
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  onSelect={(id) => {
                    setCurrentStepId(id);
                    setActiveResultSection(getDefaultResultSection(id));
                    setPendingPowerLaunch(null);
                    setAppMode('wizard');
                  }}
                  darkMode={darkMode}
                />
              )}

              {appMode === 'power' && <PowerAnalysisHub darkMode={darkMode} onOpenCalculator={handleOpenPowerCalculator} />}

              {appMode === 'lessons' && <LessonsView darkMode={darkMode} />}

              {appMode === 'wizard' && (
                <div
                  className={`rounded-2xl shadow-xl border overflow-hidden transition-all duration-300 ${darkMode ? 'bg-slate-900 border-slate-800 shadow-2xl shadow-black/50' : 'bg-white border-slate-200'} ${isHelp ? (darkMode ? 'border-amber-500/30 ring-4 ring-amber-500/10' : 'border-amber-200 shadow-amber-100 ring-4 ring-amber-50') : ''}`}
                >
                  {!isResult && (
                    <div className={`p-6 md:p-8 ${isHelp ? (darkMode ? 'bg-amber-950/20 text-slate-200' : 'bg-amber-50 text-slate-900') : darkMode ? 'bg-slate-900' : 'bg-white'}`}>
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-indigo-400 font-bold tracking-wider text-xs uppercase block">
                          {isHelp ? 'Clarification' : `Question ${history.filter((id) => !STEPS[id]?.type).indexOf(currentStepId) + 1}`}
                        </span>
                        {history.length === 1 && (
                          <button
                            onClick={() => setAppMode('menu')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${darkMode ? 'bg-slate-800 text-slate-500 hover:text-white' : 'bg-slate-100 text-slate-400 hover:text-slate-900'}`}
                          >
                            <LayoutGrid className="w-3 h-3" /> All Modes
                          </button>
                        )}
                      </div>
                      <h2 className={`text-2xl md:text-4xl font-extrabold mb-4 ${darkMode ? 'text-white' : 'text-slate-900'}`}>{currentStep?.title || currentStep?.question}</h2>
                      {currentStep?.description && <p className="text-lg md:text-xl font-light leading-relaxed max-w-3xl text-slate-600">{currentStep?.description}</p>}
                      <div className="mt-8 grid gap-4">
                        {currentStep?.options?.map((option, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleOptionClick(option)}
                            className={`flex items-center justify-between p-6 text-left border-2 rounded-xl transition-all duration-200 group ${darkMode ? 'border-slate-800 bg-slate-900/50 hover:border-indigo-500 hover:bg-indigo-500/10' : 'border-slate-100 bg-white hover:border-indigo-600 hover:bg-indigo-50 hover:shadow-md'}`}
                          >
                            <span
                              className={`text-lg font-semibold transition-colors ${darkMode ? 'text-slate-300 group-hover:text-indigo-400' : 'text-slate-700 group-hover:text-indigo-700'}`}
                            >
                              {option.label}
                            </span>
                            <ArrowRight
                              className={`w-5 h-5 transition-colors ${darkMode ? 'text-slate-700 group-hover:text-indigo-500' : 'text-slate-300 group-hover:text-indigo-600'}`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {isResult && (
                    <ResultPageShell
                      activeMathTerm={activeMathTerm}
                      activeMathTermKey={activeMathTermKey}
                      activeResultSection={activeResultSection}
                      activeSoftwareTab={activeTab}
                      activeTutorScript={activeTutorScript}
                      ancovaTutor={ancovaTutor}
                      anovaTutor={anovaTutor}
                      currentStats={currentStats}
                      darkMode={darkMode}
                      factorialAnovaTutor={factorialAnovaTutor}
                      formulaId={resultPresentation.formulaId}
                      hoveredTerm={hoveredTerm}
                      mathHistoryLength={mathHistory.length}
                      onCloseMath={closeMath}
                      onHoverTerm={setHoveredTerm}
                      onPopMathTerm={popMathTerm}
                      onPowerModeChange={(mode) => setPendingPowerLaunch({ stepId: currentStepId, mode })}
                      onProbabilityTabChange={setProbabilityTab}
                      onPushMathTerm={pushMathTerm}
                      onResultSectionChange={(section) => {
                        setActiveResultSection(section);
                        if (section !== 'power') setPendingPowerLaunch(null);
                        if (section !== 'lessons') setActiveTutorScript(null);
                      }}
                      onReturnHome={handleRestart}
                      onSoftwareTabChange={setActiveTab}
                      onStatsChange={setCurrentStats}
                      onToggleSymbolKey={() => setSymbolKeyOpen((isOpen) => !isOpen)}
                      onToggleValues={() => setShowEquationValues((showValues) => !showValues)}
                      onTutorScriptChange={setActiveTutorScript}
                      onVariabilityTabChange={setVariabilityTab}
                      pendingPowerMode={pendingPowerLaunch?.stepId === currentStepId ? pendingPowerLaunch?.mode : undefined}
                      probabilityTab={probabilityTab}
                      relevantSymbols={resultPresentation.symbols}
                      showEquationValues={showEquationValues}
                      software={resultPresentation.software}
                      step={currentStep}
                      stepId={currentStepId}
                      symbolKeyOpen={symbolKeyOpen}
                      variabilityTab={variabilityTab}
                      visualType={resultPresentation.visualType}
                    />
                  )}
                </div>
              )}
            </Suspense>
          </div>
        </main>

        {(isAnovaActive || isFactorialAnovaActive || isAncovaActive) && (
          <Suspense fallback={null}>
            <TutorOverlayHost
              ancovaTutor={ancovaTutor}
              anovaTutor={anovaTutor}
              currentStats={currentStats}
              currentStepId={currentStepId}
              darkMode={darkMode}
              factorialAnovaTutor={factorialAnovaTutor}
              isAnovaActive={isAnovaActive}
              onToggleValues={() => setShowEquationValues((showValues) => !showValues)}
            />
          </Suspense>
        )}

        {updateAvailable && <UpdateToast onReload={reloadForUpdate} onDismiss={dismissUpdate} />}
      </div>
    </ErrorBoundary>
  );
}
