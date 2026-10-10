import { Prisma } from '@prisma/client';
import prisma from './db';
import { dueFilter } from './cardFilters';
import {
  allocateReviewTasks,
  computeProgress,
  computeStreak,
  EMPTY_PLAN_HEADLINE,
  MAX_CARDS_PER_DAY,
  pickQuizDeck,
  type PlanTask,
} from './planTasks';
import { allowedNumbers, buildPlanPrompt, fallbackPlanText, parsePlanText, PLAN_SYSTEM_PROMPT, type PlanText, type WeakestDeck } from './planText';
import { chatJSON } from './groq';
import { logError } from '../utils/logger';
import { APP_TIMEZONE, startOfTodayInAppTz, todayInAppTz, toDateString } from '../utils/date';

/**
 * Decides today's tasks from real data: review tasks for decks with due cards
 * (at most 30 cards in total) plus one quiz on the weakest deck.
 * Nothing due → no tasks; the plan then shows EMPTY_PLAN_HEADLINE without calling the AI.
 * Also returns the quiz deck's last score, for the AI's "Weakest deck" line.
 */
export async function buildTasks(userId: number): Promise<{ tasks: PlanTask[]; weakest: WeakestDeck | null }> {
  const [decks, due, attempts] = await Promise.all([
    prisma.decks.findMany({
      where: { user_id: userId },
      select: { id: true, title: true, _count: { select: { cards: true } } },
    }),
    // Same "due" definition as Review and the deck badges
    prisma.cards.groupBy({
      by: ['deck_id'],
      where: { decks: { user_id: userId }, ...dueFilter() },
      _count: { _all: true },
    }),
    // Newest first, so the first attempt seen per deck is its latest
    prisma.quiz_attempts.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
      select: { score: true, total: true, quizzes: { select: { deck_id: true } } },
    }),
  ]);

  if (decks.length === 0 || due.length === 0) return { tasks: [], weakest: null };

  const titles = new Map(decks.map((d) => [d.id, d.title]));
  const dueByDeck = new Map(due.map((d) => [d.deck_id, d._count._all]));
  const lastPercent = new Map<number, number>();
  for (const a of attempts) {
    if (!a.quizzes) continue; // quiz deleted with its deck; the attempt only counts for the streak
    const deckId = a.quizzes.deck_id;
    if (!lastPercent.has(deckId) && a.total > 0) lastPercent.set(deckId, Math.round((a.score / a.total) * 100));
  }

  const tasks: PlanTask[] = allocateReviewTasks(
    due.map((d) => ({ deckId: d.deck_id, dueCount: d._count._all })),
    MAX_CARDS_PER_DAY,
  ).map((t) => ({ type: 'review', deckId: t.deckId, deckTitle: titles.get(t.deckId) ?? '', target: t.target }));

  const quizDeckId = pickQuizDeck(
    decks.map((d) => ({
      deckId: d.id,
      cardCount: d._count.cards,
      dueCount: dueByDeck.get(d.id) ?? 0,
      lastQuizPercent: lastPercent.get(d.id) ?? null,
    })),
  );
  if (quizDeckId === null) return { tasks, weakest: null };

  const deckTitle = titles.get(quizDeckId) ?? '';
  tasks.push({ type: 'quiz', deckId: quizDeckId, deckTitle, target: 1 });
  return { tasks, weakest: { deckTitle, lastQuizPercent: lastPercent.get(quizDeckId) ?? null } };
}

/**
 * The AI turns the facts into a friendly headline and tip. If the call fails or the
 * answer breaks the rules (e.g. invents a number), the plan uses a template instead:
 * the tasks are what matter.
 */
export async function generatePlanText(tasks: PlanTask[], weakest: WeakestDeck | null, streak: number): Promise<PlanText> {
  const prompt = buildPlanPrompt(tasks, weakest, streak);
  try {
    const text = parsePlanText(await chatJSON(PLAN_SYSTEM_PROMPT, prompt), allowedNumbers(prompt, tasks));
    if (text) return text;
    logError('[plan] AI text rejected, using fallback');
  } catch (err) {
    logError('[plan] AI text failed, using fallback', err);
  }
  return fallbackPlanText(tasks);
}

