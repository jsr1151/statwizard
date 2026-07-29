export default function DiceExpectedValuePanel({ darkMode, diceEvHistory, diceEvPayouts, runDiceEVTrial, setDiceEvPayouts }) {
  return (
    <div className="animate-in fade-in space-y-8">
      <div className="text-left">
        <h5 className={`text-xs font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Dice EV Game</h5>
        <p className="text-[10px] text-slate-500 mt-1">Set payouts for each face and track the average.</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[1, 2, 3, 4, 5, 6].map((face) => (
          <div key={face} className={`p-3 rounded-2xl border ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-100 shadow-sm'} space-y-2`}>
            <div className="flex justify-between items-center">
              <div className="w-6 h-6 rounded-lg bg-indigo-600 flex items-center justify-center text-[10px] font-black text-white">{face}</div>
              <input
                type="number"
                value={diceEvPayouts[face]}
                onChange={(e) => setDiceEvPayouts((p) => ({ ...p, [face]: parseFloat(e.target.value) || 0 }))}
                className="w-12 bg-transparent border-b border-indigo-500/20 text-right font-black text-white text-[10px] outline-none"
              />
            </div>
          </div>
        ))}
      </div>

      <div className="p-6 rounded-3xl bg-indigo-600/10 border border-indigo-500/20 text-center">
        <div className="text-[10px] font-black uppercase text-slate-500 mb-1">Theoretical EV</div>
        <div className="text-3xl font-black text-white">{(Object.values(diceEvPayouts).reduce((a, b) => a + b, 0) / 6).toFixed(2)}</div>
        <div className="text-[9px] font-bold text-indigo-400 mt-1 uppercase">
          Running Avg: {diceEvHistory.length > 0 ? (diceEvHistory.reduce((a, b) => a + b, 0) / diceEvHistory.length).toFixed(4) : '0.0000'}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <button onClick={() => runDiceEVTrial(10)} className="py-4 bg-slate-800 text-white rounded-2xl font-black text-xs uppercase shadow-lg active:scale-95 transition-all">
          +10 Rolls
        </button>
        <button onClick={() => runDiceEVTrial(1000)} className="py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase shadow-lg active:scale-95 transition-all">
          +1000 Rolls
        </button>
      </div>
    </div>
  );
}
