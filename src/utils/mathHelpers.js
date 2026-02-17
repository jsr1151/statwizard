// --- Statistical Math Utility Functions ---

// --- HELPER: Gaussian Generator ---
export const getGaussianPoints = (mean, stdDev, heightScale = 120, width = 300) => {
    const points = [];
    for (let x = -20; x <= width + 20; x += 2) {
        const z = (x - mean) / stdDev;
        const y = heightScale * Math.exp(-0.5 * Math.pow(z, 2));
        points.push([x, 150 - y]);
    }
    return points;
};

// --- HELPER: T-Distribution PDF approximation ---
export const getTPoints = (mean, stdDev, df, heightScale = 120, width = 300) => {
    const points = [];
    for (let x = -20; x <= width + 20; x += 2) {
        const t = (x - mean) / stdDev;
        const y = heightScale * Math.pow(1 + (t * t) / df, -(df + 1) / 2);
        points.push([x, 150 - y]);
    }
    return points;
};

// Statistical utilities
export const erf = (x) => {
    const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741, a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;
    const sign = x < 0 ? -1 : 1;
    x = Math.abs(x);
    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
    return sign * y;
};

export const normalCDF = (x) => 0.5 * (1 + erf(x / Math.sqrt(2)));

// --- HELPER: T-CDF approximation ---
export const tCDF = (t, df) => {
    if (df > 100) return normalCDF(t);
    const x = t * (1 - 1 / (4 * df)) / Math.sqrt(1 + (t * t) / (2 * df));
    return normalCDF(x);
};

// --- HELPER: Log Gamma Function (Lanczos Approximation) ---
export const lnGamma = (z) => {
    if (z < 0.5) return Math.log(Math.PI / (Math.sin(Math.PI * z) * Math.exp(lnGamma(1 - z))));
    const g = 7;
    const p = [0.9999999999998099, 676.5203681218851, -1259.1392167224028,
        771.32342877765313, -176.61502916214059, 12.507343278686905,
        -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
    z -= 1;
    let x = p[0];
    for (let i = 1; i < g + 2; i++) x += p[i] / (z + i);
    const t = z + g + 0.5;
    return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x);
};

// --- HELPER: Beta Function using Log Gamma ---
export const beta = (x, y) => Math.exp(lnGamma(x) + lnGamma(y) - lnGamma(x + y));

// --- HELPER: Accurate F-Distribution Density (PDF) ---
export const getFDensity = (f, d1, d2) => {
    if (f <= 0) return 0;
    const lnConstant = (d1 / 2) * Math.log(d1 / d2) - (lnGamma(d1 / 2) + lnGamma(d2 / 2) - lnGamma((d1 + d2) / 2));
    const lnTerm = ((d1 / 2) - 1) * Math.log(f) - ((d1 + d2) / 2) * Math.log(1 + (d1 / d2) * f);
    const val = Math.exp(lnConstant + lnTerm);
    return isFinite(val) ? val : 0;
};

// --- HELPER: F-Distribution CDF (Approximate via Numerical Integration) ---
export const fCDF = (f, df1, df2) => {
    if (f <= 0) return 0;
    const n = Math.max(400, Math.ceil(f * 50));
    const h = f / n;
    let sum = getFDensity(1e-6, df1, df2) + getFDensity(f, df1, df2);
    for (let i = 1; i < n; i++) {
        const x = i * h;
        sum += (i % 2 === 0 ? 2 : 4) * getFDensity(x, df1, df2);
    }
    const result = (h / 3) * sum;
    return Math.min(1, Math.max(0, result));
};

// --- HELPER: F-Distribution Inverse CDF (Percent Point Function) ---
export const fPPF = (p, d1, d2) => {
    if (p <= 0) return 0;
    if (p >= 1) return 200;
    let low = 0, high = 200;
    for (let i = 0; i < 30; i++) {
        const mid = (low + high) / 2;
        if (fCDF(mid, d1, d2) < p) { low = mid; }
        else { high = mid; }
    }
    return low;
};

