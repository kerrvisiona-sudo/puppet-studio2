import { useMemo } from 'react'
import { useShallow } from 'zustand/react/shallow'

import { useAvatarStore, useBridgeStore, useSceneStore, useViewportStore } from '../../../app/state'
import {
  selectMonitoringCamera,
  selectPlacementLegendItems,
  selectSelectedPlacementView,
} from '../../../core/scene-domain'
import { createPoseStoreCommandDispatcher } from '../../../shared/ui'
import {
  buildPlanogramPlacementHitPolygons,
  computePlanogramMiniMapScale,
} from '../model'

export function usePlanogramMiniMapState() {
  // Group 1: Viewport state (5 props)
  const {
    cameraView,
    projectionMode,
    selectedMonitoringCameraId,
    showDimensions,
    topQuarterTurns,
  } = useViewportStore(
    useShallow((s) => ({
      cameraView: s.cameraView,
      projectionMode: s.projectionMode,
      selectedMonitoringCameraId: s.selectedMonitoringCameraId,
      showDimensions: s.showDimensions,
      topQuarterTurns: s.topQuarterTurns,
    }))
  )

  // Group 2: Avatar state (3 props)
  const {
    avatarPlanPositionM,
    avatarRotationDeg,
    avatarTrackId,
  } = useAvatarStore(
    useShallow((s) => ({
      avatarPlanPositionM: s.avatarPlanPositionM,
      avatarRotationDeg: s.avatarRotationDeg,
      avatarTrackId: s.avatarTrackId,
    }))
  )

  // Group 3: Scene state (14 props)
  const {
    sceneError,
    sceneLastEventAt,
    scenePlacements,
    sceneRevision,
    sceneRoom,
    sceneSequence,
    sceneSource,
    sceneEditEnabled,
    selectedPlacementId,
    sceneRedoDepth,
    sceneUndoDepth,
    monitoringCameras,
    sceneRemoteOverrideAt,
    sceneRemoteOverrideKind,
  } = useSceneStore(
    useShallow((s) => ({
      sceneError: s.sceneError,
      sceneLastEventAt: s.sceneLastEventAt,
      scenePlacements: s.scenePlacements,
      sceneRevision: s.sceneRevision,
      sceneRoom: s.sceneRoom,
      sceneSequence: s.sceneSequence,
      sceneSource: s.sceneSource,
      sceneEditEnabled: s.sceneEditEnabled,
      selectedPlacementId: s.selectedPlacementId,
      sceneRedoDepth: s.sceneRedoDepth,
      sceneUndoDepth: s.sceneUndoDepth,
      monitoringCameras: s.monitoringCameras,
      sceneRemoteOverrideAt: s.sceneRemoteOverrideAt,
      sceneRemoteOverrideKind: s.sceneRemoteOverrideKind,
    }))
  )

  // Group 4: Bridge state (5 props)
  const {
    sceneRemoteHoldEnabled,
    sceneDeferredRemoteCount,
    sceneDeferredApplyPendingConfirm,
    sceneDeferredRemoteLastAt,
    sceneDeferredRemoteLastKind,
  } = useBridgeStore(
    useShallow((s) => ({
      sceneRemoteHoldEnabled: s.sceneRemoteHoldEnabled,
      sceneDeferredRemoteCount: s.sceneDeferredRemoteCount,
      sceneDeferredApplyPendingConfirm: s.sceneDeferredApplyPendingConfirm,
      sceneDeferredRemoteLastAt: s.sceneDeferredRemoteLastAt,
      sceneDeferredRemoteLastKind: s.sceneDeferredRemoteLastKind,
    }))
  )

  const selectedPlacementView = useMemo(
    () => selectSelectedPlacementView(scenePlacements, selectedPlacementId),
    [scenePlacements, selectedPlacementId],
  )
  const selectedMonitoringCamera = useMemo(
    () => selectMonitoringCamera(monitoringCameras, selectedMonitoringCameraId),
    [monitoringCameras, selectedMonitoringCameraId],
  )
  const legendItems = useMemo(() => selectPlacementLegendItems(scenePlacements), [scenePlacements])
  const miniMapScale = useMemo(
    () => computePlanogramMiniMapScale(sceneRoom, topQuarterTurns),
    [sceneRoom, topQuarterTurns],
  )
  const placementHitPolygons = useMemo(
    () => buildPlanogramPlacementHitPolygons(scenePlacements, sceneRoom, topQuarterTurns),
    [scenePlacements, sceneRoom, topQuarterTurns],
  )

  const dispatchFromPlanogram = createPoseStoreCommandDispatcher('ui.planogram')

  return {
    avatarPlanPositionM,
    avatarRotationDeg,
    avatarTrackId,
    cameraView,
    dispatchFromPlanogram,
    legendItems,
    miniMapScale,
    monitoringCameras,
    placementHitPolygons,
    projectionMode,
    sceneDeferredApplyPendingConfirm,
    sceneDeferredRemoteCount,
    sceneDeferredRemoteLastAt,
    sceneDeferredRemoteLastKind,
    sceneEditEnabled,
    sceneError,
    sceneLastEventAt,
    scenePlacements,
    sceneRedoDepth,
    sceneRemoteHoldEnabled,
    sceneRemoteOverrideAt,
    sceneRemoteOverrideKind,
    sceneRevision,
    sceneRoom,
    sceneSequence,
    sceneSource,
    sceneUndoDepth,
    selectedMonitoringCamera,
    selectedPlacement: selectedPlacementView.placement,
    selectedPlacementAssetId: selectedPlacementView.assetId,
    selectedAsset: selectedPlacementView.asset,
    selectedSize: selectedPlacementView.size,
    showDimensions,
    topQuarterTurns,
  }
}
