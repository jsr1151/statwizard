import { RefreshCw } from 'lucide-react';

export default function PokerOutsPanel({ darkMode, pokerOutsCards, pokerOutsScenario, setPokerOutsCards, setPokerOutsScenario }) {
  return (
    <div className="animate-in fade-in space-y-6 text-center">
      <div className="text-center">
        <h5 className="text-xl font-black text-white uppercase tracking-tight">Poker Outs Trainer</h5>
        <p className="text-[10px] text-slate-500 uppercase font-bold mt-1">Texas Hold'em Draw Odds</p>
      </div>

      <div className="flex justify-center gap-4">
        <div className="space-y-2">
          <span className="text-[9px] font-black text-slate-500 uppercase">Your Hand</span>
          <div className="flex gap-1 justify-center">
            {pokerOutsCards.hand.map((c, i) => (
              <div key={i} className={`w-12 h-16 rounded-lg border-2 bg-slate-900 border-slate-700 flex flex-col items-center justify-center relative`}>
                <div className={`absolute top-0.5 left-1 text-[8px] font-black ${['♥', '♦'].includes(c.suit) ? 'text-rose-400' : 'text-slate-300'}`}>{c.rank}</div>
                <div className={`text-xl ${['♥', '♦'].includes(c.suit) ? 'text-rose-400' : 'text-slate-300'}`}>{c.suit}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <span className="text-[9px] font-black text-slate-500 uppercase">The Flop</span>
          <div className="flex gap-1 justify-center">
            {pokerOutsCards.flop.map((c, i) => (
              <div key={i} className={`w-12 h-16 rounded-lg border-2 bg-slate-900 border-slate-700 flex flex-col items-center justify-center relative`}>
                <div className={`absolute top-0.5 left-1 text-[8px] font-black ${['♥', '♦'].includes(c.suit) ? 'text-rose-400' : 'text-slate-300'}`}>{c.rank}</div>
                <div className={`text-xl ${['♥', '♦'].includes(c.suit) ? 'text-rose-400' : 'text-slate-300'}`}>{c.suit}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={`p-6 rounded-3xl border-2 ${darkMode ? 'bg-indigo-500/10 border-indigo-500/20 shadow-xl shadow-indigo-500/5' : 'bg-indigo-50 border-indigo-100'} space-y-4`}>
        <div className="flex justify-between items-center">
          <div className="text-left">
            <h6 className="text-[11px] font-black text-white uppercase">
              Scenario: <span className="text-indigo-400 px-2 py-0.5 bg-indigo-500/10 rounded-full">{pokerOutsScenario === 'flush' ? 'Flush Draw' : 'Straight Draw'}</span>
            </h6>
            <p className="text-[9px] text-slate-500">
              {pokerOutsScenario === 'flush' ? 'You need one more spade (♠) to complete your flush.' : 'You have 4-to-a-straight. Any 5 or 10 completes it.'}
            </p>
          </div>
          <div className="text-2xl font-black text-white">{pokerOutsScenario === 'flush' ? '9 Outs' : '8 Outs'}</div>
        </div>

        <div className="p-3 bg-slate-900/50 rounded-2xl border border-white/5">
          <div className="text-[8px] font-black text-slate-400 uppercase mb-2 tracking-widest">Winning Cards (Outs)</div>
          <div className="flex flex-wrap gap-1">
            {(pokerOutsScenario === 'flush' ? ['2', '3', '4', '5', '6', '8', '9', 'J', 'Q'] : ['5', '5', '5', '5', '10', '10', '10', '10']).map((r, i) => (
              <div key={i} className="px-2 py-1 bg-slate-800 rounded-lg text-[10px] font-bold text-indigo-300 border border-white/5">
                {r}
                {pokerOutsScenario === 'flush' ? '♠' : ''}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 border-t border-white/5 pt-4">
          {(() => {
            const outs = pokerOutsScenario === 'flush' ? 9 : 8;
            return (
              <>
                <div className="text-center group relative cursor-help">
                  <div className="text-[8px] font-black text-slate-500 uppercase mb-1">The Turn</div>
                  <div className="text-lg font-black text-indigo-400">{((outs / 47) * 100).toFixed(1)}%</div>
                  <div className="text-[8px] text-slate-600 font-bold uppercase italic">{outs} / 47</div>
                  <div className="absolute hidden group-hover:block bottom-full mb-2 w-32 left-1/2 -translate-x-1/2 bg-slate-800 p-2 rounded text-[8px] text-white z-50">
                    Prob of hitting on the next card.
                  </div>
                </div>
                <div className="text-center group relative cursor-help">
                  <div className="text-[8px] font-black text-slate-500 uppercase mb-1">The River</div>
                  <div className="text-lg font-black text-indigo-400">{((outs / 46) * 100).toFixed(1)}%</div>
                  <div className="text-[8px] text-slate-600 font-bold uppercase italic">{outs} / 46</div>
                  <div className="absolute hidden group-hover:block bottom-full mb-2 w-32 left-1/2 -translate-x-1/2 bg-slate-800 p-2 rounded text-[8px] text-white z-50">
                    Prob if you miss turn but hit on river.
                  </div>
                </div>
                <div className="text-center group relative cursor-help">
                  <div className="text-[8px] font-black text-slate-500 uppercase mb-1">By River</div>
                  <div className="text-lg font-black text-emerald-400">{((1 - ((47 - outs) / 47) * ((46 - outs) / 46)) * 100).toFixed(1)}%</div>
                  <div className="text-[8px] text-slate-600 font-bold uppercase italic">Rule of 4</div>
                  <div className="absolute hidden group-hover:block bottom-full mb-2 w-32 left-1/2 -translate-x-1/2 bg-slate-800 p-2 rounded text-[8px] text-white z-50">
                    Combined prob of hitting either turn or river.
                  </div>
                </div>
              </>
            );
          })()}
        </div>
      </div>

      <button
        onClick={() => {
          const nextType = pokerOutsScenario === 'flush' ? 'straight' : 'flush';
          setPokerOutsScenario(nextType);
          if (nextType === 'flush') {
            setPokerOutsCards({
              hand: [
                { suit: '♠', rank: 'A' },
                { suit: '♠', rank: 'K' },
              ],
              flop: [
                { suit: '♠', rank: '7' },
                { suit: '♠', rank: '2' },
                { suit: '♦', rank: 'Q' },
              ],
            });
          } else {
            setPokerOutsCards({
              hand: [
                { suit: '♥', rank: '6' },
                { suit: '♦', rank: '7' },
              ],
              flop: [
                { suit: '♣', rank: '8' },
                { suit: '♠', rank: '9' },
                { suit: '♥', rank: '2' },
              ],
            });
          }
        }}
        className="w-full py-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-black uppercase tracking-widest transition-all border border-white/5 active:scale-95 shadow-md flex items-center justify-center gap-2"
      >
        <RefreshCw size={14} className="text-indigo-400" />
        NEXT SCENARIO (RELOAD)
      </button>
    </div>
  );
}
