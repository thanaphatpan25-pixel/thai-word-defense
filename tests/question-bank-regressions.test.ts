import test from 'node:test';
import assert from 'node:assert/strict';
import { QUESTION_BANK } from '../src/data/questionBank';

test('true-false questions preserve the authored false answer', () => {
  const expected: Record<string, string> = {
    'spelling-032': 'ผิด',
    'consonant-classes-032': 'ผิด',
  };

  for (const [id, answer] of Object.entries(expected)) {
    const question = QUESTION_BANK.find((item) => item.id === id);
    assert.ok(question, `missing question ${id}`);
    assert.equal(question.type, 'true-false', id);
    assert.equal(question.answer, answer, id);
  }
});
