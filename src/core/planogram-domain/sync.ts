import { ASSET_CATALOG } from './catalog'
import type {
  AssetId,
  CameraDetectionOverlay,
  DetectionBox2D,
  Dimensions3D,
  MonitoringCameraDefinition,
  Placement,
  RoomDefinition,
} from './types'

type Dict = Record<string, unknown>

type SceneSnapshot = {
  placements: Placement[]
  room: RoomDefinition
}

export type SceneSpecialistMeta = {
  generatedAt: string | null
  source: string | null
  spatialAgeS: number | null
  spatialFresh: boolean | null
  spatialStaleAfterS: number | null
  stalePolicy: string | null
}

export type AvatarTransform = {
  objectId: string | null
  planPositionM: [number, number]
  rotationDeg: number
  trackId: string | null
}

type ParsedBridgeScene = SceneSnapshot & {
  avatar: AvatarTransform | null
  cameraDetectionOverlays: CameraDetectionOverlay[] | null
  monitoringCameras: MonitoringCameraDefinition[] | null
  receivedAt: string
  revision: number | null
  sceneId: string | null
  specialistMeta: SceneSpecialistMeta | null
  sequence: number | null
}

const MIN_SIZE = 0.001

function isRecord(value: unknown): value is Dict {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

function toFiniteNumber(value: unknown): number | null {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return null
  return numeric
}

function toStringOrNull(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value : null
}

function cloneDimensions(size: Dimensions3D): Dimensions3D {
  return {
    depth: size.depth,
    height: size.height,
    width: size.width,
  }
}

function normalizePositive(value: unknown, fallback: number): number {
  const numeric = toFiniteNumber(value)
  if (numeric === null || numeric <= 0) return fallback
  return numeric
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value))
}

function isAssetId(value: unknown): value is AssetId {
  return typeof value === 'string' && value in ASSET_CATALOG
}

function parsePlanPosition(value: unknown, fallback: [number, number] | null): [number, number] | null {
  if (Array.isArray(value) && value.length >= 2) {
    const x = toFiniteNumber(value[0])
    const z = toFiniteNumber(value[1])
    if (x !== null && z !== null) return [x, z]
  }
  if (isRecord(value)) {
    const x = toFiniteNumber(value.x)
    const z = toFiniteNumber(value.z ?? value.y)
    if (x !== null && z !== null) return [x, z]
  }
  return fallback ? [fallback[0], fallback[1]] : null
}

function parseDimensions(value: unknown, fallback: Dimensions3D | undefined): Dimensions3D | undefined {
  if (!isRecord(value)) return fallback ? cloneDimensions(fallback) : undefined
  const width = normalizePositive(value.width, fallback?.width ?? 1)
  const height = normalizePositive(value.height, fallback?.height ?? 1)
  const depth = normalizePositive(value.depth, fallback?.depth ?? 1)
  return {
    depth: Math.max(depth, MIN_SIZE),
    height: Math.max(height, MIN_SIZE),
    width: Math.max(width, MIN_SIZE),
  }
}

function parsePlacement(raw: unknown, fallback: Placement | null): Placement | null {
  if (!isRecord(raw)) return null

  const trackId = toStringOrNull(raw.trackId ?? raw.track_id) ?? fallback?.trackId ?? null
  const objectId = toStringOrNull(raw.objectId ?? raw.object_id) ?? fallback?.objectId ?? null
  const id =
    toStringOrNull(raw.id) ?? (trackId ? `trk:${trackId}` : null) ?? (objectId ? `obj:${objectId}` : null) ?? fallback?.id ?? null
  if (!id) return null

  const assetId = isAssetId(raw.assetId) ? raw.assetId : fallback?.assetId
  if (!assetId) return null

  const planPositionM = parsePlanPosition(raw.planPositionM ?? raw.positionM, fallback?.planPositionM ?? null)
  if (!planPositionM) return null

  const rotationCandidate = toFiniteNumber(raw.rotationDeg)
  const elevationCandidate = toFiniteNumber(raw.elevationM)
  const targetSizeM = parseDimensions(raw.targetSizeM ?? raw.sizeM, fallback?.targetSizeM)

  const placement: Placement = {
    assetId,
    id,
    planPositionM,
  }
  if (trackId) placement.trackId = trackId
  if (objectId) placement.objectId = objectId

  if (rotationCandidate !== null) {
    placement.rotationDeg = rotationCandidate
  } else if (typeof fallback?.rotationDeg === 'number') {
    placement.rotationDeg = fallback.rotationDeg
  }

  if (elevationCandidate !== null) {
    placement.elevationM = elevationCandidate
  } else if (typeof fallback?.elevationM === 'number') {
    placement.elevationM = fallback.elevationM
  }

  if (targetSizeM) {
    placement.targetSizeM = targetSizeM
  }

  return placement
}

