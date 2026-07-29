export default function PokerOddsPanel({ cardGame, darkMode, setCardGame }) {
  return (
    <div className="animate-in fade-in space-y-8">
      <div className="flex justify-between items-center mb-2">
        <div className="text-left">
          <h5 className={`text-xs font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Poker Hand Odds</h5>
          <p className="text-[10px] text-slate-500 mt-1">Probability of 5-card hands in a 52-card deck.</p>
        </div>
        <button onClick={() => setCardGame({ ...cardGame, history: [] })} className="text-[9px] text-indigo-400 font-bold hover:underline uppercase">
          Clear Stats
        </button>
      </div>

      <div className="grid grid-cols-5 gap-2 justify-center">
        {(cardGame.pokerHand || [null, null, null, null, null]).map((card, i) => (
          <div
            key={i}
            className={`h-24 rounded-xl border-2 flex flex-col items-center justify-center relative shadow-md transition-all duration-300 ${card ? (darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200') : 'bg-slate-800/10 border-dashed border-slate-700/20'}`}
          >
            {card ? (
              <>
                <div
                  className={`absolute top-1 left-1.5 text-[10px] font-black ${['♥', '♦'].includes(card.suit) ? 'text-rose-500' : darkMode ? 'text-slate-300' : 'text-slate-900'}`}
                >
                  {card.rank}
                </div>
                <div className={`text-2xl ${['♥', '♦'].includes(card.suit) ? 'text-rose-500' : darkMode ? 'text-slate-300' : 'text-slate-900'}`}>{card.suit}</div>
              </>
            ) : (
              <div className="text-xl text-slate-800">?</div>
            )}
          </div>
        ))}
      </div>

      <div className="text-center space-y-4">
        <div className="flex gap-4">
          <button
            onClick={() => {
              const suits = ['♠', '♥', '♦', '♣'];
              const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
              const rankValues = { A: 14, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7, 8: 8, 9: 9, 10: 10, J: 11, Q: 12, K: 13 };

              const deck = [];
              suits.forEach((s) => ranks.forEach((r) => deck.push({ suit: s, rank: r, rankValue: rankValues[r] })));
              const hand = [];
              for (let i = 0; i < 5; i++) {
                const idx = Math.floor(Math.random() * deck.length);
                hand.push(deck.splice(idx, 1)[0]);
              }

              const sortedRanks = hand.map((c) => c.rankValue).sort((a, b) => a - b);
              const handSuits = hand.map((c) => c.suit);
              const rCounts = {};
              sortedRanks.forEach((rv) => (rCounts[rv] = (rCounts[rv] || 0) + 1));
              const cts = Object.values(rCounts).sort((a, b) => b - a);
              const isFlush = new Set(handSuits).size === 1;
              let isStr = true;
              for (let i = 0; i < 4; i++) if (sortedRanks[i + 1] !== sortedRanks[i] + 1) isStr = false;
              if (!isStr && JSON.stringify(sortedRanks) === JSON.stringify([2, 3, 4, 5, 14])) isStr = true;

              let type = 'High Card';
              if (isStr && isFlush && sortedRanks[0] === 10) type = 'Royal Flush';
              else if (isStr && isFlush) type = 'Straight Flush';
              else if (cts[0] === 4) type = 'Four of a Kind';
              else if (cts[0] === 3 && cts[1] === 2) type = 'Full House';
              else if (isFlush) type = 'Flush';
              else if (isStr) type = 'Straight';
              else if (cts[0] === 3) type = 'Three of a Kind';
              else if (cts[0] === 2 && cts[1] === 2) type = 'Two Pair';
              else if (cts[0] === 2) type = 'One Pair';

              setCardGame((prev) => ({ ...prev, pokerHand: hand, result: type, history: [...prev.history, type] }));
            }}
            className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black uppercase tracking-widest transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
          >
            Deal 5 Cards
          </button>

          <button
            onClick={() => {
              const types = [];
              const suits = ['♠', '♥', '♦', '♣'];
              const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
              const rankValues = { A: 14, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7, 8: 8, 9: 9, 10: 10, J: 11, Q: 12, K: 13 };

              for (let n = 0; n < 1000; n++) {
                const deck = [];
                suits.forEach((s) => ranks.forEach((r) => deck.push({ suit: s, rank: r, rv: rankValues[r] })));
                const hand = [];
                for (let i = 0; i < 5; i++) hand.push(deck.splice(Math.floor(Math.random() * deck.length), 1)[0]);

                const sr = hand.map((c) => c.rv).sort((a, b) => a - b);
                const hs = hand.map((c) => c.suit);
                const rc = {};
                sr.forEach((v) => (rc[v] = (rc[v] || 0) + 1));
                const ct = Object.values(rc).sort((a, b) => b - a);
                const fl = new Set(hs).size === 1;
                let st = true;
                for (let i = 0; i < 4; i++) if (sr[i + 1] !== sr[i] + 1) st = false;
                if (!st && JSON.stringify(sr) === JSON.stringify([2, 3, 4, 5, 14])) st = true;

                let t = 'High Card';
                if (st && fl) t = sr[0] === 10 ? 'Royal Flush' : 'Straight Flush';
                else if (ct[0] === 4) t = 'Four of a Kind';
                else if (ct[0] === 3 && ct[1] === 2) t = 'Full House';
                else if (fl) t = 'Flush';
                else if (st) t = 'Straight';
                else if (ct[0] === 3) t = 'Three of a Kind';
                else if (ct[0] === 2 && ct[1] === 2) t = 'Two Pair';
                else if (ct[0] === 2) t = 'One Pair';
                types.push(t);
              }
              setCardGame((prev) => ({ ...prev, history: [...prev.history, ...types] }));
            }}
            className={`px-4 py-4 rounded-2xl font-black uppercase text-[10px] border transition-all active:scale-95 ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
          >
            Simulate 1,000 Hands
          </button>
        </div>

        {cardGame.result && (
          <div className="animate-in slide-in-from-top-4">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Results</span>
            <div className="text-2xl font-black text-indigo-400 uppercase">{cardGame.result}</div>
          </div>
        )}

        <div className="space-y-3 pt-4 text-left">
          <h6 className="text-[10px] font-black uppercase text-slate-500 mb-2">Theoretical Odds vs. Your Deck</h6>
          <div className="space-y-1.5">
            {[
              { name: 'One Pair', theoretical: '42.3%', t: 0.4225 },
              { name: 'Two Pair', theoretical: '4.75%', t: 0.0475 },
              { name: 'Three of a Kind', theoretical: '2.11%', t: 0.0211 },
              { name: 'Straight', theoretical: '0.39%', t: 0.0039 },
              { name: 'Flush', theoretical: '0.20%', t: 0.002 },
              { name: 'Full House', theoretical: '0.14%', t: 0.0014 },
              { name: 'Four of a Kind', theoretical: '0.02%', t: 0.0002 },
            ].map((h) => {
              const sessionCount = cardGame.history.filter((t) => t === h.name).length;
              const sessionProb = cardGame.history.length > 0 ? sessionCount / cardGame.history.length : 0;
              return (
                <div key={h.name} className="flex items-center gap-3">
                  <div className="w-24 text-[9px] font-black text-slate-400 uppercase truncate">{h.name}</div>
                  <div className="flex-1 h-3 bg-slate-800/50 rounded-full overflow-hidden relative">
                    <div className="absolute inset-0 bg-indigo-500/20" style={{ width: `${h.t * 100}%` }} />
                    <div className="absolute inset-0 bg-emerald-500 transition-all duration-700" style={{ width: `${sessionProb * 100}%` }} />
                  </div>
                  <div className="w-20 text-[9px] font-bold text-slate-500 text-right">
                    {(sessionProb * 100).toFixed(2)}% <span className="text-[8px] opacity-40">vs {h.theoretical}</span>
                  </div>
                </div>
              );
            })}
          </div>
          <p
            className={`p-4 rounded-xl border border-dashed text-[10px] font-medium italic mt-4 ${darkMode ? 'bg-slate-900/50 border-slate-800 text-slate-500' : 'bg-slate-50 border-slate-200 text-slate-500'}`}
          >
            Notice how "One Pair" happens almost half the time, while "Straight" is less than 1%. The emerald bars show your actual results. Deal more cards to see them approach
            the theoretical values!
          </p>
        </div>
      </div>
    </div>
  );
}
