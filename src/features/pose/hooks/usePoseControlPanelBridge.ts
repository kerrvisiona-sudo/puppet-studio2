import { useShallow } from 'zustand/react/shallow'

import { useBridgeStore } from '../../../app/state'

export function usePoseControlPanelBridge() {
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

  return {
    bridgeEnabled,
    bridgeError,
    bridgeLastPoseAt,
    bridgeNonZeroAxes,
    bridgeSequence,
    bridgeStatus,
    bridgeUrl,
    sceneDeferredApplyPendingConfirm,
    sceneDeferredRemoteCount,
    sceneDeferredRemoteLastAt,
    sceneDeferredRemoteLastKind,
    sceneRemoteHoldEnabled,
    sceneRemoteOverrideAt,
    sceneRemoteOverrideKind,
    setBridgeUrl,
  }
}
