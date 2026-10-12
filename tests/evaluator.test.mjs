import assert from 'node:assert/strict';
import test from 'node:test';
import { fromKevResponse, toKevQuestions } from '../src/evaluator.mjs';

test('boolean questions are sent to Kev as noul', () => {
  const out = toKevQuestions({
    a: { type: 'boolean', instructions: 'x' },
    b: { type: 'choice', instructions: 'y', criteria: { t1: 'one' } },
  });
  assert.equal(out.a.type, 'noul');
  assert.equal(out.b.type, 'choice');
});

test('Kev responses map to AI SDK evaluate shape', () => {
  const r = fromKevResponse({
    model: 'kev-latest',
    answers: {
      a: { type: 'noul', noul: 0.92 },
      b: { type: 'choice', choice: 't1', confidence: 0.4, probabilities: { t1: 0.6, none_of_the_above: 0.4 } },
      c: { type: 'score', score: 2.5, probabilities: { 0: 0.1 } },
    },
    usage: { input_tokens: 79, output_tokens: 5 },
  });
  assert.deepEqual(r.answers.a, { type: 'boolean', probability: 0.92 });
  assert.equal(r.answers.b.choice, 't1');
  assert.equal(r.answers.b.probabilities.t1, 0.6);
  assert.equal(r.answers.c.score, 2.5);
  assert.equal(r.usage.inputTokens, 79);
  assert.equal(r.response.modelId, 'kev:kev-latest');
});
