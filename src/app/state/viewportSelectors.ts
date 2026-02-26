import type { ViewportState } from './viewportStore'

/**
 * Selector factories for viewportStore
 * Use with useShallow for optimized re-renders
 */

export const viewportSelectors = {
  /** Camera view state (5 props) */
  camera: (s: ViewportState) => ({
    cameraView: s.cameraView,
    viewportCameraQuaternion: s.viewportCameraQuaternion,
    projectionMode: s.projectionMode,
    topQuarterTurns: s.topQuarterTurns,
    selectedMonitoringCameraId: s.selectedMonitoringCameraId,
  }),

  /** Camera overlay flip state (2 props) */
  cameraOverlayFlip: (s: ViewportState) => ({
    cameraOverlayFlipX: s.cameraOverlayFlipX,
    cameraOverlayFlipY: s.cameraOverlayFlipY,
  }),

  /** Camera actions (6 actions) */
  cameraActions: (s: ViewportState) => ({
    setCameraView: s.setCameraView,
    setViewportCameraQuaternion: s.setViewportCameraQuaternion,
    setProjectionMode: s.setProjectionMode,
    rotateTopView: s.rotateTopView,
    setSelectedMonitoringCameraId: s.setSelectedMonitoringCameraId,
  }),

  /** Overlay actions (2 actions) */
  overlayActions: (s: ViewportState) => ({
    setCameraOverlayFlip: s.setCameraOverlayFlip,
    resetCameraOverlayFlip: s.resetCameraOverlayFlip,
  }),
}
