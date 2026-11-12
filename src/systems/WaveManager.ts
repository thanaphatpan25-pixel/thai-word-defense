import type { ZombieType } from '../data/zombies';

export interface WaveConfig {
  wave: number;
  isBossWave: boolean;
  totalEnemies: number;
  spawnIntervalMs: number;
  healthMultiplier: number;
  speedMultiplier: number;
  enemyTypes: ZombieType[];
}

export class WaveManager {
  getWaveConfig(wave: number): WaveConfig {
    const safeWave = Math.max(1, Math.floor(wave));
    const enemyTypes: ZombieType[] = ['normal'];
    if (safeWave >= 2) enemyTypes.push('runner');
    if (safeWave >= 3) enemyTypes.push('tank');
    if (safeWave >= 4) enemyTypes.push('jumper');
    if (safeWave >= 6) enemyTypes.push('healer');
    if (safeWave >= 7) enemyTypes.push('splitter');
    const isBossWave = safeWave % 5 === 0;
    const totalEnemies = 5 + Math.floor(safeWave * 1.45) + (isBossWave ? 1 : 0);
    return {
      wave: safeWave,
      isBossWave,
      totalEnemies,
      spawnIntervalMs: Math.max(360, 1450 - safeWave * 24),
      healthMultiplier: 1 + safeWave * 0.12,
      speedMultiplier: 1 + Math.min(safeWave * 0.015, 0.8),
      enemyTypes,
    };
  }
}