function parseRoom(raw: unknown, fallback: RoomDefinition): RoomDefinition {
  if (!isRecord(raw)) {
    return {
      depthM: fallback.depthM,
      heightM: fallback.heightM,
      wallThicknessM: fallback.wallThicknessM,
      widthM: fallback.widthM,
    }
  }

  return {
    depthM: normalizePositive(raw.depthM, fallback.depthM),
    heightM: normalizePositive(raw.heightM, fallback.heightM),
    wallThicknessM: normalizePositive(raw.wallThicknessM, fallback.wallThicknessM),
    widthM: normalizePositive(raw.widthM, fallback.widthM),
  }
}

function parseTimestamp(raw: unknown): string {
  return typeof raw === 'string' ? raw : new Date().toISOString()
}

function parseOptionalInt(raw: unknown): number | null {
  const numeric = Number(raw)
  if (!Number.isInteger(numeric)) return null
  return numeric
}

function parseOptionalNumber(raw: unknown): number | null {
  const numeric = Number(raw)
  if (!Number.isFinite(numeric)) return null
  return numeric
}

function parseSpecialistMeta(raw: unknown): SceneSpecialistMeta | null {
  if (!isRecord(raw)) return null
  const source = toStringOrNull(raw.source)
  const generatedAt = toStringOrNull(raw.generatedAt)
  const stalePolicy = toStringOrNull(raw.stalePolicy)
  const spatialFresh = typeof raw.spatialFresh === 'boolean' ? raw.spatialFresh : null
  const spatialAgeS = parseOptionalNumber(raw.spatialAgeS)
  const spatialStaleAfterS = parseOptionalNumber(raw.spatialStaleAfterS)
  if (!source && !generatedAt && !stalePolicy && spatialFresh === null && spatialAgeS === null && spatialStaleAfterS === null) {
    return null
  }
  return {
    generatedAt,
    source,
    spatialAgeS,
    spatialFresh,
    spatialStaleAfterS,
    stalePolicy,
  }
}

function parseMonitoringCamera(raw: unknown): MonitoringCameraDefinition | null {
  if (!isRecord(raw)) return null
  const id = toStringOrNull(raw.id ?? raw.cameraId ?? raw.camera_id)
  if (!id) return null
  const position = parsePlanPosition(raw.planPositionM ?? raw.positionM ?? raw.position, null)
  if (!position) return null

  const heightM = normalizePositive(raw.heightM ?? raw.height ?? raw.mountHeightM, 2.5)
  const yawDeg = toFiniteNumber(raw.yawDeg ?? raw.yaw ?? raw.rotationDegY ?? raw.rotationYDeg) ?? 0
  const pitchDeg = toFiniteNumber(raw.pitchDeg ?? raw.pitch ?? raw.tiltDeg) ?? -35
  const fovDeg = normalizePositive(raw.fovDeg ?? raw.fov ?? raw.verticalFovDeg, 65)
  const aspectRatio = normalizePositive(raw.aspectRatio ?? raw.aspect ?? raw.frameAspect, 16 / 9)
  const overlayDistanceM = normalizePositive(raw.overlayDistanceM ?? raw.projectionDistanceM ?? raw.distanceM, 2.2)
  const label = toStringOrNull(raw.label ?? raw.name) ?? undefined

  return {
    aspectRatio,
    fovDeg,
    heightM,
    id,
    label,
    overlayDistanceM,
    pitchDeg,
    planPositionM: position,
    yawDeg,
  }
}

function parseMonitoringCameras(raw: unknown): MonitoringCameraDefinition[] | null {
  const input = Array.isArray(raw) ? raw : isRecord(raw) ? [raw] : null
  if (!input) return null
  return input
    .map((entry) => parseMonitoringCamera(entry))
    .filter((entry): entry is MonitoringCameraDefinition => entry !== null)
}

