import React, { useState, useEffect, useMemo, useRef } from 'react';
import { AlertCircle, Sparkles, Calculator, MousePointer2, Info, ArrowDown, Maximize2, Minimize2, Plus, X, Trash2, Edit2, TrendingUp, Grid, FileText, PieChart, Info as InfoIcon, Sigma } from 'lucide-react';
import { getFDensity, fCDF, fPPF, getFCrit, getFPoints } from '../../utils/mathHelpers';
import { pointsToPath } from '../../utils/svgHelpers';
import { MATH_TERMS } from '../../data/mathTerms';
import TutorPanel from '../tutor/TutorPanel';
import TabButton from '../common/TabButton';
import AncovaDatasetEditor from './AncovaDatasetEditor';
import CalculationText from '../common/CalculationText';
import FSamplingDist from './FSamplingDist';

const COLORS = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

const generateId = () => Math.random().toString(36).substring(2, 9);

const INITIAL_GROUPS = [
    { id: generateId(), label: 'Therapy A', color: COLORS[0], xRaw: '12\n15\n10\n18\n14\n13\n9\n17\n11\n16', yRaw: '55\n62\n48\n71\n60\n58\n45\n68\n52\n65', collapsed: false },
    { id: generateId(), label: 'Therapy B', color: COLORS[1], xRaw: '13\n16\n11\n19\n15\n14\n10\n18\n12\n17', yRaw: '49\n55\n41\n65\n53\n50\n38\n61\n46\n58', collapsed: false },
    { id: generateId(), label: 'Control', color: COLORS[2], xRaw: '11\n14\n9\n17\n13\n12\n8\n16\n10\n15', yRaw: '45\n53\n35\n65\n48\n42\n31\n60\n40\n56', collapsed: false }
];

const THEMES = [
    {
        id: 'theme_therapy',
        label: 'Therapy & Baseline',
        icon: TrendingUp,
        desc: 'Testing new therapies while controlling for baseline severity.',
        covariateName: 'Baseline Score',
        groups: [
            { id: generateId(), label: 'Therapy A', color: COLORS[0], xRaw: '12\n15\n10\n18\n14\n13\n9\n17\n11\n16', yRaw: '55\n62\n48\n71\n60\n58\n45\n68\n52\n65', collapsed: false },
            { id: generateId(), label: 'Therapy B', color: COLORS[1], xRaw: '13\n16\n11\n19\n15\n14\n10\n18\n12\n17', yRaw: '49\n55\n41\n65\n53\n50\n38\n61\n46\n58', collapsed: false },
            { id: generateId(), label: 'Waitlist', color: COLORS[2], xRaw: '11\n14\n9\n17\n13\n12\n8\n16\n10\n15', yRaw: '45\n53\n35\n65\n48\n42\n31\n60\n40\n56', collapsed: false }
        ]
    },
    {
        id: 'theme_education',
        label: 'Teaching Method',
        icon: FileText,
        desc: 'Comparing teaching methods controlling for prior GPA.',
        covariateName: 'Prior GPA',
        groups: [
            { id: generateId(), label: 'Method 1', color: COLORS[3], xRaw: '3.1\n2.8\n3.5\n3.9\n2.5\n3.2\n3.4\n2.9\n3.6\n3.0', yRaw: '85\n78\n92\n95\n70\n88\n89\n81\n90\n84', collapsed: false },
            { id: generateId(), label: 'Method 2', color: COLORS[4], xRaw: '3.0\n3.2\n2.7\n3.6\n3.8\n3.1\n2.4\n3.5\n2.9\n3.3', yRaw: '80\n85\n75\n92\n96\n82\n68\n90\n79\n86', collapsed: false }
        ]
    }
];

