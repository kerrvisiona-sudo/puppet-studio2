import { TOP_VIEW_PADDING_M, TOP_VIEW_TARGET_PX_PER_M, WORLD_UNITS_PER_METER } from '../../core/planogram-domain'
import type { MonitoringCameraDefinition, RoomDefinition } from '../../core/planogram-domain'
import { degToRad, planToWorldPosition } from './sceneGeometry'

export type QuarterTurns = 0 | 1 | 2 | 3

export type Basis2D = {
  right: [number, number]
  up: [number, number]
}

export type PlanTransform2D = {
  roomBounds: { maxX: number; maxY: number; minX: number; minY: number }
  roomCorners: Array<[number, number]>
  scale: number
  toCanvas: (xM: number, zM: number) => [number, number]
}

export function getTopViewBasis(topQuarterTurns: QuarterTurns): Basis2D {
  if (topQuarterTurns === 0) return { right: [-1, 0], up: [0, 1] }
  if (topQuarterTurns === 1) return { right: [0, 1], up: [1, 0] }
  if (topQuarterTurns === 2) return { right: [1, 0], up: [0, -1] }
  return { right: [0, -1], up: [-1, 0] }
}

export function createPlanTransform(
  room: RoomDefinition,
  mapWidth: number,
  mapHeight: number,
  padding: number,
  topQuarterTurns: QuarterTurns,
): PlanTransform2D {
  const basis = getTopViewBasis(topQuarterTurns)
  const toViewUnits = (xM: number, zM: number): [number, number] => [
    xM * basis.right[0] + zM * basis.right[1],
    xM * basis.up[0] + zM * basis.up[1],
  ]

  const roomCornersInViewUnits = [
    toViewUnits(-room.widthM / 2, -room.depthM / 2),
    toViewUnits(room.widthM / 2, -room.depthM / 2),
    toViewUnits(room.widthM / 2, room.depthM / 2),
    toViewUnits(-room.widthM / 2, room.depthM / 2),
  ] as Array<[number, number]>

  const viewMinX = Math.min(...roomCornersInViewUnits.map((point) => point[0]))
  const viewMaxX = Math.max(...roomCornersInViewUnits.map((point) => point[0]))
  const viewMinY = Math.min(...roomCornersInViewUnits.map((point) => point[1]))
  const viewMaxY = Math.max(...roomCornersInViewUnits.map((point) => point[1]))

  const scale = Math.min(
    (mapWidth - padding * 2) / Math.max(viewMaxX - viewMinX, 0.0001),
    (mapHeight - padding * 2) / Math.max(viewMaxY - viewMinY, 0.0001),
  )

  const cx = mapWidth / 2
  const cy = mapHeight / 2
  const toCanvas = (xM: number, zM: number): [number, number] => {
    const [vx, vy] = toViewUnits(xM, zM)
    return [cx + vx * scale, cy - vy * scale]
  }

  const roomCorners = [
    toCanvas(-room.widthM / 2, -room.depthM / 2),
    toCanvas(room.widthM / 2, -room.depthM / 2),
    toCanvas(room.widthM / 2, room.depthM / 2),
    toCanvas(-room.widthM / 2, room.depthM / 2),
  ] as Array<[number, number]>

  return {
    roomBounds: {
      maxX: Math.max(...roomCorners.map((point) => point[0])),
      maxY: Math.max(...roomCorners.map((point) => point[1])),
      minX: Math.min(...roomCorners.map((point) => point[0])),
      minY: Math.min(...roomCorners.map((point) => point[1])),
    },
    roomCorners,
    scale,
    toCanvas,
  }
}

export function computeTopViewPixelsPerMeter(viewportWidthPx: number, viewportHeightPx: number, room: RoomDefinition): number {
  const fitPixelsPerMeter = Math.min(
    viewportWidthPx / (room.widthM + TOP_VIEW_PADDING_M * 2),
    viewportHeightPx / (room.depthM + TOP_VIEW_PADDING_M * 2),
  )
  const targetPixelsPerMeter = TOP_VIEW_TARGET_PX_PER_M * WORLD_UNITS_PER_METER
  return Math.max(1, Math.min(targetPixelsPerMeter, fitPixelsPerMeter))
}

export function cameraWorldPosition(camera: MonitoringCameraDefinition): [number, number, number] {
  return planToWorldPosition([camera.planPositionM[0], camera.planPositionM[1]], camera.heightM)
}

export function cameraAngles(camera: MonitoringCameraDefinition): { pitch: number; yaw: number } {
  return {
    pitch: degToRad(camera.pitchDeg),
    yaw: degToRad(camera.yawDeg),
  }
}

export function cameraForward(camera: MonitoringCameraDefinition): [number, number, number] {
  const { pitch, yaw } = cameraAngles(camera)
  return [Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), Math.cos(yaw) * Math.cos(pitch)]
}

export function computeSensorPlaneDistance(camera: MonitoringCameraDefinition, anchorWorldZ = 0): number {
  const origin = cameraWorldPosition(camera)
  const forward = cameraForward(camera)
  const forwardZ = forward[2]
  if (Math.abs(forwardZ) < 1e-5) return camera.overlayDistanceM

  const distance = (anchorWorldZ - origin[2]) / forwardZ
  if (!Number.isFinite(distance) || distance <= 0.2) return camera.overlayDistanceM
  return distance
}
