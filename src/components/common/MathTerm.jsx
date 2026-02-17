import React from 'react';
import { MATH_TERMS } from '../../data/mathTerms';

const MathTerm = ({ term, onInfo, onHover, darkMode, value, showValue }) => {
    const actualTerm = term.replace(/[\{\}]/g, '');
    const isCalculable = MATH_TERMS[actualTerm];

    // Standardize terms for display with proper subscripts
    const getCleanTerm = (t) => {
        let clean = t.replace(/_\{(.*?)\}/g, "<sub>$1</sub>");

        return clean
            .replace(/\\alpha/g, "α")
            .replace(/\\sigma/g, "σ")
            .replace(/\\mu_0/g, "μ₀")
            .replace(/\\mu/g, "μ")
            .replace(/H_0/g, "H₀")
            .replace(/H_1/g, "H₁")
            .replace(/xBar/g, "x̄")
            .replace(/x̄1/g, "x̄₁")
            .replace(/x̄2/g, "x̄₂")
            .replace(/x̄_grand/g, "x̄<sub>grand</sub>")
            .replace(/x̄j/g, "x̄<sub>j</sub>")
            .replace(/nj/g, "n<sub>j</sub>")
            .replace(/sj/g, "s<sub>j</sub>")
            .replace(/xij/g, "x<sub>ij</sub>")
            .replace(/k/g, "k")
            .replace(/N/g, "N")
            .replace(/mu/g, "μ")
            .replace(/sigma/g, "σ")
            .replace(/alpha/g, "α")
            .replace(/delta/g, "Δ")
            .replace(/SE_delta/g, "SE<sub>Δ</sub>")
            .replace(/SE_paired/g, "SE<sub>d̄</sub>")
            .replace(/sd_diff/g, "s<sub>d</sub>")
            .replace(/dBar/g, "d̄")
            .replace(/dz/g, "d<sub>z</sub>")
            .replace(/MS_between/g, "MS<sub>between</sub>")
            .replace(/MS_within/g, "MS<sub>within</sub>")
            .replace(/SS_between/g, "SS<sub>between</sub>")
            .replace(/SS_within/g, "SS<sub>within</sub>")
            .replace(/SS_total/g, "SS<sub>total</sub>")
            .replace(/df_between/g, "df<sub>between</sub>")
            .replace(/df_within/g, "df<sub>within</sub>")
            .replace(/eta2/g, "η²")
            .replace(/s2/g, "s²")
            .replace(/sp2/g, "sₚ²")
            .replace(/n1/g, "n₁")
            .replace(/n2/g, "n₂");
    };

    const cleanTerm = getCleanTerm(term.replace(/[\{\}]/g, ''));
    const isNumber = typeof value === 'number';
    const valDisplay = isNumber ? value.toFixed(2) : value;
    const displayValue = (showValue && value !== undefined) ? valDisplay : cleanTerm;

    const tooltip = isCalculable ? `${MATH_TERMS[actualTerm].title}${showValue && value !== undefined ? `: ${valDisplay}` : ''}` : '';

    return (
        <span
            onClick={(e) => { e.stopPropagation(); if (isCalculable) onInfo(actualTerm); }}
            onMouseEnter={() => onHover && onHover(actualTerm)}
            onMouseLeave={() => onHover && onHover(null)}
            title={tooltip}
            className={`inline-block px-1 mx-0.5 rounded transition-all sym-link ${isCalculable
                ? (darkMode ? 'cursor-pointer hover:bg-indigo-500/20 text-indigo-400 font-bold' : 'cursor-pointer hover:bg-indigo-100 text-indigo-900 font-bold')
                : (darkMode ? (showValue ? 'text-indigo-400 font-bold' : 'text-slate-400 font-serif') : (showValue ? 'text-indigo-600 font-bold' : 'text-slate-800 font-serif'))}`}
            dangerouslySetInnerHTML={{ __html: displayValue }}
        />
    );
};

export default MathTerm;
