export class AudioManager {
  private enabled = true;
  private context: AudioContext | null = null;
  private musicTimer: number | null = null;
  private musicRequested = false;
  private noteIndex = 0;
  private readonly melody = [392, 494, 587, 494, 440, 523, 659, 523, 392, 494, 587, 784, 659, 587, 523, 440];

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) this.stopMusicPlayback();
    else if (this.musicRequested) this.startMusicPlayback();
  }

  isEnabled(): boolean { return this.enabled; }

  /** Start a gentle chiptune loop. Call after a user gesture so browsers permit audio. */
  startMusic(): void {
    this.musicRequested = true;
    this.startMusicPlayback();
  }

  stopMusic(): void {
    this.musicRequested = false;
    this.stopMusicPlayback();
  }

  playTone(frequency: number, durationMs = 90, wave: OscillatorType = 'square'): void {
    if (!this.enabled) return;
    const context = this.getContext();
    if (!context) return;
    try {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = wave;
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0.0001, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.08, context.currentTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + durationMs / 1000);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start();
      oscillator.stop(context.currentTime + durationMs / 1000 + 0.02);
    } catch { /* WebAudio may be unavailable in restricted browsers */ }
  }

  correct(): void { this.playTone(660, 90, 'triangle'); }
  wrong(): void { this.playTone(190, 150, 'sawtooth'); }
  click(): void { this.playTone(420, 45, 'square'); }
  reward(): void { this.playTone(820, 130, 'triangle'); }

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined' || !window.AudioContext) return null;
    try {
      this.context ??= new window.AudioContext();
      if (this.context.state === 'suspended') void this.context.resume();
      return this.context;
    } catch {
      return null;
    }
  }

  private startMusicPlayback(): void {
    if (!this.enabled || typeof window === 'undefined' || this.musicTimer !== null) return;
    const play = (): void => {
      if (!this.enabled) return;
      const frequency = this.melody[this.noteIndex % this.melody.length] ?? 440;
      this.noteIndex += 1;
      const context = this.getContext();
      if (!context) return;
      try {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(frequency, context.currentTime);
        gain.gain.setValueAtTime(0.0001, context.currentTime);
        gain.gain.linearRampToValueAtTime(0.022, context.currentTime + 0.02);
        gain.gain.linearRampToValueAtTime(0.0001, context.currentTime + 0.22);
        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.start();
        oscillator.stop(context.currentTime + 0.24);
      } catch { /* Ignore audio errors and keep the game playable */ }
    };
    play();
    this.musicTimer = window.setInterval(play, 260);
  }

  private stopMusicPlayback(): void {
    if (typeof window !== 'undefined' && this.musicTimer !== null) window.clearInterval(this.musicTimer);
    this.musicTimer = null;
  }
}