/**
 * Live progress for today's tasks, calculated on every call (never stored):
 * review tasks count today's reviews in that deck, quiz tasks look for a quiz attempt today.
 */
export async function getPlanProgress(userId: number, tasks: PlanTask[]) {
  const since = startOfTodayInAppTz();
  const [reviews, attempts] = await Promise.all([
    prisma.reviews.findMany({
      where: { user_id: userId, reviewed_at: { gte: since } },
      select: { cards: { select: { deck_id: true } } },
    }),
    prisma.quiz_attempts.findMany({
      where: { user_id: userId, created_at: { gte: since } },
      select: { quizzes: { select: { deck_id: true } } },
    }),
  ]);

  // Reviews and attempts whose card or quiz was deleted can't belong to a current task, so they're skipped
  const reviewsByDeck = new Map<number, number>();
  for (const r of reviews) {
    if (r.cards) reviewsByDeck.set(r.cards.deck_id, (reviewsByDeck.get(r.cards.deck_id) ?? 0) + 1);
  }
  const quizzedDecks = new Set(attempts.flatMap((a) => (a.quizzes ? [a.quizzes.deck_id] : [])));

  return computeProgress(tasks, reviewsByDeck, quizzedDecks);
}

/** Current streak: consecutive APP_TIMEZONE days with a review or quiz attempt. */
export async function getStreak(userId: number): Promise<number> {
  // Distinct local days with activity, newest first; a year back is plenty for a streak
  const rows = await prisma.$queryRaw<{ day: string }[]>`
    SELECT day FROM (
      SELECT to_char(reviewed_at AT TIME ZONE ${APP_TIMEZONE}, 'YYYY-MM-DD') AS day FROM reviews WHERE user_id = ${userId}
      UNION
      SELECT to_char(created_at AT TIME ZONE ${APP_TIMEZONE}, 'YYYY-MM-DD') AS day FROM quiz_attempts WHERE user_id = ${userId}
    ) days
    ORDER BY day DESC
    LIMIT 400`;
  return computeStreak(
    rows.map((r) => r.day),
    toDateString(todayInAppTz()),
  );
}

/** Builds today's plan and saves it. If a parallel request saved one first, returns that one. */
async function createTodayPlan(userId: number, date: Date, streak: number) {
  const { tasks, weakest } = await buildTasks(userId);

  // Nothing to do → friendly fixed text, no AI call
  const text = tasks.length === 0 ? { headline: EMPTY_PLAN_HEADLINE, tip: null } : await generatePlanText(tasks, weakest, streak);

  try {
    return await prisma.plans.create({
      data: { user_id: userId, date, tasks: tasks as unknown as Prisma.InputJsonValue, ...text },
    });
  } catch (err) {
    // @@unique([user_id, date]): another request created today's plan at the same moment
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      return prisma.plans.findUniqueOrThrow({ where: { user_id_date: { user_id: userId, date } } });
    }
    throw err;
  }
}

/**
 * Today's saved plan, building it on the first call of the day. Shared by GET /plan/today and
 * the 7:00 job, so opening the app at 6:50 and the job at 7:00 give the same plan.
 */
export async function getOrCreatePlan(userId: number, streak?: number) {
  const date = todayInAppTz();
  const existing = await prisma.plans.findUnique({ where: { user_id_date: { user_id: userId, date } } });
  return existing ?? createTodayPlan(userId, date, streak ?? (await getStreak(userId)));
}

/** GET /plan/today: today's plan with live progress and the streak. */
export async function getTodayPlan(userId: number) {
  const streak = await getStreak(userId);
  const plan = await getOrCreatePlan(userId, streak);

  // Drop tasks for decks deleted since the plan was made
  const savedTasks = plan.tasks as unknown as PlanTask[];
  const deckIds = new Set(
    (await prisma.decks.findMany({ where: { user_id: userId, id: { in: savedTasks.map((t) => t.deckId) } }, select: { id: true } })).map(
      (d) => d.id,
    ),
  );
  const { tasks, progress } = await getPlanProgress(
    userId,
    savedTasks.filter((t) => deckIds.has(t.deckId)),
  );

  return {
    date: toDateString(plan.date),
    headline: plan.headline,
    tip: plan.tip,
    tasks,
    progress,
    streak,
  };
}
