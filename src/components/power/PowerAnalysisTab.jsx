import React, { useContext, useState } from 'react';
import { PowerNavigationContext } from '../../routing/powerNavigationContext.js';
import PowerAnalysisPanel from './PowerAnalysisPanel';
import PowerVisualizerFrame from './PowerVisualizerFrame';

const PowerAnalysisTab = ({ testConfig, currentStats, darkMode, initialMode, onModeChange }) => {
    const [result, setResult] = useState(null);
    const route = useContext(PowerNavigationContext);
    const navigation = route?.stepId === testConfig?.stepId ? route : null;

    return (
        <div className="grid lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-4">
                <PowerAnalysisPanel
                    testConfig={testConfig}
                    currentStats={currentStats}
                    darkMode={darkMode}
                    initialMode={navigation?.mode ?? initialMode}
                    onResultChange={setResult}
                    onModeChange={onModeChange ?? navigation?.onModeChange}
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
