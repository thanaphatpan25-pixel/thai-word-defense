import test from 'node:test';
import assert from 'node:assert/strict';
import { QUESTION_BANK } from '../src/data/questionBank';
import { CATEGORY_LABELS, type QuestionCategory } from '../src/data/questionTypes';

test('question bank contains at least 30 questions in each requested category', () => {
  for (const category of Object.keys(CATEGORY_LABELS) as QuestionCategory[]) {
    assert.ok(QUESTION_BANK.filter((question) => question.category === category).length >= 30, category);
  }
});

test('all requested question interaction formats appear in the bank', () => {
  const types = new Set(QUESTION_BANK.map((question) => question.type));
  for (const type of ['multiple-choice', 'fill-blank', 'true-false', 'matching', 'order']) assert.ok(types.has(type as never), type);
});

test('every category contains all three difficulty levels', () => {
  for (const category of Object.keys(CATEGORY_LABELS) as QuestionCategory[]) {
    const levels = new Set(QUESTION_BANK.filter((question) => question.category === category).map((question) => question.difficulty));
    for (const level of [1, 2, 3]) assert.ok(levels.has(level as 1 | 2 | 3), `${category} difficulty ${level}`);
  }
});

test('all questions have explanations and a valid answer option', () => {
  for (const question of QUESTION_BANK) {
    assert.ok(question.explanation.trim(), question.id);
    if (question.type === 'order') {
      for (const word of question.answer.split('|')) assert.ok(question.choices.includes(word), question.id);
    } else {
      assert.ok(question.choices.includes(question.answer), question.id);
    }
  }
});
