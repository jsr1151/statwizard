import { useEffect, useMemo, useState } from 'react';
import useMultipleRegressionInput from './useMultipleRegressionInput.js';
import { SAMPLE_DATASET } from '../data/multipleRegressionLesson.js';
import { summarizeAnalysisRows } from '../utils/analysisRows.js';
import { findDefaultPointId } from '../utils/multipleRegressionLesson.js';
import { buildMultipleRegressionGuidance, calculateMultipleRegressionPrediction, calculateMultipleRegressionStats } from '../stats/multipleRegression.js';

export default function useMultipleRegressionCalculator({ onStatsChange }) {
    const input = useMultipleRegressionInput(SAMPLE_DATASET);
    const { calculatorInputMode, savedDataset, activeRoles, activeOutcomeColumn, activePredictorColumns,
        unavailablePredictors, confidenceLevel, totalRows, predictionValues, setPredictionValues } = input;
    const [calculatorSelectedPointId, setCalculatorSelectedPointId] = useState(null);
    const roleError = calculatorInputMode === 'saved' && !savedDataset
        ? 'The selected saved dataset is unavailable. Open Data Manager or choose an available dataset.'
        : !activeOutcomeColumn ? 'Choose a numeric outcome variable to fit the model.'
            : unavailablePredictors.length ? 'A selected predictor is unavailable, no longer numeric, or also selected as the outcome. Review the variables or reset variable choices.'
                : activeRoles.predictors.length < 2 ? 'Select at least two quantitative predictors for the multiple-regression model.' : '';
    const calculatorStats = useMemo(() => roleError ? null : calculateMultipleRegressionStats({
        outcomeValues: activeOutcomeColumn?.numericValues || [], predictorColumns: activePredictorColumns,
        confidenceLevel, alpha: 1 - confidenceLevel,
    }), [roleError, activeOutcomeColumn, activePredictorColumns, confidenceLevel]);
    const calculatorModelErrors = roleError ? [roleError] : calculatorStats?.errors || [];
    const calculatorNeedsSetup = !!roleError || !calculatorStats?.ok;
    const rowSummary = useMemo(() => roleError ? null : summarizeAnalysisRows([activeOutcomeColumn, ...activePredictorColumns], totalRows),
        [roleError, activeOutcomeColumn, activePredictorColumns, totalRows]);
    const calculatorGuidance = useMemo(() => buildMultipleRegressionGuidance(calculatorStats), [calculatorStats]);

    // Saved predictions use stable column IDs; the statistical engine uses display labels.
    const calculatorPredictionInputs = useMemo(() => Object.fromEntries((calculatorStats?.predictorSummaries || []).map((summary, index) => {
        const key = activeRoles.predictors[index];
        return [summary.label, Object.hasOwn(predictionValues, key) ? predictionValues[key] : Number(summary.mean.toFixed(3))];
    })), [calculatorStats, activeRoles.predictors, predictionValues]);
    const setCalculatorPredictionInputs = next => {
        const resolved = typeof next === 'function' ? next(calculatorPredictionInputs) : next;
        setPredictionValues({ ...predictionValues, ...Object.fromEntries(calculatorStats.predictorSummaries.map((summary, index) => [activeRoles.predictors[index], resolved[summary.label]])) });
    };
    const calculatorPrediction = useMemo(() => {
        if (!calculatorStats?.ok || Object.values(calculatorPredictionInputs).some(value => String(value).trim() === '' || !Number.isFinite(Number(value)))) return null;
        return calculateMultipleRegressionPrediction({ stats: calculatorStats, predictorValues: calculatorPredictionInputs, confidenceLevel });
    }, [calculatorStats, calculatorPredictionInputs, confidenceLevel]);
    const calculatorSelectedPair = useMemo(() => calculatorStats?.pairs?.find(pair => pair.id === calculatorSelectedPointId || pair.index === calculatorSelectedPointId) || null,
        [calculatorStats, calculatorSelectedPointId]);
    useEffect(() => { onStatsChange?.(calculatorNeedsSetup ? null : calculatorStats); }, [calculatorStats, calculatorNeedsSetup, onStatsChange]);
    useEffect(() => {
        setCalculatorSelectedPointId(previous => calculatorStats?.ok
            ? calculatorStats.pairs.some(pair => pair.id === previous || pair.index === previous) ? previous : findDefaultPointId(calculatorStats)
            : null);
    }, [calculatorStats]);

    return {
        ...input, calculatorStats, calculatorNeedsSetup, calculatorModelErrors, rowSummary, calculatorGuidance,
        calculatorSelectedPointId, setCalculatorSelectedPointId, calculatorSelectedPair,
        calculatorPredictionInputs, setCalculatorPredictionInputs, calculatorPrediction,
    };
}
