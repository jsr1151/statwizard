export const ACTIVE_DATASET_SESSION_KEY = 'statwizard_active_dataset_id';
export const ANALYSIS_LAUNCH_SESSION_KEY = 'statwizard_analysis_launch';

const safeSessionStorage = () => {
    try {
        return window.sessionStorage;
    } catch (error) {
        return null;
    }
};

const normalizeTagBag = (column) => new Set(
    [
        ...(column?.tags || []),
        ...(column?.manualTags || []),
        ...(column?.autoTags || []),
    ].map((tag) => String(tag ?? '').trim().toLowerCase()).filter(Boolean)
);

const hasAnyTag = (column, expectedTags = []) => {
    const tagBag = normalizeTagBag(column);
    return expectedTags.some((expectedTag) => tagBag.has(String(expectedTag).trim().toLowerCase()));
};

const getNumericColumns = (dataset) =>
    (dataset?.columns || []).filter((column) => column.summary?.detectedType === 'numeric');

const getCategoricalColumns = (dataset) =>
    (dataset?.columns || []).filter((column) => ['categorical', 'text'].includes(column.summary?.detectedType));

const getUsableLevelCount = (column) => Number(column?.summary?.uniqueCount || 0);

const rankPredictorColumns = (columns = []) => [...columns].sort((left, right) => {
    const leftScore = Number(hasAnyTag(left, ['predictor', 'independent', 'covariate', 'feature']));
    const rightScore = Number(hasAnyTag(right, ['predictor', 'independent', 'covariate', 'feature']));
    return rightScore - leftScore;
});

const rankGroupingColumns = (columns = []) => [...columns].sort((left, right) => {
    const leftScore = Number(hasAnyTag(left, ['group', 'grouping', 'factor', 'condition', 'treatment']));
    const rightScore = Number(hasAnyTag(right, ['group', 'grouping', 'factor', 'condition', 'treatment']));

    if (rightScore !== leftScore) {
        return rightScore - leftScore;
    }

    return getUsableLevelCount(left) - getUsableLevelCount(right);
});

const findPreferredOutcomeColumn = (numericColumns = []) => (
    numericColumns.find((column) => hasAnyTag(column, ['outcome', 'dependent', 'criterion']))
    || numericColumns[numericColumns.length - 1]
    || null
);

