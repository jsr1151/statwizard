export default function DeckTrackerPanel({ darkMode, deckRevealHistory, setDeckRevealHistory }) {
  return (
    <div className="animate-in fade-in space-y-6">
      <div className="text-center">
        <h5 className="text-xl font-black text-white uppercase tracking-tight">Conditional Tracker</h5>
        <p className="text-[10px] text-slate-500 uppercase font-bold mt-1">Given the cards we've seen, what happens next?</p>
      </div>

      <div className="flex gap-4">
        <div className="flex-1 space-y-4">
          <div className={`p-6 rounded-3xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
            <div className="flex justify-between items-center mb-4">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Live Probabilities</span>
              <div className="text-[9px] font-bold text-indigo-400">Remaining: {52 - deckRevealHistory.length}/52</div>
            </div>

            <div className="space-y-4">
              {(() => {
                const seen = deckRevealHistory;
                const remainingCount = 52 - seen.length;
                if (remainingCount === 0) return <p className="text-xs text-slate-500 italic">Deck is empty!</p>;

                const redsSeen = seen.filter((c) => ['♥', '♦'].includes(c.suit)).length;
                const heartsSeen = seen.filter((c) => c.suit === '♥').length;

                const pNextRed = (26 - redsSeen) / remainingCount;
                const pNextHeart = (13 - heartsSeen) / remainingCount;

                // P(Heart in next 3) = 1 - P(No heart in next 3)
                let pNoHeartNext3 = 1;
                const remainingHearts = 13 - heartsSeen;
                const remainingNonHearts = remainingCount - remainingHearts;

                const drawCount = Math.min(3, remainingCount);
                for (let i = 0; i < drawCount; i++) {
                  pNoHeartNext3 *= (remainingNonHearts - i) / (remainingCount - i);
                }
                const pHeartIn3 = 1 - pNoHeartNext3;

                return (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-300">Next is Red/Black</span>
                      <span className="text-lg font-black text-indigo-400">{(pNextRed * 100).toFixed(1)}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-300">Next is Heart</span>
                      <span className="text-lg font-black text-rose-400">{(pNextHeart * 100).toFixed(1)}%</span>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-white/5">
                      <span className="text-[11px] font-bold text-slate-300">Heart in next 3 cards</span>
                      <span className="text-lg font-black text-emerald-400">{(pHeartIn3 * 100).toFixed(1)}%</span>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => {
                if (deckRevealHistory.length >= 52) return;
                const suits = ['♠', '♥', '♦', '♣'];
                const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
                const deck = [];
                suits.forEach((s) => ranks.forEach((r) => deck.push({ suit: s, rank: r })));

                // Remove seen cards
                const filteredDeck = deck.filter((c) => !deckRevealHistory.some((s) => s.suit === c.suit && s.rank === c.rank));
                const next = filteredDeck[Math.floor(Math.random() * filteredDeck.length)];
                setDeckRevealHistory([...deckRevealHistory, next]);
              }}
              className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black uppercase tracking-widest transition-all shadow-lg active:scale-95 disabled:opacity-50"
              disabled={deckRevealHistory.length >= 52}
            >
              REVEAL NEXT CARD
            </button>
            <button onClick={() => setDeckRevealHistory([])} className="px-4 py-4 bg-slate-800 text-slate-500 hover:text-white rounded-2xl font-black uppercase text-[10px]">
              Reset
            </button>
          </div>
        </div>

        <div className="w-1/3 space-y-3">
          <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'} h-full flex flex-col`}>
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-4 ml-1">Reveal History</span>
            <div className="flex-1 overflow-y-auto max-h-[220px] space-y-2 pr-1 custom-scrollbar">
              {deckRevealHistory
                .map((c, i) => (
                  <div key={i} className={`flex items-center justify-between p-2 rounded-lg ${darkMode ? 'bg-slate-950 shadow-inner' : 'bg-white shadow-sm'}`}>
                    <span className={`text-[10px] font-black ${['♥', '♦'].includes(c.suit) ? 'text-rose-500' : 'text-slate-300'}`}>
                      {c.rank} {c.suit}
                    </span>
                    <span className="text-[8px] text-slate-600 font-bold uppercase">#{deckRevealHistory.length - i}</span>
                  </div>
                ))
                .reverse()}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {['♠', '♥', '♦', '♣'].map((s) => {
          const seen = deckRevealHistory.filter((c) => c.suit === s).length;
          const remaining = 13 - seen;
          return (
            <div key={s} className={`p-3 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-100'} text-center`}>
              <div className={`text-xl ${['♥', '♦'].includes(s) ? 'text-rose-500' : 'text-slate-400'}`}>{s}</div>
              <div className="text-[10px] font-black text-white mt-1">{remaining} Left</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
