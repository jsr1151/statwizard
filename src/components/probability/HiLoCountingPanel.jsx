export default function HiLoCountingPanel({ darkMode, hiLoCount, hiLoDeck, hiLoHistory, setHiLoCount, setHiLoDeck, setHiLoHistory }) {
  return (
    <div className="animate-in fade-in space-y-6">
      <div className="text-center">
        <h5 className="text-xl font-black text-white uppercase tracking-tight">Hi-Lo Card Counting</h5>
        <p className="text-[10px] text-slate-500 uppercase font-bold mt-1">Advantage Play & Conditional Probability</p>
      </div>

      <div className="flex justify-center gap-4">
        <div
          className={`w-32 h-44 rounded-2xl border-2 flex flex-col items-center justify-center p-4 transition-all ${hiLoHistory.length > 0 ? (['10', 'J', 'Q', 'K', 'A'].includes(hiLoHistory[0].rank) ? 'border-rose-500 bg-rose-500/10' : ['2', '3', '4', '5', '6'].includes(hiLoHistory[0].rank) ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-700 bg-slate-900') : 'border-slate-800 bg-slate-900/50'}`}
        >
          {hiLoHistory.length > 0 ? (
            <>
              <div className={`text-4xl font-black mb-2 ${['♥', '♦'].includes(hiLoHistory[0].suit) ? 'text-rose-500' : 'text-slate-300'}`}>{hiLoHistory[0].rank}</div>
              <div className={`text-5xl ${['♥', '♦'].includes(hiLoHistory[0].suit) ? 'text-rose-500' : 'text-slate-300'}`}>{hiLoHistory[0].suit}</div>
            </>
          ) : (
            <div className="text-slate-600 font-black text-center text-[10px] uppercase">Flip a Card</div>
          )}
        </div>

        <div className="space-y-4 flex-1">
          <div
            className={`p-4 rounded-3xl border-2 ${hiLoCount > 0 ? 'bg-emerald-500/10 border-emerald-500/20' : hiLoCount < 0 ? 'bg-rose-500/10 border-rose-500/20' : 'bg-slate-900 border-slate-800'}`}
          >
            <div className="text-[10px] font-black text-slate-500 uppercase mb-1">Running Count</div>
            <div className={`text-4xl font-black ${hiLoCount > 0 ? 'text-emerald-400' : hiLoCount < 0 ? 'text-rose-500' : 'text-white'}`}>
              {hiLoCount > 0 ? '+' : ''}
              {hiLoCount}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                const suits = ['♠', '♥', '♦', '♣'];
                const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
                let currentDeck = hiLoDeck.length > 0 ? [...hiLoDeck] : [];
                if (currentDeck.length === 0) {
                  suits.forEach((s) => ranks.forEach((r) => currentDeck.push({ suit: s, rank: r })));
                }
                const card = currentDeck.splice(Math.floor(Math.random() * currentDeck.length), 1)[0];

                let delta = 0;
                if (['10', 'J', 'Q', 'K', 'A'].includes(card.rank)) delta = -1;
                else if (['2', '3', '4', '5', '6'].includes(card.rank)) delta = 1;

                setHiLoCount((prev) => prev + delta);
                setHiLoHistory([card, ...hiLoHistory]);
                setHiLoDeck(currentDeck);
              }}
              className="py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black uppercase text-[10px] transition-all"
            >
              Flip Card
            </button>
            <button
              onClick={() => {
                setHiLoCount(0);
                setHiLoHistory([]);
                setHiLoDeck([]);
              }}
              className="py-3 bg-slate-800 text-slate-400 rounded-xl font-black uppercase text-[10px]"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      <div className={`p-6 rounded-3xl border ${darkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50 border-slate-200'} space-y-4`}>
        <div className="flex justify-between items-center">
          <h6 className="text-[10px] font-black text-white uppercase tracking-widest">Deck Composition Effect</h6>
          <span className="text-[10px] font-bold text-slate-500 uppercase">{hiLoDeck.length || 52} Cards Left</span>
        </div>

        {(() => {
          const deck = hiLoDeck.length > 0 ? hiLoDeck : Array(52).fill(null);
          // If deck is virtual (nulls), we use the starting ratio
          const total = deck.length;
          const highLeft = hiLoDeck.length > 0 ? hiLoDeck.filter((c) => ['10', 'J', 'Q', 'K', 'A'].includes(c.rank)).length : 20;
          const probHigh = highLeft / total;

          return (
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <div className="text-left">
                  <div className="text-[8px] font-black text-slate-400 uppercase mb-1">Prob of Big Card (10-A)</div>
                  <div className="text-2xl font-black text-white">{(probHigh * 100).toFixed(1)}%</div>
                </div>
                <div className={`text-[10px] font-black uppercase px-2 py-1 rounded-lg ${hiLoCount > 2 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                  {hiLoCount > 2 ? 'Deep Deck Advantage' : 'Neutral Deck'}
                </div>
              </div>

              <div className="h-2 bg-slate-800 rounded-full overflow-hidden flex">
                <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${(probHigh / (20 / 52)) * 50}%` }} />
                <div className="h-full bg-slate-700" style={{ width: '2px' }} />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="text-center p-2 rounded-xl bg-slate-800/50 border border-white/5">
                  <div className="text-[7px] font-black text-slate-500 uppercase mb-1">Low (2-6)</div>
                  <div className="text-xs font-black text-emerald-400">+1</div>
                </div>
                <div className="text-center p-2 rounded-xl bg-slate-800/50 border border-white/5">
                  <div className="text-[7px] font-black text-slate-500 uppercase mb-1">Neutral (7-9)</div>
                  <div className="text-xs font-black text-slate-400">0</div>
                </div>
                <div className="text-center p-2 rounded-xl bg-slate-800/50 border border-white/5">
                  <div className="text-[7px] font-black text-slate-500 uppercase mb-1">High (10-A)</div>
                  <div className="text-xs font-black text-rose-500">-1</div>
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      <div
        className={`p-4 rounded-xl border border-dashed text-[9px] font-medium italic leading-relaxed text-center ${darkMode ? 'bg-slate-900 border-slate-800 text-slate-500' : 'bg-slate-50 border-slate-200 text-slate-500'}`}
      >
        Card counting tracks the <b>relative concentration</b> of Big Cards remaining. High counts (+5, +10) mean the remaining deck is richer in 10s and Aces, shifting the
        conditional probability in favor of the player!
      </div>
    </div>
  );
}
