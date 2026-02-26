import {
  ASSET_CATALOG,
  GRID_MAJOR_STEP_M,
  GRID_MINOR_STEP_M,
  getPlacementTargetSizeM,
  TARGET_AVATAR_FOOTPRINT_DEPTH_M,
  TARGET_AVATAR_FOOTPRINT_WIDTH_M,
} from '../../../core/planogram-domain'
import type { Placement, RoomDefinition } from '../../../core/planogram-domain'
import {
  createPlanTransform,
  getPlacementFootprintCorners,
  orientedRectCorners,
  type PlanTransform2D,
  type QuarterTurns,
  type SceneConstraintZone,
} from '../../../core/scene-domain'

export const PLANOGRAM_MAP_WIDTH = 280
export const PLANOGRAM_MAP_HEIGHT = 220
export const PLANOGRAM_MAP_PADDING = 18
export const PLANOGRAM_GRID_REF_WIDTH = 280
export const PLANOGRAM_GRID_REF_HEIGHT = 145
export const PLANOGRAM_GRID_REF_PADDING = 16
export const PLANOGRAM_DPR = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1

type PlacementProjection = {
  asset: (typeof ASSET_CATALOG)[keyof typeof ASSET_CATALOG]
  placement: Placement
  points: Array<[number, number]>
  sizeM: ReturnType<typeof getPlacementTargetSizeM>
}

type ConstraintProjection = {
  appliesToSelectedAsset: boolean
  points: Array<[number, number]>
}

export type PlacementHitPolygon = {
  placementId: string
  points: Array<[number, number]>
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

function normalizeVector(dx: number, dy: number, length: number): [number, number] {
  const magnitude = Math.hypot(dx, dy) || 1
  return [(dx / magnitude) * length, (dy / magnitude) * length]
}

function midpoint(a: [number, number], b: [number, number]): [number, number] {
  return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]
}

function polygonPath(ctx: CanvasRenderingContext2D, points: Array<[number, number]>) {
  if (!points.length) return
  ctx.beginPath()
  ctx.moveTo(points[0][0], points[0][1])
  for (let index = 1; index < points.length; index += 1) {
    ctx.lineTo(points[index][0], points[index][1])
  }
  ctx.closePath()
}

function projectPlacement(placement: Placement, toCanvas: PlanTransform2D['toCanvas']): PlacementProjection {
  const asset = ASSET_CATALOG[placement.assetId]
  const sizeM = getPlacementTargetSizeM(placement)
  const points = getPlacementFootprintCorners(placement).map(([x, z]) => toCanvas(x, z))
  return { asset, placement, points, sizeM }
}

function zoneAppliesToAsset(zone: SceneConstraintZone, selectedAssetId: string | null): boolean {
  if (!zone.assetIds || zone.assetIds.length === 0) return true
  if (!selectedAssetId) return false
  return zone.assetIds.includes(selectedAssetId)
}

function projectConstraintZone(
  zone: SceneConstraintZone,
  toCanvas: PlanTransform2D['toCanvas'],
  selectedAssetId: string | null,
): ConstraintProjection {
  const minX = Math.min(zone.minX, zone.maxX)
  const maxX = Math.max(zone.minX, zone.maxX)
  const minZ = Math.min(zone.minZ, zone.maxZ)
  const maxZ = Math.max(zone.minZ, zone.maxZ)
  return {
    appliesToSelectedAsset: zoneAppliesToAsset(zone, selectedAssetId),
    points: [toCanvas(minX, minZ), toCanvas(maxX, minZ), toCanvas(maxX, maxZ), toCanvas(minX, maxZ)],
  }
}

