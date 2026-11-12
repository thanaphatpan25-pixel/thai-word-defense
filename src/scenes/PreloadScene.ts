import Phaser from 'phaser';
import {
  ART_KEYS,
  ART_PATHS,
  applyHighQualityArtSettings,
} from '../assets/gameArt';
import { getOptimalResolution } from '../main';

export class PreloadScene extends Phaser.Scene {
  private progressBar?: Phaser.GameObjects.Graphics;
  private progressBox?: Phaser.GameObjects.Graphics;
  private loadingText?: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'PreloadScene' });
  }

  public preload(): void {
    const { width, height } = this.scale;
    const dpr = getOptimalResolution();

    // สร้างกรอบหลอดโหลดเกม
    this.progressBox = this.add.graphics();
    this.progressBox.fillStyle(0x1e293b, 0.85);
    this.progressBox.fillRoundedRect(width / 2 - 210, height / 2 - 18, 420, 36, 12);

    this.progressBar = this.add.graphics();

    this.loadingText = this.add
      .text(width / 2, height / 2 - 52, 'กำลังเตรียมคลังคำศัพท์และสนามรบ...', {
        fontFamily: '"Kanit", "Sarabun", sans-serif',
        fontSize: '22px',
        color: '#f8fafc',
        resolution: dpr,
        padding: { top: 10, bottom: 8, left: 6, right: 6 },
      })
      .setOrigin(0.5);

    this.load.on('progress', (value: number) => {
      if (!this.progressBar) return;
      this.progressBar.clear();
      this.progressBar.fillStyle(0xfbbf24, 1);
      this.progressBar.fillRoundedRect(
        width / 2 - 204,
        height / 2 - 12,
        Math.max(12, 408 * value),
        24,
        8
      );
    });

    // โหลดกราฟิกความละเอียดสูงของเกม
    this.load.image(ART_KEYS.BATTLEFIELD_BG, ART_PATHS.BATTLEFIELD_BG);
    this.load.image(ART_KEYS.LIBRARY_BG, ART_PATHS.LIBRARY_BG);
    this.load.atlas(
      ART_KEYS.ATLAS,
      ART_PATHS.ATLAS_IMAGE,
      ART_PATHS.ATLAS_JSON
    );
  }

  public create(): void {
    // เปิด Linear Filtering และป้องกันขอบภาพแลบให้ทุก Texture ทันทีที่โหลดเสร็จ
    applyHighQualityArtSettings(this);

    this.progressBar?.destroy();
    this.progressBox?.destroy();
    this.loadingText?.destroy();

    this.scene.start('MenuScene');
  }
}
