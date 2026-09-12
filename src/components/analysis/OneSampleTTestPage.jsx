import React, { useMemo } from 'react';
import { Sparkles, Target } from 'lucide-react';
import AnalysisAssumptionsSection from './AnalysisAssumptionsSection.jsx';
import AnalysisDatasetWorkspace from './AnalysisDatasetWorkspace.jsx';
import AnalysisCalculatorWorkspace from './AnalysisCalculatorWorkspace.jsx';
import NormalDistributionVisual from '../visuals/NormalDistributionVisual.jsx';
import PowerAnalysisTab from '../power/PowerAnalysisTab.jsx';
import EffectSizePanel from '../power/EffectSizePanel.jsx';
import { useDatasetLibraryContext } from '../../hooks/useDatasetLibrary.js';
import useOneSampleDraft from '../../hooks/useOneSampleDraft.js';
import CalculatorDraftNotice from '../common/CalculatorDraftNotice.jsx';
import OneSampleTTestCalculator from './OneSampleTTestCalculator.jsx';
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
    const input = useOneSampleDraft(datasets);
    const { dataSource, setDataSource, selectedDataset, selectedDatasetId, setSelectedDatasetId, roleSelection, setRoleSelection } = input;

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
            <div className="space-y-5">
            <CalculatorDraftNotice draft={input.draft} darkMode={darkMode} scope="Recovery includes manual raw and summary inputs, saved dataset and variable choices, the null mean, significance level, hypothesis, and confidence interval type." />
            <AnalysisCalculatorWorkspace
                manualLabel={input.value.source}
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
                        description="Choose a saved dataset and map one numeric sample variable. The calculator reads its current values; use Edit a copy for manual changes."
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

                <OneSampleTTestCalculator input={input} darkMode={darkMode} onStatsUpdate={onStatsChange}
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
