import { create } from 'zustand'
import { clonePlacements, DEFAULT_PLANOGRAM } from '../../core/planogram-domain'
import type { CameraDetectionOverlay, MonitoringCameraDefinition, Placement, RoomDefinition } from '../../core/planogram-domain'
import type { SceneCommand } from '../../core/scene-domain/sceneCommands'
import {
  dispatchSceneEngineCommand,
  type SceneEngineCommand,
  type SceneEngineCommandMeta,
  type SceneEngineDomainEvent,
  type SceneEngineEffect,
  type SceneEngineResult,
  type SceneEngineState,
} from '../../core/scene-domain/sceneEngine'
import { runtimeConfig } from '../../core/config/runtimeConfig'
import { undoManager } from '../../core/app-commanding/undoManager'

export type SceneSource = 'default' | 'scene' | 'local_edit'

export type SceneState = {
  // Scene data
  sceneId: string
  scenePlacements: Placement[]
  sceneRoom: RoomDefinition
  cameraDetectionOverlays: CameraDetectionOverlay[]
  monitoringCameras: MonitoringCameraDefinition[]

  // Scene state
  sceneSource: SceneSource
  sceneRevision: number | null
  sceneSequence: number | null
  sceneError: string | null
  sceneEditEnabled: boolean
  sceneLastEventAt: string | null
  sceneLastAppliedRemoteRevision: number | null
  sceneLastAppliedRemoteSequence: number | null
  sceneRemoteOverrideAt: string | null
  sceneRemoteOverrideKind: 'scene_patch' | 'scene_snapshot' | null

  // Selection
  selectedPlacementId: string | null

  // Undo/Redo (computed from undoManager)
  sceneUndoDepth: number
  sceneRedoDepth: number

  // Specialist metadata
  sceneSpecialistGeneratedAt: string | null
  sceneSpecialistSource: string | null
  sceneSpatialAgeS: number | null
  sceneSpatialFresh: boolean | null
  sceneSpatialStaleAfterS: number | null
  sceneSpatialStalePolicy: string | null

  // Actions
  dispatchCommand: (
    command: SceneEngineCommand,
    onEffect?: (effect: SceneEngineEffect) => void,
    onEvents?: (events: SceneEngineDomainEvent[]) => void,
  ) => SceneEngineResult<SceneEngineState> | undefined
  runSceneCommand: (command: SceneCommand, commandMeta?: SceneEngineCommandMeta) => void
  clearScene: (commandMeta?: SceneEngineCommandMeta) => void
  restoreState: (partialState: {
    scenePlacements?: Placement[]
    selectedPlacementId?: string | null
  }) => void
  getUndoRedoDepth: () => { undoDepth: number; redoDepth: number }
  nudgeSelectedPlacement: (deltaXM: number, deltaZM: number) => void
  rotateSelectedPlacement: (deltaDeg: number) => void
  snapSelectedPlacementToGrid: (stepM: number) => void
  setSelectedPlacementId: (placementId: string | null) => void
  setSceneId: (sceneId: string) => void
  setSceneEditEnabled: (enabled: boolean) => void
  toggleSceneEdit: () => void
  applyRemoteSceneUpdate: (update: {
    placements?: Placement[]
    room?: RoomDefinition
    cameraDetectionOverlays?: CameraDetectionOverlay[]
    monitoringCameras?: MonitoringCameraDefinition[]
    revision?: number | null
    sequence?: number | null
    source?: SceneSource
    specialistMeta?: {
      generatedAt?: string
      source?: string
      spatialAgeS?: number
      spatialFresh?: boolean
      spatialStaleAfterS?: number
      stalePolicy?: string
    }
  }) => void
}

function cloneRoom(room: RoomDefinition): RoomDefinition {
  return {
    depthM: room.depthM,
    heightM: room.heightM,
    wallThicknessM: room.wallThicknessM,
    widthM: room.widthM,
  }
}

function normalizeSceneId(value: string): string {
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : 'scene-1'
}