export const getTCrit = (alpha, df, tails = 2) => {
    if (df > 100) return tails === 2 ? (alpha === 0.05 ? 1.96 : 2.58) : (alpha === 0.05 ? 1.645 : 2.33);
    const tTable = {
        1: [12.71, 63.66], 2: [4.30, 9.93], 3: [3.18, 5.84], 4: [2.78, 4.60],
        5: [2.57, 4.03], 6: [2.45, 3.71], 7: [2.36, 3.50], 8: [2.31, 3.36],
        9: [2.26, 3.25], 10: [2.23, 3.17], 12: [2.18, 3.06], 15: [2.13, 2.95],
        20: [2.09, 2.85], 25: [2.06, 2.79], 30: [2.04, 2.75], 40: [2.02, 2.70],
        60: [2.00, 2.66], 100: [1.98, 2.63]
    };
    const col = alpha <= 0.01 ? 1 : 0;
    if (tTable[df]) return tails === 2 ? tTable[df][col] : tTable[df][col] * 0.8;
    const keys = Object.keys(tTable).map(Number).sort((a, b) => a - b);
    const closest = keys.reduce((prev, curr) => Math.abs(curr - df) < Math.abs(prev - df) ? curr : prev);
    return tails === 2 ? tTable[closest][col] : tTable[closest][col] * 0.8;
};

export const getFPoints = (df1, df2, heightScale = 40, width = 300, maxX = 6) => {
    const points = [];
    for (let i = 0; i <= 100; i++) {
        const f = (i / 100) * maxX;
        const y = getFDensity(f, df1, df2);
        const scaledY = isFinite(y) ? y * heightScale * 5 : 0;
        points.push([(f / maxX) * width, 150 - Math.min(scaledY, 140)]);
    }
    return points;
};

// --- HELPER: F-Critical Table Lookup ---
export const getFCrit = (alpha, df1, df2) => {
    if (alpha === 0.01) {
        if (df1 === 1) return df2 > 30 ? 7.56 : 9.33;
        if (df1 === 2) return df2 > 30 ? 5.39 : 6.51;
        return df2 > 30 ? 4.50 : 5.40;
    }
    if (alpha === 0.10) {
        if (df1 === 1) return df2 > 30 ? 2.89 : 3.10;
        if (df1 === 2) return df2 > 30 ? 2.49 : 2.60;
        return df2 > 30 ? 2.20 : 2.30;
    }
    if (df1 === 1) return df2 > 30 ? 4.15 : 4.30;
    if (df1 === 2) return df2 > 30 ? 3.32 : 3.50;
    if (df1 === 3) return df2 > 30 ? 2.92 : 3.10;
    return df2 > 30 ? 2.60 : 2.80;
};

// --- HELPER: ANOVA Calculator ---
export const calculateAnova = (groups) => {
    const activeGroups = groups.filter(g => {
        if (g.inputMode === 'summary') {
            return !isNaN(parseFloat(g.summary?.mean)) &&
                !isNaN(parseFloat(g.summary?.n)) &&
                parseFloat(g.summary?.n) > 0;
        }
        return g.values && g.values.length > 0;
    });

    if (activeGroups.length < 2) return null;

    let N = 0;
    let sumTotal = 0;
    let k = activeGroups.length;

    activeGroups.forEach(g => {
        if (g.inputMode === 'summary') {
            const n = parseFloat(g.summary.n);
            const m = parseFloat(g.summary.mean);
            N += n;
            sumTotal += n * m;
        } else {
            const n = g.values.length;
            const sum = g.values.reduce((a, b) => a + parseFloat(b || 0), 0);
            N += n;
            sumTotal += sum;
        }
    });

    if (N === 0) return null;
    const grandMean = sumTotal / N;

    let ssBetween = 0;
    let ssWithin = 0;

    activeGroups.forEach(g => {
        let n, mean, var_g;
        if (g.inputMode === 'summary') {
            n = parseFloat(g.summary.n);
            mean = parseFloat(g.summary.mean);
            const sd = parseFloat(g.summary.sd || 0);
            var_g = Math.pow(sd, 2);
        } else {
            n = g.values.length;
            const sum = g.values.reduce((a, b) => a + parseFloat(b || 0), 0);
            mean = sum / n;
            const ss_g = g.values.reduce((a, b) => a + Math.pow(parseFloat(b || 0) - mean, 2), 0);
            var_g = ss_g / (n - 1 || 1);
        }

        ssBetween += n * Math.pow(mean - grandMean, 2);
        ssWithin += (n > 1) ? (n - 1) * var_g : 0;
    });

    const dfB = k - 1;
    const dfW = N - k;
    const msB = ssBetween / (dfB || 1);
    const msW = ssWithin / (dfW || 1);
    const F = msW !== 0 ? msB / msW : 0;
    const eta2 = (ssBetween + ssWithin) !== 0 ? ssBetween / (ssBetween + ssWithin) : 0;

    const F_safe = isNaN(F) || !isFinite(F) ? 0 : F;
    const eta2_safe = isNaN(eta2) || !isFinite(eta2) ? 0 : eta2;

    const groupStats = activeGroups.map(g => {
        let n, mean;
        if (g.inputMode === 'summary') {
            n = parseFloat(g.summary.n);
            mean = parseFloat(g.summary.mean);
        } else {
            n = g.values.length;
            mean = g.values.reduce((a, b) => a + parseFloat(b || 0), 0) / n;
        }
        return { n, mean, label: g.label };
    });

    return {
        k, N, grandMean: grandMean || 0,
        ssB: ssBetween || 0, ssW: ssWithin || 0, ssT: (ssBetween + ssWithin) || 0,
        dfB, dfW, msB: msB || 0, msW: msW || 0,
        fVal: F_safe, eta2: eta2_safe,
        groupStats
    };
};

