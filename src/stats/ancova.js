import { centralFCDF } from '../power/fMath.js';

const upperTailFProbability = (statistic, numeratorDf, denominatorDf) => {
    if (!(numeratorDf > 0) || !(denominatorDf > 0)) return NaN;
    if (statistic === Number.POSITIVE_INFINITY) return 0;
    if (!(statistic > 0)) return 1;
    return Math.max(0, Math.min(1, 1 - centralFCDF(statistic, numeratorDf, denominatorDf)));
};

const safeRatio = (numerator, denominator) => {
    if (denominator > 0) return numerator / denominator;
    return numerator > 0 ? Number.POSITIVE_INFINITY : 0;
};

export const parseAncovaSeries = (raw = '') => String(raw)
    .split(/[,\s]+/)
    .filter(Boolean)
    .map(Number)
    .filter(Number.isFinite);

export const hydrateAncovaGroups = (groups = []) => groups.map((group) => ({
    ...group,
    xValues: parseAncovaSeries(group.xRaw),
    yValues: parseAncovaSeries(group.yRaw),
}));

export const calculateAncova = (groups = [], options = {}) => {
    const { adjustX = null, manualF = null, alpha = 0.05 } = options;
    const validGroups = groups.map((group) => {
        const n = Math.min(group.xValues?.length || 0, group.yValues?.length || 0);
        if (n < 2) return null;
        const xVals = group.xValues.slice(0, n).filter(Number.isFinite);
        const yVals = group.yValues.slice(0, n).filter(Number.isFinite);
        const pairedN = Math.min(xVals.length, yVals.length);
        if (pairedN < 2) return null;
        const pairedX = xVals.slice(0, pairedN);
        const pairedY = yVals.slice(0, pairedN);
        const sumX = pairedX.reduce((sum, value) => sum + value, 0);
        const sumY = pairedY.reduce((sum, value) => sum + value, 0);
        return {
            ...group,
            n: pairedN,
            xVals: pairedX,
            yVals: pairedY,
            sumX,
            sumY,
            mx: sumX / pairedN,
            my: sumY / pairedN,
        };
    }).filter(Boolean);

    const k = validGroups.length;
    if (k < 2) return { ready: false, reason: 'insufficient_groups' };

    const nTotal = validGroups.reduce((sum, group) => sum + group.n, 0);
    const grandMeanX = validGroups.reduce((sum, group) => sum + group.sumX, 0) / nTotal;
    const grandMeanY = validGroups.reduce((sum, group) => sum + group.sumY, 0) / nTotal;
    let totalSsY = 0;
    let totalSsX = 0;
    let totalCrossProduct = 0;
    let withinSsY = 0;
    let withinSsX = 0;
    let withinCrossProduct = 0;
    let separateSlopeSse = 0;
    let minimumX = Number.POSITIVE_INFINITY;
    let maximumX = Number.NEGATIVE_INFINITY;
    let minimumY = Number.POSITIVE_INFINITY;
    let maximumY = Number.NEGATIVE_INFINITY;

    validGroups.forEach((group) => {
        let groupSsX = 0;
        let groupSsY = 0;
        let groupCrossProduct = 0;

        for (let index = 0; index < group.n; index += 1) {
            const x = group.xVals[index];
            const y = group.yVals[index];
            minimumX = Math.min(minimumX, x);
            maximumX = Math.max(maximumX, x);
            minimumY = Math.min(minimumY, y);
            maximumY = Math.max(maximumY, y);

            const groupDx = x - group.mx;
            const groupDy = y - group.my;
            groupSsX += groupDx ** 2;
            groupSsY += groupDy ** 2;
            groupCrossProduct += groupDx * groupDy;

            const totalDx = x - grandMeanX;
            const totalDy = y - grandMeanY;
            totalSsX += totalDx ** 2;
            totalSsY += totalDy ** 2;
            totalCrossProduct += totalDx * totalDy;
        }

        group.ss_xj = groupSsX;
        group.sp_j = groupCrossProduct;
        group.b_j = groupSsX > 0 ? groupCrossProduct / groupSsX : 0;
        withinSsX += groupSsX;
        withinSsY += groupSsY;
        withinCrossProduct += groupCrossProduct;
        separateSlopeSse += groupSsX > 0
            ? groupSsY - ((groupCrossProduct ** 2) / groupSsX)
            : groupSsY;
    });

    const commonSlope = withinSsX > 0 ? withinCrossProduct / withinSsX : 0;
    const resolvedAdjustX = adjustX === null ? grandMeanX : adjustX;
    const commonSlopeSse = Math.max(0, withinSsY - (withinSsX > 0 ? (withinCrossProduct ** 2) / withinSsX : 0));
    const errorDf = nTotal - k - 1;
    if (errorDf <= 0) return { ready: false, reason: 'insufficient_error_df' };
    const commonMse = commonSlopeSse / errorDf;

    const covariateSs = withinSsX > 0 ? (withinCrossProduct ** 2) / withinSsX : 0;
    const covariateF = safeRatio(covariateSs, commonMse);
    const covariateP = upperTailFProbability(covariateF, 1, errorDf);
    const reducedCovariateOnlySse = totalSsY - (totalSsX > 0 ? (totalCrossProduct ** 2) / totalSsX : 0);
    const groupSs = Math.max(0, reducedCovariateOnlySse - commonSlopeSse);
    const groupDf = k - 1;
    const groupMs = groupSs / groupDf;
    const groupF = safeRatio(groupMs, commonMse);
    const groupP = upperTailFProbability(groupF, groupDf, errorDf);

    const resolvedSeparateSlopeSse = Math.max(0, separateSlopeSse);
    const interactionSs = Math.max(0, commonSlopeSse - resolvedSeparateSlopeSse);
    const interactionDf = k - 1;
    const separateErrorDf = nTotal - (2 * k);
    const separateMse = separateErrorDf > 0 ? resolvedSeparateSlopeSse / separateErrorDf : 0;
    const interactionMs = interactionSs / interactionDf;
    const interactionF = safeRatio(interactionMs, separateMse);
    const interactionP = upperTailFProbability(interactionF, interactionDf, separateErrorDf);
    const xPadding = (maximumX - minimumX) * 0.1 || 1;
    const yPadding = (maximumY - minimumY) * 0.1 || 1;

    const adjustedMeans = validGroups.map((group) => {
        const leverage = withinSsX > 0 ? ((group.mx - grandMeanX) ** 2) / withinSsX : 0;
        const se = Math.sqrt(commonMse * ((1 / group.n) + leverage));
        const adjustedMean = group.my - (commonSlope * (group.mx - resolvedAdjustX));
        const residualSumOfSquares = group.yVals.reduce((sum, y, index) => {
            const fitted = group.my + (commonSlope * (group.xVals[index] - group.mx));
            return sum + ((y - fitted) ** 2);
        }, 0);

        return {
            id: group.id,
            label: group.label,
            color: group.color,
            mx: group.mx,
            my: group.my,
            adjM: adjustedMean,
            b_j: group.b_j,
            se,
            ciLow: adjustedMean - (1.96 * se),
            ciHigh: adjustedMean + (1.96 * se),
            residualVariance: group.n > 1 ? residualSumOfSquares / (group.n - 1) : NaN,
        };
    });

    return {
        ready: true,
        nTotal,
        k,
        grandMeanX,
        grandMeanY,
        b_w: commonSlope,
        SSgrp: groupSs,
        dfGrp: groupDf,
        MSgrp: groupMs,
        Fgrp: groupF,
        pGrp: groupP,
        pes_grp: safeRatio(groupSs, groupSs + commonSlopeSse),
        SScov: covariateSs,
        dfCov: 1,
        MScov: covariateSs,
        Fcov: covariateF,
        pCov: covariateP,
        pes_cov: safeRatio(covariateSs, covariateSs + commonSlopeSse),
        SSint: interactionSs,
        dfInt: interactionDf,
        MSint: interactionMs,
        Fint: interactionF,
        pInt: interactionP,
        pes_int: safeRatio(interactionSs, interactionSs + resolvedSeparateSlopeSse),
        SSE_common: commonSlopeSse,
        dfE_common: errorDf,
        MSE_common: commonMse,
        SSE_separate: resolvedSeparateSlopeSse,
        dfE_separate: separateErrorDf,
        MSE_separate: separateMse,
        adjustedMeans,
        validGroups,
        alpha,
        pMinX: minimumX - xPadding,
        pMaxX: maximumX + xPadding,
        pMinY: minimumY - yPadding,
        pMaxY: maximumY + yPadding,
        adjustX: resolvedAdjustX,
        dfB: groupDf,
        dfW: errorDf,
        msB: groupMs,
        msW: commonMse,
        ssB: groupSs,
        ssW: commonSlopeSse,
        ssT_y: totalSsY,
        ssW_x: withinSsX,
        fVal: manualF ?? groupF,
        F: manualF ?? groupF,
    };
};

