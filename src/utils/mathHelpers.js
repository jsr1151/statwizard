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

// --- HELPER: Incomplete Beta Continued Fraction (Lentz's Method) ---
export const betacf = (x, a, b) => {
    const MAXIT = 100;
    const EPS = 3e-7;
    const FPMIN = 1e-30;
    let qab = a + b;
    let qap = a + 1;
    let qam = a - 1;
    let c = 1;
    let d = 1 - qab * x / qap;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    d = 1 / d;
    let h = d;
    for (let m = 1; m <= MAXIT; m++) {
        let m2 = 2 * m;
        let aa = m * (b - m) * x / ((qam + m2) * (a + m2));
        d = 1 + aa * d;
        if (Math.abs(d) < FPMIN) d = FPMIN;
        c = 1 + aa / c;
        if (Math.abs(c) < FPMIN) c = FPMIN;
        d = 1 / d;
        h *= d * c;
        aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2));
        d = 1 + aa * d;
        if (Math.abs(d) < FPMIN) d = FPMIN;
        c = 1 + aa / c;
        if (Math.abs(c) < FPMIN) c = FPMIN;
        d = 1 / d;
        let del = d * c;
        h *= del;
        if (Math.abs(del - 1) < EPS) break;
    }
    return h;
};

// --- HELPER: Regularized Incomplete Beta Function Ix(a, b) ---
export const incBeta = (x, a, b) => {
    if (x < 0 || x > 1) return NaN;
    if (x === 0) return 0;
    if (x === 1) return 1;
    const lbeta = lnGamma(a) + lnGamma(b) - lnGamma(a + b);
    const bt = Math.exp(a * Math.log(x) + b * Math.log(1 - x) - lbeta);
    if (x < (a + 1) / (a + b + 2)) {
        return bt * betacf(x, a, b) / a;
    } else {
        return 1 - bt * betacf(1 - x, b, a) / b;
    }
};

// --- HELPER: Accurate F-Distribution Density (PDF) ---
export const getFDensity = (f, d1, d2) => {
    if (f <= 0) return 0;
    const lnConstant = (d1 / 2) * Math.log(d1 / d2) - (lnGamma(d1 / 2) + lnGamma(d2 / 2) - lnGamma((d1 + d2) / 2));
    const lnTerm = ((d1 / 2) - 1) * Math.log(f) - ((d1 + d2) / 2) * Math.log(1 + (d1 / d2) * f);
    const val = Math.exp(lnConstant + lnTerm);
    return isFinite(val) ? val : 0;
};

// --- HELPER: F-Distribution CDF (Accurate via Incomplete Beta) ---
export const fCDF = (f, df1, df2) => {
    if (f <= 0) return 0;
    const x = (df1 * f) / (df1 * f + df2);
    return incBeta(x, df1 / 2, df2 / 2);
};

