import { test } from 'node:test';
import assert from 'node:assert/strict';
import { nextState, type Grade, type SrsState } from './srs';

const AGAIN: Grade = 0;
const HARD: Grade = 1;
const GOOD: Grade = 2;
const EASY: Grade = 3;

const newCard: SrsState = { ease: 2.5, interval: 0, repetitions: 0, lapses: 0 };
const today = new Date('2026-10-09T00:00:00Z'); // date-only value, as todayInAppTz() returns

const close = (actual: number, expected: number) =>
  assert.ok(Math.abs(actual - expected) < 1e-9, `expected ${expected}, got ${actual}`);

const daysBetween = (a: Date, b: Date) => Math.round((b.getTime() - a.getTime()) / 86_400_000);

test('new card + Good: due tomorrow, ease unchanged', () => {
  const s = nextState(newCard, GOOD, today);
  assert.equal(s.interval, 1);
  assert.equal(s.repetitions, 1);
  assert.equal(s.lapses, 0);
  close(s.ease, 2.5);
});

test('Good, Good, Good: intervals grow 1 → 3 → round(3 × ease)', () => {
  const s1 = nextState(newCard, GOOD, today);
  const s2 = nextState(s1, GOOD, today);
  const s3 = nextState(s2, GOOD, today);
  assert.deepEqual([s1.interval, s2.interval, s3.interval], [1, 3, 8]);
  assert.equal(s3.repetitions, 3);
});

test('Easy raises ease by 0.1', () => {
  close(nextState(newCard, EASY, today).ease, 2.6);
});

test('Hard still counts as remembered but lowers ease by 0.14', () => {
  const s = nextState(newCard, HARD, today);
  assert.equal(s.repetitions, 1);
  assert.equal(s.interval, 1);
  close(s.ease, 2.36);
});

test('Again resets repetitions, sets interval to 1, counts a lapse, lowers ease by 0.54', () => {
  const learned: SrsState = { ease: 2.5, interval: 20, repetitions: 5, lapses: 1 };
  const s = nextState(learned, AGAIN, today);
  assert.equal(s.repetitions, 0);
  assert.equal(s.interval, 1);
  assert.equal(s.lapses, 2);
  close(s.ease, 1.96);
});

test('ease never drops below 1.3', () => {
  let s: SrsState = newCard;
  for (let i = 0; i < 10; i++) s = nextState(s, AGAIN, today);
  close(s.ease, 1.3);
  assert.equal(s.lapses, 10);
});

test('after a lapse, the card relearns from 1 → 3 days', () => {
  const learned: SrsState = { ease: 2.5, interval: 20, repetitions: 5, lapses: 0 };
  const forgot = nextState(learned, AGAIN, today);
  const s1 = nextState(forgot, GOOD, today);
  const s2 = nextState(s1, GOOD, today);
  assert.deepEqual([s1.interval, s2.interval], [1, 3]);
});

test('due_date is today + interval days', () => {
  const s = nextState({ ease: 2.5, interval: 10, repetitions: 3, lapses: 0 }, GOOD, today);
  assert.equal(s.interval, 25);
  assert.equal(daysBetween(today, s.due_date), 25);
});

test('due_date rolls over month ends', () => {
  const jan30 = new Date('2026-01-30T00:00:00Z');
  const s = nextState({ ...newCard, repetitions: 1 }, GOOD, jan30); // interval 3
  assert.equal(s.due_date.toISOString(), '2026-02-02T00:00:00.000Z');
});

test('due_date stays at UTC midnight across the daylight saving change', () => {
  const oct20 = new Date('2026-10-20T00:00:00Z'); // Prague switches to winter time on Oct 25
  const s = nextState({ ease: 2.5, interval: 4, repetitions: 2, lapses: 0 }, GOOD, oct20); // interval 10
  assert.equal(s.due_date.toISOString(), '2026-10-30T00:00:00.000Z');
});

test('does not mutate the input card or date', () => {
  const card = { ...newCard };
  const date = new Date(today);
  nextState(card, AGAIN, date);
  assert.deepEqual(card, newCard);
  assert.equal(date.getTime(), today.getTime());
});