function parseAnchorUV(value: unknown): [number, number] | null {
  if (Array.isArray(value) && value.length >= 2) {
    const u = toFiniteNumber(value[0])
    const v = toFiniteNumber(value[1])
    if (u !== null && v !== null) return [clamp01(u), clamp01(v)]
  }
  if (isRecord(value)) {
    const u = toFiniteNumber(value.u ?? value.x)
    const v = toFiniteNumber(value.v ?? value.y)
    if (u !== null && v !== null) return [clamp01(u), clamp01(v)]
  }
  return null
}

function parseDetectionBox(raw: unknown, fallbackId: string): DetectionBox2D | null {
  if (!isRecord(raw)) return null
  const id = toStringOrNull(raw.id) ?? fallbackId
  const x = toFiniteNumber(raw.x ?? raw.left)
  const y = toFiniteNumber(raw.y ?? raw.top)
  const width = toFiniteNumber(raw.width ?? raw.w)
  const height = toFiniteNumber(raw.height ?? raw.h)
  if (x === null || y === null || width === null || height === null) return null

  const trackId = toStringOrNull(raw.trackId ?? raw.track_id) ?? undefined
  const objectId = toStringOrNull(raw.objectId ?? raw.object_id) ?? undefined
  const label = toStringOrNull(raw.label ?? raw.className ?? raw.class) ?? undefined
  const confidence = toFiniteNumber(raw.confidence ?? raw.score) ?? undefined
  const clampedX = clamp01(x)
  const clampedY = clamp01(y)
  const clampedWidth = clamp01(width)
  const clampedHeight = clamp01(height)
  const anchorX = toFiniteNumber(raw.anchorX ?? raw.anchor_x ?? raw.footpointX ?? raw.footpoint_x)
  const anchorY = toFiniteNumber(raw.anchorY ?? raw.anchor_y ?? raw.footpointY ?? raw.footpoint_y)

  const inputAnchor =
    parseAnchorUV(raw.anchorUV ?? raw.anchor_uv ?? raw.footpointUV ?? raw.footpoint_uv ?? raw.anchor ?? raw.footpoint) ??
    (anchorX !== null && anchorY !== null ? [clamp01(anchorX), clamp01(anchorY)] : null)
  const anchorUV: [number, number] = inputAnchor ?? [
    clamp01(clampedX + clampedWidth * 0.5),
    clamp01(clampedY + clampedHeight),
  ]

  const anchorModeCandidate = toStringOrNull(raw.anchorMode ?? raw.anchor_mode)
  const anchorMode = anchorModeCandidate === 'bottom_center' ? 'bottom_center' : undefined

  return {
    anchorMode,
    anchorUV,
    confidence,
    height: clampedHeight,
    id,
    label,
    objectId,
    trackId,
    width: clampedWidth,
    x: clampedX,
    y: clampedY,
  }
}

function parseCameraDetectionOverlay(raw: unknown): CameraDetectionOverlay | null {
  if (!isRecord(raw)) return null
  const cameraId = toStringOrNull(raw.cameraId ?? raw.camera_id ?? raw.id)
  if (!cameraId) return null
  const boxesRaw = Array.isArray(raw.boxes) ? raw.boxes : Array.isArray(raw.detections) ? raw.detections : []
  const boxes = boxesRaw
    .map((entry, index) => parseDetectionBox(entry, `${cameraId}-box-${index + 1}`))
    .filter((entry): entry is DetectionBox2D => entry !== null)
  const timestamp = toStringOrNull(raw.timestamp ?? raw.receivedAt ?? raw.sentAt) ?? undefined
  return {
    boxes,
    cameraId,
    timestamp,
  }
}

function parseCameraDetectionOverlays(raw: unknown): CameraDetectionOverlay[] | null {
  const input = Array.isArray(raw) ? raw : isRecord(raw) ? [raw] : null
  if (!input) return null
  return input
    .map((entry) => parseCameraDetectionOverlay(entry))
    .filter((entry): entry is CameraDetectionOverlay => entry !== null)
}

function parseSceneId(message: Dict, source: Dict): string | null {
  return toStringOrNull(message.sceneId ?? message.scene_id ?? source.sceneId ?? source.scene_id)
}

