import Phaser from 'phaser';

/** Canvas-side visual effects only. Text-heavy UI stays in accessible HTML. */
export class UIScene extends Phaser.Scene {
  private toast?: Phaser.GameObjects.Text;
  constructor() { super({ key: 'UIScene', active: false }); }

  showToast(message: string): void {
    this.toast?.destroy();
    this.toast = this.add.text(377, 20, message, {
      fontFamily: 'Tahoma, sans-serif', fontSize: '16px', color: '#fff4db',
      backgroundColor: '#18243b', padding: { x: 12, y: 8 },
    }).setOrigin(0.5, 0).setDepth(100);
    this.time.delayedCall(1400, () => this.toast?.destroy());
  }
}
