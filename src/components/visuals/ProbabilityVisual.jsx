import React, { useState, useEffect, useMemo, useRef } from 'react';
import { AlertCircle, Sparkles, Calculator, MousePointer2, Info, ArrowDown, MousePointerClick, Maximize2, Minimize2, RefreshCw, Play, ChevronsRight, ChevronUp, ChevronDown, Activity, Lightbulb, BrainCircuit, BarChart2, Sigma, BookOpen, Plus, X, Trash2, Edit2, TrendingUp, Grid, FileText, PieChart } from 'lucide-react';
import { getGaussianPoints, getTPoints, normalCDF, tCDF, erf, getTCrit, getFDensity, fCDF, fPPF, getFCrit, getFPoints, calculateAnova, calculatePostHoc, lnGamma, beta } from '../../utils/mathHelpers';
import { pointsToPath, pointsToLine, getOrdinal } from '../../utils/svgHelpers';
import useTutor from '../../hooks/useTutor';
import TutorPanel from '../tutor/TutorPanel';
import CalculationText from '../common/CalculationText';
import TabButton from '../common/TabButton';
const ProbabilityVisual = ({ mode = 'basics', darkMode }) => {
  const [coinFlipState, setCoinFlipState] = useState({ flipping: false, lastSide: 'heads' });
  const [coinStats, setCoinStats] = useState({ heads: 0, tails: 0, total: 0 });
  const [diceType, setDiceType] = useState(6);
  const [diceResult, setDiceResult] = useState(1);
  const [diceHistory, setDiceHistory] = useState([]);
  const [spinnerAngle, setSpinnerAngle] = useState(0);
  const [spinnerSegments, setSpinnerSegments] = useState([
    { label: 'WIN', color: '#4f46e5', weight: 1, points: 10 },
    { label: 'LOSS', color: '#10b981', weight: 1, points: 0 },
    { label: 'BOOST', color: '#f59e0b', weight: 1, points: 20 },
    { label: 'RESET', color: '#ef4444', weight: 1, points: -50 }
  ]);
  const [spinnerEVHistory, setSpinnerEVHistory] = useState([]);
  const [montyState, setMontyState] = useState({
    doors: [null, null, null],
    selected: null,
    revealed: [],
    gameState: 'start',
    win: false,
    doorCount: 3,
    history: { stayWins: 0, switchWins: 0, stayTotal: 0, switchTotal: 0 }
  });
  const [basicsEvent, setBasicsEvent] = useState(null);
  const [cardResult, setCardResult] = useState(null);
  const [cardGame, setCardGame] = useState({
    active: false,
    type: 'draw',
    playerCard: null,
    houseCard: null,
    result: null,
    streak: 0,
    history: [] // Tracking last 10 outcomes [1, 0, 1...]
  });
  const [propertyView, setPropertyView] = useState('rules'); // 'rules' or 'mutual'
  const [complementP, setComplementP] = useState(0.7);
  const [birthdayPeople, setBirthdayPeople] = useState(23);
  const [paradoxType, setParadoxType] = useState('monty'); // 'monty' or 'birthday'
  const [gamblerStreak, setGamblerStreak] = useState([]);
  const [doorInput, setDoorInput] = useState("3");
  const [simpsonRates, setSimpsonRates] = useState({ aEasy: 0.90, aHard: 0.30, bEasy: 0.89, bHard: 0.29 });
  const [simpsonCounts, setSimpsonCounts] = useState({ aEasy: 100, aHard: 900, bEasy: 100, bHard: 100 });
  const [showGeneralOr, setShowGeneralOr] = useState(false);
  const [showGeneralAnd, setShowGeneralAnd] = useState(false);

  // Advanced Probability (Phase VI)
  const [coinSubMode, setCoinSubMode] = useState('lln');
  const [binomN, setBinomN] = useState(10);
  const [binomP, setBinomP] = useState(0.5);
  const [binomHistory, setBinomHistory] = useState([]);
  const [evPayoutH, setEvPayoutH] = useState(1);
  const [evPayoutT, setEvPayoutT] = useState(-1);
  const [evHistory, setEvHistory] = useState([]);

  const [diceSubMode, setDiceSubMode] = useState('single');
  const [diceCountVal, setDiceCountVal] = useState(2);
  const [diceSumHistory, setDiceSumHistory] = useState([]);
  const [cltHistory, setCltHistory] = useState([]);
  const [diceEvPayouts, setDiceEvPayouts] = useState({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 });
  const [diceEvHistory, setDiceEvHistory] = useState([]);

  const [spinnerSubMode, setSpinnerSubMode] = useState('spin');
  const [cardSubMode, setCardSubMode] = useState('poker');
  const [cardDrawn, setCardDrawn] = useState([]);

  // Cards Expansion State
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
  const [deckTrackerDeck, setDeckTrackerDeck] = useState([]); // Remaining cards

  const [pokerOutsScenario, setPokerOutsScenario] = useState('flush');
  const [pokerOutsCards, setPokerOutsCards] = useState({
    hand: [{ suit: '♠', rank: 'A' }, { suit: '♠', rank: 'K' }],
    flop: [{ suit: '♠', rank: '7' }, { suit: '♠', rank: '2' }, { suit: '♦', rank: 'Q' }]
  });

  const [hiLoCount, setHiLoCount] = useState(0);
  const [hiLoHistory, setHiLoHistory] = useState([]);
  const [hiLoDeck, setHiLoDeck] = useState([]);

  const [cardBetConfig, setCardBetConfig] = useState({
    target: 'Heart',
    payout: 3,
    bet: 1
  });
  const [cardBetBankroll, setCardBetBankroll] = useState(100);
  const [cardBetHistory, setCardBetHistory] = useState([]);

  const [birthdaySim, setBirthdaySim] = useState({ trials: 0, matches: 0 });
  const [simpsonData, setSimpsonData] = useState({
    aPrimary: { s: 15, t: 100 }, aSecondary: { s: 70, t: 200 },
    bPrimary: { s: 12, t: 80 }, bSecondary: { s: 40, t: 110 }
  });

  const nCr = (n, r) => {
    if (r < 0 || r > n) return 0;
    if (r === 0 || r === n) return 1;
    if (r > n / 2) r = n - r;
    let res = 1;
    for (let i = 1; i <= r; i++) {
      res = res * (n - i + 1) / i;
    }
    return res;
  };

  useEffect(() => {
    resetMonty(3);
  }, []);

  const BASICS_EVENTS = [
    { label: "Perfect NCAA Bracket", p: 1 / 9.2e18, color: "text-red-600" },
    { label: "Winning Mega Millions", p: 1 / 302500000, color: "text-red-500" },
    { label: "Winning a Royal Flush", p: 1 / 649740, color: "text-orange-600" },
    { label: "Struck by Lightning (Yearly)", p: 0.000001, color: "text-orange-500" },
    { label: "Drawing an Ace", p: 0.0769, color: "text-amber-600" },
    { label: "Rolling a 6 on a Die", p: 1 / 6, color: "text-amber-500" },
    { label: "4-Choice MC Guess", p: 0.25, color: "text-amber-500" },
    { label: "Flipping Heads", p: 0.5, color: "text-indigo-500" },
    { label: "Rain in Seattle (Avg Day)", p: 0.45, color: "text-blue-500" },
    { label: "Passing a True/False Guess", p: 0.5, color: "text-indigo-400" },
    { label: "Rolling > 1 on a Die", p: 5 / 6, color: "text-emerald-400" },
    { label: "Sun Setting Today", p: 0.99999, color: "text-emerald-500" }
  ];

  // Log-scale power mapping for visceral probability sense
  // Maps [0, 1] -> [0, 100] with extreme zoom for rare events
  const getScalePos = (p) => {
    // Strictly linear mapping: p=0 at 0, p=1 at 100
    return p * 100;
  };

  const resetMonty = (count = 3) => {
    const carIndex = Math.floor(Math.random() * count);
    const doors = Array(count).fill(0).map((_, i) => i === carIndex ? 'car' : 'goat');
    setMontyState(prev => ({
      ...prev,
      doors,
      selected: null,
      revealed: [],
      gameState: 'start',
      win: false,
      doorCount: count
    }));
  };

  const handleMontyPick = (idx) => {
    if (montyState.gameState !== 'start') return;

    const carIndex = montyState.doors.indexOf('car');
    const potentialGoats = montyState.doors
      .map((v, i) => i)
      .filter(i => i !== idx && montyState.doors[i] === 'goat');

    // Reveal logic: reveal N-2 doors, making sure the car and user pick stay closed
    const toReveal = potentialGoats.slice(0, montyState.doorCount - 2);

    setMontyState(prev => ({ ...prev, selected: idx, revealed: toReveal, gameState: 'picked' }));
  };

  const handleMontyFinal = (stay) => {
    let finalPick = montyState.selected;
    if (!stay) {
      finalPick = montyState.doors
        .map((_, i) => i)
        .find(i => i !== montyState.selected && !montyState.revealed.includes(i));
    }
    const win = montyState.doors[finalPick] === 'car';

    setMontyState(prev => {
      const hist = { ...prev.history };
      if (stay) {
        hist.stayTotal++;
        if (win) hist.stayWins++;
      } else {
        hist.switchTotal++;
        if (win) hist.switchWins++;
      }
      // Reveal all doors on result
      const allDoors = prev.doors.map((_, i) => i);
      return { ...prev, selected: finalPick, revealed: allDoors, gameState: 'result', win, history: hist };
    });
  };

  const flipBatch = (count) => {
    let heads = 0;
    let tails = 0;
    for (let i = 0; i < count; i++) {
      if (Math.random() > 0.5) heads++;
      else tails++;
    }
    setCoinStats(prev => ({
      heads: prev.heads + heads,
      tails: prev.tails + tails,
      total: prev.total + count
    }));
  };

  const runBinomTrial = (count = 1) => {
    const results = [];
    for (let t = 0; t < count; t++) {
      let successes = 0;
      for (let i = 0; i < binomN; i++) {
        if (Math.random() < binomP) successes++;
      }
      results.push(successes);
    }
    setBinomHistory(prev => [...prev, ...results]);
  };

  const runEVTrial = (count = 1) => {
    const results = [];
    for (let i = 0; i < count; i++) {
      const isHeads = Math.random() < binomP;
      const payout = isHeads ? evPayoutH : evPayoutT;
      results.push(payout);
    }
    setEvHistory(prev => [...prev, ...results]);
  };

  const getDiceSumDistribution = (n) => {
    let dist = { 1: 1, 2: 1, 3: 1, 4: 1, 5: 1, 6: 1 };
    for (let i = 1; i < n; i++) {
      let nextDist = {};
      for (let s in dist) {
        for (let d = 1; d <= 6; d++) {
          let newSum = parseInt(s) + d;
          nextDist[newSum] = (nextDist[newSum] || 0) + dist[s];
        }
      }
      dist = nextDist;
    }
    const total = Math.pow(6, n);
    const result = [];
    for (let s = n; s <= 6 * n; s++) {
      result.push({ sum: s, prob: (dist[s] || 0) / total });
    }
    return result;
  };

  const runDiceSumTrial = (count = 1) => {
    const results = [];
    for (let t = 0; t < count; t++) {
      let sum = 0;
      for (let i = 0; i < diceCountVal; i++) {
        sum += Math.floor(Math.random() * 6) + 1;
      }
      results.push(sum);
    }
    setDiceSumHistory(prev => [...prev, ...results]);
  };

  const runCLTTrial = (count = 1) => {
    const results = [];
    for (let t = 0; t < count; t++) {
      let sum = 0;
      for (let i = 0; i < diceCountVal; i++) {
        sum += Math.floor(Math.random() * 6) + 1;
      }
      results.push(sum / diceCountVal);
    }
    setCltHistory(prev => [...prev, ...results]);
  };

  const runDiceEVTrial = (count = 1) => {
    const results = [];
    for (let i = 0; i < count; i++) {
      const roll = Math.floor(Math.random() * 6) + 1;
      results.push(diceEvPayouts[roll] || 0);
    }
    setDiceEvHistory(prev => [...prev, ...results]);
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6 p-4">
      {mode === 'basics' && (
        <div className="animate-in fade-in duration-500 space-y-12">
          <div className="text-center">
            <h5 className={`text-xs font-black uppercase tracking-widest mb-6 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>The Probability Scale</h5>
            <div className="relative h-24 flex items-center mb-8 mx-8">
              <div className={`absolute left-0 right-0 h-2 rounded-full ${darkMode ? 'bg-slate-800' : 'bg-slate-200'}`} />
              <div className="absolute left-0 right-0 flex justify-between">
                {[0, 0.25, 0.5, 0.75, 1].map(v => (
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
                    zIndex: 10
                  }}
                >
                  <div className="w-2 h-10 rounded-full bg-indigo-500 ring-4 ring-indigo-500/20 shadow-lg shadow-indigo-500/40" />
                  <div className={`mt-2 whitespace-nowrap text-[10px] font-black uppercase tracking-tighter ${basicsEvent.color} bg-slate-900/80 px-2 py-0.5 rounded-full backdrop-blur-sm border border-white/10`}>
                    {basicsEvent.label} ({(basicsEvent.p * 100).toFixed(basicsEvent.p < 0.0001 ? 8 : 2)}%)
                  </div>
                </div>
              )}

              {/* Axiom Callouts */}
              <div className="absolute -top-10 left-0 text-[9px] font-black text-slate-500 bg-slate-800/20 px-2 py-1 rounded-lg border border-white/5 backdrop-blur-sm group cursor-help">
                P(∅) = 0
                <div className="absolute hidden group-hover:block -top-8 left-0 bg-slate-800 text-white p-2 rounded shadow-xl whitespace-nowrap z-30">Impossible events have probability zero.</div>
              </div>
              <div className="absolute -top-10 right-0 text-[9px] font-black text-slate-500 bg-slate-800/20 px-2 py-1 rounded-lg border border-white/5 backdrop-blur-sm group cursor-help">
                P(Ω) = 1
                <div className="absolute hidden group-hover:block -top-8 right-0 bg-slate-800 text-white p-2 rounded shadow-xl whitespace-nowrap z-30">The set of all possible outcomes equals certainty.</div>
              </div>
              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-[8px] font-black text-slate-600 tracking-widest uppercase">
                0 ≤ P(A) ≤ 1
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
            {BASICS_EVENTS.map(ev => (
              <button
                key={ev.label}
                onClick={() => setBasicsEvent(ev)}
                className={`p-3 rounded-xl border text-left transition-all duration-300 ${basicsEvent?.label === ev.label ? 'border-indigo-500 bg-indigo-500/10' : (darkMode ? 'bg-slate-900 border-slate-800 hover:border-slate-700' : 'bg-white border-slate-100 hover:shadow-lg')}`}
              >
                <span className={`text-[10px] font-bold ${darkMode ? 'text-slate-300' : 'text-slate-700'} block truncate`}>{ev.label}</span>
                <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{ev.p < 0.01 ? "Very Rare" : ev.p < 0.5 ? "Unlikely" : "Likely"}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {mode === 'properties' && (
        <div className="animate-in fade-in duration-500 space-y-8">
          <div className="flex gap-2 mb-6">
            <button onClick={() => setPropertyView('rules')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${propertyView === 'rules' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : (darkMode ? 'bg-slate-800 text-slate-500' : 'bg-slate-100 text-slate-400')}`}>Basic Rules</button>
            <button onClick={() => setPropertyView('mutual')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${propertyView === 'mutual' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : (darkMode ? 'bg-slate-800 text-slate-500' : 'bg-slate-100 text-slate-400')}`}>Mutual Exclusivity</button>
          </div>

          {propertyView === 'rules' ? (
            <div className="grid md:grid-cols-2 gap-6">
              {/* Addition Rule (OR) */}
              <div className={`p-6 rounded-3xl border transition-all ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'}`}>
                <div className="flex justify-between items-start mb-4">
                  <h6 className="text-xs font-black uppercase tracking-widest text-emerald-400">Addition Rule (OR)</h6>
                  <button onClick={() => setShowGeneralOr(!showGeneralOr)} className="text-[10px] font-bold text-slate-500 hover:text-indigo-400 uppercase transition-colors">{showGeneralOr ? 'Hide General' : 'Show General'}</button>
                </div>

                <p className={`text-xs leading-relaxed mb-4 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                  {showGeneralOr ? "General: P(A ∪ B) = P(A) + P(B) - P(A ∩ B)" : "For disjoint events: P(A or B) = P(A) + P(B)"}
                </p>

                {showGeneralOr ? (
                  <div className="space-y-4 animate-in slide-in-from-top-2">
                    <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-bold text-indigo-400 leading-relaxed italic">
                      "Subtract the overlap so you don't double-count."
                    </div>
                    <div className="relative h-16 w-full flex items-center justify-center">
                      <div className="absolute left-1/4 w-12 h-12 rounded-full border-2 border-emerald-500 bg-emerald-500/10 flex items-center justify-center text-[10px] font-black text-emerald-400">A</div>
                      <div className="absolute right-1/4 w-12 h-12 rounded-full border-2 border-emerald-500 bg-emerald-500/10 flex items-center justify-center text-[10px] font-black text-emerald-400">B</div>
                      <div className="absolute w-6 h-12 bg-indigo-500/30 border-x border-indigo-500/50 flex items-center justify-center text-[8px] font-black text-indigo-400">∩</div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      {[1, 2, 3].map(v => (
                        <div key={v} className="w-10 h-10 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-[10px] font-black text-emerald-400">1/6</div>
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
                  <button onClick={() => setShowGeneralAnd(!showGeneralAnd)} className="text-[10px] font-bold text-slate-500 hover:text-indigo-400 uppercase transition-colors">{showGeneralAnd ? 'Hide General' : 'Show General'}</button>
                </div>

                <p className={`text-xs leading-relaxed mb-4 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                  {showGeneralAnd ? "General: P(A ∩ B) = P(A | B) P(B)" : "For independent events: P(A and B) = P(A) × P(B)"}
                </p>

                {showGeneralAnd ? (
                  <div className="space-y-4 animate-in slide-in-from-top-2">
                    <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-bold text-indigo-400 leading-relaxed italic">
                      "Use P(A)P(B) only when independent."
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700 text-[10px] font-black text-slate-300">
                        A = Draw Ace<br />B = Draw Heart
                      </div>
                      <div className="text-xl font-black text-indigo-500">→</div>
                      <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[10px] font-black text-amber-400">
                        (1/13 | B) * (1/4)
                      </div>
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
                      type="range" min="0" max="1" step="0.01"
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
                      <div className="flex-1 bg-indigo-600 rounded-t-lg flex items-center justify-center text-[10px] font-black pointer-events-none" style={{ height: '100%' }}>6</div>
                      <div className="w-px h-full bg-slate-700 mx-1" />
                      {[1, 2, 3, 4, 5].map(v => (
                        <div key={v} className="flex-1 bg-slate-600 rounded-t-lg flex items-center justify-center text-[10px] font-black text-slate-300 pointer-events-none" style={{ height: '100%' }}>{v}</div>
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
                  <p className="text-[10px] text-slate-500 italic">Example: Rolling a '2' vs. a '5' on a die.<br />They cannot happen together.<br /><span className="text-indigo-400 font-black">P(A and B) = 0</span></p>
                </div>
                <div className="text-center space-y-4">
                  <div className="relative w-40 h-24 mx-auto flex items-center justify-center">
                    <div className="absolute left-0 w-20 h-20 rounded-full bg-indigo-500/20 border-2 border-indigo-500/80 flex items-center justify-center font-black text-indigo-500 z-10">A</div>
                    <div className="absolute right-0 w-20 h-20 rounded-full bg-rose-500/20 border-2 border-rose-500/80 flex items-center justify-center font-black text-rose-500">B</div>
                    <div className="absolute inset-0 flex items-center justify-center z-20">
                      <div className="bg-slate-900/80 backdrop-blur-sm px-1.5 py-0.5 rounded border border-white/10 text-[8px] font-black text-white shadow-xl">A ∩ B {" > "} 0</div>
                    </div>
                  </div>
                  <div className="text-[10px] font-black uppercase text-slate-500">NOT Mutually Exclusive</div>
                  <p className="text-[10px] text-slate-500 italic">Example: A card is a 'King' vs. 'Red'.<br />You can have a Red King!<br /><span className="text-rose-400 font-black">Overlap exists.</span></p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {mode === 'simulation' && (
        <div className="animate-in fade-in duration-500 space-y-8">
          <div className="flex justify-center p-1 bg-slate-900/50 rounded-xl border border-white/5 max-w-sm mx-auto mb-4">
            {[
              { id: 'lln', label: 'LLN' },
              { id: 'binom', label: 'Binomial' },
              { id: 'ev', label: 'EV Game' }
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setCoinSubMode(t.id)}
                className={`flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${coinSubMode === t.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-500 hover:text-white'}`}
              >{t.label}</button>
            ))}
          </div>

          {coinSubMode === 'lln' && (
            <div className="animate-in fade-in space-y-8">
              <div className="flex justify-between items-end">
                <div className="text-left">
                  <h5 className={`text-xs font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Law of Large Numbers</h5>
                  <p className="text-[10px] text-slate-500 mt-1">Watch as empirical probability approaches theory.</p>
                </div>
                <button
                  onClick={() => {
                    setCoinStats({ heads: 0, tails: 0, total: 0 });
                    setCoinFlipState({ flipping: false, lastSide: 'heads' });
                  }}
                  className={`text-[10px] font-bold px-3 py-1 rounded-lg border transition-all ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                >Reset</button>
              </div>

              <div className="flex flex-col md:flex-row items-center justify-around gap-8">
                <div className="relative w-32 h-32 [perspective:1000px]">
                  <div
                    className={`w-full h-full relative transition-all duration-1000 [transform-style:preserve-3d]`}
                    style={{ transform: `rotateY(${coinFlipState.angle || 0}deg)`, transitionTimingFunction: 'cubic-bezier(0.15, 0, 0.15, 1)' }}
                    onTransitionEnd={() => setCoinFlipState(prev => ({ ...prev, flipping: false }))}
                  >
                    <div className={`absolute inset-0 rounded-full border-4 border-amber-600 bg-amber-500 flex items-center justify-center text-amber-100 font-black text-4xl shadow-xl [backface-visibility:hidden]`}>H</div>
                    <div className={`absolute inset-0 rounded-full border-4 border-slate-400 bg-slate-600 flex items-center justify-center text-slate-100 font-black text-4xl shadow-xl [backface-visibility:hidden] [transform:rotateY(180deg)]`}>T</div>
                  </div>
                </div>

                <div className="relative w-32 h-32">
                  <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                    <circle cx="50" cy="50" r="40" fill="transparent" stroke={darkMode ? "#334155" : "#e2e8f0"} strokeWidth="20" />
                    {coinStats.total > 0 && (
                      <>
                        <circle cx="50" cy="50" r="40" fill="transparent" stroke="#f59e0b" strokeWidth="20" strokeDasharray={`${(coinStats.heads / coinStats.total) * 251.2} 251.2`} />
                        <circle cx="50" cy="50" r="40" fill="transparent" stroke="#94a3b8" strokeWidth="20" strokeDasharray={`${(coinStats.tails / coinStats.total) * 251.2} 251.2`} strokeDashoffset={`-${(coinStats.heads / coinStats.total) * 251.2}`} />
                      </>
                    )}
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className={`text-[10px] font-black ${darkMode ? 'text-slate-300' : 'text-slate-900'}`}>{coinStats.total > 0 ? `${((coinStats.heads / coinStats.total) * 100).toFixed(0)}%` : '0%'}</span>
                    <span className="text-[8px] font-bold text-slate-500 uppercase">Heads</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className={`p-4 rounded-3xl border text-center ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-100 shadow-sm'}`}>
                  <div className="text-2xl font-black text-indigo-500">{coinStats.heads}</div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Heads</div>
                </div>
                <div className={`p-4 rounded-3xl border text-center ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-100 shadow-sm'}`}>
                  <div className="text-2xl font-black text-slate-400">{coinStats.tails}</div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Tails</div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <button onClick={() => flipBatch(10)} className={`py-2 rounded-xl text-[10px] font-black transition-all border ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>+10 FLIPS</button>
                <button onClick={() => flipBatch(100)} className={`py-2 rounded-xl text-[10px] font-black transition-all border ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>+100 FLIPS</button>
                <button onClick={() => flipBatch(1000)} className={`py-2 rounded-xl text-[10px] font-black transition-all border ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>+1000 FLIPS</button>
              </div>

              <button
                onClick={() => {
                  if (coinFlipState.flipping) return;
                  const isHeads = Math.random() > 0.5;
                  const currentAngle = coinFlipState.angle || 0;
                  const currentSide = (Math.round(currentAngle / 180) % 2 === 0) ? 'heads' : 'tails';
                  let rotationToAdd = 1440;
                  if (isHeads && currentSide === 'tails') rotationToAdd += 180;
                  if (!isHeads && currentSide === 'heads') rotationToAdd += 180;
                  setCoinFlipState({ flipping: true, angle: currentAngle + rotationToAdd, lastSide: isHeads ? 'heads' : 'tails' });
                  setCoinStats(prev => ({ heads: prev.heads + (isHeads ? 1 : 0), tails: prev.tails + (isHeads ? 0 : 1), total: prev.total + 1 }));
                }}
                className={`w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest transition-all shadow-lg active:scale-95 ${coinFlipState.flipping ? 'opacity-50 cursor-not-allowed' : 'hover:bg-indigo-500'}`}
              >SINGLE FLIP</button>
            </div>
          )}

          {coinSubMode === 'binom' && (
            <div className="animate-in fade-in space-y-6">
              <div className="flex justify-between items-start">
                <div className="text-left">
                  <h5 className={`text-xs font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Binomial Distribution</h5>
                  <p className="text-[10px] text-slate-500 mt-1">Probability of <i>k</i> successes in <i>n</i> trials.</p>
                </div>
                <button
                  onClick={() => setBinomHistory([])}
                  className={`text-[9px] font-black text-indigo-400 hover:underline uppercase`}
                >Reset History</button>
              </div>

              <div className="grid grid-cols-2 gap-6 bg-slate-900/20 p-4 rounded-2xl border border-white/5">
                <div className="space-y-4">
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-black uppercase text-slate-500">
                      <span>n (Flips): {binomN}</span>
                    </div>
                    <input type="range" min="1" max="20" step="1" value={binomN} onChange={(e) => { setBinomN(parseInt(e.target.value)); setBinomHistory([]); }} className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-black uppercase text-slate-500">
                      <span>p (Bias): {(binomP * 100).toFixed(0)}%</span>
                    </div>
                    <input type="range" min="0" max="1" step="0.01" value={binomP} onChange={(e) => { setBinomP(parseFloat(e.target.value)); setBinomHistory([]); }} className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500" />
                  </div>
                </div>
                <div className="space-y-2 border-l border-white/5 pl-6">
                  <div className="text-[9px] font-black uppercase text-slate-500">Theoretical Center</div>
                  <div className="text-lg font-black text-white">μ = {(binomN * binomP).toFixed(2)}</div>
                  <div className="text-[9px] font-black uppercase text-slate-500">Std Deviation</div>
                  <div className="text-lg font-black text-indigo-400">σ = {Math.sqrt(binomN * binomP * (1 - binomP)).toFixed(2)}</div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center text-[10px] font-black uppercase text-slate-500">
                  <span>P(k Successes) — <span className="text-indigo-400">Theory</span> vs <span className="text-emerald-400">Sim</span></span>
                  <span>Trials: {binomHistory.length}</span>
                </div>
                <div className={`flex items-end gap-1 h-32 ${darkMode ? 'bg-slate-900/40' : 'bg-slate-50/50'} rounded-xl p-4 border border-dashed border-slate-700/20 relative`}>
                  {Array.from({ length: binomN + 1 }).map((_, k) => {
                    const theoreticalProb = nCr(binomN, k) * Math.pow(binomP, k) * Math.pow(1 - binomP, binomN - k);
                    const empiricalCount = binomHistory.filter(v => v === k).length;
                    const empiricalProb = binomHistory.length > 0 ? empiricalCount / binomHistory.length : 0;
                    return (
                      <div key={k} className="flex-1 flex flex-col items-center gap-1 group h-full justify-end relative">
                        {/* Theoretical Bar */}
                        <div className="absolute inset-x-0 bg-indigo-500/20 rounded-t-sm" style={{ height: `${theoreticalProb * 100}%`, bottom: '15px', zIndex: 1 }} />
                        {/* Empirical Bar */}
                        <div className="w-full bg-emerald-500/80 rounded-t-sm transition-all duration-300" style={{ height: `${empiricalProb * 100}%`, marginBottom: '0px', zIndex: 2 }} />
                        <span className="text-[8px] font-black text-slate-600 mt-1">{k}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button onClick={() => runBinomTrial(1)} className="py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg active:scale-95 transition-all">Run 1 Trial</button>
                <button onClick={() => runBinomTrial(1000)} className="py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg active:scale-95 transition-all">Run 1000 Trials</button>
              </div>
            </div>
          )}

          {coinSubMode === 'ev' && (
            <div className="animate-in fade-in space-y-8">
              <div className="text-left">
                <h5 className={`text-xs font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Expected Value Game</h5>
                <p className="text-[10px] text-slate-500 mt-1">Statistical average of outcomes weighed by probability.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className={`p-6 rounded-3xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'} space-y-4`}>
                  <div className="flex justify-between items-center">
                    <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-[10px] font-black text-white">H</div>
                    <input type="number" value={evPayoutH} onChange={(e) => setEvPayoutH(parseFloat(e.target.value) || 0)} className="w-16 bg-transparent border-b border-indigo-500/30 text-right font-black text-white outline-none" />
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-black text-slate-500 uppercase">
                    <span>Payout</span>
                    <span className="text-emerald-400">P={(binomP * 100).toFixed(0)}%</span>
                  </div>
                </div>
                <div className={`p-6 rounded-3xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'} space-y-4`}>
                  <div className="flex justify-between items-center">
                    <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center text-[10px] font-black text-white">T</div>
                    <input type="number" value={evPayoutT} onChange={(e) => setEvPayoutT(parseFloat(e.target.value) || 0)} className="w-16 bg-transparent border-b border-rose-500/30 text-right font-black text-white outline-none" />
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-black text-slate-500 uppercase">
                    <span>Payout</span>
                    <span className="text-emerald-400">P={((1 - binomP) * 100).toFixed(0)}%</span>
                  </div>
                </div>
              </div>

              <div className="p-6 rounded-3xl bg-indigo-600/10 border border-indigo-500/20 text-center space-y-2">
                <div className="text-[10px] font-black uppercase text-slate-500">Theoretical Expected Value (EV)</div>
                <div className="text-4xl font-black text-white">{(binomP * evPayoutH + (1 - binomP) * evPayoutT).toFixed(2)}</div>
                <div className="text-[9px] font-bold text-indigo-400 uppercase">EV = Σ [ P(x) * Value(x) ]</div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center text-[10px] font-black uppercase text-slate-500">
                  <span>Session Results</span>
                  <button onClick={() => setEvHistory([])} className="text-indigo-400 hover:underline">Clear</button>
                </div>
                <div className={`p-4 rounded-2xl border border-dashed ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Running Average:</span>
                    <span className="text-lg font-black text-white">
                      {evHistory.length > 0 ? (evHistory.reduce((a, b) => a + b, 0) / evHistory.length).toFixed(4) : "0.0000"}
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                    <div className="bg-indigo-500 h-full transition-all duration-300" style={{ width: `${Math.min(100, (evHistory.length / 1000) * 100)}%` }} />
                  </div>
                  <div className="mt-2 text-[8px] font-black text-slate-600 uppercase">Confidence increasing... ({evHistory.length} trials)</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button onClick={() => runEVTrial(10)} className="py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-black text-xs uppercase shadow-lg active:scale-95 transition-all">+10 TRIALS</button>
                <button onClick={() => runEVTrial(1000)} className="py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-xs uppercase shadow-lg active:scale-95 transition-all">+1000 TRIALS</button>
              </div>
            </div>
          )}
        </div>
      )}


      {mode === 'paradoxes' && (
        <div className="animate-in fade-in duration-500 space-y-8">
          <div className="flex justify-center p-1 bg-slate-900/50 rounded-xl border border-white/5 max-w-sm mx-auto">
            {[
              { id: 'monty', label: 'Monty' },
              { id: 'birthday', label: 'Birthday' },
              { id: 'gambler', label: 'Gambler' },
              { id: 'simpson', label: 'Simpson' }
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setParadoxType(t.id)}
                className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${paradoxType === t.id ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-white'}`}
              >{t.label}</button>
            ))}
          </div>

          {paradoxType === 'monty' && (
            <div className="animate-in fade-in space-y-8">
              <div className="text-center space-y-4">
                <h5 className="text-xl font-black text-white uppercase tracking-tight">Monty Hall Problem</h5>
                <div className="flex flex-col items-center gap-2">
                  <span className="text-[10px] font-black text-slate-500 uppercase">Number of Doors (3 - 100)</span>
                  <div className="flex gap-2 items-center">
                    <input
                      type="number" min="3" max="100"
                      value={doorInput}
                      onChange={(e) => setDoorInput(e.target.value)}
                      className="w-20 bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-sm font-black text-white text-center outline-none focus:border-indigo-500 transition-all"
                    />
                    <button onClick={() => resetMonty(parseInt(doorInput) || 3)} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black uppercase rounded-xl transition-all shadow-lg">Set & Reset</button>
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
                    <div className="text-slate-500">P(Stay Win): <span className="text-white">{(1 / montyState.doorCount * 100).toFixed(1)}%</span></div>
                    <div className="text-indigo-400">P(Switch Win): <span className="text-white">{((montyState.doorCount - 1) / montyState.doorCount * 100).toFixed(1)}%</span></div>
                  </div>
                </div>
                <p className="text-[11px] leading-relaxed text-slate-400 italic">
                  You pick a door. Monty (who knows where the car is) opens {montyState.doorCount - 2} goat {montyState.doorCount - 2 === 1 ? 'door' : 'doors'}. Should you switch to the last remaining door?
                  <br /><b>Yes!</b> Your first pick only had a 1 in {montyState.doorCount} chance. Switching captures the sum of all other doors' probabilities!
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
                    let stayW = 0, switchW = 0;
                    for (let i = 0; i < 10000; i++) {
                      const car = Math.floor(Math.random() * montyState.doorCount);
                      const pick = Math.floor(Math.random() * montyState.doorCount);
                      if (pick === car) stayW++; else switchW++;
                    }
                    setMontyState(p => ({
                      ...p, history: {
                        ...p.history,
                        stayWins: p.history.stayWins + stayW, stayTotal: p.history.stayTotal + 10000,
                        switchWins: p.history.switchWins + switchW, switchTotal: p.history.switchTotal + 10000
                      }
                    }));
                  }}
                  className="p-4 rounded-3xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-widest shadow-lg transition-all flex flex-col items-center justify-center gap-1"
                >
                  <span>Run 10k Sim</span>
                </button>
              </div>

              <div className={`grid gap-2 justify-center max-h-[300px] overflow-y-auto pr-2 custom-scrollbar ${montyState.doorCount > 10 ? 'grid-cols-8' : (montyState.doorCount > 5 ? 'grid-cols-5' : 'grid-cols-3')}`}>
                {montyState.doors.map((d, i) => {
                  const isRevealed = montyState.revealed.includes(i);
                  const isSelected = montyState.selected === i;
                  const isCar = d === 'car';
                  return (
                    <div key={i} onClick={() => montyState.gameState === 'start' && handleMontyPick(i)} className={`aspect-[2/3] w-full rounded-xl border-2 flex flex-col items-center justify-center text-lg cursor-pointer transition-all active:scale-95 ${isSelected ? 'border-indigo-500 bg-indigo-500/20 shadow-indigo-500/20 shadow-lg z-10' : (isRevealed ? (isCar ? 'border-emerald-500 bg-emerald-500/20' : 'border-slate-800 bg-slate-800/10 opacity-40 shadow-none grayscale') : (darkMode ? 'border-slate-700 bg-slate-900/40 hover:border-slate-500 shadow-md' : 'border-slate-200 bg-white hover:border-slate-400 shadow-sm'))}`}>
                      <span className="animate-in fade-in zoom-in-50">{isRevealed ? (isCar ? '🏎️' : '🐐') : '🚪'}</span>
                      <span className="text-[7px] font-black text-slate-500 mt-1 uppercase">#{i + 1}</span>
                    </div>
                  );
                })}
              </div>

              {montyState.gameState === 'result' && (
                <div className={`p-6 rounded-3xl text-center animate-in zoom-in-95 shadow-2xl ${montyState.win ? 'bg-emerald-600/20 border-2 border-emerald-500/40' : 'bg-rose-600/20 border-2 border-rose-500/40'}`}>
                  <div className="text-3xl mb-2">{montyState.win ? '🎉' : '🐐'}</div>
                  <h6 className={`text-xl font-black uppercase tracking-tight ${montyState.win ? 'text-emerald-400' : 'text-rose-400'}`}>{montyState.win ? 'YOU WON THE CAR!' : 'YOU GOT A GOAT...'}</h6>
                  <button onClick={() => resetMonty(montyState.doorCount)} className="mt-4 px-8 py-2 bg-indigo-600 text-white rounded-full font-black text-[10px] uppercase shadow-lg hover:bg-indigo-500 transition-all">Play Again</button>
                </div>
              )}

              {montyState.gameState === 'picked' && (
                <div className="p-6 rounded-3xl bg-indigo-600 border-2 border-indigo-400 text-center animate-in zoom-in-95 shadow-2xl">
                  <p className="text-sm font-black text-white mb-4 uppercase">Monty revealed {montyState.revealed.length} goats! Stay or Switch?</p>
                  <div className="flex gap-4">
                    <button onClick={() => handleMontyFinal(true)} className="flex-1 py-3 bg-slate-900 text-white rounded-xl font-bold text-xs uppercase hover:bg-black transition-all">STAY (Gut)</button>
                    <button onClick={() => handleMontyFinal(false)} className="flex-1 py-3 bg-white text-indigo-700 rounded-xl font-bold text-xs uppercase hover:bg-slate-100 transition-all shadow-xl">SWITCH (Math)</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {paradoxType === 'birthday' && (
            <div className="animate-in fade-in space-y-8">
              <div className="relative w-64 h-64 mx-auto flex items-center justify-center bg-slate-900/40 rounded-full border border-white/5 overflow-hidden">
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  {/* Connection Lines */}
                  {Array.from({ length: Math.min(birthdayPeople, 40) }).map((_, i) => {
                    const angle1 = (i / Math.min(birthdayPeople, 40)) * 2 * Math.PI;
                    const r = 40;
                    const x1 = 50 + r * Math.cos(angle1);
                    const y1 = 50 + r * Math.sin(angle1);
                    return Array.from({ length: Math.min(birthdayPeople, 40) }).slice(i + 1).map((_, j) => {
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
                  <circle cx="50" cy="50" r="45" fill="none" stroke={birthdayPeople >= 23 ? "#10b981" : "#4f46e5"} strokeWidth="4" strokeDasharray={`${(() => { let p = 1; for (let i = 0; i < birthdayPeople; i++) p *= (365 - i) / 365; return (1 - p) * 282.7; })()} 282.7`} strokeLinecap="round" className="transition-all duration-1000" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/20">
                  <span className="text-4xl font-black text-white">{(() => { let p = 1; for (let i = 0; i < birthdayPeople; i++) p *= (365 - i) / 365; return ((1 - p) * 100).toFixed(1); })()}%</span>
                  <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest mt-1">Match Potential</span>
                </div>
              </div>
              <div className="space-y-4">
                <input type="range" min="1" max="100" value={birthdayPeople} onChange={(e) => setBirthdayPeople(parseInt(e.target.value))} className="w-full accent-indigo-500 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer" />
                <div className="flex justify-between text-[10px] font-black text-slate-500"><span>Group Size: {birthdayPeople}</span><span>Target: 23 (50%)</span></div>
              </div>
              <div className={`p-6 rounded-3xl ${darkMode ? 'bg-slate-950 border-slate-800 border' : 'bg-white border-slate-200 border'} text-center space-y-4`}>
                <button onClick={() => {
                  let matchCount = 0;
                  for (let t = 0; t < 1000; t++) {
                    const bdays = new Set();
                    let matched = false;
                    for (let i = 0; i < birthdayPeople; i++) {
                      const b = Math.floor(Math.random() * 365);
                      if (bdays.has(b)) { matched = true; break; }
                      bdays.add(b);
                    }
                    if (matched) matchCount++;
                  }
                  setBirthdaySim(p => ({ trials: p.trials + 1000, matches: p.matches + matchCount }));
                }} className="py-2 px-6 bg-slate-800 rounded-full text-[10px] font-black text-indigo-400 uppercase hover:bg-slate-700 transition-all">Simulate 1,000 Groups</button>
                <div className="text-xs font-bold text-slate-400">Empirical Rate: {birthdaySim.trials > 0 ? ((birthdaySim.matches / birthdaySim.trials) * 100).toFixed(2) : "0.00"}% ({birthdaySim.trials} trials)</div>
              </div>
            </div>
          )}

          {paradoxType === 'gambler' && (
            <div className="animate-in fade-in space-y-8">
              <div className="text-center space-y-2">
                <h5 className="text-xl font-black text-white uppercase tracking-tight">Gambler's Fallacy</h5>
                <p className="text-[11px] text-slate-500 italic">"It's due for a win!" — The most expensive lie in statistics.</p>
              </div>

              <div className={`p-6 rounded-3xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'} space-y-6`}>
                <div className="flex flex-wrap justify-center gap-2 min-h-[40px]">
                  {gamblerStreak.slice(-20).map((s, i) => (
                    <div key={i} className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm text-white shadow-lg animate-in zoom-in-50 ${s === 'H' ? 'bg-indigo-600' : 'bg-slate-700'}`}>{s}</div>
                  ))}
                  {gamblerStreak.length === 0 && <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest self-center">Flip to start a streak</span>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => {
                      const res = Math.random() > 0.5 ? 'H' : 'T';
                      setGamblerStreak(p => [...p, res]);
                    }}
                    className="py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black uppercase tracking-widest shadow-lg transition-all"
                  >FLIP COIN</button>
                  <button
                    onClick={() => {
                      const batch = Array.from({ length: 100 }, () => Math.random() > 0.5 ? 'H' : 'T');
                      setGamblerStreak(p => [...p, ...batch]);
                    }}
                    className="py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-black uppercase tracking-widest shadow-lg transition-all"
                  >+100 FLIPS</button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className={`p-5 rounded-3xl border border-dashed ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'} space-y-4`}>
                  <div className="flex justify-between items-start">
                    <h6 className="text-[10px] font-black text-indigo-400 uppercase">Streak Checker</h6>
                    <div className="flex flex-col items-end gap-1">
                      <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                        <span className="text-[8px] font-black text-slate-500 uppercase">Max H: {(() => {
                          let max = 0, curr = 0;
                          gamblerStreak.forEach(s => { if (s === 'H') { curr++; max = Math.max(max, curr); } else curr = 0; });
                          return max;
                        })()}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-600" />
                        <span className="text-[8px] font-black text-slate-500 uppercase">Max T: {(() => {
                          let max = 0, curr = 0;
                          gamblerStreak.forEach(s => { if (s === 'T') { curr++; max = Math.max(max, curr); } else curr = 0; });
                          return max;
                        })()}</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-[9px] text-slate-500 leading-relaxed italic border-t border-white/5 pt-3">
                    Occurrences of 3+ Heads: <b>{(() => {
                      let streaks = 0;
                      for (let i = 0; i < gamblerStreak.length - 2; i++) {
                        if (gamblerStreak[i] === 'H' && gamblerStreak[i + 1] === 'H' && gamblerStreak[i + 2] === 'H') streaks++;
                      }
                      return streaks;
                    })()}</b>
                  </p>
                  <div className="pt-2 border-t border-white/10">
                    <div className="flex justify-between items-center text-[11px] font-black text-white">
                      <span>Next Outcome:</span>
                      <span className="text-indigo-400">ALWAYS 50%</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col justify-center items-center p-4 bg-indigo-600/10 rounded-3xl border border-indigo-500/20">
                  <span className="text-[10px] font-black text-white uppercase tracking-tighter">Memoryless</span>
                  <p className="text-[8px] text-slate-500 mt-2 text-center leading-relaxed">The coin doesn't carry a tally. Each flip is a fresh start in the eyes of physics.</p>
                </div>
              </div>
            </div>
          )}

          {paradoxType === 'simpson' && (
            <div className="animate-in fade-in space-y-8 pb-10">
              <div className="text-center space-y-2">
                <h5 className="text-xl font-black text-white uppercase tracking-tight">Simpson's Paradox</h5>
                <p className="text-[11px] text-slate-500 italic">When aggregate data reverses the trend seen in groups.</p>
              </div>

              {/* Step 1: Rates */}
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-indigo-600/20 flex items-center justify-center text-[10px] font-black text-indigo-400">1</span>
                    <h6 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Step 1: Compare Success Rates (Fixed)</h6>
                  </div>
                  <p className="text-[9px] text-slate-500 italic max-w-[250px] text-right leading-tight">Notice Treatment A is consistently better than B in both separate groups.</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: 'Easy Case', a: simpsonRates.aEasy, b: simpsonRates.bEasy },
                    { label: 'Hard Case', a: simpsonRates.aHard, b: simpsonRates.bHard }
                  ].map(row => (
                    <div key={row.label} className={`p-4 rounded-3xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'} space-y-3`}>
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black text-slate-500 uppercase">{row.label}</span>
                        <span className="text-[8px] font-black px-2 py-0.5 rounded-full bg-indigo-600 text-white uppercase">A is Better</span>
                      </div>
                      <div className="space-y-2">
                        <div className="space-y-1">
                          <div className="flex justify-between text-[8px] font-bold text-slate-400 uppercase"><span>Tr. A</span><span>{(row.a * 100).toFixed(0)}%</span></div>
                          <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-500" style={{ width: `${row.a * 100}%` }} />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-[8px] font-bold text-slate-400 uppercase"><span>Tr. B</span><span>{(row.b * 100).toFixed(0)}%</span></div>
                          <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-slate-600" style={{ width: `${row.b * 100}%` }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Step 2: Weights/Sliders */}
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-indigo-600/20 flex items-center justify-center text-[10px] font-black text-indigo-400">2</span>
                    <h6 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Step 2: Show the Case Mix (Interactive)</h6>
                  </div>
                  <p className="text-[9px] text-slate-500 italic max-w-[250px] text-right leading-tight">Adjust how many participants are in each case. Unbalanced groups cause the paradox.</p>
                </div>
                <div className={`p-6 rounded-3xl border ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50'} space-y-6`}>
                  {[
                    { id: 'a', label: 'Treatment A', easy: simpsonCounts.aEasy, hard: simpsonCounts.aHard, color: 'indigo' },
                    { id: 'b', label: 'Treatment B', easy: simpsonCounts.bEasy, hard: simpsonCounts.bHard, color: 'slate' }
                  ].map(tr => (
                    <div key={tr.id} className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black text-slate-500 uppercase">{tr.label} Distribution</span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase">Total N: {tr.easy + tr.hard}</span>
                      </div>
                      <div className="h-4 w-full bg-slate-800 rounded-full flex overflow-hidden shadow-inner">
                        <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${(tr.easy / (tr.easy + tr.hard)) * 100}%` }} />
                        <div className="h-full bg-rose-500 transition-all duration-500" style={{ width: `${(tr.hard / (tr.easy + tr.hard)) * 100}%` }} />
                      </div>
                      <div className="flex justify-between text-[8px] font-black uppercase tracking-tighter">
                        <span className="text-emerald-500">Easy ({tr.easy})</span>
                        <span className="text-rose-500">Hard ({tr.hard})</span>
                      </div>
                      <input
                        type="range" min="10" max="1000" step="10"
                        value={tr.hard}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          setSimpsonCounts(p => ({ ...p, [`${tr.id}Hard`]: val }));
                        }}
                        className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                      />
                    </div>
                  ))}
                  <div className="flex gap-4 pt-2">
                    <button onClick={() => setSimpsonCounts({ aEasy: 500, aHard: 500, bEasy: 500, bHard: 500 })} className="flex-1 py-2 rounded-xl bg-slate-800 text-[9px] font-black text-slate-400 hover:text-white uppercase transition-all">Balance Mix</button>
                    <button onClick={() => setSimpsonCounts({ aEasy: 100, aHard: 900, bEasy: 100, bHard: 100 })} className="flex-1 py-2 rounded-xl bg-indigo-600/20 text-[9px] font-black text-indigo-400 hover:bg-indigo-600 hover:text-white uppercase transition-all">Reset Paradox</button>
                  </div>
                </div>
              </div>

              {/* Step 3: Overall */}
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-indigo-600/20 flex items-center justify-center text-[10px] font-black text-indigo-400">3</span>
                    <h6 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Step 3: Show the Overall Outcome</h6>
                  </div>
                  <p className="text-[9px] text-slate-500 italic max-w-[250px] text-right leading-tight">The weighted average flips the winner when weights are heavily skewed.</p>
                </div>
                {(() => {
                  const overallA = (simpsonCounts.aEasy * simpsonRates.aEasy + simpsonCounts.aHard * simpsonRates.aHard) / (simpsonCounts.aEasy + simpsonCounts.aHard);
                  const overallB = (simpsonCounts.bEasy * simpsonRates.bEasy + simpsonCounts.bHard * simpsonRates.bHard) / (simpsonCounts.bEasy + simpsonCounts.bHard);
                  const isReversed = overallB > overallA;

                  return (
                    <div className="space-y-6">
                      <div className={`p-6 rounded-3xl border-2 transition-all ${isReversed ? 'bg-rose-500/10 border-rose-500/30 ring-4 ring-rose-500/5' : 'bg-emerald-500/10 border-emerald-500/30'}`}>
                        <div className="flex justify-between items-center mb-6">
                          <div className="text-left">
                            <h6 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Aggregate Success Rate</h6>
                            <p className="text-[9px] text-slate-500 italic mt-1">Weighted average of group rates.</p>
                          </div>
                          {isReversed && (
                            <div className="px-3 py-1 rounded-full bg-rose-500 text-white text-[8px] font-black uppercase animate-bounce">Paradox Active</div>
                          )}
                        </div>
                        <div className="space-y-6">
                          <div className="space-y-2">
                            <div className="flex justify-between items-end">
                              <span className="text-[10px] font-black text-indigo-400 uppercase">Treatment A</span>
                              <span className="text-2xl font-black text-white">{(overallA * 100).toFixed(1)}%</span>
                            </div>
                            <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden">
                              <div className="h-full bg-indigo-500 transition-all duration-700" style={{ width: `${overallA * 100}%` }} />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between items-end">
                              <span className="text-[10px] font-black text-slate-400 uppercase">Treatment B</span>
                              <span className="text-2xl font-black text-white">{(overallB * 100).toFixed(1)}%</span>
                            </div>
                            <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden">
                              <div className="h-full bg-slate-600 transition-all duration-700" style={{ width: `${overallB * 100}%` }} />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className={`p-5 rounded-2xl border border-dashed border-white/10 ${darkMode ? 'bg-slate-900 shadow-xl' : 'bg-slate-50'} space-y-4`}>
                        <h6 className="text-[10px] font-black text-indigo-400 uppercase">The "Aha" Insight</h6>
                        <ul className="space-y-3">
                          <li className="flex gap-3 text-[10px] leading-relaxed text-slate-400">
                            <span className="text-indigo-500 font-black">•</span>
                            <span><b className="text-white">A is better</b> in both cases, but B looks better overall when it's mostly tested on the <b className="text-emerald-400 uppercase">Easy Case</b>.</span>
                          </li>
                          <li className="flex gap-3 text-[10px] leading-relaxed text-slate-400">
                            <span className="text-indigo-500 font-black">•</span>
                            <span>When groups are unbalanced, the aggregate average gets "pulled" toward the weight of the larger group.</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}
        </div>
      )}

      {mode === 'dice' && (
        <div className="animate-in fade-in duration-500 space-y-6">
          <div className="flex justify-center p-1 bg-slate-900/50 rounded-xl border border-white/5 max-w-sm mx-auto mb-4">
            {[
              { id: 'single', label: 'Single' },
              { id: 'sum', label: 'Sums' },
              { id: 'clt', label: 'CLT' },
              { id: 'ev', label: 'EV Game' }
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setDiceSubMode(t.id)}
                className={`flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${diceSubMode === t.id ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
              >{t.label}</button>
            ))}
          </div>

          {diceSubMode === 'single' && (
            <div className="animate-in fade-in space-y-6">
              <div className="flex justify-between items-end">
                <div className="text-left">
                  <h5 className={`text-xs font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Single Die Distribution</h5>
                  <button onClick={() => setDiceHistory([])} className="text-[9px] text-indigo-400 hover:underline font-bold">Clear History</button>
                </div>
                <div className="flex gap-2">
                  {[4, 6, 8, 12, 20].map(n => (
                    <button key={n} onClick={() => setDiceType(n)} className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all ${diceType === n ? 'bg-indigo-600 text-white' : (darkMode ? 'bg-slate-800 text-slate-400' : 'bg-white border text-slate-500')}`}>d{n}</button>
                  ))}
                </div>
              </div>
              <div className="flex flex-col items-center gap-6">
                <div className={`w-20 h-20 rounded-2xl border-4 flex items-center justify-center text-3xl font-black shadow-xl animate-in zoom-in-50 duration-300 ${darkMode ? 'bg-slate-900 border-indigo-500 text-white' : 'bg-white border-indigo-500 text-slate-900'}`}>{diceResult}</div>
                <div className="grid grid-cols-2 gap-3 w-full">
                  <button onClick={() => { const rolls = Array.from({ length: 10 }, () => Math.floor(Math.random() * diceType) + 1); setDiceResult(rolls[9]); setDiceHistory(prev => [...prev, ...rolls]); }} className="py-2 rounded-xl text-[10px] font-black border border-slate-700">+10 ROLLS</button>
                  <button onClick={() => { const rolls = Array.from({ length: 100 }, () => Math.floor(Math.random() * diceType) + 1); setDiceResult(rolls[99]); setDiceHistory(prev => [...prev, ...rolls]); }} className="py-2 rounded-xl text-[10px] font-black border border-slate-700">+100 ROLLS</button>
                </div>
                <button onClick={() => { const roll = Math.floor(Math.random() * diceType) + 1; setDiceResult(roll); setDiceHistory(prev => [...prev, roll]); }} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase shadow-lg">ROLL SINGLE DIE</button>
              </div>
              <div className="space-y-4 pt-4">
                <div className="flex justify-between items-center text-[10px] font-black uppercase text-slate-500"><span>Distribution (Total: {diceHistory.length})</span></div>
                <div className={`flex items-end gap-1 h-32 ${darkMode ? 'bg-slate-900/40' : 'bg-slate-50/50'} rounded-xl p-2 border border-dashed border-slate-700/20`}>
                  {Array.from({ length: diceType }, (_, i) => i + 1).map(val => {
                    const count = diceHistory.filter(h => h === val).length;
                    const maxCount = Math.max(...Array.from({ length: diceType }, (_, i) => diceHistory.filter(h => i + 1 === h).length), 1);
                    return (
                      <div key={val} className="flex-1 flex flex-col items-center gap-1 group h-full justify-end">
                        <div className={`w-full rounded-t-sm transition-all duration-700 ${diceResult === val ? 'bg-indigo-500' : 'bg-slate-500/30'}`} style={{ height: `${(count / maxCount) * 100}%` }} />
                        <span className={`text-[8px] font-black ${diceResult === val ? 'text-indigo-400' : 'text-slate-600'}`}>{val}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {diceSubMode === 'sum' && (
            <div className="animate-in fade-in space-y-6">
              <div className="flex justify-between items-start">
                <div className="text-left">
                  <h5 className={`text-xs font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Sum of {diceCountVal} Dice</h5>
                </div>
                <button onClick={() => setDiceSumHistory([])} className="text-[9px] font-black text-indigo-400 uppercase">Reset</button>
              </div>

              <div className="space-y-4 bg-slate-900/20 p-4 rounded-2xl border border-white/5">
                <div className="flex justify-between text-[10px] font-black uppercase text-slate-500"><span>Dice Count: {diceCountVal}</span><span>Range: {diceCountVal} - {6 * diceCountVal}</span></div>
                <input type="range" min="2" max="10" step="1" value={diceCountVal} onChange={(e) => { setDiceCountVal(parseInt(e.target.value)); setDiceSumHistory([]); }} className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500" />
                <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-4">
                  <div className="text-center"><div className="text-[9px] uppercase text-slate-500 font-black">Mean</div><div className="text-lg font-black text-white">{(diceCountVal * 3.5).toFixed(1)}</div></div>
                  <div className="text-center"><div className="text-[9px] uppercase text-slate-500 font-black">SD</div><div className="text-lg font-black text-indigo-400">{(Math.sqrt(diceCountVal * 2.917)).toFixed(2)}</div></div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center text-[10px] font-black uppercase text-slate-500"><span>Distribution Graph</span></div>
                <div className={`flex items-end gap-0.5 h-48 ${darkMode ? 'bg-slate-900/40' : 'bg-slate-50/50'} rounded-2xl p-6 border border-slate-700/20 relative`}>
                  {getDiceSumDistribution(diceCountVal).map((d, i) => {
                    const empiricalCount = diceSumHistory.filter(v => v === d.sum).length;
                    const empiricalProb = diceSumHistory.length > 0 ? empiricalCount / diceSumHistory.length : 0;
                    const maxProb = Math.max(...getDiceSumDistribution(diceCountVal).map(x => x.prob));
                    return (
                      <div key={d.sum} className="flex-1 flex flex-col items-center gap-1 justify-end relative group h-full">
                        <div className="absolute inset-x-0 bg-indigo-500/20 rounded-t-sm" style={{ height: `${(d.prob / maxProb) * 100}%`, bottom: '0px' }} />
                        <div className="w-full bg-emerald-500/80 rounded-t-sm" style={{ height: `${(empiricalProb / maxProb) * 100}%` }} />
                        {diceCountVal < 5 && <span className="absolute -bottom-5 text-[8px] font-black text-slate-500">{d.sum}</span>}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button onClick={() => runDiceSumTrial(1)} className="py-4 bg-slate-800 text-white rounded-2xl font-black text-xs uppercase shadow-lg active:scale-95 transition-all">Trial</button>
                <button onClick={() => runDiceSumTrial(1000)} className="py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase shadow-lg active:scale-95 transition-all">1,000 Trials</button>
              </div>
            </div>
          )}

          {diceSubMode === 'clt' && (
            <div className="animate-in fade-in space-y-6">
              <div className="flex justify-between items-start">
                <div className="text-left">
                  <h5 className={`text-xs font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Central Limit Theorem</h5>
                </div>
                <button onClick={() => setCltHistory([])} className="text-[9px] font-black text-indigo-400 uppercase">Reset</button>
              </div>

              <div className="space-y-4 bg-slate-900/10 p-4 rounded-2xl border border-indigo-500/10">
                <div className="flex justify-between text-[10px] font-black uppercase text-slate-500"><span>Sample Size (k dice): {diceCountVal}</span></div>
                <input type="range" min="1" max="15" step="1" value={diceCountVal} onChange={(e) => { setDiceCountVal(parseInt(e.target.value)); setCltHistory([]); }} className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500" />
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center text-[10px] font-black uppercase text-slate-500"><span>Sampling Distribution</span></div>
                <div className={`flex items-end gap-0.5 h-40 ${darkMode ? 'bg-slate-950' : 'bg-slate-50'} rounded-2xl p-6 border border-slate-800/20 relative mb-6`}>
                  {Array.from({ length: 15 }).map((_, i) => {
                    const binStart = 1 + (i / 15) * 5;
                    const binEnd = 1 + ((i + 1) / 15) * 5;
                    const count = cltHistory.filter(v => v >= binStart && v < binEnd).length;
                    const counts = Array.from({ length: 15 }).map((_, j) => cltHistory.filter(v => v >= (1 + (j / 15) * 5) && v < (1 + ((j + 1) / 15) * 5)).length);
                    const maxCount = Math.max(...counts, 1);
                    return (
                      <div key={i} className="flex-1 bg-indigo-600/80 rounded-t-sm relative h-full flex flex-col justify-end">
                        <div className="w-full bg-indigo-500 rounded-t-sm" style={{ height: `${(count / maxCount) * 100}%` }} />
                        <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[8px] font-black text-slate-500">{binStart.toFixed(1)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button onClick={() => runCLTTrial(10)} className="py-4 bg-slate-800 text-white rounded-2xl font-black text-xs uppercase shadow-lg active:scale-95 transition-all">Trial</button>
                <button onClick={() => runCLTTrial(1000)} className="py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase shadow-lg active:scale-95 transition-all">1,000 Trials</button>
              </div>
            </div>
          )}

          {diceSubMode === 'ev' && (
            <div className="animate-in fade-in space-y-8">
              <div className="text-left">
                <h5 className={`text-xs font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Dice EV Game</h5>
                <p className="text-[10px] text-slate-500 mt-1">Set payouts for each face and track the average.</p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[1, 2, 3, 4, 5, 6].map(face => (
                  <div key={face} className={`p-3 rounded-2xl border ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-100 shadow-sm'} space-y-2`}>
                    <div className="flex justify-between items-center">
                      <div className="w-6 h-6 rounded-lg bg-indigo-600 flex items-center justify-center text-[10px] font-black text-white">{face}</div>
                      <input
                        type="number"
                        value={diceEvPayouts[face]}
                        onChange={(e) => setDiceEvPayouts(p => ({ ...p, [face]: parseFloat(e.target.value) || 0 }))}
                        className="w-12 bg-transparent border-b border-indigo-500/20 text-right font-black text-white text-[10px] outline-none"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-6 rounded-3xl bg-indigo-600/10 border border-indigo-500/20 text-center">
                <div className="text-[10px] font-black uppercase text-slate-500 mb-1">Theoretical EV</div>
                <div className="text-3xl font-black text-white">{(Object.values(diceEvPayouts).reduce((a, b) => a + b, 0) / 6).toFixed(2)}</div>
                <div className="text-[9px] font-bold text-indigo-400 mt-1 uppercase">Running Avg: {diceEvHistory.length > 0 ? (diceEvHistory.reduce((a, b) => a + b, 0) / diceEvHistory.length).toFixed(4) : "0.0000"}</div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button onClick={() => runDiceEVTrial(10)} className="py-4 bg-slate-800 text-white rounded-2xl font-black text-xs uppercase shadow-lg active:scale-95 transition-all">+10 Rolls</button>
                <button onClick={() => runDiceEVTrial(1000)} className="py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase shadow-lg active:scale-95 transition-all">+1000 Rolls</button>
              </div>
            </div>
          )}
        </div>
      )}

      {mode === 'spinner' && (() => {
        const totalWeight = spinnerSegments.reduce((sum, seg) => sum + (seg.weight || 1), 0);
        let currentWeight = 0;
        const segmentsWithAngles = spinnerSegments.map(seg => {
          const start = (currentWeight / totalWeight) * 360;
          const size = ((seg.weight || 1) / totalWeight) * 360;
          currentWeight += (seg.weight || 1);
          return { ...seg, start, size };
        });

        return (
          <div className="animate-in fade-in duration-500 space-y-8">
            <div className="flex justify-center p-1 bg-slate-900/50 rounded-xl border border-white/5 max-w-sm mx-auto mb-4">
              {[
                { id: 'spin', label: 'Spin' },
                { id: 'weighted', label: 'Weights' },
                { id: 'ev', label: 'EV/Sets' }
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setSpinnerSubMode(t.id)}
                  className={`flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${spinnerSubMode === t.id ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
                >{t.label}</button>
              ))}
            </div>

            <div className="flex flex-col items-center gap-8">
              <div className="relative">
                <div
                  className="w-56 h-56 rounded-full border-8 border-slate-800 relative transition-transform duration-[3000ms] ease-out shadow-2xl overflow-hidden"
                  style={{
                    transform: `rotate(${spinnerAngle}deg)`,
                    background: `conic-gradient(${segmentsWithAngles.map(s => `${s.color} ${s.start}deg ${s.start + s.size}deg`).join(', ')})`
                  }}
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    {segmentsWithAngles.map((seg, i) => (
                      <span
                        key={i}
                        className="absolute text-[8px] font-black text-white"
                        style={{
                          transform: `rotate(${seg.start + seg.size / 2}deg) translateY(-85px)`,
                          textShadow: '0 1px 2px rgba(0,0,0,0.8)'
                        }}
                      >{seg.label}</span>
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
                      const winner = segmentsWithAngles.find(s => winAngle >= s.start && winAngle < s.start + s.size);
                      if (winner) setSpinnerEVHistory(prev => [...prev, winner.points || 0]);
                    }}
                    className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black uppercase tracking-widest transition-all shadow-lg active:scale-95"
                  >SPIN THE WHEEL</button>
                  <div className="grid grid-cols-2 gap-4">
                    {spinnerSegments.slice(0, 4).map((s, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                        <span className="text-[10px] font-bold text-slate-500">{((s.weight / totalWeight) * 100).toFixed(1)}% {s.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {spinnerSubMode === 'weighted' && (
                <div className="w-full max-w-sm space-y-4 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                  <div className="flex justify-between items-center mb-4">
                    <h6 className="text-[10px] font-black uppercase text-slate-500">Edit Segment Weights</h6>
                    <button onClick={() => {
                      if (spinnerSegments.length >= 12) return;
                      const colors = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316', '#84cc16'];
                      setSpinnerSegments([...spinnerSegments, { label: 'NEW', color: colors[spinnerSegments.length % colors.length], weight: 1, points: 0 }]);
                    }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600 hover:text-white text-[10px] font-black transition-all">
                      <Plus className="w-3 h-3" /> ADD SEGMENT
                    </button>
                  </div>
                  <div className="space-y-3">
                    {spinnerSegments.map((seg, i) => (
                      <div key={i} className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'} flex flex-col gap-4 relative group`}>
                        <div className="flex items-center gap-3">
                          <div className="w-4 h-4 rounded-full shadow-inner" style={{ backgroundColor: seg.color }} />
                          <input type="text" value={seg.label} onChange={(e) => {
                            const next = [...spinnerSegments]; next[i].label = e.target.value.toUpperCase().slice(0, 12); setSpinnerSegments(next);
                          }} className="flex-1 bg-transparent text-xs font-black outline-none border-b-2 border-transparent focus:border-indigo-500 transition-all uppercase" placeholder="LABEL" />
                          <button onClick={() => {
                            if (spinnerSegments.length <= 2) return;
                            setSpinnerSegments(spinnerSegments.filter((_, idx) => idx !== i));
                          }} className="text-rose-500/40 hover:text-rose-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest pl-1">Weight</span>
                            <div className="flex items-center gap-2 bg-slate-800/50 rounded-xl px-3 py-2 border border-white/5">
                              <input type="number" step="0.1" value={seg.weight} onChange={(e) => {
                                const next = [...spinnerSegments]; next[i].weight = Math.max(0, parseFloat(e.target.value) || 0); setSpinnerSegments(next);
                              }} className="w-full bg-transparent text-sm font-black text-white outline-none" />
                            </div>
                          </div>
                          <div className="space-y-1">
                            <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest pl-1">Points (EV)</span>
                            <div className="flex items-center gap-2 bg-slate-800/50 rounded-xl px-3 py-2 border border-white/5">
                              <input type="number" value={seg.points} onChange={(e) => {
                                const next = [...spinnerSegments]; next[i].points = parseFloat(e.target.value) || 0; setSpinnerSegments(next);
                              }} className="w-full bg-transparent text-sm font-black text-white outline-none" />
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
                    <div className="text-4xl font-black text-white">
                      {(spinnerSegments.reduce((sum, s) => sum + (s.points * (s.weight / totalWeight)), 0)).toFixed(2)}
                    </div>
                    <div className="mt-2 text-[9px] font-bold text-indigo-400 uppercase tracking-widest opacity-80">Σ (P_i × V_i)</div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className={`p-4 rounded-2xl border border-indigo-500/10 ${darkMode ? 'bg-slate-900' : 'bg-slate-50'}`}>
                      <div className="text-[8px] font-black text-slate-500 uppercase mb-1">Session Avg</div>
                      <div className="text-xl font-black text-white">
                        {spinnerEVHistory.length > 0 ? (spinnerEVHistory.reduce((a, b) => a + b, 0) / spinnerEVHistory.length).toFixed(4) : "0.0000"}
                      </div>
                      <div className="text-[8px] text-slate-600 font-bold uppercase mt-1">{spinnerEVHistory.length} Spins</div>
                    </div>
                    <button onClick={() => setSpinnerEVHistory([])} className="p-4 rounded-2xl border border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/10 transition-all flex flex-col items-center justify-center">
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
      })()}
      {mode === 'cards' && (
        <div className="animate-in fade-in duration-500 space-y-8">
          <div className="flex justify-center p-1 bg-slate-900/50 rounded-xl border border-white/5 max-w-lg mx-auto mb-6">
            {[
              { id: 'poker', label: 'Poker' },
              { id: 'hunt', label: 'Hunt & Bet' },
              { id: 'replace', label: 'Replace' },
              { id: 'conditional', label: 'Deck Tracker' },
              { id: 'outs', label: 'Outs' },
              { id: 'hilo', label: 'Hi-Lo Count' }
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setCardSubMode(t.id)}
                className={`flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${cardSubMode === t.id ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
              >{t.label}</button>
            ))}
          </div>

          {cardSubMode === 'poker' && (
            <div className="animate-in fade-in space-y-8">
              <div className="flex justify-between items-center mb-2">
                <div className="text-left">
                  <h5 className={`text-xs font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Poker Hand Odds</h5>
                  <p className="text-[10px] text-slate-500 mt-1">Probability of 5-card hands in a 52-card deck.</p>
                </div>
                <button
                  onClick={() => setCardGame({ ...cardGame, history: [] })}
                  className="text-[9px] text-indigo-400 font-bold hover:underline uppercase"
                >Clear Stats</button>
              </div>

              <div className="grid grid-cols-5 gap-2 justify-center">
                {(cardGame.pokerHand || [null, null, null, null, null]).map((card, i) => (
                  <div key={i} className={`h-24 rounded-xl border-2 flex flex-col items-center justify-center relative shadow-md transition-all duration-300 ${card ? (darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200') : 'bg-slate-800/10 border-dashed border-slate-700/20'}`}>
                    {card ? (
                      <>
                        <div className={`absolute top-1 left-1.5 text-[10px] font-black ${['♥', '♦'].includes(card.suit) ? 'text-rose-500' : (darkMode ? 'text-slate-300' : 'text-slate-900')}`}>{card.rank}</div>
                        <div className={`text-2xl ${['♥', '♦'].includes(card.suit) ? 'text-rose-500' : (darkMode ? 'text-slate-300' : 'text-slate-900')}`}>{card.suit}</div>
                      </>
                    ) : <div className="text-xl text-slate-800">?</div>}
                  </div>
                ))}
              </div>

              <div className="text-center space-y-4">
                <div className="flex gap-4">
                  <button
                    onClick={() => {
                      const suits = ['♠', '♥', '♦', '♣'];
                      const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
                      const rankValues = { 'A': 14, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13 };

                      const deck = [];
                      suits.forEach(s => ranks.forEach(r => deck.push({ suit: s, rank: r, rankValue: rankValues[r] })));
                      const hand = [];
                      for (let i = 0; i < 5; i++) {
                        const idx = Math.floor(Math.random() * deck.length);
                        hand.push(deck.splice(idx, 1)[0]);
                      }

                      const sortedRanks = hand.map(c => c.rankValue).sort((a, b) => a - b);
                      const handSuits = hand.map(c => c.suit);
                      const rCounts = {};
                      sortedRanks.forEach(rv => rCounts[rv] = (rCounts[rv] || 0) + 1);
                      const cts = Object.values(rCounts).sort((a, b) => b - a);
                      const isFlush = new Set(handSuits).size === 1;
                      let isStr = true;
                      for (let i = 0; i < 4; i++) if (sortedRanks[i + 1] !== sortedRanks[i] + 1) isStr = false;
                      if (!isStr && JSON.stringify(sortedRanks) === JSON.stringify([2, 3, 4, 5, 14])) isStr = true;

                      let type = "High Card";
                      if (isStr && isFlush && sortedRanks[0] === 10) type = "Royal Flush";
                      else if (isStr && isFlush) type = "Straight Flush";
                      else if (cts[0] === 4) type = "Four of a Kind";
                      else if (cts[0] === 3 && cts[1] === 2) type = "Full House";
                      else if (isFlush) type = "Flush";
                      else if (isStr) type = "Straight";
                      else if (cts[0] === 3) type = "Three of a Kind";
                      else if (cts[0] === 2 && cts[1] === 2) type = "Two Pair";
                      else if (cts[0] === 2) type = "One Pair";

                      setCardGame(prev => ({ ...prev, pokerHand: hand, result: type, history: [...prev.history, type] }));
                    }}
                    className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black uppercase tracking-widest transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
                  >Deal 5 Cards</button>

                  <button
                    onClick={() => {
                      const types = [];
                      const suits = ['♠', '♥', '♦', '♣'];
                      const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
                      const rankValues = { 'A': 14, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13 };

                      for (let n = 0; n < 1000; n++) {
                        const deck = [];
                        suits.forEach(s => ranks.forEach(r => deck.push({ suit: s, rank: r, rv: rankValues[r] })));
                        const hand = [];
                        for (let i = 0; i < 5; i++) hand.push(deck.splice(Math.floor(Math.random() * deck.length), 1)[0]);

                        const sr = hand.map(c => c.rv).sort((a, b) => a - b);
                        const hs = hand.map(c => c.suit);
                        const rc = {}; sr.forEach(v => rc[v] = (rc[v] || 0) + 1);
                        const ct = Object.values(rc).sort((a, b) => b - a);
                        const fl = new Set(hs).size === 1;
                        let st = true; for (let i = 0; i < 4; i++) if (sr[i + 1] !== sr[i] + 1) st = false;
                        if (!st && JSON.stringify(sr) === JSON.stringify([2, 3, 4, 5, 14])) st = true;

                        let t = "High Card";
                        if (st && fl) t = sr[0] === 10 ? "Royal Flush" : "Straight Flush";
                        else if (ct[0] === 4) t = "Four of a Kind";
                        else if (ct[0] === 3 && ct[1] === 2) t = "Full House";
                        else if (fl) t = "Flush";
                        else if (st) t = "Straight";
                        else if (ct[0] === 3) t = "Three of a Kind";
                        else if (ct[0] === 2 && ct[1] === 2) t = "Two Pair";
                        else if (ct[0] === 2) t = "One Pair";
                        types.push(t);
                      }
                      setCardGame(prev => ({ ...prev, history: [...prev.history, ...types] }));
                    }}
                    className={`px-4 py-4 rounded-2xl font-black uppercase text-[10px] border transition-all active:scale-95 ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                  >Simulate 1,000 Hands</button>
                </div>

                {cardGame.result && (
                  <div className="animate-in slide-in-from-top-4">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Results</span>
                    <div className="text-2xl font-black text-indigo-400 uppercase">{cardGame.result}</div>
                  </div>
                )}

                <div className="space-y-3 pt-4 text-left">
                  <h6 className="text-[10px] font-black uppercase text-slate-500 mb-2">Theoretical Odds vs. Your Deck</h6>
                  <div className="space-y-1.5">
                    {[
                      { name: "One Pair", theoretical: "42.3%", t: 0.4225 },
                      { name: "Two Pair", theoretical: "4.75%", t: 0.0475 },
                      { name: "Three of a Kind", theoretical: "2.11%", t: 0.0211 },
                      { name: "Straight", theoretical: "0.39%", t: 0.0039 },
                      { name: "Flush", theoretical: "0.20%", t: 0.0020 },
                      { name: "Full House", theoretical: "0.14%", t: 0.0014 },
                      { name: "Four of a Kind", theoretical: "0.02%", t: 0.0002 }
                    ].map(h => {
                      const sessionCount = cardGame.history.filter(t => t === h.name).length;
                      const sessionProb = cardGame.history.length > 0 ? (sessionCount / cardGame.history.length) : 0;
                      return (
                        <div key={h.name} className="flex items-center gap-3">
                          <div className="w-24 text-[9px] font-black text-slate-400 uppercase truncate">{h.name}</div>
                          <div className="flex-1 h-3 bg-slate-800/50 rounded-full overflow-hidden relative">
                            <div className="absolute inset-0 bg-indigo-500/20" style={{ width: `${h.t * 100}%` }} />
                            <div className="absolute inset-0 bg-emerald-500 transition-all duration-700" style={{ width: `${sessionProb * 100}%` }} />
                          </div>
                          <div className="w-20 text-[9px] font-bold text-slate-500 text-right">{(sessionProb * 100).toFixed(2)}% <span className="text-[8px] opacity-40">vs {h.theoretical}</span></div>
                        </div>
                      );
                    })}
                  </div>
                  <p className={`p-4 rounded-xl border border-dashed text-[10px] font-medium italic mt-4 ${darkMode ? 'bg-slate-900/50 border-slate-800 text-slate-500' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                    Notice how "One Pair" happens almost half the time, while "Straight" is less than 1%. The emerald bars show your actual results. Deal more cards to see them approach the theoretical values!
                  </p>
                </div>
              </div>
            </div>
          )}

          {cardSubMode === 'hunt' && (
            <div className="animate-in fade-in space-y-6">
              <div className="text-center">
                <h5 className="text-xl font-black text-white uppercase tracking-tight">Hunt & Bet</h5>
                <p className="text-[10px] text-slate-500 uppercase font-bold mt-1">Probability & Expected Value Simulator</p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                {[
                  { id: 'Aces', label: 'Aces', count: 4, icon: 'A♠' },
                  { id: 'Hearts', label: 'Hearts', count: 13, icon: '♥' },
                  { id: 'Face', label: 'Face Cards', count: 12, icon: 'JQK' }
                ].map(t => (
                  <button
                    key={t.id}
                    onClick={() => setHuntTarget(t.id)}
                    className={`p-4 rounded-2xl border-2 transition-all block ${huntTarget === t.id ? 'border-indigo-500 bg-indigo-500/10' : (darkMode ? 'border-slate-800 bg-slate-900/50 text-slate-500' : 'border-slate-100 bg-slate-50 text-slate-400')}`}
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
                    <div className={`w-8 h-4 rounded-full p-0.5 cursor-pointer transition-all ${huntWithReplacement ? 'bg-indigo-600' : 'bg-slate-700'}`} onClick={() => setHuntWithReplacement(!huntWithReplacement)}>
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
                      type="range" min="1" max="15" step="1"
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
                          type="number" step="0.5"
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
                          type="number" step="0.5"
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
                    probSuccess = 1 - (nCr(N - K, n) / nCr(N, n));
                  }

                  const ev = (probSuccess * cardBetConfig.payout) - ((1 - probSuccess) * cardBetConfig.bet);

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
                            {ev > 0 ? '+' : ''}{ev.toFixed(2)}
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => setShowHuntMath(!showHuntMath)}
                          className="flex-1 py-2 rounded-xl bg-slate-800 text-[9px] font-black text-slate-500 uppercase tracking-widest border border-white/5 hover:text-white transition-all"
                        >{showHuntMath ? 'Hide Math' : 'Show Math'}</button>
                        <div className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center ${ev > 0 ? 'bg-emerald-500/20 text-emerald-400' : ev < 0 ? 'bg-rose-500/20 text-rose-400' : 'bg-slate-800 text-slate-500'}`}>
                          {ev > 0 ? 'PROFITABLE' : ev < 0 ? 'TRAP' : 'FAIR'}
                        </div>
                      </div>

                      <div className="pt-4 border-t border-white/5 flex justify-between items-center">
                        <div>
                          <div className="text-[8px] font-black text-slate-500 uppercase">Hunt Session P/L</div>
                          <div className={`text-lg font-black ${huntSessionProfit >= 0 ? 'text-emerald-400' : 'text-rose-500'}`}>
                            {huntSessionProfit >= 0 ? '+$' : '-$'}{Math.abs(huntSessionProfit).toFixed(2)}
                          </div>
                        </div>
                        <button onClick={() => setHuntSessionProfit(0)} className="text-[8px] font-black text-rose-400 uppercase hover:underline">Reset Session</button>
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
                    suits.forEach(s => ranks.forEach(r => deck.push({ suit: s, rank: r })));

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
                      const hasTarget = hand.some(c => {
                        if (huntTarget === 'Aces') return c.rank === 'A';
                        if (huntTarget === 'Hearts') return c.suit === '♥';
                        if (huntTarget === 'Face') return ['J', 'Q', 'K'].includes(c.rank);
                        return false;
                      });
                      if (hasTarget) successes++;
                      results.push(hasTarget);
                    }

                    const sessionPL = (successes * cardBetConfig.payout) - ((10000 - successes) * cardBetConfig.bet);
                    setHuntSessionProfit(prev => prev + sessionPL);
                    setHuntHistory(prev => [...prev, ...results]);
                  }}
                  className="py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black uppercase tracking-widest transition-all shadow-lg text-xs"
                >Run 10,000 Trials</button>

                <button
                  onClick={() => {
                    const suits = ['♠', '♥', '♦', '♣'];
                    const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
                    const deck = [];
                    suits.forEach(s => ranks.forEach(r => deck.push({ suit: s, rank: r })));

                    const hand = [];
                    if (huntWithReplacement) {
                      for (let h = 0; h < huntHandSize; h++) hand.push(deck[Math.floor(Math.random() * deck.length)]);
                    } else {
                      const tempDeck = [...deck];
                      for (let h = 0; h < huntHandSize; h++) hand.push(tempDeck.splice(Math.floor(Math.random() * tempDeck.length), 1)[0]);
                    }

                    const hasTarget = hand.some(c => {
                      if (huntTarget === 'Aces') return c.rank === 'A';
                      if (huntTarget === 'Hearts') return c.suit === '♥';
                      if (huntTarget === 'Face') return ['J', 'Q', 'K'].includes(c.rank);
                      return false;
                    });

                    const sessionPL = hasTarget ? cardBetConfig.payout : -cardBetConfig.bet;
                    setHuntSessionProfit(prev => prev + sessionPL);
                    setHuntLastHand(hand);
                    setHuntHistory(prev => [...prev, hasTarget]);
                  }}
                  className="py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-black uppercase tracking-widest transition-all border border-white/5 text-xs"
                >Single Draw</button>
              </div>

              {huntLastHand && (
                <div className="flex justify-center gap-1">
                  {huntLastHand.map((c, i) => {
                    const isMatch = (huntTarget === 'Aces' && c.rank === 'A') ||
                      (huntTarget === 'Hearts' && c.suit === '♥') ||
                      (huntTarget === 'Face' && ['J', 'Q', 'K'].includes(c.rank));
                    return (
                      <div key={i} className={`w-10 h-14 rounded-lg border-2 flex flex-col items-center justify-center relative ${isMatch ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-800 bg-slate-900'}`}>
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
                    <div className="text-xl font-black text-white">{(huntHistory.filter(Boolean).length / huntHistory.length * 100).toFixed(2)}%</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] font-black text-slate-500 uppercase">Total Trials</div>
                    <div className="text-xl font-black text-indigo-400">{huntHistory.length.toLocaleString()}</div>
                    <button onClick={() => { setHuntHistory([]); setHuntLastHand(null); }} className="text-[8px] text-rose-400 uppercase font-black hover:underline mt-1">Clear</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {cardSubMode === 'replace' && (
            <div className="animate-in fade-in space-y-6">
              <div className="text-center">
                <h5 className="text-xl font-black text-white uppercase tracking-tight">Replace vs No Replace</h5>
                <p className="text-[10px] text-slate-500 uppercase font-bold mt-1">The "Misconception Killer": Independence vs Dependence</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                  <span className="text-[9px] font-black text-slate-500 uppercase block mb-2">Success Rate (P)</span>
                  <div className="text-2xl font-black text-indigo-400">25%</div>
                  <div className="text-[8px] text-slate-600 font-bold uppercase mt-1 italic">Drawing a Heart (13/52)</div>
                </div>
                <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                  <span className="text-[9px] font-black text-slate-500 uppercase block mb-2">Draw Count (k)</span>
                  <div className="text-2xl font-black text-white">{replaceHandSize}</div>
                  <input
                    type="range" min="2" max="8" step="1"
                    value={replaceHandSize}
                    onChange={(e) => setReplaceHandSize(parseInt(e.target.value))}
                    className="w-full mt-2 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className={`p-6 rounded-3xl border-2 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'} space-y-4 relative overflow-hidden`}>
                  <div className="absolute top-0 right-0 p-2 bg-indigo-600/10 text-indigo-400 text-[8px] font-black uppercase tracking-widest rounded-bl-xl">Independent</div>
                  <h6 className="text-[10px] font-black text-white uppercase tracking-widest">With Replacement</h6>
                  <p className="text-[9px] text-slate-500 leading-relaxed">The deck never changes. Each draw is always 13/52.</p>

                  <div className="pt-4 border-t border-white/5 text-center">
                    <div className="text-3xl font-black text-indigo-400">
                      {(Math.pow(0.25, replaceHandSize) * 100).toFixed(4)}%
                    </div>
                    <div className="text-[9px] font-mono text-slate-500 mt-2">P(A)^k = (0.25)^{replaceHandSize}</div>
                  </div>
                </div>

                <div className={`p-6 rounded-3xl border-2 ${darkMode ? 'bg-emerald-500/10 border-emerald-500/20 shadow-xl shadow-emerald-500/5' : 'bg-emerald-50 border-emerald-100'} space-y-4 relative overflow-hidden`}>
                  <div className="absolute top-0 right-0 p-2 bg-emerald-500/20 text-emerald-400 text-[8px] font-black uppercase tracking-widest rounded-bl-xl">Dependent</div>
                  <h6 className="text-[10px] font-black text-white uppercase tracking-widest">Without Replacement</h6>
                  <p className="text-[9px] text-slate-500 leading-relaxed">Success gets HARDER after each success as pool shrinks.</p>

                  <div className="pt-4 border-t border-white/5 text-center">
                    {(() => {
                      let p = 1;
                      for (let i = 0; i < replaceHandSize; i++) p *= (13 - i) / (52 - i);
                      return (
                        <>
                          <div className="text-3xl font-black text-emerald-400">
                            {(p * 100).toFixed(4)}%
                          </div>
                          <div className="text-[9px] font-mono text-slate-500 mt-2">
                            {Array.from({ length: replaceHandSize }).map((_, i) => `${13 - i}/${52 - i}`).join(' × ')}
                          </div >
                        </>
                      )
                    })()}
                  </div>
                </div>
              </div>

              <div className={`p-5 rounded-2xl border border-dashed text-center ${darkMode ? 'bg-slate-950/50 border-slate-800 text-slate-500' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                <Info className="w-4 h-4 mx-auto mb-2 opacity-50 text-indigo-400" />
                <p className="text-[10px] leading-relaxed font-medium italic">
                  Notice how <b>Without Replacement</b> becomes significantly less likely! This is why card counting works in blackjack:
                  drawing high cards reduces the chance of drawing more high cards, shifting the odds.
                </p>
              </div>
            </div>
          )}
          {cardSubMode === 'conditional' && (
            <div className="animate-in fade-in space-y-6">
              <div className="text-center">
                <h5 className="text-xl font-black text-white uppercase tracking-tight">Conditional Tracker</h5>
                <p className="text-[10px] text-slate-500 uppercase font-bold mt-1">Given the cards we've seen, what happens next?</p>
              </div>

              <div className="flex gap-4">
                <div className="flex-1 space-y-4">
                  <div className={`p-6 rounded-3xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Live Probabilities</span>
                      <div className="text-[9px] font-bold text-indigo-400">Remaining: {52 - deckRevealHistory.length}/52</div>
                    </div>

                    <div className="space-y-4">
                      {(() => {
                        const seen = deckRevealHistory;
                        const remainingCount = 52 - seen.length;
                        if (remainingCount === 0) return <p className="text-xs text-slate-500 italic">Deck is empty!</p>;

                        const redsSeen = seen.filter(c => ['♥', '♦'].includes(c.suit)).length;
                        const heartsSeen = seen.filter(c => c.suit === '♥').length;

                        const pNextRed = (26 - redsSeen) / remainingCount;
                        const pNextHeart = (13 - heartsSeen) / remainingCount;

                        // P(Heart in next 3) = 1 - P(No heart in next 3)
                        let pNoHeartNext3 = 1;
                        const remainingHearts = 13 - heartsSeen;
                        const remainingNonHearts = remainingCount - remainingHearts;

                        const drawCount = Math.min(3, remainingCount);
                        for (let i = 0; i < drawCount; i++) {
                          pNoHeartNext3 *= (remainingNonHearts - i) / (remainingCount - i);
                        }
                        const pHeartIn3 = 1 - pNoHeartNext3;

                        return (
                          <>
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-bold text-slate-300">Next is Red/Black</span>
                              <span className="text-lg font-black text-indigo-400">{(pNextRed * 100).toFixed(1)}%</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-bold text-slate-300">Next is Heart</span>
                              <span className="text-lg font-black text-rose-400">{(pNextHeart * 100).toFixed(1)}%</span>
                            </div>
                            <div className="flex items-center justify-between pt-2 border-t border-white/5">
                              <span className="text-[11px] font-bold text-slate-300">Heart in next 3 cards</span>
                              <span className="text-lg font-black text-emerald-400">{(pHeartIn3 * 100).toFixed(1)}%</span>
                            </div>
                          </>
                        )
                      })()}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        if (deckRevealHistory.length >= 52) return;
                        const suits = ['♠', '♥', '♦', '♣'];
                        const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
                        const deck = [];
                        suits.forEach(s => ranks.forEach(r => deck.push({ suit: s, rank: r })));

                        // Remove seen cards
                        const filteredDeck = deck.filter(c => !deckRevealHistory.some(s => s.suit === c.suit && s.rank === c.rank));
                        const next = filteredDeck[Math.floor(Math.random() * filteredDeck.length)];
                        setDeckRevealHistory([...deckRevealHistory, next]);
                      }}
                      className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black uppercase tracking-widest transition-all shadow-lg active:scale-95 disabled:opacity-50"
                      disabled={deckRevealHistory.length >= 52}
                    >REVEAL NEXT CARD</button>
                    <button onClick={() => setDeckRevealHistory([])} className="px-4 py-4 bg-slate-800 text-slate-500 hover:text-white rounded-2xl font-black uppercase text-[10px]">Reset</button>
                  </div>
                </div>

                <div className="w-1/3 space-y-3">
                  <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'} h-full flex flex-col`}>
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-4 ml-1">Reveal History</span>
                    <div className="flex-1 overflow-y-auto max-h-[220px] space-y-2 pr-1 custom-scrollbar">
                      {deckRevealHistory.map((c, i) => (
                        <div key={i} className={`flex items-center justify-between p-2 rounded-lg ${darkMode ? 'bg-slate-950 shadow-inner' : 'bg-white shadow-sm'}`}>
                          <span className={`text-[10px] font-black ${['♥', '♦'].includes(c.suit) ? 'text-rose-500' : 'text-slate-300'}`}>{c.rank} {c.suit}</span>
                          <span className="text-[8px] text-slate-600 font-bold uppercase">#{deckRevealHistory.length - i}</span>
                        </div>
                      )).reverse()}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {['♠', '♥', '♦', '♣'].map(s => {
                  const seen = deckRevealHistory.filter(c => c.suit === s).length;
                  const remaining = 13 - seen;
                  return (
                    <div key={s} className={`p-3 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-100'} text-center`}>
                      <div className={`text-xl ${['♥', '♦'].includes(s) ? 'text-rose-500' : 'text-slate-400'}`}>{s}</div>
                      <div className="text-[10px] font-black text-white mt-1">{remaining} Left</div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
          {cardSubMode === 'outs' && (
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
                    <h6 className="text-[11px] font-black text-white uppercase">Scenario: <span className="text-indigo-400 px-2 py-0.5 bg-indigo-500/10 rounded-full">{pokerOutsScenario === 'flush' ? 'Flush Draw' : 'Straight Draw'}</span></h6>
                    <p className="text-[9px] text-slate-500">
                      {pokerOutsScenario === 'flush'
                        ? "You need one more spade (♠) to complete your flush."
                        : "You have 4-to-a-straight. Any 5 or 10 completes it."}
                    </p>
                  </div>
                  <div className="text-2xl font-black text-white">{pokerOutsScenario === 'flush' ? '9 Outs' : '8 Outs'}</div>
                </div>

                <div className="p-3 bg-slate-900/50 rounded-2xl border border-white/5">
                  <div className="text-[8px] font-black text-slate-400 uppercase mb-2 tracking-widest">Winning Cards (Outs)</div>
                  <div className="flex flex-wrap gap-1">
                    {(pokerOutsScenario === 'flush' ? ['2', '3', '4', '5', '6', '8', '9', 'J', 'Q'] : ['5', '5', '5', '5', '10', '10', '10', '10']).map((r, i) => (
                      <div key={i} className="px-2 py-1 bg-slate-800 rounded-lg text-[10px] font-bold text-indigo-300 border border-white/5">
                        {r}{pokerOutsScenario === 'flush' ? '♠' : ''}
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
                          <div className="absolute hidden group-hover:block bottom-full mb-2 w-32 left-1/2 -translate-x-1/2 bg-slate-800 p-2 rounded text-[8px] text-white z-50">Prob of hitting on the next card.</div>
                        </div>
                        <div className="text-center group relative cursor-help">
                          <div className="text-[8px] font-black text-slate-500 uppercase mb-1">The River</div>
                          <div className="text-lg font-black text-indigo-400">{((outs / 46) * 100).toFixed(1)}%</div>
                          <div className="text-[8px] text-slate-600 font-bold uppercase italic">{outs} / 46</div>
                          <div className="absolute hidden group-hover:block bottom-full mb-2 w-32 left-1/2 -translate-x-1/2 bg-slate-800 p-2 rounded text-[8px] text-white z-50">Prob if you miss turn but hit on river.</div>
                        </div>
                        <div className="text-center group relative cursor-help">
                          <div className="text-[8px] font-black text-slate-500 uppercase mb-1">By River</div>
                          <div className="text-lg font-black text-emerald-400">{((1 - ((47 - outs) / 47) * ((46 - outs) / 46)) * 100).toFixed(1)}%</div>
                          <div className="text-[8px] text-slate-600 font-bold uppercase italic">Rule of 4</div>
                          <div className="absolute hidden group-hover:block bottom-full mb-2 w-32 left-1/2 -translate-x-1/2 bg-slate-800 p-2 rounded text-[8px] text-white z-50">Combined prob of hitting either turn or river.</div>
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
                      hand: [{ suit: '♠', rank: 'A' }, { suit: '♠', rank: 'K' }],
                      flop: [{ suit: '♠', rank: '7' }, { suit: '♠', rank: '2' }, { suit: '♦', rank: 'Q' }]
                    });
                  } else {
                    setPokerOutsCards({
                      hand: [{ suit: '♥', rank: '6' }, { suit: '♦', rank: '7' }],
                      flop: [{ suit: '♣', rank: '8' }, { suit: '♠', rank: '9' }, { suit: '♥', rank: '2' }]
                    });
                  }
                }}
                className="w-full py-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-black uppercase tracking-widest transition-all border border-white/5 active:scale-95 shadow-md flex items-center justify-center gap-2"
              >
                <RefreshCw size={14} className="text-indigo-400" />
                NEXT SCENARIO (RELOAD)
              </button>
            </div>
          )}

          {cardSubMode === 'bet' && (
            <div className="animate-in fade-in space-y-6">
              <div className="text-center">
                <h5 className="text-xl font-black text-white uppercase tracking-tight">Fair Bet or Trap?</h5>
                <p className="text-[10px] text-slate-500 uppercase font-bold mt-1">Expected Value & House Edge Trainer</p>
              </div>

              <div className={`p-6 rounded-3xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'} space-y-6`}>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Target Event</span>
                    <select
                      value={cardBetConfig.target}
                      onChange={(e) => setCardBetConfig({ ...cardBetConfig, target: e.target.value })}
                      className="w-full bg-slate-800 rounded-xl px-4 py-3 text-xs font-black text-white outline-none border border-white/5 focus:border-indigo-500 transition-all"
                    >
                      <option value="Heart">Draw a Heart (1/4)</option>
                      <option value="Ace">Draw an Ace (1/13)</option>
                      <option value="Face">Draw a Face Card (3/13)</option>
                    </select>
                  </div>
                  <div className="space-y-3">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Payout ($)</span>
                    <div className="flex items-center gap-2 bg-slate-800 rounded-xl px-4 py-3 border border-white/5">
                      <span className="text-indigo-400 font-black">$</span>
                      <input
                        type="number" step="0.5"
                        value={cardBetConfig.payout}
                        onChange={(e) => setCardBetConfig({ ...cardBetConfig, payout: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-transparent text-xs font-black text-white outline-none"
                      />
                    </div>
                  </div>
                </div>

                {(() => {
                  const p = cardBetConfig.target === 'Heart' ? 0.25 : cardBetConfig.target === 'Ace' ? 1 / 13 : 12 / 52;
                  const ev = (p * cardBetConfig.payout) - ((1 - p) * cardBetConfig.bet);

                  return (
                    <div className="pt-6 border-t border-white/5 flex items-center justify-between">
                      <div>
                        <h6 className="text-[10px] font-black text-slate-500 uppercase mb-1">Expected Value (EV)</h6>
                        <div className={`text-3xl font-black ${ev > 0 ? 'text-emerald-400' : ev < 0 ? 'text-rose-500' : 'text-slate-400'}`}>
                          {ev > 0 ? '+' : ''}{ev.toFixed(2)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${ev > 0 ? 'bg-emerald-500/20 text-emerald-400' : ev < 0 ? 'bg-rose-500/20 text-rose-400' : 'bg-slate-800 text-slate-500'}`}>
                          {ev > 0 ? 'Profitable' : ev < 0 ? 'House Edge' : 'Fair Bet'}
                        </div>
                      </div>
                    </div>
                  )
                })()}
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => {
                    const p = cardBetConfig.target === 'Heart' ? 0.25 : cardBetConfig.target === 'Ace' ? 1 / 13 : 12 / 52;
                    let currentBankroll = cardBetBankroll;
                    const history = [];
                    for (let i = 0; i < 50; i++) {
                      const win = Math.random() < p;
                      currentBankroll += win ? cardBetConfig.payout : -cardBetConfig.bet;
                      history.push(currentBankroll);
                    }
                    setCardBetBankroll(currentBankroll);
                    setCardBetHistory(history);
                  }}
                  className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black uppercase tracking-widest transition-all shadow-lg active:scale-95"
                >Run session (50 plays)</button>
                <button onClick={() => { setCardBetBankroll(100); setCardBetHistory([]); }} className="px-6 py-4 bg-slate-800 text-slate-500 hover:text-white rounded-2xl font-black uppercase text-[10px]">Reset</button>
              </div>

              {cardBetHistory.length > 0 && (
                <div className={`p-4 rounded-3xl border border-indigo-500/10 bg-indigo-500/5`}>
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Bankroll Over Time</span>
                    <span className={`text-sm font-black ${cardBetBankroll >= 100 ? 'text-emerald-400' : 'text-rose-500'}`}>${cardBetBankroll.toFixed(2)}</span>
                  </div>
                  <div className="h-16 flex items-end gap-0.5">
                    {cardBetHistory.map((b, i) => (
                      <div
                        key={i}
                        className={`flex-1 min-w-[2px] rounded-t-sm transition-all duration-500 ${b >= 100 ? 'bg-emerald-500/40' : 'bg-rose-500/40'}`}
                        style={{ height: `${Math.max(5, Math.min(100, (b / 200) * 100))}%` }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {cardSubMode === 'hilo' && (
            <div className="animate-in fade-in space-y-6">
              <div className="text-center">
                <h5 className="text-xl font-black text-white uppercase tracking-tight">Hi-Lo Card Counting</h5>
                <p className="text-[10px] text-slate-500 uppercase font-bold mt-1">Advantage Play & Conditional Probability</p>
              </div>

              <div className="flex justify-center gap-4">
                <div className={`w-32 h-44 rounded-2xl border-2 flex flex-col items-center justify-center p-4 transition-all ${hiLoHistory.length > 0 ? (['10', 'J', 'Q', 'K', 'A'].includes(hiLoHistory[0].rank) ? 'border-rose-500 bg-rose-500/10' : ['2', '3', '4', '5', '6'].includes(hiLoHistory[0].rank) ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-700 bg-slate-900') : 'border-slate-800 bg-slate-900/50'}`}>
                  {hiLoHistory.length > 0 ? (
                    <>
                      <div className={`text-4xl font-black mb-2 ${['♥', '♦'].includes(hiLoHistory[0].suit) ? 'text-rose-500' : 'text-slate-300'}`}>{hiLoHistory[0].rank}</div>
                      <div className={`text-5xl ${['♥', '♦'].includes(hiLoHistory[0].suit) ? 'text-rose-500' : 'text-slate-300'}`}>{hiLoHistory[0].suit}</div>
                    </>
                  ) : (
                    <div className="text-slate-600 font-black text-center text-[10px] uppercase">Flip a Card</div>
                  )}
                </div>

                <div className="space-y-4 flex-1">
                  <div className={`p-4 rounded-3xl border-2 ${hiLoCount > 0 ? 'bg-emerald-500/10 border-emerald-500/20' : hiLoCount < 0 ? 'bg-rose-500/10 border-rose-500/20' : 'bg-slate-900 border-slate-800'}`}>
                    <div className="text-[10px] font-black text-slate-500 uppercase mb-1">Running Count</div>
                    <div className={`text-4xl font-black ${hiLoCount > 0 ? 'text-emerald-400' : hiLoCount < 0 ? 'text-rose-500' : 'text-white'}`}>
                      {hiLoCount > 0 ? '+' : ''}{hiLoCount}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        const suits = ['♠', '♥', '♦', '♣'];
                        const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
                        let currentDeck = hiLoDeck.length > 0 ? [...hiLoDeck] : [];
                        if (currentDeck.length === 0) {
                          suits.forEach(s => ranks.forEach(r => currentDeck.push({ suit: s, rank: r })));
                        }
                        const card = currentDeck.splice(Math.floor(Math.random() * currentDeck.length), 1)[0];

                        let delta = 0;
                        if (['10', 'J', 'Q', 'K', 'A'].includes(card.rank)) delta = -1;
                        else if (['2', '3', '4', '5', '6'].includes(card.rank)) delta = 1;

                        setHiLoCount(prev => prev + delta);
                        setHiLoHistory([card, ...hiLoHistory]);
                        setHiLoDeck(currentDeck);
                      }}
                      className="py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black uppercase text-[10px] transition-all"
                    >Flip Card</button>
                    <button
                      onClick={() => { setHiLoCount(0); setHiLoHistory([]); setHiLoDeck([]); }}
                      className="py-3 bg-slate-800 text-slate-400 rounded-xl font-black uppercase text-[10px]"
                    >Reset</button>
                  </div>
                </div>
              </div>

              <div className={`p-6 rounded-3xl border ${darkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50 border-slate-200'} space-y-4`}>
                <div className="flex justify-between items-center">
                  <h6 className="text-[10px] font-black text-white uppercase tracking-widest">Deck Composition Effect</h6>
                  <span className="text-[10px] font-bold text-slate-500 uppercase">{hiLoDeck.length || 52} Cards Left</span>
                </div>

                {(() => {
                  const deck = hiLoDeck.length > 0 ? hiLoDeck : Array(52).fill(null);
                  // If deck is virtual (nulls), we use the starting ratio
                  const total = deck.length;
                  const highLeft = hiLoDeck.length > 0 ? hiLoDeck.filter(c => ['10', 'J', 'Q', 'K', 'A'].includes(c.rank)).length : 20;
                  const probHigh = highLeft / total;

                  return (
                    <div className="space-y-4">
                      <div className="flex justify-between items-end">
                        <div className="text-left">
                          <div className="text-[8px] font-black text-slate-400 uppercase mb-1">Prob of Big Card (10-A)</div>
                          <div className="text-2xl font-black text-white">{(probHigh * 100).toFixed(1)}%</div>
                        </div>
                        <div className={`text-[10px] font-black uppercase px-2 py-1 rounded-lg ${hiLoCount > 2 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                          {hiLoCount > 2 ? 'Deep Deck Advantage' : 'Neutral Deck'}
                        </div>
                      </div>

                      <div className="h-2 bg-slate-800 rounded-full overflow-hidden flex">
                        <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${(probHigh / (20 / 52)) * 50}%` }} />
                        <div className="h-full bg-slate-700" style={{ width: '2px' }} />
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div className="text-center p-2 rounded-xl bg-slate-800/50 border border-white/5">
                          <div className="text-[7px] font-black text-slate-500 uppercase mb-1">Low (2-6)</div>
                          <div className="text-xs font-black text-emerald-400">+1</div>
                        </div>
                        <div className="text-center p-2 rounded-xl bg-slate-800/50 border border-white/5">
                          <div className="text-[7px] font-black text-slate-500 uppercase mb-1">Neutral (7-9)</div>
                          <div className="text-xs font-black text-slate-400">0</div>
                        </div>
                        <div className="text-center p-2 rounded-xl bg-slate-800/50 border border-white/5">
                          <div className="text-[7px] font-black text-slate-500 uppercase mb-1">High (10-A)</div>
                          <div className="text-xs font-black text-rose-500">-1</div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              <div className={`p-4 rounded-xl border border-dashed text-[9px] font-medium italic leading-relaxed text-center ${darkMode ? 'bg-slate-900 border-slate-800 text-slate-500' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                Card counting tracks the <b>relative concentration</b> of Big Cards remaining. High counts (+5, +10) mean the remaining deck is richer in 10s and Aces, shifting the conditional probability in favor of the player!
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// --- SKEWED DISTRIBUTION VISUAL ---

export default ProbabilityVisual;
