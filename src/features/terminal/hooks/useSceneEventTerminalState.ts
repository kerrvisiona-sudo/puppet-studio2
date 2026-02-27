import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useShallow } from 'zustand/react/shallow'

import { useSceneStore, useUiStore, useBridgeStore, useTerminalUiStore } from '../../../app/state'
import { createAppCommandDispatcher } from '../../../shared/ui'
import {
  buildSceneEventFilterOptions,
  filterTerminalCommandPaletteItems,
  filterSceneEvents,
  selectSceneEvent,
  stringifySceneEventPayload,
} from '../model'
import { useTerminalFilters } from './useTerminalFilters'
import { useTerminalCommands } from './useTerminalCommands'
import { useTerminalKeyboard } from './useTerminalKeyboard'
import { useTerminalAutoScroll } from './useTerminalAutoScroll'

export function useSceneEventTerminalState() {
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

  const { sceneEditEnabled, sceneId } = useSceneStore(
    useShallow((s) => ({
      sceneEditEnabled: s.sceneEditEnabled,
      sceneId: s.sceneId,
    }))
  )

  const sceneRemoteHoldEnabled = useBridgeStore((s) => s.sceneRemoteHoldEnabled)

  const filters = useTerminalFilters()
  const bodyRef = useRef<HTMLDivElement | null>(null)

  const filterOptions = useMemo(() => buildSceneEventFilterOptions(sceneEventLog), [sceneEventLog])
  const filteredEvents = useMemo(
    () =>
      filterSceneEvents(sceneEventLog, {
        kindFilter: filters.filters.kindFilter,
        levelFilter: filters.filters.levelFilter,
        sceneFilter: filters.filters.sceneFilter,
        searchFilter: filters.filters.searchFilter,
        sourceFilter: filters.filters.sourceFilter,
      }),
    [filters.filters, sceneEventLog],
  )
  const selectedEvent = useMemo(() => selectSceneEvent(filteredEvents, filters.selectedEventId), [filteredEvents, filters.selectedEventId])
  const selectedEventPayload = useMemo(() => stringifySceneEventPayload(selectedEvent), [selectedEvent])

  const commandContext = useMemo(
    () => ({
      activeToolMode,
      sceneEventAutoScroll,
      sceneEventLogPaused,
      sceneEventTerminalOpen,
      sceneEditEnabled,
      sceneId,
      sceneRemoteHoldEnabled,
      showDimensions: false,
    }),
    [activeToolMode, sceneEditEnabled, sceneEventAutoScroll, sceneEventLogPaused, sceneEventTerminalOpen, sceneId, sceneRemoteHoldEnabled],
  )

  const commands = useTerminalCommands(commandContext)

  const commandPaletteItems = useMemo(
    () => filterTerminalCommandPaletteItems(commands.commandPaletteQuery),
    [commands.commandPaletteQuery],
  )

  useTerminalKeyboard({
    commandPaletteOpen: commands.commandPaletteOpen,
    commandHistoryExpanded: commands.commandHistoryExpanded,
    dynamicInputEnabled: commands.dynamicInputEnabled,
  })

  useTerminalAutoScroll({
    bodyRef,
    filteredEvents,
    sceneEventAutoScroll,
    sceneEventTerminalOpen,
  })

  useEffect(() => {
    commands.setCommandSuggestionCursor(null)
  }, [commands.commandInput])

  useEffect(() => {
    commands.setCommandPaletteSelectedIndex(0)
  }, [commands.commandPaletteQuery])

  useEffect(() => {
    if (!sceneEventTerminalOpen || !commands.dynamicInputEnabled) return
    commands.commandInputRef.current?.focus()
  }, [commands.dynamicInputEnabled, sceneEventTerminalOpen])

  useEffect(() => {
    if (!commands.commandPaletteOpen) return
    commands.commandPaletteInputRef.current?.focus()
  }, [commands.commandPaletteOpen])

  const handleCommandPaletteKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'ArrowDown') {
        if (commandPaletteItems.length <= 0) return
        event.preventDefault()
        commands.setCommandPaletteSelectedIndex((commands.commandPaletteSelectedIndex + 1) % commandPaletteItems.length)
        return
      }

      if (event.key === 'ArrowUp') {
        if (commandPaletteItems.length <= 0) return
        event.preventDefault()
        commands.setCommandPaletteSelectedIndex((commands.commandPaletteSelectedIndex - 1 + commandPaletteItems.length) % commandPaletteItems.length)
        return
      }

      if (event.key === 'Enter') {
        const selected = commandPaletteItems[commands.commandPaletteSelectedIndex]
        if (!selected) return
        event.preventDefault()
        commands.executePaletteCommand(selected.name)
        return
      }

      if (event.key === 'Escape') {
        event.preventDefault()
        commands.closeCommandPalette()
      }
    },
    [commandPaletteItems, commands],
  )

  return {
    bodyRef,
    commandHistory: commands.commandHistory,
    commandHistoryExpanded: commands.commandHistoryExpanded,
    commandInput: commands.commandInput,
    commandInputRef: commands.commandInputRef,
    commandPaletteInputRef: commands.commandPaletteInputRef,
    commandPaletteItems,
    commandPaletteOpen: commands.commandPaletteOpen,
    commandPaletteQuery: commands.commandPaletteQuery,
    commandPaletteSelectedIndex: commands.commandPaletteSelectedIndex,
    commandSuggestions: commands.commandSuggestions,
    dynamicInputEnabled: commands.dynamicInputEnabled,
    dispatchFromTerminal: commands.dispatchFromTerminal,
    executePaletteCommand: commands.executePaletteCommand,
    executeTerminalCommand: commands.executeTerminalCommand,
    filteredEvents,
    filterOptions,
    handleCommandPaletteKeyDown,
    handleCommandInputKeyDown: commands.handleCommandInputKeyDown,
    kindFilter: filters.filters.kindFilter,
    levelFilter: filters.filters.levelFilter,
    sceneEventAutoScroll,
    sceneEventDroppedWhilePaused,
    sceneEventLog,
    sceneEventLogPaused,
    sceneEventTerminalOpen,
    sceneFilter: filters.filters.sceneFilter,
    searchFilter: filters.filters.searchFilter,
    selectedEvent,
    selectedEventId: filters.selectedEventId,
    selectedEventPayload,
    setKindFilter: filters.setters.setKindFilter,
    setLevelFilter: filters.setters.setLevelFilter,
    setSceneFilter: filters.setters.setSceneFilter,
    setSearchFilter: filters.setters.setSearchFilter,
    setSelectedEventId: filters.setters.setSelectedEventId,
    setSourceFilter: filters.setters.setSourceFilter,
    setCommandPaletteOpen: commands.setCommandPaletteOpen,
    setCommandPaletteQuery: commands.setCommandPaletteQuery,
    setCommandPaletteSelectedIndex: commands.setCommandPaletteSelectedIndex,
    setCommandHistoryExpanded: commands.setCommandHistoryExpanded,
    setCommandInput: commands.setCommandInput,
    sourceFilter: filters.filters.sourceFilter,
  }
}
