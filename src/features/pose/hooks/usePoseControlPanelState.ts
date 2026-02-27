import { createAppCommandDispatcher } from '../../../shared/ui'
import { usePoseControlPanelAvatar } from './usePoseControlPanelAvatar'
import { usePoseControlPanelBridge } from './usePoseControlPanelBridge'
import { usePoseControlPanelScene } from './usePoseControlPanelScene'
import { usePoseControlPanelUi } from './usePoseControlPanelUi'

export function usePoseControlPanelState() {
  // Compose focused hooks by domain
  const avatarState = usePoseControlPanelAvatar()
  const bridgeState = usePoseControlPanelBridge()
  const sceneState = usePoseControlPanelScene()
  const uiState = usePoseControlPanelUi()

  const dispatchFromControlPanel = createAppCommandDispatcher('ui.control_panel')

  return {
    ...avatarState,
    ...bridgeState,
    ...sceneState,
    ...uiState,
    dispatchFromControlPanel,
  }
}
