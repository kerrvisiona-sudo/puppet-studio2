import { useEffect } from 'react'
import type { RefObject } from 'react'

import type { CameraDetectionOverlay, MonitoringCameraDefinition } from '../../../core/planogram-domain'
import { CAMERA_PANEL_DPR, CAMERA_PANEL_HEIGHT, CAMERA_PANEL_WIDTH, drawCameraPlane } from '../model'

export function useCameraPlaneCanvas(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  camera: MonitoringCameraDefinition | null,
  overlay: CameraDetectionOverlay | null,
  flipX: boolean,
  flipY: boolean,
) {
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.width = Math.floor(CAMERA_PANEL_WIDTH * CAMERA_PANEL_DPR)
    canvas.height = Math.floor(CAMERA_PANEL_HEIGHT * CAMERA_PANEL_DPR)
    canvas.style.width = `${CAMERA_PANEL_WIDTH}px`
    canvas.style.height = `${CAMERA_PANEL_HEIGHT}px`
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.setTransform(CAMERA_PANEL_DPR, 0, 0, CAMERA_PANEL_DPR, 0, 0)
    drawCameraPlane(canvas, camera, overlay, flipX, flipY)
  }, [camera, canvasRef, flipX, flipY, overlay])
}
