import React, { useMemo, useState } from 'react';
import { BarChart3, BookOpen, Calculator, Check, Clipboard, Code2, Lightbulb, Plus, RotateCcw } from 'lucide-react';
import { calculateCentralTendency, parseNumericInput } from '../../stats/centralTendency';
import { SOFTWARE_GUIDES } from '../../data/softwareGuides';

const EXAMPLES = {
    symmetric: '2, 4, 4, 5, 5, 5, 6, 6, 8',
    skewed: '2, 3, 3, 4, 4, 5, 6, 18',
    bimodal: '1, 2, 2, 3, 4, 7, 7, 8',
};

const Card = ({ darkMode, children, className = '' }) => (
    <section className={`rounded-2xl border p-6 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} ${className}`}>{children}</section>
);

const format = (value, precision = 2) => Number.isInteger(value) ? String(value) : value.toFixed(precision).replace(/0+$/, '').replace(/\.$/, '');

const StatCard = ({ label, value, detail, darkMode }) => (
    <div className={`rounded-xl border p-4 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
        <div className={`text-xs font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>{label}</div>
        <div className={`mt-2 text-2xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>{value}</div>
        <p className={`mt-1 text-xs ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>{detail}</p>
    </div>
);

const Summary = ({ stats, precision, darkMode }) => {
    const modeText = stats.modes.length ? stats.modes.map((value) => format(value, precision)).join(', ') : 'No mode';
    return (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-live="polite">
            <StatCard label="Mean" value={format(stats.mean, precision)} detail="Sum divided by the number of observations." darkMode={darkMode} />
            <StatCard label="Median" value={format(stats.median, precision)} detail="The middle of the ordered observations." darkMode={darkMode} />
            <StatCard label={stats.modes.length > 1 ? 'Modes' : 'Mode'} value={modeText} detail={stats.modes.length ? `Each occurs ${stats.modeFrequency} times.` : 'Every value occurs equally often.'} darkMode={darkMode} />
            <StatCard label="Observations" value={stats.n} detail={`Sum = ${format(stats.sum, precision)}`} darkMode={darkMode} />
        </div>
    );
};

const describeSkewness = (value) => {
    if (value === null) return 'Undefined (no spread)';
    if (Math.abs(value) < 0.5) return 'Approximately symmetric';
    if (value > 0) return value < 1 ? 'Moderately right-skewed' : 'Strongly right-skewed';
    return value > -1 ? 'Moderately left-skewed' : 'Strongly left-skewed';
};

const describeKurtosis = (value) => {
    if (value === null) return 'Undefined (no spread)';
    if (Math.abs(value) < 0.5) return 'Near normal-tail reference';
    return value > 0 ? 'Heavier tails / sharper peak' : 'Lighter tails / flatter shape';
};

const DistributionPlot = ({ stats, darkMode }) => {
    const width = 640;
    const height = 220;
    const padding = 36;
    const range = stats.max - stats.min || 1;
    const expandedMin = stats.min - range * 0.08;
    const expandedMax = stats.max + range * 0.08;
    const expandedRange = expandedMax - expandedMin;
    const binCount = Math.min(12, Math.max(5, Math.ceil(Math.sqrt(stats.n))));
    const bins = Array.from({ length: binCount }, () => 0);
    stats.sorted.forEach((value) => {
        const index = Math.min(binCount - 1, Math.floor(((value - stats.min) / range) * binCount));
        bins[index] += 1;
    });
    const maxCount = Math.max(...bins, 1);
    const innerWidth = width - padding * 2;
    const innerHeight = height - padding * 2;
    const barWidth = innerWidth / binCount;
    const xForValue = (value) => padding + ((value - expandedMin) / expandedRange) * innerWidth;
    const markerLines = [
        { label: 'Mean', value: stats.mean, color: '#6366f1' },
        { label: 'Median', value: stats.median, color: '#10b981' },
        ...(stats.hasUniqueMode ? [{ label: 'Mode', value: stats.modes[0], color: '#f59e0b' }] : []),
    ];

    return (
        <div className={`rounded-xl border p-5 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
            <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                <div><h4 className="font-black">Distribution shape</h4><p className={`text-xs mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Histogram and center markers calculated from the entered observations.</p></div>
                <div className="flex flex-wrap gap-2 text-xs">
                    <span className={`rounded-lg border px-3 py-2 ${darkMode ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-white'}`}><strong>Skewness:</strong> {stats.skewness === null ? '—' : format(stats.skewness)} · {describeSkewness(stats.skewness)}</span>
                    <span className={`rounded-lg border px-3 py-2 ${darkMode ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-white'}`}><strong>Excess kurtosis:</strong> {stats.excessKurtosis === null ? '—' : format(stats.excessKurtosis)} · {describeKurtosis(stats.excessKurtosis)}</span>
                </div>
            </div>
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" role="img" aria-label={`Histogram of ${stats.n} observations. ${describeSkewness(stats.skewness)}; ${describeKurtosis(stats.excessKurtosis)}.`}>
                <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke={darkMode ? '#475569' : '#94a3b8'} strokeWidth="2" />
                {bins.map((count, index) => {
                    const barHeight = (count / maxCount) * (innerHeight - 22);
                    return <rect key={index} x={padding + index * barWidth + 1} y={height - padding - barHeight} width={Math.max(1, barWidth - 2)} height={barHeight} rx="3" fill={darkMode ? '#38bdf8' : '#0284c7'} opacity="0.62" />;
                })}
                {markerLines.map((marker, index) => <g key={marker.label}><line x1={xForValue(marker.value)} y1={24 + index * 14} x2={xForValue(marker.value)} y2={height - padding} stroke={marker.color} strokeWidth="2" strokeDasharray="5 4" /><text x={xForValue(marker.value) + 4} y={20 + index * 14} fill={marker.color} fontSize="11" fontWeight="700">{marker.label} {format(marker.value)}</text></g>)}
                <text x={padding} y={height - 12} fill={darkMode ? '#94a3b8' : '#475569'} fontSize="11">{format(stats.min)}</text>
                <text x={width - padding} y={height - 12} textAnchor="end" fill={darkMode ? '#94a3b8' : '#475569'} fontSize="11">{format(stats.max)}</text>
            </svg>
            <p className={`mt-2 text-xs ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>Shape statistics can be unstable in small samples. Use them with the plot, not as automatic pass/fail rules.</p>
        </div>
    );
};

const DataPlot = ({ stats, darkMode }) => {
    const range = stats.max - stats.min || 1;
    const x = (value) => 7 + ((value - stats.min) / range) * 86;
    const markers = [
        { label: 'Mean', value: stats.mean, color: 'bg-indigo-500' },
        { label: 'Median', value: stats.median, color: 'bg-emerald-500' },
        ...(stats.modes.length === 1 ? [{ label: 'Mode', value: stats.modes[0], color: 'bg-amber-500' }] : []),
    ];
    return (
        <div className={`rounded-xl border p-5 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
            <div className="relative h-32 mx-2" role="img" aria-label={`Number line from ${stats.min} to ${stats.max}, with markers for the mean and median${stats.hasUniqueMode ? ' and mode' : ''}.`}>
                <div className={`absolute left-[7%] right-[7%] top-20 h-0.5 ${darkMode ? 'bg-slate-600' : 'bg-slate-400'}`} />
                {stats.frequencies.map(({ value, count }) => (
                    <div key={value} className="absolute top-[4.75rem] -translate-x-1/2" style={{ left: `${x(value)}%` }}>
                        <div className="flex flex-col-reverse gap-1 items-center">{Array.from({ length: count }, (_, index) => <span key={index} className="block w-3 h-3 rounded-full bg-sky-500" />)}</div>
                    </div>
                ))}
                {markers.map((marker, index) => (
                    <div key={marker.label} className="absolute top-0 -translate-x-1/2 text-center" style={{ left: `${x(marker.value)}%`, marginTop: `${index * 18}px` }}>
                        <span className={`block text-[10px] font-bold ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>{marker.label} {format(marker.value)}</span>
                        <span className={`mx-auto block w-0.5 h-16 opacity-70 ${marker.color}`} />
                    </div>
                ))}
                <span className="absolute top-[5.4rem] left-[7%] -translate-x-1/2 text-xs">{format(stats.min)}</span>
                <span className="absolute top-[5.4rem] right-[7%] translate-x-1/2 text-xs">{format(stats.max)}</span>
            </div>
        </div>
    );
};

export default function CentralTendencyPage({ section, darkMode }) {
    const [input, setInput] = useState(EXAMPLES.symmetric);
    const [precision, setPrecision] = useState(2);
    const [software, setSoftware] = useState('spss');
    const [copied, setCopied] = useState(false);
    const parsed = useMemo(() => parseNumericInput(input), [input]);
    const stats = useMemo(() => calculateCentralTendency(parsed.values), [parsed.values]);
    const guide = SOFTWARE_GUIDES.central_tendency;

    const copySummary = async () => {
        if (!stats || !navigator.clipboard) return;
        const modes = stats.modes.length ? stats.modes.map((value) => format(value, precision)).join(', ') : 'none';
        await navigator.clipboard.writeText(`n = ${stats.n}; mean = ${format(stats.mean, precision)}; median = ${format(stats.median, precision)}; mode(s) = ${modes}`);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1500);
    };

    if (section === 'calculator' || section === 'explorer') return (
        <div className="space-y-6">
            <Card darkMode={darkMode}>
                <div className="flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400">{section === 'calculator' ? <Calculator size={21} /> : <BarChart3 size={21} />}</div>
                    <div><h3 className={`text-xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>{section === 'calculator' ? 'Central tendency calculator' : 'Distribution explorer'}</h3><p className={`mt-1 text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Enter numbers separated by commas, spaces, semicolons, or new lines. Results update immediately.</p></div>
                </div>
                <label htmlFor="central-values" className="block mt-6 mb-2 text-sm font-bold">Observed values</label>
                <textarea id="central-values" value={input} onChange={(event) => setInput(event.target.value)} rows={4} className={`w-full rounded-xl border p-4 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 ${darkMode ? 'bg-slate-950 border-slate-700 text-white' : 'bg-white border-slate-300'}`} />
                <div className="mt-3 flex flex-wrap items-center gap-2">
                    {Object.entries(EXAMPLES).map(([id, values]) => <button key={id} type="button" onClick={() => setInput(values)} className={`px-3 py-2 rounded-lg text-xs font-bold capitalize ${darkMode ? 'bg-slate-800 hover:bg-slate-700' : 'bg-slate-100 hover:bg-slate-200'}`}>{id}</button>)}
                    <button type="button" onClick={() => setInput(`${input.trim()}${input.trim() ? ', ' : ''}${stats ? stats.max + Math.max(10, stats.max - stats.min) : 20}`)} className="px-3 py-2 rounded-lg text-xs font-bold bg-amber-500/10 text-amber-500"><Plus size={14} className="inline mr-1" />Add outlier</button>
                    <button type="button" onClick={() => setInput(EXAMPLES.symmetric)} className={`px-3 py-2 rounded-lg text-xs font-bold ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}><RotateCcw size={14} className="inline mr-1" />Reset</button>
                    <label className="ml-auto text-xs font-bold">Decimals <select value={precision} onChange={(event) => setPrecision(Number(event.target.value))} className={`ml-2 rounded-lg border p-2 ${darkMode ? 'bg-slate-950 border-slate-700' : 'bg-white border-slate-300'}`}>{[0, 1, 2, 3, 4].map((value) => <option key={value}>{value}</option>)}</select></label>
                </div>
                {parsed.invalid.length > 0 && <p role="alert" className="mt-3 text-sm text-amber-500">Ignored {parsed.invalid.length} invalid entr{parsed.invalid.length === 1 ? 'y' : 'ies'}: {parsed.invalid.join(', ')}</p>}
            </Card>
            {stats ? <><Summary stats={stats} precision={precision} darkMode={darkMode} />{section === 'explorer' && <><DistributionPlot stats={stats} darkMode={darkMode} /><DataPlot stats={stats} darkMode={darkMode} /></>}<Card darkMode={darkMode}><div className="flex justify-between gap-4"><div><h4 className="font-black">Ordered observations</h4><p className={`mt-2 font-mono break-words ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>{stats.sorted.map((value) => format(value, precision)).join(', ')}</p><p className={`mt-3 text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>{Math.abs(stats.mean - stats.median) > 0.1 * Math.max(1, stats.max - stats.min) ? 'The mean and median are separated, suggesting skew or an influential value. Inspect the distribution before choosing a summary.' : 'The mean and median are close for these values. Still inspect the distribution and measurement scale before choosing a summary.'}</p></div><button type="button" onClick={copySummary} className="shrink-0 h-fit px-3 py-2 rounded-lg bg-indigo-600 text-white text-xs font-bold">{copied ? <Check size={14} /> : <Clipboard size={14} />}<span className="sr-only">Copy summary</span></button></div></Card></> : <Card darkMode={darkMode}><p role="status">Enter at least one valid number to calculate results.</p></Card>}
        </div>
    );

    if (section === 'equation') return <div className="grid gap-6 lg:grid-cols-3"><Card darkMode={darkMode}><h3 className="font-black">Arithmetic mean</h3><div className="my-6 text-center text-3xl font-serif">x̄ = Σx / n</div><p className="text-sm">Add all observations, then divide by their count.</p></Card><Card darkMode={darkMode}><h3 className="font-black">Median</h3><div className="my-6 text-center text-lg font-serif">Odd n: middle value<br />Even n: mean of two middle values</div><p className="text-sm">Always order the data first.</p></Card><Card darkMode={darkMode}><h3 className="font-black">Mode</h3><div className="my-6 text-center text-lg font-serif">Value(s) with greatest frequency</div><p className="text-sm">There may be one mode, several modes, or no mode.</p></Card></div>;

    if (section === 'software') return <Card darkMode={darkMode}><div className="flex items-start gap-3"><Code2 className="text-indigo-400" /><div><h3 className="text-xl font-black">Software guides</h3><p className={`mt-1 text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Replace example variable and range names with your own.</p></div></div><div className="flex flex-wrap gap-2 mt-6" role="tablist" aria-label="Statistical software">{[['spss','SPSS'],['jasp','JASP'],['excel','Excel'],['google_sheets','Google Sheets'],['r','R']].map(([id,label]) => <button key={id} role="tab" aria-selected={software === id} onClick={() => setSoftware(id)} className={`px-4 py-3 rounded-lg text-sm font-bold ${software === id ? 'bg-indigo-600 text-white' : darkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'}`}>{label}</button>)}</div><pre role="tabpanel" className={`mt-4 rounded-xl p-5 whitespace-pre-wrap font-mono text-sm overflow-x-auto ${darkMode ? 'bg-slate-950 text-slate-200' : 'bg-slate-50 text-slate-800'}`}>{guide[software]}</pre></Card>;

    return <div className="space-y-6"><Card darkMode={darkMode}><div className="flex items-start gap-4"><div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400"><BookOpen /></div><div><h3 className="text-xl font-black">What does “typical” mean?</h3><p className={`mt-2 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Central tendency describes a distribution with a representative value. Mean, median, and mode answer different versions of that question.</p></div></div></Card><div className="grid gap-4 md:grid-cols-3">{[['Mean','The balance point','Uses every observation and changes when any value changes.'],['Median','The positional center','Half the ordered observations are at or below it and half are at or above it.'],['Mode','The most frequent','The only one of the three generally appropriate for nominal categories.']].map(([name,subtitle,text]) => <Card key={name} darkMode={darkMode}><Lightbulb className="text-amber-400" /><h4 className="mt-4 text-lg font-black">{name}</h4><p className="text-sm font-bold text-indigo-400">{subtitle}</p><p className={`mt-3 text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>{text}</p></Card>)}</div><Card darkMode={darkMode}><h3 className="text-xl font-black">Choosing a representative value</h3><p className={`mt-2 text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Choose based on measurement level, distribution shape, outliers, and the question—not a single automatic rule.</p><div className="grid gap-4 md:grid-cols-3 mt-5">{[
        ['Mean', 'Quantitative data with a reasonably interpretable average.', 'Uses every value; sensitive to skew and outliers.'],
        ['Median', 'Ordinal or quantitative data with skew or influential outliers.', 'Resistant to extremes; ignores distances among most observations.'],
        ['Mode', 'Nominal categories or the most common discrete value.', 'May be absent, tied, or unstable in a small sample.'],
    ].map(([name, use, caution]) => <div key={name} className={`rounded-xl border p-4 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}><h4 className="font-black text-indigo-400">{name}</h4><p className="mt-3 text-sm"><strong>Useful when:</strong> {use}</p><p className={`mt-3 text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}><strong>Caution:</strong> {caution}</p></div>)}</div></Card><Card darkMode={darkMode}><h3 className="font-black">Remember</h3><ul className={`mt-3 space-y-2 text-sm list-disc pl-5 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}><li>Report sample size and a measure of variability alongside center.</li><li>A large outlier pulls the mean toward it but usually has much less effect on the median.</li><li>A dataset can be multimodal or have no uniquely most frequent value.</li><li>Do not average numeric category codes whose distances have no quantitative meaning.</li></ul></Card></div>;
}
