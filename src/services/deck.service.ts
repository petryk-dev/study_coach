import prisma from './db';
import { generateCards, generateSummary } from './cardGen';
import { HttpError } from '../utils/httpError';
import { logError } from '../utils/logger';
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
      cards: { create: cards },
    },
    include: { cards: { orderBy: { id: 'asc' } } },
  });
}

export async function listDecks(userId: number) {
  const decks = await prisma.decks.findMany({
    where: { user_id: userId },
    orderBy: { created_at: 'desc' },
    select: { id: true, title: true, summary: true, created_at: true, _count: { select: { cards: true } } },
  });
  return decks.map(({ _count, ...deck }) => ({ ...deck, card_count: _count.cards }));
}

export async function getDeck(userId: number, deckId: number) {
  const deck = await prisma.decks.findFirst({
    where: { id: deckId, user_id: userId },
    include: { cards: { orderBy: { id: 'asc' } } },
  });
  if (!deck) throw new HttpError(404, 'Deck not found', 'NOT_FOUND');
  return deck;
}

export async function deleteDeck(userId: number, deckId: number): Promise<void> {
  // Cards are removed by the database's ON DELETE CASCADE
  const { count } = await prisma.decks.deleteMany({ where: { id: deckId, user_id: userId } });
  if (count === 0) throw new HttpError(404, 'Deck not found', 'NOT_FOUND');
}
