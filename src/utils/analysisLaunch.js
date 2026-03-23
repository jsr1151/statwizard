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

const rankPredictorColumns = (columns = []) => [...columns].sort((left, right) => {
    const leftScore = Number(hasAnyTag(left, ['predictor', 'independent', 'covariate', 'feature']));
    const rightScore = Number(hasAnyTag(right, ['predictor', 'independent', 'covariate', 'feature']));
    return rightScore - leftScore;
});

export const inferAnalysisLaunchSelection = (dataset, analysisId) => {
    const numericColumns = getNumericColumns(dataset);

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

        const preferredOutcome = numericColumns.find((column) => hasAnyTag(column, ['outcome', 'dependent', 'criterion']))
            || numericColumns[numericColumns.length - 1];
        const predictorColumns = rankPredictorColumns(
            numericColumns.filter((column) => column.id !== preferredOutcome?.id)
        );

        return {
            datasetId: dataset.id,
            outcome: preferredOutcome?.id || '',
            predictors: predictorColumns.slice(0, 3).map((column) => column.id),
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
