export default function CoinExpectedValuePanel({ binomP, darkMode, evHistory, evPayoutH, evPayoutT, runEVTrial, setEvHistory, setEvPayoutH, setEvPayoutT }) {
  return (
    <div className="animate-in fade-in space-y-8">
      <div className="text-left">
        <h5 className={`text-xs font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Expected Value Game</h5>
        <p className="text-[10px] text-slate-500 mt-1">Statistical average of outcomes weighed by probability.</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className={`p-6 rounded-3xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'} space-y-4`}>
          <div className="flex justify-between items-center">
            <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-[10px] font-black text-white">H</div>
            <input
              type="number"
              value={evPayoutH}
              onChange={(e) => setEvPayoutH(parseFloat(e.target.value) || 0)}
              className="w-16 bg-transparent border-b border-indigo-500/30 text-right font-black text-white outline-none"
            />
          </div>
          <div className="flex justify-between items-center text-[10px] font-black text-slate-500 uppercase">
            <span>Payout</span>
            <span className="text-emerald-400">P={(binomP * 100).toFixed(0)}%</span>
          </div>
        </div>
        <div className={`p-6 rounded-3xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'} space-y-4`}>
          <div className="flex justify-between items-center">
            <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center text-[10px] font-black text-white">T</div>
            <input
              type="number"
              value={evPayoutT}
              onChange={(e) => setEvPayoutT(parseFloat(e.target.value) || 0)}
              className="w-16 bg-transparent border-b border-rose-500/30 text-right font-black text-white outline-none"
            />
          </div>
          <div className="flex justify-between items-center text-[10px] font-black text-slate-500 uppercase">
            <span>Payout</span>
            <span className="text-emerald-400">P={((1 - binomP) * 100).toFixed(0)}%</span>
          </div>
        </div>
      </div>

      <div className="p-6 rounded-3xl bg-indigo-600/10 border border-indigo-500/20 text-center space-y-2">
        <div className="text-[10px] font-black uppercase text-slate-500">Theoretical Expected Value (EV)</div>
        <div className="text-4xl font-black text-white">{(binomP * evPayoutH + (1 - binomP) * evPayoutT).toFixed(2)}</div>
        <div className="text-[9px] font-bold text-indigo-400 uppercase">EV = Σ [ P(x) * Value(x) ]</div>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center text-[10px] font-black uppercase text-slate-500">
          <span>Session Results</span>
          <button onClick={() => setEvHistory([])} className="text-indigo-400 hover:underline">
            Clear
          </button>
        </div>
        <div className={`p-4 rounded-2xl border border-dashed ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase">Running Average:</span>
            <span className="text-lg font-black text-white">{evHistory.length > 0 ? (evHistory.reduce((a, b) => a + b, 0) / evHistory.length).toFixed(4) : '0.0000'}</span>
          </div>
          <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
            <div className="bg-indigo-500 h-full transition-all duration-300" style={{ width: `${Math.min(100, (evHistory.length / 1000) * 100)}%` }} />
          </div>
          <div className="mt-2 text-[8px] font-black text-slate-600 uppercase">Confidence increasing... ({evHistory.length} trials)</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => runEVTrial(10)}
          className="py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-black text-xs uppercase shadow-lg active:scale-95 transition-all"
        >
          +10 TRIALS
        </button>
        <button
          onClick={() => runEVTrial(1000)}
          className="py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-xs uppercase shadow-lg active:scale-95 transition-all"
        >
          +1000 TRIALS
        </button>
      </div>
    </div>
  );
}
