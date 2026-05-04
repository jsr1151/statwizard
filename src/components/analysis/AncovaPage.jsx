import React, { useEffect, useMemo, useState } from 'react';
import { Calculator, Sparkles, Target } from 'lucide-react';
import AnalysisAssumptionsSection from './AnalysisAssumptionsSection.jsx';
import AnalysisDatasetWorkspace from './AnalysisDatasetWorkspace.jsx';
import AncovaVisual from '../visuals/AncovaVisual.jsx';
import PowerAnalysisTab from '../power/PowerAnalysisTab.jsx';
import EffectSizePanel from '../power/EffectSizePanel.jsx';
import { useDatasetLibraryContext } from '../../hooks/useDatasetLibrary.js';
import useAnalysisDatasetSelection from '../../hooks/useAnalysisDatasetSelection.js';
import { buildAncovaDatasetSetup } from '../../utils/analysisDatasetAdapters.js';
import { getDatasetColumn } from '../../utils/datasetImport.js';

const Card = ({ darkMode, children, className = '' }) => (
    <div className={`rounded-2xl border p-6 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} ${className}`}>
        {children}
    </div>
);

const AncovaPage = ({
    section,
    darkMode,
    currentStats,
    onStatsChange,
    assumptions = [],
    testConfig,
    initialPowerMode,
    onOpenDataManager,
    showValues = false,
}) => {
    const { datasets } = useDatasetLibraryContext();
    const {
        launchPayload,
        selectedDataset,
        selectedDatasetId,
        setSelectedDatasetId,
    } = useAnalysisDatasetSelection({
        analysisId: 'ancova',
        datasets,
    });
    const [roleSelection, setRoleSelection] = useState({
        outcome: '',
        grouping: '',
        covariate: '',
    });

    useEffect(() => {
        if (!selectedDataset || launchPayload?.datasetId !== selectedDataset.id) {
            return;
        }

        setRoleSelection((previous) => ({
            outcome: launchPayload?.outcome || previous.outcome,
            grouping: launchPayload?.grouping || previous.grouping,
            covariate: launchPayload?.covariate || previous.covariate,
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
            id: 'grouping',
            label: 'Grouping variable',
            selection: 'single',
            allowedTypes: ['categorical', 'text'],
            placeholder: 'Select grouping variable',
            columnFilter: ({ column }) => (column.summary?.uniqueCount || 0) >= 2,
            describeOption: ({ column }) => `${column.summary?.uniqueCount || 0} levels`,
            emptyOptionsText: 'This dataset does not currently have a categorical variable with 2 or more usable levels.',
        },
        {
            id: 'covariate',
            label: 'Covariate',
            selection: 'single',
            allowedTypes: ['numeric'],
            excludeRoleIds: ['outcome'],
            placeholder: 'Select numeric covariate',
            emptyOptionsText: 'Choose a different numeric variable for the covariate role.',
        },
    ]), []);

    const datasetSetup = useMemo(() => buildAncovaDatasetSetup(selectedDataset, {
        outcomeColumnId: roleSelection.outcome,
        groupingColumnId: roleSelection.grouping,
        covariateColumnId: roleSelection.covariate,
    }), [selectedDataset, roleSelection]);

    const warningMessages = useMemo(() => {
        const warnings = [];
        const outcomeColumn = getDatasetColumn(selectedDataset, roleSelection.outcome);
        const covariateColumn = getDatasetColumn(selectedDataset, roleSelection.covariate);

        if ((outcomeColumn?.summary?.issues || []).includes('Non-numeric entries')) {
            warnings.push('Some dependent-variable entries are not numeric and will be excluded from the ANCOVA.');
        }

        if ((covariateColumn?.summary?.issues || []).includes('Non-numeric entries')) {
            warnings.push('Some covariate entries are not numeric and will be excluded from the ANCOVA.');
        }

        if (datasetSetup.ok && datasetSetup.droppedRows > 0) {
            warnings.push(`${datasetSetup.droppedRows} row${datasetSetup.droppedRows === 1 ? '' : 's'} were excluded because of missing or unsupported values.`);
        }

        return warnings;
    }, [datasetSetup.droppedRows, datasetSetup.ok, roleSelection.covariate, roleSelection.outcome, selectedDataset]);

    const successMessages = datasetSetup.ok
        ? ['The saved dataset has been preloaded into the ANCOVA calculator below.']
        : [];

    const summaryItems = datasetSetup.ok ? [
        {
            label: 'Usable rows',
            value: `${datasetSetup.usableRows}`,
            detail: 'Rows where the outcome, grouping variable, and covariate are all usable.',
        },
        {
            label: 'Groups',
            value: `${datasetSetup.levels.length}`,
            detail: datasetSetup.levels.join(', '),
        },
        {
            label: 'Dropped rows',
            value: `${datasetSetup.droppedRows}`,
            detail: 'Rows removed because of missing or unsupported values.',
        },
    ] : [];

    if (section === 'power') {
        return (
            <div className="space-y-8">
                <Card darkMode={darkMode}>
                    <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-xl ${darkMode ? 'bg-indigo-500/10 text-indigo-300' : 'bg-indigo-50 text-indigo-700'}`}>
                            <Target size={20} />
                        </div>
                        <div>
                            <h3 className={`text-xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>ANCOVA power planning</h3>
                            <p className={`mt-2 text-sm max-w-3xl ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                Power stays on the shared planning surface. Calculator mode handles observed grouped data plus the covariate; this tab handles design targets like alpha, power, adjusted-group effect size, and total sample size.
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
            <EffectSizePanel
                testConfig={testConfig}
                currentStats={currentStats}
                darkMode={darkMode}
            />
        );
    }

    if (section === 'assumptions') {
        return (
            <AnalysisAssumptionsSection
                darkMode={darkMode}
                title="ANCOVA assumptions"
                description="Review the assumptions before trusting the adjusted group effect. The calculator tab uses your saved dataset; this section explains what to check, especially linearity and homogeneity of regression slopes."
                assumptions={assumptions}
                summaryItems={summaryItems}
            />
        );
    }

    if (section === 'calculator') {
        return (
            <div className="space-y-8">
                <AnalysisDatasetWorkspace
                    darkMode={darkMode}
                    title="Load a saved dataset into the ANCOVA calculator"
                    description="Choose a saved dataset, map one numeric outcome, one grouping variable, and one numeric covariate, and the calculator below will preload those values immediately."
                    datasets={datasets}
                    selectedDatasetId={selectedDatasetId}
                    onSelectDatasetId={setSelectedDatasetId}
                    dataset={selectedDataset}
                    roles={roles}
                    roleSelection={roleSelection}
                    onRoleSelectionChange={setRoleSelection}
                    emptyMessage="Save a dataset in Data Manager first, then come back here to run the ANCOVA."
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
                            <h3 className={`text-xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>ANCOVA calculator</h3>
                            <p className={`mt-2 text-sm max-w-3xl ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                The saved-dataset mapping preloads the group data and covariate directly into the ANCOVA workspace, so Calculator mode stays focused on observed adjusted results instead of toy inputs.
                            </p>
                        </div>
                    </div>

                    <AncovaVisual
                        darkMode={darkMode}
                        showValues={showValues}
                        onStatsUpdate={onStatsChange}
                        mode="calculator"
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
                        <h3 className={`text-xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>ANCOVA tutor / lessons</h3>
                        <p className={`mt-2 text-sm max-w-3xl ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                            Tutor mode keeps a teaching example in view so you can focus on adjustment, parallel slopes, and how the covariate changes the group comparison. Switch to Test Calculator when you want to run the same model on your saved dataset.
                        </p>
                    </div>
                </div>
            </Card>

            <Card darkMode={darkMode}>
                <div className="space-y-4">
                    <h4 className={`text-sm font-black uppercase tracking-widest flex items-center gap-2 ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
                        <Sparkles size={14} /> What ANCOVA Is Doing
                    </h4>
                    <div className={`grid md:grid-cols-3 gap-4 text-sm ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                        <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                            <div className={`text-[10px] font-black uppercase tracking-widest mb-2 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>1. The Problem</div>
                            <p className="leading-relaxed">Groups often differ on a background variable (the <strong>covariate</strong>) before the treatment even begins. Raw group means then reflect both the treatment effect and these pre-existing differences.</p>
                        </div>
                        <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                            <div className={`text-[10px] font-black uppercase tracking-widest mb-2 ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>2. The Adjustment</div>
                            <p className="leading-relaxed">ANCOVA fits a regression line with the same slope in every group, then slides each line to a common covariate value (the grand mean). The <strong>adjusted means</strong> at that value are what gets compared.</p>
                        </div>
                        <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                            <div className={`text-[10px] font-black uppercase tracking-widest mb-2 ${darkMode ? 'text-amber-400' : 'text-amber-600'}`}>3. Key Assumption</div>
                            <p className="leading-relaxed">The covariate-outcome slope must be the <strong>same across all groups</strong> (parallel slopes). The TABLE tab tests this — a significant Group × Covariate interaction means the assumption is violated.</p>
                        </div>
                    </div>
                    <p className={`text-xs leading-relaxed ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                        <strong>In the visualizer:</strong> Use the <strong>F-DIST</strong> tab to enter data and see the F-statistic. Switch to <strong>Explore</strong> mode to freely drag df₁, df₂, and F. The <strong>PLOT</strong> tab shows the covariate slider — drag it to see how adjusted means shift while raw means stay fixed. The <strong>EXPLORER</strong> tab shows pairwise comparisons at whatever covariate value you set.
                    </p>
                </div>
            </Card>

            <AncovaVisual
                darkMode={darkMode}
                showValues={showValues}
                onStatsUpdate={onStatsChange}
                mode="lessons"
            />
        </div>
    );
};

export default AncovaPage;
