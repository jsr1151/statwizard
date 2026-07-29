export default function CardHuntPanel({
  cardBetConfig,
  darkMode,
  huntHandSize,
  huntHistory,
  huntLastHand,
  huntSessionProfit,
  huntTarget,
  huntWithReplacement,
  nCr,
  setCardBetConfig,
  setHuntHandSize,
  setHuntHistory,
  setHuntLastHand,
  setHuntSessionProfit,
  setHuntTarget,
  setHuntWithReplacement,
  setShowHuntMath,
  showHuntMath,
}) {
  return (
    <div className="animate-in fade-in space-y-6">
      <div className="text-center">
        <h5 className="text-xl font-black text-white uppercase tracking-tight">Hunt & Bet</h5>
        <p className="text-[10px] text-slate-500 uppercase font-bold mt-1">Probability & Expected Value Simulator</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { id: 'Aces', label: 'Aces', count: 4, icon: 'A♠' },
          { id: 'Hearts', label: 'Hearts', count: 13, icon: '♥' },
          { id: 'Face', label: 'Face Cards', count: 12, icon: 'JQK' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setHuntTarget(t.id)}
            className={`p-4 rounded-2xl border-2 transition-all block ${huntTarget === t.id ? 'border-indigo-500 bg-indigo-500/10' : darkMode ? 'border-slate-800 bg-slate-900/50 text-slate-500' : 'border-slate-100 bg-slate-50 text-slate-400'}`}
          >
            <div className="text-2xl mb-1">{t.icon}</div>
            <div className="text-[10px] font-black uppercase">{t.label}</div>
            <div className="text-[8px] font-bold mt-1">({t.count} in Deck)</div>
          </button>
        ))}
      </div>

      <div className={`p-6 rounded-3xl border ${darkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50 border-slate-200'} space-y-6`}>
        <div className="flex justify-between items-center bg-slate-800/50 p-3 rounded-2xl border border-white/5">
          <div className="flex items-center gap-2">
            <div
              className={`w-8 h-4 rounded-full p-0.5 cursor-pointer transition-all ${huntWithReplacement ? 'bg-indigo-600' : 'bg-slate-700'}`}
              onClick={() => setHuntWithReplacement(!huntWithReplacement)}
            >
              <div className={`w-3 h-3 bg-white rounded-full transition-all ${huntWithReplacement ? 'translate-x-4' : 'translate-x-0'}`} />
            </div>
            <span className="text-[10px] font-black text-slate-300 uppercase">With Replacement</span>
          </div>
          <span className="text-[10px] font-black text-indigo-400 uppercase">{huntWithReplacement ? 'Binomial' : 'Hypergeometric'}</span>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-black text-slate-500 uppercase">Hand Size: {huntHandSize}</span>
            <input
              type="range"
              min="1"
              max="15"
              step="1"
              value={huntHandSize}
              onChange={(e) => setHuntHandSize(parseInt(e.target.value))}
              className="w-1/2 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
          </div>

          <div className="flex gap-4">
            <div className="flex-1 space-y-2">
              <span className="text-[9px] font-black text-slate-500 uppercase">Payout ($)</span>
              <div className="flex items-center gap-2 bg-slate-800 rounded-xl px-4 py-3 border border-white/5">
                <span className="text-indigo-400 font-black">$</span>
                <input
                  type="number"
                  step="0.5"
                  value={cardBetConfig.payout}
                  onChange={(e) => setCardBetConfig({ ...cardBetConfig, payout: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-transparent text-xs font-black text-white outline-none"
                />
              </div>
            </div>
            <div className="flex-1 space-y-2">
              <span className="text-[9px] font-black text-slate-500 uppercase">Bet Cost ($)</span>
              <div className="flex items-center gap-2 bg-slate-800 rounded-xl px-4 py-3 border border-white/5">
                <span className="text-rose-400 font-black">$</span>
                <input
                  type="number"
                  step="0.5"
                  value={cardBetConfig.bet}
                  onChange={(e) => setCardBetConfig({ ...cardBetConfig, bet: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-transparent text-xs font-black text-white outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {(() => {
          const N = 52;
          const K = huntTarget === 'Aces' ? 4 : huntTarget === 'Hearts' ? 13 : 12;
          const n = huntHandSize;
          const p_single = K / N;

          let probSuccess;
          if (huntWithReplacement) {
            // P(X >= 1) = 1 - P(X = 0) where X ~ Binomial(n, p)
            probSuccess = 1 - Math.pow(1 - p_single, n);
          } else {
            // P(X >= 1) = 1 - P(X = 0) where X ~ Hypergeometric(N, K, n)
            probSuccess = 1 - nCr(N - K, n) / nCr(N, n);
          }

          const ev = probSuccess * cardBetConfig.payout - (1 - probSuccess) * cardBetConfig.bet;

          return (
            <div className="space-y-4 pt-4 border-t border-white/5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h6 className="text-[10px] font-black text-white uppercase mb-1">Theoretical Prob</h6>
                  <div className="text-2xl font-black text-indigo-400">{(probSuccess * 100).toFixed(2)}%</div>
                </div>
                <div className="text-right">
                  <h6 className="text-[10px] font-black text-white uppercase mb-1">Expected Value (EV)</h6>
                  <div className={`text-2xl font-black ${ev > 0 ? 'text-emerald-400' : ev < 0 ? 'text-rose-500' : 'text-slate-400'}`}>
                    {ev > 0 ? '+' : ''}
                    {ev.toFixed(2)}
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setShowHuntMath(!showHuntMath)}
                  className="flex-1 py-2 rounded-xl bg-slate-800 text-[9px] font-black text-slate-500 uppercase tracking-widest border border-white/5 hover:text-white transition-all"
                >
                  {showHuntMath ? 'Hide Math' : 'Show Math'}
                </button>
                <div
                  className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center ${ev > 0 ? 'bg-emerald-500/20 text-emerald-400' : ev < 0 ? 'bg-rose-500/20 text-rose-400' : 'bg-slate-800 text-slate-500'}`}
                >
                  {ev > 0 ? 'PROFITABLE' : ev < 0 ? 'TRAP' : 'FAIR'}
                </div>
              </div>

              <div className="pt-4 border-t border-white/5 flex justify-between items-center">
                <div>
                  <div className="text-[8px] font-black text-slate-500 uppercase">Hunt Session P/L</div>
                  <div className={`text-lg font-black ${huntSessionProfit >= 0 ? 'text-emerald-400' : 'text-rose-500'}`}>
                    {huntSessionProfit >= 0 ? '+$' : '-$'}
                    {Math.abs(huntSessionProfit).toFixed(2)}
                  </div>
                </div>
                <button onClick={() => setHuntSessionProfit(0)} className="text-[8px] font-black text-rose-400 uppercase hover:underline">
                  Reset Session
                </button>
              </div>

              {showHuntMath && (
                <div className="p-4 rounded-2xl bg-slate-950 border border-white/5 animate-in slide-in-from-top-2">
                  <div className="text-[10px] font-mono text-indigo-300 text-center mb-2">
                    {huntWithReplacement ? `P(X ≥ 1) = 1 - (1 - ${K}/52)^${n}` : `P(X ≥ 1) = 1 - [ (52-${K})C(${n}) / 52C(${n}) ]`}
                  </div>
                  <p className="text-[8px] text-slate-500 leading-relaxed italic text-center">
                    EV = (P_win × ${cardBetConfig.payout}) - (P_loss × ${cardBetConfig.bet})
                  </p>
                </div>
              )}
            </div>
          );
        })()}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => {
            const suits = ['♠', '♥', '♦', '♣'];
            const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
            const deck = [];
            suits.forEach((s) => ranks.forEach((r) => deck.push({ suit: s, rank: r })));

            const results = [];
            const K = huntTarget === 'Aces' ? 4 : huntTarget === 'Hearts' ? 13 : 12;
            const n = huntHandSize;

            let successes = 0;
            for (let i = 0; i < 10000; i++) {
              const hand = [];
              if (huntWithReplacement) {
                for (let h = 0; h < huntHandSize; h++) hand.push(deck[Math.floor(Math.random() * deck.length)]);
              } else {
                const tempDeck = [...deck];
                for (let h = 0; h < huntHandSize; h++) hand.push(tempDeck.splice(Math.floor(Math.random() * tempDeck.length), 1)[0]);
              }
              const hasTarget = hand.some((c) => {
                if (huntTarget === 'Aces') return c.rank === 'A';
                if (huntTarget === 'Hearts') return c.suit === '♥';
                if (huntTarget === 'Face') return ['J', 'Q', 'K'].includes(c.rank);
                return false;
              });
              if (hasTarget) successes++;
              results.push(hasTarget);
            }

            const sessionPL = successes * cardBetConfig.payout - (10000 - successes) * cardBetConfig.bet;
            setHuntSessionProfit((prev) => prev + sessionPL);
            setHuntHistory((prev) => [...prev, ...results]);
          }}
          className="py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black uppercase tracking-widest transition-all shadow-lg text-xs"
        >
          Run 10,000 Trials
        </button>

        <button
          onClick={() => {
            const suits = ['♠', '♥', '♦', '♣'];
            const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
            const deck = [];
            suits.forEach((s) => ranks.forEach((r) => deck.push({ suit: s, rank: r })));

            const hand = [];
            if (huntWithReplacement) {
              for (let h = 0; h < huntHandSize; h++) hand.push(deck[Math.floor(Math.random() * deck.length)]);
            } else {
              const tempDeck = [...deck];
              for (let h = 0; h < huntHandSize; h++) hand.push(tempDeck.splice(Math.floor(Math.random() * tempDeck.length), 1)[0]);
            }

            const hasTarget = hand.some((c) => {
              if (huntTarget === 'Aces') return c.rank === 'A';
              if (huntTarget === 'Hearts') return c.suit === '♥';
              if (huntTarget === 'Face') return ['J', 'Q', 'K'].includes(c.rank);
              return false;
            });

            const sessionPL = hasTarget ? cardBetConfig.payout : -cardBetConfig.bet;
            setHuntSessionProfit((prev) => prev + sessionPL);
            setHuntLastHand(hand);
            setHuntHistory((prev) => [...prev, hasTarget]);
          }}
          className="py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-black uppercase tracking-widest transition-all border border-white/5 text-xs"
        >
          Single Draw
        </button>
      </div>

      {huntLastHand && (
        <div className="flex justify-center gap-1">
          {huntLastHand.map((c, i) => {
            const isMatch =
              (huntTarget === 'Aces' && c.rank === 'A') || (huntTarget === 'Hearts' && c.suit === '♥') || (huntTarget === 'Face' && ['J', 'Q', 'K'].includes(c.rank));
            return (
              <div
                key={i}
                className={`w-10 h-14 rounded-lg border-2 flex flex-col items-center justify-center relative ${isMatch ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-800 bg-slate-900'}`}
              >
                <div className={`absolute top-0.5 left-1 text-[8px] font-black ${['♥', '♦'].includes(c.suit) ? 'text-rose-500' : 'text-slate-300'}`}>{c.rank}</div>
                <div className={`text-lg ${['♥', '♦'].includes(c.suit) ? 'text-rose-500' : 'text-slate-300'}`}>{c.suit}</div>
              </div>
            );
          })}
        </div>
      )}

      {huntHistory.length > 0 && (
        <div className={`p-4 rounded-3xl border border-indigo-500/20 bg-indigo-500/5 flex justify-between items-center`}>
          <div>
            <div className="text-[10px] font-black text-slate-500 uppercase">Sim Success Rate</div>
            <div className="text-xl font-black text-white">{((huntHistory.filter(Boolean).length / huntHistory.length) * 100).toFixed(2)}%</div>
          </div>
          <div className="text-right">
            <div className="text-[10px] font-black text-slate-500 uppercase">Total Trials</div>
            <div className="text-xl font-black text-indigo-400">{huntHistory.length.toLocaleString()}</div>
            <button
              onClick={() => {
                setHuntHistory([]);
                setHuntLastHand(null);
              }}
              className="text-[8px] text-rose-400 uppercase font-black hover:underline mt-1"
            >
              Clear
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
