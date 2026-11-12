import type { ZombieType } from '../data/zombies';

// Phaser keeps nearest-neighbour pixel scaling; these are the displayed source-frame sizes.
export const ART_SOURCE_SIZE = {
  tower: { width: 18, height: 32 },
  zombie: { width: 18, height: 20 },
  school: { width: 96, height: 96 },
} as const;

export const RENDER_TUNING = {
  // Larger integer-like scales create a bolder, 64-bit-inspired presentation.
  towerScale: 2.4,
  zombieScaleByType: {
    normal: 3,
    runner: 2.85,
    tank: 3.2,
    jumper: 3,
    healer: 3,
    splitter: 3,
    boss: 3.4,
  } satisfies Record<ZombieType, number>,
  schoolScale: 1.65,
  zombieLabelFontPx: 12,
  towerBadgeFontPx: 12,
} as const;

export interface DisplaySize {
  width: number;
  height: number;
}

export function getTowerDisplaySize(): DisplaySize {
  return {
    width: ART_SOURCE_SIZE.tower.width * RENDER_TUNING.towerScale,
    height: ART_SOURCE_SIZE.tower.height * RENDER_TUNING.towerScale,
  };
}

export function getZombieDisplaySize(type: ZombieType): DisplaySize {
  const scale = RENDER_TUNING.zombieScaleByType[type];
  return {
    width: ART_SOURCE_SIZE.zombie.width * scale,
    height: ART_SOURCE_SIZE.zombie.height * scale,
  };
}

export function getSchoolDisplaySize(): DisplaySize {
  return {
    width: ART_SOURCE_SIZE.school.width * RENDER_TUNING.schoolScale,
    height: ART_SOURCE_SIZE.school.height * RENDER_TUNING.schoolScale,
  };
}
