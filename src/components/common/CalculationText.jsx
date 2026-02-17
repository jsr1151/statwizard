import React from 'react';
import MathTerm from './MathTerm';

const CalculationText = ({ text, onInfo, onHover, darkMode, showValues, stats }) => {
    if (!text || typeof text !== 'string') return null;

    const statsKeyMap = {
        // Paired
        sd_diff: 'sd', n_pairs: 'n', SE_paired: 'se', dz: 'dz', dBar: 'dBar', r_corr: 'r',
        // ANOVA
        SS_between: 'ssB', SS_within: 'ssW', SS_total: 'ssT',
        df_between: 'dfB', df_within: 'dfW',
        MS_between: 'msB', MS_within: 'msW',
        F: 'fVal', eta2: 'eta2',
        k: 'k', N: 'N'
    };

    const getV = (key) => stats ? stats[statsKeyMap[key] || key] : undefined;

    const parts = text.split(/(\{.*?\}|\$.*?\$)/);
    return (
        <span className={`leading-relaxed ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
            {parts.map((part, i) => {
                if (part.startsWith('{') && part.endsWith('}')) {
                    const term = part.slice(1, -1);
                    return <MathTerm key={i} term={term} value={getV(term)} showValue={showValues} onInfo={onInfo} onHover={onHover} darkMode={darkMode} />;
                }
                if (part.startsWith('$') && part.endsWith('$')) {
                    const term = part.slice(1, -1);
                    return <MathTerm key={i} term={term} value={getV(term)} showValue={showValues} onInfo={onInfo} onHover={onHover} darkMode={darkMode} />;
                }
                return <span key={i}>{part}</span>;
            })}
        </span>
    );
};

export default CalculationText;
