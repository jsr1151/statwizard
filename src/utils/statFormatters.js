export const formatStatistic = (value, digits = 3) => {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return '--';
    return numeric.toFixed(digits).replace(/\.?0+$/, '');
};

export const formatPValue = (value) => {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return '--';
    if (numeric < 0.001) return '< .001';
    return `= ${numeric.toFixed(3).replace(/^0/, '')}`;
};
