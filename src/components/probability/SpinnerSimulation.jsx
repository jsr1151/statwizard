import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';

const INITIAL_SEGMENTS = [
  { label: 'WIN', color: '#4f46e5', weight: 1, points: 10 },
  { label: 'LOSS', color: '#10b981', weight: 1, points: 0 },
  { label: 'BOOST', color: '#f59e0b', weight: 1, points: 20 },
  { label: 'RESET', color: '#ef4444', weight: 1, points: -50 },
];

export default function SpinnerSimulation({ darkMode }) {
  const [spinnerAngle, setSpinnerAngle] = useState(0);
  const [spinnerSegments, setSpinnerSegments] = useState(INITIAL_SEGMENTS);
  const [spinnerEVHistory, setSpinnerEVHistory] = useState([]);
  const [spinnerSubMode, setSpinnerSubMode] = useState('spin');

  const totalWeight = spinnerSegments.reduce((sum, segment) => sum + (segment.weight || 1), 0);
  let currentWeight = 0;
  const segmentsWithAngles = spinnerSegments.map((segment) => {
    const start = (currentWeight / totalWeight) * 360;
    const size = ((segment.weight || 1) / totalWeight) * 360;
    currentWeight += segment.weight || 1;
    return { ...segment, start, size };
  });

  return (
    <div className="animate-in fade-in duration-500 space-y-8">
      <div className="flex justify-center p-1 bg-slate-900/50 rounded-xl border border-white/5 max-w-sm mx-auto mb-4">
        {[
          { id: 'spin', label: 'Spin' },
          { id: 'weighted', label: 'Weights' },
          { id: 'ev', label: 'EV/Sets' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setSpinnerSubMode(t.id)}
            className={`flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${spinnerSubMode === t.id ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col items-center gap-8">
        <div className="relative">
          <div
            className="w-56 h-56 rounded-full border-8 border-slate-800 relative transition-transform duration-[3000ms] ease-out shadow-2xl overflow-hidden"
            style={{
              transform: `rotate(${spinnerAngle}deg)`,
              background: `conic-gradient(${segmentsWithAngles.map((s) => `${s.color} ${s.start}deg ${s.start + s.size}deg`).join(', ')})`,
            }}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              {segmentsWithAngles.map((seg, i) => (
                <span
                  key={i}
                  className="absolute text-[8px] font-black text-white"
                  style={{
                    transform: `rotate(${seg.start + seg.size / 2}deg) translateY(-85px)`,
                    textShadow: '0 1px 2px rgba(0,0,0,0.8)',
                  }}
                >
                  {seg.label}
                </span>
              ))}
            </div>
          </div>
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-8 h-12 flex flex-col items-center z-20">
            <div className="w-1.5 h-full bg-white rounded-full" />
            <div className="w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[14px] border-t-white" />
          </div>
        </div>

        {spinnerSubMode === 'spin' && (
          <div className="w-full max-w-sm space-y-6">
            <button
              onClick={() => {
                const newAngle = spinnerAngle + Math.floor(Math.random() * 360) + 1440;
                setSpinnerAngle(newAngle);
                // Determine winner
                const finalRotation = newAngle % 360;
                const winAngle = (360 - finalRotation) % 360;
                const winner = segmentsWithAngles.find((s) => winAngle >= s.start && winAngle < s.start + s.size);
                if (winner) setSpinnerEVHistory((prev) => [...prev, winner.points || 0]);
              }}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black uppercase tracking-widest transition-all shadow-lg active:scale-95"
            >
              SPIN THE WHEEL
            </button>
            <div className="grid grid-cols-2 gap-4">
              {spinnerSegments.slice(0, 4).map((s, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                  <span className="text-[10px] font-bold text-slate-500">
                    {((s.weight / totalWeight) * 100).toFixed(1)}% {s.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {spinnerSubMode === 'weighted' && (
          <div className="w-full max-w-sm space-y-4 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
            <div className="flex justify-between items-center mb-4">
              <h6 className="text-[10px] font-black uppercase text-slate-500">Edit Segment Weights</h6>
              <button
                onClick={() => {
                  if (spinnerSegments.length >= 12) return;
                  const colors = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316', '#84cc16'];
                  setSpinnerSegments([...spinnerSegments, { label: 'NEW', color: colors[spinnerSegments.length % colors.length], weight: 1, points: 0 }]);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600 hover:text-white text-[10px] font-black transition-all"
              >
                <Plus className="w-3 h-3" /> ADD SEGMENT
              </button>
            </div>
            <div className="space-y-3">
              {spinnerSegments.map((seg, i) => (
                <div
                  key={i}
                  className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'} flex flex-col gap-4 relative group`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full shadow-inner" style={{ backgroundColor: seg.color }} />
                    <input
                      type="text"
                      value={seg.label}
                      onChange={(e) => {
                        const next = [...spinnerSegments];
                        next[i].label = e.target.value.toUpperCase().slice(0, 12);
                        setSpinnerSegments(next);
                      }}
                      className="flex-1 bg-transparent text-xs font-black outline-none border-b-2 border-transparent focus:border-indigo-500 transition-all uppercase"
                      placeholder="LABEL"
                    />
                    <button
                      onClick={() => {
                        if (spinnerSegments.length <= 2) return;
                        setSpinnerSegments(spinnerSegments.filter((_, idx) => idx !== i));
                      }}
                      className="text-rose-500/40 hover:text-rose-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest pl-1">Weight</span>
                      <div className="flex items-center gap-2 bg-slate-800/50 rounded-xl px-3 py-2 border border-white/5">
                        <input
                          type="number"
                          step="0.1"
                          value={seg.weight}
                          onChange={(e) => {
                            const next = [...spinnerSegments];
                            next[i].weight = Math.max(0, parseFloat(e.target.value) || 0);
                            setSpinnerSegments(next);
                          }}
                          className="w-full bg-transparent text-sm font-black text-white outline-none"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest pl-1">Points (EV)</span>
                      <div className="flex items-center gap-2 bg-slate-800/50 rounded-xl px-3 py-2 border border-white/5">
                        <input
                          type="number"
                          value={seg.points}
                          onChange={(e) => {
                            const next = [...spinnerSegments];
                            next[i].points = parseFloat(e.target.value) || 0;
                            setSpinnerSegments(next);
                          }}
                          className="w-full bg-transparent text-sm font-black text-white outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {spinnerSubMode === 'ev' && (
          <div className="w-full max-w-sm space-y-6">
            <div className={`p-6 rounded-3xl bg-indigo-600/10 border border-indigo-500/20 text-center shadow-inner`}>
              <div className="text-[10px] font-black uppercase text-slate-500 mb-1">Theoretical EV (Points)</div>
              <div className="text-4xl font-black text-white">{spinnerSegments.reduce((sum, s) => sum + s.points * (s.weight / totalWeight), 0).toFixed(2)}</div>
              <div className="mt-2 text-[9px] font-bold text-indigo-400 uppercase tracking-widest opacity-80">Σ (P_i × V_i)</div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className={`p-4 rounded-2xl border border-indigo-500/10 ${darkMode ? 'bg-slate-900' : 'bg-slate-50'}`}>
                <div className="text-[8px] font-black text-slate-500 uppercase mb-1">Session Avg</div>
                <div className="text-xl font-black text-white">
                  {spinnerEVHistory.length > 0 ? (spinnerEVHistory.reduce((a, b) => a + b, 0) / spinnerEVHistory.length).toFixed(4) : '0.0000'}
                </div>
                <div className="text-[8px] text-slate-600 font-bold uppercase mt-1">{spinnerEVHistory.length} Spins</div>
              </div>
              <button
                onClick={() => setSpinnerEVHistory([])}
                className="p-4 rounded-2xl border border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/10 transition-all flex flex-col items-center justify-center"
              >
                <span className="text-[8px] font-black text-rose-400 uppercase">Clear History</span>
              </button>
            </div>

            <div className={`p-5 rounded-2xl border border-dashed border-indigo-500/20 ${darkMode ? 'bg-slate-950' : 'bg-white'} space-y-4`}>
              <h6 className="text-[9px] font-black text-indigo-400 uppercase tracking-wider">Set Operations (First Segment)</h6>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <div className="text-[8px] font-black text-slate-500 uppercase">P(A)</div>
                  <div className="text-sm font-black text-white">{((spinnerSegments[0].weight / totalWeight) * 100).toFixed(1)}%</div>
                  <div className="text-[7px] text-slate-600 uppercase font-black">Occurrence</div>
                </div>
                <div className="space-y-1">
                  <div className="text-[8px] font-black text-slate-500 uppercase">P(Aᶜ)</div>
                  <div className="text-sm font-black text-indigo-400">{((1 - spinnerSegments[0].weight / totalWeight) * 100).toFixed(1)}%</div>
                  <div className="text-[7px] text-slate-600 uppercase font-black">Complement</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
