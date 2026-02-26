import { useEffect, useState } from 'react'
import { useShallow } from 'zustand/react/shallow'

import { useAvatarStore, useBridgeStore, useSceneStore, useUiStore } from '../../../app/state'
import { createPoseStoreCommandDispatcher } from '../../../shared/ui'

export function usePoseControlPanelState() {
  // Group 1: Avatar state (pose + action)
  const { pose, setAxis } = useAvatarStore(
    useShallow((s) => ({
      pose: s.pose,
      setAxis: s.setAxis,
    }))
  )

  // Group 2: Bridge connection state (7 props)
  const {
    bridgeEnabled,
    bridgeError,
    bridgeLastPoseAt,
    bridgeNonZeroAxes,
    bridgeSequence,
    bridgeStatus,
    bridgeUrl,
  } = useBridgeStore(
    useShallow((s) => ({
      bridgeEnabled: s.bridgeEnabled,
      bridgeError: s.bridgeError,
      bridgeLastPoseAt: s.bridgeLastPoseAt,
      bridgeNonZeroAxes: s.bridgeNonZeroAxes,
      bridgeSequence: s.bridgeSequence,
      bridgeStatus: s.bridgeStatus,
      bridgeUrl: s.bridgeUrl,
    }))
  )

  // Group 3: Bridge remote sync state (7 props)
  const {
    sceneRemoteOverrideAt,
    sceneRemoteOverrideKind,
    sceneRemoteHoldEnabled,
    sceneDeferredRemoteCount,
    sceneDeferredApplyPendingConfirm,
    sceneDeferredRemoteLastAt,
    sceneDeferredRemoteLastKind,
  } = useBridgeStore(
    useShallow((s) => ({
      sceneRemoteOverrideAt: s.sceneRemoteOverrideAt,
      sceneRemoteOverrideKind: s.sceneRemoteOverrideKind,
      sceneRemoteHoldEnabled: s.sceneRemoteHoldEnabled,
      sceneDeferredRemoteCount: s.sceneDeferredRemoteCount,
      sceneDeferredApplyPendingConfirm: s.sceneDeferredApplyPendingConfirm,
      sceneDeferredRemoteLastAt: s.sceneDeferredRemoteLastAt,
      sceneDeferredRemoteLastKind: s.sceneDeferredRemoteLastKind,
    }))
  )

  // Group 4: Bridge action
  const setBridgeUrl = useBridgeStore((s) => s.setBridgeUrl)

  // Group 5: Scene core state (9 props)
  const {
    sceneError,
    sceneLastEventAt,
    scenePlacements,
    sceneRevision,
    sceneSequence,
    sceneSource,
    sceneRedoDepth,
    sceneId,
    sceneEditEnabled,
  } = useSceneStore(
    useShallow((s) => ({
      sceneError: s.sceneError,
      sceneLastEventAt: s.sceneLastEventAt,
      scenePlacements: s.scenePlacements,
      sceneRevision: s.sceneRevision,
      sceneSequence: s.sceneSequence,
      sceneSource: s.sceneSource,
      sceneRedoDepth: s.sceneRedoDepth,
      sceneId: s.sceneId,
      sceneEditEnabled: s.sceneEditEnabled,
    }))
  )

  // Group 6: Scene specialist metadata (6 props)
  const {
    sceneSpecialistSource,
    sceneSpecialistGeneratedAt,
    sceneSpatialFresh,
    sceneSpatialAgeS,
    sceneSpatialStaleAfterS,
    sceneSpatialStalePolicy,
    sceneUndoDepth,
  } = useSceneStore(
    useShallow((s) => ({
      sceneSpecialistSource: s.sceneSpecialistSource,
      sceneSpecialistGeneratedAt: s.sceneSpecialistGeneratedAt,
      sceneSpatialFresh: s.sceneSpatialFresh,
      sceneSpatialAgeS: s.sceneSpatialAgeS,
      sceneSpatialStaleAfterS: s.sceneSpatialStaleAfterS,
      sceneSpatialStalePolicy: s.sceneSpatialStalePolicy,
      sceneUndoDepth: s.sceneUndoDepth,
    }))
  )

  // Group 7: UI state (1 prop)
  const sceneEventTerminalOpen = useUiStore((s) => s.sceneEventTerminalOpen)

  const [sceneDraft, setSceneDraft] = useState(sceneId)

  useEffect(() => {
    setSceneDraft(sceneId)
  }, [sceneId])

  const dispatchFromControlPanel = createPoseStoreCommandDispatcher('ui.control_panel')

  return {
    bridgeEnabled,
    bridgeError,
    bridgeLastPoseAt,
    bridgeNonZeroAxes,
    bridgeSequence,
    bridgeStatus,
    bridgeUrl,
    dispatchFromControlPanel,
    pose,
    sceneDeferredApplyPendingConfirm,
    sceneDeferredRemoteCount,
    sceneDeferredRemoteLastAt,
    sceneDeferredRemoteLastKind,
    sceneDraft,
    sceneEditEnabled,
    sceneEventTerminalOpen,
    sceneError,
    sceneId,
    sceneLastEventAt,
    scenePlacements,
    sceneRedoDepth,
    sceneRemoteHoldEnabled,
    sceneRemoteOverrideAt,
    sceneRemoteOverrideKind,
    sceneRevision,
    sceneSequence,
    sceneSource,
    sceneSpecialistGeneratedAt,
    sceneSpecialistSource,
    sceneSpatialAgeS,
    sceneSpatialFresh,
    sceneSpatialStaleAfterS,
    sceneSpatialStalePolicy,
    sceneUndoDepth,
    setAxis,
    setBridgeUrl,
    setSceneDraft,
  }
}
