import { useState } from 'react';

export default function useDescriptiveInput(examples, defaultExample) {
    const [state, setState] = useState(() => ({ input: examples[defaultExample], source: `Example: ${defaultExample}` }));
    return {
        ...state,
        setInput: input => setState({ input, source: 'Entered values' }),
        loadExample: id => setState({ input: examples[id], source: `Example: ${id}` }),
    };
}
