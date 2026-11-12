import Phaser from 'phaser';
import './style.css';
import { QUESTION_BANK } from './data/questionBank';
import type { UpgradeId } from './data/cards';
import type { TowerType } from './data/towers';
import { AudioManager } from './systems/AudioManager';
import { GameSimulation, type SimulationOptions } from './systems/GameSimulation';
import { SaveSystem, type SkinId } from './systems/SaveSystem';
import { CELL_SIZE, GRID_COLUMNS, GRID_ROWS } from './systems/GridSystem';
import { BootScene } from './scenes/BootScene';
import { PreloadScene } from './scenes/PreloadScene';
import { MenuScene } from './scenes/MenuScene';
import { GameScene } from './scenes/GameScene';
import { UIScene } from './scenes/UIScene';
import { SettingsScene } from './scenes/SettingsScene';
import { GameOverScene } from './scenes/GameOverScene';
import { GameUI } from './ui/GameUI';

const root = document.querySelector<HTMLElement>('#app');
if (!root) throw new Error('ไม่พบ element #app');

const saveSystem = new SaveSystem();
const audio = new AudioManager();
let simulation: GameSimulation | null = null;
let lastPhase = '';
let renderLoop: number | undefined;

const ui = new GameUI(root, {
  onStart: (options: SimulationOptions) => startGame(options),
  onAnswer: (answer) => {
    if (!simulation) return { correct: false, explanation: 'ยังไม่ได้เริ่มเกม', reward: 0 };
    const result = simulation.answerQuestion(answer);
    if (result.correct) { audio.correct(); audio.reward(); } else audio.wrong();
    return result;
  },
  onNextQuestion: () => simulation?.advanceQuestion(),
  onChooseTower: (type: TowerType | null) => { if (type) audio.click(); },
  onUpgradeTower: () => simulation?.upgradeSelectedTower() ?? false,
  onChooseUpgrade: (id) => {
    if (simulation && isUpgradeId(id)) { simulation.chooseUpgrade(id); audio.reward(); }
  },
  onPause: (paused) => simulation?.setPaused(paused),
  onSave: () => simulation?.saveProgress(),
  onSkinChange: (skin: SkinId) => {
    const data = simulation?.saveData ?? saveSystem.load();
    if (!data.unlockedSkins.includes(skin)) return;
    data.selectedSkin = skin;
    saveSystem.save(data);
  },
  onSoundChange: (enabled) => {
    audio.setEnabled(enabled);
    const data = simulation?.saveData ?? saveSystem.load();
    data.settings.sound = enabled;
    if (simulation) simulation.saveSystem.save(data); else saveSystem.save(data);
  },
  onSettingChange: (options) => {
    simulation?.setQuestionOptions(options);
    const data = simulation?.saveData ?? saveSystem.load();
    if (options.timerEnabled !== undefined) data.settings.timerEnabled = options.timerEnabled;
    if (options.slowMode !== undefined) data.settings.slowMode = options.slowMode;
    if (simulation) simulation.saveSystem.save(data); else saveSystem.save(data);
  },
  getExportText: () => simulation?.exportResults() ?? 'ยังไม่มีผลการเล่น',
  onMenu: () => showMenu(),
});

const game = new Phaser.Game({
  type: Phaser.AUTO,
  width: GRID_COLUMNS * CELL_SIZE,
  height: GRID_ROWS * CELL_SIZE,
  parent: ui.getCanvasHost(),
  backgroundColor: '#1c2b3d',
  pixelArt: true,
  roundPixels: true,
  antialias: false,
  render: { pixelArt: true, antialias: false, roundPixels: true },
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH, width: GRID_COLUMNS * CELL_SIZE, height: GRID_ROWS * CELL_SIZE },
  fps: { target: 60, forceSetTimeOut: true },
  scene: [BootScene, PreloadScene, MenuScene, GameScene, UIScene, SettingsScene, GameOverScene],
});

function startGame(options: SimulationOptions): void {
  const persisted = saveSystem.load();
  const savedOptions: SimulationOptions = {
    ...options,
    timerEnabled: options.timerEnabled ?? persisted.settings.timerEnabled,
    slowMode: options.slowMode ?? persisted.settings.slowMode,
  };
  simulation = new GameSimulation(QUESTION_BANK, savedOptions, saveSystem);
  audio.setEnabled(simulation.saveData.settings.sound);
  audio.startMusic();
  simulation.start();
  lastPhase = '';
  if (game.scene.isActive('Menu')) game.scene.stop('Menu');
  if (game.scene.isActive('Game')) game.scene.stop('Game');
  game.scene.start('Game', { simulation });
  const scene = game.scene.getScene('Game') as GameScene;
  scene.onGridClick = (x, y) => {
    if (!simulation || simulation.phase !== 'playing') return;
    const existing = simulation.selectTowerAt(x, y);
    if (existing) {
      ui.clearSelectedTower();
      audio.click();
      return;
    }
    const towerType = ui.getSelectedTower();
    if (towerType && simulation.placeTower(towerType, x, y)) {
      ui.clearSelectedTower();
      audio.reward();
    } else audio.click();
  };
  if (renderLoop !== undefined) window.clearInterval(renderLoop);
  renderLoop = window.setInterval(() => {
    if (!simulation) return;
    const snapshot = simulation.getSnapshot();
    const changedPhase = snapshot.phase !== lastPhase;
    if (snapshot.phase === 'game-over') {
      if (changedPhase) {
        ui.showGameOver(simulation.getResult(), simulation.saveData);
        audio.wrong();
      }
    } else if (snapshot.phase === 'wave-clear') {
      if (changedPhase) ui.renderGame(snapshot, simulation.saveData, true);
    } else {
      ui.renderGame(snapshot, simulation.saveData, changedPhase);
    }
    lastPhase = snapshot.phase;
  }, 160);
}

function showMenu(): void {
  if (renderLoop !== undefined) window.clearInterval(renderLoop);
  renderLoop = undefined;
  simulation?.saveProgress();
  simulation = null;
  lastPhase = 'menu';
  if (game.scene.isActive('Game')) game.scene.stop('Game');
  if (!game.scene.isActive('Menu')) game.scene.start('Menu');
  ui.showMenu(saveSystem.load());
}

function isUpgradeId(value: string): value is UpgradeId {
  return ['rapid-fire', 'fortify', 'study-time', 'income', 'repair', 'range', 'power', 'shield-break'].includes(value);
}

ui.showMenu(saveSystem.load());
audio.setEnabled(saveSystem.load().settings.sound);

window.addEventListener('beforeunload', () => {
  simulation?.saveProgress();
  audio.stopMusic();
  if (renderLoop !== undefined) window.clearInterval(renderLoop);
});
