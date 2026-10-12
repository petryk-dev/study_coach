import { test } from 'node:test';
import assert from 'node:assert/strict';
import { allocateReviewTasks, computeProgress, computeStreak, MAX_CARDS_PER_DAY, pickQuizDeck, type PlanTask } from './planTasks';

test('review tasks: most due first, capped at 30 cards in total', () => {
  const tasks = allocateReviewTasks([
    { deckId: 1, dueCount: 12 },
    { deckId: 2, dueCount: 25 },
    { deckId: 3, dueCount: 8 },
  ]);
  assert.deepEqual(tasks, [
    { deckId: 2, target: 25 },
    { deckId: 1, target: 5 },
  ]);
  assert.equal(tasks.reduce((sum, t) => sum + t.target, 0), MAX_CARDS_PER_DAY);
});

test('review tasks: a week away (120 due) still asks for 30', () => {
  assert.deepEqual(allocateReviewTasks([{ deckId: 7, dueCount: 120 }]), [{ deckId: 7, target: 30 }]);
});

test('review tasks: under the budget, every due card is included', () => {
  assert.deepEqual(allocateReviewTasks([{ deckId: 1, dueCount: 3 }, { deckId: 2, dueCount: 4 }]), [
    { deckId: 2, target: 4 },
    { deckId: 1, target: 3 },
  ]);
});

test('review tasks: nothing due → no tasks', () => {
  assert.deepEqual(allocateReviewTasks([]), []);
  assert.deepEqual(allocateReviewTasks([{ deckId: 1, dueCount: 0 }]), []);
});

test('quiz deck: weakest last score wins', () => {
  assert.equal(
    pickQuizDeck([
      { deckId: 1, cardCount: 10, dueCount: 0, lastQuizPercent: 90 },
      { deckId: 2, cardCount: 10, dueCount: 0, lastQuizPercent: 40 },
      { deckId: 3, cardCount: 10, dueCount: 9, lastQuizPercent: 70 },
    ]),
    2,
  );
});

test('quiz deck: never-quizzed decks come first, then more due cards', () => {
  assert.equal(
    pickQuizDeck([
      { deckId: 1, cardCount: 10, dueCount: 0, lastQuizPercent: 10 },
      { deckId: 2, cardCount: 10, dueCount: 2, lastQuizPercent: null },
      { deckId: 3, cardCount: 10, dueCount: 6, lastQuizPercent: null },
    ]),
    3,
  );
});

test('quiz deck: decks with fewer than 4 cards are skipped', () => {
  assert.equal(pickQuizDeck([{ deckId: 1, cardCount: 3, dueCount: 3, lastQuizPercent: null }]), null);
  assert.equal(pickQuizDeck([]), null);
});

const planTasks: PlanTask[] = [
  { type: 'review', deckId: 3, deckTitle: 'Cell Biology', target: 12 },
  { type: 'review', deckId: 5, deckTitle: 'Organic Chemistry', target: 12 },
  { type: 'quiz', deckId: 3, deckTitle: 'Cell Biology', target: 1 },
];

test('progress: done per task, completed flags, and capped total', () => {
  const r = computeProgress(planTasks, new Map([[3, 12], [5, 4]]), new Set());
  assert.deepEqual(r.tasks.map((t) => [t.done, t.completed]), [[12, true], [4, false], [0, false]]);
  assert.equal(r.progress, 0.64); // (12 + 4 + 0) / 25
});

test('progress: extra reviews beyond a target do not inflate the bar', () => {
  const r = computeProgress(planTasks, new Map([[3, 40]]), new Set());
  assert.equal(r.tasks[0].done, 40);
  assert.equal(r.progress, 0.48); // 12 counted, not 40
});

test('progress: a quiz attempt today completes the quiz task', () => {
  const r = computeProgress(planTasks, new Map([[3, 12], [5, 12]]), new Set([3]));
  assert.ok(r.tasks.every((t) => t.completed));
  assert.equal(r.progress, 1);
});

test('progress: a plan with no tasks is complete', () => {
  assert.deepEqual(computeProgress([], new Map(), new Set()), { tasks: [], progress: 1 });
});

test('streak: consecutive days including today', () => {
  assert.equal(computeStreak(['2026-10-10', '2026-10-09', '2026-10-08', '2026-10-06'], '2026-10-10'), 3);
});

test('streak: nothing yet today still counts the run up to yesterday', () => {
  assert.equal(computeStreak(['2026-10-09', '2026-10-08'], '2026-10-10'), 2);
});

test('streak: a missed day resets it', () => {
  assert.equal(computeStreak(['2026-10-08', '2026-10-07'], '2026-10-10'), 0);
  assert.equal(computeStreak([], '2026-10-10'), 0);
});

test('streak: crosses month and year ends', () => {
  assert.equal(computeStreak(['2027-01-01', '2026-12-31', '2026-12-30'], '2027-01-01'), 3);
});
