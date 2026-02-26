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

export type SceneHistoryEntry = {
  placements: Placement[]
  selectedPlacementId: string | null
}

export type SceneEngineState = {
  sceneEditEnabled: boolean
  sceneError: string | null
  sceneId: string
  sceneLastEventAt: string | null
  scenePlacements: Placement[]
  sceneRedoDepth: number
  sceneRedoStack: SceneHistoryEntry[]
  sceneRemoteOverrideAt: string | null
  sceneRemoteOverrideKind: SceneEngineRemoteOverrideKind | null
  sceneRevision: number | null
  sceneRoom: RoomDefinition
  sceneSource: SceneEngineSource
  sceneUndoDepth: number
  sceneUndoStack: SceneHistoryEntry[]
  selectedPlacementId: string | null
}

export type SceneEngineCommand =
  | {
      kind: 'clear_scene'
      meta?: SceneEngineCommandMeta
    }
  | {
      kind: 'redo'
      meta?: SceneEngineCommandMeta
    }
  | {
      kind: 'run_scene_command'
      meta?: SceneEngineCommandMeta
      payload: SceneCommand
    }
  | {
      kind: 'undo'
      meta?: SceneEngineCommandMeta
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
  undoLimit: number
}

export type SceneEngineResult<S extends SceneEngineState> = {
  changed: boolean
  effect: SceneEngineEffect | null
  events: SceneEngineDomainEvent[]
  nextState: S
}

function cloneHistoryEntry(entry: SceneHistoryEntry): SceneHistoryEntry {
  return {
    placements: clonePlacements(entry.placements),
    selectedPlacementId: entry.selectedPlacementId,
  }
}

function pushUndoEntry(stack: SceneHistoryEntry[], entry: SceneHistoryEntry, undoLimit: number): SceneHistoryEntry[] {
  const next = [...stack, cloneHistoryEntry(entry)]
  const limit = Math.max(1, undoLimit)
  if (next.length <= limit) return next
  return next.slice(next.length - limit)
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

    const nextUndoStack = pushUndoEntry(
      state.sceneUndoStack,
      {
        placements: state.scenePlacements,
        selectedPlacementId: state.selectedPlacementId,
      },
      dependencies.undoLimit,
    )

    const nextState = withPatch(state, {
      sceneError: null,
      sceneLastEventAt: nowIso(),
      scenePlacements: result.placements,
      sceneRedoDepth: 0,
      sceneRedoStack: [],
      sceneRemoteOverrideAt: null,
      sceneRemoteOverrideKind: null,
      sceneRevision: (state.sceneRevision ?? 0) + 1,
      sceneSource: 'local_edit',
      sceneUndoDepth: nextUndoStack.length,
      sceneUndoStack: nextUndoStack,
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

    const nextUndoStack = pushUndoEntry(
      state.sceneUndoStack,
      {
        placements: state.scenePlacements,
        selectedPlacementId: state.selectedPlacementId,
      },
      dependencies.undoLimit,
    )

    const nextState = withPatch(state, {
      sceneError: null,
      sceneLastEventAt: nowIso(),
      scenePlacements: [],
      sceneRedoDepth: 0,
      sceneRedoStack: [],
      sceneRemoteOverrideAt: null,
      sceneRemoteOverrideKind: null,
      sceneRevision: (state.sceneRevision ?? 0) + 1,
      sceneSource: 'local_edit',
      sceneUndoDepth: nextUndoStack.length,
      sceneUndoStack: nextUndoStack,
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
    }
  }

  if (command.kind === 'undo') {
    if (!state.sceneEditEnabled) return rejectEditDisabled(state, command.kind)
    if (state.sceneUndoStack.length === 0) {
      return {
        changed: false,
        effect: null,
        events: [{ command: command.kind, kind: 'scene_engine_noop' }],
        nextState: state,
      }
    }

    const previous = state.sceneUndoStack[state.sceneUndoStack.length - 1]
    const nextUndoStack = state.sceneUndoStack.slice(0, -1)
    const nextRedoStack = pushUndoEntry(
      state.sceneRedoStack,
      {
        placements: state.scenePlacements,
        selectedPlacementId: state.selectedPlacementId,
      },
      dependencies.undoLimit,
    )

    const nextState = withPatch(state, {
      sceneError: null,
      sceneLastEventAt: nowIso(),
      scenePlacements: clonePlacements(previous.placements),
      sceneRedoDepth: nextRedoStack.length,
      sceneRedoStack: nextRedoStack,
      sceneRemoteOverrideAt: null,
      sceneRemoteOverrideKind: null,
      sceneRevision: (state.sceneRevision ?? 0) + 1,
      sceneSource: 'local_edit',
      sceneUndoDepth: nextUndoStack.length,
      sceneUndoStack: nextUndoStack,
      selectedPlacementId: previous.selectedPlacementId,
    })

    return {
      changed: true,
      effect: {
        commandMeta: command.meta ?? null,
        kind: 'publish_scene_patch',
        nextPlacements: previous.placements,
        previousPlacements: state.scenePlacements,
        sceneId: state.sceneId,
      },
      events: [{ command: command.kind, kind: 'scene_engine_changed' }],
      nextState,
    }
  }

  if (!state.sceneEditEnabled) return rejectEditDisabled(state, command.kind)
  if (state.sceneRedoStack.length === 0) {
    return {
      changed: false,
      effect: null,
      events: [{ command: command.kind, kind: 'scene_engine_noop' }],
      nextState: state,
    }
  }

  const nextEntry = state.sceneRedoStack[state.sceneRedoStack.length - 1]
  const nextRedoStack = state.sceneRedoStack.slice(0, -1)
  const nextUndoStack = pushUndoEntry(
    state.sceneUndoStack,
    {
      placements: state.scenePlacements,
      selectedPlacementId: state.selectedPlacementId,
    },
    dependencies.undoLimit,
  )

  const nextState = withPatch(state, {
    sceneError: null,
    sceneLastEventAt: nowIso(),
    scenePlacements: clonePlacements(nextEntry.placements),
    sceneRedoDepth: nextRedoStack.length,
    sceneRedoStack: nextRedoStack,
    sceneRemoteOverrideAt: null,
    sceneRemoteOverrideKind: null,
    sceneRevision: (state.sceneRevision ?? 0) + 1,
    sceneSource: 'local_edit',
    sceneUndoDepth: nextUndoStack.length,
    sceneUndoStack: nextUndoStack,
    selectedPlacementId: nextEntry.selectedPlacementId,
  })

  return {
    changed: true,
    effect: {
      commandMeta: command.meta ?? null,
      kind: 'publish_scene_patch',
      nextPlacements: nextEntry.placements,
      previousPlacements: state.scenePlacements,
      sceneId: state.sceneId,
    },
    events: [{ command: command.kind, kind: 'scene_engine_changed' }],
    nextState,
  }
}
