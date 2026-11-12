import { CATEGORY_LABELS, type QuestionCategory } from '../data/questionTypes';
import { createGamePanelRenderKey } from './gamePanelRenderKey';
import { TOWERS, type TowerType } from '../data/towers';
import type { GameMode, GameResultSummary, SimulationOptions, SimulationSnapshot } from '../systems/GameSimulation';
import type { SaveData, SkinId } from '../systems/SaveSystem';

interface AnswerResult { correct: boolean; explanation: string; reward: number }
interface GameUICallbacks {
  onStart: (options: SimulationOptions) => void;
  onAnswer: (answer: string) => AnswerResult;
  onNextQuestion: () => void;
  onChooseTower: (type: TowerType | null) => void;
  onUpgradeTower: () => boolean;
  onChooseUpgrade: (id: string) => void;
  onPause: (paused: boolean) => void;
  onSave: () => void;
  onSoundChange: (enabled: boolean) => void;
  onSkinChange: (skin: SkinId) => void;
  onSettingChange: (options: { timerEnabled?: boolean; slowMode?: boolean }) => void;
  getExportText: () => string;
  onMenu: () => void;
}

const categoryEntries = Object.entries(CATEGORY_LABELS) as [QuestionCategory, string][];
const escapeHtml = (value: string): string => value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char] ?? char);
const formatTime = (ms: number): string => `${Math.ceil(ms / 1000)} วิ`;

export class GameUI {
  private readonly root: HTMLElement;
  private readonly callbacks: GameUICallbacks;
  private readonly sidePanel: HTMLElement;
  private readonly hud: HTMLElement;
  private readonly modal: HTMLElement;
  private readonly gameCanvas: HTMLElement;
  private snapshot: SimulationSnapshot | null = null;
  private saveData: SaveData | null = null;
  private lastAnswer: AnswerResult | null = null;
  private selectedTower: TowerType | null = null;
  private orderSelection: string[] = [];
  private selectedMode: GameMode = 'endless';
  private selectedCategory: QuestionCategory | 'all' = 'all';
  private selectedDifficulty: 1 | 2 | 3 | 'all' = 'all';
  private menuTimerEnabled = true;
  private menuSlowMode = false;
  private menuTeacherMode = false;
  private soundEnabled = true;
  private lastRenderAt = 0;
  private lastPanelRenderKey = '';
  private lastQuestionId = '';
  private exportSummary: GameResultSummary | null = null;

  constructor(root: HTMLElement, callbacks: GameUICallbacks) {
    this.root = root;
    this.callbacks = callbacks;
    this.root.innerHTML = `
      <div class="app-shell">
        <header class="topbar">
          <div class="brand-lockup"><div class="brand-mark">คำ</div><div><div class="brand-title">ซอมบี้ศัพท์ไทย</div><div class="brand-subtitle">ป้อมพิทักษ์ภาษา · WORD DEFENSE</div></div></div>
          <div id="hud" class="hud-strip"></div>
          <button class="icon-button" data-action="settings" aria-label="ตั้งค่า" title="ตั้งค่า">⚙</button>
        </header>
        <main class="game-layout">
          <section class="play-column">
            <div class="world-card">
              <div class="world-toolbar"><span class="world-tag">🏫 SCHOOL LAST STAND</span><span id="world-status" class="world-status">เตรียมพร้อม</span></div>
              <div class="canvas-wrap"><div id="game-canvas"></div><div class="canvas-corner canvas-corner-left">PIXEL WORLD · 64-BIT STYLE</div><div class="canvas-corner canvas-corner-right">ปกป้องห้องสมุด!</div></div>
              <div class="world-footer"><span>🧟 ซอมบี้กำลังเดินตามเส้นทาง</span><span>แตะช่องว่างเพื่อวางป้อม</span></div>
            </div>
            <div id="quick-status" class="quick-status"></div>
          </section>
          <aside id="side-panel" class="side-panel"></aside>
        </main>
        <footer class="footer-line"><span>สร้างเพื่อการเรียนรู้ภาษาไทย ป.4–ป.5</span><span>เล่นได้ทั้งเมาส์ คีย์บอร์ด และระบบสัมผัส</span></footer>
        <div id="modal-root"></div>
      </div>`;
    this.sidePanel = this.root.querySelector('#side-panel') as HTMLElement;
    this.hud = this.root.querySelector('#hud') as HTMLElement;
    this.modal = this.root.querySelector('#modal-root') as HTMLElement;
    this.gameCanvas = this.root.querySelector('#game-canvas') as HTMLElement;
    this.soundEnabled = true;
    this.root.addEventListener('click', (event) => this.handleClick(event));
    this.root.addEventListener('change', (event) => this.handleChange(event));
    document.addEventListener('keydown', (event) => this.handleKeydown(event));
  }

  getCanvasHost(): HTMLElement { return this.gameCanvas; }
  getSelectedTower(): TowerType | null { return this.selectedTower; }
  clearSelectedTower(): void { this.selectedTower = null; this.refreshCurrent(true); }

