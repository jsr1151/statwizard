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
import RegressionScatterplot from './RegressionScatterplot';
import {
    buildRegressionGuidance,
    buildRegressionInterpretation,
    buildRegressionTutorBaseDataset,
    buildSlopeInterpretation,
    calculateRegressionPrediction,
    calculateSimpleLinearRegressionStats,
    deriveRegressionTutorDataset,
    rSquaredToFSquared,
} from '../../stats/regression.js';
import { parseDelimitedTable } from '../../utils/delimitedTable.js';

const TUTOR_PRESETS = [
    ['positive_low_noise', 'Steep Upward / Tight Fit', 'A clear positive slope with small residuals, so the fitted line predicts well.'],
    ['positive_high_noise', 'Steep Upward / Noisy Fit', 'The slope stays positive, but larger residuals make the predictions less precise.'],
    ['negative_low_noise', 'Downward Slope / Tight Fit', 'A clear negative slope with little residual spread around the fitted line.'],
    ['negative_high_noise', 'Downward Slope / Noisy Fit', 'The slope stays negative, but the line leaves larger prediction errors behind.'],
    ['near_flat', 'Shallow Slope / Tight Fit', 'A shallow slope can still fit tightly, which helps separate rate of change from model fit.'],
    ['nonlinear', 'Curved Pattern / Bad Linear Fit', 'A curved pattern can make a straight-line model predict badly even when it still returns a slope.'],
];

const SAMPLE_DATASET = `Study Hours,Practice Problems,Exam Score,Stress Level
2,18,58,8.2
3,24,61,7.9
4,28,64,7.6
5,34,68,7.1
6,39,72,6.8
7,45,75,6.4
8,49,79,6.1
9,55,82,5.7
10,61,86,5.3
11,66,88,4.9
12,72,91,4.5
13,77,93,4.1
14,81,95,3.7
15,86,97,3.3`;

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

const buildEquationText = ({ stats, xLabel, yLabel }) => {
    if (!stats?.ok) {
        return 'Regression equation unavailable';
    }

    const intercept = Number(stats.intercept);
    const slope = Number(stats.slope);
    const sign = slope >= 0 ? '+' : '-';
    return `${yLabel} = ${formatStat(intercept, 3)} ${sign} ${formatStat(Math.abs(slope), 3)} x ${xLabel}`;
};

const buildLessonBaseRequest = ({
    preset,
    sampleSize,
    noise,
    generationKey = 0,
}) => ({
    preset,
    sampleSize,
    noise,
    generationKey,
});

const clampToRange = (value, min, max) => {
    const numeric = Number(value);

    if (!Number.isFinite(numeric)) {
        return min;
    }

    return Math.min(max, Math.max(min, numeric));
};

const resolvePredictionStep = (summary) => {
    if (!summary) {
        return 0.1;
    }

    const span = Math.max(0, Number(summary.max) - Number(summary.min));

    if (span <= 1) {
        return 0.01;
    }

    if (span <= 10) {
        return 0.1;
    }

    return Math.max(0.1, Number((span / 100).toFixed(2)));
};

const findDefaultPointId = (stats, preferSyntheticOutlier = false) => {
    if (!stats?.pairs?.length) {
        return null;
    }

    if (preferSyntheticOutlier) {
        const outlier = stats.pairs.find((pair) => pair.isSyntheticOutlier);

        if (outlier) {
            return outlier.id;
        }
    }

    if (stats.influence?.influentialIndex != null) {
        const matchingInfluentialPair = stats.pairs.find((pair) => pair.index === stats.influence.influentialIndex || pair.id === stats.influence.influentialIndex);

        if (matchingInfluentialPair) {
            return matchingInfluentialPair.id;
        }
    }

    return stats.pairs[Math.floor(stats.pairs.length / 2)]?.id ?? null;
};

