import React from 'react';
import { BookOpen, ArrowRight, CheckCircle } from 'lucide-react';
const LessonsView = ({ darkMode }) => (
  <div className="max-w-4xl mx-auto py-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
    <div className="text-center mb-12">
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 text-amber-500 text-xs font-black uppercase tracking-widest mb-6">
        <Compass className="w-3 h-3" /> Coming Soon
      </div>
      <h2 className={`text-5xl font-black mb-4 ${darkMode ? 'text-white' : 'text-slate-900'}`}>Learning Lab</h2>
      <p className={`text-xl font-light max-w-2xl mx-auto ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
        A structured, interactive journey from basic distribution principles to master-level inferential statistics.
      </p>
    </div>

    <div className="grid gap-6">
      {[
        { title: 'Level 1: The Foundations', desc: 'Understanding Mean, SD, and the majestic Normal Distribution.', status: 'Designing...' },
        { title: 'Level 2: Inference & Uncertainty', desc: 'Standard Errors, Confidence Intervals, and the Logic of Alpha.', status: 'Planning...' },
        { title: 'Level 3: The T-Test Ritual', desc: 'Comparing groups with limited data and degrees of freedom.', status: 'Locked' }
      ].map((lesson, i) => (
        <div key={i} className={`p-8 rounded-3xl border-2 border-dashed ${darkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-slate-50/50 border-slate-200'} opacity-60`}>
          <div className="flex justify-between items-start mb-4">
            <h3 className={`text-2xl font-black ${darkMode ? 'text-slate-300' : 'text-slate-800'}`}>{lesson.title}</h3>
            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${darkMode ? 'bg-slate-800 text-slate-500' : 'bg-white border text-slate-400'}`}>{lesson.status}</span>
          </div>
          <p className={`text-sm ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>{lesson.desc}</p>
        </div>
      ))}
    </div>
  </div>
);

export default LessonsView;