  showMenu(saveData: SaveData): void {
    this.saveData = saveData;
    this.menuTimerEnabled = saveData.settings.timerEnabled;
    this.menuSlowMode = saveData.settings.slowMode;
    this.snapshot = null;
    this.lastPanelRenderKey = '';
    this.exportSummary = null;
    this.lastAnswer = null;
    this.selectedTower = null;
    this.modal.innerHTML = '';
    this.root.classList.add('menu-mode');
    this.hud.innerHTML = `<div class="hud-pill"><span>🏆</span><strong>${saveData.highScore.toLocaleString('th-TH')}</strong><small>คะแนนสูงสุด</small></div><div class="hud-pill"><span>⭐</span><strong>${saveData.totalStars}</strong><small>ดาวสะสม</small></div><div class="hud-pill"><span>🏅</span><strong>${saveData.achievements.length}</strong><small>ความสำเร็จ</small></div>`;
    const categories = categoryEntries.map(([id, label]) => `<option value="${id}" ${this.selectedCategory === id ? 'selected' : ''}>${escapeHtml(label)}</option>`).join('');
    const skinOptions: { id: SkinId; label: string; stars: number }[] = [
      { id: 'classic', label: 'Classic · เขียวคลาสสิก', stars: 0 },
      { id: 'mint', label: 'Mint · มิ้นต์สดใส', stars: 10 },
      { id: 'sunset', label: 'Sunset · แสงอาทิตย์อัสดง', stars: 25 },
    ];
    const skins = skinOptions.map((skin) => {
      const unlocked = saveData.unlockedSkins.includes(skin.id);
      return `<option value="${skin.id}" ${saveData.selectedSkin === skin.id ? 'selected' : ''} ${unlocked ? '' : 'disabled'}>${skin.label}${unlocked ? '' : ` · 🔒 ${skin.stars} ดาว`}</option>`;
    }).join('');
    this.sidePanel.innerHTML = `
      <section class="menu-panel">
        <div class="eyebrow">WELCOME, SURVIVOR!</div>
        <h1>ปกป้องโรงเรียน<br><span>ด้วยพลังภาษาไทย</span></h1>
        <p class="panel-intro">เหล่าซอมบี้ศัพท์กำลังบุกห้องสมุด ตอบคำถามให้ถูก เก็บเหรียญ แล้วสร้างป้อมเพื่อหยุดพวกมัน!</p>
        <div class="mode-grid">
          ${this.modeButton('endless', '♾️', 'เอาตัวรอดไม่สิ้นสุด', 'ท้าทายฝีมือไปเรื่อย ๆ')}
          ${this.modeButton('daily', '📅', 'ภารกิจประจำวัน', 'ทุกคนเจอโจทย์ชุดเดียวกัน')}
          ${this.modeButton('practice', '📖', 'ห้องฝึกภาษาไทย', 'ไม่มีซอมบี้กดดัน')}
        </div>
        <div class="form-row"><label for="category-select">หมวดฝึกฝน</label><select id="category-select"><option value="all">ทุกหมวด</option>${categories}</select></div>
        <div class="form-row"><label for="difficulty-select">ระดับความยาก</label><select id="difficulty-select"><option value="all">ผสมทุกระดับ</option><option value="1" ${this.selectedDifficulty === 1 ? 'selected' : ''}>ระดับ 1 · เริ่มต้น</option><option value="2" ${this.selectedDifficulty === 2 ? 'selected' : ''}>ระดับ 2 · ท้าทาย</option><option value="3" ${this.selectedDifficulty === 3 ? 'selected' : ''}>ระดับ 3 · เซียนภาษา</option></select></div>
        <div class="form-row"><label for="skin-select">สกินตัวละคร</label><select id="skin-select">${skins}</select><small class="field-note">สะสมดาวเพื่อปลดล็อกสีธีมใหม่</small></div>
        <div class="teacher-toggle"><div><strong>🧑‍🏫 โหมดครู</strong><small>ตั้งเวลาคิดและโหมดช่วยเหลือ</small></div><label class="switch"><input type="checkbox" id="teacher-mode" ${this.menuTeacherMode ? 'checked' : ''}><span></span></label></div>
        ${this.menuTeacherMode ? `<div class="setting-inline"><label><input id="menu-timer" type="checkbox" ${this.menuTimerEnabled ? 'checked' : ''}> เปิดตัวจับเวลา</label><label><input id="menu-slow" type="checkbox" ${this.menuSlowMode ? 'checked' : ''}> เพิ่มเวลาคิด</label></div>` : ''}
        <button class="primary-button start-button" data-action="start">เริ่มปกป้องโรงเรียน <span>➜</span></button>
        <div class="menu-note">คลังโจทย์ 328 ข้อ · 10 หมวด · ป้อม 6 แบบ · บอสทุก 5 เวฟ</div>
      </section>
      <section class="mini-meta"><div><strong>ภารกิจวันนี้</strong><p>ตอบถูก ${saveData.dailyMission.date === this.dailyDate() ? saveData.dailyMission.correct : 0}/10 ข้อ ${saveData.dailyMission.claimed && saveData.dailyMission.date === this.dailyDate() ? '· สำเร็จแล้ว!' : 'เพื่อสะสมดาว!'}</p></div><div class="mini-coin">⭐</div></section>
      <section class="mini-meta achievements"><div><strong>ความสำเร็จของฉัน</strong><p>${saveData.achievements.length ? saveData.achievements.map((item) => escapeHtml(item)).join(' · ') : 'ยังไม่มีเหรียญตรา ลุยภารกิจกันเลย!'}</p></div><div class="mini-coin">🏅</div></section>`;
    this.setWorldStatus('รอผู้พิทักษ์ภาษาไทย');
    this.root.querySelector('.world-footer')!.innerHTML = '<span>🧟 โลกพิกเซลกำลังรอคุณอยู่</span><span>เลือกโหมดแล้วเริ่มเล่นได้เลย</span>';
  }

