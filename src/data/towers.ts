export type TowerType = 'slingshot' | 'archer' | 'machinegun' | 'water-bomb' | 'electric' | 'teacher';
export type TowerBehavior = 'single' | 'pierce' | 'rapid' | 'splash' | 'slow' | 'support';

export interface TowerConfig {
  type: TowerType;
  name: string;
  icon: string;
  cost: number;
  damage: number;
  range: number;
  cooldownMs: number;
  behavior: TowerBehavior;
  description: string;
  color: number;
  upgradeCosts: [number, number, number];
}

export const TOWERS: Record<TowerType, TowerConfig> = {
  slingshot: { type: 'slingshot', name: 'หนังสติ๊ก', icon: '🪃', cost: 45, damage: 18, range: 160, cooldownMs: 850, behavior: 'single', description: 'ราคาประหยัด ยิงตรงเป้าหมาย', color: 0xffc857, upgradeCosts: [35, 55, 80] },
  archer: { type: 'archer', name: 'นักธนู', icon: '🏹', cost: 75, damage: 46, range: 250, cooldownMs: 1900, behavior: 'pierce', description: 'ระยะไกล ยิงแรงและทะลุเป้าหมาย', color: 0x80d8ff, upgradeCosts: [55, 80, 115] },
  machinegun: { type: 'machinegun', name: 'ปืนกลน้ำ', icon: '🔫', cost: 90, damage: 8, range: 185, cooldownMs: 240, behavior: 'rapid', description: 'ยิงเร็วต่อเนื่อง ดาเมจทีละน้อย', color: 0xa7e36c, upgradeCosts: [65, 95, 130] },
  'water-bomb': { type: 'water-bomb', name: 'ระเบิดน้ำ', icon: '💦', cost: 110, damage: 32, range: 175, cooldownMs: 1500, behavior: 'splash', description: 'น้ำกระจายโดนซอมบี้รอบจุดระเบิด', color: 0x72e3df, upgradeCosts: [75, 105, 145] },
  electric: { type: 'electric', name: 'สายฟ้าชะลอ', icon: '⚡', cost: 100, damage: 10, range: 150, cooldownMs: 1200, behavior: 'slow', description: 'ชะลอซอมบี้และทำดาเมจเบา ๆ', color: 0xc4a5ff, upgradeCosts: [70, 100, 140] },
  teacher: { type: 'teacher', name: 'ครูภาษาไทย', icon: '📚', cost: 125, damage: 0, range: 220, cooldownMs: 9000, behavior: 'support', description: 'ฟื้นพลังฐานและเพิ่มเวลาตอบคำถาม', color: 0xffa6c9, upgradeCosts: [85, 120, 165] },
};
