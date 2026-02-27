import {
  createAppCommandEnvelope,
  dispatchAppCommandEnvelope,
  type AppCommand,
  type AppCommandEnvelope,
  type AppCommandPort,
} from './appCommandBus'
import { reflectAppCommandToTerminalLine } from './commandReflection'
import { commandRegistry } from './commandRegistry'
import { undoManager } from './undoManager'
import { useSceneStore, useViewportStore, useBridgeStore, useAvatarStore, useUiStore } from '../../app/state'
import { sceneService, bridgeService } from '../../services'
import { createEngineRuntime, type EngineCapability } from '../engine'
import { createEngineSimPreviewCapability, createEngineStatsCapability } from './capabilities'
import { resolveEngineCapabilityDefaultEnabled, runtimeConfig } from '../config'
import { dispatchWorkspaceShellCommand } from '../workspace-shell'

// Legacy type for engine runtime - combines all modular stores
type PoseStoreState = ReturnType<typeof useSceneStore.getState> &
  ReturnType<typeof useViewportStore.getState> &
  ReturnType<typeof useBridgeStore.getState> &
  ReturnType<typeof useAvatarStore.getState> &
  ReturnType<typeof useUiStore.getState>

export type PoseStoreEngineCapabilityEvent = {
  [key: string]: unknown
}

export type PoseStoreEngineCapability = EngineCapability<AppCommand, PoseStoreEngineCapabilityEvent, PoseStoreState>

type PoseStoreEngineCapabilityDefinition = {
  create: () => PoseStoreEngineCapability
  defaultEnabled: boolean
  description: string
  id: string
}

type PoseStoreEngineCapabilityStatus = {
  defaultEnabled: boolean
  description: string
  enabled: boolean
  id: string
}

const poseStoreEngineCapabilityDefinitions = new Map<string, PoseStoreEngineCapabilityDefinition>()

