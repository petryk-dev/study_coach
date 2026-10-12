import { api } from './client';
import { DueCard, ReviewGrade, ReviewResult } from './types';

export type GradeCardInput = { cardId: number; grade: ReviewGrade };

/** Up to 20 cards due today, oldest first; without deckId, from all decks */
export const getDueCards = async (deckId?: number) =>
  (await api.get<{ cards: DueCard[] }>('/review/due', { params: { deckId } })).data.cards;

export const gradeCard = async ({ cardId, grade }: GradeCardInput) =>
  (await api.post<ReviewResult>(`/review/${cardId}`, { grade })).data;
