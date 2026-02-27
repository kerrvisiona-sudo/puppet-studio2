import { useMemo } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useSceneStore, useViewportStore } from '../../../../app/state'
import { createAppCommandDispatcher } from '../../../../shared/ui'
import { selectSelectedPlacementView } from '../../../../core/scene-domain'
import {
  SCENE_COMMAND_MOVE_STEP_M,
  SCENE_COMMAND_ROTATE_STEP_DEG,
  SCENE_COMMAND_SNAP_STEP_M,
} from '../../../../core/config'

export function usePlanogramPlacementTools() {
  const { scenePlacements, selectedPlacementId, sceneEditEnabled, sceneUndoDepth, sceneRedoDepth, sceneError } =
    useSceneStore(
      useShallow((s) => ({
        scenePlacements: s.scenePlacements,
        selectedPlacementId: s.selectedPlacementId,
        sceneEditEnabled: s.sceneEditEnabled,
        sceneUndoDepth: s.sceneUndoDepth,
        sceneRedoDepth: s.sceneRedoDepth,
        sceneError: s.sceneError,
      }))
    )

  const { showDimensions } = useViewportStore(
    useShallow((s) => ({
      showDimensions: s.showDimensions,
    }))
  )

  const selectedPlacementView = useMemo(
    () => selectSelectedPlacementView(scenePlacements, selectedPlacementId),
    [scenePlacements, selectedPlacementId]
  )

  const dispatchFromPlanogram = createAppCommandDispatcher('ui.planogram')

  return {
    selectedPlacement: selectedPlacementView.placement,
    selectedAsset: selectedPlacementView.asset,
    selectedSize: selectedPlacementView.size,
    showDimensions,
    sceneEditEnabled,
    sceneUndoDepth,
    sceneRedoDepth,
    sceneError,
    dispatchFromPlanogram,
  }
}

export const PLANOGRAM_COMMAND_CONFIG = {
  moveStepM: SCENE_COMMAND_MOVE_STEP_M,
  rotateStepDeg: SCENE_COMMAND_ROTATE_STEP_DEG,
  snapStepM: SCENE_COMMAND_SNAP_STEP_M,
}
