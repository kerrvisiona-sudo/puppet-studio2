import { useMemo } from 'react'

import { useViewportStore, useSceneStore, useAvatarStore } from '../../../app/state'
import { selectMonitoringCamera } from '../../../core/scene-domain'
import { buildAvatarWorldTransform } from '../model'

export function useSceneViewportState() {
  // Avatar state
  const avatarPlanPositionM = useAvatarStore((state) => state.avatarPlanPositionM)
  const avatarRotationDeg = useAvatarStore((state) => state.avatarRotationDeg)
  const pose = useAvatarStore((state) => state.pose)

  // Scene state
  const cameraDetectionOverlays = useSceneStore((state) => state.cameraDetectionOverlays)
  const monitoringCameras = useSceneStore((state) => state.monitoringCameras)
  const scenePlacements = useSceneStore((state) => state.scenePlacements)
  const sceneRoom = useSceneStore((state) => state.sceneRoom)

  // Viewport state
  const cameraOverlayFlipX = useViewportStore((state) => state.cameraOverlayFlipX)
  const cameraOverlayFlipY = useViewportStore((state) => state.cameraOverlayFlipY)
  const cameraView = useViewportStore((state) => state.cameraView)
  const projectionMode = useViewportStore((state) => state.projectionMode)
  const selectedMonitoringCameraId = useViewportStore((state) => state.selectedMonitoringCameraId)
  const topQuarterTurns = useViewportStore((state) => state.topQuarterTurns)

  const avatarWorldTransform = useMemo(
    () => buildAvatarWorldTransform(avatarPlanPositionM, avatarRotationDeg),
    [avatarPlanPositionM, avatarRotationDeg],
  )
  const selectedMonitoringCamera = useMemo(
    () => selectMonitoringCamera(monitoringCameras, selectedMonitoringCameraId),
    [monitoringCameras, selectedMonitoringCameraId],
  )

  return {
    avatarWorldPosition: avatarWorldTransform.position,
    avatarYaw: avatarWorldTransform.yaw,
    cameraDetectionOverlays,
    cameraOverlayFlipX,
    cameraOverlayFlipY,
    cameraView,
    monitoringCameras,
    pose,
    projectionMode,
    scenePlacements,
    sceneRoom,
    selectedMonitoringCamera,
    topQuarterTurns,
  }
}
