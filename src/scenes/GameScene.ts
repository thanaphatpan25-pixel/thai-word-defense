import Phaser from 'phaser';
import type { ZombieType } from '../data/zombies';
import type { GameSimulation } from '../systems/GameSimulation';
import { CELL_SIZE, GRID_COLUMNS, GRID_ROWS } from '../systems/GridSystem';
import {
  towerAnimationKey,
  towerFrameKey,
  zombieAnimationKey,
  zombieFrameKey,
} from '../assets/gameArt';

const WORLD_WIDTH = GRID_COLUMNS * CELL_SIZE;
const WORLD_HEIGHT = GRID_ROWS * CELL_SIZE;

type TowerView = {
  container: Phaser.GameObjects.Container;
  sprite: Phaser.GameObjects.Sprite;
  levelBadge: Phaser.GameObjects.Text;
  level: number;
};

export class GameScene extends Phaser.Scene {
  simulation?: GameSimulation;
  onGridClick?: (x: number, y: number) => void;

  private readonly zombieViews = new Map<string, Phaser.GameObjects.Sprite>();
  private readonly zombieLabels = new Map<string, Phaser.GameObjects.Text>();
  private readonly zombieTypes = new Map<string, ZombieType>();
  private readonly zombieHp = new Map<string, number>();
  private readonly zombiePreviousX = new Map<string, number>();
  private readonly towerViews = new Map<string, TowerView>();
  private projectileGraphics?: Phaser.GameObjects.Graphics;

  constructor() {
    super('Game');
  }

