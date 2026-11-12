import type { ZombieType } from '../data/zombies';

// Source dimensions are the actual frames in public/assets/art/game-atlas.webp.
export const ART_SOURCE_SIZE = {
  tower: { width: 18, height: 32 },
  zombie: { width: 18, height: 20 },
  school: { width: 96, height: 96 },
} as const;

export const RENDER_TUNING = {
  towerScale: 2,
  zombieScaleByType: {
    normal: 2.7,
    runner: 2.55,
    tank: 3,
    jumper: 2.7,
    healer: 2.7,
    splitter: 2.8,
    boss: 3.2,
  } satisfies Record<ZombieType, number>,
  schoolScale: 1.15,
  zombieLabelFontPx: 12,
  towerBadgeFontPx: 11,
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
