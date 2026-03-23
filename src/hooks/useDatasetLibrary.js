import React, { createContext, startTransition, useContext, useEffect, useMemo, useState } from 'react';
import { duplicateDatasetRecord } from '../utils/datasetImport.js';
import { loadStoredDatasets, persistDatasetRecord, removeDatasetRecord } from '../utils/datasetStore.js';

const DatasetLibraryContext = createContext(null);

const upsertDataset = (datasets, nextDataset) => {
    const filtered = datasets.filter((dataset) => dataset.id !== nextDataset.id);
    return [...filtered, nextDataset].sort(
        (left, right) => new Date(right.updatedAt || 0).getTime() - new Date(left.updatedAt || 0).getTime()
    );
};

export const DatasetLibraryProvider = ({ children }) => {
    const [datasets, setDatasets] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            try {
                const stored = await loadStoredDatasets();

                if (cancelled) {
                    return;
                }

                startTransition(() => {
                    setDatasets(stored);
                });
            } catch (loadError) {
                if (!cancelled) {
                    setError(loadError instanceof Error ? loadError.message : 'Failed to load saved datasets.');
                }
            } finally {
                if (!cancelled) {
                    setIsLoading(false);
                }
            }
        };

        load();

        return () => {
            cancelled = true;
        };
    }, []);

    const value = useMemo(() => ({
        datasets,
        isLoading,
        error,
        async saveDataset(dataset) {
            const saved = await persistDatasetRecord(dataset);

            startTransition(() => {
                setDatasets((previous) => upsertDataset(previous, saved));
            });

            return saved;
        },
        async deleteDataset(datasetId) {
            await removeDatasetRecord(datasetId);

            startTransition(() => {
                setDatasets((previous) => previous.filter((dataset) => dataset.id !== datasetId));
            });
        },
        async duplicateDataset(dataset) {
            const duplicated = duplicateDatasetRecord(dataset);
            const saved = await persistDatasetRecord(duplicated);

            startTransition(() => {
                setDatasets((previous) => upsertDataset(previous, saved));
            });

            return saved;
        },
    }), [datasets, error, isLoading]);

    return React.createElement(
        DatasetLibraryContext.Provider,
        { value },
        children
    );
};

export const useDatasetLibraryContext = () => {
    const context = useContext(DatasetLibraryContext);

    if (!context) {
        throw new Error('useDatasetLibraryContext must be used inside DatasetLibraryProvider.');
    }

    return context;
};