  init(data?: object): void {
    const payload = data as { simulation?: GameSimulation } | undefined;
    this.simulation = payload?.simulation;
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#82954d');
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.add
      .image(WORLD_WIDTH / 2, WORLD_HEIGHT / 2, 'battlefield')
      .setOrigin(0.5)
      .setScale(2)
      .setDepth(0);

    this.projectileGraphics = this.add.graphics().setDepth(10);
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (!this.simulation || this.simulation.phase !== 'playing') return;
      const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
      const gridX = Math.floor(worldPoint.x / CELL_SIZE);
      const gridY = Math.floor(worldPoint.y / CELL_SIZE);
      this.onGridClick?.(gridX, gridY);
    });

    this.scale.on('resize', () => this.cameras.main.centerOn(WORLD_WIDTH / 2, WORLD_HEIGHT / 2));
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.clearViews, this);
  }

  update(_time: number, delta: number): void {
    if (!this.simulation) return;
    this.simulation.update(delta);
    this.syncTowers();
    this.syncZombies();
    this.syncProjectiles();
  }

  private clearViews(): void {
    for (const view of this.towerViews.values()) view.container.destroy(true);
    for (const sprite of this.zombieViews.values()) sprite.destroy();
    for (const label of this.zombieLabels.values()) label.destroy();
    this.towerViews.clear();
    this.zombieViews.clear();
    this.zombieLabels.clear();
    this.zombieTypes.clear();
    this.zombieHp.clear();
    this.zombiePreviousX.clear();
  }

  private syncTowers(): void {
    const simulation = this.simulation;
    if (!simulation) return;

    const activeIds = new Set(simulation.towers.map((tower) => tower.id));
    for (const [id, view] of this.towerViews) {
      if (activeIds.has(id)) continue;
      view.container.destroy(true);
      this.towerViews.delete(id);
    }

    const skinColors: Record<string, number> = {
      classic: 0xffdc75,
      mint: 0x9de2b4,
      sunset: 0xffa6c9,
    };
    const accent = skinColors[simulation.saveData.selectedSkin] ?? skinColors.classic!;

    for (const tower of simulation.towers) {
      let view = this.towerViews.get(tower.id);
      if (!view) {
        const shadow = this.add.ellipse(0, 7, 36, 12, 0x263222, 0.35);
        const sprite = this.add
          .sprite(0, 0, 'gameAtlas', towerFrameKey(tower.type, 'idle', 0))
          .setOrigin(0.5, 0.92)
          .setScale(1.5);
        const levelBadge = this.add
          .text(14, -27, `Lv.${tower.level}`, {
            fontFamily: 'K2D, Tahoma, sans-serif',
            fontSize: '9px',
            fontStyle: 'bold',
            color: '#18243b',
            backgroundColor: '#ffdc75',
            padding: { x: 3, y: 2 },
            stroke: '#fff4db',
            strokeThickness: 1,
          })
          .setOrigin(0.5);
        const ring = this.add
          .circle(0, 0, 22, 0x000000, 0)
          .setStrokeStyle(2, accent, 0.95);
        const container = this.add
          .container(tower.x, tower.y, [shadow, ring, sprite, levelBadge])
          .setDepth(4);

        view = { container, sprite, levelBadge, level: tower.level };
        this.towerViews.set(tower.id, view);

        if (tower.level > 1) {
          sprite.play(towerAnimationKey(tower.type, 'upgrade'));
          sprite.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
            if (sprite.active) sprite.play(towerAnimationKey(tower.type, 'idle'));
          });
        } else {
          sprite.play(towerAnimationKey(tower.type, 'idle'));
        }
      } else if (tower.level !== view.level) {
        view.level = tower.level;
        view.levelBadge.setText(`Lv.${tower.level}`);
        view.sprite.play(towerAnimationKey(tower.type, 'upgrade'));
        view.sprite.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
          if (view && view.sprite.active) view.sprite.play(towerAnimationKey(tower.type, 'idle'));
        });
      }
      view.container.setPosition(tower.x, tower.y);
    }
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
      this.zombieHp.delete(id);
      this.zombiePreviousX.delete(id);

      sprite.play(zombieAnimationKey(zombieType, 'dead'));
      this.tweens.add({
        targets: sprite,
        alpha: 0,
        duration: 540,
        delay: 250,
        onComplete: () => sprite.destroy(),
      });
    }

    for (const zombie of simulation.zombies) {
      let sprite = this.zombieViews.get(zombie.id);
      if (!sprite) {
        const scaleByType: Record<ZombieType, number> = {
          normal: 1.75,
          runner: 1.55,
          tank: 2.05,
          jumper: 1.8,
          healer: 1.75,
          splitter: 1.85,
          boss: 2.25,
        };

        sprite = this.add
          .sprite(zombie.x, zombie.y, 'gameAtlas', zombieFrameKey(zombie.type, 'walk', 0))
          .setOrigin(0.5, 0.88)
          .setScale(scaleByType[zombie.type])
          .setDepth(6);
        sprite.play(zombieAnimationKey(zombie.type, 'walk'));

        this.zombieTypes.set(zombie.id, zombie.type);
        this.zombieHp.set(zombie.id, zombie.hp);
        this.zombiePreviousX.set(zombie.id, zombie.x);

        const label = this.add
          .text(zombie.x, zombie.y - 34, '', {
            fontFamily: 'K2D, Tahoma, sans-serif',
            fontSize: '10px',
            fontStyle: 'bold',
            color: '#18243b',
            backgroundColor: '#fff4db',
            padding: { x: 4, y: 2 },
            stroke: '#fff',
            strokeThickness: 1,
          })
          .setOrigin(0.5)
          .setDepth(7);
        this.zombieLabels.set(zombie.id, label);
        this.zombieViews.set(zombie.id, sprite);
      }

      const lastHp = this.zombieHp.get(zombie.id);
      const hurtKey = zombieAnimationKey(zombie.type, 'hurt');
      if (lastHp !== undefined && zombie.hp < lastHp && sprite.anims.currentAnim?.key !== hurtKey) {
        sprite.play(hurtKey);
        sprite.once(Phaser.Animations.Events.ANIMATION_COMPLETE, (animation) => {
          if (animation.key === hurtKey && sprite?.active) {
            sprite.play(zombieAnimationKey(zombie.type, 'walk'));
          }
        });
      }
      this.zombieHp.set(zombie.id, zombie.hp);

      const previousX = this.zombiePreviousX.get(zombie.id);
      if (previousX !== undefined && Math.abs(zombie.x - previousX) > 0.5) {
        sprite.setFlipX(zombie.x < previousX);
      }
      this.zombiePreviousX.set(zombie.id, zombie.x);
      sprite.setPosition(zombie.x, zombie.y);

      const label = this.zombieLabels.get(zombie.id);
      label?.setPosition(zombie.x, zombie.y - (zombie.type === 'boss' ? 48 : 35));
      label?.setText(
        zombie.shieldHits > 0
          ? `🔒 ${zombie.shieldHits}  ${zombie.wordLabel ?? ''}`
          : (zombie.wordLabel ?? 'คำศัพท์').slice(0, 15),
      );
    }
  }

  private syncProjectiles(): void {
    const graphics = this.projectileGraphics;
    if (!graphics || !this.simulation) return;
    graphics.clear();

    this.simulation.projectiles.forEach((projectile) => {
      graphics.fillStyle(
        projectile.behavior === 'slow'
          ? 0xc4a5ff
          : projectile.behavior === 'splash'
            ? 0x72e3df
            : 0xffdc75,
        1,
      );
      graphics.fillCircle(projectile.x, projectile.y, projectile.behavior === 'rapid' ? 3 : 5);
    });
  }
}
