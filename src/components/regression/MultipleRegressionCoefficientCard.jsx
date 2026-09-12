import { TrendingUp } from 'lucide-react';
import Card from '../analysis/AnalysisCard.jsx';
import { formatStatistic as formatStat, formatPValue } from '../../utils/statFormatters.js';
import RegressionTableCell from './MultipleRegressionTableCell.jsx';

export default function MultipleRegressionCoefficientCard({
    darkMode, confidenceLevel, calculatorStats,
}) {
    return (
        <Card darkMode={darkMode}>
            <div className="flex items-center gap-3 mb-4">
                <TrendingUp size={18} className={darkMode ? 'text-emerald-300' : 'text-emerald-700'} />
                <h3 className={`text-lg font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                    Coefficient summary
                </h3>
            </div>

            <div role="region" aria-label="Model coefficient table" tabIndex={0} className="overflow-x-auto focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500">
                <table className="w-full min-w-[760px] text-sm">
                    <thead>
                        <tr className={darkMode ? 'text-slate-500' : 'text-slate-500'}>
                            <th className="text-left pb-3 font-black uppercase tracking-widest text-[10px]">Term</th>
                            <th className="text-left pb-3 font-black uppercase tracking-widest text-[10px]">Estimate</th>
                            <th className="text-left pb-3 font-black uppercase tracking-widest text-[10px]">SE</th>
                            <th className="text-left pb-3 font-black uppercase tracking-widest text-[10px]">t</th>
                            <th className="text-left pb-3 font-black uppercase tracking-widest text-[10px]">p</th>
                            <th className="text-left pb-3 font-black uppercase tracking-widest text-[10px]">Std. Beta</th>
                            <th className="text-left pb-3 font-black uppercase tracking-widest text-[10px]">VIF</th>
                            <th className="text-left pb-3 font-black uppercase tracking-widest text-[10px]">{Math.round(confidenceLevel * 100)}% CI</th>
                        </tr>
                    </thead>
                    <tbody>
                        {calculatorStats.coefficients.map((coefficient) => (
                            <tr key={coefficient.id} className={`border-t ${darkMode ? 'border-slate-800 text-slate-200' : 'border-slate-200 text-slate-700'}`}>
                                <RegressionTableCell darkMode={darkMode} tooltipKey="term" className="font-bold">{coefficient.label}</RegressionTableCell>
                                <RegressionTableCell darkMode={darkMode} tooltipKey="coefficientEstimate">{formatStat(coefficient.estimate, 3)}</RegressionTableCell>
                                <RegressionTableCell darkMode={darkMode} tooltipKey="standardError">{formatStat(coefficient.standardError, 3)}</RegressionTableCell>
                                <RegressionTableCell darkMode={darkMode} tooltipKey="tStatistic">{formatStat(coefficient.tStatistic, 3)}</RegressionTableCell>
                                <RegressionTableCell darkMode={darkMode} tooltipKey="pValue">p {formatPValue(coefficient.pValue)}</RegressionTableCell>
                                <RegressionTableCell darkMode={darkMode} tooltipKey="standardizedBeta">{coefficient.standardizedBeta == null ? '--' : formatStat(coefficient.standardizedBeta, 3)}</RegressionTableCell>
                                <RegressionTableCell darkMode={darkMode} tooltipKey="vif">{coefficient.vif == null ? '--' : formatStat(coefficient.vif, 2)}</RegressionTableCell>
                                <RegressionTableCell darkMode={darkMode} tooltipKey="confidenceInterval">[{formatStat(coefficient.confidenceInterval.lower, 3)}, {formatStat(coefficient.confidenceInterval.upper, 3)}]</RegressionTableCell>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Card>
    );
}
