import type { Prisma } from '@prisma/client';
import prisma from './db';
import { chatJSON } from './groq';
import {
  buildQuizPrompt,
  cleanQuestions,
  gradeQuiz,
  pickDifficulty,
  QUIZ_SYSTEM_PROMPT,
  shuffle,
  type QuizCard,
  type QuizQuestion,
} from './quizGen';
import { HttpError } from '../utils/httpError';
import { logError } from '../utils/logger';
import { todayInAppTz } from '../utils/date';

const MIN_CARDS = 4;
const WEAK_CARDS = 8;
const RANDOM_CARDS = 4;
const MAX_QUESTIONS = 8;
const RECENT_ATTEMPTS = 3;

// A card counts as weak once the user has forgotten it or found it hard
const isWeak = (card: { lapses: number | null; ease: number | null }) =>
  (card.lapses ?? 0) > 0 || (card.ease ?? 2.5) < 2.5;

/** Up to 8 weakest cards plus up to 4 random others, so the quiz isn't only hard ones. */
async function pickCards(deckId: number): Promise<QuizCard[]> {
  const weakest = await prisma.cards.findMany({
    where: { deck_id: deckId },
    // Postgres sorts NULLs first in DESC order; new cards with no data shouldn't count as weakest
    orderBy: [{ lapses: { sort: 'desc', nulls: 'last' } }, { ease: { sort: 'asc', nulls: 'last' } }, { id: 'asc' }],
    take: WEAK_CARDS,
  });

  const others = await prisma.cards.findMany({
    where: { deck_id: deckId, id: { notIn: weakest.map((c) => c.id) } },
  });

  return [...weakest, ...shuffle(others).slice(0, RANDOM_CARDS)].map((card) => ({
    id: card.id,
    front: card.front,
    back: card.back,
    weak: isWeak(card),
  }));
}

/** Difficulty from the average score of the user's last 3 attempts on this deck. */
async function nextDifficulty(userId: number, deckId: number) {
  const attempts = await prisma.quiz_attempts.findMany({
    where: { user_id: userId, quizzes: { deck_id: deckId } },
    orderBy: { created_at: 'desc' },
    take: RECENT_ATTEMPTS,
    select: { score: true, total: true },
  });
  return pickDifficulty(attempts.filter((a) => a.total > 0).map((a) => a.score / a.total));
}

/**
 * Generates a quiz for one of the user's decks and saves it with the answers.
 * The response leaves out correctIndex and explanation, so answers can't be read from the network.
 */
export async function createQuiz(userId: number, deckId: number) {
  const deck = await prisma.decks.findFirst({
    where: { id: deckId, user_id: userId },
    select: { id: true, _count: { select: { cards: true } } },
  });
  if (!deck) throw new HttpError(404, 'Deck not found', 'NOT_FOUND');
  if (deck._count.cards < MIN_CARDS) {
    throw new HttpError(422, 'Add more cards before taking a quiz', 'NOT_ENOUGH_CARDS');
  }

  const [cards, difficulty] = await Promise.all([pickCards(deckId), nextDifficulty(userId, deckId)]);
  // Never ask for more questions than there are cards
  const questionCount = Math.min(MAX_QUESTIONS, cards.length);

  let raw: { questions?: unknown };
  try {
    raw = await chatJSON(QUIZ_SYSTEM_PROMPT, buildQuizPrompt(cards, difficulty, questionCount));
  } catch (err) {
    logError('[quiz] generation failed', err);
    throw new HttpError(502, 'Quiz generation failed, please try again', 'GENERATION_FAILED');
  }

  const questions = cleanQuestions(
    Array.isArray(raw.questions) ? raw.questions : [],
    cards.map((c) => c.id),
  ).slice(0, MAX_QUESTIONS);
  if (questions.length === 0) {
    throw new HttpError(502, 'Quiz generation failed, please try again', 'GENERATION_FAILED');
  }

  const quiz = await prisma.quizzes.create({
    data: {
      deck_id: deckId,
      difficulty,
      questions: questions as unknown as Prisma.InputJsonValue,
    },
  });

  return {
    quizId: quiz.id,
    difficulty,
    questions: questions.map(({ question, options }) => ({ question, options })),
  };
}

/**
 * Checks the answers, saves the attempt, and returns the full review.
 * Cards behind wrong answers become due today, so they show up in Review again.
 */
export async function submitQuiz(userId: number, quizId: number, answers: number[]) {
  const quiz = await prisma.quizzes.findFirst({ where: { id: quizId, decks: { user_id: userId } } });
  if (!quiz) throw new HttpError(404, 'Quiz not found', 'NOT_FOUND');

  const questions = quiz.questions as unknown as QuizQuestion[];
  if (answers.length !== questions.length) {
    throw new HttpError(400, `Expected ${questions.length} answers, got ${answers.length}`, 'VALIDATION_ERROR');
  }

  // One attempt per quiz: after seeing the results, a resubmit would just copy the answers
  const already = await prisma.quiz_attempts.findFirst({ where: { quiz_id: quizId, user_id: userId } });
  if (already) throw new HttpError(409, 'This quiz was already submitted', 'ALREADY_SUBMITTED');

  // Last attempt on the same deck, for "up from 60% last time"
  const previous = await prisma.quiz_attempts.findFirst({
    where: { user_id: userId, quizzes: { deck_id: quiz.deck_id } },
    orderBy: { created_at: 'desc' },
    select: { score: true, total: true },
  });

  const { score, total, results, wrongCardIds } = gradeQuiz(questions, answers);
  const today = todayInAppTz();

  const [, requeued] = await prisma.$transaction([
    prisma.quiz_attempts.create({ data: { quiz_id: quizId, user_id: userId, score, total, answers } }),
    // Only pull due dates forward: a card already overdue stays overdue
    prisma.cards.updateMany({
      where: {
        id: { in: wrongCardIds },
        deck_id: quiz.deck_id,
        OR: [{ due_date: { gt: today } }, { due_date: null }],
      },
      data: { due_date: today },
    }),
  ]);

  return {
    score,
    total,
    previousPercent: previous && previous.total > 0 ? Math.round((previous.score / previous.total) * 100) : null,
    cardsToReview: requeued.count,
    results,
  };
}
