import { AlertTriangle, Calculator, CheckCircle, SlidersHorizontal } from "lucide-react";
import PearsonScatterplot from "./PearsonScatterplot";
import AssumptionItem from "../formula/AssumptionItem";
import VariableRolePicker from "../data/VariableRolePicker.jsx";
import Card from '../analysis/AnalysisCard.jsx';
import MetricTile from '../analysis/AnalysisMetricTile.jsx';
import { formatStatistic as formatStat } from '../../utils/statFormatters.js';
import { formatPValue } from '../../utils/statFormatters.js';
import PearsonDataSourceCard from './PearsonDataSourceCard.jsx';

export default function PearsonCalculatorSection({
    tails, direction, darkMode, setCalculatorInputMode,
    calculatorInputMode, onUpload, setTableText, tableText,
    selectedDatasetId, setSelectedDatasetId, datasets, savedDataset,
    savedNumericColumns, savedRoleSelection, setSavedRoleSelection, activeCompleteCaseSummary,
    setTails, setDirection, confidenceLevel, setConfidenceLevel,
    rho0, setRho0, setCalculatorShowLine, calculatorShowLine,
    setCalculatorShowBand, calculatorShowBand, parsedTable, numericColumns,
    selectedX, setSelectedX, selectedY, setSelectedY,
    calculatorGuidance, calculatorStats, activeXLabel, activeYLabel,
    influentialIndex, assumptions,
}) {
    const setupState = tails === 2 ? 'two_tailed' : (direction === 'less' ? 'negative' : 'positive');

    return (
        <div className="space-y-8">
            <Card darkMode={darkMode}>
                <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-xl ${darkMode ? 'bg-indigo-500/10 text-indigo-300' : 'bg-indigo-50 text-indigo-700'}`}>
                        <Calculator size={20} />
                    </div>
                    <div>
                        <h3 className={`text-xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                            Pearson correlation calculator
                        </h3>
                        <p className={`mt-2 text-sm max-w-3xl ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                            Upload or paste a table, choose X and Y, then inspect the sample correlation r, r², the test result, the confidence interval, and the scatterplot-based warnings.
                        </p>
                    </div>
                </div>
            </Card>

            <div className="grid lg:grid-cols-12 gap-8 items-start">
                <div className="lg:col-span-4 space-y-6">
                    <PearsonDataSourceCard {...{
                        darkMode, setCalculatorInputMode, calculatorInputMode, onUpload,
                        setTableText, tableText, selectedDatasetId, setSelectedDatasetId,
                        datasets, savedDataset, savedNumericColumns,
                    }} />

                    <Card darkMode={darkMode}>
                        <div className="flex items-center gap-3 mb-4">
                            <SlidersHorizontal size={18} className={darkMode ? 'text-indigo-300' : 'text-indigo-700'} />
                            <div>
                                <div className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
                                    Setup
                                </div>
                                <h3 className={`text-xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                    Variables and options
                                </h3>
                            </div>
                        </div>

                        {calculatorInputMode === 'saved' ? (
                            !datasets.length ? (
                                <div className={`rounded-xl border p-4 ${darkMode ? 'bg-rose-500/10 border-rose-500/20 text-rose-200' : 'bg-rose-50 border-rose-200 text-rose-700'}`}>
                                    Save a dataset in Data Manager first, then come back here to launch Pearson correlation with that dataset already loaded.
                                </div>
                            ) : !savedDataset ? (
                                <div className={`rounded-xl border p-4 ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                                    Choose a saved dataset to map the X and Y variables.
                                </div>
                            ) : savedNumericColumns.length < 2 ? (
                                <div className={`rounded-xl border p-4 ${darkMode ? 'bg-rose-500/10 border-rose-500/20 text-rose-200' : 'bg-rose-50 border-rose-200 text-rose-700'}`}>
                                    This dataset needs at least two numeric variables before Pearson correlation can run.
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <VariableRolePicker
                                        darkMode={darkMode}
                                        dataset={savedDataset}
                                        selection={savedRoleSelection}
                                        onChange={setSavedRoleSelection}
                                        emptyMessage="Choose a saved dataset to map the X and Y variables."
                                        roles={[
                                            {
                                                id: 'x',
                                                label: 'X Variable',
                                                selection: 'single',
                                                allowedTypes: ['numeric'],
                                                placeholder: 'Select numeric X variable',
                                                excludeRoleIds: ['y'],
                                                emptyOptionsText: 'No numeric variables are currently available for the X role.',
                                            },
                                            {
                                                id: 'y',
                                                label: 'Y Variable',
                                                selection: 'single',
                                                allowedTypes: ['numeric'],
                                                placeholder: 'Select numeric Y variable',
                                                excludeRoleIds: ['x'],
                                                emptyOptionsText: 'No numeric variables are currently available for the Y role.',
                                            },
                                        ]}
                                    />

                                    <div className={`rounded-xl border px-4 py-3 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                                        <div className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-indigo-300' : 'text-indigo-700'}`}>Complete cases</div>
                                        <p className={`mt-2 text-sm ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                                            {activeCompleteCaseSummary.usable} of {activeCompleteCaseSummary.total} rows are usable after dropping incomplete X or Y values.
                                        </p>
                                    </div>

                                    <p className={`text-sm ${darkMode ? 'text-slate-500' : 'text-slate-600'}`}>
                                        Data preparation lives in Data Manager. This calculator focuses on mapping variables and running the existing Pearson engine.
                                    </p>

                                    <div>
                                        <span className={`text-[11px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>Hypothesis Direction</span>
                                        <div className={`mt-2 rounded-xl border p-1 flex gap-1 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                                            {[
                                                ['two_tailed', 'Two-tailed'],
                                                ['positive', 'Positive'],
                                                ['negative', 'Negative'],
                                            ].map(([id, label]) => {
                                                const isActive = setupState === id;
                                                return (
                                                    <button
                                                        key={id}
                                                        onClick={() => {
                                                            if (id === 'two_tailed') {
                                                                setTails(2);
                                                            } else {
                                                                setTails(1);
                                                                setDirection(id === 'negative' ? 'less' : 'greater');
                                                            }
                                                        }}
                                                        className={`flex-1 px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${isActive ? 'bg-indigo-600 text-white shadow-lg' : (darkMode ? 'text-slate-500 hover:text-slate-200 hover:bg-slate-900' : 'text-slate-500 hover:text-slate-900 hover:bg-white')}`}
                                                    >
                                                        {label}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <label className="block">
                                        <span className={`text-[11px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>Confidence Level</span>
                                        <select value={confidenceLevel} onChange={(event) => setConfidenceLevel(Number(event.target.value))} className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm font-bold outline-none transition-colors ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200 focus:border-indigo-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500'}`}>
                                            <option value={0.9}>90%</option>
                                            <option value={0.95}>95%</option>
                                            <option value={0.99}>99%</option>
                                        </select>
                                    </label>

                                    <label className="block">
                                        <span className={`text-[11px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>Null Population Correlation (rho0)</span>
                                        <input
                                            type="number"
                                            min={-0.95}
                                            max={0.95}
                                            step={0.01}
                                            value={rho0}
                                            onChange={(event) => {
                                                const numeric = Number(event.target.value);
                                                if (Number.isFinite(numeric)) {
                                                    setRho0(Math.max(-0.95, Math.min(0.95, numeric)));
                                                }
                                            }}
                                            className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm font-bold outline-none transition-colors ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200 focus:border-indigo-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500'}`}
                                        />
                                        <p className={`mt-2 text-xs leading-relaxed ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                                            Usually 0. This is the population correlation value the hypothesis test is evaluated against.
                                        </p>
                                    </label>

                                    <div className="grid grid-cols-2 gap-3">
                                        <button onClick={() => setCalculatorShowLine((value) => !value)} className={`rounded-xl border px-4 py-3 text-xs font-black uppercase tracking-widest transition-all ${calculatorShowLine ? 'bg-indigo-600 text-white border-indigo-500' : (darkMode ? 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900')}`}>{calculatorShowLine ? 'Hide Line' : 'Show Line'}</button>
                                        <button onClick={() => setCalculatorShowBand((value) => !value)} className={`rounded-xl border px-4 py-3 text-xs font-black uppercase tracking-widest transition-all ${calculatorShowBand ? 'bg-indigo-600 text-white border-indigo-500' : (darkMode ? 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900')}`}>{calculatorShowBand ? 'Hide Band' : 'Show Band'}</button>
                                    </div>

                                    <div className={`rounded-xl border p-4 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                                        <div className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-indigo-300' : 'text-indigo-700'}`}>Notation</div>
                                        <p className={`mt-2 text-sm leading-relaxed ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                                            This calculator reports the observed sample correlation as r. Population language uses rho, and rho0 names the null population correlation being tested.
                                        </p>
                                    </div>
                                </div>
                            )
                        ) : !parsedTable.ok ? (
                            <div className={`rounded-xl border p-4 ${darkMode ? 'bg-rose-500/10 border-rose-500/20 text-rose-200' : 'bg-rose-50 border-rose-200 text-rose-700'}`}>
                                {parsedTable.errors.join(' ')}
                            </div>
                        ) : numericColumns.length < 2 ? (
                            <div className={`rounded-xl border p-4 ${darkMode ? 'bg-rose-500/10 border-rose-500/20 text-rose-200' : 'bg-rose-50 border-rose-200 text-rose-700'}`}>
                                This table needs at least two numeric columns before Pearson correlation can run.
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <label className="block">
                                    <span className={`text-[11px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>X Variable</span>
                                    <select value={selectedX} onChange={(event) => setSelectedX(event.target.value)} className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm font-bold outline-none transition-colors ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200 focus:border-indigo-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500'}`}>
                                        {numericColumns.map((column) => <option key={column.name} value={column.name}>{column.name}</option>)}
                                    </select>
                                </label>

                                <label className="block">
                                    <span className={`text-[11px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>Y Variable</span>
                                    <select value={selectedY} onChange={(event) => setSelectedY(event.target.value)} className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm font-bold outline-none transition-colors ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200 focus:border-indigo-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500'}`}>
                                        {numericColumns.map((column) => <option key={column.name} value={column.name}>{column.name}</option>)}
                                    </select>
                                </label>

                                <div className={`rounded-xl border px-4 py-3 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                                    <div className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-indigo-300' : 'text-indigo-700'}`}>Complete cases</div>
                                    <p className={`mt-2 text-sm ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                                        {activeCompleteCaseSummary.usable} of {activeCompleteCaseSummary.total} rows are usable after dropping incomplete X or Y values.
                                    </p>
                                </div>

                                <div>
                                    <span className={`text-[11px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>Hypothesis Direction</span>
                                    <div className={`mt-2 rounded-xl border p-1 flex gap-1 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                                        {[
                                            ['two_tailed', 'Two-tailed'],
                                            ['positive', 'Positive'],
                                            ['negative', 'Negative'],
                                        ].map(([id, label]) => {
                                            const isActive = setupState === id;
                                            return (
                                                <button
                                                    key={id}
                                                    onClick={() => {
                                                        if (id === 'two_tailed') {
                                                            setTails(2);
                                                        } else {
                                                            setTails(1);
                                                            setDirection(id === 'negative' ? 'less' : 'greater');
                                                        }
                                                    }}
                                                    className={`flex-1 px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${isActive ? 'bg-indigo-600 text-white shadow-lg' : (darkMode ? 'text-slate-500 hover:text-slate-200 hover:bg-slate-900' : 'text-slate-500 hover:text-slate-900 hover:bg-white')}`}
                                                >
                                                    {label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <label className="block">
                                    <span className={`text-[11px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>Confidence Level</span>
                                    <select value={confidenceLevel} onChange={(event) => setConfidenceLevel(Number(event.target.value))} className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm font-bold outline-none transition-colors ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200 focus:border-indigo-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500'}`}>
                                        <option value={0.9}>90%</option>
                                        <option value={0.95}>95%</option>
                                        <option value={0.99}>99%</option>
                                    </select>
                                </label>

                                <label className="block">
                                    <span className={`text-[11px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>Null Population Correlation (rho0)</span>
                                    <input
                                        type="number"
                                        min={-0.95}
                                        max={0.95}
                                        step={0.01}
                                        value={rho0}
                                        onChange={(event) => {
                                            const numeric = Number(event.target.value);
                                            if (Number.isFinite(numeric)) {
                                                setRho0(Math.max(-0.95, Math.min(0.95, numeric)));
                                            }
                                        }}
                                        className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm font-bold outline-none transition-colors ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200 focus:border-indigo-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500'}`}
                                    />
                                    <p className={`mt-2 text-xs leading-relaxed ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                                        Usually 0. This is the population correlation value the hypothesis test is evaluated against.
                                    </p>
                                </label>

                                <div className="grid grid-cols-2 gap-3">
                                    <button onClick={() => setCalculatorShowLine((value) => !value)} className={`rounded-xl border px-4 py-3 text-xs font-black uppercase tracking-widest transition-all ${calculatorShowLine ? 'bg-indigo-600 text-white border-indigo-500' : (darkMode ? 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900')}`}>{calculatorShowLine ? 'Hide Line' : 'Show Line'}</button>
                                    <button onClick={() => setCalculatorShowBand((value) => !value)} className={`rounded-xl border px-4 py-3 text-xs font-black uppercase tracking-widest transition-all ${calculatorShowBand ? 'bg-indigo-600 text-white border-indigo-500' : (darkMode ? 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900')}`}>{calculatorShowBand ? 'Hide Band' : 'Show Band'}</button>
                                </div>

                                <div className={`rounded-xl border p-4 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                                    <div className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-indigo-300' : 'text-indigo-700'}`}>Notation</div>
                                    <p className={`mt-2 text-sm leading-relaxed ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                                        This calculator reports the observed sample correlation as r. Population language uses rho, and rho0 names the null population correlation being tested.
                                    </p>
                                </div>
                            </div>
                        )}
                    </Card>

                    <Card darkMode={darkMode}>
                        <div className="flex items-center gap-3 mb-4">
                            <AlertTriangle size={18} className={darkMode ? 'text-amber-300' : 'text-amber-700'} />
                            <div>
                                <div className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>Guidance</div>
                                <h3 className={`text-xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>Plot before inference</h3>
                            </div>
                        </div>

                        <div className="space-y-3">
                            {calculatorGuidance.length > 0 ? calculatorGuidance.map((item) => (
                                <div key={item.title} className={`rounded-xl border p-4 ${item.tone === 'warning' ? (darkMode ? 'bg-amber-500/10 border-amber-500/20' : 'bg-amber-50 border-amber-200') : (darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200')}`}>
                                    <div className={`text-[10px] font-black uppercase tracking-widest ${item.tone === 'warning' ? (darkMode ? 'text-amber-300' : 'text-amber-700') : (darkMode ? 'text-slate-500' : 'text-slate-500')}`}>{item.title}</div>
                                    <p className={`mt-2 text-sm ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>{item.body}</p>
                                </div>
                            )) : (
                                <div className={`rounded-xl border p-4 ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                                    Load two usable variables to see Pearson-specific warnings and reminders.
                                </div>
                            )}
                        </div>
                    </Card>
                </div>

                <div className="lg:col-span-8 space-y-6">
                    <Card darkMode={darkMode}>
                        <PearsonScatterplot
                            pairs={calculatorStats?.pairs || []}
                            stats={calculatorStats}
                            darkMode={darkMode}
                            xLabel={activeXLabel}
                            yLabel={activeYLabel}
                            showLine={calculatorShowLine}
                            showConfidenceBand={calculatorShowBand}
                            confidenceLevel={confidenceLevel}
                            highlightPointIndex={influentialIndex}
                            title="Scatterplot"
                            subtitle="Pearson correlation is a straight-line summary, so the plot comes first."
                        />
                    </Card>

                    {!calculatorStats?.ok ? (
                        <div className={`rounded-2xl border p-5 ${darkMode ? 'bg-rose-500/10 border-rose-500/20 text-rose-200' : 'bg-rose-50 border-rose-200 text-rose-700'}`}>
                            {calculatorStats?.errors?.join(' ') || 'Choose two different numeric columns to compute Pearson correlation.'}
                        </div>
                    ) : (
                        <>
                            <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
                                <MetricTile darkMode={darkMode} label="r" value={formatStat(calculatorStats.r, 3)} tone="primary" />
                                <MetricTile darkMode={darkMode} label="r²" value={formatStat(calculatorStats.rSquared, 3)} />
                                <MetricTile darkMode={darkMode} label="n" value={`${calculatorStats.n}`} />
                                <MetricTile darkMode={darkMode} label="Interpretation" value={calculatorStats.interpretation} />
                            </div>

                            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
                                <MetricTile darkMode={darkMode} label={`${calculatorStats.hypothesisTest?.statisticLabel || 't'} Statistic`} value={formatStat(calculatorStats.hypothesisTest?.testStatistic, 3)} detail={calculatorStats.hypothesisTest?.method === 'fisher_z' ? 'Fisher z approximation for nonzero ρ₀.' : 'Exact t test when ρ₀ = 0.'} />
                                <MetricTile darkMode={darkMode} label="Degrees of Freedom" value={calculatorStats.hypothesisTest?.df == null ? 'Fisher z' : `${calculatorStats.hypothesisTest.df}`} />
                                <MetricTile darkMode={darkMode} label="p-value" value={formatPValue(calculatorStats.hypothesisTest?.pValue)} detail={`Tested against ρ₀ = ${formatStat(rho0, 2)}.`} />
                            </div>

                            <Card darkMode={darkMode}>
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <div className={`text-[10px] font-black uppercase tracking-widest mb-2 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>Confidence Interval</div>
                                        <h3 className={`text-xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>{Math.round(confidenceLevel * 100)}% CI for r</h3>
                                        <p className={`mt-2 text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                            {calculatorStats.confidenceInterval ? `[${formatStat(calculatorStats.confidenceInterval.lower, 3)}, ${formatStat(calculatorStats.confidenceInterval.upper, 3)}]` : 'Not enough data to estimate the Fisher-z interval.'}
                                        </p>
                                    </div>
                                    <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${darkMode ? 'bg-slate-950 border border-slate-800 text-slate-400' : 'bg-slate-50 border border-slate-200 text-slate-600'}`}>
                                        {activeXLabel} vs {activeYLabel}
                                    </div>
                                </div>
                            </Card>
                        </>
                    )}
                </div>
            </div>

            {assumptions.length > 0 && (
                <Card darkMode={darkMode}>
                    <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-xl ${darkMode ? 'bg-indigo-500/10 text-indigo-300' : 'bg-indigo-50 text-indigo-700'}`}>
                            <CheckCircle size={20} />
                        </div>
                        <div>
                            <div className={`text-[10px] font-black uppercase tracking-widest mb-2 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
                                Guidance / Assumptions
                            </div>
                            <h3 className={`text-xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                What to check before trusting r
                            </h3>
                            <p className={`mt-2 text-sm max-w-3xl ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                Treat these as practical checks, not as a rigid pass/fail gate. The goal is to understand when Pearson r is an honest summary and when the plot or study design is asking for more caution.
                            </p>
                        </div>
                    </div>

                    <div className="mt-6 space-y-3">
                        {assumptions.map((assumption, index) => (
                            <AssumptionItem key={`${assumption.label}-${index}`} assumption={assumption} darkMode={darkMode} />
                        ))}
                    </div>
                </Card>
            )}
        </div>
    );
}
