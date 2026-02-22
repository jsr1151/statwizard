// StatWizard Alpha - Modular Architecture
// App.jsx - Orchestration Layer

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
    ArrowRight,
    CheckCircle,
    ChevronLeft,
    Sparkles,
    Calculator,
    Terminal,
    MousePointer2,
    XCircle,
    Info,
    BarChart2,
    Grid,
    LayoutGrid,
    X,
    History,
    BookOpen
} from 'lucide-react';

// --- Data ---
import { STEPS } from './data/wizardSteps';
import { MATH_TERMS } from './data/mathTerms';
import { SOFTWARE_GUIDES } from './data/softwareGuides';
import { SYMBOL_KEYS } from './data/symbolKeys';

// --- Common Components ---
import ErrorBoundary from './components/common/ErrorBoundary';
import Header from './components/common/Header';
import TabButton from './components/common/TabButton';
import CalculationText from './components/common/CalculationText';

// --- Tutor ---
import TutorPanel from './components/tutor/TutorPanel';

// --- Formula ---
import FormulaDisplay from './components/formula/FormulaDisplay';
import AssumptionItem from './components/formula/AssumptionItem';

// --- Hooks ---
import useAutoReload from './hooks/useAutoReload';
import useAnovaTutor from './hooks/useAnovaTutor';
import useFactorialAnovaTutor from './hooks/useFactorialAnovaTutor';

// --- Visualizers ---
import NormalDistributionVisual from './components/visuals/NormalDistributionVisual';
import IndependentTTestVisual from './components/visuals/IndependentTTestVisual';
import PairedTTestVisual from './components/visuals/PairedTTestVisual';
import AnovaVisual from './components/visuals/AnovaVisual';
import FactorialAnovaVisual from './components/visuals/FactorialAnovaVisual';
import VariabilityVisual from './components/visuals/VariabilityVisual';
import FrequencyVisual from './components/visuals/FrequencyVisual';
import ShapeVisual from './components/visuals/ShapeVisual';
import QuartileVisual from './components/visuals/QuartileVisual';
import ProbabilityVisual from './components/visuals/ProbabilityVisual';

// --- Navigation ---
import MainMenu from './components/navigation/MainMenu';
import ModulesView from './components/navigation/ModulesView';
import SearchView from './components/navigation/SearchView';
import LessonsView from './components/navigation/LessonsView';
import UpdateToast from './components/common/UpdateToast';