  renderGame(snapshot: SimulationSnapshot, saveData: SaveData, force = false): void {
    this.snapshot = snapshot;
    if (snapshot.lastAnswer) this.lastAnswer = snapshot.lastAnswer;
    else if (this.lastQuestionId && this.lastQuestionId !== snapshot.question.id) this.lastAnswer = null;
    this.lastQuestionId = snapshot.question.id;
    this.saveData = saveData;
    this.root.classList.remove('menu-mode');
    const now = performance.now();
    if (!force && now - this.lastRenderAt < 140 && snapshot.phase === 'playing') return;
    this.lastRenderAt = now;
    this.hud.innerHTML = `
      <div class="hud-pill"><span>❤️</span><strong>${Math.max(0, snapshot.coreHp)}</strong><small>พลังฐาน</small></div>
      <div class="hud-pill"><span>🪙</span><strong>${snapshot.coins}</strong><small>เหรียญ</small></div>
      <div class="hud-pill"><span>🌊</span><strong>${snapshot.wave || 'ฝึก'}</strong><small>เวฟ</small></div>
      <div class="hud-pill"><span>⭐</span><strong>${snapshot.score.toLocaleString('th-TH')}</strong><small>คะแนน</small></div>`;
    this.setWorldStatus(snapshot.phase === 'practice' ? 'โหมดฝึกซ้อม · ปลอดภัย' : snapshot.phase === 'wave-clear' ? 'ผ่านเวฟแล้ว!' : snapshot.phase === 'game-over' ? 'ฐานต้องการความช่วยเหลือ' : `เวฟ ${snapshot.wave} · ${snapshot.spawned}/${snapshot.totalToSpawn}`);
    this.root.querySelector('.world-footer')!.innerHTML = `<span>🧟 ${snapshot.zombies.length} ตัวบนสนาม</span><span>🎯 ตอบถูก ${snapshot.correct} · ผิด ${snapshot.incorrect}</span>`;
    const quickStatus = this.root.querySelector('#quick-status');
    if (quickStatus) quickStatus.innerHTML = `<span class="quick-chip">🔥 Combo ${snapshot.combo}</span><span class="quick-chip">🎯 ความแม่นยำ ${(snapshot.accuracy * 100).toFixed(0)}%</span><span class="quick-chip">🛡️ ป้อม ${snapshot.towers.length}</span><span class="quick-chip">${snapshot.mode === 'practice' ? '📖 ฝึกซ้อม' : snapshot.mode === 'daily' ? '📅 ภารกิจประจำวัน' : '♾️ Endless'}</span>`;
    const question = snapshot.question;
    const answerBlock = this.lastAnswer
      ? `<div class="answer-feedback ${this.lastAnswer.correct ? 'is-correct' : 'is-wrong'}"><strong>${this.lastAnswer.correct ? '✨ ตอบถูกแล้ว เก่งมาก!' : '💡 ยังไม่ถูก ไม่เป็นไรนะ'}</strong><p>${escapeHtml(this.lastAnswer.explanation)}</p>${this.lastAnswer.reward ? `<small>ได้รับ ${this.lastAnswer.reward} เหรียญรวมโบนัสคอมโบ</small>` : ''}<button class="secondary-button full-width" data-action="next">ข้อต่อไป ➜</button></div>`
      : this.renderAnswerChoices(question);
    const towerList = (snapshot.phase === 'practice' ? [] : Object.keys(TOWERS) as TowerType[]).map((type) => {
      const tower = TOWERS[type];
      const selected = this.selectedTower === type;
      return `<button class="tower-option ${selected ? 'selected' : ''}" data-action="choose-tower" data-type="${type}" ${snapshot.phase !== 'playing' ? 'disabled' : ''}><span class="tower-icon">${tower.icon}</span><span class="tower-name">${escapeHtml(tower.name)}</span><small>${tower.cost} เหรียญ</small></button>`;
    }).join('');
    const selectedEntity = snapshot.towers.find((tower) => tower.id === snapshot.selectedTowerId);
    const upgrade = selectedEntity ? `<div class="selected-tower"><div><strong>${TOWERS[selectedEntity.type].icon} ${escapeHtml(TOWERS[selectedEntity.type].name)} · Lv.${selectedEntity.level}</strong><small>${selectedEntity.level >= 3 ? 'อัปเกรดเต็มระดับแล้ว' : `อัปเกรด ${TOWERS[selectedEntity.type].upgradeCosts[selectedEntity.level - 1]} เหรียญ`}</small></div><button class="tiny-button" data-action="upgrade" ${selectedEntity.level >= 3 ? 'disabled' : ''}>อัปเกรด</button></div>` : '';
    const panelRenderKey = createGamePanelRenderKey({
      phase: snapshot.phase,
      questionId: snapshot.question.id,
      message: snapshot.message,
      towers: snapshot.towers.map((tower) => ({
        id: tower.id,
        type: tower.type,
        level: tower.level,
      })),
      selectedTowerId: snapshot.selectedTowerId,
      paused: snapshot.paused,
      timerEnabled: snapshot.timerEnabled,
      upgradeCardIds: snapshot.upgradeCards.map((card) => card.id),
      selectedTower: this.selectedTower,
      lastAnswer: this.lastAnswer,
      orderSelection: this.orderSelection,
      soundEnabled: this.soundEnabled,
    });

    // Preserve existing button elements between simulation ticks. Replacing the
    // entire side panel every 160ms caused flicker and made tower taps unreliable.
    if (panelRenderKey !== this.lastPanelRenderKey) {
      this.sidePanel.innerHTML = `
        <section class="question-panel">
          <div class="panel-head"><div><div class="eyebrow">THAI LANGUAGE QUEST</div><h2>โจทย์ประจำด่าน</h2></div><div class="timer-chip ${snapshot.timeLeftMs < 6000 && snapshot.phase === 'playing' ? 'timer-danger' : ''}">⏱ ${snapshot.phase === 'practice' || !snapshot.timerEnabled ? 'ไม่จำกัด' : formatTime(snapshot.timeLeftMs)}</div></div>
          <div class="question-meta"><span class="category-chip">${escapeHtml(CATEGORY_LABELS[question.category])}</span><span class="difficulty-chip">${'★'.repeat(question.difficulty)}${'☆'.repeat(3 - question.difficulty)}</span><span class="question-type">${this.questionTypeLabel(question.type)}</span></div>
          <p class="question-text">${escapeHtml(question.question)}</p>
          <div class="answer-area">${answerBlock}</div>
          <div class="encouragement">${escapeHtml(snapshot.message)}</div>
        </section>
        <section class="tower-panel">
          <div class="section-heading"><div><div class="eyebrow">DEFENSE KIT</div><h2>เลือกป้อมปราการ</h2></div><span class="small-note">สูงสุด Lv.3</span></div>
          <div class="tower-grid">${towerList}</div>
          ${this.selectedTower ? `<div class="place-hint">เลือก ${escapeHtml(TOWERS[this.selectedTower].name)} แล้ว แตะช่องว่างบนแผนที่เพื่อวาง</div>` : ''}
          ${upgrade}
        </section>
        <section class="bottom-tools"><button class="tool-button" data-action="teacher">🧑‍🏫 โหมดครู</button><button class="tool-button" data-action="pause" ${snapshot.phase !== 'playing' ? 'disabled' : ''}>${snapshot.paused ? '▶ เล่นต่อ' : '⏸ พักเกม'}</button><button class="tool-button" data-action="sound">${this.soundEnabled ? '🔊 เสียงเปิด' : '🔇 ปิดเสียง'}</button><button class="tool-button" data-action="menu">⌂ เมนูหลัก</button></section>`;
      this.lastPanelRenderKey = panelRenderKey;
    } else {
      const timerChip = this.sidePanel.querySelector<HTMLElement>('.timer-chip');
      if (timerChip) {
        timerChip.textContent = `⏱ ${snapshot.phase === 'practice' || !snapshot.timerEnabled ? 'ไม่จำกัด' : formatTime(snapshot.timeLeftMs)}`;
        timerChip.classList.toggle('timer-danger', snapshot.timeLeftMs < 6000 && snapshot.phase === 'playing');
      }
    }
    this.renderModal(snapshot);
  }

