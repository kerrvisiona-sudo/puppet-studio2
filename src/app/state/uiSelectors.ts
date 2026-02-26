import type { UiState } from './uiStore'

/**
 * Selector factories for uiStore
 * Use with useShallow for optimized re-renders
 */

export const uiSelectors = {
  /** Scene event terminal state (5 props) */
  sceneEventTerminal: (s: UiState) => ({
    sceneEventAutoScroll: s.sceneEventAutoScroll,
    sceneEventDroppedWhilePaused: s.sceneEventDroppedWhilePaused,
    sceneEventLog: s.sceneEventLog,
    sceneEventLogPaused: s.sceneEventLogPaused,
    sceneEventTerminalOpen: s.sceneEventTerminalOpen,
  }),

  /** Scene event terminal actions (5 actions) */
  sceneEventTerminalActions: (s: UiState) => ({
    setSceneEventAutoScroll: s.setSceneEventAutoScroll,
    setSceneEventLogPaused: s.setSceneEventLogPaused,
    setSceneEventTerminalOpen: s.setSceneEventTerminalOpen,
    toggleSceneEventTerminal: s.toggleSceneEventTerminal,
    appendSceneEvent: s.appendSceneEvent,
    clearSceneEventLog: s.clearSceneEventLog,
  }),
}
