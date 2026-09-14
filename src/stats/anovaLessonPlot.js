export const anovaPlotDefaults = () => ({ type: 'dot', error: 'se', grid: true, raw: true, grand: true, yLabel: 'Score', yMin: '', yMax: '', positions: {}, colors: {} });
export function buildAnovaLessonPlot(result, settings) {
    const numeric = text => String(text).trim() === '' ? null : Number(text);
    const customMin = numeric(settings.yMin), customMax = numeric(settings.yMax);
    if ([customMin, customMax].some(value => value !== null && !Number.isFinite(value)) || (customMin !== null && customMax !== null && customMin >= customMax)) return { ok: false, error: 'Use finite axis limits with Y minimum below Y maximum.' };
    const groups = result.samples.map((sample, index) => ({ ...sample, values: result.inputMode === 'raw' ? result.parsed[index].values : [], error: sample.n < 2 || settings.error === 'none' ? 0 : settings.error === 'sd' ? sample.sd : sample.sd / Math.sqrt(sample.n) }));
    let low = Infinity, high = -Infinity;
    const include = value => { low = Math.min(low, value); high = Math.max(high, value); };
    groups.forEach(group => {
        include(group.mean - group.error); include(group.mean + group.error);
        if (settings.raw) group.values.forEach(include);
    });
    if (settings.grand) include(result.grandMean);
    if (settings.type === 'bar') include(0);
    const padding = Math.max((high - low) * .12, Math.max(Math.abs(low), Math.abs(high)) * 1e-6, 1e-12);
    let min = customMin ?? low - padding, max = customMax ?? high + padding;
    if (customMin !== null && customMax === null) max = Math.max(max, min + padding);
    if (customMax !== null && customMin === null) min = Math.min(min, max - padding);
    if (![min, max, max - min].every(Number.isFinite) || min >= max) return { ok: false, error: 'These axis limits exceed the supported numeric range. Choose a smaller range.' };
    return { ok: true, groups, min, max, clipped: low < min || high > max };
}
