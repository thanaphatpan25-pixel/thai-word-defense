import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createGamePanelRenderKey,
  type GamePanelRenderState,
} from '../src/ui/gamePanelRenderKey';

const baseState: GamePanelRenderState = {
  phase: 'playing',
  questionId: 'thai-001',
  message: 'ตอบคำถามให้ถูกนะ',
  towers: [{ id: 'tower-1', type: 'archer', level: 1 }],
  selectedTowerId: null,
  paused: false,
  timerEnabled: true,
  upgradeCardIds: [],
  selectedTower: null,
  lastAnswer: null,
  orderSelection: [],
  soundEnabled: true,
};

test('timer ticks do not invalidate the game panel and replace its buttons', () => {
  const first = createGamePanelRenderKey(baseState);
  const nextTimerTick = createGamePanelRenderKey(baseState);
  assert.equal(nextTimerTick, first);
});

test('selecting a tower invalidates the panel once to update its selected state', () => {
  const initial = createGamePanelRenderKey(baseState);
  const selected = createGamePanelRenderKey({ ...baseState, selectedTower: 'archer' });
  assert.notEqual(selected, initial);
});

test('placing a tower invalidates the panel to refresh tower count and selected entity', () => {
  const before = createGamePanelRenderKey({ ...baseState, selectedTower: 'archer' });
  const after = createGamePanelRenderKey({
    ...baseState,
    selectedTower: null,
    towers: [...baseState.towers, { id: 'tower-2', type: 'archer', level: 1 }],
  });
  assert.notEqual(after, before);
});

test('question, answer feedback, pause and modal state changes invalidate the panel', () => {
  const baseline = createGamePanelRenderKey(baseState);
  assert.notEqual(createGamePanelRenderKey({ ...baseState, questionId: 'thai-002' }), baseline);
  assert.notEqual(createGamePanelRenderKey({
    ...baseState,
    lastAnswer: { correct: true, explanation: 'ถูกต้อง', reward: 5 },
  }), baseline);
  assert.notEqual(createGamePanelRenderKey({ ...baseState, paused: true }), baseline);
  assert.notEqual(createGamePanelRenderKey({
    ...baseState,
    phase: 'wave-clear',
    upgradeCardIds: ['repair'],
  }), baseline);
});
