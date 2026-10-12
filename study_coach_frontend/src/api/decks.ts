import { api } from './client';
import { Deck, DeckDetails, DeckListItem } from './types';

export type PdfFile = { uri: string; name: string; mimeType?: string };

export type CreateDeckInput =
  | { title?: string; text: string }
  | { title?: string; file: PdfFile };

export type DeckFilters = {
  /** Case-insensitive match on the title */
  search?: string;
  /** Only decks with cards due today */
  dueOnly?: boolean;
  sortBy?: 'newest' | 'mostDue' | 'title';
};

/** Same limits as the backend */
export const NOTES_MIN_CHARS = 50;
export const NOTES_MAX_CHARS = 30_000;

// AI generation takes a few seconds, longer for big notes
const GENERATION_TIMEOUT = 120_000;

// ---------- Requests ----------

export const createDeck = async (input: CreateDeckInput) => {
  let body: CreateDeckInput | FormData = input;

  if ('file' in input) {
    body = new FormData();
    // React Native's FormData takes { uri, name, type } for files
    body.append('file', {
      uri: input.file.uri,
      name: input.file.name,
      type: input.file.mimeType ?? 'application/pdf',
    } as unknown as Blob);
    if (input.title) body.append('title', input.title);
  }

  const { data } = await api.post<{ deck: Deck }>('/decks', body, {
    timeout: GENERATION_TIMEOUT,
  });
  return data.deck;
};

/** Newest first */
export const getDecks = async () => (await api.get<{ decks: DeckListItem[] }>('/decks')).data.decks;

export const getDeck = async (deckId: number) =>
  (await api.get<DeckDetails>(`/decks/${deckId}`)).data;

export const deleteDeck = async (deckId: number) => {
  await api.delete(`/decks/${deckId}`);
};

// ---------- Logic ----------

export const filterDecks = (decks: DeckListItem[], filters: DeckFilters = {}) => {
  const search = filters.search?.trim().toLowerCase();

  const result = decks.filter(
    (deck) =>
      (!search || deck.title.toLowerCase().includes(search)) &&
      (!filters.dueOnly || deck.dueCount > 0),
  );

  switch (filters.sortBy) {
    case 'mostDue':
      return result.sort((a, b) => b.dueCount - a.dueCount);
    case 'title':
      return result.sort((a, b) => a.title.localeCompare(b.title));
    default:
      // The API already returns newest first
      return result;
  }
};

/**
 * Splits the AI summary into bullet points: one per line when it's a list,
 * otherwise one per sentence.
 */
export const getSummaryPoints = (summary: string | null) => {
  if (!summary?.trim()) return [];

  const clean = (point: string) => point.replace(/^\s*(?:[-•*]|\d+[.)])\s*/, '').trim();
  const lines = summary.split('\n').map(clean).filter(Boolean);
  if (lines.length > 1) return lines;

  return summary
    .split(/(?<=[.!?])\s+/)
    .map(clean)
    .filter(Boolean);
};

/** The backend needs at least 4 cards to build a quiz */
export const canQuiz = (stats: DeckDetails['stats']) => stats.total >= 4;
