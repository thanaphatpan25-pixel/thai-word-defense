import test from 'node:test';
import assert from 'node:assert/strict';
import { createGamePanelRenderKey } from '../src/ui/gamePanelRenderKey';

const snapshot = {
  phase: 'playing',
  questionId: 'thai-001',
  message: 'ตอบคำถามให้ถูกนะ',
  towers: [{ id: 'tower-1', type: 'archer', level: 1 }],
  selectedTowerId: null,
  paused: false,
  timerEnabled: true,
  upgradeCardIds: [],
};
const uiState = {
  selectedTower: null,
  lastAnswer: null,
  orderSelection: [],
  soundEnabled: true,
};

test('timer ticks do not invalidate the game panel and replace its buttons', () => {
  const first = createGamePanelRenderKey(snapshot, uiState);
  const nextTimerTick = createGamePanelRenderKey(snapshot, uiState);
  assert.equal(nextTimerTick, first);
});

test('selecting a tower invalidates the panel once to update its selected state', () => {
  const initial = createGamePanelRenderKey(snapshot, uiState);
  const selected = createGamePanelRenderKey(snapshot, { ...uiState, selectedTower: 'archer' });
  assert.notEqual(selected, initial);
});

test('placing a tower invalidates the panel to refresh tower count and selected entity', () => {
  const before = createGamePanelRenderKey(snapshot, { ...uiState, selectedTower: 'archer' });
  const after = createGamePanelRenderKey({
    ...snapshot,
    towers: [...snapshot.towers, { id: 'tower-2', type: 'archer', level: 1 }],
  }, uiState);
  assert.notEqual(after, before);
});

test('question, answer feedback, pause and modal state changes invalidate the panel', () => {
  const baseline = createGamePanelRenderKey(snapshot, uiState);
  assert.notEqual(createGamePanelRenderKey({ ...snapshot, questionId: 'thai-002' }, uiState), baseline);
  assert.notEqual(createGamePanelRenderKey(snapshot, { ...uiState, lastAnswer: { correct: true, explanation: 'ถูกต้อง', reward: 5 } }), baseline);
  assert.notEqual(createGamePanelRenderKey({ ...snapshot, paused: true }, uiState), baseline);
  assert.notEqual(createGamePanelRenderKey({ ...snapshot, phase: 'wave-clear', upgradeCardIds: ['repair'] }, uiState), baseline);
});
