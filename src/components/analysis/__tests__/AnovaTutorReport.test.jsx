// @vitest-environment jsdom
import { act, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import AppOverlays from '../../app/AppOverlays.jsx';
import { calculateOneWayCalculator } from '../../../stats/oneWayCalculator.js';
import { createOneWayDraft } from '../../../utils/oneWayDraft.js';
import { buildOneWayReport } from '../../../stats/oneWayReport.js';
vi.mock('../../tutor/AnovaTutorPanel.jsx',()=>({default:({onAction})=><button onClick={()=>onAction('generate_apa_report')}>Generate report</button>}));
globalThis.IS_REACT_ACT_ENVIRONMENT=true;
let root,container,props,currentStats;
beforeEach(()=>{container=document.createElement('main');document.body.appendChild(container);root=createRoot(container);props={darkMode:false,currentStepId:'res_one_way_anova',isAnovaActive:true,anovaTutor:{activeTip:{id:'report'},dismissTip:vi.fn()},factorialAnovaTutor:{},ancovaTutor:{}};});
afterEach(async()=>{await act(async()=>root.unmount());container.remove();vi.restoreAllMocks();});
const model=alpha=>({...calculateOneWayCalculator({...createOneWayDraft(),inputMode:'f',f:{F:4.2,df1:1.5,df2:8.3},alpha}),source:'Lesson: supplied F'});
const draw = () => root.render(<Suspense fallback={<p>Loading</p>}><AppOverlays {...props} currentStats={currentStats} /></Suspense>);
const mount=async stats=>act(async()=>{ currentStats=stats; props.setActiveExplanation = next => { props.activeExplanation=next; draw(); }; draw(); });
const click=async text=>{
    await act(async()=>[...document.querySelectorAll('button')].find(node=>node.textContent===text).click());
    if(text==='Generate report') for(let i=0;i<50&&!document.querySelector('dialog');i++) await act(async()=>new Promise(resolve=>setTimeout(resolve,20)));
};
it('uses the selected alpha and supplied-F report without inventing eta squared',async()=>{
    const stats=model(.1);await mount(stats);await click('Generate report');const dialog=document.querySelector('dialog');expect(dialog.textContent).toContain(buildOneWayReport({result:stats,source:stats.source}));expect(dialog.textContent).toContain('Reject the null');expect(dialog.textContent).not.toContain('eta squared =');
});
it('updates an open report as inputs change and removes stale output for invalid inputs',async()=>{
    await mount(model(.1));await click('Generate report');await mount(model(.05));expect(document.querySelector('dialog').textContent).toContain('Do not reject');expect(document.querySelector('dialog').textContent).toContain('alpha = 0.05');
    await mount(null);expect(document.querySelector('dialog').textContent).toContain('Complete valid one-way ANOVA');expect(document.querySelector('dialog').textContent).not.toContain('F(1.5');expect(document.querySelector('dialog').textContent).not.toContain('Copy tutor report');
});
it('provides report fallback and restores focus when the report is closed',async()=>{
    await mount(model(.1));const trigger=container.querySelector('button');trigger.focus();await click('Generate report');Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:vi.fn(async()=>{throw Error('denied');})}});await click('Copy tutor report');expect(document.querySelector('textarea[readonly]').value).toContain('alpha = 0.1');await click('Close');expect(document.querySelector('dialog')).toBeNull();expect(document.activeElement).toBe(trigger);
});
it('opens from the lesson action even with automatic tutor tips disabled',async()=>{
    props.isAnovaActive=false;await mount(model(.1));await act(async()=>window.dispatchEvent(new CustomEvent('anovaTutorAction',{detail:'generate_apa_report'})));
    for(let i=0;i<50&&!document.querySelector('dialog');i++)await act(async()=>new Promise(resolve=>setTimeout(resolve,20)));
    expect(document.querySelector('dialog').textContent).toContain('alpha = 0.1');
});
it('does not open a one-way report action on an unrelated analysis page',async()=>{
    props.currentStepId='res_factorial_anova';props.isAnovaActive=false;await mount(model(.1));await act(async()=>window.dispatchEvent(new CustomEvent('anovaTutorAction',{detail:'generate_apa_report'})));expect(document.querySelector('dialog')).toBeNull();
});
it('locks background scrolling only while the dialog is open and restores prior styles',async()=>{
    document.body.style.overflow='auto';document.documentElement.style.overflow='visible';await mount(model(.1));await click('Generate report');expect(document.body.style.overflow).toBe('hidden');expect(document.documentElement.style.overflow).toBe('hidden');await click('Close');expect(document.body.style.overflow).toBe('auto');expect(document.documentElement.style.overflow).toBe('visible');document.body.style.overflow='';document.documentElement.style.overflow='';
});
