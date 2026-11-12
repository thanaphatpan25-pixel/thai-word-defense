import Phaser from 'phaser';
import atlasData from './art/game-atlas.json';

export const ART_KEYS = {
  ATLAS: 'game-atlas',
  BATTLEFIELD_BG: 'battlefield',
  LIBRARY_BG: 'school-library',
} as const;

export const ART_PATHS = {
  ATLAS_IMAGE: 'assets/art/game-atlas.webp',
  ATLAS_JSON: 'assets/art/game-atlas.json',
  BATTLEFIELD_BG: 'assets/art/battlefield.webp',
  LIBRARY_BG: 'assets/art/school-library.webp',
} as const;

export interface SpriteFrameMapping {
  atlasKey: string;
  frame: string;
}

/**
 * ดึงรายชื่อเฟรมทั้งหมดที่มีอยู่ใน game-atlas.json
 */
export function getAvailableAtlasFrames(): string[] {
  const framesObj = (atlasData as { frames?: Record<string, unknown> }).frames ?? {};
  return Object.keys(framesObj);
}

/**
 * จับคู่รหัสป้อม ซอมบี้ บอส หรือกระสุน เข้ากับชื่อเฟรมใน game-atlas.json
 */
export function resolveEntityFrame(entityKey: string, fallbackFrame?: string): string {
  const available = getAvailableAtlasFrames();
  if (available.includes(entityKey)) {
    return entityKey;
  }

  // ค้นหาแบบยืดหยุ่นกรณีชื่อมี prefix/suffix เช่น tower_archer, zombie_normal
  const normalized = entityKey.toLowerCase().replace(/[^a-z0-9]/g, '');
  const matched = available.find((frameName) =>
    frameName.toLowerCase().replace(/[^a-z0-9]/g, '').includes(normalized)
  );

  if (matched) {
    return matched;
  }

  return fallbackFrame ?? available[0] ?? entityKey;
}

/**
 * บังคับเปิดโหมดกรองภาพแบบ Linear Filtering และหดขอบ UV 0.5px กันขอบภาพแลบ (Texture Bleeding)
 */
export function applyHighQualityArtSettings(scene: Phaser.Scene): void {
  const textureKeys = [
    ART_KEYS.ATLAS,
    ART_KEYS.BATTLEFIELD_BG,
    ART_KEYS.LIBRARY_BG,
  ];

  for (const key of textureKeys) {
    if (!scene.textures.exists(key)) continue;
    const texture = scene.textures.get(key);
    texture.setFilter(Phaser.Textures.FilterMode.LINEAR);
  }

  // หดขอบเฟรมใน game-atlas เข้ามา 0.5 พิกเซล เพื่อตัดคราบขอบจากเฟรมข้างเคียงเวลาถูกย่อขนาด
  if (scene.textures.exists(ART_KEYS.ATLAS)) {
    const atlasTexture = scene.textures.get(ART_KEYS.ATLAS);
    const frameNames = atlasTexture.getFrameNames();

    for (const frameName of frameNames) {
      const frame = atlasTexture.get(frameName);
      if (frame && frame.width > 4 && frame.height > 4) {
        frame.setCutPosition(frame.cutX + 0.5, frame.cutY + 0.5);
        frame.setCutSize(frame.cutWidth - 1, frame.cutHeight - 1);
      }
    }
  }
}