export const useSceneStore = create<SceneState>((set, get) => ({
  // Initial state
  sceneId: 'scene-1',
  scenePlacements: clonePlacements(DEFAULT_PLANOGRAM.placements),
  sceneRoom: cloneRoom(DEFAULT_PLANOGRAM.room),
  cameraDetectionOverlays: [],
  monitoringCameras: [],
  sceneSource: 'default',
  sceneRevision: null,
  sceneSequence: null,
  sceneError: null,
  sceneEditEnabled: runtimeConfig.defaultSceneEditEnabled,
  sceneLastEventAt: null,
  sceneLastAppliedRemoteRevision: null,
  sceneLastAppliedRemoteSequence: null,
  sceneRemoteOverrideAt: null,
  sceneRemoteOverrideKind: null,
  selectedPlacementId: null,
  sceneUndoDepth: 0,
  sceneRedoDepth: 0,
  sceneSpecialistGeneratedAt: null,
  sceneSpecialistSource: null,
  sceneSpatialAgeS: null,
  sceneSpatialFresh: null,
  sceneSpatialStaleAfterS: null,
  sceneSpatialStalePolicy: null,

  // Actions
  getUndoRedoDepth: () => {
    const state = undoManager.state
    return { undoDepth: state.undoCount, redoDepth: state.redoCount }
  },

  dispatchCommand: (command, onEffect, onEvents) => {
    let effect: SceneEngineEffect | null = null
    let events: SceneEngineDomainEvent[] = []
    let engineResult: SceneEngineResult<SceneEngineState> | undefined

    set((state) => {
      const result = dispatchSceneEngineCommand(
        state,
        command,
        {
          constraints: runtimeConfig.sceneConstraintZones,
        },
      )

      engineResult = result
      effect = result.effect
      events = result.events

      return result.changed ? result.nextState : state
    })

    if (effect && onEffect) onEffect(effect)
    if (events.length > 0 && onEvents) onEvents(events)

    return engineResult
  },

  runSceneCommand: (command, commandMeta) => {
    const { dispatchCommand } = get()
    dispatchCommand({ kind: 'run_scene_command', meta: commandMeta, payload: command })
  },

  clearScene: (commandMeta) => {
    const { dispatchCommand } = get()
    dispatchCommand({ kind: 'clear_scene', meta: commandMeta })
  },

  restoreState: (partialState) => {
    set((state) => ({
      ...state,
      ...partialState,
      sceneRevision: (state.sceneRevision ?? 0) + 1,
      sceneLastEventAt: new Date().toISOString(),
      sceneSource: 'local_edit',
    }))
  },

  nudgeSelectedPlacement: (deltaXM, deltaZM) => {
    const { runSceneCommand } = get()
    runSceneCommand({ kind: 'move_selected_by', deltaM: [deltaXM, deltaZM] })
  },

  rotateSelectedPlacement: (deltaDeg) => {
    const { runSceneCommand } = get()
    runSceneCommand({ kind: 'rotate_selected_by', deltaDeg })
  },

  snapSelectedPlacementToGrid: (stepM) => {
    const { runSceneCommand } = get()
    runSceneCommand({ kind: 'snap_selected_to_grid', stepM })
  },

  setSelectedPlacementId: (placementId) => set({ selectedPlacementId: placementId }),

  setSceneId: (sceneId) => set({ sceneId: normalizeSceneId(sceneId) }),

  setSceneEditEnabled: (enabled) => set({ sceneEditEnabled: enabled }),

  toggleSceneEdit: () => set((state) => ({ sceneEditEnabled: !state.sceneEditEnabled })),

  applyRemoteSceneUpdate: (update) =>
    set((state) => ({
      scenePlacements: update.placements ?? state.scenePlacements,
      sceneRoom: update.room ?? state.sceneRoom,
      cameraDetectionOverlays: update.cameraDetectionOverlays ?? state.cameraDetectionOverlays,
      monitoringCameras: update.monitoringCameras ?? state.monitoringCameras,
      sceneRevision: update.revision !== undefined ? update.revision : state.sceneRevision,
      sceneSequence: update.sequence !== undefined ? update.sequence : state.sceneSequence,
      sceneSource: update.source ?? state.sceneSource,
      sceneLastAppliedRemoteRevision: update.revision !== undefined ? update.revision : state.sceneLastAppliedRemoteRevision,
      sceneLastAppliedRemoteSequence: update.sequence !== undefined ? update.sequence : state.sceneLastAppliedRemoteSequence,
      sceneSpecialistGeneratedAt: update.specialistMeta?.generatedAt ?? state.sceneSpecialistGeneratedAt,
      sceneSpecialistSource: update.specialistMeta?.source ?? state.sceneSpecialistSource,
      sceneSpatialAgeS: update.specialistMeta?.spatialAgeS ?? state.sceneSpatialAgeS,
      sceneSpatialFresh: update.specialistMeta?.spatialFresh ?? state.sceneSpatialFresh,
      sceneSpatialStaleAfterS: update.specialistMeta?.spatialStaleAfterS ?? state.sceneSpatialStaleAfterS,
      sceneSpatialStalePolicy: update.specialistMeta?.stalePolicy ?? state.sceneSpatialStalePolicy,
      sceneError: null,
      selectedPlacementId: state.selectedPlacementId && update.placements?.some((p) => p.id === state.selectedPlacementId) ? state.selectedPlacementId : null,
    })),
}))
