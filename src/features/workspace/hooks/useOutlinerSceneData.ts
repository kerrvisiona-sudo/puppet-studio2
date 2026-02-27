import { useSceneStore, useViewportStore, useUiStore } from '../../../app/state'

export function useOutlinerSceneData() {
  // Scene state
  const sceneId = useSceneStore((state) => state.sceneId)
  const sceneRevision = useSceneStore((state) => state.sceneRevision)
  const sceneSequence = useSceneStore((state) => state.sceneSequence)
  const scenePlacements = useSceneStore((state) => state.scenePlacements)
  const selectedPlacementId = useSceneStore((state) => state.selectedPlacementId)
  const monitoringCameras = useSceneStore((state) => state.monitoringCameras)
  const cameraDetectionOverlays = useSceneStore((state) => state.cameraDetectionOverlays)

  // Viewport state
  const selectedMonitoringCameraId = useViewportStore((state) => state.selectedMonitoringCameraId)

  // UI state
  const sceneEventLog = useUiStore((state) => state.sceneEventLog)

  return {
    sceneId,
    sceneRevision,
    sceneSequence,
    scenePlacements,
    selectedPlacementId,
    monitoringCameras,
    cameraDetectionOverlays,
    selectedMonitoringCameraId,
    sceneEventLog,
  }
}
