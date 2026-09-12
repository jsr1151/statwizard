import { describe, expect, it } from 'vitest';
import { calculateRankTest, parseRankSample } from '../nonparametric.js';
import fixtures from '../fixtures/nonparametric-r.json';

describe('rank tests against independently generated R fixtures', () => {
    it.each(fixtures.cases)('$name $alternative $method continuity=$continuity', test => {
        const result = calculateRankTest(test.first, test.second, test);
        expect(result.ok).toBe(true);
        expect(result.paired ? result.wPlus : result.uA).toBe(test.statistic);
        // Shared normal-CDF approximation has absolute error below about 1.5e-7.
        expect(Math.abs(result.p - test.p)).toBeLessThan(test.method === 'exact' ? 1e-12 : 2e-7);
    });
});

// Independent exhaustive oracles: pairwise comparisons / all sign patterns.
const tails = (values, observed, alternative) => {
    const lower = values.filter(value => value <= observed).length / values.length;
    const upper = values.filter(value => value >= observed).length / values.length;
    return alternative === 'less' ? lower : alternative === 'greater' ? upper : Math.min(1, 2 * Math.min(lower, upper));
};
const u = (a, b) => a.reduce((sum, x) => sum + b.reduce((count, y) => count + (x > y ? 1 : x === y ? 0.5 : 0), 0), 0);
const positiveRanks = differences => differences.filter(x => x > 0).reduce((sum, x) => sum + 1 + differences.filter(y => Math.abs(y) < x).length + (differences.filter(y => Math.abs(y) === x).length - 1) / 2, 0);

it.each(['less', 'greater', 'two-sided'])('exact tied rank-sum matches exhaustive label assignments: %s', alternative => {
    for (const [a, b] of [[[1,2,2],[2,4]], [[1],[1,1,2,3]], [[5,5],[5,5]], [[1,1,2],[2,2,3]]]) {
        const pool = [...a, ...b], values = [];
        for (let mask = 0; mask < 2 ** pool.length; mask++) {
            const selected = pool.filter((_, index) => mask & (1 << index));
            if (selected.length === a.length) values.push(u(selected, pool.filter((_, index) => !(mask & (1 << index)))));
        }
        expect(calculateRankTest(a, b, { alternative }).p).toBeCloseTo(tails(values, u(a,b), alternative), 12);
    }
});

it.each(['less', 'greater', 'two-sided'])('exact tied signed-rank matches exhaustive signs: %s', alternative => {
    for (const differences of [[1,2,-2,0,3], [-1,-1,1,1,0], [2,-2,2,-4,4], [0,0,1]]) {
        const retained = differences.filter(Boolean), values = [];
        for (let mask = 0; mask < 2 ** retained.length; mask++) values.push(positiveRanks(retained.map((d,index) => Math.abs(d) * (mask & (1 << index) ? 1 : -1))));
        const result = calculateRankTest(differences, differences.map(() => 0), { paired: true, alternative });
        expect(result.p).toBeCloseTo(tails(values, positiveRanks(retained), alternative), 12);
    }
});

it('preserves missing positions and complete-pair matching', () => {
    const a = parseRankSample('1\r\n\r\n3,NA,5');
    expect(a).toEqual(['1','','3','NA','5']);
    const result = calculateRankTest(a, [0,100,null,2,1], { paired: true });
    expect(result).toMatchObject({ ok: true, n: 2, excludedPairs: 3, wPlus: 3 });
    expect(result.rows.map(row => row.row)).toEqual([1,5]);
    expect(calculateRankTest([1,2], [1], { paired: true }).ok).toBe(false);
});

it.each(['oops','Infinity','1e309',Infinity,NaN,true,{},'0x10'])('rejects malformed values without treating them as missing: %s', bad => {
    expect(calculateRankTest([1,bad], [2,3]).ok).toBe(false);
});

it('handles missing groups, empty inputs, degenerate ranks and all-zero pairs', () => {
    expect(calculateRankTest([], [1]).ok).toBe(false);
    expect(calculateRankTest([1,null,2], [3,'NA',4])).toMatchObject({ nA: 2, nB: 2, excludedA: 1, excludedB: 1 });
    expect(calculateRankTest([1,1], [1,1], { method: 'asymptotic' })).toMatchObject({ ok: true, p: 1, effect: 0 });
    expect(calculateRankTest([1,2], [1,2], { paired: true }).error).toContain('zero difference');
    expect(calculateRankTest([Number.MAX_VALUE], [-Number.MAX_VALUE], { paired: true }).ok).toBe(false);
});

it('makes precision and zero handling explicit', () => {
    const result = calculateRankTest([0.5,0.825,0.375,0.5],[0.525,0.775,0.325,0.55],{ paired:true, alternative:'greater', differenceDecimals:3 });
    expect(result).toMatchObject({ wPlus: 6, p: 0.5, tieGroups: 1 });
    expect(calculateRankTest([0.01],[0],{paired:true,differenceDecimals:0}).ok).toBe(false);
});

it('uses documented exact limits and refuses forced exact requests above them', () => {
    const twenty = Array.from({ length: 20 }, (_, i) => i);
    expect(calculateRankTest(twenty, twenty).method).toBe('exact');
    expect(calculateRankTest(twenty, [...twenty,21]).method).toBe('asymptotic');
    expect(calculateRankTest(twenty, [...twenty,21], {method:'exact'}).ok).toBe(false);
    const fifty = Array.from({length:50},(_,i)=>i+1);
    expect(calculateRankTest(fifty, fifty.map(()=>0), {paired:true}).method).toBe('exact');
    expect(calculateRankTest([...fifty,51], Array(51).fill(0), {paired:true}).method).toBe('asymptotic');
    expect(calculateRankTest(Array(10001).fill(1), [1]).ok).toBe(false);
});

it('reversing samples reverses effect and directional inference', () => {
    for (const paired of [false,true]) {
        const a=[1,2,2,4],b=[2,3,4,5];
        const forward=calculateRankTest(a,b,{paired,alternative:'less'});
        const reverse=calculateRankTest(b,a,{paired,alternative:'greater'});
        expect(forward.p).toBe(reverse.p);
        expect(forward.effect).toBe(-reverse.effect);
    }
});
