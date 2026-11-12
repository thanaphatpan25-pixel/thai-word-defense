export interface BossProgress {
  zombieId: string;
  questionsRemaining: number;
  phase: 'shielded' | 'exposed';
}
