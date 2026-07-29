import { useState } from 'react';
import { combinations } from '../../stats/probability';
import CardHuntPanel from './CardHuntPanel';
import CardReplacementPanel from './CardReplacementPanel';
import DeckTrackerPanel from './DeckTrackerPanel';
import HiLoCountingPanel from './HiLoCountingPanel';
import PokerOddsPanel from './PokerOddsPanel';
import PokerOutsPanel from './PokerOutsPanel';

const MODES = [
  { id: 'poker', label: 'Poker' },
  { id: 'hunt', label: 'Hunt & Bet' },
  { id: 'replace', label: 'Replace' },
  { id: 'conditional', label: 'Deck Tracker' },
  { id: 'outs', label: 'Outs' },
  { id: 'hilo', label: 'Hi-Lo Count' },
];

const MODE_GUIDANCE = {
  poker: { title: 'Poker hand odds', goal: 'See how often each five-card poker hand should occur.', action: 'Deal hands, then compare the observed results with the theoretical probabilities.' },
  hunt: { title: 'Hunt and bet', goal: 'Connect the chance of drawing a target card with the value of a bet.', action: 'Choose a target and hand size, run hands, and open the math to compare probability with profit.' },
  replace: { title: 'With or without replacement', goal: 'See how replacement changes the sample space and whether draws are independent.', action: 'Choose a hand size, toggle replacement, and compare the resulting probabilities.' },
  conditional: { title: 'Deck tracker', goal: 'Watch conditional probabilities change as known cards leave the deck.', action: 'Reveal cards and observe how the remaining deck changes the chance of the next card.' },
  outs: { title: 'Poker outs', goal: 'Translate cards that improve a hand into turn and river probabilities.', action: 'Choose a draw scenario and inspect the number of outs and chance of improving.' },
  hilo: { title: 'Hi-Lo counting', goal: 'See how a running count summarizes the balance of high and low cards remaining.', action: 'Deal through the deck and watch the counts; they shift odds but never guarantee a card.' },
};

export default function ProbabilityCards({ darkMode }) {
  const [cardSubMode, setCardSubMode] = useState('poker');
  const [cardGame, setCardGame] = useState({
    active: false,
    type: 'draw',
    playerCard: null,
    houseCard: null,
    result: null,
    streak: 0,
    history: [],
  });
  const [huntTarget, setHuntTarget] = useState('Aces');
  const [huntHandSize, setHuntHandSize] = useState(5);
  const [huntHistory, setHuntHistory] = useState([]);
  const [huntLastHand, setHuntLastHand] = useState(null);
  const [huntWithReplacement, setHuntWithReplacement] = useState(false);
  const [showHuntMath, setShowHuntMath] = useState(false);
  const [huntSessionProfit, setHuntSessionProfit] = useState(0);
  const [replaceHandSize, setReplaceHandSize] = useState(3);
  const [replaceWithRep, setReplaceWithRep] = useState(false);
  const [deckRevealHistory, setDeckRevealHistory] = useState([]);
  const [pokerOutsScenario, setPokerOutsScenario] = useState('flush');
  const [pokerOutsCards, setPokerOutsCards] = useState({
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
  const [hiLoCount, setHiLoCount] = useState(0);
  const [hiLoHistory, setHiLoHistory] = useState([]);
  const [hiLoDeck, setHiLoDeck] = useState([]);
  const [cardBetConfig, setCardBetConfig] = useState({
    target: 'Heart',
    payout: 3,
    bet: 1,
  });

  return (
    <div className="animate-in fade-in duration-500 space-y-8">
      <div className="flex justify-center p-1 bg-slate-900/50 rounded-xl border border-white/5 max-w-lg mx-auto mb-6">
        {MODES.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => setCardSubMode(id)}
            className={`flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${cardSubMode === id ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className={`max-w-3xl mx-auto -mt-3 p-4 rounded-2xl border ${darkMode ? 'bg-indigo-500/5 border-indigo-500/20' : 'bg-indigo-50 border-indigo-100'}`}>
        <h5 className="text-sm font-black text-indigo-400">{MODE_GUIDANCE[cardSubMode].title}</h5>
        <p className={`mt-1 text-xs leading-relaxed ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}><strong>What it demonstrates:</strong> {MODE_GUIDANCE[cardSubMode].goal}</p>
        <p className="mt-1 text-xs leading-relaxed text-slate-500"><strong>Try this:</strong> {MODE_GUIDANCE[cardSubMode].action}</p>
      </div>

      {cardSubMode === 'poker' && <PokerOddsPanel cardGame={cardGame} darkMode={darkMode} setCardGame={setCardGame} />}
      {cardSubMode === 'hunt' && (
        <CardHuntPanel
          cardBetConfig={cardBetConfig}
          darkMode={darkMode}
          huntHandSize={huntHandSize}
          huntHistory={huntHistory}
          huntLastHand={huntLastHand}
          huntSessionProfit={huntSessionProfit}
          huntTarget={huntTarget}
          huntWithReplacement={huntWithReplacement}
          nCr={combinations}
          setCardBetConfig={setCardBetConfig}
          setHuntHandSize={setHuntHandSize}
          setHuntHistory={setHuntHistory}
          setHuntLastHand={setHuntLastHand}
          setHuntSessionProfit={setHuntSessionProfit}
          setHuntTarget={setHuntTarget}
          setHuntWithReplacement={setHuntWithReplacement}
          setShowHuntMath={setShowHuntMath}
          showHuntMath={showHuntMath}
        />
      )}
      {cardSubMode === 'replace' && (
        <CardReplacementPanel
          darkMode={darkMode}
          replaceHandSize={replaceHandSize}
          replaceWithRep={replaceWithRep}
          setReplaceHandSize={setReplaceHandSize}
          setReplaceWithRep={setReplaceWithRep}
        />
      )}
      {cardSubMode === 'conditional' && <DeckTrackerPanel darkMode={darkMode} deckRevealHistory={deckRevealHistory} setDeckRevealHistory={setDeckRevealHistory} />}
      {cardSubMode === 'outs' && (
        <PokerOutsPanel
          darkMode={darkMode}
          pokerOutsCards={pokerOutsCards}
          pokerOutsScenario={pokerOutsScenario}
          setPokerOutsCards={setPokerOutsCards}
          setPokerOutsScenario={setPokerOutsScenario}
        />
      )}
      {cardSubMode === 'hilo' && (
        <HiLoCountingPanel
          darkMode={darkMode}
          hiLoCount={hiLoCount}
          hiLoDeck={hiLoDeck}
          hiLoHistory={hiLoHistory}
          setHiLoCount={setHiLoCount}
          setHiLoDeck={setHiLoDeck}
          setHiLoHistory={setHiLoHistory}
        />
      )}
    </div>
  );
}
