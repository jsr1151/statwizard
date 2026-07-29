import { Info } from 'lucide-react';

export default function CardReplacementPanel({ darkMode, replaceHandSize, replaceWithRep, setReplaceHandSize, setReplaceWithRep }) {
  return (
    <div className="animate-in fade-in space-y-6">
      <div className="text-center">
        <h5 className="text-xl font-black text-white uppercase tracking-tight">Replace vs No Replace</h5>
        <p className="text-[10px] text-slate-500 uppercase font-bold mt-1">The "Misconception Killer": Independence vs Dependence</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
          <span className="text-[9px] font-black text-slate-500 uppercase block mb-2">Success Rate (P)</span>
          <div className="text-2xl font-black text-indigo-400">25%</div>
          <div className="text-[8px] text-slate-600 font-bold uppercase mt-1 italic">Drawing a Heart (13/52)</div>
        </div>
        <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
          <span className="text-[9px] font-black text-slate-500 uppercase block mb-2">Draw Count (k)</span>
          <div className="text-2xl font-black text-white">{replaceHandSize}</div>
          <input
            type="range"
            min="2"
            max="8"
            step="1"
            value={replaceHandSize}
            onChange={(e) => setReplaceHandSize(parseInt(e.target.value))}
            className="w-full mt-2 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className={`p-6 rounded-3xl border-2 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'} space-y-4 relative overflow-hidden`}>
          <div className="absolute top-0 right-0 p-2 bg-indigo-600/10 text-indigo-400 text-[8px] font-black uppercase tracking-widest rounded-bl-xl">Independent</div>
          <h6 className="text-[10px] font-black text-white uppercase tracking-widest">With Replacement</h6>
          <p className="text-[9px] text-slate-500 leading-relaxed">The deck never changes. Each draw is always 13/52.</p>

          <div className="pt-4 border-t border-white/5 text-center">
            <div className="text-3xl font-black text-indigo-400">{(Math.pow(0.25, replaceHandSize) * 100).toFixed(4)}%</div>
            <div className="text-[9px] font-mono text-slate-500 mt-2">P(A)^k = (0.25)^{replaceHandSize}</div>
          </div>
        </div>

        <div
          className={`p-6 rounded-3xl border-2 ${darkMode ? 'bg-emerald-500/10 border-emerald-500/20 shadow-xl shadow-emerald-500/5' : 'bg-emerald-50 border-emerald-100'} space-y-4 relative overflow-hidden`}
        >
          <div className="absolute top-0 right-0 p-2 bg-emerald-500/20 text-emerald-400 text-[8px] font-black uppercase tracking-widest rounded-bl-xl">Dependent</div>
          <h6 className="text-[10px] font-black text-white uppercase tracking-widest">Without Replacement</h6>
          <p className="text-[9px] text-slate-500 leading-relaxed">Success gets HARDER after each success as pool shrinks.</p>

          <div className="pt-4 border-t border-white/5 text-center">
            {(() => {
              let p = 1;
              for (let i = 0; i < replaceHandSize; i++) p *= (13 - i) / (52 - i);
              return (
                <>
                  <div className="text-3xl font-black text-emerald-400">{(p * 100).toFixed(4)}%</div>
                  <div className="text-[9px] font-mono text-slate-500 mt-2">
                    {Array.from({ length: replaceHandSize })
                      .map((_, i) => `${13 - i}/${52 - i}`)
                      .join(' × ')}
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      </div>

      <div
        className={`p-5 rounded-2xl border border-dashed text-center ${darkMode ? 'bg-slate-950/50 border-slate-800 text-slate-500' : 'bg-slate-50 border-slate-200 text-slate-500'}`}
      >
        <Info className="w-4 h-4 mx-auto mb-2 opacity-50 text-indigo-400" />
        <p className="text-[10px] leading-relaxed font-medium italic">
          Notice how <b>Without Replacement</b> becomes significantly less likely! This is why card counting works in blackjack: drawing high cards reduces the chance of drawing
          more high cards, shifting the odds.
        </p>
      </div>
    </div>
  );
}
