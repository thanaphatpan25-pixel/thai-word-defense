import Phaser from 'phaser';
import type { GameResultSummary } from '../systems/GameSimulation';

export class GameOverScene extends Phaser.Scene {
  constructor() { super('GameOver'); }
  showSummary(result: GameResultSummary): void {
    this.events.emit('summary', result);
  }
}
