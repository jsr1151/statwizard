export const ANCOVA_TUTOR_SCRIPTS = [
    {
        id: 'ancova_intro',
        type: 'guide',
        priority: 10,
        title: 'Welcome to ANCOVA',
        body: 'ANCOVA (Analysis of Covariance) lets you compare group means while statistically controlling for a continuous covariate. Start by entering your paired X (Covariate) and Y (Outcome) data.',
        condition: (state) => state.idleTime > 3 && !state.hasInteracted,
        actions: [{ id: 'dismiss_permanent', label: 'Got it' }]
    },
    {
        id: 'slopes_violation_found',
        type: 'warning',
        priority: 100,
        title: 'Slopes Assumption Violated',
        body: 'The Group × Covariate interaction is significant, meaning the groups have different regression slopes. Standard ANCOVA assumes parallel slopes. You should proceed with caution or use a different model.',
        condition: (state) => state.results?.ready && state.results.pInt < state.results.alpha,
        actions: [{ id: 'dismiss_session', label: 'I understand' }]
    },
    {
        id: 'covariate_effect_significant',
        type: 'success',
        priority: 50,
        title: 'Covariate is Effective',
        body: 'Your covariate has a significant effect on the outcome. Controlling for it was a good choice, as it reduces error variance and improves the power of your group comparisons!',
        condition: (state) => state.results?.ready && state.results.pCov < state.results.alpha && state.results.pInt > state.results.alpha,
        actions: [{ id: 'dismiss_permanent', label: 'Great' }]
    }
];
