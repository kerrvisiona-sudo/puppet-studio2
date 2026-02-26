import type { CameraDetectionOverlay, MonitoringCameraDefinition } from '../../../core/planogram-domain'

type ImageDirection = 'left' | 'right' | 'up' | 'down'

export type CameraAxisMapping = {
  x: ImageDirection
  z: ImageDirection
}

export type CameraOverlayViewModel = {
  autoPlanogramFlipX: boolean
  effectiveFlipX: boolean
  effectiveFlipY: boolean
  selectedOverlay: CameraDetectionOverlay | null
  worldAxisMapping: CameraAxisMapping | null
}

function degToRad(value: number) {
  return (value * Math.PI) / 180
}

function cameraBasis(camera: MonitoringCameraDefinition) {
  const yaw = degToRad(camera.yawDeg)
  const pitch = degToRad(camera.pitchDeg)
  const forward: [number, number, number] = [Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), Math.cos(yaw) * Math.cos(pitch)]
  const right: [number, number, number] = [Math.cos(yaw), 0, -Math.sin(yaw)]
  const up: [number, number, number] = [
    forward[1] * right[2] - forward[2] * right[1],
    forward[2] * right[0] - forward[0] * right[2],
    forward[0] * right[1] - forward[1] * right[0],
  ]
  return { right, up }
}

function dot3(a: [number, number, number], b: [number, number, number]) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
}

function imageDirectionLabel(camera: MonitoringCameraDefinition, axis: [number, number, number]): ImageDirection {
  const { right, up } = cameraBasis(camera)
  const screenX = dot3(axis, right)
  const screenY = -dot3(axis, up)
  if (Math.abs(screenX) >= Math.abs(screenY)) {
    return screenX >= 0 ? 'right' : 'left'
  }
  return screenY >= 0 ? 'down' : 'up'
}

function applyFlipDirection(direction: ImageDirection, flipX: boolean, flipY: boolean): ImageDirection {
  if (flipX && direction === 'left') return 'right'
  if (flipX && direction === 'right') return 'left'
  if (flipY && direction === 'up') return 'down'
  if (flipY && direction === 'down') return 'up'
  return direction
}

function xorBool(a: boolean, b: boolean) {
  return (a && !b) || (!a && b)
}

export function selectCameraOverlay(
  overlays: CameraDetectionOverlay[],
  selectedCamera: MonitoringCameraDefinition | null,
): CameraDetectionOverlay | null {
  if (!selectedCamera) return null
  return overlays.find((overlay) => overlay.cameraId === selectedCamera.id) ?? null
}

export function buildCameraOverlayViewModel(
  selectedCamera: MonitoringCameraDefinition | null,
  selectedOverlay: CameraDetectionOverlay | null,
  manualFlipX: boolean,
  manualFlipY: boolean,
): CameraOverlayViewModel {
  const autoPlanogramFlipX = selectedCamera ? imageDirectionLabel(selectedCamera, [1, 0, 0]) === 'left' : false
  const effectiveFlipX = xorBool(manualFlipX, autoPlanogramFlipX)
  const effectiveFlipY = manualFlipY

  let worldAxisMapping: CameraAxisMapping | null = null
  if (selectedCamera) {
    const mappedX = imageDirectionLabel(selectedCamera, [1, 0, 0])
    const mappedZ = imageDirectionLabel(selectedCamera, [0, 0, 1])
    worldAxisMapping = {
      x: applyFlipDirection(mappedX, effectiveFlipX, effectiveFlipY),
      z: applyFlipDirection(mappedZ, effectiveFlipX, effectiveFlipY),
    }
  }

  return {
    autoPlanogramFlipX,
    effectiveFlipX,
    effectiveFlipY,
    selectedOverlay,
    worldAxisMapping,
  }
}
