import { describe, expect, it } from 'vitest';
import { calculateFactorialAnova as calculateFactorialAnovaLegacy } from '../../utils/mathHelpers.js';
import { calculateBrownForsythe, calculateFactorialAnova } from '../factorialAnova.js';
import {
    FACTORIAL_ANOVA_FIXTURES,
    SCIPY_BROWN_FORSYTHE_FIXTURE,
    TWO_BY_TWO_FACTORS,
} from '../fixtures/factorialAnovaFixtures.js';

const expectEffect = (effect, { ss, f }) => {
    expect(effect.ss).toBeCloseTo(ss, 8);
    expect(effect.f).toBeCloseTo(f, 8);
};

describe('two-way between-subjects factorial ANOVA', () => {
    it.each(['I', 'III'])('matches the balanced 2×2 reference decomposition for Type %s', (ssType) => {
        const fixture = FACTORIAL_ANOVA_FIXTURES.balancedTwoByTwo;
        const result = calculateFactorialAnova(
            TWO_BY_TWO_FACTORS.factorA,
            TWO_BY_TWO_FACTORS.factorB,
            fixture.cellData,
            ssType
        );

        expect(result.isBalanced).toBe(true);
        expect(result.totalN).toBe(fixture.expected.totalN);
        expectEffect(result.effects.A, { ss: fixture.expected.ssA, f: fixture.expected.fA });
        expectEffect(result.effects.B, { ss: fixture.expected.ssB, f: fixture.expected.fB });
        expectEffect(result.effects.AxB, { ss: fixture.expected.ssAxB, f: fixture.expected.fAxB });
        expect(result.effects.Error.ss).toBeCloseTo(fixture.expected.ssError, 8);
        expect(result.effects.Total.ss).toBeCloseTo(fixture.expected.ssTotal, 8);
    });

    it('matches a balanced 2×3 additive reference design', () => {
        const fixture = FACTORIAL_ANOVA_FIXTURES.balancedTwoByThree;
        const result = calculateFactorialAnova(
            fixture.factorA,
            fixture.factorB,
            fixture.cellData,
            'III'
        );

        expect(result.isBalanced).toBe(true);
        expect(result.totalN).toBe(fixture.expected.totalN);
        expectEffect(result.effects.A, { ss: fixture.expected.ssA, f: fixture.expected.fA });
        expectEffect(result.effects.B, { ss: fixture.expected.ssB, f: fixture.expected.fB });
        expectEffect(result.effects.AxB, { ss: fixture.expected.ssAxB, f: fixture.expected.fAxB });
        expect(result.effects.Error.ss).toBeCloseTo(fixture.expected.ssError, 8);
        expect(result.effects.Total.ss).toBeCloseTo(fixture.expected.ssTotal, 8);
        expect(result.levene).toMatchObject({ available: false, reason: 'raw_data_required' });
    });

    it('matches independently derived Type III contrasts for an unbalanced 2×2 design', () => {
        const fixture = FACTORIAL_ANOVA_FIXTURES.unbalancedTwoByTwo;
        const result = calculateFactorialAnova(
            TWO_BY_TWO_FACTORS.factorA,
            TWO_BY_TWO_FACTORS.factorB,
            fixture.cellData,
            'III'
        );

        expect(result.isBalanced).toBe(false);
        expectEffect(result.effects.A, {
            ss: fixture.expectedTypeIII.ssA,
            f: fixture.expectedTypeIII.fA,
        });
        expectEffect(result.effects.B, {
            ss: fixture.expectedTypeIII.ssB,
            f: fixture.expectedTypeIII.fB,
        });
        expectEffect(result.effects.AxB, {
            ss: fixture.expectedTypeIII.ssAxB,
            f: fixture.expectedTypeIII.fAxB,
        });
        expect(result.effects.Error.ss).toBeCloseTo(fixture.expectedTypeIII.ssError, 8);
    });

    it('calculates Type I sums of squares sequentially in A, B, interaction order', () => {
        const fixture = FACTORIAL_ANOVA_FIXTURES.unbalancedTwoByTwo;
        const result = calculateFactorialAnova(
            TWO_BY_TWO_FACTORS.factorA,
            TWO_BY_TWO_FACTORS.factorB,
            fixture.cellData,
            'I'
        );

        expect(result.model.termOrder).toEqual(['A', 'B', 'AxB']);
        expect(result.effects.A.ss).toBeCloseTo(fixture.expectedTypeI.ssA, 8);
        expect(result.effects.B.ss).toBeCloseTo(fixture.expectedTypeI.ssB, 8);
        expect(result.effects.AxB.ss).toBeCloseTo(fixture.expectedTypeI.ssAxB, 8);
    });

    it('rejects incomplete designs instead of treating empty cells as zero-valued cells', () => {
        const fixture = FACTORIAL_ANOVA_FIXTURES.balancedTwoByTwo;
        const incompleteData = { ...fixture.cellData, a2_b2: { values: [], inputMode: 'raw' } };

        expect(calculateFactorialAnova(
            TWO_BY_TWO_FACTORS.factorA,
            TWO_BY_TWO_FACTORS.factorB,
            incompleteData,
            'III'
        )).toBeNull();
    });

    it('keeps the legacy math-helper API wired to the validated engine', () => {
        const fixture = FACTORIAL_ANOVA_FIXTURES.balancedTwoByTwo;
        const direct = calculateFactorialAnova(
            TWO_BY_TWO_FACTORS.factorA,
            TWO_BY_TWO_FACTORS.factorB,
            fixture.cellData,
            'III'
        );
        const legacy = calculateFactorialAnovaLegacy(
            TWO_BY_TWO_FACTORS.factorA,
            TWO_BY_TWO_FACTORS.factorB,
            fixture.cellData,
            'III'
        );

        expect(legacy.effects).toEqual(direct.effects);
    });
});

describe('Brown–Forsythe homogeneity diagnostic', () => {
    it('matches the published SciPy median-centered Levene example', () => {
        const result = calculateBrownForsythe(SCIPY_BROWN_FORSYTHE_FIXTURE.groups);

        expect(result.available).toBe(true);
        expect(result.method).toBe('Brown–Forsythe');
        expect(result.df1).toBe(SCIPY_BROWN_FORSYTHE_FIXTURE.expected.df1);
        expect(result.df2).toBe(SCIPY_BROWN_FORSYTHE_FIXTURE.expected.df2);
        expect(result.p).toBeCloseTo(SCIPY_BROWN_FORSYTHE_FIXTURE.expected.p, 10);
    });

    it('does not fabricate a variance-test result from summary statistics', () => {
        const fixture = FACTORIAL_ANOVA_FIXTURES.unbalancedTwoByTwo;
        const result = calculateFactorialAnova(
            TWO_BY_TWO_FACTORS.factorA,
            TWO_BY_TWO_FACTORS.factorB,
            fixture.cellData,
            'III'
        );

        expect(result.levene).toMatchObject({
            available: false,
            reason: 'raw_data_required',
        });
        expect(result.levene.p).toBeUndefined();
    });
});
