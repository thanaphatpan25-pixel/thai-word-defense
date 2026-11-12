import Phaser from 'phaser';
import { createPixelArt, createPixelAnimations } from '../utils/PixelArtFactory';

export class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }
  create(): void {
    createPixelArt(this);
    createPixelAnimations(this);
    this.scene.start('Preload');
  }
}
