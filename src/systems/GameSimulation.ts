import { BALANCE } from '../data/balance';
import { UPGRADE_CARDS, type UpgradeCard, type UpgradeId } from '../data/cards';
import type { Question, QuestionCategory } from '../data/questionTypes';
import { TOWERS, type TowerType } from '../data/towers';
import { ZOMBIES } from '../data/zombies';
import type { ProjectileEntity } from '../entities/Projectile';
import type { TowerEntity } from '../entities/Tower';
import type { ZombieEntity } from '../entities/Zombie';
import { seededRandom } from '../utils/seededRandom';
import { getBangkokDateKey } from './DailyChallenge';
import { EconomySystem } from './EconomySystem';
import { canPlaceTower, CELL_SIZE, GRID_PATH } from './GridSystem';
import { ObjectPool } from './ObjectPool';
import { isAnswerCorrect, QuestionManager } from './QuestionManager';
import { SaveSystem, type SaveData } from './SaveSystem';
import { WaveManager } from './WaveManager';

export type GameMode = 'endless' | 'daily' | 'practice';
export type GamePhase = 'menu' | 'playing' | 'practice' | 'wave-clear' | 'game-over';

export interface SimulationOptions {
  mode?: GameMode;
  category?: QuestionCategory | 'all';
  difficulty?: 1 | 2 | 3 | 'all';
  seed?: number;
  slowMode?: boolean;
  timerEnabled?: boolean;
}

export interface GameResultSummary {
  wave: number; score: number; accuracy: number; correct: number; incorrect: number; review: Question[];
}

export interface SimulationSnapshot {
  phase: GamePhase;
  mode: GameMode;
  wave: number;
  coreHp: number;
  maxCoreHp: number;
  coins: number;
  score: number;
  combo: number;
  correct: number;
  incorrect: number;
  spawned: number;
  totalToSpawn: number;
  zombies: ZombieEntity[];
  towers: TowerEntity[];
  question: Question;
  timeLeftMs: number;
  message: string;
  choicesEnabled: boolean;
  upgradeCards: UpgradeCard[];
  selectedTowerId: string | null;
  accuracy: number;
  timerEnabled: boolean;
  slowMode: boolean;
  lastAnswer: { correct: boolean; explanation: string; reward: number } | null;
  paused: boolean;
}

const routePoints = GRID_PATH.map((point) => ({ x: point.x * CELL_SIZE + CELL_SIZE / 2, y: point.y * CELL_SIZE + CELL_SIZE / 2 }));
const routeLengths: number[] = [];
let routeLength = 0;
for (let index = 1; index < routePoints.length; index += 1) {
  const previous = routePoints[index - 1];
  const current = routePoints[index];
  if (!previous || !current) continue;
  const length = Math.hypot(current.x - previous.x, current.y - previous.y);
  routeLengths.push(length);
  routeLength += length;
}

interface ProjectilePoolItem extends ProjectileEntity { active: boolean }

