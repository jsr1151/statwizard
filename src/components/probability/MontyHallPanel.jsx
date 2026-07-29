export default function MontyHallPanel({ darkMode, doorInput, handleMontyFinal, handleMontyPick, montyState, resetMonty, setDoorInput, setMontyState }) {
  return (
    <div className="animate-in fade-in space-y-8">
      <div className="text-center space-y-4">
        <h5 className="text-xl font-black text-white uppercase tracking-tight">Monty Hall Problem</h5>
        <div className="flex flex-col items-center gap-2">
          <span className="text-[10px] font-black text-slate-500 uppercase">Number of Doors (3 - 100)</span>
          <div className="flex gap-2 items-center">
            <input
              type="number"
              min="3"
              max="100"
              value={doorInput}
              onChange={(e) => setDoorInput(e.target.value)}
              className="w-20 bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-sm font-black text-white text-center outline-none focus:border-indigo-500 transition-all"
            />
            <button
              onClick={() => resetMonty(parseInt(doorInput) || 3)}
              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black uppercase rounded-xl transition-all shadow-lg"
            >
              Set & Reset
            </button>
          </div>
        </div>
      </div>

      <div className={`p-6 rounded-3xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'} space-y-4`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-indigo-600/20 flex items-center justify-center text-indigo-400 font-black text-xs">?</div>
            <h6 className="text-[11px] font-black uppercase tracking-widest text-slate-400">The Paradox Explained</h6>
          </div>
          <div className="flex gap-4 text-[10px] font-black">
            <div className="text-slate-500">
              P(Stay Win): <span className="text-white">{((1 / montyState.doorCount) * 100).toFixed(1)}%</span>
            </div>
            <div className="text-indigo-400">
              P(Switch Win): <span className="text-white">{(((montyState.doorCount - 1) / montyState.doorCount) * 100).toFixed(1)}%</span>
            </div>
          </div>
        </div>
        <p className="text-[11px] leading-relaxed text-slate-400 italic">
          You pick a door. Monty (who knows where the car is) opens {montyState.doorCount - 2} goat {montyState.doorCount - 2 === 1 ? 'door' : 'doors'}. Should you switch to the
          last remaining door?
          <br />
          <b>Yes!</b> Your first pick only had a 1 in {montyState.doorCount} chance. Switching captures the sum of all other doors' probabilities!
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className={`p-4 rounded-3xl border ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50'}`}>
          <div className="text-[8px] font-black text-slate-500 uppercase mb-2">Simulated Stats</div>
          <div className="flex justify-between text-xs font-bold items-center">
            <span className="text-slate-400">Stay: {((montyState.history.stayWins / Math.max(1, montyState.history.stayTotal)) * 100).toFixed(1)}%</span>
            <div className="h-10 w-px bg-slate-800/10 mx-2" />
            <span className="text-emerald-400">Switch: {((montyState.history.switchWins / Math.max(1, montyState.history.switchTotal)) * 100).toFixed(1)}%</span>
          </div>
          <div className="mt-2 text-[8px] text-slate-600 uppercase font-bold">Games: {montyState.history.stayTotal + montyState.history.switchTotal}</div>
        </div>
        <button
          onClick={() => {
            let stayW = 0,
              switchW = 0;
            for (let i = 0; i < 10000; i++) {
              const car = Math.floor(Math.random() * montyState.doorCount);
              const pick = Math.floor(Math.random() * montyState.doorCount);
              if (pick === car) stayW++;
              else switchW++;
            }
            setMontyState((p) => ({
              ...p,
              history: {
                ...p.history,
                stayWins: p.history.stayWins + stayW,
                stayTotal: p.history.stayTotal + 10000,
                switchWins: p.history.switchWins + switchW,
                switchTotal: p.history.switchTotal + 10000,
              },
            }));
          }}
          className="p-4 rounded-3xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-widest shadow-lg transition-all flex flex-col items-center justify-center gap-1"
        >
          <span>Run 10k Sim</span>
        </button>
      </div>

      <div
        className={`grid gap-2 justify-center max-h-[300px] overflow-y-auto pr-2 custom-scrollbar ${montyState.doorCount > 10 ? 'grid-cols-8' : montyState.doorCount > 5 ? 'grid-cols-5' : 'grid-cols-3'}`}
      >
        {montyState.doors.map((d, i) => {
          const isRevealed = montyState.revealed.includes(i);
          const isSelected = montyState.selected === i;
          const isCar = d === 'car';
          return (
            <div
              key={i}
              onClick={() => montyState.gameState === 'start' && handleMontyPick(i)}
              className={`aspect-[2/3] w-full rounded-xl border-2 flex flex-col items-center justify-center text-lg cursor-pointer transition-all active:scale-95 ${isSelected ? 'border-indigo-500 bg-indigo-500/20 shadow-indigo-500/20 shadow-lg z-10' : isRevealed ? (isCar ? 'border-emerald-500 bg-emerald-500/20' : 'border-slate-800 bg-slate-800/10 opacity-40 shadow-none grayscale') : darkMode ? 'border-slate-700 bg-slate-900/40 hover:border-slate-500 shadow-md' : 'border-slate-200 bg-white hover:border-slate-400 shadow-sm'}`}
            >
              <span className="animate-in fade-in zoom-in-50">{isRevealed ? (isCar ? '🏎️' : '🐐') : '🚪'}</span>
              <span className="text-[7px] font-black text-slate-500 mt-1 uppercase">#{i + 1}</span>
            </div>
          );
        })}
      </div>

      {montyState.gameState === 'result' && (
        <div
          className={`p-6 rounded-3xl text-center animate-in zoom-in-95 shadow-2xl ${montyState.win ? 'bg-emerald-600/20 border-2 border-emerald-500/40' : 'bg-rose-600/20 border-2 border-rose-500/40'}`}
        >
          <div className="text-3xl mb-2">{montyState.win ? '🎉' : '🐐'}</div>
          <h6 className={`text-xl font-black uppercase tracking-tight ${montyState.win ? 'text-emerald-400' : 'text-rose-400'}`}>
            {montyState.win ? 'YOU WON THE CAR!' : 'YOU GOT A GOAT...'}
          </h6>
          <button
            onClick={() => resetMonty(montyState.doorCount)}
            className="mt-4 px-8 py-2 bg-indigo-600 text-white rounded-full font-black text-[10px] uppercase shadow-lg hover:bg-indigo-500 transition-all"
          >
            Play Again
          </button>
        </div>
      )}

      {montyState.gameState === 'picked' && (
        <div className="p-6 rounded-3xl bg-indigo-600 border-2 border-indigo-400 text-center animate-in zoom-in-95 shadow-2xl">
          <p className="text-sm font-black text-white mb-4 uppercase">Monty revealed {montyState.revealed.length} goats! Stay or Switch?</p>
          <div className="flex gap-4">
            <button onClick={() => handleMontyFinal(true)} className="flex-1 py-3 bg-slate-900 text-white rounded-xl font-bold text-xs uppercase hover:bg-black transition-all">
              STAY (Gut)
            </button>
            <button
              onClick={() => handleMontyFinal(false)}
              className="flex-1 py-3 bg-white text-indigo-700 rounded-xl font-bold text-xs uppercase hover:bg-slate-100 transition-all shadow-xl"
            >
              SWITCH (Math)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
