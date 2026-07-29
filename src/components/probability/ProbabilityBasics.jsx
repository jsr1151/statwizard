import { useState } from 'react';

const EVENTS = [
  { label: 'Perfect NCAA Bracket', p: 1 / 9.2e18, color: 'text-red-600' },
  { label: 'Winning Mega Millions', p: 1 / 302500000, color: 'text-red-500' },
  { label: 'Winning a Royal Flush', p: 1 / 649740, color: 'text-orange-600' },
  { label: 'Struck by Lightning (Yearly)', p: 0.000001, color: 'text-orange-500' },
  { label: 'Drawing an Ace', p: 0.0769, color: 'text-amber-600' },
  { label: 'Rolling a 6 on a Die', p: 1 / 6, color: 'text-amber-500' },
  { label: '4-Choice MC Guess', p: 0.25, color: 'text-amber-500' },
  { label: 'Flipping Heads', p: 0.5, color: 'text-indigo-500' },
  { label: 'Rain in Seattle (Avg Day)', p: 0.45, color: 'text-blue-500' },
  { label: 'Passing a True/False Guess', p: 0.5, color: 'text-indigo-400' },
  { label: 'Rolling > 1 on a Die', p: 5 / 6, color: 'text-emerald-400' },
  { label: 'Sun Setting Today', p: 0.99999, color: 'text-emerald-500' },
];

export default function ProbabilityBasics({ darkMode }) {
  const [basicsEvent, setBasicsEvent] = useState(null);
  const getScalePos = (probability) => probability * 100;
  const BASICS_EVENTS = EVENTS;

  return (
    <div className="animate-in fade-in duration-500 space-y-12">
      <div className="text-center">
        <h5 className={`text-xs font-black uppercase tracking-widest mb-6 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>The Probability Scale</h5>
        <div className="relative h-24 flex items-center mb-8 mx-8">
          <div className={`absolute left-0 right-0 h-2 rounded-full ${darkMode ? 'bg-slate-800' : 'bg-slate-200'}`} />
          <div className="absolute left-0 right-0 flex justify-between">
            {[0, 0.25, 0.5, 0.75, 1].map((v) => (
              <div key={v} className="relative flex flex-col items-center">
                <div className={`w-1 h-4 ${darkMode ? 'bg-slate-600' : 'bg-slate-400'} mb-2`} />
                <span className={`absolute top-6 whitespace-nowrap text-[10px] font-bold ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                  {v === 0 ? 'NEVER' : v === 1 ? 'ALWAYS' : v}
                </span>
              </div>
            ))}
          </div>
          {basicsEvent && (
            <div
              className="absolute top-0 flex flex-col items-center transition-all duration-1000 ease-out"
              style={{
                left: `${getScalePos(basicsEvent.p)}%`,
                transform: 'translateX(-50%)',
                zIndex: 10,
              }}
            >
              <div className="w-2 h-10 rounded-full bg-indigo-500 ring-4 ring-indigo-500/20 shadow-lg shadow-indigo-500/40" />
              <div
                className={`mt-2 whitespace-nowrap text-[10px] font-black uppercase tracking-tighter ${basicsEvent.color} bg-slate-900/80 px-2 py-0.5 rounded-full backdrop-blur-sm border border-white/10`}
              >
                {basicsEvent.label} ({(basicsEvent.p * 100).toFixed(basicsEvent.p < 0.0001 ? 8 : 2)}%)
              </div>
            </div>
          )}

          {/* Axiom Callouts */}
          <div className="absolute -top-10 left-0 text-[9px] font-black text-slate-500 bg-slate-800/20 px-2 py-1 rounded-lg border border-white/5 backdrop-blur-sm group cursor-help">
            P(∅) = 0
            <div className="absolute hidden group-hover:block -top-8 left-0 bg-slate-800 text-white p-2 rounded shadow-xl whitespace-nowrap z-30">
              Impossible events have probability zero.
            </div>
          </div>
          <div className="absolute -top-10 right-0 text-[9px] font-black text-slate-500 bg-slate-800/20 px-2 py-1 rounded-lg border border-white/5 backdrop-blur-sm group cursor-help">
            P(Ω) = 1
            <div className="absolute hidden group-hover:block -top-8 right-0 bg-slate-800 text-white p-2 rounded shadow-xl whitespace-nowrap z-30">
              The set of all possible outcomes equals certainty.
            </div>
          </div>
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-[8px] font-black text-slate-600 tracking-widest uppercase">0 ≤ P(A) ≤ 1</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
        {BASICS_EVENTS.map((ev) => (
          <button
            key={ev.label}
            onClick={() => setBasicsEvent(ev)}
            className={`p-3 rounded-xl border text-left transition-all duration-300 ${basicsEvent?.label === ev.label ? 'border-indigo-500 bg-indigo-500/10' : darkMode ? 'bg-slate-900 border-slate-800 hover:border-slate-700' : 'bg-white border-slate-100 hover:shadow-lg'}`}
          >
            <span className={`text-[10px] font-bold ${darkMode ? 'text-slate-300' : 'text-slate-700'} block truncate`}>{ev.label}</span>
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{ev.p < 0.01 ? 'Very Rare' : ev.p < 0.5 ? 'Unlikely' : 'Likely'}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
