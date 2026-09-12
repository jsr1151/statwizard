import { averageRanks, exactRankSum, exactSignedRank, approximateRankTail, EXACT_RANK_SUM_LIMIT, EXACT_SIGNED_RANK_LIMIT } from './rankInference.js';

export const MAX_RANK_SAMPLE_SIZE = 10000;
const numericPattern = /^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i;
export const isRankMissing = value => value == null || /^(?:|na|n\/a|null|\.)$/i.test(String(value).trim());
const readValue = value => {
    if (isRankMissing(value)) return null;
    if ((typeof value !== 'number' && typeof value !== 'string') || !numericPattern.test(String(value).trim())) return NaN;
    return Number(value);
};
const fail = error => ({ ok: false, error });

// Keep empty cells and lines: dropping them before pairing would shift subjects.
export function parseRankSample(text) {
    if (!String(text).trim()) return [];
    return String(text).replace(/\r\n?/g, '\n').split(/[\n,\t]/);
}

export function calculateRankTest(first, second, options = {}) {
    const { paired = false, alternative = 'two-sided', method = 'auto', continuity = true, differenceDecimals = null } = options;
    if (!['two-sided', 'less', 'greater'].includes(alternative) || !['auto', 'exact', 'asymptotic'].includes(method)) return fail('Choose a supported alternative and inference method.');
    if (!Array.isArray(first) || !Array.isArray(second)) return fail('Provide two samples.');
    if (first.length > MAX_RANK_SAMPLE_SIZE || second.length > MAX_RANK_SAMPLE_SIZE) return fail(`Use at most ${MAX_RANK_SAMPLE_SIZE.toLocaleString()} entries per sample.`);
    if (paired && first.length !== second.length) return fail('Paired samples must have the same number of entries. Keep missing cells as NA so matching is preserved.');
    if (differenceDecimals !== null && (!Number.isInteger(differenceDecimals) || differenceDecimals < 0 || differenceDecimals > 10)) return fail('Difference rounding must be between 0 and 10 decimal places.');
    const x = first.map(readValue), y = second.map(readValue);
    for (const [label, values] of [['A', x], ['B', y]]) {
        const invalid = values.findIndex(value => value !== null && !Number.isFinite(value));
        if (invalid !== -1) return fail(`Sample ${label}, entry ${invalid + 1}: enter a finite number or NA. Invalid text is not silently excluded.`);
    }
    const shared = { paired, alternative, continuity, differenceDecimals, inputA: first.length, inputB: second.length };
    return paired ? signedRank(x, y, method, shared) : rankSum(x, y, method, shared);
}

function rankSum(x, y, method, shared) {
    const a = x.flatMap((value, index) => value === null ? [] : [{ value, row: index + 1, sample: 'A' }]);
    const b = y.flatMap((value, index) => value === null ? [] : [{ value, row: index + 1, sample: 'B' }]);
    if (!a.length || !b.length) return fail('Each independent sample needs at least one observed value.');
    const nA = a.length, nB = b.length, n = nA + nB;
    const rows = [...a, ...b];
    const { ranks, tieSizes } = averageRanks(rows.map(row => row.value));
    const rankSumA = ranks.slice(0, nA).reduce((sum, rank) => sum + rank, 0);
    const uA = rankSumA - nA * (nA + 1) / 2;
    const uB = nA * nB - uA;
    const exact = method === 'exact' || (method === 'auto' && n <= EXACT_RANK_SUM_LIMIT);
    if (exact && n > EXACT_RANK_SUM_LIMIT) return fail(`Exact Mann–Whitney inference supports up to ${EXACT_RANK_SUM_LIMIT} observed values in total. Choose Auto or Normal approximation for this sample.`);
    const variance = nA * nB / 12 * (n + 1 - tieSizes.reduce((sum, t) => sum + t ** 3 - t, 0) / (n * (n - 1)));
    const inference = exact ? { p: exactRankSum(ranks, nA, rankSumA, shared.alternative), z: null }
        : variance > 0 ? approximateRankTail(uA, nA * nB / 2, variance, shared.alternative, shared.continuity) : { p: 1, z: null };
    return {
        ...shared, ...inference, ok: true, method: exact ? 'exact' : 'asymptotic', nA, nB, uA, uB, rankSumA,
        excludedA: x.length - nA, excludedB: y.length - nB, tieGroups: tieSizes.length,
        effect: 2 * uA / (nA * nB) - 1, superiority: uA / (nA * nB),
        rows: rows.map((row, index) => ({ ...row, rank: ranks[index] })),
        warnings: [
            ...(!variance ? ['All observed values are tied: there is no rank information separating the samples; p = 1.'] : []),
            ...(!exact && Math.min(nA, nB) < 10 ? ['The normal approximation may be unreliable with a small group. Use exact inference when available or validated permutation software.'] : []),
        ],
    };
}

function signedRank(x, y, method, shared) {
    const rows = [];
    let excludedPairs = 0;
    for (let i = 0; i < x.length; i++) {
        if (x[i] === null || y[i] === null) { excludedPairs++; continue; }
        const raw = x[i] - y[i];
        if (!Number.isFinite(raw)) return fail(`Pair ${i + 1} overflows when subtracting A − B. Rescale the measurements.`);
        const difference = shared.differenceDecimals === null ? raw : Number(raw.toFixed(shared.differenceDecimals));
        rows.push({ row: i + 1, a: x[i], b: y[i], difference, rank: null });
    }
    const nonzero = rows.filter(row => row.difference !== 0);
    const n = nonzero.length;
    if (!n) return fail(rows.length ? 'All complete pairs have zero difference after any selected rounding. The signed-rank test has no nonzero differences to analyze.' : 'There are no complete pairs to analyze.');
    const { ranks, tieSizes } = averageRanks(nonzero.map(row => Math.abs(row.difference)));
    let wPlus = 0, wMinus = 0;
    nonzero.forEach((row, index) => {
        row.rank = ranks[index];
        if (row.difference > 0) wPlus += row.rank; else wMinus += row.rank;
    });
    const exact = method === 'exact' || (method === 'auto' && n <= EXACT_SIGNED_RANK_LIMIT);
    if (exact && n > EXACT_SIGNED_RANK_LIMIT) return fail(`Exact signed-rank inference supports up to ${EXACT_SIGNED_RANK_LIMIT} nonzero pairs. Choose Auto or Normal approximation for this sample.`);
    const mean = (wPlus + wMinus) / 2;
    const variance = ranks.reduce((sum, rank) => sum + rank * rank, 0) / 4;
    const inference = exact ? { p: exactSignedRank(ranks, wPlus, shared.alternative), z: null }
        : approximateRankTail(wPlus, mean, variance, shared.alternative, shared.continuity);
    return {
        ...shared, ...inference, ok: true, method: exact ? 'exact' : 'asymptotic', n, completePairs: rows.length,
        excludedPairs, zeroPairs: rows.length - n, tieGroups: tieSizes.length, wPlus, wMinus,
        effect: (wPlus - wMinus) / (wPlus + wMinus), rows,
        warnings: !exact && n < 20 ? ['The normal approximation may be unreliable with few nonzero pairs. Prefer exact inference when available.'] : [],
    };
}
