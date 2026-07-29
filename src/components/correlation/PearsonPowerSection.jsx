import React from 'react';
import { Target } from 'lucide-react';
import AnalysisCard from '../analysis/AnalysisCard';
import PowerAnalysisTab from '../power/PowerAnalysisTab';

const PearsonPowerSection = ({ currentStats, darkMode, initialPowerMode, onPowerModeChange, testConfig }) => (
    <div className="space-y-8">
        <AnalysisCard darkMode={darkMode}>
            <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl ${darkMode ? 'bg-indigo-500/10 text-indigo-300' : 'bg-indigo-50 text-indigo-700'}`}><Target size={20} /></div>
                <div>
                    <h3 className={`text-xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>Pearson correlation power planning</h3>
                    <p className={`mt-2 text-sm max-w-3xl ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Plan with the expected population correlation under H1, null correlation ρ₀, alpha, tails, and sample size. These planning inputs remain separate from observed calculator data.</p>
                </div>
            </div>
        </AnalysisCard>
        <PowerAnalysisTab testConfig={testConfig} currentStats={currentStats} darkMode={darkMode} initialMode={initialPowerMode} onModeChange={onPowerModeChange} />
    </div>
);

export default PearsonPowerSection;
