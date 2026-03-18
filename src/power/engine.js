export const runPowerAnalysis = (testConfig, inputs) => {
    const powerConfig = testConfig?.power;

    if (!powerConfig) {
        return {
            ok: false,
            errors: ['Power analysis is not configured for this test yet.'],
        };
    }

    if (powerConfig.status !== 'available' || typeof powerConfig.solver !== 'function') {
        return {
            ok: false,
            planned: true,
            errors: [
                `${testConfig.label} is registered for the shared power-analysis system, but its solver is not wired up yet.`,
            ],
        };
    }

    try {
        return powerConfig.solver(inputs);
    } catch (error) {
        return {
            ok: false,
            errors: [error?.message || 'Power analysis failed to run.'],
        };
    }
};
