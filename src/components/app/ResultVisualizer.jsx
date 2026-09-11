import { lazy } from "react";
import ErrorBoundary from "../../components/common/ErrorBoundary";
const NormalDistributionVisual = lazy(() => import('../../components/visuals/NormalDistributionVisual'));
const IndependentTTestVisual = lazy(() => import('../../components/visuals/IndependentTTestVisual'));
const PairedTTestVisual = lazy(() => import('../../components/visuals/PairedTTestVisual'));
const AnovaVisual = lazy(() => import('../../components/visuals/AnovaVisual'));
const FactorialAnovaVisual = lazy(() => import('../../components/visuals/FactorialAnovaVisual'));
const AncovaVisual = lazy(() => import('../../components/visuals/AncovaVisual'));
const VariabilityVisual = lazy(() => import('../../components/visuals/VariabilityVisual'));
const FrequencyVisual = lazy(() => import('../../components/visuals/FrequencyVisual'));
const ShapeVisual = lazy(() => import('../../components/visuals/ShapeVisual'));
const QuartileVisual = lazy(() => import('../../components/visuals/QuartileVisual'));
const ProbabilityVisual = lazy(() => import('../../components/visuals/ProbabilityVisual'));
const NhstVisual = lazy(() => import('../../components/visuals/NhstVisual'));

export default function ResultVisualizer({
        displayVisualType, activeMathTermKey, darkMode, showEquationValues, setActiveTutorScript,
        setCurrentStats, anovaTutor, factorialAnovaTutor, ancovaTutor, displayFormulaId,
        teachingMode,
}) {
    const renderResultVisualizer = ({ teachingMode = true } = {}) => {
        if (displayVisualType === 'anova') {
            return (
                <ErrorBoundary>
                    <AnovaVisual
                        highlight={teachingMode ? activeMathTermKey : null}
                        darkMode={darkMode}
                        showValues={teachingMode ? showEquationValues : false}
                        onTutorUpdate={teachingMode ? setActiveTutorScript : undefined}
                        onStatsUpdate={setCurrentStats}
                        tutor={anovaTutor}
                    />
                </ErrorBoundary>
            );
        }

        if (displayVisualType === 'factorial_anova') {
            return (
                <ErrorBoundary>
                    <FactorialAnovaVisual
                        darkMode={darkMode}
                        showValues={teachingMode ? showEquationValues : false}
                        onTutorUpdate={teachingMode ? setActiveTutorScript : undefined}
                        onStatsUpdate={setCurrentStats}
                        tutor={factorialAnovaTutor}
                    />
                </ErrorBoundary>
            );
        }

        if (displayVisualType === 'ancova') {
            return (
                <ErrorBoundary>
                    <AncovaVisual
                        darkMode={darkMode}
                        showValues={teachingMode ? showEquationValues : false}
                        onStatsUpdate={setCurrentStats}
                        tutor={ancovaTutor}
                    />
                </ErrorBoundary>
            );
        }

        if (displayVisualType === 'indep_ttest') {
            return (
                <ErrorBoundary>
                    <IndependentTTestVisual
                        highlight={teachingMode ? activeMathTermKey : null}
                        darkMode={darkMode}
                        onTutorUpdate={teachingMode ? setActiveTutorScript : undefined}
                        onStatsUpdate={setCurrentStats}
                    />
                </ErrorBoundary>
            );
        }

        if (displayVisualType === 'paired_ttest') {
            return (
                <ErrorBoundary>
                    <PairedTTestVisual
                        highlight={teachingMode ? activeMathTermKey : null}
                        darkMode={darkMode}
                        onTutorUpdate={teachingMode ? setActiveTutorScript : undefined}
                        onStatsUpdate={setCurrentStats}
                    />
                </ErrorBoundary>
            );
        }

        if (displayVisualType === 'probability') {
            return (
                <ErrorBoundary>
                    <ProbabilityVisual
                        mode="basics"
                        darkMode={darkMode}
                        onTutorUpdate={teachingMode ? setActiveTutorScript : undefined}
                        onStatsUpdate={setCurrentStats}
                    />
                </ErrorBoundary>
            );
        }

        if (displayVisualType === 'nhst') {
            return (
                <ErrorBoundary>
                    <NhstVisual darkMode={darkMode} />
                </ErrorBoundary>
            );
        }

        if (displayVisualType === 'ttest') {
            return (
                <ErrorBoundary>
                    <NormalDistributionVisual
                        type={displayFormulaId === 'z_test' ? 'z' : 't'}
                        highlight={teachingMode && activeMathTermKey ? (displayFormulaId === 'z_test' ? 'z_score' : 't_score') : null}
                        darkMode={darkMode}
                        showTutor={teachingMode}
                        onTutorUpdate={teachingMode ? setActiveTutorScript : undefined}
                        onStatsUpdate={setCurrentStats}
                    />
                </ErrorBoundary>
            );
        }

        if (displayVisualType === 'normal') {
            return (
                <ErrorBoundary>
                    <NormalDistributionVisual
                        type="z"
                        label="Standard Normal Distribution"
                        highlight={teachingMode ? 'curve' : null}
                        darkMode={darkMode}
                        showTutor={teachingMode}
                    />
                </ErrorBoundary>
            );
        }

        if (displayVisualType === 'variability') {
            return (
                <ErrorBoundary>
                    <VariabilityVisual darkMode={darkMode} />
                </ErrorBoundary>
            );
        }

        if (displayVisualType === 'frequency') {
            return (
                <ErrorBoundary>
                    <FrequencyVisual darkMode={darkMode} />
                </ErrorBoundary>
            );
        }

        if (displayVisualType === 'skew') {
            return (
                <ErrorBoundary>
                    <ShapeVisual darkMode={darkMode} />
                </ErrorBoundary>
            );
        }

        if (displayVisualType === 'quartile') {
            return (
                <ErrorBoundary>
                    <QuartileVisual darkMode={darkMode} />
                </ErrorBoundary>
            );
        }

        return null;
    };


    return renderResultVisualizer({ teachingMode });
}
