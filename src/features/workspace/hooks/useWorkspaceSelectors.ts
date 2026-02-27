import { useMemo } from 'react'

import { useBridgeStore, useSceneStore, useUiStore, useViewportStore } from '../../../app/state'
import { listPoseStoreEngineCapabilities } from '../../../core/app-commanding'
import { useWorkspaceHudState } from './useWorkspaceHudState'

export function useWorkspaceSelectors() {
  // NOTE: This hook depends on useWorkspaceHudState. The HUD state is spread
  // into the return for convenience, creating an implicit dependency chain.
  const hud = useWorkspaceHudState()

  const bridgeStatus = useBridgeStore((state) => state.bridgeStatus)
  const bridgeUrl = useBridgeStore((state) => state.bridgeUrl)
  const sceneRemoteHoldEnabled = useBridgeStore((state) => state.sceneRemoteHoldEnabled)

  const cameraView = useViewportStore((state) => state.cameraView)
  const viewportCameraQuaternion = useViewportStore((state) => state.viewportCameraQuaternion)
  const projectionMode = useViewportStore((state) => state.projectionMode)
  const showDimensions = useViewportStore((state) => state.showDimensions)

  const monitoringCameraCount = useSceneStore((state) => state.monitoringCameras.length)
  const sceneEditEnabled = useSceneStore((state) => state.sceneEditEnabled)
  const sceneId = useSceneStore((state) => state.sceneId)
  const scenePlacementsCount = useSceneStore((state) => state.scenePlacements.length)
  const sceneRevision = useSceneStore((state) => state.sceneRevision)
  const sceneSequence = useSceneStore((state) => state.sceneSequence)
  const selectedPlacementId = useSceneStore((state) => state.selectedPlacementId)
  const detectionCount = useSceneStore((state) =>
    state.cameraDetectionOverlays.reduce((total, overlay) => total + overlay.boxes.length, 0),
  )

  const sceneEventTerminalOpen = useUiStore((state) => state.sceneEventTerminalOpen)
  const sceneEventLogCount = useUiStore((state) => state.sceneEventLog.length)
  const activeTool = useUiStore((state) => state.activeToolMode)

  const activeCapabilities = useMemo(
    () => listPoseStoreEngineCapabilities().filter((capability) => capability.enabled).length,
    [sceneEventLogCount],
  )

  return {
    bridgeStatus,
    bridgeUrl,
    sceneRemoteHoldEnabled,
    cameraView,
    viewportCameraQuaternion,
    projectionMode,
    showDimensions,
    monitoringCameraCount,
    sceneEditEnabled,
    sceneId,
    scenePlacementsCount,
    sceneRevision,
    sceneSequence,
    selectedPlacementId,
    detectionCount,
    sceneEventTerminalOpen,
    sceneEventLogCount,
    activeTool,
    activeCapabilities,
    ...hud,
  }
}
