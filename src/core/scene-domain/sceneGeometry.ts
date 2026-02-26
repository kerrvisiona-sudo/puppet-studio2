import { ASSET_CATALOG } from '../planogram-domain/catalog'
import { metersToWorld } from '../planogram-domain/layout'
import { getPlacementTargetSizeM } from '../planogram-domain/sync'
import type { Placement, RoomDefinition } from '../planogram-domain/types'

export type PlanPoint2D = [number, number]

export type PlanRect = {
  maxX: number
  maxZ: number
  minX: number
  minZ: number
}

export type PlanHalfExtents2D = {
  x: number
  z: number
}

export function degToRad(degrees: number): number {
  return (degrees * Math.PI) / 180
}

export function normalizeDeg(value: number): number {
  const normalized = ((value % 360) + 360) % 360
  return normalized > 180 ? normalized - 360 : normalized
}

export function placementYawDeg(placement: Placement): number {
  const asset = ASSET_CATALOG[placement.assetId]
  return (placement.rotationDeg ?? 0) + (asset.defaultRotationDeg ?? 0)
}

export function orientedRectCorners(
  center: PlanPoint2D,
  halfWidthM: number,
  halfDepthM: number,
  yawDeg: number,
): PlanPoint2D[] {
  const yawRad = degToRad(yawDeg)
  const c = Math.cos(yawRad)
  const s = Math.sin(yawRad)
  const [centerX, centerZ] = center
  const localCorners: PlanPoint2D[] = [
    [-halfWidthM, -halfDepthM],
    [halfWidthM, -halfDepthM],
    [halfWidthM, halfDepthM],
    [-halfWidthM, halfDepthM],
  ]
  return localCorners.map(([lx, lz]) => [centerX + lx * c - lz * s, centerZ + lx * s + lz * c])
}

export function getPlacementFootprintCorners(placement: Placement): PlanPoint2D[] {
  const targetSize = getPlacementTargetSizeM(placement)
  return orientedRectCorners(
    [placement.planPositionM[0], placement.planPositionM[1]],
    targetSize.width / 2,
    targetSize.depth / 2,
    placementYawDeg(placement),
  )
}

export function getPlacementHalfExtents(placement: Placement): PlanHalfExtents2D {
  const targetSize = getPlacementTargetSizeM(placement)
  const yawRad = degToRad(placementYawDeg(placement))
  const halfWidth = targetSize.width / 2
  const halfDepth = targetSize.depth / 2
  return {
    x: Math.abs(Math.cos(yawRad)) * halfWidth + Math.abs(Math.sin(yawRad)) * halfDepth,
    z: Math.abs(Math.sin(yawRad)) * halfWidth + Math.abs(Math.cos(yawRad)) * halfDepth,
  }
}

export function getPlacementBoundsRect(placement: Placement): PlanRect {
  const extents = getPlacementHalfExtents(placement)
  const centerX = placement.planPositionM[0]
  const centerZ = placement.planPositionM[1]
  return {
    maxX: centerX + extents.x,
    maxZ: centerZ + extents.z,
    minX: centerX - extents.x,
    minZ: centerZ - extents.z,
  }
}

function clamp(value: number, min: number, max: number): number {
  if (min > max) return (min + max) / 2
  return Math.max(min, Math.min(max, value))
}

export function clampPlanPositionToRoom(
  position: PlanPoint2D,
  extents: PlanHalfExtents2D,
  room: RoomDefinition,
): PlanPoint2D {
  const minX = -room.widthM / 2 + extents.x
  const maxX = room.widthM / 2 - extents.x
  const minZ = -room.depthM / 2 + extents.z
  const maxZ = room.depthM / 2 - extents.z
  return [clamp(position[0], minX, maxX), clamp(position[1], minZ, maxZ)]
}

export function clampPlacementToRoom(placement: Placement, room: RoomDefinition): Placement {
  const extents = getPlacementHalfExtents(placement)
  const nextPosition = clampPlanPositionToRoom([placement.planPositionM[0], placement.planPositionM[1]], extents, room)
  if (nextPosition[0] === placement.planPositionM[0] && nextPosition[1] === placement.planPositionM[1]) {
    return placement
  }
  return {
    ...placement,
    planPositionM: nextPosition,
  }
}

export function rectsOverlap(a: PlanRect, b: PlanRect): boolean {
  return a.minX < b.maxX && a.maxX > b.minX && a.minZ < b.maxZ && a.maxZ > b.minZ
}

export function planToWorldPosition(positionM: PlanPoint2D, elevationM = 0): [number, number, number] {
  return [metersToWorld(positionM[0]), metersToWorld(elevationM), metersToWorld(positionM[1])]
}
