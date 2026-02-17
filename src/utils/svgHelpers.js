// --- SVG Path and Formatting Helpers ---

export const pointsToPath = (points, baselineY = 150) => {
    if (!points || points.length === 0) return "";
    return `M ${points[0][0]},${baselineY} L ` + points.map(p => `${p[0]},${p[1]}`).join(' L ') + ` L ${points[points.length - 1][0]},${baselineY} Z`;
};

export const pointsToLine = (points) => {
    if (!points || points.length === 0) return "";
    return `M ${points[0][0]},${points[0][1]} L ` + points.map(p => `${p[0]},${p[1]}`).join(' L ');
};

export const getOrdinal = (n) => {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
};