function parseCharacterTransform(raw: unknown, fallback: AvatarTransform | null): AvatarTransform | null {
  if (!isRecord(raw)) return fallback
  const planPositionM = parsePlanPosition(
    raw.planPositionM ?? raw.positionM ?? raw.position,
    fallback ? [fallback.planPositionM[0], fallback.planPositionM[1]] : [0, 0],
  )
  if (!planPositionM) return fallback

  const rotationDeg = toFiniteNumber(raw.rotationDeg ?? raw.yawDeg ?? raw.yaw) ?? fallback?.rotationDeg ?? 0
  const trackId = toStringOrNull(raw.trackId ?? raw.track_id) ?? fallback?.trackId ?? null
  const objectId = toStringOrNull(raw.objectId ?? raw.object_id) ?? fallback?.objectId ?? null

  return {
    objectId,
    planPositionM,
    rotationDeg,
    trackId,
  }
}

function isCharacterEntity(raw: Dict): boolean {
  const typeCandidate = toStringOrNull(raw.entityType ?? raw.entity_type ?? raw.type ?? raw.kind ?? raw.category)
  if (!typeCandidate) return false
  const normalized = typeCandidate.toLowerCase()
  return normalized === 'character' || normalized === 'avatar' || normalized === 'player' || normalized === 'robot'
}

function placementMatchesToken(placement: Placement, token: string): boolean {
  if (placement.id === token) return true
  if (placement.trackId === token || placement.objectId === token) return true
  if (placement.trackId && `trk:${placement.trackId}` === token) return true
  if (placement.objectId && `obj:${placement.objectId}` === token) return true
  return false
}

function findPlacementIndex(placements: Placement[], rawPlacement: Dict): number {
  const trackId = toStringOrNull(rawPlacement.trackId ?? rawPlacement.track_id)
  if (trackId) {
    const byTrack = placements.findIndex((placement) => placement.trackId === trackId || placement.id === `trk:${trackId}`)
    if (byTrack >= 0) return byTrack
  }

  const objectId = toStringOrNull(rawPlacement.objectId ?? rawPlacement.object_id)
  if (objectId) {
    const byObject = placements.findIndex((placement) => placement.objectId === objectId || placement.id === `obj:${objectId}`)
    if (byObject >= 0) return byObject
  }

  const id = toStringOrNull(rawPlacement.id)
  if (id) {
    return placements.findIndex((placement) => placement.id === id)
  }

  return -1
}

export function clonePlacements(placements: Placement[]): Placement[] {
  return placements.map((placement) => {
    const cloned: Placement = {
      assetId: placement.assetId,
      id: placement.id,
      planPositionM: [placement.planPositionM[0], placement.planPositionM[1]],
    }
    if (typeof placement.trackId === 'string') cloned.trackId = placement.trackId
    if (typeof placement.objectId === 'string') cloned.objectId = placement.objectId
    if (typeof placement.rotationDeg === 'number') cloned.rotationDeg = placement.rotationDeg
    if (typeof placement.elevationM === 'number') cloned.elevationM = placement.elevationM
    if (placement.targetSizeM) cloned.targetSizeM = cloneDimensions(placement.targetSizeM)
    return cloned
  })
}

export function getPlacementTargetSizeM(placement: Placement): Dimensions3D {
  return placement.targetSizeM ? cloneDimensions(placement.targetSizeM) : cloneDimensions(ASSET_CATALOG[placement.assetId].targetSizeM)
}

