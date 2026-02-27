import { useShallow } from 'zustand/react/shallow'
import { useSceneStore, useBridgeStore } from '../../../../app/state'
import { createAppCommandDispatcher } from '../../../../shared/ui'

export function usePlanogramStats() {
  const { sceneSource, sceneRevision, sceneSequence, sceneLastEventAt } = useSceneStore(
    useShallow((s) => ({
      sceneSource: s.sceneSource,
      sceneRevision: s.sceneRevision,
      sceneSequence: s.sceneSequence,
      sceneLastEventAt: s.sceneLastEventAt,
    }))
  )

  const { sceneEditEnabled } = useSceneStore(
    useShallow((s) => ({
      sceneEditEnabled: s.sceneEditEnabled,
    }))
  )

  const { sceneRemoteHoldEnabled, sceneDeferredRemoteCount } = useBridgeStore(
    useShallow((s) => ({
      sceneRemoteHoldEnabled: s.sceneRemoteHoldEnabled,
      sceneDeferredRemoteCount: s.sceneDeferredRemoteCount,
    }))
  )

  const { monitoringCameras } = useSceneStore(
    useShallow((s) => ({
      monitoringCameras: s.monitoringCameras,
    }))
  )

  return {
    sceneSource,
    sceneRevision,
    sceneSequence,
    sceneLastEventAt,
    sceneEditEnabled,
    sceneRemoteHoldEnabled,
    sceneDeferredRemoteCount,
    monitoringCamerasCount: monitoringCameras.length,
  }
}

export function usePlanogramDeferredActions() {
  const {
    sceneDeferredRemoteCount,
    sceneDeferredApplyPendingConfirm,
    sceneRemoteOverrideAt,
    sceneRemoteOverrideKind,
  } = useBridgeStore(
    useShallow((s) => ({
      sceneDeferredRemoteCount: s.sceneDeferredRemoteCount,
      sceneDeferredApplyPendingConfirm: s.sceneDeferredApplyPendingConfirm,
      sceneRemoteOverrideAt: s.sceneRemoteOverrideAt,
      sceneRemoteOverrideKind: s.sceneRemoteOverrideKind,
    }))
  )

  const dispatchFromPlanogram = createAppCommandDispatcher('ui.planogram')

  return {
    sceneDeferredRemoteCount,
    sceneDeferredApplyPendingConfirm,
    sceneRemoteOverrideAt,
    sceneRemoteOverrideKind,
    dispatchFromPlanogram,
  }
}
