import type { Prisma } from '@prisma/client';
import { todayInAppTz } from '../utils/date';

// Shared definitions, so "due" and "mastered" mean the same thing on every screen.

export const MASTERED_INTERVAL_DAYS = 21;

/** Due: due_date on or before today (APP_TIMEZONE). Cards without a due date count as due. */
export function dueFilter(today = todayInAppTz()): Prisma.cardsWhereInput {
  return { OR: [{ due_date: { lte: today } }, { due_date: null }] };
}

/** Mastered: remembered well enough to wait three weeks or more. */
export const masteredFilter: Prisma.cardsWhereInput = { interval: { gte: MASTERED_INTERVAL_DAYS } };
