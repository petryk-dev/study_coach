export const queryKeys = {
  me: ['me'] as const,
  decks: ['decks'] as const,
  deck: (deckId: number) => ['decks', deckId] as const,
  dueCardsAll: ['review', 'due'] as const,
  dueCards: (deckId?: number) => ['review', 'due', deckId ?? 'all'] as const,
  todayPlan: ['plan', 'today'] as const,
};
