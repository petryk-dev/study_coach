import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildQuizPrompt, cleanQuestions, gradeQuiz, pickDifficulty, shuffle, type QuizQuestion } from './quizGen';

const valid = {
  question: 'What do mitochondria produce?',
  options: ['ATP', 'DNA', 'Glucose', 'Oxygen'],
  correctIndex: 0,
  explanation: 'Mitochondria produce ATP.',
};

test('pickDifficulty follows the score table', () => {
  assert.equal(pickDifficulty([]), 'medium');
  assert.equal(pickDifficulty([0.2, 0.4, 0.6]), 'easy'); // avg 40%
  assert.equal(pickDifficulty([0.5]), 'medium'); // exactly 50%
  assert.equal(pickDifficulty([0.7, 0.8, 0.9]), 'medium'); // exactly 80%
  assert.equal(pickDifficulty([0.9, 1, 0.8]), 'hard'); // avg 90%
});

test('cleanQuestions keeps a valid question and its correct answer after shuffling', () => {
  const [q] = cleanQuestions([valid]);
  assert.equal(q.question, valid.question);
  assert.deepEqual([...q.options].sort(), [...valid.options].sort());
  assert.equal(q.options[q.correctIndex], 'ATP');
  assert.equal(q.explanation, valid.explanation);
});

test('cleanQuestions drops malformed questions', () => {
  const bad = [
    null,
    'string',
    { ...valid, question: '   ' },
    { ...valid, question: 42 },
    { ...valid, options: ['A', 'B', 'C'] }, // 3 options
    { ...valid, options: ['A', 'B', 'C', 'D', 'E'] }, // 5 options
    { ...valid, options: ['A', 'B', 'C', 4] }, // non-string option
    { ...valid, options: ['A', 'B', ' ', 'D'] }, // empty option
    { ...valid, options: ['ATP', 'atp', 'C', 'D'] }, // duplicate option
    { ...valid, correctIndex: 4 },
    { ...valid, correctIndex: -1 },
    { ...valid, correctIndex: 1.5 },
    { ...valid, correctIndex: '0' },
  ];
  assert.equal(cleanQuestions(bad).length, 0);
});

test('cleanQuestions drops duplicate questions and tolerates a missing explanation', () => {
  const { explanation: _, ...noExplanation } = valid;
  const result = cleanQuestions([noExplanation, { ...valid, question: 'what do  mitochondria produce?' }]);
  assert.equal(result.length, 1);
  assert.equal(result[0].explanation, '');
});

test('shuffling moves the correct answer around (not always first)', () => {
  const positions = new Set<number>();
  for (let i = 0; i < 200; i++) positions.add(cleanQuestions([valid])[0].correctIndex);
  assert.deepEqual([...positions].sort(), [0, 1, 2, 3]);
});

test('shuffle returns a new array with the same items', () => {
  const input = [1, 2, 3, 4, 5];
  const out = shuffle(input);
  assert.deepEqual([...out].sort(), input);
  assert.deepEqual(input, [1, 2, 3, 4, 5]);
});

test('buildQuizPrompt marks weak cards', () => {
  const prompt = buildQuizPrompt(
    [
      { id: 10, front: 'What do mitochondria produce?', back: 'ATP', weak: true },
      { id: 11, front: 'What makes proteins?', back: 'Ribosomes', weak: false },
    ],
    'medium',
    2,
  );
  assert.equal(
    prompt,
    'Difficulty: medium. Create 2 questions from these flashcards:\n' +
      '1. [WEAK] Q: What do mitochondria produce? A: ATP\n' +
      '2. Q: What makes proteins? A: Ribosomes',
  );
});

test('cleanQuestions maps the 1-based cardIndex to a card id', () => {
  const ids = [10, 11, 12];
  const [a, b, c, d] = cleanQuestions(
    [
      { ...valid, question: 'q1', cardIndex: 2 },
      { ...valid, question: 'q2', cardIndex: 9 }, // out of range
      { ...valid, question: 'q3' }, // missing
      { ...valid, question: 'q4', cardIndex: '1' }, // not a number
    ],
    ids,
  );
  assert.deepEqual([a.cardId, b.cardId, c.cardId, d.cardId], [11, null, null, null]);
});

const stored: QuizQuestion[] = [
  { question: 'q1', options: ['a', 'b', 'c', 'd'], correctIndex: 1, explanation: 'e1', cardId: 10 },
  { question: 'q2', options: ['a', 'b', 'c', 'd'], correctIndex: 3, explanation: 'e2', cardId: 11 },
  { question: 'q3', options: ['a', 'b', 'c', 'd'], correctIndex: 0, explanation: 'e3', cardId: null },
  { question: 'q4', options: ['a', 'b', 'c', 'd'], correctIndex: 2, explanation: 'e4', cardId: 10 },
];

test('gradeQuiz counts the score and builds the review', () => {
  const r = gradeQuiz(stored, [1, 0, 0, 3]);
  assert.equal(r.score, 2);
  assert.equal(r.total, 4);
  assert.deepEqual(r.results.map((x) => x.isCorrect), [true, false, true, false]);
  assert.deepEqual(r.results[1], {
    question: 'q2',
    options: ['a', 'b', 'c', 'd'],
    chosen: 0,
    correct: 3,
    isCorrect: false,
    explanation: 'e2',
  });
});

test('gradeQuiz lists each wrongly answered card once, skipping questions without a card', () => {
  assert.deepEqual(gradeQuiz(stored, [0, 0, 1, 0]).wrongCardIds, [10, 11]);
  assert.deepEqual(gradeQuiz(stored, [1, 3, 0, 2]).wrongCardIds, []);
});
