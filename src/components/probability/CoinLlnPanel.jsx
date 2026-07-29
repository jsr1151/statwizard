export default function CoinLlnPanel({ coinFlipState, coinStats, darkMode, flipBatch, setCoinFlipState, setCoinStats }) {
  return (
    <div className="animate-in fade-in space-y-8">
      <div className="flex justify-between items-end">
        <div className="text-left">
          <h5 className={`text-xs font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Law of Large Numbers</h5>
          <p className="text-[10px] text-slate-500 mt-1">Watch as empirical probability approaches theory.</p>
        </div>
        <button
          onClick={() => {
            setCoinStats({ heads: 0, tails: 0, total: 0 });
            setCoinFlipState({ flipping: false, lastSide: 'heads' });
          }}
          className={`text-[10px] font-bold px-3 py-1 rounded-lg border transition-all ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
        >
          Reset
        </button>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-around gap-8">
        <div className="relative w-32 h-32 [perspective:1000px]">
          <div
            className={`w-full h-full relative transition-all duration-1000 [transform-style:preserve-3d]`}
            style={{ transform: `rotateY(${coinFlipState.angle || 0}deg)`, transitionTimingFunction: 'cubic-bezier(0.15, 0, 0.15, 1)' }}
            onTransitionEnd={() => setCoinFlipState((prev) => ({ ...prev, flipping: false }))}
          >
            <div
              className={`absolute inset-0 rounded-full border-4 border-amber-600 bg-amber-500 flex items-center justify-center text-amber-100 font-black text-4xl shadow-xl [backface-visibility:hidden]`}
            >
              H
            </div>
            <div
              className={`absolute inset-0 rounded-full border-4 border-slate-400 bg-slate-600 flex items-center justify-center text-slate-100 font-black text-4xl shadow-xl [backface-visibility:hidden] [transform:rotateY(180deg)]`}
            >
              T
            </div>
          </div>
        </div>

        <div className="relative w-32 h-32">
          <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
            <circle cx="50" cy="50" r="40" fill="transparent" stroke={darkMode ? '#334155' : '#e2e8f0'} strokeWidth="20" />
            {coinStats.total > 0 && (
              <>
                <circle cx="50" cy="50" r="40" fill="transparent" stroke="#f59e0b" strokeWidth="20" strokeDasharray={`${(coinStats.heads / coinStats.total) * 251.2} 251.2`} />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="transparent"
                  stroke="#94a3b8"
                  strokeWidth="20"
                  strokeDasharray={`${(coinStats.tails / coinStats.total) * 251.2} 251.2`}
                  strokeDashoffset={`-${(coinStats.heads / coinStats.total) * 251.2}`}
                />
              </>
            )}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className={`text-[10px] font-black ${darkMode ? 'text-slate-300' : 'text-slate-900'}`}>
              {coinStats.total > 0 ? `${((coinStats.heads / coinStats.total) * 100).toFixed(0)}%` : '0%'}
            </span>
            <span className="text-[8px] font-bold text-slate-500 uppercase">Heads</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className={`p-4 rounded-3xl border text-center ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-100 shadow-sm'}`}>
          <div className="text-2xl font-black text-indigo-500">{coinStats.heads}</div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Heads</div>
        </div>
        <div className={`p-4 rounded-3xl border text-center ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-100 shadow-sm'}`}>
          <div className="text-2xl font-black text-slate-400">{coinStats.tails}</div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Tails</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={() => flipBatch(10)}
          className={`py-2 rounded-xl text-[10px] font-black transition-all border ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
        >
          +10 FLIPS
        </button>
        <button
          onClick={() => flipBatch(100)}
          className={`py-2 rounded-xl text-[10px] font-black transition-all border ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
        >
          +100 FLIPS
        </button>
        <button
          onClick={() => flipBatch(1000)}
          className={`py-2 rounded-xl text-[10px] font-black transition-all border ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
        >
          +1000 FLIPS
        </button>
      </div>

      <button
        onClick={() => {
          if (coinFlipState.flipping) return;
          const isHeads = Math.random() > 0.5;
          const currentAngle = coinFlipState.angle || 0;
          const currentSide = Math.round(currentAngle / 180) % 2 === 0 ? 'heads' : 'tails';
          let rotationToAdd = 1440;
          if (isHeads && currentSide === 'tails') rotationToAdd += 180;
          if (!isHeads && currentSide === 'heads') rotationToAdd += 180;
          setCoinFlipState({ flipping: true, angle: currentAngle + rotationToAdd, lastSide: isHeads ? 'heads' : 'tails' });
          setCoinStats((prev) => ({ heads: prev.heads + (isHeads ? 1 : 0), tails: prev.tails + (isHeads ? 0 : 1), total: prev.total + 1 }));
        }}
        className={`w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest transition-all shadow-lg active:scale-95 ${coinFlipState.flipping ? 'opacity-50 cursor-not-allowed' : 'hover:bg-indigo-500'}`}
      >
        SINGLE FLIP
      </button>
    </div>
  );
}
