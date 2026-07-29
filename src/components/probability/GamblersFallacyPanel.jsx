export default function GamblersFallacyPanel({ darkMode, gamblerStreak, setGamblerStreak }) {
  return (
    <div className="animate-in fade-in space-y-8">
      <div className="text-center space-y-2">
        <h5 className="text-xl font-black text-white uppercase tracking-tight">Gambler's Fallacy</h5>
        <p className="text-[11px] text-slate-500 italic">"It's due for a win!" — The most expensive lie in statistics.</p>
      </div>

      <div className={`p-6 rounded-3xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'} space-y-6`}>
        <div className="flex flex-wrap justify-center gap-2 min-h-[40px]">
          {gamblerStreak.slice(-20).map((s, i) => (
            <div
              key={i}
              className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm text-white shadow-lg animate-in zoom-in-50 ${s === 'H' ? 'bg-indigo-600' : 'bg-slate-700'}`}
            >
              {s}
            </div>
          ))}
          {gamblerStreak.length === 0 && <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest self-center">Flip to start a streak</span>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => {
              const res = Math.random() > 0.5 ? 'H' : 'T';
              setGamblerStreak((p) => [...p, res]);
            }}
            className="py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black uppercase tracking-widest shadow-lg transition-all"
          >
            FLIP COIN
          </button>
          <button
            onClick={() => {
              const batch = Array.from({ length: 100 }, () => (Math.random() > 0.5 ? 'H' : 'T'));
              setGamblerStreak((p) => [...p, ...batch]);
            }}
            className="py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-black uppercase tracking-widest shadow-lg transition-all"
          >
            +100 FLIPS
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className={`p-5 rounded-3xl border border-dashed ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'} space-y-4`}>
          <div className="flex justify-between items-start">
            <h6 className="text-[10px] font-black text-indigo-400 uppercase">Streak Checker</h6>
            <div className="flex flex-col items-end gap-1">
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                <span className="text-[8px] font-black text-slate-500 uppercase">
                  Max H:{' '}
                  {(() => {
                    let max = 0,
                      curr = 0;
                    gamblerStreak.forEach((s) => {
                      if (s === 'H') {
                        curr++;
                        max = Math.max(max, curr);
                      } else curr = 0;
                    });
                    return max;
                  })()}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-slate-600" />
                <span className="text-[8px] font-black text-slate-500 uppercase">
                  Max T:{' '}
                  {(() => {
                    let max = 0,
                      curr = 0;
                    gamblerStreak.forEach((s) => {
                      if (s === 'T') {
                        curr++;
                        max = Math.max(max, curr);
                      } else curr = 0;
                    });
                    return max;
                  })()}
                </span>
              </div>
            </div>
          </div>
          <p className="text-[9px] text-slate-500 leading-relaxed italic border-t border-white/5 pt-3">
            Occurrences of 3+ Heads:{' '}
            <b>
              {(() => {
                let streaks = 0;
                for (let i = 0; i < gamblerStreak.length - 2; i++) {
                  if (gamblerStreak[i] === 'H' && gamblerStreak[i + 1] === 'H' && gamblerStreak[i + 2] === 'H') streaks++;
                }
                return streaks;
              })()}
            </b>
          </p>
          <div className="pt-2 border-t border-white/10">
            <div className="flex justify-between items-center text-[11px] font-black text-white">
              <span>Next Outcome:</span>
              <span className="text-indigo-400">ALWAYS 50%</span>
            </div>
          </div>
        </div>
        <div className="flex flex-col justify-center items-center p-4 bg-indigo-600/10 rounded-3xl border border-indigo-500/20">
          <span className="text-[10px] font-black text-white uppercase tracking-tighter">Memoryless</span>
          <p className="text-[8px] text-slate-500 mt-2 text-center leading-relaxed">The coin doesn't carry a tally. Each flip is a fresh start in the eyes of physics.</p>
        </div>
      </div>
    </div>
  );
}
