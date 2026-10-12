import { api } from './client';
import { Quiz, QuizDifficulty, QuizResult } from './types';

export type SubmitQuizInput = { quizId: number; answers: number[] };

// The AI writes the questions, which takes a few seconds
const GENERATION_TIMEOUT = 60_000;

// ---------- Requests ----------

/** Generates a new quiz on every call (rate limited) */
export const createQuiz = async (deckId: number) =>
  (await api.post<Quiz>(`/quiz/${deckId}`, undefined, { timeout: GENERATION_TIMEOUT })).data;

/** answers: one chosen option index (0–3) per question, in order */
export const submitQuiz = async ({ quizId, answers }: SubmitQuizInput) =>
  (await api.post<QuizResult>(`/quiz/${quizId}/submit`, { answers })).data;

// ---------- Logic ----------

export const formatDifficulty = (difficulty: QuizDifficulty) =>
  difficulty.charAt(0).toUpperCase() + difficulty.slice(1);

export const getScorePercent = ({ score, total }: Pick<QuizResult, 'score' | 'total'>) =>
  total ? Math.round((score / total) * 100) : 0;

/** e.g. "75% — up from 60% last time. Next quiz will be a bit harder." */
export const getScoreSummary = (result: QuizResult) => {
  const percent = getScorePercent(result);
  const previous = result.previousPercent;

  let comparison = 'your first quiz on this deck.';
  if (previous !== null) {
    if (percent > previous) comparison = `up from ${previous}% last time.`;
    else if (percent < previous) comparison = `down from ${previous}% last time.`;
    else comparison = 'same as last time.';
  }

  // Mirrors the backend: difficulty adapts to recent scores (above 80% → hard, below 50% → easy)
  let next = '';
  if (percent > 80) next = ' Next quiz will be a bit harder.';
  else if (percent < 50) next = ' Next quiz will be a bit easier.';

  return `${percent}% — ${comparison}${next}`;
};
