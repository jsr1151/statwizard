import { useEffect, useMemo, useState } from 'react';

const probabilityOfMatch = (people) => {
  let noMatch = 1;
  for (let index = 0; index < people; index += 1) noMatch *= (365 - index) / 365;
  return 1 - noMatch;
};

const createGroup = (size) => Array.from({ length: size }, () => Math.floor(Math.random() * 365));
const formatDay = (day) => {
  const date = new Date(Date.UTC(2024, 0, 1 + day));
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', timeZone: 'UTC' });
};

export default function BirthdayParadoxPanel({ birthdayPeople, birthdaySim, darkMode, setBirthdayPeople, setBirthdaySim }) {
  const [group, setGroup] = useState(() => createGroup(birthdayPeople));
  useEffect(() => { setGroup(createGroup(birthdayPeople)); }, [birthdayPeople]);
  const counts = useMemo(() => group.reduce((map, day) => map.set(day, (map.get(day) || 0) + 1), new Map()), [group]);
  const matchingDays = [...counts.entries()].filter(([, count]) => count > 1);
  const theoretical = probabilityOfMatch(birthdayPeople);

  const simulateGroups = () => {
    let matches = 0;
    for (let trial = 0; trial < 1000; trial += 1) {
      const days = new Set();
      let matched = false;
      for (let person = 0; person < birthdayPeople; person += 1) {
        const day = Math.floor(Math.random() * 365);
        if (days.has(day)) { matched = true; break; }
        days.add(day);
      }
      if (matched) matches += 1;
    }
    setBirthdaySim((previous) => ({ trials: previous.trials + 1000, matches: previous.matches + matches }));
  };

  return <div className="animate-in fade-in space-y-6">
    <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
      <div className={`rounded-3xl border p-6 text-center ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        <div className="text-5xl font-black text-indigo-400">{(theoretical * 100).toFixed(1)}%</div>
        <p className="mt-2 text-sm text-slate-500">Theoretical chance that at least two people share a birthday</p>
        <input aria-label="Group size" type="range" min="1" max="100" value={birthdayPeople} onChange={(event) => setBirthdayPeople(Number(event.target.value))} className="mt-6 w-full accent-indigo-500" />
        <div className="mt-2 flex justify-between text-xs font-bold text-slate-500"><span>Group: {birthdayPeople}</span><span>23 people: 50.7%</span></div>
      </div>
      <div className={`rounded-3xl border p-5 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
        <div className="flex flex-wrap justify-between gap-3"><div><h5 className="font-black">One simulated group</h5><p className="text-xs text-slate-500">Matching birthdays are highlighted with the same color.</p></div><button type="button" onClick={() => setGroup(createGroup(birthdayPeople))} className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-bold">Generate another group</button></div>
        <div className="relative mt-5 grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-2">
          {group.map((day, index) => { const matched = counts.get(day) > 1; return <div key={index} className={`rounded-lg border p-2 text-center ${matched ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : darkMode ? 'bg-slate-900 border-slate-800 text-slate-500' : 'bg-white border-slate-200 text-slate-500'}`}><div className="text-[9px] font-black">P{index + 1}</div><div className="text-[9px] mt-1">{formatDay(day)}</div></div>; })}
        </div>
        <div className={`mt-4 rounded-xl p-3 text-sm ${matchingDays.length ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-500/10 text-slate-500'}`}>{matchingDays.length ? matchingDays.map(([day, count]) => `${count} people share ${formatDay(day)}`).join(' · ') : 'No match in this group. Generate another group—many individual groups will have none even when the overall probability exceeds 50%.'}</div>
      </div>
    </div>
    <div className={`rounded-3xl border p-6 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}><div className="flex flex-wrap items-center justify-between gap-4"><div><h5 className="font-black">Repeat the group experiment 1,000 times</h5><p className="mt-1 text-xs text-slate-500">This creates 1,000 independent groups of {birthdayPeople} people and counts how many groups contain at least one shared birthday. Repeating it makes the empirical rate approach the theoretical {(theoretical * 100).toFixed(1)}%.</p></div><button type="button" onClick={simulateGroups} className="px-5 py-3 rounded-xl bg-indigo-600 text-white text-xs font-black">Simulate 1,000 groups</button></div><div className="mt-4 text-sm font-bold">Empirical rate: {birthdaySim.trials ? `${(birthdaySim.matches / birthdaySim.trials * 100).toFixed(2)}%` : 'Run the experiment to begin'} <span className="text-slate-500">({birthdaySim.matches.toLocaleString()} matching groups out of {birthdaySim.trials.toLocaleString()})</span></div></div>
  </div>;
}
