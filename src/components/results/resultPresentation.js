import { SOFTWARE_GUIDES } from '../../data/softwareGuides';
import { SYMBOL_KEYS } from '../../data/symbolKeys';

const SYMBOLS_BY_FORMULA = {
    percentage: SYMBOL_KEYS.percentage,
    mean: SYMBOL_KEYS.standard,
    range: SYMBOL_KEYS.range,
    z_test: SYMBOL_KEYS.sd_pop,
    t_onesample: SYMBOL_KEYS.sd_pop,
    anova: SYMBOL_KEYS.anova,
};

export const getResultPresentation = ({ step, stepId, variabilityTab }) => {
    let formulaId = step?.formulaId;
    let visualType = step?.visualType;
    let software = step?.software;

    if (stepId === 'res_variability') {
        if (variabilityTab === 'range') {
            formulaId = 'range';
            visualType = 'quartile';
        } else if (variabilityTab === 'shape') {
            formulaId = 'none';
            visualType = 'skew';
        }

        software = SOFTWARE_GUIDES[variabilityTab];
    }

    return {
        formulaId,
        visualType,
        software,
        symbols: SYMBOLS_BY_FORMULA[formulaId] || SYMBOL_KEYS.sd,
    };
};

export const isFullWidthVisualizer = (stepId) => (
    stepId === 'res_probability' || stepId === 'res_nhst'
);

export const isUnframedVisualizer = (visualType) => (
    visualType === 'anova'
    || visualType === 'factorial_anova'
    || visualType === 'ancova'
);
