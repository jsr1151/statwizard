import { lazy } from "react";
import ErrorBoundary from "../common/ErrorBoundary";

const AncovaVisual = lazy(() => import("../visuals/AncovaVisual"));
const AnovaVisual = lazy(() => import("../visuals/AnovaVisual"));
const FactorialAnovaVisual = lazy(
  () => import("../visuals/FactorialAnovaVisual"),
);
const FrequencyVisual = lazy(() => import("../visuals/FrequencyVisual"));
const IndependentTTestVisual = lazy(
  () => import("../visuals/IndependentTTestVisual"),
);
const NhstVisual = lazy(() => import("../visuals/NhstVisual"));
const NormalDistributionVisual = lazy(
  () => import("../visuals/NormalDistributionVisual"),
);
const PairedTTestVisual = lazy(() => import("../visuals/PairedTTestVisual"));
const ProbabilityVisual = lazy(() => import("../visuals/ProbabilityVisual"));
const QuartileVisual = lazy(() => import("../visuals/QuartileVisual"));
const ShapeVisual = lazy(() => import("../visuals/ShapeVisual"));
const VariabilityVisual = lazy(() => import("../visuals/VariabilityVisual"));

export default function ResultVisualizer({
  activeMathTermKey,
  ancovaTutor,
  anovaTutor,
  darkMode,
  factorialAnovaTutor,
  formulaId,
  onReturnHome,
  onStatsUpdate,
  onTutorUpdate,
  probabilityTab,
  showEquationValues,
  stepId,
  teachingMode = true,
  visualType,
}) {
  const tutorUpdate = teachingMode ? onTutorUpdate : undefined;
  const highlight = teachingMode ? activeMathTermKey : null;
  const resetStats = () => onStatsUpdate(null);

  if (visualType === "anova") {
    return (
      <ErrorBoundary
        resetKey={`${stepId}-anova`}
        onReset={resetStats}
        onReturnHome={onReturnHome}
      >
        <AnovaVisual
          highlight={highlight}
          darkMode={darkMode}
          showValues={teachingMode ? showEquationValues : false}
          onTutorUpdate={tutorUpdate}
          onStatsUpdate={onStatsUpdate}
          tutor={anovaTutor}
        />
      </ErrorBoundary>
    );
  }

  if (visualType === "factorial_anova") {
    return (
      <ErrorBoundary
        resetKey={`${stepId}-factorial-anova`}
        onReset={resetStats}
        onReturnHome={onReturnHome}
      >
        <FactorialAnovaVisual
          darkMode={darkMode}
          showValues={teachingMode ? showEquationValues : false}
          onTutorUpdate={tutorUpdate}
          onStatsUpdate={onStatsUpdate}
          tutor={factorialAnovaTutor}
        />
      </ErrorBoundary>
    );
  }

  if (visualType === "ancova") {
    return (
      <ErrorBoundary
        resetKey={`${stepId}-ancova`}
        onReset={resetStats}
        onReturnHome={onReturnHome}
      >
        <AncovaVisual
          darkMode={darkMode}
          showValues={teachingMode ? showEquationValues : false}
          onStatsUpdate={onStatsUpdate}
          tutor={ancovaTutor}
        />
      </ErrorBoundary>
    );
  }

  if (visualType === "indep_ttest") {
    return (
      <ErrorBoundary
        resetKey={`${stepId}-independent-t`}
        onReset={resetStats}
        onReturnHome={onReturnHome}
      >
        <IndependentTTestVisual
          highlight={highlight}
          darkMode={darkMode}
          onTutorUpdate={tutorUpdate}
          onStatsUpdate={onStatsUpdate}
        />
      </ErrorBoundary>
    );
  }

  if (visualType === "paired_ttest") {
    return (
      <ErrorBoundary
        resetKey={`${stepId}-paired-t`}
        onReset={resetStats}
        onReturnHome={onReturnHome}
      >
        <PairedTTestVisual
          highlight={highlight}
          darkMode={darkMode}
          onTutorUpdate={tutorUpdate}
          onStatsUpdate={onStatsUpdate}
        />
      </ErrorBoundary>
    );
  }

  if (visualType === "probability") {
    return (
      <ErrorBoundary
        resetKey={`${stepId}-probability`}
        onReset={resetStats}
        onReturnHome={onReturnHome}
      >
        <ProbabilityVisual
          mode={probabilityTab}
          darkMode={darkMode}
          onTutorUpdate={tutorUpdate}
          onStatsUpdate={onStatsUpdate}
        />
      </ErrorBoundary>
    );
  }

  if (visualType === "nhst") {
    return (
      <ErrorBoundary
        resetKey={`${stepId}-nhst`}
        onReset={resetStats}
        onReturnHome={onReturnHome}
      >
        <NhstVisual darkMode={darkMode} />
      </ErrorBoundary>
    );
  }

  if (visualType === "ttest") {
    const distributionType = formulaId === "z_test" ? "z" : "t";
    return (
      <NormalDistributionVisual
        type={distributionType}
        highlight={
          teachingMode && activeMathTermKey ? `${distributionType}_score` : null
        }
        darkMode={darkMode}
        showTutor={teachingMode}
        onTutorUpdate={tutorUpdate}
        onStatsUpdate={onStatsUpdate}
      />
    );
  }

  if (visualType === "normal") {
    return (
      <NormalDistributionVisual
        type="z"
        label="Standard Normal Distribution"
        highlight={teachingMode ? "curve" : null}
        darkMode={darkMode}
        showTutor={teachingMode}
      />
    );
  }

  if (visualType === "variability")
    return <VariabilityVisual darkMode={darkMode} />;
  if (visualType === "frequency")
    return <FrequencyVisual darkMode={darkMode} />;
  if (visualType === "skew") return <ShapeVisual darkMode={darkMode} />;
  if (visualType === "quartile") return <QuartileVisual darkMode={darkMode} />;

  return null;
}
