import RegressionResidualPlot from './RegressionResidualPlot';
import ObservedFittedPlot from './ObservedFittedPlot';
import MultipleRegressionConditionalEffectPlot from './MultipleRegressionConditionalEffectPlot';
import MultipleRegressionPlanePlot from './MultipleRegressionPlanePlot';
import { formatStatistic as formatStat } from '../../utils/statFormatters.js';
import { INTERNAL_PREDICTOR_IDS } from '../../data/multipleRegressionLesson.js';

export default function MultipleRegressionLessonVisual({
    compact = false, lessonContext, lessonPredictorLabels, lessonPredictionInputs,
    lessonMainView, lessonStats, darkMode, lessonSelectedPointId,
    setLessonSelectedPointId, lessonPrediction,
}) {
    const observedSubtitle = compact
        ? `Live view of observed versus fitted ${lessonContext.outcomeLabel}.`
        : `The whole predictor profile maps onto one fitted value. Click a sample case to compare its observed ${lessonContext.outcomeLabel} with the fitted mean.`;
    const partialX1Subtitle = compact
        ? `${lessonPredictorLabels[INTERNAL_PREDICTOR_IDS[1]]} held at ${formatStat(lessonPredictionInputs?.[INTERNAL_PREDICTOR_IDS[1]], 2)}.`
        : `${lessonPredictorLabels[INTERNAL_PREDICTOR_IDS[1]]} is held at ${formatStat(lessonPredictionInputs?.[INTERNAL_PREDICTOR_IDS[1]], 2)} in this view, so the green line is the conditional slope for ${lessonPredictorLabels[INTERNAL_PREDICTOR_IDS[0]]}.`;
    const partialX2Subtitle = compact
        ? `${lessonPredictorLabels[INTERNAL_PREDICTOR_IDS[0]]} held at ${formatStat(lessonPredictionInputs?.[INTERNAL_PREDICTOR_IDS[0]], 2)}.`
        : `${lessonPredictorLabels[INTERNAL_PREDICTOR_IDS[0]]} is held at ${formatStat(lessonPredictionInputs?.[INTERNAL_PREDICTOR_IDS[0]], 2)} in this view, so the green line is the conditional slope for ${lessonPredictorLabels[INTERNAL_PREDICTOR_IDS[1]]}.`;

    if (lessonMainView === 'partial_x1') {
        return (
            <MultipleRegressionConditionalEffectPlot
                stats={lessonStats}
                darkMode={darkMode}
                focusPredictorId={INTERNAL_PREDICTOR_IDS[0]}
                focusLabel={lessonPredictorLabels[INTERNAL_PREDICTOR_IDS[0]]}
                outcomeLabel={lessonContext.outcomeLabel}
                heldValues={lessonPredictionInputs}
                selectedPointId={lessonSelectedPointId}
                onPointSelect={setLessonSelectedPointId}
                predictionTarget={lessonPrediction}
                title={`Partial Effect of ${lessonPredictorLabels[INTERNAL_PREDICTOR_IDS[0]]}`}
                subtitle={partialX1Subtitle}
            />
        );
    }

    if (lessonMainView === 'partial_x2') {
        return (
            <MultipleRegressionConditionalEffectPlot
                stats={lessonStats}
                darkMode={darkMode}
                focusPredictorId={INTERNAL_PREDICTOR_IDS[1]}
                focusLabel={lessonPredictorLabels[INTERNAL_PREDICTOR_IDS[1]]}
                outcomeLabel={lessonContext.outcomeLabel}
                heldValues={lessonPredictionInputs}
                selectedPointId={lessonSelectedPointId}
                onPointSelect={setLessonSelectedPointId}
                predictionTarget={lessonPrediction}
                title={`Partial Effect of ${lessonPredictorLabels[INTERNAL_PREDICTOR_IDS[1]]}`}
                subtitle={partialX2Subtitle}
            />
        );
    }

    if (lessonMainView === 'residual') {
        return (
            <RegressionResidualPlot
                stats={lessonStats}
                darkMode={darkMode}
                highlightPointIndex={lessonSelectedPointId}
                title="Residual Plot"
                subtitle={compact
                    ? `Residuals for ${lessonContext.outcomeLabel} around the fitted model.`
                    : `Residuals are observed ${lessonContext.outcomeLabel} minus fitted ${lessonContext.outcomeLabel}. Patternless scatter around zero supports the additive linear model.`}
            />
        );
    }

    if (lessonMainView === 'plane') {
        return (
            <MultipleRegressionPlanePlot
                stats={lessonStats}
                darkMode={darkMode}
                predictorLabels={[
                    lessonPredictorLabels[INTERNAL_PREDICTOR_IDS[0]],
                    lessonPredictorLabels[INTERNAL_PREDICTOR_IDS[1]],
                ]}
                outcomeLabel={lessonContext.outcomeLabel}
                selectedPointId={lessonSelectedPointId}
                onPointSelect={setLessonSelectedPointId}
                predictionTarget={lessonPrediction}
                title="3D Regression Plane"
                subtitle={compact
                    ? 'The fitted plane follows your scroll here.'
                    : 'The plane is the fitted mean from the model. Vertical distance from a real point to the plane is the residual.'}
            />
        );
    }

    return (
        <ObservedFittedPlot
            stats={lessonStats}
            darkMode={darkMode}
            selectedPointId={lessonSelectedPointId}
            onPointSelect={setLessonSelectedPointId}
            predictionTarget={lessonPrediction}
            title="Observed vs Fitted"
            subtitle={observedSubtitle}
            yLabel={`Observed ${lessonContext.outcomeLabel}`}
        />
    );
}
