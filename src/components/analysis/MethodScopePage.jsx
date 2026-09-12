import { AlertTriangle } from 'lucide-react';
import { METHOD_AVAILABILITY } from '../../data/methodAvailability.js';

export default function MethodScopePage({ step, section, darkMode }) {
    const method = METHOD_AVAILABILITY[step.id];
    return (
        <div className={`space-y-6 [overflow-wrap:anywhere] ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
            <section className={`rounded-2xl border p-5 ${darkMode ? 'bg-amber-950/30 border-amber-700 text-amber-100' : 'bg-amber-50 border-amber-300 text-amber-950'}`}>
                <h3 className="flex items-center gap-2 text-lg font-bold"><AlertTriangle aria-hidden="true" size={20} /> {step.id === 'res_unsupported_design' ? 'Design not supported' : 'Learning and software guide'}</h3>
                <p className="mt-3 font-semibold">{method.limitation}</p>
                {section === 'power' && <p className="mt-3">Repeated-measures power is also unavailable here. Planning requires the repeated-observation correlation and nonsphericity assumptions; an independent-groups sample-size estimate is not an equivalent calculation.</p>}
            </section>
            <section>
                <h3 className="text-xl font-bold">How this method works</h3>
                <p className="mt-3 leading-relaxed">{method.summary}</p>
                <ul className="mt-4 list-disc space-y-2 pl-6">{method.checklist.map(item => <li key={item}>{item}</li>)}</ul>
            </section>
            {step.software && <section>
                <h3 className="text-xl font-bold">Run the analysis in statistical software</h3>
                <p className="mt-2">Adapt variable names to your data. Check the assumptions and software output before reporting the result.</p>
                <div className="mt-4 grid min-w-0 gap-4 lg:grid-cols-2">
                    {Object.entries(step.software).map(([name, instructions]) => (
                        <div key={name} className={`min-w-0 rounded-xl border p-4 ${darkMode ? 'bg-slate-950 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                            <h4 className="font-bold">{({ r: 'R', spss: 'SPSS', jasp: 'JASP', excel: 'Excel', google_sheets: 'Google Sheets' })[name] || name}</h4>
                            <pre className="mt-3 whitespace-pre-wrap break-words font-mono text-sm leading-relaxed">{instructions}</pre>
                        </div>
                    ))}
                </div>
                <a className="mt-4 inline-block underline underline-offset-4" href={step.id === 'res_rm_anova' ? 'https://stat.ethz.ch/R-manual/R-release/library/stats/html/aov.html' : 'https://stat.ethz.ch/R-manual/R-release/library/stats/html/wilcox.test.html'}>Read the official R method reference</a>
            </section>}
        </div>
    );
}
