import React, { useEffect, useMemo, useState } from 'react';
import {
    AlertTriangle,
    Calculator,
    CheckCircle,
    Database,
    FileUp,
    Info,
    RefreshCw,
    Sigma,
    SlidersHorizontal,
    Sparkles,
    Target,
    TrendingUp,
} from 'lucide-react';
import AssumptionItem from '../formula/AssumptionItem';
import PowerAnalysisTab from '../power/PowerAnalysisTab';
import RegressionResidualPlot from './RegressionResidualPlot';
import ObservedFittedPlot from './ObservedFittedPlot';
import {
    buildMultipleRegressionGuidance,
    buildMultipleRegressionInterpretation,
    buildMultipleRegressionTutorDataset,
    calculateMultipleRegressionPrediction,
    calculateMultipleRegressionStats,
} from '../../stats/multipleRegression.js';
import { rSquaredToFSquared } from '../../stats/regression.js';
import { parseDelimitedTable } from '../../utils/delimitedTable.js';

const SAMPLE_DATASET = `Study Hours,Sleep Hours,Practice Problems,Stress Level,Exam Score
2,5.9,18,8.3,56
3,6.1,21,8.0,58
4,6.2,26,7.7,62
5,6.4,29,7.2,65
6,6.5,34,6.8,69
7,6.8,39,6.4,73
8,7.0,45,6.0,77
9,7.2,50,5.6,80
10,7.3,57,5.1,84
11,7.5,63,4.8,87
12,7.7,68,4.4,90
13,7.8,74,4.0,92
14,8.0,79,3.6,94
15,8.1,84,3.2,96
16,8.3,90,2.9,98`;

const TUTOR_SCENARIOS = [
    {
        id: 'balanced',
        label: 'Balanced Predictors',
        description: 'Both predictors add useful signal with moderate overlap.',
        settings: { beta1: 1.1, beta2: 0.8, predictorCorrelation: 0.35, noise: 1.05, sampleSize: 84 },
    },
    {
        id: 'x1_dominant',
        label: 'X1 Dominant',
        description: 'One predictor carries most of the conditional slope.',
        settings: { beta1: 1.35, beta2: 0.35, predictorCorrelation: 0.2, noise: 1.0, sampleSize: 84 },
    },
    {
        id: 'competing',
        label: 'Competing Slopes',
        description: 'One predictor raises Y while the other lowers it.',
        settings: { beta1: 1.05, beta2: -0.85, predictorCorrelation: 0.25, noise: 1.1, sampleSize: 84 },
    },
    {
        id: 'overlap',
        label: 'Shared Overlap',
        description: 'High predictor overlap makes coefficients work harder to separate.',
        settings: { beta1: 1.0, beta2: 0.9, predictorCorrelation: 0.72, noise: 1.0, sampleSize: 96 },
    },
    {
        id: 'collinearity',
        label: 'Collinearity Stress',
        description: 'Very high predictor correlation can inflate instability even with decent R^2.',
        settings: { beta1: 1.0, beta2: 0.9, predictorCorrelation: 0.88, noise: 1.05, sampleSize: 96 },
    },
];

const Card = ({ darkMode, children, className = '' }) => (
    <div className={`rounded-2xl border p-6 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} ${className}`}>
        {children}
    </div>
);

const MetricTile = ({ darkMode, label, value, detail = null, tone = 'default' }) => {
    const toneClass = tone === 'primary'
        ? (darkMode ? 'bg-indigo-500/10 border-indigo-500/30' : 'bg-indigo-50 border-indigo-200')
        : tone === 'warning'
            ? (darkMode ? 'bg-amber-500/10 border-amber-500/20' : 'bg-amber-50 border-amber-200')
            : (darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200');

    return (
        <div className={`rounded-xl border p-4 ${toneClass}`}>
            <div className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                {label}
            </div>
            <div className={`mt-2 text-2xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                {value}
            </div>
            {detail && (
                <p className={`mt-2 text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                    {detail}
                </p>
            )}
        </div>
    );
};

const formatStat = (value, digits = 3) => {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) {
        return '--';
    }
    return numeric.toFixed(digits).replace(/\.?0+$/, '');
};

const formatPValue = (value) => {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) {
        return '--';
    }
    if (numeric < 0.001) {
        return '< .001';
    }
    return `= ${numeric.toFixed(3).replace(/^0/, '')}`;
};

const clampToRange = (value, min, max) => {
    const numeric = Number(value);

    if (!Number.isFinite(numeric)) {
        return min;
    }

    return Math.min(max, Math.max(min, numeric));
};

const buildEquationText = ({ stats, outcomeLabel = 'Y' }) => {
    if (!stats?.ok) {
        return 'Regression equation unavailable';
    }

    const terms = stats.coefficients
        .filter((coefficient) => coefficient.id !== 'intercept')
        .map((coefficient) => `${coefficient.estimate >= 0 ? '+' : '-'} ${formatStat(Math.abs(coefficient.estimate), 3)} * ${coefficient.label}`);

    return `${outcomeLabel} = ${formatStat(stats.intercept, 3)} ${terms.join(' ')}`;
};

const buildPredictionInputsFromStats = (stats, previous = {}) => {
    if (!stats?.ok) {
        return {};
    }

    return Object.fromEntries(stats.predictorSummaries.map((summary) => {
        const existing = Number(previous?.[summary.label]);
        const resolved = Number.isFinite(existing)
            ? clampToRange(existing, summary.min, summary.max)
            : summary.mean;

        return [summary.label, Number(resolved.toFixed(3))];
    }));
};

const findDefaultPointId = (stats) => {
    if (!stats?.pairs?.length) {
        return null;
    }

    if (stats.influence?.influentialPoint?.id != null) {
        return stats.influence.influentialPoint.id;
    }

    return stats.pairs[Math.floor(stats.pairs.length / 2)]?.id ?? null;
};

const buildAdjustedRSquared = (rSquared, sampleSize, predictorCount) => {
    const fit = Number(rSquared);
    const n = Math.max(1, Number(sampleSize));
    const p = Math.max(1, Number(predictorCount));

    if (!(fit >= 0) || !(fit < 1) || !(n > p + 1)) {
        return null;
    }

    return 1 - (((1 - fit) * (n - 1)) / Math.max(1, n - p - 1));
};

