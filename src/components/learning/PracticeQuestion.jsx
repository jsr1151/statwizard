import { useState } from 'react';

export default function PracticeQuestion({ question, answer, onCheck, darkMode }) {
    const [selection, setSelection] = useState(answer || '');
    const submitted = selection === answer ? question.options.find(option => option.id === answer) : null;
    const correct = answer === question.correct;
    return (
        <form onSubmit={event => { event.preventDefault(); if (selection) onCheck(selection); }} className="space-y-3">
            <fieldset className="space-y-2">
                <legend className="font-bold mb-3">{question.prompt}</legend>
                {question.options.map(option => (
                    <label key={option.id} className={`flex items-start gap-3 p-3 border rounded-xl cursor-pointer ${darkMode ? 'border-slate-700 bg-slate-900' : 'border-slate-300 bg-white'}`}>
                        <input type="radio" name={question.id} value={option.id} checked={selection === option.id} onChange={() => setSelection(option.id)} className="mt-1 shrink-0 accent-indigo-600" />
                        <span>{option.text}</span>
                    </label>
                ))}
            </fieldset>
            <button type="submit" disabled={!selection} className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold disabled:opacity-50">Check answer</button>
            <div aria-live="polite" aria-atomic="true">
                {submitted && <p className={`p-3 rounded-xl ${darkMode ? 'bg-slate-800 text-slate-100' : 'bg-slate-100 text-slate-900'}`}>
                    <strong>{correct ? 'Correct. ' : 'Try again. '}</strong>{submitted.feedback}
                </p>}
            </div>
        </form>
    );
}
