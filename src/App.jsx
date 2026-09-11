import { Suspense, useState, useEffect, useMemo } from "react";
import { SYMBOL_KEYS } from "./data/symbolKeys";
import ErrorBoundary from "./components/common/ErrorBoundary";
import Header from "./components/common/Header";
import RouteLoadingFallback from "./components/common/RouteLoadingFallback";
import useAutoReload from "./hooks/useAutoReload";
import useAnovaTutor from "./hooks/useAnovaTutor";
import useFactorialAnovaTutor from "./hooks/useFactorialAnovaTutor";
import useAncovaTutor from "./hooks/useAncovaTutor";
import UpdateToast from "./components/common/UpdateToast";
import { DatasetLibraryProvider } from "./hooks/useDatasetLibrary";
import AppContent from "./components/app/AppContent.jsx";
import AppOverlays from "./components/app/AppOverlays.jsx";

import useAppNavigation from './routing/useAppNavigation.js';
import { getResultPage } from './routing/resultPageConfig.js';

// --- STUB: generateAIResponse ---
const generateAIResponse = async (prompt) => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve("This is a simulated AI response for the prompt: " + prompt);
        }, 1000);
    });
};

// --- MAIN APP ---
export default function App() {
    const {
        appMode, currentStepId, history, answers, resultSection, powerMode,
        restoreCount, openPage: setAppMode, openStep,
        selectSection, selectPowerMode, chooseOption: handleOptionClick, restart,
    } = useAppNavigation();
    const [searchQuery, setSearchQuery] = useState('');
    const [report, setReport] = useState("");
    const [activeTab, setActiveTab] = useState('spss');
    const [mathHistory, setMathHistory] = useState([]);
    const [aiLoading, setAiLoading] = useState(false);
    const [aiExplanation, setAiExplanation] = useState(null);
    const [aiModalOpen, setAiModalOpen] = useState(false);
    const [symbolKeyOpen, setSymbolKeyOpen] = useState(false);
    const [darkMode, setDarkMode] = useState(true);
    const [activeTutorScript, setActiveTutorScript] = useState(null);
    const [showEquationValues, setShowEquationValues] = useState(false);
    const [currentStats, setCurrentStats] = useState(null);
    const [hoveredTerm, setHoveredTerm] = useState(null);
    const [activeExplanation, setActiveExplanation] = useState(null);
    const [showHistory, setShowHistory] = useState(false);
    const [showEquationPanel, setShowEquationPanel] = useState(true);
    const [tooltipsEnabled, setTooltipsEnabled] = useState(() => {
        try {
            return localStorage.getItem('statwizard_tooltips_enabled') !== 'false';
        } catch {
            return true;
        }
    });

    // --- 3. STATE WITH INITIALIZERS / SIDE EFFECTS ---
    const [anovaIsFirstVisit, setAnovaIsFirstVisit] = useState(() => {
        try {
            return !localStorage.getItem('anova_tutor_onboarded');
        } catch (e) {
            return true;
        }
    });

    useEffect(() => {
        const handleTooltipPreference = (event) => setTooltipsEnabled(event.detail !== false);
        window.addEventListener('statwizardTooltipsChanged', handleTooltipPreference);
        return () => window.removeEventListener('statwizardTooltipsChanged', handleTooltipPreference);
    }, []);

    // --- 4. CUSTOM HOOKS ---
    const { updateAvailable, reload: reloadForUpdate, dismiss: dismissUpdate } = useAutoReload();

    useEffect(() => {
        setMathHistory([]);
        setAiExplanation(null);
        setAiModalOpen(false);
        setActiveTutorScript(null);
    }, [restoreCount]);

    const resultPage = useMemo(() => getResultPage(currentStepId), [currentStepId]);
    const {
        currentStep,
        currentTestConfig,
        isPearsonCorrelationPage,
        isSimpleLinearRegressionPage,
        isMultipleRegressionPage,
        isOneSampleTTestPage,
        isCentralTendencyPage,
        isVariabilityPage,
        isFrequencyPage,
        isProbabilityPage,
        isIndependentTTestPage,
        isPairedTTestPage,
        isOneWayAnovaPage,
        isFactorialAnovaPage,
        isAncovaPage,
        isResult,
        isHelp,
        isStructuredResultPage,
        availableResultSections,
    } = resultPage;
    const activeResultSection = resultSection || (isStructuredResultPage ? 'lessons' : 'calculator');
    const pendingPowerLaunch = activeResultSection === 'power' ? { stepId: currentStepId, mode: powerMode } : null;

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setMathHistory([]);
        setActiveTab('spss');
        setSymbolKeyOpen(false);
        setShowEquationPanel(true);
        setActiveTutorScript(null);
    }, [currentStepId]);

    const handleBack = () => {
        // Just call browser back - if we have history within the app, it will pop.
        // If we don't (e.g. at Menu), it will go to last site.
        window.history.back();
    };

    const handleRestart = () => {
        restart();
        setReport("");
        setAiExplanation(null);
        setMathHistory([]);
    };

    const handleOpenPowerCalculator = (testConfig, mode) => {
        openStep(testConfig.stepId, { section: 'power', mode });
        setActiveTutorScript(null);
        setMathHistory([]);
    };
    const pushMathTerm = (term) => {
        if (!term) {
            return;
        }

        setMathHistory((previous) => [...previous, term]);
    };
    const popMathTerm = () => {
        setMathHistory((previous) => previous.slice(0, -1));
    };
    const closeMath = () => setMathHistory([]);
    const closeMathFromIndex = (index) => {
        setMathHistory((previous) => previous.slice(0, index));
    };
    const activeMathTermKey = mathHistory.length > 0 ? mathHistory[mathHistory.length - 1] : null;

    const toggleDarkMode = () => setDarkMode(!darkMode);
    const toggleTooltips = () => {
        setTooltipsEnabled((previous) => {
            const next = !previous;
            try {
                localStorage.setItem('statwizard_tooltips_enabled', String(next));
            } catch {
                // The preference still applies for this session when storage is unavailable.
            }
            window.dispatchEvent(new CustomEvent('statwizardTooltipsChanged', { detail: next }));
            return next;
        });
    };

    const anovaTutorContext = useMemo(() => ({
        isFirstVisit: anovaIsFirstVisit,
        activePanel: mathHistory.length > 0 ? mathHistory[mathHistory.length - 1] : null, // activeMathTermKey
        hoveredTerm: hoveredTerm,
        showValues: showEquationValues,
        isSymbolKeyFirstOpen: symbolKeyOpen,
    }), [anovaIsFirstVisit, mathHistory, hoveredTerm, showEquationValues, symbolKeyOpen]);

    const anovaTutor = useAnovaTutor(currentStats, anovaTutorContext, currentStepId, tooltipsEnabled);
    const factorialAnovaTutor = useFactorialAnovaTutor(currentStats, anovaTutorContext, tooltipsEnabled);
    const ancovaTutor = useAncovaTutor(currentStats, anovaTutorContext, tooltipsEnabled);

    const isAnovaTrulyActive = currentStepId === 'res_anova' || currentStepId === 'res_one_way_anova' || currentStepId === 'res_rm_anova' || currentStepId === 'res_ancova' || currentStep?.visualType === 'anova' || currentStep?.visualType === 'ancova';
    const isAnovaActive = isAnovaTrulyActive;

    // The tutor logic itself handles its own onboarded/dismissed state via anovaTutorScripts
    // and useAnovaTutor's persistence. We just need to track if it's the first visit session-wise
    // to pass down as context if needed.

    // Higher-level visibility sync
    useEffect(() => {
        if (!isAnovaActive && anovaTutor.activeTip) {
            anovaTutor.dismissTip(anovaTutor.activeTip.id);
        }
        if (currentStepId !== 'res_factorial_anova' && factorialAnovaTutor.activeTip) {
            factorialAnovaTutor.dismissTip(factorialAnovaTutor.activeTip.id);
        }
    }, [isAnovaActive, anovaTutor, currentStepId, factorialAnovaTutor]);


    const askAI = async (context) => {
        setAiLoading(true);
        setAiModalOpen(true);
        let prompt = "";
        if (context === 'generate_report') {
            prompt = `Write a formal "Data Analysis Plan" paragraph for a research proposal. Context:\n${JSON.stringify(answers)}\nTest: ${currentStep?.title}.`;
        }
        const response = await generateAIResponse(prompt);
        setAiExplanation(response);
        setAiLoading(false);
        if (context === 'generate_report') setReport(response);
    };

    let displayFormulaId = currentStep?.formulaId;
    let displayVisualType = currentStep?.visualType;
    let currentSoftware = currentStep?.software;

    if (currentStepId === 'res_variability') {
        displayFormulaId = 'variability';
    }
    if (currentStepId === 'res_frequency') {
        displayFormulaId = 'frequency';
    }
    if (currentStepId === 'res_probability') {
        displayFormulaId = 'probability_rules';
    }

    // --- SYMBOL KEY LOGIC ---
    let relevantSymbols = SYMBOL_KEYS.sd;
    if (displayFormulaId && SYMBOL_KEYS[displayFormulaId]) relevantSymbols = SYMBOL_KEYS[displayFormulaId];
    const safeRelevantSymbols = Array.isArray(relevantSymbols) ? relevantSymbols : [];
    // Equation tabs have enough horizontal space for the standard interactive
    // formula workspace, including its inline term links and detail cards.
    const useSafeGenericEquationCard = false;

    const showStructuredCalculator = Boolean(currentTestConfig) && activeResultSection === 'calculator';
    const handleResultSectionChange = (nextSection) => {
        selectSection(nextSection);

        if (nextSection !== 'lessons') {
            setActiveTutorScript(null);
        }
    };

    const equationWorkspaceProps = {
        mathHistory, darkMode, popMathTerm, closeMathFromIndex, pushMathTerm,
        setHoveredTerm, showEquationValues, currentStats, displayFormulaId,
    };
    const equationProps = {
        darkMode, displayFormulaId, showEquationPanel, setShowEquationValues, showEquationValues,
        setSymbolKeyOpen, symbolKeyOpen, setShowEquationPanel, safeRelevantSymbols, hoveredTerm,
        pushMathTerm, equationWorkspaceProps,
    };
    const visualizerProps = {
        displayVisualType, activeMathTermKey, darkMode, showEquationValues, setActiveTutorScript,
        setCurrentStats, anovaTutor, factorialAnovaTutor, ancovaTutor, displayFormulaId,
    };
    const resultProps = {
        selectPowerMode,
        darkMode, currentStep, availableResultSections, activeResultSection, handleResultSectionChange,
        isCentralTendencyPage, displayFormulaId, equationProps, isVariabilityPage, setCurrentStats,
        isFrequencyPage, isProbabilityPage, isPearsonCorrelationPage, currentStats, currentTestConfig,
        pendingPowerLaunch, currentStepId, isSimpleLinearRegressionPage, isMultipleRegressionPage, setAppMode,
        isOneSampleTTestPage, setActiveTutorScript, activeTutorScript, isIndependentTTestPage, isPairedTTestPage,
        isOneWayAnovaPage, anovaTutor, showEquationValues, isFactorialAnovaPage, isAncovaPage,
        showStructuredCalculator, displayVisualType, visualizerProps, isStructuredResultPage, setShowEquationValues,
        setSymbolKeyOpen, symbolKeyOpen, safeRelevantSymbols, hoveredTerm, equationWorkspaceProps,
        activeTab, setActiveTab, currentSoftware,
    };
    const contentProps = {
        history,
        appMode, darkMode, setAppMode, openStep, searchQuery,
        setSearchQuery, handleOpenPowerCalculator, isResult, isHelp,
        currentStepId, currentStep, handleOptionClick, resultProps,
    };
    const overlayProps = {
        aiModalOpen, darkMode, setAiModalOpen, aiLoading, aiExplanation,
        activeExplanation, setActiveExplanation, showHistory, setShowHistory, anovaTutor,
        isAnovaActive, setShowEquationValues, showEquationValues, currentStats, currentStepId,
        factorialAnovaTutor, ancovaTutor,
    };

    return (
        <ErrorBoundary>
            <DatasetLibraryProvider>
                <Suspense fallback={<RouteLoadingFallback darkMode={darkMode} />}>
                <div className={`min-h-screen transition-colors duration-500 font-sans selection:bg-indigo-500/30 pb-20 ${darkMode ? 'bg-slate-950 text-slate-200' : 'bg-slate-50 text-slate-800'}`}>
                <Header onBack={handleBack} onHome={handleRestart} canGoBack={appMode !== 'menu'} darkMode={darkMode} onToggleDarkMode={toggleDarkMode} tooltipsEnabled={tooltipsEnabled} onToggleTooltips={toggleTooltips} />
                {appMode === 'wizard' && !isHelp && <div className="w-full bg-slate-200 h-1.5"><div className="bg-indigo-600 h-1.5 transition-all duration-700 ease-out" style={{ width: `${Math.min((history.length / 5) * 100, 100)}%` }} /></div>}

                <AppContent {...contentProps} />
                <AppOverlays {...overlayProps} />

                {updateAvailable && <UpdateToast onReload={reloadForUpdate} onDismiss={dismissUpdate} />}
                </div>
                </Suspense>
            </DatasetLibraryProvider>
        </ErrorBoundary>
    );
}
