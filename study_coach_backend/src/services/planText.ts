import type { PlanTask } from './planTasks';

export interface WeakestDeck {
  deckTitle: string;
  lastQuizPercent: number | null; // null = never quizzed
}

export interface PlanText {
  headline: string;
  tip: string | null;
}

export const PLAN_SYSTEM_PROMPT = `You are an encouraging study coach writing a short daily plan message.

Rules:
- "headline": one short sentence summarizing today's tasks, under 60 characters.
- "tip": one practical sentence, under 120 characters, based only on the stats given.
- Use only the numbers and deck names given. Never invent numbers.
- Friendly and calm, no exclamation marks overload, no emojis.

Respond only with JSON: {"headline":"...","tip":"..."}`;

// Some slack over the prompt's limits; anything longer falls back to the template
const MAX_HEADLINE_CHARS = 80;
const MAX_TIP_CHARS = 160;

/** The facts the AI may use, in the format from the spec. */
export function buildPlanPrompt(tasks: PlanTask[], weakest: WeakestDeck | null, streak: number): string {
  const taskText = tasks
    .map((t) => (t.type === 'review' ? `review ${t.target} cards in "${t.deckTitle}"` : `1 quiz in "${t.deckTitle}"`))
    .join(', ');

  const lines = [`Tasks: ${taskText}.`];
  if (weakest) {
    const score = weakest.lastQuizPercent === null ? 'not quizzed yet' : `last quiz ${weakest.lastQuizPercent}%`;
    lines.push(`Weakest deck: "${weakest.deckTitle}" (${score}).`);
  }
  lines.push(`Streak: ${streak} ${streak === 1 ? 'day' : 'days'}.`);
  return lines.join('\n');
}

/** Used when the AI fails or its answer doesn't pass the checks. */
export function fallbackPlanText(tasks: PlanTask[]): PlanText {
  const total = tasks.filter((t) => t.type === 'review').reduce((sum, t) => sum + t.target, 0);
  return { headline: `Review ${total} cards today`, tip: null };
}

const numbersIn = (text: string) => text.match(/\d+/g) ?? [];

/**
 * Numbers the AI may use: everything in the prompt, plus totals it can honestly
 * work out from it (all review cards, number of tasks).
 */
export function allowedNumbers(prompt: string, tasks: PlanTask[]): Set<string> {
  const reviewTotal = tasks.filter((t) => t.type === 'review').reduce((sum, t) => sum + t.target, 0);
  return new Set([...numbersIn(prompt), String(reviewTotal), String(tasks.length)]);
}

/**
 * Accepts the AI's text only if the headline is a non-empty string, both fields are within
 * length limits, and every number in them is allowed (no invented numbers).
 * Returns null otherwise, so the caller can use the fallback.
 */
export function parsePlanText(raw: unknown, allowed: Set<string>): PlanText | null {
  if (!raw || typeof raw !== 'object') return null;
  const { headline, tip } = raw as Record<string, unknown>;

  if (typeof headline !== 'string' || !headline.trim()) return null;
  const cleanHeadline = headline.trim();
  const cleanTip = typeof tip === 'string' && tip.trim() ? tip.trim() : null;

  if (cleanHeadline.length > MAX_HEADLINE_CHARS) return null;
  if (cleanTip && cleanTip.length > MAX_TIP_CHARS) return null;

  const used = [...numbersIn(cleanHeadline), ...numbersIn(cleanTip ?? '')];
  if (used.some((n) => !allowed.has(n))) return null;

  return { headline: cleanHeadline, tip: cleanTip };
}
