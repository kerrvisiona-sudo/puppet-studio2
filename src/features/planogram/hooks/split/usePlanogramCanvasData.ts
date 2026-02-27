import { useMemo } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useAvatarStore, useSceneStore, useViewportStore } from '../../../../app/state'
import { runtimeConfig } from '../../../../core/config'
import {
  GRID_MAJOR_STEP_M,
  GRID_MINOR_STEP_M,
  TOP_VIEW_TARGET_PX_PER_M,
} from '../../../../core/planogram-domain'
import {
  buildPlanogramPlacementHitPolygons,
  computePlanogramMiniMapScale,
} from '../../model'
import { createAppCommandDispatcher } from '../../../../shared/ui'

export function usePlanogramCanvasData() {
  const { avatarPlanPositionM, avatarRotationDeg, avatarTrackId } = useAvatarStore(
    useShallow((s) => ({
      avatarPlanPositionM: s.avatarPlanPositionM,
      avatarRotationDeg: s.avatarRotationDeg,
      avatarTrackId: s.avatarTrackId,
    }))
  )

  const { scenePlacements, sceneRoom, selectedPlacementId } = useSceneStore(
    useShallow((s) => ({
      scenePlacements: s.scenePlacements,
      sceneRoom: s.sceneRoom,
      selectedPlacementId: s.selectedPlacementId,
    }))
  )

  const { topQuarterTurns, showDimensions } = useViewportStore(
    useShallow((s) => ({
      topQuarterTurns: s.topQuarterTurns,
      showDimensions: s.showDimensions,
    }))
  )

  const selectedPlacementAssetId = useMemo(() => {
    const placement = scenePlacements.find((p) => p.id === selectedPlacementId)
    return placement?.assetId ?? null
  }, [scenePlacements, selectedPlacementId])

  const avatar = useMemo(
    () => ({
      planPositionM: avatarPlanPositionM,
      rotationDeg: avatarRotationDeg,
      trackId: avatarTrackId,
    }),
    [avatarPlanPositionM, avatarRotationDeg, avatarTrackId]
  )

  const miniMapScale = useMemo(
    () => computePlanogramMiniMapScale(sceneRoom, topQuarterTurns),
    [sceneRoom, topQuarterTurns]
  )

  const placementHitPolygons = useMemo(
    () => buildPlanogramPlacementHitPolygons(scenePlacements, sceneRoom, topQuarterTurns),
    [scenePlacements, sceneRoom, topQuarterTurns]
  )

  const dispatchFromPlanogram = createAppCommandDispatcher('ui.planogram')

  return {
    avatar,
    constraints: runtimeConfig.sceneConstraintZones,
    scenePlacements,
    sceneRoom,
    selectedPlacementAssetId,
    selectedPlacementId,
    showDimensions,
    topQuarterTurns,
    miniMapScale,
    placementHitPolygons,
    dispatchFromPlanogram,
    gridInfo: {
      gridMinorStepM: GRID_MINOR_STEP_M,
      gridMajorStepM: GRID_MAJOR_STEP_M,
      topViewTargetPxPerM: TOP_VIEW_TARGET_PX_PER_M,
      constraintZonesCount: runtimeConfig.sceneConstraintZones.length,
    },
    deferredConfig: {
      mode: runtimeConfig.sceneDeferredApplyMode,
      queueLimit: runtimeConfig.sceneDeferredQueueLimit,
      autoApplyOnRelease: runtimeConfig.sceneDeferredAutoApplyOnRelease,
      requireConfirmOnRelease: runtimeConfig.sceneDeferredRequireConfirmOnRelease,
    },
  }
}
