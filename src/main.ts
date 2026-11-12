import Phaser from 'phaser';
import './style.css';
import { BootScene } from './scenes/BootScene';
import { PreloadScene } from './scenes/PreloadScene';
import { MenuScene } from './scenes/MenuScene';
import { GameScene } from './scenes/GameScene';
import { UIScene } from './scenes/UIScene';
import { SettingsScene } from './scenes/SettingsScene';
import { GameOverScene } from './scenes/GameOverScene';

export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;

/**
 * คำนวณค่า Device Pixel Ratio ที่เหมาะสม (จำกัดไม่เกิน 2x เพื่อรักษา 60 FPS)
 */
export function getOptimalResolution(): number {
  if (typeof window === 'undefined') return 1;
  return Math.min(Math.max(window.devicePixelRatio || 1, 1), 2);
}

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.WEBGL,
  parent: 'app',
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: '#0b1120',
  render: {
    // ปิดโหมด pixelArt เพื่อให้ภาพ WebP ความละเอียดสูงถูกเกลี่ยขอบอย่างนุ่มนวล
    pixelArt: false,
    antialias: true,
    antialiasGL: true,
    // ป้องกันอาการภาพสั่นหรือเบลอเมื่อพิกัดซอมบี้มีค่าทศนิยม
    roundPixels: true,
    powerPreference: 'high-performance',
     mipmapFilter: 'LINEAR_MIPMAP_LINEAR',
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
  },
  scene: [
    BootScene,
    PreloadScene,
    MenuScene,
    GameScene,
    UIScene,
    SettingsScene,
    GameOverScene,
  ],
};

export function createGame(): Phaser.Game {
  const game = new Phaser.Game(config);

  // ปรับขนาดอัตโนมัติเมื่อหน้าต่างเบราว์เซอร์เปลี่ยนขนาด
  if (typeof window !== 'undefined') {
    window.addEventListener('resize', () => {
      game.scale.refresh();
    });
  }

  return game;
}

createGame();
