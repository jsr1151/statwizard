import { solveOneSampleZPower } from './solvers/oneSampleZ.js';
import { solveOneSampleTPower } from './solvers/oneSampleT.js';
import { solvePairedTPower } from './solvers/pairedT.js';
import { solveIndependentTPower } from './solvers/independentT.js';
import { solveOneWayAnovaPower } from './solvers/oneWayAnova.js';
import { solveAncovaPower } from './solvers/ancova.js';
import { solvePearsonCorrelationPower, buildPearsonCorrelationCurveModel } from './solvers/pearsonCorrelation.js';
import { solveSimpleLinearRegressionPower, buildSimpleLinearRegressionCurveModel } from './solvers/simpleLinearRegression.js';
import { solveMultipleRegressionPower, buildMultipleRegressionCurveModel } from './solvers/multipleRegression.js';

// Keep implementations behind the power UI's lazy boundary. Route metadata
// references these keys without importing numerical solvers at startup.
const SOLVERS = {
    one_sample_z: solveOneSampleZPower,
    one_sample_t: solveOneSampleTPower,
    paired_t: solvePairedTPower,
    independent_t: solveIndependentTPower,
    one_way_anova: solveOneWayAnovaPower,
    ancova: solveAncovaPower,
    pearson_correlation: solvePearsonCorrelationPower,
    simple_linear_regression: solveSimpleLinearRegressionPower,
    multiple_regression: solveMultipleRegressionPower,
};

const CURVE_BUILDERS = {
    pearson_correlation: buildPearsonCorrelationCurveModel,
    simple_linear_regression: buildSimpleLinearRegressionCurveModel,
    multiple_regression: buildMultipleRegressionCurveModel,
};

const resolve = (registry, value) => typeof value === 'function'
    ? value
    : Object.hasOwn(registry, value) ? registry[value] : null;

export const resolvePowerSolver = value => resolve(SOLVERS, value);
export const resolvePowerCurveBuilder = value => resolve(CURVE_BUILDERS, value);
