import React from 'react';
import { MATH_TERMS } from '../../data/mathTerms';

const MathTerm = ({ term, onInfo, onHover, darkMode, value, showValue }) => {
    const safeTerm = typeof term === 'string' ? term : '';
    const actualTerm = safeTerm.replace(/[\{\}]/g, '');
    const isCalculable = MATH_TERMS[actualTerm];

    // Standardize terms for display with proper subscripts
    const getCleanTerm = (t) => {
        let clean = t.replace(/_\{(.*?)\}/g, "<sub>$1</sub>");

        return clean
            .replace(/SE_delta/g, "SE<sub>Δ</sub>")
            .replace(/SE_paired/g, "SE<sub>d̄</sub>")
            .replace(/x̄_grand/g, "x̄<sub>grand</sub>")
            .replace(/df_between/g, "df<sub>between</sub>")
            .replace(/df_within/g, "df<sub>within</sub>")
            .replace(/df_error/g, "df<sub>error</sub>")
            .replace(/MS_between/g, "MS<sub>between</sub>")
            .replace(/MS_within/g, "MS<sub>within</sub>")
            .replace(/MS_error/g, "MS<sub>error</sub>")
            .replace(/SS_between/g, "SS<sub>between</sub>")
            .replace(/SS_within/g, "SS<sub>within</sub>")
            .replace(/SS_error/g, "SS<sub>error</sub>")
            .replace(/SS_total/g, "SS<sub>total</sub>")
            .replace(/SS_AxB/g, "SS<sub>A&times;B</sub>")
            .replace(/MS_AxB/g, "MS<sub>A&times;B</sub>")
            .replace(/df_AxB/g, "df<sub>A&times;B</sub>")
            .replace(/F_AxB/g, "F<sub>A&times;B</sub>")
            .replace(/SS_A/g, "SS<sub>A</sub>")
            .replace(/SS_B/g, "SS<sub>B</sub>")
            .replace(/MS_A/g, "MS<sub>A</sub>")
            .replace(/MS_B/g, "MS<sub>B</sub>")
            .replace(/df_A/g, "df<sub>A</sub>")
            .replace(/df_B/g, "df<sub>B</sub>")
            .replace(/F_A/g, "F<sub>A</sub>")
            .replace(/F_B/g, "F<sub>B</sub>")
            .replace(/\\alpha/g, "α")
            .replace(/\\sigma/g, "σ")
            .replace(/\\mu_0/g, "μ₀")
            .replace(/\\mu/g, "μ")
            .replace(/H_0/g, "H₀")
            .replace(/H_1/g, "H₁")
            .replace(/xBar/g, "x̄")
            .replace(/x̄1/g, "x̄₁")
            .replace(/x̄2/g, "x̄₂")
            .replace(/x̄j/g, "x̄<sub>j</sub>")
            .replace(/nj/g, "n<sub>j</sub>")
            .replace(/sj/g, "s<sub>j</sub>")
            .replace(/xij/g, "x<sub>ij</sub>")
            .replace(/mu/g, "μ")
            .replace(/sigma/g, "σ")
            .replace(/alpha/g, "α")
            .replace(/s1_2/g, "s<sub>1</sub><sup>2</sup>")
            .replace(/s2_2/g, "s<sub>2</sub><sup>2</sup>")
            .replace(/s2/g, "s<sup>2</sup>")
            .replace(/sd_diff/g, "s<sub>d</sub>")
            .replace(/dBar/g, "d̄")
            .replace(/dz/g, "d<sub>z</sub>")
            .replace(/eta2_partial/g, "η<sub>p</sub><sup>2</sup>")
            .replace(/eta2/g, "η<sup>2</sup>")
            .replace(/sp2/g, "s<sub>pooled</sub><sup>2</sup>")
            .replace(/sp/g, "s<sub>pooled</sub>")
            .replace(/sj2/g, "s<sub>j</sub><sup>2</sup>")
            .replace(/n1/g, "n₁")
            .replace(/n2/g, "n₂")
            .replace(/delta/g, "Δ");
    };

    const cleanTerm = getCleanTerm(safeTerm.replace(/[\{\}]/g, ''));
    const isNumber = typeof value === 'number';
    const valDisplay = isNumber ? value.toFixed(2) : value;
    const displayValue = (showValue && value !== undefined) ? valDisplay : cleanTerm;

    const tooltip = isCalculable ? `${MATH_TERMS[actualTerm].desc}${showValue && value !== undefined ? ` (Value: ${valDisplay})` : ''}` : '';

    return (
        <span
            onClick={(e) => { e.stopPropagation(); if (isCalculable && typeof onInfo === 'function') onInfo(actualTerm); }}
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