  private renderAnswerChoices(question: SimulationSnapshot['question']): string {
    if (question.type === 'order') {
      const tokens = question.choices.filter((word) => !this.orderSelection.includes(word));
      return `<div class="order-slots">${this.orderSelection.length ? this.orderSelection.map((word, index) => `<button class="order-token selected" data-action="remove-order" data-index="${index}">${index + 1}. ${escapeHtml(word)} ×</button>`).join('') : '<span class="order-placeholder">แตะคำด้านล่างตามลำดับให้เป็นประโยค</span>'}</div><div class="choice-grid order-grid">${tokens.map((word) => `<button class="choice-button" data-action="order-choice" data-word="${escapeHtml(word)}">${escapeHtml(word)}</button>`).join('')}</div><button class="secondary-button full-width" data-action="submit-order" ${this.orderSelection.length !== question.choices.length ? 'disabled' : ''}>ส่งคำตอบ</button>`;
    }
    return `<div class="choice-grid">${question.choices.map((choice, index) => `<button class="choice-button" data-action="answer" data-choice="${escapeHtml(choice)}"><span class="choice-number">${index + 1}</span><span>${escapeHtml(choice)}</span></button>`).join('')}</div>`;
  }

  private renderModal(snapshot: SimulationSnapshot): void {
    if (snapshot.phase === 'wave-clear') {
      const cards = snapshot.upgradeCards.map((card) => `<button class="upgrade-card" data-action="choose-upgrade" data-id="${card.id}"><span>${card.icon}</span><strong>${escapeHtml(card.title)}</strong><small>${escapeHtml(card.description)}</small></button>`).join('');
      if (!this.modal.querySelector('.wave-clear-modal')) this.modal.innerHTML = `<div class="modal-backdrop"><section class="modal-card wave-clear-modal"><div class="eyebrow">WAVE CLEARED</div><h2>เยี่ยมมาก! ผ่านเวฟ ${snapshot.wave} แล้ว</h2><p>เลือกการ์ดพลังพิเศษ 1 ใบ เพื่อเตรียมรับมือฝูงซอมบี้รอบต่อไป</p><div class="upgrade-grid">${cards}</div></section></div>`;
      return;
    }
    if (snapshot.phase === 'game-over') {
      if (!this.modal.querySelector('.result-card')) {
        const result: GameResultSummary = { wave: snapshot.wave, score: snapshot.score, accuracy: snapshot.accuracy, correct: snapshot.correct, incorrect: snapshot.incorrect, review: [] };
        this.renderGameOver(result);
      }
      return;
    }
  }

