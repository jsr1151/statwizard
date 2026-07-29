import { lazy, Suspense } from "react";
import { BarChart2 } from "lucide-react";
import TutorPanel from "../tutor/TutorPanel";
import RouteLoadingFallback from "../common/RouteLoadingFallback";
import AssumptionsPanel from "./AssumptionsPanel";
import EquationPanel from "./EquationPanel";
import ResultNavigation from "./ResultNavigation";
import ResultVisualizer from "./ResultVisualizer";
import SoftwareGuidePanel from "./SoftwareGuidePanel";
import {
  isFullWidthVisualizer,
  isUnframedVisualizer,
} from "./resultPresentation";
import { POWER_TEST_BY_STEP_ID } from "../../power/testRegistry";

const EffectSizePanel = lazy(() => import("../power/EffectSizePanel"));
const PearsonCorrelationPage = lazy(
  () => import("../correlation/PearsonCorrelationPage"),
);
const PowerAnalysisTab = lazy(() => import("../power/PowerAnalysisTab"));
const SimpleLinearRegressionPage = lazy(
  () => import("../regression/SimpleLinearRegressionPage"),
);

const VARIABILITY_TABS = [
  { id: "sd", label: "Standard Deviation" },
  { id: "range", label: "Position & Percentiles" },
  { id: "shape", label: "Distribution Shape" },
];

const PROBABILITY_TABS = [
  { id: "basics", label: "Basics" },
  { id: "properties", label: "Properties" },
  { id: "simulation", label: "Coin Simulation" },
  { id: "dice", label: "Dice Roll" },
  { id: "spinner", label: "Spinner" },
  { id: "paradoxes", label: "Paradoxes" },
  { id: "cards", label: "Cards" },
];

