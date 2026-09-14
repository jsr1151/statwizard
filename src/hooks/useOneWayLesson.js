import { useEffect, useState } from 'react';
import { createOneWayDraft, oneWayExample, MAX_ANOVA_GROUPS } from '../utils/oneWayDraft.js';

const initial = () => ({ ...createOneWayDraft(), inputMode: 'f' });
export default function useOneWayLesson() {
    const [value, setValue] = useState(initial);
    const [signal, setSignal] = useState(null);
    const emit = name => setSignal({ name });
    useEffect(() => {
        if (signal) window.dispatchEvent(new CustomEvent('anovaTutorAction', { detail: { signal: signal.name } }));
    }, [signal]);
    const patch = change => {
        setValue(current => ({ ...current, ...change }));
        if (change.alpha !== undefined) emit('change_alpha');
        if (change.showComparisons) emit('run_post_hoc');
        if (change.f) {
            const field = Object.keys(change.f).find(key => change.f[key] !== value.f[key]);
            if (field) emit(field === 'F' ? 'change_f_calc' : `change_${field}`);
        }
    };
    const updateGroups = update => setValue(current => ({ ...current, [current.inputMode]: { ...current[current.inputMode], source: 'Edited teaching example', groups: update(current[current.inputMode].groups, current.inputMode) } }));
    return {
        value, patch,
        setGroup: (index, key, next) => { updateGroups(groups => groups.map((group, i) => i === index ? { ...group, [key]: next } : group)); emit(value.inputMode === 'raw' ? 'change_raw' : 'change_stats'); },
        addGroup: () => { updateGroups((groups, mode) => groups.length >= MAX_ANOVA_GROUPS ? groups : [...groups, mode === 'raw' ? { label: `Group ${groups.length + 1}`, raw: '' } : { label: `Group ${groups.length + 1}`, mean: '', sd: '', n: '' }]); emit('add_group'); },
        removeGroup: index => { updateGroups(groups => groups.length > 2 ? groups.filter((_, i) => i !== index) : groups); emit('remove_group'); },
        loadExample: () => setValue(current => ({ ...current, ...oneWayExample() })),
        reset: () => { setValue(initial()); setSignal(null); },
    };
}
