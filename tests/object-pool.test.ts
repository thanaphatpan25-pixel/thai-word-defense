import test from 'node:test';
import assert from 'node:assert/strict';
import { ObjectPool } from '../src/systems/ObjectPool';

test('object pool reuses released objects and applies reset logic', () => {
  let created = 0;
  const pool = new ObjectPool(() => ({ value: ++created }), (item) => { item.value = 0; }, 2);
  const first = pool.acquire();
  first.value = 99;
  pool.release(first);
  const reused = pool.acquire();
  assert.equal(reused, first);
  assert.equal(reused.value, 0);
  assert.equal(created, 1);
});
