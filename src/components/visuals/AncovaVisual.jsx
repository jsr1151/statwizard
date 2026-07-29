import React, { useEffect, useMemo, useState } from 'react';
import { fCDF, fPPF } from '../../utils/mathHelpers';
import { calculateAncova, hydrateAncovaGroups, parseAncovaSeries } from '../../stats/ancova';
import { ANCOVA_COLORS, INITIAL_ANCOVA_GROUPS } from '../../data/ancovaPresets';
import TabButton from '../common/TabButton';
import AncovaDataPanel from './AncovaDataPanel';
import AncovaDistributionPanel from './AncovaDistributionPanel';
import AncovaExplorerPanel from './AncovaExplorerPanel';
import AncovaPlotPanel from './AncovaPlotPanel';
import AncovaResultsTable from './AncovaResultsTable';

const TABS = ['DATA', 'PLOT', 'TABLE', 'EXPLORER', 'F-DIST'];
const createGroupId = () => globalThis.crypto?.randomUUID?.()
    || `group-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

const AncovaVisual = ({ darkMode, showValues, onStatsUpdate, tutor }) => {
    const [groups, setGroups] = useState(() => hydrateAncovaGroups(INITIAL_ANCOVA_GROUPS));
    const [covariateName, setCovariateName] = useState('Baseline Score');
    const [activeTab, setActiveTab] = useState('DATA');
    const [alpha, setAlpha] = useState(0.05);
    const [showRegressionLines, setShowRegressionLines] = useState(true);
    const [showAdjustedMeans, setShowAdjustedMeans] = useState(true);
    const [showRawMeans, setShowRawMeans] = useState(false);
    const [covariateAdjust, setCovariateAdjust] = useState(null);
    const [zoomDistribution, setZoomDistribution] = useState(false);
    const [manualF, setManualF] = useState(null);
    const [distributionMode, setDistributionMode] = useState('data');
    const [calculatorDf1, setCalculatorDf1] = useState(2);
    const [calculatorDf2, setCalculatorDf2] = useState(25);
    const [calculatorF, setCalculatorF] = useState(3.5);

    const stats = useMemo(() => calculateAncova(groups, {
        adjustX: covariateAdjust,
        manualF,
        alpha,
    }), [alpha, covariateAdjust, groups, manualF]);

    useEffect(() => {
        if (stats.ready && covariateAdjust === null) {
            setCovariateAdjust(stats.grandMeanX);
        }
    }, [covariateAdjust, stats.grandMeanX, stats.ready]);

    useEffect(() => {
        if (!onStatsUpdate) return;
        if (distributionMode === 'calc') {
            onStatsUpdate({
                mode: 'calc',
                alpha,
                df1: calculatorDf1,
                df2: calculatorDf2,
                F: calculatorF,
                Fcrit: fPPF(1 - alpha, calculatorDf1, calculatorDf2),
                p: 1 - fCDF(calculatorF, calculatorDf1, calculatorDf2),
                ready: true,
            });
            return;
        }
        if (!stats.ready) {
            onStatsUpdate(null);
            return;
        }
        onStatsUpdate({
            ...stats,
            mode: 'data',
            df1: stats.dfB,
            df2: stats.dfW,
            Fcrit: fPPF(1 - alpha, stats.dfB, stats.dfW),
            p: 1 - fCDF(stats.F, stats.dfB, stats.dfW),
        });
    }, [alpha, calculatorDf1, calculatorDf2, calculatorF, distributionMode, onStatsUpdate, stats]);

    useEffect(() => {
        tutor?.triggerEvent?.({ activeTab });
    }, [activeTab, stats, tutor]);

    const updateGroup = (id, field, value) => {
        setGroups((previous) => previous.map((group) => (
            group.id === id ? { ...group, [field]: value } : group
        )));
    };

    const updateRaw = (id, axis, rawText) => {
        const values = parseAncovaSeries(rawText);
        setGroups((previous) => previous.map((group) => (
            group.id === id
                ? { ...group, [`${axis}Raw`]: rawText, [`${axis}Values`]: values }
                : group
        )));
    };

    const loadPreset = (preset) => {
        setCovariateName(preset.covariateName);
        setGroups(hydrateAncovaGroups(preset.groups));
        setCovariateAdjust(null);
        setManualF(null);
    };

    const addGroup = () => {
        setGroups((previous) => [...previous, {
            id: createGroupId(),
            label: `Group ${previous.length + 1}`,
            color: ANCOVA_COLORS[previous.length % ANCOVA_COLORS.length],
            xRaw: '',
            yRaw: '',
            xValues: [],
            yValues: [],
            collapsed: false,
        }]);
    };

    const removeGroup = (id) => {
        setGroups((previous) => previous.length <= 2
            ? previous
            : previous.filter((group) => group.id !== id));
    };

    const unavailable = activeTab !== 'DATA' && activeTab !== 'F-DIST' && !stats.ready;

    return (
        <div className="w-full h-full flex flex-col">
            <nav className={`p-4 border-b shrink-0 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`} aria-label="ANCOVA views">
                <div className="flex items-center gap-1 overflow-x-auto pb-1 custom-scrollbar">
                    {TABS.map((tab) => <TabButton key={tab} active={activeTab === tab} onClick={() => setActiveTab(tab)} darkMode={darkMode}>{tab}</TabButton>)}
                </div>
            </nav>

            <div className="flex-1 overflow-y-auto custom-scrollbar relative">
                <div className="p-4 lg:p-6 pb-20">
                    {activeTab === 'DATA' && (
                        <AncovaDataPanel
                            covariateName={covariateName}
                            darkMode={darkMode}
                            groups={groups}
                            onAddGroup={addGroup}
                            onCovariateNameChange={setCovariateName}
                            onGroupChange={updateGroup}
                            onGroupRemove={removeGroup}
                            onPresetLoad={loadPreset}
                            onRawChange={updateRaw}
                        />
                    )}
                    {activeTab === 'PLOT' && stats.ready && (
                        <AncovaPlotPanel
                            covariateName={covariateName}
                            darkMode={darkMode}
                            showAdjustedMeans={showAdjustedMeans}
                            showRawMeans={showRawMeans}
                            showRegressionLines={showRegressionLines}
                            stats={stats}
                            onAdjustXChange={setCovariateAdjust}
                            onShowAdjustedMeansChange={setShowAdjustedMeans}
                            onShowRawMeansChange={setShowRawMeans}
                            onShowRegressionLinesChange={setShowRegressionLines}
                        />
                    )}
                    {activeTab === 'TABLE' && stats.ready && <AncovaResultsTable alpha={alpha} covariateName={covariateName} darkMode={darkMode} showValues={showValues} stats={stats} />}
                    {activeTab === 'EXPLORER' && stats.ready && <AncovaExplorerPanel alpha={alpha} darkMode={darkMode} stats={stats} />}
                    {activeTab === 'F-DIST' && (
                        <AncovaDistributionPanel
                            alpha={alpha}
                            calcDf1={calculatorDf1}
                            calcDf2={calculatorDf2}
                            calcF={calculatorF}
                            darkMode={darkMode}
                            mode={distributionMode}
                            stats={stats}
                            zoom={zoomDistribution}
                            onAlphaChange={setAlpha}
                            onCalcDf1Change={setCalculatorDf1}
                            onCalcDf2Change={setCalculatorDf2}
                            onCalcFChange={setCalculatorF}
                            onManualFChange={setManualF}
                            onModeChange={setDistributionMode}
                            onZoomChange={setZoomDistribution}
                        />
                    )}
                    {unavailable && <div className="min-h-80 flex items-center justify-center text-sm font-bold text-slate-500">Enter at least two complete groups with paired covariate and outcome values.</div>}
                </div>
            </div>
        </div>
    );
};

export default AncovaVisual;
