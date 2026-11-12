import Phaser from 'phaser';

export interface UnitRenderTuning {
  scale: number;
  originX: number;
  originY: number;
  offsetX: number;
  offsetY: number;
  shadowRadiusX: number;
  shadowRadiusY: number;
  healthBarOffsetY: number;
  healthBarWidth: number;
}

export const DEFAULT_TOWER_TUNING: UnitRenderTuning = {
  scale: 0.78,
  originX: 0.5,
  originY: 0.86, // ยึดจุดหมุนและจุดวางที่ฐานป้อม
  offsetX: 0,
  offsetY: 14,
  shadowRadiusX: 26,
  shadowRadiusY: 11,
  healthBarOffsetY: -64,
  healthBarWidth: 48,
};

export const DEFAULT_ZOMBIE_TUNING: UnitRenderTuning = {
  scale: 0.82,
  originX: 0.5,
  originY: 0.88, // ยึดจุดยืนที่ฝ่าเท้าซอมบี้
  offsetX: 0,
  offsetY: 16,
  shadowRadiusX: 22,
  shadowRadiusY: 9,
  healthBarOffsetY: -68,
  healthBarWidth: 46,
};

export const DEFAULT_BOSS_TUNING: UnitRenderTuning = {
  scale: 1.15,
  originX: 0.5,
  originY: 0.9,
  offsetX: 0,
  offsetY: 20,
  shadowRadiusX: 38,
  shadowRadiusY: 15,
  healthBarOffsetY: -96,
  healthBarWidth: 76,
};

export const PROJECTILE_TUNING = {
  scale: 0.65,
  glowAlpha: 0.35,
  glowScaleMultiplier: 1.45,
} as const;

/**
 * คืนค่าการตั้งค่าขนาดและจุดยึดตามประเภทของยูนิต
 */
export function getUnitRenderTuning(
  category: 'tower' | 'zombie' | 'boss',
  subType?: string
): UnitRenderTuning {
  if (category === 'boss') {
    return { ...DEFAULT_BOSS_TUNING };
  }
  if (category === 'tower') {
    return { ...DEFAULT_TOWER_TUNING };
  }
  // ปรับขนาดซอมบี้ตามชนิดย่อยได้หากต้องการ
  if (subType === 'tank' || subType === 'giant') {
    return {
      ...DEFAULT_ZOMBIE_TUNING,
      scale: 0.96,
      shadowRadiusX: 28,
      shadowRadiusY: 12,
      healthBarOffsetY: -78,
      healthBarWidth: 56,
    };
  }
  return { ...DEFAULT_ZOMBIE_TUNING };
}

export interface ProceduralMotion {
  offsetY: number;
  scaleX: number;
  scaleY: number;
  rotation: number;
}

/**
 * สร้างการเคลื่อนไหวแบบ Procedural (ป้อมมีจังหวะหายใจ / ซอมบี้มีจังหวะก้าวเดิน)
 */
export function computeProceduralMotion(
  timeMs: number,
  seedId: number,
  isWalking: boolean,
  baseScale: number
): ProceduralMotion {
  const phase = timeMs * 0.0075 + seedId * 1.618;

  if (isWalking) {
    const bounce = Math.abs(Math.sin(phase * 1.45));
    const sway = Math.sin(phase * 1.45);
    return {
      offsetY: -bounce * 5.5,
      scaleX: baseScale * (1 + Math.sin(phase * 2.9) * 0.028),
      scaleY: baseScale * (1 - Math.sin(phase * 2.9) * 0.028),
      rotation: sway * 0.055,
    };
  }

  // จังหวะหายใจนุ่มนวลสำหรับป้อม
  const breath = Math.sin(phase);
  return {
    offsetY: 0,
    scaleX: baseScale * (1 + breath * 0.02),
    scaleY: baseScale * (1 - breath * 0.02),
    rotation: 0,
  };
}

/**
 * คำนวณสเกลภาพพื้นหลังแบบ Cover (เต็มจอโดยภาพไม่บี้หรือยืดผิดสัดส่วน)
 */
export function computeCoverScale(
  imageWidth: number,
  imageHeight: number,
  viewportWidth: number,
  viewportHeight: number
): number {
  const safeW = Math.max(1, imageWidth);
  const safeH = Math.max(1, imageHeight);
  return Math.max(viewportWidth / safeW, viewportHeight / safeH);
}

/**
 * วาดหลอดเลือดโค้งมนพร้อมไฮไลต์แสงด้านบนลงบน Phaser Graphics
 */
export function drawCrispHealthBar(
  graphics: Phaser.GameObjects.Graphics,
  centerX: number,
  topY: number,
  width: number,
  height: number,
  currentHp: number,
  maxHp: number,
  isBoss: boolean = false
): void {
  const ratio = Phaser.Math.Clamp(currentHp / Math.max(1, maxHp), 0, 1);
  const x = Math.round(centerX - width / 2);
  const y = Math.round(topY);

  // พื้นหลังกรอบดำโปร่งแสง
  graphics.fillStyle(0x0f172a, 0.85);
  graphics.fillRoundedRect(x - 2, y - 2, width + 4, height + 4, 4);

  // สีหลอดเลือดตามระดับ HP
  const barColor = isBoss
    ? 0xa855f7
    : ratio > 0.5
      ? 0x22c55e
      : ratio > 0.25
        ? 0xf59e0b
        : 0xef4444;

  const fillWidth = Math.max(0, Math.round(width * ratio));
  if (fillWidth > 0) {
    graphics.fillStyle(barColor, 1);
    graphics.fillRoundedRect(x, y, fillWidth, height, 3);

    // แถบแสงสะท้อนด้านบนให้ดูมีมิติ
    graphics.fillStyle(0xffffff, 0.28);
    graphics.fillRect(x + 1, y + 1, Math.max(0, fillWidth - 2), Math.max(1, Math.floor(height * 0.35)));
  }
}
