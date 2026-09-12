import usePersistentInputDraft from './usePersistentInputDraft.js';

export default function useDescriptiveInput(examples, defaultExample, draftId) {
    const { value: state, setValue: setState, draft } = usePersistentInputDraft(draftId, { input: examples[defaultExample], source: `Example: ${defaultExample}` });
    return {
        ...state,
        draft,
        setInput: input => setState({ input, source: 'Entered values' }),
        loadExample: id => setState({ input: examples[id], source: `Example: ${id}` }),
    };
}
