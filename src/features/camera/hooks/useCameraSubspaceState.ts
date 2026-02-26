import { useMemo } from 'react'

import { useViewportStore, useSceneStore } from '../../../app/state'
import { selectMonitoringCamera } from '../../../core/scene-domain'
import { createPoseStoreCommandDispatcher } from '../../../shared/ui'
import { buildCameraOverlayViewModel, selectCameraOverlay } from '../model'

export function useCameraSubspaceState() {
  // Viewport state
  const cameraOverlayFlipX = useViewportStore((state) => state.cameraOverlayFlipX)
  const cameraOverlayFlipY = useViewportStore((state) => state.cameraOverlayFlipY)
  const cameraView = useViewportStore((state) => state.cameraView)
  const selectedMonitoringCameraId = useViewportStore((state) => state.selectedMonitoringCameraId)

  // Scene state
  const cameraDetectionOverlays = useSceneStore((state) => state.cameraDetectionOverlays)
  const monitoringCameras = useSceneStore((state) => state.monitoringCameras)

  const selectedCamera = useMemo(
    () => selectMonitoringCamera(monitoringCameras, selectedMonitoringCameraId),
    [monitoringCameras, selectedMonitoringCameraId],
  )
  const selectedOverlay = useMemo(
    () => selectCameraOverlay(cameraDetectionOverlays, selectedCamera),
    [cameraDetectionOverlays, selectedCamera],
  )
  const overlayView = useMemo(
    () => buildCameraOverlayViewModel(selectedCamera, selectedOverlay, cameraOverlayFlipX, cameraOverlayFlipY),
    [cameraOverlayFlipX, cameraOverlayFlipY, selectedCamera, selectedOverlay],
  )

  const dispatchFromCameraPanel = createPoseStoreCommandDispatcher('ui.camera_panel')

  return {
    cameraOverlayFlipX,
    cameraOverlayFlipY,
    cameraView,
    dispatchFromCameraPanel,
    monitoringCameras,
    selectedCamera,
    ...overlayView,
  }
}
