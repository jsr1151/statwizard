import { useState } from 'react';
import { diceSumDistribution } from '../../stats/probability';
import DiceCltPanel from './DiceCltPanel';
import DiceExpectedValuePanel from './DiceExpectedValuePanel';
import DiceSinglePanel from './DiceSinglePanel';
import DiceSumPanel from './DiceSumPanel';

const MODES = [
  { id: 'single', label: 'Single' },
  { id: 'sum', label: 'Sums' },
  { id: 'clt', label: 'CLT' },
  { id: 'ev', label: 'EV Game' },
];

const getDiceSumDistribution = (diceCount) =>
  diceSumDistribution(diceCount).map(({ sum, probability }) => ({
    sum,
    prob: probability,
  }));

export default function DiceSimulation({ darkMode }) {
  const [diceSubMode, setDiceSubMode] = useState('single');
  const [diceType, setDiceType] = useState(6);
  const [diceResult, setDiceResult] = useState(1);
  const [diceHistory, setDiceHistory] = useState([]);
  const [diceCountVal, setDiceCountVal] = useState(2);
  const [diceSumHistory, setDiceSumHistory] = useState([]);
  const [cltHistory, setCltHistory] = useState([]);
  const [diceEvPayouts, setDiceEvPayouts] = useState({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 });
  const [diceEvHistory, setDiceEvHistory] = useState([]);

  const runDiceSumTrial = (count = 1) => {
    const results = [];
    for (let trial = 0; trial < count; trial += 1) {
      let sum = 0;
      for (let die = 0; die < diceCountVal; die += 1) {
        sum += Math.floor(Math.random() * 6) + 1;
      }
      results.push(sum);
    }
    setDiceSumHistory((previous) => [...previous, ...results]);
  };

  const runCLTTrial = (count = 1) => {
    const results = [];
    for (let trial = 0; trial < count; trial += 1) {
      let sum = 0;
      for (let die = 0; die < diceCountVal; die += 1) {
        sum += Math.floor(Math.random() * 6) + 1;
      }
      results.push(sum / diceCountVal);
    }
    setCltHistory((previous) => [...previous, ...results]);
  };

  const runDiceEVTrial = (count = 1) => {
    const results = Array.from({ length: count }, () => {
      const roll = Math.floor(Math.random() * 6) + 1;
      return diceEvPayouts[roll] || 0;
    });
    setDiceEvHistory((previous) => [...previous, ...results]);
  };

  return (
    <div className="animate-in fade-in duration-500 space-y-6">
      <div className="flex justify-center p-1 bg-slate-900/50 rounded-xl border border-white/5 max-w-sm mx-auto mb-4">
        {MODES.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => setDiceSubMode(id)}
            className={`flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${diceSubMode === id ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {diceSubMode === 'single' && (
        <DiceSinglePanel
          darkMode={darkMode}
          diceHistory={diceHistory}
          diceResult={diceResult}
          diceType={diceType}
          setDiceHistory={setDiceHistory}
          setDiceResult={setDiceResult}
          setDiceType={setDiceType}
        />
      )}
      {diceSubMode === 'sum' && (
        <DiceSumPanel
          darkMode={darkMode}
          diceCountVal={diceCountVal}
          diceSumHistory={diceSumHistory}
          getDiceSumDistribution={getDiceSumDistribution}
          runDiceSumTrial={runDiceSumTrial}
          setDiceCountVal={setDiceCountVal}
          setDiceSumHistory={setDiceSumHistory}
        />
      )}
      {diceSubMode === 'clt' && (
        <DiceCltPanel
          cltHistory={cltHistory}
          darkMode={darkMode}
          diceCountVal={diceCountVal}
          runCLTTrial={runCLTTrial}
          setCltHistory={setCltHistory}
          setDiceCountVal={setDiceCountVal}
        />
      )}
      {diceSubMode === 'ev' && (
        <DiceExpectedValuePanel
          darkMode={darkMode}
          diceEvHistory={diceEvHistory}
          diceEvPayouts={diceEvPayouts}
          runDiceEVTrial={runDiceEVTrial}
          setDiceEvPayouts={setDiceEvPayouts}
        />
      )}
    </div>
  );
}
