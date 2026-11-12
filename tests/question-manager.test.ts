import test from 'node:test';
import assert from 'node:assert/strict';
import { QuestionManager } from '../src/systems/QuestionManager';
import type { Question, QuestionCategory } from '../src/data/questionTypes';

const bank: Question[] = Array.from({ length: 5 }, (_, index) => ({
  id: `q-${index}`,
  category: 'spelling',
  difficulty: 1,
  type: 'multiple-choice',
  question: `Question ${index}`,
  choices: ['ก', 'ข', 'ค', 'ง'],
  answer: 'ก',
  explanation: 'คำอธิบาย',
  tags: [],
}));

test('question manager avoids repeating recent questions', () => {
  const manager = new QuestionManager(bank, { recentLimit: 4 });
  const seen = new Set<string>();
  for (let index = 0; index < 4; index += 1) {
    seen.add(manager.next('spelling', 1, 100 + index).id);
  }
  assert.equal(seen.size, 4);
});

test('question manager prioritizes questions the learner got wrong', () => {
  const manager = new QuestionManager(bank, { recentLimit: 0, wrongAnswerWeight: 20 });
  manager.recordAnswer('q-2', false);
  let wrongQuestionShown = false;
  for (let seed = 1; seed <= 30; seed += 1) {
    if (manager.next('spelling', 1, seed).id === 'q-2') wrongQuestionShown = true;
  }
  assert.equal(wrongQuestionShown, true);
  assert.deepEqual(manager.getWeakQuestions(1).map((question) => question.id), ['q-2']);
});

test('question manager filters by category and difficulty', () => {
  const manager = new QuestionManager(bank);
  assert.equal(manager.next('spelling', 1, 3).category, 'spelling');
  assert.equal(manager.next('grammar' as QuestionCategory, 3, 7).category, 'spelling', 'falls back safely when a category is absent');
});
