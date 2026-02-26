import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react'

import { useSceneStore, useUiStore, useBridgeStore, useViewportStore } from '../../../app/state'
import { listPoseStoreEngineCapabilities } from '../../../core/app-commanding'
import { runtimeConfig } from '../../../core/config'
import type { SceneEventLevel } from '../../../core/observability'
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

type CommandHistoryEntry = {
  at: string
  commandsCount: number
  input: string
  message: string
  status: 'error' | 'ok'
}

export function useSceneEventTerminalState() {
  // UI state
  const activeToolMode = useUiStore((state) => state.activeToolMode)
  const sceneEventAutoScroll = useUiStore((state) => state.sceneEventAutoScroll)
  const sceneEventDroppedWhilePaused = useUiStore((state) => state.sceneEventDroppedWhilePaused)
  const sceneEventLog = useUiStore((state) => state.sceneEventLog)
  const sceneEventLogPaused = useUiStore((state) => state.sceneEventLogPaused)
  const sceneEventTerminalOpen = useUiStore((state) => state.sceneEventTerminalOpen)

  // Scene state
  const sceneEditEnabled = useSceneStore((state) => state.sceneEditEnabled)
  const sceneId = useSceneStore((state) => state.sceneId)

  // Bridge state
  const sceneRemoteHoldEnabled = useBridgeStore((state) => state.sceneRemoteHoldEnabled)

  // Viewport state
  const showDimensions = useViewportStore((state) => state.showDimensions)

  const [sourceFilter, setSourceFilter] = useState('all')
  const [kindFilter, setKindFilter] = useState('all')
  const [sceneFilter, setSceneFilter] = useState('all')
  const [levelFilter, setLevelFilter] = useState<'all' | SceneEventLevel>('all')
  const [searchFilter, setSearchFilter] = useState('')
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)
  const [commandInput, setCommandInput] = useState('')
  const [commandHistory, setCommandHistory] = useState<CommandHistoryEntry[]>([])
  const [commandHistoryExpanded, setCommandHistoryExpanded] = useState(false)
  const [commandHistoryCursor, setCommandHistoryCursor] = useState<number | null>(null)
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)
  const [commandPaletteQuery, setCommandPaletteQuery] = useState('')
  const [commandPaletteSelectedIndex, setCommandPaletteSelectedIndex] = useState(0)
  const [commandSuggestionCursor, setCommandSuggestionCursor] = useState<number | null>(null)
  const [dynamicInputEnabled, setDynamicInputEnabled] = useState(false)
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

      setCommandHistory((history) => {
        const nextHistory: CommandHistoryEntry = {
          at: new Date().toISOString(),
          commandsCount: result.commands.length,
          input: result.input,
          message: result.message,
          status: result.status,
        }
        const next = [...history, nextHistory]
        if (next.length <= 120) return next
        return next.slice(next.length - 120)
      })
      setCommandInput('')
      setCommandHistoryCursor(null)
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
        setCommandHistoryCursor((cursor) => {
          const nextIndex = cursor === null ? commandHistory.length - 1 : Math.max(0, cursor - 1)
          const historyItem = commandHistory[nextIndex]
          if (historyItem) setCommandInput(historyItem.input)
          return nextIndex
        })
        return
      }

      if (event.key === 'ArrowDown') {
        if (commandHistory.length === 0) return
        event.preventDefault()
        setCommandHistoryCursor((cursor) => {
          if (cursor === null) return null
          const nextIndex = Math.min(commandHistory.length, cursor + 1)
          const historyItem = commandHistory[nextIndex]
          setCommandInput(historyItem ? historyItem.input : '')
          return historyItem ? nextIndex : null
        })
        return
      }

      if (event.key === 'Escape') {
        setCommandInput('')
        setCommandHistoryCursor(null)
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
    [commandHistory, commandInput, commandSuggestionCursor, commandSuggestions, executeTerminalCommand],
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
        setCommandPaletteOpen((open) => {
          const next = !open
          if (next) {
            setCommandPaletteQuery('')
            setCommandPaletteSelectedIndex(0)
          }
          return next
        })
        return
      }

      if (isPrimaryShortcut(event, '9')) {
        event.preventDefault()
        dispatchFromTerminal({ kind: 'toggle_scene_event_terminal' })
        return
      }

      if (event.key === 'F2') {
        event.preventDefault()
        setCommandHistoryExpanded((expanded) => !expanded)
        return
      }

      if (event.key === 'F12') {
        event.preventDefault()
        setDynamicInputEnabled((enabled) => !enabled)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [dispatchFromTerminal])

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
        setCommandPaletteSelectedIndex((index) => (index + 1) % commandPaletteItems.length)
        return
      }

      if (event.key === 'ArrowUp') {
        if (commandPaletteItems.length <= 0) return
        event.preventDefault()
        setCommandPaletteSelectedIndex((index) => (index - 1 + commandPaletteItems.length) % commandPaletteItems.length)
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
    [closeCommandPalette, commandPaletteItems, commandPaletteSelectedIndex, executePaletteCommand],
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
