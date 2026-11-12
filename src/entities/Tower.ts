import type { TowerType } from '../data/towers';

export interface TowerEntity {
  id: string;
  type: TowerType;
  gridX: number;
  gridY: number;
  x: number;
  y: number;
  level: 1 | 2 | 3;
  cooldownMs: number;
}