  showGameOver(result: GameResultSummary, saveData: SaveData): void {
    this.saveData = saveData;
    this.renderGameOver(result);
  }

  private renderGameOver(result: GameResultSummary): void {
    this.exportSummary = result;
    const review = result.review.length ? result.review.map((item) => `<li><strong>${escapeHtml(item.question)}</strong><small>คำตอบ: ${escapeHtml(item.answer.replaceAll('|', ' '))} · ${escapeHtml(item.explanation)}</small></li>`).join('') : '<li>ยอดเยี่ยม! ไม่มีคำตอบผิดที่ต้องทบทวนในรอบนี้</li>';
    const categories = categoryEntries.map(([id, label]) => {
      const stat = this.saveData?.categoryStats[id] ?? { correct: 0, incorrect: 0 };
      const total = stat.correct + stat.incorrect;
      return `<div class="stat-row"><span>${escapeHtml(label)}</span><strong>${total ? `${Math.round(stat.correct / total * 100)}%` : '—'}</strong></div>`;
    }).join('');
    this.modal.innerHTML = `<div class="modal-backdrop"><section class="modal-card result-card"><div class="eyebrow">SCHOOL REPORT</div><h2>จบภารกิจแล้ว ผู้พิทักษ์!</h2><p>ฐานโรงเรียนต้องพักฟื้น แต่ความรู้ของคุณเพิ่มขึ้นแล้ว</p><div class="result-stats"><div><strong>${result.score.toLocaleString('th-TH')}</strong><small>คะแนน</small></div><div><strong>${result.wave}</strong><small>เวฟที่ไปถึง</small></div><div><strong>${Math.round(result.accuracy * 100)}%</strong><small>ความแม่นยำ</small></div></div><div class="result-detail"><div><h3>📚 คำที่ควรทบทวน</h3><ul class="review-list">${review}</ul></div><div><h3>📊 สถิติรายหมวด</h3><div class="category-stats">${categories}</div></div></div><div class="result-actions"><button class="primary-button" data-action="restart">เล่นอีกครั้ง ↻</button><button class="secondary-button" data-action="export">ส่งออกผลการเรียน</button><button class="secondary-button" data-action="export-image">ดาวน์โหลดภาพ PNG</button><button class="secondary-button" data-action="menu">กลับเมนูหลัก</button></div><div id="export-message" class="export-message"></div></section></div>`;
  }

  showTeacherPanel(snapshot: SimulationSnapshot | null, exportText: string): void {
    if (snapshot) this.exportSummary = { wave: snapshot.wave, score: snapshot.score, accuracy: snapshot.accuracy, correct: snapshot.correct, incorrect: snapshot.incorrect, review: snapshot.phase === 'game-over' ? (this.exportSummary?.review ?? []) : [] };
    const timerEnabled = snapshot?.timerEnabled ?? true;
    const slowMode = snapshot?.slowMode ?? this.menuSlowMode;
    this.modal.innerHTML = `<div class="modal-backdrop"><section class="modal-card teacher-card"><button class="modal-close" data-action="close-modal" aria-label="ปิด">×</button><div class="eyebrow">TEACHER MODE</div><h2>แผงควบคุมครู</h2><p>ตั้งค่าความเร็วในการคิด และนำผลการฝึกไปใช้ต่อได้</p><div class="setting-list"><label><span><strong>ตัวจับเวลาตอบคำถาม</strong><small>ปิดได้สำหรับผู้เรียนที่ต้องการเวลามากขึ้น</small></span><input type="checkbox" id="teacher-timer" ${timerEnabled ? 'checked' : ''}></label><label><span><strong>โหมดเพิ่มเวลาคิด</strong><small>เพิ่มเวลาเป็น 26 วินาที</small></span><input type="checkbox" id="teacher-slow" ${slowMode ? 'checked' : ''}></label></div><div class="export-area"><label for="result-export">สรุปผลการเรียน</label><textarea id="result-export" rows="7" readonly>${escapeHtml(exportText)}</textarea><button class="secondary-button full-width" data-action="copy-export">คัดลอกข้อความ</button><button class="secondary-button full-width" data-action="export-image">ดาวน์โหลดภาพสรุป PNG</button><button class="secondary-button full-width" data-action="print">พิมพ์ / บันทึก PDF</button></div></section></div>`;
  }

