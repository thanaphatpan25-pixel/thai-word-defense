import type { ZombieType } from '../data/zombies';

export interface ZombieEntity {
  id: string;
  type: ZombieType;
  wordLabel?: string;
  x: number;
  y: number;
  progress: number;
  hp: number;
  maxHp: number;
  speed: number;
  shieldHits: number;
  slowMs: number;
  boostedMs: number;
  healTimerMs: number;
  hasSplit: boolean;
  isAlive: boolean;
}
