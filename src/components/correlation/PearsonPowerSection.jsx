import { Target } from "lucide-react";
import PowerAnalysisTab from "../power/PowerAnalysisTab";
import Card from '../analysis/AnalysisCard.jsx';

export default function PearsonPowerSection({
    darkMode, testConfig, currentStats, initialPowerMode,
}) {
    return (
        <div className="space-y-8">
            <Card darkMode={darkMode}>
                <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-xl ${darkMode ? 'bg-indigo-500/10 text-indigo-300' : 'bg-indigo-50 text-indigo-700'}`}>
                        <Target size={20} />
                    </div>
                    <div>
                        <h3 className={`text-xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                            Pearson correlation power planning
                        </h3>
                        <p className={`mt-2 text-sm max-w-3xl ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                            This stays on the shared StatWizard power surface. Power inputs are population planning values: expected ρ under H1, null ρ₀, alpha, tails, and sample size. It stays separate from the observed-data calculator on purpose.
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
