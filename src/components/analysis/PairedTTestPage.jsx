import React, { useEffect, useMemo, useState } from 'react';
import { Calculator, Sparkles, Target } from 'lucide-react';
import AnalysisAssumptionsSection from './AnalysisAssumptionsSection.jsx';
import AnalysisDatasetWorkspace from './AnalysisDatasetWorkspace.jsx';
import PairedTTestVisual from '../visuals/PairedTTestVisual.jsx';
import PowerAnalysisTab from '../power/PowerAnalysisTab.jsx';
import EffectSizePanel from '../power/EffectSizePanel.jsx';
import { useDatasetLibraryContext } from '../../hooks/useDatasetLibrary.js';
import useAnalysisDatasetSelection from '../../hooks/useAnalysisDatasetSelection.js';
import { buildPairedTTestDatasetSetup } from '../../utils/analysisDatasetAdapters.js';
import { getDatasetColumn } from '../../utils/datasetImport.js';

const Card = ({ darkMode, children, className = '' }) => (
    <div className={`rounded-2xl border p-6 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} ${className}`}>
        {children}
    </div>
);

const noop = () => {};

const PairedTTestPage = ({
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
        launchPayload,
        selectedDataset,
        selectedDatasetId,
        setSelectedDatasetId,
    } = useAnalysisDatasetSelection({
        analysisId: 'paired_t_test',
        datasets,
    });
    const [roleSelection, setRoleSelection] = useState({
        first: '',
        second: '',
    });

    useEffect(() => {
        if (!selectedDataset || launchPayload?.datasetId !== selectedDataset.id) {
            return;
        }

        setRoleSelection((previous) => ({
            first: launchPayload?.first || previous.first,
            second: launchPayload?.second || previous.second,
        }));
    }, [launchPayload, selectedDataset]);

    const roles = useMemo(() => ([
        {
            id: 'first',
            label: 'Paired variable 1',
            selection: 'single',
            allowedTypes: ['numeric'],
            placeholder: 'Select first numeric variable',
            emptyOptionsText: 'This dataset does not currently have any numeric variables for the first paired measure.',
        },
        {
            id: 'second',
            label: 'Paired variable 2',
            selection: 'single',
            allowedTypes: ['numeric'],
            excludeRoleIds: ['first'],
            placeholder: 'Select second numeric variable',
            emptyOptionsText: 'Choose a different numeric variable for the second paired measure.',
        },
    ]), []);

    const datasetSetup = useMemo(() => buildPairedTTestDatasetSetup(selectedDataset, {
        firstColumnId: roleSelection.first,
        secondColumnId: roleSelection.second,
    }), [selectedDataset, roleSelection]);

    const warningMessages = useMemo(() => {
        const warnings = [];
        const firstColumn = getDatasetColumn(selectedDataset, roleSelection.first);
        const secondColumn = getDatasetColumn(selectedDataset, roleSelection.second);

        if ((firstColumn?.summary?.issues || []).includes('Non-numeric entries') || (secondColumn?.summary?.issues || []).includes('Non-numeric entries')) {
            warnings.push('One or both paired variables contain unsupported values, so those rows will be excluded.');
        }

        if (datasetSetup.ok && datasetSetup.droppedRows > 0) {
            warnings.push(`${datasetSetup.droppedRows} row${datasetSetup.droppedRows === 1 ? '' : 's'} were excluded because a paired value was missing or unsupported.`);
        }

        return warnings;
    }, [datasetSetup.droppedRows, datasetSetup.ok, roleSelection.first, roleSelection.second, selectedDataset]);

    const successMessages = datasetSetup.ok
        ? ['The saved dataset has been preloaded into the paired-samples calculator below.']
        : [];

    const summaryItems = datasetSetup.ok ? [
        {
            label: 'Usable pairs',
            value: `${datasetSetup.usableRows}`,
            detail: 'Rows where both paired numeric values are present.',
        },
        {
            label: 'Dropped rows',
            value: `${datasetSetup.droppedRows}`,
            detail: 'Rows removed because one side of the pair was missing or unsupported.',
        },
        {
            label: 'Variables',
            value: '2',
            detail: [roleSelection.first, roleSelection.second]
                .map((columnId) => getDatasetColumn(selectedDataset, columnId)?.label)
                .filter(Boolean)
                .join(' vs '),
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
                            <h3 className={`text-xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>Paired-samples t-test power planning</h3>
                            <p className={`mt-2 text-sm max-w-3xl ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                Power stays on the shared planning surface. Calculator mode handles observed paired data; this tab handles design targets like alpha, power, effect size, and the number of paired observations.
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
                title="Paired-samples t-test assumptions"
                description="Review the assumptions before trusting the observed paired t statistic. The calculator tab uses your saved dataset; this section explains what to check and what to do if those assumptions look weak."
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
                    title="Load a saved dataset into the paired-samples calculator"
                    description="Choose a saved dataset, map two numeric repeated measures, and the calculator below will preload those paired values immediately."
                    datasets={datasets}
                    selectedDatasetId={selectedDatasetId}
                    onSelectDatasetId={setSelectedDatasetId}
                    dataset={selectedDataset}
                    roles={roles}
                    roleSelection={roleSelection}
                    onRoleSelectionChange={setRoleSelection}
                    emptyMessage="Save a dataset in Data Manager first, then come back here to run the paired-samples t-test."
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
                            <h3 className={`text-xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>Paired-samples calculator</h3>
                            <p className={`mt-2 text-sm max-w-3xl ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                The saved-dataset mapping preloads the calculator, but you can still inspect or adjust the values inside the workspace if you want to compare alternative paired inputs.
                            </p>
                        </div>
                    </div>

                    <PairedTTestVisual
                        darkMode={darkMode}
                        onTutorUpdate={onTutorUpdate || noop}
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
                        <h3 className={`text-xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>Paired-samples t-test tutor / lessons</h3>
                        <p className={`mt-2 text-sm max-w-3xl ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                            Tutor mode keeps a teaching example in view so you can focus on paired differences, within-person change, and how the paired design affects uncertainty. Switch to Calculator when you want to run the same test on your saved dataset.
                        </p>
                    </div>
                </div>
            </Card>

            <PairedTTestVisual
                darkMode={darkMode}
                onTutorUpdate={onTutorUpdate || noop}
                onStatsUpdate={onStatsChange}
            />
        </div>
    );
};

export default PairedTTestPage;