  private downloadSummaryImage(): void {
    const result = this.exportSummary;
    const saveData = this.saveData;
    if (!result || !saveData) return;
    const canvas = document.createElement('canvas');
    canvas.width = 1280;
    canvas.height = 960;
    const context = canvas.getContext('2d');
    if (!context) return;

    const roundRect = (x: number, y: number, width: number, height: number, radius: number, color: string): void => {
      context.fillStyle = color;
      context.beginPath();
      context.roundRect(x, y, width, height, radius);
      context.fill();
    };
    const fit = (value: string, maxWidth: number, font: string): string => {
      context.font = font;
      let text = value;
      while (text.length > 1 && context.measureText(text).width > maxWidth) text = `${text.slice(0, -2)}…`;
      return text;
    };
    const draw = (value: string, x: number, y: number, font: string, color: string, maxWidth = 1100): void => {
      context.font = font;
      context.fillStyle = color;
      context.fillText(fit(value, maxWidth, font), x, y);
    };

    context.fillStyle = '#101b2d';
    context.fillRect(0, 0, canvas.width, canvas.height);
    roundRect(34, 34, 1212, 892, 28, '#1a2a43');
    draw('ซอมบี้ศัพท์ไทย', 76, 112, 'bold 54px K2D, Tahoma, sans-serif', '#ffdc75');
    draw('สรุปภารกิจผู้พิทักษ์ภาษาไทย', 78, 158, '28px K2D, Tahoma, sans-serif', '#d6e3f3');
    draw(new Date().toLocaleDateString('th-TH', { dateStyle: 'long' }), 1190, 108, '22px K2D, Tahoma, sans-serif', '#a9bdd5', 320);

    const metrics = [
      { value: result.score.toLocaleString('th-TH'), label: 'คะแนนรวม', color: '#ffdc75' },
      { value: String(result.wave), label: 'เวฟที่ไปถึง', color: '#85d9ff' },
      { value: `${Math.round(result.accuracy * 100)}%`, label: 'ความแม่นยำ', color: '#93e2b8' },
      { value: `${result.correct}/${result.correct + result.incorrect}`, label: 'ตอบถูก', color: '#f7a5b2' },
    ];
    metrics.forEach((metric, index) => {
      const x = 76 + index * 284;
      roundRect(x, 198, 260, 126, 18, '#263b59');
      draw(metric.value, x + 22, 260, 'bold 42px K2D, Tahoma, sans-serif', metric.color, 220);
      draw(metric.label, x + 22, 298, '22px K2D, Tahoma, sans-serif', '#d6e3f3', 220);
    });

    roundRect(76, 356, 548, 500, 18, '#223651');
    draw('คำที่ควรทบทวน', 104, 406, 'bold 30px K2D, Tahoma, sans-serif', '#ffdc75', 490);
    const review = result.review.slice(0, 8);
    if (!review.length) draw('ยอดเยี่ยม! ไม่มีข้อผิดที่บันทึกไว้', 104, 462, '23px K2D, Tahoma, sans-serif', '#d6e3f3', 480);
    review.forEach((item, index) => {
      const y = 458 + index * 48;
      draw(`${index + 1}. ${item.question}`, 104, y, '21px K2D, Tahoma, sans-serif', '#f4e5bd', 490);
      draw(`เฉลย: ${item.answer.replaceAll('|', ' ')}`, 122, y + 25, '18px K2D, Tahoma, sans-serif', '#a9d6c0', 470);
    });

    roundRect(656, 356, 548, 500, 18, '#223651');
    draw('สถิติแยกตามหมวด', 684, 406, 'bold 30px K2D, Tahoma, sans-serif', '#ffdc75', 490);
    categoryEntries.forEach(([id, label], index) => {
      const column = index >= 5 ? 1 : 0;
      const row = index % 5;
      const stat = saveData.categoryStats[id] ?? { correct: 0, incorrect: 0 };
      const total = stat.correct + stat.incorrect;
      const value = total ? `${Math.round(stat.correct / total * 100)}%` : '—';
      const x = column ? 950 : 684;
      const y = 466 + row * 68;
      draw(label, x, y, '19px K2D, Tahoma, sans-serif', '#d6e3f3', 205);
      draw(value, x, y + 30, 'bold 26px K2D, Tahoma, sans-serif', '#93e2b8', 180);
    });
    draw('ฝึกต่อเนื่องทุกวัน แล้วคุณจะเก่งภาษาไทยขึ้นอีก!', 76, 892, '24px K2D, Tahoma, sans-serif', '#d6e3f3', 1120);

    const anchor = document.createElement('a');
    anchor.download = `thai-word-defense-report-${new Date().toISOString().slice(0, 10)}.png`;
    anchor.href = canvas.toDataURL('image/png');
    anchor.click();
  }