const SimpleLinearRegressionPage = ({
    section,
    darkMode,
    currentStats,
    onStatsChange,
    assumptions = [],
    testConfig,
    initialPowerMode,
}) => {
    const [lessonPreset, setLessonPreset] = useState('positive_low_noise');
    const [lessonSampleSize, setLessonSampleSize] = useState(36);
    const [lessonNoise, setLessonNoise] = useState(0.28);
    const [lessonShowLine, setLessonShowLine] = useState(true);
    const [lessonShowBand, setLessonShowBand] = useState(false);
    const [lessonShowPredictionBand, setLessonShowPredictionBand] = useState(false);
    const [lessonShowResiduals, setLessonShowResiduals] = useState(false);
    const [lessonOutlierOn, setLessonOutlierOn] = useState(false);
    const [lessonPredictionX, setLessonPredictionX] = useState(5);
    const [lessonSelectedPointId, setLessonSelectedPointId] = useState(null);
    const [lessonBaseRequest, setLessonBaseRequest] = useState(() => buildLessonBaseRequest({
        preset: 'positive_low_noise',
        sampleSize: 36,
        noise: 0.28,
    }));

    const lessonBaseDataset = useMemo(() => buildRegressionTutorBaseDataset({
        preset: lessonBaseRequest.preset,
        targetSampleSize: lessonBaseRequest.sampleSize,
        targetNoise: lessonBaseRequest.noise,
        generationKey: lessonBaseRequest.generationKey,
    }), [lessonBaseRequest]);

    const lessonDataset = useMemo(() => deriveRegressionTutorDataset({
        baseDataset: lessonBaseDataset,
        sampleSize: lessonSampleSize,
        noise: lessonNoise,
        includeOutlier: lessonOutlierOn,
    }), [lessonBaseDataset, lessonSampleSize, lessonNoise, lessonOutlierOn]);

    const lessonStats = useMemo(() => calculateSimpleLinearRegressionStats({
        xValues: (lessonDataset.pairs || []).map((pair) => pair.x),
        yValues: (lessonDataset.pairs || []).map((pair) => pair.y),
        confidenceLevel: 0.95,
    }), [lessonDataset]);

    const lessonPredictionStep = useMemo(
        () => resolvePredictionStep(lessonStats?.xSummary),
        [lessonStats?.xSummary]
    );

    const lessonPrediction = useMemo(() => calculateRegressionPrediction({
        stats: lessonStats,
        xValue: lessonPredictionX,
        confidenceLevel: 0.95,
    }), [lessonStats, lessonPredictionX]);

    const lessonSelectedPair = useMemo(
        () => lessonStats?.pairs?.find((pair) => pair.id === lessonSelectedPointId || pair.index === lessonSelectedPointId) || null,
        [lessonStats, lessonSelectedPointId]
    );

    useEffect(() => {
        if (!lessonStats?.ok) {
            setLessonSelectedPointId(null);
            return;
        }

        setLessonPredictionX((previous) => clampToRange(
            Number.isFinite(Number(previous)) ? Number(previous) : lessonStats.meanX,
            lessonStats.xSummary.min,
            lessonStats.xSummary.max
        ));
        setLessonSelectedPointId((previous) => {
            const hasPrevious = lessonStats.pairs.some((pair) => pair.id === previous || pair.index === previous);

            if (lessonOutlierOn) {
                const outlier = lessonStats.pairs.find((pair) => pair.isSyntheticOutlier);

                if (outlier) {
                    return outlier.id;
                }
            }

            return hasPrevious ? previous : findDefaultPointId(lessonStats);
        });
    }, [lessonStats, lessonOutlierOn]);

    const lessonSubtitle = useMemo(() => {
        const baseDescription = TUTOR_PRESETS.find((preset) => preset[0] === lessonPreset)?.[2]
            || 'Use the controls to see what the fitted line responds to and what it can miss.';

        if (!lessonOutlierOn) {
            return baseDescription;
        }

        return `${baseDescription} The outlier toggle adds one influential case to the same underlying sample.`;
    }, [lessonPreset, lessonOutlierOn]);

    const regenerateLessonSample = () => {
        setLessonBaseRequest((previous) => buildLessonBaseRequest({
            preset: lessonPreset,
            sampleSize: lessonSampleSize,
            noise: lessonNoise,
            generationKey: previous.generationKey + 1,
        }));
    };

    const selectLessonPreset = (nextPreset) => {
        if (nextPreset === lessonPreset) {
            return;
        }

        setLessonPreset(nextPreset);
        setLessonBaseRequest((previous) => buildLessonBaseRequest({
            preset: nextPreset,
            sampleSize: lessonSampleSize,
            noise: lessonNoise,
            generationKey: previous.generationKey + 1,
        }));
    };

    const [tableText, setTableText] = useState(SAMPLE_DATASET);
    const [selectedX, setSelectedX] = useState('');
    const [selectedY, setSelectedY] = useState('');
    const [confidenceLevel, setConfidenceLevel] = useState(0.95);
    const [calculatorShowLine, setCalculatorShowLine] = useState(true);
    const [calculatorShowBand, setCalculatorShowBand] = useState(false);
    const [calculatorShowPredictionBand, setCalculatorShowPredictionBand] = useState(false);
    const [calculatorPredictionX, setCalculatorPredictionX] = useState('');
    const [calculatorSelectedPointId, setCalculatorSelectedPointId] = useState(null);

    const parsedTable = useMemo(() => parseDelimitedTable(tableText), [tableText]);
    const numericColumns = parsedTable.numericColumns || [];

    useEffect(() => {
        if (!numericColumns.length) {
            setSelectedX('');
            setSelectedY('');
            return;
        }

        if (!numericColumns.some((column) => column.name === selectedX)) {
            setSelectedX(numericColumns[0]?.name || '');
        }

        if (!numericColumns.some((column) => column.name === selectedY)) {
            setSelectedY(numericColumns[1]?.name || numericColumns[0]?.name || '');
        }
    }, [numericColumns, selectedX, selectedY]);

    const selectedXColumn = numericColumns.find((column) => column.name === selectedX) || null;
    const selectedYColumn = numericColumns.find((column) => column.name === selectedY) || null;

    const calculatorStats = useMemo(() => {
        if (!selectedXColumn || !selectedYColumn || selectedXColumn.name === selectedYColumn.name) {
            return null;
        }

        return calculateSimpleLinearRegressionStats({
            xValues: selectedXColumn.numericValues,
            yValues: selectedYColumn.numericValues,
            confidenceLevel,
            alpha: 1 - confidenceLevel,
        });
    }, [selectedXColumn, selectedYColumn, confidenceLevel]);

    useEffect(() => {
        if (calculatorStats?.ok && typeof onStatsChange === 'function') {
            onStatsChange(calculatorStats);
        }
    }, [calculatorStats, onStatsChange]);

    const calculatorGuidance = useMemo(
        () => buildRegressionGuidance(calculatorStats),
        [calculatorStats]
    );

    const influentialIndex = calculatorStats?.influence?.maxCooksDistance > 0.5 || calculatorStats?.influence?.maxDeltaSlope > 0.35
        ? calculatorStats.influence.influentialIndex
        : null;
    const calculatorPrediction = useMemo(() => calculateRegressionPrediction({
        stats: calculatorStats,
        xValue: calculatorPredictionX,
        confidenceLevel,
    }), [calculatorStats, calculatorPredictionX, confidenceLevel]);
    const calculatorSelectedPair = useMemo(
        () => calculatorStats?.pairs?.find((pair) => pair.id === calculatorSelectedPointId || pair.index === calculatorSelectedPointId) || null,
        [calculatorStats, calculatorSelectedPointId]
    );

    useEffect(() => {
        if (!calculatorStats?.ok) {
            setCalculatorSelectedPointId(null);
            return;
        }

        setCalculatorPredictionX((previous) => {
            if (previous === '' || previous == null) {
                return calculatorStats.meanX;
            }

            const numeric = Number(previous);
            return Number.isFinite(numeric) ? numeric : calculatorStats.meanX;
        });
        setCalculatorSelectedPointId((previous) => {
            const hasPrevious = calculatorStats.pairs.some((pair) => pair.id === previous || pair.index === previous);
            return hasPrevious ? previous : findDefaultPointId(calculatorStats);
        });
    }, [calculatorStats]);

    const effectSourceStats = currentStats?.ok ? currentStats : (calculatorStats?.ok ? calculatorStats : null);
    const [effectRSquared, setEffectRSquared] = useState(0.25);
    const [effectSlope, setEffectSlope] = useState(0.8);
    const [effectUnitChange, setEffectUnitChange] = useState(1);

    useEffect(() => {
        if (Number.isFinite(effectSourceStats?.rSquared)) {
            setEffectRSquared(effectSourceStats.rSquared);
        }
        if (Number.isFinite(effectSourceStats?.slope)) {
            setEffectSlope(effectSourceStats.slope);
        }
    }, [effectSourceStats?.rSquared, effectSourceStats?.slope]);

    const effectFSquared = rSquaredToFSquared(effectRSquared);
    const effectPredictedChange = effectSlope * effectUnitChange;

    const onUpload = async (event) => {
        const file = event.target.files?.[0];
        if (!file) {
            return;
        }
        const text = await file.text();
        setTableText(text);
        event.target.value = '';
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
                                Simple linear regression power planning
                            </h3>
                            <p className={`mt-2 text-sm max-w-3xl ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                This first slice treats simple linear regression as a one-predictor fixed-model slope test. In a one-predictor model, testing the slope and testing model R² are equivalent, so it fits the shared F-style planning surface cleanly.
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
                                    R² = {formatStat(effectSourceStats.rSquared, 3)}
                                </h3>
                                <p className={`mt-2 text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                    The active calculator line has slope {formatStat(effectSourceStats.slope, 3)} and adjusted R² = {formatStat(effectSourceStats.adjustedRSquared, 3)}.
                                </p>
                            </div>
                            <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${darkMode ? 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20' : 'bg-indigo-50 text-indigo-700 border border-indigo-200'}`}>
                                f² = {formatStat(rSquaredToFSquared(effectSourceStats.rSquared), 3)}
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
                                        Fit and slope are different ideas
                                    </h3>
                                </div>
                            </div>

                            <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                In simple regression, R² is the clearest fit summary for many users. The slope tells you how predicted Y changes with X. The Power Analysis tab translates that fit into Cohen's f² = R² / (1 - R²).
                            </p>

                            <div className="mt-6 grid gap-4">
                                <label className="block">
                                    <span className={`text-[11px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                                        Variance Explained (R²)
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
                                        Slope (b)
                                    </span>
                                    <input type="number" step={0.01} value={Number.isFinite(effectSlope) ? effectSlope : ''} onChange={(event) => {
                                        const numeric = Number(event.target.value);
                                        if (Number.isFinite(numeric)) {
                                            setEffectSlope(numeric);
                                        }
                                    }} className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm font-bold outline-none transition-colors ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200 focus:border-indigo-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500'}`} />
                                </label>

                                <label className="block">
                                    <span className={`text-[11px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                                        Change in X
                                    </span>
                                    <input type="number" step={0.1} value={Number.isFinite(effectUnitChange) ? effectUnitChange : ''} onChange={(event) => {
                                        const numeric = Number(event.target.value);
                                        if (Number.isFinite(numeric)) {
                                            setEffectUnitChange(numeric);
                                        }
                                    }} className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm font-bold outline-none transition-colors ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200 focus:border-indigo-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500'}`} />
                                </label>
                            </div>
                        </Card>
                    </div>

                    <div className="lg:col-span-7 space-y-6">
                        <div className="grid md:grid-cols-3 gap-4">
                            <MetricTile darkMode={darkMode} label="R²" value={formatStat(effectRSquared, 3)} tone="primary" detail={`${formatStat(effectRSquared * 100, 1)}% of the outcome variance is explained by the line.`} />
                            <MetricTile darkMode={darkMode} label="Slope (b)" value={formatStat(effectSlope, 3)} detail={buildSlopeInterpretation({ slope: effectSlope, units: 1 })} />
                            <MetricTile darkMode={darkMode} label="Predicted Change" value={formatStat(effectPredictedChange, 3)} detail={buildSlopeInterpretation({ slope: effectSlope, units: effectUnitChange })} />
                        </div>

                        <Card darkMode={darkMode}>
                            <div className="flex items-center gap-3 mb-3">
                                <TrendingUp size={18} className={darkMode ? 'text-emerald-300' : 'text-emerald-700'} />
                                <h3 className={`text-lg font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                    What R² means
                                </h3>
                            </div>
                            <p className={`text-sm leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                R² tells you how much of the variability in Y is accounted for by the fitted straight line. It describes fit, not the size of the slope by itself.
                            </p>
                        </Card>

                        <Card darkMode={darkMode}>
                            <div className="flex items-center gap-3 mb-3">
                                <Info size={18} className={darkMode ? 'text-amber-300' : 'text-amber-700'} />
                                <h3 className={`text-lg font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                    Why slope and fit can disagree
                                </h3>
                            </div>
                            <p className={`text-sm leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                You can have a noticeable slope with a noisy cloud and a modest R², or a tight line with a small slope if the X scale is small. Significance, slope size, and fit are related but not interchangeable.
                            </p>
                        </Card>

                        <Card darkMode={darkMode}>
                            <div className="flex items-center gap-3 mb-3">
                                <Target size={18} className={darkMode ? 'text-sky-300' : 'text-sky-700'} />
                                <h3 className={`text-lg font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                    Slopes depend on units
                                </h3>
                            </div>
                            <p className={`text-sm leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                The slope is a rate of change, so rescaling X changes the slope value and its interpretation. The overall fit stays the same because the line still explains the same share of outcome variance.
                            </p>
                        </Card>

                        <Card darkMode={darkMode}>
                            <div className={`text-[10px] font-black uppercase tracking-widest mb-2 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
                                Power Connection
                            </div>
                            <p className={`text-sm leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                The power tab uses Cohen's f² for this first regression slice. At the current R², f² = {formatStat(effectFSquared, 3)}.
                            </p>
                        </Card>
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
                            <h3 className={`text-xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                Simple linear regression calculator
                            </h3>
                            <p className={`mt-2 text-sm max-w-3xl ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                Use this workspace to fit one predictor X to one quantitative outcome Y, inspect the regression line, and check the residual pattern before leaning on the slope test.
                            </p>
                        </div>
                    </div>
                </Card>

                <div className="grid lg:grid-cols-12 gap-8 items-start">
                    <div className="lg:col-span-4 space-y-6">
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

                            <div className="mt-6 grid gap-4">
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

                    <div className="lg:col-span-8 space-y-6">
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
                                <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                                    <MetricTile darkMode={darkMode} label="Slope (b)" value={formatStat(calculatorStats.slope, 3)} tone="primary" detail={buildSlopeInterpretation({ slope: calculatorStats.slope, predictorLabel: selectedX || 'X', outcomeLabel: selectedY || 'Y' })} />
                                    <MetricTile darkMode={darkMode} label="Intercept" value={formatStat(calculatorStats.intercept, 3)} detail={`Predicted ${selectedY || 'Y'} when ${selectedX || 'X'} = 0.`} />
                                    <MetricTile darkMode={darkMode} label="R²" value={formatStat(calculatorStats.rSquared, 3)} detail={`${formatStat(calculatorStats.rSquared * 100, 1)}% variance explained`} />
                                    <MetricTile darkMode={darkMode} label="Adjusted R²" value={formatStat(calculatorStats.adjustedRSquared, 3)} />
                                    <MetricTile darkMode={darkMode} label="RMSE" value={formatStat(calculatorStats.rmse, 3)} detail="Typical prediction error around the fitted line." />
                                    <MetricTile darkMode={darkMode} label="n" value={`${calculatorStats.n}`} />
                                </div>

                                <Card darkMode={darkMode}>
                                    <div className="grid lg:grid-cols-12 gap-6 items-start">
                                        <div className="lg:col-span-5 space-y-3">
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

                                        <div className="lg:col-span-7">
                                            <div className="grid sm:grid-cols-3 gap-3">
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
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
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

                                    <div className="overflow-x-auto">
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
                                    <div className="grid lg:grid-cols-12 gap-6 items-start">
                                        <div className="lg:col-span-4">
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

                                        <div className="lg:col-span-8">
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
                                    What to check before trusting the line
                                </h3>
                                <p className={`mt-2 text-sm max-w-3xl ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                    Treat these as practical checks, not a rigid pass/fail gate. The goal is to understand when one straight-line model is useful and when the plot or study design calls for more caution.
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
                        <h3 className={`text-xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>Simple linear regression tutor / lessons</h3>
                        <p className={`mt-2 text-sm max-w-3xl ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                            This first slice is an interactive concept page rather than a formal lesson engine. Use the presets and controls to see how slopes, residuals, prediction intervals, and nonlinear patterns change what the fitted line can honestly say.
                        </p>
                    </div>
                </div>
            </Card>

            <div className="grid lg:grid-cols-12 gap-8 items-start">
                <div className="lg:col-span-8 space-y-6">
                    <Card darkMode={darkMode}>
                        <RegressionScatterplot
                            pairs={lessonStats?.pairs || []}
                            stats={lessonStats}
                            darkMode={darkMode}
                            xLabel="Predictor X"
                            yLabel="Outcome Y"
                            showLine={lessonShowLine}
                            showConfidenceBand={lessonShowBand}
                            showPredictionBand={lessonShowPredictionBand}
                            showResiduals={lessonShowResiduals}
                            confidenceLevel={0.95}
                            highlightPointIndex={lessonStats?.influence?.influentialIndex}
                            selectedPointId={lessonSelectedPointId}
                            onPointSelect={setLessonSelectedPointId}
                            predictionTarget={lessonPrediction}
                            title="Interactive fitted-model plot"
                            subtitle={`${lessonSubtitle} Click a point to inspect its residual, or move the prediction target to see what the model says at a chosen X value.`}
                        />
                    </Card>

                    {lessonShowResiduals && lessonStats?.ok && (
                        <Card darkMode={darkMode}>
                            <RegressionResidualPlot
                                stats={lessonStats}
                                darkMode={darkMode}
                                highlightPointIndex={lessonSelectedPointId}
                                subtitle="Residuals are observed Y minus predicted Y. The selected case is highlighted so you can connect the scatterplot to the error pattern."
                            />
                        </Card>
                    )}

                    <div className="grid xl:grid-cols-2 gap-6">
                        <Card darkMode={darkMode}>
                            <div className="flex items-center gap-3 mb-3">
                                <TrendingUp size={18} className={darkMode ? 'text-sky-300' : 'text-sky-700'} />
                                <h3 className={`text-lg font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                    Prediction spotlight
                                </h3>
                            </div>
                            <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                At <span className="font-black">X = {formatStat(lessonPrediction?.x, 2)}</span>, the fitted line predicts <span className="font-black">Y = {formatStat(lessonPrediction?.fitted, 3)}</span>.
                            </p>
                            <div className="mt-4 grid sm:grid-cols-2 gap-3">
                                <div className={`rounded-xl border p-4 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                                    <div className={`text-[10px] font-black uppercase tracking-widest mb-2 ${darkMode ? 'text-sky-300' : 'text-sky-700'}`}>Mean CI</div>
                                    <p className={`text-sm ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                                        [{formatStat(lessonPrediction?.meanInterval?.lower, 3)}, {formatStat(lessonPrediction?.meanInterval?.upper, 3)}]
                                    </p>
                                </div>
                                <div className={`rounded-xl border p-4 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                                    <div className={`text-[10px] font-black uppercase tracking-widest mb-2 ${darkMode ? 'text-sky-300' : 'text-sky-700'}`}>Prediction Interval</div>
                                    <p className={`text-sm ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                                        [{formatStat(lessonPrediction?.predictionInterval?.lower, 3)}, {formatStat(lessonPrediction?.predictionInterval?.upper, 3)}]
                                    </p>
                                </div>
                            </div>
                            <p className={`mt-4 text-sm leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                Regression is using the fitted line to estimate the mean outcome at a chosen predictor value, not just describing how two variables move together.
                            </p>
                        </Card>

                        <Card darkMode={darkMode}>
                            <div className="flex items-center gap-3 mb-3">
                                <Target size={18} className={darkMode ? 'text-amber-300' : 'text-amber-700'} />
                                <h3 className={`text-lg font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                    Residual spotlight
                                </h3>
                            </div>
                            <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                Click any point to compare its observed outcome with what the fitted line predicted.
                            </p>
                            <div className="mt-4 grid sm:grid-cols-3 gap-3">
                                <div className={`rounded-xl border p-4 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                                    <div className={`text-[10px] font-black uppercase tracking-widest mb-2 ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>Observed Y</div>
                                    <p className={`text-lg font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>{formatStat(lessonSelectedPair?.y, 3)}</p>
                                </div>
                                <div className={`rounded-xl border p-4 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                                    <div className={`text-[10px] font-black uppercase tracking-widest mb-2 ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>Predicted Y</div>
                                    <p className={`text-lg font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>{formatStat(lessonSelectedPair?.fitted, 3)}</p>
                                </div>
                                <div className={`rounded-xl border p-4 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                                    <div className={`text-[10px] font-black uppercase tracking-widest mb-2 ${darkMode ? 'text-amber-300' : 'text-amber-700'}`}>Residual</div>
                                    <p className={`text-lg font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>{formatStat(lessonSelectedPair?.residual, 3)}</p>
                                </div>
                            </div>
                            <p className={`mt-4 text-sm leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                Residual = observed Y - predicted Y. Small residuals mean the line predicted that case well; large residuals mean the model missed by more.
                            </p>
                        </Card>
                    </div>

                    <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
                        <MetricTile darkMode={darkMode} label="Slope (b)" value={formatStat(lessonStats?.slope, 3)} tone="primary" detail={buildSlopeInterpretation({ slope: lessonStats?.slope, predictorLabel: 'X', outcomeLabel: 'Y' })} />
                        <MetricTile darkMode={darkMode} label="Intercept" value={formatStat(lessonStats?.intercept, 3)} detail="Predicted Y when X = 0." />
                        <MetricTile darkMode={darkMode} label="R²" value={formatStat(lessonStats?.rSquared, 3)} />
                        <MetricTile darkMode={darkMode} label="n" value={`${lessonStats?.n || 0}`} detail={lessonStats?.interpretation || 'Waiting for data'} />
                    </div>

                    <Card darkMode={darkMode}>
                        <div className="flex items-center gap-3 mb-3">
                            <Target size={18} className={darkMode ? 'text-amber-300' : 'text-amber-700'} />
                            <h3 className={`text-lg font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                What this view is teaching
                            </h3>
                        </div>
                        <p className={`text-sm leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                            {lessonPreset === 'nonlinear'
                                ? 'The line is still fitted, but the curved pattern shows why one straight regression model can be misleading even when it returns a slope and an R².'
                                : lessonOutlierOn
                                    ? 'Because the outlier is being added to the same underlying sample, you can see exactly how one influential case changes the slope, the selected residual, and the predictions coming off the fitted line.'
                                    : `${buildRegressionInterpretation(lessonStats)} Slope answers rate of change; R² answers how tightly the points follow that model.`}
                        </p>
                    </Card>
                </div>

                <div className="lg:col-span-4 space-y-6">
                    <Card darkMode={darkMode}>
                        <div className="flex items-center gap-3 mb-4">
                            <SlidersHorizontal size={18} className={darkMode ? 'text-indigo-300' : 'text-indigo-700'} />
                            <div>
                                <div className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>Presets</div>
                                <h3 className={`text-xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>Explore fitted models</h3>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            {TUTOR_PRESETS.map(([id, label]) => (
                                <button key={id} onClick={() => selectLessonPreset(id)} className={`rounded-xl border px-3 py-3 text-left text-xs font-black uppercase tracking-widest transition-all ${lessonPreset === id ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg' : (darkMode ? 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-indigo-500' : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900 hover:border-indigo-500')}`}>
                                    {label}
                                </button>
                            ))}
                        </div>

                        <div className="mt-6 space-y-4">
                            <div>
                                <div className="flex justify-between items-center">
                                    <span className={`text-[11px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>Sample Size</span>
                                    <span className={`text-sm font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>{lessonSampleSize}</span>
                                </div>
                                <input type="range" min="12" max="90" step="1" value={lessonSampleSize} onChange={(event) => setLessonSampleSize(Number(event.target.value))} className="mt-2 w-full accent-indigo-500" />
                            </div>

                            <div>
                                <div className="flex justify-between items-center">
                                    <span className={`text-[11px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>Noise</span>
                                    <span className={`text-sm font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>{Math.round(lessonNoise * 100)}%</span>
                                </div>
                                <input type="range" min="0" max="1" step="0.01" value={lessonNoise} onChange={(event) => setLessonNoise(Number(event.target.value))} className="mt-2 w-full accent-indigo-500" />
                            </div>

                            <div>
                                <div className="flex justify-between items-center">
                                    <span className={`text-[11px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>Predict Y at X</span>
                                    <span className={`text-sm font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>{formatStat(lessonPredictionX, 2)}</span>
                                </div>
                                <input
                                    type="range"
                                    min={lessonStats?.xSummary?.min ?? 0}
                                    max={lessonStats?.xSummary?.max ?? 10}
                                    step={lessonPredictionStep}
                                    value={lessonPredictionX}
                                    onChange={(event) => setLessonPredictionX(Number(event.target.value))}
                                    className="mt-2 w-full accent-indigo-500"
                                />
                            </div>
                        </div>

                        <div className="mt-6 grid grid-cols-2 gap-3">
                            <button onClick={() => setLessonShowResiduals((value) => !value)} className={`rounded-xl border px-4 py-3 text-xs font-black uppercase tracking-widest transition-all ${lessonShowResiduals ? 'bg-indigo-600 text-white border-indigo-500' : (darkMode ? 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900')}`}>{lessonShowResiduals ? 'Hide Residual Overlay' : 'Show Residual Overlay'}</button>
                            <button onClick={() => setLessonShowLine((value) => !value)} className={`rounded-xl border px-4 py-3 text-xs font-black uppercase tracking-widest transition-all ${lessonShowLine ? 'bg-indigo-600 text-white border-indigo-500' : (darkMode ? 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900')}`}>{lessonShowLine ? 'Hide Line' : 'Show Line'}</button>
                            <button onClick={() => setLessonShowBand((value) => !value)} className={`rounded-xl border px-4 py-3 text-xs font-black uppercase tracking-widest transition-all ${lessonShowBand ? 'bg-indigo-600 text-white border-indigo-500' : (darkMode ? 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900')}`}>{lessonShowBand ? 'Hide Mean Band' : 'Show Mean Band'}</button>
                            <button onClick={() => setLessonShowPredictionBand((value) => !value)} className={`rounded-xl border px-4 py-3 text-xs font-black uppercase tracking-widest transition-all ${lessonShowPredictionBand ? 'bg-indigo-600 text-white border-indigo-500' : (darkMode ? 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900')}`}>{lessonShowPredictionBand ? 'Hide Prediction Interval' : 'Show Prediction Interval'}</button>
                            <button onClick={() => setLessonOutlierOn((value) => !value)} className={`col-span-2 rounded-xl border px-4 py-3 text-xs font-black uppercase tracking-widest transition-all ${lessonOutlierOn ? 'bg-indigo-600 text-white border-indigo-500' : (darkMode ? 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900')}`}>{lessonOutlierOn ? 'Remove Outlier' : 'Add Outlier'}</button>
                            <button onClick={regenerateLessonSample} className={`col-span-2 inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-xs font-black uppercase tracking-widest transition-all ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-300 hover:text-white hover:border-indigo-500' : 'bg-slate-50 border-slate-200 text-slate-700 hover:text-slate-900 hover:border-indigo-500'}`}>
                                <RefreshCw size={14} />
                                Regenerate Sample
                            </button>
                        </div>
                    </Card>

                    <Card darkMode={darkMode}>
                        <div className="flex items-center gap-3 mb-4">
                            <Info size={18} className={darkMode ? 'text-amber-300' : 'text-amber-700'} />
                            <div>
                                <div className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>Core Ideas</div>
                                <h3 className={`text-xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>What this page teaches</h3>
                            </div>
                        </div>

                        <div className="space-y-3">
                            {[
                                'The fitted line models the mean of Y as the predictor changes.',
                                'Slope tells you the rate of change in predicted Y per 1-unit increase in X.',
                                'Intercept tells you the model prediction when X = 0.',
                                'Residuals are observed Y minus predicted Y.',
                                'R² summarizes fit, not causation.',
                                'A steep slope is not the same thing as a strong fit.',
                                'A shallow slope can still fit tightly if the points stay close to the line.',
                                'Outliers and nonlinear patterns can make a straight-line model predict poorly.',
                            ].map((idea) => (
                                <div key={idea} className={`rounded-xl border p-4 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                                    <p className={`text-sm leading-relaxed ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>{idea}</p>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default SimpleLinearRegressionPage;
