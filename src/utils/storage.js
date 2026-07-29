const resolveStorage = (storage) => {
    if (storage) {
        return storage;
    }

    try {
        return globalThis.localStorage || null;
    } catch {
        return null;
    }
};

const resolveFallback = (fallback) => (
    typeof fallback === 'function' ? fallback() : fallback
);

export const isStringArray = (value) => (
    Array.isArray(value) && value.every((item) => typeof item === 'string')
);

export const readStoredJson = ({
    key,
    fallback,
    validate = () => true,
    version = null,
    storage = null,
}) => {
    const storageProvider = resolveStorage(storage);

    if (!storageProvider || !key) {
        return resolveFallback(fallback);
    }

    try {
        const serialized = storageProvider.getItem(key);

        if (serialized == null) {
            return resolveFallback(fallback);
        }

        const parsed = JSON.parse(serialized);
        const isVersioned = parsed
            && typeof parsed === 'object'
            && Object.hasOwn(parsed, 'version')
            && Object.hasOwn(parsed, 'data');

        if (isVersioned) {
            if (version !== null && parsed.version !== version) {
                return resolveFallback(fallback);
            }

            return validate(parsed.data) ? parsed.data : resolveFallback(fallback);
        }

        // Accept valid legacy values so existing users are migrated on the next write.
        return validate(parsed) ? parsed : resolveFallback(fallback);
    } catch {
        return resolveFallback(fallback);
    }
};

export const writeStoredJson = ({
    key,
    value,
    version = null,
    storage = null,
}) => {
    const storageProvider = resolveStorage(storage);

    if (!storageProvider || !key) {
        return false;
    }

    try {
        const storedValue = version === null ? value : { version, data: value };
        storageProvider.setItem(key, JSON.stringify(storedValue));
        return true;
    } catch {
        return false;
    }
};

export const hasStoredValue = ({ key, storage = null }) => {
    const storageProvider = resolveStorage(storage);

    if (!storageProvider || !key) {
        return false;
    }

    try {
        return storageProvider.getItem(key) !== null;
    } catch {
        return false;
    }
};
