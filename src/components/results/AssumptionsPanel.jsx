import { CheckCircle } from 'lucide-react';
import AssumptionItem from '../formula/AssumptionItem';

export default function AssumptionsPanel({ assumptions, darkMode }) {
    if (!assumptions?.length) return null;

    return (
        <div className={`border rounded-xl p-6 transition-colors ${darkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200'}`}>
            <h3 className={`text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                <CheckCircle className="w-4 h-4" /> Assumptions to Check
            </h3>
            <div className="space-y-3">
                {assumptions.map((assumption, index) => (
                    <AssumptionItem key={index} assumption={assumption} darkMode={darkMode} />
                ))}
            </div>
        </div>
    );
}
