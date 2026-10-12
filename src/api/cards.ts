import { api } from './client';
import { Card, CardExplanation } from './types';

export type UpdateCardInput = { cardId: number; front?: string; back?: string };

/** "Explain this simply"; cached on the server after the first call */
export const explainCard = async (cardId: number) =>
  (await api.post<CardExplanation>(`/cards/${cardId}/explain`, undefined, { timeout: 60_000 }))
    .data;

export const updateCard = async ({ cardId, ...changes }: UpdateCardInput) =>
  (
    await api.put<{ card: Pick<Card, 'id' | 'deck_id' | 'front' | 'back'> }>(
      `/cards/${cardId}`,
      changes,
    )
  ).data.card;