// --- HELPER: Post-Hoc Comparison (Tukey/Games-Howell) ---
export const calculatePostHoc = (groups, anovaResults) => {
    if (!anovaResults || anovaResults.k < 2) return [];
    const activeGroups = groups.filter(g => {
        if (g.inputMode === 'summary') return parseFloat(g.summary?.n) > 0;
        return g.values.length > 0;
    });

    const comparisons = [];
    const msW = anovaResults.msW;

    for (let i = 0; i < activeGroups.length; i++) {
        for (let j = i + 1; j < activeGroups.length; j++) {
            const g1 = activeGroups[i];
            const g2 = activeGroups[j];

            let m1, m2, n1, n2, sd1, sd2;
            if (g1.inputMode === 'summary') {
                m1 = parseFloat(g1.summary.mean);
                n1 = parseFloat(g1.summary.n);
                sd1 = parseFloat(g1.summary.sd);
            } else {
                n1 = g1.values.length;
                m1 = g1.values.reduce((a, b) => a + parseFloat(b || 0), 0) / n1;
                sd1 = Math.sqrt(g1.values.reduce((a, b) => a + Math.pow(parseFloat(b || 0) - m1, 2), 0) / (n1 - 1 || 1));
            }

            if (g2.inputMode === 'summary') {
                m2 = parseFloat(g2.summary.mean);
                n2 = parseFloat(g2.summary.n);
                sd2 = parseFloat(g2.summary.sd);
            } else {
                n2 = g2.values.length;
                m2 = g2.values.reduce((a, b) => a + parseFloat(b || 0), 0) / n2;
                sd2 = Math.sqrt(g2.values.reduce((a, b) => a + Math.pow(parseFloat(b || 0) - m2, 2), 0) / (n2 - 1 || 1));
            }

            const diff = Math.abs(m1 - m2);
            const tVal = diff / Math.sqrt(msW * (1 / n1 + 1 / n2));
            const df = (n1 + n2 - 2);

            const pObs = (1 - tCDF(tVal, df)) * 2;
            const numComparisons = (activeGroups.length * (activeGroups.length - 1)) / 2;
            const pAdj = Math.min(1, pObs * numComparisons);
            const sig = pAdj < 0.05;

            comparisons.push({
                pair: [g1.label, g2.label],
                diff,
                sig,
                pAdj,
                m1, m2, sd1, sd2
            });
        }
    }
    return comparisons;
};

// --- STUB: generateAIResponse ---
export const generateAIResponse = async (prompt) => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve("This is a simulated AI response for the prompt: " + prompt);
        }, 1000);
    });
};
