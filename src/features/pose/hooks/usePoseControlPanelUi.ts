import { useUiStore } from '../../../app/state'

export function usePoseControlPanelUi() {
  const sceneEventTerminalOpen = useUiStore((s) => s.sceneEventTerminalOpen)

  return {
    sceneEventTerminalOpen,
  }
}