function drawPlanGrid(
  ctx: CanvasRenderingContext2D,
  room: RoomDefinition,
  transform: PlanTransform2D,
  colors: { major: string; minor: string },
) {
  ctx.save()
  polygonPath(ctx, transform.roomCorners)
  ctx.clip()

  ctx.strokeStyle = colors.minor
  ctx.lineWidth = 1
  for (let x = Math.ceil((-room.widthM / 2) / GRID_MINOR_STEP_M) * GRID_MINOR_STEP_M; x <= room.widthM / 2; x += GRID_MINOR_STEP_M) {
    const [gx0, gy0] = transform.toCanvas(x, -room.depthM / 2)
    const [gx1, gy1] = transform.toCanvas(x, room.depthM / 2)
    ctx.beginPath()
    ctx.moveTo(gx0, gy0)
    ctx.lineTo(gx1, gy1)
    ctx.stroke()
  }
  for (let z = Math.ceil((-room.depthM / 2) / GRID_MINOR_STEP_M) * GRID_MINOR_STEP_M; z <= room.depthM / 2; z += GRID_MINOR_STEP_M) {
    const [gx0, gy0] = transform.toCanvas(-room.widthM / 2, z)
    const [gx1, gy1] = transform.toCanvas(room.widthM / 2, z)
    ctx.beginPath()
    ctx.moveTo(gx0, gy0)
    ctx.lineTo(gx1, gy1)
    ctx.stroke()
  }

  ctx.strokeStyle = colors.major
  ctx.lineWidth = 1.6
  for (let x = Math.ceil((-room.widthM / 2) / GRID_MAJOR_STEP_M) * GRID_MAJOR_STEP_M; x <= room.widthM / 2; x += GRID_MAJOR_STEP_M) {
    const [gx0, gy0] = transform.toCanvas(x, -room.depthM / 2)
    const [gx1, gy1] = transform.toCanvas(x, room.depthM / 2)
    ctx.beginPath()
    ctx.moveTo(gx0, gy0)
    ctx.lineTo(gx1, gy1)
    ctx.stroke()
  }
  for (let z = Math.ceil((-room.depthM / 2) / GRID_MAJOR_STEP_M) * GRID_MAJOR_STEP_M; z <= room.depthM / 2; z += GRID_MAJOR_STEP_M) {
    const [gx0, gy0] = transform.toCanvas(-room.widthM / 2, z)
    const [gx1, gy1] = transform.toCanvas(room.widthM / 2, z)
    ctx.beginPath()
    ctx.moveTo(gx0, gy0)
    ctx.lineTo(gx1, gy1)
    ctx.stroke()
  }

  ctx.restore()
}

function drawSelectedDimensions(ctx: CanvasRenderingContext2D, projection: PlacementProjection) {
  const [p0, p1, p2] = projection.points
  const widthMid = midpoint(p0, p1)
  const depthMid = midpoint(p1, p2)

  ctx.strokeStyle = '#243f73'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(p0[0], p0[1])
  ctx.lineTo(p1[0], p1[1])
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(p1[0], p1[1])
  ctx.lineTo(p2[0], p2[1])
  ctx.stroke()

  ctx.fillStyle = '#203151'
  ctx.font = '10px Segoe UI, sans-serif'
  ctx.fillText(`${projection.sizeM.width.toFixed(2)}m`, widthMid[0] + 4, widthMid[1] - 4)
  ctx.fillText(`${projection.sizeM.depth.toFixed(2)}m`, depthMid[0] + 4, depthMid[1] - 4)
}

function drawConstraintZones(
  ctx: CanvasRenderingContext2D,
  transform: PlanTransform2D,
  zones: ConstraintProjection[],
) {
  if (zones.length === 0) return
  ctx.save()
  polygonPath(ctx, transform.roomCorners)
  ctx.clip()

  for (const zone of zones) {
    ctx.fillStyle = zone.appliesToSelectedAsset ? 'rgba(157, 23, 77, 0.14)' : 'rgba(71, 85, 105, 0.08)'
    ctx.strokeStyle = zone.appliesToSelectedAsset ? 'rgba(136, 19, 55, 0.82)' : 'rgba(71, 85, 105, 0.4)'
    ctx.lineWidth = zone.appliesToSelectedAsset ? 1.8 : 1
    polygonPath(ctx, zone.points)
    ctx.fill()
    polygonPath(ctx, zone.points)
    ctx.stroke()
  }

  ctx.restore()
}

