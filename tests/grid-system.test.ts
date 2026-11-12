import test from 'node:test';
import assert from 'node:assert/strict';
import { canPlaceTower, isReservedCell, isPathCell } from '../src/systems/GridSystem';

test('the school library footprint is reserved and cannot be covered by towers', () => {
  for (const [x, y] of [[11, 3], [12, 3], [11, 4], [12, 4]] as const) {
    assert.equal(isReservedCell(x, y), true);
    assert.equal(canPlaceTower(x, y, []), false);
  }
});

test('open grass remains buildable and road cells remain protected', () => {
  assert.equal(canPlaceTower(10, 4, []), true);
  assert.equal(isPathCell(12, 2), true);
  assert.equal(canPlaceTower(12, 2, []), false);
});
