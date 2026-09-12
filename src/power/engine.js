import { resolvePowerSolver } from './solverRegistry.js';

export const runPowerAnalysis = (testConfig, inputs) => {
    const powerConfig = testConfig?.power;

    if (!powerConfig) {
        return {
            ok: false,
            errors: ['Power analysis is not configured for this test yet.'],
        };
    }

    const solver = resolvePowerSolver(powerConfig.solver);
    if (powerConfig.status !== 'available' || !solver) {
        return {
            ok: false,
            planned: true,
            errors: [
                `${testConfig.label} is registered for the shared power-analysis system, but its solver is not wired up yet.`,
            ],
        };
    }

    try {
        return solver(inputs);
    } catch (error) {
        return {
            ok: false,
            errors: [error?.message || 'Power analysis failed to run.'],
        };
    }
};
