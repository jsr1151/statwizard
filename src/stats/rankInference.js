import { normalCDF } from '../utils/mathHelpers.js';

export const EXACT_RANK_SUM_LIMIT = 40;
export const EXACT_SIGNED_RANK_LIMIT = 50;

export function averageRanks(values) {
    const sorted = values.map((value, index) => ({ value, index })).sort((a, b) => a.value - b.value);
    const ranks = new Array(values.length);
    const tieSizes = [];
    for (let i = 0; i < sorted.length;) {
        let end = i + 1;
        while (end < sorted.length && sorted[end].value === sorted[i].value) end++;
        const rank = (i + 1 + end) / 2;
        for (let j = i; j < end; j++) ranks[sorted[j].index] = rank;
        if (end - i > 1) tieSizes.push(end - i);
        i = end;
    }
    return { ranks, tieSizes };
}

const exactTail = (distribution, observed, alternative) => {
    let lower = 0, upper = 0, total = 0;
    for (const [sum, count] of distribution) {
        total += count;
        if (sum <= observed) lower += count;
        if (sum >= observed) upper += count;
    }
    return Math.min(1, alternative === 'less' ? lower / total : alternative === 'greater' ? upper / total : 2 * Math.min(lower, upper) / total);
};

// Count label assignments conditional on the observed pooled ranks, including ties.
// Doubled average ranks are integers; N <= 40 keeps counts exactly representable.
export function exactRankSum(ranks, groupSize, observedRankSum, alternative) {
    const counts = Array.from({ length: groupSize + 1 }, () => new Map());
    counts[0].set(0, 1);
    ranks.forEach((rank, index) => {
        for (let selected = Math.min(groupSize, index + 1); selected > 0; selected--) {
            for (const [sum, count] of counts[selected - 1]) {
                const next = sum + 2 * rank;
                counts[selected].set(next, (counts[selected].get(next) || 0) + count);
            }
        }
    });
    return exactTail(counts[groupSize], 2 * observedRankSum, alternative);
}

// Count all sign assignments to the nonzero absolute ranks, including tied ranks.
export function exactSignedRank(ranks, positiveRankSum, alternative) {
    let counts = new Map([[0, 1]]);
    for (const rank of ranks) {
        const next = new Map(counts);
        for (const [sum, count] of counts) next.set(sum + 2 * rank, (next.get(sum + 2 * rank) || 0) + count);
        counts = next;
    }
    return exactTail(counts, 2 * positiveRankSum, alternative);
}

export function approximateRankTail(statistic, mean, variance, alternative, continuity) {
    const delta = statistic - mean;
    const adjustment = continuity ? 0.5 : 0;
    const correction = alternative === 'greater' ? adjustment : alternative === 'less' ? -adjustment : Math.sign(delta) * adjustment;
    const z = (delta - correction) / Math.sqrt(variance);
    const p = alternative === 'less' ? normalCDF(z) : alternative === 'greater' ? normalCDF(-z) : 2 * normalCDF(-Math.abs(z));
    return { z, p: Math.max(0, Math.min(1, p)) };
}
