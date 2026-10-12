// All "today" logic uses one fixed timezone, so the server's own timezone never matters.
export const APP_TIMEZONE = process.env.APP_TIMEZONE || 'Europe/Prague';

const ymdFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: APP_TIMEZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/**
 * Today's calendar date in APP_TIMEZONE, as a Date at UTC midnight.
 * That's the form Prisma reads and writes for DATE columns like cards.due_date.
 */
export function todayInAppTz(now = new Date()): Date {
  return new Date(`${ymdFormatter.format(now)}T00:00:00Z`); // en-CA formats as YYYY-MM-DD
}

/** Adds whole days to a date-only value (UTC midnight). */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

/** Formats a date-only value as "YYYY-MM-DD". */
export function toDateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

const partsFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: APP_TIMEZONE,
  hourCycle: 'h23',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
});

// How far APP_TIMEZONE is ahead of UTC at a given moment, in ms (e.g. +2h in Prague summer).
function tzOffsetMs(at: Date): number {
  const p = Object.fromEntries(partsFormatter.formatToParts(at).map((x) => [x.type, x.value]));
  const asUtc = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second);
  return asUtc - Math.floor(at.getTime() / 1000) * 1000;
}

/**
 * The exact moment today began in APP_TIMEZONE, for comparing timestamp columns
 * (reviews.reviewed_at, quiz_attempts.created_at). In Prague: 22:00 or 23:00 UTC the day before.
 */
export function startOfTodayInAppTz(now = new Date()): Date {
  const midnightAsUtc = todayInAppTz(now).getTime();
  let start = midnightAsUtc - tzOffsetMs(new Date(midnightAsUtc));
  // On daylight saving days the offset at midnight can differ from the first guess
  start = midnightAsUtc - tzOffsetMs(new Date(start));
  return new Date(start);
}
