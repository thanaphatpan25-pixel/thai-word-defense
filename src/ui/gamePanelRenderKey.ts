export interface GamePanelTowerState {
  id: string;
  type: string;
  level: number;
}

export interface GamePanelAnswerState {
  correct: boolean;
  explanation: string;
  reward: number;
}

export interface GamePanelRenderState {
  phase: string;
  questionId: string;
  message: string;
  towers: readonly GamePanelTowerState[];
  selectedTowerId: string | null;
  paused: boolean;
  timerEnabled: boolean;
  upgradeCardIds: readonly string[];
  selectedTower: string | null;
  lastAnswer: GamePanelAnswerState | null;
  orderSelection: readonly string[];
  soundEnabled: boolean;
}

/**
 * Produces a stable key for content that changes the side panel's structure.
 * Intentionally excludes live counters (HP, coins, score, timer milliseconds)
 * so frequent game ticks never replace interactive button DOM nodes.
 */
export function createGamePanelRenderKey(state: GamePanelRenderState): string {
  return JSON.stringify({
    phase: state.phase,
    questionId: state.questionId,
    message: state.message,
    towers: state.towers.map(({ id, type, level }) => [id, type, level]),
    selectedTowerId: state.selectedTowerId,
    paused: state.paused,
    timerEnabled: state.timerEnabled,
    upgradeCardIds: state.upgradeCardIds,
    selectedTower: state.selectedTower,
    lastAnswer: state.lastAnswer
      ? [state.lastAnswer.correct, state.lastAnswer.explanation, state.lastAnswer.reward]
      : null,
    orderSelection: state.orderSelection,
    soundEnabled: state.soundEnabled,
  });
}
