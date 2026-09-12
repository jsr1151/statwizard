import { expect, it } from 'vitest';
import { POWER_TEST_REGISTRY } from '../testRegistry.js';
import { runPowerAnalysis } from '../engine.js';
import { buildPowerCurveModel } from '../curves.js';

const available = POWER_TEST_REGISTRY.filter(config => config.power.status === 'available');
const modes = available.flatMap(config => config.power.implementedPowerModes.map(mode => ({ config, mode })));

it.each(modes)('$config.id resolves and calculates its $mode defaults', ({ config, mode }) => {
    const result = runPowerAnalysis(config, config.power.buildInitialInputs({}, mode));
    expect(result.ok, JSON.stringify(result.errors)).toBe(true);
    expect(result.actualPower).toBeGreaterThanOrEqual(0);
    expect(result.actualPower).toBeLessThanOrEqual(1);
});

it.each(available)('$id produces finite sample-size and effect-size curves through its registered builder', config => {
    const result = runPowerAnalysis(config, config.power.buildInitialInputs({}, 'post_hoc'));
    for (const curveType of ['sample_size', 'effect_size']) {
        const curve = buildPowerCurveModel({ testConfig: config, result, curveType });
        expect(curve?.ok).toBe(true);
        expect(curve.points.length).toBeGreaterThan(1);
        expect(curve.points.every(point => Number.isFinite(point.x) && point.power >= 0 && point.power <= 1)).toBe(true);
    }
});

it('keeps explicit solver callbacks and reports unavailable or failing solvers', () => {
    const inputs = { sampleSize: 20 };
    expect(runPowerAnalysis({ power: { status: 'available', solver: values => ({ ok: true, ...values }) } }, inputs)).toEqual({ ok: true, sampleSize: 20 });
    expect(runPowerAnalysis({ label: 'Unknown', power: { status: 'available', solver: 'missing' } }, inputs)).toMatchObject({ ok: false, planned: true });
    expect(runPowerAnalysis({ power: { status: 'available', solver: () => { throw new Error('Unavailable'); } } }, inputs)).toMatchObject({ ok: false, errors: ['Unavailable'] });
});
