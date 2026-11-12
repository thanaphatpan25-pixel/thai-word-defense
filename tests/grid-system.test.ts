import test from 'node:test';
import assert from 'node:assert/strict';
import { canPlaceTower, isReservedCell, isPathCell, SCHOOL_FOOTPRINT_CELLS } from '../src/systems/GridSystem';

test('the single larger school landmark reserves all nine cells below the route', () => {
  assert.equal(SCHOOL_FOOTPRINT_CELLS.length, 9);
  for (const { x, y } of SCHOOL_FOOTPRINT_CELLS) {
    assert.equal(isReservedCell(x, y), true);
    assert.equal(canPlaceTower(x, y, []), false);
  }
});

test('open grass remains buildable and road cells remain protected', () => {
  assert.equal(canPlaceTower(9, 6, []), true);
  assert.equal(isPathCell(12, 2), true);
  assert.equal(canPlaceTower(12, 2, []), false);
});
