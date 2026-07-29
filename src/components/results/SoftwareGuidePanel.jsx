import { CheckCircle, Grid, MousePointer2, Terminal } from 'lucide-react';
import TabButton from '../common/TabButton';

const SOFTWARE_TABS = [
    { id: 'spss', label: 'SPSS', icon: MousePointer2 },
    { id: 'jasp', label: 'JASP', icon: CheckCircle },
    { id: 'excel', label: 'Excel', icon: Grid },
    { id: 'google_sheets', label: 'G-Sheets', icon: Grid },
    { id: 'r', label: 'R Code', icon: Terminal },
];

const getGuideText = (software, activeTab) => {
    if (activeTab === 'google_sheets') {
        return software?.google_sheets || software?.excel;
    }

    return software?.[activeTab];
};

export default function SoftwareGuidePanel({ activeTab, darkMode, onTabChange, software }) {
    return (
        <div className={`border-t pt-8 ${darkMode ? 'border-slate-800' : 'border-slate-100'}`}>
            <h3 className={`text-sm font-bold uppercase tracking-wider mb-4 ${darkMode ? 'text-slate-600' : 'text-slate-400'}`}>
                Part 2: Run the Test
            </h3>
            <div className={`rounded-xl border overflow-hidden transition-colors ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <div className={`flex border-b px-4 pt-4 gap-2 overflow-x-auto no-scrollbar transition-colors ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                    {SOFTWARE_TABS.map(({ id, label, icon }) => (
                        <TabButton
                            key={id}
                            label={label}
                            icon={icon}
                            active={activeTab === id}
                            onClick={() => onTabChange(id)}
                            darkMode={darkMode}
                        />
                    ))}
                </div>
                <div className={`p-6 min-h-[100px] transition-colors ${darkMode ? 'bg-slate-900 shadow-inner' : 'bg-white'}`}>
                    <p className={`whitespace-pre-wrap leading-relaxed font-medium ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                        {getGuideText(software, activeTab)}
                    </p>
                </div>
            </div>
        </div>
    );
}
