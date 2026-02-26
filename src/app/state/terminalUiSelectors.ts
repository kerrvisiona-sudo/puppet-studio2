import type { TerminalUiState } from './terminalUiStore'

/**
 * Selector factories for terminalUiStore
 * Use with useShallow for optimized re-renders
 */

export const terminalUiSelectors = {
  /** Filter state (5 props) */
  filters: (s: TerminalUiState) => ({
    sourceFilter: s.sourceFilter,
    kindFilter: s.kindFilter,
    sceneFilter: s.sceneFilter,
    levelFilter: s.levelFilter,
    searchFilter: s.searchFilter,
  }),

  /** Command input state (4 props) */
  commandInput: (s: TerminalUiState) => ({
    commandInput: s.commandInput,
    commandHistory: s.commandHistory,
    commandHistoryCursor: s.commandHistoryCursor,
    dynamicInputEnabled: s.dynamicInputEnabled,
  }),

  /** Command palette state (4 props) */
  commandPalette: (s: TerminalUiState) => ({
    commandPaletteOpen: s.commandPaletteOpen,
    commandPaletteQuery: s.commandPaletteQuery,
    commandPaletteSelectedIndex: s.commandPaletteSelectedIndex,
    commandSuggestionCursor: s.commandSuggestionCursor,
  }),

  /** Filter actions (5 actions) */
  filterActions: (s: TerminalUiState) => ({
    setSourceFilter: s.setSourceFilter,
    setKindFilter: s.setKindFilter,
    setSceneFilter: s.setSceneFilter,
    setLevelFilter: s.setLevelFilter,
    setSearchFilter: s.setSearchFilter,
  }),

  /** Command input actions (6 actions) */
  commandInputActions: (s: TerminalUiState) => ({
    setCommandInput: s.setCommandInput,
    setCommandHistoryCursor: s.setCommandHistoryCursor,
    setCommandSuggestionCursor: s.setCommandSuggestionCursor,
    setDynamicInputEnabled: s.setDynamicInputEnabled,
    appendCommandHistory: s.appendCommandHistory,
    resetCommandInput: s.resetCommandInput,
  }),

  /** Command palette actions (3 actions) */
  commandPaletteActions: (s: TerminalUiState) => ({
    setCommandPaletteOpen: s.setCommandPaletteOpen,
    setCommandPaletteQuery: s.setCommandPaletteQuery,
    setCommandPaletteSelectedIndex: s.setCommandPaletteSelectedIndex,
  }),
}
