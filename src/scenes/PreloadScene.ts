import Phaser from 'phaser';
import { registerGameArtAnimations } from '../assets/gameArt';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super('Preload');
  }

  preload(): void {
    const base = import.meta.env.BASE_URL;
    this.load.atlas(
      'gameAtlas',
      `${base}assets/art/game-atlas.webp`,
      `${base}assets/art/game-atlas.json`,
    );
    this.load.image('battlefield', `${base}assets/art/battlefield.webp`);
    this.load.image('schoolLibrary', `${base}assets/art/school-library.webp`);
  }

  create(): void {
    registerGameArtAnimations(this);
    this.scene.start('Menu');
  }
}
