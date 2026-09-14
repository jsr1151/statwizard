import { expect, it } from 'vitest';
import { anovaPlotDefaults, buildAnovaLessonPlot } from '../anovaLessonPlot.js';
import { calculateOneWayCalculator } from '../oneWayCalculator.js';
import { createOneWayDraft } from '../../utils/oneWayDraft.js';
const result = groups => calculateOneWayCalculator({ ...createOneWayDraft(), groups: groups.map(raw => ({ label: 'Group', raw })) });
it.each([['-10,-5,-2','-7,-3,-1'],['.0000001,.0000002,.0000003','.0000002,.0000003,.0000004']])('scales negative and small data without clipping observations: %j', (first, second) => {
    const stats = result([first,second]), model = buildAnovaLessonPlot(stats, anovaPlotDefaults());
    expect(model.ok).toBe(true); expect(model.clipped).toBe(false); for (const group of model.groups) for (const value of group.values) { expect(value).toBeGreaterThan(model.min); expect(value).toBeLessThan(model.max); }
    expect(model.max-model.min).toBeLessThan(first.startsWith('-')?20:.000001);
});
it.each([{yMin:'5',yMax:'5'},{yMin:'6',yMax:'2'},{yMin:'Infinity'},{yMax:'nope'},{yMin:'-1e308',yMax:'1e308'}])('blocks invalid or overflowing custom limits: %j', change => {
    expect(buildAnovaLessonPlot(result(['1,2,3','2,3,4']),{...anovaPlotDefaults(),...change}).ok).toBe(false);
});
it('keeps a valid range when a single custom limit is beyond the observed values', () => {
    for (const limits of [{yMin:'100'},{yMax:'-100'}]) { const model=buildAnovaLessonPlot(result(['1,2,3','2,3,4']),{...anovaPlotDefaults(),...limits}); expect(model.ok).toBe(true); expect(model.max).toBeGreaterThan(model.min); expect(model.clipped).toBe(true); }
});
