import Phaser from 'phaser';
import { ART_KEYS, resolveEntityFrame } from '../assets/gameArt';
import {
  computeCoverScale,
  computeProceduralMotion,
  drawCrispHealthBar,
  getUnitRenderTuning,
  PROJECTILE_TUNING,
} from '../assets/renderTuning';
import { getOptimalResolution } from '../main';

export interface RenderableEntityState {
  id: number;
  typeKey: string;
  category: 'tower' | 'zombie' | 'boss';
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  range?: number;
  isMoving?: boolean;
  hitFlashRemainingMs?: number;
  isSlowed?: boolean;
}

export interface RenderableProjectileState {
  id: number;
  frameKey: string;
  x: number;
  y: number;
  rotation: number;
}

interface FloatingCombatText {
  textObj: Phaser.GameObjects.Text;
  vy: number;
  elapsedMs: number;
  durationMs: number;
}

export class GameScene extends Phaser.Scene {
  private backgroundImg?: Phaser.GameObjects.Image;
  private gridGraphics?: Phaser.GameObjects.Graphics;
  private shadowGraphics?: Phaser.GameObjects.Graphics;
  private healthBarGraphics?: Phaser.GameObjects.Graphics;

  private unitSprites = new Map<number, Phaser.GameObjects.Sprite>();
  private projectileSprites = new Map<number, Phaser.GameObjects.Sprite>();
  private floatingTexts: FloatingCombatText[] = [];

  // พิกัดช่องตารางที่เมาส์กำลังชี้อยู่สำหรับแสดง Preview ก่อนวางป้อม
  private hoveredCell: {
    x: number;
    y: number;
    width: number;
    height: number;
    canPlace: boolean;
    previewRange?: number;
  } | null = null;

  constructor() {
    super({ key: 'GameScene' });
  }

  public create(): void {
    const { width, height } = this.scale;

    // 1. วาดพื้นหลังสนามรบแบบ Cover Scale (ไม่บี้/ไม่ยืด) และดรอปแสงเล็กน้อยให้ป้อมและซอมบี้เด่นขึ้น
    if (this.textures.exists(ART_KEYS.BATTLEFIELD_BG)) {
      this.backgroundImg = this.add.image(width / 2, height / 2, ART_KEYS.BATTLEFIELD_BG);
      const scale = computeCoverScale(
        this.backgroundImg.width,
        this.backgroundImg.height,
        width,
        height
      );
      this.backgroundImg.setScale(scale);
      this.backgroundImg.setTint(0xe2e8f0);
      this.backgroundImg.setDepth(0);
    }

    // 2. เลเยอร์ตารางสนามรบและเงาใต้เท้า
    this.gridGraphics = this.add.graphics().setDepth(5);
    this.shadowGraphics = this.add.graphics().setDepth(10);
    this.healthBarGraphics = this.add.graphics().setDepth(2000);

    this.scale.on('resize', this.handleResize, this);
  }

  private handleResize(gameSize: Phaser.Structs.Size): void {
    if (!this.backgroundImg) return;
    const width = gameSize.width;
    const height = gameSize.height;
    this.backgroundImg.setPosition(width / 2, height / 2);
    const scale = computeCoverScale(
      this.backgroundImg.width,
      this.backgroundImg.height,
      width,
      height
    );
    this.backgroundImg.setScale(scale);
  }

  /**
   * อัปเดตตำแหน่งช่องตารางที่เมาส์ชี้เพื่อวาดกรอบไฮไลต์และวงรัศมีโจมตีของป้อม
   */
  public setHoveredCellPreview(
    cell: {
      x: number;
      y: number;
      width: number;
      height: number;
      canPlace: boolean;
      previewRange?: number;
    } | null
  ): void {
    this.hoveredCell = cell;
  }

