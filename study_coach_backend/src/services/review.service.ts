import prisma from './db';
import { nextState, type Grade } from './srs';
import { HttpError } from '../utils/httpError';
import { toDateString } from '../utils/date';
import { dueFilter } from './cardFilters';

const DUE_LIMIT = 20;

/**
 * Cards due today or earlier (today in APP_TIMEZONE) from the user's decks, oldest first.
 * Without deckId, returns due cards across all decks ("Continue session" on Home).
 */
export async function getDueCards(userId: number, deckId?: number) {
  return prisma.cards.findMany({
    where: {
      decks: { user_id: userId },
      ...(deckId && { deck_id: deckId }),
      ...dueFilter(),
    },
    orderBy: [{ due_date: 'asc' }, { id: 'asc' }],
    take: DUE_LIMIT,
    select: { id: true, front: true, back: true, deck_id: true },
  });
}

/** Applies SM-2 to the card and records the review, both in one transaction. */
export async function reviewCard(userId: number, cardId: number, grade: Grade) {
  const card = await prisma.cards.findFirst({ where: { id: cardId, decks: { user_id: userId } } });
  if (!card) throw new HttpError(404, 'Card not found', 'NOT_FOUND');

  // SM-2 columns are nullable in the database, so fall back to new-card values
  const next = nextState(
    {
      ease: card.ease ?? 2.5,
      interval: card.interval ?? 0,
      repetitions: card.repetitions ?? 0,
      lapses: card.lapses ?? 0,
    },
    grade,
  );

  await prisma.$transaction([
    prisma.cards.update({
      where: { id: card.id },
      data: {
        ease: next.ease,
        interval: next.interval,
        repetitions: next.repetitions,
        lapses: next.lapses,
        due_date: next.due_date,
      },
    }),
    prisma.reviews.create({ data: { card_id: card.id, user_id: userId, grade } }),
  ]);

  return { nextDue: toDateString(next.due_date), interval: next.interval };
}
