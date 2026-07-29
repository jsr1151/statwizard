import React from 'react';
import PearsonCalculatorSection from './PearsonCalculatorSection';
import PearsonEffectSizeSection from './PearsonEffectSizeSection';
import PearsonLessonSection from './PearsonLessonSection';
import PearsonPowerSection from './PearsonPowerSection';

const PearsonCorrelationPage = ({
    section,
    darkMode,
    currentStats,
    onStatsChange,
    assumptions = [],
    testConfig,
    initialPowerMode,
    onPowerModeChange,
}) => {
    if (section === 'power') {
        return (
            <PearsonPowerSection
                currentStats={currentStats}
                darkMode={darkMode}
                initialPowerMode={initialPowerMode}
                onPowerModeChange={onPowerModeChange}
                testConfig={testConfig}
            />
        );
    }

    if (section === 'effect_size') {
        return <PearsonEffectSizeSection currentStats={currentStats} darkMode={darkMode} />;
    }

    if (section === 'calculator') {
        return (
            <PearsonCalculatorSection
                assumptions={assumptions}
                darkMode={darkMode}
                onStatsChange={onStatsChange}
            />
        );
    }

    return <PearsonLessonSection darkMode={darkMode} />;
};

export default PearsonCorrelationPage;
