export const FACTORIAL_PRESETS = [
    {
        id: 'no_effects',
        name: "Constant Conditions",
        description: "Everything is roughly equal. Lines are horizontal and parallel.",
        outcome: "Quiz Score",
        factorA: { label: "Room Temp", levels: [{ id: 'a1', label: "Cool" }, { id: 'a2', label: "Warm" }] },
        factorB: { label: "Time", levels: [{ id: 'b1', label: "Morning" }, { id: 'b2', label: "Afternoon" }] },
        data: {
            'a1_b1': { values: [80, 82, 79], inputMode: 'raw' },
            'a1_b2': { values: [81, 79, 82], inputMode: 'raw' },
            'a2_b1': { values: [82, 80, 81], inputMode: 'raw' },
            'a2_b2': { values: [80, 81, 79], inputMode: 'raw' }
        }
    },
    {
        id: 'main_a_only',
        name: "Caffeine Boost",
        description: "Factor A matters, but Factor B doesn't. Parallel lines are separated.",
        outcome: "Reaction Time (ms)",
        factorA: { label: "Caffeine", levels: [{ id: 'a1', label: "0mg" }, { id: 'a2', label: "200mg" }] },
        factorB: { label: "Music", levels: [{ id: 'b1', label: "Classical" }, { id: 'b2', label: "Rock" }] },
        data: {
            'a1_b1': { values: [450, 460, 445], inputMode: 'raw' },
            'a1_b2': { values: [448, 455, 462], inputMode: 'raw' },
            'a2_b1': { values: [380, 395, 385], inputMode: 'raw' },
            'a2_b2': { values: [385, 390, 380], inputMode: 'raw' }
        }
    },
    {
        id: 'main_b_only',
        name: "Exercise & Stress",
        description: "Factor B matters, but Factor A doesn't. Parallel lines with a slope.",
        outcome: "Stress Level (1-10)",
        factorA: { label: "Gender", levels: [{ id: 'a1', label: "Men" }, { id: 'a2', label: "Women" }] },
        factorB: { label: "Exercise", levels: [{ id: 'b1', label: "Sedentary" }, { id: 'b2', label: "Active" }] },
        data: {
            'a1_b1': { values: [7, 8, 7, 9], inputMode: 'raw' },
            'a1_b2': { values: [4, 5, 4, 3], inputMode: 'raw' },
            'a2_b1': { values: [7, 8, 9, 8], inputMode: 'raw' },
            'a2_b2': { values: [4, 5, 3, 4], inputMode: 'raw' }
        }
    },
    {
        id: 'interaction_only',
        name: "Social Learning",
        description: "The effect of A depends on B. Lines cross, main effects cancel out.",
        outcome: "Focus Score",
        factorA: { label: "Method", levels: [{ id: 'a1', label: "Quiet" }, { id: 'a2', label: "Group" }] },
        factorB: { label: "Personality", levels: [{ id: 'b1', label: "Introvert" }, { id: 'b2', label: "Extrovert" }] },
        data: {
            'a1_b1': { values: [90, 88, 92], inputMode: 'raw' },
            'a1_b2': { values: [60, 65, 58], inputMode: 'raw' },
            'a2_b1': { values: [60, 62, 59], inputMode: 'raw' },
            'a2_b2': { values: [88, 91, 89], inputMode: 'raw' }
        }
    },
    {
        id: 'study_method',
        name: "Test-Enhanced Learning",
        description: "Main effects for both, plus a mild interaction.",
        outcome: "Exam Score (%)",
        factorA: { label: "Study Method", levels: [{ id: 'a1', label: "Reread" }, { id: 'a2', label: "Practice" }] },
        factorB: { label: "Time Gap", levels: [{ id: 'b1', label: "1 Day" }, { id: 'b2', label: "1 Week" }] },
        data: {
            'a1_b1': { values: [75, 78, 72, 74], inputMode: 'raw' },
            'a1_b2': { values: [60, 62, 58, 55], inputMode: 'raw' },
            'a2_b1': { values: [85, 88, 82, 84], inputMode: 'raw' },
            'a2_b2': { values: [80, 82, 78, 79], inputMode: 'raw' }
        }
    }
];
