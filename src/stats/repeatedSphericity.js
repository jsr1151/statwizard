import { logGamma } from '../power/math.js';

// Upper regularized gamma: series below a+1, continued fraction above it.
function gammaUpper(a, x) {
    if (x <= 0) return 1;
    const factor = Math.exp(a * Math.log(x) - x - logGamma(a));
    if (x < a + 1) {
        let term = 1 / a, sum = term;
        for (let i = 1; i < 1000; i++) {
            term *= x / (a + i); sum += term;
            if (Math.abs(term) < Math.abs(sum) * 1e-14) break;
        }
        return Math.max(0, Math.min(1, 1 - factor * sum));
    }
    let b = x + 1 - a, c = 1e300, d = 1 / b, h = d;
    for (let i = 1; i < 1000; i++) {
        const coefficient = -i * (i - a);
        b += 2; d = coefficient * d + b; c = b + coefficient / c;
        if (Math.abs(d) < 1e-300) d = 1e-300;
        if (Math.abs(c) < 1e-300) c = 1e-300;
        d = 1 / d;
        const delta = d * c; h *= delta;
        if (Math.abs(delta - 1) < 1e-14) break;
    }
    return Math.max(0, Math.min(1, factor * h));
}

function logDeterminant(matrix) {
    const n = matrix.length;
    const lower = Array.from({ length: n }, () => Array(n).fill(0));
    const scale = Math.max(...matrix.map((row, i) => row[i]));
    let logDet = 0;
    for (let i = 0; i < n; i++) for (let j = 0; j <= i; j++) {
        let value = matrix[i][j];
        for (let k = 0; k < j; k++) value -= lower[i][k] * lower[j][k];
        if (i === j) {
            if (value <= scale * 1e-12) return null;
            lower[i][j] = Math.sqrt(value); logDet += Math.log(value);
        } else lower[i][j] = value / lower[j][j];
    }
    return logDet;
}

export function repeatedSphericity(matrix) {
    const n = matrix.length, k = matrix[0].length, q = k - 1;
    if (q === 1) return { gg: 1, hf: 1, lowerBound: 1, mauchly: { available: false, reason: 'Sphericity is automatic with two conditions.' } };
    // Orthonormal Helmert contrasts remove participant-level offsets.
    const contrasts = matrix.map(row => Array.from({ length: q }, (_, j) => {
        let sum = 0;
        for (let i = 0; i <= j; i++) sum += row[i] - row[j + 1];
        return sum / Math.sqrt((j + 1) * (j + 2));
    }));
    const means = Array.from({ length: q }, (_, j) => contrasts.reduce((sum, row) => sum + row[j], 0) / n);
    const covariance = Array.from({ length: q }, (_, i) => Array.from({ length: q }, (_, j) => contrasts.reduce((sum, row) => sum + (row[i] - means[i]) * (row[j] - means[j]), 0) / (n - 1)));
    const trace = covariance.reduce((sum, row, i) => sum + row[i], 0);
    const squareTrace = covariance.reduce((sum, row) => sum + row.reduce((total, value) => total + value * value, 0), 0);
    const gg = Math.max(1 / q, Math.min(1, trace * trace / (q * squareTrace)));
    const denominator = q * (n - 1 - q * gg);
    const hf = denominator <= 1e-12 ? 1 : Math.max(gg, Math.min(1, (n * q * gg - 2) / denominator));
    const logDet = n >= k ? logDeterminant(covariance) : null;
    let mauchly = { available: false, reason: 'The contrast covariance is singular or too few complete participants are available. Mauchly’s test is not estimable; this is not evidence for sphericity.' };
    if (logDet !== null) {
        const logW = Math.min(0, logDet - q * Math.log(trace / q));
        const residualDf = n - 1;
        const rho = 1 - (2 * q * q + q + 2) / (6 * q * residualDf);
        const statistic = -residualDf * rho * logW;
        const df = q * (q + 1) / 2 - 1;
        // Second-order chi-square approximation, matching stats::mauchly.test.
        const weight = (q + 2) * (q - 1) * (q - 2) * (2 * q ** 3 + 6 * q ** 2 + 3 * k + 2) / (288 * (residualDf * q * rho) ** 2);
        const p1 = gammaUpper(df / 2, statistic / 2);
        const p2 = gammaUpper((df + 4) / 2, statistic / 2);
        mauchly = { available: true, w: Math.exp(logW), statistic, df, p: Math.max(0, Math.min(1, p1 + weight * (p2 - p1))) };
    }
    return { gg, hf, lowerBound: 1 / q, mauchly };
}
