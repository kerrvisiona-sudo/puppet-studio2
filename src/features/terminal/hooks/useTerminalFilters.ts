import { useShallow } from 'zustand/react/shallow'

import { useTerminalUiStore } from '../../../app/state'

export function useTerminalFilters() {
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
    })),
  )

  const selectedEventId = useTerminalUiStore((s) => s.selectedEventId)

  const {
    setSourceFilter,
    setKindFilter,
    setSceneFilter,
    setLevelFilter,
    setSearchFilter,
    setSelectedEventId,
  } = useTerminalUiStore(
    useShallow((s) => ({
      setSourceFilter: s.setSourceFilter,
      setKindFilter: s.setKindFilter,
      setSceneFilter: s.setSceneFilter,
      setLevelFilter: s.setLevelFilter,
      setSearchFilter: s.setSearchFilter,
      setSelectedEventId: s.setSelectedEventId,
    })),
  )

  return {
    filters: {
      sourceFilter,
      kindFilter,
      sceneFilter,
      levelFilter,
      searchFilter,
    },
    setters: {
      setSourceFilter,
      setKindFilter,
      setSceneFilter,
      setLevelFilter,
      setSearchFilter,
      setSelectedEventId,
    },
    selectedEventId,
  }
}
