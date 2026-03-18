import { normalCDF } from '../utils/mathHelpers.js';

export { normalCDF };

// Acklam inverse normal approximation.
export const inverseNormalCDF = (p) => {
    if (p <= 0 || p >= 1) {
        throw new Error('Probability must be between 0 and 1.');
    }

    const a = [
        -3.969683028665376e+01,
        2.209460984245205e+02,
        -2.759285104469687e+02,
        1.38357751867269e+02,
        -3.066479806614716e+01,
        2.506628277459239e+00,
    ];
    const b = [
        -5.447609879822406e+01,
        1.615858368580409e+02,
        -1.556989798598866e+02,
        6.680131188771972e+01,
        -1.328068155288572e+01,
    ];
    const c = [
        -7.784894002430293e-03,
        -3.223964580411365e-01,
        -2.400758277161838e+00,
        -2.549732539343734e+00,
        4.374664141464968e+00,
        2.938163982698783e+00,
    ];
    const d = [
        7.784695709041462e-03,
        3.224671290700398e-01,
        2.445134137142996e+00,
        3.754408661907416e+00,
    ];

    const low = 0.02425;
    const high = 1 - low;

    if (p < low) {
        const q = Math.sqrt(-2 * Math.log(p));
        return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
            ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
    }

    if (p > high) {
        const q = Math.sqrt(-2 * Math.log(1 - p));
        return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
            ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
    }

    const q = p - 0.5;
    const r = q * q;
    return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q /
        (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
};

export const roundTo = (value, decimals = 3) => {
    const factor = 10 ** decimals;
    return Math.round(value * factor) / factor;
};

export const clampProbability = (value) => Math.min(1, Math.max(0, value));

export const logGamma = (z) => {
    if (z < 0.5) {
        return Math.log(Math.PI) - Math.log(Math.sin(Math.PI * z)) - logGamma(1 - z);
    }

    const coefficients = [
        0.9999999999998099,
        676.5203681218851,
        -1259.1392167224028,
        771.3234287776531,
        -176.6150291621406,
        12.507343278686905,
        -0.13857109526572012,
        9.984369578019572e-6,
        1.5056327351493116e-7,
    ];

    let x = coefficients[0];
    const shifted = z - 1;

    for (let i = 1; i < coefficients.length; i += 1) {
        x += coefficients[i] / (shifted + i);
    }

    const t = shifted + coefficients.length - 1.5;
    return 0.5 * Math.log(2 * Math.PI) + (shifted + 0.5) * Math.log(t) - t + Math.log(x);
};

const betaContinuedFraction = (x, a, b) => {
    const maxIterations = 200;
    const epsilon = 3e-7;
    const minimum = 1e-30;
    const qab = a + b;
    const qap = a + 1;
    const qam = a - 1;
    let c = 1;
    let d = 1 - (qab * x) / qap;

    if (Math.abs(d) < minimum) {
        d = minimum;
    }

    d = 1 / d;
    let h = d;

    for (let m = 1; m <= maxIterations; m += 1) {
        const m2 = 2 * m;
        let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2));
        d = 1 + aa * d;

        if (Math.abs(d) < minimum) {
            d = minimum;
        }

        c = 1 + aa / c;
        if (Math.abs(c) < minimum) {
            c = minimum;
        }

        d = 1 / d;
        h *= d * c;

        aa = -((a + m) * (qab + m) * x) / ((a + m2) * (qap + m2));
        d = 1 + aa * d;

        if (Math.abs(d) < minimum) {
            d = minimum;
        }

        c = 1 + aa / c;
        if (Math.abs(c) < minimum) {
            c = minimum;
        }

        d = 1 / d;
        const delta = d * c;
        h *= delta;

        if (Math.abs(delta - 1) < epsilon) {
            break;
        }
    }

    return h;
};

export const regularizedIncompleteBeta = (x, a, b) => {
    if (x <= 0) {
        return 0;
    }

    if (x >= 1) {
        return 1;
    }

    const logBeta = logGamma(a) + logGamma(b) - logGamma(a + b);
    const front = Math.exp(a * Math.log(x) + b * Math.log(1 - x) - logBeta);

    if (x < (a + 1) / (a + b + 2)) {
        return front * betaContinuedFraction(x, a, b) / a;
    }

    return 1 - front * betaContinuedFraction(1 - x, b, a) / b;
};

export const solveByBinarySearch = ({ low, high, tolerance = 1e-6, maxIterations = 80, predicate }) => {
    let left = low;
    let right = high;

    for (let i = 0; i < maxIterations; i += 1) {
        const mid = (left + right) / 2;
        const ok = predicate(mid);

        if (right - left <= tolerance) {
            return mid;
        }

        if (ok) {
            right = mid;
        } else {
            left = mid;
        }
    }

    return (left + right) / 2;
};

export const normalPowerFromShift = ({ criticalValue, noncentrality, tails, direction }) => {
    if (tails === 2) {
        return 1 - normalCDF(criticalValue - noncentrality) + normalCDF(-criticalValue - noncentrality);
    }

    if (direction === 'less') {
        return normalCDF(noncentrality - criticalValue);
    }

    return 1 - normalCDF(criticalValue - noncentrality);
};