export class GameSimulation {
  phase: GamePhase = 'menu';
  readonly mode: GameMode;
  readonly category: QuestionCategory | 'all';
  readonly difficulty: 1 | 2 | 3 | 'all';
  readonly towers: TowerEntity[] = [];
  readonly zombies: ZombieEntity[] = [];
  readonly projectiles: ProjectilePoolItem[] = [];
  readonly questionManager: QuestionManager;
  readonly economy = new EconomySystem({ correctReward: BALANCE.correctReward, comboStep: BALANCE.comboStep, comboBonus: BALANCE.comboBonus, wrongAnswerSpeedBoostMs: BALANCE.wrongAnswerSpeedBoostMs });
  readonly waveManager = new WaveManager();
  readonly saveSystem: SaveSystem;
  saveData: SaveData;
  coreHp: number = BALANCE.startingCoreHp;
  maxCoreHp: number = BALANCE.startingCoreHp;
  coins = BALANCE.startingCoins;
  wave = 0;
  score = 0;
  correct = 0;
  incorrect = 0;
  spawned = 0;
  totalToSpawn = 0;
  timeLeftMs = BALANCE.questionTimeSeconds * 1000;
  message = 'ตอบคำถามเพื่อรับเหรียญและช่วยโรงเรียน!';
  activeQuestion: Question;
  selectedTowerId: string | null = null;
  upgradeCards: UpgradeCard[] = [];
  slowMode: boolean;
  timerEnabled: boolean;
  gameSpeedMultiplier = 1;
  rapidFireMultiplier = 1;
  damageMultiplier = 1;
  rangeMultiplier = 1;
  extraShieldBreak = 0;
  practiceQueue: Question[] = [];
  private readonly random: () => number;
  private readonly seed: number;
  private spawnTimerMs = 0;
  private questionTimerMs = 0;
  private nextEntityId = 1;
  private waveConfig = this.waveManager.getWaveConfig(1);
  private answerLocked = false;
  private resultMessage = '';
  private lastAnswerResult: { correct: boolean; explanation: string; reward: number } | null = null;
  private readonly zombiePool = new ObjectPool<ZombieEntity>(
    () => ({ id: '', type: 'normal', x: 0, y: 0, progress: 0, hp: 0, maxHp: 0, speed: 0, shieldHits: 0, slowMs: 0, boostedMs: 0, healTimerMs: 0, hasSplit: false, isAlive: false }),
    (zombie) => { zombie.isAlive = false; zombie.wordLabel = undefined; },
    300,
  );
  private readonly projectilePool = new ObjectPool<ProjectilePoolItem>(
    () => ({ id: '', x: 0, y: 0, targetId: '', damage: 0, speed: 0, behavior: 'single', slowMultiplier: BALANCE.slowMultiplier, splashRadius: BALANCE.splashRadius, active: false }),
    (projectile) => { projectile.active = false; projectile.targetId = ''; },
    240,
  );

  constructor(questions: Question[], options: SimulationOptions = {}, saveSystem = new SaveSystem()) {
    this.mode = options.mode ?? 'endless';
    this.category = options.category ?? 'all';
    this.difficulty = options.difficulty ?? 'all';
    this.slowMode = options.slowMode ?? false;
    this.timerEnabled = options.timerEnabled ?? true;
    this.seed = options.seed ?? Date.now();
    this.random = seededRandom(this.seed);
    this.saveSystem = saveSystem;
    this.saveData = saveSystem.load();
    this.questionManager = new QuestionManager(questions, { wrongAnswerWeight: this.mode === 'daily' ? 0 : 2 });
    this.questionManager.importWrongAnswers(this.saveData.wrongAnswers);
    this.activeQuestion = this.pickQuestion();
  }

  start(): void {
    if (this.mode === 'practice') {
      this.phase = 'practice';
      this.practiceQueue = this.questionManager.getWeakQuestions(20);
      if (this.practiceQueue[0]) this.activeQuestion = this.practiceQueue[0];
      this.message = 'โหมดฝึกซ้อม: ค่อย ๆ คิดได้เลย ไม่มีซอมบี้!';
      return;
    }
    this.phase = 'playing';
    this.wave = 1;
    this.prepareWave();
  }

  update(deltaMs: number): void {
    if (this.phase !== 'playing') return;
    const dt = Math.min(Math.max(deltaMs, 0), BALANCE.maxDeltaMs) * this.gameSpeedMultiplier;
    this.timeLeftMs = this.timerEnabled ? Math.max(0, this.timeLeftMs - dt) : this.timeLeftMs;
    if (this.timerEnabled && this.timeLeftMs <= 0 && !this.answerLocked) this.answerQuestion('__TIMEOUT__');
    this.spawnTimerMs -= dt;
    if (this.spawned < this.totalToSpawn && this.spawnTimerMs <= 0) this.spawnZombie();
    this.updateZombies(dt);
    this.updateTowers(dt);
    this.updateProjectiles(dt);
    this.updateHealers(dt);
    this.questionTimerMs += dt;
    if (this.questionTimerMs >= BALANCE.questionIntervalMs && !this.answerLocked) {
      this.message = 'มีโจทย์ใหม่รออยู่! ตอบให้ถูกเพื่อรับเหรียญ';
      this.questionTimerMs = 0;
    }
    if (this.coreHp <= 0) this.finishGame();
    else if (this.spawned >= this.totalToSpawn && this.zombies.length === 0 && this.projectiles.every((projectile) => !projectile.active)) this.finishWave();
  }

