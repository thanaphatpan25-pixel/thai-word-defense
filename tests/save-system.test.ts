import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_SAVE, SaveSystem } from '../src/systems/SaveSystem';

class MemoryStorage {
  private readonly values = new Map<string, string>();
  getItem(key: string): string | null { return this.values.get(key) ?? null; }
  setItem(key: string, value: string): void { this.values.set(key, value); }
  removeItem(key: string): void { this.values.delete(key); }
}

test('save system round-trips valid game progress', () => {
  const storage = new MemoryStorage() as unknown as Storage;
  const system = new SaveSystem(storage);
  const save = { ...structuredClone(DEFAULT_SAVE), highScore: 2300, bestWave: 9 };
  system.save(save);
  assert.equal(system.load().highScore, 2300);
  assert.equal(system.load().bestWave, 9);
});

test('save system provides the classic skin by default and preserves unlocked skin selection', () => {
  const storage = new MemoryStorage() as unknown as Storage;
  const system = new SaveSystem(storage);
  const defaultSave = system.load() as typeof DEFAULT_SAVE & { selectedSkin?: string };
  assert.equal(defaultSave.selectedSkin, 'classic');
  const selected = { ...defaultSave, selectedSkin: 'mint', unlockedSkins: ['classic', 'mint'] };
  system.save(selected as typeof DEFAULT_SAVE);
  assert.equal((system.load() as typeof DEFAULT_SAVE & { selectedSkin?: string }).selectedSkin, 'mint');
});

test('save system falls back to classic when the selected skin is not unlocked', () => {
  const storage = new MemoryStorage() as unknown as Storage;
  const data = { ...structuredClone(DEFAULT_SAVE), selectedSkin: 'sunset' };
  storage.setItem('thai-word-defense-save-v1', JSON.stringify(data));
  assert.equal(new SaveSystem(storage).load().selectedSkin, 'classic');
});

test('save system migrates older version-one data to the classic skin', () => {
  const storage = new MemoryStorage() as unknown as Storage;
  const legacy = structuredClone(DEFAULT_SAVE) as typeof DEFAULT_SAVE & { selectedSkin?: string };
  delete legacy.selectedSkin;
  storage.setItem('thai-word-defense-save-v1', JSON.stringify(legacy));
  assert.equal(new SaveSystem(storage).load().selectedSkin, 'classic');
});

test('save system recovers safely from malformed storage', () => {
  const storage = new MemoryStorage() as unknown as Storage;
  storage.setItem('thai-word-defense-save-v1', '{broken-json');
  const save = new SaveSystem(storage).load();
  assert.equal(save.version, 1);
  assert.equal(save.highScore, 0);
});

test('save system rejects structurally invalid nested data', () => {
  const storage = new MemoryStorage() as unknown as Storage;
  storage.setItem('thai-word-defense-save-v1', JSON.stringify({
    ...structuredClone(DEFAULT_SAVE),
    wrongAnswers: null,
    settings: null,
  }));
  const save = new SaveSystem(storage).load();
  assert.deepEqual(save.wrongAnswers, {});
  assert.equal(save.settings.sound, true);
});
