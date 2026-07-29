export default function DiceSinglePanel({ darkMode, diceHistory, diceResult, diceType, setDiceHistory, setDiceResult, setDiceType }) {
  return (
    <div className="animate-in fade-in space-y-6">
      <div className="flex justify-between items-end">
        <div className="text-left">
          <h5 className={`text-xs font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Single Die Distribution</h5>
          <button onClick={() => setDiceHistory([])} className="text-[9px] text-indigo-400 hover:underline font-bold">
            Clear History
          </button>
        </div>
        <div className="flex gap-2">
          {[4, 6, 8, 12, 20].map((n) => (
            <button
              key={n}
              onClick={() => setDiceType(n)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all ${diceType === n ? 'bg-indigo-600 text-white' : darkMode ? 'bg-slate-800 text-slate-400' : 'bg-white border text-slate-500'}`}
            >
              d{n}
            </button>
          ))}
        </div>
      </div>
      <div className="flex flex-col items-center gap-6">
        <div
          className={`w-20 h-20 rounded-2xl border-4 flex items-center justify-center text-3xl font-black shadow-xl animate-in zoom-in-50 duration-300 ${darkMode ? 'bg-slate-900 border-indigo-500 text-white' : 'bg-white border-indigo-500 text-slate-900'}`}
        >
          {diceResult}
        </div>
        <div className="grid grid-cols-2 gap-3 w-full">
          <button
            onClick={() => {
              const rolls = Array.from({ length: 10 }, () => Math.floor(Math.random() * diceType) + 1);
              setDiceResult(rolls[9]);
              setDiceHistory((prev) => [...prev, ...rolls]);
            }}
            className="py-2 rounded-xl text-[10px] font-black border border-slate-700"
          >
            +10 ROLLS
          </button>
          <button
            onClick={() => {
              const rolls = Array.from({ length: 100 }, () => Math.floor(Math.random() * diceType) + 1);
              setDiceResult(rolls[99]);
              setDiceHistory((prev) => [...prev, ...rolls]);
            }}
            className="py-2 rounded-xl text-[10px] font-black border border-slate-700"
          >
            +100 ROLLS
          </button>
        </div>
        <button
          onClick={() => {
            const roll = Math.floor(Math.random() * diceType) + 1;
            setDiceResult(roll);
            setDiceHistory((prev) => [...prev, roll]);
          }}
          className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase shadow-lg"
        >
          ROLL SINGLE DIE
        </button>
      </div>
      <div className="space-y-4 pt-4">
        <div className="flex justify-between items-center text-[10px] font-black uppercase text-slate-500">
          <span>Distribution (Total: {diceHistory.length})</span>
        </div>
        <div className={`flex items-end gap-1 h-32 ${darkMode ? 'bg-slate-900/40' : 'bg-slate-50/50'} rounded-xl p-2 border border-dashed border-slate-700/20`}>
          {Array.from({ length: diceType }, (_, i) => i + 1).map((val) => {
            const count = diceHistory.filter((h) => h === val).length;
            const maxCount = Math.max(...Array.from({ length: diceType }, (_, i) => diceHistory.filter((h) => i + 1 === h).length), 1);
            return (
              <div key={val} className="flex-1 flex flex-col items-center gap-1 group h-full justify-end">
                <div
                  className={`w-full rounded-t-sm transition-all duration-700 ${diceResult === val ? 'bg-indigo-500' : 'bg-slate-500/30'}`}
                  style={{ height: `${(count / maxCount) * 100}%` }}
                />
                <span className={`text-[8px] font-black ${diceResult === val ? 'text-indigo-400' : 'text-slate-600'}`}>{val}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