  /**
   * แสดงตัวเลขดาเมจหรือข้อความแจ้งเตือนลอยขึ้นเหนือเป้าหมายอย่างคมชัด
   */
  public spawnFloatingText(
    x: number,
    y: number,
    message: string,
    color: string = '#fbbf24',
    isCritical: boolean = false
  ): void {
    const dpr = getOptimalResolution();
    const textObj = this.add
      .text(x, y, message, {
        fontFamily: '"Kanit", "Sarabun", sans-serif',
        fontSize: isCritical ? '24px' : '19px',
        fontStyle: 'bold',
        color,
        stroke: '#090d16',
        strokeThickness: 4,
        resolution: dpr,
        padding: { top: 8, bottom: 6, left: 4, right: 4 },
      })
      .setOrigin(0.5)
      .setDepth(2500);

    this.floatingTexts.push({
      textObj,
      vy: isCritical ? -52 : -38,
      elapsedMs: 0,
      durationMs: 750,
    });
  }

  /**
   * ซิงค์ข้อมูลจาก GameSimulation มาวาดลงบนฉากพร้อมเงา แอนิเมชัน และหลอดเลือด
   */
  public syncVisualState(
    entities: RenderableEntityState[],
    projectiles: RenderableProjectileState[],
    gridCells: Array<{ x: number; y: number; width: number; height: number }>,
    timeMs: number,
    dtMs: number
  ): void {
    this.drawBattlefieldGrid(gridCells);
    this.syncEntities(entities, timeMs);
    this.syncProjectiles(projectiles);
    this.updateFloatingTexts(dtMs);
  }

  private drawBattlefieldGrid(
    cells: Array<{ x: number; y: number; width: number; height: number }>
  ): void {
    if (!this.gridGraphics) return;
    this.gridGraphics.clear();

    // วาดเส้นตารางแบบโปร่งแสงกลมกลืนกับฉาก
    this.gridGraphics.lineStyle(1, 0xf8fafc, 0.11);
    for (const cell of cells) {
      this.gridGraphics.strokeRoundedRect(
        cell.x + 2,
        cell.y + 2,
        cell.width - 4,
        cell.height - 4,
        8
      );
    }

    // วาดช่องที่เมาส์กำลังชี้และวงรัศมีโจมตีของป้อม
    if (this.hoveredCell) {
      const { x, y, width, height, canPlace, previewRange } = this.hoveredCell;
      const highlightColor = canPlace ? 0x22c55e : 0xef4444;

      this.gridGraphics.fillStyle(highlightColor, 0.22);
      this.gridGraphics.fillRoundedRect(x + 2, y + 2, width - 4, height - 4, 8);

      this.gridGraphics.lineStyle(2, highlightColor, 0.85);
      this.gridGraphics.strokeRoundedRect(x + 2, y + 2, width - 4, height - 4, 8);

      if (canPlace && previewRange && previewRange > 0) {
        const centerX = x + width / 2;
        const centerY = y + height / 2;
        this.gridGraphics.fillStyle(0x38bdf8, 0.08);
        this.gridGraphics.fillCircle(centerX, centerY, previewRange);
        this.gridGraphics.lineStyle(1.5, 0x38bdf8, 0.45);
        this.gridGraphics.strokeCircle(centerX, centerY, previewRange);
      }
    }
  }

