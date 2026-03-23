import { useEffect, useMemo, useState } from 'react';
import {
    ACTIVE_DATASET_SESSION_KEY,
    consumeAnalysisLaunchPayload,
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
    const [selectedDatasetId, setSelectedDatasetId] = useState('');
    const [launchPayload, setLaunchPayload] = useState(null);

    useEffect(() => {
        setLaunchPayload(consumeAnalysisLaunchPayload(analysisId));
    }, [analysisId]);

    useEffect(() => {
        if (!datasets.length) {
            setSelectedDatasetId('');
            return;
        }

        setSelectedDatasetId((previous) => {
            if (previous && datasets.some((dataset) => dataset.id === previous)) {
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
    };
};

export default useAnalysisDatasetSelection;
