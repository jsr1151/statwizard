import usePersistentCalculatorDraft from './usePersistentCalculatorDraft.js';
import { createSimpleRegressionDraft, readSimpleRegressionDraft, saveSimpleRegressionDraft, removeSimpleRegressionDraft } from '../utils/simpleRegressionDraft.js';

const storage = { analysisId: 'simple_regression', create: createSimpleRegressionDraft, read: readSimpleRegressionDraft, save: saveSimpleRegressionDraft, remove: removeSimpleRegressionDraft };
export default function useSimpleRegressionDraft(example) {
    return usePersistentCalculatorDraft(storage, example);
}