  showSettings(saveData: SaveData): void {
    this.soundEnabled = saveData.settings.sound;
    this.modal.innerHTML = `<div class="modal-backdrop"><section class="modal-card settings-card"><button class="modal-close" data-action="close-modal" aria-label="ปิด">×</button><div class="eyebrow">GAME SETTINGS</div><h2>ตั้งค่าเกม</h2><div class="setting-list"><label><span><strong>เสียงประกอบ</strong><small>เสียงตอบถูกและปุ่มกด</small></span><input id="settings-sound" type="checkbox" ${saveData.settings.sound ? 'checked' : ''}></label><label><span><strong>ตัวจับเวลา</strong><small>เปิดหรือปิดเวลาในการตอบ</small></span><input id="settings-timer" type="checkbox" ${saveData.settings.timerEnabled ? 'checked' : ''}></label><label><span><strong>เพิ่มเวลาคิด</strong><small>เหมาะสำหรับฝึกแบบไม่เร่งรีบ</small></span><input id="settings-slow" type="checkbox" ${saveData.settings.slowMode ? 'checked' : ''}></label></div><button class="primary-button full-width" data-action="close-modal">บันทึกและปิด</button></section></div>`;
  }

  private modeButton(mode: GameMode, icon: string, title: string, description: string): string {
    return `<button class="mode-button ${this.selectedMode === mode ? 'active' : ''}" data-action="mode" data-mode="${mode}"><span>${icon}</span><strong>${title}</strong><small>${description}</small></button>`;
  }

  private questionTypeLabel(type: string): string {
    const labels: Record<string, string> = { 'multiple-choice': 'เลือกตอบ', 'fill-blank': 'เติมคำ', 'true-false': 'ถูก / ผิด', matching: 'จับคู่', order: 'เรียงประโยค' };
    return labels[type] ?? 'คำถาม';
  }

  private setWorldStatus(message: string): void {
    const element = this.root.querySelector('#world-status');
    if (element) element.textContent = message;
  }

  private handleClick(event: Event): void {
    const target = (event.target as HTMLElement).closest<HTMLElement>('[data-action]');
    if (!target || target.hasAttribute('disabled')) return;
    const action = target.dataset.action;
    if (action === 'mode') {
      this.selectedMode = (target.dataset.mode as GameMode) ?? 'endless';
      this.refreshMenuModeButtons();
    } else if (action === 'start') {
      const category = this.root.querySelector<HTMLSelectElement>('#category-select')?.value ?? 'all';
      const difficultyValue = this.root.querySelector<HTMLSelectElement>('#difficulty-select')?.value ?? 'all';
      const teacher = this.root.querySelector<HTMLInputElement>('#teacher-mode')?.checked ?? this.menuTeacherMode;
      this.menuTeacherMode = teacher;
      this.menuTimerEnabled = this.root.querySelector<HTMLInputElement>('#menu-timer')?.checked ?? this.menuTimerEnabled;
      this.menuSlowMode = this.root.querySelector<HTMLInputElement>('#menu-slow')?.checked ?? this.menuSlowMode;
      this.selectedCategory = category as QuestionCategory | 'all';
      this.selectedDifficulty = difficultyValue === 'all' ? 'all' : Number(difficultyValue) as 1 | 2 | 3;
      const seed = this.selectedMode === 'daily' ? this.dailySeed() : undefined;
      this.callbacks.onStart({ mode: this.selectedMode, category: this.selectedCategory, difficulty: this.selectedDifficulty, timerEnabled: this.menuTimerEnabled, slowMode: this.menuSlowMode, seed });
    } else if (action === 'answer') {
      const result = this.callbacks.onAnswer(target.dataset.choice ?? '');
      this.lastAnswer = result;
      this.orderSelection = [];
      this.refreshCurrent();
    } else if (action === 'order-choice') {
      const word = target.dataset.word;
      if (word && !this.orderSelection.includes(word)) { this.orderSelection.push(word); this.refreshCurrent(); }
    } else if (action === 'remove-order') {
      this.orderSelection.splice(Number(target.dataset.index), 1);
      this.refreshCurrent();
    } else if (action === 'submit-order') {
      const result = this.callbacks.onAnswer(this.orderSelection.join('|'));
      this.lastAnswer = result;
      this.orderSelection = [];
      this.refreshCurrent();
    } else if (action === 'next') {
      this.lastAnswer = null;
      this.orderSelection = [];
      this.callbacks.onNextQuestion();
      this.refreshCurrent();
    } else if (action === 'choose-tower') {
      this.selectedTower = target.dataset.type as TowerType;
      this.callbacks.onChooseTower(this.selectedTower);
      this.refreshCurrent();
    } else if (action === 'upgrade') {
      this.callbacks.onUpgradeTower();
      this.refreshCurrent();
    } else if (action === 'choose-upgrade') {
      this.lastAnswer = null;
      this.callbacks.onChooseUpgrade(target.dataset.id ?? '');
      this.modal.innerHTML = '';
      this.refreshCurrent(true);
    } else if (action === 'pause') {
      const paused = target.textContent?.includes('พักเกม') ?? false;
      this.callbacks.onPause(paused);
      target.textContent = paused ? '▶ เล่นต่อ' : '⏸ พักเกม';
    } else if (action === 'sound') {
      this.soundEnabled = !this.soundEnabled;
      this.callbacks.onSoundChange(this.soundEnabled);
      this.refreshCurrent();
    } else if (action === 'settings') {
      if (this.saveData) this.showSettings(this.saveData);
    } else if (action === 'teacher') {
      this.showTeacherPanel(this.snapshot, this.callbacks.getExportText());
    } else if (action === 'menu') {
      this.callbacks.onSave();
      this.callbacks.onMenu();
    } else if (action === 'close-modal') {
      this.modal.innerHTML = '';
    } else if (action === 'restart') {
      const options: SimulationOptions = { mode: this.selectedMode, category: this.selectedCategory, difficulty: this.selectedDifficulty, timerEnabled: this.menuTimerEnabled, slowMode: this.menuSlowMode, seed: this.selectedMode === 'daily' ? this.dailySeed() : undefined };
      this.callbacks.onStart(options);
    } else if (action === 'export') {
      const text = this.callbacks.getExportText();
      const message = this.modal.querySelector('#export-message');
      if (message) message.textContent = text ? 'เตรียมข้อความสำหรับคัดลอกในโหมดครูแล้ว' : 'เปิดแผงครูเพื่อคัดลอกหรือพิมพ์ผลการเรียน';
      if (this.snapshot) this.showTeacherPanel(this.snapshot, text);
    } else if (action === 'export-image') {
      this.downloadSummaryImage();
    } else if (action === 'copy-export') {
      const text = this.modal.querySelector<HTMLTextAreaElement>('#result-export')?.value ?? '';
      void navigator.clipboard?.writeText(text).then(() => { const note = this.modal.querySelector('.export-area'); if (note) note.insertAdjacentHTML('beforeend', '<p class="success-note">คัดลอกแล้ว!</p>'); });
    } else if (action === 'print') {
      window.print();
    }
  }