  placeTower(type: TowerType, gridX: number, gridY: number): boolean {
    if (this.phase !== 'playing') return false;
    const occupied = this.towers.map((tower) => ({ x: tower.gridX, y: tower.gridY }));
    if (!canPlaceTower(gridX, gridY, occupied)) return false;
    const config = TOWERS[type];
    if (this.coins < config.cost) return false;
    this.coins -= config.cost;
    const tower: TowerEntity = {
      id: `tower-${this.nextEntityId++}`, type, gridX, gridY,
      x: gridX * CELL_SIZE + CELL_SIZE / 2,
      y: gridY * CELL_SIZE + CELL_SIZE / 2,
      level: 1, cooldownMs: 200,
    };
    this.towers.push(tower);
    this.selectedTowerId = tower.id;
    return true;
  }

  selectTowerAt(gridX: number, gridY: number): TowerEntity | null {
    const tower = this.towers.find((item) => item.gridX === gridX && item.gridY === gridY) ?? null;
    this.selectedTowerId = tower?.id ?? null;
    return tower;
  }

  upgradeSelectedTower(): boolean {
    const tower = this.towers.find((item) => item.id === this.selectedTowerId);
    if (!tower || tower.level >= 3) return false;
    const cost = TOWERS[tower.type].upgradeCosts[tower.level - 1] ?? 999;
    if (this.coins < cost) return false;
    this.coins -= cost;
    tower.level = (tower.level + 1) as 2 | 3;
    return true;
  }

  answerQuestion(answer: string): { correct: boolean; explanation: string; reward: number } {
    if (this.answerLocked || (this.phase !== 'playing' && this.phase !== 'practice')) return { correct: false, explanation: 'รอสักครู่นะ', reward: 0 };
    this.answerLocked = true;
    const question = this.activeQuestion;
    const isCorrect = isAnswerCorrect(question, answer);
    this.questionManager.recordAnswer(question.id, isCorrect);
    let earnedCoins = 0;
    if (isCorrect) {
      this.correct += 1;
      this.score += 100 + (this.economy.getCombo() + 1) * 10;
      if (this.phase === 'playing') {
        const reward = this.economy.answer(true);
        earnedCoins = reward.coins;
        this.coins += reward.coins;
        this.breakShield();
        this.message = ['เก่งมาก! ได้เหรียญเพิ่ม', 'ยอดเยี่ยม! คอมโบกำลังมา', 'ตอบถูกแล้ว โรงเรียนปลอดภัยขึ้น!'][Math.floor(this.random() * 3)] ?? 'ตอบถูกแล้ว!';
      } else {
        this.economy.answer(true);
        this.message = 'ถูกต้อง! เก่งมาก ลองข้อต่อไปกัน';
      }
    } else {
      this.incorrect += 1;
      if (this.phase === 'playing') {
        this.economy.answer(false);
        for (const zombie of this.zombies) zombie.boostedMs = BALANCE.wrongAnswerSpeedBoostMs;
        this.message = answer === '__TIMEOUT__' ? 'หมดเวลาแล้ว ไม่เป็นไร ลองข้อถัดไปนะ!' : 'ยังไม่ถูกนะ ลองจำคำอธิบายไว้ ซอมบี้วิ่งเร็วขึ้นนิดหน่อย!';
      } else {
        this.economy.answer(false);
        this.message = 'ยังไม่ถูกนะ อ่านคำอธิบายแล้วลองใหม่ได้เลย';
      }
    }
    this.resultMessage = isCorrect ? 'ตอบถูก!' : 'คำตอบที่ถูก: ' + question.answer.replaceAll('|', ' ');
    this.lastAnswerResult = { correct: isCorrect, explanation: question.explanation, reward: earnedCoins };
    this.persistAnswer(question, isCorrect);
    if (this.phase === 'practice' && this.practiceQueue.length > 0) this.practiceQueue.shift();
    this.timeLeftMs = this.getQuestionTimeMs();
    return { correct: isCorrect, explanation: question.explanation, reward: earnedCoins };
  }

  advanceQuestion(): void {
    this.activeQuestion = this.practiceQueue.length ? this.practiceQueue[0] as Question : this.pickQuestion();
    this.answerLocked = false;
    this.resultMessage = '';
    this.lastAnswerResult = null;
    this.timeLeftMs = this.getQuestionTimeMs();
    this.questionTimerMs = 0;
  }

