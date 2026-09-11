import { useState } from 'react';
import { BarChart3, BookOpen } from 'lucide-react';
import ProbabilityCalculator from './ProbabilityCalculator';
import ProbabilityBasics from './ProbabilityBasics';
import ProbabilityProperties from './ProbabilityProperties';
import CoinSimulation from './CoinSimulation';
import DiceSimulation from './DiceSimulation';
import SpinnerSimulation from './SpinnerSimulation';
import ProbabilityParadoxes from './ProbabilityParadoxes';
import ProbabilityCards from './ProbabilityCards';

const Card = ({ darkMode, children }) => <section className={`rounded-2xl border p-6 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>{children}</section>;
const Toggle = ({ active, children, onClick, darkMode }) => <button type="button" aria-pressed={active} onClick={onClick} className={`px-4 py-2 rounded-lg text-sm font-bold ${active ? 'bg-indigo-600 text-white' : darkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'}`}>{children}</button>;

export default function ProbabilityPage({ section, darkMode }) {
    const [learnView, setLearnView] = useState('basics');
    const [simulation, setSimulation] = useState('coin');
    const [demo, setDemo] = useState('paradoxes');
    if (section === 'calculator') return <ProbabilityCalculator darkMode={darkMode} />;

    if (section === 'simulations') return <div className="space-y-6"><Card darkMode={darkMode}><div className="flex flex-wrap items-center justify-between gap-4"><div className="flex gap-3"><BarChart3 className="text-indigo-400" /><div><h3 className="text-xl font-black">Probability simulations</h3><p className="text-sm text-slate-500">Compare long-run simulated results with theoretical probability.</p></div></div><div className="flex gap-2">{[['coin','Coin'],['dice','Dice'],['spinner','Spinner']].map(([id,label]) => <Toggle key={id} active={simulation === id} onClick={() => setSimulation(id)} darkMode={darkMode}>{label}</Toggle>)}</div></div></Card><div className="w-full max-w-6xl mx-auto">{simulation === 'coin' && <CoinSimulation darkMode={darkMode} />}{simulation === 'dice' && <DiceSimulation darkMode={darkMode} />}{simulation === 'spinner' && <SpinnerSimulation darkMode={darkMode} />}</div></div>;

    if (section === 'demos') return <div className="space-y-6"><Card darkMode={darkMode}><div className="flex flex-wrap justify-between gap-4"><div><h3 className="text-xl font-black">Probability demos</h3><p className="text-sm text-slate-500">Explore counterintuitive probability and card-based conditional reasoning.</p></div><div className="flex gap-2"><Toggle active={demo === 'paradoxes'} onClick={() => setDemo('paradoxes')} darkMode={darkMode}>Paradoxes</Toggle><Toggle active={demo === 'cards'} onClick={() => setDemo('cards')} darkMode={darkMode}>Cards</Toggle></div></div></Card><div className="w-full max-w-6xl mx-auto">{demo === 'paradoxes' ? <ProbabilityParadoxes darkMode={darkMode} /> : <ProbabilityCards darkMode={darkMode} />}</div></div>;

    return <div className="space-y-6"><Card darkMode={darkMode}><div className="flex flex-wrap justify-between gap-4"><div className="flex gap-3"><BookOpen className="text-indigo-400" /><div><h3 className="text-xl font-black">Probability foundations</h3><p className="text-sm text-slate-500">Learn the probability scale, complements, unions, intersections, independence, and exclusivity.</p></div></div><div className="flex gap-2"><Toggle active={learnView === 'basics'} onClick={() => setLearnView('basics')} darkMode={darkMode}>Basics</Toggle><Toggle active={learnView === 'rules'} onClick={() => setLearnView('rules')} darkMode={darkMode}>Rules</Toggle></div></div></Card><div className="w-full max-w-6xl mx-auto">{learnView === 'basics' ? <ProbabilityBasics darkMode={darkMode} /> : <ProbabilityProperties darkMode={darkMode} />}</div></div>;
}
