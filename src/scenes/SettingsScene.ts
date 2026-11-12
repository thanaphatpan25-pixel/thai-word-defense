import Phaser from 'phaser';

export class SettingsScene extends Phaser.Scene {
  constructor() { super('Settings'); }
  create(): void {
    this.cameras.main.setBackgroundColor('#101b2d');
    this.add.text(24, 24, 'ตั้งค่าเกม', { fontFamily: 'Tahoma, sans-serif', fontSize: '22px', color: '#ffdc75' });
    this.add.text(24, 62, 'ปรับเสียง เวลา และโหมดช่วยเหลือได้จากแผงตั้งค่าบนหน้าจอ', { fontFamily: 'Tahoma, sans-serif', fontSize: '14px', color: '#fff4db' });
  }
}
