import type { Placement, RoomDefinition } from '../../core/planogram-domain'
import {
  clampPlacementToRoom,
  getPlacementBoundsRect,
  normalizeDeg,
  rectsOverlap,
} from './sceneGeometry'

export type SceneConstraintZone = {
  assetIds?: string[]
  id: string
  maxX: number
  maxZ: number
  minX: number
  minZ: number
}

export type SceneCommandContext = {
  constraints?: SceneConstraintZone[]
  placements: Placement[]
  room: RoomDefinition
  selectedPlacementId: string | null
}

export type SceneCommandResult = {
  blockedByConstraint: boolean
  changed: boolean
  constraintZoneId: string | null
  placements: Placement[]
  selectedPlacementId: string | null
}

export type SceneCommand =
  | {
      kind: 'move_selected_by'
      deltaM: [number, number]
    }
  | {
      kind: 'rotate_selected_by'
      deltaDeg: number
    }
  | {
      kind: 'snap_selected_to_grid'
      stepM: number
    }

function clonePlacement(placement: Placement): Placement {
  return {
    ...placement,
    planPositionM: [placement.planPositionM[0], placement.planPositionM[1]],
    targetSizeM: placement.targetSizeM
      ? {
          width: placement.targetSizeM.width,
          depth: placement.targetSizeM.depth,
          height: placement.targetSizeM.height,
        }
      : undefined,
  }
}

function constraintAppliesToPlacement(zone: SceneConstraintZone, placement: Placement): boolean {
  if (!zone.assetIds || zone.assetIds.length === 0) return true
  return zone.assetIds.includes(placement.assetId)
}

function findBlockingConstraintZone(placement: Placement, zones: SceneConstraintZone[] | undefined): SceneConstraintZone | null {
  if (!zones || zones.length === 0) return null

  const placementRect = getPlacementBoundsRect(placement)

  for (const zone of zones) {
    if (!constraintAppliesToPlacement(zone, placement)) continue
    const zoneRect = {
      maxX: Math.max(zone.minX, zone.maxX),
      maxZ: Math.max(zone.minZ, zone.maxZ),
      minX: Math.min(zone.minX, zone.maxX),
      minZ: Math.min(zone.minZ, zone.maxZ),
    }
    if (rectsOverlap(placementRect, zoneRect)) {
      return zone
    }
  }

  return null
}

function applyToSelectedPlacement(
  context: SceneCommandContext,
  updater: (placement: Placement) => Placement,
): SceneCommandResult {
  if (!context.selectedPlacementId) {
    return {
      blockedByConstraint: false,
      changed: false,
      constraintZoneId: null,
      placements: context.placements,
      selectedPlacementId: context.selectedPlacementId,
    }
  }

  const index = context.placements.findIndex((placement) => placement.id === context.selectedPlacementId)
  if (index < 0) {
    return {
      blockedByConstraint: false,
      changed: false,
      constraintZoneId: null,
      placements: context.placements,
      selectedPlacementId: null,
    }
  }

  const nextPlacements = context.placements.map((placement) => clonePlacement(placement))
  const current = nextPlacements[index]
  const updated = clampPlacementToRoom(updater(current), context.room)

  const changed =
    updated.planPositionM[0] !== current.planPositionM[0] ||
    updated.planPositionM[1] !== current.planPositionM[1] ||
    (updated.rotationDeg ?? 0) !== (current.rotationDeg ?? 0)

  if (!changed) {
    return {
      blockedByConstraint: false,
      changed: false,
      constraintZoneId: null,
      placements: context.placements,
      selectedPlacementId: context.selectedPlacementId,
    }
  }

  const blockingZone = findBlockingConstraintZone(updated, context.constraints)
  if (blockingZone) {
    return {
      blockedByConstraint: true,
      changed: false,
      constraintZoneId: blockingZone.id,
      placements: context.placements,
      selectedPlacementId: context.selectedPlacementId,
    }
  }

  nextPlacements[index] = updated
  return {
    blockedByConstraint: false,
    changed: true,
    constraintZoneId: null,
    placements: nextPlacements,
    selectedPlacementId: context.selectedPlacementId,
  }
}

export function applySceneCommand(context: SceneCommandContext, command: SceneCommand): SceneCommandResult {
  if (command.kind === 'move_selected_by') {
    const deltaX = Number(command.deltaM[0]) || 0
    const deltaZ = Number(command.deltaM[1]) || 0
    if (deltaX === 0 && deltaZ === 0) {
      return {
        blockedByConstraint: false,
        changed: false,
        constraintZoneId: null,
        placements: context.placements,
        selectedPlacementId: context.selectedPlacementId,
      }
    }

    return applyToSelectedPlacement(context, (placement) => ({
      ...placement,
      planPositionM: [placement.planPositionM[0] + deltaX, placement.planPositionM[1] + deltaZ],
    }))
  }

  if (command.kind === 'rotate_selected_by') {
    const delta = Number(command.deltaDeg) || 0
    if (delta === 0) {
      return {
        blockedByConstraint: false,
        changed: false,
        constraintZoneId: null,
        placements: context.placements,
        selectedPlacementId: context.selectedPlacementId,
      }
    }

    return applyToSelectedPlacement(context, (placement) => ({
      ...placement,
      rotationDeg: normalizeDeg((placement.rotationDeg ?? 0) + delta),
    }))
  }

  const step = Number(command.stepM)
  if (!Number.isFinite(step) || step <= 0) {
    return {
      blockedByConstraint: false,
      changed: false,
      constraintZoneId: null,
      placements: context.placements,
      selectedPlacementId: context.selectedPlacementId,
    }
  }

  return applyToSelectedPlacement(context, (placement) => ({
    ...placement,
    planPositionM: [Math.round(placement.planPositionM[0] / step) * step, Math.round(placement.planPositionM[1] / step) * step],
  }))
}
