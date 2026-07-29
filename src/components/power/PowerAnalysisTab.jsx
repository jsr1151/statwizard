import React, { useState } from 'react';
import PowerAnalysisPanel from './PowerAnalysisPanel';
import PowerVisualizerFrame from './PowerVisualizerFrame';

const PowerAnalysisTab = ({ testConfig, currentStats, darkMode, initialMode, onModeChange }) => {
    const [result, setResult] = useState(null);

    return (
        <div className="grid lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-4">
                <PowerAnalysisPanel
                    testConfig={testConfig}
                    currentStats={currentStats}
                    darkMode={darkMode}
                    initialMode={initialMode}
                    onResultChange={setResult}
                    onModeChange={onModeChange}
                />
            </div>
            <div className="lg:col-span-8">
                <PowerVisualizerFrame
                    result={result}
                    testConfig={testConfig}
                    darkMode={darkMode}
                />
            </div>
        </div>
    );
};

export default PowerAnalysisTab;
