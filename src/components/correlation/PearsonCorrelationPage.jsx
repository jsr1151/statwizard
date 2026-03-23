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
import PearsonScatterplot from './PearsonScatterplot';
import PowerAnalysisTab from '../power/PowerAnalysisTab';
import AssumptionItem from '../formula/AssumptionItem';
import VariableRolePicker from '../data/VariableRolePicker.jsx';
import {
    buildCorrelationGuidance,
    buildCorrelationInterpretation,
    buildPearsonTutorBaseDataset,
    calculatePearsonCorrelationStats,
    derivePearsonTutorDataset,
    getCorrelationConventionLabel,
} from '../../stats/correlation.js';
import { parseDelimitedTable } from '../../utils/delimitedTable.js';
import { buildNumericAnalysisColumn, countCompleteRows } from '../../utils/datasetImport.js';
import { useDatasetLibraryContext } from '../../hooks/useDatasetLibrary.js';
import { ACTIVE_DATASET_SESSION_KEY, consumeAnalysisLaunchPayload } from '../../utils/analysisLaunch.js';

const TUTOR_PRESETS = [
    ['strong_positive', 'Strong Positive', 'Positive linear trend with modest noise.'],
    ['weak_positive', 'Weak Positive', 'Same upward idea, but the noise now competes with the trend.'],
    ['near_zero', 'Near Zero', 'X and Y are generated to be largely independent, so the cloud looks patternless.'],
    ['strong_negative', 'Strong Negative', 'Negative linear trend with modest noise.'],
    ['nonlinear', 'Nonlinear', 'A clear curve can still produce a small r.'],
    ['restricted_range', 'Restricted Range', 'Faded points show the full relationship while the observed X-slice shrinks r.'],
];

const SAMPLE_DATASET = `Study Hours,Exam Score,Sleep Hours,Stress
2,58,8.0,7.6
3,61,7.7,7.1
4,65,7.4,6.7
5,69,7.1,6.3
6,73,6.8,5.8
7,77,6.5,5.3
8,82,6.3,4.9
9,85,6.1,4.5
10,89,5.9,4.1
11,92,5.8,3.8
12,95,5.7,3.5`;

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

