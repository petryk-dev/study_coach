// Pure task-building rules for Today's plan. The code decides the tasks;
// the AI only writes the friendly text around them.

export const MAX_CARDS_PER_DAY = 30;
export const MIN_CARDS_FOR_QUIZ = 4;

export const EMPTY_PLAN_HEADLINE = 'All caught up! Add new notes or take a quiz.';

export type PlanTask =
  | { type: 'review'; deckId: number; deckTitle: string; target: number }
  | { type: 'quiz'; deckId: number; deckTitle: string; target: 1 };

export interface DeckDue {
  deckId: number;
  dueCount: number;
}

export interface QuizCandidate {
  deckId: number;
  cardCount: number;
  dueCount: number;
  lastQuizPercent: number | null; // null = never quizzed
}

/**
 * Spreads the daily card budget over decks, most due first. If 120 cards are due after a week
 * away, the plan asks for 30; the rest stays due for tomorrow.
 */
export function allocateReviewTasks(due: DeckDue[], budget = MAX_CARDS_PER_DAY) {
  const sorted = [...due].filter((d) => d.dueCount > 0).sort((a, b) => b.dueCount - a.dueCount || a.deckId - b.deckId);
  const tasks: { deckId: number; target: number }[] = [];

  for (const d of sorted) {
    if (budget <= 0) break;
    const target = Math.min(d.dueCount, budget);
    tasks.push({ deckId: d.deckId, target });
    budget -= target;
  }
  return tasks;
}

/**
 * The deck to quiz today: the weakest last quiz score. Decks never quizzed come first
 * (their level is unknown), then more due cards, then more cards. Needs 4+ cards.
 */
export function pickQuizDeck(candidates: QuizCandidate[]): number | null {
  const eligible = candidates.filter((c) => c.cardCount >= MIN_CARDS_FOR_QUIZ);
  if (eligible.length === 0) return null;

  const score = (c: QuizCandidate) => c.lastQuizPercent ?? -1; // never quizzed sorts first
  eligible.sort(
    (a, b) => score(a) - score(b) || b.dueCount - a.dueCount || b.cardCount - a.cardCount || a.deckId - b.deckId,
  );
  return eligible[0].deckId;
}

export type PlanTaskProgress = PlanTask & { done: number; completed: boolean };

/**
 * Live progress. reviewsByDeck: reviews done today per deck; quizzedDecks: decks with a quiz
 * attempt today. progress = total done ÷ total target, with each task's done capped at its target.
 * A plan with no tasks counts as complete.
 */
export function computeProgress(
  tasks: PlanTask[],
  reviewsByDeck: Map<number, number>,
  quizzedDecks: Set<number>,
): { tasks: PlanTaskProgress[]; progress: number } {
  const withProgress = tasks.map((t) => {
    const done = t.type === 'review' ? (reviewsByDeck.get(t.deckId) ?? 0) : quizzedDecks.has(t.deckId) ? 1 : 0;
    return { ...t, done, completed: done >= t.target };
  });

  const target = withProgress.reduce((sum, t) => sum + t.target, 0);
  const done = withProgress.reduce((sum, t) => sum + Math.min(t.done, t.target), 0);
  const progress = target === 0 ? 1 : Math.round((done / target) * 100) / 100;

  return { tasks: withProgress, progress };
}

/**
 * Consecutive days with any study activity, counting back from today. If nothing was done
 * today yet, counting starts from yesterday, so the streak doesn't show 0 every morning.
 * activeDays: "YYYY-MM-DD" dates (APP_TIMEZONE) with at least one review or quiz attempt.
 */
export function computeStreak(activeDays: string[], today: string): number {
  const days = new Set(activeDays);
  const previous = (day: string) => {
    const d = new Date(`${day}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() - 1);
    return d.toISOString().slice(0, 10);
  };

  let day = days.has(today) ? today : previous(today);
  let streak = 0;
  while (days.has(day)) {
    streak++;
    day = previous(day);
  }
  return streak;
}
