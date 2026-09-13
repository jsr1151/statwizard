import React, { useMemo } from 'react';
import { Sparkles, Target } from 'lucide-react';
import AnalysisAssumptionsSection from './AnalysisAssumptionsSection.jsx';
import AnalysisDatasetWorkspace from './AnalysisDatasetWorkspace.jsx';
import AnalysisCalculatorWorkspace from './AnalysisCalculatorWorkspace.jsx';
import AnovaVisual from '../visuals/AnovaVisual.jsx';
import PowerAnalysisTab from '../power/PowerAnalysisTab.jsx';
import EffectSizePanel from '../power/EffectSizePanel.jsx';
import { useDatasetLibraryContext } from '../../hooks/useDatasetLibrary.js';
import useOneWayDraft from '../../hooks/useOneWayDraft.js';
import CalculatorDraftNotice from '../common/CalculatorDraftNotice.jsx';
import OneWayAnovaCalculator from './OneWayAnovaCalculator.jsx';
import { buildOneWayAnovaDatasetSetup } from '../../utils/analysisDatasetAdapters.js';
import { getDatasetColumn } from '../../utils/datasetImport.js';

const Card = ({ darkMode, children, className = '' }) => (
    <div className={`rounded-2xl border p-6 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} ${className}`}>
        {children}
    </div>
);

const noop = () => {};

const OneWayAnovaPage = ({
    section,
    darkMode,
    currentStats,
    onStatsChange,
    assumptions = [],
    testConfig,
    initialPowerMode,
    onOpenDataManager,
    onTutorUpdate,
    tutor,
    showValues = false,
}) => {
    const { datasets } = useDatasetLibraryContext();
    const input = useOneWayDraft(datasets);
    const { dataSource, setDataSource, selectedDataset, selectedDatasetId, setSelectedDatasetId, roleSelection, setRoleSelection } = input;

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
    ]), []);

    const datasetSetup = useMemo(() => buildOneWayAnovaDatasetSetup(selectedDataset, {
        outcomeColumnId: roleSelection.outcome,
        groupingColumnId: roleSelection.grouping,
    }), [selectedDataset, roleSelection]);

    const warningMessages = useMemo(() => {
        const warnings = [];
        const outcomeColumn = getDatasetColumn(selectedDataset, roleSelection.outcome);

        if ((outcomeColumn?.summary?.issues || []).includes('Non-numeric entries')) {
            warnings.push('Some dependent-variable entries are not numeric and will be excluded from the ANOVA.');
        }

        if (datasetSetup.ok && datasetSetup.droppedRows > 0) {
            warnings.push(`${datasetSetup.droppedRows} row${datasetSetup.droppedRows === 1 ? '' : 's'} were excluded because of missing or unsupported values.`);
        }

        return warnings;
    }, [datasetSetup.droppedRows, datasetSetup.ok, roleSelection.outcome, selectedDataset]);

    const summaryItems = datasetSetup.ok ? [
        {
            label: 'Usable rows',
            value: `${datasetSetup.usableRows}`,
            detail: 'Rows where both the grouping variable and dependent variable are usable.',
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
                            <h3 className={`text-xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>One-way ANOVA power planning</h3>
                            <p className={`mt-2 text-sm max-w-3xl ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                Power stays on the shared planning surface. Calculator mode handles observed group data; this tab handles design targets like alpha, power, omnibus effect size, and total sample size.
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
                title="One-way ANOVA assumptions"
                description="Review the assumptions before trusting the observed F statistic. The calculator tab uses your saved dataset; this section explains what to check and what to do when those assumptions look weak."
                assumptions={assumptions}
                summaryItems={dataSource === 'saved' ? summaryItems : []}
            />
        );
    }

    if (section === 'calculator') {
        return (
            <div className="space-y-5">
            <CalculatorDraftNotice draft={input.draft} darkMode={darkMode} scope="Recovery includes separate raw and summary groups, labels, supplied F inputs, saved dataset and variable choices, significance level, and pairwise comparison settings." />
            <AnalysisCalculatorWorkspace
                manualLabel={input.value.inputMode === 'f' ? 'Supplied F statistic' : input.value[input.value.inputMode].source}
                sourceHelp="Switching sources preserves your manual inputs. Saved data follows the current library; use Edit a copy to change its values."
                darkMode={darkMode}
                dataSource={dataSource}
                onSourceChange={setDataSource}
                dataset={selectedDataset}
                datasetSetup={datasetSetup}
                onOpenDataManager={onOpenDataManager}
                onStatsChange={onStatsChange}
                savedWorkspace={
                    <AnalysisDatasetWorkspace
                        darkMode={darkMode}
                        description="Choose a numeric dependent variable and a categorical grouping variable. The calculator reads current saved values; use Edit a copy for manual changes."
                        datasets={datasets}
                        selectedDatasetId={selectedDatasetId}
                        onSelectDatasetId={setSelectedDatasetId}
                        dataset={selectedDataset}
                        roles={roles}
                        roleSelection={roleSelection}
                        onRoleSelectionChange={setRoleSelection}
                        emptyMessage="Save a dataset in Data Manager first, then come back here to run the one-way ANOVA."
                        validationMessages={datasetSetup.errors}
                        warningMessages={warningMessages}
                        summaryItems={dataSource === 'saved' ? summaryItems : []}
                    />
                }
            >

                <OneWayAnovaCalculator input={input} darkMode={darkMode} onStatsUpdate={onStatsChange}
                    datasetSeed={dataSource === 'saved' ? datasetSetup.seed : undefined}
                    datasetName={selectedDataset?.name} rowReview={datasetSetup.rowReview} />
            </AnalysisCalculatorWorkspace>
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
                        <h3 className={`text-xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>One-way ANOVA tutor / lessons</h3>
                        <p className={`mt-2 text-sm max-w-3xl ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                            Tutor mode keeps a teaching example in view so you can focus on between-group versus within-group variance, omnibus F, and post-hoc thinking. Switch to Calculator when you want to run the same test on your saved dataset.
                        </p>
                    </div>
                </div>
            </Card>

            <AnovaVisual
                darkMode={darkMode}
                showValues={showValues}
                onTutorUpdate={onTutorUpdate || noop}
                onStatsUpdate={onStatsChange}
                tutor={tutor}
            />
        </div>
    );
};

export default OneWayAnovaPage;
