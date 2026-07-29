import { Info } from 'lucide-react';

export default function DistributionChartLegend({
  altH1Dir,
  darkMode,
  hoveredRegion,
  isPowerCompactPreset,
  setAltH1Dir,
  setShowBothH1,
  setTargetEffect,
  showBothH1,
  showPopulation,
  tails,
  targetEffect,
  visualMode,
}) {
  if (isPowerCompactPreset) {
    return (
      <div
        className={`absolute top-4 left-4 max-w-[180px] text-[8px] p-3 rounded-xl backdrop-blur-md border shadow-2xl animate-in fade-in slide-in-from-left-2 transition-all ${darkMode ? 'bg-slate-900/95 border-slate-800 text-slate-300' : 'bg-slate-800/95 text-white border-slate-700'}`}
      >
        <div className={`font-black uppercase mb-2 text-[9px] flex items-center gap-2 ${darkMode ? 'text-indigo-400' : 'text-indigo-300'}`}>
          <Info aria-hidden="true" size={10} /> {hoveredRegion ? 'Plot Detail' : 'Power Legend'}
        </div>

        {hoveredRegion ? (
          <div className="animate-in fade-in zoom-in-95 duration-200">
            {hoveredRegion === 'alpha' && (
              <p>
                <strong className="text-red-400">Alpha:</strong> Type I error under the null distribution.
              </p>
            )}
            {hoveredRegion === 'beta' && (
              <p>
                <strong className="text-amber-400">Beta:</strong> Type II error under the alternative distribution.
              </p>
            )}
            {hoveredRegion === 'power' && (
              <p>
                <strong className="text-green-400">Power:</strong> Correct detection when the planned effect is real.
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-1.5">
            <p className="flex items-center gap-1.5">
              <span aria-hidden="true" className="w-3 h-[2px] bg-indigo-400 rounded-full" /> <strong className={darkMode ? 'text-slate-100' : 'text-white'}>H0:</strong> Null
              distribution.
            </p>
            {showPopulation && (
              <p className="flex items-center gap-1.5">
                <span aria-hidden="true" className="w-3 h-0 border-t-2 border-dashed border-slate-400" />{' '}
                <strong className={darkMode ? 'text-slate-100' : 'text-white'}>H1:</strong> Alternative distribution.
              </p>
            )}
            <p className="flex items-center gap-1.5">
              <span aria-hidden="true" className="w-2 h-2 bg-red-400 rounded-sm" /> <strong className={darkMode ? 'text-slate-100' : 'text-white'}>Alpha:</strong> Rejection region
              under H0.
            </p>
            {showPopulation && (
              <>
                <p className="flex items-center gap-1.5">
                  <span aria-hidden="true" className="w-2 h-2 bg-amber-500 rounded-sm" /> <strong className={darkMode ? 'text-slate-100' : 'text-white'}>Beta:</strong> Missed
                  detections under H1.
                </p>
                <p className="flex items-center gap-1.5">
                  <span aria-hidden="true" className="w-2 h-2 bg-green-500 rounded-sm" /> <strong className={darkMode ? 'text-slate-100' : 'text-white'}>Power:</strong> Correct
                  detections under H1.
                </p>
              </>
            )}
            <div className={`pt-2 text-[7px] italic ${darkMode ? 'text-slate-500' : 'text-slate-300'}`}>Focus or hover shaded regions for quick definitions.</div>
          </div>
        )}
      </div>
    );
  }

  if (!showPopulation) return null;

  return (
    <div
      className={`absolute top-4 left-4 max-w-[160px] text-[8px] p-2.5 rounded-xl backdrop-blur-md border shadow-2xl animate-in fade-in slide-in-from-left-2 transition-all ${darkMode ? 'bg-slate-900/95 border-slate-800 text-slate-300' : 'bg-slate-800/95 text-white border-slate-700'}`}
    >
      <div className={`font-black uppercase mb-2 text-[9px] flex items-center gap-2 ${darkMode ? 'text-indigo-400' : 'text-indigo-300'}`}>
        <Info aria-hidden="true" size={10} /> {hoveredRegion ? 'Concept Review' : 'NHST Model View'}
      </div>

      {!hoveredRegion ? (
        <>
          <p className="mb-2">
            <strong className={darkMode ? 'text-slate-100' : 'text-white'}>Solid Curve:</strong> Null Distribution ($H_0$). Assumes no effect.
          </p>
          <p>
            <strong className={darkMode ? 'text-slate-100' : 'text-white'}>Dashed Curve:</strong> Alternative distribution ($H_1$).
          </p>

          {visualMode === 'power' && (
            <div className={`mt-2 pt-2 border-t ${darkMode ? 'border-slate-800' : 'border-slate-700'}`}>
              <div className="flex justify-between items-center mb-1">
                <div className={`text-[7px] font-black uppercase tracking-tighter ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Hypothesized Effect (Cohen's d)</div>
                <div className="text-[7px] font-bold text-indigo-400">{targetEffect.toFixed(2)}</div>
              </div>
              <input
                aria-label="Hypothesized effect size"
                type="range"
                min="0"
                max="1.2"
                step="0.05"
                value={targetEffect}
                onChange={(event) => setTargetEffect(parseFloat(event.target.value))}
                className={`w-full h-1 rounded-lg appearance-none cursor-pointer accent-indigo-500 mb-1 ${darkMode ? 'bg-slate-800' : 'bg-slate-900'}`}
              />
              <div className={`flex justify-between text-[4.5px] font-bold uppercase px-0.5 ${darkMode ? 'text-slate-600' : 'text-slate-500'}`}>
                <span className={targetEffect === 0 ? 'text-indigo-400' : ''}>Zero</span>
                <span className={Math.abs(targetEffect - 0.2) < 0.05 ? 'text-indigo-400' : ''}>Small (0.2)</span>
                <span className={Math.abs(targetEffect - 0.5) < 0.05 ? 'text-indigo-400' : ''}>Med (0.5)</span>
                <span className={Math.abs(targetEffect - 0.8) < 0.05 ? 'text-indigo-400' : ''}>Large (0.8)</span>
              </div>
            </div>
          )}

          {tails === 2 && (
            <div className={`mt-2 pt-2 border-t ${darkMode ? 'border-slate-800' : 'border-slate-700'}`}>
              <div className={`text-[7px] font-black uppercase mb-1 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Plot Direction</div>
              <div className={`flex p-0.5 rounded border ${darkMode ? 'bg-slate-950/50 border-slate-800' : 'bg-slate-900/50 border-slate-700'}`}>
                <button
                  type="button"
                  aria-pressed={altH1Dir === 'greater'}
                  onClick={() => setAltH1Dir('greater')}
                  className={`flex-1 py-1 rounded text-[7px] font-bold ${altH1Dir === 'greater' ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}
                >
                  +δ
                </button>
                <button
                  type="button"
                  aria-pressed={altH1Dir === 'less'}
                  onClick={() => setAltH1Dir('less')}
                  className={`flex-1 py-1 rounded text-[7px] font-bold ${altH1Dir === 'less' ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}
                >
                  -δ
                </button>
                <button
                  type="button"
                  aria-pressed={showBothH1}
                  onClick={() => setShowBothH1(!showBothH1)}
                  className={`px-1 py-1 rounded text-[7px] font-bold ${showBothH1 ? 'text-indigo-400' : 'text-slate-600'}`}
                >
                  Both
                </button>
              </div>
            </div>
          )}

          {visualMode === 'power' && (
            <div className={`mt-2 pt-2 border-t space-y-1 ${darkMode ? 'border-slate-800' : 'border-slate-600'}`}>
              <p className="flex items-center gap-1.5">
                <span aria-hidden="true" className="w-2 h-2 bg-green-500 rounded-sm" /> <strong className={darkMode ? 'text-slate-100' : 'text-white'}>Power ($1-\beta$):</strong>{' '}
                Correct rejection.
              </p>
              <p className="flex items-center gap-1.5">
                <span aria-hidden="true" className="w-2 h-2 bg-amber-500 rounded-sm" /> <strong className={darkMode ? 'text-slate-100' : 'text-white'}>Beta ($\beta$):</strong> Type
                II Error.
              </p>
              <p className="flex items-center gap-1.5">
                <span aria-hidden="true" className="w-2 h-2 bg-red-400 rounded-sm" /> <strong className={darkMode ? 'text-slate-100' : 'text-white'}>Alpha ($\alpha$):</strong> Type
                I Error.
              </p>
            </div>
          )}
          <div className={`mt-2 text-[7px] italic ${darkMode ? 'text-slate-600' : 'text-slate-400'}`}>Focus or hover shaded regions for details.</div>
        </>
      ) : (
        <div className="animate-in fade-in zoom-in-95 duration-200">
          {hoveredRegion === 'alpha' && (
            <p>
              <strong className="text-red-400">Alpha (Type I Error):</strong> The probability of rejecting the Null Hypothesis when it is actually true (False Positive).
            </p>
          )}
          {hoveredRegion === 'beta' && (
            <p>
              <strong className="text-amber-400">Beta (Type II Error):</strong> The probability of failing to reject the Null Hypothesis when a true effect actually exists (False
              Negative).
            </p>
          )}
          {hoveredRegion === 'power' && (
            <p>
              <strong className="text-green-400">Power (1-Beta):</strong> The probability of correctly rejecting the Null Hypothesis if there is a real effect in the population.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