  chooseUpgrade(id: UpgradeId): void {
    if (this.phase !== 'wave-clear') return;
    switch (id) {
      case 'rapid-fire': this.rapidFireMultiplier *= 1.12; break;
      case 'fortify': this.maxCoreHp += 120; this.coreHp = Math.min(this.maxCoreHp, this.coreHp + 120); break;
      case 'study-time': this.slowMode = true; break;
      case 'income': this.coins += 55; break;
      case 'repair': this.coreHp = Math.min(this.maxCoreHp, this.coreHp + 180); break;
      case 'range': this.rangeMultiplier *= 1.1; break;
      case 'power': this.damageMultiplier *= 1.15; break;
      case 'shield-break': this.extraShieldBreak += 1; break;
    }
    this.wave += 1;
    this.prepareWave();
  }

  setPaused(paused: boolean): void {
    if (this.phase === 'playing') this.gameSpeedMultiplier = paused ? 0 : 1;
  }

  setGameSpeed(multiplier: number): void { this.gameSpeedMultiplier = Math.max(0.5, Math.min(multiplier, 1.5)); }

  setQuestionOptions(options: { timerEnabled?: boolean; slowMode?: boolean }): void {
    if (options.timerEnabled !== undefined) this.timerEnabled = options.timerEnabled;
    if (options.slowMode !== undefined) this.slowMode = options.slowMode;
    this.timeLeftMs = this.getQuestionTimeMs();
  }

  getSnapshot(): SimulationSnapshot {
    return {
      phase: this.phase, mode: this.mode, wave: this.wave, coreHp: this.coreHp, maxCoreHp: this.maxCoreHp,
      coins: this.coins, score: this.score, combo: this.economy.getCombo(), correct: this.correct,
      incorrect: this.incorrect, spawned: this.spawned, totalToSpawn: this.totalToSpawn,
      zombies: [...this.zombies], towers: [...this.towers], question: this.activeQuestion,
      timeLeftMs: this.timeLeftMs, message: this.resultMessage || this.message,
      choicesEnabled: !this.answerLocked, upgradeCards: [...this.upgradeCards],
      selectedTowerId: this.selectedTowerId, accuracy: this.correct + this.incorrect > 0 ? this.correct / (this.correct + this.incorrect) : 0,
      timerEnabled: this.timerEnabled, slowMode: this.slowMode, lastAnswer: this.lastAnswerResult, paused: this.phase === 'playing' && this.gameSpeedMultiplier === 0,
    };
  }

  getReviewList(limit = 8): Question[] { return this.questionManager.getWeakQuestions(limit); }

  getResult(): GameResultSummary {
    return { wave: this.wave, score: this.score, accuracy: this.correct + this.incorrect ? this.correct / (this.correct + this.incorrect) : 0, correct: this.correct, incorrect: this.incorrect, review: this.getReviewList() };
  }

  exportResults(): string {
    const result = this.getResult();
    const categoryCounts = this.questionManager.getStats();
    const rows = [
      'ซอมบี้ศัพท์ไทย — สรุปผลการเล่น',
      `โหมด: ${this.mode} | เวฟ: ${result.wave} | คะแนน: ${result.score}`,
      `ตอบถูก: ${result.correct} | ตอบผิด: ${result.incorrect} | ความแม่นยำ: ${(result.accuracy * 100).toFixed(1)}%`,
      `วันที่: ${new Date().toLocaleString('th-TH')}`,
      'คำที่ควรทบทวน:',
      ...result.review.map((question) => `- ${question.question} | คำตอบ: ${question.answer.replaceAll('|', ' ')} | ${question.explanation}`),
      `รวมสถิติ: ${categoryCounts.correct} ถูก / ${categoryCounts.incorrect} ผิด`,
    ];
    return rows.join('\n');
  }

  saveProgress(): void { this.saveSystem.save(this.saveData); }

