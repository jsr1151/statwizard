import { useEffect, useRef, useState } from 'react';
import { BookOpen, CheckCircle } from 'lucide-react';
import { LEARNING_PATH } from '../../data/learningPath.js';
import { createLearningProgress, isLessonComplete, readLearningProgress, saveLearningProgress } from '../../utils/learningProgress.js';
import PracticeQuestion from '../learning/PracticeQuestion.jsx';

export default function LessonsView({ darkMode, onOpenModule }) {
    const [progress, setProgress] = useState(readLearningProgress);
    const [saved, setSaved] = useState(true);
    const [confirmReset, setConfirmReset] = useState(false);
    const [resetCount, setResetCount] = useState(0);
    const heading = useRef(null);
    const resetButton = useRef(null);
    const previousLesson = useRef(progress.currentLesson);
    const index = LEARNING_PATH.findIndex(lesson => lesson.id === progress.currentLesson);
    const lesson = LEARNING_PATH[index];
    const completed = LEARNING_PATH.filter(item => isLessonComplete(item, progress.answers[item.id])).length;
    const complete = isLessonComplete(lesson, progress.answers[lesson.id]);
    const surface = darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200';
    const muted = darkMode ? 'text-slate-300' : 'text-slate-600';
    const secondary = `px-4 py-2 rounded-lg border font-semibold ${darkMode ? 'border-slate-600 hover:bg-slate-800' : 'border-slate-300 hover:bg-slate-100'}`;

    useEffect(() => { setSaved(saveLearningProgress(progress)); }, [progress]);
    useEffect(() => {
        if (previousLesson.current !== progress.currentLesson) heading.current?.focus();
        previousLesson.current = progress.currentLesson;
    }, [progress.currentLesson]);

    const openLesson = id => {
        if (id === progress.currentLesson) heading.current?.focus();
        setProgress(current => ({ ...current, currentLesson: id }));
    };
    const checkAnswer = (questionId, answer) => setProgress(current => ({
        ...current, answers: { ...current.answers, [lesson.id]: { ...current.answers[lesson.id], [questionId]: answer } },
    }));

    return (
        <div className={`max-w-6xl mx-auto py-4 space-y-6 ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>
            <header className="space-y-3">
                <p className={`flex items-center gap-2 font-semibold ${muted}`}><BookOpen aria-hidden="true" className="w-5 h-5" /> From data to a first inference</p>
                <h2 className="text-3xl md:text-5xl font-black">Learning Lab</h2>
                <p className={muted}>Five short lessons, worked examples, and practice with feedback. About 25 minutes; no previous statistics course needed.</p>
                <p>Answer both practice questions correctly to complete a lesson. You can explore any lesson in any order.</p>
                <div className="flex flex-wrap gap-x-4 gap-y-2 items-center">
                    <label htmlFor="learning-progress" className="font-bold">{completed} of {LEARNING_PATH.length} lessons complete</label>
                    <progress id="learning-progress" max={LEARNING_PATH.length} value={completed} className="w-48 max-w-full accent-indigo-600" />
                </div>
                <p role="status" className={`text-sm ${muted}`}>{saved ? 'Your checked answers and place are saved in this browser. Clearing site data removes progress; it does not sync to other devices.' : 'Progress could not be saved in this browser. You can keep learning, but this session’s changes may be lost when you leave or reload.'}</p>
                <button className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold" onClick={() => heading.current?.focus()}>{completed === LEARNING_PATH.length ? 'Review this lesson' : Object.keys(progress.answers).length || index > 0 ? 'Continue learning' : 'Start learning'}</button>
                {completed === LEARNING_PATH.length && <p className={`rounded-xl p-4 font-semibold ${darkMode ? 'bg-emerald-950 text-emerald-200' : 'bg-emerald-50 text-emerald-900'}`}>Path complete! You have practiced the foundations of a one-sample inference. Review any lesson or use the module links to explore further.</p>}
            </header>

            <div className="grid lg:grid-cols-[260px_minmax(0,1fr)] gap-6 items-start">
                <nav aria-label="Learning path" className={`rounded-2xl border p-4 ${surface}`}>
                    <h3 className="font-bold mb-3">Your learning path</h3>
                    <ol className="space-y-2">
                        {LEARNING_PATH.map((item, itemIndex) => {
                            const done = isLessonComplete(item, progress.answers[item.id]);
                            return <li key={item.id}>
                                <button onClick={() => openLesson(item.id)} aria-current={item.id === lesson.id ? 'step' : undefined}
                                    className={`w-full text-left rounded-xl p-3 border ${item.id === lesson.id ? (darkMode ? 'border-indigo-400 bg-indigo-950' : 'border-indigo-600 bg-indigo-50') : 'border-transparent hover:border-slate-400'}`}>
                                    <span className="block font-semibold">{itemIndex + 1}. {item.title}</span>
                                    <span className={`flex items-center gap-1 mt-1 text-sm ${muted}`}>{done && <CheckCircle aria-hidden="true" className="w-4 h-4" />}{done ? 'Complete' : `${item.minutes} min · ${progress.answers[item.id] ? 'In progress' : 'Ready to start'}`}</span>
                                </button>
                            </li>;
                        })}
                    </ol>
                    <div className="mt-5 border-t border-slate-400/40 pt-4 space-y-3">
                        <button ref={resetButton} className="underline text-sm" aria-expanded={confirmReset} onClick={() => setConfirmReset(!confirmReset)}>Reset learning progress</button>
                        {confirmReset && <div className="space-y-3">
                            <p className="text-sm">Remove all checked answers and start this path again?</p>
                            <button className={secondary} onClick={() => { setProgress(createLearningProgress()); setResetCount(count => count + 1); setConfirmReset(false); heading.current?.focus(); }}>Reset all lessons</button>
                            <button className={secondary} onClick={() => { setConfirmReset(false); resetButton.current?.focus(); }}>Keep progress</button>
                        </div>}
                    </div>
                </nav>

                <article aria-labelledby="learning-lesson-title" className={`min-w-0 rounded-2xl border p-5 md:p-8 space-y-6 ${surface}`}>
                    <div className="space-y-2">
                        <p className={`text-sm font-semibold ${muted}`}>Lesson {index + 1} of {LEARNING_PATH.length} · About {lesson.minutes} minutes</p>
                        <h3 id="learning-lesson-title" tabIndex={-1} ref={heading} className="text-2xl md:text-3xl font-bold">{lesson.title}</h3>
                        <p className={muted}>{lesson.objective}</p>
                    </div>
                    <div className="space-y-3 leading-relaxed">{lesson.paragraphs.map(text => <p key={text}>{text}</p>)}</div>
                    <section aria-label="Worked example" className={`rounded-xl p-4 md:p-5 space-y-3 ${darkMode ? 'bg-slate-800' : 'bg-slate-50'}`}>
                        <h4 className="font-bold">Worked example: {lesson.exampleTitle}</h4>
                        <ol className="list-decimal pl-5 space-y-3 leading-relaxed">{lesson.example.map(text => <li key={text}>{text}</li>)}</ol>
                    </section>
                    <p className={`border-l-4 border-indigo-500 pl-4 ${muted}`}><strong>Keep in mind: </strong>{lesson.takeaway}</p>
                    <section aria-label="Practice" className="space-y-6">
                        <h4 className="text-xl font-bold">Check your understanding</h4>
                        {lesson.questions.map(question => <PracticeQuestion key={`${lesson.id}-${question.id}-${resetCount}`} question={question}
                            answer={progress.answers[lesson.id]?.[question.id]} darkMode={darkMode} onCheck={answer => checkAnswer(question.id, answer)} />)}
                    </section>
                    <p role="status" className="font-semibold">{complete ? 'Lesson complete. You can continue or review your answers.' : 'Complete both practice questions to mark this lesson complete.'}</p>
                    <div className="flex flex-wrap gap-3">
                        {index > 0 && <button className={secondary} onClick={() => openLesson(LEARNING_PATH[index - 1].id)}>Previous lesson</button>}
                        {index < LEARNING_PATH.length - 1 && <button className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold" onClick={() => openLesson(LEARNING_PATH[index + 1].id)}>Next lesson</button>}
                    </div>
                    <section aria-label="Continue exploring" className="border-t border-slate-400/40 pt-5 space-y-3">
                        <h4 className="font-bold">Continue exploring</h4>
                        {lesson.moduleNote && <p className={`text-sm ${muted}`}>{lesson.moduleNote}</p>}
                        <div className="flex flex-wrap gap-3">{lesson.links.map(link => <button key={link.step} className={`${secondary} text-left`} onClick={() => onOpenModule(link.step, { section: link.section === undefined ? 'lessons' : link.section })}>{link.label}</button>)}</div>
                        <p className={`text-sm ${muted}`}>Return to Learning Lab from the menu to pick up where you left off.</p>
                    </section>
                </article>
            </div>
        </div>
    );
}
