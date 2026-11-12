import test from 'node:test';
import assert from 'node:assert/strict';
import { GameSimulation } from '../src/systems/GameSimulation';
import { QUESTION_BANK } from '../src/data/questionBank';
import { SaveSystem } from '../src/systems/SaveSystem';

class MemoryStorage {
  private readonly values = new Map<string, string>();
  getItem(key: string): string | null { return this.values.get(key) ?? null; }
  setItem(key: string, value: string): void { this.values.set(key, value); }
  removeItem(key: string): void { this.values.delete(key); }
}

test('simulation starts an endless run and awards the real combo coin reward', () => {
  const simulation = new GameSimulation(QUESTION_BANK, { seed: 123, timerEnabled: false }, new SaveSystem(null));
  simulation.start();
  assert.equal(simulation.phase, 'playing');
  const result = simulation.answerQuestion(simulation.activeQuestion.answer);
  assert.equal(result.correct, true);
  assert.equal(result.reward, 5);
  assert.equal(simulation.getSnapshot().lastAnswer?.correct, true);
  simulation.advanceQuestion();
  assert.equal(simulation.getSnapshot().lastAnswer, null);
});

test('practice mode starts without spawning zombies and restores previously missed questions', () => {
  const storage = new MemoryStorage() as unknown as Storage;
  const save = new SaveSystem(storage);
  const wrongQuestion = QUESTION_BANK[0];
  assert.ok(wrongQuestion);
  const saved = save.load();
  saved.wrongAnswers[wrongQuestion.id] = 2;
  save.save(saved);
  const simulation = new GameSimulation(QUESTION_BANK, { mode: 'practice', seed: 1 }, save);
  simulation.start();
  assert.equal(simulation.phase, 'practice');
  assert.equal(simulation.zombies.length, 0);
  assert.equal(simulation.getReviewList(1)[0]?.id, wrongQuestion.id);
  assert.equal(simulation.activeQuestion.id, wrongQuestion.id, 'practice should start with the weakest question');
});

test('daily mission grants its star once after ten correct answers', () => {
  const simulation = new GameSimulation(QUESTION_BANK, { seed: 88, mode: 'practice', timerEnabled: false }, new SaveSystem(null));
  simulation.start();
  for (let index = 0; index < 10; index += 1) {
    simulation.answerQuestion(simulation.activeQuestion.answer);
    simulation.advanceQuestion();
  }
  assert.equal(simulation.saveData.dailyMission.correct, 10);
  assert.equal(simulation.saveData.dailyMission.claimed, true);
  assert.equal(simulation.saveData.totalStars, 1);
});

test('zombie signs show a distractor rather than revealing the correct answer', () => {
  const simulation = new GameSimulation(QUESTION_BANK, { seed: 321, timerEnabled: false }, new SaveSystem(null));
  simulation.start();
  simulation.update(200);
  simulation.update(200);
  const zombie = simulation.zombies[0];
  assert.ok(zombie);
  assert.notEqual(zombie.wordLabel, simulation.activeQuestion.answer);
  assert.ok(simulation.activeQuestion.choices.includes(zombie.wordLabel ?? ''));
});

test('daily challenge ignores personal weak-question weights for a shared seeded quiz', () => {
  const baseline = new GameSimulation(QUESTION_BANK, { mode: 'daily', seed: 321 }, new SaveSystem(null));
  const storage = new MemoryStorage() as unknown as Storage;
  const save = new SaveSystem(storage);
  const saved = save.load();
  const firstQuestion = QUESTION_BANK[0];
  assert.ok(firstQuestion);
  saved.wrongAnswers[firstQuestion.id] = 500_000;
  save.save(saved);
  const withPersonalHistory = new GameSimulation(QUESTION_BANK, { mode: 'daily', seed: 321 }, save);
  assert.equal(withPersonalHistory.activeQuestion.id, baseline.activeQuestion.id);
});
