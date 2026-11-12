import test from 'node:test';
import assert from 'node:assert/strict';
import { EconomySystem } from '../src/systems/EconomySystem';

test('correct answers award coins and increase combo rewards', () => {
  const economy = new EconomySystem({ correctReward: 5, comboStep: 3, comboBonus: 2 });
  const first = economy.answer(true);
  const second = economy.answer(true);
  const third = economy.answer(true);
  assert.equal(first.coins, 5);
  assert.equal(third.combo, 3);
  assert.equal(third.coins, 7);
  assert.equal(second.combo, 2);
});

test('wrong answers reset combo and apply a temporary speed penalty', () => {
  const economy = new EconomySystem();
  economy.answer(true);
  const result = economy.answer(false);
  assert.equal(result.combo, 0);
  assert.equal(result.coins, 0);
  assert.equal(result.speedBoostMs, 3500);
});

test('combo increases the tower damage multiplier and a wrong answer resets it', () => {
  const economy = new EconomySystem({ comboStep: 3 });
  assert.equal(economy.getDamageMultiplier(), 1);
  economy.answer(true);
  economy.answer(true);
  assert.equal(economy.getDamageMultiplier(), 1);
  economy.answer(true);
  assert.equal(economy.getDamageMultiplier(), 1.25);
  economy.answer(false);
  assert.equal(economy.getDamageMultiplier(), 1);
});
