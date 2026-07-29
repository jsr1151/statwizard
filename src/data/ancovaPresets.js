export const ANCOVA_COLORS = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

export const INITIAL_ANCOVA_GROUPS = [
    { id: 'therapy-a', label: 'Therapy A', color: ANCOVA_COLORS[0], xRaw: '12\n15\n10\n18\n14\n13\n9\n17\n11\n16', yRaw: '55\n62\n48\n71\n60\n58\n45\n68\n52\n65', collapsed: false },
    { id: 'therapy-b', label: 'Therapy B', color: ANCOVA_COLORS[1], xRaw: '13\n16\n11\n19\n15\n14\n10\n18\n12\n17', yRaw: '49\n55\n41\n65\n53\n50\n38\n61\n46\n58', collapsed: false },
    { id: 'control', label: 'Control', color: ANCOVA_COLORS[2], xRaw: '11\n14\n9\n17\n13\n12\n8\n16\n10\n15', yRaw: '45\n53\n35\n65\n48\n42\n31\n60\n40\n56', collapsed: false },
];

export const ANCOVA_PRESETS = [
    {
        id: 'therapy',
        label: 'Therapy & Baseline',
        description: 'Testing therapies while controlling for baseline severity.',
        covariateName: 'Baseline Score',
        groups: INITIAL_ANCOVA_GROUPS,
    },
    {
        id: 'education',
        label: 'Teaching Method',
        description: 'Comparing teaching methods while controlling for prior GPA.',
        covariateName: 'Prior GPA',
        groups: [
            { id: 'method-1', label: 'Method 1', color: ANCOVA_COLORS[3], xRaw: '3.1\n2.8\n3.5\n3.9\n2.5\n3.2\n3.4\n2.9\n3.6\n3.0', yRaw: '85\n78\n92\n95\n70\n88\n89\n81\n90\n84', collapsed: false },
            { id: 'method-2', label: 'Method 2', color: ANCOVA_COLORS[4], xRaw: '3.0\n3.2\n2.7\n3.6\n3.8\n3.1\n2.4\n3.5\n2.9\n3.3', yRaw: '80\n85\n75\n92\n96\n82\n68\n90\n79\n86', collapsed: false },
        ],
    },
];
