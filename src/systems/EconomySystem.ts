interface EconomyOptions {
  correctReward?: number;
  comboStep?: number;
  comboBonus?: number;
  wrongAnswerSpeedBoostMs?: number;
}

export interface AnswerReward {
  coins: number;
  combo: number;
  multiplier: number;
  speedBoostMs: number;
}

export class EconomySystem {
  private combo = 0;
  private readonly correctReward: number;
  private readonly comboStep: number;
  private readonly comboBonus: number;
  private readonly wrongAnswerSpeedBoostMs: number;

  constructor(options: EconomyOptions = {}) {
    this.correctReward = options.correctReward ?? 5;
    this.comboStep = options.comboStep ?? 3;
    this.comboBonus = options.comboBonus ?? 2;
    this.wrongAnswerSpeedBoostMs = options.wrongAnswerSpeedBoostMs ?? 3500;
  }

  answer(correct: boolean): AnswerReward {
    if (!correct) {
      this.combo = 0;
      return { coins: 0, combo: 0, multiplier: 1, speedBoostMs: this.wrongAnswerSpeedBoostMs };
    }
    this.combo += 1;
    const bonus = Math.floor(this.combo / this.comboStep) * this.comboBonus;
    const multiplier = this.getDamageMultiplier();
    return { coins: this.correctReward + bonus, combo: this.combo, multiplier, speedBoostMs: 0 };
  }

  getCombo(): number { return this.combo; }
  getDamageMultiplier(): number { return 1 + Math.floor(this.combo / this.comboStep) * 0.25; }
  resetCombo(): void { this.combo = 0; }
}
