import Phaser from 'phaser';
import type { TowerType } from '../data/towers';
import type { ZombieType } from '../data/zombies';
import type { GameSimulation } from '../systems/GameSimulation';
import { CELL_SIZE, GRID_COLUMNS, GRID_PATH, GRID_ROWS } from '../systems/GridSystem';
import { ASSET_KEYS } from '../utils/PixelArtFactory';

const WORLD_WIDTH = GRID_COLUMNS * CELL_SIZE;
const WORLD_HEIGHT = GRID_ROWS * CELL_SIZE;
const ZOMBIE_TEXTURES: Record<ZombieType, string> = {
  normal: `${ASSET_KEYS.zombieWalk}-walk-0`,
  runner: `${ASSET_KEYS.zombieRunner}-walk-0`,
  tank: `${ASSET_KEYS.zombieTank}-walk-0`,
  jumper: 'zombie-jumper-walk-0',
  healer: `${ASSET_KEYS.zombieHealer}-walk-0`,
  splitter: 'zombie-splitter-walk-0',
  boss: `${ASSET_KEYS.zombieBoss}-walk-0`,
};
const zombieAnimationKey = (type: ZombieType, action: 'walk' | 'attack' | 'death'): string => `zombie-${type}-${action}`;

export class GameScene extends Phaser.Scene {
  simulation?: GameSimulation;
  onGridClick?: (x: number, y: number) => void;
  private readonly zombieViews = new Map<string, Phaser.GameObjects.Sprite>();
  private readonly zombieLabels = new Map<string, Phaser.GameObjects.Text>();
  private readonly zombieTypes = new Map<string, ZombieType>();
  private readonly towerViews = new Map<string, Phaser.GameObjects.Container>();
  private projectileGraphics?: Phaser.GameObjects.Graphics;
  private worldGraphics?: Phaser.GameObjects.Graphics;
  private lastTowerSignature = '';
  private currentTheme = -1;

  constructor() { super('Game'); }