function getPoseStoreCommandPort(): AppCommandPort {
  // Use modular stores instead of poseStore
  const sceneStore = useSceneStore.getState()
  const viewportStore = useViewportStore.getState()
  const bridgeStore = useBridgeStore.getState()
  const avatarStore = useAvatarStore.getState()
  const uiStore = useUiStore.getState()

  const toSceneEngineMeta = (envelope?: AppCommandEnvelope) => {
    if (!envelope) return undefined
    return {
      at: envelope.at,
      commandId: envelope.id,
      correlationId: envelope.correlationId,
      source: envelope.source,
    }
  }

  return {
    applyDeferredSceneRemote: () => bridgeService.applyDeferredQueue(),
    applyWorkspaceLayoutPreset: (preset) => {
      dispatchWorkspaceShellCommand({
        kind: 'apply_layout_preset',
        preset,
      })
    },
    clearScene: (envelope) => sceneService.clearScene(toSceneEngineMeta(envelope)),
    clearSceneDeferredRemote: () => bridgeStore.clearSceneDeferredRemote(),
    clearSceneEventLog: () => uiStore.clearSceneEventLog(),
    clearSceneRemoteOverride: () => bridgeStore.clearSceneRemoteOverride(),
    redoSceneEdit: () => undoManager.redo(),
    requestEngineSimPreview: () => {
      uiStore.appendSceneEvent({
        kind: 'engine_sim_preview_unavailable',
        level: 'warn',
        message: {
          reason: "capability 'engine.sim.preview' is disabled",
        },
        revision: sceneStore.sceneRevision,
        sceneId: sceneStore.sceneId,
        sequence: sceneStore.sceneSequence,
        source: 'frontend.engine_runtime',
        summary: "engine sim preview unavailable (enable capability 'engine.sim.preview')",
      })
    },
    requestEngineStats: () => {
      uiStore.appendSceneEvent({
        kind: 'engine_stats_unavailable',
        level: 'warn',
        message: {
          reason: "capability 'engine.stats' is disabled",
        },
        revision: sceneStore.sceneRevision,
        sceneId: sceneStore.sceneId,
        sequence: sceneStore.sceneSequence,
        source: 'frontend.engine_runtime',
        summary: "engine stats unavailable (enable capability 'engine.stats')",
      })
    },
    resetPose: () => avatarStore.resetPose(),
    resetCameraOverlayFlip: () => viewportStore.resetCameraOverlayFlip(),
    rotateTopView: (direction) => {
      viewportStore.rotateTopView(direction)
      return {
        redo: () => viewportStore.rotateTopView(direction),
        undo: () => viewportStore.rotateTopView(direction === 1 ? -1 : 1),
      }
    },
    runSceneCommand: (command, envelope) => {
      const result = sceneService.runCommand(command, toSceneEngineMeta(envelope))
      if (!result?.undoResult) return undefined

      const sceneStore = useSceneStore.getState()
      return {
        undo: () => sceneStore.restoreState(result.undoResult!.previousState),
        redo: () => sceneStore.restoreState(result.undoResult!.nextState),
      }
    },
    setBridgeEnabled: (enabled) => bridgeStore.setBridgeEnabled(enabled),
    setCameraOverlayFlip: (axis, enabled) => viewportStore.setCameraOverlayFlip(axis, enabled),
    setEngineCapabilityEnabled: (capabilityId, enabled) => {
      const outcome = setPoseStoreEngineCapabilityEnabled(capabilityId, enabled)
      uiStore.appendSceneEvent({
        kind: outcome === 'not_found' ? 'engine_capability_unknown' : 'engine_capability_toggle',
        level: outcome === 'not_found' ? 'warn' : 'info',
        message: {
          capabilityId,
          enabled,
          outcome,
        },
        revision: sceneStore.sceneRevision,
        sceneId: sceneStore.sceneId,
        sequence: sceneStore.sceneSequence,
        source: 'frontend.engine_runtime',
        summary:
          outcome === 'not_found'
            ? `capability ${capabilityId} not found`
            : `capability ${capabilityId} ${enabled ? 'disabled' : 'enabled'} (${outcome})`,
      })
    },
    setCameraView: (view) => {
      const prevView = viewportStore.cameraView
      viewportStore.setCameraView(view)
      return {
        redo: () => viewportStore.setCameraView(view),
        undo: () => viewportStore.setCameraView(prevView),
      }
    },
    setProjectionMode: (mode) => {
      const prevMode = viewportStore.projectionMode
      viewportStore.setProjectionMode(mode)
      return {
        redo: () => viewportStore.setProjectionMode(mode),
        undo: () => viewportStore.setProjectionMode(prevMode),
      }
    },
    setSceneId: (sceneId) => sceneStore.setSceneId(sceneId),
    setActiveToolMode: (mode) => {
      const prevMode = uiStore.activeToolMode
      uiStore.setActiveToolMode(mode)
      return {
        redo: () => uiStore.setActiveToolMode(mode),
        undo: () => uiStore.setActiveToolMode(prevMode),
      }
    },
    setSceneEventAutoScroll: (enabled) => uiStore.setSceneEventAutoScroll(enabled),
    setSceneEventLogPaused: (enabled) => uiStore.setSceneEventLogPaused(enabled),
    setSelectedMonitoringCameraId: (cameraId) => viewportStore.setSelectedMonitoringCameraId(cameraId),
    setSelectedPlacementId: (placementId) => sceneStore.setSelectedPlacementId(placementId),
    setShowDimensions: (show) => {
      const prevShow = viewportStore.showDimensions
      viewportStore.setShowDimensions(show)
      return {
        redo: () => viewportStore.setShowDimensions(show),
        undo: () => viewportStore.setShowDimensions(prevShow),
      }
    },
    toggleSceneEdit: () => sceneStore.toggleSceneEdit(),
    toggleSceneEventTerminal: () => uiStore.toggleSceneEventTerminal(),
    toggleSceneRemoteHold: () => bridgeStore.toggleSceneRemoteHold(),
    toggleWorkspaceLeftPanel: () => {
      dispatchWorkspaceShellCommand({ kind: 'toggle_left_panel' })
    },
    toggleWorkspaceRightPanel: () => {
      dispatchWorkspaceShellCommand({ kind: 'toggle_right_panel' })
    },
    setWorkspaceWidgetVisible: (widget, visible) => {
      dispatchWorkspaceShellCommand({ kind: 'set_widget_visible', visible, widget })
    },
    toggleWorkspaceWidgetCollapsed: (widget) => {
      dispatchWorkspaceShellCommand({ kind: 'toggle_widget_collapsed', widget })
    },
    toggleWorkspaceWidgetPinned: (widget) => {
      dispatchWorkspaceShellCommand({ kind: 'toggle_widget_pinned', widget })
    },
    undoSceneEdit: () => undoManager.undo(),
    restoreWorkspaceLayoutDefaults: () => {
      dispatchWorkspaceShellCommand({ kind: 'restore_layout_defaults' })
    },
  }
}

