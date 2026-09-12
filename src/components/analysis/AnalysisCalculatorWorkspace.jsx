import { useEffect, useRef } from 'react';
import AnalysisExclusionReview from './AnalysisExclusionReview.jsx';

export default function AnalysisCalculatorWorkspace({
    darkMode, dataSource, onSourceChange, dataset, datasetSetup,
    savedWorkspace, onOpenDataManager, onStatsChange, children,
}) {
    const calculator = useRef(null);
    const ready = dataSource === 'manual' || datasetSetup.ok;
    const muted = darkMode ? 'text-slate-300' : 'text-slate-600';
    const button = `rounded-xl border px-4 py-2 text-sm font-bold ${darkMode ? 'border-slate-700 text-slate-200' : 'border-slate-300 text-slate-800'}`;

    useEffect(() => {
        if (!ready) onStatsChange?.(null);
    }, [ready, onStatsChange]);

    return (
        <div className="space-y-5">
            <section aria-label="Calculator data source" className={`rounded-2xl border p-4 sm:p-5 ${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
                <h3 className="text-lg font-bold">Choose your data source</h3>
                <div className="mt-3 flex flex-wrap gap-2">
                    {[['manual', 'Example / manual input'], ['saved', 'Saved dataset']].map(([id, label]) => (
                        <button key={id} type="button" aria-pressed={dataSource === id} onClick={() => onSourceChange(id)} className={`${button} ${dataSource === id ? (darkMode ? 'bg-indigo-950 border-indigo-400 text-indigo-100' : 'bg-indigo-50 border-indigo-600 text-indigo-900') : ''}`}>{label}</button>
                    ))}
                    {onOpenDataManager && <button type="button" className={button} onClick={onOpenDataManager}>Import / manage data</button>}
                </div>
                <p className={`mt-3 text-sm ${muted}`}>Changing source reloads the calculator inputs. Save or copy any edits you want to keep first.</p>
                {dataSource === 'manual' ? (
                    <p className={`mt-2 text-sm ${muted}`}><strong>Example starting values.</strong> Replace the values in the calculator to analyze your own data. Results update as you edit.</p>
                ) : (
                    <p className={`mt-2 break-words text-sm ${muted}`}><strong>Selected dataset:</strong> {dataset?.name || 'Choose a saved dataset below.'} {datasetSetup.ok && 'Review the variable roles and exclusions before interpreting the results. Calculator edits do not change the saved dataset.'}</p>
                )}
                {ready && <button type="button" className={`${button} mt-3`} onClick={() => { calculator.current?.focus(); calculator.current?.scrollIntoView?.({ block: 'start' }); }}>Go to calculator</button>}
            </section>
            {dataSource === 'saved' && savedWorkspace}
            {dataSource === 'saved' && <AnalysisExclusionReview review={datasetSetup.rowReview} ready={datasetSetup.ok} darkMode={darkMode} />}
            {ready ? (
                <section key={`${dataSource}:${dataSource === 'saved' ? dataset?.id : ''}`} ref={calculator} tabIndex={-1} aria-label="Active calculator" className="min-w-0 scroll-mt-24">
                    {children}
                </section>
            ) : (
                <p role="status" className={`rounded-xl border p-4 text-sm ${darkMode ? 'border-slate-700 text-slate-300' : 'border-slate-300 text-slate-700'}`}>Choose a dataset and complete the variable roles above to see results for your data.</p>
            )}
        </div>
    );
}
