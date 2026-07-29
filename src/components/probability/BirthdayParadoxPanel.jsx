export default function BirthdayParadoxPanel({ birthdayPeople, birthdaySim, darkMode, setBirthdayPeople, setBirthdaySim }) {
  return (
    <div className="animate-in fade-in space-y-8">
      <div className="relative w-64 h-64 mx-auto flex items-center justify-center bg-slate-900/40 rounded-full border border-white/5 overflow-hidden">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {/* Connection Lines */}
          {Array.from({ length: Math.min(birthdayPeople, 40) }).map((_, i) => {
            const angle1 = (i / Math.min(birthdayPeople, 40)) * 2 * Math.PI;
            const r = 40;
            const x1 = 50 + r * Math.cos(angle1);
            const y1 = 50 + r * Math.sin(angle1);
            return Array.from({ length: Math.min(birthdayPeople, 40) })
              .slice(i + 1)
              .map((_, j) => {
                const k = i + 1 + j;
                const angle2 = (k / Math.min(birthdayPeople, 40)) * 2 * Math.PI;
                const x2 = 50 + r * Math.cos(angle2);
                const y2 = 50 + r * Math.sin(angle2);
                return <line key={`${i}-${k}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke="currentColor" strokeWidth="0.1" className="text-indigo-500/20" />;
              });
          })}
          {/* People Nodes */}
          {Array.from({ length: Math.min(birthdayPeople, 40) }).map((_, i) => {
            const angle = (i / Math.min(birthdayPeople, 40)) * 2 * Math.PI;
            const r = 40;
            return <circle key={i} cx={50 + r * Math.cos(angle)} cy={50 + r * Math.sin(angle)} r="1.5" className="fill-indigo-500" />;
          })}
          <circle cx="50" cy="50" r="45" fill="none" stroke="#1e293b" strokeWidth="4" />
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke={birthdayPeople >= 23 ? '#10b981' : '#4f46e5'}
            strokeWidth="4"
            strokeDasharray={`${(() => {
              let p = 1;
              for (let i = 0; i < birthdayPeople; i++) p *= (365 - i) / 365;
              return (1 - p) * 282.7;
            })()} 282.7`}
            strokeLinecap="round"
            className="transition-all duration-1000"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/20">
          <span className="text-4xl font-black text-white">
            {(() => {
              let p = 1;
              for (let i = 0; i < birthdayPeople; i++) p *= (365 - i) / 365;
              return ((1 - p) * 100).toFixed(1);
            })()}
            %
          </span>
          <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest mt-1">Match Potential</span>
        </div>
      </div>
      <div className="space-y-4">
        <input
          type="range"
          min="1"
          max="100"
          value={birthdayPeople}
          onChange={(e) => setBirthdayPeople(parseInt(e.target.value))}
          className="w-full accent-indigo-500 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
        />
        <div className="flex justify-between text-[10px] font-black text-slate-500">
          <span>Group Size: {birthdayPeople}</span>
          <span>Target: 23 (50%)</span>
        </div>
      </div>
      <div className={`p-6 rounded-3xl ${darkMode ? 'bg-slate-950 border-slate-800 border' : 'bg-white border-slate-200 border'} text-center space-y-4`}>
        <button
          onClick={() => {
            let matchCount = 0;
            for (let t = 0; t < 1000; t++) {
              const bdays = new Set();
              let matched = false;
              for (let i = 0; i < birthdayPeople; i++) {
                const b = Math.floor(Math.random() * 365);
                if (bdays.has(b)) {
                  matched = true;
                  break;
                }
                bdays.add(b);
              }
              if (matched) matchCount++;
            }
            setBirthdaySim((p) => ({ trials: p.trials + 1000, matches: p.matches + matchCount }));
          }}
          className="py-2 px-6 bg-slate-800 rounded-full text-[10px] font-black text-indigo-400 uppercase hover:bg-slate-700 transition-all"
        >
          Simulate 1,000 Groups
        </button>
        <div className="text-xs font-bold text-slate-400">
          Empirical Rate: {birthdaySim.trials > 0 ? ((birthdaySim.matches / birthdaySim.trials) * 100).toFixed(2) : '0.00'}% ({birthdaySim.trials} trials)
        </div>
      </div>
    </div>
  );
}