const MultipleRegressionPage = ({
    section,
    darkMode,
    currentStats,
    onStatsChange,
    assumptions = [],
    testConfig,
    initialPowerMode,
}) => {
    const [lessonScenario, setLessonScenario] = useState('balanced');
    const [lessonBeta1, setLessonBeta1] = useState(1.1);
    const [lessonBeta2, setLessonBeta2] = useState(0.8);
    const [lessonPredictorCorrelation, setLessonPredictorCorrelation] = useState(0.35);
    const [lessonNoise, setLessonNoise] = useState(1.05);
    const [lessonSampleSize, setLessonSampleSize] = useState(84);
    const [lessonShowCoefficientTable, setLessonShowCoefficientTable] = useState(true);
    const [lessonShowPartialEffects, setLessonShowPartialEffects] = useState(true);
    const [lessonShowResiduals, setLessonShowResiduals] = useState(false);
    const [lessonOutlierOn, setLessonOutlierOn] = useState(false);
    const [lessonGenerationKey, setLessonGenerationKey] = useState(0);
    const [lessonSelectedPointId, setLessonSelectedPointId] = useState(null);
    const [lessonPredictionInputs, setLessonPredictionInputs] = useState({});

    const lessonDataset = useMemo(() => buildMultipleRegressionTutorDataset({
        sampleSize: lessonSampleSize,
        beta1: lessonBeta1,
        beta2: lessonBeta2,
        predictorCorrelation: lessonPredictorCorrelation,
        noise: lessonNoise,
        includeOutlier: lessonOutlierOn,
        generationKey: lessonGenerationKey,
    }), [lessonSampleSize, lessonBeta1, lessonBeta2, lessonPredictorCorrelation, lessonNoise, lessonOutlierOn, lessonGenerationKey]);

    const lessonStats = useMemo(() => calculateMultipleRegressionStats({
        outcomeValues: lessonDataset.outcomeValues,
        predictorColumns: lessonDataset.predictorColumns,
        confidenceLevel: 0.95,
    }), [lessonDataset]);

    const lessonPrediction = useMemo(() => calculateMultipleRegressionPrediction({
        stats: lessonStats,
        predictorValues: lessonPredictionInputs,
        confidenceLevel: 0.95,
    }), [lessonStats, lessonPredictionInputs]);

    const lessonSelectedPair = useMemo(
        () => lessonStats?.pairs?.find((pair) => pair.id === lessonSelectedPointId || pair.index === lessonSelectedPointId) || null,
        [lessonStats, lessonSelectedPointId]
    );

    useEffect(() => {
        if (!lessonStats?.ok) {
            setLessonSelectedPointId(null);
            setLessonPredictionInputs({});
            return;
        }

        setLessonSelectedPointId((previous) => {
            const hasPrevious = lessonStats.pairs.some((pair) => pair.id === previous || pair.index === previous);
            return hasPrevious ? previous : findDefaultPointId(lessonStats);
        });
        setLessonPredictionInputs((previous) => buildPredictionInputsFromStats(lessonStats, previous));
    }, [lessonStats]);

    const applyScenario = (scenarioId) => {
        const scenario = TUTOR_SCENARIOS.find((item) => item.id === scenarioId);

        if (!scenario) {
            return;
        }

        setLessonScenario(scenario.id);
        setLessonBeta1(scenario.settings.beta1);
        setLessonBeta2(scenario.settings.beta2);
        setLessonPredictorCorrelation(scenario.settings.predictorCorrelation);
        setLessonNoise(scenario.settings.noise);
        setLessonSampleSize(scenario.settings.sampleSize);
        setLessonGenerationKey((previous) => previous + 1);
    };

    const [tableText, setTableText] = useState(SAMPLE_DATASET);
    const [selectedOutcome, setSelectedOutcome] = useState('');
    const [selectedPredictors, setSelectedPredictors] = useState([]);
    const [confidenceLevel, setConfidenceLevel] = useState(0.95);
    const [calculatorSelectedPointId, setCalculatorSelectedPointId] = useState(null);
    const [calculatorPredictionInputs, setCalculatorPredictionInputs] = useState({});

    const parsedTable = useMemo(() => parseDelimitedTable(tableText), [tableText]);
    const numericColumns = parsedTable.numericColumns || [];

    useEffect(() => {
        if (!numericColumns.length) {
            setSelectedOutcome('');
            setSelectedPredictors([]);
            return;
        }

        setSelectedOutcome((previous) => {
            if (numericColumns.some((column) => column.name === previous)) {
                return previous;
            }

            return numericColumns[numericColumns.length - 1]?.name || '';
        });
    }, [numericColumns]);

    useEffect(() => {
        if (!numericColumns.length || !selectedOutcome) {
            return;
        }

        setSelectedPredictors((previous) => {
            const valid = previous.filter((name) => (
                name !== selectedOutcome && numericColumns.some((column) => column.name === name)
            ));

            if (valid.length >= 2) {
                return valid;
            }

            const fallback = numericColumns
                .filter((column) => column.name !== selectedOutcome)
                .slice(0, Math.max(0, Math.min(3, numericColumns.length - 1)))
                .map((column) => column.name);

            return [...new Set([...valid, ...fallback])].slice(0, Math.max(0, Math.min(3, numericColumns.length - 1)));
        });
    }, [numericColumns, selectedOutcome]);

    const selectedOutcomeColumn = numericColumns.find((column) => column.name === selectedOutcome) || null;
    const selectedPredictorColumns = numericColumns.filter((column) => selectedPredictors.includes(column.name));

    const calculatorStats = useMemo(() => calculateMultipleRegressionStats({
        outcomeValues: selectedOutcomeColumn?.numericValues || [],
        predictorColumns: selectedPredictorColumns,
        confidenceLevel,
        alpha: 1 - confidenceLevel,
    }), [selectedOutcomeColumn, selectedPredictorColumns, confidenceLevel]);

    const calculatorGuidance = useMemo(
        () => buildMultipleRegressionGuidance(calculatorStats),
        [calculatorStats]
    );

    const calculatorPrediction = useMemo(() => calculateMultipleRegressionPrediction({
        stats: calculatorStats,
        predictorValues: calculatorPredictionInputs,
        confidenceLevel,
    }), [calculatorStats, calculatorPredictionInputs, confidenceLevel]);

    const calculatorSelectedPair = useMemo(
        () => calculatorStats?.pairs?.find((pair) => pair.id === calculatorSelectedPointId || pair.index === calculatorSelectedPointId) || null,
        [calculatorStats, calculatorSelectedPointId]
    );

    useEffect(() => {
        if (calculatorStats?.ok && typeof onStatsChange === 'function') {
            onStatsChange(calculatorStats);
        }
    }, [calculatorStats, onStatsChange]);

    useEffect(() => {
        if (!calculatorStats?.ok) {
            setCalculatorSelectedPointId(null);
            setCalculatorPredictionInputs({});
            return;
        }

        setCalculatorSelectedPointId((previous) => {
            const hasPrevious = calculatorStats.pairs.some((pair) => pair.id === previous || pair.index === previous);
            return hasPrevious ? previous : findDefaultPointId(calculatorStats);
        });
        setCalculatorPredictionInputs((previous) => buildPredictionInputsFromStats(calculatorStats, previous));
    }, [calculatorStats]);

    const effectSourceStats = currentStats?.ok ? currentStats : (calculatorStats?.ok ? calculatorStats : null);
    const [effectRSquared, setEffectRSquared] = useState(0.35);
    const [effectSampleSize, setEffectSampleSize] = useState(90);
    const [effectPredictorCount, setEffectPredictorCount] = useState(2);

    useEffect(() => {
        if (Number.isFinite(effectSourceStats?.rSquared)) {
            setEffectRSquared(effectSourceStats.rSquared);
        }
        if (Number.isFinite(effectSourceStats?.n)) {
            setEffectSampleSize(effectSourceStats.n);
        }
        if (Number.isFinite(effectSourceStats?.predictorCount)) {
            setEffectPredictorCount(effectSourceStats.predictorCount);
        }
    }, [effectSourceStats?.rSquared, effectSourceStats?.n, effectSourceStats?.predictorCount]);

    const effectAdjustedRSquared = buildAdjustedRSquared(effectRSquared, effectSampleSize, effectPredictorCount);
    const effectFSquared = rSquaredToFSquared(effectRSquared);

    const onUpload = async (event) => {
        const file = event.target.files?.[0];
        if (!file) {
            return;
        }
        const text = await file.text();
        setTableText(text);
        event.target.value = '';
    };

    const togglePredictor = (predictorName) => {
        setSelectedPredictors((previous) => {
            if (previous.includes(predictorName)) {
                return previous.filter((item) => item !== predictorName);
            }

            return [...previous, predictorName];
        });
    };

    if (section === 'power') {
        return (
            <div className="space-y-8">
                <Card darkMode={darkMode}>
                    <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-xl ${darkMode ? 'bg-indigo-500/10 text-indigo-300' : 'bg-indigo-50 text-indigo-700'}`}>
                            <Target size={20} />
                        </div>
                        <div>
                            <h3 className={`text-xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                Multiple regression power planning
                            </h3>
                            <p className={`mt-2 text-sm max-w-3xl ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                This first slice uses the standard omnibus fixed-model test of whether model R^2 differs from 0. It keeps the power tab planning-oriented while the calculator handles coefficient-level observed-data output.
                            </p>
                        </div>
                    </div>
                </Card>

                <PowerAnalysisTab
                    testConfig={testConfig}
                    currentStats={currentStats}
                    darkMode={darkMode}
                    initialMode={initialPowerMode}
                />
            </div>
        );
    }

    if (section === 'effect_size') {
        return (
            <div className="space-y-8">
                {effectSourceStats?.ok && (
                    <Card darkMode={darkMode}>
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <div className={`text-[10px] font-black uppercase tracking-widest mb-2 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
                                    Current Calculator Snapshot
                                </div>
                                <h3 className={`text-2xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                    R^2 = {formatStat(effectSourceStats.rSquared, 3)}
                                </h3>
                                <p className={`mt-2 text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                    The active model uses {effectSourceStats.predictorCount} predictors, adjusted R^2 = {formatStat(effectSourceStats.adjustedRSquared, 3)}, and RMSE = {formatStat(effectSourceStats.rmse, 3)}.
                                </p>
                            </div>
                            <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${darkMode ? 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20' : 'bg-indigo-50 text-indigo-700 border border-indigo-200'}`}>
                                f^2 = {formatStat(rSquaredToFSquared(effectSourceStats.rSquared), 3)}
                            </div>
                        </div>
                    </Card>
                )}

                <div className="grid lg:grid-cols-12 gap-8">
                    <div className="lg:col-span-5">
                        <Card darkMode={darkMode} className="h-full">
                            <div className="flex items-center gap-3 mb-4">
                                <div className={`p-3 rounded-xl ${darkMode ? 'bg-indigo-500/10 text-indigo-300' : 'bg-indigo-50 text-indigo-700'}`}>
                                    <Sigma size={18} />
                                </div>
                                <div>
                                    <div className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
                                        Effect Size
                                    </div>
                                    <h3 className={`text-2xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                        Fit, complexity, and slope are different ideas
                                    </h3>
                                </div>
                            </div>

                            <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                In multiple regression, R^2 is the main overall fit summary. Adjusted R^2 discounts some of that fit for model complexity. The coefficients still matter, but they are not the same thing as overall effect size.
                            </p>

                            <div className="mt-6 grid gap-4">
                                <label className="block">
                                    <span className={`text-[11px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                                        Model Fit (R^2)
                                    </span>
                                    <input type="number" min={0} max={0.999} step={0.01} value={Number.isFinite(effectRSquared) ? effectRSquared : ''} onChange={(event) => {
                                        const numeric = Number(event.target.value);
                                        if (Number.isFinite(numeric)) {
                                            setEffectRSquared(Math.max(0, Math.min(0.999, numeric)));
                                        }
                                    }} className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm font-bold outline-none transition-colors ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200 focus:border-indigo-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500'}`} />
                                </label>

                                <label className="block">
                                    <span className={`text-[11px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                                        Sample Size (N)
                                    </span>
                                    <input type="number" min={4} step={1} value={Number.isFinite(effectSampleSize) ? effectSampleSize : ''} onChange={(event) => {
                                        const numeric = Number(event.target.value);
                                        if (Number.isFinite(numeric)) {
                                            setEffectSampleSize(Math.max(4, Math.round(numeric)));
                                        }
                                    }} className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm font-bold outline-none transition-colors ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200 focus:border-indigo-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500'}`} />
                                </label>

                                <label className="block">
                                    <span className={`text-[11px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                                        Predictor Count
                                    </span>
                                    <input type="number" min={2} step={1} value={Number.isFinite(effectPredictorCount) ? effectPredictorCount : ''} onChange={(event) => {
                                        const numeric = Number(event.target.value);
                                        if (Number.isFinite(numeric)) {
                                            setEffectPredictorCount(Math.max(2, Math.round(numeric)));
                                        }
                                    }} className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm font-bold outline-none transition-colors ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200 focus:border-indigo-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500'}`} />
                                </label>
                            </div>
                        </Card>
                    </div>

                    <div className="lg:col-span-7 space-y-6">
                        <div className="grid md:grid-cols-3 gap-4">
                            <MetricTile
                                darkMode={darkMode}
                                label="R^2"
                                value={formatStat(effectRSquared, 3)}
                                detail={`${formatStat(effectRSquared * 100, 1)}% of the outcome variance is explained by the full model.`}
                                tone="primary"
                            />
                            <MetricTile
                                darkMode={darkMode}
                                label="Adjusted R^2"
                                value={formatStat(effectAdjustedRSquared, 3)}
                                detail="Adjusted R^2 pulls the fit estimate back a bit when the model uses more predictors."
                            />
                            <MetricTile
                                darkMode={darkMode}
                                label="Cohen's f^2"
                                value={formatStat(effectFSquared, 3)}
                                detail="The shared power-analysis architecture uses f^2 = R^2 / (1 - R^2) for this omnibus regression slice."
                            />
                        </div>

                        <Card darkMode={darkMode}>
                            <div className="flex items-center gap-3 mb-4">
                                <TrendingUp size={18} className={darkMode ? 'text-emerald-300' : 'text-emerald-700'} />
                                <h3 className={`text-lg font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                    What the effect-size numbers are telling you
                                </h3>
                            </div>
                            <div className="space-y-4">
                                <div className={`rounded-xl border p-4 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                                    <div className={`text-[10px] font-black uppercase tracking-widest mb-2 ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>Overall fit</div>
                                    <p className={`text-sm ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                                        R^2 is the share of outcome variance explained by the whole predictor set together. It is an overall model-fit story, not a statement that every coefficient is equally important.
                                    </p>
                                </div>
                                <div className={`rounded-xl border p-4 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                                    <div className={`text-[10px] font-black uppercase tracking-widest mb-2 ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>Conditional slopes</div>
                                    <p className={`text-sm ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                                        Each coefficient is a conditional rate of change: how predicted Y changes for one predictor after the others in the model are held constant. That means slope size depends on units and overlap among predictors.
                                    </p>
                                </div>
                                <div className={`rounded-xl border p-4 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                                    <div className={`text-[10px] font-black uppercase tracking-widest mb-2 ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>Shared variance</div>
                                    <p className={`text-sm ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                                        When predictors overlap, a model can still have a strong R^2 while individual coefficients become unstable. That is why adjusted R^2 and collinearity checks belong in the same conversation.
                                    </p>
                                </div>
                            </div>
                        </Card>

                        {effectSourceStats?.ok && (
                            <Card darkMode={darkMode}>
                                <div className="flex items-center gap-3 mb-4">
                                    <Calculator size={18} className={darkMode ? 'text-sky-300' : 'text-sky-700'} />
                                    <h3 className={`text-lg font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                        Current conditional slopes
                                    </h3>
                                </div>

                                <div className="grid md:grid-cols-2 gap-4">
                                    {effectSourceStats.coefficients.filter((coefficient) => coefficient.id !== 'intercept').map((coefficient) => (
                                        <div key={coefficient.id} className={`rounded-xl border p-4 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                                            <div className={`text-[10px] font-black uppercase tracking-widest mb-2 ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>{coefficient.label}</div>
                                            <p className={`text-xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                                b = {formatStat(coefficient.estimate, 3)}
                                            </p>
                                            <p className={`mt-2 text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                                {coefficient.interpretation}
                                            </p>
                                            <p className={`mt-3 text-xs font-bold uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                                                Standardized beta {formatStat(coefficient.standardizedBeta, 3)} | VIF {formatStat(coefficient.vif, 2)}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    if (section === 'calculator') {
        return (
            <div className="space-y-8">
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

                <div className="grid lg:grid-cols-12 gap-8 items-start">
                    <div className="lg:col-span-4 space-y-6">
                        <Card darkMode={darkMode}>
                            <div className="flex items-center gap-3 mb-4">
                                <Database size={18} className={darkMode ? 'text-sky-300' : 'text-sky-700'} />
                                <h3 className={`text-lg font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                    Data workspace
                                </h3>
                            </div>

                            <div className="flex flex-wrap gap-3">
                                <label className={`inline-flex items-center gap-2 px-4 py-3 rounded-xl cursor-pointer font-bold text-sm border ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200 hover:border-slate-700' : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'}`}>
                                    <FileUp size={16} />
                                    Upload CSV
                                    <input type="file" accept=".csv,.tsv,.txt" className="hidden" onChange={onUpload} />
                                </label>
                                <button
                                    onClick={() => setTableText(SAMPLE_DATASET)}
                                    className={`px-4 py-3 rounded-xl font-bold text-sm border ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200 hover:border-slate-700' : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'}`}
                                >
                                    Load Sample Dataset
                                </button>
                            </div>

                            <label className="block mt-5">
                                <span className={`text-[11px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                                    Paste CSV / Table Data
                                </span>
                                <textarea
                                    value={tableText}
                                    onChange={(event) => setTableText(event.target.value)}
                                    rows={12}
                                    className={`mt-2 w-full rounded-2xl border px-4 py-3 text-sm font-medium outline-none resize-y transition-colors ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200 focus:border-indigo-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500'}`}
                                />
                            </label>

                            <label className="block">
                                <span className={`text-[11px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                                    Outcome Variable (Y)
                                </span>
                                <select value={selectedOutcome} onChange={(event) => setSelectedOutcome(event.target.value)} className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm font-bold outline-none transition-colors ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200 focus:border-indigo-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500'}`}>
                                    {numericColumns.map((column) => (
                                        <option key={column.name} value={column.name}>{column.name}</option>
                                    ))}
                                </select>
                            </label>

                            <div>
                                <div className={`text-[11px] font-black uppercase tracking-widest mb-3 ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                                    Predictor Variables (Select 2+)
                                </div>
                                <div className="space-y-2">
                                    {numericColumns.filter((column) => column.name !== selectedOutcome).map((column) => (
                                        <label key={column.name} className={`flex items-center gap-3 rounded-xl border px-4 py-3 cursor-pointer ${selectedPredictors.includes(column.name) ? (darkMode ? 'bg-indigo-500/10 border-indigo-500/30 text-white' : 'bg-indigo-50 border-indigo-200 text-slate-900') : (darkMode ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700')}`}>
                                            <input
                                                type="checkbox"
                                                checked={selectedPredictors.includes(column.name)}
                                                onChange={() => togglePredictor(column.name)}
                                                className="rounded border-slate-400"
                                            />
                                            <span className="font-bold text-sm">{column.name}</span>
                                        </label>
                                    ))}
                                </div>
                                <p className={`mt-3 text-sm ${darkMode ? 'text-slate-500' : 'text-slate-600'}`}>
                                    This first page is focused on quantitative predictors only. Coefficients are interpreted conditionally on the other predictors in the model.
                                </p>
                            </div>

                            <label className="block">
                                <span className={`text-[11px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                                    Confidence Level
                                </span>
                                <input
                                    type="number"
                                    min={0.8}
                                    max={0.99}
                                    step={0.01}
                                    value={confidenceLevel}
                                    onChange={(event) => {
                                        const numeric = Number(event.target.value);
                                        if (numeric >= 0.8 && numeric < 1) {
                                            setConfidenceLevel(numeric);
                                        }
                                    }}
                                    className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm font-bold outline-none transition-colors ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200 focus:border-indigo-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500'}`}
                                />
                            </label>
                        </Card>
                    </div>

                    <div className="lg:col-span-8 space-y-6">
                        {!calculatorStats?.ok ? (
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
                                            {(calculatorStats?.errors || ['Choose one outcome and at least two predictors to fit the multiple-regression model.']).map((error) => (
                                                <p key={error}>{error}</p>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        ) : (
                            <>
                                <div className="grid md:grid-cols-2 xl:grid-cols-5 gap-4">
                                    <MetricTile darkMode={darkMode} label="R^2" value={formatStat(calculatorStats.rSquared, 3)} detail={`${formatStat(calculatorStats.rSquared * 100, 1)}% variance explained`} tone="primary" />
                                    <MetricTile darkMode={darkMode} label="Adjusted R^2" value={formatStat(calculatorStats.adjustedRSquared, 3)} detail="Complexity-adjusted model fit" />
                                    <MetricTile darkMode={darkMode} label="RMSE" value={formatStat(calculatorStats.rmse, 3)} detail="Typical prediction error size" />
                                    <MetricTile darkMode={darkMode} label="Model F" value={formatStat(calculatorStats.modelF, 3)} detail={`p ${formatPValue(calculatorStats.modelPValue)}`} />
                                    <MetricTile darkMode={darkMode} label="Max VIF" value={formatStat(calculatorStats.maxVIF, 2)} detail={`${calculatorStats.collinearityLabel} predictor overlap`} tone={calculatorStats.maxVIF >= 5 ? 'warning' : 'default'} />
                                </div>

                                <Card darkMode={darkMode}>
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <div className={`text-[10px] font-black uppercase tracking-widest mb-2 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
                                                Fitted Model
                                            </div>
                                            <h3 className={`text-xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                                {buildEquationText({ stats: calculatorStats, outcomeLabel: selectedOutcome || 'Y' })}
                                            </h3>
                                            <p className={`mt-2 text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                                {buildMultipleRegressionInterpretation(calculatorStats, selectedOutcome || 'Y')}
                                            </p>
                                        </div>
                                        <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${darkMode ? 'bg-slate-950 border border-slate-800 text-slate-400' : 'bg-slate-50 border border-slate-200 text-slate-600'}`}>
                                            F({calculatorStats.dfModel}, {calculatorStats.dfError}) = {formatStat(calculatorStats.modelF, 3)}, p {formatPValue(calculatorStats.modelPValue)}
                                        </div>
                                    </div>
                                </Card>

                                <div className="grid xl:grid-cols-2 gap-6">
                                    <Card darkMode={darkMode}>
                                        <ObservedFittedPlot
                                            stats={calculatorStats}
                                            darkMode={darkMode}
                                            selectedPointId={calculatorSelectedPointId}
                                            onPointSelect={setCalculatorSelectedPointId}
                                            predictionTarget={calculatorPrediction}
                                            subtitle="The diagonal is perfect prediction. Click a case to inspect how far its observed outcome sits above or below the fitted value."
                                            yLabel={selectedOutcome || 'Observed Y'}
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

                                <Card darkMode={darkMode}>
                                    <div className="grid lg:grid-cols-12 gap-6 items-start">
                                        <div className="lg:col-span-5">
                                            <div className="flex items-center gap-3 mb-4">
                                                <Target size={18} className={darkMode ? 'text-amber-300' : 'text-amber-700'} />
                                                <h3 className={`text-lg font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                                    Predict from the fitted model
                                                </h3>
                                            </div>

                                            <div className="space-y-4">
                                                {calculatorStats.predictorSummaries.map((summary) => (
                                                    <label key={summary.label} className="block">
                                                        <span className={`text-[11px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                                                            {summary.label}
                                                        </span>
                                                        <input
                                                            type="number"
                                                            step={0.1}
                                                            value={calculatorPredictionInputs?.[summary.label] ?? ''}
                                                            onChange={(event) => setCalculatorPredictionInputs((previous) => ({
                                                                ...previous,
                                                                [summary.label]: event.target.value,
                                                            }))}
                                                            className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm font-bold outline-none transition-colors ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200 focus:border-indigo-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500'}`}
                                                        />
                                                        <div className={`mt-2 text-xs ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                                                            Observed range {formatStat(summary.min, 2)} to {formatStat(summary.max, 2)}
                                                        </div>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="lg:col-span-7">
                                            <div className="grid md:grid-cols-3 gap-4">
                                                <div className={`rounded-xl border p-4 ${darkMode ? 'bg-indigo-500/10 border-indigo-500/20' : 'bg-indigo-50 border-indigo-200'}`}>
                                                    <div className={`text-[10px] font-black uppercase tracking-widest mb-2 ${darkMode ? 'text-indigo-300' : 'text-indigo-700'}`}>Predicted Mean {selectedOutcome || 'Y'}</div>
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
                                                Multiple regression predicts the mean outcome from the whole predictor profile at once. The prediction interval is wider because individual cases still vary around that mean prediction.
                                            </p>

                                            {calculatorPrediction?.isExtrapolation && (
                                                <div className={`mt-4 rounded-xl border p-4 ${darkMode ? 'bg-amber-500/10 border-amber-500/20 text-amber-200' : 'bg-amber-50 border-amber-200 text-amber-700'}`}>
                                                    At least one predictor value is outside the observed range, so this is an extrapolation rather than a within-sample interpolation.
                                                </div>
                                            )}

                                            <div className={`mt-6 rounded-xl border p-4 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                                                <div className={`text-[10px] font-black uppercase tracking-widest mb-2 ${darkMode ? 'text-amber-300' : 'text-amber-700'}`}>Selected Case</div>
                                                <p className={`text-sm ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                                                    Click a point in the observed-vs-fitted plot to inspect how one case sits around the model.
                                                </p>
                                                <div className="mt-4 grid md:grid-cols-3 gap-3">
                                                    <div className={`rounded-xl border p-3 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                                                        <div className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>Observed {selectedOutcome || 'Y'}</div>
                                                        <p className={`mt-1 text-lg font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>{formatStat(calculatorSelectedPair?.y, 3)}</p>
                                                    </div>
                                                    <div className={`rounded-xl border p-3 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                                                        <div className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>Fitted {selectedOutcome || 'Y'}</div>
                                                        <p className={`mt-1 text-lg font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>{formatStat(calculatorSelectedPair?.fitted, 3)}</p>
                                                    </div>
                                                    <div className={`rounded-xl border p-3 ${darkMode ? 'bg-amber-500/10 border-amber-500/20' : 'bg-amber-50 border-amber-200'}`}>
                                                        <div className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-amber-300' : 'text-amber-700'}`}>Residual</div>
                                                        <p className={`mt-1 text-lg font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>{formatStat(calculatorSelectedPair?.residual, 3)}</p>
                                                    </div>
                                                </div>
                                            </div>
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

                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[760px] text-sm">
                                            <thead>
                                                <tr className={darkMode ? 'text-slate-500' : 'text-slate-500'}>
                                                    <th className="text-left pb-3 font-black uppercase tracking-widest text-[10px]">Term</th>
                                                    <th className="text-left pb-3 font-black uppercase tracking-widest text-[10px]">Estimate</th>
                                                    <th className="text-left pb-3 font-black uppercase tracking-widest text-[10px]">SE</th>
                                                    <th className="text-left pb-3 font-black uppercase tracking-widest text-[10px]">t</th>
                                                    <th className="text-left pb-3 font-black uppercase tracking-widest text-[10px]">p</th>
                                                    <th className="text-left pb-3 font-black uppercase tracking-widest text-[10px]">Std. Beta</th>
                                                    <th className="text-left pb-3 font-black uppercase tracking-widest text-[10px]">VIF</th>
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
                                                        <td className="py-3">{coefficient.standardizedBeta == null ? '--' : formatStat(coefficient.standardizedBeta, 3)}</td>
                                                        <td className="py-3">{coefficient.vif == null ? '--' : formatStat(coefficient.vif, 2)}</td>
                                                        <td className="py-3">[{formatStat(coefficient.confidenceInterval.lower, 3)}, {formatStat(coefficient.confidenceInterval.upper, 3)}]</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </Card>

                                <div className="grid xl:grid-cols-2 gap-6">
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
                                                        {coefficient.interpretation.replace('predicted Y', `predicted ${selectedOutcome || 'Y'}`)}
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
                                    What to check before trusting the model
                                </h3>
                                <p className={`mt-2 text-sm max-w-3xl ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                    Treat these as practical checks rather than a rigid fail gate. The goal is to understand when one linear conditional-mean model is useful and when overlap, residual patterns, or study design call for more caution.
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

    return (
        <div className="space-y-8">
            <Card darkMode={darkMode}>
                <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-xl ${darkMode ? 'bg-indigo-500/10 text-indigo-300' : 'bg-indigo-50 text-indigo-700'}`}>
                        <Sparkles size={20} />
                    </div>
                    <div>
                        <h3 className={`text-xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>Multiple regression tutor / lessons</h3>
                        <p className={`mt-2 text-sm max-w-3xl ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                            This first slice is an interactive concept page rather than a formal lesson engine. Use the controls to see what changes when the model has more than one predictor: conditional coefficients, shared variance, prediction, residuals, and collinearity.
                        </p>
                    </div>
                </div>
            </Card>

            <div className="grid lg:grid-cols-12 gap-8 items-start">
                <div className="lg:col-span-8 space-y-6">
                    <Card darkMode={darkMode}>
                        <ObservedFittedPlot
                            stats={lessonStats}
                            darkMode={darkMode}
                            selectedPointId={lessonSelectedPointId}
                            onPointSelect={setLessonSelectedPointId}
                            predictionTarget={lessonPrediction}
                            subtitle="The model predicts Y from the whole predictor profile at once. Click a point to inspect one case, or change X1 and X2 below to see how the fitted mean moves."
                            yLabel="Observed Outcome"
                        />
                    </Card>

                    {lessonShowResiduals && lessonStats?.ok && (
                        <Card darkMode={darkMode}>
                            <RegressionResidualPlot
                                stats={lessonStats}
                                darkMode={darkMode}
                                highlightPointIndex={lessonSelectedPointId}
                                subtitle="Residuals are observed Y - fitted Y. Patternless residuals support the linear conditional-mean story; patterns suggest the model is missing something."
                            />
                        </Card>
                    )}

                    <div className="grid md:grid-cols-2 xl:grid-cols-5 gap-4">
                        <MetricTile darkMode={darkMode} label="b1" value={formatStat(lessonStats?.coefficients?.find((coefficient) => coefficient.id === 'Predictor X1')?.estimate, 3)} detail="Conditional slope for X1" tone="primary" />
                        <MetricTile darkMode={darkMode} label="b2" value={formatStat(lessonStats?.coefficients?.find((coefficient) => coefficient.id === 'Predictor X2')?.estimate, 3)} detail="Conditional slope for X2" tone="primary" />
                        <MetricTile darkMode={darkMode} label="Intercept" value={formatStat(lessonStats?.intercept, 3)} detail="Predicted Y when both predictors are 0" />
                        <MetricTile darkMode={darkMode} label="R^2" value={formatStat(lessonStats?.rSquared, 3)} detail="Overall model fit" />
                        <MetricTile darkMode={darkMode} label="Max VIF" value={formatStat(lessonStats?.maxVIF, 2)} detail={`${lessonStats?.collinearityLabel || 'Low'} overlap`} tone={lessonStats?.maxVIF >= 5 ? 'warning' : 'default'} />
                    </div>

                    <div className="grid xl:grid-cols-2 gap-6">
                        <Card darkMode={darkMode}>
                            <div className="flex items-center gap-3 mb-4">
                                <Target size={18} className={darkMode ? 'text-amber-300' : 'text-amber-700'} />
                                <h3 className={`text-lg font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                    Prediction playground
                                </h3>
                            </div>

                            <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                Regression is fundamentally a prediction model. Pick a joint X1/X2 profile and the page will show the fitted mean outcome for that combination.
                            </p>

                            <div className="mt-5 space-y-4">
                                {lessonStats?.predictorSummaries?.map((summary) => (
                                    <label key={summary.label} className="block">
                                        <span className={`text-[11px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                                            {summary.label}
                                        </span>
                                        <input
                                            type="range"
                                            min={summary.min}
                                            max={summary.max}
                                            step={0.05}
                                            value={lessonPredictionInputs?.[summary.label] ?? summary.mean}
                                            onChange={(event) => setLessonPredictionInputs((previous) => ({
                                                ...previous,
                                                [summary.label]: Number(event.target.value),
                                            }))}
                                            className="mt-3 w-full"
                                        />
                                        <div className={`mt-2 text-sm font-bold ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                                            {formatStat(lessonPredictionInputs?.[summary.label] ?? summary.mean, 2)}
                                        </div>
                                    </label>
                                ))}
                            </div>

                            <div className="mt-6 grid md:grid-cols-3 gap-4">
                                <div className={`rounded-xl border p-4 ${darkMode ? 'bg-indigo-500/10 border-indigo-500/20' : 'bg-indigo-50 border-indigo-200'}`}>
                                    <div className={`text-[10px] font-black uppercase tracking-widest mb-2 ${darkMode ? 'text-indigo-300' : 'text-indigo-700'}`}>Predicted Mean Y</div>
                                    <p className={`text-2xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>{formatStat(lessonPrediction?.fitted, 3)}</p>
                                </div>
                                <div className={`rounded-xl border p-4 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                                    <div className={`text-[10px] font-black uppercase tracking-widest mb-2 ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>95% Mean CI</div>
                                    <p className={`text-sm ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>[{formatStat(lessonPrediction?.meanInterval?.lower, 3)}, {formatStat(lessonPrediction?.meanInterval?.upper, 3)}]</p>
                                </div>
                                <div className={`rounded-xl border p-4 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                                    <div className={`text-[10px] font-black uppercase tracking-widest mb-2 ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>95% Prediction Interval</div>
                                    <p className={`text-sm ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>[{formatStat(lessonPrediction?.predictionInterval?.lower, 3)}, {formatStat(lessonPrediction?.predictionInterval?.upper, 3)}]</p>
                                </div>
                            </div>
                        </Card>

                        <Card darkMode={darkMode}>
                            <div className="flex items-center gap-3 mb-4">
                                <Info size={18} className={darkMode ? 'text-sky-300' : 'text-sky-700'} />
                                <h3 className={`text-lg font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                    One case under the model
                                </h3>
                            </div>

                            <div className="grid md:grid-cols-2 gap-4">
                                {lessonStats?.predictorSummaries?.map((summary) => (
                                    <div key={summary.label} className={`rounded-xl border p-4 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                                        <div className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>{summary.label}</div>
                                        <p className={`mt-2 text-lg font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>{formatStat(lessonSelectedPair?.predictors?.[summary.label], 3)}</p>
                                    </div>
                                ))}
                                <div className={`rounded-xl border p-4 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                                    <div className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>Observed Y</div>
                                    <p className={`mt-2 text-lg font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>{formatStat(lessonSelectedPair?.y, 3)}</p>
                                </div>
                                <div className={`rounded-xl border p-4 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                                    <div className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>Fitted Y</div>
                                    <p className={`mt-2 text-lg font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>{formatStat(lessonSelectedPair?.fitted, 3)}</p>
                                </div>
                                <div className={`rounded-xl border p-4 ${darkMode ? 'bg-amber-500/10 border-amber-500/20' : 'bg-amber-50 border-amber-200'}`}>
                                    <div className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-amber-300' : 'text-amber-700'}`}>Residual</div>
                                    <p className={`mt-2 text-lg font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>{formatStat(lessonSelectedPair?.residual, 3)}</p>
                                </div>
                            </div>

                            <p className={`mt-4 text-sm leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                Residual = observed Y - fitted Y. Multiple regression is about the fitted model and the remaining errors around it, not only about whether variables move together.
                            </p>
                        </Card>
                    </div>

                    {lessonShowPartialEffects && lessonStats?.ok && (
                        <Card darkMode={darkMode}>
                            <div className="flex items-center gap-3 mb-4">
                                <TrendingUp size={18} className={darkMode ? 'text-emerald-300' : 'text-emerald-700'} />
                                <h3 className={`text-lg font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                    Partial effect summaries
                                </h3>
                            </div>

                            <div className="grid md:grid-cols-2 gap-4">
                                {lessonStats.coefficients.filter((coefficient) => coefficient.id !== 'intercept').map((coefficient) => (
                                    <div key={coefficient.id} className={`rounded-xl border p-4 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                                        <div className="flex items-center justify-between gap-3">
                                            <h4 className={`font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>{coefficient.label}</h4>
                                            <div className={`px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${coefficient.vif >= 5 ? (darkMode ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20' : 'bg-amber-50 text-amber-700 border border-amber-200') : (darkMode ? 'bg-slate-900 border border-slate-800 text-slate-400' : 'bg-white border border-slate-200 text-slate-600')}`}>
                                                VIF {formatStat(coefficient.vif, 2)}
                                            </div>
                                        </div>
                                        <p className={`mt-2 text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                            {coefficient.interpretation}
                                        </p>
                                        <p className={`mt-3 text-xs font-bold uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                                            Zero-order r {formatStat(coefficient.zeroOrderCorrelation, 3)} | Standardized beta {formatStat(coefficient.standardizedBeta, 3)} | Partial R^2 {formatStat(coefficient.partialRSquared, 3)}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    )}

                    {lessonShowCoefficientTable && lessonStats?.ok && (
                        <Card darkMode={darkMode}>
                            <div className="flex items-center gap-3 mb-4">
                                <Calculator size={18} className={darkMode ? 'text-indigo-300' : 'text-indigo-700'} />
                                <h3 className={`text-lg font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                    Live coefficient table
                                </h3>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[760px] text-sm">
                                    <thead>
                                        <tr className={darkMode ? 'text-slate-500' : 'text-slate-500'}>
                                            <th className="text-left pb-3 font-black uppercase tracking-widest text-[10px]">Term</th>
                                            <th className="text-left pb-3 font-black uppercase tracking-widest text-[10px]">Estimate</th>
                                            <th className="text-left pb-3 font-black uppercase tracking-widest text-[10px]">SE</th>
                                            <th className="text-left pb-3 font-black uppercase tracking-widest text-[10px]">t</th>
                                            <th className="text-left pb-3 font-black uppercase tracking-widest text-[10px]">p</th>
                                            <th className="text-left pb-3 font-black uppercase tracking-widest text-[10px]">Std. Beta</th>
                                            <th className="text-left pb-3 font-black uppercase tracking-widest text-[10px]">VIF</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {lessonStats.coefficients.map((coefficient) => (
                                            <tr key={coefficient.id} className={`border-t ${darkMode ? 'border-slate-800 text-slate-200' : 'border-slate-200 text-slate-700'}`}>
                                                <td className="py-3 font-bold">{coefficient.label}</td>
                                                <td className="py-3">{formatStat(coefficient.estimate, 3)}</td>
                                                <td className="py-3">{formatStat(coefficient.standardError, 3)}</td>
                                                <td className="py-3">{formatStat(coefficient.tStatistic, 3)}</td>
                                                <td className="py-3">p {formatPValue(coefficient.pValue)}</td>
                                                <td className="py-3">{coefficient.standardizedBeta == null ? '--' : formatStat(coefficient.standardizedBeta, 3)}</td>
                                                <td className="py-3">{coefficient.vif == null ? '--' : formatStat(coefficient.vif, 2)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    )}
                </div>

                <div className="lg:col-span-4 space-y-6">
                    <Card darkMode={darkMode}>
                        <div className="flex items-center gap-3 mb-4">
                            <SlidersHorizontal size={18} className={darkMode ? 'text-indigo-300' : 'text-indigo-700'} />
                            <h3 className={`text-lg font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                Tutor controls
                            </h3>
                        </div>

                        <div>
                            <div className={`text-[11px] font-black uppercase tracking-widest mb-3 ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                                Quick scenarios
                            </div>
                            <div className="grid gap-2">
                                {TUTOR_SCENARIOS.map((scenario) => (
                                    <button
                                        key={scenario.id}
                                        onClick={() => applyScenario(scenario.id)}
                                        className={`rounded-xl border px-4 py-3 text-left transition-colors ${lessonScenario === scenario.id ? 'border-indigo-500 bg-indigo-500/10' : (darkMode ? 'bg-slate-950 border-slate-800 hover:border-slate-700' : 'bg-slate-50 border-slate-200 hover:border-slate-300')}`}
                                    >
                                        <div className={`font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>{scenario.label}</div>
                                        <div className={`text-sm mt-1 ${darkMode ? 'text-slate-500' : 'text-slate-600'}`}>{scenario.description}</div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="mt-6 space-y-5">
                            <label className="block">
                                <span className={`text-[11px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                                    Strength of X1
                                </span>
                                <input type="range" min={-1.5} max={1.5} step={0.05} value={lessonBeta1} onChange={(event) => setLessonBeta1(Number(event.target.value))} className="mt-3 w-full" />
                                <div className={`mt-2 text-sm font-bold ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>{formatStat(lessonBeta1, 2)}</div>
                            </label>

                            <label className="block">
                                <span className={`text-[11px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                                    Strength of X2
                                </span>
                                <input type="range" min={-1.5} max={1.5} step={0.05} value={lessonBeta2} onChange={(event) => setLessonBeta2(Number(event.target.value))} className="mt-3 w-full" />
                                <div className={`mt-2 text-sm font-bold ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>{formatStat(lessonBeta2, 2)}</div>
                            </label>

                            <label className="block">
                                <span className={`text-[11px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                                    Correlation Between Predictors
                                </span>
                                <input type="range" min={-0.9} max={0.9} step={0.01} value={lessonPredictorCorrelation} onChange={(event) => setLessonPredictorCorrelation(Number(event.target.value))} className="mt-3 w-full" />
                                <div className={`mt-2 text-sm font-bold ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>{formatStat(lessonPredictorCorrelation, 2)}</div>
                            </label>

                            <label className="block">
                                <span className={`text-[11px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                                    Noise Level
                                </span>
                                <input type="range" min={0.4} max={2.3} step={0.05} value={lessonNoise} onChange={(event) => setLessonNoise(Number(event.target.value))} className="mt-3 w-full" />
                                <div className={`mt-2 text-sm font-bold ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>{formatStat(lessonNoise, 2)}</div>
                            </label>

                            <label className="block">
                                <span className={`text-[11px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                                    Sample Size
                                </span>
                                <input type="range" min={30} max={180} step={1} value={lessonSampleSize} onChange={(event) => setLessonSampleSize(Number(event.target.value))} className="mt-3 w-full" />
                                <div className={`mt-2 text-sm font-bold ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>{lessonSampleSize}</div>
                            </label>
                        </div>

                        <div className="mt-6 space-y-3">
                            <label className={`flex items-center justify-between rounded-xl border px-4 py-3 ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                                <span className="font-bold text-sm">Add influential outlier</span>
                                <input type="checkbox" checked={lessonOutlierOn} onChange={(event) => setLessonOutlierOn(event.target.checked)} />
                            </label>
                            <label className={`flex items-center justify-between rounded-xl border px-4 py-3 ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                                <span className="font-bold text-sm">Show coefficient table</span>
                                <input type="checkbox" checked={lessonShowCoefficientTable} onChange={(event) => setLessonShowCoefficientTable(event.target.checked)} />
                            </label>
                            <label className={`flex items-center justify-between rounded-xl border px-4 py-3 ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                                <span className="font-bold text-sm">Show partial summaries</span>
                                <input type="checkbox" checked={lessonShowPartialEffects} onChange={(event) => setLessonShowPartialEffects(event.target.checked)} />
                            </label>
                            <label className={`flex items-center justify-between rounded-xl border px-4 py-3 ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                                <span className="font-bold text-sm">Show residual plot</span>
                                <input type="checkbox" checked={lessonShowResiduals} onChange={(event) => setLessonShowResiduals(event.target.checked)} />
                            </label>
                        </div>

                        <button
                            onClick={() => setLessonGenerationKey((previous) => previous + 1)}
                            className={`mt-6 w-full inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-black uppercase tracking-widest ${darkMode ? 'bg-indigo-600 hover:bg-indigo-500 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}
                        >
                            <RefreshCw size={16} />
                            Regenerate Sample
                        </button>
                    </Card>

                    <Card darkMode={darkMode}>
                        <div className="flex items-center gap-3 mb-4">
                            <Info size={18} className={darkMode ? 'text-sky-300' : 'text-sky-700'} />
                            <h3 className={`text-lg font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                What this tutor is teaching
                            </h3>
                        </div>

                        <div className="space-y-3">
                            <div className={`rounded-xl border p-4 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                                <div className={`text-[10px] font-black uppercase tracking-widest mb-2 ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>Conditional slopes</div>
                                <p className={`text-sm ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                                    Each coefficient answers: how does predicted Y change as one predictor changes while the others are held constant?
                                </p>
                            </div>
                            <div className={`rounded-xl border p-4 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                                <div className={`text-[10px] font-black uppercase tracking-widest mb-2 ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>Shared variance</div>
                                <p className={`text-sm ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                                    When X1 and X2 overlap heavily, the model can still predict well overall while individual coefficients become more unstable.
                                </p>
                            </div>
                            <div className={`rounded-xl border p-4 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                                <div className={`text-[10px] font-black uppercase tracking-widest mb-2 ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>Prediction vs explanation</div>
                                <p className={`text-sm ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                                    A model can have useful predictive fit without making every coefficient easy to interpret, especially when predictors are correlated.
                                </p>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default MultipleRegressionPage;
