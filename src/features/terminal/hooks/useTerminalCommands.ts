import { useCallback, useMemo, useRef } from 'react'
import type { KeyboardEvent as ReactKeyboardEvent } from 'react'
import { useShallow } from 'zustand/react/shallow'

import { useSceneStore, useUiStore, useTerminalUiStore } from '../../../app/state'
import { listPoseStoreEngineCapabilities } from '../../../core/app-commanding'
import { runtimeConfig } from '../../../core/config'
import { createAppCommandDispatcher } from '../../../shared/ui'
import {
  runTerminalCommandLine,
  suggestTerminalCommands,
  type TerminalCommandContext,
} from '../model'

export function useTerminalCommands(context: {
  activeToolMode: string
  sceneEventAutoScroll: boolean
  sceneEventLogPaused: boolean
  sceneEventTerminalOpen: boolean
  sceneEditEnabled: boolean
  sceneId: string
  sceneRemoteHoldEnabled: boolean
  showDimensions: boolean
}) {
  // ═══════════════════════════════════════════════════════════
  // SECTION 1: Store selectors (command input, history, palette)
  // ═══════════════════════════════════════════════════════════
  const {
    commandInput,
    commandHistory,
    commandHistoryCursor,
    dynamicInputEnabled,
  } = useTerminalUiStore(
    useShallow((s) => ({
      commandInput: s.commandInput,
      commandHistory: s.commandHistory,
      commandHistoryCursor: s.commandHistoryCursor,
      dynamicInputEnabled: s.dynamicInputEnabled,
    })),
  )

  const commandHistoryExpanded = useTerminalUiStore((s) => s.commandHistoryExpanded)

  const {
    commandPaletteOpen,
    commandPaletteQuery,
    commandPaletteSelectedIndex,
    commandSuggestionCursor,
  } = useTerminalUiStore(
    useShallow((s) => ({
      commandPaletteOpen: s.commandPaletteOpen,
      commandPaletteQuery: s.commandPaletteQuery,
      commandPaletteSelectedIndex: s.commandPaletteSelectedIndex,
      commandSuggestionCursor: s.commandSuggestionCursor,
    })),
  )

  const {
    setCommandInput,
    setCommandHistoryExpanded,
    setCommandHistoryCursor,
    setCommandPaletteOpen,
    setCommandPaletteQuery,
    setCommandPaletteSelectedIndex,
    setCommandSuggestionCursor,
    setDynamicInputEnabled,
    appendCommandHistory,
    resetCommandInput,
  } = useTerminalUiStore(
    useShallow((s) => ({
      setCommandInput: s.setCommandInput,
      setCommandHistoryExpanded: s.setCommandHistoryExpanded,
      setCommandHistoryCursor: s.setCommandHistoryCursor,
      setCommandPaletteOpen: s.setCommandPaletteOpen,
      setCommandPaletteQuery: s.setCommandPaletteQuery,
      setCommandPaletteSelectedIndex: s.setCommandPaletteSelectedIndex,
      setCommandSuggestionCursor: s.setCommandSuggestionCursor,
      setDynamicInputEnabled: s.setDynamicInputEnabled,
      appendCommandHistory: s.appendCommandHistory,
      resetCommandInput: s.resetCommandInput,
    })),
  )

  const commandInputRef = useRef<HTMLInputElement | null>(null)
  const commandPaletteInputRef = useRef<HTMLInputElement | null>(null)

  // ═══════════════════════════════════════════════════════════
  // SECTION 2: Derived state (suggestions, context)
  // ═══════════════════════════════════════════════════════════
  const dispatchFromTerminal = createAppCommandDispatcher('ui.event_terminal')
  const commandSuggestions = useMemo(() => suggestTerminalCommands(commandInput), [commandInput])

  const capabilities = listPoseStoreEngineCapabilities()
  const terminalCommandContext = useMemo(
    () => ({
      activeToolMode: context.activeToolMode,
      capabilities,
      engineCapabilitiesDisabled: runtimeConfig.engineCapabilitiesDisabled,
      engineCapabilitiesEnabled: runtimeConfig.engineCapabilitiesEnabled,
      engineCapabilityProfile: runtimeConfig.engineCapabilityProfile,
      sceneEditEnabled: context.sceneEditEnabled,
      sceneEventAutoScroll: context.sceneEventAutoScroll,
      sceneEventLogPaused: context.sceneEventLogPaused,
      sceneEventTerminalOpen: context.sceneEventTerminalOpen,
      sceneId: context.sceneId,
      sceneRemoteHoldEnabled: context.sceneRemoteHoldEnabled,
      showDimensions: context.showDimensions,
    }),
    [
      capabilities,
      context.activeToolMode,
      context.sceneEditEnabled,
      context.sceneEventAutoScroll,
      context.sceneEventLogPaused,
      context.sceneEventTerminalOpen,
      context.sceneId,
      context.sceneRemoteHoldEnabled,
      context.showDimensions,
    ],
  )

  // ═══════════════════════════════════════════════════════════
  // SECTION 3: Command execution
  // ═══════════════════════════════════════════════════════════
  const executeTerminalCommand = useCallback(
    (rawInput: string) => {
      const result = runTerminalCommandLine(rawInput, terminalCommandContext as TerminalCommandContext)
      if (!result) return

      for (const command of result.commands) {
        dispatchFromTerminal(command)
      }

      const sceneStore = useSceneStore.getState()
      const uiStore = useUiStore.getState()
      uiStore.appendSceneEvent({
        kind: result.status === 'ok' ? 'terminal_command' : 'terminal_command_error',
        level: result.status === 'ok' ? 'info' : 'warn',
        message: {
          commands: result.commands,
          input: result.input,
          message: result.message,
        },
        revision: sceneStore.sceneRevision,
        sceneId: sceneStore.sceneId,
        sequence: sceneStore.sceneSequence,
        source: 'frontend.command_line',
        summary: `cmd ${result.input} -> ${result.message}`,
      })

      appendCommandHistory({
        at: new Date().toISOString(),
        commandsCount: result.commands.length,
        input: result.input,
        message: result.message,
        status: result.status,
      })
      resetCommandInput()
    },
    [dispatchFromTerminal, terminalCommandContext],
  )

  const closeCommandPalette = useCallback(() => {
    setCommandPaletteOpen(false)
    setCommandPaletteQuery('')
    setCommandPaletteSelectedIndex(0)
  }, [])

  const executePaletteCommand = useCallback(
    (commandName: string) => {
      if (false) {
        // Placeholder for isTerminalCommandArgumentRequired
      }
      executeTerminalCommand(commandName)
      closeCommandPalette()
    },
    [closeCommandPalette, executeTerminalCommand],
  )

  const handleCommandInputKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter') {
        event.preventDefault()
        executeTerminalCommand(commandInput)
        return
      }

      if (event.key === 'ArrowUp') {
        if (commandHistory.length === 0) return
        event.preventDefault()
        const nextIndex = commandHistoryCursor === null ? commandHistory.length - 1 : Math.max(0, commandHistoryCursor - 1)
        const historyItem = commandHistory[nextIndex]
        if (historyItem) {
          setCommandInput(historyItem.input)
          setCommandHistoryCursor(nextIndex)
        }
        return
      }

      if (event.key === 'ArrowDown') {
        if (commandHistory.length === 0) return
        event.preventDefault()
        if (commandHistoryCursor === null) return
        const nextIndex = Math.min(commandHistory.length, commandHistoryCursor + 1)
        const historyItem = commandHistory[nextIndex]
        setCommandInput(historyItem ? historyItem.input : '')
        setCommandHistoryCursor(historyItem ? nextIndex : null)
        return
      }

      if (event.key === 'Escape') {
        resetCommandInput()
        setCommandSuggestionCursor(null)
      }

      if (event.key === 'Tab') {
        if (commandSuggestions.length <= 0) return
        event.preventDefault()
        const nextIndex =
          commandSuggestionCursor === null ? 0 : (commandSuggestionCursor + 1) % commandSuggestions.length
        const nextSuggestion = commandSuggestions[nextIndex]
        if (!nextSuggestion) return
        setCommandInput(`${nextSuggestion} `)
        setCommandSuggestionCursor(nextIndex)
      }
    },
    [commandHistory, commandHistoryCursor, commandInput, commandSuggestionCursor, commandSuggestions, executeTerminalCommand, resetCommandInput, setCommandHistoryCursor, setCommandInput, setCommandSuggestionCursor],
  )

  return {
    closeCommandPalette,
    commandInput,
    commandHistory,
    commandHistoryCursor,
    commandHistoryExpanded,
    commandInputRef,
    commandPaletteInputRef,
    commandPaletteOpen,
    commandPaletteQuery,
    commandPaletteSelectedIndex,
    commandSuggestions,
    dynamicInputEnabled,
    dispatchFromTerminal,
    executePaletteCommand,
    executeTerminalCommand,
    handleCommandInputKeyDown,
    setCommandHistoryExpanded,
    setCommandInput,
    setCommandHistoryCursor,
    setCommandPaletteOpen,
    setCommandPaletteQuery,
    setCommandPaletteSelectedIndex,
    setCommandSuggestionCursor,
    setDynamicInputEnabled,
  }
}