  private handleChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.id === 'teacher-mode') {
      this.menuTeacherMode = input.checked;
      this.showMenu(this.saveData ?? ({} as SaveData));
    } else if (input.id === 'skin-select' && ['classic', 'mint', 'sunset'].includes(input.value)) {
      const skin = input.value as SkinId;
      if (this.saveData?.unlockedSkins.includes(skin)) {
        this.saveData.selectedSkin = skin;
        this.callbacks.onSkinChange(skin);
      }
    } else if (input.id === 'settings-sound') {
      this.soundEnabled = input.checked;
      this.callbacks.onSoundChange(input.checked);
    } else if (input.id === 'settings-timer' || input.id === 'teacher-timer') {
      this.callbacks.onSettingChange({ timerEnabled: input.checked });
    } else if (input.id === 'settings-slow' || input.id === 'teacher-slow') {
      this.callbacks.onSettingChange({ slowMode: input.checked });
    }
  }

  private handleKeydown(event: KeyboardEvent): void {
    if (!this.snapshot || (this.snapshot.phase !== 'playing' && this.snapshot.phase !== 'practice')) return;
    if (!['1', '2', '3', '4'].includes(event.key) || this.lastAnswer || event.repeat) return;
    const buttons = [...this.sidePanel.querySelectorAll<HTMLButtonElement>('[data-action="answer"]')];
    const button = buttons[Number(event.key) - 1];
    if (button) button.click();
  }

  private refreshMenuModeButtons(): void {
    const wrapper = this.sidePanel.querySelector('.mode-grid');
    if (!wrapper) return;
    wrapper.innerHTML = `${this.modeButton('endless', '♾️', 'เอาตัวรอดไม่สิ้นสุด', 'ท้าทายฝีมือไปเรื่อย ๆ')}${this.modeButton('daily', '📅', 'ภารกิจประจำวัน', 'ทุกคนเจอโจทย์ชุดเดียวกัน')}${this.modeButton('practice', '📖', 'ห้องฝึกภาษาไทย', 'ไม่มีซอมบี้กดดัน')}`;
  }

  private refreshCurrent(force = false): void {
    if (this.snapshot && this.saveData) this.renderGame(this.snapshot, this.saveData, force);
  }

  private dailyDate(): string {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  }

  private dailySeed(): number {
    const date = this.dailyDate();
    let hash = 2166136261;
    for (const char of `thai-word-defense:${date}`) { hash ^= char.charCodeAt(0); hash = Math.imul(hash, 16777619); }
    return hash >>> 0;
  }

}
