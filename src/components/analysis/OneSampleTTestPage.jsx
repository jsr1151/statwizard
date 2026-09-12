import React, { useEffect, useMemo, useState } from 'react';
import { Calculator, Sparkles, Target } from 'lucide-react';
import AnalysisAssumptionsSection from './AnalysisAssumptionsSection.jsx';
import AnalysisDatasetWorkspace from './AnalysisDatasetWorkspace.jsx';
import AnalysisCalculatorWorkspace from './AnalysisCalculatorWorkspace.jsx';
import NormalDistributionVisual from '../visuals/NormalDistributionVisual.jsx';
import PowerAnalysisTab from '../power/PowerAnalysisTab.jsx';
import EffectSizePanel from '../power/EffectSizePanel.jsx';
import { useDatasetLibraryContext } from '../../hooks/useDatasetLibrary.js';
import useAnalysisDatasetSelection from '../../hooks/useAnalysisDatasetSelection.js';
import { buildOneSampleTTestDatasetSetup } from '../../utils/analysisDatasetAdapters.js';
import { getDatasetColumn } from '../../utils/datasetImport.js';

const Card = ({ darkMode, children, className = '' }) => (
    <div className={`rounded-2xl border p-6 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} ${className}`}>
        {children}
    </div>
);

const noop = () => {};

const OneSampleTTestPage = ({
    section,
    darkMode,
    currentStats,
    onStatsChange,
    assumptions = [],
    testConfig,
    initialPowerMode,
    onOpenDataManager,
    onTutorUpdate,
}) => {
    const { datasets } = useDatasetLibraryContext();
    const {
        dataSource,
        setDataSource,
        launchPayload,
        selectedDataset,
        selectedDatasetId,
        setSelectedDatasetId,
    } = useAnalysisDatasetSelection({
        analysisId: 'one_sample_t_test',
        datasets,
    });
    const [roleSelection, setRoleSelection] = useState({ outcome: '' });

    useEffect(() => {
        if (!selectedDataset || launchPayload?.datasetId !== selectedDataset.id) {
            return;
        }

        setRoleSelection((previous) => ({
            outcome: launchPayload?.outcome || previous.outcome,
        }));
    }, [launchPayload, selectedDataset]);

    const roles = useMemo(() => ([
        {
            id: 'outcome',
            label: 'Sample variable',
            selection: 'single',
            allowedTypes: ['numeric'],
            placeholder: 'Select numeric sample variable',
            emptyOptionsText: 'This dataset does not currently have any numeric variables for a one-sample t-test.',
        },
    ]), []);

    const datasetSetup = useMemo(() => buildOneSampleTTestDatasetSetup(selectedDataset, {
        outcomeColumnId: roleSelection.outcome,
    }), [selectedDataset, roleSelection.outcome]);

    const warningMessages = useMemo(() => {
        const warnings = [];
        const outcomeColumn = getDatasetColumn(selectedDataset, roleSelection.outcome);

        if ((outcomeColumn?.summary?.issues || []).includes('Non-numeric entries')) {
            warnings.push('Some sample entries are not numeric and will be excluded from the t-test.');
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
            detail: 'Rows where the selected sample variable is numeric.',
        },
        {
            label: 'Dropped rows',
            value: `${datasetSetup.droppedRows}`,
            detail: 'Rows removed because the sample value was missing or unsupported.',
        },
        {
            label: 'Variable',
            value: getDatasetColumn(selectedDataset, roleSelection.outcome)?.label || 'Selected sample',
            detail: 'This variable becomes the observed sample for the t-test.',
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
                            <h3 className={`text-xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>One-sample t-test power planning</h3>
                            <p className={`mt-2 text-sm max-w-3xl ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                Power stays on the shared planning surface. Calculator mode handles observed sample data; this tab handles alpha, target power, effect size, and sample size.
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
                title="One-sample t-test assumptions"
                description="Review the assumptions before trusting the observed one-sample t statistic. The calculator tab uses your saved dataset; this section explains what to check before interpreting the result."
                assumptions={assumptions}
                summaryItems={dataSource === 'saved' ? summaryItems : []}
            />
        );
    }

    if (section === 'calculator') {
        return (
            <AnalysisCalculatorWorkspace
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
                        description="Choose a saved dataset, map one numeric sample variable, and the calculator below will preload those values immediately."
                        datasets={datasets}
                        selectedDatasetId={selectedDatasetId}
                        onSelectDatasetId={setSelectedDatasetId}
                        dataset={selectedDataset}
                        roles={roles}
                        roleSelection={roleSelection}
                        onRoleSelectionChange={setRoleSelection}
                        emptyMessage="Save a dataset in Data Manager first, then come back here to run the one-sample t-test."
                        validationMessages={datasetSetup.errors}
                        warningMessages={warningMessages}
                        summaryItems={dataSource === 'saved' ? summaryItems : []}
                    />
                }
            >

                <Card darkMode={darkMode}>
                    <div className="flex items-start gap-4 mb-6">
                        <div className={`p-3 rounded-xl ${darkMode ? 'bg-indigo-500/10 text-indigo-300' : 'bg-indigo-50 text-indigo-700'}`}>
                            <Calculator size={20} />
                        </div>
                        <div>
                            <h3 className={`text-xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>One-sample calculator</h3>
                            <p className={`mt-2 text-sm max-w-3xl ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                Inspect the current inputs and results below. Check the Assumptions section before reporting your findings.
                            </p>
                        </div>
                    </div>

                    <NormalDistributionVisual
                        type="t"
                        darkMode={darkMode}
                        showTutor={false}
                        onTutorUpdate={onTutorUpdate || noop}
                        onStatsUpdate={onStatsChange}
                        datasetSeed={dataSource === 'saved' ? datasetSetup.seed : undefined}
                    />
                </Card>
            </AnalysisCalculatorWorkspace>
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
                        <h3 className={`text-xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>One-sample t-test tutor / lessons</h3>
                        <p className={`mt-2 text-sm max-w-3xl ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                            Tutor mode keeps a teaching example in view so you can focus on how the sample mean, sample SD, df, and benchmark value shape the t statistic.
                        </p>
                    </div>
                </div>
            </Card>

            <NormalDistributionVisual
                type="t"
                darkMode={darkMode}
                showTutor={true}
                onTutorUpdate={onTutorUpdate || noop}
                onStatsUpdate={onStatsChange}
            />
        </div>
    );
};

export default OneSampleTTestPage;