function TopicTabs({ activeTab, onTabChange, tabs }) {
  return (
    <div className="flex justify-center border-b border-slate-200 mb-8 overflow-x-auto no-scrollbar pb-1">
      {tabs.map(({ id, label }) => (
        <button
          key={id}
          type="button"
          onClick={() => onTabChange(id)}
          className={`whitespace-nowrap px-6 py-3 text-sm font-bold uppercase tracking-wider border-b-2 transition-colors ${activeTab === id ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-400 hover:text-slate-600"}`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

export default function ResultPageShell({
  activeMathTerm,
  activeMathTermKey,
  activeResultSection,
  activeSoftwareTab,
  activeTutorScript,
  ancovaTutor,
  anovaTutor,
  currentStats,
  darkMode,
  factorialAnovaTutor,
  formulaId,
  hoveredTerm,
  mathHistoryLength,
  onCloseMath,
  onHoverTerm,
  onPopMathTerm,
  onPowerModeChange,
  onProbabilityTabChange,
  onPushMathTerm,
  onResultSectionChange,
  onReturnHome,
  onSoftwareTabChange,
  onStatsChange,
  onToggleSymbolKey,
  onToggleValues,
  onTutorScriptChange,
  onVariabilityTabChange,
  pendingPowerMode,
  probabilityTab,
  relevantSymbols,
  showEquationValues,
  software,
  step,
  stepId,
  symbolKeyOpen,
  variabilityTab,
  visualType,
}) {
  const testConfig = POWER_TEST_BY_STEP_ID[stepId] || null;
  const isPearsonCorrelationPage =
    stepId === "correlation_result" && Boolean(testConfig);
  const isSimpleLinearRegressionPage =
    stepId === "regression_result" && Boolean(testConfig);
  const showStructuredCalculator =
    Boolean(testConfig) && activeResultSection === "calculator";
  const fullWidthVisualizer = isFullWidthVisualizer(stepId);
  const visualizerFrameClass = isUnframedVisualizer(visualType)
    ? ""
    : darkMode
      ? "bg-slate-950/50 border border-dashed border-slate-800"
      : "bg-slate-50/50 border border-dashed border-slate-200";

  const visualizerProps = {
    activeMathTermKey,
    ancovaTutor,
    anovaTutor,
    darkMode,
    factorialAnovaTutor,
    formulaId,
    onReturnHome,
    onStatsUpdate: onStatsChange,
    onTutorUpdate: onTutorScriptChange,
    probabilityTab,
    showEquationValues,
    stepId,
    visualType,
  };

  let primaryContent;

  if (isPearsonCorrelationPage) {
    primaryContent = (
      <PearsonCorrelationPage
        section={activeResultSection}
        darkMode={darkMode}
        currentStats={currentStats}
        onStatsChange={onStatsChange}
        assumptions={step?.assumptions || []}
        testConfig={testConfig}
        initialPowerMode={pendingPowerMode}
        onPowerModeChange={onPowerModeChange}
      />
    );
  } else if (isSimpleLinearRegressionPage) {
    primaryContent = (
      <SimpleLinearRegressionPage
        section={activeResultSection}
        darkMode={darkMode}
        currentStats={currentStats}
        onStatsChange={onStatsChange}
        assumptions={step?.assumptions || []}
        testConfig={testConfig}
        initialPowerMode={pendingPowerMode}
        onPowerModeChange={onPowerModeChange}
      />
    );
  } else if (activeResultSection === "power" && testConfig) {
    primaryContent = (
      <PowerAnalysisTab
        key={`${stepId}-${pendingPowerMode || activeResultSection}`}
        testConfig={testConfig}
        currentStats={currentStats}
        darkMode={darkMode}
        initialMode={pendingPowerMode}
        onModeChange={onPowerModeChange}
      />
    );
  } else if (activeResultSection === "effect_size" && testConfig) {
    primaryContent = (
      <EffectSizePanel
        testConfig={testConfig}
        currentStats={currentStats}
        darkMode={darkMode}
      />
    );
  } else if (showStructuredCalculator) {
    primaryContent = (
      <div className="space-y-8">
        <div
          className={`rounded-xl border p-6 ${darkMode ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-200"}`}
        >
          <h3
            className={`text-sm font-black uppercase tracking-widest mb-2 ${darkMode ? "text-indigo-400" : "text-indigo-600"}`}
          >
            Test Calculator
          </h3>
          <p
            className={`text-sm max-w-3xl ${darkMode ? "text-slate-400" : "text-slate-600"}`}
          >
            Use this workspace to enter or inspect data-driven analysis inputs
            and outputs. Formulas, assumptions, software walkthroughs, and
            guided explanations stay in Tutor / Lessons.
          </p>
        </div>
        <div
          className={`border rounded-xl p-6 min-h-[400px] transition-colors ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}
        >
          <h4
            className={`font-bold mb-4 flex items-center gap-2 ${darkMode ? "text-white" : "text-slate-900"}`}
          >
            <BarChart2 className="w-4 h-4 text-indigo-400" /> Analysis Workspace
          </h4>
          <div
            className={`rounded-lg min-h-[250px] transition-colors ${visualizerFrameClass}`}
          >
            <ResultVisualizer {...visualizerProps} teachingMode={false} />
          </div>
        </div>
      </div>
    );
  } else {
    primaryContent = (
      <>
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          {!fullWidthVisualizer && (
            <div className="lg:col-span-4 flex flex-col gap-6">
              <EquationPanel
                activeMathTerm={activeMathTerm}
                canGoBack={mathHistoryLength > 1}
                currentStats={currentStats}
                darkMode={darkMode}
                formulaId={formulaId}
                hoveredTerm={hoveredTerm}
                onCloseMath={onCloseMath}
                onHoverTerm={onHoverTerm}
                onPopMathTerm={onPopMathTerm}
                onPushMathTerm={onPushMathTerm}
                onToggleSymbolKey={onToggleSymbolKey}
                onToggleValues={onToggleValues}
                relevantSymbols={relevantSymbols}
                showEquationValues={showEquationValues}
                symbolKeyOpen={symbolKeyOpen}
              />

              {activeTutorScript && (
                <TutorPanel
                  script={activeTutorScript}
                  level="tutor"
                  inline={true}
                  darkMode={darkMode}
                  onClose={() => onTutorScriptChange(null)}
                />
              )}
            </div>
          )}

          <div
            className={fullWidthVisualizer ? "lg:col-span-12" : "lg:col-span-8"}
          >
            <div
              className={`border rounded-xl p-6 h-full flex flex-col min-h-[400px] transition-colors ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}
            >
              <h4
                className={`font-bold mb-2 flex items-center gap-2 ${darkMode ? "text-white" : "text-slate-900"}`}
              >
                <BarChart2 className="w-4 h-4 text-indigo-400" /> Visual Concept
              </h4>
              <div
                className={`flex-1 flex items-stretch justify-center rounded-lg min-h-[250px] transition-colors ${visualizerFrameClass}`}
              >
                <ResultVisualizer {...visualizerProps} teachingMode />
              </div>
            </div>
          </div>
        </div>

        <AssumptionsPanel assumptions={step?.assumptions} darkMode={darkMode} />
        <SoftwareGuidePanel
          activeTab={activeSoftwareTab}
          darkMode={darkMode}
          onTabChange={onSoftwareTabChange}
          software={software}
        />
      </>
    );
  }

  return (
    <>
      <div
        className={`p-8 md:p-10 text-center transition-colors ${darkMode ? "bg-slate-950 text-white" : "bg-slate-900 text-white"}`}
      >
        <h2 className="text-3xl md:text-4xl font-extrabold mb-4">
          {step?.title}
        </h2>
        <p
          className={`text-lg max-w-3xl mx-auto leading-relaxed ${darkMode ? "text-slate-400" : "text-slate-300"}`}
        >
          {step?.content}
        </p>
      </div>
      <div
        className={`p-6 md:p-8 space-y-12 transition-colors ${darkMode ? "bg-slate-900" : "bg-white"}`}
      >
        {stepId === "res_variability" && (
          <TopicTabs
            activeTab={variabilityTab}
            onTabChange={onVariabilityTabChange}
            tabs={VARIABILITY_TABS}
          />
        )}

        {stepId === "res_probability" && (
          <TopicTabs
            activeTab={probabilityTab}
            onTabChange={onProbabilityTabChange}
            tabs={PROBABILITY_TABS}
          />
        )}

        {testConfig && (
          <ResultNavigation
            activeSection={activeResultSection}
            darkMode={darkMode}
            onSelect={onResultSectionChange}
          />
        )}

        <Suspense
          fallback={
            <RouteLoadingFallback
              darkMode={darkMode}
              label="Loading analysis"
            />
          }
        >
          {primaryContent}
        </Suspense>
      </div>
    </>
  );
}