const poseStoreEngineRuntime = createEngineRuntime<AppCommand, PoseStoreEngineCapabilityEvent, PoseStoreState>({
  dispatchCommand: (envelope) => {
    const undoResult = dispatchAppCommandEnvelope(getPoseStoreCommandPort(), envelope)
    const meta = commandRegistry.get(envelope.command.kind)
    if (meta?.flags?.undoable && undoResult) {
      undoManager.push({
        envelope,
        undoResult,
      })
    }
  },
  emitEvent: (event) => {
    const sceneStore = useSceneStore.getState()
    const uiStore = useUiStore.getState()
    uiStore.appendSceneEvent({
      kind: 'engine_runtime_event',
      level: 'debug',
      message: event,
      revision: sceneStore.sceneRevision,
      sceneId: sceneStore.sceneId,
      sequence: sceneStore.sceneSequence,
      source: 'frontend.engine_runtime',
      summary: `engine ${event.kind} (${event.source})`,
    })
  },
  getState: () => ({
    ...useSceneStore.getState(),
    ...useViewportStore.getState(),
    ...useBridgeStore.getState(),
    ...useAvatarStore.getState(),
    ...useUiStore.getState(),
  }),
  onCapabilityError: ({ capabilityId, command, error }) => {
    const sceneStore = useSceneStore.getState()
    const uiStore = useUiStore.getState()
    uiStore.appendSceneEvent({
      kind: 'engine_capability_error',
      level: 'warn',
      message: {
        capabilityId,
        commandKind: command.kind,
        error: error instanceof Error ? error.message : String(error),
      },
      revision: sceneStore.sceneRevision,
      sceneId: sceneStore.sceneId,
      sequence: sceneStore.sceneSequence,
      source: 'frontend.engine_runtime',
      summary: `capability ${capabilityId} failed on ${command.kind}`,
    })
  },
})

function registerDefaultPoseStoreEngineCapabilities() {
  const defaultEnabled = resolveEngineCapabilityDefaultEnabled('engine.stats', true)
  registerPoseStoreEngineCapabilityDefinition({
    create: createEngineStatsCapability,
    defaultEnabled,
    description: 'Aggregated command counters by kind/source.',
    id: 'engine.stats',
  })
  const simPreviewDefaultEnabled = resolveEngineCapabilityDefaultEnabled('engine.sim.preview', false)
  registerPoseStoreEngineCapabilityDefinition({
    create: createEngineSimPreviewCapability,
    defaultEnabled: simPreviewDefaultEnabled,
    description: 'Snapshot preview of current scene state for local simulation workflows.',
    id: 'engine.sim.preview',
  })

  const sceneStore = useSceneStore.getState()
  const uiStore = useUiStore.getState()
  uiStore.appendSceneEvent({
    kind: 'engine_capability_policy',
    level: 'info',
    message: {
      engineCapabilityProfile: runtimeConfig.engineCapabilityProfile,
      engineCapabilitiesDisabled: runtimeConfig.engineCapabilitiesDisabled,
      engineCapabilitiesEnabled: runtimeConfig.engineCapabilitiesEnabled,
    },
    revision: sceneStore.sceneRevision,
    sceneId: sceneStore.sceneId,
    sequence: sceneStore.sceneSequence,
    source: 'frontend.engine_runtime',
    summary: `cap profile=${runtimeConfig.engineCapabilityProfile}`,
  })
}

