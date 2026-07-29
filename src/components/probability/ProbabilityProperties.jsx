import { useState } from 'react';

export default function ProbabilityProperties({ darkMode }) {
  const [propertyView, setPropertyView] = useState('rules');
  const [complementP, setComplementP] = useState(0.7);
  const [showGeneralOr, setShowGeneralOr] = useState(false);
  const [showGeneralAnd, setShowGeneralAnd] = useState(false);

  return (
    <div className="animate-in fade-in duration-500 space-y-8">
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setPropertyView('rules')}
          className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${propertyView === 'rules' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : darkMode ? 'bg-slate-800 text-slate-500' : 'bg-slate-100 text-slate-400'}`}
        >
          Basic Rules
        </button>
        <button
          onClick={() => setPropertyView('mutual')}
          className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${propertyView === 'mutual' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : darkMode ? 'bg-slate-800 text-slate-500' : 'bg-slate-100 text-slate-400'}`}
        >
          Mutual Exclusivity
        </button>
      </div>

      {propertyView === 'rules' ? (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Addition Rule (OR) */}
          <div className={`p-6 rounded-3xl border transition-all ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'}`}>
            <div className="flex justify-between items-start mb-4">
              <h6 className="text-xs font-black uppercase tracking-widest text-emerald-400">Addition Rule (OR)</h6>
              <button onClick={() => setShowGeneralOr(!showGeneralOr)} className="text-[10px] font-bold text-slate-500 hover:text-indigo-400 uppercase transition-colors">
                {showGeneralOr ? 'Hide General' : 'Show General'}
              </button>
            </div>

            <p className={`text-xs leading-relaxed mb-4 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              {showGeneralOr ? 'General: P(A ∪ B) = P(A) + P(B) - P(A ∩ B)' : 'For disjoint events: P(A or B) = P(A) + P(B)'}
            </p>

            {showGeneralOr ? (
              <div className="space-y-4 animate-in slide-in-from-top-2">
                <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-bold text-indigo-400 leading-relaxed italic">
                  "Subtract the overlap so you don't double-count."
                </div>
                <div className="relative h-16 w-full flex items-center justify-center">
                  <div className="absolute left-1/4 w-12 h-12 rounded-full border-2 border-emerald-500 bg-emerald-500/10 flex items-center justify-center text-[10px] font-black text-emerald-400">
                    A
                  </div>
                  <div className="absolute right-1/4 w-12 h-12 rounded-full border-2 border-emerald-500 bg-emerald-500/10 flex items-center justify-center text-[10px] font-black text-emerald-400">
                    B
                  </div>
                  <div className="absolute w-6 h-12 bg-indigo-500/30 border-x border-indigo-500/50 flex items-center justify-center text-[8px] font-black text-indigo-400">∩</div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex gap-2">
                  {[1, 2, 3].map((v) => (
                    <div
                      key={v}
                      className="w-10 h-10 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-[10px] font-black text-emerald-400"
                    >
                      1/6
                    </div>
                  ))}
                </div>
                <div className={`p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold text-emerald-400`}>P(1, 2, or 3) = 3/6 (50%)</div>
              </div>
            )}
          </div>

          {/* Multiplication Rule (AND) */}
          <div className={`p-6 rounded-3xl border transition-all ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'}`}>
            <div className="flex justify-between items-start mb-4">
              <h6 className="text-xs font-black uppercase tracking-widest text-amber-400">Multiplication Rule (AND)</h6>
              <button onClick={() => setShowGeneralAnd(!showGeneralAnd)} className="text-[10px] font-bold text-slate-500 hover:text-indigo-400 uppercase transition-colors">
                {showGeneralAnd ? 'Hide General' : 'Show General'}
              </button>
            </div>

            <p className={`text-xs leading-relaxed mb-4 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              {showGeneralAnd ? 'General: P(A ∩ B) = P(A | B) P(B)' : 'For independent events: P(A and B) = P(A) × P(B)'}
            </p>

            {showGeneralAnd ? (
              <div className="space-y-4 animate-in slide-in-from-top-2">
                <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-bold text-indigo-400 leading-relaxed italic">
                  "Use P(A)P(B) only when independent."
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700 text-[10px] font-black text-slate-300">
                    A = Draw Ace
                    <br />B = Draw Heart
                  </div>
                  <div className="text-xl font-black text-indigo-500">→</div>
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[10px] font-black text-amber-400">(1/13 | B) * (1/4)</div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-[10px] font-black text-amber-400">0.5</div>
                  <span className="text-slate-500">×</span>
                  <div className="w-10 h-10 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-[10px] font-black text-amber-400">0.5</div>
                </div>
                <div className={`p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[10px] font-bold text-amber-400`}>P(H then H) = 0.25 (25%)</div>
              </div>
            )}
          </div>

          <div className={`p-6 rounded-3xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'} md:col-span-2`}>
            <h6 className="text-xs font-black uppercase tracking-widest text-indigo-400 mb-6">Complement Rule: P(A) + P(Not A) = 1</h6>
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={complementP || 0.7}
                  onChange={(e) => setComplementP(parseFloat(e.target.value))}
                  className="flex-1 accent-indigo-500 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                />
                <div className="text-[10px] font-black text-indigo-400 w-12 text-right">{((complementP || 0.7) * 100).toFixed(0)}%</div>
              </div>
              <div className="flex h-12 rounded-2xl overflow-hidden border border-white/5 shadow-inner bg-slate-800/50">
                <div
                  className="bg-indigo-600 flex items-center justify-center text-[10px] font-black text-white transition-all duration-300"
                  style={{ width: `${(complementP || 0.7) * 100}%` }}
                >
                  P(EVENT)
                </div>
                <div
                  className="bg-slate-600 flex items-center justify-center text-[10px] font-black text-slate-300 transition-all duration-300"
                  style={{ width: `${(1 - (complementP || 0.7)) * 100}%` }}
                >
                  NOT EVENT
                </div>
              </div>
              <p className={`text-[10px] leading-relaxed text-center italic ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                "Either it happens, or it doesn't. Together, they cover 100% of all possibilities."
              </p>
              <div className={`p-4 rounded-2xl ${darkMode ? 'bg-slate-950/50' : 'bg-slate-50'} border border-dashed border-slate-700/30`}>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[10px] font-black uppercase text-indigo-400">Example: Rolling a '6'</span>
                  <span className="text-[10px] font-bold text-slate-500">P(6) = 1/6 (16.7%)</span>
                </div>
                <div className="flex gap-1.5 items-end h-8">
                  <div className="flex-1 bg-indigo-600 rounded-t-lg flex items-center justify-center text-[10px] font-black pointer-events-none" style={{ height: '100%' }}>
                    6
                  </div>
                  <div className="w-px h-full bg-slate-700 mx-1" />
                  {[1, 2, 3, 4, 5].map((v) => (
                    <div
                      key={v}
                      className="flex-1 bg-slate-600 rounded-t-lg flex items-center justify-center text-[10px] font-black text-slate-300 pointer-events-none"
                      style={{ height: '100%' }}
                    >
                      {v}
                    </div>
                  ))}
                </div>
                <div className="flex justify-between mt-2">
                  <span className="text-[8px] font-black text-indigo-400 uppercase">P(A)</span>
                  <span className="text-[8px] font-black text-slate-500 uppercase">P(Not A) = 1, 2, 3, 4, 5</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className={`p-8 rounded-3xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'} space-y-8`}>
          <h6 className="text-xs font-black uppercase tracking-widest text-indigo-400">Mutual Exclusivity</h6>
          <div className="grid md:grid-cols-2 gap-12">
            <div className="text-center space-y-4">
              <div className="relative flex justify-center space-x-4">
                <div className="w-20 h-20 rounded-full bg-indigo-500/20 border-2 border-indigo-500 flex items-center justify-center font-black text-indigo-500">A</div>
                <div className="w-20 h-20 rounded-full bg-rose-500/20 border-2 border-rose-500 flex items-center justify-center font-black text-rose-500">B</div>
              </div>
              <div className="text-[10px] font-black uppercase text-slate-500">Mutually Exclusive</div>
              <p className="text-[10px] text-slate-500 italic">
                Example: Rolling a '2' vs. a '5' on a die.
                <br />
                They cannot happen together.
                <br />
                <span className="text-indigo-400 font-black">P(A and B) = 0</span>
              </p>
            </div>
            <div className="text-center space-y-4">
              <div className="relative w-40 h-24 mx-auto flex items-center justify-center">
                <div className="absolute left-0 w-20 h-20 rounded-full bg-indigo-500/20 border-2 border-indigo-500/80 flex items-center justify-center font-black text-indigo-500 z-10">
                  A
                </div>
                <div className="absolute right-0 w-20 h-20 rounded-full bg-rose-500/20 border-2 border-rose-500/80 flex items-center justify-center font-black text-rose-500">
                  B
                </div>
                <div className="absolute inset-0 flex items-center justify-center z-20">
                  <div className="bg-slate-900/80 backdrop-blur-sm px-1.5 py-0.5 rounded border border-white/10 text-[8px] font-black text-white shadow-xl">A ∩ B {' > '} 0</div>
                </div>
              </div>
              <div className="text-[10px] font-black uppercase text-slate-500">NOT Mutually Exclusive</div>
              <p className="text-[10px] text-slate-500 italic">
                Example: A card is a 'King' vs. 'Red'.
                <br />
                You can have a Red King!
                <br />
                <span className="text-rose-400 font-black">Overlap exists.</span>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
