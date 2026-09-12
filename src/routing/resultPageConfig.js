import { CheckCircle, Sparkles, Calculator, Sigma, Terminal, BarChart2, BookOpen } from "lucide-react";
import { STEPS } from "../data/wizardSteps";
import { POWER_TEST_BY_STEP_ID } from "../power/testRegistry";
import { METHOD_AVAILABILITY } from '../data/methodAvailability.js';

const STRUCTURED_RESULT_STEP_IDS = new Set([
    'res_central_tendency',
    'res_variability',
    'res_frequency',
    'res_probability',
    'res_ztest',
    'res_rm_anova',
    'correlation_result',
    'regression_result',
    'multiple_regression_result',
    'res_indep_ttest',
    'res_paired_ttest',
    'res_one_way_anova',
    'res_factorial_anova',
    'res_ancova',
]);

const EFFECT_SIZE_SECTION_STEP_IDS = new Set([
    'correlation_result',
    'regression_result',
    'multiple_regression_result',
    'res_one_way_anova',
    'res_factorial_anova',
    'res_ancova',
]);

export const getTestConfig = (currentStepId) => {
        if (currentStepId === 'res_rm_anova') return null;
        const registeredConfig = POWER_TEST_BY_STEP_ID[currentStepId];
        if (registeredConfig) return registeredConfig;

        const oneWayConfig = POWER_TEST_BY_STEP_ID.res_one_way_anova;
        if (!oneWayConfig) return null;

        if (currentStepId === 'res_factorial_anova') {
            return {
                ...oneWayConfig,
                id: 'factorial_anova',
                stepId: 'res_factorial_anova',
                label: 'Factorial ANOVA',
                power: {
                    ...oneWayConfig.power,
                    assumptionNote: 'This planning view is a balanced omnibus approximation across the factorial cells. For effect-specific main-effect or interaction power, use dedicated factorial-design software with the intended numerator degrees of freedom.',
                },
            };
        }

        return null;
};

export const getResultPage = (currentStepId) => {
    const currentStep = STEPS[currentStepId];
    const currentTestConfig = getTestConfig(currentStepId);
    const isPearsonCorrelationPage = currentStepId === 'correlation_result' && Boolean(currentTestConfig);
    const isSimpleLinearRegressionPage = currentStepId === 'regression_result' && Boolean(currentTestConfig);
    const isMultipleRegressionPage = currentStepId === 'multiple_regression_result' && Boolean(currentTestConfig);
    const isOneSampleTTestPage = currentStepId === 'res_onesample_ttest';
    const isCentralTendencyPage = currentStepId === 'res_central_tendency';
    const isVariabilityPage = currentStepId === 'res_variability';
    const isFrequencyPage = currentStepId === 'res_frequency';
    const isProbabilityPage = currentStepId === 'res_probability';
    const isIndependentTTestPage = currentStepId === 'res_indep_ttest';
    const isPairedTTestPage = currentStepId === 'res_paired_ttest';
    const isOneWayAnovaPage = currentStepId === 'res_one_way_anova';
    const isFactorialAnovaPage = currentStepId === 'res_factorial_anova';
    const isAncovaPage = currentStepId === 'res_ancova';
    const isResult = currentStep?.type === 'result';
    const isHelp = currentStep?.type === 'help';
    const isStructuredResultPage = isResult && (STRUCTURED_RESULT_STEP_IDS.has(currentStepId) || Boolean(currentTestConfig) || Boolean(METHOD_AVAILABILITY[currentStepId]));

    const availableResultSections = (() => {
        if (METHOD_AVAILABILITY[currentStepId]) {
            if (currentStepId === 'res_unsupported_design') return [];
            return [
                { id: 'lessons', label: 'Method guide', icon: BookOpen },
                { id: 'calculator', label: 'Calculator availability', icon: Calculator },
                { id: 'assumptions', label: 'Assumptions', icon: CheckCircle },
                { id: 'software', label: 'Software', icon: Terminal },
                ...(currentStepId === 'res_rm_anova' ? [
                    { id: 'equation', label: 'Model scope', icon: Sigma },
                    { id: 'power', label: 'Power availability', icon: BarChart2 },
                ] : []),
            ];
        }
        if (!isStructuredResultPage) {
            return [];
        }

        if (isCentralTendencyPage) {
            return [
                { id: 'lessons', label: 'Learn', icon: BookOpen },
                { id: 'calculator', label: 'Calculator', icon: Calculator },
                { id: 'explorer', label: 'Explorer', icon: BarChart2 },
                { id: 'equation', label: 'Equations', icon: Sigma },
                { id: 'software', label: 'Software', icon: Terminal },
            ];
        }

        if (isVariabilityPage) {
            return [
                { id: 'lessons', label: 'Learn', icon: BookOpen },
                { id: 'calculator', label: 'Calculator', icon: Calculator },
                { id: 'explorer', label: 'Explorer', icon: BarChart2 },
                { id: 'equation', label: 'Equations', icon: Sigma },
                { id: 'software', label: 'Software', icon: Terminal },
            ];
        }

        if (isFrequencyPage) {
            return [
                { id: 'lessons', label: 'Learn', icon: BookOpen },
                { id: 'calculator', label: 'Calculator', icon: Calculator },
                { id: 'explorer', label: 'Explorer', icon: BarChart2 },
                { id: 'equation', label: 'Equations', icon: Sigma },
                { id: 'software', label: 'Software', icon: Terminal },
            ];
        }

        if (isProbabilityPage) {
            return [
                { id: 'lessons', label: 'Learn', icon: BookOpen },
                { id: 'calculator', label: 'Calculator', icon: Calculator },
                { id: 'simulations', label: 'Simulations', icon: BarChart2 },
                { id: 'demos', label: 'Demos', icon: Sparkles },
                { id: 'equation', label: 'Equations', icon: Sigma },
            ];
        }

        const sections = [
            { id: 'lessons', label: 'Tutor / Lessons', icon: BookOpen },
            { id: 'calculator', label: 'Test Calculator', icon: Calculator },
        ];

        if (currentStep?.formulaId && currentStep.formulaId !== 'none') {
            sections.push({ id: 'equation', label: 'Equation', icon: Sigma });
        }

        if (EFFECT_SIZE_SECTION_STEP_IDS.has(currentStepId)) {
            sections.push({ id: 'effect_size', label: 'Effect Size', icon: Sigma });
        }

        if ((currentStep?.assumptions || []).length > 0) {
            sections.push({ id: 'assumptions', label: 'Assumptions', icon: CheckCircle });
        }

        if (currentTestConfig) {
            sections.push({ id: 'power', label: 'Power Analysis', icon: BarChart2 });
        }

        return sections;
    })();

    return {
        currentStep, currentTestConfig, isPearsonCorrelationPage, isSimpleLinearRegressionPage, isMultipleRegressionPage,
        isOneSampleTTestPage, isCentralTendencyPage, isVariabilityPage, isFrequencyPage, isProbabilityPage,
        isIndependentTTestPage, isPairedTTestPage, isOneWayAnovaPage, isFactorialAnovaPage, isAncovaPage,
        isResult, isHelp, isStructuredResultPage, availableResultSections,
    };
};
