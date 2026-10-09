import prisma from './db';
import { generateCards, generateSummary } from './cardGen';
import { HttpError } from '../utils/httpError';
import { logError } from '../utils/logger';
import { todayInAppTz } from '../utils/date';
import { dueFilter, masteredFilter } from './cardFilters';
import type { CreateDeckInput } from '../schemas/deck.schema';

// First line of the notes, shortened, when the user didn't give a title.
function titleFromText(text: string): string {
  const firstLine = text.split('\n').find((line) => line.trim())?.trim() ?? 'Untitled deck';
  return firstLine.length > 60 ? `${firstLine.slice(0, 57)}...` : firstLine;
}

/** Generates cards and a summary from the notes and saves them as a new deck. */
export async function createDeck(userId: number, { title, text }: CreateDeckInput) {
  let cards, summary;
  try {
    [cards, summary] = await Promise.all([generateCards(text), generateSummary(text)]);
  } catch (err) {
    logError('[decks] generation failed', err);
    throw new HttpError(502, 'Card generation failed, please try again', 'GENERATION_FAILED');
  }

  if (cards.length === 0) {
    throw new HttpError(422, "Couldn't create any cards from these notes. Try adding more detail", 'NO_CARDS');
  }

  return prisma.decks.create({
    data: {
      user_id: userId,
      title: title ?? titleFromText(text),
      source_text: text,
      summary,
      // Due today in the app timezone (the column default uses the database's UTC date)
      cards: { create: cards.map((card) => ({ ...card, due_date: todayInAppTz() })) },
    },
    include: { cards: { orderBy: { id: 'asc' } } },
  });
}

/** The user's decks with card and due counts (for the "12 due" badge on Home). */
export async function listDecks(userId: number) {
  const [decks, due] = await Promise.all([
    prisma.decks.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
      select: { id: true, title: true, summary: true, created_at: true, _count: { select: { cards: true } } },
    }),
    // _count can't count the same relation twice with different filters,
    // so due counts for all decks come from one grouped query
    prisma.cards.groupBy({
      by: ['deck_id'],
      where: { decks: { user_id: userId }, ...dueFilter() },
      _count: { _all: true },
    }),
  ]);

  const dueByDeck = new Map(due.map((d) => [d.deck_id, d._count._all]));
  return decks.map(({ _count, ...deck }) => ({
    ...deck,
    card_count: _count.cards,
    dueCount: dueByDeck.get(deck.id) ?? 0,
  }));
}

/** Numbers for the Deck screen: Due today / Mastered / Last quiz. */
async function getDeckStats(userId: number, deckId: number, total: number) {
  const [due, mastered, lastAttempt] = await Promise.all([
    prisma.cards.count({ where: { deck_id: deckId, ...dueFilter() } }),
    prisma.cards.count({ where: { deck_id: deckId, ...masteredFilter } }),
    prisma.quiz_attempts.findFirst({
      where: { user_id: userId, quizzes: { deck_id: deckId } },
      orderBy: { created_at: 'desc' },
      select: { score: true, total: true },
    }),
  ]);

  return {
    total,
    due,
    mastered,
    // null until the first quiz; the app shows "—"
    lastQuizPercent:
      lastAttempt && lastAttempt.total > 0 ? Math.round((lastAttempt.score / lastAttempt.total) * 100) : null,
  };
}

export async function getDeck(userId: number, deckId: number) {
  const deck = await prisma.decks.findFirst({
    where: { id: deckId, user_id: userId },
    include: { cards: { orderBy: { id: 'asc' } } },
  });
  if (!deck) throw new HttpError(404, 'Deck not found', 'NOT_FOUND');
  return { deck, stats: await getDeckStats(userId, deckId, deck.cards.length) };
}

export async function deleteDeck(userId: number, deckId: number): Promise<void> {
  // Cards are removed by the database's ON DELETE CASCADE
  const { count } = await prisma.decks.deleteMany({ where: { id: deckId, user_id: userId } });
  if (count === 0) throw new HttpError(404, 'Deck not found', 'NOT_FOUND');
}
