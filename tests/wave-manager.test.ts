import test from 'node:test';
import assert from 'node:assert/strict';
import { WaveManager } from '../src/systems/WaveManager';

test('boss waves occur every fifth wave', () => {
  const waves = new WaveManager();
  for (let wave = 1; wave <= 30; wave += 1) {
    assert.equal(waves.getWaveConfig(wave).isBossWave, wave % 5 === 0);
  }
});

test('enemy count and health scale upward without a fixed wave cap', () => {
  const waves = new WaveManager();
  const early = waves.getWaveConfig(1);
  const late = waves.getWaveConfig(80);
  assert.ok(late.totalEnemies > early.totalEnemies);
  assert.ok(late.healthMultiplier > early.healthMultiplier);
  assert.ok(late.totalEnemies > 0);
});

test('enemy types unlock progressively', () => {
  const waves = new WaveManager();
  assert.ok(!waves.getWaveConfig(1).enemyTypes.includes('healer'));
  assert.ok(waves.getWaveConfig(6).enemyTypes.includes('healer'));
  assert.ok(waves.getWaveConfig(7).enemyTypes.includes('splitter'));
});
