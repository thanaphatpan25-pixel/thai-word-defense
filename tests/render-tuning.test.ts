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

test('tower sprites render at a readable 64px height while staying narrower than a grid cell', () => {
  const size = getTowerDisplaySize();
  assert.ok(size.height >= 60 && size.height <= 68);
  assert.ok(size.width < 58);
});

test('all zombie roles render between 48px and 64px tall', () => {
  for (const type of Object.keys(ZOMBIES) as Array<keyof typeof ZOMBIES>) {
    const size = getZombieDisplaySize(type);
    assert.ok(size.height >= 48, `${type} should be at least 48px tall`);
    assert.ok(size.height <= 64, `${type} should fit within a 64px visual envelope`);
    assert.ok(size.width <= 58, `${type} should fit the 58px lane width`);
  }
});

test('school library landmark renders at least 100px square', () => {
  const size = getSchoolDisplaySize();
  assert.ok(size.width >= 100 && size.height >= 100);
});

test('labels are sized for readability on the 754px game board', () => {
  assert.ok(RENDER_TUNING.zombieLabelFontPx >= 12);
  assert.ok(RENDER_TUNING.towerBadgeFontPx >= 11);
  assert.equal(ART_SOURCE_SIZE.tower.height * RENDER_TUNING.towerScale, 64);
});
