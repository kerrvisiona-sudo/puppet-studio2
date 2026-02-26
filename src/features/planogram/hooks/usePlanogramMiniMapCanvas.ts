import { useEffect } from 'react'
import type { RefObject } from 'react'

import type { Placement, RoomDefinition } from '../../../core/planogram-domain'
import type { QuarterTurns, SceneConstraintZone } from '../../../core/scene-domain'
import {
  drawPlanogramGridReference,
  drawPlanogramMiniMap,
  PLANOGRAM_DPR,
  PLANOGRAM_GRID_REF_HEIGHT,
  PLANOGRAM_GRID_REF_WIDTH,
  PLANOGRAM_MAP_HEIGHT,
  PLANOGRAM_MAP_WIDTH,
} from '../model'

type MiniMapAvatar = {
  planPositionM: [number, number]
  rotationDeg: number
  trackId: string | null
}

type UsePlanogramMiniMapCanvasArgs = {
  avatar: MiniMapAvatar
  constraints: SceneConstraintZone[]
  scenePlacements: Placement[]
  sceneRoom: RoomDefinition
  selectedPlacementAssetId: string | null
  selectedPlacementId: string | null
  showDimensions: boolean
  topQuarterTurns: QuarterTurns
}

export function usePlanogramMiniMapCanvas(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  gridCanvasRef: RefObject<HTMLCanvasElement | null>,
  args: UsePlanogramMiniMapCanvasArgs,
) {
  const {
    avatar,
    constraints,
    scenePlacements,
    sceneRoom,
    selectedPlacementAssetId,
    selectedPlacementId,
    showDimensions,
    topQuarterTurns,
  } = args

  useEffect(() => {
    const canvas = canvasRef.current
    const gridCanvas = gridCanvasRef.current
    if (!canvas || !gridCanvas) return

    canvas.width = Math.floor(PLANOGRAM_MAP_WIDTH * PLANOGRAM_DPR)
    canvas.height = Math.floor(PLANOGRAM_MAP_HEIGHT * PLANOGRAM_DPR)
    canvas.style.width = `${PLANOGRAM_MAP_WIDTH}px`
    canvas.style.height = `${PLANOGRAM_MAP_HEIGHT}px`
    gridCanvas.width = Math.floor(PLANOGRAM_GRID_REF_WIDTH * PLANOGRAM_DPR)
    gridCanvas.height = Math.floor(PLANOGRAM_GRID_REF_HEIGHT * PLANOGRAM_DPR)
    gridCanvas.style.width = `${PLANOGRAM_GRID_REF_WIDTH}px`
    gridCanvas.style.height = `${PLANOGRAM_GRID_REF_HEIGHT}px`

    const ctx = canvas.getContext('2d')
    const gridCtx = gridCanvas.getContext('2d')
    if (!ctx || !gridCtx) return
    ctx.setTransform(PLANOGRAM_DPR, 0, 0, PLANOGRAM_DPR, 0, 0)
    ctx.font = '12px Segoe UI, sans-serif'
    gridCtx.setTransform(PLANOGRAM_DPR, 0, 0, PLANOGRAM_DPR, 0, 0)
    gridCtx.font = '11px Segoe UI, sans-serif'

    drawPlanogramMiniMap(
      canvas,
      sceneRoom,
      scenePlacements,
      constraints,
      selectedPlacementAssetId,
      selectedPlacementId,
      showDimensions,
      topQuarterTurns,
      avatar,
    )
    drawPlanogramGridReference(gridCanvas, sceneRoom, topQuarterTurns)
  }, [
    avatar,
    canvasRef,
    constraints,
    gridCanvasRef,
    scenePlacements,
    sceneRoom,
    selectedPlacementAssetId,
    selectedPlacementId,
    showDimensions,
    topQuarterTurns,
  ])
}
