import { useId } from 'react';
import { formatStatistic } from '../../utils/statFormatters.js';

export default function TTestNullPlot({ result, darkMode, title = 'One-sample t-test null distribution' }) {
    const id = useId();
    const range = Math.max(4, Math.min(30, Math.abs(result.criticalValue) * 1.2), Math.min(30, Math.abs(result.t) * 1.1));
    const x = value => 35 + ((value + range) / (2 * range)) * 530;
    const y = value => 160 - 125 * (1 + value * value / result.df) ** (-(result.df + 1) / 2);
    const points = Array.from({ length: 241 }, (_, index) => -range + 2 * range * index / 240);
    const path = points.map((value, index) => `${index ? 'L' : 'M'}${x(value)},${y(value)}`).join(' ');
    const critical = Math.abs(result.criticalValue);
    const observed = Math.max(-range, Math.min(range, result.t));
    return <figure className="space-y-2">
        <svg viewBox="0 0 600 210" role="img" aria-labelledby={`${id}-title ${id}-desc`} className="w-full">
            <title id={`${id}-title`}>{title}</title>
            <desc id={`${id}-desc`}>Student t distribution with {result.df} degrees of freedom. The solid marker is the observed t statistic, {formatStatistic(result.t, 3)}. Dashed markers indicate the rejection boundary.</desc>
            <line x1="35" x2="565" y1="160" y2="160" stroke={darkMode ? '#94a3b8' : '#64748b'} />
            <path d={path} fill="none" stroke={darkMode ? '#a5b4fc' : '#4338ca'} strokeWidth="3" />
            {(result.tails === 2 ? [-critical, critical] : [result.direction === 'less' ? -critical : critical]).filter(value => Math.abs(value) <= range).map(value => <line key={value} x1={x(value)} x2={x(value)} y1="25" y2="160" stroke={darkMode ? '#fbbf24' : '#92400e'} strokeDasharray="6 4" strokeWidth="2" />)}
            <line x1={x(observed)} x2={x(observed)} y1="20" y2="160" stroke={darkMode ? '#6ee7b7' : '#047857'} strokeWidth="3" />
            {[-range, 0, range].map(value => <text key={value} x={x(value)} y="180" textAnchor="middle" fill={darkMode ? '#cbd5e1' : '#334155'} fontSize="13">{formatStatistic(value, 1)}</text>)}
            <text x="300" y="202" textAnchor="middle" fill={darkMode ? '#cbd5e1' : '#334155'} fontSize="13">t statistic</text>
        </svg>
        <figcaption className={`text-sm ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Solid marker: observed t. Dashed markers: rejection boundary. {Math.abs(result.t) > range && 'The observed t is beyond the displayed range; its marker is shown at the edge. '} {critical > range && `The rejection boundary (${formatStatistic(critical, 3)} in magnitude) is beyond the displayed range.`}</figcaption>
    </figure>;
}