export function drawPlanogramMiniMap(
  canvas: HTMLCanvasElement,
  room: RoomDefinition,
  placements: Placement[],
  constraints: SceneConstraintZone[],
  selectedAssetId: string | null,
  selectedPlacementId: string | null,
  showDimensions: boolean,
  topQuarterTurns: QuarterTurns,
  avatar: { planPositionM: [number, number]; rotationDeg: number; trackId: string | null },
) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const transform = createPlanTransform(room, PLANOGRAM_MAP_WIDTH, PLANOGRAM_MAP_HEIGHT, PLANOGRAM_MAP_PADDING, topQuarterTurns)
  const projections = placements.map((placement) => projectPlacement(placement, transform.toCanvas))
  const constraintProjections = constraints.map((zone) => projectConstraintZone(zone, transform.toCanvas, selectedAssetId))

  ctx.clearRect(0, 0, PLANOGRAM_MAP_WIDTH, PLANOGRAM_MAP_HEIGHT)
  ctx.fillStyle = '#f7f8fb'
  ctx.fillRect(0, 0, PLANOGRAM_MAP_WIDTH, PLANOGRAM_MAP_HEIGHT)

  ctx.fillStyle = '#edf1f7'
  polygonPath(ctx, transform.roomCorners)
  ctx.fill()
  ctx.strokeStyle = '#b9c2d1'
  ctx.lineWidth = 1
  polygonPath(ctx, transform.roomCorners)
  ctx.stroke()

  drawPlanGrid(ctx, room, transform, { major: '#b4bece', minor: '#d4dce8' })
  drawConstraintZones(ctx, transform, constraintProjections)

  for (const projection of projections) {
    const isSelected = projection.placement.id === selectedPlacementId
    ctx.fillStyle = projection.asset.miniMapColor
    polygonPath(ctx, projection.points)
    ctx.fill()

    ctx.strokeStyle = isSelected ? '#1c345f' : '#2f3c50'
    ctx.lineWidth = isSelected ? 2.2 : 1
    polygonPath(ctx, projection.points)
    ctx.stroke()

    if (showDimensions) {
      const center = transform.toCanvas(projection.placement.planPositionM[0], projection.placement.planPositionM[1])
      const text = `${projection.sizeM.width.toFixed(2)}x${projection.sizeM.depth.toFixed(2)}m`
      ctx.font = '10px Segoe UI, sans-serif'
      const width = ctx.measureText(text).width
      const x = center[0] - width / 2
      const y = center[1] - 7
      ctx.fillStyle = 'rgba(255, 255, 255, 0.78)'
      ctx.fillRect(x - 3, y - 9, width + 6, 12)
      ctx.fillStyle = '#243247'
      ctx.fillText(text, x, y)
    }
  }

  if (showDimensions) {
    const selected = projections.find((projection) => projection.placement.id === selectedPlacementId)
    if (selected) drawSelectedDimensions(ctx, selected)
  }

  const [ox, oy] = transform.toCanvas(0, 0)
  const [ux, uy] = transform.toCanvas(1, 0)
  const [vx, vy] = transform.toCanvas(0, 1)
  const [xdx, xdy] = normalizeVector(ux - ox, uy - oy, 22)
  const [zdx, zdy] = normalizeVector(vx - ox, vy - oy, 22)

  ctx.strokeStyle = '#e45f5f'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(ox, oy)
  ctx.lineTo(ox + xdx, oy + xdy)
  ctx.stroke()
  ctx.fillStyle = '#e45f5f'
  ctx.fillText('X+', ox + xdx + 4, oy + xdy + 4)

  ctx.strokeStyle = '#5682d9'
  ctx.beginPath()
  ctx.moveTo(ox, oy)
  ctx.lineTo(ox + zdx, oy + zdy)
  ctx.stroke()
  ctx.fillStyle = '#5682d9'
  ctx.fillText('Z+', ox + zdx + 4, oy + zdy + 4)

  const avatarHalfWidth = TARGET_AVATAR_FOOTPRINT_WIDTH_M / 2
  const avatarHalfDepth = TARGET_AVATAR_FOOTPRINT_DEPTH_M / 2
  const avatarRotation = (avatar.rotationDeg * Math.PI) / 180
  const avatarPoints = orientedRectCorners(
    [avatar.planPositionM[0], avatar.planPositionM[1]],
    avatarHalfWidth,
    avatarHalfDepth,
    avatar.rotationDeg,
  ).map(([x, z]) => transform.toCanvas(x, z))
  ctx.fillStyle = 'rgba(32, 45, 64, 0.16)'
  ctx.strokeStyle = '#1f2937'
  ctx.lineWidth = 1
  polygonPath(ctx, avatarPoints)
  ctx.fill()
  polygonPath(ctx, avatarPoints)
  ctx.stroke()

  const [ax, ay] = transform.toCanvas(avatar.planPositionM[0], avatar.planPositionM[1])
  const [fx, fy] = transform.toCanvas(
    avatar.planPositionM[0] + 0.26 * Math.cos(avatarRotation),
    avatar.planPositionM[1] + 0.26 * Math.sin(avatarRotation),
  )
  ctx.strokeStyle = '#1f2937'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(ax, ay)
  ctx.lineTo(fx, fy)
  ctx.stroke()

  ctx.fillStyle = '#111827'
  ctx.beginPath()
  ctx.arc(ox, oy, 4, 0, Math.PI * 2)
  ctx.fill()
  ctx.font = '11px Segoe UI, sans-serif'
  ctx.fillText('Avatar feet (0,0)', ox + 8, oy - 8)
  ctx.fillText(`Avatar ${avatar.trackId ?? ''}`.trim(), ax + 8, ay + 12)

  const scaleBarPx = transform.scale
  const barX = transform.roomBounds.minX + 10
  const barY = transform.roomBounds.maxY - 12
  ctx.strokeStyle = '#293244'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(barX, barY)
  ctx.lineTo(barX + scaleBarPx, barY)
  ctx.stroke()
  ctx.fillStyle = '#293244'
  ctx.fillText('1m', barX + scaleBarPx + 6, barY + 4)
}

