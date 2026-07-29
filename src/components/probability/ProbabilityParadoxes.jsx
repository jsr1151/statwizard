import { useState } from 'react';
import BirthdayParadoxPanel from './BirthdayParadoxPanel';
import GamblersFallacyPanel from './GamblersFallacyPanel';
import MontyHallPanel from './MontyHallPanel';
import SimpsonsParadoxPanel from './SimpsonsParadoxPanel';

const MODES = [
  { id: 'monty', label: 'Monty' },
  { id: 'birthday', label: 'Birthday' },
  { id: 'gambler', label: 'Gambler' },
  { id: 'simpson', label: 'Simpson' },
];

const createMontyDoors = (doorCount) => {
  const carIndex = Math.floor(Math.random() * doorCount);
  return Array.from({ length: doorCount }, (_, index) => (index === carIndex ? 'car' : 'goat'));
};

export default function ProbabilityParadoxes({ darkMode }) {
  const [paradoxType, setParadoxType] = useState('monty');
  const [montyState, setMontyState] = useState({
    doors: createMontyDoors(3),
    selected: null,
    revealed: [],
    gameState: 'start',
    win: false,
    doorCount: 3,
    history: { stayWins: 0, switchWins: 0, stayTotal: 0, switchTotal: 0 },
  });
  const [doorInput, setDoorInput] = useState('3');
  const [birthdayPeople, setBirthdayPeople] = useState(23);
  const [birthdaySim, setBirthdaySim] = useState({ trials: 0, matches: 0 });
  const [gamblerStreak, setGamblerStreak] = useState([]);
  const [simpsonRates, setSimpsonRates] = useState({
    aEasy: 0.9,
    aHard: 0.3,
    bEasy: 0.89,
    bHard: 0.29,
  });
  const [simpsonCounts, setSimpsonCounts] = useState({
    aEasy: 100,
    aHard: 900,
    bEasy: 100,
    bHard: 100,
  });

  const resetMonty = (doorCount = 3) => {
    setMontyState((previous) => ({
      ...previous,
      doors: createMontyDoors(doorCount),
      selected: null,
      revealed: [],
      gameState: 'start',
      win: false,
      doorCount,
    }));
  };

  const handleMontyPick = (selectedDoor) => {
    if (montyState.gameState !== 'start') return;

    const goats = montyState.doors.map((_, index) => index).filter((index) => index !== selectedDoor && montyState.doors[index] === 'goat');
    const revealed = goats.slice(0, montyState.doorCount - 2);

    setMontyState((previous) => ({
      ...previous,
      selected: selectedDoor,
      revealed,
      gameState: 'picked',
    }));
  };

  const handleMontyFinal = (stay) => {
    const finalPick = stay ? montyState.selected : montyState.doors.map((_, index) => index).find((index) => index !== montyState.selected && !montyState.revealed.includes(index));
    const win = montyState.doors[finalPick] === 'car';

    setMontyState((previous) => {
      const history = { ...previous.history };
      if (stay) {
        history.stayTotal += 1;
        if (win) history.stayWins += 1;
      } else {
        history.switchTotal += 1;
        if (win) history.switchWins += 1;
      }

      return {
        ...previous,
        selected: finalPick,
        revealed: previous.doors.map((_, index) => index),
        gameState: 'result',
        win,
        history,
      };
    });
  };

  return (
    <div className="animate-in fade-in duration-500 space-y-8">
      <div className="flex justify-center p-1 bg-slate-900/50 rounded-xl border border-white/5 max-w-sm mx-auto">
        {MODES.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => setParadoxType(id)}
            className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${paradoxType === id ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-white'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {paradoxType === 'monty' && (
        <MontyHallPanel
          darkMode={darkMode}
          doorInput={doorInput}
          handleMontyFinal={handleMontyFinal}
          handleMontyPick={handleMontyPick}
          montyState={montyState}
          resetMonty={resetMonty}
          setDoorInput={setDoorInput}
          setMontyState={setMontyState}
        />
      )}
      {paradoxType === 'birthday' && (
        <BirthdayParadoxPanel birthdayPeople={birthdayPeople} birthdaySim={birthdaySim} darkMode={darkMode} setBirthdayPeople={setBirthdayPeople} setBirthdaySim={setBirthdaySim} />
      )}
      {paradoxType === 'gambler' && <GamblersFallacyPanel darkMode={darkMode} gamblerStreak={gamblerStreak} setGamblerStreak={setGamblerStreak} />}
      {paradoxType === 'simpson' && (
        <SimpsonsParadoxPanel darkMode={darkMode} setSimpsonCounts={setSimpsonCounts} setSimpsonRates={setSimpsonRates} simpsonCounts={simpsonCounts} simpsonRates={simpsonRates} />
      )}
    </div>
  );
}
