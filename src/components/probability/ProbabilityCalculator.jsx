import { useId, useMemo, useState } from 'react';
import { Calculator } from 'lucide-react';
import { binomialProbability, combinations, diceSumDistribution } from '../../stats/probability';

const numberFromInput = (value) => value.trim() === '' ? Number.NaN : Number(value);
const validCount = (value) => Number.isSafeInteger(value) && value >= 0;

export default function ProbabilityCalculator({ darkMode }) {
  const id = useId();
  const [values, setValues] = useState({ favorable: '1', total: '6', n: '10', k: '5', p: '0.5', dice: '2' });
  const { favorable, total, n, k, p, dice } = Object.fromEntries(
    Object.entries(values).map(([key, value]) => [key, numberFromInput(value)]),
  );
  const invalid = {
    favorable: !validCount(favorable) || favorable > total,
    total: !validCount(total) || total < 1,
    n: !validCount(n),
    k: !validCount(k) || k > n,
    p: !Number.isFinite(p) || p < 0 || p > 1,
    dice: !validCount(dice) || dice < 1 || dice > 8,
  };
  const simpleValid = !invalid.favorable && !invalid.total;
  const binomialValid = !invalid.n && !invalid.k && !invalid.p;
  const binomial = useMemo(() => binomialValid ? binomialProbability({ trials: n, successes: k, probability: p }) : Number.NaN, [binomialValid, n, k, p]);
  const distribution = useMemo(() => diceSumDistribution(invalid.dice ? 0 : dice), [dice, invalid.dice]);
  const mostLikely = distribution.reduce((best, row) => !best || row.probability > best.probability ? row : best, null);
  const cardClass = `min-w-0 rounded-2xl border p-6 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`;
  const inputClass = `mt-2 w-full min-w-0 rounded-lg border p-3 ${darkMode ? 'bg-slate-950 border-slate-700' : 'bg-white border-slate-300'}`;
  const outputClass = `mt-6 text-3xl font-black ${darkMode ? 'text-indigo-300' : 'text-indigo-700'}`;
  const inputProps = (key, description) => ({
    type: 'number', value: values[key], className: inputClass,
    'aria-invalid': invalid[key], 'aria-describedby': `${id}-${description}`,
    onChange: (event) => setValues(previous => ({ ...previous, [key]: event.target.value })),
  });

  return <div className="space-y-6">
    <section className={cardClass}>
      <div className="flex gap-4">
        <div className="p-3 h-fit rounded-xl bg-indigo-500/10 text-indigo-400"><Calculator /></div>
        <div><h3 className="text-xl font-black">Probability calculators</h3><p className="mt-2 text-sm text-slate-500">Calculate equally likely outcomes, exact binomial probabilities, and dice-sum distributions.</p></div>
      </div>
    </section>
    <div className="grid gap-6 lg:grid-cols-3">
      <section className={cardClass}>
        <h4 className="font-black">Equally likely outcomes</h4>
        <div className="grid grid-cols-2 gap-3 mt-5">
          <label className="text-xs font-bold">Favorable<input {...inputProps('favorable', 'simple-help')} min="0" step="1" /></label>
          <label className="text-xs font-bold">Total<input {...inputProps('total', 'simple-help')} min="1" step="1" /></label>
        </div>
        <div role="status" className={outputClass}>{simpleValid ? `${(favorable / total * 100).toFixed(2)}%` : 'Invalid'}</div>
        <p id={`${id}-simple-help`} className="mt-2 text-xs text-slate-500">Use whole counts of equally likely outcomes: total must be positive and favorable must be between zero and total.</p>
      </section>
      <section className={cardClass}>
        <h4 className="font-black">Exact binomial probability</h4>
        <div className="grid grid-cols-3 gap-2 mt-5">
          <label className="text-xs font-bold">n<input {...inputProps('n', 'binomial-help')} min="0" step="1" /></label>
          <label className="text-xs font-bold">k<input {...inputProps('k', 'binomial-help')} min="0" step="1" /></label>
          <label className="text-xs font-bold">p<input {...inputProps('p', 'binomial-help')} min="0" max="1" step="0.01" /></label>
        </div>
        <div role="status" className={outputClass}>{Number.isFinite(binomial) ? `${(binomial * 100).toFixed(3)}%` : 'Invalid'}</div>
        <p id={`${id}-binomial-help`} className="mt-2 text-xs text-slate-500">n and k must be whole counts with 0 ≤ k ≤ n. p must be between 0 and 1.</p>
        {binomialValid && <p className="mt-2 text-xs text-slate-500">C({n}, {k}) = {combinations(n, k).toLocaleString()}</p>}
      </section>
      <section className={cardClass}>
        <h4 className="font-black">Dice-sum distribution</h4>
        <label className="block mt-5 text-xs font-bold">Number of six-sided dice<input {...inputProps('dice', 'dice-help')} min="1" max="8" step="1" /></label>
        <div role="status" className={`mt-6 text-lg font-black ${darkMode ? 'text-indigo-300' : 'text-indigo-700'}`}>{mostLikely ? `Most likely sum: ${mostLikely.sum}` : 'Invalid'}</div>
        <p className="mt-2 text-sm text-slate-500">Probability: {mostLikely ? `${(mostLikely.probability * 100).toFixed(2)}%` : '—'}</p>
        <p id={`${id}-dice-help`} className="mt-2 text-xs text-slate-500">Choose a whole number of dice from 1 to 8.</p>
      </section>
    </div>
  </div>;
}