  init(data?: object): void {
    const payload = data as { simulation?: GameSimulation } | undefined;
    this.simulation = payload?.simulation;
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#1c2b3d');
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.worldGraphics = this.add.graphics().setDepth(0);
    this.drawWorld();
    this.add.image(WORLD_WIDTH - 45, GRID_PATH[GRID_PATH.length - 1]!.y * CELL_SIZE + 29, ASSET_KEYS.school).setScale(0.82).setDepth(2);
    this.add.text(WORLD_WIDTH - 70, GRID_PATH[GRID_PATH.length - 1]!.y * CELL_SIZE + 58, 'ห้องสมุด', { fontFamily: 'Tahoma, sans-serif', fontSize: '12px', color: '#fff4db', backgroundColor: '#18243b', padding: { x: 4, y: 2 } }).setOrigin(0.5).setDepth(5);
    this.projectileGraphics = this.add.graphics().setDepth(10);
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (!this.simulation || this.simulation.phase !== 'playing') return;
      const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
      const x = Math.floor(worldPoint.x / CELL_SIZE);
      const y = Math.floor(worldPoint.y / CELL_SIZE);
      this.onGridClick?.(x, y);
    });
    this.scale.on('resize', () => this.cameras.main.centerOn(WORLD_WIDTH / 2, WORLD_HEIGHT / 2));
  }

  update(_time: number, delta: number): void {
    if (!this.simulation) return;
    this.simulation.update(delta);
    const theme = Math.floor(this.simulation.wave / 5) % 2;
    if (theme !== this.currentTheme) this.drawWorld();
    this.syncTowers();
    this.syncZombies();
    this.syncProjectiles();
  }

  private drawWorld(): void {
    const graphics = this.worldGraphics;
    if (!graphics) return;
    graphics.clear();
    const theme = Math.floor((this.simulation?.wave ?? 1) / 5) % 2;
    this.currentTheme = theme;
    const grass = theme ? 0x3d4b55 : 0x344d4a;
    const grassAlt = theme ? 0x465660 : 0x3b584e;
    for (let y = 0; y < GRID_ROWS; y += 1) {
      for (let x = 0; x < GRID_COLUMNS; x += 1) {
        graphics.fillStyle((x + y) % 2 ? grass : grassAlt, 1);
        graphics.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE - 1, CELL_SIZE - 1);
        graphics.lineStyle(1, 0x18243b, 0.12);
        graphics.strokeRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
      }
    }
    graphics.lineStyle(CELL_SIZE * 0.72, theme ? 0x9a8378 : 0x897a6c, 1);
    graphics.beginPath();
    GRID_PATH.forEach((point, index) => {
      const x = point.x * CELL_SIZE + CELL_SIZE / 2;
      const y = point.y * CELL_SIZE + CELL_SIZE / 2;
      if (index === 0) graphics.moveTo(x, y); else graphics.lineTo(x, y);
    });
    graphics.strokePath();
    graphics.lineStyle(2, 0xe8cda4, 0.4);
    graphics.beginPath();
    GRID_PATH.forEach((point, index) => {
      const x = point.x * CELL_SIZE + CELL_SIZE / 2;
      const y = point.y * CELL_SIZE + CELL_SIZE / 2;
      if (index === 0) graphics.moveTo(x, y); else graphics.lineTo(x, y);
    });
    graphics.strokePath();
  }

  private syncTowers(): void {
    const simulation = this.simulation;
    if (!simulation) return;
    const skin = simulation.saveData.selectedSkin;
    const signature = `${skin}|${simulation.towers.map((tower) => `${tower.id}:${tower.level}`).join('|')}`;
    if (signature === this.lastTowerSignature) return;
    this.lastTowerSignature = signature;
    for (const view of this.towerViews.values()) view.destroy();
    this.towerViews.clear();
    simulation.towers.forEach((tower) => {
      const palette = skin === 'mint' ? { slingshot: 0x8de5c1, archer: 0x80d8ff, machinegun: 0x7fe0b1, water: 0x72e3df, electric: 0x9be6d1, teacher: 0xb5f3d7 } : skin === 'sunset' ? { slingshot: 0xffc16b, archer: 0xffa6c9, machinegun: 0xf08f74, water: 0xf6b66a, electric: 0xc4a5ff, teacher: 0xffd17b } : { slingshot: 0xffc857, archer: 0x80d8ff, machinegun: 0xa7e36c, water: 0x72e3df, electric: 0xc4a5ff, teacher: 0xffa6c9 };
      const color = tower.type === 'archer' ? palette.archer : tower.type === 'machinegun' ? palette.machinegun : tower.type === 'water-bomb' ? palette.water : tower.type === 'electric' ? palette.electric : tower.type === 'teacher' ? palette.teacher : palette.slingshot;
      const base = this.add.circle(0, 0, 19, 0x18243b).setStrokeStyle(3, color);
      const glyphs: Record<TowerType, string> = { slingshot: 'S', archer: 'A', machinegun: 'M', 'water-bomb': 'W', electric: 'E', teacher: 'T' };
      const label = this.add.text(0, 0, glyphs[tower.type], { fontFamily: 'monospace', fontSize: '18px', color: '#fff4db', fontStyle: 'bold' }).setOrigin(0.5);
      const level = this.add.text(15, -15, String(tower.level), { fontFamily: 'monospace', fontSize: '11px', color: '#18243b', backgroundColor: '#ffdc75', padding: { x: 3, y: 1 } }).setOrigin(0.5);
      const container = this.add.container(tower.x, tower.y, [base, label, level]).setDepth(4);
      this.towerViews.set(tower.id, container);
    });
  }

  private syncZombies(): void {
    const simulation = this.simulation;
    if (!simulation) return;
    const livingIds = new Set(simulation.zombies.map((zombie) => zombie.id));
    for (const [id, sprite] of this.zombieViews) {
      if (livingIds.has(id)) continue;
      this.zombieViews.delete(id);
      this.zombieLabels.get(id)?.destroy();
      this.zombieLabels.delete(id);
      const zombieType = this.zombieTypes.get(id) ?? 'normal';
      this.zombieTypes.delete(id);
      sprite.play(zombieAnimationKey(zombieType, 'death'));
      this.tweens.add({ targets: sprite, alpha: 0, duration: 460, onComplete: () => sprite.destroy() });
    }
    for (const zombie of simulation.zombies) {
      let sprite = this.zombieViews.get(zombie.id);
      if (!sprite) {
        const texture = ZOMBIE_TEXTURES[zombie.type];
        sprite = this.add.sprite(zombie.x, zombie.y, texture).setDepth(6);
        sprite.play(zombieAnimationKey(zombie.type, 'walk'));
        this.zombieTypes.set(zombie.id, zombie.type);
        const label = this.add.text(zombie.x, zombie.y - 30, zombie.shieldHits > 0 ? `🔒 ${zombie.shieldHits}` : (zombie.wordLabel ?? 'คำศัพท์').slice(0, 12), {
          fontFamily: 'Tahoma, sans-serif', fontSize: '10px', color: '#18243b', backgroundColor: '#fff4db', padding: { x: 4, y: 2 },
        }).setOrigin(0.5).setDepth(7);
        this.zombieLabels.set(zombie.id, label);
        this.zombieViews.set(zombie.id, sprite);
      }
      if (zombie.hp < zombie.maxHp && sprite.anims.currentAnim?.key !== zombieAnimationKey(zombie.type, 'attack')) sprite.play(zombieAnimationKey(zombie.type, 'attack'));
      sprite.setTint(simulation.saveData.selectedSkin === 'mint' ? 0xc6fff0 : simulation.saveData.selectedSkin === 'sunset' ? 0xffd7b0 : 0xffffff);
      sprite.setPosition(zombie.x, zombie.y);
      sprite.setScale(zombie.type === 'boss' ? 1.45 : zombie.type === 'tank' ? 1.2 : 1);
      const label = this.zombieLabels.get(zombie.id);
      label?.setPosition(zombie.x, zombie.y - (zombie.type === 'boss' ? 42 : 29));
      label?.setText(zombie.shieldHits > 0 ? `🔒 ${zombie.shieldHits}` : (zombie.wordLabel ?? 'คำศัพท์').slice(0, 12));
    }
  }

  private syncProjectiles(): void {
    const graphics = this.projectileGraphics;
    if (!graphics || !this.simulation) return;
    graphics.clear();
    this.simulation.projectiles.forEach((projectile) => {
      graphics.fillStyle(projectile.behavior === 'slow' ? 0xc4a5ff : projectile.behavior === 'splash' ? 0x72e3df : 0xffdc75, 1);
      graphics.fillCircle(projectile.x, projectile.y, projectile.behavior === 'rapid' ? 3 : 5);
    });
  }
}
