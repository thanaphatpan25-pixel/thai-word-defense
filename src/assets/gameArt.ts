import type Phaser from 'phaser';
import type { TowerType } from '../data/towers';
import type { ZombieType } from '../data/zombies';

export type TowerArtId = 1 | 2 | 3 | 4 | 5 | 6 | 7;
export type ZombieArtId = 1 | 2 | 3 | 4;
export type TowerArtAction = 'idle' | 'upgrade';
export type ZombieArtAction = 'idle' | 'walk' | 'attack' | 'hurt' | 'dead';

export const TOWER_ART_IDS: Record<TowerType, TowerArtId> = {
  slingshot: 1,
  'water-bomb': 2,
  machinegun: 3,
  archer: 4,
  electric: 5,
  teacher: 7,
};

export const ZOMBIE_ART_IDS: Record<ZombieType, ZombieArtId> = {
  normal: 1,
  runner: 2,
  tank: 3,
  jumper: 2,
  healer: 4,
  splitter: 1,
  boss: 3,
};

export const TOWER_FRAME_COUNTS: Record<TowerArtId, { idle: number; upgrade: number }> = {
  1: { idle: 1, upgrade: 4 },
  2: { idle: 4, upgrade: 4 },
  3: { idle: 4, upgrade: 4 },
  4: { idle: 6, upgrade: 4 },
  5: { idle: 6, upgrade: 4 },
  6: { idle: 6, upgrade: 4 },
  7: { idle: 6, upgrade: 4 },
};

export const ZOMBIE_FRAME_COUNTS: Record<ZombieArtId, Record<ZombieArtAction, number>> = {
  1: { idle: 6, walk: 10, attack: 5, hurt: 4, dead: 5 },
  2: { idle: 6, walk: 10, attack: 5, hurt: 4, dead: 5 },
  3: { idle: 6, walk: 10, attack: 4, hurt: 4, dead: 5 },
  4: { idle: 7, walk: 12, attack: 10, hurt: 4, dead: 5 },
};

export function towerFrameKey(type: TowerType, action: TowerArtAction, frame: number): string {
  return `tower-${TOWER_ART_IDS[type]}-${action}-${frame}`;
}

export function zombieFrameKey(type: ZombieType, action: ZombieArtAction, frame: number): string {
  return `zombie-${ZOMBIE_ART_IDS[type]}-${action}-${frame}`;
}

export function towerAnimationKey(type: TowerType, action: TowerArtAction): string {
  return `tower-${type}-${action}`;
}

export function zombieAnimationKey(type: ZombieType, action: ZombieArtAction): string {
  return `zombie-${type}-${action}`;
}

export function registerGameArtAnimations(scene: Phaser.Scene): void {
  const towerTypes: TowerType[] = ['slingshot', 'water-bomb', 'machinegun', 'archer', 'electric', 'teacher'];
  for (const type of towerTypes) {
    const artId = TOWER_ART_IDS[type];
    for (const action of ['idle', 'upgrade'] as const) {
      const key = towerAnimationKey(type, action);
      if (scene.anims.exists(key)) continue;
      scene.anims.create({
        key,
        frames: Array.from({ length: TOWER_FRAME_COUNTS[artId][action] }, (_, index) => ({
          key: 'gameAtlas',
          frame: towerFrameKey(type, action, index),
        })),
        frameRate: action === 'idle' ? 4 : 8,
        repeat: action === 'idle' ? -1 : 0,
      });
    }
  }

  const zombieTypes: ZombieType[] = ['normal', 'runner', 'tank', 'jumper', 'healer', 'splitter', 'boss'];
  for (const type of zombieTypes) {
    const artId = ZOMBIE_ART_IDS[type];
    for (const action of ['idle', 'walk', 'attack', 'hurt', 'dead'] as const) {
      const key = zombieAnimationKey(type, action);
      if (scene.anims.exists(key)) continue;
      scene.anims.create({
        key,
        frames: Array.from({ length: ZOMBIE_FRAME_COUNTS[artId][action] }, (_, index) => ({
          key: 'gameAtlas',
          frame: zombieFrameKey(type, action, index),
        })),
        frameRate: action === 'walk' ? 9 : action === 'attack' ? 10 : 7,
        repeat: action === 'walk' || action === 'idle' ? -1 : 0,
      });
    }
  }
}
