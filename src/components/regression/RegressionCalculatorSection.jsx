import { AlertTriangle, Calculator, Database, FileUp, TrendingUp } from "lucide-react";
import RegressionResidualPlot from "./RegressionResidualPlot";
import RegressionScatterplot from "./RegressionScatterplot";
import { buildSlopeInterpretation } from "../../stats/regression.js";
import Card from '../analysis/AnalysisCard.jsx';
import MetricTile from '../analysis/AnalysisMetricTile.jsx';
import { formatStatistic as formatStat } from '../../utils/statFormatters.js';
import { formatPValue } from '../../utils/statFormatters.js';
import { REGRESSION_SAMPLE_DATASET as SAMPLE_DATASET } from '../../data/regressionPresets.js';
import { buildEquationText } from '../../utils/simpleRegressionPage.js';

export default function RegressionCalculatorSection({
    darkMode, onUpload, setTableText, tableText,
    parsedTable, selectedX, setSelectedX, numericColumns,
    selectedY, setSelectedY, confidenceLevel, setConfidenceLevel,
    setCalculatorShowLine, calculatorShowLine, setCalculatorShowBand, calculatorShowBand,
    setCalculatorShowPredictionBand, calculatorShowPredictionBand, calculatorGuidance, calculatorStats,
    influentialIndex, calculatorSelectedPointId, setCalculatorSelectedPointId, calculatorPrediction,
    calculatorPredictionX, setCalculatorPredictionX, calculatorSelectedPair,
}) {
    return (
        <div className="min-w-0 space-y-8 [overflow-wrap:anywhere]">
            <Card darkMode={darkMode}>
                <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-xl ${darkMode ? 'bg-indigo-500/10 text-indigo-300' : 'bg-indigo-50 text-indigo-700'}`}>
                        <Calculator size={20} />
                    </div>
                    <div>
                        <h3 className={`text-xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                            Simple linear regression calculator
                        </h3>
                        <p className={`mt-2 text-sm max-w-3xl ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                            Use this workspace to fit one predictor X to one quantitative outcome Y, inspect the regression line, and check the residual pattern before leaning on the slope test.
                        </p>
                    </div>
                </div>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                <div className="min-w-0 lg:col-span-4 space-y-6">
                    <Card darkMode={darkMode}>
                        <div className="flex items-center gap-3 mb-4">
                            <Database size={18} className={darkMode ? 'text-indigo-300' : 'text-indigo-700'} />
                            <div>
                                <div className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
                                    Data Workspace
                                </div>
                                <h3 className={`text-xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                    Load a predictor and outcome
                                </h3>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-3 mb-4">
                            <label className={`inline-flex items-center gap-2 rounded-xl border px-4 py-3 text-xs font-black uppercase tracking-widest cursor-pointer transition-all ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-300 hover:text-white hover:border-indigo-500' : 'bg-slate-50 border-slate-200 text-slate-700 hover:text-slate-900 hover:border-indigo-500'}`}>
                                <FileUp size={14} />
                                Upload CSV
                                <input type="file" accept=".csv,.txt" onChange={onUpload} className="hidden" />
                            </label>
                            <button onClick={() => setTableText(SAMPLE_DATASET)} className={`rounded-xl border px-4 py-3 text-xs font-black uppercase tracking-widest transition-all ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-300 hover:text-white hover:border-indigo-500' : 'bg-slate-50 border-slate-200 text-slate-700 hover:text-slate-900 hover:border-indigo-500'}`}>
                                Load Sample Data
                            </button>
                        </div>

                        <textarea
                            value={tableText}
                            onChange={(event) => setTableText(event.target.value)}
                            rows={12}
                            className={`w-full rounded-2xl border px-4 py-4 text-sm font-medium outline-none transition-colors ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200 focus:border-indigo-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500'}`}
                            spellCheck={false}
                        />

                        {parsedTable.errors?.length > 0 && (
                            <div className={`mt-4 rounded-xl border p-4 ${darkMode ? 'bg-rose-500/10 border-rose-500/20 text-rose-200' : 'bg-rose-50 border-rose-200 text-rose-700'}`}>
                                {parsedTable.errors.join(' ')}
                            </div>
                        )}

                        <div className="mt-6 grid grid-cols-1 gap-4">
                            <label className="block">
                                <span className={`text-[11px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>Predictor X</span>
                                <select value={selectedX} onChange={(event) => setSelectedX(event.target.value)} className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm font-bold outline-none transition-colors ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200 focus:border-indigo-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500'}`}>
                                    {numericColumns.map((column) => (
                                        <option key={column.name} value={column.name}>{column.name}</option>
                                    ))}
                                </select>
                            </label>

                            <label className="block">
                                <span className={`text-[11px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>Outcome Y</span>
                                <select value={selectedY} onChange={(event) => setSelectedY(event.target.value)} className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm font-bold outline-none transition-colors ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200 focus:border-indigo-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500'}`}>
                                    {numericColumns.map((column) => (
                                        <option key={column.name} value={column.name}>{column.name}</option>
                                    ))}
                                </select>
                            </label>

                            <label className="block">
                                <span className={`text-[11px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>Confidence Level</span>
                                <select value={confidenceLevel} onChange={(event) => setConfidenceLevel(Number(event.target.value))} className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm font-bold outline-none transition-colors ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200 focus:border-indigo-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500'}`}>
                                    <option value={0.9}>90%</option>
                                    <option value={0.95}>95%</option>
                                    <option value={0.99}>99%</option>
                                </select>
                            </label>
                        </div>

                        <div className="mt-6 grid grid-cols-1 gap-3">
                            <button onClick={() => setCalculatorShowLine((value) => !value)} className={`rounded-xl border px-4 py-3 text-xs font-black uppercase tracking-widest transition-all ${calculatorShowLine ? 'bg-indigo-600 text-white border-indigo-500' : (darkMode ? 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900')}`}>{calculatorShowLine ? 'Hide Line' : 'Show Line'}</button>
                            <button onClick={() => setCalculatorShowBand((value) => !value)} className={`rounded-xl border px-4 py-3 text-xs font-black uppercase tracking-widest transition-all ${calculatorShowBand ? 'bg-indigo-600 text-white border-indigo-500' : (darkMode ? 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900')}`}>{calculatorShowBand ? 'Hide Confidence Band' : 'Show Confidence Band'}</button>
                            <button onClick={() => setCalculatorShowPredictionBand((value) => !value)} className={`rounded-xl border px-4 py-3 text-xs font-black uppercase tracking-widest transition-all ${calculatorShowPredictionBand ? 'bg-indigo-600 text-white border-indigo-500' : (darkMode ? 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900')}`}>{calculatorShowPredictionBand ? 'Hide Prediction Interval' : 'Show Prediction Interval'}</button>
                        </div>
                    </Card>

                    <Card darkMode={darkMode}>
                        <div className="flex items-center gap-3 mb-4">
                            <AlertTriangle size={18} className={darkMode ? 'text-amber-300' : 'text-amber-700'} />
                            <div>
                                <div className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
                                    Guidance
                                </div>
                                <h3 className={`text-xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                    What to check
                                </h3>
                            </div>
                        </div>

                        <div className="space-y-3">
                            {calculatorGuidance.length ? calculatorGuidance.map((item) => (
                                <div key={item.title} className={`rounded-xl border p-4 ${item.tone === 'warning' ? (darkMode ? 'bg-amber-500/10 border-amber-500/20' : 'bg-amber-50 border-amber-200') : (darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200')}`}>
                                    <div className={`text-[10px] font-black uppercase tracking-widest ${item.tone === 'warning' ? (darkMode ? 'text-amber-300' : 'text-amber-700') : (darkMode ? 'text-slate-500' : 'text-slate-500')}`}>{item.title}</div>
                                    <p className={`mt-2 text-sm ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>{item.body}</p>
                                </div>
                            )) : (
                                <div className={`rounded-xl border p-4 ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                                    Load two different numeric variables to see regression-specific guidance.
                                </div>
                            )}
                        </div>
                    </Card>
                </div>

                <div className="min-w-0 lg:col-span-8 space-y-6">
                    <Card darkMode={darkMode}>
                        <RegressionScatterplot
                            pairs={calculatorStats?.pairs || []}
                            stats={calculatorStats}
                            darkMode={darkMode}
                            xLabel={selectedX || 'Predictor X'}
                            yLabel={selectedY || 'Outcome Y'}
                            showLine={calculatorShowLine}
                            showConfidenceBand={calculatorShowBand}
                            showPredictionBand={calculatorShowPredictionBand}
                            confidenceLevel={confidenceLevel}
                            highlightPointIndex={influentialIndex}
                            selectedPointId={calculatorSelectedPointId}
                            onPointSelect={setCalculatorSelectedPointId}
                            predictionTarget={calculatorPrediction}
                            title="Scatterplot with fitted regression line"
                            subtitle="Regression models the mean of the outcome as a straight-line function of the predictor. Click a point to inspect its residual or enter an X value to inspect the model prediction."
                        />
                    </Card>

                    {!calculatorStats?.ok ? (
                        <div className={`rounded-2xl border p-5 ${darkMode ? 'bg-rose-500/10 border-rose-500/20 text-rose-200' : 'bg-rose-50 border-rose-200 text-rose-700'}`}>
                            {calculatorStats?.errors?.join(' ') || 'Choose two different numeric columns to fit simple linear regression.'}
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                                <MetricTile darkMode={darkMode} label="Slope (b)" value={formatStat(calculatorStats.slope, 3)} tone="primary" detail={buildSlopeInterpretation({ slope: calculatorStats.slope, predictorLabel: selectedX || 'X', outcomeLabel: selectedY || 'Y' })} />
                                <MetricTile darkMode={darkMode} label="Intercept" value={formatStat(calculatorStats.intercept, 3)} detail={`Predicted ${selectedY || 'Y'} when ${selectedX || 'X'} = 0.`} />
                                <MetricTile darkMode={darkMode} label="R²" value={formatStat(calculatorStats.rSquared, 3)} detail={`${formatStat(calculatorStats.rSquared * 100, 1)}% variance explained`} />
                                <MetricTile darkMode={darkMode} label="Adjusted R²" value={formatStat(calculatorStats.adjustedRSquared, 3)} />
                                <MetricTile darkMode={darkMode} label="RMSE" value={formatStat(calculatorStats.rmse, 3)} detail="Typical prediction error around the fitted line." />
                                <MetricTile darkMode={darkMode} label="n" value={`${calculatorStats.n}`} />
                            </div>

                            <Card darkMode={darkMode}>
                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                                    <div className="min-w-0 lg:col-span-5 space-y-3">
                                        <div className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
                                            Prediction
                                        </div>
                                        <h3 className={`text-xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                            Predict the outcome from the fitted line
                                        </h3>
                                        <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                            Choose a predictor value and the model will return the fitted mean outcome plus interval estimates.
                                        </p>

                                        <label className="block">
                                            <span className={`text-[11px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                                                Predictor Value ({selectedX || 'X'})
                                            </span>
                                            <input
                                                type="number"
                                                step="0.1"
                                                value={Number.isFinite(Number(calculatorPredictionX)) ? calculatorPredictionX : ''}
                                                onChange={(event) => setCalculatorPredictionX(event.target.value === '' ? '' : Number(event.target.value))}
                                                className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm font-bold outline-none transition-colors ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200 focus:border-indigo-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500'}`}
                                            />
                                        </label>

                                        <p className={`text-xs ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                                            Observed {selectedX || 'X'} range: {formatStat(calculatorStats.xSummary.min, 3)} to {formatStat(calculatorStats.xSummary.max, 3)}
                                        </p>
                                    </div>

                                    <div className="min-w-0 lg:col-span-7">
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                            <div className={`rounded-xl border p-4 ${darkMode ? 'bg-indigo-500/10 border-indigo-500/20' : 'bg-indigo-50 border-indigo-200'}`}>
                                                <div className={`text-[10px] font-black uppercase tracking-widest mb-2 ${darkMode ? 'text-indigo-300' : 'text-indigo-700'}`}>Predicted Mean {selectedY || 'Y'}</div>
                                                <p className={`text-2xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>{formatStat(calculatorPrediction?.fitted, 3)}</p>
                                            </div>
                                            <div className={`rounded-xl border p-4 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                                                <div className={`text-[10px] font-black uppercase tracking-widest mb-2 ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>{Math.round(confidenceLevel * 100)}% Mean CI</div>
                                                <p className={`text-sm ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                                                    [{formatStat(calculatorPrediction?.meanInterval?.lower, 3)}, {formatStat(calculatorPrediction?.meanInterval?.upper, 3)}]
                                                </p>
                                            </div>
                                            <div className={`rounded-xl border p-4 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                                                <div className={`text-[10px] font-black uppercase tracking-widest mb-2 ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>{Math.round(confidenceLevel * 100)}% Prediction Interval</div>
                                                <p className={`text-sm ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                                                    [{formatStat(calculatorPrediction?.predictionInterval?.lower, 3)}, {formatStat(calculatorPrediction?.predictionInterval?.upper, 3)}]
                                                </p>
                                            </div>
                                        </div>

                                        <p className={`mt-4 text-sm leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                            The fitted line predicts the mean {selectedY || 'Y'} at this {selectedX || 'X'} value. The prediction interval is wider because individual observed outcomes can vary around that mean.
                                        </p>

                                        {calculatorPrediction?.isExtrapolation && (
                                            <div className={`mt-4 rounded-xl border p-4 ${darkMode ? 'bg-amber-500/10 border-amber-500/20 text-amber-200' : 'bg-amber-50 border-amber-200 text-amber-700'}`}>
                                                This prediction is outside the observed predictor range, so it is an extrapolation rather than an interpolation.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </Card>

                            <Card darkMode={darkMode}>
                                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                    <div className="min-w-0">
                                        <div className={`text-[10px] font-black uppercase tracking-widest mb-2 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>Fitted Model</div>
                                        <h3 className={`text-xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>{buildEquationText({ stats: calculatorStats, xLabel: selectedX || 'X', yLabel: selectedY || 'Y' })}</h3>
                                        <p className={`mt-2 text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                            {calculatorStats.interpretation}
                                        </p>
                                    </div>
                                    <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${darkMode ? 'bg-slate-950 border border-slate-800 text-slate-400' : 'bg-slate-50 border border-slate-200 text-slate-600'}`}>
                                        F(1, {calculatorStats.dfError}) = {formatStat(calculatorStats.hypothesisTests.model.statistic, 3)}, p {formatPValue(calculatorStats.hypothesisTests.model.pValue)}
                                    </div>
                                </div>
                            </Card>

                            <Card darkMode={darkMode}>
                                <div className="flex items-center gap-3 mb-4">
                                    <TrendingUp size={18} className={darkMode ? 'text-emerald-300' : 'text-emerald-700'} />
                                    <h3 className={`text-lg font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                        Coefficient summary
                                    </h3>
                                </div>

                                <div
                                    className="overflow-x-auto rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                                    role="region"
                                    aria-label="Regression coefficient table"
                                    tabIndex={0}
                                >
                                    <table className="w-full min-w-[560px] text-sm">
                                        <thead>
                                            <tr className={darkMode ? 'text-slate-500' : 'text-slate-500'}>
                                                <th className="text-left pb-3 font-black uppercase tracking-widest text-[10px]">Term</th>
                                                <th className="text-left pb-3 font-black uppercase tracking-widest text-[10px]">Estimate</th>
                                                <th className="text-left pb-3 font-black uppercase tracking-widest text-[10px]">SE</th>
                                                <th className="text-left pb-3 font-black uppercase tracking-widest text-[10px]">t</th>
                                                <th className="text-left pb-3 font-black uppercase tracking-widest text-[10px]">p</th>
                                                <th className="text-left pb-3 font-black uppercase tracking-widest text-[10px]">{Math.round(confidenceLevel * 100)}% CI</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {calculatorStats.coefficients.map((coefficient) => (
                                                <tr key={coefficient.id} className={`border-t ${darkMode ? 'border-slate-800 text-slate-200' : 'border-slate-200 text-slate-700'}`}>
                                                    <td className="py-3 font-bold">{coefficient.label}</td>
                                                    <td className="py-3">{formatStat(coefficient.estimate, 3)}</td>
                                                    <td className="py-3">{formatStat(coefficient.standardError, 3)}</td>
                                                    <td className="py-3">{formatStat(coefficient.tStatistic, 3)}</td>
                                                    <td className="py-3">p {formatPValue(coefficient.pValue)}</td>
                                                    <td className="py-3">[{formatStat(coefficient.confidenceInterval.lower, 3)}, {formatStat(coefficient.confidenceInterval.upper, 3)}]</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </Card>

                            <Card darkMode={darkMode}>
                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                                    <div className="min-w-0 lg:col-span-4">
                                        <div className={`rounded-xl border p-4 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                                            <div className={`text-[10px] font-black uppercase tracking-widest mb-2 ${darkMode ? 'text-amber-300' : 'text-amber-700'}`}>Selected Case</div>
                                            <h3 className={`text-lg font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                                Residual breakdown
                                            </h3>
                                            <p className={`mt-2 text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                                Click a point in the scatterplot to inspect how far the observed outcome sits above or below the fitted line.
                                            </p>

                                            <div className="mt-4 space-y-3">
                                                <div className={`rounded-xl border p-3 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                                                    <div className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>{selectedX || 'X'}</div>
                                                    <p className={`mt-1 text-lg font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>{formatStat(calculatorSelectedPair?.x, 3)}</p>
                                                </div>
                                                <div className={`rounded-xl border p-3 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                                                    <div className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>Observed {selectedY || 'Y'}</div>
                                                    <p className={`mt-1 text-lg font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>{formatStat(calculatorSelectedPair?.y, 3)}</p>
                                                </div>
                                                <div className={`rounded-xl border p-3 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                                                    <div className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>Predicted {selectedY || 'Y'}</div>
                                                    <p className={`mt-1 text-lg font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>{formatStat(calculatorSelectedPair?.fitted, 3)}</p>
                                                </div>
                                                <div className={`rounded-xl border p-3 ${darkMode ? 'bg-amber-500/10 border-amber-500/20' : 'bg-amber-50 border-amber-200'}`}>
                                                    <div className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-amber-300' : 'text-amber-700'}`}>Residual</div>
                                                    <p className={`mt-1 text-lg font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>{formatStat(calculatorSelectedPair?.residual, 3)}</p>
                                                </div>
                                            </div>

                                            <p className={`mt-4 text-sm leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                                Residual = observed {selectedY || 'Y'} - predicted {selectedY || 'Y'}. The residual plot helps you see whether those errors stay patternless around zero.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="min-w-0 lg:col-span-8">
                                        <RegressionResidualPlot
                                            stats={calculatorStats}
                                            darkMode={darkMode}
                                            highlightPointIndex={calculatorSelectedPointId}
                                            subtitle="Residuals should look roughly patternless around zero when the fitted model is doing a good job. The selected case is highlighted."
                                        />
                                    </div>
                                </div>
                            </Card>
                        </>
                    )}
                </div>
            </div>

        </div>
    );
}
