import { atom } from 'jotai'
import { bridgeAtom, sceneAtom } from './storeAtoms'

/**
 * Derived atoms for bridge and remote sync state
 * Use these when you need computed state that depends on bridge + other stores
 */

/** Is bridge connected and operational? */
export const isBridgeConnectedAtom = atom((get) => {
  const bridge = get(bridgeAtom)
  return bridge.bridgeEnabled && bridge.bridgeStatus === 'connected'
})

/** Is there pending deferred remote sync? */
export const hasDeferredRemoteSyncAtom = atom((get) => {
  const bridge = get(bridgeAtom)
  return bridge.sceneDeferredRemoteCount > 0
})

/** Bridge sync status summary */
export const bridgeSyncStatusAtom = atom((get) => {
  const bridge = get(bridgeAtom)
  const scene = get(sceneAtom)

  return {
    isConnected: bridge.bridgeEnabled && bridge.bridgeStatus === 'connected',
    hasError: bridge.bridgeError !== null,
    isDeferredHoldEnabled: bridge.sceneRemoteHoldEnabled,
    deferredCount: bridge.sceneDeferredRemoteCount,
    isPendingConfirm: bridge.sceneDeferredApplyPendingConfirm,
    lastRemoteAt: bridge.sceneDeferredRemoteLastAt,
    lastRemoteKind: bridge.sceneDeferredRemoteLastKind,
    sceneRevision: scene.sceneRevision,
    sceneSequence: scene.sceneSequence,
  }
})

/** Should show deferred sync warning badge? */
export const shouldShowDeferredWarningAtom = atom((get) => {
  const bridge = get(bridgeAtom)
  return (
    bridge.sceneRemoteHoldEnabled &&
    bridge.sceneDeferredRemoteCount > 0 &&
    !bridge.sceneDeferredApplyPendingConfirm
  )
})

/** Bridge connection health summary */
export const bridgeHealthAtom = atom((get) => {
  const bridge = get(bridgeAtom)

  if (!bridge.bridgeEnabled) {
    return { status: 'disabled' as const, message: 'Bridge disabled' }
  }

  if (bridge.bridgeError) {
    return { status: 'error' as const, message: bridge.bridgeError }
  }

  if (bridge.bridgeStatus === 'connecting') {
    return { status: 'connecting' as const, message: 'Connecting...' }
  }

  if (bridge.bridgeStatus === 'connected') {
    return { status: 'healthy' as const, message: 'Connected' }
  }

  return { status: 'disconnected' as const, message: 'Disconnected' }
})
