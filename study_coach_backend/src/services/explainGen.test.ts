import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildExplainPrompt, parseExplanation } from './explainGen';

test('buildExplainPrompt formats the card as Q/A', () => {
  assert.equal(buildExplainPrompt('What makes proteins?', 'Ribosomes'), 'Q: What makes proteins?\nA: Ribosomes');
});

test('parseExplanation accepts two non-empty strings and trims them', () => {
  assert.deepEqual(parseExplanation({ explanation: ' Simple. ', example: ' Like a factory. ', extra: 1 }), {
    explanation: 'Simple.',
    example: 'Like a factory.',
  });
});

test('parseExplanation rejects missing, empty or non-string fields', () => {
  for (const bad of [
    null,
    'text',
    {},
    { explanation: 'x' },
    { example: 'x' },
    { explanation: '  ', example: 'x' },
    { explanation: 'x', example: '' },
    { explanation: 1, example: 'x' },
    { explanation: 'x', example: ['y'] },
  ]) {
    assert.equal(parseExplanation(bad), null, JSON.stringify(bad));
  }
});
