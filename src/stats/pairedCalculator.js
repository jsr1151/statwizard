import { calculateOneSampleCalculator } from './oneSampleCalculator.js';

const numberPattern = /^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i;
const cellsFor = line => line.includes('\t') ? { cells: line.split('\t'), separator: '\t' }
    : line.includes(',') ? { cells: line.split(','), separator: ',' }
    : line.includes(';') ? { cells: line.split(';'), separator: ';' }
    : { cells: line.trim().split(/\s+/), separator: ' ' };
export const swapPairedInput = text => text.split(/\r?\n/).map(line => { const { cells, separator } = cellsFor(line); return cells.length === 2 ? cells.reverse().join(separator) : line; }).join('\n');
export const parsePairedInput = text => {
    const pairs = [], excluded = [];
    let total = 0, dropped = 0;
    String(text).split(/\r?\n/).forEach((line, index) => {
        if (!line.trim()) return;
        total++;
        const { cells } = cellsFor(line);
        const values = cells.map(cell => numberPattern.test(cell.trim()) && Number.isFinite(Number(cell)) ? Number(cell) : null);
        const valid = cells.length === 2 && values.every(value => value !== null);
        if (valid) pairs.push({ row: index + 1, first: values[0], second: values[1] });
        else {
            dropped++;
            if (excluded.length < 100) excluded.push({ row: index + 1, reason: cells.length !== 2 ? 'Expected exactly two values.' : cells.map((cell, i) => !cell.trim() ? `Condition ${i + 1}: missing value.` : values[i] === null ? `Condition ${i + 1}: not a single finite number.` : '').filter(Boolean).join(' ') });
        }
    });
    return { pairs, excluded, total, usable: pairs.length, dropped };
};
export const pairedSeedInput = seed => {
    const first = seed.group1.raw.split(',').map(value => value.trim());
    const second = seed.group2.raw.split(',').map(value => value.trim());
    return { text: first.map((value, i) => `${value},${second[i] ?? ''}`).join('\n'), labels: [seed.group1.label, seed.group2.label] };
};
const numericEntry = value => String(value).trim() === '' ? NaN : Number(value);
const mean = values => values.reduce((sum, value) => sum + value, 0) / values.length;
const sd = (values, center) => Math.sqrt(values.reduce((sum, value) => sum + (value - center) ** 2, 0) / (values.length - 1));
export const calculatePairedCalculator = ({ inputMode, raw, summary, alpha, tails, direction, ciType }) => {
    const review = parsePairedInput(raw.text);
    let n, mean1, mean2, sd1, sd2, r, dBar, differenceSd, diffs = [], raw1 = [], raw2 = [];
    const errors = [];
    if (inputMode === 'raw') {
        n = review.usable; raw1 = review.pairs.map(pair => pair.first); raw2 = review.pairs.map(pair => pair.second);
        diffs = raw1.map((value, i) => value - raw2[i]);
        mean1 = mean(raw1); mean2 = mean(raw2); sd1 = sd(raw1, mean1); sd2 = sd(raw2, mean2);
        dBar = mean(diffs); differenceSd = sd(diffs, dBar);
        r = sd1 > 0 && sd2 > 0 ? Math.max(-1, Math.min(1, raw1.reduce((sum, value, i) => sum + (value - mean1) / sd1 * ((raw2[i] - mean2) / sd2), 0) / (n - 1))) : null;
    } else {
        ({ n, mean1, mean2, sd1, sd2, r } = Object.fromEntries(['n','mean1','mean2','sd1','sd2','r'].map(key => [key, numericEntry(summary[key])])));
        if (![mean1, mean2].every(Number.isFinite)) errors.push('Enter finite means for both conditions.');
        if (![sd1, sd2].every(value => Number.isFinite(value) && value > 0)) errors.push('Summary input requires positive sample SDs for both conditions. Use raw pairs if a condition is constant.');
        if (!Number.isFinite(r) || r < -1 || r > 1) errors.push('Enter the within-pair correlation between -1 and 1; do not assume zero when it is unknown.');
        if (n === 2 && Number.isFinite(r) && Math.abs(r) !== 1) errors.push('For two pairs with nonconstant conditions, the sample correlation must be -1 or 1.');
        dBar = mean1 - mean2;
        differenceSd = Math.sqrt((sd1 - sd2) ** 2 + 2 * (1 - r) * sd1 * sd2);
    }
    if (!Number.isSafeInteger(n) || n < 2) errors.push('Enter at least two complete pairs, or a whole-number pair count of 2 or more.');
    if (!Number.isFinite(differenceSd) || differenceSd <= 0) errors.push('The paired differences need a finite, positive sample SD. Constant differences cannot support a t-test.');
    if (errors.length) return { ok: false, errors, review };
    const model = calculateOneSampleCalculator({ inputMode: 'summary', raw: '', summary: { mean: dBar, sd: differenceSd, n }, nullMean: 0, alpha, tails, direction, ciType });
    if (!model.ok) return { ...model, review };
    return { ...model, review, n1: n, n2: n, mean1, mean2, sd1, sd2, r, dBar, sd: differenceSd, dz: model.effectSize, diffs, raw1, raw2,
        ciLower: model.confidenceInterval.lower, ciUpper: model.confidenceInterval.upper, tCrit: model.criticalValue, h1Direction: direction };
};
