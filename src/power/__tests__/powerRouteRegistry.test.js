import { describe, expect, it } from "vitest";
import { POWER_ROUTE_BY_STEP_ID } from "../powerRouteRegistry.js";
import { POWER_TEST_BY_STEP_ID } from "../testRegistry.js";

describe("power route registry", () => {
  it("matches every full-registry route and implemented mode", () => {
    expect(Object.keys(POWER_ROUTE_BY_STEP_ID).sort()).toEqual(
      Object.keys(POWER_TEST_BY_STEP_ID).sort(),
    );

    Object.entries(POWER_ROUTE_BY_STEP_ID).forEach(([stepId, routeConfig]) => {
      expect(routeConfig.implementedPowerModes).toEqual(
        POWER_TEST_BY_STEP_ID[stepId].power.implementedPowerModes,
      );
    });
  });
});
