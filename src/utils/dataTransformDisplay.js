export const formatSummaryValue = (value) => {
    if (value == null || value === '') {
        return '--';
    }

    if (typeof value === 'number' && Number.isFinite(value)) {
        return Number.isInteger(value) ? `${value}` : value.toFixed(2);
    }

    return String(value);
};
