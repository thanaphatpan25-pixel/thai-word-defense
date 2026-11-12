export type ZombieType = 'normal' | 'runner' | 'tank' | 'jumper' | 'healer' | 'splitter' | 'boss';

export interface ZombieConfig {
  type: ZombieType;
  name: string;
  hp: number;
  speed: number;
  coreDamage: number;
  reward: number;
  size: number;
  color: number;
}

export const ZOMBIES: Record<ZombieType, ZombieConfig> = {
  normal: { type: 'normal', name: 'ซอมบี้จอมงง', hp: 50, speed: 34, coreDamage: 30, reward: 7, size: 28, color: 0x8bd16e },
  runner: { type: 'runner', name: 'ซอมบี้สายฟ้า', hp: 32, speed: 62, coreDamage: 22, reward: 8, size: 25, color: 0xc4e86b },
  tank: { type: 'tank', name: 'ซอมบี้ถังเหล็ก', hp: 180, speed: 20, coreDamage: 65, reward: 15, size: 34, color: 0x7ca3a9 },
  jumper: { type: 'jumper', name: 'ซอมบี้นักกระโดด', hp: 66, speed: 44, coreDamage: 35, reward: 11, size: 28, color: 0xffc16b },
  healer: { type: 'healer', name: 'ซอมบี้หมอสนาม', hp: 78, speed: 28, coreDamage: 30, reward: 13, size: 29, color: 0x9be3c8 },
  splitter: { type: 'splitter', name: 'ซอมบี้ร่างแยก', hp: 88, speed: 31, coreDamage: 32, reward: 14, size: 30, color: 0xd5a3e8 },
  boss: { type: 'boss', name: 'บอสครูใหญ่ซอมบี้', hp: 640, speed: 17, coreDamage: 110, reward: 80, size: 48, color: 0x75d18a },
};
