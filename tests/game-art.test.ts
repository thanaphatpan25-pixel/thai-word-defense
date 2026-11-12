import test from 'node:test';
import assert from 'node:assert/strict';
import atlas from '../src/assets/art/game-atlas.json';
import {
  TOWER_ART_IDS,
  ZOMBIE_ART_IDS,
  TOWER_FRAME_COUNTS,
  ZOMBIE_FRAME_COUNTS,
  zombieFrameKey,
} from '../src/assets/gameArt';

const towerTypes = ['slingshot', 'archer', 'machinegun', 'water-bomb', 'electric', 'teacher'] as const;
const zombieTypes = ['normal', 'runner', 'tank', 'jumper', 'healer', 'splitter', 'boss'] as const;
const zombieActions = ['idle', 'walk', 'attack', 'hurt', 'dead'] as const;
const atlasFrames = atlas.frames as Record<string, unknown>;

test('every gameplay tower has a mapped CraftPix tower with idle and four upgrade frames', () => {
  assert.deepEqual(Object.keys(TOWER_ART_IDS).sort(), [...towerTypes].sort());
  for (const type of towerTypes) {
    const artId = TOWER_ART_IDS[type];
    assert.ok(TOWER_FRAME_COUNTS[artId]?.idle >= 1, `${type} needs an idle frame`);
    assert.equal(TOWER_FRAME_COUNTS[artId]?.upgrade, 4, `${type} needs four upgrade frames`);
    assert.ok(atlasFrames[`tower-${artId}-idle-0`], `${type} idle sprite missing from atlas`);
    for (let frame = 0; frame < 4; frame += 1) {
      assert.ok(atlasFrames[`tower-${artId}-upgrade-${frame}`], `${type} upgrade frame ${frame} missing`);
    }
  }
});

test('every gameplay zombie maps to a consistent animation set in the atlas', () => {
  assert.deepEqual(Object.keys(ZOMBIE_ART_IDS).sort(), [...zombieTypes].sort());
  for (const type of zombieTypes) {
    const artId = ZOMBIE_ART_IDS[type];
    for (const action of zombieActions) {
      const count = ZOMBIE_FRAME_COUNTS[artId]?.[action] ?? 0;
      assert.ok(count >= 1, `${type} needs ${action} frames`);
      for (let frame = 0; frame < count; frame += 1) {
        assert.ok(atlasFrames[zombieFrameKey(type, action, frame)], `${type} ${action} frame ${frame} missing`);
      }
    }
  }
});

test('tower and zombie art IDs only reference included atlas families', () => {
  assert.ok(Object.values(TOWER_ART_IDS).every((id) => id >= 1 && id <= 7));
  assert.ok(Object.values(ZOMBIE_ART_IDS).every((id) => id >= 1 && id <= 4));
});
