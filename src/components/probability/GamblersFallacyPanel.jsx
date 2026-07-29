import { useState } from 'react';

export default function GamblersFallacyPanel({ darkMode, gamblerStreak, setGamblerStreak }) {
  const [prediction, setPrediction] = useState('H');
  const [stats, setStats] = useState({ correct: 0, total: 0 });
  const [experiment, setExperiment] = useState(null);

  const flip = () => {
    const result = Math.random() < 0.5 ? 'H' : 'T';
    setGamblerStreak((previous) => [...previous, result]);
    setStats((previous) => ({ correct: previous.correct + Number(prediction === result), total: previous.total + 1 }));
  };

  const simulateAfterStreak = () => {
    let heads = 0;
    for (let i = 0; i < 1000; i += 1) heads += Number(Math.random() < 0.5);
    setExperiment({ heads, tails: 1000 - heads });
  };

  return (
    <div className="animate-in fade-in space-y-6">
      <div className="text-center space-y-2">
        <h5 className="text-xl font-black text-white uppercase tracking-tight">Test the Gambler's Fallacy</h5>
        <p className="text-xs text-slate-400">A streak describes the past. It does not change an independent coin's next flip.</p>
      </div>
      <div className={`p-5 rounded-3xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'} space-y-5`}>
        <div className="text-center">
          <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400">1. Predict the next flip</p>
          <div className="inline-flex gap-2 mt-3">
            {['H', 'T'].map((side) => <button key={side} type="button" onClick={() => setPrediction(side)} className={`px-6 py-2 rounded-xl font-black ${prediction === side ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'}`}>{side === 'H' ? 'Heads' : 'Tails'}</button>)}
          </div>
        </div>
        <div className="flex flex-wrap justify-center gap-2 min-h-10">
          {gamblerStreak.slice(-18).map((side, index) => <div key={`${index}-${side}`} className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-white ${side === 'H' ? 'bg-indigo-600' : 'bg-slate-700'}`}>{side}</div>)}
          {!gamblerStreak.length && <span className="self-center text-xs text-slate-500">Your results will appear here.</span>}
        </div>
        <button type="button" onClick={flip} className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black uppercase tracking-widest">Flip the coin</button>
        <div className="grid grid-cols-2 gap-3 text-center">
          <div className="rounded-2xl bg-slate-950/40 p-3"><div className="text-2xl font-black text-white">{stats.correct}/{stats.total}</div><div className="text-[9px] uppercase tracking-widest text-slate-500">Predictions correct</div></div>
          <div className="rounded-2xl bg-slate-950/40 p-3"><div className="text-2xl font-black text-indigo-400">{stats.total ? `${((stats.correct / stats.total) * 100).toFixed(0)}%` : '--'}</div><div className="text-[9px] uppercase tracking-widest text-slate-500">Your accuracy</div></div>
        </div>
      </div>
      <div className={`p-5 rounded-3xl border ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'} space-y-4`}>
        <div><h6 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">2. What happens after H H H H?</h6><p className="mt-2 text-xs text-slate-400 leading-relaxed">Imagine 1,000 separate fair coins have each just landed heads four times. Simulate only their next flips. If tails were "due," tails should dominate.</p></div>
        <button type="button" onClick={simulateAfterStreak} className="w-full py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-black uppercase tracking-wider">Simulate 1,000 next flips</button>
        {experiment && <div className="space-y-2"><div className="flex h-9 overflow-hidden rounded-xl text-xs font-black text-white"><div className="bg-indigo-600 flex items-center justify-center" style={{ width: `${experiment.heads / 10}%` }}>H {experiment.heads}</div><div className="bg-slate-600 flex items-center justify-center" style={{ width: `${experiment.tails / 10}%` }}>T {experiment.tails}</div></div><p className="text-center text-xs text-slate-400">Heads occurred {(experiment.heads / 10).toFixed(1)}%. It varies, but settles near 50% over many trials.</p></div>}
      </div>
    </div>
  );
}