const PearsonCorrelationPage = ({
    section,
    darkMode,
    currentStats,
    onStatsChange,
    assumptions = [],
    testConfig,
    initialPowerMode,
}) => {
    const { datasets } = useDatasetLibraryContext();
    const [lessonPreset, setLessonPreset] = useState('strong_positive');
    const [lessonSampleSize, setLessonSampleSize] = useState(36);
    const [lessonNoise, setLessonNoise] = useState(0.28);
    const [lessonShowLine, setLessonShowLine] = useState(true);
    const [lessonShowBand, setLessonShowBand] = useState(false);
    const [lessonOutlierOn, setLessonOutlierOn] = useState(false);
    const [lessonBaseRequest, setLessonBaseRequest] = useState(() => buildLessonBaseRequest({
        preset: 'strong_positive',
        sampleSize: 36,
        noise: 0.28,
    }));

    const lessonBaseDataset = useMemo(() => buildPearsonTutorBaseDataset({
        preset: lessonBaseRequest.preset,
        targetSampleSize: lessonBaseRequest.sampleSize,
        targetNoise: lessonBaseRequest.noise,
        generationKey: lessonBaseRequest.generationKey,
    }), [lessonBaseRequest]);

    const lessonDataset = useMemo(() => derivePearsonTutorDataset({
        baseDataset: lessonBaseDataset,
        sampleSize: lessonSampleSize,
        noise: lessonNoise,
        includeOutlier: lessonOutlierOn,
    }), [lessonBaseDataset, lessonSampleSize, lessonNoise, lessonOutlierOn]);
    const lessonPairs = lessonDataset.pairs || [];

    const lessonStats = useMemo(() => calculatePearsonCorrelationStats({
        xValues: lessonPairs.map((pair) => pair.x),
        yValues: lessonPairs.map((pair) => pair.y),
    }), [lessonPairs]);

    const lessonContextStats = useMemo(() => {
        const contextPairs = lessonDataset.contextStatsPairs?.length
            ? lessonDataset.contextStatsPairs
            : lessonDataset.contextPairs;

        if (!contextPairs?.length) {
            return null;
        }

        return calculatePearsonCorrelationStats({
            xValues: contextPairs.map((pair) => pair.x),
            yValues: contextPairs.map((pair) => pair.y),
        });
    }, [lessonDataset.contextPairs, lessonDataset.contextStatsPairs]);

    const lessonSubtitle = useMemo(() => {
        const baseDescription = TUTOR_PRESETS.find((preset) => preset[0] === lessonPreset)?.[2]
            || 'Use the controls to explore how Pearson correlation behaves.';

        if (!lessonOutlierOn) {
            return baseDescription;
        }

        return `${baseDescription} The added outlier lets you compare the same base pattern before and after one influential point.`;
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
    const [calculatorInputMode, setCalculatorInputMode] = useState('paste');
    const [selectedDatasetId, setSelectedDatasetId] = useState('');
    const [launchPayload] = useState(() => consumeAnalysisLaunchPayload('pearson_correlation'));
    const [launchPayloadApplied, setLaunchPayloadApplied] = useState(false);
    const [savedRoleSelection, setSavedRoleSelection] = useState({
        x: '',
        y: '',
    });
    const [selectedX, setSelectedX] = useState('');
    const [selectedY, setSelectedY] = useState('');
    const [tails, setTails] = useState(2);
    const [direction, setDirection] = useState('greater');
    const [confidenceLevel, setConfidenceLevel] = useState(0.95);
    const [rho0, setRho0] = useState(0);
    const [calculatorShowLine, setCalculatorShowLine] = useState(true);
    const [calculatorShowBand, setCalculatorShowBand] = useState(false);

    const parsedTable = useMemo(() => parseDelimitedTable(tableText), [tableText]);
    const numericColumns = parsedTable.numericColumns || [];
    const savedDataset = useMemo(
        () => datasets.find((dataset) => dataset.id === selectedDatasetId) || null,
        [datasets, selectedDatasetId]
    );
    const savedNumericColumns = useMemo(
        () => (savedDataset?.columns || []).filter((column) => column.summary?.detectedType === 'numeric'),
        [savedDataset]
    );

    useEffect(() => {
        if (launchPayload?.datasetId) {
            setCalculatorInputMode('saved');
        }
    }, [launchPayload]);

    useEffect(() => {
        if (!datasets.length) {
            setSelectedDatasetId('');
            return;
        }

        let preferredDatasetId = '';

        try {
            preferredDatasetId = window.sessionStorage.getItem(ACTIVE_DATASET_SESSION_KEY) || '';
        } catch (error) {
            preferredDatasetId = '';
        }

        setSelectedDatasetId((previous) => {
            if (datasets.some((dataset) => dataset.id === previous)) {
                return previous;
            }

            if (launchPayload?.datasetId && datasets.some((dataset) => dataset.id === launchPayload.datasetId)) {
                return launchPayload.datasetId;
            }

            if (preferredDatasetId && datasets.some((dataset) => dataset.id === preferredDatasetId)) {
                try {
                    window.sessionStorage.removeItem(ACTIVE_DATASET_SESSION_KEY);
                } catch (error) {
                    // Ignore sessionStorage access problems and keep going.
                }

                return preferredDatasetId;
            }

            return datasets[0]?.id || '';
        });
    }, [datasets, launchPayload?.datasetId]);

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

    useEffect(() => {
        if (!savedDataset) {
            setSavedRoleSelection({
                x: '',
                y: '',
            });
            return;
        }

        const numericIds = savedDataset.columns
            .filter((column) => column.summary?.detectedType === 'numeric')
            .map((column) => column.id);

        if (
            launchPayload
            && !launchPayloadApplied
            && launchPayload.datasetId === savedDataset.id
        ) {
            const nextX = numericIds.includes(launchPayload.x) ? launchPayload.x : numericIds[0] || '';
            const nextY = numericIds.includes(launchPayload.y) && launchPayload.y !== nextX
                ? launchPayload.y
                : (numericIds.find((columnId) => columnId !== nextX) || numericIds[1] || nextX);

            setSavedRoleSelection({
                x: nextX,
                y: nextY,
            });
            setLaunchPayloadApplied(true);
            return;
        }

        setSavedRoleSelection((previous) => {
            const nextX = numericIds.includes(previous.x) ? previous.x : numericIds[0] || '';
            const nextY = numericIds.includes(previous.y) && previous.y !== nextX
                ? previous.y
                : (numericIds.find((columnId) => columnId !== nextX) || numericIds[1] || nextX);

            return {
                x: nextX,
                y: nextY,
            };
        });
    }, [launchPayload, launchPayloadApplied, savedDataset]);

    const selectedXColumn = numericColumns.find((column) => column.name === selectedX) || null;
    const selectedYColumn = numericColumns.find((column) => column.name === selectedY) || null;
    const savedXColumn = useMemo(
        () => buildNumericAnalysisColumn(savedDataset, savedRoleSelection.x),
        [savedDataset, savedRoleSelection.x]
    );
    const savedYColumn = useMemo(
        () => buildNumericAnalysisColumn(savedDataset, savedRoleSelection.y),
        [savedDataset, savedRoleSelection.y]
    );
    const savedCompleteCaseSummary = useMemo(
        () => countCompleteRows(savedDataset, [savedRoleSelection.x, savedRoleSelection.y].filter(Boolean), true),
        [savedDataset, savedRoleSelection.x, savedRoleSelection.y]
    );
    const activeXColumn = calculatorInputMode === 'saved' ? savedXColumn : selectedXColumn;
    const activeYColumn = calculatorInputMode === 'saved' ? savedYColumn : selectedYColumn;
    const activeCompleteCaseSummary = calculatorInputMode === 'saved'
        ? savedCompleteCaseSummary
        : {
            total: parsedTable.rowCount || 0,
            usable: Math.min(selectedXColumn?.numericValues?.length || 0, selectedYColumn?.numericValues?.length || 0),
            dropped: Math.max(0, (parsedTable.rowCount || 0) - Math.min(selectedXColumn?.numericValues?.length || 0, selectedYColumn?.numericValues?.length || 0)),
        };
    const activeXLabel = activeXColumn?.label || activeXColumn?.name || 'X';
    const activeYLabel = activeYColumn?.label || activeYColumn?.name || 'Y';

    const calculatorStats = useMemo(() => {
        if (!activeXColumn || !activeYColumn || activeXColumn.name === activeYColumn.name) {
            return null;
        }

        return calculatePearsonCorrelationStats({
            xValues: activeXColumn.numericValues,
            yValues: activeYColumn.numericValues,
            alpha: 1 - confidenceLevel,
            tails,
            direction,
            confidenceLevel,
            rho0,
        });
    }, [activeXColumn, activeYColumn, confidenceLevel, tails, direction, rho0]);

    useEffect(() => {
        if (calculatorStats?.ok && typeof onStatsChange === 'function') {
            onStatsChange(calculatorStats);
        }
    }, [calculatorStats, onStatsChange]);

    const calculatorGuidance = useMemo(
        () => buildCorrelationGuidance(calculatorStats),
        [calculatorStats]
    );

    const influentialIndex = calculatorStats?.influence?.maxDeltaR >= 0.15
        ? calculatorStats.influence.influentialPoint?.index
        : null;

    const effectSourceStats = currentStats?.ok ? currentStats : (calculatorStats?.ok ? calculatorStats : null);
    const [effectRValue, setEffectRValue] = useState(0.35);

    useEffect(() => {
        if (Number.isFinite(effectSourceStats?.r)) {
            setEffectRValue(effectSourceStats.r);
        }
    }, [effectSourceStats?.r]);

    const effectRSquared = Math.max(0, Math.min(1, effectRValue ** 2));

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
                                Pearson correlation power planning
                            </h3>
                            <p className={`mt-2 text-sm max-w-3xl ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                This stays on the shared StatWizard power surface. Power inputs are population planning values: expected ρ under H1, null ρ₀, alpha, tails, and sample size. It stays separate from the observed-data calculator on purpose.
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
                                    r = {formatStat(effectSourceStats.r, 3)}
                                </h3>
                                <p className={`mt-2 text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                    Pulled from the active calculator data so the effect-size section stays connected to the page workflow.
                                </p>
                            </div>
                            <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${darkMode ? 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20' : 'bg-indigo-50 text-indigo-700 border border-indigo-200'}`}>
                                r² = {formatStat(effectSourceStats.rSquared, 3)}
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
                                        r is already the effect size
                                    </h3>
                                </div>
                            </div>

                            <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                This section stays simple on purpose: translate between observed r and r², keep context visible, and avoid pretending that one set of conventions fits every study. In the Power Analysis tab, the same idea is written with population notation ρ and ρ₀.
                            </p>

                            <div className="mt-6 grid gap-4">
                                <label className="block">
                                    <span className={`text-[11px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                                        Sample Correlation (r)
                                    </span>
                                    <input
                                        type="number"
                                        min={-0.999}
                                        max={0.999}
                                        step={0.01}
                                        value={Number.isFinite(effectRValue) ? effectRValue : ''}
                                        onChange={(event) => {
                                            const numeric = Number(event.target.value);
                                            if (Number.isFinite(numeric)) {
                                                setEffectRValue(Math.max(-0.999, Math.min(0.999, numeric)));
                                            }
                                        }}
                                        className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm font-bold outline-none transition-colors ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200 focus:border-indigo-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500'}`}
                                    />
                                </label>

                                <label className="block">
                                    <span className={`text-[11px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                                        Variance Explained (r²)
                                    </span>
                                    <input
                                        type="number"
                                        min={0}
                                        max={1}
                                        step={0.01}
                                        value={Number.isFinite(effectRSquared) ? effectRSquared.toFixed(3) : ''}
                                        onChange={(event) => {
                                            const numeric = Number(event.target.value);
                                            if (Number.isFinite(numeric)) {
                                                const bounded = Math.max(0, Math.min(1, numeric));
                                                const sign = effectRValue < 0 ? -1 : 1;
                                                setEffectRValue(sign * Math.sqrt(bounded));
                                            }
                                        }}
                                        className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm font-bold outline-none transition-colors ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200 focus:border-indigo-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500'}`}
                                    />
                                </label>
                            </div>
                        </Card>
                    </div>

                    <div className="lg:col-span-7 space-y-6">
                        <div className="grid md:grid-cols-2 gap-4">
                            <MetricTile
                                darkMode={darkMode}
                                label="r"
                                value={formatStat(effectRValue, 3)}
                                tone="primary"
                                detail={buildCorrelationInterpretation(effectRValue)}
                            />
                            <MetricTile
                                darkMode={darkMode}
                                label="r²"
                                value={formatStat(effectRSquared, 3)}
                                detail={`${formatStat(effectRSquared * 100, 1)}% of the variance is shared in the linear model.`}
                            />
                        </div>

                        <Card darkMode={darkMode}>
                            <div className="flex items-center gap-3 mb-3">
                                <TrendingUp size={18} className={darkMode ? 'text-emerald-300' : 'text-emerald-700'} />
                                <h3 className={`text-lg font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                    What r² means
                                </h3>
                            </div>
                            <p className={`text-sm leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                r² reframes the correlation as shared linear variance. Many users find it easier to read &quot;about 25% of the variance is shared&quot; than to interpret r = .50 directly.
                            </p>
                        </Card>

                        <Card darkMode={darkMode}>
                            <div className="flex items-center gap-3 mb-3">
                                <Info size={18} className={darkMode ? 'text-amber-300' : 'text-amber-700'} />
                                <h3 className={`text-lg font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                    Use conventions carefully
                                </h3>
                            </div>
                            <p className={`text-sm leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                Rough textbook convention: {getCorrelationConventionLabel(effectRValue)}. That is a convention, not a rule. The same r can matter very differently across measures and fields.
                            </p>
                        </Card>

                        <Card darkMode={darkMode}>
                            <div className="flex items-center gap-3 mb-3">
                                <AlertTriangle size={18} className={darkMode ? 'text-amber-300' : 'text-amber-700'} />
                                <h3 className={`text-lg font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                    Significance is not size
                                </h3>
                            </div>
                            <p className={`text-sm leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                A tiny r can be significant in a large sample, and a meaningful r can miss significance in a small sample. Keep the effect-size question separate from the hypothesis-test question.
                            </p>
                        </Card>
                    </div>
                </div>
            </div>
        );
    }

    if (section === 'calculator') {
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
                        <Card darkMode={darkMode}>
                            <div className="flex items-center gap-3 mb-4">
                                <Database size={18} className={darkMode ? 'text-indigo-300' : 'text-indigo-700'} />
                                <div>
                                    <div className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
                                        Data Source
                                    </div>
                                    <h3 className={`text-xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                        Choose the input mode
                                    </h3>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-2 mb-5">
                                {[
                                    { id: 'paste', label: 'Paste / Upload' },
                                    { id: 'saved', label: 'Saved Dataset' },
                                ].map((mode) => (
                                    <button
                                        key={mode.id}
                                        type="button"
                                        onClick={() => setCalculatorInputMode(mode.id)}
                                        className={`rounded-full border px-3 py-2 text-[11px] font-black uppercase tracking-widest transition-colors ${calculatorInputMode === mode.id
                                            ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300'
                                            : (darkMode ? 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700 hover:text-slate-200' : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:text-slate-900')
                                        }`}
                                    >
                                        {mode.label}
                                    </button>
                                ))}
                            </div>

                            {calculatorInputMode === 'paste' ? (
                                <>
                                    <div className="flex flex-wrap gap-3 mb-4">
                                        <label className={`inline-flex items-center gap-2 px-4 py-3 rounded-xl border cursor-pointer text-sm font-black uppercase tracking-widest transition-all ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200 hover:border-indigo-500' : 'bg-slate-50 border-slate-200 text-slate-900 hover:border-indigo-500'}`}>
                                            <FileUp size={16} />
                                            Upload CSV
                                            <input type="file" accept=".csv,.txt,.tsv" className="hidden" onChange={onUpload} />
                                        </label>
                                        <button
                                            onClick={() => setTableText(SAMPLE_DATASET)}
                                            className={`inline-flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-black uppercase tracking-widest transition-all ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200 hover:border-indigo-500' : 'bg-slate-50 border-slate-200 text-slate-900 hover:border-indigo-500'}`}
                                        >
                                            <Sparkles size={16} />
                                            Sample Data
                                        </button>
                                    </div>

                                    <textarea
                                        value={tableText}
                                        onChange={(event) => setTableText(event.target.value)}
                                        className={`w-full h-64 rounded-2xl border p-4 text-sm font-mono outline-none transition-colors ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200 focus:border-indigo-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500'}`}
                                    />
                                </>
                            ) : (
                                <div className="space-y-5">
                                    <label className="block">
                                        <span className={`text-[11px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                                            Saved Dataset
                                        </span>
                                        <select
                                            value={selectedDatasetId}
                                            onChange={(event) => setSelectedDatasetId(event.target.value)}
                                            className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm font-bold outline-none transition-colors ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200 focus:border-indigo-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500'}`}
                                        >
                                            {!datasets.length && <option value="">No saved datasets yet</option>}
                                            {datasets.map((dataset) => (
                                                <option key={dataset.id} value={dataset.id}>{dataset.name}</option>
                                            ))}
                                        </select>
                                    </label>

                                    {savedDataset && (
                                        <div className={`rounded-2xl border p-4 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                                            <div className={`text-[10px] font-black uppercase tracking-widest mb-2 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
                                                Dataset snapshot
                                            </div>
                                            <p className={`text-sm font-bold ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                                                {savedDataset.rowCount} rows / {savedDataset.columnCount} variables
                                            </p>
                                            <p className={`mt-2 text-xs ${darkMode ? 'text-slate-500' : 'text-slate-600'}`}>
                                                {savedNumericColumns.length} numeric variable{savedNumericColumns.length === 1 ? '' : 's'} available for Pearson correlation.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </Card>

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

    return (
        <div className="space-y-8">
            <Card darkMode={darkMode}>
                <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-xl ${darkMode ? 'bg-indigo-500/10 text-indigo-300' : 'bg-indigo-50 text-indigo-700'}`}>
                        <Sparkles size={20} />
                    </div>
                    <div>
                        <h3 className={`text-xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>Pearson correlation tutor / lessons</h3>
                        <p className={`mt-2 text-sm max-w-3xl ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                            This first slice is an interactive concept page rather than a formal lesson engine. Use the presets and controls to see what r responds to and what it misses.
                        </p>
                    </div>
                </div>
            </Card>

            <div className="grid lg:grid-cols-12 gap-8 items-start">
                <div className="lg:col-span-8 space-y-6">
                    <Card darkMode={darkMode}>
                        <PearsonScatterplot
                            pairs={lessonPairs}
                            backgroundPairs={lessonDataset.contextPairs}
                            stats={lessonStats}
                            darkMode={darkMode}
                            xLabel="X Variable"
                            yLabel="Y Variable"
                            showLine={lessonShowLine}
                            showConfidenceBand={lessonShowBand}
                            highlightPointIndex={lessonStats?.influence?.influentialPoint?.index}
                            highlightXRange={lessonDataset.highlightXRange}
                            title="Interactive Scatterplot"
                            subtitle={lessonSubtitle}
                        />
                    </Card>

                    <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
                        <MetricTile darkMode={darkMode} label="r" value={formatStat(lessonStats?.r, 3)} tone="primary" />
                        <MetricTile darkMode={darkMode} label="r²" value={formatStat(lessonStats?.rSquared, 3)} />
                        <MetricTile darkMode={darkMode} label="n" value={`${lessonStats?.n || 0}`} />
                        <MetricTile darkMode={darkMode} label="Live Read" value={lessonStats?.interpretation || 'Waiting for data'} />
                    </div>

                    {lessonPreset === 'restricted_range' && lessonContextStats?.ok && lessonStats?.ok && (
                        <Card darkMode={darkMode}>
                            <div className="flex items-center gap-3 mb-3">
                                <Target size={18} className={darkMode ? 'text-amber-300' : 'text-amber-700'} />
                                <h3 className={`text-lg font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                    Why the restricted-range preset looks weaker
                                </h3>
                            </div>
                            <p className={`text-sm leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                The faded points show the broader linear relationship with r = {formatStat(lessonContextStats.r, 3)}. The highlighted slice only observes part of the X range, so the visible spread gets compressed and the observed r drops to {formatStat(lessonStats.r, 3)}.
                            </p>
                        </Card>
                    )}
                </div>

                <div className="lg:col-span-4 space-y-6">
                    <Card darkMode={darkMode}>
                        <div className="flex items-center gap-3 mb-4">
                            <SlidersHorizontal size={18} className={darkMode ? 'text-indigo-300' : 'text-indigo-700'} />
                            <div>
                                <div className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>Presets</div>
                                <h3 className={`text-xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>Explore the pattern</h3>
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
                        </div>

                        <div className="mt-6 grid grid-cols-2 gap-3">
                            <button onClick={() => setLessonShowLine((value) => !value)} className={`rounded-xl border px-4 py-3 text-xs font-black uppercase tracking-widest transition-all ${lessonShowLine ? 'bg-indigo-600 text-white border-indigo-500' : (darkMode ? 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900')}`}>{lessonShowLine ? 'Hide Line' : 'Show Line'}</button>
                            <button onClick={() => setLessonShowBand((value) => !value)} className={`rounded-xl border px-4 py-3 text-xs font-black uppercase tracking-widest transition-all ${lessonShowBand ? 'bg-indigo-600 text-white border-indigo-500' : (darkMode ? 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900')}`}>{lessonShowBand ? 'Hide Band' : 'Show Band'}</button>
                            <button
                                onClick={() => setLessonOutlierOn((value) => !value)}
                                className={`col-span-2 rounded-xl border px-4 py-3 text-xs font-black uppercase tracking-widest transition-all ${lessonOutlierOn ? 'bg-indigo-600 text-white border-indigo-500' : (darkMode ? 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900')}`}
                            >
                                {lessonOutlierOn ? 'Remove Outlier' : 'Add Outlier'}
                            </button>
                            <button
                                onClick={regenerateLessonSample}
                                className={`col-span-2 inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-xs font-black uppercase tracking-widest transition-all ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-300 hover:text-white hover:border-indigo-500' : 'bg-slate-50 border-slate-200 text-slate-700 hover:text-slate-900 hover:border-indigo-500'}`}
                            >
                                <RefreshCw size={14} />
                                Regenerate Sample
                            </button>
                        </div>

                        <div className={`mt-4 rounded-xl border p-4 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                            <div className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-indigo-300' : 'text-indigo-700'}`}>
                                Outlier Toggle
                            </div>
                            <p className={`mt-2 text-sm leading-relaxed ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                                Apply one influential point to the current base pattern so you can compare the same relationship before and after the outlier appears.
                            </p>
                        </div>

                        <div className={`mt-4 rounded-xl border p-4 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                            <div className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-indigo-300' : 'text-indigo-700'}`}>
                                Stable Sample
                            </div>
                            <p className={`mt-2 text-sm leading-relaxed ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                                Noise, sample size, and the outlier toggle now modify the same active sample. Use regenerate only when you want a fresh example.
                            </p>
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
                                'r measures direction and strength of a straight-line association.',
                                'r = 0 does not prove there is no relationship of any kind.',
                                'A curved relationship can look strong in the plot while r stays small.',
                                'Outliers can strongly change both the fitted line and r.',
                                'Restriction of range usually shrinks r.',
                                'Correlation does not tell you what causes what.',
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

export default PearsonCorrelationPage;