export const inferAnalysisLaunchSelection = (dataset, analysisId) => {
    const numericColumns = getNumericColumns(dataset);
    const categoricalColumns = getCategoricalColumns(dataset);

    if (analysisId === 'pearson_correlation') {
        if (numericColumns.length < 2) {
            return null;
        }

        const preferredX = rankPredictorColumns(numericColumns).find(Boolean) || numericColumns[0];
        const preferredY = numericColumns.find((column) => (
            column.id !== preferredX.id && hasAnyTag(column, ['outcome', 'dependent'])
        )) || numericColumns.find((column) => column.id !== preferredX.id) || numericColumns[1];

        if (!preferredX || !preferredY || preferredX.id === preferredY.id) {
            return null;
        }

        return {
            datasetId: dataset.id,
            x: preferredX.id,
            y: preferredY.id,
        };
    }

    if (analysisId === 'multiple_regression') {
        if (numericColumns.length < 3) {
            return null;
        }

        const preferredOutcome = findPreferredOutcomeColumn(numericColumns);
        const predictorColumns = rankPredictorColumns(
            numericColumns.filter((column) => column.id !== preferredOutcome?.id)
        );

        return {
            datasetId: dataset.id,
            outcome: preferredOutcome?.id || '',
            predictors: predictorColumns.slice(0, 3).map((column) => column.id),
        };
    }

    if (analysisId === 'independent_t_test') {
        const groupingCandidates = rankGroupingColumns(
            categoricalColumns.filter((column) => getUsableLevelCount(column) === 2)
        );
        const preferredOutcome = findPreferredOutcomeColumn(numericColumns);

        if (!preferredOutcome || !groupingCandidates.length) {
            return null;
        }

        return {
            datasetId: dataset.id,
            outcome: preferredOutcome.id,
            grouping: groupingCandidates[0].id,
        };
    }

    if (analysisId === 'one_sample_t_test') {
        const preferredOutcome = findPreferredOutcomeColumn(numericColumns);

        if (!preferredOutcome) {
            return null;
        }

        return {
            datasetId: dataset.id,
            outcome: preferredOutcome.id,
        };
    }

    if (analysisId === 'paired_t_test') {
        if (numericColumns.length < 2) {
            return null;
        }

        const preferredOutcome = findPreferredOutcomeColumn(numericColumns);
        const fallbackColumns = rankPredictorColumns(
            numericColumns.filter((column) => column.id !== preferredOutcome?.id)
        );
        const first = preferredOutcome || numericColumns[0];
        const second = fallbackColumns[0] || numericColumns.find((column) => column.id !== first?.id) || numericColumns[1];

        if (!first || !second || first.id === second.id) {
            return null;
        }

        return {
            datasetId: dataset.id,
            first: first.id,
            second: second.id,
        };
    }

    if (analysisId === 'one_way_anova') {
        const groupingCandidates = rankGroupingColumns(
            categoricalColumns.filter((column) => getUsableLevelCount(column) >= 2)
        );
        const preferredOutcome = findPreferredOutcomeColumn(numericColumns);

        if (!preferredOutcome || !groupingCandidates.length) {
            return null;
        }

        return {
            datasetId: dataset.id,
            outcome: preferredOutcome.id,
            grouping: groupingCandidates[0].id,
        };
    }

    if (analysisId === 'ancova') {
        const groupingCandidates = rankGroupingColumns(
            categoricalColumns.filter((column) => getUsableLevelCount(column) >= 2)
        );
        const preferredOutcome = findPreferredOutcomeColumn(numericColumns);
        const covariateCandidates = rankPredictorColumns(
            numericColumns.filter((column) => column.id !== preferredOutcome?.id)
        );

        if (!preferredOutcome || !groupingCandidates.length || !covariateCandidates.length) {
            return null;
        }

        return {
            datasetId: dataset.id,
            outcome: preferredOutcome.id,
            grouping: groupingCandidates[0].id,
            covariate: covariateCandidates[0].id,
        };
    }

    if (analysisId === 'factorial_anova') {
        const factorCandidates = rankGroupingColumns(
            categoricalColumns.filter((column) => getUsableLevelCount(column) >= 2)
        );
        const preferredOutcome = findPreferredOutcomeColumn(numericColumns);

        if (!preferredOutcome || factorCandidates.length < 2) {
            return null;
        }

        return {
            datasetId: dataset.id,
            outcome: preferredOutcome.id,
            factorA: factorCandidates[0].id,
            factorB: factorCandidates[1].id,
        };
    }

    return {
        datasetId: dataset?.id || '',
    };
};

export const writeAnalysisLaunchPayload = (payload) => {
    const storage = safeSessionStorage();

    if (!storage || !payload?.datasetId) {
        return;
    }

    storage.setItem(ACTIVE_DATASET_SESSION_KEY, payload.datasetId);
    storage.setItem(ANALYSIS_LAUNCH_SESSION_KEY, JSON.stringify(payload));
};

export const consumeAnalysisLaunchPayload = (expectedAnalysisId = null) => {
    const storage = safeSessionStorage();

    if (!storage) {
        return null;
    }

    try {
        const raw = storage.getItem(ANALYSIS_LAUNCH_SESSION_KEY);

        if (!raw) {
            return null;
        }

        const parsed = JSON.parse(raw);

        if (expectedAnalysisId && parsed?.analysisId && parsed.analysisId !== expectedAnalysisId) {
            return null;
        }

        storage.removeItem(ANALYSIS_LAUNCH_SESSION_KEY);
        return parsed;
    } catch (error) {
        return null;
    }
};
