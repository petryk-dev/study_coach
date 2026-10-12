import { test } from 'node:test';
import assert from 'node:assert/strict';
import { allowedNumbers, buildPlanPrompt, fallbackPlanText, parsePlanText } from './planText';
import type { PlanTask } from './planTasks';

const tasks: PlanTask[] = [
  { type: 'review', deckId: 1, deckTitle: 'Cell Biology', target: 12 },
  { type: 'review', deckId: 2, deckTitle: 'Organic Chemistry', target: 12 },
  { type: 'quiz', deckId: 1, deckTitle: 'Cell Biology', target: 1 },
];
const prompt = buildPlanPrompt(tasks, { deckTitle: 'Cell Biology', lastQuizPercent: 55 }, 6);
const allowed = allowedNumbers(prompt, tasks);

test('buildPlanPrompt matches the spec format', () => {
  assert.equal(
    prompt,
    'Tasks: review 12 cards in "Cell Biology", review 12 cards in "Organic Chemistry", 1 quiz in "Cell Biology".\n' +
      'Weakest deck: "Cell Biology" (last quiz 55%).\n' +
      'Streak: 6 days.',
  );
});

test('buildPlanPrompt handles a never-quizzed deck, no weakest deck and a 1-day streak', () => {
  const p = buildPlanPrompt(tasks.slice(0, 1), { deckTitle: 'Cell Biology', lastQuizPercent: null }, 1);
  assert.match(p, /Weakest deck: "Cell Biology" \(not quizzed yet\)\./);
  assert.match(p, /Streak: 1 day\.$/);
  assert.doesNotMatch(buildPlanPrompt(tasks.slice(0, 1), null, 0), /Weakest deck/);
});

test('fallback counts only review cards', () => {
  assert.deepEqual(fallbackPlanText(tasks), { headline: 'Review 24 cards today', tip: null });
});

test('allowed numbers: prompt numbers plus the review total (24) and task count (3)', () => {
  assert.deepEqual([...allowed].sort(), ['1', '12', '24', '3', '55', '6']);
});

test('parsePlanText accepts valid text that only uses given numbers', () => {
  assert.deepEqual(
    parsePlanText({ headline: ' Review 24 cards and one quiz ', tip: 'Cell Biology is at 55%, so start there.' }, allowed),
    { headline: 'Review 24 cards and one quiz', tip: 'Cell Biology is at 55%, so start there.' },
  );
});

test('parsePlanText rejects invented numbers', () => {
  assert.equal(parsePlanText({ headline: 'Review 37 cards today', tip: 'Go.' }, allowed), null);
  assert.equal(parsePlanText({ headline: 'Review 12 cards', tip: 'You are 90% there.' }, allowed), null);
});

test('parsePlanText rejects a missing or too long headline, and a too long tip', () => {
  assert.equal(parsePlanText({ tip: 'x' }, allowed), null);
  assert.equal(parsePlanText({ headline: '  ', tip: 'x' }, allowed), null);
  assert.equal(parsePlanText({ headline: 'a'.repeat(81), tip: 'x' }, allowed), null);
  assert.equal(parsePlanText({ headline: 'Short', tip: 'b'.repeat(161) }, allowed), null);
  assert.equal(parsePlanText(null, allowed), null);
});

test('parsePlanText keeps the plan when only the tip is missing', () => {
  assert.deepEqual(parsePlanText({ headline: 'One quiz today' }, allowed), { headline: 'One quiz today', tip: null });
});
