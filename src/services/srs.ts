import { addDays, todayInAppTz } from '../utils/date';

export type Grade = 0 | 1 | 2 | 3; // Again, Hard, Good, Easy

export interface SrsState {
  ease: number;
  interval: number;     // days
  repetitions: number;
  lapses: number;
}

// today is a date-only value (UTC midnight), see utils/date.ts
export function nextState(card: SrsState, grade: Grade, today = todayInAppTz()) {
  const q = [1, 3, 4, 5][grade];   // map buttons to SM-2 quality
  let { ease, interval, repetitions, lapses } = card;

  if (q < 3) {                      // Again: forgot it
    repetitions = 0;
    interval = 1;
    lapses += 1;
  } else {
    if (repetitions === 0) interval = 1;
    else if (repetitions === 1) interval = 3;
    else interval = Math.round(interval * ease);
    repetitions += 1;
  }

  ease = Math.max(1.3, ease + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)));

  return { ease, interval, repetitions, lapses, due_date: addDays(today, interval) };
}