// --- Tutor Components ---
import AnovaTutorPanel from './components/tutor/AnovaTutorPanel';
import FactorialAnovaTutorPanel from './components/tutor/FactorialAnovaTutorPanel';

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
    // --- 1. CORE REFS (Top priority to avoid TDZ/hoisting issues) ---
    const isPopStateRef = useRef(false);
    const isFirstMountRef = useRef(true);

    // --- 2. STANDARD STATE ---
    const [appMode, setAppMode] = useState('menu');
    const [searchQuery, setSearchQuery] = useState('');
    const [history, setHistory] = useState(['start']);
    const [answers, setAnswers] = useState({});
    const [currentStepId, setCurrentStepId] = useState('start');
    const [report, setReport] = useState("");
    const [activeTab, setActiveTab] = useState('spss');
    const [variabilityTab, setVariabilityTab] = useState('sd');
    const [probabilityTab, setProbabilityTab] = useState('basics');
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

    // --- 3. STATE WITH INITIALIZERS / SIDE EFFECTS ---
    const [anovaIsFirstVisit, setAnovaIsFirstVisit] = useState(() => {
        try {
            return !localStorage.getItem('anova_tutor_onboarded');
        } catch (e) {
            return true;
        }
    });

    // --- 4. CUSTOM HOOKS ---
    const { updateAvailable, countdown } = useAutoReload();

    // --- BROWSER HISTORY SYNC ---
    useEffect(() => {
        const handleNavigation = (event) => {
            if (event.state) {
                isPopStateRef.current = true;
                const { appMode, currentStepId, history, answers } = event.state;

                // Batch updates
                setAppMode(appMode);
                setCurrentStepId(currentStepId);
                setHistory(history);
                setAnswers(answers);

                // Clear ephemeral UI state
                setMathHistory([]);
                setAiExplanation(null);
                setAiModalOpen(false);
            } else if (window.location.hash === '' || window.location.hash === '#/') {
                isPopStateRef.current = true;
                setAppMode('menu');
                setCurrentStepId('start');
                setHistory(['start']);
                setAnswers({});
            }
        };

        window.addEventListener('popstate', handleNavigation);

        // Push initial state if missing
        if (!window.history.state) {
            window.history.replaceState({
                appMode: 'menu',
                currentStepId: 'start',
                history: ['start'],
                answers: {}
            }, '', '#/');
        } else {
            // If we reloaded and have state, sync it
            handleNavigation({ state: window.history.state });
        }

        return () => window.removeEventListener('popstate', handleNavigation);
    }, []);

    // Sync app state TO browser history
    useEffect(() => {
        // Skip on first mount (handled by replaceState in the other effect)
        if (isFirstMountRef.current) {
            isFirstMountRef.current = false;
            return;
        }

        // If this state change was caused by a popstate event, don't push it back!
        if (isPopStateRef.current) {
            isPopStateRef.current = false;
            return;
        }

        const statePayload = { appMode, currentStepId, history, answers };
        const newHash = `#/${appMode}${appMode === 'wizard' && currentStepId !== 'start' ? `/${currentStepId}` : ''}`;

        // Log for debugging if the user says it "still doesn't work"
        // console.log("Pushing History State:", newHash, statePayload);

        // Only PUSH if the identifying URL characteristics (hash) changed
        // Use REPLACE for internal state changes that shouldn't clog the back stack
        if (window.location.hash !== newHash) {
            window.history.pushState(statePayload, '', newHash);
        } else {
            window.history.replaceState(statePayload, '', newHash);
        }
    }, [appMode, currentStepId, history, answers]);

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

    const handleOptionClick = (option) => {
        const nextStepId = option.next;
        setAnswers({ ...answers, [currentStepId]: option.label });
        setHistory([...history, nextStepId]);
        setCurrentStepId(nextStepId);
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
        setReport("");
        setAiExplanation(null);
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

    const anovaTutorContext = useMemo(() => ({
        isFirstVisit: anovaIsFirstVisit,
        activePanel: mathHistory.length > 0 ? mathHistory[mathHistory.length - 1] : null, // activeMathTermKey
        hoveredTerm: hoveredTerm,
        showValues: showEquationValues,
        isSymbolKeyFirstOpen: symbolKeyOpen,
    }), [anovaIsFirstVisit, mathHistory, hoveredTerm, showEquationValues, symbolKeyOpen]);

    const anovaTutor = useAnovaTutor(currentStats, anovaTutorContext);
    const factorialAnovaTutor = useFactorialAnovaTutor(currentStats, anovaTutorContext);

    const isAnovaTrulyActive = currentStepId === 'res_anova' || currentStepId === 'res_one_way_anova' || currentStepId === 'res_rm_anova' || currentStep?.visualType === 'anova';
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
        if (variabilityTab === 'range') {
            displayFormulaId = 'range';
            displayVisualType = 'quartile';
        } else if (variabilityTab === 'shape') {
            displayFormulaId = 'none';
            displayVisualType = 'skew';
        }
        currentSoftware = SOFTWARE_GUIDES[variabilityTab];
    }

    // --- SYMBOL KEY LOGIC ---
    let relevantSymbols = SYMBOL_KEYS.sd;
    if (displayFormulaId === 'percentage') relevantSymbols = SYMBOL_KEYS.percentage;
    if (displayFormulaId === 'mean') relevantSymbols = SYMBOL_KEYS.standard;
    if (displayFormulaId === 'range') relevantSymbols = SYMBOL_KEYS.range;
    if (displayFormulaId === 'z_test' || displayFormulaId === 't_onesample') relevantSymbols = SYMBOL_KEYS.sd_pop;
    if (displayFormulaId === 'anova') relevantSymbols = SYMBOL_KEYS.anova;


    return (
        <ErrorBoundary>
            <div className={`min-h-screen transition-colors duration-500 font-sans selection:bg-indigo-500/30 pb-20 ${darkMode ? 'bg-slate-950 text-slate-200' : 'bg-slate-50 text-slate-800'}`}>
                <Header onBack={handleBack} onHome={handleRestart} canGoBack={appMode !== 'menu'} darkMode={darkMode} onToggleDarkMode={toggleDarkMode} />
                {appMode === 'wizard' && !isHelp && <div className="w-full bg-slate-200 h-1.5"><div className="bg-indigo-600 h-1.5 transition-all duration-700 ease-out" style={{ width: `${Math.min((history.length / 5) * 100, 100)}%` }} /></div>}

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

                        {appMode === 'modules' && <ModulesView onSelect={(id) => { setCurrentStepId(id); setAppMode('wizard'); }} darkMode={darkMode} />}

                        {appMode === 'search' && <SearchView searchQuery={searchQuery} setSearchQuery={setSearchQuery} onSelect={(id) => { setCurrentStepId(id); setAppMode('wizard'); }} darkMode={darkMode} />}

                        {appMode === 'lessons' && <LessonsView darkMode={darkMode} />}

                        {appMode === 'wizard' && (
                            <div className={`rounded-2xl shadow-xl border overflow-hidden transition-all duration-300 ${darkMode ? 'bg-slate-900 border-slate-800 shadow-2xl shadow-black/50' : 'bg-white border-slate-200'} ${isHelp ? (darkMode ? 'border-amber-500/30 ring-4 ring-amber-500/10' : 'border-amber-200 shadow-amber-100 ring-4 ring-amber-50') : ''}`}>
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
                                        <h2 className={`text-2xl md:text-4xl font-extrabold mb-4 ${darkMode ? 'text-white' : 'text-slate-900'}`}>{currentStep?.title || currentStep?.question}</h2>
                                        {currentStep?.description && <p className="text-lg md:text-xl font-light leading-relaxed max-w-3xl text-slate-600">{currentStep?.description}</p>}
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

                                {isResult && (
                                    <>
                                        <div className={`p-8 md:p-10 text-center transition-colors ${darkMode ? 'bg-slate-950 text-white' : 'bg-slate-900 text-white'}`}>
                                            <h2 className="text-3xl md:text-4xl font-extrabold mb-4">{currentStep?.title}</h2>
                                            <p className={`text-lg max-w-3xl mx-auto leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-300'}`}>{currentStep?.content}</p>
                                        </div>
                                        <div className={`p-6 md:p-8 space-y-12 transition-colors ${darkMode ? 'bg-slate-900' : 'bg-white'}`}>
                                            {currentStepId === 'res_variability' && (
                                                <div className="flex justify-center border-b border-slate-200 mb-8 overflow-x-auto no-scrollbar pb-1">
                                                    {['sd', 'range', 'shape'].map((tab) => (
                                                        <button key={tab} onClick={() => setVariabilityTab(tab)} className={`whitespace-nowrap px-6 py-3 text-sm font-bold uppercase tracking-wider border-b-2 transition-colors ${variabilityTab === tab ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
                                                            {tab === 'sd' ? 'Standard Deviation' : tab === 'range' ? 'Position & Percentiles' : 'Distribution Shape'}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}

                                            {currentStepId === 'res_probability' && (
                                                <div className="flex justify-center border-b border-slate-200 mb-8 overflow-x-auto no-scrollbar pb-1">
                                                    {[
                                                        { id: 'basics', label: 'Basics' },
                                                        { id: 'properties', label: 'Properties' },
                                                        { id: 'simulation', label: 'Coin Simulation' },
                                                        { id: 'dice', label: 'Dice Roll' },
                                                        { id: 'spinner', label: 'Spinner' },
                                                        { id: 'paradoxes', label: 'Paradoxes' },
                                                        { id: 'cards', label: 'Cards' }
                                                    ].map((tab) => (
                                                        <button key={tab.id} onClick={() => setProbabilityTab(tab.id)} className={`whitespace-nowrap px-6 py-3 text-sm font-bold uppercase tracking-wider border-b-2 transition-colors ${probabilityTab === tab.id ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
                                                            {tab.label}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}

                                            <div className="grid lg:grid-cols-12 gap-8 items-start">
                                                <div className="lg:col-span-5 flex flex-col gap-6">
                                                    {displayFormulaId && displayFormulaId !== 'none' && (
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
                                                                    {relevantSymbols.map((s, i) => {
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
                                                                {!activeMathTerm ? (
                                                                    <div className="animate-in fade-in zoom-in-95 duration-200">
                                                                        <FormulaDisplay
                                                                            type={displayFormulaId}
                                                                            onInfo={pushMathTerm}
                                                                            onHover={setHoveredTerm}
                                                                            darkMode={darkMode}
                                                                            showValues={showEquationValues}
                                                                            stats={currentStats}
                                                                        />
                                                                    </div>
                                                                ) : (
                                                                    <div className="w-full animate-in fade-in slide-in-from-right-4 duration-300 flex flex-col items-center text-center">
                                                                        <div className={`w-full flex justify-between items-center mb-6 border-b pb-2 ${darkMode ? 'border-slate-800' : 'border-slate-100'}`}>
                                                                            {mathHistory.length > 1 ? (<button onClick={(e) => { e.stopPropagation(); popMathTerm() }} className="text-xs font-bold text-indigo-400 flex items-center gap-1 hover:bg-indigo-500/10 px-2 py-1 rounded"><ChevronLeft className="w-3 h-3" /> Back</button>) : <div />}
                                                                            <button onClick={(e) => { e.stopPropagation(); closeMath() }} className={`text-xs font-bold flex items-center gap-1 transition-colors ${darkMode ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'}`}>Close <XCircle className="w-3 h-3" /></button>
                                                                        </div>
                                                                        <h4 className={`font-bold text-xl leading-tight mb-2 ${darkMode ? 'text-indigo-400' : 'text-indigo-700'}`} dangerouslySetInnerHTML={{ __html: activeMathTerm.title.replace(/\$(.*?)\$/g, "<sub>$1</sub>").replace(/\{(.*?)\}/g, "<sub>$1</sub>") }} />
                                                                        <p className={`text-xs font-bold uppercase tracking-wider mb-4 ${darkMode ? 'text-slate-600' : 'text-slate-500'}`} dangerouslySetInnerHTML={{ __html: activeMathTerm.desc.replace(/\$(.*?)\$/g, "<sub>$1</sub>").replace(/\{(.*?)\}/g, "<sub>$1</sub>") }} />
                                                                        <div className={`p-4 rounded-lg text-sm border inline-block mb-3 max-w-full break-words shadow-sm ${darkMode ? 'bg-indigo-950/20 text-slate-300 border-indigo-500/20' : 'bg-indigo-50/50 text-slate-800 border-indigo-100'}`}><CalculationText text={activeMathTerm.calc} onInfo={pushMathTerm} darkMode={darkMode} showValues={showEquationValues} stats={currentStats} /></div>
                                                                    </div>
                                                                )}
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

                                                <div className="lg:col-span-7">
                                                    <div className={`border rounded-xl p-6 h-full flex flex-col min-h-[400px] transition-colors ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                                                        <h4 className={`font-bold mb-2 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}><BarChart2 className="w-4 h-4 text-indigo-400" /> Visual Concept</h4>
                                                        <div className={`flex-1 flex items-start justify-center rounded-lg min-h-[250px] transition-colors ${displayVisualType === 'anova' || displayVisualType === 'factorial_anova' ? '' : (darkMode ? 'bg-slate-950/50 border border-dashed border-slate-800' : 'bg-slate-50/50 border border-dashed border-slate-200')}`}>
                                                            {displayVisualType === 'anova' ? (
                                                                <ErrorBoundary>
                                                                    <AnovaVisual
                                                                        highlight={activeMathTermKey}
                                                                        darkMode={darkMode}
                                                                        showValues={showEquationValues}
                                                                        onTutorUpdate={setActiveTutorScript}
                                                                        onStatsUpdate={setCurrentStats}
                                                                        tutor={anovaTutor}
                                                                    />
                                                                </ErrorBoundary>
                                                            ) : displayVisualType === 'factorial_anova' ? (
                                                                <ErrorBoundary>
                                                                    <FactorialAnovaVisual
                                                                        darkMode={darkMode}
                                                                        showValues={showEquationValues}
                                                                        onTutorUpdate={setActiveTutorScript}
                                                                        onStatsUpdate={setCurrentStats}
                                                                        tutor={factorialAnovaTutor}
                                                                    />
                                                                </ErrorBoundary>
                                                            ) : displayVisualType === 'indep_ttest' ? (
                                                                <ErrorBoundary>
                                                                    <IndependentTTestVisual
                                                                        darkMode={darkMode}
                                                                        onTutorUpdate={setActiveTutorScript}
                                                                        onStatsUpdate={setCurrentStats}
                                                                    />
                                                                </ErrorBoundary>
                                                            ) : displayVisualType === 'paired_ttest' ? (
                                                                <ErrorBoundary>
                                                                    <PairedTTestVisual
                                                                        darkMode={darkMode}
                                                                        onTutorUpdate={setActiveTutorScript}
                                                                        onStatsUpdate={setCurrentStats}
                                                                    />
                                                                </ErrorBoundary>
                                                            ) : displayVisualType === 'ttest' ? (
                                                                <NormalDistributionVisual
                                                                    type={displayFormulaId === 'z_test' ? 'z' : 't'}
                                                                    highlight={activeMathTermKey ? (displayFormulaId === 'z_test' ? 'z_score' : 't_score') : null}
                                                                    darkMode={darkMode}
                                                                    onTutorUpdate={setActiveTutorScript}
                                                                    onStatsUpdate={setCurrentStats}
                                                                />
                                                            ) : displayVisualType === 'normal' ? (
                                                                <NormalDistributionVisual type="z" label="Standard Normal Distribution" highlight="curve" darkMode={darkMode} />
                                                            ) : displayVisualType === 'variability' ? (
                                                                <VariabilityVisual darkMode={darkMode} />
                                                            ) : displayVisualType === 'frequency' ? (
                                                                <FrequencyVisual darkMode={darkMode} />
                                                            ) : displayVisualType === 'skew' ? (
                                                                <ShapeVisual darkMode={darkMode} />
                                                            ) : displayVisualType === 'quartile' ? (
                                                                <QuartileVisual darkMode={darkMode} />
                                                            ) : displayVisualType === 'probability' ? (
                                                                <ProbabilityVisual mode={probabilityTab} darkMode={darkMode} />
                                                            ) : null}
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
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </main>

                {aiModalOpen && (
                    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
                        <div className={`rounded-2xl shadow-2xl max-w-lg w-full p-6 border animate-in zoom-in-95 duration-300 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                            <div className="flex justify-between items-center mb-4">
                                <h3 className={`font-bold ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>Consultant AI</h3>
                                <button onClick={() => setAiModalOpen(false)} className={`p-1 rounded-full hover:bg-slate-800 transition-colors ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}><X size={18} /></button>
                            </div>
                            {aiLoading ? (
                                <div className="py-12 flex flex-col items-center gap-4">
                                    <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                                    <p className={`text-sm font-bold animate-pulse ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Generating Analysis...</p>
                                </div>
                            ) : (
                                <div className={`text-sm leading-relaxed max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                                    {aiExplanation}
                                </div>
                            )}
                            <button onClick={() => setAiModalOpen(false)} className={`mt-6 w-full py-3 rounded-xl font-bold transition-all ${darkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}`}>Dismiss</button>
                        </div>
                    </div>
                )}

                {activeExplanation && (
                    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[11000] flex items-center justify-center p-4 animate-in fade-in duration-300">
                        <div className={`rounded-2xl shadow-2xl max-w-lg w-full p-6 border animate-in zoom-in-95 duration-300 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                            <div className="flex justify-between items-center mb-4">
                                <h3 className={`font-bold text-lg ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>{activeExplanation.title}</h3>
                                <button onClick={() => setActiveExplanation(null)} className={`p-1 rounded-full hover:bg-slate-800 transition-colors ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}><X size={18} /></button>
                            </div>
                            <div className={`text-sm leading-relaxed max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                                <p className="mb-4">{activeExplanation.body}</p>
                                {activeExplanation.content && (
                                    <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-950/50 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                                        {activeExplanation.content}
                                    </div>
                                )}
                            </div>
                            <button onClick={() => setActiveExplanation(null)} className={`mt-6 w-full py-3 rounded-xl font-bold transition-all ${darkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}`}>Close</button>
                        </div>
                    </div>
                )}

                {showHistory && (
                    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[11000] flex items-center justify-center p-4 animate-in fade-in duration-300">
                        <div className={`rounded-2xl shadow-2xl max-w-lg w-full p-6 border animate-in zoom-in-95 duration-300 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                            <div className="flex justify-between items-center mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500">
                                        <History size={20} />
                                    </div>
                                    <h3 className={`font-black text-xl tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>Tutor Library</h3>
                                </div>
                                <button onClick={() => setShowHistory(false)} className={`p-2 rounded-full hover:bg-slate-800 transition-colors ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}><X size={20} /></button>
                            </div>

                            <div className="max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar space-y-4">
                                {anovaTutor.history.length === 0 ? (
                                    <div className="text-center py-12 opacity-40">
                                        <BookOpen size={40} className="mx-auto mb-4" />
                                        <p className="text-sm">No tips collected yet. Play with the data to trigger tutor insights!</p>
                                    </div>
                                ) : (
                                    anovaTutor.history.map((tip, idx) => (
                                        <div key={idx} className={`p-4 rounded-xl border-2 transition-all ${darkMode ? 'bg-slate-950/50 border-slate-800 hover:border-indigo-500/50' : 'bg-slate-50 border-slate-100 hover:border-indigo-500/30'}`}>
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className={`w-1.5 h-1.5 rounded-full ${tip.type === 'error' ? 'bg-rose-500' : tip.type === 'misconception' ? 'bg-amber-500' : 'bg-indigo-500'}`} />
                                                <h4 className={`text-[10px] font-black uppercase tracking-[0.2em] ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>{tip.type}</h4>
                                            </div>
                                            <h5 className={`font-bold text-sm mb-1 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>{tip.title}</h5>
                                            <p className={`text-xs leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>{tip.body}</p>
                                        </div>
                                    ))
                                )}
                            </div>

                            <button onClick={() => setShowHistory(false)} className={`mt-8 w-full py-4 rounded-xl font-black uppercase tracking-widest text-xs transition-all ${darkMode ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg' : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl'}`}>Back to Analysis</button>
                        </div>
                    </div>
                )}

                {isAnovaActive && anovaTutor.activeTip && (
                    <AnovaTutorPanel
                        tip={anovaTutor.activeTip}
                        onDismiss={anovaTutor.dismissTip}
                        onShowHistory={() => setShowHistory(true)}
                        onAction={(action) => {
                            if (action === 'toggle_show_values') setShowEquationValues(!showEquationValues);
                            if (action === 'dismiss_permanent') anovaTutor.dismissTip(anovaTutor.activeTip.id, true);
                            if (action === 'dismiss_session') anovaTutor.dismissTip(anovaTutor.activeTip.id, false);

                            // Educational/Explanation actions
                            const explanations = {
                                'show_f_starts_0': {
                                    title: "Why does F start at 0?",
                                    body: "F is a ratio of two variances (MS_between / MS_within). Since variances are sums of squares (always positive), the ratio can never be negative. F starts at 0 and goes to positive infinity.",
                                },
                                'show_welch_info': {
                                    title: "Welch’s ANOVA",
                                    body: "Standard ANOVA assumes equal variances (homogeneity). If your group variances differ significantly, Welch’s ANOVA is a robust alternative that doesn't require this assumption.",
                                },
                                'show_power_tip': {
                                    title: "Low Statistical Power",
                                    body: "A non-significant result doesn't mean there's no effect—it might just mean the study was too 'small' to find it. Power increases with larger sample sizes and less within-group noise.",
                                },
                                'show_nonsig_explanation': {
                                    title: "What is 'Non-Significant'?",
                                    body: "It means the observed differences are small enough that they could easily happen by random chance. We 'fail to reject' the null hypothesis because the evidence isn't strong enough.",
                                },
                                'show_assumptions_checklist': {
                                    title: "ANOVA Assumptions Checklist",
                                    body: "For your results to be valid, check these: 1. Independent observations, 2. Normality (scores are bell-curved in each group), 3. Homogeneity (variances are similar).",
                                },
                                'show_effect_size_info': {
                                    title: "Strength of Effect (η²)",
                                    body: "While p-values tell you if an effect is likely 'real,' η² tells you how 'big' it is. It's the percentage of total variance explained by your groups.",
                                },
                                'show_index_example': {
                                    title: "Example: indices i and j",
                                    body: "If Group 1 has scores [5, 6, 7], then j=1 for all of them. The first score (5) is x₁,₁. The second (6) is x₂,₁. And the third (7) is x₃,₁.",
                                },
                                'show_nj_example': {
                                    title: "Numeric Example: Scaling",
                                    body: "If group size nⱼ = 10 and the mean difference (x̄ⱼ - x̄_grand)² = 4, that group contributes 10 * 4 = 40 to the SS_between.",
                                },
                                'generate_apa_report': {
                                    title: "ANOVA Report Builder",
                                    body: "Based on your current data, here is an APA-formatted sentence for your results section:",
                                    content: (
                                        <div className="space-y-3">
                                            <p className={`font-mono text-[13px] leading-relaxed p-4 rounded-lg italic ${darkMode ? 'bg-slate-900 border-slate-800 text-indigo-300' : 'bg-white border-slate-200 text-indigo-700 shadow-sm'}`}>
                                                {(() => {
                                                    if (!currentStats) return "Add more data to generate a report.";
                                                    const { F, dfB, dfW, p, eta2 } = currentStats;
                                                    const sigText = p < .05 ? "was statistically significant" : "was not statistically significant";
                                                    return `A one-way ANOVA revealed that the effect of group membership ${sigText}, F(${dfB}, ${dfW}) = ${F.toFixed(2)}, p ${p < .001 ? '< .001' : '= ' + p.toFixed(3)}, η² = ${eta2.toFixed(2)}.`;
                                                })()}
                                            </p>
                                            <p className="text-[10px] opacity-60">Tip: Report F with both degrees of freedom in parentheses.</p>
                                        </div>
                                    )
                                },
                                'show_f1_example': {
                                    title: "F ≈ 1 Example",
                                    body: "If between-group variance is 20 and within-group variance is 20, F = 20/20 = 1.0. This happens when the treatment has no more effect than random chance.",
                                },
                                'show_df_explanation': {
                                    title: "Understanding df_within",
                                    body: "df_within = N - k. Every group uses up 1 'degree of freedom' to calculate its mean. If you have 30 people and 3 groups, you have 30 - 3 = 27 degrees of freedom left for noise.",
                                },
                                'show_f_factors': {
                                    title: "What raises F?",
                                    body: "Increasing group separation (bigger numerator) or decreasing individual spread (smaller denominator) both raise the F-ratio.",
                                },
                                'highlight_f_drivers': {
                                    title: "What is driving your F-ratio?",
                                    body: "Is it a large difference between groups, or very small differences within them? I'll highlight the components in the table for you.",
                                },
                                'show_eta_apa': {
                                    title: "Reporting η² in APA Style",
                                    body: "Include η² after the F-test results. Example: F(2, 27) = 4.54, p = .020, η² = .25.",
                                },
                                'show_unbalanced_info': {
                                    title: "Unequal Group Sizes",
                                    body: "When n₁ ≠ n₂ ≠ n₃, the F-test is slightly less 'robust' if variances also differ. Use Levene's test to ensure homogeneity.",
                                },
                                'show_square_demo': {
                                    title: "Why we square",
                                    body: "If we just added differences (x - x̄), they would sum to zero because positives and negatives cancel out. Squaring ensures every distance counts toward total variability.",
                                }
                            };

                            if (explanations[action]) {
                                setActiveExplanation(explanations[action]);
                            }

                            // Dismiss for any action by default to prevent stuck tips
                            if (anovaTutor.activeTip) {
                                anovaTutor.dismissTip(anovaTutor.activeTip.id, false);
                            }

                            window.dispatchEvent(new CustomEvent('anovaTutorAction', { detail: action }));
                        }}
                        darkMode={darkMode}
                    />
                )}

                {currentStepId === 'res_factorial_anova' && factorialAnovaTutor.activeTip && (
                    <FactorialAnovaTutorPanel
                        tip={factorialAnovaTutor.activeTip}
                        onDismiss={factorialAnovaTutor.dismissTip}
                        onShowHistory={() => setShowHistory(true)}
                        onAction={(action) => {
                            if (action === 'dismiss_permanent') factorialAnovaTutor.dismissTip(factorialAnovaTutor.activeTip.id, true);
                            if (action === 'dismiss_session') factorialAnovaTutor.dismissTip(factorialAnovaTutor.activeTip.id, false);

                            const factorialExplanations = {
                                'explain_balanced': {
                                    title: "Why Balance Matters",
                                    body: "When every cell has the same number of people, the factors are perfectly independent (orthogonal). If Ns are unequal, the factors 'overlap' and sums of squares are harder to calculate and interpret.",
                                },
                                'explain_simple_effects': {
                                    title: "What are Simple Effects?",
                                    body: "Simple effects are one-way ANOVAs conducted within a single level of the other factor. For example, 'Does Factor A matter *only* when Factor B is at Level 1?'",
                                },
                                'explain_interaction': {
                                    title: "Visualizing Interaction",
                                    body: "If lines are parallel, the effect of Factor A is the same regardless of Factor B. If they cross or diverge, the effect changes—which we call an interaction.",
                                }
                            };

                            if (factorialExplanations[action]) {
                                setActiveExplanation(factorialExplanations[action]);
                            }

                            // Signal down to the visualizer for UI-specific actions
                            window.dispatchEvent(new CustomEvent('factorialAnovaTutorAction', { detail: action }));

                            // Auto-dismiss after action if needed (helps keep UI clean)
                            if (factorialAnovaTutor.activeTip) {
                                factorialAnovaTutor.dismissTip(factorialAnovaTutor.activeTip.id, false);
                            }
                        }}
                        darkMode={darkMode}
                    />
                )}


                {isAnovaActive && !anovaTutor.activeTip && (
                    <div className="fixed top-24 right-10 z-[5000] animate-in slide-in-from-right-10 fade-in duration-700">
                        <button
                            onClick={() => setShowHistory(true)}
                            className={`group flex items-center gap-3 px-5 py-3 rounded-2xl border-2 shadow-xl backdrop-blur-xl transition-all hover:scale-105 active:scale-95 ${darkMode ? 'bg-slate-900/90 border-slate-800 text-indigo-400 hover:border-indigo-500/50' : 'bg-white/90 border-slate-100 text-indigo-600 hover:border-indigo-200'}`}
                        >
                            <History size={18} className="group-hover:rotate-[-20deg] transition-transform" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Tutor Library</span>
                            {anovaTutor.history.length > 0 && (
                                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-500 text-[10px] font-bold text-white">
                                    {anovaTutor.history.length}
                                </span>
                            )}
                        </button>
                    </div>
                )}

                {updateAvailable && <UpdateToast countdown={countdown} />}
            </div>
        </ErrorBoundary>
    );
}
