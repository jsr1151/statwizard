export default function DiceCltPanel({ cltHistory, darkMode, diceCountVal, runCLTTrial, setCltHistory, setDiceCountVal }) {
  return (
    <div className="animate-in fade-in space-y-6">
      <div className="flex justify-between items-start">
        <div className="text-left">
          <h5 className={`text-xs font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Central Limit Theorem</h5>
        </div>
        <button onClick={() => setCltHistory([])} className="text-[9px] font-black text-indigo-400 uppercase">
          Reset
        </button>
      </div>

      <div className="space-y-4 bg-slate-900/10 p-4 rounded-2xl border border-indigo-500/10">
        <div className="flex justify-between text-[10px] font-black uppercase text-slate-500">
          <span>Sample Size (k dice): {diceCountVal}</span>
        </div>
        <input
          type="range"
          min="1"
          max="15"
          step="1"
          value={diceCountVal}
          onChange={(e) => {
            setDiceCountVal(parseInt(e.target.value));
            setCltHistory([]);
          }}
          className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
        />
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center text-[10px] font-black uppercase text-slate-500">
          <span>Sampling Distribution</span>
        </div>
        <div className={`flex items-end gap-0.5 h-40 ${darkMode ? 'bg-slate-950' : 'bg-slate-50'} rounded-2xl p-6 border border-slate-800/20 relative mb-6`}>
          {Array.from({ length: 15 }).map((_, i) => {
            const binStart = 1 + (i / 15) * 5;
            const binEnd = 1 + ((i + 1) / 15) * 5;
            const count = cltHistory.filter((v) => v >= binStart && v < binEnd).length;
            const counts = Array.from({ length: 15 }).map((_, j) => cltHistory.filter((v) => v >= 1 + (j / 15) * 5 && v < 1 + ((j + 1) / 15) * 5).length);
            const maxCount = Math.max(...counts, 1);
            return (
              <div key={i} className="flex-1 bg-indigo-600/80 rounded-t-sm relative h-full flex flex-col justify-end">
                <div className="w-full bg-indigo-500 rounded-t-sm" style={{ height: `${(count / maxCount) * 100}%` }} />
                <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[8px] font-black text-slate-500">{binStart.toFixed(1)}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <button onClick={() => runCLTTrial(10)} className="py-4 bg-slate-800 text-white rounded-2xl font-black text-xs uppercase shadow-lg active:scale-95 transition-all">
          Trial
        </button>
        <button onClick={() => runCLTTrial(1000)} className="py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase shadow-lg active:scale-95 transition-all">
          1,000 Trials
        </button>
      </div>
    </div>
  );
}