  private syncEntities(entities: RenderableEntityState[], timeMs: number): void {
    if (!this.shadowGraphics || !this.healthBarGraphics) return;
    this.shadowGraphics.clear();
    this.healthBarGraphics.clear();

    const activeIds = new Set<number>();

    for (const entity of entities) {
      activeIds.add(entity.id);
      const tuning = getUnitRenderTuning(entity.category, entity.typeKey);

      let sprite = this.unitSprites.get(entity.id);
      if (!sprite) {
        const frameName = resolveEntityFrame(entity.typeKey);
        sprite = this.add.sprite(entity.x, entity.y, ART_KEYS.ATLAS, frameName);
        sprite.setOrigin(tuning.originX, tuning.originY);
        this.unitSprites.set(entity.id, sprite);
      }

      const footX = Math.round(entity.x + tuning.offsetX);
      const footY = Math.round(entity.y + tuning.offsetY);

      // 1. วาดเงาวงรีใต้เท้าเพื่อให้ป้อมและซอมบี้ยืนติดพื้นสนามรบ
      this.shadowGraphics.fillStyle(0x090d16, 0.36);
      this.shadowGraphics.fillEllipse(
        footX,
        footY,
        tuning.shadowRadiusX * 2,
        tuning.shadowRadiusY * 2
      );

      // 2. คำนวณแอนิเมชันหายใจ (ป้อม) หรือก้าวเดิน (ซอมบี้)
      const motion = computeProceduralMotion(
        timeMs,
        entity.id,
        Boolean(entity.isMoving),
        tuning.scale
      );

      sprite.setPosition(footX, Math.round(footY + motion.offsetY));
      sprite.setScale(motion.scaleX, motion.scaleY);
      sprite.setRotation(motion.rotation);

      // 3. จัดลำดับความลึกตามแกน Y (ตัวที่อยู่เลนล่างจะบังตัวที่อยู่เลนบนอย่างถูกต้อง)
      sprite.setDepth(Math.max(20, footY));

      // 4. เอฟเฟกต์สีเมื่อโดนโจมตี (Hit Flash) หรือติดสถานะสโลว์
      if (entity.hitFlashRemainingMs && entity.hitFlashRemainingMs > 0) {
        sprite.setTintFill(0xffffff);
      } else if (entity.isSlowed) {
        sprite.setTint(0x7dd3fc);
      } else {
        sprite.clearTint();
      }

      // 5. วาดหลอดเลือดเฉพาะซอมบี้ บอส หรือป้อมที่เลือดลด
      if (entity.category !== 'tower' || entity.hp < entity.maxHp) {
        drawCrispHealthBar(
          this.healthBarGraphics,
          footX,
          footY + tuning.healthBarOffsetY,
          tuning.healthBarWidth,
          entity.category === 'boss' ? 9 : 6,
          entity.hp,
          entity.maxHp,
          entity.category === 'boss'
        );
      }
    }

    // ลบ Sprite ของยูนิตที่ตายหรือถูกนำออกจากสนามรบแล้ว
    for (const [id, sprite] of this.unitSprites.entries()) {
      if (!activeIds.has(id)) {
        sprite.destroy();
        this.unitSprites.delete(id);
      }
    }
  }

  private syncProjectiles(projectiles: RenderableProjectileState[]): void {
    const activeIds = new Set<number>();

    for (const proj of projectiles) {
      activeIds.add(proj.id);
      let sprite = this.projectileSprites.get(proj.id);
      if (!sprite) {
        const frameName = resolveEntityFrame(proj.frameKey);
        sprite = this.add.sprite(proj.x, proj.y, ART_KEYS.ATLAS, frameName);
        sprite.setScale(PROJECTILE_TUNING.scale);
        sprite.setDepth(1500);
        this.projectileSprites.set(proj.id, sprite);
      }

      sprite.setPosition(Math.round(proj.x), Math.round(proj.y));
      sprite.setRotation(proj.rotation);
    }

    for (const [id, sprite] of this.projectileSprites.entries()) {
      if (!activeIds.has(id)) {
        sprite.destroy();
        this.projectileSprites.delete(id);
      }
    }
  }

  private updateFloatingTexts(dtMs: number): void {
    const dtSec = dtMs / 1000;
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const item = this.floatingTexts[i];
      item.elapsedMs += dtMs;
      item.textObj.y += item.vy * dtSec;

      const progress = Phaser.Math.Clamp(item.elapsedMs / item.durationMs, 0, 1);
      item.textObj.setAlpha(1 - Math.pow(progress, 2));

      if (item.elapsedMs >= item.durationMs) {
        item.textObj.destroy();
        this.floatingTexts.splice(i, 1);
      }
    }
  }
}
