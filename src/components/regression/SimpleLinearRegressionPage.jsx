import React from 'react';
import RegressionCalculatorSection from './RegressionCalculatorSection';
import RegressionEffectSizeSection from './RegressionEffectSizeSection';
import RegressionLessonSection from './RegressionLessonSection';
import RegressionPowerSection from './RegressionPowerSection';

const SimpleLinearRegressionPage = ({
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
            <RegressionPowerSection
                currentStats={currentStats}
                darkMode={darkMode}
                initialPowerMode={initialPowerMode}
                onPowerModeChange={onPowerModeChange}
                testConfig={testConfig}
            />
        );
    }

    if (section === 'effect_size') {
        return <RegressionEffectSizeSection currentStats={currentStats} darkMode={darkMode} />;
    }

    if (section === 'calculator') {
        return (
            <RegressionCalculatorSection
                assumptions={assumptions}
                darkMode={darkMode}
                onStatsChange={onStatsChange}
            />
        );
    }

    return <RegressionLessonSection darkMode={darkMode} />;
};

export default SimpleLinearRegressionPage;
