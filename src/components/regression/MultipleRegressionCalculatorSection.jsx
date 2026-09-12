import { useRef } from 'react';
import CalculatorDraftNotice from '../common/CalculatorDraftNotice.jsx';
import AnalysisRowSummary from '../analysis/AnalysisRowSummary.jsx';
import { AlertTriangle, Calculator, Info } from 'lucide-react';
import RegressionResidualPlot from './RegressionResidualPlot';
import ObservedFittedPlot from './ObservedFittedPlot';
import { buildMultipleRegressionInterpretation } from '../../stats/multipleRegression.js';
import Card from '../analysis/AnalysisCard.jsx';
import MetricTile from '../analysis/AnalysisMetricTile.jsx';
import { formatStatistic as formatStat, formatPValue } from '../../utils/statFormatters.js';
import { buildEquationText } from '../../utils/multipleRegressionLesson.js';
import MultipleRegressionDataSourceCard from './MultipleRegressionDataSourceCard.jsx';
import MultipleRegressionPredictionCard from './MultipleRegressionPredictionCard.jsx';
import MultipleRegressionCoefficientCard from './MultipleRegressionCoefficientCard.jsx';

export default function MultipleRegressionCalculatorSection({
    tableSource, loadExample, uploadError, uploadPending, sourceLabel, rowSummary, draft, resetVariableChoices,

    darkMode, setCalculatorInputMode, calculatorInputMode, onUpload,
    setTableText, tableText, selectedOutcome, setSelectedOutcome,
    numericColumns, selectedPredictors, togglePredictor, selectedDatasetId,
    setSelectedDatasetId, datasets, savedDataset, onOpenDataManager,
    savedRoleSelection, setSavedRoleSelection, confidenceLevel, setConfidenceLevel,
    calculatorNeedsSetup, calculatorModelErrors, calculatorStats,
    activeOutcomeLabel, calculatorSelectedPointId, setCalculatorSelectedPointId, calculatorPrediction,
    calculatorPredictionInputs, setCalculatorPredictionInputs, calculatorSelectedPair, calculatorGuidance,
}) {
    const resultsRef = useRef(null);
    const onGoResults = () => { resultsRef.current?.focus(); resultsRef.current?.scrollIntoView?.({ block: 'start' }); };
    return (
        <div className="min-w-0 space-y-8 [overflow-wrap:anywhere]">
            <Card darkMode={darkMode}>
                <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-xl ${darkMode ? 'bg-indigo-500/10 text-indigo-300' : 'bg-indigo-50 text-indigo-700'}`}>
                        <Calculator size={20} />
                    </div>
                    <div>
                        <div className={`text-[10px] font-black uppercase tracking-widest mb-2 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
                            Test Calculator
                        </div>
                        <h3 className={`text-xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                            Fit a multiple-regression model from your data
                        </h3>
                        <p className={`mt-2 text-sm max-w-3xl ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                            Choose one quantitative outcome and at least two quantitative predictors. The page estimates the fitted equation, coefficient table, omnibus model test, prediction outputs, and compact collinearity guidance.
                        </p>
                    </div>
                </div>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                <div className="min-w-0 lg:col-span-4 space-y-6">
                    <CalculatorDraftNotice {...{ draft, darkMode }} scope="Recovery includes the entered or uploaded table, data source, outcome and predictor choices, confidence level, and prediction inputs for each data source." />
                    <MultipleRegressionDataSourceCard {...{
                        tableSource, loadExample, uploadError, uploadPending, onGoResults, hasResults: !calculatorNeedsSetup,
                        darkMode, setCalculatorInputMode, calculatorInputMode, onUpload,
                        setTableText, tableText, selectedOutcome, setSelectedOutcome,
                        numericColumns, selectedPredictors, togglePredictor, selectedDatasetId,
                        setSelectedDatasetId, datasets, savedDataset, onOpenDataManager,
                        savedRoleSelection, setSavedRoleSelection, confidenceLevel, setConfidenceLevel, resetVariableChoices,
                    }} />
                </div>

                <div ref={resultsRef} tabIndex={-1} aria-label="Analysis results" className="min-w-0 lg:col-span-8 space-y-6 scroll-mt-24">
                    {rowSummary && <AnalysisRowSummary darkMode={darkMode} sourceLabel={sourceLabel} summary={rowSummary} />}
                    {calculatorNeedsSetup ? (
                        <Card darkMode={darkMode}>
                            <div className="flex items-start gap-4">
                                <div className={`p-3 rounded-xl ${darkMode ? 'bg-amber-500/10 text-amber-300' : 'bg-amber-50 text-amber-700'}`}>
                                    <AlertTriangle size={20} />
                                </div>
                                <div>
                                    <h3 className={`text-lg font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                        Complete the model setup
                                    </h3>
                                    <div className={`mt-3 space-y-2 text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                        {(calculatorModelErrors.length ? calculatorModelErrors : ['Choose one outcome and at least two predictors to fit the multiple-regression model.']).map((error) => (
                                            <p key={error}>{error}</p>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
                                <MetricTile darkMode={darkMode} label="R^2" value={formatStat(calculatorStats.rSquared, 3)} detail={`${formatStat(calculatorStats.rSquared * 100, 1)}% variance explained`} tone="primary" />
                                <MetricTile darkMode={darkMode} label="Adjusted R^2" value={formatStat(calculatorStats.adjustedRSquared, 3)} detail="Complexity-adjusted model fit" />
                                <MetricTile darkMode={darkMode} label="RMSE" value={formatStat(calculatorStats.rmse, 3)} detail="Typical prediction error size" />
                                <MetricTile darkMode={darkMode} label="Model F" value={formatStat(calculatorStats.modelF, 3)} detail={`p ${formatPValue(calculatorStats.modelPValue)}`} />
                                <MetricTile darkMode={darkMode} label="Max VIF" value={formatStat(calculatorStats.maxVIF, 2)} detail={`${calculatorStats.collinearityLabel} predictor overlap`} tone={calculatorStats.maxVIF >= 5 ? 'warning' : 'default'} />
                            </div>

                            <Card darkMode={darkMode}>
                                <div className="flex flex-wrap items-start justify-between gap-4">
                                    <div>
                                        <div className={`text-[10px] font-black uppercase tracking-widest mb-2 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
                                            Fitted Model
                                        </div>
                                        <h3 className={`text-xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                            {buildEquationText({ stats: calculatorStats, outcomeLabel: activeOutcomeLabel })}
                                        </h3>
                                        <p className={`mt-2 text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                            {buildMultipleRegressionInterpretation(calculatorStats, activeOutcomeLabel)}
                                        </p>
                                    </div>
                                    <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${darkMode ? 'bg-slate-950 border border-slate-800 text-slate-400' : 'bg-slate-50 border border-slate-200 text-slate-600'}`}>
                                        F({calculatorStats.dfModel}, {calculatorStats.dfError}) = {formatStat(calculatorStats.modelF, 3)}, p {formatPValue(calculatorStats.modelPValue)}
                                    </div>
                                </div>
                            </Card>

                            <div className="grid grid-cols-1 gap-6">
                                <Card darkMode={darkMode}>
                                    <ObservedFittedPlot
                                        stats={calculatorStats}
                                        darkMode={darkMode}
                                        selectedPointId={calculatorSelectedPointId}
                                        onPointSelect={setCalculatorSelectedPointId}
                                        predictionTarget={calculatorPrediction}
                                        subtitle="The diagonal is perfect prediction. Click a case to inspect how far its observed outcome sits above or below the fitted value."
                                        yLabel={activeOutcomeLabel || 'Observed Y'}
                                    />
                                </Card>

                                <Card darkMode={darkMode}>
                                    <RegressionResidualPlot
                                        stats={calculatorStats}
                                        darkMode={darkMode}
                                        highlightPointIndex={calculatorSelectedPointId}
                                        subtitle="Residuals should look roughly patternless around zero if the linear conditional mean is doing a reasonable job."
                                    />
                                </Card>
                            </div>

                            <MultipleRegressionPredictionCard {...{
                                darkMode, calculatorStats, calculatorPredictionInputs, setCalculatorPredictionInputs,
                                activeOutcomeLabel, calculatorPrediction, confidenceLevel, calculatorSelectedPair,
                            }} />

                            <MultipleRegressionCoefficientCard {...{
                                darkMode, confidenceLevel, calculatorStats,
                            }} />

                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                                <Card darkMode={darkMode}>
                                    <div className="flex items-center gap-3 mb-4">
                                        <Info size={18} className={darkMode ? 'text-sky-300' : 'text-sky-700'} />
                                        <h3 className={`text-lg font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                            Conditional predictor summaries
                                        </h3>
                                    </div>

                                    <div className="space-y-3">
                                        {calculatorStats.coefficients.filter((coefficient) => coefficient.id !== 'intercept').map((coefficient) => (
                                            <div key={coefficient.id} className={`rounded-xl border p-4 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                                                <div className="flex items-center justify-between gap-3">
                                                    <h4 className={`font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>{coefficient.label}</h4>
                                                    <div className={`px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${coefficient.vif >= 5 ? (darkMode ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20' : 'bg-amber-50 text-amber-700 border border-amber-200') : (darkMode ? 'bg-slate-900 border border-slate-800 text-slate-400' : 'bg-white border border-slate-200 text-slate-600')}`}>
                                                        VIF {formatStat(coefficient.vif, 2)}
                                                    </div>
                                                </div>
                                                <p className={`mt-2 text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                                    {coefficient.interpretation.replace('predicted Y', `predicted ${activeOutcomeLabel}`)}
                                                </p>
                                                <p className={`mt-3 text-xs font-bold uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                                                    Zero-order r {formatStat(coefficient.zeroOrderCorrelation, 3)} | Partial R^2 {formatStat(coefficient.partialRSquared, 3)}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </Card>

                                <Card darkMode={darkMode}>
                                    <div className="flex items-center gap-3 mb-4">
                                        <AlertTriangle size={18} className={darkMode ? 'text-amber-300' : 'text-amber-700'} />
                                        <h3 className={`text-lg font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                            Practical model guidance
                                        </h3>
                                    </div>

                                    <div className="space-y-3">
                                        {calculatorGuidance.map((item) => (
                                            <div key={item.title} className={`rounded-xl border p-4 ${item.tone === 'warning' ? (darkMode ? 'bg-amber-500/10 border-amber-500/20' : 'bg-amber-50 border-amber-200') : (darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200')}`}>
                                                <h4 className={`font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>{item.title}</h4>
                                                <p className={`mt-2 text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>{item.body}</p>
                                            </div>
                                        ))}
                                    </div>
                                </Card>
                            </div>
                        </>
                    )}
                </div>
            </div>

        </div>
    );
}