  private persistAnswer(question: Question, isCorrect: boolean): void {
    const category = this.saveData.categoryStats[question.category] ?? { correct: 0, incorrect: 0 };
    if (isCorrect) {
      category.correct += 1;
      this.saveData.correctAnswers += 1;
    } else {
      category.incorrect += 1;
      this.saveData.incorrectAnswers += 1;
      this.saveData.wrongAnswers[question.id] = (this.saveData.wrongAnswers[question.id] ?? 0) + 1;
    }
    this.saveData.categoryStats[question.category] = category;
    const today = getBangkokDateKey();
    if (this.saveData.dailyMission.date !== today) this.saveData.dailyMission = { date: today, correct: 0, claimed: false };
    if (isCorrect) this.saveData.dailyMission.correct += 1;
    if (this.saveData.dailyMission.correct >= 10 && !this.saveData.dailyMission.claimed) {
      this.saveData.dailyMission.claimed = true;
      this.saveData.totalStars += 1;
      this.message = 'ภารกิจประจำวันสำเร็จ! ได้รับดาวเพิ่ม 1 ดวง';
    }
    this.saveSystem.save(this.saveData);
  }

  private prepareWave(): void {
    this.phase = 'playing';
    this.waveConfig = this.waveManager.getWaveConfig(this.wave);
    this.totalToSpawn = this.waveConfig.totalEnemies;
    this.spawned = 0;
    this.spawnTimerMs = 100;
    this.questionTimerMs = 0;
    this.message = this.waveConfig.isBossWave ? `เวฟ ${this.wave}: บอสมาแล้ว! ต้องตอบถูก 3 ข้อเพื่อทำลายโล่` : `เวฟ ${this.wave}: เตรียมปกป้องห้องสมุด!`;
    this.advanceQuestion();
  }

  private spawnZombie(): void {
    const bossWave = this.waveConfig.isBossWave;
    const spawnBoss = bossWave && this.spawned === 0;
    const possible = this.waveConfig.enemyTypes;
    const selectedType = spawnBoss ? 'boss' : (possible[Math.floor(this.random() * possible.length)] ?? 'normal');
    const config = ZOMBIES[selectedType];
    const healthFactor = this.waveConfig.healthMultiplier;
    const zombie = this.zombiePool.acquire();
    Object.assign(zombie, {
      id: `zombie-${this.nextEntityId++}`, type: selectedType, wordLabel: this.activeQuestion.choices.find((choice) => choice !== this.activeQuestion.answer) ?? 'คำศัพท์',
      x: routePoints[0]?.x ?? 0, y: routePoints[0]?.y ?? 0, progress: 0,
      hp: Math.round(config.hp * healthFactor), maxHp: Math.round(config.hp * healthFactor),
      speed: config.speed * this.waveConfig.speedMultiplier,
      shieldHits: spawnBoss ? BALANCE.bossQuestionCount : this.spawned % 4 === 2 ? 1 : 0,
      slowMs: 0, boostedMs: 0, healTimerMs: 0, hasSplit: false, isAlive: true,
    });
    this.zombies.push(zombie);
    this.spawned += 1;
    this.spawnTimerMs = this.waveConfig.spawnIntervalMs;
  }

  private updateZombies(deltaMs: number): void {
    for (const zombie of [...this.zombies]) {
      if (!zombie.isAlive) continue;
      let speed = zombie.speed;
      if (zombie.slowMs > 0) { speed *= BALANCE.slowMultiplier; zombie.slowMs = Math.max(0, zombie.slowMs - deltaMs); }
      if (zombie.boostedMs > 0) { speed *= BALANCE.wrongAnswerSpeedMultiplier; zombie.boostedMs = Math.max(0, zombie.boostedMs - deltaMs); }
      if (zombie.type === 'jumper' && zombie.slowMs > 0) speed = zombie.speed;
      zombie.progress += speed * deltaMs / 1000;
      const position = getRoutePosition(zombie.progress);
      zombie.x = position.x;
      zombie.y = position.y;
      if (zombie.progress >= routeLength) {
        this.coreHp = Math.max(0, this.coreHp - ZOMBIES[zombie.type].coreDamage);
        this.removeZombie(zombie);
      }
    }
  }

