import React, { useMemo } from 'react';

const QQPlotVisual = ({ type = 'good', darkMode }) => {
    const points = useMemo(() => {
        const data = [];
        const n = 40;
        const size = 300;
        const margin = 40;
        const plotSize = size - margin * 2;

        for (let i = 0; i < n; i++) {
            // Theoretical quantiles (z-scores for normal distribution)
            // Approximately linear from -2.5 to 2.5 for n=40
            const theoreticalZ = ((i + 0.5) / n - 0.5) * 5;

            let sampleZ = theoreticalZ;

            if (type === 'good') {
                // Add minor random noise
                sampleZ += (Math.random() - 0.5) * 0.3;
            } else if (type === 'bad') {
                // Create a clear S-shape (Heavy Tails / Kurtosis issue)
                // Ends peel away from the diagonal line
                if (theoreticalZ < -1.5) {
                    sampleZ = theoreticalZ * 1.8 - 0.5; // Peel down at low end
                } else if (theoreticalZ > 1.5) {
                    sampleZ = theoreticalZ * 1.8 + 0.5; // Peel up at high end
                } else {
                    sampleZ = theoreticalZ * 0.8; // Flatter in middle
                }
                // Add some noise
                sampleZ += (Math.random() - 0.5) * 0.2;
            } else if (type === 'bad_skew') {
                // Curved pattern (Skewness)
                sampleZ = theoreticalZ * theoreticalZ * (theoreticalZ > 0 ? 0.3 : -0.3) + theoreticalZ;
                sampleZ += (Math.random() - 0.5) * 0.2;
            }

            // Scale to SVG coordinates (0-300)
            // Assuming Z ranges from -3 to 3
            const x = margin + ((theoreticalZ + 3) / 6) * plotSize;
            const y = size - (margin + ((sampleZ + 3) / 6) * plotSize);

            if (x >= 0 && x <= size && y >= 0 && y <= size) {
                data.push({ x, y });
            }
        }
        return data;
    }, [type]);

    return (
        <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-950/50 border-slate-800' : 'bg-white border-slate-200 shadow-inner'}`}>
            <svg viewBox="0 0 300 300" className="w-full aspect-square overflow-visible">
                {/* Grid Lines */}
                <line x1="40" y1="40" x2="40" y2="260" stroke={darkMode ? "#1e293b" : "#f1f5f9"} strokeWidth="1" />
                <line x1="40" y1="260" x2="260" y2="260" stroke={darkMode ? "#1e293b" : "#f1f5f9"} strokeWidth="1" />

                {/* Diagonal Reference Line */}
                <line
                    x1="40"
                    y1="260"
                    x2="260"
                    y2="40"
                    stroke={darkMode ? "#334155" : "#cbd5e1"}
                    strokeWidth="2"
                    strokeDasharray="4 4"
                />

                {/* Labels */}
                <text
                    x="150"
                    y="285"
                    textAnchor="middle"
                    fontSize="10"
                    className={`font-black uppercase tracking-widest ${darkMode ? 'fill-slate-600' : 'fill-slate-400'}`}
                >
                    Theoretical
                </text>
                <text
                    x="15"
                    y="150"
                    textAnchor="middle"
                    fontSize="10"
                    className={`font-black uppercase tracking-widest ${darkMode ? 'fill-slate-600' : 'fill-slate-400'}`}
                    transform="rotate(-90, 15, 150)"
                >
                    Sample
                </text>

                {/* Points */}
                {points.map((p, i) => (
                    <circle
                        key={i}
                        cx={p.x}
                        cy={p.y}
                        r="3.5"
                        fill={type === 'good' ? '#10b981' : '#ef4444'}
                        className="transition-all duration-1000"
                        style={{ filter: `drop-shadow(0 0 2px ${type === 'good' ? '#10b98144' : '#ef444444'})` }}
                    />
                ))}
            </svg>
        </div>
    );
};

export default QQPlotVisual;
