import { hydrateStoredDataset } from './datasetImport.js';

const DATABASE_NAME = 'statwizard-datasets';
const STORE_NAME = 'datasets';
const DATABASE_VERSION = 1;
const LOCAL_STORAGE_KEY = 'statwizard_dataset_library_v1';

const hasIndexedDb = () => typeof window !== 'undefined' && 'indexedDB' in window;

const requestToPromise = (request) => new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('IndexedDB request failed.'));
});

const transactionToPromise = (transaction) => new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error || new Error('IndexedDB transaction failed.'));
    transaction.onabort = () => reject(transaction.error || new Error('IndexedDB transaction was aborted.'));
});

const openDatabase = () => new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DATABASE_NAME, DATABASE_VERSION);

    request.onupgradeneeded = () => {
        const database = request.result;

        if (!database.objectStoreNames.contains(STORE_NAME)) {
            database.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Failed to open IndexedDB.'));
});

const sortDatasets = (datasets = []) => [...datasets].sort(
    (left, right) => new Date(right.updatedAt || 0).getTime() - new Date(left.updatedAt || 0).getTime()
);

const readLocalFallback = () => {
    if (typeof window === 'undefined' || !window.localStorage) {
        return [];
    }

    try {
        return JSON.parse(window.localStorage.getItem(LOCAL_STORAGE_KEY) || '[]');
    } catch (error) {
        return [];
    }
};

const writeLocalFallback = (datasets) => {
    if (typeof window === 'undefined' || !window.localStorage) {
        return;
    }

    window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(datasets));
};

export const loadStoredDatasets = async () => {
    if (!hasIndexedDb()) {
        return sortDatasets(readLocalFallback().map(hydrateStoredDataset));
    }

    const database = await openDatabase();
    const transaction = database.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const records = await requestToPromise(store.getAll());

    database.close();
    return sortDatasets(records.map(hydrateStoredDataset));
};

export const persistDatasetRecord = async (dataset) => {
    const prepared = hydrateStoredDataset(dataset, { touch: true });

    if (!hasIndexedDb()) {
        const current = readLocalFallback();
        const next = current.filter((item) => item.id !== prepared.id).concat(prepared);
        writeLocalFallback(sortDatasets(next));
        return prepared;
    }

    const database = await openDatabase();
    const transaction = database.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    store.put(prepared);
    await transactionToPromise(transaction);
    database.close();

    return prepared;
};

export const removeDatasetRecord = async (datasetId) => {
    if (!hasIndexedDb()) {
        const current = readLocalFallback();
        writeLocalFallback(current.filter((item) => item.id !== datasetId));
        return;
    }

    const database = await openDatabase();
    const transaction = database.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    store.delete(datasetId);
    await transactionToPromise(transaction);
    database.close();
};