  private updateTowers(deltaMs: number): void {
    for (const tower of this.towers) {
      const config = TOWERS[tower.type];
      if (config.behavior === 'support') continue;
      tower.cooldownMs = Math.max(0, tower.cooldownMs - deltaMs);
      if (tower.cooldownMs > 0) continue;
      const range = config.range * this.rangeMultiplier + (tower.level - 1) * 12;
      const target = this.zombies
        .filter((zombie) => zombie.isAlive && Math.hypot(zombie.x - tower.x, zombie.y - tower.y) <= range)
        .sort((left, right) => right.progress - left.progress)[0];
      if (!target) continue;
      const damage = config.damage * this.damageMultiplier * this.economy.getDamageMultiplier() * (1 + (tower.level - 1) * 0.42);
      const projectile = this.projectilePool.acquire();
      projectile.id = `projectile-${this.nextEntityId++}`;
      projectile.x = tower.x;
      projectile.y = tower.y;
      projectile.targetId = target.id;
      projectile.damage = damage;
      projectile.speed = config.behavior === 'rapid' ? 440 : 330;
      projectile.behavior = config.behavior;
      projectile.active = true;
      this.projectiles.push(projectile);
      tower.cooldownMs = config.cooldownMs / this.rapidFireMultiplier * Math.pow(0.88, tower.level - 1);
    }
  }

  private updateProjectiles(deltaMs: number): void {
    for (let index = this.projectiles.length - 1; index >= 0; index -= 1) {
      const projectile = this.projectiles[index];
      if (!projectile?.active) { this.projectiles.splice(index, 1); continue; }
      const target = this.zombies.find((zombie) => zombie.id === projectile.targetId && zombie.isAlive);
      if (!target) { this.releaseProjectile(index, projectile); continue; }
      const dx = target.x - projectile.x;
      const dy = target.y - projectile.y;
      const distance = Math.hypot(dx, dy);
      const travel = projectile.speed * deltaMs / 1000;
      if (distance <= Math.max(12, travel)) {
        this.hitZombie(target, projectile);
        this.releaseProjectile(index, projectile);
      } else {
        projectile.x += dx / distance * travel;
        projectile.y += dy / distance * travel;
      }
    }
  }

  private hitZombie(target: ZombieEntity, projectile: ProjectilePoolItem): void {
    if (target.shieldHits > 0) return;
    const applyDamage = (zombie: ZombieEntity, damage: number): void => {
      zombie.hp -= damage;
      if (projectile.behavior === 'slow') zombie.slowMs = Math.max(zombie.slowMs, BALANCE.slowDurationMs);
      if (zombie.hp <= 0) this.killZombie(zombie);
    };
    if (projectile.behavior === 'splash') {
      for (const zombie of [...this.zombies]) {
        if (zombie.isAlive && Math.hypot(zombie.x - target.x, zombie.y - target.y) <= projectile.splashRadius) applyDamage(zombie, projectile.damage);
      }
    } else {
      applyDamage(target, projectile.damage);
      if (projectile.behavior === 'pierce') {
        const next = this.zombies.find((zombie) => zombie.isAlive && zombie.id !== target.id && zombie.shieldHits === 0 && Math.hypot(zombie.x - target.x, zombie.y - target.y) < 38);
        if (next) applyDamage(next, projectile.damage * 0.45);
      }
    }
  }

  private updateHealers(deltaMs: number): void {
    for (const tower of this.towers) {
      if (tower.type !== 'teacher') continue;
      tower.cooldownMs -= deltaMs;
      if (tower.cooldownMs > 0) continue;
      this.coreHp = Math.min(this.maxCoreHp, this.coreHp + 14 + tower.level * 7);
      this.timeLeftMs = Math.min(this.getQuestionTimeMs() + 5000, this.timeLeftMs + 2500);
      tower.cooldownMs = TOWERS.teacher.cooldownMs * Math.pow(0.86, tower.level - 1);
    }
    for (const healer of this.zombies.filter((zombie) => zombie.type === 'healer')) {
      healer.healTimerMs += deltaMs;
      if (healer.healTimerMs < 2200) continue;
      const target = this.zombies.find((zombie) => zombie.id !== healer.id && zombie.isAlive && zombie.hp < zombie.maxHp && Math.hypot(zombie.x - healer.x, zombie.y - healer.y) < 100);
      if (target) target.hp = Math.min(target.maxHp, target.hp + 12);
      healer.healTimerMs = 0;
    }
  }

