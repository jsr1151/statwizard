import React from 'react';
import { Target } from 'lucide-react';
import AnalysisCard from '../analysis/AnalysisCard';
import PowerAnalysisTab from '../power/PowerAnalysisTab';

const RegressionPowerSection = ({ currentStats, darkMode, initialPowerMode, onPowerModeChange, testConfig }) => (
    <div className="space-y-8">
        <AnalysisCard darkMode={darkMode}>
            <div className="flex items-start gap-4"><div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400"><Target size={20} /></div><div><h3 className={`text-xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>Simple linear regression power planning</h3><p className="mt-2 text-sm max-w-3xl text-slate-500">For one predictor, testing the slope and testing model R² are equivalent. The shared F-style planning surface uses Cohen’s f².</p></div></div>
        </AnalysisCard>
        <PowerAnalysisTab testConfig={testConfig} currentStats={currentStats} darkMode={darkMode} initialMode={initialPowerMode} onModeChange={onPowerModeChange} />
    </div>
);

export default RegressionPowerSection;
