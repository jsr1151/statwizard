// @vitest-environment jsdom
import { act, StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import LessonsView from '../../navigation/LessonsView.jsx';
import { LEARNING_PATH } from '../../../data/learningPath.js';
import { LEARNING_PROGRESS_KEY, readLearningProgress } from '../../../utils/learningProgress.js';
import { STEPS } from '../../../data/wizardSteps.js';
import { getResultPage } from '../../../routing/resultPageConfig.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
let container, root, onOpenModule;
beforeEach(() => {
    localStorage.clear();
    container = document.createElement('main'); document.body.appendChild(container);
    root = createRoot(container); onOpenModule = vi.fn();
});
afterEach(async () => {
    await act(async () => root.unmount()); container.remove(); vi.restoreAllMocks(); localStorage.clear();
});
const mount = async () => act(async () => root.render(<StrictMode><LessonsView darkMode={false} onOpenModule={onOpenModule} /></StrictMode>));
const click = async text => act(async () => [...container.querySelectorAll('button')].find(node => node.textContent === text).click());
const select = async (question, answer) => act(async () => container.querySelector(`input[name="${question}"][value="${answer}"]`).click());
const check = async question => act(async () => container.querySelector(`input[name="${question}"]`).closest('form').querySelector('button').click());
const reopen = async () => {
    await act(async () => root.unmount()); root = createRoot(container); await mount();
};

it('requires checked correct answers, gives targeted feedback, and resumes partial progress after remount', async () => {
    await mount();
    expect(container.querySelector('form button').disabled).toBe(true);
    await select('numeric-label', 'quantitative'); await check('numeric-label');
    expect(container.textContent).toContain('Try again. The codes are labels.');
    expect(container.querySelector('progress').value).toBe(0);
    await select('numeric-label', 'nominal');
    expect(container.textContent).not.toContain('Try again.');
    expect(container.querySelector('progress').value).toBe(0);
    await check('numeric-label'); await click('Next lesson');
    expect(document.activeElement.id).toBe('learning-lesson-title');
    await reopen();
    expect(container.querySelector('article h3').textContent).toBe('Describe center and spread');
    await click('Previous lesson');
    expect(container.querySelector('input[value="nominal"]').checked).toBe(true);
    expect(container.textContent).toContain('Correct. Travel modes');
    await select('independence', 'people'); await check('independence');
    expect(container.querySelector('progress').value).toBe(1);
    // A changed selection only changes recorded progress when checked.
    await select('numeric-label', 'ordinal');
    expect(container.querySelector('progress').value).toBe(1);
    await check('numeric-label');
    expect(container.querySelector('progress').value).toBe(0);
});

it('supports the full path, review, module exploration, canceling reset, and confirmed reset', async () => {
    await mount();
    for (const [index, lesson] of LEARNING_PATH.entries()) {
        for (const question of lesson.questions) { await select(question.id, question.correct); await check(question.id); }
        expect(container.querySelector('progress').value).toBe(index + 1);
        for (const link of lesson.links) {
            await click(link.label);
            expect(onOpenModule).toHaveBeenLastCalledWith(link.step, { section: link.section === undefined ? 'lessons' : link.section });
        }
        if (index < LEARNING_PATH.length - 1) await click('Next lesson');
    }
    expect(container.textContent).toContain('Path complete!');
    await reopen(); expect(container.querySelector('progress').value).toBe(5);
    await click('Reset learning progress'); await click('Keep progress');
    expect(container.querySelector('progress').value).toBe(5);
    expect(document.activeElement.textContent).toBe('Reset learning progress');
    await click('Reset learning progress'); await click('Reset all lessons');
    expect(container.querySelector('progress').value).toBe(0);
    expect(container.querySelectorAll('input:checked')).toHaveLength(0);
    expect(document.activeElement.id).toBe('learning-lesson-title');
    expect(readLearningProgress().answers).toEqual({});
    // Reset while already on lesson one also clears the local radio selection.
    await select('numeric-label', 'nominal'); await check('numeric-label');
    await click('Reset learning progress'); await click('Reset all lessons');
    expect(container.querySelectorAll('input:checked')).toHaveLength(0);
});

it.each([
    'not json', 'null', '[]',
    JSON.stringify({ version: 2, data: { currentLesson: 'data-types', answers: {} } }),
    JSON.stringify({ currentLesson: 'missing', answers: {} }),
    JSON.stringify({ currentLesson: 'data-types', answers: { 'data-types': { 'numeric-label': 'bad-option' } } }),
    JSON.stringify({ currentLesson: 'data-types', answers: { 'data-types': null } }),
])('recovers safely from invalid stored progress: %s', async serialized => {
    localStorage.setItem(LEARNING_PROGRESS_KEY, serialized); await mount();
    expect(container.querySelector('article h3').textContent).toBe('Start with the data');
    expect(container.querySelector('progress').value).toBe(0);
});

it('keeps practice usable and explains when browser storage fails', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('Blocked'); });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('Quota'); });
    await mount();
    expect(container.textContent).toContain('Progress could not be saved');
    for (const question of LEARNING_PATH[0].questions) { await select(question.id, question.correct); await check(question.id); }
    expect(container.querySelector('progress').value).toBe(1);
    await click('Next lesson'); expect(container.querySelector('article h3').textContent).toBe('Describe center and spread');
});

it('lets learners open later lessons without completing earlier ones', async () => {
    await mount();
    await act(async () => container.querySelectorAll('nav[aria-label="Learning path"] li button')[4].click());
    expect(container.querySelector('article h3').textContent).toBe('Make a one-sample inference');
    expect(container.querySelector('progress').value).toBe(0);
});

it('connects each lesson to an available module section', () => {
    for (const lesson of LEARNING_PATH) for (const link of lesson.links) {
        expect(STEPS[link.step]?.type).toBe('result');
        const sections = getResultPage(link.step).availableResultSections.map(section => section.id);
        if (link.section === null) expect(sections).toHaveLength(0);
        else expect(sections).toContain(link.section || 'lessons');
    }
});
