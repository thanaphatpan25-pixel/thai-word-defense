export type SkinId = 'classic' | 'mint' | 'sunset';

export interface SaveData {
  version: 1;
  highScore: number;
  bestWave: number;
  totalStars: number;
  correctAnswers: number;
  incorrectAnswers: number;
  wrongAnswers: Record<string, number>;
  categoryStats: Record<string, { correct: number; incorrect: number }>;
  achievements: string[];
  unlockedSkins: SkinId[];
  selectedSkin: SkinId;
  settings: { sound: boolean; slowMode: boolean; timerEnabled: boolean };
  lastDailyDate: string;
  dailyMission: { date: string; correct: number; claimed: boolean };
}

const SAVE_KEY = 'thai-word-defense-save-v1';

export const DEFAULT_SAVE: SaveData = {
  version: 1,
  highScore: 0,
  bestWave: 0,
  totalStars: 0,
  correctAnswers: 0,
  incorrectAnswers: 0,
  wrongAnswers: {},
  categoryStats: {},
  achievements: [],
  unlockedSkins: ['classic'],
  selectedSkin: 'classic',
  settings: { sound: true, slowMode: false, timerEnabled: true },
  lastDailyDate: '',
  dailyMission: { date: '', correct: 0, claimed: false },
};

export class SaveSystem {
  private readonly storage: Storage | null;

  constructor(storage: Storage | null = typeof localStorage === 'undefined' ? null : localStorage) {
    this.storage = storage;
  }

  load(): SaveData {
    if (!this.storage) return structuredClone(DEFAULT_SAVE);
    try {
      const raw = this.storage.getItem(SAVE_KEY);
      if (!raw) return structuredClone(DEFAULT_SAVE);
      const parsed: unknown = JSON.parse(raw);
      if (!isSaveData(parsed)) return structuredClone(DEFAULT_SAVE);
      return {
        ...structuredClone(DEFAULT_SAVE),
        ...parsed,
        selectedSkin: parsed.selectedSkin && parsed.unlockedSkins.includes(parsed.selectedSkin) ? parsed.selectedSkin : DEFAULT_SAVE.selectedSkin,
        settings: { ...DEFAULT_SAVE.settings, ...parsed.settings },
        dailyMission: { ...DEFAULT_SAVE.dailyMission, ...parsed.dailyMission },
      };
    } catch {
      return structuredClone(DEFAULT_SAVE);
    }
  }

  save(data: SaveData): void {
    try { this.storage?.setItem(SAVE_KEY, JSON.stringify(data)); } catch { /* storage can be full or blocked */ }
  }

  clear(): void {
    try { this.storage?.removeItem(SAVE_KEY); } catch { /* storage can be blocked */ }
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isSaveData(value: unknown): value is SaveData {
  if (!isRecord(value)) return false;
  const data = value as Partial<SaveData>;
  const settings = data.settings;
  const dailyMission = data.dailyMission;
  if (!isRecord(settings) || !isRecord(dailyMission) || !isRecord(data.wrongAnswers) || !isRecord(data.categoryStats)) return false;
  const categoryStatsValid = Object.values(data.categoryStats).every((stat) =>
    isRecord(stat) && typeof stat.correct === 'number' && Number.isFinite(stat.correct)
      && typeof stat.incorrect === 'number' && Number.isFinite(stat.incorrect),
  );
  return data.version === 1
    && typeof data.highScore === 'number' && Number.isFinite(data.highScore)
    && typeof data.bestWave === 'number' && Number.isFinite(data.bestWave)
    && typeof data.totalStars === 'number' && Number.isFinite(data.totalStars)
    && typeof data.correctAnswers === 'number' && Number.isFinite(data.correctAnswers)
    && typeof data.incorrectAnswers === 'number' && Number.isFinite(data.incorrectAnswers)
    && Object.values(data.wrongAnswers).every((count) => typeof count === 'number' && Number.isFinite(count) && count >= 0)
    && categoryStatsValid
    && Array.isArray(data.achievements) && data.achievements.every((item) => typeof item === 'string')
    && Array.isArray(data.unlockedSkins) && data.unlockedSkins.every((item) => ['classic', 'mint', 'sunset'].includes(item))
    && (data.selectedSkin === undefined || ['classic', 'mint', 'sunset'].includes(data.selectedSkin))
    && typeof settings.sound === 'boolean'
    && typeof settings.slowMode === 'boolean'
    && typeof settings.timerEnabled === 'boolean'
    && typeof data.lastDailyDate === 'string'
    && typeof dailyMission.date === 'string'
    && typeof dailyMission.correct === 'number' && Number.isFinite(dailyMission.correct)
    && typeof dailyMission.claimed === 'boolean';
}
