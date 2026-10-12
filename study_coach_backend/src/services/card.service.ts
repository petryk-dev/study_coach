import prisma from './db';
import { chatJSON } from './groq';
import { buildExplainPrompt, EXPLAIN_SYSTEM_PROMPT, parseExplanation, type Explanation } from './explainGen';
import { HttpError } from '../utils/httpError';
import { logError } from '../utils/logger';
import type { UpdateCardInput } from '../schemas/card.schema';

async function findOwnCard(userId: number, cardId: number) {
  const card = await prisma.cards.findFirst({ where: { id: cardId, decks: { user_id: userId } } });
  if (!card) throw new HttpError(404, 'Card not found', 'NOT_FOUND');
  return card;
}

/**
 * "Explain this simply". The result is cached on the card, so asking again
 * is instant and doesn't call the AI.
 */
export async function explainCard(userId: number, cardId: number): Promise<Explanation & { cached: boolean }> {
  const card = await findOwnCard(userId, cardId);

  if (card.explanation && card.explanation_example) {
    return { explanation: card.explanation, example: card.explanation_example, cached: true };
  }

  let result: Explanation | null;
  try {
    result = parseExplanation(await chatJSON(EXPLAIN_SYSTEM_PROMPT, buildExplainPrompt(card.front, card.back)));
  } catch (err) {
    logError('[explain] generation failed', err);
    result = null;
  }
  if (!result) throw new HttpError(502, 'Could not explain this card, please try again', 'GENERATION_FAILED');

  await prisma.cards.update({
    where: { id: card.id },
    data: { explanation: result.explanation, explanation_example: result.example },
  });

  return { ...result, cached: false };
}

/** Edits a card's text. The cached explanation no longer matches, so it's cleared. */
export async function updateCard(userId: number, cardId: number, { front, back }: UpdateCardInput) {
  await findOwnCard(userId, cardId);

  return prisma.cards.update({
    where: { id: cardId },
    data: { front, back, explanation: null, explanation_example: null },
    select: { id: true, deck_id: true, front: true, back: true },
  });
}
