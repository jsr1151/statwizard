import { describe, expect, it } from 'vitest';
import { SYMBOL_KEYS } from '../../../data/symbolKeys';
import {
    getResultPresentation,
    isFullWidthVisualizer,
    isUnframedVisualizer,
} from '../resultPresentation';

describe('getResultPresentation', () => {
    const variabilityStep = {
        formulaId: 'sd',
        visualType: 'variability',
        software: { spss: 'default guide' },
    };

    it('uses the step presentation for ordinary result pages', () => {
        expect(getResultPresentation({
            step: { formulaId: 'mean', visualType: 'normal', software: { r: 'guide' } },
            stepId: 'res_mean',
            variabilityTab: 'sd',
        })).toEqual({
            formulaId: 'mean',
            visualType: 'normal',
            software: { r: 'guide' },
            symbols: SYMBOL_KEYS.standard,
        });
    });

    it.each([
        ['range', 'range', 'quartile', SYMBOL_KEYS.range],
        ['shape', 'none', 'skew', SYMBOL_KEYS.sd],
    ])('maps the variability %s tab to its matching presentation', (
        variabilityTab,
        formulaId,
        visualType,
        symbols
    ) => {
        const presentation = getResultPresentation({
            step: variabilityStep,
            stepId: 'res_variability',
            variabilityTab,
        });

        expect(presentation.formulaId).toBe(formulaId);
        expect(presentation.visualType).toBe(visualType);
        expect(presentation.symbols).toBe(symbols);
        expect(presentation.software).toBeDefined();
    });
});

describe('result visualizer layout helpers', () => {
    it('identifies pages that do not use the equation column', () => {
        expect(isFullWidthVisualizer('res_probability')).toBe(true);
        expect(isFullWidthVisualizer('res_nhst')).toBe(true);
        expect(isFullWidthVisualizer('res_anova')).toBe(false);
    });

    it('identifies visualizers that provide their own framing', () => {
        expect(isUnframedVisualizer('anova')).toBe(true);
        expect(isUnframedVisualizer('factorial_anova')).toBe(true);
        expect(isUnframedVisualizer('ancova')).toBe(true);
        expect(isUnframedVisualizer('ttest')).toBe(false);
    });
});
