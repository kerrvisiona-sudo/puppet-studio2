import type { Placement } from '../../core/planogram-domain'

export type ScenePatchPayload = {
  removes?: string[]
  upserts?: Array<Record<string, unknown>>
}

function normalizeNumber(value: number | undefined): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

function placementEquals(a: Placement, b: Placement): boolean {
  if (a.id !== b.id) return false
  if (a.assetId !== b.assetId) return false
  if (a.planPositionM[0] !== b.planPositionM[0] || a.planPositionM[1] !== b.planPositionM[1]) return false
  if (normalizeNumber(a.rotationDeg) !== normalizeNumber(b.rotationDeg)) return false
  if (normalizeNumber(a.elevationM) !== normalizeNumber(b.elevationM)) return false
  if ((a.trackId ?? null) !== (b.trackId ?? null)) return false
  if ((a.objectId ?? null) !== (b.objectId ?? null)) return false

  const sizeA = a.targetSizeM
  const sizeB = b.targetSizeM
  if (!sizeA && !sizeB) return true
  if (!sizeA || !sizeB) return false
  return sizeA.width === sizeB.width && sizeA.depth === sizeB.depth && sizeA.height === sizeB.height
}

function placementToSceneEntity(placement: Placement): Record<string, unknown> {
  const entity: Record<string, unknown> = {
    assetId: placement.assetId,
    entityType: 'object',
    id: placement.id,
    planPositionM: [placement.planPositionM[0], placement.planPositionM[1]],
  }
  if (typeof placement.trackId === 'string') entity.trackId = placement.trackId
  if (typeof placement.objectId === 'string') entity.objectId = placement.objectId
  if (typeof placement.rotationDeg === 'number') entity.rotationDeg = placement.rotationDeg
  if (typeof placement.elevationM === 'number') entity.elevationM = placement.elevationM
  if (placement.targetSizeM) {
    entity.targetSizeM = {
      width: placement.targetSizeM.width,
      depth: placement.targetSizeM.depth,
      height: placement.targetSizeM.height,
    }
  }
  return entity
}

export function buildScenePatchFromPlacements(previous: Placement[], next: Placement[]): ScenePatchPayload | null {
  const prevById = new Map(previous.map((placement) => [placement.id, placement]))
  const nextById = new Map(next.map((placement) => [placement.id, placement]))

  const removes: string[] = []
  const upserts: Array<Record<string, unknown>> = []

  for (const [id, prevPlacement] of prevById.entries()) {
    const nextPlacement = nextById.get(id)
    if (!nextPlacement) {
      removes.push(id)
      continue
    }
    if (!placementEquals(prevPlacement, nextPlacement)) {
      upserts.push(placementToSceneEntity(nextPlacement))
    }
  }

  for (const [id, nextPlacement] of nextById.entries()) {
    if (!prevById.has(id)) {
      upserts.push(placementToSceneEntity(nextPlacement))
    }
  }

  if (removes.length === 0 && upserts.length === 0) return null

  const patch: ScenePatchPayload = {}
  if (removes.length > 0) patch.removes = removes
  if (upserts.length > 0) patch.upserts = upserts
  return patch
}
