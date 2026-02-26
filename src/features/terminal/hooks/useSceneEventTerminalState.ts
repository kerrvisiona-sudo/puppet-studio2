import { useCallback, useEffect, useMemo, useRef, type KeyboardEvent as ReactKeyboardEvent } from 'react'
import { useShallow } from 'zustand/react/shallow'

import { useSceneStore, useUiStore, useBridgeStore, useViewportStore, useTerminalUiStore } from '../../../app/state'
import { listPoseStoreEngineCapabilities } from '../../../core/app-commanding'
import { runtimeConfig } from '../../../core/config'
import { isPrimaryShortcut } from '../../../shared/shortcuts'
import { createPoseStoreCommandDispatcher } from '../../../shared/ui'
import {
  buildSceneEventFilterOptions,
  filterTerminalCommandPaletteItems,
  filterSceneEvents,
  isTerminalCommandArgumentRequired,
  runTerminalCommandLine,
  selectSceneEvent,
  suggestTerminalCommands,
  stringifySceneEventPayload,
} from '../model'

export function useSceneEventTerminalState() {
  // Group 1: UI state (6 props)
  const {
    activeToolMode,
    sceneEventAutoScroll,
    sceneEventDroppedWhilePaused,
    sceneEventLog,
    sceneEventLogPaused,
    sceneEventTerminalOpen,
  } = useUiStore(
    useShallow((s) => ({
      activeToolMode: s.activeToolMode,
      sceneEventAutoScroll: s.sceneEventAutoScroll,
      sceneEventDroppedWhilePaused: s.sceneEventDroppedWhilePaused,
      sceneEventLog: s.sceneEventLog,
      sceneEventLogPaused: s.sceneEventLogPaused,
      sceneEventTerminalOpen: s.sceneEventTerminalOpen,
    }))
  )

  // Group 2: Scene state (2 props)
  const { sceneEditEnabled, sceneId } = useSceneStore(
    useShallow((s) => ({
      sceneEditEnabled: s.sceneEditEnabled,
      sceneId: s.sceneId,
    }))
  )

  // Group 3: Bridge state (1 prop)
  const sceneRemoteHoldEnabled = useBridgeStore((s) => s.sceneRemoteHoldEnabled)

  // Group 4: Viewport state (1 prop)
  const showDimensions = useViewportStore((s) => s.showDimensions)

  // Group 5: Terminal filters (5 props)
  const {
    sourceFilter,
    kindFilter,
    sceneFilter,
    levelFilter,
    searchFilter,
  } = useTerminalUiStore(
    useShallow((s) => ({
      sourceFilter: s.sourceFilter,
      kindFilter: s.kindFilter,
      sceneFilter: s.sceneFilter,
      levelFilter: s.levelFilter,
      searchFilter: s.searchFilter,
    }))
  )

  // Group 6: Terminal event selection (1 prop)
  const selectedEventId = useTerminalUiStore((s) => s.selectedEventId)

  // Group 7: Terminal command input state (4 props)
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
    }))
  )

  // Group 8: Terminal command history UI (1 prop)
  const commandHistoryExpanded = useTerminalUiStore((s) => s.commandHistoryExpanded)

  // Group 9: Terminal command palette state (4 props)
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
    }))
  )

  // Group 10: Terminal actions (16 actions - stable references, no shallow needed)
  const {
    setSourceFilter,
    setKindFilter,
    setSceneFilter,
    setLevelFilter,
    setSearchFilter,
    setSelectedEventId,
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
      setSourceFilter: s.setSourceFilter,
      setKindFilter: s.setKindFilter,
      setSceneFilter: s.setSceneFilter,
      setLevelFilter: s.setLevelFilter,
      setSearchFilter: s.setSearchFilter,
      setSelectedEventId: s.setSelectedEventId,
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
    }))
  )

  const bodyRef = useRef<HTMLDivElement | null>(null)
  const commandInputRef = useRef<HTMLInputElement | null>(null)
  const commandPaletteInputRef = useRef<HTMLInputElement | null>(null)

  const dispatchFromTerminal = createPoseStoreCommandDispatcher('ui.event_terminal')
  const commandSuggestions = useMemo(() => suggestTerminalCommands(commandInput), [commandInput])
  const commandPaletteItems = useMemo(
    () => filterTerminalCommandPaletteItems(commandPaletteQuery),
    [commandPaletteQuery],
  )

  const filterOptions = useMemo(() => buildSceneEventFilterOptions(sceneEventLog), [sceneEventLog])
  const filteredEvents = useMemo(
    () =>
      filterSceneEvents(sceneEventLog, {
        kindFilter,
        levelFilter,
        sceneFilter,
        searchFilter,
        sourceFilter,
      }),
    [kindFilter, levelFilter, sceneEventLog, sceneFilter, searchFilter, sourceFilter],
  )
  const selectedEvent = useMemo(() => selectSceneEvent(filteredEvents, selectedEventId), [filteredEvents, selectedEventId])
  const selectedEventPayload = useMemo(() => stringifySceneEventPayload(selectedEvent), [selectedEvent])
  const capabilities = listPoseStoreEngineCapabilities()
  const terminalCommandContext = useMemo(
    () => ({
      activeToolMode,
      capabilities,
      engineCapabilitiesDisabled: runtimeConfig.engineCapabilitiesDisabled,
      engineCapabilitiesEnabled: runtimeConfig.engineCapabilitiesEnabled,
      engineCapabilityProfile: runtimeConfig.engineCapabilityProfile,
      sceneEditEnabled,
      sceneEventAutoScroll,
      sceneEventLogPaused,
      sceneEventTerminalOpen,
      sceneId,
      sceneRemoteHoldEnabled,
      showDimensions,
    }),
    [
      capabilities,
      activeToolMode,
      sceneEditEnabled,
      sceneEventAutoScroll,
      sceneEventLogPaused,
      sceneEventTerminalOpen,
      sceneId,
      sceneRemoteHoldEnabled,
      showDimensions,
    ],
  )

  useEffect(() => {
    if (!sceneEventTerminalOpen || !sceneEventAutoScroll) return
    const node = bodyRef.current
    if (!node) return
    node.scrollTop = node.scrollHeight
    if (filteredEvents.length > 0) {
      setSelectedEventId(filteredEvents[filteredEvents.length - 1].id)
    }
  }, [filteredEvents, sceneEventAutoScroll, sceneEventTerminalOpen])

  useEffect(() => {
    if (filteredEvents.length === 0) {
      if (selectedEventId !== null) setSelectedEventId(null)
      return
    }
    if (!selectedEventId) {
      setSelectedEventId(filteredEvents[filteredEvents.length - 1].id)
      return
    }
    if (!filteredEvents.some((entry) => entry.id === selectedEventId)) {
      setSelectedEventId(filteredEvents[filteredEvents.length - 1].id)
    }
  }, [filteredEvents, selectedEventId])

  const executeTerminalCommand = useCallback(
    (rawInput: string) => {
      const result = runTerminalCommandLine(rawInput, terminalCommandContext)
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
      if (isTerminalCommandArgumentRequired(commandName)) {
        setCommandInput(`${commandName} `)
        closeCommandPalette()
        requestAnimationFrame(() => {
          commandInputRef.current?.focus()
        })
        return
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

  useEffect(() => {
    setCommandSuggestionCursor(null)
  }, [commandInput])

  useEffect(() => {
    setCommandPaletteSelectedIndex(0)
  }, [commandPaletteQuery])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (isPrimaryShortcut(event, 'j')) {
        event.preventDefault()
        const next = !commandPaletteOpen
        setCommandPaletteOpen(next)
        if (next) {
          setCommandPaletteQuery('')
          setCommandPaletteSelectedIndex(0)
        }
        return
      }

      if (isPrimaryShortcut(event, '9')) {
        event.preventDefault()
        dispatchFromTerminal({ kind: 'toggle_scene_event_terminal' })
        return
      }

      if (event.key === 'F2') {
        event.preventDefault()
        setCommandHistoryExpanded(!commandHistoryExpanded)
        return
      }

      if (event.key === 'F12') {
        event.preventDefault()
        setDynamicInputEnabled(!dynamicInputEnabled)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [commandHistoryExpanded, commandPaletteOpen, dispatchFromTerminal, dynamicInputEnabled, setCommandHistoryExpanded, setCommandPaletteOpen, setCommandPaletteQuery, setCommandPaletteSelectedIndex, setDynamicInputEnabled])

  useEffect(() => {
    if (!sceneEventTerminalOpen || !dynamicInputEnabled) return
    commandInputRef.current?.focus()
  }, [dynamicInputEnabled, sceneEventTerminalOpen])

  useEffect(() => {
    if (!commandPaletteOpen) return
    commandPaletteInputRef.current?.focus()
  }, [commandPaletteOpen])

  const handleCommandPaletteKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'ArrowDown') {
        if (commandPaletteItems.length <= 0) return
        event.preventDefault()
        setCommandPaletteSelectedIndex((commandPaletteSelectedIndex + 1) % commandPaletteItems.length)
        return
      }

      if (event.key === 'ArrowUp') {
        if (commandPaletteItems.length <= 0) return
        event.preventDefault()
        setCommandPaletteSelectedIndex((commandPaletteSelectedIndex - 1 + commandPaletteItems.length) % commandPaletteItems.length)
        return
      }

      if (event.key === 'Enter') {
        const selected = commandPaletteItems[commandPaletteSelectedIndex]
        if (!selected) return
        event.preventDefault()
        executePaletteCommand(selected.name)
        return
      }

      if (event.key === 'Escape') {
        event.preventDefault()
        closeCommandPalette()
      }
    },
    [closeCommandPalette, commandPaletteItems, commandPaletteSelectedIndex, executePaletteCommand, setCommandPaletteSelectedIndex],
  )

  return {
    bodyRef,
    commandHistory,
    commandHistoryExpanded,
    commandInput,
    commandInputRef,
    commandPaletteInputRef,
    commandPaletteItems,
    commandPaletteOpen,
    commandPaletteQuery,
    commandPaletteSelectedIndex,
    commandSuggestions,
    dynamicInputEnabled,
    dispatchFromTerminal,
    executePaletteCommand,
    executeTerminalCommand,
    filteredEvents,
    filterOptions,
    handleCommandPaletteKeyDown,
    handleCommandInputKeyDown,
    kindFilter,
    levelFilter,
    sceneEventAutoScroll,
    sceneEventDroppedWhilePaused,
    sceneEventLog,
    sceneEventLogPaused,
    sceneEventTerminalOpen,
    sceneFilter,
    searchFilter,
    selectedEvent,
    selectedEventId,
    selectedEventPayload,
    setKindFilter,
    setLevelFilter,
    setSceneFilter,
    setSearchFilter,
    setSelectedEventId,
    setSourceFilter,
    setCommandPaletteOpen,
    setCommandPaletteQuery,
    setCommandPaletteSelectedIndex,
    setCommandHistoryExpanded,
    setCommandInput,
    sourceFilter,
  }
}
