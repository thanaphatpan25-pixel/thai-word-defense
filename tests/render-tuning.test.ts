import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ART_SOURCE_SIZE,
  RENDER_TUNING,
  getZombieDisplaySize,
  getTowerDisplaySize,
  getSchoolDisplaySize,
} from '../src/assets/renderTuning';
import { ZOMBIES } from '../src/data/zombies';

test('64-bit-inspired tower sprites render at approximately 77px tall and fit a cell', () => {
  const size = getTowerDisplaySize();
  assert.ok(size.height >= 76 && size.height <= 78);
  assert.ok(size.width <= 58);
});

test('all zombie roles render between 57px and 68px tall', () => {
  for (const type of Object.keys(ZOMBIES) as Array<keyof typeof ZOMBIES>) {
    const size = getZombieDisplaySize(type);
    assert.ok(size.height >= 57, `${type} should be at least 57px tall`);
    assert.ok(size.height <= 68, `${type} should fit within the 68px boss envelope`);
    assert.ok(size.width <= 62, `${type} should stay within the playable lane`);
  }
});

test('one larger school landmark renders at approximately 158px square', () => {
  const size = getSchoolDisplaySize();
  assert.ok(size.width >= 155 && size.height >= 155);
});

test('render tuning is pixel-crisp and uses readable labels', () => {
  assert.ok(ART_SOURCE_SIZE.tower.height * RENDER_TUNING.towerScale >= 76);
  assert.ok(RENDER_TUNING.zombieLabelFontPx >= 12);
  assert.ok(RENDER_TUNING.towerBadgeFontPx >= 12);
});