export function drawPlanogramGridReference(canvas: HTMLCanvasElement, room: RoomDefinition, topQuarterTurns: QuarterTurns) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const transform = createPlanTransform(
    room,
    PLANOGRAM_GRID_REF_WIDTH,
    PLANOGRAM_GRID_REF_HEIGHT,
    PLANOGRAM_GRID_REF_PADDING,
    topQuarterTurns,
  )

  ctx.clearRect(0, 0, PLANOGRAM_GRID_REF_WIDTH, PLANOGRAM_GRID_REF_HEIGHT)
  ctx.fillStyle = '#f7f9fc'
  ctx.fillRect(0, 0, PLANOGRAM_GRID_REF_WIDTH, PLANOGRAM_GRID_REF_HEIGHT)

  ctx.fillStyle = '#eff3f8'
  polygonPath(ctx, transform.roomCorners)
  ctx.fill()
  ctx.strokeStyle = '#b9c4d4'
  ctx.lineWidth = 1
  polygonPath(ctx, transform.roomCorners)
  ctx.stroke()

  drawPlanGrid(ctx, room, transform, { major: '#9facc0', minor: '#d5ddea' })

  const [ox, oy] = transform.toCanvas(0, 0)
  const [ux, uy] = transform.toCanvas(1, 0)
  const [vx, vy] = transform.toCanvas(0, 1)
  const [xdx, xdy] = normalizeVector(ux - ox, uy - oy, 20)
  const [zdx, zdy] = normalizeVector(vx - ox, vy - oy, 20)

  ctx.strokeStyle = '#cf5454'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(ox, oy)
  ctx.lineTo(ox + xdx, oy + xdy)
  ctx.stroke()
  ctx.fillStyle = '#cf5454'
  ctx.fillText('X+', ox + xdx + 4, oy + xdy + 4)

  ctx.strokeStyle = '#4f78cb'
  ctx.beginPath()
  ctx.moveTo(ox, oy)
  ctx.lineTo(ox + zdx, oy + zdy)
  ctx.stroke()
  ctx.fillStyle = '#4f78cb'
  ctx.fillText('Z+', ox + zdx + 4, oy + zdy + 4)

  ctx.fillStyle = '#253149'
  ctx.beginPath()
  ctx.arc(ox, oy, 3, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillText('(0,0)', ox + 6, oy - 6)

  ctx.font = '10px Segoe UI, sans-serif'
  for (let x = Math.ceil(-room.widthM / 2); x <= Math.floor(room.widthM / 2); x += 1) {
    if (x === 0) continue
    const [px, py] = transform.toCanvas(x, 0)
    ctx.fillStyle = '#a94444'
    ctx.beginPath()
    ctx.arc(px, py, 1.2, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#9c3e3e'
    ctx.fillText(`${x}`, clamp(px + 2, 2, PLANOGRAM_GRID_REF_WIDTH - 12), clamp(py + 10, 10, PLANOGRAM_GRID_REF_HEIGHT - 2))
  }

  for (let z = Math.ceil(-room.depthM / 2); z <= Math.floor(room.depthM / 2); z += 1) {
    if (z === 0) continue
    const [px, py] = transform.toCanvas(0, z)
    ctx.fillStyle = '#3b5da0'
    ctx.beginPath()
    ctx.arc(px, py, 1.2, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#3b5da0'
    ctx.fillText(`${z}`, clamp(px - 11, 2, PLANOGRAM_GRID_REF_WIDTH - 12), clamp(py - 2, 10, PLANOGRAM_GRID_REF_HEIGHT - 2))
  }
}

export function buildPlanogramPlacementHitPolygons(
  placements: Placement[],
  room: RoomDefinition,
  topQuarterTurns: QuarterTurns,
): PlacementHitPolygon[] {
  const transform = createPlanTransform(room, PLANOGRAM_MAP_WIDTH, PLANOGRAM_MAP_HEIGHT, PLANOGRAM_MAP_PADDING, topQuarterTurns)
  return placements.map((placement) => ({
    placementId: placement.id,
    points: getPlacementFootprintCorners(placement).map(([x, z]) => transform.toCanvas(x, z)),
  }))
}

export function pointInPolygon(pointX: number, pointY: number, points: Array<[number, number]>) {
  let inside = false
  for (let i = 0, j = points.length - 1; i < points.length; j = i, i += 1) {
    const xi = points[i][0]
    const yi = points[i][1]
    const xj = points[j][0]
    const yj = points[j][1]

    const intersects = yi > pointY !== yj > pointY && pointX < ((xj - xi) * (pointY - yi)) / (yj - yi + 1e-9) + xi
    if (intersects) inside = !inside
  }
  return inside
}

export function formatSceneSource(source: 'default' | 'scene' | 'local_edit') {
  if (source === 'scene') return 'Scene WS (canonico)'
  if (source === 'local_edit') return 'Edicion local'
  return 'Default local'
}

export function computePlanogramMiniMapScale(room: RoomDefinition, topQuarterTurns: QuarterTurns) {
  return createPlanTransform(room, PLANOGRAM_MAP_WIDTH, PLANOGRAM_MAP_HEIGHT, PLANOGRAM_MAP_PADDING, topQuarterTurns).scale
}
