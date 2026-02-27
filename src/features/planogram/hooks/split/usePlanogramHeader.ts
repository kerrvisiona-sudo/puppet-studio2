import { useShallow } from 'zustand/react/shallow'
import { useViewportStore, useSceneStore, useBridgeStore } from '../../../../app/state'
import { createAppCommandDispatcher } from '../../../../shared/ui'

export function usePlanogramHeader() {
  const { cameraView, projectionMode, topQuarterTurns } = useViewportStore(
    useShallow((s) => ({
      cameraView: s.cameraView,
      projectionMode: s.projectionMode,
      topQuarterTurns: s.topQuarterTurns,
    }))
  )

  const { sceneEditEnabled } = useSceneStore(
    useShallow((s) => ({
      sceneEditEnabled: s.sceneEditEnabled,
    }))
  )

  const { sceneRemoteHoldEnabled } = useBridgeStore(
    useShallow((s) => ({
      sceneRemoteHoldEnabled: s.sceneRemoteHoldEnabled,
    }))
  )

  const { monitoringCameras } = useSceneStore(
    useShallow((s) => ({
      monitoringCameras: s.monitoringCameras,
    }))
  )

  const dispatchFromPlanogram = createAppCommandDispatcher('ui.planogram')

  return {
    cameraView,
    projectionMode,
    topQuarterTurns,
    sceneEditEnabled,
    sceneRemoteHoldEnabled,
    monitoringCameras,
    dispatchFromPlanogram,
  }
}
