import { useState } from 'react';
import { combinations } from '../../stats/probability';
import CoinBinomialPanel from './CoinBinomialPanel';
import CoinExpectedValuePanel from './CoinExpectedValuePanel';
import CoinLlnPanel from './CoinLlnPanel';

const MODES = [
  { id: 'lln', label: 'LLN' },
  { id: 'binom', label: 'Binomial' },
  { id: 'ev', label: 'EV Game' },
];

export default function CoinSimulation({ darkMode }) {
  const [coinFlipState, setCoinFlipState] = useState({ flipping: false, lastSide: 'heads' });
  const [coinStats, setCoinStats] = useState({ heads: 0, tails: 0, total: 0 });
  const [coinSubMode, setCoinSubMode] = useState('lln');
  const [binomN, setBinomN] = useState(10);
  const [binomP, setBinomP] = useState(0.5);
  const [binomHistory, setBinomHistory] = useState([]);
  const [evPayoutH, setEvPayoutH] = useState(1);
  const [evPayoutT, setEvPayoutT] = useState(-1);
  const [evHistory, setEvHistory] = useState([]);

  const flipBatch = (count) => {
    let heads = 0;
    let tails = 0;
    for (let index = 0; index < count; index += 1) {
      if (Math.random() > 0.5) heads += 1;
      else tails += 1;
    }
    setCoinStats((previous) => ({
      heads: previous.heads + heads,
      tails: previous.tails + tails,
      total: previous.total + count,
    }));
  };

  const runBinomTrial = (count = 1) => {
    const results = [];
    for (let trial = 0; trial < count; trial += 1) {
      let successes = 0;
      for (let flip = 0; flip < binomN; flip += 1) {
        if (Math.random() < binomP) successes += 1;
      }
      results.push(successes);
    }
    setBinomHistory((previous) => [...previous, ...results]);
  };

  const runEVTrial = (count = 1) => {
    const results = Array.from({ length: count }, () => (Math.random() < binomP ? evPayoutH : evPayoutT));
    setEvHistory((previous) => [...previous, ...results]);
  };

  return (
    <div className="animate-in fade-in duration-500 space-y-8">
      <div className="flex justify-center p-1 bg-slate-900/50 rounded-xl border border-white/5 max-w-sm mx-auto mb-4">
        {MODES.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => setCoinSubMode(id)}
            className={`flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${coinSubMode === id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-500 hover:text-white'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {coinSubMode === 'lln' && (
        <CoinLlnPanel
          coinFlipState={coinFlipState}
          coinStats={coinStats}
          darkMode={darkMode}
          flipBatch={flipBatch}
          setCoinFlipState={setCoinFlipState}
          setCoinStats={setCoinStats}
        />
      )}
      {coinSubMode === 'binom' && (
        <CoinBinomialPanel
          binomHistory={binomHistory}
          binomN={binomN}
          binomP={binomP}
          darkMode={darkMode}
          nCr={combinations}
          runBinomTrial={runBinomTrial}
          setBinomHistory={setBinomHistory}
          setBinomN={setBinomN}
          setBinomP={setBinomP}
        />
      )}
      {coinSubMode === 'ev' && (
        <CoinExpectedValuePanel
          binomP={binomP}
          darkMode={darkMode}
          evHistory={evHistory}
          evPayoutH={evPayoutH}
          evPayoutT={evPayoutT}
          runEVTrial={runEVTrial}
          setEvHistory={setEvHistory}
          setEvPayoutH={setEvPayoutH}
          setEvPayoutT={setEvPayoutT}
        />
      )}
    </div>
  );
}
