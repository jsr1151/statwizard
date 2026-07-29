import React, { useEffect, useMemo, useState } from 'react';
import { Calculator, Sigma, Sparkles } from 'lucide-react';
import AnalysisAssumptionsSection from './AnalysisAssumptionsSection.jsx';
import AnalysisDatasetWorkspace from './AnalysisDatasetWorkspace.jsx';
import FactorialAnovaVisual from '../visuals/FactorialAnovaVisual.jsx';
import { useDatasetLibraryContext } from '../../hooks/useDatasetLibrary.js';
import useAnalysisDatasetSelection from '../../hooks/useAnalysisDatasetSelection.js';
import { buildFactorialAnovaDatasetSetup } from '../../utils/analysisDatasetAdapters.js';
import { getDatasetColumn } from '../../utils/datasetImport.js';
import PowerAnalysisTab from '../power/PowerAnalysisTab.jsx';

const Card = ({ darkMode, children, className = '' }) => (
    <div className={`rounded-2xl border p-6 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} ${className}`}>
        {children}
    </div>
);

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

const FactorialEffectCard = ({ darkMode, label, effect }) => (
    <Card darkMode={darkMode}>
        <div className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
            {label}
        </div>
        <div className={`mt-2 text-2xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            Partial eta squared = {formatStat(effect?.pes, 3)}
        </div>
        <p className={`mt-2 text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
            F({formatStat(effect?.df, 0)}, {formatStat(effect?.errorDf, 0)}) = {formatStat(effect?.f, 2)}, p {formatPValue(effect?.p)}
        </p>
    </Card>
);

const FactorialAnovaPage = ({
    section,
    darkMode,
    currentStats,
    onStatsChange,
    assumptions = [],
    onOpenDataManager,
    testConfig,
    initialPowerMode,
}) => {
    const { datasets } = useDatasetLibraryContext();
    const {
        launchPayload,
        selectedDataset,
        selectedDatasetId,
        setSelectedDatasetId,
    } = useAnalysisDatasetSelection({
        analysisId: 'factorial_anova',
        datasets,
    });
    const [roleSelection, setRoleSelection] = useState({
        outcome: '',
        factorA: '',
        factorB: '',
    });

    useEffect(() => {
        if (!selectedDataset || launchPayload?.datasetId !== selectedDataset.id) {
            return;
        }

        setRoleSelection((previous) => ({
            outcome: launchPayload?.outcome || previous.outcome,
            factorA: launchPayload?.factorA || previous.factorA,
            factorB: launchPayload?.factorB || previous.factorB,
        }));
    }, [launchPayload, selectedDataset]);

    const roles = useMemo(() => ([
        {
            id: 'outcome',
            label: 'Dependent variable',
            selection: 'single',
            allowedTypes: ['numeric'],
            placeholder: 'Select numeric dependent variable',
            emptyOptionsText: 'This dataset does not currently have any numeric variables for the dependent role.',
        },
        {
            id: 'factorA',
            label: 'Factor A',
            selection: 'single',
            allowedTypes: ['categorical', 'text'],
            placeholder: 'Select first factor',
            columnFilter: ({ column }) => (column.summary?.uniqueCount || 0) >= 2,
            describeOption: ({ column }) => `${column.summary?.uniqueCount || 0} levels`,
            emptyOptionsText: 'This dataset does not currently have a categorical variable with 2 or more usable levels for Factor A.',
        },
        {
            id: 'factorB',
            label: 'Factor B',
            selection: 'single',
            allowedTypes: ['categorical', 'text'],
            excludeRoleIds: ['factorA'],
            placeholder: 'Select second factor',
            columnFilter: ({ column }) => (column.summary?.uniqueCount || 0) >= 2,
            describeOption: ({ column }) => `${column.summary?.uniqueCount || 0} levels`,
            emptyOptionsText: 'Choose a different categorical variable with 2 or more usable levels for Factor B.',
        },
    ]), []);

    const datasetSetup = useMemo(() => buildFactorialAnovaDatasetSetup(selectedDataset, {
        outcomeColumnId: roleSelection.outcome,
        factorAColumnId: roleSelection.factorA,
        factorBColumnId: roleSelection.factorB,
    }), [selectedDataset, roleSelection]);

    const warningMessages = useMemo(() => {
        const warnings = [];
        const outcomeColumn = getDatasetColumn(selectedDataset, roleSelection.outcome);

        if ((outcomeColumn?.summary?.issues || []).includes('Non-numeric entries')) {
            warnings.push('Some dependent-variable entries are not numeric and will be excluded from the factorial ANOVA.');
        }

        if (datasetSetup.ok && datasetSetup.droppedRows > 0) {
            warnings.push(`${datasetSetup.droppedRows} row${datasetSetup.droppedRows === 1 ? '' : 's'} were excluded because of missing or unsupported values.`);
        }

        return warnings;
    }, [datasetSetup.droppedRows, datasetSetup.ok, roleSelection.outcome, selectedDataset]);

    const successMessages = datasetSetup.ok
        ? ['The saved dataset has been preloaded into the factorial ANOVA calculator below.']
        : [];

    const summaryItems = datasetSetup.ok ? [
        {
            label: 'Usable rows',
            value: `${datasetSetup.usableRows}`,
            detail: 'Rows where the outcome plus both factor assignments are usable.',
        },
        {
            label: 'Design',
            value: `${datasetSetup.seed?.factorA?.levels?.length || 0} x ${datasetSetup.seed?.factorB?.levels?.length || 0}`,
            detail: `${datasetSetup.seed?.factorA?.label || 'Factor A'} by ${datasetSetup.seed?.factorB?.label || 'Factor B'}`,
        },
        {
            label: 'Dropped rows',
            value: `${datasetSetup.droppedRows}`,
            detail: 'Rows removed because of missing or unsupported values.',
        },
    ] : [];

    const factorialEffects = useMemo(() => {
        const effects = currentStats?.effects;
        const errorDf = effects?.Error?.df;

        if (!effects) {
            return [];
        }

        return [
            { id: 'A', label: effects.A?.label || 'Factor A', ...effects.A, errorDf },
            { id: 'B', label: effects.B?.label || 'Factor B', ...effects.B, errorDf },
            { id: 'AxB', label: effects.AxB?.label || 'Interaction', ...effects.AxB, errorDf },
        ];
    }, [currentStats]);

    if (section === 'effect_size') {
        return (
            <div className="space-y-8">
                <Card darkMode={darkMode}>
                    <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-xl ${darkMode ? 'bg-indigo-500/10 text-indigo-300' : 'bg-indigo-50 text-indigo-700'}`}>
                            <Sigma size={20} />
                        </div>
                        <div>
                            <h3 className={`text-xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>Factorial ANOVA effect sizes</h3>
                            <p className={`mt-2 text-sm max-w-3xl ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                Factorial ANOVA tracks one effect size for each tested term. This page uses partial eta squared for Factor A, Factor B, and the interaction so users can compare the relative strength of each effect separately.
                            </p>
                        </div>
                    </div>
                </Card>

                {!factorialEffects.length ? (
                    <Card darkMode={darkMode}>
                        <p className={darkMode ? 'text-slate-400' : 'text-slate-600'}>
                            Run the calculator first to populate the main effects and interaction effect sizes.
                        </p>
                    </Card>
                ) : (
                    <div className="grid gap-4 lg:grid-cols-3">
                        {factorialEffects.map((effect) => (
                            <FactorialEffectCard
                                key={effect.id}
                                darkMode={darkMode}
                                label={effect.label}
                                effect={effect}
                            />
                        ))}
                    </div>
                )}
            </div>
        );
    }

    if (section === 'assumptions') {
        return (
            <AnalysisAssumptionsSection
                darkMode={darkMode}
                title="Factorial ANOVA assumptions"
                description="Review the assumptions before trusting the main effects and interaction. The calculator tab uses your saved dataset; this section explains what to check and what to do when those assumptions look weak."
                assumptions={assumptions}
                summaryItems={summaryItems}
            />
        );
    }

    if (section === 'power' && testConfig) {
        return (
            <PowerAnalysisTab
                testConfig={testConfig}
                currentStats={currentStats}
                darkMode={darkMode}
                initialMode={initialPowerMode}
            />
        );
    }

    if (section === 'calculator') {
        return (
            <div className="space-y-8">
                <AnalysisDatasetWorkspace
                    darkMode={darkMode}
                    title="Load a saved dataset into the factorial ANOVA calculator"
                    description="Choose a saved dataset, map one numeric dependent variable plus two categorical factors, and the calculator below will preload the full cell structure immediately."
                    datasets={datasets}
                    selectedDatasetId={selectedDatasetId}
                    onSelectDatasetId={setSelectedDatasetId}
                    dataset={selectedDataset}
                    roles={roles}
                    roleSelection={roleSelection}
                    onRoleSelectionChange={setRoleSelection}
                    emptyMessage="Save a dataset in Data Manager first, then come back here to run the factorial ANOVA."
                    validationMessages={datasetSetup.errors}
                    warningMessages={warningMessages}
                    successMessages={successMessages}
                    summaryItems={summaryItems}
                    onOpenDataManager={onOpenDataManager}
                />

                <Card darkMode={darkMode}>
                    <div className="flex items-start gap-4 mb-6">
                        <div className={`p-3 rounded-xl ${darkMode ? 'bg-indigo-500/10 text-indigo-300' : 'bg-indigo-50 text-indigo-700'}`}>
                            <Calculator size={20} />
                        </div>
                        <div>
                            <h3 className={`text-xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>Factorial ANOVA calculator</h3>
                            <p className={`mt-2 text-sm max-w-3xl ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                The saved-dataset mapping preloads the full cell table, interaction plot, and ANOVA results workspace so users can move straight into interpreting main effects and interactions.
                            </p>
                        </div>
                    </div>

                    <FactorialAnovaVisual
                        darkMode={darkMode}
                        onStatsUpdate={onStatsChange}
                        datasetSeed={datasetSetup.seed}
                    />
                </Card>
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
                        <h3 className={`text-xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>Factorial ANOVA tutor / lessons</h3>
                        <p className={`mt-2 text-sm max-w-3xl ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                            Tutor mode keeps a teaching example in view so you can focus on main effects, interactions, and cell-level interpretation. Switch to Calculator when you want to run the same design on your saved dataset.
                        </p>
                    </div>
                </div>
            </Card>

            <FactorialAnovaVisual
                darkMode={darkMode}
                onStatsUpdate={onStatsChange}
            />
        </div>
    );
};

export default FactorialAnovaPage;
