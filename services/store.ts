
import { State, ThirdParty, Assessment, EvidenceChunk, EvaluationAI, EvaluationHuman } from '../types';

const STORAGE_KEY = 'tprm_app_state_v1';

const INITIAL_STATE: State = {
  providers: [],
  assessments: [],
  evidences: [],
  aiEvaluations: {},
  humanEvaluations: {}
};

export const loadState = (): State => {
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved ? JSON.parse(saved) : INITIAL_STATE;
};

export const saveState = (state: State) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

export const clearState = () => {
  localStorage.removeItem(STORAGE_KEY);
  window.location.reload();
};