export const calculateAncovaPairwiseComparisons = (stats) => {
    if (!stats?.ready) return [];
    const comparisons = [];

    stats.adjustedMeans.forEach((first, firstIndex) => {
        stats.adjustedMeans.slice(firstIndex + 1).forEach((second, offset) => {
            const secondIndex = firstIndex + offset + 1;
            const firstGroup = stats.validGroups[firstIndex];
            const secondGroup = stats.validGroups[secondIndex];
            const covariateTerm = stats.ssW_x > 0
                ? ((firstGroup.mx - secondGroup.mx) ** 2) / stats.ssW_x
                : 0;
            const standardError = Math.sqrt(stats.MSE_common * (
                (1 / firstGroup.n) + (1 / secondGroup.n) + covariateTerm
            ));
            const difference = first.adjM - second.adjM;
            const t = standardError > 0
                ? difference / standardError
                : difference === 0 ? 0 : Math.sign(difference) * Number.POSITIVE_INFINITY;
            const f = t ** 2;
            comparisons.push({
                id: `${first.id}-${second.id}`,
                firstLabel: first.label,
                secondLabel: second.label,
                difference,
                standardError,
                t,
                p: upperTailFProbability(f, 1, stats.dfE_common),
            });
        });
    });

    return comparisons;
};
