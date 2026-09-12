import { useCallback, useEffect, useRef, useState } from 'react';

export default function useAnalysisTableInput(example, mode = 'paste', { initialValue, onChange } = {}) {
    const [tableText, updateText] = useState(initialValue?.tableText ?? example);
    const [tableSource, setTableSource] = useState(initialValue?.tableSource ?? 'Example data');
    const [uploadError, setUploadError] = useState('');
    const [uploadPending, setUploadPending] = useState('');
    const request = useRef(0);
    useEffect(() => {
        request.current += 1;
        setUploadPending('');
        return () => { request.current += 1; };
    }, [mode]);
    const replace = useCallback((text, source) => {
        request.current += 1;
        updateText(text); setTableSource(source); setUploadError(''); setUploadPending('');
        onChange?.({ tableText: text, tableSource: source });
    }, [onChange]);
    const setTableText = useCallback(text => replace(text, 'Entered table'), [replace]);
    const loadExample = useCallback(() => replace(example, 'Example data'), [example, replace]);
    const onUpload = async event => {
        const input = event.target;
        const file = input.files?.[0];
        if (!file) return;
        input.value = '';
        const token = ++request.current;
        setUploadError(''); setUploadPending(file.name || 'table');
        try {
            const text = await file.text();
            if (token !== request.current) return;
            updateText(text); setTableSource(`Uploaded: ${file.name || 'table'}`); setUploadPending('');
            onChange?.({ tableText: text, tableSource: `Uploaded: ${file.name || 'table'}` });
        } catch {
            if (token !== request.current) return;
            setUploadPending(''); setUploadError('Could not read this file. Your current table is unchanged. Try another file or paste the table.');
        }
    };
    return { tableText, setTableText, tableSource, loadExample, onUpload, uploadError, uploadPending };
}
