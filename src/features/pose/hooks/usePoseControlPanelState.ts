import { useEffect, useState } from 'react'

import { useAvatarStore, useBridgeStore, useSceneStore, useUiStore } from '../../../app/state'
import { createPoseStoreCommandDispatcher } from '../../../shared/ui'

export function usePoseControlPanelState() {
  // Avatar state
  const pose = useAvatarStore((state) => state.pose)
  const setAxis = useAvatarStore((state) => state.setAxis)

  // Bridge state
  const bridgeEnabled = useBridgeStore((state) => state.bridgeEnabled)
  const bridgeError = useBridgeStore((state) => state.bridgeError)
  const bridgeLastPoseAt = useBridgeStore((state) => state.bridgeLastPoseAt)
  const bridgeNonZeroAxes = useBridgeStore((state) => state.bridgeNonZeroAxes)
  const bridgeSequence = useBridgeStore((state) => state.bridgeSequence)
  const bridgeStatus = useBridgeStore((state) => state.bridgeStatus)
  const bridgeUrl = useBridgeStore((state) => state.bridgeUrl)
  const sceneRemoteOverrideAt = useBridgeStore((state) => state.sceneRemoteOverrideAt)
  const sceneRemoteOverrideKind = useBridgeStore((state) => state.sceneRemoteOverrideKind)
  const sceneRemoteHoldEnabled = useBridgeStore((state) => state.sceneRemoteHoldEnabled)
  const sceneDeferredRemoteCount = useBridgeStore((state) => state.sceneDeferredRemoteCount)
  const sceneDeferredApplyPendingConfirm = useBridgeStore((state) => state.sceneDeferredApplyPendingConfirm)
  const sceneDeferredRemoteLastAt = useBridgeStore((state) => state.sceneDeferredRemoteLastAt)
  const sceneDeferredRemoteLastKind = useBridgeStore((state) => state.sceneDeferredRemoteLastKind)
  const setBridgeUrl = useBridgeStore((state) => state.setBridgeUrl)

  // Scene state
  const sceneError = useSceneStore((state) => state.sceneError)
  const sceneLastEventAt = useSceneStore((state) => state.sceneLastEventAt)
  const scenePlacements = useSceneStore((state) => state.scenePlacements)
  const sceneRevision = useSceneStore((state) => state.sceneRevision)
  const sceneSequence = useSceneStore((state) => state.sceneSequence)
  const sceneSource = useSceneStore((state) => state.sceneSource)
  const sceneRedoDepth = useSceneStore((state) => state.sceneRedoDepth)
  const sceneId = useSceneStore((state) => state.sceneId)
  const sceneSpecialistSource = useSceneStore((state) => state.sceneSpecialistSource)
  const sceneSpecialistGeneratedAt = useSceneStore((state) => state.sceneSpecialistGeneratedAt)
  const sceneSpatialFresh = useSceneStore((state) => state.sceneSpatialFresh)
  const sceneSpatialAgeS = useSceneStore((state) => state.sceneSpatialAgeS)
  const sceneSpatialStaleAfterS = useSceneStore((state) => state.sceneSpatialStaleAfterS)
  const sceneSpatialStalePolicy = useSceneStore((state) => state.sceneSpatialStalePolicy)
  const sceneUndoDepth = useSceneStore((state) => state.sceneUndoDepth)
  const sceneEditEnabled = useSceneStore((state) => state.sceneEditEnabled)

  // UI state
  const sceneEventTerminalOpen = useUiStore((state) => state.sceneEventTerminalOpen)

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
