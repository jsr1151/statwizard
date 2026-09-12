import { regularizedIncompleteBeta } from '../power/math.js';
import { repeatedSphericity } from './repeatedSphericity.js';

export const RM_LIMITS = { participants: 10000, conditions: 12 };
const missing = value => value == null || /^(?:|na|n\/a|null|\.)$/i.test(String(value).trim());
const number = value => {
    if (missing(value)) return null;
    if (!['string', 'number'].includes(typeof value) || !/^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(String(value).trim())) return NaN;
    return Number(value);
};
const fail = error => ({ ok: false, error });

// Wide records: one explicit participant ID and one value per condition.
export function calculateRepeatedMeasures({ records, conditions, missingPolicy = 'exclude' } = {}) {
    if (!Array.isArray(conditions) || conditions.length < 2 || conditions.length > RM_LIMITS.conditions || conditions.some(missing) || new Set(conditions.map(String)).size !== conditions.length) return fail('Choose 2–12 distinct, named conditions.');
    if (!Array.isArray(records) || records.length > RM_LIMITS.participants) return fail('Provide no more than 10,000 participants.');
    if (!['exclude', 'reject'].includes(missingPolicy)) return fail('Choose a supported missing-data policy.');
    const ids = new Set(), retained = [], excluded = [];
    for (const [index, record] of records.entries()) {
        if (missing(record?.id)) return fail(`Row ${index + 1}: a participant ID is required.`);
        const id = String(record.id).trim();
        if (ids.has(id)) return fail(`Duplicate participant ID “${id}”. Each wide-format row must represent a different participant.`);
        ids.add(id);
        if (!Array.isArray(record.values) || record.values.length !== conditions.length) return fail(`Participant ${id}: expected one value for every selected condition.`);
        const values = record.values.map(number);
        const invalid = values.findIndex(value => value !== null && !Number.isFinite(value));
        if (invalid >= 0) return fail(`Participant ${id}, condition ${conditions[invalid]}: enter a finite number or an explicit missing value.`);
        const absent = conditions.filter((_, i) => values[i] === null);
        if (absent.length) excluded.push({ id, conditions: absent }); else retained.push({ id, values });
    }
    if (excluded.length && missingPolicy === 'reject') return { ...fail(`${excluded.length} participants have incomplete measurements. Resolve the missing values or explicitly choose complete-participant exclusion.`), excluded };
    if (retained.length < 3) return fail('At least three complete participants are required for this calculator.');
    const n = retained.length, k = conditions.length;
    // Translation and scaling protect the decomposition from large offsets/units.
    const origin = retained[0].values[0];
    const shifted = retained.map(row => row.values.map(value => value - origin));
    const scale = shifted.reduce((max, row) => Math.max(max, ...row.map(Math.abs)), 0);
    if (!Number.isFinite(scale) || !Number.isFinite(scale * scale)) return fail('The measurement range is too large. Rescale the outcome before analysis.');
    if (!(scale > 0)) return fail('All measurements are identical; there is no residual variation to test.');
    const matrix = shifted.map(row => row.map(value => value / scale));
    const columnMeans = conditions.map((_, j) => matrix.reduce((sum, row) => sum + row[j], 0) / n);
    const rowMeans = matrix.map(row => row.reduce((sum, value) => sum + value, 0) / k);
    const grand = columnMeans.reduce((sum, value) => sum + value, 0) / k;
    const conditionSS = n * columnMeans.reduce((sum, value) => sum + (value - grand) ** 2, 0);
    const subjectSS = k * rowMeans.reduce((sum, value) => sum + (value - grand) ** 2, 0);
    const errorSS = matrix.reduce((sum, row, i) => sum + row.reduce((total, value, j) => total + (value - rowMeans[i] - columnMeans[j] + grand) ** 2, 0), 0);
    const totalSS = matrix.reduce((sum, row) => sum + row.reduce((total, value) => total + (value - grand) ** 2, 0), 0);
    if (!(errorSS > Math.max(1, totalSS) * 1e-24)) return fail('Residual variation is zero or numerically indistinguishable from zero. An inferential F test cannot be estimated reliably.');
    const df1 = k - 1, df2 = (n - 1) * df1;
    const f = (conditionSS / df1) / (errorSS / df2);
    const sphericity = repeatedSphericity(matrix);
    const corrections = [['gg', 'Greenhouse–Geisser', sphericity.gg], ['hf', 'Huynh–Feldt', sphericity.hf], ['uncorrected', 'Uncorrected', 1], ['lowerBound', 'Lower bound', 1 / df1]].map(([id, label, epsilon]) => {
        const numeratorDf = df1 * epsilon, denominatorDf = df2 * epsilon;
        const p = f === 0 ? 1 : regularizedIncompleteBeta(denominatorDf / (denominatorDf + numeratorDf * f), denominatorDf / 2, numeratorDf / 2, { epsilon: 1e-12, maxIterations: 1000 });
        return { id, label, epsilon, numeratorDf, denominatorDf, f, p };
    });
    const ssScale = scale * scale;
    if (!Number.isFinite(totalSS * ssScale) || ssScale === 0) return fail('The sums of squares exceed numerical precision. Rescale the measurements.');
    return {
        ok: true, n, k, conditions, retained, excluded, inputParticipants: records.length, missingPolicy, f, df1, df2,
        ssCondition: conditionSS * ssScale, ssSubject: subjectSS * ssScale, ssError: errorSS * ssScale, ssTotal: totalSS * ssScale,
        msCondition: conditionSS * ssScale / df1, msError: errorSS * ssScale / df2,
        partialEtaSquared: conditionSS / (conditionSS + errorSS), generalizedEtaSquared: conditionSS / (conditionSS + errorSS + subjectSS),
        sphericity, corrections,
        summaries: conditions.map((label, j) => ({ label, mean: origin + columnMeans[j] * scale, sd: Math.sqrt(matrix.reduce((sum, row) => sum + (row[j] - columnMeans[j]) ** 2, 0) / (n - 1)) * scale })),
    };
}
