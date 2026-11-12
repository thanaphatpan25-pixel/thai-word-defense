import test from 'node:test';
import assert from 'node:assert/strict';
import { AudioManager } from '../src/systems/AudioManager';

class MockAudioParam {
  value = 0;
  setValueAtTime(value: number): void { this.value = value; }
  linearRampToValueAtTime(value: number): void { this.value = value; }
  exponentialRampToValueAtTime(value: number): void { this.value = value; }
}

class MockOscillator {
  type: OscillatorType = 'square';
  frequency = new MockAudioParam();
  started = false;
  stopped = false;
  connect(): void {}
  start(): void { this.started = true; }
  stop(): void { this.stopped = true; }
}

class MockGain {
  gain = new MockAudioParam();
  connect(): void {}
}

class MockAudioContext {
  state: AudioContextState = 'running';
  currentTime = 0;
  destination = {};
  oscillators: MockOscillator[] = [];
  createOscillator(): MockOscillator {
    const oscillator = new MockOscillator();
    this.oscillators.push(oscillator);
    return oscillator;
  }
  createGain(): MockGain { return new MockGain(); }
  resume(): Promise<void> { return Promise.resolve(); }
}

test('background music starts after the player gesture and stops when sound is muted', () => {
  const originalWindow = globalThis.window;
  const context = new MockAudioContext();
  const timerCallbacks: Array<() => void> = [];
  let timerCleared = false;
  const fakeWindow = {
    AudioContext: class { constructor() { return context; } },
    setInterval: (callback: () => void) => { timerCallbacks.push(callback); return 17; },
    clearInterval: (timerId: number) => { if (timerId === 17) timerCleared = true; },
  } as unknown as Window & typeof globalThis;
  globalThis.window = fakeWindow;
  try {
    const audio = new AudioManager();
    audio.startMusic();
    assert.equal(context.oscillators.length, 1);
    assert.equal(context.oscillators[0]?.started, true);
    assert.equal(timerCallbacks.length, 1);
    audio.setEnabled(false);
    assert.equal(timerCleared, true);
    timerCallbacks[0]?.();
    assert.equal(context.oscillators.length, 1, 'muted music must not schedule additional notes');
  } finally {
    globalThis.window = originalWindow;
  }
});
