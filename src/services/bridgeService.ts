import { useBridgeStore, type DeferredSceneMessage } from '../app/state/bridgeStore'
import { useSceneStore } from '../app/state/sceneStore'
import { useAvatarStore } from '../app/state/avatarStore'
import { useUiStore } from '../app/state/uiStore'
import {
  applyScenePatchFromBridge,
  parseSceneSnapshotFromBridge,
  type SceneSpecialistMeta,
} from '../core/planogram-domain'
import {
  decideSceneSyncIncoming,
  selectSceneDeferredEntriesForApply,
} from '../core/scene-domain/sceneSyncEngine'
import { isSceneRemoteVersionStale } from '../core/scene-domain/sceneRemoteVersion'
import { runtimeConfig } from '../core/config/runtimeConfig'

/**
 * Bridge Service
 *
 * Coordina la sincronización de scene remota a través del WebSocket bridge.
 * Maneja deferred updates, snapshots, patches, y resolución de conflictos.
 */
export const bridgeService = {
  /**
   * Aplica un scene_patch recibido del bridge
   */
  applyScenePatch(message: unknown) {
    const bridgeStore = useBridgeStore.getState()
    const sceneStore = useSceneStore.getState()
    const avatarStore = useAvatarStore.getState()
    const uiStore = useUiStore.getState()

    const parsed = applyScenePatchFromBridge(
      message,
      {
        placements: sceneStore.scenePlacements,
        room: sceneStore.sceneRoom,
      },
      {
        objectId: avatarStore.avatarObjectId,
        planPositionM: avatarStore.avatarPlanPositionM,
        rotationDeg: avatarStore.avatarRotationDeg,
        trackId: avatarStore.avatarTrackId,
      },
    )

    if (!parsed) {
      sceneStore.applyRemoteSceneUpdate({ source: 'scene' })
      uiStore.appendSceneEvent({
        kind: 'scene_patch_invalid',
        level: 'error',
        message,
        source: 'frontend.bridge_service',
        summary: 'invalid scene_patch',
      })
      return
    }

    const decision = decideSceneSyncIncoming({
      appliedVersion: {
        revision: sceneStore.sceneLastAppliedRemoteRevision,
        sequence: sceneStore.sceneLastAppliedRemoteSequence,
      },
      deferredQueue: bridgeStore.sceneDeferredRemoteQueue,
      deferredQueueLimit: runtimeConfig.sceneDeferredQueueLimit,
      hasLocalEdits: sceneStore.sceneUndoStack.length > 0 || sceneStore.sceneRedoStack.length > 0,
      holdRemoteEnabled: bridgeStore.sceneRemoteHoldEnabled,
      incoming: {
        kind: 'scene_patch',
        message,
        receivedAt: parsed.receivedAt,
        revision: parsed.revision ?? null,
        sequence: parsed.sequence ?? null,
      },
    })

    if (decision.type === 'ignore_stale') {
      uiStore.appendSceneEvent({
        kind: 'scene_patch_ignored_stale',
        level: 'debug',
        message,
        revision: decision.version.revision,
        sequence: decision.version.sequence,
        source: 'frontend.bridge_service',
        summary: `ignored stale patch seq:${decision.version.sequence ?? '-'} rev:${decision.version.revision ?? '-'}`,
      })
      return
    }

    if (decision.type === 'defer') {
      bridgeStore.setSceneDeferredQueue(decision.queue)
      uiStore.appendSceneEvent({
        kind: 'scene_patch_deferred',
        level: 'info',
        message,
        revision: decision.queued.revision,
        sequence: decision.queued.sequence,
        source: 'frontend.bridge_service',
        summary: `deferred patch queue:${decision.queue.length}`,
      })
      return
    }

    // Apply immediately
    this.applyRemoteScene({
      placements: parsed.placements,
      room: parsed.room,
      cameraDetectionOverlays: parsed.cameraDetectionOverlays ?? undefined,
      monitoringCameras: parsed.monitoringCameras ?? undefined,
      avatar: parsed.avatar ?? undefined,
      revision: parsed.revision,
      sequence: parsed.sequence,
      receivedAt: parsed.receivedAt,
      specialistMeta: parsed.specialistMeta,
    }, 'scene_patch')
  },

  /**
   * Aplica un scene_snapshot recibido del bridge
   */
  applySceneSnapshot(message: unknown) {
    const bridgeStore = useBridgeStore.getState()
    const sceneStore = useSceneStore.getState()
    const avatarStore = useAvatarStore.getState()
    const uiStore = useUiStore.getState()

    const parsed = parseSceneSnapshotFromBridge(
      message,
      {
        placements: sceneStore.scenePlacements,
        room: sceneStore.sceneRoom,
      },
      {
        objectId: avatarStore.avatarObjectId,
        planPositionM: avatarStore.avatarPlanPositionM,
        rotationDeg: avatarStore.avatarRotationDeg,
        trackId: avatarStore.avatarTrackId,
      },
    )

    if (!parsed) {
      sceneStore.applyRemoteSceneUpdate({ source: 'scene' })
      uiStore.appendSceneEvent({
        kind: 'scene_snapshot_invalid',
        level: 'error',
        message,
        source: 'frontend.bridge_service',
        summary: 'invalid scene_snapshot',
      })
      return
    }

    const decision = decideSceneSyncIncoming({
      appliedVersion: {
        revision: sceneStore.sceneLastAppliedRemoteRevision,
        sequence: sceneStore.sceneLastAppliedRemoteSequence,
      },
      deferredQueue: bridgeStore.sceneDeferredRemoteQueue,
      deferredQueueLimit: runtimeConfig.sceneDeferredQueueLimit,
      hasLocalEdits: sceneStore.sceneUndoStack.length > 0 || sceneStore.sceneRedoStack.length > 0,
      holdRemoteEnabled: bridgeStore.sceneRemoteHoldEnabled,
      incoming: {
        kind: 'scene_snapshot',
        message,
        receivedAt: parsed.receivedAt,
        revision: parsed.revision ?? null,
        sequence: parsed.sequence ?? null,
      },
    })

    if (decision.type === 'ignore_stale') {
      uiStore.appendSceneEvent({
        kind: 'scene_snapshot_ignored_stale',
        level: 'debug',
        message,
        revision: decision.version.revision,
        sequence: decision.version.sequence,
        source: 'frontend.bridge_service',
        summary: `ignored stale snapshot seq:${decision.version.sequence ?? '-'} rev:${decision.version.revision ?? '-'}`,
      })
      return
    }

    if (decision.type === 'defer') {
      bridgeStore.setSceneDeferredQueue(decision.queue)
      uiStore.appendSceneEvent({
        kind: 'scene_snapshot_deferred',
        level: 'info',
        message,
        revision: decision.queued.revision,
        sequence: decision.queued.sequence,
        source: 'frontend.bridge_service',
        summary: `deferred snapshot queue:${decision.queue.length}`,
      })
      return
    }

    // Apply immediately
    this.applyRemoteScene({
      placements: parsed.placements,
      room: parsed.room,
      cameraDetectionOverlays: parsed.cameraDetectionOverlays ?? undefined,
      monitoringCameras: parsed.monitoringCameras ?? undefined,
      avatar: parsed.avatar ?? undefined,
      revision: parsed.revision,
      sequence: parsed.sequence,
      receivedAt: parsed.receivedAt,
      specialistMeta: parsed.specialistMeta,
    }, 'scene_snapshot')
  },

  /**
   * Aplica la cola de deferred messages
   */
  applyDeferredQueue() {
    const bridgeStore = useBridgeStore.getState()
    const sceneStore = useSceneStore.getState()
    const uiStore = useUiStore.getState()

    const result = selectSceneDeferredEntriesForApply({
      appliedVersion: {
        revision: sceneStore.sceneLastAppliedRemoteRevision,
        sequence: sceneStore.sceneLastAppliedRemoteSequence,
      },
      mode: runtimeConfig.sceneDeferredApplyMode,
      queue: bridgeStore.sceneDeferredRemoteQueue,
    })

    if (result.entries.length === 0) {
      return
    }

    for (const entry of result.entries) {
      if (entry.kind === 'scene_patch') {
        this.applyScenePatch(entry.message)
      } else {
        this.applySceneSnapshot(entry.message)
      }
    }

    const remaining = bridgeStore.sceneDeferredRemoteQueue.slice(result.entries.length)
    bridgeStore.setSceneDeferredQueue(remaining)

    uiStore.appendSceneEvent({
      kind: 'scene_deferred_apply',
      level: 'info',
      source: 'frontend.bridge_service',
      summary: `applied ${result.entries.length} deferred messages, ${remaining.length} remaining, ${result.droppedAsStale} dropped as stale`,
    })
  },

  /**
   * Aplica un parsed remote scene update
   */
  applyRemoteScene(
    parsed: {
      placements: any[]
      room: any
      cameraDetectionOverlays?: any[]
      monitoringCameras?: any[]
      avatar?: { objectId: string | null; trackId: string | null; planPositionM: [number, number]; rotationDeg: number }
      revision: number | null
      sequence: number | null
      receivedAt: string
      specialistMeta: SceneSpecialistMeta | null
    },
    kind: 'scene_patch' | 'scene_snapshot',
  ) {
    const sceneStore = useSceneStore.getState()
    const avatarStore = useAvatarStore.getState()
    const bridgeStore = useBridgeStore.getState()

    sceneStore.applyRemoteSceneUpdate({
      placements: parsed.placements,
      room: parsed.room,
      cameraDetectionOverlays: parsed.cameraDetectionOverlays ?? undefined,
      monitoringCameras: parsed.monitoringCameras ?? undefined,
      revision: parsed.revision,
      sequence: parsed.sequence,
      source: 'scene',
      specialistMeta: parsed.specialistMeta ? {
        generatedAt: parsed.specialistMeta.generatedAt ?? undefined,
        source: parsed.specialistMeta.source ?? undefined,
        spatialAgeS: parsed.specialistMeta.spatialAgeS ?? undefined,
        spatialFresh: parsed.specialistMeta.spatialFresh ?? undefined,
        spatialStaleAfterS: parsed.specialistMeta.spatialStaleAfterS ?? undefined,
        stalePolicy: parsed.specialistMeta.stalePolicy ?? undefined,
      } : undefined,
    })

    if (parsed.avatar) {
      avatarStore.setAvatarIdentity({
        objectId: parsed.avatar.objectId,
        trackId: parsed.avatar.trackId,
      })
      avatarStore.setAvatarPosition(parsed.avatar.planPositionM)
      avatarStore.setAvatarRotation(parsed.avatar.rotationDeg)
    }

    bridgeStore.setSceneRemoteOverride(parsed.receivedAt, kind)
    bridgeStore.clearSceneDeferredRemote()
  },
}
