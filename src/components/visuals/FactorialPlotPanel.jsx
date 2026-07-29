import React from 'react';
import { Info } from 'lucide-react';
import ProgressiveTooltip from '../common/ProgressiveTooltip';
import InteractionPlot from './InteractionPlot';

const FactorialPlotPanel = ({
    alpha,
    cellData,
    darkMode,
    errorBarType,
    factorA,
    factorB,
    outcomeLabel,
    plotFocus,
    results,
    showErrorBars,
    showMarginalMeans,
    showRawPoints,
    showSimpleEffects,
    swapAxes,
    onErrorBarTypeChange,
    onShowErrorBarsChange,
    onShowMarginalMeansChange,
    onShowRawPointsChange,
    onShowSimpleEffectsChange,
    onSwapAxesChange,
}) => (
    <div className="w-full h-full flex flex-col items-center justify-start p-8 overflow-y-auto custom-scrollbar">
        <InteractionPlot
            factorA={factorA}
            factorB={factorB}
            cellStats={results.cellStats}
            cellData={cellData}
            swapAxes={swapAxes}
            outcomeLabel={outcomeLabel}
            showRawPoints={showRawPoints}
            showMarginalMeans={showMarginalMeans || plotFocus === 'A' || plotFocus === 'B'}
            showErrorBars={showErrorBars}
            errorBarType={errorBarType}
            showSimpleEffects={showSimpleEffects}
            focusMode={plotFocus}
            darkMode={darkMode}
        />

        {results.effects.AxB.p >= alpha && (
            <div className={`w-full max-w-2xl mt-8 p-4 rounded-2xl border-2 border-dashed ${darkMode ? 'bg-indigo-500/5 border-indigo-500/20' : 'bg-indigo-50 border-indigo-200'}`}>
                <p className={`text-[12px] font-bold text-center ${darkMode ? 'text-indigo-300' : 'text-indigo-700'} flex items-center justify-center gap-2`}>
                    <Info size={16} />
                    <span><span className="uppercase tracking-wider font-black text-[10px] mr-2">Main takeaway:</span>The interaction is not significant, so focus on the main effects.</span>
                </p>
            </div>
        )}

        <div className="flex flex-wrap justify-center gap-4 mt-8 pb-12">
            <ProgressiveTooltip term="Axes" title="Swap Axes" desc="Switch which factor is on the x-axis." darkMode={darkMode}>
                <button type="button" onClick={onSwapAxesChange} className={`px-4 py-2 rounded-full text-[9px] font-black transition-all border-2 ${swapAxes ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'}`}>Swap Axes</button>
            </ProgressiveTooltip>
            <ProgressiveTooltip term="Points" title="Show Points" desc="Show raw observations on the interaction plot." darkMode={darkMode}>
                <button type="button" onClick={onShowRawPointsChange} className={`px-4 py-2 rounded-full text-[9px] font-black transition-all border-2 ${showRawPoints ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'}`}>{showRawPoints ? 'Hide Points' : 'Show Points'}</button>
            </ProgressiveTooltip>
            <ProgressiveTooltip term="Marginal" title="Marginal Means" desc="Collapse across the other factor to show main-effect means." darkMode={darkMode}>
                <button type="button" onClick={onShowMarginalMeansChange} className={`px-4 py-2 rounded-full text-[9px] font-black transition-all border-2 ${showMarginalMeans ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'}`}>Marginal Means</button>
            </ProgressiveTooltip>
            <div className="flex bg-slate-900 border-2 border-slate-800 rounded-full p-1">
                <button type="button" onClick={onShowErrorBarsChange} className={`px-4 py-1.5 rounded-full text-[9px] font-black transition-all ${showErrorBars ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>
                    {showErrorBars ? 'Bars On' : 'Bars Off'}
                </button>
                {showErrorBars && (
                    <div className="flex gap-1 ml-1 pl-1 border-l border-slate-800">
                        {['95CI', 'SE'].map((type) => (
                            <button key={type} type="button" onClick={() => onErrorBarTypeChange(type)} className={`px-3 py-1.5 rounded-full text-[8px] font-black transition-all ${errorBarType === type ? 'bg-slate-700 text-white' : 'text-slate-600 hover:text-slate-400'}`}>
                                {type === '95CI' ? '95% CI' : 'Standard Error'}
                            </button>
                        ))}
                    </div>
                )}
            </div>
            <ProgressiveTooltip term="Effect Sig" title="Show Slopes" desc="Overlay simple-effect p-values on lines." darkMode={darkMode}>
                <button type="button" onClick={onShowSimpleEffectsChange} className={`px-4 py-2 rounded-full text-[9px] font-black transition-all border-2 ${showSimpleEffects ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'}`}>Slopes: {showSimpleEffects ? 'On' : 'Off'}</button>
            </ProgressiveTooltip>
        </div>
    </div>
);

export default FactorialPlotPanel;
