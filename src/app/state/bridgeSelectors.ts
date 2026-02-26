import type { BridgeState } from './bridgeStore'

/**
 * Selector factories for bridgeStore
 * Use with useShallow for optimized re-renders
 */

export const bridgeSelectors = {
  /** Bridge connection state (7 props) */
  bridgeConnection: (s: BridgeState) => ({
    bridgeEnabled: s.bridgeEnabled,
    bridgeStatus: s.bridgeStatus,
    bridgeUrl: s.bridgeUrl,
    bridgeError: s.bridgeError,
    bridgeSequence: s.bridgeSequence,
    bridgeLastPoseAt: s.bridgeLastPoseAt,
    bridgeNonZeroAxes: s.bridgeNonZeroAxes,
  }),

  /** Remote scene sync state (5 props) */
  sceneRemoteSync: (s: BridgeState) => ({
    sceneRemoteHoldEnabled: s.sceneRemoteHoldEnabled,
    sceneRemoteOverrideAt: s.sceneRemoteOverrideAt,
    sceneRemoteOverrideKind: s.sceneRemoteOverrideKind,
    sceneDeferredRemoteCount: s.sceneDeferredRemoteCount,
    sceneDeferredApplyPendingConfirm: s.sceneDeferredApplyPendingConfirm,
  }),

  /** Deferred queue state (2 props) */
  sceneDeferredQueue: (s: BridgeState) => ({
    sceneDeferredRemoteLastAt: s.sceneDeferredRemoteLastAt,
    sceneDeferredRemoteLastKind: s.sceneDeferredRemoteLastKind,
  }),
}
