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
