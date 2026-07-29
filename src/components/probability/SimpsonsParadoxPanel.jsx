export default function SimpsonsParadoxPanel({ darkMode, setSimpsonCounts, setSimpsonRates, simpsonCounts, simpsonRates }) {
  return (
    <div className="animate-in fade-in space-y-8 pb-10">
      <div className="text-center space-y-2">
        <h5 className="text-xl font-black text-white uppercase tracking-tight">Simpson's Paradox</h5>
        <p className="text-[11px] text-slate-500 italic">When aggregate data reverses the trend seen in groups.</p>
      </div>

      {/* Step 1: Rates */}
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-indigo-600/20 flex items-center justify-center text-[10px] font-black text-indigo-400">1</span>
            <h6 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Step 1: Compare Success Rates (Fixed)</h6>
          </div>
          <p className="text-[9px] text-slate-500 italic max-w-[250px] text-right leading-tight">Notice Treatment A is consistently better than B in both separate groups.</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: 'Easy Case', a: simpsonRates.aEasy, b: simpsonRates.bEasy },
            { label: 'Hard Case', a: simpsonRates.aHard, b: simpsonRates.bHard },
          ].map((row) => (
            <div key={row.label} className={`p-4 rounded-3xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'} space-y-3`}>
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-slate-500 uppercase">{row.label}</span>
                <span className="text-[8px] font-black px-2 py-0.5 rounded-full bg-indigo-600 text-white uppercase">A is Better</span>
              </div>
              <div className="space-y-2">
                <div className="space-y-1">
                  <div className="flex justify-between text-[8px] font-bold text-slate-400 uppercase">
                    <span>Tr. A</span>
                    <span>{(row.a * 100).toFixed(0)}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500" style={{ width: `${row.a * 100}%` }} />
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-[8px] font-bold text-slate-400 uppercase">
                    <span>Tr. B</span>
                    <span>{(row.b * 100).toFixed(0)}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-slate-600" style={{ width: `${row.b * 100}%` }} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Step 2: Weights/Sliders */}
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-indigo-600/20 flex items-center justify-center text-[10px] font-black text-indigo-400">2</span>
            <h6 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Step 2: Show the Case Mix (Interactive)</h6>
          </div>
          <p className="text-[9px] text-slate-500 italic max-w-[250px] text-right leading-tight">
            Adjust how many participants are in each case. Unbalanced groups cause the paradox.
          </p>
        </div>
        <div className={`p-6 rounded-3xl border ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50'} space-y-6`}>
          {[
            { id: 'a', label: 'Treatment A', easy: simpsonCounts.aEasy, hard: simpsonCounts.aHard, color: 'indigo' },
            { id: 'b', label: 'Treatment B', easy: simpsonCounts.bEasy, hard: simpsonCounts.bHard, color: 'slate' },
          ].map((tr) => (
            <div key={tr.id} className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-slate-500 uppercase">{tr.label} Distribution</span>
                <span className="text-[9px] font-bold text-slate-400 uppercase">Total N: {tr.easy + tr.hard}</span>
              </div>
              <div className="h-4 w-full bg-slate-800 rounded-full flex overflow-hidden shadow-inner">
                <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${(tr.easy / (tr.easy + tr.hard)) * 100}%` }} />
                <div className="h-full bg-rose-500 transition-all duration-500" style={{ width: `${(tr.hard / (tr.easy + tr.hard)) * 100}%` }} />
              </div>
              <div className="flex justify-between text-[8px] font-black uppercase tracking-tighter">
                <span className="text-emerald-500">Easy ({tr.easy})</span>
                <span className="text-rose-500">Hard ({tr.hard})</span>
              </div>
              <input
                type="range"
                min="10"
                max="1000"
                step="10"
                value={tr.hard}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  setSimpsonCounts((p) => ({ ...p, [`${tr.id}Hard`]: val }));
                }}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
            </div>
          ))}
          <div className="flex gap-4 pt-2">
            <button
              onClick={() => setSimpsonCounts({ aEasy: 500, aHard: 500, bEasy: 500, bHard: 500 })}
              className="flex-1 py-2 rounded-xl bg-slate-800 text-[9px] font-black text-slate-400 hover:text-white uppercase transition-all"
            >
              Balance Mix
            </button>
            <button
              onClick={() => setSimpsonCounts({ aEasy: 100, aHard: 900, bEasy: 100, bHard: 100 })}
              className="flex-1 py-2 rounded-xl bg-indigo-600/20 text-[9px] font-black text-indigo-400 hover:bg-indigo-600 hover:text-white uppercase transition-all"
            >
              Reset Paradox
            </button>
          </div>
        </div>
      </div>

      {/* Step 3: Overall */}
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-indigo-600/20 flex items-center justify-center text-[10px] font-black text-indigo-400">3</span>
            <h6 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Step 3: Show the Overall Outcome</h6>
          </div>
          <p className="text-[9px] text-slate-500 italic max-w-[250px] text-right leading-tight">The weighted average flips the winner when weights are heavily skewed.</p>
        </div>
        {(() => {
          const overallA = (simpsonCounts.aEasy * simpsonRates.aEasy + simpsonCounts.aHard * simpsonRates.aHard) / (simpsonCounts.aEasy + simpsonCounts.aHard);
          const overallB = (simpsonCounts.bEasy * simpsonRates.bEasy + simpsonCounts.bHard * simpsonRates.bHard) / (simpsonCounts.bEasy + simpsonCounts.bHard);
          const isReversed = overallB > overallA;

          return (
            <div className="space-y-6">
              <div
                className={`p-6 rounded-3xl border-2 transition-all ${isReversed ? 'bg-rose-500/10 border-rose-500/30 ring-4 ring-rose-500/5' : 'bg-emerald-500/10 border-emerald-500/30'}`}
              >
                <div className="flex justify-between items-center mb-6">
                  <div className="text-left">
                    <h6 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Aggregate Success Rate</h6>
                    <p className="text-[9px] text-slate-500 italic mt-1">Weighted average of group rates.</p>
                  </div>
                  {isReversed && <div className="px-3 py-1 rounded-full bg-rose-500 text-white text-[8px] font-black uppercase animate-bounce">Paradox Active</div>}
                </div>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex justify-between items-end">
                      <span className="text-[10px] font-black text-indigo-400 uppercase">Treatment A</span>
                      <span className="text-2xl font-black text-white">{(overallA * 100).toFixed(1)}%</span>
                    </div>
                    <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500 transition-all duration-700" style={{ width: `${overallA * 100}%` }} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-end">
                      <span className="text-[10px] font-black text-slate-400 uppercase">Treatment B</span>
                      <span className="text-2xl font-black text-white">{(overallB * 100).toFixed(1)}%</span>
                    </div>
                    <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-slate-600 transition-all duration-700" style={{ width: `${overallB * 100}%` }} />
                    </div>
                  </div>
                </div>
              </div>

              <div className={`p-5 rounded-2xl border border-dashed border-white/10 ${darkMode ? 'bg-slate-900 shadow-xl' : 'bg-slate-50'} space-y-4`}>
                <h6 className="text-[10px] font-black text-indigo-400 uppercase">The "Aha" Insight</h6>
                <ul className="space-y-3">
                  <li className="flex gap-3 text-[10px] leading-relaxed text-slate-400">
                    <span className="text-indigo-500 font-black">•</span>
                    <span>
                      <b className="text-white">A is better</b> in both cases, but B looks better overall when it's mostly tested on the{' '}
                      <b className="text-emerald-400 uppercase">Easy Case</b>.
                    </span>
                  </li>
                  <li className="flex gap-3 text-[10px] leading-relaxed text-slate-400">
                    <span className="text-indigo-500 font-black">•</span>
                    <span>When groups are unbalanced, the aggregate average gets "pulled" toward the weight of the larger group.</span>
                  </li>
                </ul>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
