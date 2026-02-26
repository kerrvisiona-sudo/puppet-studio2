import type { PlanogramDefinition, Vec2, Vec3 } from './types'

export const WORLD_UNITS_PER_METER = 1
export const GRID_MINOR_STEP_M = 0.5
export const GRID_MAJOR_STEP_M = 1
export const TOP_VIEW_TARGET_PX_PER_M = 90
export const TOP_VIEW_PADDING_M = 0.6

export const TARGET_AVATAR_HEIGHT_M = 1.72
export const TARGET_AVATAR_FOOTPRINT_DEPTH_M = 0.34
export const TARGET_AVATAR_FOOTPRINT_WIDTH_M = 0.52
export const RAGDOLL_HEIGHT_PER_SCALE_UNIT = 2.14
export const RAGDOLL_SCALE = TARGET_AVATAR_HEIGHT_M / RAGDOLL_HEIGHT_PER_SCALE_UNIT

export const DEFAULT_PLANOGRAM: PlanogramDefinition = {
  room: {
    depthM: 4.0,
    heightM: 2.7,
    wallThicknessM: 0.12,
    widthM: 4.0,
  },
  placements: [],
}

export function degToRad(degrees: number) {
  return (degrees * Math.PI) / 180
}

export function metersToWorld(valueInMeters: number) {
  return valueInMeters * WORLD_UNITS_PER_METER
}

export function planToWorld(positionM: Vec2, elevationM = 0): Vec3 {
  return [metersToWorld(positionM[0]), metersToWorld(elevationM), metersToWorld(positionM[1])]
}
