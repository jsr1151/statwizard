import React from 'react';
import { CheckCircle, Info } from 'lucide-react';
import AssumptionItem from '../formula/AssumptionItem.jsx';

const Card = ({ darkMode, children, className = '' }) => (
    <div className={`rounded-2xl border p-6 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} ${className}`}>
        {children}
    </div>
);

const AnalysisAssumptionsSection = ({
    darkMode,
    title = 'Assumptions and diagnostics',
    description = 'Use this section to review the main assumptions, what they mean, how to check them, and what to do if they fail.',
    assumptions = [],
    summaryItems = [],
}) => (
    <div className="space-y-8">
        <Card darkMode={darkMode}>
            <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl ${darkMode ? 'bg-emerald-500/10 text-emerald-300' : 'bg-emerald-50 text-emerald-700'}`}>
                    <CheckCircle size={20} />
                </div>
                <div>
                    <h3 className={`text-xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>{title}</h3>
                    <p className={`mt-2 text-sm max-w-3xl ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>{description}</p>
                </div>
            </div>
        </Card>

        {!!summaryItems.length && (
            <div className="grid gap-4 md:grid-cols-3">
                {summaryItems.map((item) => (
                    <Card key={item.label} darkMode={darkMode} className={item.tone === 'warning'
                        ? (darkMode ? 'bg-amber-500/10 border-amber-500/20' : 'bg-amber-50 border-amber-200')
                        : ''
                    }>
                        <div className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                            {item.label}
                        </div>
                        <div className={`mt-2 text-2xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                            {item.value}
                        </div>
                        {item.detail && (
                            <p className={`mt-2 text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                {item.detail}
                            </p>
                        )}
                    </Card>
                ))}
            </div>
        )}

        {!assumptions.length ? (
            <Card darkMode={darkMode}>
                <div className="flex items-center gap-3">
                    <Info size={18} className={darkMode ? 'text-sky-300' : 'text-sky-700'} />
                    <p className={darkMode ? 'text-slate-400' : 'text-slate-600'}>
                        Assumption guidance has not been attached to this page yet.
                    </p>
                </div>
            </Card>
        ) : (
            <div className="space-y-3">
                {assumptions.map((assumption, index) => (
                    <AssumptionItem
                        key={`${assumption.id || assumption.label}-${index}`}
                        assumption={assumption}
                        darkMode={darkMode}
                    />
                ))}
            </div>
        )}
    </div>
);

export default AnalysisAssumptionsSection;