  private killZombie(zombie: ZombieEntity): void {
    if (!zombie.isAlive) return;
    zombie.isAlive = false;
    this.score += ZOMBIES[zombie.type].reward * 10;
    this.coins += ZOMBIES[zombie.type].reward;
    if (zombie.type === 'splitter' && !zombie.hasSplit) {
      for (const offset of [-12, 12]) {
        const child = this.zombiePool.acquire();
        Object.assign(child, { ...zombie, id: `zombie-${this.nextEntityId++}`, type: 'runner', x: zombie.x, y: zombie.y + offset, hp: 18, maxHp: 18, speed: zombie.speed * 1.2, progress: zombie.progress, shieldHits: 0, hasSplit: true, isAlive: true, boostedMs: 0, slowMs: 0 });
        this.zombies.push(child);
      }
    }
    this.removeZombie(zombie);
  }

  private removeZombie(zombie: ZombieEntity): void {
    zombie.isAlive = false;
    const index = this.zombies.indexOf(zombie);
    if (index >= 0) { this.zombies.splice(index, 1); this.zombiePool.release(zombie); }
  }

  private releaseProjectile(index: number, projectile: ProjectilePoolItem): void {
    this.projectiles.splice(index, 1);
    this.projectilePool.release(projectile);
  }

  private breakShield(): void {
    const target = [...this.zombies].filter((zombie) => zombie.shieldHits > 0).sort((left, right) => right.progress - left.progress)[0];
    if (target) target.shieldHits = Math.max(0, target.shieldHits - 1 - this.extraShieldBreak);
    this.extraShieldBreak = 0;
  }

  private finishWave(): void {
    this.phase = 'wave-clear';
    this.message = `ผ่านเวฟ ${this.wave} แล้ว! เลือกการ์ดอัปเกรด 1 ใบ`;
    const cards = [...UPGRADE_CARDS];
    this.upgradeCards = [];
    while (this.upgradeCards.length < 3 && cards.length) {
      const index = Math.floor(this.random() * cards.length);
      const card = cards.splice(index, 1)[0];
      if (card) this.upgradeCards.push(card);
    }
  }

  private finishGame(): void {
    this.phase = 'game-over';
    const earnedStars = Math.max(1, Math.min(3, Math.floor(this.wave / 3) + 1));
    this.saveData.highScore = Math.max(this.saveData.highScore, this.score);
    this.saveData.bestWave = Math.max(this.saveData.bestWave, this.wave);
    const dailyKey = getBangkokDateKey();
    if (this.mode !== 'daily' || this.saveData.lastDailyDate !== dailyKey) {
      this.saveData.totalStars += earnedStars;
      if (this.mode === 'daily') this.saveData.lastDailyDate = dailyKey;
    }
    if (this.wave >= 5 && !this.saveData.achievements.includes('boss-breaker')) this.saveData.achievements.push('boss-breaker');
    if (this.correct >= 10 && !this.saveData.achievements.includes('word-wizard')) this.saveData.achievements.push('word-wizard');
    if (this.saveData.totalStars >= 10 && !this.saveData.unlockedSkins.includes('mint')) this.saveData.unlockedSkins.push('mint');
    if (this.saveData.totalStars >= 25 && !this.saveData.unlockedSkins.includes('sunset')) this.saveData.unlockedSkins.push('sunset');
    this.saveSystem.save(this.saveData);
  }

  private pickQuestion(): Question {
    const category = this.category === 'all' ? undefined : this.category;
    const difficulty = this.difficulty === 'all' ? undefined : this.difficulty;
    const question = this.questionManager.next(category, difficulty, Math.floor(this.random() * 0xffffffff));
    return question;
  }

  private getQuestionTimeMs(): number {
    return (this.slowMode ? BALANCE.easyQuestionTimeSeconds : BALANCE.questionTimeSeconds) * 1000;
  }
}

function getRoutePosition(progress: number): { x: number; y: number } {
  let remaining = Math.max(0, progress);
  for (let index = 0; index < routeLengths.length; index += 1) {
    const length = routeLengths[index] ?? 1;
    const start = routePoints[index];
    const end = routePoints[index + 1];
    if (!start || !end) continue;
    if (remaining <= length) {
      const ratio = remaining / length;
      return { x: start.x + (end.x - start.x) * ratio, y: start.y + (end.y - start.y) * ratio };
    }
    remaining -= length;
  }
  return routePoints[routePoints.length - 1] ?? { x: 0, y: 0 };
}