function registerDefaultEnabledCapabilities() {
  for (const definition of poseStoreEngineCapabilityDefinitions.values()) {
    if (!definition.defaultEnabled) continue
    setPoseStoreEngineCapabilityEnabled(definition.id, true)
  }
}

function isPoseStoreEngineCapabilityEnabled(capabilityId: string): boolean {
  return poseStoreEngineRuntime.listCapabilities().some((capability) => capability.id === capabilityId)
}

registerDefaultPoseStoreEngineCapabilities()
registerDefaultEnabledCapabilities()

export function registerPoseStoreEngineCapabilityDefinition(definition: PoseStoreEngineCapabilityDefinition) {
  if (poseStoreEngineCapabilityDefinitions.has(definition.id)) {
    throw new Error(`Pose store capability definition '${definition.id}' is already registered.`)
  }
  poseStoreEngineCapabilityDefinitions.set(definition.id, definition)
}

export function registerPoseStoreEngineCapability(capability: PoseStoreEngineCapability) {
  poseStoreEngineRuntime.registerCapability(capability)
}

export function setPoseStoreEngineCapabilityEnabled(capabilityId: string, enabled: boolean): 'changed' | 'noop' | 'not_found' {
  const definition = poseStoreEngineCapabilityDefinitions.get(capabilityId)
  if (!definition) return 'not_found'
  const alreadyEnabled = isPoseStoreEngineCapabilityEnabled(capabilityId)
  if (enabled && alreadyEnabled) return 'noop'
  if (!enabled && !alreadyEnabled) return 'noop'

  if (enabled) {
    poseStoreEngineRuntime.registerCapability(definition.create())
    return 'changed'
  }

  poseStoreEngineRuntime.unregisterCapability(capabilityId)
  return 'changed'
}

export function unregisterPoseStoreEngineCapability(capabilityId: string) {
  poseStoreEngineRuntime.unregisterCapability(capabilityId)
}

export function listPoseStoreEngineCapabilities() {
  const statuses: PoseStoreEngineCapabilityStatus[] = []
  for (const definition of poseStoreEngineCapabilityDefinitions.values()) {
    statuses.push({
      defaultEnabled: definition.defaultEnabled,
      description: definition.description,
      enabled: isPoseStoreEngineCapabilityEnabled(definition.id),
      id: definition.id,
    })
  }
  return statuses.sort((left, right) => left.id.localeCompare(right.id))
}

export function dispatchAppCommandRuntime(
  command: AppCommand,
  options?: { correlationId?: string | null; source?: string },
): AppCommandEnvelope {
  const source = options?.source ?? 'ui.unknown'
  const envelope = createAppCommandEnvelope(command, {
    correlationId: options?.correlationId ?? null,
    source,
  })
  const sceneStore = useSceneStore.getState()
  const uiStore = useUiStore.getState()

  uiStore.appendSceneEvent({
    kind: 'app_command',
    level: 'debug',
    message: envelope,
    revision: sceneStore.sceneRevision,
    sceneId: sceneStore.sceneId,
    sequence: sceneStore.sceneSequence,
    source: 'frontend.command_bus',
    summary: `cmd ${command.kind} from ${envelope.source}`,
  })
  const reflectedCommand = reflectAppCommandToTerminalLine(command)
  if (reflectedCommand && !source.startsWith('ui.event_terminal')) {
    uiStore.appendSceneEvent({
      kind: 'command_line_reflection',
      level: 'info',
      message: {
        command,
        line: reflectedCommand,
        source,
      },
      revision: sceneStore.sceneRevision,
      sceneId: sceneStore.sceneId,
      sequence: sceneStore.sceneSequence,
      source: 'frontend.command_line',
      summary: `ui> ${reflectedCommand}`,
    })
  }
  poseStoreEngineRuntime.dispatchEnvelope(envelope)
  return envelope
}

export const dispatchPoseStoreCommand = dispatchAppCommandRuntime
