import CoinSimulation from '../probability/CoinSimulation';
import DiceSimulation from '../probability/DiceSimulation';
import ProbabilityBasics from '../probability/ProbabilityBasics';
import ProbabilityCards from '../probability/ProbabilityCards';
import ProbabilityParadoxes from '../probability/ProbabilityParadoxes';
import ProbabilityProperties from '../probability/ProbabilityProperties';
import SpinnerSimulation from '../probability/SpinnerSimulation';

export default function ProbabilityVisual({ mode = 'basics', darkMode }) {
    return (
        <div className="w-full max-w-6xl mx-auto space-y-6 p-4">
            <div hidden={mode !== 'basics'}><ProbabilityBasics darkMode={darkMode} /></div>
            <div hidden={mode !== 'properties'}><ProbabilityProperties darkMode={darkMode} /></div>
            <div hidden={mode !== 'simulation'}><CoinSimulation darkMode={darkMode} /></div>
            <div hidden={mode !== 'paradoxes'}><ProbabilityParadoxes darkMode={darkMode} /></div>
            <div hidden={mode !== 'dice'}><DiceSimulation darkMode={darkMode} /></div>
            <div hidden={mode !== 'spinner'}><SpinnerSimulation darkMode={darkMode} /></div>
            <div hidden={mode !== 'cards'}><ProbabilityCards darkMode={darkMode} /></div>
        </div>
    );
}
