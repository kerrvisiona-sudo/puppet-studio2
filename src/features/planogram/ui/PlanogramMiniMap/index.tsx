import { useRef } from 'react'
import { usePlanogramCanvasData } from '../../hooks/split/usePlanogramCanvasData'
import { usePlanogramMiniMapCanvas } from '../../hooks/usePlanogramMiniMapCanvas'
import { PlanogramHeader } from './PlanogramHeader'
import { PlanogramStats } from './PlanogramStats'
import { PlanogramPlacementTools } from './PlanogramPlacementTools'
import { PlanogramLegend } from './PlanogramLegend'
import { PlanogramCameraSelector } from './PlanogramCameraSelector'
import { PlanogramInfo } from './PlanogramInfo'
import { pointInPolygon } from '../../model'

export function PlanogramMiniMap() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const gridCanvasRef = useRef<HTMLCanvasElement | null>(null)

  const {
    avatar,
    constraints,
    scenePlacements,
    sceneRoom,
    selectedPlacementAssetId,
    selectedPlacementId,
    showDimensions,
    topQuarterTurns,
    placementHitPolygons,
    dispatchFromPlanogram,
  } = usePlanogramCanvasData()

  usePlanogramMiniMapCanvas(canvasRef, gridCanvasRef, {
    avatar,
    constraints,
    scenePlacements,
    sceneRoom,
    selectedPlacementAssetId,
    selectedPlacementId,
    showDimensions,
    topQuarterTurns,
  })

  return (
    <div className="mini-map">
      <PlanogramHeader />

      <canvas
        ref={canvasRef}
        onPointerDown={(event) => {
          const rect = event.currentTarget.getBoundingClientRect()
          const pointX = event.clientX - rect.left
          const pointY = event.clientY - rect.top
          for (let index = placementHitPolygons.length - 1; index >= 0; index -= 1) {
            if (pointInPolygon(pointX, pointY, placementHitPolygons[index].points)) {
              dispatchFromPlanogram({
                kind: 'set_selected_placement',
                placementId: placementHitPolygons[index].placementId,
              })
              return
            }
          }
          dispatchFromPlanogram({ kind: 'set_selected_placement', placementId: null })
        }}
      />

      <PlanogramStats />
      <PlanogramInfo />
      <PlanogramCameraSelector />
      <PlanogramPlacementTools />

      <p className="mini-grid-title">Grid Ref (solo ejes + metros)</p>
      <canvas ref={gridCanvasRef} className="mini-grid-canvas" />
      <PlanogramLegend />
    </div>
  )
}
