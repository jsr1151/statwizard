import { useId } from 'react';
import { getFDensity } from '../../utils/mathHelpers.js';
import { formatStatistic } from '../../utils/statFormatters.js';

export default function FTestNullPlot({ result, darkMode }) {
    const id = useId();
    const range = Math.max(6, Math.min(50, result.Fcrit * 1.3), Math.min(50, result.F * 1.1));
    const points = Array.from({ length: 240 }, (_, i) => {
        const value = range * (i + 1) / 240;
        return { value, density: getFDensity(value, result.df1, result.df2) };
    });
    const maximum = Math.max(...points.map(point => point.density));
    const x = value => 35 + value / range * 530;
    const path = points.map((point, i) => `${i ? 'L' : 'M'}${x(point.value)},${160 - point.density / maximum * 125}`).join(' ');
    if (!Number.isFinite(maximum) || maximum <= 0) return <p className="text-sm">The null distribution plot is unavailable for these degrees of freedom. Use the numerical result above.</p>;
    return <figure className="space-y-2">
        <svg viewBox="0 0 600 210" role="img" aria-labelledby={`${id}-title ${id}-desc`} className="w-full">
            <title id={`${id}-title`}>ANOVA F null distribution</title>
            <desc id={`${id}-desc`}>F distribution with {result.df1} numerator and {result.df2} denominator degrees of freedom. Observed F: {formatStatistic(result.F, 4)}. Upper-tail rejection boundary: {formatStatistic(result.Fcrit, 4)}.</desc>
            <line x1="35" x2="565" y1="160" y2="160" stroke={darkMode ? '#94a3b8' : '#64748b'} />
            <path d={path} fill="none" stroke={darkMode ? '#a5b4fc' : '#4338ca'} strokeWidth="3" />
            {result.Fcrit <= range && <line x1={x(result.Fcrit)} x2={x(result.Fcrit)} y1="25" y2="160" stroke={darkMode ? '#fbbf24' : '#92400e'} strokeDasharray="6 4" strokeWidth="2" />}
            <line x1={x(Math.min(range, result.F))} x2={x(Math.min(range, result.F))} y1="20" y2="160" stroke={darkMode ? '#6ee7b7' : '#047857'} strokeWidth="3" />
            {[0, range / 2, range].map(value => <text key={value} x={x(value)} y="180" textAnchor="middle" fill={darkMode ? '#cbd5e1' : '#334155'} fontSize="13">{formatStatistic(value, 1)}</text>)}
            <text x="300" y="202" textAnchor="middle" fill={darkMode ? '#cbd5e1' : '#334155'} fontSize="13">F statistic</text>
        </svg>
        <figcaption className="text-sm">Solid marker: observed F. Dashed marker: upper-tail rejection boundary. {result.F > range && 'Observed F is beyond the displayed range; its marker is shown at the edge. '}{result.Fcrit > range && 'The rejection boundary is beyond the displayed range. '}{result.df1 < 2 && 'Density rises without bound as F approaches zero; the curve begins just above zero.'}</figcaption>
    </figure>;
}
