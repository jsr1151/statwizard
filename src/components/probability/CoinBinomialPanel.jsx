export default function CoinBinomialPanel({ binomHistory, binomN, binomP, darkMode, nCr, runBinomTrial, setBinomHistory, setBinomN, setBinomP }) {
  return (
    <div className="animate-in fade-in space-y-6">
      <div className="flex justify-between items-start">
        <div className="text-left">
          <h5 className={`text-xs font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Binomial Distribution</h5>
          <p className="text-[10px] text-slate-500 mt-1">
            Probability of <i>k</i> successes in <i>n</i> trials.
          </p>
        </div>
        <button onClick={() => setBinomHistory([])} className={`text-[9px] font-black text-indigo-400 hover:underline uppercase`}>
          Reset History
        </button>
      </div>

      <div className="grid grid-cols-2 gap-6 bg-slate-900/20 p-4 rounded-2xl border border-white/5">
        <div className="space-y-4">
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] font-black uppercase text-slate-500">
              <span>n (Flips): {binomN}</span>
            </div>
            <input
              type="range"
              min="1"
              max="20"
              step="1"
              value={binomN}
              onChange={(e) => {
                setBinomN(parseInt(e.target.value));
                setBinomHistory([]);
              }}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] font-black uppercase text-slate-500">
              <span>p (Bias): {(binomP * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={binomP}
              onChange={(e) => {
                setBinomP(parseFloat(e.target.value));
                setBinomHistory([]);
              }}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
          </div>
        </div>
        <div className="space-y-2 border-l border-white/5 pl-6">
          <div className="text-[9px] font-black uppercase text-slate-500">Theoretical Center</div>
          <div className="text-lg font-black text-white">μ = {(binomN * binomP).toFixed(2)}</div>
          <div className="text-[9px] font-black uppercase text-slate-500">Std Deviation</div>
          <div className="text-lg font-black text-indigo-400">σ = {Math.sqrt(binomN * binomP * (1 - binomP)).toFixed(2)}</div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center text-[10px] font-black uppercase text-slate-500">
          <span>
            P(k Successes) — <span className="text-indigo-400">Theory</span> vs <span className="text-emerald-400">Sim</span>
          </span>
          <span>Trials: {binomHistory.length}</span>
        </div>
        <div className={`flex items-end gap-1 h-32 ${darkMode ? 'bg-slate-900/40' : 'bg-slate-50/50'} rounded-xl p-4 border border-dashed border-slate-700/20 relative`}>
          {Array.from({ length: binomN + 1 }).map((_, k) => {
            const theoreticalProb = nCr(binomN, k) * Math.pow(binomP, k) * Math.pow(1 - binomP, binomN - k);
            const empiricalCount = binomHistory.filter((v) => v === k).length;
            const empiricalProb = binomHistory.length > 0 ? empiricalCount / binomHistory.length : 0;
            return (
              <div key={k} className="flex-1 flex flex-col items-center gap-1 group h-full justify-end relative">
                {/* Theoretical Bar */}
                <div className="absolute inset-x-0 bg-indigo-500/20 rounded-t-sm" style={{ height: `${theoreticalProb * 100}%`, bottom: '15px', zIndex: 1 }} />
                {/* Empirical Bar */}
                <div className="w-full bg-emerald-500/80 rounded-t-sm transition-all duration-300" style={{ height: `${empiricalProb * 100}%`, marginBottom: '0px', zIndex: 2 }} />
                <span className="text-[8px] font-black text-slate-600 mt-1">{k}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => runBinomTrial(1)}
          className="py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg active:scale-95 transition-all"
        >
          Run 1 Trial
        </button>
        <button
          onClick={() => runBinomTrial(1000)}
          className="py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg active:scale-95 transition-all"
        >
          Run 1000 Trials
        </button>
      </div>
    </div>
  );
}