export default function AncovaVisual({ darkMode, showValues, onStatsUpdate, tutor }) {
    const [groups, setGroups] = useState(INITIAL_GROUPS);
    const [covariateName, setCovariateName] = useState('Baseline Score');
    const [activeTab, setActiveTab] = useState('DATA');
    const [alpha, setAlpha] = useState(0.05);
    const [activeEq, setActiveEq] = useState('group');

    // Plot specific states
    const [showRegressionLines, setShowRegressionLines] = useState(true);
    const [showAdjustedMeans, setShowAdjustedMeans] = useState(true);
    const [showRawMeans, setShowRawMeans] = useState(false);
    const [covariateAdjust, setCovariateAdjust] = useState(null);
    const [zoomDist, setZoomDist] = useState(false);
    const [manualF, setManualF] = useState(null);
    const [ancovaMode, setAncovaMode] = useState('data'); // 'data' | 'calc'
    const [calcDf1, setCalcDf1] = useState(2);
    const [calcDf2, setCalcDf2] = useState(25);
    const [calcF, setCalcF] = useState(3.5);

    // Initialize parsed data for INITIAL_GROUPS
    useEffect(() => {
        setGroups(prev => prev.map(g => ({
            ...g,
            xValues: g.xRaw.split(/\n|,|\s/).map(v => parseFloat(v)).filter(v => !isNaN(v)),
            yValues: g.yRaw.split(/\n|,|\s/).map(v => parseFloat(v)).filter(v => !isNaN(v))
        })));
    }, []);

    const updateGroup = (id, field, value) => {
        setGroups(groups.map(g => g.id === id ? { ...g, [field]: value } : g));
    };

    const parseRaw = (id, axis, rawText) => {
        const values = rawText.split(/\n|,|\s/).map(v => parseFloat(v)).filter(v => !isNaN(v));
        setGroups(groups.map(g => g.id === id ? { ...g, [`${axis}Raw`]: rawText, [`${axis}Values`]: values } : g));
    };

    const loadPreset = (theme) => {
        setCovariateName(theme.covariateName);
        setGroups(theme.groups.map(g => ({
            ...g,
            xValues: g.xRaw.split(/\n|,|\s/).map(v => parseFloat(v)).filter(v => !isNaN(v)),
            yValues: g.yRaw.split(/\n|,|\s/).map(v => parseFloat(v)).filter(v => !isNaN(v))
        })));
    };

    const addGroup = () => {
        const color = COLORS[groups.length % COLORS.length];
        setGroups([...groups, { id: generateId(), label: `Group ${groups.length + 1}`, color, xRaw: '', yRaw: '', xValues: [], yValues: [], collapsed: false }]);
    };

    const removeGroup = (id) => {
        if (groups.length <= 2) return;
        setGroups(groups.filter(g => g.id !== id));
    };

    const stats = useMemo(() => {
        let nTotal = 0;
        let k = groups.length;
        let grandSumY = 0;
        let grandSumX = 0;

        let validGroups = groups.map(g => {
            const n = Math.min(g.xValues?.length || 0, g.yValues?.length || 0);
            if (n < 2) return null;
            const xVals = g.xValues.slice(0, n);
            const yVals = g.yValues.slice(0, n);
            const sumX = xVals.reduce((a, b) => a + b, 0);
            const sumY = yVals.reduce((a, b) => a + b, 0);
            return { ...g, n, xVals, yVals, sumX, sumY, mx: sumX / n, my: sumY / n };
        }).filter(Boolean);

        if (validGroups.length < 2) return { ready: false };

        validGroups.forEach(g => {
            nTotal += g.n;
            grandSumX += g.sumX;
            grandSumY += g.sumY;
        });

        const grandMeanX = grandSumX / nTotal;
        const grandMeanY = grandSumY / nTotal;

        let SSt_y = 0, SSt_x = 0, SP_t = 0;
        let SSw_y = 0, SSw_x = 0, SP_w = 0;
        let SSE_separate = 0;

        // Min/Max for plotting
        let minX = Infinity, maxX = -Infinity;
        let minY = Infinity, maxY = -Infinity;

        validGroups.forEach(g => {
            let ss_xj = 0;
            let ss_yj = 0;
            let sp_j = 0;

            for (let i = 0; i < g.n; i++) {
                const x = g.xVals[i];
                const y = g.yVals[i];
                if (x < minX) minX = x;
                if (x > maxX) maxX = x;
                if (y < minY) minY = y;
                if (y > maxY) maxY = y;

                const dx = x - g.mx;
                const dy = y - g.my;
                ss_xj += dx * dx;
                ss_yj += dy * dy;
                sp_j += dx * dy;

                const dx_t = x - grandMeanX;
                const dy_t = y - grandMeanY;
                SSt_x += dx_t * dx_t;
                SSt_y += dy_t * dy_t;
                SP_t += dx_t * dy_t;
            }

            g.ss_xj = ss_xj;
            g.sp_j = sp_j;
            g.b_j = ss_xj > 0 ? sp_j / ss_xj : 0;

            SSw_x += ss_xj;
            SSw_y += ss_yj;
            SP_w += sp_j;

            if (ss_xj > 0) {
                SSE_separate += (ss_yj - (sp_j * sp_j) / ss_xj);
            } else {
                SSE_separate += ss_yj;
            }
        });

        const b_w = SSw_x > 0 ? SP_w / SSw_x : 0;

        // Set covariate adjust slider default if null
        const adjustX = covariateAdjust === null ? grandMeanX : covariateAdjust;

        // ANCOVA Common Slope Model
        const SSE_common = SSw_y - (SSw_x > 0 ? (SP_w * SP_w) / SSw_x : 0);
        const dfE_common = nTotal - k - 1;
        const MSE_common = dfE_common > 0 ? SSE_common / dfE_common : 0;

        // Covariate Effect
        const SScov = SSw_x > 0 ? (SP_w * SP_w) / SSw_x : 0;
        const dfCov = 1;
        const MScov = SScov / dfCov;
        const Fcov = MSE_common > 0 ? MScov / MSE_common : 0;
        const pCov = dfE_common > 0 ? 1 - fCDF(Fcov, dfCov, dfE_common) : 1;

        // Group Effect (Adjusted)
        const SSE_reduced_cov_only = SSt_y - (SSt_x > 0 ? (SP_t * SP_t) / SSt_x : 0);
        const SSgrp = SSE_reduced_cov_only - SSE_common;
        const dfGrp = k - 1;
        const MSgrp = dfGrp > 0 ? SSgrp / dfGrp : 0;
        const Fgrp = MSE_common > 0 ? MSgrp / MSE_common : 0;
        const pGrp = dfE_common > 0 ? 1 - fCDF(Fgrp, dfGrp, dfE_common) : 1;

        // Interaction Effect (Homogeneity of Slopes)
        const SSint = SSE_common - SSE_separate;
        const dfInt = k - 1;
        const MSint = dfInt > 0 ? SSint / dfInt : 0;
        const dfE_separate = nTotal - 2 * k;
        const MSE_separate = dfE_separate > 0 ? SSE_separate / dfE_separate : 0;
        const Fint = MSE_separate > 0 ? MSint / MSE_separate : 0;
        const pInt = dfE_separate > 0 ? 1 - fCDF(Fint, dfInt, dfE_separate) : 1;

        // Plot Scales
        const padX = (maxX - minX) * 0.1 || 1;
        const padY = (maxY - minY) * 0.1 || 1;
        const pMinX = minX - padX;
        const pMaxX = maxX + padX;
        const pMinY = minY - padY;
        const pMaxY = maxY + padY;

        const scaleX = (x) => ((x - pMinX) / (pMaxX - pMinX)) * 800;
        const scaleY = (y) => 400 - ((y - pMinY) / (pMaxY - pMinY)) * 400;

        // Adjusted Means
        const adjustedMeans = validGroups.map(g => ({
            id: g.id,
            label: g.label,
            color: g.color,
            mx: g.mx,
            my: g.my,
            // Calculate adjM based on the current slider value (adjustX)
            adjM: g.my - b_w * (g.mx - adjustX),
            b_j: g.b_j
        }));

        return {
            ready: true,
            nTotal, k, grandMeanX, grandMeanY, b_w,
            SSgrp, dfGrp, MSgrp, Fgrp, pGrp,
            SScov, dfCov, MScov, Fcov, pCov,
            SSint, dfInt, MSint, Fint, pInt,
            SSE_common, dfE_common, MSE_common,
            adjustedMeans,
            validGroups,
            alpha,
            pMinX, pMaxX, pMinY, pMaxY,
            scaleX, scaleY, adjustX,
            dfB: dfGrp,
            dfW: dfE_common,
            msB: MSgrp,
            msW: MSE_common,
            ssB: SSgrp,
            ssW: SSE_common,
            fVal: manualF ?? Fgrp,
            F: manualF ?? Fgrp
        };
    }, [groups, alpha, covariateAdjust, manualF]);

    useEffect(() => {
        if (stats.ready && covariateAdjust === null) {
            setCovariateAdjust(stats.grandMeanX);
        }
    }, [stats.ready, stats.grandMeanX, covariateAdjust]);

    useEffect(() => {
        if (onStatsUpdate && stats.ready) {
            if (ancovaMode === 'data') {
                const fCrit = fPPF(1 - alpha, stats.dfB, stats.dfW);
                onStatsUpdate({
                    ...stats,
                    mode: 'data',
                    df1: stats.dfB,
                    df2: stats.dfW,
                    Fcrit: fCrit,
                    p: 1 - fCDF(stats.F, stats.dfB, stats.dfW)
                });
            } else {
                const fCrit = fPPF(1 - alpha, calcDf1, calcDf2);
                onStatsUpdate({
                    mode: 'calc',
                    alpha,
                    df1: calcDf1,
                    df2: calcDf2,
                    F: calcF,
                    Fcrit: fCrit,
                    p: 1 - fCDF(calcF, calcDf1, calcDf2),
                    ready: true
                });
            }
        }
    }, [stats, onStatsUpdate, ancovaMode, calcDf1, calcDf2, calcF, alpha]);

    useEffect(() => {
        if (tutor && tutor.triggerEvent) {
            tutor.triggerEvent({ activeTab });
        }
    }, [stats, activeTab, tutor]);

    return (
        <div className="w-full h-full flex flex-col">
            <div className={`p-4 border-b shrink-0 transition-colors ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-1 overflow-x-auto pb-1 custom-scrollbar">
                        {['DATA', 'PLOT', 'TABLE', 'EXPLORER', 'F-DIST'].map(tab => (
                            <TabButton key={tab} active={activeTab === tab} onClick={() => setActiveTab(tab)} darkMode={darkMode}>
                                {tab}
                            </TabButton>
                        ))}
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar relative">
                <div className="p-4 lg:p-6 pb-20">
                    {activeTab === 'DATA' && (
                        <div className="max-w-4xl mx-auto flex flex-col items-center">
                            <AncovaDatasetEditor
                                covariateName={covariateName}
                                setCovariateName={setCovariateName}
                                groups={groups}
                                updateGroup={updateGroup}
                                parseRaw={parseRaw}
                                removeGroup={removeGroup}
                                darkMode={darkMode}
                            />
                            <button
                                onClick={addGroup}
                                className={`mt-6 px-6 py-3 rounded-xl border-2 border-dashed flex items-center gap-2 font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95 ${darkMode ? 'border-slate-700 text-slate-400 hover:text-indigo-400 hover:border-indigo-500 hover:bg-indigo-950/30' : 'border-slate-300 text-slate-500 hover:text-indigo-600 hover:border-indigo-400 hover:bg-indigo-50'}`}
                            >
                                <Plus size={16} /> Add Group Level
                            </button>
                            <div className={`mt-8 w-full p-6 rounded-2xl border-2 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} shadow-sm`}>
                                <h3 className={`text-sm font-black uppercase tracking-widest mb-4 flex items-center gap-2 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
                                    <Sparkles size={16} /> Study Themes
                                </h3>
                                <div className="grid md:grid-cols-2 gap-4">
                                    {THEMES.map(theme => (
                                        <button
                                            key={theme.id}
                                            onClick={() => loadPreset(theme)}
                                            className={`p-4 rounded-xl border-2 text-left transition-all hover:scale-[1.02] active:scale-95 flex items-start gap-4 ${darkMode ? 'border-slate-800 hover:border-indigo-500 hover:bg-indigo-950/30' : 'border-slate-200 hover:border-indigo-400 hover:bg-indigo-50'}`}
                                        >
                                            <div className={`p-3 rounded-lg ${darkMode ? 'bg-indigo-900/50 text-indigo-400' : 'bg-indigo-100 text-indigo-600'}`}>
                                                <theme.icon size={20} />
                                            </div>
                                            <div>
                                                <div className={`font-bold mb-1 ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>{theme.label}</div>
                                                <div className={`text-xs ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>{theme.desc}</div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'TABLE' && stats.ready && (
                        <div className="max-w-4xl mx-auto">
                            <h3 className={`text-xl font-bold mb-4 font-mono ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>ANCOVA Summary Table</h3>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className={`border-b-2 text-xs uppercase tracking-widest ${darkMode ? 'border-slate-700 text-slate-500' : 'border-slate-300 text-slate-500'}`}>
                                            <th className="py-3 px-4 font-bold">Source</th>
                                            <th className="py-3 px-4 font-bold text-right">SS</th>
                                            <th className="py-3 px-4 font-bold text-right">df</th>
                                            <th className="py-3 px-4 font-bold text-right">MS</th>
                                            <th className="py-3 px-4 font-bold text-right">F</th>
                                            <th className="py-3 px-4 font-bold text-right">p</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-sm cursor-pointer">
                                        <tr onClick={() => setActiveEq('covariate')} className={`border-b transition-colors ${activeEq === 'covariate' ? (darkMode ? 'bg-emerald-950/30' : 'bg-emerald-50') : 'hover:bg-slate-500/5'} ${darkMode ? 'border-slate-800' : 'border-slate-100'}`}>
                                            <td className="py-3 px-4 font-bold text-emerald-500">Covariate ({covariateName})</td>
                                            <td className="py-3 px-4 text-right font-mono">{stats.SScov.toFixed(2)}</td>
                                            <td className="py-3 px-4 text-right font-mono">{stats.dfCov}</td>
                                            <td className="py-3 px-4 text-right font-mono">{stats.MScov.toFixed(2)}</td>
                                            <td className="py-3 px-4 text-right font-mono font-bold text-emerald-500">{stats.Fcov.toFixed(2)}</td>
                                            <td className={`py-3 px-4 text-right font-mono font-bold ${stats.pCov < alpha ? 'text-rose-500' : ''}`}>{stats.pCov < 0.001 ? '< .001' : stats.pCov.toFixed(3).replace(/^0/, '')}</td>
                                        </tr>
                                        <tr onClick={() => setActiveEq('group')} className={`border-b transition-colors ${activeEq === 'group' ? (darkMode ? 'bg-indigo-950/30' : 'bg-indigo-50') : 'hover:bg-slate-500/5'} ${darkMode ? 'border-slate-800' : 'border-slate-100'}`}>
                                            <td className="py-3 px-4 font-bold text-indigo-500">Group (Adjusted)</td>
                                            <td className="py-3 px-4 text-right font-mono">{stats.SSgrp.toFixed(2)}</td>
                                            <td className="py-3 px-4 text-right font-mono">{stats.dfGrp}</td>
                                            <td className="py-3 px-4 text-right font-mono">{stats.MSgrp.toFixed(2)}</td>
                                            <td className="py-3 px-4 text-right font-mono font-bold text-indigo-500">{stats.Fgrp.toFixed(2)}</td>
                                            <td className={`py-3 px-4 text-right font-mono font-bold ${stats.pGrp < alpha ? 'text-rose-500' : ''}`}>{stats.pGrp < 0.001 ? '< .001' : stats.pGrp.toFixed(3).replace(/^0/, '')}</td>
                                        </tr>
                                        <tr className={`border-b transition-colors hover:bg-slate-500/5 ${darkMode ? 'border-slate-800' : 'border-slate-100'}`}>
                                            <td className="py-3 px-4 text-slate-500">Residual (Error)</td>
                                            <td className="py-3 px-4 text-right font-mono text-slate-500">{stats.SSE_common.toFixed(2)}</td>
                                            <td className="py-3 px-4 text-right font-mono text-slate-500">{stats.dfE_common}</td>
                                            <td className="py-3 px-4 text-right font-mono text-slate-500">{stats.MSE_common.toFixed(2)}</td>
                                            <td className="py-3 px-4 text-right">-</td>
                                            <td className="py-3 px-4 text-right">-</td>
                                        </tr>
                                        <tr onClick={() => setActiveEq('interaction')} className={`border-t-2 ${activeEq === 'interaction' ? (darkMode ? 'bg-slate-800/80' : 'bg-slate-200/50') : 'bg-slate-500/5'} ${darkMode ? 'border-slate-700' : 'border-slate-300'}`}>
                                            <td className="py-3 px-4 font-bold text-slate-500">Interaction (Slopes Check)</td>
                                            <td className="py-3 px-4 text-right font-mono text-slate-500">{stats.SSint.toFixed(2)}</td>
                                            <td className="py-3 px-4 text-right font-mono text-slate-500">{stats.dfInt}</td>
                                            <td className="py-3 px-4 text-right font-mono text-slate-500">{stats.MSint.toFixed(2)}</td>
                                            <td className="py-3 px-4 text-right font-mono text-slate-500">{stats.Fint.toFixed(2)}</td>
                                            <td className={`py-3 px-4 text-right font-mono font-bold ${stats.pInt < alpha ? 'text-rose-500' : 'text-slate-500'}`}>
                                                {stats.pInt < 0.001 ? '< .001' : stats.pInt.toFixed(3).replace(/^0/, '')}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                            {stats.pInt < alpha && (
                                <div className="mt-4 p-4 rounded-xl border border-rose-500/40 bg-rose-500/10 flex gap-3 text-rose-500">
                                    <AlertCircle className="shrink-0 mt-0.5" size={18} />
                                    <div className="text-sm font-bold">
                                        Warning: The Group × Covariate interaction is significant (p &lt; {alpha}). This violates the homogeneity of regression slopes assumption. Standard ANCOVA interpreting main effects is generally inappropriate here.
                                    </div>
                                </div>
                            )}

                            <div className={`mt-6 p-4 rounded-xl border-2 flex items-center justify-center min-h-[100px] transition-colors ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                                {activeEq === 'group' && (
                                    <CalculationText
                                        raw="F_{Group} = \frac{MS_{Group}}{MS_{Error}}"
                                        values={`${stats.Fgrp.toFixed(2)} = \frac{${stats.MSgrp.toFixed(2)}}{${stats.MSE_common.toFixed(2)}}`}
                                        showValues={showValues}
                                        mathTerms={MATH_TERMS}
                                        darkMode={darkMode}
                                    />
                                )}
                                {activeEq === 'covariate' && (
                                    <CalculationText
                                        raw="F_{X} = \frac{MS_{X}}{MS_{Error}}"
                                        values={`${stats.Fcov.toFixed(2)} = \frac{${stats.MScov.toFixed(2)}}{${stats.MSE_common.toFixed(2)}}`}
                                        showValues={showValues}
                                        mathTerms={MATH_TERMS}
                                        darkMode={darkMode}
                                    />
                                )}
                                {activeEq === 'interaction' && (
                                    <CalculationText
                                        raw="F_{Group \times X} = \frac{MS_{Group \times X}}{MS_{Error(Separate)}}"
                                        values={`${stats.Fint.toFixed(2)} = \frac{${stats.MSint.toFixed(2)}}{${(stats.SSint > 0 ? stats.MSint / stats.Fint : 0).toFixed(2)}}`}
                                        showValues={showValues}
                                        mathTerms={MATH_TERMS}
                                        darkMode={darkMode}
                                    />
                                )}
                            </div>

                            <div className={`mt-6 rounded-xl border p-4 flex flex-col md:flex-row justify-between items-center gap-4 group transition-colors ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                                <div className={`text-[11px] font-mono break-words leading-relaxed max-w-[85%] ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                    <span className="text-indigo-500 font-bold tracking-widest mr-2 uppercase text-[9px]">Report Line</span>
                                    A one-way ANCOVA was conducted to determine a statistically significant difference between {stats.k} groups on the outcome variable controlling for {covariateName}.
                                    {stats.pInt < alpha ? (
                                        " There was a significant interaction between the covariate and the group, F(" + stats.dfInt + ", " + (stats.nTotal - 2 * stats.k) + ") = " + stats.Fint.toFixed(2) + ", p " + (stats.pInt < 0.001 ? '< .001' : "= " + stats.pInt.toFixed(3).replace(/^0/, '')) + ", indicating that the homogeneity of regression slopes assumption was violated."
                                    ) : (
                                        " There was a " + (stats.pGrp < alpha ? "significant" : "non-significant") + " effect of the group on the outcome after controlling for the covariate, F(" + stats.dfGrp + ", " + stats.dfE_common + ") = " + stats.Fgrp.toFixed(2) + ", p " + (stats.pGrp < 0.001 ? '< .001' : "= " + stats.pGrp.toFixed(3).replace(/^0/, '')) + "."
                                    )}
                                </div>
                                <button
                                    onClick={(e) => {
                                        const btn = e.currentTarget;
                                        const text = btn.previousElementSibling.innerText.replace('REPORT LINE\n', '');
                                        navigator.clipboard.writeText(text);
                                        btn.innerText = "COPIED!";
                                        setTimeout(() => btn.innerText = "COPY APA", 2000);
                                    }}
                                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-[9px] font-black uppercase tracking-widest rounded-lg transition-all shadow-lg active:scale-95 whitespace-nowrap"
                                >
                                    COPY APA
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'PLOT' && stats.ready && (
                        <div className="max-w-4xl mx-auto flex flex-col items-center justify-center p-4">
                            <div className={`w-full p-4 mb-4 rounded-xl border flex flex-wrap gap-4 items-center justify-between transition-colors ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                                <div className="flex gap-4">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="checkbox" checked={showRegressionLines} onChange={e => setShowRegressionLines(e.target.checked)} className="accent-indigo-500" />
                                        <span className={`text-sm font-bold ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Regression Lines</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="checkbox" checked={showRawMeans} onChange={e => setShowRawMeans(e.target.checked)} className="accent-indigo-500" />
                                        <span className={`text-sm font-bold ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Raw Means</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="checkbox" checked={showAdjustedMeans} onChange={e => setShowAdjustedMeans(e.target.checked)} className="accent-indigo-500" />
                                        <span className={`text-sm font-bold ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Adjusted Means</span>
                                    </label>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="flex flex-col">
                                        <span className={`text-[10px] font-bold uppercase ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Adjust Covariate To</span>
                                        <span className="text-xs font-black text-indigo-500 font-mono">X = {stats.adjustX.toFixed(2)}</span>
                                    </div>
                                    <input
                                        type="range"
                                        min={stats.pMinX}
                                        max={stats.pMaxX}
                                        step={(stats.pMaxX - stats.pMinX) / 100}
                                        value={stats.adjustX}
                                        onChange={e => setCovariateAdjust(parseFloat(e.target.value))}
                                        className="w-48 accent-indigo-500"
                                    />
                                    <button
                                        onClick={() => setCovariateAdjust(stats.grandMeanX)}
                                        className="text-[10px] uppercase font-bold tracking-widest text-slate-500 hover:text-indigo-500"
                                    >
                                        Grand Mean
                                    </button>
                                </div>
                            </div>

                            <div className={`relative w-full aspect-[2/1] bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm ${darkMode ? 'bg-slate-900 border-slate-800' : ''}`}>
                                <svg viewBox="-40 -20 860 440" className="w-full h-full">
                                    {/* Grid Lines */}
                                    {[0, 0.25, 0.5, 0.75, 1].map(ratio => {
                                        const yPos = ratio * 400;
                                        const yVal = stats.pMaxY - ratio * (stats.pMaxY - stats.pMinY);
                                        return (
                                            <g key={`y-${ratio}`}>
                                                <line x1="0" y1={yPos} x2="800" y2={yPos} stroke={darkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"} />
                                                <text x="-10" y={yPos + 4} textAnchor="end" className={`text-[10px] font-mono ${darkMode ? 'fill-slate-500' : 'fill-slate-400'}`}>{yVal.toFixed(1)}</text>
                                            </g>
                                        );
                                    })}
                                    {[0, 0.25, 0.5, 0.75, 1].map(ratio => {
                                        const xPos = ratio * 800;
                                        const xVal = stats.pMinX + ratio * (stats.pMaxX - stats.pMinX);
                                        return (
                                            <g key={`x-${ratio}`}>
                                                <line x1={xPos} y1="0" x2={xPos} y2="400" stroke={darkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"} />
                                                <text x={xPos} y="415" textAnchor="middle" className={`text-[10px] font-mono ${darkMode ? 'fill-slate-500' : 'fill-slate-400'}`}>{xVal.toFixed(1)}</text>
                                            </g>
                                        );
                                    })}

                                    {/* Axes */}
                                    <line x1="0" y1="400" x2="800" y2="400" stroke={darkMode ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)"} strokeWidth="2" />
                                    <line x1="0" y1="0" x2="0" y2="400" stroke={darkMode ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)"} strokeWidth="2" />

                                    {/* Axis Labels */}
                                    <text x="400" y="435" textAnchor="middle" className={`text-xs uppercase font-bold tracking-widest ${darkMode ? 'fill-emerald-400' : 'fill-emerald-600'}`}>Covariate: {covariateName}</text>
                                    <text transform="translate(-30, 200) rotate(-90)" textAnchor="middle" className={`text-xs uppercase font-bold tracking-widest ${darkMode ? 'fill-indigo-400' : 'fill-indigo-600'}`}>Outcome Variable</text>

                                    {/* Adjustment Line */}
                                    {showAdjustedMeans && (
                                        <g>
                                            <line x1={stats.scaleX(stats.adjustX)} y1="0" x2={stats.scaleX(stats.adjustX)} y2="400" stroke="#8b5cf6" strokeWidth="2" strokeDasharray="5,5" opacity="0.5" />
                                            <text x={stats.scaleX(stats.adjustX)} y="-5" textAnchor="middle" className="text-[10px] font-bold fill-purple-500 uppercase tracking-widest">Adjust X = {stats.adjustX.toFixed(2)}</text>
                                        </g>
                                    )}

                                    {/* Grand Mean Line (optional info) */}
                                    {stats.adjustX !== stats.grandMeanX && (
                                        <line x1={stats.scaleX(stats.grandMeanX)} y1="0" x2={stats.scaleX(stats.grandMeanX)} y2="400" stroke={darkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"} strokeWidth="1" strokeDasharray="3,3" />
                                    )}

                                    {/* Plot Groups */}
                                    {stats.validGroups.map(g => {
                                        const adj = stats.adjustedMeans.find(a => a.id === g.id);
                                        const lineY1 = stats.scaleY(g.my - stats.b_w * (g.mx - stats.pMinX));
                                        const lineY2 = stats.scaleY(g.my - stats.b_w * (g.mx - stats.pMaxX));

                                        return (
                                            <g key={g.id}>
                                                {/* Scatter Points */}
                                                {g.xVals.map((vx, i) => (
                                                    <circle
                                                        key={i}
                                                        cx={stats.scaleX(vx)}
                                                        cy={stats.scaleY(g.yVals[i])}
                                                        r="4"
                                                        fill={g.color}
                                                        opacity="0.6"
                                                        className="transition-all hover:r-6 cursor-pointer"
                                                    >
                                                        <title>{g.label}: X={vx.toFixed(1)}, Y={g.yVals[i].toFixed(1)}</title>
                                                    </circle>
                                                ))}

                                                {/* Common Slope Line */}
                                                {showRegressionLines && (
                                                    <line
                                                        x1={stats.scaleX(stats.pMinX)}
                                                        y1={lineY1}
                                                        x2={stats.scaleX(stats.pMaxX)}
                                                        y2={lineY2}
                                                        stroke={g.color}
                                                        strokeWidth="3"
                                                        opacity="0.8"
                                                    />
                                                )}

                                                {/* Raw Mean */}
                                                {showRawMeans && (
                                                    <g transform={`translate(${stats.scaleX(g.mx)}, ${stats.scaleY(g.my)})`}>
                                                        <circle r="4" fill="white" stroke={g.color} strokeWidth="2" />
                                                        <text x="-8" y="3" textAnchor="end" className="text-[10px] font-bold" fill={g.color}>Raw M</text>
                                                    </g>
                                                )}

                                                {/* Adjusted Mean (slides along the regression line) */}
                                                {showAdjustedMeans && (
                                                    <g transform={`translate(${stats.scaleX(stats.adjustX)}, ${stats.scaleY(adj.adjM)})`} className="transition-transform duration-300">
                                                        <circle r="6" fill={g.color} stroke="white" strokeWidth="2" className="drop-shadow-md" />
                                                        <rect x="10" y="-8" width="60" height="16" rx="4" fill={darkMode ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.9)'} stroke={g.color} strokeWidth="1" />
                                                        <text x="40" y="3" textAnchor="middle" className="text-[9px] font-black" fill={g.color}>Adj: {adj.adjM.toFixed(1)}</text>
                                                    </g>
                                                )}

                                                {/* Arrow from Raw to Adjusted Mean */}
                                                {showRawMeans && showAdjustedMeans && stats.adjustX !== g.mx && (
                                                    <line
                                                        x1={stats.scaleX(g.mx)}
                                                        y1={stats.scaleY(g.my)}
                                                        x2={stats.scaleX(stats.adjustX)}
                                                        y2={stats.scaleY(adj.adjM)}
                                                        stroke={g.color}
                                                        strokeWidth="1.5"
                                                        strokeDasharray="3,3"
                                                        opacity="0.5"
                                                        markerEnd="url(#arrowhead)"
                                                    />
                                                )}
                                            </g>
                                        );
                                    })}

                                    <defs>
                                        <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                                            <polygon points="0 0, 10 3.5, 0 7" fill={darkMode ? "#94a3b8" : "#64748b"} />
                                        </marker>
                                    </defs>
                                </svg>
                            </div>
                        </div>
                    )}

                    {activeTab === 'EXPLORER' && stats.ready && (
                        <div className="max-w-4xl mx-auto p-4 sm:p-8">
                            <h3 className={`text-2xl font-black uppercase tracking-widest mb-6 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Simple Slopes & Adjustments</h3>

                            <div className="grid md:grid-cols-2 gap-6 mb-8">
                                <div className={`p-6 rounded-2xl border-2 shadow-sm ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                                    <h4 className={`text-sm font-bold uppercase tracking-widest mb-4 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>Adjusted Means at X = {stats.adjustX.toFixed(2)}</h4>
                                    <div className="space-y-3">
                                        {stats.adjustedMeans.map(adj => (
                                            <div key={adj.id} className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: adj.color }}></div>
                                                    <span className={`text-[11px] font-black uppercase ${darkMode ? 'text-white' : 'text-slate-800'}`}>{adj.label}</span>
                                                </div>
                                                <span className="text-sm font-black font-mono" style={{ color: adj.color }}>{adj.adjM.toFixed(2)}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className={`mt-4 pt-4 border-t text-[10px] uppercase font-bold ${darkMode ? 'border-slate-800 text-slate-500' : 'border-slate-100 text-slate-400'}`}>
                                        Common Slope (b_w) = {stats.b_w.toFixed(2)}
                                    </div>
                                </div>

                                <div className={`p-6 rounded-2xl border-2 shadow-sm ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                                    <h4 className={`text-sm font-bold uppercase tracking-widest mb-4 flex items-center justify-between ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
                                        Separate Slopes <span className={`text-[9px] px-2 py-0.5 rounded border ${stats.pInt < alpha ? 'border-rose-500 text-rose-500' : 'border-emerald-500 text-emerald-500'}`}>{stats.pInt < alpha ? 'Sig Diff' : 'Parallel'}</span>
                                    </h4>
                                    <div className="space-y-3">
                                        {stats.adjustedMeans.map(adj => (
                                            <div key={adj.id} className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: adj.color }}></div>
                                                    <span className={`text-[11px] font-black uppercase ${darkMode ? 'text-white' : 'text-slate-800'}`}>{adj.label}</span>
                                                </div>
                                                <span className="text-sm font-black font-mono" style={{ color: adj.color }}>b = {adj.b_j.toFixed(2)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'F-DIST' && (
                        <div className="max-w-4xl mx-auto flex flex-col gap-6">
                            <div className="flex flex-col gap-4">
                                <div className="flex justify-between items-center px-2">
                                    <div className="flex items-center gap-6">
                                        <h6 className={`text-[11px] font-black uppercase tracking-widest flex items-center gap-2 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
                                            <Sigma size={14} className={darkMode ? 'text-indigo-400 animate-pulse' : 'text-indigo-600'} />
                                            ANCOVA {ancovaMode.toUpperCase()}
                                        </h6>
                                        <div className="flex p-1 rounded-2xl bg-slate-900 border border-slate-800">
                                            {['data', 'calc'].map(m => (
                                                <button key={m} onClick={() => setAncovaMode(m)} className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${ancovaMode === m ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}>
                                                    {m === 'data' ? 'Compute' : 'Explore'}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="flex bg-slate-800/50 p-1.5 rounded-xl border border-slate-700">
                                            {[0.1, 0.05, 0.01].map(a => (
                                                <button key={a} onClick={() => setAlpha(a)} className={`px-3 py-1 rounded-lg text-[10px] font-black transition-all ${alpha === a ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500'}`}>{a}</button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {ancovaMode === 'calc' && (
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-8 bg-indigo-500/5 border-2 border-indigo-500/10 rounded-[2.5rem]">
                                        {[
                                            { label: 'df1', val: calcDf1, min: 1, max: 50, setter: setCalcDf1 },
                                            { label: 'df2', val: calcDf2, min: 1, max: 250, setter: setCalcDf2 },
                                            { label: 'F', val: calcF, min: 0, max: 25, step: 0.1, setter: setCalcF }
                                        ].map(s => (
                                            <div key={s.label} className="p-5 bg-slate-900/40 rounded-2xl border border-slate-800">
                                                <div className="flex justify-between text-[9px] font-black text-slate-500 uppercase mb-2">
                                                    <span>{s.label}</span>
                                                    <span className="text-indigo-400">{s.val}</span>
                                                </div>
                                                <input type="range" min={s.min} max={s.max} step={s.step} value={s.val} onChange={e => s.setter(parseFloat(e.target.value))} className="w-full accent-indigo-500" />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className={`w-full h-[500px] overflow-hidden border-2 rounded-3xl relative transition-all ${darkMode ? 'bg-slate-950/50 border-slate-800' : 'bg-white border-slate-200'}`}>
                                {(!stats.ready && ancovaMode === 'data') ? (
                                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 gap-4">
                                        <div className="w-12 h-12 rounded-full border-4 border-slate-800 border-t-indigo-500 animate-spin" />
                                        <p className="text-xs font-black uppercase tracking-widest">Awaiting Data...</p>
                                    </div>
                                ) : (
                                    <FSamplingDist
                                        mode={ancovaMode}
                                        fCrit={ancovaMode === 'data' ? fPPF(1 - alpha, stats.dfB || 2, stats.dfW || 20) : fPPF(1 - alpha, calcDf1, calcDf2)}
                                        fVal={ancovaMode === 'data' ? stats.F || 0 : calcF}
                                        df1={ancovaMode === 'data' ? stats.dfB || 2 : calcDf1}
                                        df2={ancovaMode === 'data' ? stats.dfW || 20 : calcDf2}
                                        setFVal={ancovaMode === 'data' ? setManualF : setCalcF}
                                        darkMode={darkMode}
                                        zoomDist={zoomDist}
                                        setZoomDist={setZoomDist}
                                    />
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
