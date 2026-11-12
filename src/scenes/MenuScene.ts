import Phaser from 'phaser';
import { GRID_COLUMNS, GRID_ROWS, CELL_SIZE, GRID_PATH } from '../systems/GridSystem';
import { ASSET_KEYS } from '../utils/PixelArtFactory';

export class MenuScene extends Phaser.Scene {
  constructor() { super('Menu'); }
  create(): void {
    this.cameras.main.setBackgroundColor('#18243b');
    const width = GRID_COLUMNS * CELL_SIZE;
    const height = GRID_ROWS * CELL_SIZE;
    const graphics = this.add.graphics();
    for (let y = 0; y < GRID_ROWS; y += 1) {
      for (let x = 0; x < GRID_COLUMNS; x += 1) {
        const onPath = GRID_PATH.some((point) => point.x === x && point.y === y);
        graphics.fillStyle(onPath ? 0x927c6d : (x + y) % 2 ? 0x344d4a : 0x3b584e, 1);
        graphics.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE - 1, CELL_SIZE - 1);
      }
    }
    this.add.image(width - 46, 3 * CELL_SIZE + 29, ASSET_KEYS.school).setScale(0.72);
    this.add.text(width / 2, 30, 'WORD DEFENSE', { fontFamily: 'monospace', fontSize: '22px', color: '#ffdc75', fontStyle: 'bold' }).setOrigin(0.5);
    this.add.text(width / 2, height - 18, 'ปกป้องห้องสมุดด้วยพลังภาษาไทย!', { fontFamily: 'Tahoma, sans-serif', fontSize: '15px', color: '#fff4db', backgroundColor: '#18243b', padding: { x: 8, y: 5 } }).setOrigin(0.5);
  }
}
