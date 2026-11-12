import test from 'node:test';
import assert from 'node:assert/strict';
import { getBangkokDateKey, getDailySeed } from '../src/systems/DailyChallenge';

test('daily challenge seed is stable for a calendar date and changes on the next date', () => {
  const today = new Date('2026-11-12T04:00:00.000Z');
  const sameDay = new Date('2026-11-12T15:00:00.000Z');
  const tomorrow = new Date('2026-11-13T00:00:00.000Z');
  assert.equal(getBangkokDateKey(today), '2026-11-12');
  assert.equal(getDailySeed(today), getDailySeed(sameDay));
  assert.notEqual(getDailySeed(today), getDailySeed(tomorrow));
});
