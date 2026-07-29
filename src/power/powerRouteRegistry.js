export const IMPLEMENTED_POWER_MODES = Object.freeze([
  "a_priori",
  "post_hoc",
  "sensitivity",
]);

const POWER_STEP_IDS = [
  "res_ztest",
  "res_onesample_ttest",
  "res_paired_ttest",
  "res_indep_ttest",
  "res_one_way_anova",
  "res_ancova",
  "regression_result",
  "correlation_result",
];

export const POWER_ROUTE_BY_STEP_ID = Object.freeze(
  Object.fromEntries(
    POWER_STEP_IDS.map((stepId) => [
      stepId,
      Object.freeze({
        stepId,
        implementedPowerModes: IMPLEMENTED_POWER_MODES,
      }),
    ]),
  ),
);
