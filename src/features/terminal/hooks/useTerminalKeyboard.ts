import { useEffect } from 'react'
import { useShallow } from 'zustand/react/shallow'

import { useTerminalUiStore } from '../../../app/state'
import { isPrimaryShortcut } from '../../../shared/shortcuts'
import { createAppCommandDispatcher } from '../../../shared/ui'

export function useTerminalKeyboard(options: {
  commandPaletteOpen: boolean
  commandHistoryExpanded: boolean
  dynamicInputEnabled: boolean
}) {
  const { commandPaletteOpen, commandHistoryExpanded, dynamicInputEnabled } = options

  const dispatchFromTerminal = createAppCommandDispatcher('ui.event_terminal')

  const {
    setCommandPaletteOpen,
    setCommandPaletteQuery,
    setCommandPaletteSelectedIndex,
    setCommandHistoryExpanded,
    setDynamicInputEnabled,
  } = useTerminalUiStore(
    useShallow((s) => ({
      setCommandPaletteOpen: s.setCommandPaletteOpen,
      setCommandPaletteQuery: s.setCommandPaletteQuery,
      setCommandPaletteSelectedIndex: s.setCommandPaletteSelectedIndex,
      setCommandHistoryExpanded: s.setCommandHistoryExpanded,
      setDynamicInputEnabled: s.setDynamicInputEnabled,
    })),
  )

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
  }, [
    commandHistoryExpanded,
    commandPaletteOpen,
    dispatchFromTerminal,
    dynamicInputEnabled,
    setCommandHistoryExpanded,
    setCommandPaletteOpen,
    setCommandPaletteQuery,
    setCommandPaletteSelectedIndex,
    setDynamicInputEnabled,
  ])
}
