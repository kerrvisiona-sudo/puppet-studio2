import { useEffect, type RefObject } from 'react'
import { useShallow } from 'zustand/react/shallow'

import { useTerminalUiStore } from '../../../app/state'
import type { SceneEventEntry } from '../../../core/observability/sceneEventLog'

export function useTerminalAutoScroll(options: {
  bodyRef: RefObject<HTMLDivElement | null>
  filteredEvents: SceneEventEntry[]
  sceneEventAutoScroll: boolean
  sceneEventTerminalOpen: boolean
}) {
  const { bodyRef, filteredEvents, sceneEventAutoScroll, sceneEventTerminalOpen } = options

  const setSelectedEventId = useTerminalUiStore((s) => s.setSelectedEventId)

  useEffect(() => {
    if (!sceneEventTerminalOpen || !sceneEventAutoScroll) return
    const node = bodyRef.current
    if (!node) return
    node.scrollTop = node.scrollHeight
    if (filteredEvents.length > 0) {
      setSelectedEventId(filteredEvents[filteredEvents.length - 1].id)
    }
  }, [filteredEvents, sceneEventAutoScroll, sceneEventTerminalOpen, setSelectedEventId])

  useEffect(() => {
    if (filteredEvents.length === 0) {
      setSelectedEventId(null)
      return
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const currentSelectedId = useTerminalUiStore.getState().selectedEventId
    if (!currentSelectedId) {
      setSelectedEventId(filteredEvents[filteredEvents.length - 1].id)
      return
    }
    if (!filteredEvents.some((entry) => entry.id === currentSelectedId)) {
      setSelectedEventId(filteredEvents[filteredEvents.length - 1].id)
    }
  }, [filteredEvents, setSelectedEventId])
}
