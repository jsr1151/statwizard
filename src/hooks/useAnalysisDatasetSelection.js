import { useEffect, useMemo, useState } from 'react';
import {
    ACTIVE_DATASET_SESSION_KEY,
    consumeAnalysisLaunchPayload,
    readAnalysisLaunchPayload,
} from '../utils/analysisLaunch.js';

const readPreferredDatasetId = () => {
    try {
        return window.sessionStorage.getItem(ACTIVE_DATASET_SESSION_KEY) || '';
    } catch (error) {
        return '';
    }
};

const useAnalysisDatasetSelection = ({
    analysisId,
    datasets,
}) => {
    const [launchPayload] = useState(() => readAnalysisLaunchPayload(analysisId));
    const [selectedDatasetId, setSelectedDatasetId] = useState(() => launchPayload?.datasetId || '');
    const [dataSource, setDataSource] = useState(() => launchPayload ? 'saved' : 'manual');

    useEffect(() => {
        consumeAnalysisLaunchPayload(analysisId);
    }, [analysisId]);

    useEffect(() => {
        if (!datasets.length) {
            return;
        }

        setSelectedDatasetId((previous) => {
            if (previous) {
                return previous;
            }

            if (launchPayload?.datasetId && datasets.some((dataset) => dataset.id === launchPayload.datasetId)) {
                return launchPayload.datasetId;
            }

            const preferredDatasetId = readPreferredDatasetId();

            if (preferredDatasetId && datasets.some((dataset) => dataset.id === preferredDatasetId)) {
                return preferredDatasetId;
            }

            return datasets[0]?.id || '';
        });
    }, [datasets, launchPayload?.datasetId]);

    const selectedDataset = useMemo(
        () => datasets.find((dataset) => dataset.id === selectedDatasetId) || null,
        [datasets, selectedDatasetId]
    );

    return {
        launchPayload,
        selectedDataset,
        selectedDatasetId,
        setSelectedDatasetId,
        dataSource,
        setDataSource,
    };
};

export default useAnalysisDatasetSelection;