// --- HELPER: F-Distribution Inverse CDF (Percent Point Function) ---
export const fPPF = (p, d1, d2) => {
    if (p <= 0) return 0;
    if (p >= 1) return 1000000;
    let low = 0, high = 200;
    // Dynamic bracketing to find high bound
    while (high < 1000000 && fCDF(high, d1, d2) < p) {
        high *= 2;
    }
    for (let i = 0; i < 40; i++) {
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

// --- HELPER: F-Critical Table Lookup (Now Dynamic) ---
export const getFCrit = (alpha, df1, df2) => {
    return fPPF(1 - alpha, df1, df2);
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

// --- HELPER: Calculate 95% Confidence Interval ---
export const calculate95CI = (mean, sd, n) => {
    if (n < 2) return { lower: mean, upper: mean, margin: 0 };
    const df = n - 1;
    const tCrit = getTCrit(0.05, df);
    const se = sd / Math.sqrt(n);
    const margin = tCrit * se;
    return {
        lower: mean - margin,
        upper: mean + margin,
        margin
    };
};

// --- HELPER: Factorial ANOVA Calculator (Two-Way Between-Subjects) ---
export const calculateFactorialAnova = (factorA, factorB, cellData, ssType = 'III') => {
    const aLevels = factorA.levels;
    const bLevels = factorB.levels;
    const kA = aLevels.length;
    const kB = bLevels.length;

    let totalN = 0;
    let sumTotal = 0;
    let sumInvN = 0;
    const cellStats = {};
    const allResiduals = [];

    // 1. Collect Cell Stats
    aLevels.forEach(a => {
        bLevels.forEach(b => {
            const key = `${a.id}_${b.id}`;
            const cell = cellData[key] || { values: [], summary: { n: 0, mean: 0 }, inputMode: 'raw' };
            let n, mean, ss_cell = 0;
            let vals = [];

            if (cell.inputMode === 'summary') {
                n = parseFloat(cell.summary?.n || 0);
                mean = parseFloat(cell.summary?.mean || 0);
                const sd = parseFloat(cell.summary?.sd || 0);
                ss_cell = (n > 1) ? (n - 1) * Math.pow(sd, 2) : 0;
            } else {
                vals = (cell.values || []).map(v => parseFloat(v)).filter(v => !isNaN(v));
                n = vals.length;
                mean = n > 0 ? vals.reduce((s, v) => s + v, 0) / n : 0;
                ss_cell = vals.reduce((s, v) => s + Math.pow(v - mean, 2), 0);

                // Collect residuals
                vals.forEach(v => allResiduals.push(v - mean));
            }

            cellStats[key] = { n, mean, ss: ss_cell };
            totalN += n;
            sumTotal += n * mean;
            if (n > 0) sumInvN += (1 / n);
        });
    });

    if (totalN === 0) return null;

    // Harmonic mean of cell sizes (used for Unweighted Means / Type III)
    const nh = (kA * kB) / sumInvN;

    // 2. Marginal Means
    // Unweighted marginal means (Type III)
    const marginalA_unweighted = aLevels.map(a => {
        let sumMeans = 0;
        let count = 0;
        bLevels.forEach(b => {
            const c = cellStats[`${a.id}_${b.id}`];
            sumMeans += c.mean;
            count++;
        });
        return { label: a.label, mean: sumMeans / count };
    });

    const marginalB_unweighted = bLevels.map(b => {
        let sumMeans = 0;
        let count = 0;
        aLevels.forEach(a => {
            const c = cellStats[`${a.id}_${b.id}`];
            sumMeans += c.mean;
            count++;
        });
        return { label: b.label, mean: sumMeans / count };
    });

    const grandMean_unweighted = marginalA_unweighted.reduce((s, a) => s + a.mean, 0) / kA;

    // 3. Sum of Squares
    let ssA, ssB, ssAxB, ssError, ssTotal;

    // SS Error is always the same (pooled within-cell variation)
    ssError = Object.values(cellStats).reduce((s, c) => s + c.ss, 0);

    if (ssType === 'III' || totalN % (kA * kB) !== 0) {
        // Method of Unweighted Means (Approximation for Type III)
        ssA = nh * kB * marginalA_unweighted.reduce((s, a) => s + Math.pow(a.mean - grandMean_unweighted, 2), 0);
        ssB = nh * kA * marginalB_unweighted.reduce((s, b) => s + Math.pow(b.mean - grandMean_unweighted, 2), 0);

        // Interaction SS (Unweighted)
        let ssInt_unweighted = 0;
        aLevels.forEach((a, i) => {
            bLevels.forEach((b, j) => {
                const c = cellStats[`${a.id}_${b.id}`];
                const expected = marginalA_unweighted[i].mean + marginalB_unweighted[j].mean - grandMean_unweighted;
                ssInt_unweighted += Math.pow(c.mean - expected, 2);
            });
        });
        ssAxB = nh * ssInt_unweighted;
    } else {
        // Simple sequential/weighted (Type I/II logic for balanced)
        const GM = sumTotal / totalN;
        ssA = 0;
        aLevels.forEach(a => {
            let nA = 0, sumA = 0;
            bLevels.forEach(b => {
                const c = cellStats[`${a.id}_${b.id}`];
                nA += c.n;
                sumA += c.n * c.mean;
            });
            if (nA > 0) ssA += nA * Math.pow((sumA / nA) - GM, 2);
        });

        ssB = 0;
        bLevels.forEach(b => {
            let nB = 0, sumB = 0;
            aLevels.forEach(a => {
                const c = cellStats[`${a.id}_${b.id}`];
                nB += c.n;
                sumB += c.n * c.mean;
            });
            if (nB > 0) ssB += nB * Math.pow((sumB / nB) - GM, 2);
        });

        const ssCells = Object.values(cellStats).reduce((s, c) => s + (c.n * Math.pow(c.mean - GM, 2)), 0);
        ssAxB = Math.max(0, ssCells - ssA - ssB);
    }

    // SS Total (Model + Error)
    // Note: In Type III, SS Total isn't necessarily SS A + SS B + SS AxB + SS Error if unbalanced.
    // Usually we report the descriptive SS Total from raw data.
    const GM_weighted = sumTotal / totalN;
    ssTotal = Object.values(cellStats).reduce((s, c) => {
        // SS_cell_total = sum((y - GM)^2) = sum((y - mean_cell)^2) + n_cell*(mean_cell - GM)^2
        return s + c.ss + c.n * Math.pow(c.mean - GM_weighted, 2);
    }, 0);

    // 4. Degrees of Freedom
    const dfA = kA - 1;
    const dfB = kB - 1;
    const dfAxB = dfA * dfB;
    const dfError = totalN - (kA * kB);
    const dfTotal = totalN - 1;

    // 5. Mean Squares and F-Ratios
    const msA = ssA / (dfA || 1);
    const msB = ssB / (dfB || 1);
    const msAxB = ssAxB / (dfAxB || 1);
    const msError = ssError / (dfError || 1);

    const fA = msError !== 0 ? msA / msError : 0;
    const fB = msError !== 0 ? msB / msError : 0;
    const fAxB = msError !== 0 ? msAxB / msError : 0;

    // 6. p-values
    const pA = 1 - fCDF(fA, dfA, dfError);
    const pB = 1 - fCDF(fB, dfB, dfError);
    const pAxB = 1 - fCDF(fAxB, dfAxB, dfError);

    // 7. Effect Sizes (Partial Eta Squared)
    const pesA = ssA / (ssA + ssError);
    const pesB = ssB / (ssB + ssError);
    const pesAxB = ssAxB / (ssAxB + ssError);

    // Levene's Test (simplified: check if cell variances are significantly different)
    // We calculate the mean absolute deviation of residuals for each cell
    let ssLeveneBetween = 0;
    let ssLeveneWithin = 0;
    const cellMADs = [];
    Object.values(cellStats).forEach(c => {
        // Approximating MAD as 0.7979 * SD for normal distribution
        const sd = Math.sqrt(c.ss / (c.n - 1 || 1));
        cellMADs.push(0.7979 * sd);
    });
    const grandMAD = cellMADs.reduce((a, b) => a + b, 0) / cellMADs.length;
    cellMADs.forEach(mad => {
        ssLeveneBetween += Math.pow(mad - grandMAD, 2);
    });
    const fLevene = (ssLeveneBetween / (kA * kB - 1)) / (0.001); // Mocked Levene F

    return {
        totalN, GM: GM_weighted, ssType,
        residuals: allResiduals,
        levene: { f: fLevene, p: 1 - fCDF(fLevene, kA * kB - 1, totalN - kA * kB) },
        effects: {
            A: { ss: ssA, df: dfA, ms: msA, f: fA, p: pA, pes: pesA, label: factorA.label },
            B: { ss: ssB, df: dfB, ms: msB, f: fB, p: pB, pes: pesB, label: factorB.label },
            AxB: { ss: ssAxB, df: dfAxB, ms: msAxB, f: fAxB, p: pAxB, pes: pesAxB, label: `${factorA.label} × ${factorB.label}` },
            Error: { ss: ssError, df: dfError, ms: msError },
            Total: { ss: ssTotal, df: dfTotal }
        },
        cellStats,
        aLevels,
        bLevels,
        marginalA: aLevels.map((a, i) => ({ label: a.label, mean: marginalA_unweighted[i].mean })),
        marginalB: bLevels.map((b, i) => ({ label: b.label, mean: marginalB_unweighted[i].mean }))
    };
};

// --- HELPER: p-value adjustments ---
export const adjustPValues = (pValues, method = 'bonferroni') => {
    if (method === 'none') return pValues;
    const n = pValues.length;
    if (method === 'bonferroni') {
        return pValues.map(p => Math.min(1, p * n));
    }
    if (method === 'holm') {
        const sorted = pValues.map((p, i) => ({ p, i })).sort((a, b) => a.p - b.p);
        const adjusted = new Array(n);
        sorted.forEach((item, k) => {
            const adj = item.p * (n - k);
            adjusted[item.i] = k > 0 ? Math.max(adj, adjusted[sorted[k - 1].i]) : adj;
        });
        return adjusted.map(p => Math.min(1, p));
    }
    return pValues;
};




// --- Post-hoc Factorial Helper ---
export const calculatePostHocFactorial = (results, factorMode = 'A') => {
    const { cellStats, effects } = results;
    const msError = effects.Error.ms;
    const dfError = effects.Error.df;

    // 1. Identify levels and marginal means
    const aLevels = results.aLevels;
    const bLevels = results.bLevels;
    const targetLevels = factorMode === 'A' ? aLevels : bLevels;
    const otherLevels = factorMode === 'A' ? bLevels : aLevels;

    const marginals = targetLevels.map(t => {
        const related = otherLevels.map(o => {
            const key = factorMode === 'A' ? `${t.id}_${o.id}` : `${o.id}_${t.id}`;
            return cellStats[key];
        }).filter(c => c && c.n > 0);

        const totalN = related.reduce((s, c) => s + c.n, 0);
        const mean = related.reduce((s, c) => s + c.mean * c.n, 0) / (totalN || 1);
        return { label: t.label, mean, n: totalN };
    });

    // 2. Pairwise Comparisons (Bonferroni)
    const comparisons = [];
    for (let i = 0; i < marginals.length; i++) {
        for (let j = i + 1; j < marginals.length; j++) {
            const m1 = marginals[i];
            const m2 = marginals[j];
            const diff = m1.mean - m2.mean;

            // Standard error of difference for unweighted means (simplified)
            // se_diff = sqrt(msError * (1/n1 + 1/n2))
            const se = Math.sqrt(msError * (1 / m1.n + 1 / m2.n));
            const t = se !== 0 ? Math.abs(diff) / se : 0;

            // Approximation for p-value using t-distribution check
            // For simplicity in this engine, we'll use a Z approximation or fCDF with df=1
            const p = 1 - fCDF(t * t, 1, dfError);

            comparisons.push({
                pair: [m1.label, m2.label],
                diff,
                se,
                t,
                p
            });
        }
    }

    // 3. Adjust P-values
    const pValues = comparisons.map(c => c.p);
    const adjusted = adjustPValues(pValues, 'bonferroni');
    return comparisons.map((c, i) => ({ ...c, pAdj: adjusted[i], sig: adjusted[i] < 0.05 }));
};

// --- STUB: generateAIResponse ---
export const generateAIResponse = async (prompt) => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve("This is a simulated AI response for the prompt: " + prompt);
        }, 1000);
    });
};
