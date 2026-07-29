export const parseFrequencyInput = (input = '') => {
    const source = String(input).trim();
    if (!source) return [];
    const delimiter = /[,;\n\r]/.test(source) ? /[,;\n\r]+/ : /\s+/;
    return source.split(delimiter).map((value) => value.trim()).filter(Boolean);
};

const ascendingComparator = (a, b) => {
    const aNumber = Number(a.value);
    const bNumber = Number(b.value);
    if (Number.isFinite(aNumber) && Number.isFinite(bNumber)) return aNumber - bNumber;
    return a.value.localeCompare(b.value, undefined, { numeric: true, sensitivity: 'base' });
};

export const calculateFrequencies = (values = [], order = 'ascending') => {
    if (values.length === 0) return null;
    const counts = new Map();
    values.forEach((value) => {
        const label = String(value).trim();
        if (label) counts.set(label, (counts.get(label) || 0) + 1);
    });
    const n = [...counts.values()].reduce((sum, count) => sum + count, 0);
    if (n === 0) return null;
    const rows = [...counts.entries()].map(([value, frequency]) => ({ value, frequency }));
    rows.sort(order === 'frequency'
        ? (a, b) => b.frequency - a.frequency || ascendingComparator(a, b)
        : ascendingComparator);
    let cumulativeFrequency = 0;
    rows.forEach((row) => {
        cumulativeFrequency += row.frequency;
        row.relativeFrequency = row.frequency / n;
        row.percentage = row.relativeFrequency * 100;
        row.cumulativeFrequency = cumulativeFrequency;
        row.cumulativePercentage = cumulativeFrequency / n * 100;
    });
    const maxFrequency = Math.max(...rows.map((row) => row.frequency));
    return {
        n,
        uniqueCount: rows.length,
        rows,
        modes: rows.filter((row) => row.frequency === maxFrequency).map((row) => row.value),
        maxFrequency,
    };
};
