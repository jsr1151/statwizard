export default function DiceSumPanel({ darkMode, diceCountVal, diceSumHistory, getDiceSumDistribution, runDiceSumTrial, setDiceCountVal, setDiceSumHistory }) {
  return (
    <div className="animate-in fade-in space-y-6">
      <div className="flex justify-between items-start">
        <div className="text-left">
          <h5 className={`text-xs font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Sum of {diceCountVal} Dice</h5>
        </div>
        <button onClick={() => setDiceSumHistory([])} className="text-[9px] font-black text-indigo-400 uppercase">
          Reset
        </button>
      </div>

      <div className="space-y-4 bg-slate-900/20 p-4 rounded-2xl border border-white/5">
        <div className="flex justify-between text-[10px] font-black uppercase text-slate-500">
          <span>Dice Count: {diceCountVal}</span>
          <span>
            Range: {diceCountVal} - {6 * diceCountVal}
          </span>
        </div>
        <input
          type="range"
          min="2"
          max="10"
          step="1"
          value={diceCountVal}
          onChange={(e) => {
            setDiceCountVal(parseInt(e.target.value));
            setDiceSumHistory([]);
          }}
          className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
        />
        <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-4">
          <div className="text-center">
            <div className="text-[9px] uppercase text-slate-500 font-black">Mean</div>
            <div className="text-lg font-black text-white">{(diceCountVal * 3.5).toFixed(1)}</div>
          </div>
          <div className="text-center">
            <div className="text-[9px] uppercase text-slate-500 font-black">SD</div>
            <div className="text-lg font-black text-indigo-400">{Math.sqrt(diceCountVal * 2.917).toFixed(2)}</div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center text-[10px] font-black uppercase text-slate-500">
          <span>Distribution Graph</span>
        </div>
        <div className={`flex items-end gap-0.5 h-48 ${darkMode ? 'bg-slate-900/40' : 'bg-slate-50/50'} rounded-2xl p-6 border border-slate-700/20 relative`}>
          {getDiceSumDistribution(diceCountVal).map((d, i) => {
            const empiricalCount = diceSumHistory.filter((v) => v === d.sum).length;
            const empiricalProb = diceSumHistory.length > 0 ? empiricalCount / diceSumHistory.length : 0;
            const maxProb = Math.max(...getDiceSumDistribution(diceCountVal).map((x) => x.prob));
            return (
              <div key={d.sum} className="flex-1 flex flex-col items-center gap-1 justify-end relative group h-full">
                <div className="absolute inset-x-0 bg-indigo-500/20 rounded-t-sm" style={{ height: `${(d.prob / maxProb) * 100}%`, bottom: '0px' }} />
                <div className="w-full bg-emerald-500/80 rounded-t-sm" style={{ height: `${(empiricalProb / maxProb) * 100}%` }} />
                {diceCountVal < 5 && <span className="absolute -bottom-5 text-[8px] font-black text-slate-500">{d.sum}</span>}
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <button onClick={() => runDiceSumTrial(1)} className="py-4 bg-slate-800 text-white rounded-2xl font-black text-xs uppercase shadow-lg active:scale-95 transition-all">
          Trial
        </button>
        <button onClick={() => runDiceSumTrial(1000)} className="py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase shadow-lg active:scale-95 transition-all">
          1,000 Trials
        </button>
      </div>
    </div>
  );
}
