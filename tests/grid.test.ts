import test from 'node:test';
import assert from 'node:assert/strict';
import { canPlaceTower, GRID_PATH } from '../src/systems/GridSystem';

test('towers cannot be placed on the zombie route', () => {
  for (const point of GRID_PATH) assert.equal(canPlaceTower(point.x, point.y, []), false);
});

test('towers can be placed on open cells but not on occupied cells', () => {
  assert.equal(canPlaceTower(1, 1, []), true);
  assert.equal(canPlaceTower(1, 1, [{ x: 1, y: 1 }]), false);
});

test('out-of-grid coordinates are rejected', () => {
  assert.equal(canPlaceTower(-1, 1, []), false);
  assert.equal(canPlaceTower(13, 1, []), false);
});
