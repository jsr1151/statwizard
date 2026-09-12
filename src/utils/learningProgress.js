import { LEARNING_PATH } from '../data/learningPath.js';
import { readStoredJson, writeStoredJson } from './storage.js';

export const LEARNING_PROGRESS_KEY = 'statwizard.learning-progress';
export const createLearningProgress = () => ({ currentLesson: LEARNING_PATH[0].id, answers: {} });
const isRecord = value => value !== null && typeof value === 'object' && !Array.isArray(value);
export const isLearningProgress = value => isRecord(value)
    && LEARNING_PATH.some(lesson => lesson.id === value.currentLesson)
    && isRecord(value.answers)
    && Object.entries(value.answers).every(([lessonId, answers]) => {
        const lesson = LEARNING_PATH.find(item => item.id === lessonId);
        return lesson && isRecord(answers) && Object.entries(answers).every(([questionId, answer]) =>
            lesson.questions.some(question => question.id === questionId && question.options.some(option => option.id === answer)));
    });

export const readLearningProgress = () => readStoredJson({
    key: LEARNING_PROGRESS_KEY, version: 1, fallback: createLearningProgress, validate: isLearningProgress,
});
export const saveLearningProgress = value => writeStoredJson({ key: LEARNING_PROGRESS_KEY, version: 1, value });
export const isLessonComplete = (lesson, answers) => lesson.questions.every(question => answers?.[question.id] === question.correct);
