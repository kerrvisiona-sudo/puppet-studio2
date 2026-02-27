import { clonePlacements } from '../../core/planogram-domain'
import type { Placement, RoomDefinition } from '../../core/planogram-domain'
import type { SceneCommand, SceneConstraintZone } from './sceneCommands'
import { applySceneCommand } from './sceneCommands'

export type SceneEngineRemoteOverrideKind = 'scene_patch' | 'scene_snapshot'
export type SceneEngineSource = 'default' | 'local_edit' | 'scene'
export type SceneEngineCommandMeta = {
  at: string
  commandId: string
  correlationId: string | null
  source: string
}

export type SceneEngineState = {
  sceneEditEnabled: boolean
  sceneError: string | null
  sceneId: string
  sceneLastEventAt: string | null
  scenePlacements: Placement[]
  sceneRemoteOverrideAt: string | null
  sceneRemoteOverrideKind: SceneEngineRemoteOverrideKind | null
  sceneRevision: number | null
  sceneRoom: RoomDefinition
  sceneSource: SceneEngineSource
  selectedPlacementId: string | null
}

export type SceneEngineCommand =
  | {
      kind: 'clear_scene'
      meta?: SceneEngineCommandMeta
    }
  | {
      kind: 'run_scene_command'
      meta?: SceneEngineCommandMeta
      payload: SceneCommand
    }

export type SceneEngineDomainEvent =
  | {
      command: SceneEngineCommand['kind']
      kind: 'scene_engine_changed'
    }
  | {
      command: SceneEngineCommand['kind']
      kind: 'scene_engine_noop'
    }
  | {
      command: SceneEngineCommand['kind']
      kind: 'scene_engine_rejected'
      reason: 'constraint_blocked' | 'edit_disabled'
    }

export type SceneEngineEffect = {
  commandMeta: SceneEngineCommandMeta | null
  kind: 'publish_scene_patch'
  nextPlacements: Placement[]
  previousPlacements: Placement[]
  sceneId: string
}

export type SceneEngineDependencies = {
  constraints?: SceneConstraintZone[]
  nowIso?: () => string
}

export type SceneEngineResult<S extends SceneEngineState> = {
  changed: boolean
  effect: SceneEngineEffect | null
  events: SceneEngineDomainEvent[]
  nextState: S
  undoResult?: {
    previousState: {
      scenePlacements: Placement[]
      selectedPlacementId: string | null
    }
    nextState: {
      scenePlacements: Placement[]
      selectedPlacementId: string | null
    }
  }
}

function withPatch<S extends SceneEngineState>(state: S, patch: Partial<SceneEngineState>): S {
  return { ...state, ...patch } as S
}

function rejectEditDisabled<S extends SceneEngineState>(state: S, command: SceneEngineCommand['kind']): SceneEngineResult<S> {
  if (state.sceneError === 'edicion local deshabilitada') {
    return {
      changed: false,
      effect: null,
      events: [{ command, kind: 'scene_engine_rejected', reason: 'edit_disabled' }],
      nextState: state,
    }
  }
  return {
    changed: true,
    effect: null,
    events: [{ command, kind: 'scene_engine_rejected', reason: 'edit_disabled' }],
    nextState: withPatch(state, { sceneError: 'edicion local deshabilitada' }),
  }
}

export function dispatchSceneEngineCommand<S extends SceneEngineState>(
  state: S,
  command: SceneEngineCommand,
  dependencies: SceneEngineDependencies,
): SceneEngineResult<S> {
  const nowIso = dependencies.nowIso ?? (() => new Date().toISOString())

  if (command.kind === 'run_scene_command') {
    if (!state.sceneEditEnabled) return rejectEditDisabled(state, command.kind)

    const result = applySceneCommand(
      {
        constraints: dependencies.constraints,
        placements: state.scenePlacements,
        room: state.sceneRoom,
        selectedPlacementId: state.selectedPlacementId,
      },
      command.payload,
    )

    if (result.blockedByConstraint) {
      const nextState = withPatch(state, {
        sceneError: `movimiento bloqueado por zona '${result.constraintZoneId ?? 'constraint'}'`,
        selectedPlacementId: result.selectedPlacementId,
      })
      return {
        changed: nextState !== state,
        effect: null,
        events: [{ command: command.kind, kind: 'scene_engine_rejected', reason: 'constraint_blocked' }],
        nextState,
      }
    }

    if (!result.changed && result.selectedPlacementId === state.selectedPlacementId) {
      return {
        changed: false,
        effect: null,
        events: [{ command: command.kind, kind: 'scene_engine_noop' }],
        nextState: state,
      }
    }

    if (!result.changed) {
      const nextState = withPatch(state, {
        selectedPlacementId: result.selectedPlacementId,
      })
      return {
        changed: true,
        effect: null,
        events: [{ command: command.kind, kind: 'scene_engine_changed' }],
        nextState,
      }
    }

    const nextState = withPatch(state, {
      sceneError: null,
      sceneLastEventAt: nowIso(),
      scenePlacements: result.placements,
      sceneRemoteOverrideAt: null,
      sceneRemoteOverrideKind: null,
      sceneRevision: (state.sceneRevision ?? 0) + 1,
      sceneSource: 'local_edit',
      selectedPlacementId: result.selectedPlacementId,
    })

    return {
      changed: true,
      effect: {
        commandMeta: command.meta ?? null,
        kind: 'publish_scene_patch',
        nextPlacements: result.placements,
        previousPlacements: state.scenePlacements,
        sceneId: state.sceneId,
      },
      events: [{ command: command.kind, kind: 'scene_engine_changed' }],
      nextState,
      undoResult: {
        previousState: {
          scenePlacements: state.scenePlacements,
          selectedPlacementId: state.selectedPlacementId,
        },
        nextState: {
          scenePlacements: result.placements,
          selectedPlacementId: result.selectedPlacementId,
        },
      },
    }
  }

  if (command.kind === 'clear_scene') {
    if (!state.sceneEditEnabled) return rejectEditDisabled(state, command.kind)
    if (state.scenePlacements.length === 0) {
      return {
        changed: false,
        effect: null,
        events: [{ command: command.kind, kind: 'scene_engine_noop' }],
        nextState: state,
      }
    }

    const nextState = withPatch(state, {
      sceneError: null,
      sceneLastEventAt: nowIso(),
      scenePlacements: [],
      sceneRemoteOverrideAt: null,
      sceneRemoteOverrideKind: null,
      sceneRevision: (state.sceneRevision ?? 0) + 1,
      sceneSource: 'local_edit',
      selectedPlacementId: null,
    })

    return {
      changed: true,
      effect: {
        commandMeta: command.meta ?? null,
        kind: 'publish_scene_patch',
        nextPlacements: [],
        previousPlacements: state.scenePlacements,
        sceneId: state.sceneId,
      },
      events: [{ command: command.kind, kind: 'scene_engine_changed' }],
      nextState,
      undoResult: {
        previousState: {
          scenePlacements: state.scenePlacements,
          selectedPlacementId: state.selectedPlacementId,
        },
        nextState: {
          scenePlacements: [],
          selectedPlacementId: null,
        },
      },
    }
  }

  return {
    changed: false,
    effect: null,
    events: [{ command: 'run_scene_command', kind: 'scene_engine_noop' }],
    nextState: state,
  }
}
