import React, { useEffect, useMemo, useState } from 'react';
import useTutor from '../../hooks/useTutor';
import {
    buildIndependentTTestReport,
    calculateIndependentTTest,
    summarizeIndependentSample,
} from '../../stats/independentTTest';
import IndependentTTestChart from './IndependentTTestChart';
import IndependentTTestControls from './IndependentTTestControls';

const INITIAL_GROUP_1 = { xBar: 12, s: 2.5, n: 30, raw: '' };
const INITIAL_GROUP_2 = { xBar: 10, s: 2.5, n: 30, raw: '' };

const IndependentTTestVisual = ({ darkMode, onTutorUpdate, onStatsUpdate }) => {
    const [group1, setGroup1] = useState(INITIAL_GROUP_1);
    const [group2, setGroup2] = useState(INITIAL_GROUP_2);
    const [testType, setTestType] = useState('student');
    const [inputMode, setInputMode] = useState('summary');
    const [alpha, setAlpha] = useState(0.05);
    const [tails, setTails] = useState(2);
    const [direction, setDirection] = useState('greater');
    const [ciType, setCiType] = useState('two-sided');
    const [showCI, setShowCI] = useState(false);
    const result = useMemo(() => calculateIndependentTTest({
        group1,
        group2,
        testType,
        alpha,
        tails,
        direction,
        ciType,
    }), [group1, group2, testType, alpha, tails, direction, ciType]);
    const reportLine = useMemo(() => buildIndependentTTestReport({ result, showCI }), [result, showCI]);

    const updateGroup = (setter, field, rawValue) => {
        const parsed = field === 'n' ? Number.parseInt(rawValue, 10) : Number(rawValue);
        if (!Number.isFinite(parsed)) return;
        const value = field === 'n' ? Math.max(2, parsed) : field === 's' ? Math.max(0, parsed) : parsed;
        setter((previous) => ({ ...previous, [field]: value }));
    };
    const updateRawGroup = (groupNumber, raw) => {
        const summary = summarizeIndependentSample(raw);
        const setter = groupNumber === 1 ? setGroup1 : setGroup2;
        setter((previous) => summary.ok
            ? { ...previous, xBar: summary.xBar, s: summary.s, n: summary.n, raw }
            : { ...previous, raw });
    };
    const swapGroups = () => {
        setGroup1(group2);
        setGroup2(group1);
    };

    useEffect(() => {
        if (!onStatsUpdate || !result.ok) return;
        onStatsUpdate({
            delta: result.delta,
            t: result.t,
            p: result.p,
            df: result.df,
            se: result.se,
            isSignificant: result.isSignificant,
            crit: result.criticalValue,
            d: result.cohenD,
            g: result.hedgesG,
            n1: group1.n,
            n2: group2.n,
            x1: group1.xBar,
            x2: group2.xBar,
            s1: group1.s,
            s2: group2.s,
            testType,
            pooledVar: result.pooledVariance,
        });
    }, [group1, group2, onStatsUpdate, result, testType]);

    const tutorState = useMemo(() => ({
        n1: group1.n,
        n2: group2.n,
        x1: group1.xBar,
        x2: group2.xBar,
        s1: group1.s,
        s2: group2.s,
        testType,
        delta: result.delta,
        t: result.t,
        p: result.p,
        df: result.df,
        alpha,
        tails,
        isSignificant: result.isSignificant,
        ciLower: result.ciLower,
        ciUpper: result.ciUpper,
        showCI,
    }), [group1, group2, testType, result, alpha, tails, showCI]);
    const tutor = useTutor('t_test_indep', tutorState);
    useEffect(() => {
        if (onTutorUpdate && tutor.activeScript) onTutorUpdate(tutor.activeScript);
    }, [onTutorUpdate, tutor.activeScript]);

    if (!result.ok) return <p className="p-6 text-sm text-red-500">{result.errors.join(' ')}</p>;

    return (
        <div className="w-full flex">
            <div className="flex-1 flex flex-col items-center">
                <IndependentTTestChart darkMode={darkMode} group1={group1} group2={group2} result={result} onGroup1MeanChange={(xBar) => setGroup1((previous) => ({ ...previous, xBar: Number(xBar.toFixed(2)) }))} />
                <IndependentTTestControls
                    alpha={alpha}
                    ciType={ciType}
                    darkMode={darkMode}
                    direction={direction}
                    group1={group1}
                    group2={group2}
                    inputMode={inputMode}
                    onAlphaChange={setAlpha}
                    onCiTypeChange={setCiType}
                    onDirectionChange={setDirection}
                    onGroup1Change={(field, value) => updateGroup(setGroup1, field, value)}
                    onGroup2Change={(field, value) => updateGroup(setGroup2, field, value)}
                    onInputModeChange={setInputMode}
                    onRawChange={updateRawGroup}
                    onShowCIChange={setShowCI}
                    onSwap={swapGroups}
                    onTailsChange={setTails}
                    onTestTypeChange={setTestType}
                    reportLine={reportLine}
                    result={result}
                    showCI={showCI}
                    tails={tails}
                    testType={testType}
                />
            </div>
        </div>
    );
};

export default IndependentTTestVisual;