export function parseSceneSnapshotFromBridge(
  message: unknown,
  fallback: SceneSnapshot,
  fallbackAvatar: AvatarTransform | null = null,
): ParsedBridgeScene | null {
  if (!isRecord(message)) return null
  const source = isRecord(message.scene) ? message.scene : message
  if (!isRecord(source)) return null

  const sceneMeta = isRecord(source.metadata) ? source.metadata : null
  const specialistMeta = parseSpecialistMeta(sceneMeta?.specialist)
  const room = parseRoom(sceneMeta?.room ?? source.room, fallback.room)
  const monitoringCameras = parseMonitoringCameras(
    sceneMeta?.monitoringCameras ?? sceneMeta?.cameras ?? source.monitoringCameras ?? source.cameras,
  )
  const cameraDetectionOverlays = parseCameraDetectionOverlays(
    sceneMeta?.cameraDetections ?? sceneMeta?.detectionOverlays ?? source.cameraDetections ?? source.detectionOverlays,
  )
  const sceneId = parseSceneId(message, source)

  let placements = clonePlacements(fallback.placements)
  let avatar = fallbackAvatar
  let consumedEntities = false

  if (Array.isArray(source.entities)) {
    consumedEntities = true
    placements = []
    avatar = fallbackAvatar

    for (const rawEntity of source.entities) {
      if (!isRecord(rawEntity)) continue
      if (isCharacterEntity(rawEntity)) {
        avatar = parseCharacterTransform(rawEntity, avatar)
        continue
      }
      const placement = parsePlacement(rawEntity, null)
      if (placement) placements.push(placement)
    }
  }

  if (!consumedEntities && Array.isArray(source.placements)) {
    placements = source.placements
      .map((entry) => parsePlacement(entry, null))
      .filter((entry): entry is Placement => entry !== null)
  }

  return {
    avatar,
    cameraDetectionOverlays,
    monitoringCameras,
    placements,
    receivedAt: parseTimestamp(message.receivedAt ?? message.timestamp),
    revision: parseOptionalInt(message.revision),
    sceneId,
    specialistMeta,
    room,
    sequence: parseOptionalInt(message.sequence),
  }
}

export function applyScenePatchFromBridge(
  message: unknown,
  base: SceneSnapshot,
  baseAvatar: AvatarTransform | null = null,
): ParsedBridgeScene | null {
  if (!isRecord(message)) return null
  const rawPatch = isRecord(message.patch) ? message.patch : message
  if (!isRecord(rawPatch)) return null

  const patchMeta = isRecord(rawPatch.metadata) ? rawPatch.metadata : null
  const specialistMeta = parseSpecialistMeta(patchMeta?.specialist)
  const room = parseRoom(patchMeta?.room ?? rawPatch.room, base.room)
  const monitoringCameras = parseMonitoringCameras(
    patchMeta?.monitoringCameras ?? patchMeta?.cameras ?? rawPatch.monitoringCameras ?? rawPatch.cameras,
  )
  const cameraDetectionOverlays = parseCameraDetectionOverlays(
    patchMeta?.cameraDetections ?? patchMeta?.detectionOverlays ?? rawPatch.cameraDetections ?? rawPatch.detectionOverlays,
  )
  const sceneId = parseSceneId(message, rawPatch)
  let placements = clonePlacements(base.placements)
  let avatar = baseAvatar

  if (Array.isArray(rawPatch.removes) && rawPatch.removes.length > 0) {
    const removeTokens = rawPatch.removes
      .flatMap((value) => {
        if (typeof value === 'string') return [value]
        if (isRecord(value)) {
          return [
            toStringOrNull(value.trackId ?? value.track_id),
            toStringOrNull(value.objectId ?? value.object_id),
            toStringOrNull(value.id),
          ].filter((item): item is string => Boolean(item))
        }
        return []
      })
      .filter((value, index, list) => list.indexOf(value) === index)

    if (removeTokens.length > 0) {
      placements = placements.filter((placement) => !removeTokens.some((token) => placementMatchesToken(placement, token)))
      const currentAvatar = avatar
      if (currentAvatar && removeTokens.some((token) => token === currentAvatar.trackId || token === currentAvatar.objectId)) {
        avatar = null
      }
    }
  }

  const upserts =
    Array.isArray(rawPatch.upserts) ? rawPatch.upserts : Array.isArray(rawPatch.entities) ? rawPatch.entities : ([] as unknown[])

  for (const rawEntity of upserts) {
    if (!isRecord(rawEntity)) continue
    if (isCharacterEntity(rawEntity)) {
      avatar = parseCharacterTransform(rawEntity, avatar)
      continue
    }

    const existingIndex = findPlacementIndex(placements, rawEntity)
    const fallbackPlacement = existingIndex >= 0 ? placements[existingIndex] : null
    const nextPlacement = parsePlacement(rawEntity, fallbackPlacement)
    if (!nextPlacement) continue
    if (existingIndex >= 0) {
      placements[existingIndex] = nextPlacement
    } else {
      placements.push(nextPlacement)
    }
  }

  return {
    avatar,
    cameraDetectionOverlays,
    monitoringCameras,
    placements,
    receivedAt: parseTimestamp(message.receivedAt ?? message.timestamp),
    revision: parseOptionalInt(message.revision),
    sceneId,
    specialistMeta,
    room,
    sequence: parseOptionalInt(message.sequence),
  }
}
